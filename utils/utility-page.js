import Jimp from "jimp";
import fs from "fs";

/**
 * Generates a sanitized screenshot filename from the test name.
 * @param {string} testName - The full test name, possibly containing spaces and “ – …” suffix.
 * @returns {string} The cleaned string (first part before “ –”, spaces replaced by hyphens).
 */
export function generateScreenshotName(testName) {
  return `${testName.split(" -")[0].replaceAll(" ", "-")}`;
}

/**
 * Merges three images horizontally into a single image file.
 * @param {string[]} imagePaths - An array of image paths to merge.
 * @param {string} outputPath - The path where the final combined image will be saved.
 */
export async function mergeImages(imagePaths, outputPath) {
  try {
    if (imagePaths.length === 0) {
      console.log("No images to merge.");
      return;
    }

    // 2. FIX: Wait for all promises to resolve
    // map(async) returns [Promise, Promise], we need [Image, Image]
    const jimpImages = await Promise.all(imagePaths.map((p) => Jimp.read(p)));

    // 3. Now jimpImages contains loaded objects, so getWidth() works
    const totalWidth = jimpImages.reduce((sum, img) => sum + img.getWidth(), 0);
    const maxHeight = Math.max(...jimpImages.map((img) => img.getHeight()));

    console.log(
      `Creating a new image with dimensions: ${totalWidth}x${maxHeight}`
    );

    // Create a new blank image with a white background (0xffffffff)
    const combinedImage = new Jimp(totalWidth, maxHeight, 0xffffffff);

    let currentX = 0;
    for (const image of jimpImages) {
      // Paste (composite) each image onto the blank canvas
      combinedImage.composite(image, currentX, 0);
      currentX += image.getWidth();
    }

    // Save the final image
    await combinedImage.writeAsync(outputPath);
    console.log(`Successfully created combined image at: ${outputPath}`);
  } catch (error) {
    console.error("An error occurred while merging images:", error);
    throw error;
  }
}
