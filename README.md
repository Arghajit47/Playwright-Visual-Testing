# Visual Testing with Playwright, Looks-Same, AI-Powered [master branch edition]

## Overview

This project is an **AI-powered visual regression testing framework** built with Playwright. It captures screenshots of web pages or elements, compares them with baseline images to detect visual differences, and uses advanced AI models to automatically explain what changed and why. The primary objective is to ensure UI consistency across releases while providing intelligent, human-readable analysis of any visual differences detected.

---

## Table of Contents

1. [Key Features](#key-features)
2. [Why AI Integration?](#why-ai-integration)
3. [Technical Stack](#technical-stack)
4. [Setup Instructions](#setup-instructions)
5. [Folder Structure](#folder-structure)
6. [How It Works](#how-it-works)
7. [Running Tests](#running-tests)
8. [Report Generation](#report-generation)
9. [Best Practices](#best-practices)
10. [Common Issues](#common-issues)

---

## Key Features

✨ **Smart Visual Regression Testing:**

- Automated screenshot comparison with configurable mismatch threshold (default: 1%)
- Pixel-perfect comparison using `looks-same` library
- Cross-device testing matrix (Desktop Chrome + Mobile Pixel 5)
- Element-level and full-page screenshot capabilities

🤖 **AI-Powered Analysis:**

- Automatic visual diff explanation using Google Gemini 2.5 Pro & Anthropic Claude Sonnet 4.5
- Structured JSON reports with change locations, baseline/current state comparisons
- Human-readable descriptions of visual differences
- Intelligent image compression when payloads exceed 5MB

📊 **Comprehensive Reporting:**

- Playwright Pulse reports with interactive dashboards
- Allure reports with detailed test execution history
- Custom HTML reports with side-by-side comparisons
- Markdown and HTML AI analysis reports

🔄 **CI/CD Integration:**

- GitHub Actions workflows for PR and Push events
- Automated test execution on main/master branches
- Artifact storage and historical trend tracking
- Supabase integration for screenshot and database storage

📝 **Text Validation:**

- OCR text extraction using Tesseract.js
- Text diff reports for content changes
- Combined visual + text validation

---

## Why AI Integration?

### The Problem with Traditional Visual Testing

Traditional visual regression testing tools can tell you **THAT** something changed, but they can't tell you **WHAT** changed or **WHY** it matters. When a test fails, developers often face:

- Large diff images with highlighted pixels but no context
- Time-consuming manual analysis to understand the changes
- Difficulty distinguishing between critical bugs and harmless UI updates
- No guidance on whether the change is intentional or a regression

### How AI Solves This

Our AI integration transforms visual testing from a simple pass/fail system into an intelligent analysis tool:

**🎯 Precise Change Identification:**

- AI scans diff images to locate red/pink highlighted regions
- Identifies the exact UI component or area that changed
- Provides coordinates and descriptive locations (e.g., "Top-right corner", "Navigation bar")

**📋 Detailed State Comparison:**

- Analyzes the baseline image to describe the original state
- Examines the current image to describe the new state
- Generates side-by-side comparisons with context

**💡 Intelligent Explanations:**

```json
{
  "changes": [
    {
      "location": "Header navigation area",
      "baseline_state": "Blue button with white text 'Login'",
      "current_state": "Green button with white text 'Sign In'",
      "description": "Button color changed from blue to green and text updated from 'Login' to 'Sign In'"
    }
  ]
}
```

**⚡ Automatic Optimization:**

- Detects large image payloads (>5MB)
- Automatically compresses images using Sharp library
- Maintains visual quality while reducing API costs
- Logs compression metrics for transparency

**🔍 Multi-Modal Analysis:**

- Combines visual diff analysis with OCR text extraction
- Detects both visual and content changes
- Generates comprehensive reports covering all aspects

**🚀 Developer Productivity:**

- Reduces time spent analyzing test failures from minutes to seconds
- Provides actionable insights in human-readable format
- Helps distinguish between bugs and intentional changes
- Includes reports directly in CI/CD artifacts

### Supported AI Models

**Google Gemini 2.5 Pro:**

- Fast response times
- Native JSON output mode
- Cost-effective for high-volume testing
- Excellent at visual understanding

**Anthropic Claude Sonnet 4.5:**

- Superior reasoning capabilities
- Detailed contextual analysis
- Extended thinking for complex UIs
- Highly accurate change descriptions

The framework automatically selects the available AI provider based on your environment configuration.

---

## Technical Stack

**Testing Framework:**

- Playwright (v1.49+)
- looks-same (v10.0+) - Pixel-perfect image comparison
- Tesseract.js (v5.1+) - OCR text extraction

**AI & Machine Learning:**

- Google Gemini 2.5 Pro (@google/genai)
- Anthropic Claude Sonnet 4.5 (@anthropic-ai/sdk)

**Storage & Database:**

- Supabase - Cloud storage for screenshots and test data
- SQLite (better-sqlite3) - Local database for test history

**Image Processing:**

- Sharp - Image compression and optimization
- Jimp - Image manipulation and merging
- node-forge - Security utilities

**Reporting:**

- @arghajit/playwright-pulse-report - Interactive dashboards
- allure-playwright - Detailed test reports
- Custom HTML/Markdown generators

**DevOps:**

- GitHub Actions - CI/CD automation
- dotenv - Environment configuration
- fs-extra - Enhanced file operations

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

4. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:

   ```bash
   USE_AI=true
   GEMINI_API_KEY=your_gemini_api_key_here
   ANTHROPIC_API_KEY=your_claude_api_key_here

   SUPABASE_URL=your_supabase_url
   SUPABASE_TOKEN=your_supabase_token
   SUPABASE_BUCKET_NAME=your_bucket_name

   MISMATCH_THRESHOLD=1
   DEFAULT_WAIT_TIMEOUT=5000
   ```

   **Note:** You only need ONE AI provider (either Gemini OR Claude). The framework will automatically use whichever key is available.

---

## Folder Structure

```mermaid
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

### Workflow Overview

1.seline Cap **Bature:**

- First run captures baseline screenshots of specified pages or elements
- Stored in `screenshots/baseline/{desktop|mobile}/` folders
- Uploaded to Supabase for centralized storage
- Recorded in local SQLite database

1. **Smart Page Load:**

   - Custom `waitForPageReuncadytion ensu` fres page stability
   - Monitors network activity, DOM mutations, and animations
   - Eliminates flaky tests caused by incomplete page loads
   - Configurable timeout via `DEFAULT_WAIT_TIMEOUT`

2. **Screenshot Comparison:**

   - Captures current screenshot and compares against baseline
   - Uses `looks-same` library with anti-aliasing and caret ignore
   - Calculates pixel-level differences and mismatch percentage
   - Generates diff images with red highlights showing changes

3. **OCR Text Extraction:**

   - Tesseract.js extracts text from both baseline and current screenshots
   - Compares text content to detect textual changes
   - Generates text diff reports saved as `.txt` files
   - Helps identify content changes vs purely visual changes

4. **AI Analysis (When Enabled):**
   - If mismatch detected and `USE_AI=true`: - Checks imagen payload size (baseline + current + diff)
     - Automatically compresses images if payload exceeds 5MB
     - Sends images to AI provider (Gemini or Claude)
     - AI analyzes diff image to locate changed regions
     - AI compares baseline vs current states at those locations
     - Returns structured JSON with detailed change descriptions
5. **Report Generation:**

   - Creates merged ch image asnt | B(Curreeline | nerates - Ge AI Diff)
     triptyanalysis report in Markdown format
   - Converts to HTML report with styling
   - Attaches all reports to test results
   - Uploadartifacts to Supabass e

6. **Threshold Validation:**

   - Compares mismatch p against configercentageured threshold (default: 1%)
   - Test passes if mismatch < threshold
   - Test fails if mismatch ≥ threshols to database with status and image URLd
   - Los

7. **CI/CD Integgs resultration:**
   - GitHub Actions triggers on PR and Push to main/master
   - Runs parallel tests le
   - for Desktop results f and Mobie teMergesrunsrom multiplst
   - Uploads artifacts (screenshots, reports, database)
   - Generates Playwright Pulse and Allure reports

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

### 1. Baseline Management

- **Use Stable Baselines:** Ensure baseline images represent the expected, stable UI state
- **Version Control:** Consider storing baselines in Git for team-wide consistency
- **Regular Updates:** Update baselines when intentional UI changes are made
- **Separate by Device:** Maintain separate baselines for desktop and mobile viewports

### 2. Environment Consistency

- **Fixed Resolutions:** Always test in the same viewport sizes (configured in `playwright.config.js`)
- **Browser Versions:** Pit browsn Playwrigher versions in CI/CD
- **Font Rendering:** Ensure consistent font rendering across environments
- **Timezone & Locale:** Set consistent timezone/locale to avoid timestamp differences

### 3. Threshold Tuning

- **Default 1%:** Good starting point for most applications
- **Stricter (<0.5%):** For pixel-perfect UIs or design systems
- **Looser (2-5%):** For dynamic data-driven content
- **Per-Test Thresholds:** Configure different thresholds for different page types

### 4. AI Usage Optimization

- **Enable in CI:** Set `USE_AI=true` for automated analysis in pipelines
- **Choose Provider:** Use Gemini for speed/cost, Claude for accuracy
- **Monitor Costs:** Track API usage and set budget alerts
- **Disable Locally:** Set `USE_AI=false` for local development to save API calls

### 5. Performance Optn- **Parallel Executionkers` c:** U for fastse `wort runsnfigage Comer tesprn- \**Imn:*imizationssio\* Framework auto-compresses, but optimize screenshot size

- **Selective OCR:** OCR is expensive; use only when text validation is critical
- **Artifact Cleanup:** Regularly clean old screenshots to save storage

### 6. Test Design

- **Stable Selectors:** Use centralized selectors from `page-elements/` folder
- **Wait Strategies:** Leverage `waitForPageReady` for dynamic content
- **Element-Level Tests:** Prefer component screenshots over full-page for faster debugging
- **Tag Organization:** Use `@setupProject` for baselines, `@validation` for tests

## Common Issues

### AI Analysis Not Working

- Verify `USE_AI=true` in `.env`
- Check API keys are valid and have credits
- Ensure image payload doesn't exceed provider limits (auto-compression should handle this)
- Check console logs for compression status and API errors

### Flaky Tests

- Increase `DEFAULT_WAIT_TIMEOUT` for slower pages
- Use `waitForPageReady` instead of standard Playwright waits
- Check for animations or auto-playing videos
- Verify network requests are completing

### High Mismatch Percentages

- Check for dynamic content (timestamps, ads, random data)
- Verify font rendering consistency
- Look for anti-aliasing differences
- Consider increasing thresld orho masking dynamic regionsbase Upln

### Supoad Failures

- Verify Supabase credentials in `.env`
- Check bucket permissions and access settings
- Ensure bucket exists and is in the correct region
- Monitor Supabase storage quota

---

## Framework Improvements

For detailed information about recent improvements and architectural decisions, see [IMPROVEMENTS.md](./IMPROVEMENTS.md).

Key improvements include:

- Separated database concerns with dedicated service layer
- Environment-based configuration for flexibility
- Enhanced error handling and logging
- Configurable timeouts and thresholds
- AI-powered intelligent diff analysis
- Automatic image compression for large payloads
- Comprehensive reporting with multiple formats

---

## Resources

- [Playwright Documentation](https://playwright.dev)
- [looks-same Library](https://www.npmjs.com/package/looks-same)
- [Playwright Pulse Reporter](https://www.npmjs.com/package/@arghajit/playwright-pulse-report)
- [Allure Playwright](https://www.npmjs.com/package/allure-playwright)
- [Google Gemini AI](https://ai.google.dev/)
- [Anthropic Claude](https://www.anthropic.com/claude)
- [Supabase Documentation](https://supabase.com/docs)

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Add tests if applicable
5. Submit a pull request

---

## License

ISC License - See package.json for details
