
// ==========================================
// BUGSNAP - SCREENSHOT UPLOAD & OPENAI AI
// ==========================================

// ==========================================
// DOM ELEMENTS
// ==========================================

const screenshotInput = document.getElementById("screenshotInput");
const uploadZone = document.getElementById("uploadZone");
const imagePreview = document.getElementById("imagePreview");
const previewImage = document.getElementById("previewImage");
const removeImageButton = document.getElementById("removeImage");

let selectedScreenshot = null;
let previewObjectUrl = null;
let aiAnalysisInProgress = false;

// ==========================================
// CONFIGURATION
// ==========================================

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp"
];

const AI_ANALYSIS_ENDPOINT = "/api/ai/analyze-screenshot";

// ==========================================
// UI STYLES
// ==========================================

function addAIStyles() {
    if (document.getElementById("bugsnap-ai-styles")) return;

    const style = document.createElement("style");
    style.id = "bugsnap-ai-styles";

    style.textContent = `
        .ai-analysis-results {
            margin-top: 22px;
            width: 100%;
            color: #f1f1f8;
        }

        .ai-analysis-header {
            padding: 18px;
            border: 1px solid rgba(139, 92, 246, 0.25);
            border-radius: 12px;
            background: rgba(139, 92, 246, 0.08);
            margin-bottom: 16px;
        }

        .ai-analysis-header h3 {
            margin: 0 0 8px;
            font-size: 17px;
        }

        .ai-analysis-header p {
            margin: 0;
            color: #a5a5b8;
            font-size: 13px;
            line-height: 1.6;
        }

        .ai-bug-card {
            background: #171722;
            border: 1px solid #303044;
            border-radius: 12px;
            padding: 18px;
            margin-bottom: 14px;
        }

        .ai-bug-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 12px;
        }

        .ai-bug-number {
            font-size: 12px;
            color: #aaa5c0;
        }

        .ai-bug-card h4 {
            margin: 0 0 12px;
            font-size: 16px;
            line-height: 1.5;
            color: #ffffff;
        }

        .ai-bug-description {
            color: #c4c4d2;
            font-size: 13px;
            line-height: 1.7;
            margin-bottom: 16px;
        }

        .ai-bug-badges {
            display: flex;
            gap: 7px;
            flex-wrap: wrap;
        }

        .ai-bug-badge {
            padding: 5px 9px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            background: #29293a;
            color: #d8d8e8;
        }

        .ai-severity-critical,
        .ai-severity-high {
            color: #ff8585;
            background: rgba(239, 68, 68, 0.13);
        }

        .ai-severity-medium {
            color: #f5c46b;
            background: rgba(245, 158, 11, 0.13);
        }

        .ai-severity-low {
            color: #78d6a2;
            background: rgba(34, 197, 94, 0.13);
        }

        .ai-bug-section {
            border-top: 1px solid #303044;
            padding-top: 13px;
            margin-top: 13px;
        }

        .ai-bug-section h5 {
            margin: 0 0 7px;
            color: #b9a2ff;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: .5px;
        }

        .ai-bug-section p,
        .ai-bug-section li {
            color: #c7c7d5;
            font-size: 13px;
            line-height: 1.7;
        }

        .ai-bug-section ul,
        .ai-bug-section ol {
            padding-left: 20px;
            margin: 5px 0 0;
        }

        .ai-analysis-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 11px 17px;
            margin-top: 15px;
            border: 0;
            border-radius: 8px;
            background: linear-gradient(110deg, #7c3aed, #4f46e5);
            color: white;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            transition: opacity .2s ease;
        }

        .ai-analysis-button:hover {
            opacity: .88;
        }

        .ai-analysis-button:disabled {
            opacity: .55;
            cursor: not-allowed;
        }

        .ai-analysis-status {
            margin-top: 12px;
            font-size: 13px;
            color: #b9a2ff;
            line-height: 1.6;
        }

        .ai-analysis-status.error {
            color: #ff8585;
        }

        .ai-analysis-status.success {
            color: #78d6a2;
        }

        .ai-analysis-footer {
            margin-top: 14px;
            padding: 13px;
            border-radius: 8px;
            background: rgba(139, 92, 246, .07);
            color: #bcbcd0;
            font-size: 12px;
            line-height: 1.6;
        }
    `;

    document.head.appendChild(style);
}

