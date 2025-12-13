// @ts-check
const { defineConfig, devices } = require("@playwright/test");
import * as path from "path";

// Define where the final report JSON and HTML should go
const PULSE_REPORT_DIR = path.resolve(__dirname, "pulse-report"); // Example: a directory in your project root

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  // This sets the maximum time (in ms) each test can run.
  // Equivalent to calling test.setTimeout(12222) in every file.
  timeout: 150000,
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  // forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 0 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [
        ["list"],
        ["blob"],
        ["allure-playwright", { open: "never" }], // Add the Playwright Pulse Reporter
        [
          "@arghajit/playwright-pulse-report",
          {
            // Optional: Specify the output file name (defaults to 'playwright-pulse-report.json')
            // outputFile: 'my-custom-report-name.json',

            // REQUIRED: Specify the directory for the final JSON report
            // The static HTML report will also be generated here.
            // It's recommended to use an absolute path or one relative to the config file.
            outputDir: PULSE_REPORT_DIR,
          },
        ],
      ]
    : [
        ["html", { open: "never" }],
        ["allure-playwright", { open: "never" }],
        [
          "@arghajit/playwright-pulse-report",
          {
            // Optional: Specify the output file name (defaults to 'playwright-pulse-report.json')
            // outputFile: 'my-custom-report-name.json',

            // REQUIRED: Specify the directory for the final JSON report
            // The static HTML report will also be generated here.
            // It's recommended to use an absolute path or one relative to the config file.
            outputDir: PULSE_REPORT_DIR,
          },
        ],
      ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "Visual-Desktop-Test",
      testDir: "./tests/DesktopView",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          // slowMo: 3000,
          timeout: 150000,
          headless: true,
        },
      },
    },

    /* Test against mobile viewports. */
    {
      name: "Visual-Mobile-Test",
      testDir: "./tests/MobileView",
      use: {
        ...devices["Pixel 5"],
        launchOptions: {
          // slowMo: 3000,
          timeout: 150000,
          headless: true,
        },
      },
    },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
