
import express from "express";

import { analyzeBugScreenshot } from "../controllers/aiController.js";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
    "/analyze-screenshot",
    protect,
    upload.single("screenshot"),
    analyzeBugScreenshot
);

export default router;
