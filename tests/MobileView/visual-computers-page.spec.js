// @ts-check
const { test } = require("@playwright/test");
const fs = require("fs");
const {
  HelperFunction,
  createFolders,
} = require("../../utils/helper-function.page.js");
const allure = require("allure-js-commons");
const { uploadImage } = require("../../utils/supabase-function.js");
const { generateScreenshotName } = require("../../utils/utility-page.js");
const {
  BASELINE_DIR,
  DIFF_DIR,
  BASELINE_MOBILE_DIR,
  CURRENT_DIR,
  currentMobileScreenshot,
  baselineMobileScreenshot,
  diffMobileScreenshot,
} = require("../../utils/enum.js");

test.describe.configure({ mode: "serial" });

test.describe("Take screenshots for Visual Regression Testing - Computers page", () => {
  /** @type {HelperFunction} */
  let helper; // Define the HelperFunction instance with proper type annotation

  test.beforeAll(async () => {
    // Create directories if they don't exist
    createFolders(BASELINE_DIR, CURRENT_DIR, DIFF_DIR);
  });

  test.beforeEach(async ({ page }) => {
    helper = new HelperFunction(page); // Define the HelperFunction instance
  });

  test(
    "Computers page - Mobile - Setup Baseline",
    { tag: "@setupProject" },
    async ({ page }) => {
      await allure.severity("minor");

      await page.goto("https://demo.nopcommerce.com/computers");
      await helper.wait(); // Use the helper's wait method
      await page.screenshot({
        path: currentMobileScreenshot(test.info().title),
        fullPage: true,
      });

      console.log(`Creating baseline for ${test.info().title} test...`);
      fs.copyFileSync(
        currentMobileScreenshot(test.info().title),
        baselineMobileScreenshot(test.info().title)
      );
      await uploadImage(
        `${BASELINE_MOBILE_DIR}/${generateScreenshotName(
          test.info().title
        )}-baseline.png`,
        baselineMobileScreenshot(test.info().title)
      );
      console.log("Baseline created. Run the test again for comparisons.");
    }
  );

  test(
    "Computers page - Mobile - Validate Mismatch",
    { tag: "@validation" },
    async ({ page }, testInfo) => {
      await allure.severity("minor");
      // Ensure the baseline exists before proceeding
      if (!fs.existsSync(baselineMobileScreenshot(test.info().title))) {
        await helper.generateBaselineImage(
          baselineMobileScreenshot(test.info().title),
          test
        );
        return;
      }

      await page.goto("https://demo.nopcommerce.com/computers");
      await helper.wait(); // Use the helper's wait method
      await page.screenshot({
        path: currentMobileScreenshot(test.info().title),
        fullPage: true,
      });

      const { mismatch, AI_RESPONSE } = await helper.compareScreenshotsWithText(
        currentMobileScreenshot(test.info().title),
        baselineMobileScreenshot(test.info().title),
        diffMobileScreenshot(test.info().title),
        test
      );
      console.log(AI_RESPONSE);

      await helper.validateMismatch(
        test,
        mismatch,
        diffMobileScreenshot(test.info().title),
        testInfo,
        "Mobile"
      );
    }
  );
});
