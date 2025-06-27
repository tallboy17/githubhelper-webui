// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const chatRoutes = require('./routes/chat');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve static files (your HTML UI)
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/chat', chatRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Construct the external AI service health URL
        const customAiUrl = process.env.CUSTOM_AI_URL;
        const customAiHealthPath = process.env.CUSTOM_AI_HEALTH_PATH;
        
        if (!customAiUrl || !customAiHealthPath) {
            return res.json({ 
                status: 'OK', 
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                ai_agent: process.env.AI_AGENT_PROVIDER || 'custom',
                error: 'CUSTOM_AI_URL or CUSTOM_AI_HEALTH_PATH not configured'
            });
        }

        // Construct the full health check URL
        const healthUrl = `${customAiUrl}${customAiHealthPath}`;
        
        // Poll the external AI service
        const response = await axios.get(healthUrl, {
            timeout: 5000 // 5 second timeout
        });

        if (response.status !== 200) {
            throw new Error(`External AI service responded with status: ${response.status}`);
        }

        const aiHealthData = response.data;
        
        // Return the external service response in the same format
        res.json({
            model: aiHealthData.model,
            status: aiHealthData.status,
            timestamp: aiHealthData.timestamp,
            api: 'healthy',
            ai: {
                status: aiHealthData.status,
                model: aiHealthData.model
            }
        });

    } catch (error) {
        //console.error('Health check failed:', error);
        res.json({ 
            status: 'error', 
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            ai_agent: process.env.AI_AGENT_PROVIDER || 'custom',
            error: error.message,
            api: 'healthy',
            ai: {
                status: 'unhealthy',
                error: error.message
            }
        });
    }
});

// Serve the main HTML file for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AI Assistant Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🤖 AI Provider: ${process.env.AI_AGENT_PROVIDER || 'custom'}`);
});

module.exports = app;