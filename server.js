// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const chatRoutes = require('./routes/chat');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const config = require('./services/config');

const app = express();
const PORT = config.PORT;

// Middleware
app.use(cors({
    origin: config.FRONTEND_URL,
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
        const customAiUrl = config.CUSTOM_AI_URL;
        const customAiHealthPath = config.CUSTOM_AI_HEALTH_PATH;
        if (!customAiUrl || !customAiHealthPath) {
            return res.json({ 
                status: 'OK', 
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                ai_agent: config.AI_AGENT_PROVIDER,
                error: 'CUSTOM_AI_URL or CUSTOM_AI_HEALTH_PATH not configured'
            });
        }
        const healthUrl = `${customAiUrl}${customAiHealthPath}`;
        const response = await axios.get(healthUrl, {
            timeout: 5000
        });
        if (response.status !== 200) {
            throw new Error(`External AI service responded with status: ${response.status}`);
        }
        const aiHealthData = response.data;
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
        res.json({ 
            status: 'error', 
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            ai_agent: config.AI_AGENT_PROVIDER,
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
    console.log(`🤖 AI Provider: ${config.AI_AGENT_PROVIDER}`);
});

module.exports = app;