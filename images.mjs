import fs from "fs-extra";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config(); // Load Supabase API Key from .env

/**
 * Downloads all files from a specific folder in a Supabase Storage bucket.
 * @param {string} folder - The folder path in the bucket (e.g., "desktop" or "mobile").
 * @returns {Promise<void>}
 */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET_NAME; // Change to your bucket
const SUPABASE_API_KEY = process.env.SUPABASE_TOKEN;

// Ensure folder exists
const folderPath = "./screenshots";
fs.ensureDirSync(folderPath);

/**
 * Downloads images from a specified folder in Supabase Storage and saves them locally.
 * @param {string} folder - The folder path within the Supabase bucket.
 * @returns {Promise<void>}
 */
async function downloadImages(folder) {
  try {
    const supabase = await createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_TOKEN
    );
    // List files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .list(folder);

    if (listError) {
      throw new Error(
        `Error listing files in folder ${folder}: ${listError.message}`
      );
    }

    if (!files || files.length === 0) {
      console.log(`No files found in folder: ${folder}`);
      return;
    }

    console.log(`Found ${files.length} files in folder: ${folder}`);

    // Download each file
    for (const file of files) {
      const filePathInBucket = `${folder}/${file.name}`; // Full path in the bucket
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(SUPABASE_BUCKET)
        .download(filePathInBucket);

      if (downloadError) {
        console.error(`Error downloading ${filePathInBucket}:`, downloadError);
        continue;
      }

      // Save the file to the local folder
      const localFilePath = path.join(folderPath, folder, file.name);
      fs.mkdirSync(path.dirname(localFilePath), { recursive: true }); // Ensure the directory exists
      fs.writeFileSync(
        localFilePath,
        Buffer.from(await fileData.arrayBuffer())
      );
      console.log(`Downloaded: ${filePathInBucket}`);
    }

    console.log(`✅ All files downloaded from folder: ${folder}`);
  } catch (error) {
    console.error(`❌ Failed to download folder ${folder}:`, error);
  }
}

// Run function before tests
downloadImages("baseline/desktop");
downloadImages("baseline/mobile");
