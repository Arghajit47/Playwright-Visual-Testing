const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs");
dotenv.config();

/**
 * Recursively searches for all result.json files under a given directory.
 * @param {string} dir - The root directory to start searching from.
 * @returns {string[]} Array of absolute paths to all found result.json files.
 */
const findFiles = (dir) => {
  const files = fs.readdirSync(dir);
  let results = [];
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(findFiles(fullPath));
    } else if (file === "result.json") {
      results.push(fullPath);
    }
  });
  return results;
};

/**
 * Merges all result.json files found under ./test-results into a single JSON file.
 * The merged file is saved locally with the device type (from DEVICE_TYPE env var) in its name.
 * Exits the process with code 1 on any error.
 */
async function mergeAndUpload() {
  try {
    const outputDir = "./test-results";
    const mergedData = [];

    const deviceType = process.env.DEVICE_TYPE || "desktop"; // fallback to desktop if not set

    console.log(`🛠 Merging results for device type: ${deviceType}`);

    const files = findFiles(outputDir);

    // Read and merge data
    files.forEach((file) => {
      const data = JSON.parse(fs.readFileSync(file, "utf-8"));
      if (Array.isArray(data)) {
        mergedData.push(...data); // flatten arrays
      } else {
        mergedData.push(data);
      }
    });

    // Save merged file locally with device type in the name
    const mergedPath = path.join(
      outputDir,
      `merged-results-${deviceType}.json`
    );
    fs.writeFileSync(mergedPath, JSON.stringify(mergedData, null, 2));

    console.log(`✅ Merged ${files.length} result files into ${mergedPath}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

mergeAndUpload();
