import { generateScreenshotName } from "./utility-page";

export const SCREENSHOT_DIR = "screenshots";
export const CURRENT_DIR = `${SCREENSHOT_DIR}/current`;
export const BASELINE_DIR = `${SCREENSHOT_DIR}/baseline`;
export const DIFF_DIR = `${SCREENSHOT_DIR}/diff`;
export const BASELINE_DESKTOP_DIR = `baseline/desktop`;
export const BASELINE_MOBILE_DIR = `baseline/mobile`;
export const DIFF_DESKTOP_DIR = `diff/desktop`;
export const DIFF_MOBILE_DIR = `diff/mobile`;
export const CURRENT_DESKTOP_DIR = `current/desktop`;
export const CURRENT_MOBILE_DIR = `current/mobile`;

// Desktop View
export const currentDesktopScreenshot = (testName: string) =>
  `${CURRENT_DIR}/desktop/${generateScreenshotName(testName)}-current.png`;
export const baselineDesktopScreenshot = (testName: string) =>
  `${BASELINE_DIR}/desktop/${generateScreenshotName(testName)}-baseline.png`;
export const diffDesktopScreenshot = (testName: string) =>
  `${DIFF_DIR}/desktop/${generateScreenshotName(testName)}-diff.png`;

// Mobile View
export const currentMobileScreenshot = (testName: string) =>
  `${CURRENT_DIR}/mobile/${generateScreenshotName(testName)}-current.png`;
export const baselineMobileScreenshot = (testName: string) =>
  `${BASELINE_DIR}/mobile/${generateScreenshotName(testName)}-baseline.png`;
export const diffMobileScreenshot = (testName: string) =>
  `${DIFF_DIR}/mobile/${generateScreenshotName(testName)}-diff.png`;
