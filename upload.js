const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const fs = require("fs");
dotenv.config();

// 1. Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_TOKEN;
const bucketName = "visual-dashboard-json"; // e.g., 'test-reports'

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key:", supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);
const mergedPath = "./visual-report/merged-results.json"; // Path to the merged JSON file

async function uploadJson() {
  try {
    // 3. Upload to Supabase Storage
    const fileContent = fs.readFileSync(mergedPath, "utf-8");
    const fileName = `merged-results.json`; // Unique filename

    // Step 1: Delete old file if exists
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (deleteError) {
      console.warn(
        "⚠️ Warning: Error deleting old file (might not exist). Proceeding..."
      );
    } else {
      console.log("🗑️ Old file deleted successfully (if existed).");
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileContent, {
        contentType: "application/json",
        upsert: true,
      });

    if (error) throw error;
    console.log(`🚀 Uploaded to Supabase: ${fileName}`);
    console.log(
      `Public URL: ${
        supabase.storage.from(bucketName).getPublicUrl(fileName).data.publicUrl
      }`
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

uploadJson();
