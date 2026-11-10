
const errorHandler = (err, req, res, next) => {
    console.error(err);

    const statusCode = res.statusCode >= 400
        ? res.statusCode
        : 500;

    res.status(statusCode).json({
        success: false,
        message: statusCode === 500
            ? "Internal server error"
            : err.message
    });
};

export default errorHandler;
