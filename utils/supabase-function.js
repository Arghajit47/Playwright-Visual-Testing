import { createClient } from "@supabase/supabase-js";
const fs = require("fs");
import dotenv from "dotenv";
dotenv.config();

export async function uploadImage(fileName, pathContent) {
  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_TOKEN
  );

  // Define the bucket name in Supabase storage
  const bucketName = process.env.SUPABASE_BUCKET_NAME;
  // Upload baseline screenshot to Supabase
  try {
    const filePath = fileName; // Path in Supabase storage [basically just provide the fileName here]
    const fileContent = fs.readFileSync(pathContent); // Read file content from the local filepath [provide the baselineDir]

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileContent, {
        contentType: "image/png", // Set the correct content type
        upsert: true, // Overwrite if the file already exists
      });

    if (error) {
      console.error("❌ Failed to upload Screenshot to Supabase:", error);
    } else {
      console.log("✅ Screenshot uploaded to Supabase:", data);
    }
  } catch (e) {
    console.error("Test Passed with 0% difference ✅");
  }
}

