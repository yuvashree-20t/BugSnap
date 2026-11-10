
import multer from "multer";

const allowedMimeTypes = [
    "image/png",
    "image/jpeg",
    "image/webp"
];

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(
            new Error("Only PNG, JPG, JPEG and WEBP images are allowed.")
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
});

export default upload;
