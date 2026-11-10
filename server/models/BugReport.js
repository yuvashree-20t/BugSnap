
import mongoose from "mongoose";

const bugReportSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },

        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 2000
        },

        category: {
            type: String,
            enum: [
                "Functional",
                "UI / UX",
                "Performance",
                "Security",
                "Compatibility",
                "Other"
            ],
            default: "Functional"
        },

        severity: {
            type: String,
            enum: ["Critical", "High", "Medium", "Low"],
            default: "Medium"
        },

        priority: {
            type: String,
            enum: ["High", "Medium", "Low"],
            default: "Medium"
        },

        expectedBehavior: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: ""
        },

        actualBehavior: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: ""
        },

        reproductionSteps: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: ""
        },

        screenshotUrl: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: ["Open", "In Progress", "Resolved"],
            default: "Open"
        },

        aiGenerated: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const BugReport = mongoose.model("BugReport", bugReportSchema);

export default BugReport;
