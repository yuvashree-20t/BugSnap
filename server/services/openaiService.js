
import OpenAI from "openai";

// ==========================================
// BUGSNAP - OPENAI QA ANALYSIS SERVICE
// ==========================================

if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing from environment variables.");
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 120000,
    maxRetries: 2
});

const OPENAI_MODEL = "gpt-5.4-mini";

// ==========================================
// AI INSTRUCTIONS
// ==========================================

const BUG_ANALYSIS_PROMPT = `
You are BugSnap AI, a professional Senior Software
Quality Assurance Engineer.

Analyze the uploaded application screenshot and identify
up to FIVE independent, meaningful, visible software defects.

VISUAL INSPECTION:

Inspect the entire screenshot for:

- Incorrect alignment and positioning
- Inconsistent spacing and padding
- Typography and readability problems
- Broken or inconsistent buttons
- Form field and validation display issues
- Navigation problems visible in the screenshot
- Missing, cropped or overlapping content
- Icons and image display issues
- Poor contrast and visual hierarchy
- Responsive layout problems
- Visible error messages
- Inconsistent UI components

BUG IDENTIFICATION RULES:

1. Report only issues supported by visual evidence.
2. Identify up to five independent defects.
3. Do not invent bugs to reach five.
4. Do not report the same issue more than once.
5. Do not claim backend or API failures from a static image.
6. Do not assume functionality that cannot be verified.
7. If no clear defect exists, return an empty bugs array.
8. Explain each defect in professional QA terminology.

SEVERITY:

Critical: Severe application-wide failure, security issue,
or data-integrity problem supported by evidence.

High: Major visible feature failure.

Medium: Noticeable issue affecting normal usability.

Low: Minor visual or cosmetic issue.

PRIORITY:

High: Requires urgent investigation.

Medium: Should be addressed during normal development.

Low: Can be scheduled for later.

CATEGORY:

Choose one:
Functional, UI/UX, Performance, Security,
Compatibility, Other.

EXPECTED BEHAVIOR:

Describe a reasonable expected result only when
the intended behavior is sufficiently clear.
Otherwise state that confirmation is needed.

ACTUAL BEHAVIOR:

Describe exactly what is visible in the screenshot.

REPRODUCTION STEPS:

Give suggested investigation steps.
Never claim that you actually interacted with the application.

CONFIDENCE:

High: Clearly visible defect.
Medium: Likely defect, but additional context is useful.
Low: Uncertain finding requiring verification.

IMPORTANT:

Be accurate rather than generating unnecessary findings.
Do not invent technical causes.
Do not classify visual appearance as a security or
performance issue without supporting evidence.

Return the analysis using the exact JSON schema provided.
`;

// ==========================================
// STRUCTURED OUTPUT SCHEMA
// ==========================================

const BUG_ANALYSIS_SCHEMA = {
    type: "object",
    additionalProperties: false,

    properties: {
        analysisSummary: {
            type: "string"
        },

        totalBugs: {
            type: "integer"
        },

        bugs: {
            type: "array",
            items: {
                type: "object",
                additionalProperties: false,

                properties: {
                    bugNumber: {
                        type: "integer"
                    },

                    title: {
                        type: "string"
                    },

                    description: {
                        type: "string"
                    },

                    category: {
                        type: "string",
                        enum: [
                            "Functional",
                            "UI/UX",
                            "Performance",
                            "Security",
                            "Compatibility",
                            "Other"
                        ]
                    },

                    severity: {
                        type: "string",
                        enum: [
                            "Critical",
                            "High",
                            "Medium",
                            "Low"
                        ]
                    },

                    priority: {
                        type: "string",
                        enum: [
                            "High",
                            "Medium",
                            "Low"
                        ]
                    },

                    affectedComponent: {
                        type: "string"
                    },

                    expectedBehavior: {
                        type: "string"
                    },

                    actualBehavior: {
                        type: "string"
                    },

                    reproductionSteps: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },

                    observations: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },

                    confidence: {
                        type: "string",
                        enum: [
                            "High",
                            "Medium",
                            "Low"
                        ]
                    },

                    confidenceReason: {
                        type: "string"
                    }
                },

                required: [
                    "bugNumber",
                    "title",
                    "description",
                    "category",
                    "severity",
                    "priority",
                    "affectedComponent",
                    "expectedBehavior",
                    "actualBehavior",
                    "reproductionSteps",
                    "observations",
                    "confidence",
                    "confidenceReason"
                ]
            }
        },

        overallObservations: {
            type: "array",
            items: {
                type: "string"
            }
        },

        recommendations: {
            type: "array",
            items: {
                type: "string"
            }
        },

        needsManualVerification: {
            type: "boolean"
        }
    },

    required: [
        "analysisSummary",
        "totalBugs",
        "bugs",
        "overallObservations",
        "recommendations",
        "needsManualVerification"
    ]
};

