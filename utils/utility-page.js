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

/**
 * Takes a JSON object of UI changes and generates a modern, responsive HTML report.
 *
 * To use:
 * 1. Define your JSON data (e.g., const data = { "changes": [...] };)
 * 2. Call the function: const htmlContent = generateHtmlReport(data);
 * 3. Output or save htmlContent to an .html file.
 *
 * @param {object} jsonData - The JSON object containing the 'changes' array.
 * @returns {string} The complete HTML report string.
 */
export function generateHtmlReport(jsonData) {
    if (!jsonData || !Array.isArray(jsonData.changes)) {
        return "<h1>Error: Invalid JSON data format.</h1>";
    }

    // Helper function for basic HTML escaping (important for user-provided data)
    const escapeHtml = (str) => {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    };

    const styles = `
        /* CSS Variables */
        :root {
            --primary-blue: #1c7cd6;
            --background-color: #f0f4f8;
            --card-background: #ffffff;
            --baseline-color: #e63946; /* Red for removed/old */
            --current-color: #2a9d8f; /* Teal for new/current */
            --text-color: #333d47;
            --border-color: #e1e8ed;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 30px;
            background-color: var(--background-color);
            color: var(--text-color);
            line-height: 1.6;
        }

        .report-container {
            max-width: 1200px;
            margin: 0 auto;
        }

        h1 {
            color: var(--primary-blue);
            font-size: 2.2em;
            margin-bottom: 25px;
            border-left: 5px solid var(--primary-blue);
            padding-left: 15px;
        }

        .change-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0 15px;
        }

        .change-row {
            background-color: var(--card-background);
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
            margin-bottom: 15px;
            overflow: hidden;
            display: table-row;
        }

        th, td {
            padding: 18px 20px;
            text-align: left;
            vertical-align: top;
            display: table-cell;
        }

        th {
            background-color: var(--primary-blue);
            color: white;
            font-weight: 600;
            font-size: 0.95em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .header-row th:first-child { border-top-left-radius: 8px; }
        .header-row th:last-child { border-top-right-radius: 8px; }

        .col-location {
            font-weight: 700;
            width: 18%;
        }

        .col-baseline {
            color: var(--baseline-color);
            background-color: #fef7f7;
            width: 28%;
            border-left: 3px solid var(--baseline-color);
            font-style: italic;
        }

        .col-current {
            color: var(--current-color);
            background-color: #f4fcfb;
            width: 28%;
            border-left: 3px solid var(--current-color);
            font-weight: 600;
        }
        
        .col-description {
            font-size: 0.9em;
            color: #5a6a7c;
            width: 26%;
        }

        /* Responsive Design */
        @media (max-width: 850px) {
            body { padding: 15px; }
            .change-table { display: block; }
            .header-row, th { display: none; }

            .change-row {
                display: block;
                margin-bottom: 25px;
                padding: 0;
            }

            td {
                display: block;
                width: auto !important;
                border-left: none !important;
                border-bottom: 1px dashed var(--border-color);
            }
            
            td:last-child { border-bottom: none; }

            td::before {
                content: attr(data-label);
                font-weight: bold;
                color: var(--primary-blue);
                display: block;
                margin-bottom: 5px;
                font-size: 0.9em;
            }
            
            .col-baseline, .col-current {
                background-color: transparent;
                padding-top: 10px;
                padding-bottom: 10px;
            }
        }
    `;

    let tableRows = jsonData.changes.map(change => {
        return `
                <tr class="change-row">
                    <td class="col-location" data-label="Location">${escapeHtml(change.location)}</td>
                    <td class="col-baseline" data-label="Baseline State">${escapeHtml(change.baseline_state)}</td>
                    <td class="col-current" data-label="Current State">${escapeHtml(change.current_state)}</td>
                    <td class="col-description" data-label="Description">${escapeHtml(change.description)}</td>
                </tr>
        `;
    }).join('\n');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modern UI Change Report</title>
    <style>
${styles}
    </style>
</head>
<body>

    <div class="report-container">
        <h1>UI Change Detection Report: Category Switch</h1>

        <table class="change-table">
            <thead>
                <tr class="header-row">
                    <th>Location</th>
                    <th>Baseline State (Old)</th>
                    <th>Current State (New)</th>
                    <th>Context / Description</th>
                </tr>
            </thead>
            <tbody>
${tableRows}
            </tbody>
        </table>

    </div>

</body>
</html>
    `;
}

/**
 * Takes a JSON object of UI changes and converts it into a standard Markdown table report.
 *
 * @param {object} jsonData - The JSON object containing the 'changes' array.
 * @returns {string} The Markdown formatted string.
 */
export function jsonToMarkdown(jsonData) {
  if (!jsonData || !Array.isArray(jsonData.changes)) {
    return "## Error: Invalid JSON data format.\n";
  }

  const changes = jsonData.changes;
  let markdown = "## UI Change Detection Report: Category Switch\n\n";

  const sanitizeCell = (text) => {
    if (!text) return "";
    return text
      .toString()
      .replace(/\|/g, "&#124;") // Escape pipes
      .replace(/\n/g, "<br>") // CRITICAL: Convert newlines to <br> so table doesn't break
      .trim();
  };

  markdown +=
    "| Location | Baseline State (Old) | Current State (New) | Description |\n";
  markdown += "| :--- | :--- | :--- | :--- |\n";

  changes.forEach((change) => {
    const location = sanitizeCell(change.location);
    const baseline = sanitizeCell(change.baseline_state);
    const current = sanitizeCell(change.current_state);
    const description = sanitizeCell(change.description);

    markdown += `| ${location} | ${baseline} | ${current} | ${description} |\n`;
  });

  return markdown;
}

/**
 * Extracts a clean JSON string from a Markdown response.
 * It removes ```json, ```, and surrounding whitespace.
 *
 * @param {string} fullResponse - The full text from the AI.
 * @returns {string|null} The clean JSON string ready for parsing.
 */
export function extractJsonString(fullResponse) {
  // Regex Explanation:
  // 1. ```             -> Matches opening backticks
  // 2. (?:json)?       -> Non-capturing group: allows "json" to exist, but doesn't capture it.
  // 3. \s*             -> Matches any whitespace/newlines after the opening tags.
  // 4. ([\s\S]*?)      -> THE TARGET: Captures everything inside (non-greedy).
  // 5. ```             -> Matches closing backticks
  const regex = /```(?:json)?\s*([\s\S]*?)\s*```/i;

  const match = fullResponse.match(regex);

  if (match && match[1]) {
    // Return the capture group, trimmed.
    return match[1].trim();
  }

  // FALLBACK:
  // Sometimes AI doesn't use backticks at all and just returns the JSON.
  // If no backticks found, check if the string itself starts with { and ends with }
  const trimmed = fullResponse.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  return null;
}

