

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import reportRoutes from "./routes/reportRoutes.js";
import notFound from "./middleware/notFoundMiddleware.js";
import errorHandler from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
console.log("JWT_SECRET loaded:", Boolean(process.env.JWT_SECRET));
console.log("Mongo URI loaded:", !!process.env.MONGO_URI);
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/api/auth", authRoutes);

// Frontend
app.use(express.static(path.join(__dirname, "../public")));

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "BugSnap server is running!",
        database: "Connected"
    });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Report APIs
app.use("/api/reports", reportRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Connect database before accepting requests
const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log("--------------------------------");
            console.log("BugSnap backend started!");
            console.log(`Server: http://localhost:${PORT}`);
            console.log("MongoDB: Connected");
            console.log("--------------------------------");
        });

    } catch (error) {
        console.error("Unable to start BugSnap:", error.message);
        process.exit(1);
    }
};

startServer();
