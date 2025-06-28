// middleware/errorHandler.js
const winston = require('winston');
const config = require('../services/config');

// Configure Winston logger
const logger = winston.createLogger({
    level: config.LOG_LEVEL,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'ai-assistant-api' },
    transports: [
        new winston.transports.File({ 
            filename: config.LOG_FILE, 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: config.LOG_FILE.replace('error.log', 'combined.log') 
        })
    ],
});

// Add console transport for development
if (config.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error({
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });

    // Default error
    let message = 'Server Error';
    let statusCode = 500;

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        message = 'Resource not found';
        statusCode = 404;
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        message = 'Duplicate field value entered';
        statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        message = Object.values(err.errors).map(val => val.message).join(', ');
        statusCode = 400;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        message = 'Invalid token';
        statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
        message = 'Token expired';
        statusCode = 401;
    }

    // Rate limit errors
    if (err.type === 'entity.too.large') {
        message = 'Request payload too large';
        statusCode = 413;
    }

    // AI service specific errors
    if (err.message && err.message.includes('API Error')) {
        statusCode = 502; // Bad Gateway
        message = 'AI service temporarily unavailable';
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(config.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = { errorHandler, logger };