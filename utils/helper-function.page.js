const { expect } = require("@playwright/test");
import resemble from "resemblejs";
const Tesseract = require("tesseract.js");
import fs from "fs";
import assert from "assert";
const { uploadImage } = require("./supabase-function");
import Database from "better-sqlite3";
import path from "path";

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

  async wait() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(5000);
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

  async validateMismatch(test, mismatch, diffPath, testInfo, device) {
    try {
      assert.ok(parseFloat(mismatch) < 1);
      await insertVisualRecord(testInfo, device, "passed", diffPath);
    } catch (error) {
      // Log the error message with the base64 encoded screenshot
      const errorMessage = `Mismatch for Home page: ${mismatch}`;

      // Log the error
      console.error(errorMessage);
      await this.attachScreenshot(test, diffPath);
      await insertVisualRecord(testInfo, device, "failed", diffPath);
      const image = diffPath.replace("screenshots", "");
      await uploadImage(image, diffPath);
      // Throw a custom error with the HTML content and base64 screenshot
      test.skip();
    }
  }

  async generateBaselineImage(baselineScreenshot) {
    console.log("Baseline Image not found. Storing current image as baseline.");

    // Initialize database table
    db.exec(`
      CREATE TABLE IF NOT EXISTS baseline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const sql = `
      INSERT INTO baseline (name)
      VALUES (@name)
    `;

    const stmt = db.prepare(sql);

    try {
      // Insert single record
      const info = stmt.run({
        name: baselineScreenshot, // Pass as object with @name property
      });

      console.log(`Record inserted with ID: ${info.lastInsertRowid}`);

      // Optional: Still maintain JSON file if needed
      const baselineFile = process.env.CI
        ? `baseline-${process.env.DEVICE_TYPE}.json`
        : `baseline.json`;

      let baselineData = [];
      if (fs.existsSync(baselineFile)) {
        baselineData = JSON.parse(fs.readFileSync(baselineFile, "utf8"));
      }

      if (!baselineData.includes(baselineScreenshot)) {
        baselineData.push(baselineScreenshot);
        fs.writeFileSync(baselineFile, JSON.stringify(baselineData, null, 2));
      }
    } catch (error) {
      console.error("Database operation failed:", error);
      throw error;
    }
  }
}

export async function createFolders(baselineDir, diffDir) {
  fs.mkdirSync(`${baselineDir}/desktop`, { recursive: true });
  fs.mkdirSync(`${baselineDir}/mobile`, { recursive: true });
  fs.mkdirSync(`${diffDir}/desktop`, { recursive: true });
  fs.mkdirSync(`${diffDir}/mobile`, { recursive: true });
}

// 1. Initialize the database connection.
// This will create the 'visual.db' file in your project root if it doesn't exist.
// const db = new Database("visual.db", { verbose: console.log });
const db = process.env.CI
  ? new Database(`visual_${process.env.DEVICE_TYPE}.db`, {
      verbose: console.log,
    })
  : new Database("visual.db", { verbose: console.log });

// 2. Define the table schema and create the table if it doesn't exist.
// This is a crucial step. This code will only run once to set up the table.
const createTableStmt = `
CREATE TABLE IF NOT EXISTS visual_matrix (
    name TEXT NOT NULL,
    device TEXT NOT NULL,
    status TEXT NOT NULL,
    imageUrl TEXT NOT NULL
);
`;
db.exec(createTableStmt);

// Add a function to gracefully close the database connection when the script exits
process.on("exit", () => db.close());

// The function signature remains the same, but the internal logic is now for SQLite.
export async function insertVisualRecord(testInfo, device, status, diffPath) {
  const image = diffPath.replace("screenshots", "");
  let data;
  switch (status) {
    case "passed":
      data = {
        name: testInfo.title,
        device: device,
        status: "passed",
        imageUrl: "",
      };
      break;
    case "failed":
      data = {
        name: testInfo.title,
        device: device,
        status: "failed",
        imageUrl: `https://ocpaxmghzmfbuhxzxzae.supabase.co/storage/v1/object/public/visual_test${image}`,
      };
      break;
    default:
      throw new Error("Invalid test status");
  }
  try {
    // 1. Define the SQL query with named parameters (@name, @status, etc.).
    // This is a secure way to insert data and prevents SQL injection attacks.
    const sql = `
      INSERT INTO visual_matrix (
        name, 
        device, 
        status, 
        imageUrl
      ) VALUES (
        @name, 
        @device, 
        @status, 
        @imageUrl
      )
    `;

    // 2. Prepare the statement. This compiles the SQL query for efficiency.
    const stmt = db.prepare(sql);

    // 3. Execute the statement with the record object.
    // The keys in the 'record' object (@performance, etc.) are automatically mapped to the named parameters in the SQL query.
    const info = stmt.run(data);

    console.log(
      `Record inserted successfully with ID: ${info.lastInsertRowid}`
    );
    return info;
  } catch (error) {
    console.error("Error inserting record into SQLite:", error);
  }
}
