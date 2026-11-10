
import express from "express";

import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
    getReports,
    getReportById,
    createReport,
    updateReport,
    deleteReport,
    uploadScreenshot,
    deleteScreenshot
} from "../controllers/reportController.js";

const router = express.Router();

// All report routes require authentication
router.use(protect);

router.route("/")
    .get(getReports)
    .post(createReport);

router.route("/:id")
    .get(getReportById)
    .put(updateReport)
    .delete(deleteReport);

// Screenshot routes
router.post(
    "/:id/screenshot",
    upload.single("screenshot"),
    uploadScreenshot
);

router.delete(
    "/:id/screenshot",
    deleteScreenshot
);

export default router;
