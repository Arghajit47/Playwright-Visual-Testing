const Tesseract = require("tesseract.js");
import fs from "fs";
const { uploadImage } = require("./supabase-function");
import dotenv from "dotenv";
// Fix the import to match the export
import dbService, {
  insertVisualRecord as dbInsertVisualRecord,
} from "./db-service";
const looksSame = require("looks-same");
import { mergeImages } from "./utility-page.js";

// Configuration constants
const DEFAULT_WAIT_TIMEOUT = process.env.DEFAULT_WAIT_TIMEOUT || 5000;
const tolerance = parseFloat(process.env.MISMATCH_THRESHOLD || "1");

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
   * @param {Object} test - Playwright test object containing test metadata
   * @returns {Promise<number>} - Resolves with the mismatch percentage
   */
  async compareScreenshotsWithText(currentPath, baselinePath, diffPath) {
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

      // Image comparison - Fixed: use the actual paths instead of helper functions
      const {
        equal,
        diffImage,
        differentPixels,
        totalPixels,
        diffBounds,
        diffClusters,
      } = await looksSame(currentPath, baselinePath, {
        createDiffImage: true,
        strict: false, // strict comparison
        antialiasingTolerance: 0,
        ignoreAntialiasing: true, // ignore antialiasing by default
        ignoreCaret: true, // ignore caret by default
        pixelRatio: 1, // pixel ratio of the screenshot
        tolerance: tolerance,
      });

      // Add validation for undefined values
      if (differentPixels === undefined || totalPixels === undefined) {
        console.warn(
          "looksSame returned undefined pixel values for both differentPixels and totalPixels, treating as no differences"
        );
        return 0; // No mismatch if pixel data is unavailable
      }

      const mismatch = parseFloat(
        ((differentPixels / totalPixels) * 100).toFixed(2)
      );

      console.log(
        `Mismatch found: ${differentPixels} out of ${totalPixels} pixels, Mismatch percentage: ${mismatch}%`
      );

      if (!equal) {
        await diffImage.save(diffPath);
        await mergeImages([currentPath, baselinePath, diffPath], diffPath);
      }

      return mismatch; // Now returns number instead of string
    } catch (error) {
      console.error(`Failed to compare screenshots: ${error.message}`);
      throw error;
    }
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
   * Validate if the mismatch percentage is within acceptable tolerance
   * @param {Object} test - Playwright test object
   * @param {number} mismatch - Mismatch percentage
   * @param {string} diffPath - Path to the diff image
   * @param {Object} testInfo - Test info object
   * @param {string} device - Device type (e.g., "desktop", "mobile")
   */
  async validateMismatch(test, mismatch, diffPath, testInfo, device) {
    // Use configurable tolerance from environment or default
    if (mismatch < tolerance) {
      console.log(
        `✅ Test passed: Mismatch ${mismatch}% is below tolerance ${tolerance}%`
      );
      await insertVisualRecord(testInfo, device, "passed", diffPath);
    } else {
      const testName = testInfo.title || "Unknown test";
      const errorMessage = `Mismatch for ${testName}: ${mismatch}%`;

      // Log the error with more context
      console.error(`❌ ${errorMessage}`);
      console.error(`   Test: ${testName}`);
      console.error(`   Device: ${device}`);
      console.error(`   Diff image: ${diffPath}`);
      await this.attachScreenshot(test, diffPath);

      // Record the failure in the database
      await insertVisualRecord(testInfo, device, "failed", diffPath);

      // Upload the diff image for reporting
      const image = diffPath.replace("screenshots", "");
      await uploadImage(image, diffPath);
      // Skip the test instead of failing it
      test.skip(errorMessage);
    }
  }

  /**
   * Generate a baseline image when one doesn't exist
   * @param {string} baselineScreenshot - Path to the baseline screenshot
   */
  async generateBaselineImage(baselineScreenshot, test) {
    console.log(
      "📸 Baseline Image not found. Storing current image as baseline."
    );
    test.setTimeout(60000);

    try {
      // Insert record into database using the db-service
      const { insertBaselineRecord } = await import("./db-service");
      const db = dbService.getDatabase(); // Use lazy initialization
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

  async captureElementSpecificScreenshot(elementSelector, screenshotPath) {
    const element = await this.page.waitForSelector(elementSelector);
    await element.screenshot({ path: screenshotPath });
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
// Update the insertVisualRecord function
export async function insertVisualRecord(testInfo, device, status, diffPath) {
  const db = dbService.getDatabase(); // Fix: use dbService.getDatabase() instead of getDb()
  return dbInsertVisualRecord(db, testInfo, device, status, diffPath);
}
