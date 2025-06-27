// middleware/logger.js
const { logger } = require('./errorHandler');

// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log request
    logger.info({
        type: 'request',
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const duration = Date.now() - start;
        
        logger.info({
            type: 'response',
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        originalEnd.call(this, chunk, encoding);
    };

    next();
};

module.exports = { requestLogger };