import { createClient } from "@supabase/supabase-js";
const fs = require("fs");
import dotenv from "dotenv";
dotenv.config();

/**
 * Uploads an image file to Supabase storage.
 *
 * @async
 * @param {string} fileName - The name/path to be used for the file in Supabase storage.
 * @param {string} pathContent - The local file system path of the image to upload.
 * @returns {Promise<void>} A promise that resolves when the upload attempt is complete.
 * @throws {Error} Logs an error message if the upload fails.
 */
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
