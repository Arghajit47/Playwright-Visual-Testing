// @ts-check
const { test } = require("@playwright/test");
const fs = require("fs");
const { HelperFunction } = require("../utils/helper-function.page");
const allure = require("allure-js-commons");

test.describe.configure({ mode: "serial" });

test.describe("Take screenshots for Visual Regression Testing", () => {
  const screenshotsDir = "screenshots";
  const currentDir = `${screenshotsDir}/current`;
  const baselineDir = `${screenshotsDir}/baseline`;
  const diffDir = `${screenshotsDir}/diff`;
  let helper; // Define the HelperFunction instance

  test.beforeEach(async ({ page }) => {
    helper = new HelperFunction(page);

    // Create directories if they don't exist
    if (!fs.existsSync(baselineDir))
      fs.mkdirSync(baselineDir, { recursive: true });
    if (!fs.existsSync(diffDir)) fs.mkdirSync(diffDir, { recursive: true });
  });

  test("Home page", { tag: "@setup" }, async ({ page }) => {
    await allure.severity("minor");
    const currentScreenshot = `${currentDir}/Home-page-current.png`;
    const baselineScreenshot = `${baselineDir}/Home-page-baseline.png`;
    const diffScreenshot = `${diffDir}/Home-page-diff.png`;

    await page.goto("https://nextbnb-three.vercel.app/");
    await helper.wait(); // Use the helper's wait method
    await page.screenshot({ path: currentScreenshot, fullPage: true });

    if (!fs.existsSync(baselineScreenshot)) {
      console.log(`Creating baseline for ${test.info().title} test...`);
      fs.copyFileSync(currentScreenshot, baselineScreenshot);
      console.log("Baseline created. Run the test again for comparisons.");
      return;
    }
  });

  test("Catagory Beach page", { tag: "@setup" }, async ({ page }) => {
    await allure.severity("minor");
    const currentScreenshot = `${currentDir}/catagory-beach-page-current.png`;
    const baselineScreenshot = `${baselineDir}/catagory-beach-page-baseline.png`;
    const diffScreenshot = `${diffDir}/catagory-beach-page-diff.png`;

    await page.goto("https://nextbnb-three.vercel.app/?category=Beach");
    await helper.wait(); // Use the helper's wait method
    await page.screenshot({ path: currentScreenshot, fullPage: true });

    if (!fs.existsSync(baselineScreenshot)) {
      console.log(`Creating baseline for ${test.info().title} test...`);
      fs.copyFileSync(currentScreenshot, baselineScreenshot);
      console.log("Baseline created. Run the test again for comparisons.");
      return;
    }

    const mismatch = await helper.compareScreenshots(
      currentScreenshot,
      baselineScreenshot,
      diffScreenshot
    );

    console.log(`Mismatch for ${test.info().title}: ${mismatch}%`);
    await helper.validateMismatch(test, mismatch, diffScreenshot);
  });

  test("Catagory Windmills page", { tag: "@setup" }, async ({ page }) => {
    await allure.severity("minor");
    const currentScreenshot = `${currentDir}/catagory-windmills-page-current.png`;
    const baselineScreenshot = `${baselineDir}/catagory-windmills-page-baseline.png`;
    const diffScreenshot = `${diffDir}/catagory-windmills-page-diff.png`;

    await page.goto("https://nextbnb-three.vercel.app/?category=Windmills");
    await helper.wait(); // Use the helper's wait method
    await page.screenshot({ path: currentScreenshot, fullPage: true });

    if (!fs.existsSync(baselineScreenshot)) {
      console.log(`Creating baseline for ${test.info().title} test...`);
      fs.copyFileSync(currentScreenshot, baselineScreenshot);
      console.log("Baseline created. Run the test again for comparisons.");
      return;
    }

    const mismatch = await helper.compareScreenshots(
      currentScreenshot,
      baselineScreenshot,
      diffScreenshot
    );

    console.log(`Mismatch for ${test.info().title}: ${mismatch}%`);
    await helper.validateMismatch(test, mismatch, diffScreenshot);
  });

  test("Catagory Modern page", { tag: "@setup" }, async ({ page }) => {
    await allure.severity("minor");
    const currentScreenshot = `${currentDir}/catagory-modern-page-current.png`;
    const baselineScreenshot = `${baselineDir}/catagory-modern-page-baseline.png`;
    const diffScreenshot = `${diffDir}/catagory-modern-page-diff.png`;

    await page.goto("https://nextbnb-three.vercel.app/?category=Modern");
    await helper.wait(); // Use the helper's wait method
    await page.screenshot({ path: currentScreenshot, fullPage: true });

    if (!fs.existsSync(baselineScreenshot)) {
      console.log(`Creating baseline for ${test.info().title} test...`);
      fs.copyFileSync(currentScreenshot, baselineScreenshot);
      console.log("Baseline created. Run the test again for comparisons.");
      return;
    }

    const mismatch = await helper.compareScreenshots(
      currentScreenshot,
      baselineScreenshot,
      diffScreenshot
    );

    console.log(`Mismatch for ${test.info().title}: ${mismatch}%`);
    await helper.validateMismatch(test, mismatch, diffScreenshot);
  });

  test("Catagory Countryside page", { tag: "@setup" }, async ({ page }) => {
    await allure.severity("minor");
    const currentScreenshot = `${currentDir}/catagory-countryside-page-current.png`;
    const baselineScreenshot = `${baselineDir}/catagory-countryside-page-baseline.png`;
    const diffScreenshot = `${diffDir}/catagory-countryside-page-diff.png`;

    await page.goto("https://nextbnb-three.vercel.app/?category=Countryside");
    await helper.wait(); // Use the helper's wait method
    await page.screenshot({ path: currentScreenshot, fullPage: true });

    if (!fs.existsSync(baselineScreenshot)) {
      console.log(`Creating baseline for ${test.info().title} test...`);
      fs.copyFileSync(currentScreenshot, baselineScreenshot);
      console.log("Baseline created. Run the test again for comparisons.");
      return;
    }

    const mismatch = await helper.compareScreenshots(
      currentScreenshot,
      baselineScreenshot,
      diffScreenshot
    );

    console.log(`Mismatch for ${test.info().title}: ${mismatch}%`);
    await helper.validateMismatch(test, mismatch, diffScreenshot);
  });

  test("Catagory Pools page", { tag: "@setup" }, async ({ page }) => {
    await allure.severity("minor");
    const currentScreenshot = `${currentDir}/catagory-pools-page-current.png`;
    const baselineScreenshot = `${baselineDir}/catagory-pools-page-baseline.png`;
    const diffScreenshot = `${diffDir}/catagory-pools-page-diff.png`;

    await page.goto("https://nextbnb-three.vercel.app/?category=Pools");
    await helper.wait(); // Use the helper's wait method
    await page.screenshot({ path: currentScreenshot, fullPage: true });

    if (!fs.existsSync(baselineScreenshot)) {
      console.log(`Creating baseline for ${test.info().title} test...`);
      fs.copyFileSync(currentScreenshot, baselineScreenshot);
      console.log("Baseline created. Run the test again for comparisons.");
      return;
    }

    const mismatch = await helper.compareScreenshots(
      currentScreenshot,
      baselineScreenshot,
      diffScreenshot
    );

    console.log(`Mismatch for ${test.info().title}: ${mismatch}%`);
    await helper.validateMismatch(test, mismatch, diffScreenshot);
  });

  test("Catagory Islands page", { tag: "@setup" }, async ({ page }) => {
    await allure.severity("minor");
    const currentScreenshot = `${currentDir}/catagory-islands-page-current.png`;
    const baselineScreenshot = `${baselineDir}/catagory-islands-page-baseline.png`;
    const diffScreenshot = `${diffDir}/catagory-islands-page-diff.png`;

    await page.goto("https://nextbnb-three.vercel.app/?category=Islands");
    await helper.wait(); // Use the helper's wait method
    await page.screenshot({ path: currentScreenshot, fullPage: true });

    if (!fs.existsSync(baselineScreenshot)) {
      console.log(`Creating baseline for ${test.info().title} test...`);
      fs.copyFileSync(currentScreenshot, baselineScreenshot);
      console.log("Baseline created. Run the test again for comparisons.");
      return;
    }

    const mismatch = await helper.compareScreenshots(
      currentScreenshot,
      baselineScreenshot,
      diffScreenshot
    );

    console.log(`Mismatch for ${test.info().title}: ${mismatch}%`);
    await helper.validateMismatch(test, mismatch, diffScreenshot);
  });

  test(
    "Home page of Playwright - fail",
    { tag: "@setup" },
    async ({ page }) => {
      await allure.severity("minor");
      const currentScreenshot = `${currentDir}/Home-page-playwright-current.png`;
      const baselineScreenshot = `${baselineDir}/Home-page-playwright-baseline.png`;
      const diffScreenshot = `${diffDir}/Home-page-playwright-diff.png`;

      await page.goto("https://playwright.dev");
      await helper.wait(); // Use the helper's wait method
      await page.screenshot({ path: currentScreenshot, fullPage: true });

      if (!fs.existsSync(baselineScreenshot)) {
        console.log(`Creating baseline for ${test.info().title} test...`);
        fs.copyFileSync(currentScreenshot, baselineScreenshot);
        console.log("Baseline created. Run the test again for comparisons.");
        return;
      }
    }
  );
});

