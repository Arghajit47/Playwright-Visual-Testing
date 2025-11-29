# Visual Testing with Playwright, Looks-Same [master branch edition]

## Overview
This project is designed to perform **visual regression testing** using Playwright. It captures screenshots of web pages or elements and compares them with baseline images to detect visual differences. The primary objective is to ensure the UI remains consistent across releases.

---

## Table of Contents
1. [Setup Instructions](#setup-instructions)
2. [Folder Structure](#folder-structure)
3. [How It Works](#how-it-works)
4. [Running Tests](#running-tests)
5. [Report Generation](#report-generation)
6. [Best Practices](#best-practices)
7. [Common Issues](#common-issues)

---

## Setup Instructions

### Prerequisites
- Node.js (v16 or above)
- Playwright installed globally or as a project dependency

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

3. Verify Playwright installation and dependencies:
   ```bash
   npx playwright install
   ```

---

## Folder Structure
```
|-- tests/
|   |-- visual-testing.spec.js  # Visual test cases
|
|-- utils/
|   |-- helper-function.page.js  # Helper functions for visual testing
|
|-- screenshots/
|   |-- baseline/               # Baseline images for comparison
|   |-- diff/                   # Images showing differences
|   |-- actual/                 # Actual screenshots captured during tests
|
|-- allure-report/
|   |-- index.html  # HTML report of visual test results
|
|-- package.json                # Project metadata and scripts
```

---

## How It Works
1. **Baseline Capture:**
   - The first run captures baseline screenshots of specified pages or elements.
   - These are stored in the `screenshots/baseline` folder.

2. **Comparison:**
   - Subsequent runs capture new screenshots and compare them against the baseline.
   - Any visual differences are stored in the `screenshots/diff` folder.

3. **Threshold:**
   - A mismatch threshold (e.g., `0.01` for 1%) is defined to allow minor acceptable deviations.

4. **Error Handling:**
   - Tests fail if the mismatch exceeds the defined threshold, and differences are logged.

---

## Running Tests

### Baseline Setup
To create baseline screenshots:
```bash
npx playwright test --grep @setup
```

### Visual Regression Tests
To run visual comparison tests:
```bash
npx playwright test --grep @test
```

---

## Report Generation

### Playwright HTML Report
1. Open the generated report:
   ```bash
   npx playwright show-report
   ```

### Allure Report (Optional)
To integrate with Allure:

1. Generate the report:
   ```bash
   npm run allure-test-report
   ```

---

## Best Practices
1. **Use Stable Baselines:**
   - Ensure baseline images are consistent and represent the expected UI.
2. **Environment Consistency:**
   - Run tests in the same resolution and browser to avoid false positives.
3. **Threshold Tuning:**
   - Adjust the mismatch threshold for acceptable deviations.

## Improvements
- **Component-wise screenshots:** Capture element-level images via `captureElementSpecificScreenshot` using centralized selectors from `page-elements/computers-page-elements.js`.
- **Deterministic comparisons:** Use `looks-same` with `ignoreAntialiasing`, `ignoreCaret`, and env-driven `MISMATCH_THRESHOLD` for consistent CI results.
- **Standardized paths & names:** Paths from `utils/enum.ts` and filenames from `generateScreenshotName` ensure desktop/mobile segregation and clean artifacts.
- **Baseline/validation workflow:** In `tests/DesktopView/visual-computers-element-page.spec.js`, use `@setupProject` to create baselines and `@validation` to compare and generate diffs.
- **Merged triptych diffs:** Combine current, baseline, and diff into one image via `mergeImages` for faster review; optional upload to Supabase for centralized storage.

---

## Common Issues
1. **False Positives:**
   - Caused by dynamic content like ads or animations. Use static mocks if possible.
2. **Mismatch Failures:**
   - Ensure the test environment matches the baseline capture environment.
3. **Error: `invalid comment length` in Merge Reports:**
   - Ensure all test results are valid before merging.

---

For further assistance, please refer to the official [Playwright Documentation](https://playwright.dev) [looks-same](https://www.npmjs.com/package/looks-same).

