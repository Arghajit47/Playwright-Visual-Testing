/**
 * @fileoverview Centralized script runner for Playwright visual regression tasks.
 * @author  Arghajit Singha
 * @requires child_process
 */

const { execSync } = require("child_process");

/**
 * Collection of named shell commands used across the visual-testing workflow.
 * @namespace
 * @property {string} setup                     - Removes existing screenshot directory.
 * @property {string} visual-test               - Executes Playwright tests for desktop visuals.
 * @property {string} folderStructure           - Launches the report server application.
 * @property {string} allure-test-report        - Generates a single-file Allure report.
 * @property {string} test:desktop-setup        - Runs setup tests on the desktop project.
 * @property {string} test:mobile-setup         - Runs setup tests on the mobile project.
 * @property {string} test-validate             - Validates images and runs cross-platform visual tests.
 * @property {string} test                      - Cleans screenshots and triggers validation tests.
 * @property {string} test:desktop-run          - Executes desktop-only validation tests.
 * @property {string} test:mobile-run           - Executes mobile-only validation tests.
 * @property {string} playwright-report-generate- Merges blob reports into an HTML report.
 * @property {string} generate-report           - Generates a Pulse report.
 * @property {string} merge-report              - Merges Pulse reports.
 */
const scripts = {
  setup: "rm -rf screenshots/",
  "visual-test": "npx playwright test --project Visual-Desktop-Test",
  folderStructure: "cd report/ && node app.js ",
  "allure-test-report":
    "npx allure generate --clean --single-file allure-results",
  "test:desktop-setup":
    "npx playwright test --grep @setupProject --project=Visual-Desktop-Test",
  "test:mobile-setup":
    "npx playwright test --grep @setupProject --project=Visual-Mobile-Test",
  "test-validate":
    "node images.mjs && npx playwright test --grep @validation --project=Visual-Desktop-Test --project=Visual-Mobile-Test",
  test: "npm run script setup && npm run script test-validate",
  "test:desktop-run":
    "npx playwright test --grep @validation --project=Visual-Desktop-Test",
  "test:mobile-run":
    "node images.mjs && npx playwright test --grep @validation --project=Visual-Mobile-Test",
  "playwright-report-generate":
    "npx playwright merge-reports --reporter html ./all-blob-reports",
  "generate-report": "npx generate-pulse-report",
  "merge-report": "npx merge-pulse-report",
  "start-dashboard": "npx pulse-dashboard",
};

// Get the script name from command-line arguments
const command = process.argv[2];

/**
 * Executes the requested script if it exists; otherwise exits with an error.
 * @param {string} command - The script key to run.
 */
if (scripts[command]) {
  console.log(`Running script: ${command}`);
  execSync(scripts[command], { stdio: "inherit" });
} else {
  console.log(`Error: Script '${command}' not found.`);
  process.exit(1);
}
