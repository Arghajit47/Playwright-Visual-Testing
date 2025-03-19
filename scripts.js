const { execSync } = require("child_process");

const scripts = {
  setup: "rm -rf screenshots/",

  "visual-test": "npx playwright test --project Visual-Test",
  folderStructure: "cd report/ && node app.js ",
  "allure-test-report":
    "npx allure generate --clean --single-file allure-results",
  "test:desktop-setup":
    "npx playwright test --grep @setupProject --project=Visual-Test",
  "test:mobile-setup":
    "npx playwright test --grep @setupProject --project=Visual-Chrome",
  "test-validate":
    "node images.mjs && npx playwright test --grep @validation --project=Visual-Test --project=Visual-Chrome",
  test: "npm run test-setup && node images.mjs &&  npm run test-validate",
  "test:desktop-run":
    "node images.mjs && npx playwright test --grep @validation --project=Visual-Test",
  "test:mobile-run":
    "node images.mjs && npx playwright test --grep @validation --project=Visual-Chrome",
  "playwright-report-generate":
    "npx playwright merge-reports --reporter html ./all-blob-reports",
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
