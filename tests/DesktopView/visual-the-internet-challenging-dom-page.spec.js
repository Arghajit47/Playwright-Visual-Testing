// @ts-check
const { test } = require("@playwright/test");
const fs = require("fs");
import dotenv from "dotenv";

const {
  HelperFunction,
  createFolders,
} = require("../../utils/helper-function.page.js");
const allure = require("allure-js-commons");
const { uploadImage } = require("../../utils/supabase-function.js");
const {
  generateScreenshotName,
  setupNetworkMonitoring,
} = require("../../utils/utility-page.js");
const {
  BASELINE_DIR,
  DIFF_DIR,
  BASELINE_DESKTOP_DIR,
  CURRENT_DIR,
  currentDesktopScreenshot,
  baselineDesktopScreenshot,
  diffDesktopScreenshot,
} = require("../../utils/enum.js");

// Load environment variables
dotenv.config();
test.describe.configure({ mode: "serial" });

test.describe("Take screenshots for Visual Regression Testing - The Internet - Challenging DOM page", () => {
  /** @type {HelperFunction} */
  let helper; // Define the HelperFunction instance with proper type annotation

  test.beforeAll(async () => {
    // Create directories if they don't exist
    createFolders(BASELINE_DIR, CURRENT_DIR, DIFF_DIR);
  });

  test.beforeEach(async ({ page }) => {
    setupNetworkMonitoring(page); // 1. Start tracking requests
    helper = new HelperFunction(page); // Define the HelperFunction instance
  });

  test(
    "The Internet Challenging DOM page - Desktop - Setup Baseline",
    { tag: "@setupProject" },
    async ({ page }) => {
      await allure.severity("minor");
      await page.goto("https://the-internet.herokuapp.com/challenging_dom");
      await helper.wait(); // Use the helper's wait method
      await page.screenshot({
        path: currentDesktopScreenshot(test.info().title),
        fullPage: true,
      });

      console.log(`Creating baseline for ${test.info().title} test...`);
      fs.copyFileSync(
        currentDesktopScreenshot(test.info().title),
        baselineDesktopScreenshot(test.info().title)
      );
      await uploadImage(
        `${BASELINE_DESKTOP_DIR}/${generateScreenshotName(
          test.info().title
        )}-baseline.png`,
        baselineDesktopScreenshot(test.info().title)
      );

      await helper.generateBaselineImage(
        baselineDesktopScreenshot(test.info().title)
      );

      console.log("Baseline created. Run the test again for comparisons.");
    }
  );

  test(
    "The Internet Challenging DOM page - Desktop - Validate Mismatch",
    { tag: "@validation" },
    async ({ page }, testInfo) => {
      await allure.severity("minor");
      // Ensure the baseline exists before proceeding
      if (!fs.existsSync(baselineDesktopScreenshot(testInfo.title))) {
        await helper.generateBaselineImage(
          baselineDesktopScreenshot(testInfo.title)
        );
        return;
      }

      await page.goto("https://the-internet.herokuapp.com/challenging_dom");
      await helper.wait(); // Use the helper's wait method
      await page.screenshot({
        path: currentDesktopScreenshot(test.info().title),
        fullPage: true,
      });

      const { mismatch, AI_RESPONSE } =
        await helper.compareScreenshotsWithTextViaAPI(
          currentDesktopScreenshot(test.info().title),
          baselineDesktopScreenshot(test.info().title),
          diffDesktopScreenshot(test.info().title),
          test
        );

      await helper.validateMismatch(
        test,
        mismatch,
        diffDesktopScreenshot(test.info().title),
        testInfo,
        "Desktop"
      );
    }
  );
});
