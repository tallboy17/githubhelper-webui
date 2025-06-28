// Centralized configuration for the AI Assistant Backend

const config = {
  PORT: process.env.PORT || 3000,
  AI_AGENT_PROVIDER: process.env.AI_AGENT_PROVIDER || 'custom',
  CUSTOM_AI_URL: 'https://githubhelper-assistant.onrender.com',
  CUSTOM_AI_HEALTH_PATH: '/api/health',
  CUSTOM_AI_CHAT_PATH: '/api/chat',
  CUSTOM_AI_API_KEY: process.env.CUSTOM_AI_API_KEY,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/error.log',
  NODE_ENV: process.env.NODE_ENV,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 900000,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
};

module.exports = config; 