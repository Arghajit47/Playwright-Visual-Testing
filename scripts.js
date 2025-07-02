const { execSync } = require("child_process");

const scripts = {
  setup: "rm -rf screenshots/",
  "visual-test": "npx playwright test --project Visual-Desktop-Test",
  folderStructure: "cd report/ && node app.js ",
  "allure-test-report":
    "npx allure generate --clean --single-file allure-results",
  "test:desktop-setup":
    "npx playwright test --grep @setupProject --project=Visual-Desktop-Test",
  "test:mobile-setup": "npx playwright test --project=Visual-Mobile-Test",
  "test-validate":
    "node images.mjs && npx playwright test --grep @validation --project=Visual-Desktop-Test --project=Visual-Mobile-Test",
  test: "npm run script setup && npm run script test-validate",
  "test:desktop-run":
    "node images.mjs && npx playwright test --grep @validation --project=Visual-Desktop-Test",
  "test:mobile-run":
    "node images.mjs && npx playwright test --grep @validation --project=Visual-Mobile-Test",
  "playwright-report-generate":
    "npx playwright merge-reports --reporter html ./all-blob-reports",
  "generate-report": "npx generate-pulse-report",
  "merge-report": "npx merge-pulse-report",
};

// Get the script name from command-line arguments
const command = process.argv[2];

if (scripts[command]) {
  console.log(`Running script: ${command}`);
  execSync(scripts[command], { stdio: "inherit" });
} else {
  console.log(`Error: Script '${command}' not found.`);
  process.exit(1);
}
