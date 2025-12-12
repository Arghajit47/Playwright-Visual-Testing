/**
 * Database service for handling SQLite operations
 */
import Database from "better-sqlite3";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

const DEVICE_TYPE = process.env.DEVICE_TYPE;

// Database configuration
const DB_VERBOSE = process.env.DB_VERBOSE === "true";
const DB_FILE = process.env.CI
  ? `visual_${DEVICE_TYPE}.db`
  : process.env.DB_FILE || "visual.db";

console.log("CI:", process.env.CI);
console.log("DEVICE_TYPE raw:", DEVICE_TYPE);
console.log("DB_FILE result:", DB_FILE);  

// Storage URL for images
const STORAGE_URL = process.env.STORAGE_URL || 
  "https://ocpaxmghzmfbuhxzxzae.supabase.co/storage/v1/object/public/visual_test";

/**
 * Initialize database connection with proper error handling
 * @returns {Object} Database connection
 */
export function initDatabaseConnection() {
  try {
    // Create DB directory if it doesn't exist
    const dbDir = path.dirname(DB_FILE);
    if (dbDir !== "." && !fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Check if better-sqlite3 is properly installed
    try {
      const db = new Database(DB_FILE, {
        verbose: DB_VERBOSE ? console.log : null,
      });

      console.log(`✅ Connected to database: ${DB_FILE}`);

      // Set pragmas for better performance
      db.pragma("journal_mode = WAL");
      db.pragma("synchronous = NORMAL");

      return db;
    } catch (bindingError) {
      if (
        bindingError.message.includes("bindings") ||
        bindingError.message.includes("node-v")
      ) {
        console.error("❌ Better-sqlite3 bindings error detected.");
        console.error("💡 Try running: npm rebuild better-sqlite3");
        console.error(
          "💡 Or reinstall: npm uninstall better-sqlite3 && npm install better-sqlite3"
        );
      }
      throw bindingError;
    }
  } catch (error) {
    console.error(`❌ Database connection failed: ${error.message}`);
    // Log the error first, then throw
    throw error;
  }
}

/**
 * Initialize the database schema with required tables
 * @param {Object} db - Database connection
 */
export function initDatabaseSchema(db) {
  try {
    // Create visual_matrix table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS visual_matrix (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        device TEXT NOT NULL,
        status TEXT NOT NULL,
        imageUrl TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create baseline table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS baseline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Database schema initialized');
  } catch (error) {
    console.error(`❌ Schema initialization failed: ${error.message}`);
    throw new Error(`Schema initialization failed: ${error.message}`);
  }
}

/**
 * Insert a record into the visual_matrix table
 * @param {Object} db - Database connection
 * @param {Object} testInfo - Test information
 * @param {string} device - Device type
 * @param {string} status - Test status
 * @param {string} diffPath - Path to diff image
 * @returns {Object} Database operation result
 */
export function insertVisualRecord(db, testInfo, device, status, diffPath) {
  // Validate inputs
  if (!db || !testInfo || !device || !status) {
    console.error("Missing required parameters for database insert");
    throw new Error("Missing required parameters");
  }
  
  const image = diffPath ? diffPath.replace("screenshots", "") : "";
  let data;
  
  switch (status) {
    case "passed":
      data = {
        name: testInfo.title,
        device: device,
        status: "passed",
        imageUrl: "",
      };
      break;
    case "failed":
      data = {
        name: testInfo.title,
        device: device,
        status: "failed",
        imageUrl: `${STORAGE_URL}${image}`,
      };
      break;
    default:
      throw new Error(`Invalid test status: ${status}`);
  }
  
  try {
    const sql = `
      INSERT INTO visual_matrix (
        name, 
        device, 
        status, 
        imageUrl
      ) VALUES (
        @name, 
        @device, 
        @status, 
        @imageUrl
      )
    `;

    const stmt = db.prepare(sql);
    const info = stmt.run(data);

    console.log(`✅ Record inserted with ID: ${info.lastInsertRowid}`);
    return info;
  } catch (error) {
    console.error(`❌ Error inserting record: ${error.message}`);
    console.error("Failed data:", JSON.stringify(data));
    throw error;
  }
}

/**
 * Insert a baseline record
 * @param {Object} db - Database connection
 * @param {string} baselinePath - Path to baseline image
 * @returns {Object} Database operation result
 */
export function insertBaselineRecord(db, baselinePath) {
  try {
    const sql = `
      INSERT INTO baseline (name)
      VALUES (@name)
    `;

    const stmt = db.prepare(sql);
    const info = stmt.run({ name: baselinePath });

    console.log(`✅ Baseline record inserted with ID: ${info.lastInsertRowid}`);
    return info;
  } catch (error) {
    console.error(`❌ Error inserting baseline: ${error.message}`);
    throw error;
  }
}

/**
 * Get all baseline records
 * @param {Object} db - Database connection
 * @returns {Array} Baseline records
 */
export function getBaselineRecords(db) {
  try {
    const sql = `SELECT * FROM baseline ORDER BY created_at DESC`;
    const stmt = db.prepare(sql);
    return stmt.all();
  } catch (error) {
    console.error(`❌ Error fetching baseline records: ${error.message}`);
    throw error;
  }
}

/**
 * Close database connection safely
 * @param {Object} db - Database connection to close
 */
export function closeDatabase(db) {
  if (db) {
    try {
      db.close();
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error(`❌ Error closing database: ${error.message}`);
    }
  }
}

/**
 * Database connection management singleton
 * Only initialize database in CI environment for performance optimization
 */
class DatabaseManager {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  static getInstance() {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  initializeDatabase() {
    if (!process.env.CI) {
      console.log("⏭️  Skipping database initialization - not in CI environment");
      return null;
    }

    if (this.isInitialized && this.db) {
      return this.db;
    }

    try {
      console.log("🔄 Initializing database for CI environment...");
      this.db = initDatabaseConnection();
      initDatabaseSchema(this.db);

      this.isInitialized = true;
      console.log("✅ Database initialized successfully");

      process.on("exit", () => this.closeConnection());
      process.on("SIGINT", () => this.closeConnection());
      process.on("SIGTERM", () => this.closeConnection());

      return this.db;
    } catch (error) {
      console.error("❌ Failed to initialize database:", error);
      this.db = null;
      return null;
    }
  }

  getConnection() {
    if (!process.env.CI) {
      return null;
    }
    return this.initializeDatabase();
  }

  closeConnection() {
    if (this.db) {
      try {
        this.db.close();
        console.log("🔒 Database connection closed");
      } catch (error) {
        console.error("❌ Error closing database:", error);
      }
      this.db = null;
      this.isInitialized = false;
    }
  }

  isDatabaseEnabled() {
    return !!process.env.CI;
  }
}

export const dbManager = DatabaseManager.getInstance();

let db = null;

export function getDatabase() {
  if (!db) {
    db = initDatabaseConnection();
    initDatabaseSchema(db);
  }
  return db;
}

// Close connection when the process exits
process.on("exit", () => closeDatabase(db));
process.on("SIGINT", () => {
  closeDatabase(db);
  process.exit(0);
});

// Export the lazy initialization function as default
export default { getDatabase };