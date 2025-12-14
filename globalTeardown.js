import { DatabaseManager } from "./utils/db-service.js";

/**
 * Global teardown function that performs cleanup tasks after tests finish running.
 * Closes the database connection and logs the teardown status.
 * 
 * @async
 * @function globalTeardown
 * @returns {Promise<void>} A promise that resolves when teardown is complete.
 */
async function globalTeardown() {
  console.log("🧹 Global Teardown: Cleaning up...");
  
  try {
    const dbManager = DatabaseManager.getInstance();
    dbManager.closeConnection();
    console.log("✅ Global Teardown: Complete");
  } catch (error) {
    console.warn("⚠️ Global Teardown: Error during cleanup:", error.message);
  }
}

export default globalTeardown;