// ----------------------------------------------------------------------------
// INTERNAL STATE TRACKING
// ----------------------------------------------------------------------------
// We use a WeakMap to store active requests for each page instance separately.
const pageRequestTrackers = new WeakMap();

/**
 * 🛠️ SETUP FUNCTION
 * MUST be called once (e.g., in test.beforeEach) to start counting requests.
 * @param {import('@playwright/test').Page} page
 */
export function setupNetworkMonitoring(page) {
  if (pageRequestTrackers.has(page)) return; // Already tracking

  const requests = new Set();
  pageRequestTrackers.set(page, requests);

  page.on("request", (request) => {
    // Track APIs only (fetch/xhr). Add 'script' if needed.
    if (["xhr", "fetch"].includes(request.resourceType())) {
      requests.add(request);
    }
  });

  const removeRequest = (request) => {
    requests.delete(request);
  };

  page.on("requestfinished", removeRequest);
  page.on("requestfailed", removeRequest);
}

// ----------------------------------------------------------------------------
// 🚀 EXPORTED HELPER FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * 1. STRICT API WAITER
 * Waits until the tracked request count hits 0.
 * @param {import('@playwright/test').Page} page
 * @param {number} timeout Max wait time (default 15000ms)
 */
export async function waitForAllAPIs(page, timeout = 15000) {
  // Auto-setup if forgot (Warning: might miss requests that already started!)
  if (!pageRequestTrackers.has(page)) {
    console.warn("⚠️ waitForAllAPIs called without setupNetworkMonitoring. Some pending requests might be missed.");
    setupNetworkMonitoring(page);
  }

  const requests = pageRequestTrackers.get(page);

  try {
    const startTime = Date.now();
    
    while (requests.size > 0) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout waiting for APIs. Pending requests: ${requests.size}`);
      }
      // Poll every 100ms
      await new Promise((r) => setTimeout(r, 100));
    }

    // Safety buffer: Wait 200ms to ensure no chained requests fire immediately
    await page.waitForTimeout(200);
    
  } catch (error) {
    console.warn(`API Wait Warning: ${error.message}`);
  }
}

/**
 * 2. STRICT DOM STABILITY WAITER
 * Waits for the DOM to stop moving/changing for a specific duration.
 * Best for checking if UI is finished rendering after data load.
 * @param {import('@playwright/test').Page} page
 * @param {number} stabilityDuration How long the DOM must be silent to pass (default 500ms)
 * @param {number} timeout Max total wait time (default 15000ms)
 */
export async function waitForDOMStability(page, stabilityDuration = 500, timeout = 15000) {
  try {
    await page.evaluate(
      async ({ duration, maxWait }) => {
        return new Promise((resolve) => {
          let timer;
          
          const observer = new MutationObserver(() => {
            // DOM changed! Reset the stability timer.
            clearTimeout(timer);
            startTimer();
          });

          // Watch EVERYTHING: attributes, text, child nodes, sub-trees
          observer.observe(document.body, {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true,
          });

          const startTimer = () => {
            timer = setTimeout(() => {
              observer.disconnect();
              resolve(); // DOM is stable!
            }, duration);
          };

          // Failsafe: If animation never stops, resolve anyway after maxWait
          setTimeout(() => {
            observer.disconnect();
            console.warn("DOM stability timed out (page has constant animations). Proceeding.");
            resolve(); 
          }, maxWait);

          startTimer();
        });
      },
      { duration: stabilityDuration, maxWait: timeout }
    );
  } catch (e) {
    console.warn("Error waiting for DOM stability:", e);
  }
}

/**
 * 4. STRICT IMAGE LOAD WAITER
 * Waits for all images on the page to load or fail.
 * Best for ensuring images are ready for visual regression.
 * @param {import('@playwright/test').Page} page
 */
export async function waitForImagesToLoad(page) {
  try {
    await Promise.race([
      page.evaluate(async () => {
        const images = Array.from(document.querySelectorAll("img"));
        const promises = images.map((img) => {
          // FIX: Just check img.complete. 
          // It covers both success (loaded) and failure (broken/error).
          // In both cases, the network request is done.
            if (img.complete) {
              return Promise.resolve();
            }
            
            return new Promise((resolve) => {
              // If the image is still loading, wait for either result
              img.addEventListener("load", resolve);
              img.addEventListener("error", resolve); 
            });
          });
          await Promise.all(promises);
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 10000),
        ),
      ]);
    } catch (e) {
      console.warn(
        "Waiting for images timed out (or lazy-loaded images didn't trigger). Proceeding to screenshot.",
      );
    }
  }

  /**
 * 4. CSS ANIMATION WAITER (NEW)
 * Waits for any active CSS transitions or animations to finish.
 * Solves issues where a "Spinner" is spinning but the DOM is technically stable.
 */
export async function waitForAnimations(page, timeout = 15000) {
  try {
    await page.evaluate(async (maxWait) => {
      return new Promise((resolve) => {
        const checkAnimations = () => {
          // Get all animations on the document
          const animations = document.getAnimations();
          
          // Filter only running animations (ignore paused/finished)
          const running = animations.filter(a => a.playState === 'running');
          
          if (running.length === 0) {
            resolve();
          } else {
            // Check again in 100ms
            setTimeout(checkAnimations, 100);
          }
        };

        // Safety timeout
        setTimeout(resolve, maxWait);
        checkAnimations();
      });
    }, timeout);
  } catch (e) {
    console.warn("Error waiting for animations:", e);
  }
}

/**
 * 5. HEURISTIC LOADER WAITER (NEW)
 * Scans the page for common "Loading..." indicators or elements with aria-busy.
 * Prevents the test from proceeding if a generic loader is visible.
 */
export async function waitForCommonLoaders(page, timeout = 15000) {
  try {
    const loaderSelectors = [
      '[aria-busy="true"]',           // Standard accessibility attribute
      '.loader', '.spinner',          // Common class names
      '.loading', '.loading-bar',
      '[data-testid*="loading"]',
      '#loading'                      // Matches "The Internet" example specifically
    ];

    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      // Check if any standard loader is visible
      const isLoaderVisible = await page.evaluate((selectors) => {
        return selectors.some(selector => {
          const el = document.querySelector(selector);
          // Check if element exists AND is visible
          return el && (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0);
        });
      }, loaderSelectors);

      if (!isLoaderVisible) {
        break; // No loaders found, we are safe!
      }

      // If loader is found, wait 200ms and check again
      await page.waitForTimeout(200);
    }
  } catch (e) {
    console.warn("Error checking for common loaders:", e);
  }
}

/**
 * 3. MASTER WAIT FUNCTION
 * Combines API waiting, DOM stability and Img loading.
 * @param {import('@playwright/test').Page} page
 * @param {number} timeout Overall timeout for all wait operations (default 30000ms)
 */
export async function waitForPageReady(page, timeout = 30000) {
  try {
    await Promise.race([
      (async () => {
        await waitForAllAPIs(page);
        await waitForCommonLoaders(page);
        await waitForAnimations(page);
        await waitForDOMStability(page);
        await waitForImagesToLoad(page);
      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`waitForPageReady exceeded ${timeout}ms timeout`)), timeout)
      ),
    ]);
  } catch (error) {
    console.warn(`waitForPageReady: ${error.message}. Proceeding with test anyway.`);
  }
}
