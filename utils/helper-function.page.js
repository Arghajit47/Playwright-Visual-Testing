const { expect } = require("@playwright/test");
import resemble from "resemblejs";
import fs from "fs";


export class HelperFunction {
  constructor(page) {
    this.page = page;
  }

  async compareScreenshots(currentPath, baselinePath, diffPath) {
    return new Promise((resolve, reject) => {
      resemble(baselinePath)
        .compareTo(currentPath)
        // .ignoreAntialiasing()
        .onComplete((data) => {
          try {
            if (data && data.getBuffer) {
              fs.writeFileSync(diffPath, data.getBuffer(true));
            }
            resolve(data.rawMisMatchPercentage);
          } catch (error) {
            reject({ error, screenshotPath: diffPath });
          }
        });
    });
  }

  async wait() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForTimeout(4000);
  }

  async captureBase64Screenshot(diffPath) {
    return diffPath.toString("base64");
  }
  async attachScreenshot(test, screenshotPath) {
    test.info().attachments.push({
      name: "Screenshot",
      path: screenshotPath,
      contentType: "image/png",
    });
  }

  async validateMismatch(test, mismatch, diffPath) {
    try {
      expect(parseFloat(mismatch)).toBeLessThan(1);
    } catch (error) {
      // Log the error message with the base64 encoded screenshot
      const errorMessage = `Mismatch for Home page: ${mismatch}`;

      // Log the error
      console.error(errorMessage);
      await this.attachScreenshot(test, diffPath);

      // Throw a custom error with the HTML content and base64 screenshot
      throw new Error(errorMessage);
    }
  }
}
