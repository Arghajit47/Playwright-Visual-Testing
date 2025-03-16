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

test.describe("Take screenshots for Visual Regression Testing - Pools page", () => {
  let helper; // Define the HelperFunction instance

  test.beforeAll(async () => {
    // Create directories if they don't exist
    await createFolders(baselineDir, diffDir);
  });

  test.beforeEach(async ({ page }) => {
    helper = new HelperFunction(page);
  });

  test(
    "Pools page - Mobile - Setup Baseline",
    { tag: "@setupProject" },
    async ({ page }) => {
      await allure.severity("minor");
      const currentScreenshot = `${currentDir}/mobile/Pools-page-current.png`;
      const baselineScreenshot = `${baselineDir}/mobile/Pools-page-baseline.png`;

      await page.goto("https://nextbnb-three.vercel.app/?category=Pools");
      await helper.wait(); // Use the helper's wait method
      await page.screenshot({ path: currentScreenshot, fullPage: true });

      console.log(`Creating baseline for ${test.info().title} test...`);
      fs.copyFileSync(currentScreenshot, baselineScreenshot);
      await uploadImage(`mobile/Pools-page-baseline.png`, baselineScreenshot);
      console.log("Baseline created. Run the test again for comparisons.");
    }
  );

  test(
    "Pools page - Mobile - Validate Mismatch",
    { tag: "@validation" },
    async ({ page }) => {
      await allure.severity("minor");
      const currentScreenshot = `${currentDir}/mobile/Pools-page-current.png`;
      const baselineScreenshot = `${baselineDir}/mobile/Pools-page-baseline.png`;
      const diffScreenshot = `${diffDir}/mobile/Pools-page-diff.png`;

      // Ensure the baseline exists before proceeding
      if (!fs.existsSync(baselineScreenshot)) {
        console.log("Baseline does not exist. Run the setup test first.");
        return;
      }

      await page.goto("https://nextbnb-three.vercel.app/?category=Pools");
      await helper.wait(); // Use the helper's wait method
      await page.screenshot({ path: currentScreenshot, fullPage: true });

      const mismatch = await helper.compareScreenshotsWithText(
        currentScreenshot,
        baselineScreenshot,
        diffScreenshot
      );

      console.log(`Mismatch for ${test.info().title}: ${mismatch}%`);
      await helper.validateMismatch(test, mismatch, diffScreenshot);
    }
  );
});