// ==========================================
// TOAST / STATUS MESSAGE
// ==========================================

function showUploadMessage(message, type = "info") {
    let status = document.getElementById("uploadStatusMessage");

    if (!status) {
        status = document.createElement("div");
        status.id = "uploadStatusMessage";

        if (uploadZone) {
            uploadZone.insertAdjacentElement("afterend", status);
        } else {
            document.body.appendChild(status);
        }
    }

    status.textContent = message;
    status.className = `ai-analysis-status ${type}`;
}

// ==========================================
// FILE VALIDATION
// ==========================================

function validateScreenshot(file) {
    if (!file) {
        showUploadMessage("Please select a screenshot.", "error");
        return false;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        showUploadMessage(
            "Unsupported image format. Please use PNG, JPG or WEBP.",
            "error"
        );
        return false;
    }

    if (file.size > MAX_FILE_SIZE) {
        showUploadMessage(
            "Screenshot must be smaller than 5 MB.",
            "error"
        );
        return false;
    }

    return true;
}

// ==========================================
// IMAGE PREVIEW
// ==========================================

function displayImagePreview(file) {
    if (!file || !validateScreenshot(file)) return;

    selectedScreenshot = file;

    if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
    }

    previewObjectUrl = URL.createObjectURL(file);

    if (previewImage) {
        previewImage.src = previewObjectUrl;
    }

    if (imagePreview) {
        imagePreview.classList.remove("hidden");
        imagePreview.style.display = "block";
    }

    if (uploadZone) {
        uploadZone.classList.add("has-file");
    }

    showUploadMessage("Screenshot selected successfully.", "success");

    clearAIResults();
}

// ==========================================
// CLEAR IMAGE
// ==========================================

function clearImage() {
    selectedScreenshot = null;

    if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
    }

    if (screenshotInput) {
        screenshotInput.value = "";
    }

    if (previewImage) {
        previewImage.removeAttribute("src");
    }

    if (imagePreview) {
        imagePreview.classList.add("hidden");
        imagePreview.style.display = "none";
    }

    if (uploadZone) {
        uploadZone.classList.remove("has-file");
    }

    clearAIResults();
}

// ==========================================
// GET SELECTED FILE
// ==========================================

function getSelectedFile() {
    return selectedScreenshot;
}

// ==========================================
// FILE INPUT EVENT
// ==========================================

if (screenshotInput) {
    screenshotInput.addEventListener("change", (event) => {
        const file = event.target.files?.[0];

        if (file) {
            displayImagePreview(file);
        }
    });
}

// ==========================================
// REMOVE IMAGE BUTTON
// ==========================================

if (removeImageButton) {
    removeImageButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        clearImage();
    });
}

// ==========================================
// DRAG AND DROP
// ==========================================

if (uploadZone) {

    uploadZone.addEventListener("dragover", (event) => {
        event.preventDefault();
        uploadZone.classList.add("drag-over");
    });

    uploadZone.addEventListener("dragleave", () => {
        uploadZone.classList.remove("drag-over");
    });

    uploadZone.addEventListener("drop", (event) => {
        event.preventDefault();

        uploadZone.classList.remove("drag-over");

        const file = event.dataTransfer.files?.[0];

        if (!file) return;

        if (!validateScreenshot(file)) return;

        displayImagePreview(file);

        if (screenshotInput) {
            const transfer = new DataTransfer();
            transfer.items.add(file);
            screenshotInput.files = transfer.files;
        }
    });
}

