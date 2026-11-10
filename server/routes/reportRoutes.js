
import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
    getReports,
    getReportById,
    createReport,
    updateReport,
    deleteReport
} from "../controllers/reportController.js";

const router = express.Router();

// Every report route requires authentication
router.use(protect);

router.route("/")
    .get(getReports)
    .post(createReport);

router.route("/:id")
    .get(getReportById)
    .put(updateReport)
    .delete(deleteReport);

export default router;
