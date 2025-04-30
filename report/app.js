"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Recursively reads a directory and returns its structure with folders ending in '-report'
 * and their `.html` files.
 * @param {string} dirPath - The directory path to read.
 * @returns {object} - The folder structure as a JSON object.
 */
function readReportFolders(folderPath) {
  const stats = fs.statSync(folderPath);

  if (stats.isDirectory()) {
    const content = fs.readdirSync(folderPath);
    return content
      .filter((item) => {
        const fullPath = path.join(folderPath, item);
        const isDirectory = fs.statSync(fullPath).isDirectory();
        return (
          isDirectory &&
          item.endsWith("-report") &&
          !item.endsWith("visual-report")
        ); // Include only folders ending with '-report'
      })
      .reduce((acc, reportFolder) => {
        const fullPath = path.join(folderPath, reportFolder);
        acc[reportFolder] = getHtmlFiles(fullPath); // Add the folder and its HTML files
        return acc;
      }, {});
  } else {
    return "file";
  }
}

/**
 * Gets all `.html` files in a folder.
 * @param {string} folderPath - The folder path to scan.
 * @returns {object} - An object representing the `.html` files.
 */
function getHtmlFiles(folderPath) {
  const content = fs.readdirSync(folderPath);
  return content
    .filter((item) => item.endsWith(".html")) // Include only `.html` files
    .reduce((acc, file) => {
      acc[file] = "file"; // Store only the file name
      return acc;
    }, {});
}

// Traverse up to find the root folder (containing package.json)
function findRootFolder(currentDir) {
  while (!fs.existsSync(path.join(currentDir, "package.json"))) {
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      throw new Error("Root folder not found. package.json is missing.");
    }
    currentDir = parentDir;
  }
  return currentDir;
}

// Get the root folder
const rootFolder = findRootFolder(__dirname);
console.log("Root Folder:", rootFolder);

// Generate folder structure for '-report' folders
const folderStructure = readReportFolders(rootFolder);

// Write folder structure to a JSON file
fs.writeFileSync(
  path.join(__dirname, "folderStructure.json"), // Ensure it's written to the root folder
  JSON.stringify(folderStructure, null, 2)
);

console.log("Folder structure written to folderStructure.json");