// ==========================================
// UPLOAD SCREENSHOT TO CLOUDINARY
// ==========================================

async function uploadScreenshot(reportId, file) {

    if (!reportId || !file) {
        throw new Error("Report ID and screenshot are required.");
    }

    const formData = new FormData();
    formData.append("screenshot", file);

    const response = await authFetch(
        `/api/reports/${encodeURIComponent(reportId)}/screenshot`,
        {
            method: "POST",
            body: formData
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || "Screenshot upload failed."
        );
    }

    return result;
}

// ==========================================
// DELETE STORED SCREENSHOT
// ==========================================

async function deleteStoredScreenshot(reportId) {

    if (!reportId) {
        throw new Error("Report ID is required.");
    }

    const response = await authFetch(
        `/api/reports/${encodeURIComponent(reportId)}/screenshot`,
        {
            method: "DELETE"
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || "Screenshot deletion failed."
        );
    }

    return result;
}

// ==========================================
// FIND REPORT FORM FIELD
// ==========================================

function findReportField(fieldName) {

    const candidates = {
        title: [
            "reportTitle",
            "title",
            "titleInput"
        ],

        description: [
            "reportDescription",
            "description",
            "descriptionInput"
        ],

        category: [
            "reportCategory",
            "category",
            "categoryInput"
        ],

        severity: [
            "reportSeverity",
            "severity",
            "severityInput"
        ],

        priority: [
            "reportPriority",
            "priority",
            "priorityInput"
        ],

        expectedBehavior: [
            "expectedBehavior",
            "expectedBehaviorInput"
        ],

        actualBehavior: [
            "actualBehavior",
            "actualBehaviorInput"
        ],

        reproductionSteps: [
            "reproductionSteps",
            "reproductionStepsInput"
        ]
    };

    const ids = candidates[fieldName] || [];

    for (const id of ids) {
        const element = document.getElementById(id);

        if (element) return element;
    }

    return null;
}

// ==========================================
// FILL FORM WITH FIRST AI FINDING
// ==========================================

function fillReportFormWithAI(analysis) {

    if (!analysis || !Array.isArray(analysis.bugs)) {
        return;
    }

    const firstBug = analysis.bugs[0];

    if (!firstBug) {
        return;
    }

    const values = {
        title: firstBug.title,
        description: firstBug.description,
        category: firstBug.category,
        severity: firstBug.severity,
        priority: firstBug.priority,
        expectedBehavior: firstBug.expectedBehavior,
        actualBehavior: firstBug.actualBehavior,
        reproductionSteps: Array.isArray(firstBug.reproductionSteps)
            ? firstBug.reproductionSteps.join("\n")
            : ""
    };

    Object.entries(values).forEach(([fieldName, value]) => {

        const element = findReportField(fieldName);

        if (!element) return;

        element.value = value ?? "";

        element.dispatchEvent(
            new Event("input", { bubbles: true })
        );

        element.dispatchEvent(
            new Event("change", { bubbles: true })
        );
    });

    console.log("First AI finding copied into the report form.");
}

// ==========================================
// CREATE SAFE TEXT ELEMENT
// ==========================================

function createTextElement(tag, text, className = "") {

    const element = document.createElement(tag);

    element.textContent = text ?? "";

    if (className) {
        element.className = className;
    }

    return element;
}

// ==========================================
// CREATE AI SECTION
// ==========================================

function createAISection(title, content) {

    const section = document.createElement("div");
    section.className = "ai-bug-section";

    section.appendChild(
        createTextElement("h5", title)
    );

    if (Array.isArray(content)) {

        if (content.length === 0) {
            section.appendChild(
                createTextElement("p", "No additional details provided.")
            );
        } else {

            const list = document.createElement("ul");

            content.forEach((item) => {
                list.appendChild(
                    createTextElement("li", item)
                );
            });

            section.appendChild(list);
        }

    } else {

        section.appendChild(
            createTextElement("p", content || "Not specified.")
        );
    }

    return section;
}

