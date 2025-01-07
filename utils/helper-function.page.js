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
        .onComplete((data) => {
          try {
            if (data && data.getBuffer) {
              fs.writeFileSync(diffPath, data.getBuffer(true));
            }

            // Log more detailed information
            console.log("Detailed Comparison Logs:");
            console.log(
              `Mismatch Percentage: ${data.rawMisMatchPercentage.toFixed(2)}%`
            );
            console.log(`Is Same Dimensions: ${data.isSameDimensions}`);

            if (!data.isSameDimensions) {
              console.log(
                `Dimension Differences: ${JSON.stringify(
                  data.dimensionDifference
                )}`
              );
            }

            console.log(`Analysis Time: ${data.analysisTime}ms`);

            // Log additional metrics if available
            if (data.misMatchPercentage) {
              console.log(
                `Rounded MisMatch Percentage: ${data.misMatchPercentage}%`
              );
            }

            // Optional: Log pixel difference map (if Resemble supports it in your version)
            if (data.diffBounds) {
              console.log(
                `Difference Bounds: ${JSON.stringify(data.diffBounds)}`
              );
            }

            if (data.diffClusters) {
              console.log(
                `Number of Difference Clusters: ${data.diffClusters.length}`
              );
              console.log(
                "Clusters (sample):",
                JSON.stringify(data.diffClusters.slice(0, 3))
              ); // Log first 3 clusters
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
