import {
  initDatabaseConnection,
  initDatabaseSchema,
} from "./utils/db-service.js";

/**
 * Global setup function for initializing the database schema.
 * Determines the runtime environment (CI or Local) and logs appropriate messages.
 * 
 * @async
 * @function globalSetup
 * @throws {Error} Throws an error if database initialization fails.
 * @returns {Promise<void>} Resolves when the database schema is successfully initialized.
 */
async function globalSetup() {
  const environment = process.env.CI ? "CI" : "Local";
  console.log(`🚀 Global Setup [${environment}]: Initializing database schema...`);

  try {
    const db = initDatabaseConnection();
    initDatabaseSchema(db);
    db.close();
    
    console.log(`✅ Global Setup [${environment}]: Database schema created successfully`);
  } catch (error) {
    console.error(`❌ Global Setup [${environment}]: Database initialization failed:`, error);
    throw error;
  }
}

export default globalSetup;
