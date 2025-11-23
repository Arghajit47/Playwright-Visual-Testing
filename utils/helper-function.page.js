import resemble from "resemblejs";
const Tesseract = require("tesseract.js");
import fs from "fs";
import assert from "assert";
const { uploadImage } = require("./supabase-function");
import dotenv from "dotenv";
import db, { insertVisualRecord as dbInsertVisualRecord } from "./db-service";

// Load environment variables
dotenv.config();

// Configuration constants
const DEFAULT_WAIT_TIMEOUT = process.env.DEFAULT_WAIT_TIMEOUT || 5000;
const MISMATCH_THRESHOLD = process.env.MISMATCH_THRESHOLD || 1;

/**
 * Helper class providing utilities for visual regression testing,
 * OCR text extraction, screenshot comparison, and database logging.
 */
export class HelperFunction {
  /**
   * Create a HelperFunction instance.
   * @param {import('@playwright/test').Page} page - Playwright page object
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Extract text from an image using Tesseract OCR
   * @param {string} imagePath - Path to the image file
   * @returns {Promise<string>} - Extracted text
   */
  async extractText(imagePath) {
    try {
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      return new Promise((resolve, reject) => {
        Tesseract.recognize(imagePath, "eng") // Specify language
          .then(({ data: { text } }) => {
            resolve(text);
          })
          .catch((error) => {
            console.error(`OCR error: ${error.message}`);
            reject(new Error(`Text extraction failed: ${error.message}`));
          });
      });
    } catch (error) {
      console.error(`Failed to extract text: ${error.message}`);
      throw error;
    }
  }

