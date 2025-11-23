export function generateScreenshotName(testName) {
  return `${testName.split(" -")[0].replace(" ", "-")}`;
}
