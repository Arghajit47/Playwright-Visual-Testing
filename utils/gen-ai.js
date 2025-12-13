import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import dotenv from "dotenv";
import { extractJsonString } from "./utility-page";

dotenv.config();

const geminiModel = "gemini-2.5-pro";

// Initialize the new Gen AI Client
// Ensure your API key is in your .env file as GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// Initialize Anthropic Client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // Ensure this is set in your .env
});

/**
 * Analyzes visual-regression results using Gemini 2.5 Pro.
 * The model is instructed to:
 * 1. Scan the diff image for highlighted (red/pink) regions.
 * 2. Compare the same regions in the baseline vs. current images.
 * 3. Return a JSON object containing a list of changes.
 *
 * @param {string} baselinePath - File path to the 'Expected' image
 * @param {string} currentPath - File path to the 'Actual' image
 * @param {string} diffPath    - File path to the 'Diff' image
 * @returns {Promise<Object|string>} JSON object with a "changes" array describing each detected change,
 *                                   a fallback message if no changes are found, or an error message if analysis fails.
 */
export async function explainVisualDiff(baselinePath, currentPath, diffPath) {
  try {
    // 1. Read files and convert to Base64
    const baselineB64 = fs.readFileSync(baselinePath, { encoding: "base64" });
    const currentB64 = fs.readFileSync(currentPath, { encoding: "base64" });
    const diffB64 = fs.readFileSync(diffPath, { encoding: "base64" });

    // 2. Define the exact same System Prompt logic
    const systemInstruction = `
      You are a Visual QA Analyst. Your job is to explain UI changes based on three inputs.
      
      **Input Images:**
      1. **Baseline**: The original, correct state.
      2. **Current**: The new, broken state.
      3. **Diff**: A guide map where RED/PINK pixels highlight changes.

      **Process (You MUST follow this strictly):**
      STEP 1: Scan the **Diff Image**. Find the largest red/highlighted regions.
      STEP 2: For each region found, "look" at the same coordinates in the **Baseline Image**. Describe what was there.
      STEP 3: "Look" at the same coordinates in the **Current Image**. Describe what is there now.
      STEP 4: Combine these observations into a single clear sentence.

      **Output Format:**
      Return a valid JSON object with a list of changes. Do not chat.
      {
        "changes": [
          {
            "location": "Top-right corner / Navigation Bar / Footer",
            "baseline_state": "Button was blue (#0055FF)",
            "current_state": "Button is now green (#00FF00)",
            "description": "The 'Submit' button changed color from blue to green."
          }
        ]
      }
    `;

    // 3. Call Gemini 2.5 Pro
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        temperature: 0,
        // Gemini has a specific setting to enforce JSON output
        responseMimeType: "application/json",
        systemInstruction: systemInstruction,
      },
      contents: [
        {
          role: "user",
          parts: [
            // Exact same interleaved labeling structure
            { text: "Image 1: BASELINE (Original)" },
            { inlineData: { mimeType: "image/png", data: baselineB64 } },

            { text: "Image 2: CURRENT (Actual)" },
            { inlineData: { mimeType: "image/png", data: currentB64 } },

            { text: "Image 3: DIFF (Red highlights changes)" },
            { inlineData: { mimeType: "image/png", data: diffB64 } },

            {
              text: "Analyze the Diff image to find changes, then compare Baseline vs Current at those specific spots. Output ONLY valid JSON.",
            },
          ],
        },
      ],
    });

    // 4. Parse JSON and Format Output (Identical to your Claude function)
    const textResponse = response.text();
    const textJsonResponse = extractJsonString(textResponse);

    try {
      const jsonResponse = JSON.parse(textJsonResponse);

      if (!jsonResponse.changes || jsonResponse.changes.length === 0) {
        return "No significant visual differences described by AI.";
      }

      // Convert JSON back to the readable bullet-list string
      return jsonResponse;
    } catch (parseError) {
      console.error("JSON Parse Failed:", parseError);
      return textResponse; // Fallback to raw text if parsing fails
    }
  } catch (error) {
    console.error("Gemini Vision Analysis Failed:", error.message);
    return `Error: AI Analysis failed. ${error.message}`;
  }
}

