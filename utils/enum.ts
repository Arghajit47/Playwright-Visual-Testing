import { generateScreenshotName } from "./utility-page";

/** Root directory where all screenshots are stored. */
export const SCREENSHOT_DIR = "screenshots";

/** Directory containing the latest (current) test-run screenshots. */
export const CURRENT_DIR = `${SCREENSHOT_DIR}/current`;

/** Directory containing the reference (baseline) screenshots. */
export const BASELINE_DIR = `${SCREENSHOT_DIR}/baseline`;

/** Directory containing diff images highlighting pixel differences. */
export const DIFF_DIR = `${SCREENSHOT_DIR}/diff`;

/** Relative path to desktop baseline screenshots. */
export const BASELINE_DESKTOP_DIR = `baseline/desktop`;

/** Relative path to mobile baseline screenshots. */
export const BASELINE_MOBILE_DIR = `baseline/mobile`;

/** Relative path to desktop diff screenshots. */
export const DIFF_DESKTOP_DIR = `diff/desktop`;

/** Relative path to mobile diff screenshots. */
export const DIFF_MOBILE_DIR = `diff/mobile`;

/** Relative path to desktop current screenshots. */
export const CURRENT_DESKTOP_DIR = `current/desktop`;

/** Relative path to mobile current screenshots. */
export const CURRENT_MOBILE_DIR = `current/mobile`;

// Desktop View

/**
 * Constructs the absolute path for the current desktop screenshot.
 * @param testName - Unique identifier for the test case.
 * @returns Absolute path to the current desktop screenshot file.
 */
export const currentDesktopScreenshot = (testName: string) =>
  `${CURRENT_DIR}/desktop/${generateScreenshotName(testName)}-current.png`;

/**
 * Constructs the absolute path for the baseline desktop screenshot.
 * @param testName - Unique identifier for the test case.
 * @returns Absolute path to the baseline desktop screenshot file.
 */
export const baselineDesktopScreenshot = (testName: string) =>
  `${BASELINE_DIR}/desktop/${generateScreenshotName(testName)}-baseline.png`;

/**
 * Constructs the absolute path for the diff desktop screenshot.
 * @param testName - Unique identifier for the test case.
 * @returns Absolute path to the diff desktop screenshot file.
 */
export const diffDesktopScreenshot = (testName: string) =>
  `${DIFF_DIR}/desktop/${generateScreenshotName(testName)}-diff.png`;

// Mobile View

/**
 * Constructs the absolute path for the current mobile screenshot.
 * @param testName - Unique identifier for the test case.
 * @returns Absolute path to the current mobile screenshot file.
 */
export const currentMobileScreenshot = (testName: string) =>
  `${CURRENT_DIR}/mobile/${generateScreenshotName(testName)}-current.png`;

/**
 * Constructs the absolute path for the baseline mobile screenshot.
 * @param testName - Unique identifier for the test case.
 * @returns Absolute path to the baseline mobile screenshot file.
 */
export const baselineMobileScreenshot = (testName: string) =>
  `${BASELINE_DIR}/mobile/${generateScreenshotName(testName)}-baseline.png`;

/**
 * Constructs the absolute path for the diff mobile screenshot.
 * @param testName - Unique identifier for the test case.
 * @returns Absolute path to the diff mobile screenshot file.
 */
export const diffMobileScreenshot = (testName: string) =>
  `${DIFF_DIR}/mobile/${generateScreenshotName(testName)}-diff.png`;