// ==========================================
// CLEAR PREVIOUS AI RESULTS
// ==========================================

function clearAIResults() {

    const results = document.getElementById("aiAnalysisResults");

    if (results) {
        results.replaceChildren();
    }

    const status = document.getElementById("uploadStatusMessage");

    if (status) {
        status.textContent = "";
    }
}

// ==========================================
// RENDER AI ANALYSIS
// ==========================================

function renderAIAnalysis(analysis) {

    const results = document.getElementById("aiAnalysisResults");

    if (!results) return;

    results.replaceChildren();

    // Summary
    const header = document.createElement("div");
    header.className = "ai-analysis-header";

    header.appendChild(
        createTextElement("h3", "AI Screenshot Analysis")
    );

    header.appendChild(
        createTextElement(
            "p",
            analysis.analysisSummary || "Screenshot analysis completed."
        )
    );

    const count = createTextElement(
        "p",
        `Total bugs identified: ${analysis.totalBugs}`,
    );

    count.style.marginTop = "10px";
    count.style.fontWeight = "600";
    count.style.color = "#c4aaff";

    header.appendChild(count);
    results.appendChild(header);

    // No bugs
    if (analysis.bugs.length === 0) {

        const emptyCard = document.createElement("div");
        emptyCard.className = "ai-bug-card";

        emptyCard.appendChild(
            createTextElement(
                "h4",
                "No clear defects identified"
            )
        );

        emptyCard.appendChild(
            createTextElement(
                "p",
                "The AI could not establish a clear visual defect from this screenshot. Manual verification is recommended.",
                "ai-bug-description"
            )
        );

        results.appendChild(emptyCard);
    }

    // Individual bug cards
    analysis.bugs.forEach((bug, index) => {

        const card = document.createElement("article");
        card.className = "ai-bug-card";

        const top = document.createElement("div");
        top.className = "ai-bug-top";

        top.appendChild(
            createTextElement(
                "span",
                `BUG #${bug.bugNumber || index + 1}`,
                "ai-bug-number"
            )
        );

        const badges = document.createElement("div");
        badges.className = "ai-bug-badges";

        const severityClass =
            `ai-severity-${String(bug.severity).toLowerCase()}`;

        badges.appendChild(
            createTextElement(
                "span",
                bug.severity,
                `ai-bug-badge ${severityClass}`
            )
        );

        badges.appendChild(
            createTextElement(
                "span",
                `${bug.priority} Priority`,
                "ai-bug-badge"
            )
        );

        badges.appendChild(
            createTextElement(
                "span",
                bug.category,
                "ai-bug-badge"
            )
        );

        top.appendChild(badges);
        card.appendChild(top);

        card.appendChild(
            createTextElement("h4", bug.title)
        );

        card.appendChild(
            createTextElement(
                "p",
                bug.description,
                "ai-bug-description"
            )
        );

        card.appendChild(
            createAISection(
                "Affected Component",
                bug.affectedComponent
            )
        );

        card.appendChild(
            createAISection(
                "Expected Behavior",
                bug.expectedBehavior
            )
        );

        card.appendChild(
            createAISection(
                "Actual Behavior",
                bug.actualBehavior
            )
        );

        card.appendChild(
            createAISection(
                "Visual Evidence",
                bug.observations
            )
        );

        card.appendChild(
            createAISection(
                "Suggested Reproduction Steps",
                bug.reproductionSteps
            )
        );

        card.appendChild(
            createAISection(
                "AI Confidence",
                `${bug.confidence} - ${bug.confidenceReason}`
            )
        );

        results.appendChild(card);
    });

    // Overall observations
    if (analysis.overallObservations?.length) {
        results.appendChild(
            createAISection(
                "Overall Observations",
                analysis.overallObservations
            )
        );
    }

    // Recommendations
    if (analysis.recommendations?.length) {
        results.appendChild(
            createAISection(
                "Recommended Improvements",
                analysis.recommendations
            )
        );
    }

    // Manual verification notice
    if (analysis.needsManualVerification) {

        const footer = createTextElement(
            "div",
            "AI-generated findings are suggestions based on the screenshot. Verify each finding manually before submitting it as a confirmed bug.",
            "ai-analysis-footer"
        );

        results.appendChild(footer);
    }
}