test.describe("Visual Regression Testing with ResembleJs", () => {
  const screenshotsDir = "screenshots";
  const currentDir = `${screenshotsDir}/current`;
  const baselineDir = `${screenshotsDir}/baseline`;
  const diffDir = `${screenshotsDir}/diff`;
  let helper; // Define the HelperFunction instance

  test.beforeEach(async ({ page }) => {
    helper = new HelperFunction(page);
  });

  test("Home page", { tag: "@test" }, async ({ page }) => {
    await allure.severity("critical");
    const currentScreenshot = `${currentDir}/Home-page-current.png`;
    const baselineScreenshot = `${baselineDir}/Home-page-baseline.png`;
    const diffScreenshot = `${diffDir}/Home-page-diff.png`;

    await page.goto("https://nextbnb-three.vercel.app/");
    await helper.wait(); // Use the helper's wait method
    await page.screenshot({ path: currentScreenshot, fullPage: true });

    const mismatch = await helper.compareScreenshots(
      currentScreenshot,
      baselineScreenshot,
      diffScreenshot
    );

    console.log(`Mismatch for ${test.info().title}: ${mismatch}%`);
    await helper.validateMismatch(test, mismatch, diffScreenshot);
  });

  test("Catagory Beach page", { tag: "@test" }, async ({ page }) => {
    await allure.severity("critical");
    const currentScreenshot = `${currentDir}/catagory-beach-page-current.png`;
    const baselineScreenshot = `${baselineDir}/catagory-beach-page-baseline.png`;
    const diffScreenshot = `${diffDir}/catagory-beach-page-diff.png`;

    await page.goto("https://nextbnb-three.vercel.app/?category=Beach");
    await helper.wait(); // Use the helper's wait method
    await page.screenshot({ path: currentScreenshot, fullPage: true });

    const mismatch = await helper.compareScreenshots(
      currentScreenshot,
      baselineScreenshot,
      diffScreenshot
    );

    console.log(`Mismatch for ${test.info().title}: ${mismatch}%`);
    await helper.validateMismatch(test, mismatch, diffScreenshot);
  });

  test("Catagory Windmills page", { tag: "@test" }, async ({ page }) => {
    await allure.severity("critical");
    const currentScreenshot = `${currentDir}/catagory-windmills-page-current.png`;
    const baselineScreenshot = `${baselineDir}/catagory-windmills-page-baseline.png`;
    const diffScreenshot = `${diffDir}/catagory-windmills-page-diff.png`;

    await page.goto("https://nextbnb-three.vercel.app/?category=Windmills");
    await helper.wait(); // Use the helper's wait method
    await page.screenshot({ path: currentScreenshot, fullPage: true });

    const mismatch = await helper.compareScreenshots(
      currentScreenshot,
      baselineScreenshot,
      diffScreenshot
    );

    console.log(`Mismatch for ${test.info().title}: ${mismatch}%`);
    await helper.validateMismatch(test, mismatch, diffScreenshot);
  });

  test("Catagory Modern page", { tag: "@test" }, async ({ page }) => {
    await allure.severity("critical");
    const currentScreenshot = `${currentDir}/catagory-modern-page-current.png`;
    const baselineScreenshot = `${baselineDir}/catagory-modern-page-baseline.png`;
    const diffScreenshot = `${diffDir}/catagory-modern-page-diff.png`;

    await page.goto("https://nextbnb-three.vercel.app/?category=Modern");
    await helper.wait(); // Use the helper's wait method
    await page.screenshot({ path: currentScreenshot, fullPage: true });

    const mismatch = await helper.compareScreenshots(
      currentScreenshot,
      baselineScreenshot,
      diffScreenshot
    );

    console.log(`Mismatch for ${test.info().title}: ${mismatch}%`);
    await helper.validateMismatch(test, mismatch, diffScreenshot);
  });

  test("Catagory Countryside page", { tag: "@test" }, async ({ page }) => {
    await allure.severity("critical");
    const currentScreenshot = `${currentDir}/catagory-countryside-page-current.png`;
    const baselineScreenshot = `${baselineDir}/catagory-countryside-page-baseline.png`;
    const diffScreenshot = `${diffDir}/catagory-countryside-page-diff.png`;

    await page.goto("https://nextbnb-three.vercel.app/?category=Countryside");
    await helper.wait(); // Use the helper's wait method
    await page.screenshot({ path: currentScreenshot, fullPage: true });

    const mismatch = await helper.compareScreenshots(
      currentScreenshot,
      baselineScreenshot,
      diffScreenshot
    );

    console.log(`Mismatch for ${test.info().title}: ${mismatch}%`);
    await helper.validateMismatch(test, mismatch, diffScreenshot);
  });

  test("Catagory Pools page", { tag: "@test" }, async ({ page }) => {
    await allure.severity("critical");
    const currentScreenshot = `${currentDir}/catagory-pools-page-current.png`;
    const baselineScreenshot = `${baselineDir}/catagory-pools-page-baseline.png`;
    const diffScreenshot = `${diffDir}/catagory-pools-page-diff.png`;

    await page.goto("https://nextbnb-three.vercel.app/?category=Pools");
    await helper.wait(); // Use the helper's wait method
    await page.screenshot({ path: currentScreenshot, fullPage: true });

    const mismatch = await helper.compareScreenshots(
      currentScreenshot,
      baselineScreenshot,
      diffScreenshot
    );

    console.log(`Mismatch for ${test.info().title}: ${mismatch}%`);
    await helper.validateMismatch(test, mismatch, diffScreenshot);
  });

  test("Catagory Islands page", { tag: "@test" }, async ({ page }) => {
    await allure.severity("critical");
    const currentScreenshot = `${currentDir}/catagory-islands-page-current.png`;
    const baselineScreenshot = `${baselineDir}/catagory-islands-page-baseline.png`;
    const diffScreenshot = `${diffDir}/catagory-islands-page-diff.png`;

    await page.goto("https://nextbnb-three.vercel.app/?category=Islands");
    await helper.wait(); // Use the helper's wait method
    await page.screenshot({ path: currentScreenshot, fullPage: true });

    const mismatch = await helper.compareScreenshots(
      currentScreenshot,
      baselineScreenshot,
      diffScreenshot
    );

    console.log(`Mismatch for ${test.info().title}: ${mismatch}%`);
    await helper.validateMismatch(test, mismatch, diffScreenshot);
  });

  test("Home page of Playwright - fail", { tag: "@test" }, async ({ page }) => {
    await allure.severity("critical");
    const currentScreenshot = `${currentDir}/Home-page-playwright-current.png`;
    const baselineScreenshot = `${baselineDir}/Home-page-playwright-baseline.png`;
    const diffScreenshot = `${diffDir}/Home-page-playwright-diff.png`;

    await page.goto("https://playwright.dev/docs/intro");
    await helper.wait(); // Use the helper's wait method
    await page.screenshot({ path: currentScreenshot, fullPage: true });

    const mismatch = await helper.compareScreenshots(
      currentScreenshot,
      baselineScreenshot,
      diffScreenshot
    );

    console.log(`Mismatch for ${test.info().title}: ${mismatch}%`);
    await helper.validateMismatch(test, mismatch, diffScreenshot);
  });
});