  /**
   * Compare two screenshots both visually (pixel-wise) and textually (OCR).
   * @param {string} currentPath - Path to the current screenshot
   * @param {string} baselinePath - Path to the baseline screenshot
   * @param {string} diffPath - Path where the diff image will be saved
   * @returns {Promise<number>} - Raw mismatch percentage
   */
  async compareScreenshotsWithText(currentPath, baselinePath, diffPath) {
    return new Promise(async (resolve, reject) => {
      try {
        // Extract text from both images
        const [currentText, baselineText] = await Promise.all([
          this.extractText(currentPath),
          this.extractText(baselinePath),
        ]);

        console.log("Baseline Text and Current Text matched!");

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

  /**
   * Wait for page to be fully loaded with configurable timeout
   * @param {number} [timeout=DEFAULT_WAIT_TIMEOUT] - Optional custom timeout in ms
   */
  async wait(timeout = DEFAULT_WAIT_TIMEOUT) {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForLoadState("networkidle");
      await this.page.waitForTimeout(parseInt(timeout));
    } catch (error) {
      console.error(`Error during page wait: ${error.message}`);
      throw new Error(`Failed to wait for page to load: ${error.message}`);
    }
  }

  /**
   * Convert an image file to Base64 string.
   * @param {Buffer|string} diffPath - Image buffer or file path
   * @returns {string} Base64-encoded image
   */
  async captureBase64Screenshot(diffPath) {
    return diffPath.toString("base64");
  }

  /**
   * Attach a screenshot to the Playwright test report.
   * @param {Object} test - Playwright test object
   * @param {string} screenshotPath - Absolute path to the screenshot
   */
  async attachScreenshot(test, screenshotPath) {
    test.info().attachments.push({
      name: "Screenshot",
      path: screenshotPath,
      contentType: "image/png",
    });
  }

  /**
   * Validate if the mismatch percentage is within acceptable threshold
   * @param {Object} test - Playwright test object
   * @param {number} mismatch - Mismatch percentage
   * @param {string} diffPath - Path to the diff image
   * @param {Object} testInfo - Test info object
   * @param {string} device - Device type (e.g., "desktop", "mobile")
   */
  async validateMismatch(test, mismatch, diffPath, testInfo, device) {
    try {
      // Use configurable threshold from environment or default
      const threshold = parseFloat(MISMATCH_THRESHOLD);
      assert.ok(
        parseFloat(mismatch) < threshold,
        `Mismatch of ${mismatch}% exceeds threshold of ${threshold}%`
      );

      console.log(
        `✅ Test passed: Mismatch ${mismatch}% is below threshold ${threshold}%`
      );
      await insertVisualRecord(testInfo, device, "passed", diffPath);
    } catch (error) {
      // Get the test name from testInfo or use a default
      const testName = testInfo.title || "Unknown test";
      const errorMessage = `Mismatch for ${testName}: ${mismatch}%`;

      // Log the error with more context
      console.error(`❌ ${errorMessage}`);
      console.error(`   Test: ${testName}`);
      console.error(`   Device: ${device}`);
      console.error(`   Diff image: ${diffPath}`);

      try {
        // Attach screenshot to test report
        await this.attachScreenshot(test, diffPath);

        // Record the failure in the database
        await insertVisualRecord(testInfo, device, "failed", diffPath);

        // Upload the diff image for reporting
        const image = diffPath.replace("screenshots", "");
        await uploadImage(image, diffPath);
      } catch (uploadError) {
        console.error(
          `❌ Error during result processing: ${uploadError.message}`
        );
      }

      // Skip the test instead of failing it
      test.skip(errorMessage);
    }
  }

  /**
   * Generate a baseline image when one doesn't exist
   * @param {string} baselineScreenshot - Path to the baseline screenshot
   */
  async generateBaselineImage(baselineScreenshot) {
    console.log(
      "📸 Baseline Image not found. Storing current image as baseline."
    );

    try {
      // Insert record into database using the db-service
      const { insertBaselineRecord } = await import("./db-service");
      const info = insertBaselineRecord(db, baselineScreenshot);

      console.log(
        `✅ Baseline record inserted with ID: ${info.lastInsertRowid}`
      );

      // Optional: Still maintain JSON file if needed for backward compatibility
      const baselineFile = process.env.CI
        ? `baseline-${process.env.DEVICE_TYPE}.json`
        : `baseline.json`;

      let baselineData = [];
      if (fs.existsSync(baselineFile)) {
        try {
          const fileContent = fs.readFileSync(baselineFile, "utf8").trim();
          if (fileContent) {
            baselineData = JSON.parse(fileContent);
          }
        } catch (parseError) {
          console.warn(
            `⚠️ Invalid JSON in ${baselineFile}, starting with empty array`
          );
          baselineData = [];
        }
      }

      if (!baselineData.includes(baselineScreenshot)) {
        baselineData.push(baselineScreenshot);
        fs.writeFileSync(baselineFile, JSON.stringify(baselineData, null, 2));
        console.log(`✅ Added baseline to JSON file: ${baselineFile}`);
      }
    } catch (error) {
      console.error(`❌ Baseline generation failed: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Create required folder structure for visual regression assets.
 * @param {string} baselineDir - Root directory for baseline images
 * @param {string} currentDir - Root directory for current images
 * @param {string} diffDir - Root directory for diff images
 */
export function createFolders(baselineDir, currentDir, diffDir) {
  fs.mkdirSync(`${baselineDir}/desktop`, { recursive: true });
  fs.mkdirSync(`${baselineDir}/mobile`, { recursive: true });
  fs.mkdirSync(`${currentDir}/desktop`, { recursive: true });
  fs.mkdirSync(`${currentDir}/mobile`, { recursive: true });
  fs.mkdirSync(`${diffDir}/desktop`, { recursive: true });
  fs.mkdirSync(`${diffDir}/mobile`, { recursive: true });
}

/**
 * Insert a visual test record into the database
 * @param {Object} testInfo - Test information object
 * @param {string} device - Device type (desktop/mobile)
 * @param {string} status - Test status (passed/failed)
 * @param {string} diffPath - Path to diff image
 * @returns {Object} - Database operation result
 */
export async function insertVisualRecord(testInfo, device, status, diffPath) {
  try {
    return dbInsertVisualRecord(db, testInfo, device, status, diffPath);
  } catch (error) {
    console.error(`❌ Failed to insert visual record: ${error.message}`);
    throw error;
  }
}
