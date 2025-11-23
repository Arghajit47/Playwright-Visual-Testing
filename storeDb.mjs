import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// Get current readable date
const date = new Date(Date.now());
const readableDate = `${date.getFullYear()}-${(date.getMonth() + 1)
  .toString()
  .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
  .getHours()
  .toString()
  .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
  .getSeconds()
  .toString()
  .padStart(2, "0")}`;

// Single file upload function
export async function uploadDB(fileName, pathContent) {
  // Validate environment variables
  if (
    !process.env.DB_SUPABASE_URL ||
    !process.env.DB_SUPABASE_TOKEN ||
    !process.env.DB_SUPABASE_BUCKET_NAME
  ) {
    console.error("❌ Missing required environment variables");
    return false;
  }

  // Check if file exists
  if (!fs.existsSync(pathContent)) {
    console.error(`❌ File not found: ${pathContent}`);
    return false;
  }

  // Initialize Supabase client
  const supabase = createClient(
    process.env.DB_SUPABASE_URL,
    process.env.DB_SUPABASE_TOKEN
  );

  const bucketName = process.env.DB_SUPABASE_BUCKET_NAME;

  try {
    console.log(`📤 Uploading ${pathContent} to ${bucketName}/${fileName}`);

    const fileContent = fs.readFileSync(pathContent);
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileContent, {
        contentType: "application/vnd.sqlite3",
        upsert: true,
      });

    if (error) {
      console.error("❌ Failed to upload DB to Supabase:", error);
      console.error("Error details:", error.message);
      return false;
    } else {
      console.log(
        "✅ Database uploaded to Supabase successfully:",
        data,
        "Modified at: " + readableDate
      );
      return true;
    }
  } catch (e) {
    console.error("❌ Unexpected error occurred:", e.message);
    return false;
  }
}

// Find all files starting with 'visual' in a directory
export function findVisualDbFiles(directory = "./") {
  try {
    const files = fs.readdirSync(directory);
    const visualFiles = files.filter((file) => {
      // Check if file starts with 'visual' and ends with '.db'
      return file.startsWith("visual") && file.endsWith(".db");
    });

    console.log(
      `📂 Found ${visualFiles.length} visual database files in ${directory}:`
    );
    visualFiles.forEach((file) => {
      console.log(`   - ${file}`);
    });

    return visualFiles.map((file) => ({
      fileName: file,
      filePath: path.join(directory, file),
    }));
  } catch (error) {
    console.error(`❌ Error reading directory ${directory}:`, error.message);
    return [];
  }
}

// Upload all visual database files
export async function uploadAllVisualDBs(directory = "./") {
  console.log(
    `🚀 Starting batch upload of visual databases from ${directory}...`
  );

  const visualFiles = findVisualDbFiles(directory);

  if (visualFiles.length === 0) {
    console.log("⚠️  No visual database files found to upload");
    return {
      success: true,
      totalFiles: 0,
      uploadedFiles: 0,
      failedFiles: 0,
      results: [],
    };
  }

  const uploadResults = [];
  let uploadedCount = 0;
  let failedCount = 0;

  for (const file of visualFiles) {
    console.log(`\n📤 Processing file: ${file.fileName}`);

    const success = await uploadDB(file.fileName, file.filePath);

    const result = {
      fileName: file.fileName,
      filePath: file.filePath,
      success: success,
      timestamp: new Date().toISOString(),
    };

    uploadResults.push(result);

    if (success) {
      uploadedCount++;
    } else {
      failedCount++;
    }

    // Small delay between uploads to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\n📊 Batch Upload Summary:`);
  console.log(`   - Total files found: ${visualFiles.length}`);
  console.log(`   - Successfully uploaded: ${uploadedCount}`);
  console.log(`   - Failed uploads: ${failedCount}`);
  console.log(
    `   - Success rate: ${Math.round(
      (uploadedCount / visualFiles.length) * 100
    )}%`
  );

  return {
    success: failedCount === 0,
    totalFiles: visualFiles.length,
    uploadedFiles: uploadedCount,
    failedFiles: failedCount,
    results: uploadResults,
  };
}

// Upload visual databases with pattern matching
export async function uploadVisualDBsWithPattern(
  directory = "./",
  pattern = "visual"
) {
  console.log(
    `🚀 Starting pattern-based upload for files matching '${pattern}*' in ${directory}...`
  );

  try {
    const files = fs.readdirSync(directory);
    const matchingFiles = files.filter((file) => {
      return file.startsWith(pattern) && file.endsWith(".db");
    });

    console.log(
      `📂 Found ${matchingFiles.length} files matching pattern '${pattern}*':`
    );
    matchingFiles.forEach((file) => {
      console.log(`   - ${file}`);
    });

    if (matchingFiles.length === 0) {
      console.log("⚠️  No files found matching the pattern");
      return { success: true, totalFiles: 0, uploadedFiles: 0, failedFiles: 0 };
    }

    const uploadResults = [];
    let uploadedCount = 0;
    let failedCount = 0;

    for (const fileName of matchingFiles) {
      const filePath = path.join(directory, fileName);
      console.log(`\n📤 Processing file: ${fileName}`);

      const success = await uploadDB(fileName, filePath);

      uploadResults.push({
        fileName,
        filePath,
        success,
        timestamp: new Date().toISOString(),
      });

      if (success) {
        uploadedCount++;
      } else {
        failedCount++;
      }

      // Small delay between uploads
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(`\n📊 Pattern Upload Summary:`);
    console.log(`   - Pattern: '${pattern}*'`);
    console.log(`   - Total files found: ${matchingFiles.length}`);
    console.log(`   - Successfully uploaded: ${uploadedCount}`);
    console.log(`   - Failed uploads: ${failedCount}`);
    console.log(
      `   - Success rate: ${Math.round(
        (uploadedCount / matchingFiles.length) * 100
      )}%`
    );

    return {
      success: failedCount === 0,
      pattern,
      totalFiles: matchingFiles.length,
      uploadedFiles: uploadedCount,
      failedFiles: failedCount,
      results: uploadResults,
    };
  } catch (error) {
    console.error(`❌ Error in pattern-based upload:`, error.message);
    return {
      success: false,
      error: error.message,
      totalFiles: 0,
      uploadedFiles: 0,
      failedFiles: 0,
    };
  }
}

// Main execution - Upload all visual* files
async function main() {
  console.log(`🔥 Visual Database Batch Uploader`);
  console.log(`📅 Started at: ${readableDate}\n`);

  try {
    // Method 1: Upload all visual* files from current directory
    const result = await uploadAllVisualDBs("./");

    if (result.success) {
      console.log(`\n🎉 All visual databases uploaded successfully!`);
    } else {
      console.log(
        `\n⚠️  Some uploads failed. Check the logs above for details.`
      );
    }

    // Uncomment below to use pattern-based upload instead
    // const result = await uploadVisualDBsWithPattern("./", "visual");

    return result;
  } catch (error) {
    console.error(`❌ Main execution failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then((result) => {
      if (result.success) {
        console.log(`\n✅ Process completed successfully!`);
        process.exit(0);
      } else {
        console.log(`\n❌ Process completed with errors!`);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error(`❌ Unexpected error:`, error.message);
      process.exit(1);
    });
}

// Legacy single file upload (for backward compatibility)
// uploadDB("visual.db", "./visual.db");
