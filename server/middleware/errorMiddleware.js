
import multer from "multer";

const errorHandler = (error, req, res, next) => {
    console.error("Server error:", error);

    if (error instanceof multer.MulterError) {
        const message = error.code === "LIMIT_FILE_SIZE"
            ? "Screenshot must be 5 MB or smaller."
            : "Screenshot upload limit exceeded.";

        return res.status(400).json({
            success: false,
            message
        });
    }

    if (
        error.message &&
        error.message.startsWith("Only PNG")
    ) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.statusCode
            ? error.message
            : "Internal server error."
    });
};

export default errorHandler;