// ==========================================
// SCREENSHOT ANALYSIS
// ==========================================

export async function analyzeScreenshot(imageBuffer, mimeType) {

    if (!imageBuffer || !imageBuffer.length) {
        throw new Error("Screenshot is missing or empty.");
    }

    const allowedMimeTypes = [
        "image/png",
        "image/jpeg",
        "image/webp"
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
        throw new Error("Unsupported screenshot format.");
    }

    console.log("\n==================================");
    console.log("BUGSNAP OPENAI ANALYSIS STARTED");
    console.log("Model:", OPENAI_MODEL);
    console.log("Image type:", mimeType);
    console.log("Image size:", imageBuffer.length, "bytes");
    console.log("==================================");

    try {

        const base64Image = imageBuffer.toString("base64");

        const imageDataUrl =
            `data:${mimeType};base64,${base64Image}`;

        const response = await openai.responses.create({

            model: OPENAI_MODEL,

            instructions: BUG_ANALYSIS_PROMPT,

            input: [
                {
                    role: "user",

                    content: [
                        {
                            type: "input_text",
                            text: "Analyze this screenshot and generate the QA bug report."
                        },

                        {
                            type: "input_image",
                            image_url: imageDataUrl,
                            detail: "high"
                        }
                    ]
                }
            ],

            text: {
                format: {
                    type: "json_schema",
                    name: "bugsnap_bug_analysis",
                    strict: true,
                    schema: BUG_ANALYSIS_SCHEMA
                }
            },

            max_output_tokens: 5000
        });

        console.log("OpenAI response received.");

        if (!response.output_text) {
            throw new Error("OpenAI returned an empty response.");
        }

        const analysis = JSON.parse(response.output_text);

        // ======================================
        // VALIDATE RESPONSE
        // ======================================

        if (!Array.isArray(analysis.bugs)) {
            throw new Error("Invalid AI response: bugs array missing.");
        }

        if (analysis.bugs.length > 5) {
            throw new Error("AI returned more than five bugs.");
        }

        if (analysis.totalBugs !== analysis.bugs.length) {
            throw new Error("AI bug count does not match its findings.");
        }

        if (
            !Array.isArray(analysis.overallObservations) ||
            !Array.isArray(analysis.recommendations)
        ) {
            throw new Error("Invalid AI analysis summary.");
        }

        // ======================================
        // LOG RESULTS
        // ======================================

        console.log("\n==================================");
        console.log("BUGSNAP OPENAI ANALYSIS COMPLETED");
        console.log("Total bugs:", analysis.totalBugs);

        analysis.bugs.forEach((bug) => {
            console.log("------------------------------");
            console.log("Bug:", bug.bugNumber);
            console.log("Title:", bug.title);
            console.log("Severity:", bug.severity);
            console.log("Priority:", bug.priority);
            console.log("Category:", bug.category);
            console.log("Confidence:", bug.confidence);
        });

        console.log("==================================");

        return analysis;

    } catch (error) {

        console.error("\n==================================");
        console.error("BUGSNAP OPENAI ANALYSIS FAILED");
        console.error("Message:", error.message);
        console.error("Status:", error.status);
        console.error("Code:", error.code);
        console.error("==================================");

        throw error;
    }
}
