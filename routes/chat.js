// routes/chat.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const { v4: uuidv4 } = require('uuid');
const config = require('../services/config');

const router = express.Router();

// In-memory session storage (replace with database in production)
const sessions = new Map();

// POST /api/chat/message - Send a message to AI
router.post('/message', async (req, res) => {
    try {
        const {
            current_message,
            chat_history = []
        } = req.body;
       
        // Defensive check for current_message
        if (!current_message || typeof current_message !== 'object' || !current_message.role || !current_message.content) {
            return res.status(400).json({
                error: 'Invalid input: current_message is required and must have role and content.'
            });
        }

        // Prepare messages for AI (no system message)
        const aiMessages = [
            ...chat_history,
            current_message
        ];

       console.log("Current Message:" + JSON.stringify(aiMessages, null, 2));
        const aiResponse = await aiService.sendMessage(aiMessages);

        console.log("AI Response:" + JSON.stringify(aiResponse, null, 2));

        // Respond with just the AI response (no timestamp/responseTime)
        res.json({
            response: {
                role: 'assistant',
                content: aiResponse.content
            },
            metadata: {
                tokensUsed: aiResponse.tokensUsed,
                model: aiResponse.model
            }
        });

    } catch (error) {
        console.error('Chat route error:', error);
        res.status(500).json({
            error: 'Failed to process message',
            message: error.message
        });
    }
});

// GET /api/chat/session/:sessionId - Get session history
router.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = sessions.get(sessionId);

        if (!session) {
            return res.status(404).json({
                error: 'Session not found'
            });
        }

        res.json({
            conversation_id: session.id,
            messages: session.messages,
            context: {
                summary: session.summary,
                recent_messages: session.messages.slice(-10).map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            },
            metadata: {
                createdAt: session.createdAt,
                lastActivity: session.lastActivity,
                messageCount: session.messageCount,
                totalTokens: session.totalTokens
            }
        });

    } catch (error) {
        console.error('Session retrieval error:', error);
        res.status(500).json({
            error: 'Failed to retrieve session',
            message: error.message
        });
    }
});

// DELETE /api/chat/session/:sessionId - Clear session
router.delete('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const deleted = sessions.delete(sessionId);

        if (!deleted) {
            return res.status(404).json({
                error: 'Session not found'
            });
        }

        res.json({
            message: 'Session cleared successfully',
            conversation_id: sessionId
        });

    } catch (error) {
        console.error('Session deletion error:', error);
        res.status(500).json({
            error: 'Failed to clear session',
            message: error.message
        });
    }
});

// POST /api/chat/session/new - Create new session
router.post('/session/new', async (req, res) => {
    try {
        const conversationId = `conv_${uuidv4()}`;
        const session = {
            id: conversationId,
            messages: [],
            createdAt: new Date(),
            lastActivity: new Date(),
            messageCount: 0,
            totalTokens: 0,
            summary: 'New conversation started.'
        };

        sessions.set(conversationId, session);

        res.json({
            conversation_id: conversationId,
            context: {
                summary: session.summary,
                recent_messages: []
            },
            createdAt: session.createdAt
        });

    } catch (error) {
        console.error('Session creation error:', error);
        res.status(500).json({
            error: 'Failed to create session',
            message: error.message
        });
    }
});

// GET /api/chat/sessions - List all active sessions (admin)
router.get('/sessions', async (req, res) => {
    try {
        const sessionList = Array.from(sessions.values()).map(session => ({
            conversation_id: session.id,
            context: {
                summary: session.summary,
                recent_messages: session.messages.slice(-5).map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            },
            metadata: {
                createdAt: session.createdAt,
                lastActivity: session.lastActivity,
                messageCount: session.messageCount,
                totalTokens: session.totalTokens
            }
        }));

        res.json({
            conversations: sessionList,
            totalConversations: sessionList.length
        });

    } catch (error) {
        console.error('Sessions list error:', error);
        res.status(500).json({
            error: 'Failed to retrieve sessions',
            message: error.message
        });
    }
});

// GET /api/chat/health - Health check for AI service
router.get('/health', async (req, res) => {
    try {
        const healthStatus = await aiService.healthCheck();
        
        res.json({
            api: 'healthy',
            ai: healthStatus,
            sessions: {
                active: sessions.size,
                status: 'healthy'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            api: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/chat/config - Get current AI configuration (public info only)
router.get('/config', async (req, res) => {
    try {
        res.json({
            provider: aiService.provider,
            features: {
                sessionPersistence: true,
                rateLimiting: true,
                messageHistory: true,
                multiModel: true,
                conversationContext: true
            },
            limits: {
                maxMessageLength: 4000,
                maxTokens: 4000,
                maxSessionHistory: 20,
                rateLimit: {
                    window: config.RATE_LIMIT_WINDOW_MS || 900000,
                    maxRequests: config.RATE_LIMIT_MAX_REQUESTS || 100
                }
            }
        });
    } catch (error) {
        console.error('Config error:', error);
        res.status(500).json({
            error: 'Failed to get configuration',
            message: error.message
        });
    }
});

module.exports = router;