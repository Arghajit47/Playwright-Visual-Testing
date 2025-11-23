// @ts-check
const { test } = require("@playwright/test");
const fs = require("fs");
const {
  HelperFunction,
  createFolders,
} = require("../../utils/helper-function.page.js");
const allure = require("allure-js-commons");
const { uploadImage } = require("../../utils/supabase-function.js");

test.describe.configure({ mode: "serial" });
const screenshotsDir = "screenshots";
const currentDir = `${screenshotsDir}/current`;
const baselineDir = `${screenshotsDir}/baseline`;
const diffDir = `${screenshotsDir}/diff`;

test.describe("Take screenshots for Visual Regression Testing - Home page", () => {
  let helper = new HelperFunction(); // Define the HelperFunction instance

  test.beforeAll(async () => {
    // Create directories if they don't exist
    await createFolders(baselineDir, diffDir);
  });

  test(
    "Home page - Mobile - Setup Baseline",
    { tag: "@setupProject" },
    async ({ page }) => {
      await allure.severity("minor");
      const currentScreenshot = `${currentDir}/mobile/Home-page-current.png`;
      const baselineScreenshot = `${baselineDir}/mobile/Home-page-baseline.png`;

      await page.goto("https://nextbnb-three.vercel.app/");
      await helper.wait(); // Use the helper's wait method
      await page.screenshot({ path: currentScreenshot, fullPage: true });

      console.log(`Creating baseline for ${test.info().title} test...`);
      fs.copyFileSync(currentScreenshot, baselineScreenshot);
      await uploadImage(
        `baseline/mobile/Home-page-baseline.png`,
        baselineScreenshot
      );
      console.log("Baseline created. Run the test again for comparisons.");
    }
  );

  test.setTimeout(60 * 1000); // Set timeout to 120 seconds

  test(
    "Home page - Mobile - Validate Mismatch",
    { tag: "@validation" },
    async ({ page }, testInfo) => {
      await allure.severity("minor");
      const currentScreenshot = `${currentDir}/mobile/Home-page-current.png`;
      const baselineScreenshot = `${baselineDir}/mobile/Home-page-baseline.png`;
      const diffScreenshot = `${diffDir}/mobile/Home-page-diff.png`;

      // Ensure the baseline exists before proceeding
      if (!fs.existsSync(baselineScreenshot)) {
        helper.generateBaselineImage(baselineScreenshot);
        return;
      }

      await page.goto("https://nextbnb-three.vercel.app/");
      await helper.wait(); // Use the helper's wait method
      await page.screenshot({ path: currentScreenshot, fullPage: true });

      const mismatch = await helper.compareScreenshotsWithText(
        currentScreenshot,
        baselineScreenshot,
        diffScreenshot
      );

      console.log(`Mismatch for ${test.info().title}: ${mismatch}%`);
      await helper.validateMismatch(
        test,
        mismatch,
        diffScreenshot,
        testInfo,
        "Mobile"
      );
    }
  );
});