/**
 * Analyzes visual-regression results using Claude 4.5 Sonnet (claude-sonnet-4-5-20250929).
 *
 * The function implements a forced reasoning workflow:
 * 1. Scan the diff image to identify red/pink highlighted regions.
 * 2. Examine the baseline image at those coordinates to describe the original state.
 * 3. Examine the current image at the same coordinates to describe the new state.
 * 4. Generate a structured JSON output with detailed change information.
 *
 * @param {string} baselinePath - File path to the 'Expected' (original) image
 * @param {string} currentPath - File path to the 'Actual' (new) image
 * @param {string} diffPath - File path to the 'Diff' image with red highlights
 *
 * @returns {Promise<Object|string>} Returns a JSON object with structure:
 *   {
 *     "changes": [
 *       {
 *         "location": string,        // Where the change occurred (e.g., "Top-right corner")
 *         "baseline_state": string,  // Description of original state
 *         "current_state": string,   // Description of new state
 *         "description": string      // Human-readable summary of the change
 *       }
 *     ]
 *   }
 *   Falls back to raw text string if JSON parsing fails or returns error message on failure.
 *
 * @throws {Error} Logs error to console if Claude API call fails
 */
export async function explainVisualDiffWithClaude(
  baselinePath,
  currentPath,
  diffPath
) {
  try {
    const baselineB64 = fs.readFileSync(baselinePath, { encoding: "base64" });
    const currentB64 = fs.readFileSync(currentPath, { encoding: "base64" });
    const diffB64 = fs.readFileSync(diffPath, { encoding: "base64" });

    // --- KEY CHANGE: FORCED REASONING PROMPT ---
    const systemPrompt = `
      You are a Visual QA Analyst. Your job is to explain UI changes based on three inputs.
      
      **Input Images:**
      1. **Baseline**: The original, correct state.
      2. **Current**: The new, broken state.
      3. **Diff**: A guide map where RED/PINK pixels highlight changes.

      **Process (You MUST follow this strictly):**
      STEP 1: Scan the **Diff Image**. Find the largest red/highlighted regions.
      STEP 2: For each region found, "look" at the same coordinates in the **Baseline Image**. Describe what was there.
      STEP 3: "Look" at the same coordinates in the **Current Image**. Describe what is there now.
      STEP 4: Combine these observations into a single clear sentence.

      **Output Format:**
      Return a JSON object with a list of changes. Do not chat.
      {
        "changes": [
          {
            "location": "Top-right corner / Navigation Bar / Footer",
            "baseline_state": "Button was blue (#0055FF)",
            "current_state": "Button is now green (#00FF00)",
            "description": "The 'Submit' button changed color from blue to green."
          }
        ]
      }
    `;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929", // Or your preferred robust model
      max_tokens: 1500,
      temperature: 0, // Deterministic results
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            // We label the images clearly in the content block
            { type: "text", text: "Image 1: BASELINE (Original)" },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: baselineB64,
              },
            },
            { type: "text", text: "Image 2: CURRENT (Actual)" },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: currentB64,
              },
            },
            { type: "text", text: "Image 3: DIFF (Red highlights changes)" },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: diffB64,
              },
            },
            {
              type: "text",
              text: "Analyze the Diff image to find changes, then compare Baseline vs Current at those specific spots. Output ONLY valid JSON.",
            },
          ],
        },
      ],
    });

    // Parse JSON to get the clean description or return the raw text if preferred
    const textResponse = message.content[0].text;
    try {
      const textJsonResponse = extractJsonString(textResponse);
      const jsonResponse = JSON.parse(textJsonResponse);
      // Convert JSON back to a readable string for your report
      return jsonResponse;
    } catch (e) {
      return textResponse; // Fallback if AI didn't output perfect JSON
    }
  } catch (error) {
    console.error("Claude Vision Analysis Failed:", error);
    return `Error: AI Analysis failed. ${error.message}`;
  }
}