// ==========================================
// ANALYZE SCREENSHOT WITH OPENAI
// ==========================================

async function analyzeScreenshotWithAI(file) {

    if (!file) {
        throw new Error("Please select a screenshot first.");
    }

    if (!validateScreenshot(file)) {
        throw new Error("Please select a valid screenshot.");
    }

    const formData = new FormData();

    formData.append("screenshot", file);

    const response = await authFetch(
        AI_ANALYSIS_ENDPOINT,
        {
            method: "POST",
            body: formData
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || "OpenAI screenshot analysis failed."
        );
    }

    if (!result.success || !result.data) {
        throw new Error(
            result.message || "Invalid AI analysis response."
        );
    }

    return result.data;
}

// ==========================================
// INITIALIZE AI ANALYSIS BUTTON
// ==========================================

function initializeAIAnalysisButton() {

    if (!uploadZone) {
        console.warn("BugSnap: Upload zone not found.");
        return;
    }

    addAIStyles();

    // Avoid creating duplicate buttons
    if (document.getElementById("analyzeWithAIButton")) {
        return;
    }

    const button = document.createElement("button");

    button.type = "button";
    button.id = "analyzeWithAIButton";
    button.className = "ai-analysis-button";
    button.textContent = "✨ Analyze Screenshot with AI";

    uploadZone.insertAdjacentElement("afterend", button);

    // Results panel
    const results = document.createElement("div");

    results.id = "aiAnalysisResults";
    results.className = "ai-analysis-results";

    button.insertAdjacentElement("afterend", results);

    button.addEventListener("click", async () => {

        if (aiAnalysisInProgress) return;

        const file = getSelectedFile();

        if (!file) {
            showUploadMessage(
                "Please upload a screenshot before starting AI analysis.",
                "error"
            );
            return;
        }

        aiAnalysisInProgress = true;

        button.disabled = true;
        button.textContent = "⏳ OpenAI is analyzing your screenshot...";

        clearAIResults();

        showUploadMessage(
            "OpenAI is inspecting the screenshot. This may take a little while.",
            "info"
        );

        try {

            const analysis = await analyzeScreenshotWithAI(file);

            renderAIAnalysis(analysis);

            if (analysis.bugs.length > 0) {
                fillReportFormWithAI(analysis);
            }

            showUploadMessage(
                `Analysis completed. ${analysis.totalBugs} bug(s) identified.`,
                "success"
            );

            console.log("OpenAI screenshot analysis:", analysis);

        } catch (error) {

            console.error("BugSnap AI error:", error);

            showUploadMessage(
                error.message || "AI analysis failed. Please try again.",
                "error"
            );

        } finally {

            aiAnalysisInProgress = false;

            button.disabled = false;
            button.textContent = "✨ Analyze Screenshot with AI";
        }
    });
}

// ==========================================
// INITIALIZE
// ==========================================

initializeAIAnalysisButton();

// ==========================================
// EXPOSE FUNCTIONS FOR OTHER FRONTEND FILES
// ==========================================

window.getSelectedFile = getSelectedFile;
window.clearImage = clearImage;
window.uploadScreenshot = uploadScreenshot;
window.deleteStoredScreenshot = deleteStoredScreenshot;
window.analyzeScreenshotWithAI = analyzeScreenshotWithAI;
window.fillReportFormWithAI = fillReportFormWithAI;
