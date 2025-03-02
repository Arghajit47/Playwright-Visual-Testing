const { expect } = require("@playwright/test");
import resemble from "resemblejs";
const Tesseract = require("tesseract.js");
import fs from "fs";

export class HelperFunction {
  constructor(page) {
    this.page = page;
  }

  async extractText(imagePath) {
    return new Promise((resolve, reject) => {
      Tesseract.recognize(imagePath, "eng") // Specify language
        .then(({ data: { text } }) => {
          resolve(text);
        })
        .catch(reject);
    });
  }

  async compareScreenshotsWithText(currentPath, baselinePath, diffPath) {
    return new Promise(async (resolve, reject) => {
      try {
        // Extract text from both images
        const [currentText, baselineText] = await Promise.all([
          this.extractText(currentPath),
          this.extractText(baselinePath),
        ]);

        console.log("Baseline Text:\n", baselineText);
        console.log("Current Text:\n", currentText);

        // Compare the text
        if (currentText !== baselineText) {
          console.log("Text Differences Found!");
          const baselineLines = baselineText.split("\n");
          const currentLines = currentText.split("\n");
          baselineLines.forEach((line, index) => {
            if (line !== currentLines[index]) {
              console.log(`Line ${index + 1} differs:`);
              console.log(`Baseline: ${line}`);
              console.log(`Current: ${currentLines[index] || "Missing line"}`);
            }
          });
        } else {
          console.log("No text differences found.");
        }

        // Image comparison
        resemble(baselinePath)
          .compareTo(currentPath)
          .onComplete((data) => {
            try {
              if (data && data.getBuffer) {
                fs.writeFileSync(diffPath, data.getBuffer(true));
              }

              console.log("Mismatch Percentage:", data.rawMisMatchPercentage);
              if (data.diffBounds) {
                console.log("Difference Bounds:", data.diffBounds);
              }

              resolve(data.rawMisMatchPercentage);
            } catch (error) {
              reject({ error, screenshotPath: diffPath });
            }

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
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  async wait() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(10000);
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
      expect(parseFloat(mismatch)).toBeLessThan(5);
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

export async function createFolders(baselineDir, diffDir) {
  fs.mkdirSync(`${baselineDir}/desktop`, { recursive: true });
  fs.mkdirSync(`${baselineDir}/mobile`, { recursive: true });
  fs.mkdirSync(`${diffDir}/desktop`, { recursive: true });
  fs.mkdirSync(`${diffDir}/mobile`, { recursive: true });
}


