const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs");
dotenv.config();

// 2. Merge all result.json files
async function mergeAndUpload() {
  try {
    const outputDir = "./test-results";
    const mergedData = [];

    // Find all result.json files recursively
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

    const files = findFiles(outputDir);

    // Read and merge data
    files.forEach((file) => {
      const data = JSON.parse(fs.readFileSync(file, "utf-8"));
      mergedData.push(data);
    });

    // Save merged file locally
    const mergedPath = path.join(outputDir, "merged-results.json");
    fs.writeFileSync(mergedPath, JSON.stringify(mergedData, null, 2));

    console.log(`✅ Merged ${files.length} test results`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

mergeAndUpload();
