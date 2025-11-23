/**
 * Generates a sanitized screenshot filename from the test name.
 * @param {string} testName - The full test name, possibly containing spaces and “ – …” suffix.
 * @returns {string} The cleaned string (first part before “ –”, spaces replaced by hyphens).
 */
export function generateScreenshotName(testName) {
  return `${testName.split(" -")[0].replaceAll(" ", "-")}`;
}
