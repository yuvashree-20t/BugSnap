
import { analyzeScreenshot } from "../services/openaiService.js";

// ==========================================
// BUGSNAP - OPENAI AI CONTROLLER
// ==========================================

export const analyzeBugScreenshot = async (req, res) => {

    console.log("\n======================================");
    console.log("BUGSNAP OPENAI ANALYSIS REQUEST");
    console.log("======================================");

    try {

        // ======================================
        // 1. VALIDATE UPLOADED SCREENSHOT
        // ======================================

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a screenshot before analysis."
            });
        }

        const allowedTypes = [
            "image/png",
            "image/jpeg",
            "image/webp"
        ];

        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: "Unsupported image format. Use PNG, JPG or WEBP."
            });
        }

        if (!req.file.buffer || req.file.size === 0) {
            return res.status(400).json({
                success: false,
                message: "The uploaded screenshot is empty."
            });
        }

        console.log("Screenshot received successfully.");
        console.log("File type:", req.file.mimetype);
        console.log("File size:", req.file.size, "bytes");

        // ======================================
        // 2. SEND SCREENSHOT TO OPENAI
        // ======================================

        console.log("Sending screenshot to OpenAI...");

        const analysis = await analyzeScreenshot(
            req.file.buffer,
            req.file.mimetype
        );

        // ======================================
        // 3. VALIDATE AI RESPONSE
        // ======================================

        if (!analysis || typeof analysis !== "object") {
            throw new Error("OpenAI returned an invalid analysis.");
        }

        if (!Array.isArray(analysis.bugs)) {
            throw new Error("AI response does not contain a valid bugs array.");
        }

        if (analysis.bugs.length > 5) {
            throw new Error("AI returned more than five bug findings.");
        }

        if (analysis.totalBugs !== analysis.bugs.length) {
            throw new Error("AI returned an incorrect bug count.");
        }

        if (
            typeof analysis.analysisSummary !== "string" ||
            !Array.isArray(analysis.overallObservations) ||
            !Array.isArray(analysis.recommendations) ||
            typeof analysis.needsManualVerification !== "boolean"
        ) {
            throw new Error("AI analysis response is incomplete.");
        }

        // ======================================
        // 4. SUCCESS RESPONSE
        // ======================================

        console.log("\nOpenAI analysis completed successfully.");
        console.log("Total bugs identified:", analysis.totalBugs);

        analysis.bugs.forEach((bug, index) => {
            console.log("--------------------------------");
            console.log(`Bug ${index + 1}:`, bug.title);
            console.log("Severity:", bug.severity);
            console.log("Priority:", bug.priority);
            console.log("Category:", bug.category);
        });

        console.log("======================================");

        return res.status(200).json({
            success: true,
            message: "Screenshot analyzed successfully.",
            data: analysis
        });

    } catch (error) {

        // ======================================
        // 5. ERROR HANDLING
        // ======================================

        console.error("\n======================================");
        console.error("BUGSNAP OPENAI CONTROLLER ERROR");
        console.error("Error:", error.message);
        console.error("Status:", error.status);
        console.error("Code:", error.code);
        console.error("======================================");

        const status = error.status || error.statusCode;

        if (status === 400) {
            return res.status(400).json({
                success: false,
                message: "OpenAI could not process this screenshot. Please check the image and try again."
            });
        }

        if (status === 401 || status === 403) {
            return res.status(502).json({
                success: false,
                message: "OpenAI authentication failed. Please check the server API configuration."
            });
        }

        if (status === 429) {
            return res.status(429).json({
                success: false,
                message: "OpenAI rate limit or API quota reached. Please try again later."
            });
        }

        if (status === 503 || status === 502) {
            return res.status(503).json({
                success: false,
                message: "OpenAI is temporarily unavailable. Please try again shortly."
            });
        }

        if (status === 404) {
            return res.status(502).json({
                success: false,
                message: "The configured OpenAI model or API endpoint is unavailable."
            });
        }

        if (
            error.name === "APIConnectionTimeoutError" ||
            error.code === "ETIMEDOUT"
        ) {
            return res.status(504).json({
                success: false,
                message: "AI analysis took too long. Please try again."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to analyze screenshot. Please try again."
        });
    }
};
