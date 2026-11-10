
import mongoose from "mongoose";
import BugReport from "../models/BugReport.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

// GET ALL REPORTS BELONGING TO CURRENT USER
export const getReports = async (req, res, next) => {
    try {
        const reports = await BugReport.find({
            user: req.user._id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });

    } catch (error) {
        next(error);
    }
};

// GET SINGLE REPORT
export const getReportById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid report ID."
            });
        }

        const report = await BugReport.findOne({
            _id: id,
            user: req.user._id
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Bug report not found."
            });
        }

        res.status(200).json({
            success: true,
            data: report
        });

    } catch (error) {
        next(error);
    }
};

// CREATE REPORT
export const createReport = async (req, res, next) => {
    try {
        const {
            title,
            description,
            category,
            severity,
            priority,
            expectedBehavior,
            actualBehavior,
            reproductionSteps
        } = req.body;

        if (
            typeof description !== "string" ||
            description.trim().length < 10
        ) {
            return res.status(400).json({
                success: false,
                message: "Description must contain at least 10 characters."
            });
        }

        const report = await BugReport.create({
            user: req.user._id,

            title: typeof title === "string" && title.trim()
                ? title.trim()
                : description.trim().slice(0, 55),

            description,
            category,
            severity,
            priority,
            expectedBehavior,
            actualBehavior,
            reproductionSteps
        });

        res.status(201).json({
            success: true,
            message: "Bug report created successfully.",
            data: report
        });

    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        next(error);
    }
};

// UPDATE REPORT
export const updateReport = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid report ID."
            });
        }

        const allowedFields = [
            "title",
            "description",
            "category",
            "severity",
            "priority",
            "expectedBehavior",
            "actualBehavior",
            "reproductionSteps",
            "status"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (Object.hasOwn(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid update fields provided."
            });
        }

        const report = await BugReport.findOneAndUpdate(
            {
                _id: id,
                user: req.user._id
            },
            { $set: updates },
            {
                new: true,
                runValidators: true
            }
        );

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Bug report not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Bug report updated successfully.",
            data: report
        });

    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        next(error);
    }
};


export const deleteReport = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid report ID."
            });
        }

        const report = await BugReport.findOne({
            _id: id,
            user: req.user._id
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Bug report not found."
            });
        }

        // Delete screenshot from Cloudinary
        if (report.screenshotPublicId) {
            try {
                await cloudinary.uploader.destroy(
                    report.screenshotPublicId
                );
            } catch (imageError) {
                console.error(
                    "Cloudinary deletion failed:",
                    imageError.message
                );
            }
        }

        await report.deleteOne();

        res.status(200).json({
            success: true,
            message: "Bug report deleted successfully."
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// UPLOAD SCREENSHOT
// ==========================================

export const uploadScreenshot = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid report ID."
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a screenshot."
            });
        }

        const report = await BugReport.findOne({
            _id: id,
            user: req.user._id
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Bug report not found."
            });
        }

        // Upload buffer directly to Cloudinary
        const uploadToCloudinary = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "BugSnap/screenshots",
                        resource_type: "image"
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );

                Readable.from(buffer).pipe(stream);
            });
        };

        const uploadedImage = await uploadToCloudinary(
            req.file.buffer
        );

        // Delete previous screenshot after new upload succeeds
        const previousPublicId = report.screenshotPublicId;

        report.screenshotUrl = uploadedImage.secure_url;
        report.screenshotPublicId = uploadedImage.public_id;

        await report.save();

        if (previousPublicId) {
            try {
                await cloudinary.uploader.destroy(previousPublicId);
            } catch (deleteError) {
                console.error(
                    "Previous screenshot cleanup failed:",
                    deleteError.message
                );
            }
        }

        res.status(200).json({
            success: true,
            message: "Screenshot uploaded successfully.",
            data: {
                screenshotUrl: report.screenshotUrl,
                screenshotPublicId: report.screenshotPublicId
            }
        });

    } catch (error) {
        next(error);
    }
};


// ==========================================
// DELETE SCREENSHOT
// ==========================================

export const deleteScreenshot = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid report ID."
            });
        }

        const report = await BugReport.findOne({
            _id: id,
            user: req.user._id
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Bug report not found."
            });
        }

        if (report.screenshotPublicId) {
            await cloudinary.uploader.destroy(
                report.screenshotPublicId
            );
        }

        report.screenshotUrl = "";
        report.screenshotPublicId = "";

        await report.save();

        res.status(200).json({
            success: true,
            message: "Screenshot deleted successfully."
        });

    } catch (error) {
        next(error);
    }
};
