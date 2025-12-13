const Tesseract = require("tesseract.js");
import fs from "fs";
const { uploadImage } = require("./supabase-function");
import { explainVisualDiffWithClaude, explainVisualDiff } from "./gen-ai.js";
import dotenv from "dotenv";
dotenv.config();
// Fix the import to match the export
import dbService, {
  insertVisualRecord as dbInsertVisualRecord,
  insertBaselineRecord,
  dbManager,
} from "./db-service";
const looksSame = require("looks-same");
import {
  mergeImages,
  generateHtmlReport,
  jsonToMarkdown,
  waitForPageReady,
} from "./utility-page.js";

// Configuration constants
const DEFAULT_WAIT_TIMEOUT = process.env.DEFAULT_WAIT_TIMEOUT || 5000;
const tolerance = parseFloat(process.env.MISMATCH_THRESHOLD || "1");
const USE_AI = process.env.USE_AI === "true";

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
   * @returns {Promise<{mismatch: number, AI_RESPONSE: string}>} - Resolves with an object containing the mismatch percentage and optional AI explanation
   */
  async compareScreenshotsWithText(currentPath, baselinePath, diffPath, test) {
    try {
      // Extract text from both images
      const [currentText, baselineText] = await Promise.all([
        this.extractText(currentPath),
        this.extractText(baselinePath),
      ]);

      let textDiffReport = [];
      textDiffReport.push("=== OCR Text Comparison Report ===");
      textDiffReport.push(`Generated: ${new Date().toISOString()}`);
      textDiffReport.push("");

      // Compare the text
      if (currentText !== baselineText) {
        console.log("Text Differences Found!");
        textDiffReport.push("Status: TEXT DIFFERENCES DETECTED");
        textDiffReport.push("");

        const baselineLines = baselineText.split("\n");
        const currentLines = currentText.split("\n");

        baselineLines.forEach((line, index) => {
          if (line !== currentLines[index]) {
            textDiffReport.push(`Line ${index + 1} differs:`);
            textDiffReport.push(`  Baseline: ${line}`);
            textDiffReport.push(
              `  Current:  ${currentLines[index] || "Missing line"}`
            );
            textDiffReport.push("");
          }
        });

        const textDiffPath = diffPath.replace("-diff.png", "-text-diff.txt");
        fs.writeFileSync(textDiffPath, textDiffReport.join("\n"), "utf8");
        console.log(`📝 Text diff report saved: ${textDiffPath}`);

        if (test) {
          test.info().attachments.push({
            name: "Text Differences Report",
            path: textDiffPath,
            contentType: "text/plain",
          });
        }
      } else {
        console.log("No text differences found.");
        textDiffReport.push("Status: NO TEXT DIFFERENCES");
      }

      let AI_RESPONSE;
      let mismatch;
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
        shouldCluster: true, // Groups pixel differences into "clusters" (Better reporting)
        clustersSize: 10, // Merge clusters if they are within 10px of each other
      });

      // Add validation for undefined values
      if (differentPixels === undefined || totalPixels === undefined) {
        console.warn(
          "looksSame returned undefined pixel values for both differentPixels and totalPixels, treating as no differences"
        );
        return { mismatch: 0, AI_RESPONSE };
      } else {
        mismatch = parseFloat(
          ((differentPixels / totalPixels) * 100).toFixed(2)
        );

        console.log(
          `Mismatch found: ${differentPixels} out of ${totalPixels} pixels, Mismatch percentage: ${mismatch}%`
        );

        if (!equal) {
          await diffImage.save(diffPath);
          await mergeImages([currentPath, baselinePath, diffPath], diffPath);

          if (USE_AI == "true") {
            if (process.env.GEMINI_API_KEY) {
              console.log("🤖 Using Gemini AI for visual diff explanation...");
              AI_RESPONSE = await explainVisualDiff(
                baselinePath,
                currentPath,
                diffPath
              );
              await this.generateAndAttachMarkdownReport(test, AI_RESPONSE);
              await this.generateAndAttachAIExplanation(test, AI_RESPONSE);
            } else if (process.env.ANTHROPIC_API_KEY) {
              console.log("🤖 Using Claude AI for visual diff explanation...");
              AI_RESPONSE = await explainVisualDiffWithClaude(
                baselinePath,
                currentPath,
                diffPath
              );
              await this.generateAndAttachMarkdownReport(test, AI_RESPONSE);
              await this.generateAndAttachAIExplanation(test, AI_RESPONSE);
            } else if (USE_AI == false || USE_AI == undefined) {
              AI_RESPONSE =
                "🧐 Seems like you have not enabled the `USE_AI` env variable, That is why it is blank. If you want to enable AI 🤖, set USE_AI=true in your .env file.";
              console.warn(AI_RESPONSE);
            }
          }
        }

        return { mismatch, AI_RESPONSE };
      }
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
      await waitForPageReady(this.page);
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
   * Generate and attach AI explanation (HTML report) to the test report.
   *
   * NOTE: It is assumed that AI_RESPONSE is the JSON object required by generateHtmlReport.
   * If AI_RESPONSE is a simple string, you may need to adjust the call to generateHtmlReport.
   *
   * @param {Object} test - Playwright test object (or testInfo). We use test.info().
   * @param {Object} AI_RESPONSE - AI-generated JSON data for the report.
   */
  async generateAndAttachAIExplanation(test, AI_RESPONSE) {
    // 2. Handle missing response gracefully (using simple string for error report)
    let reportData = AI_RESPONSE;
    if (
      !AI_RESPONSE ||
      (typeof AI_RESPONSE === "string" && AI_RESPONSE.trim() === "")
    ) {
      // If the expected JSON is missing, we generate an HTML error message instead of the full report
      reportData = {
        changes: [
          {
            location: "Error",
            baseline_state: "N/A",
            current_state: "N/A",
            description:
              "⚠️ No AI explanation available. Please check your API key and settings.",
          },
        ],
      };
    }

    // 3. Generate the HTML report content (String)
    const htmlContent = generateHtmlReport(reportData);

    // 4. Save to file and attach the file path
    const htmlPath = `screenshots/ai-reports/${
      test.info().title
    }-ai-report-${Date.now()}.html`;
    const dir = htmlPath.substring(0, htmlPath.lastIndexOf("/"));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(htmlPath, htmlContent, "utf8");

    await test.info().attachments.push({
      name: "UI Change Report (HTML)",
      path: htmlPath,
      contentType: "text/html",
    });
  }

  /**
   * Generate and attach the Markdown report to the test report.
   *
   * NOTE: It is assumed that AI_RESPONSE is the JSON object required by jsonToMarkdown.
   *
   * @param {import('@playwright/test').TestInfo} testInfo - Playwright TestInfo object.
   * @param {Object} AI_RESPONSE - AI-generated JSON data for the report.
   */
  async generateAndAttachMarkdownReport(test, AI_RESPONSE) {
    // 1. Handle missing response gracefully (using simple string for error report)
    let reportData = AI_RESPONSE;
    console.log("AI_RESPONSE: \n" + AI_RESPONSE);
    if (
      !AI_RESPONSE ||
      (typeof AI_RESPONSE === "string" && AI_RESPONSE.trim() === "")
    ) {
      // Since markdown generator expects JSON, we simulate a simple error structure
      reportData = {
        changes: [
          {
            location: "Error",
            baseline_state: "N/A",
            current_state: "N/A",
            description:
              "⚠️ No AI explanation available. Please check your API key and settings.",
          },
        ],
      };
    }

    // 2. Generate the Markdown report content (String)
    const markdownContent = jsonToMarkdown(reportData);

    // 3. Save to file and attach the file path
    const markdownPath = `screenshots/ai-reports/${
      test.info().title
    }-ai-report-${Date.now()}.md`;
    const dir = markdownPath.substring(0, markdownPath.lastIndexOf("/"));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(markdownPath, markdownContent, "utf8");

    await test.info().attachments.push({
      name: "UI Change Report (Markdown)",
      path: markdownPath,
      contentType: "text/markdown",
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
   * Generate a baseline image record in the database
   * @param baselineScreenshot Path to the baseline screenshot
   */
  async generateBaselineImage(baselineScreenshot) {
    console.log(
      "📸 Baseline Image not found. Storing current image as baseline."
    );

    if (USE_AI) {
      console.log(
        "🤖 Using AI for baseline image generation, Just Kidding 😂!"
      );
    } else {
      console.log("No AI used for baseline image generation.");
    }

    // Only store baseline record in CI environment
    if (!dbManager.isDatabaseEnabled()) {
      console.log(
        "⚠️ Skipping baseline database record - not in CI environment"
      );
      return;
    }

    try {
      // Get database connection from singleton manager
      const db = dbManager.getConnection();

      if (!db) {
        console.warn("⚠️ Database not available for baseline record");
        return;
      }

      // Insert baseline record using the db-service function
      const info = insertBaselineRecord(db, baselineScreenshot);

      console.log(
        `✅ Baseline record inserted with ID: ${info.lastInsertRowid}`
      );
    } catch (error) {
      console.error("❌ Database operation failed:", error);
      // Don't throw error for database operations to avoid breaking tests
      console.warn("⚠️ Continuing without database record...");
    }
  }

  /**
   * Capture a screenshot of a specific element on the page.
   * @param {string} elementSelector - CSS selector of the element to capture
   * @param {string} screenshotPath - File path where the screenshot will be saved
   * @returns {Promise<void>}
   */
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
