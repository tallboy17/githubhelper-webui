// services/aiService.js
const axios = require('axios');

class AIService {
    constructor() {
        this.provider = process.env.AI_AGENT_PROVIDER || 'custom';
        this.client = this.createCustomClient();
    }

    // Custom Client
    createCustomClient() {
        const baseURL = process.env.CUSTOM_AI_URL + process.env.CUSTOM_AI_CHAT_PATH;
        if (!process.env.CUSTOM_AI_URL || !process.env.CUSTOM_AI_CHAT_PATH || !/^https?:\/\//.test(process.env.CUSTOM_AI_URL)) {
            console.error('Invalid AI agent baseURL:', baseURL, '\nCheck CUSTOM_AI_URL and CUSTOM_AI_CHAT_PATH in your environment variables.');
        } else {
            console.log(baseURL);
        }

        const headers = {
            'Content-Type': 'application/json'
        };

        if (process.env.CUSTOM_AI_API_KEY) {
            headers['Authorization'] = `Bearer ${process.env.CUSTOM_AI_API_KEY}`;
        }

        return axios.create({
            baseURL,
            headers,
            timeout: 30000
        });
    }

    async sendCustomMessage(messages, options = {}) {
        console.log("Sending to Custom Message");
        console.log(messages);
        // Only keep user and assistant role messages (exclude system)
        const chatMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant');
        // Find the last user message as current_message
        let lastUserIdx = -1;
        for (let i = chatMessages.length - 1; i >= 0; i--) {
            if (chatMessages[i].role === 'user') {
                lastUserIdx = i;
                break;
            }
        }
        let current_message = null;
        let chat_history = [];
        if (lastUserIdx !== -1) {
            current_message = chatMessages[lastUserIdx];
            chat_history = chatMessages.slice(0, lastUserIdx).concat(chatMessages.slice(lastUserIdx + 1));
        } else {
            // fallback: no user message found
            chat_history = chatMessages;
        }
        // Always send valid JSON: current_message (if exists) and chat_history (always array)
        const payload = {};
        if (current_message) payload.current_message = current_message;
        payload.chat_history = Array.isArray(chat_history) ? chat_history : [];
        
        try {
            const response = await this.client.post('', payload);
            // Expecting response in the format:
            // {
            //   chat_history: [...],
            //   current_message: { content: '...', role: 'assistant' }
            // }
            const aiData = response.data;
            return {
                content: aiData.current_message?.content || aiData.content || aiData.message || aiData.response || '',
                tokensUsed: aiData.tokens || aiData.usage?.total_tokens || 0,
                model: aiData.model || 'custom',
                chat_history: aiData.chat_history || [],
                current_message: aiData.current_message || null
            };
        } catch (error) {
            throw this.handleError('Custom AI', error);
        }
    }

    // Main method to send messages
    async sendMessage(messages, options = {}) {
        try {
            switch (this.provider) {
                case 'custom':
                    console.log("Sending to Custom AI agent");
                    //console.log(messages);
                    console.log(options);
                    return await this.sendCustomMessage(messages, options);
                default:
                    throw new Error(`Unsupported provider: ${this.provider}`);
            }
        } catch (error) {
            console.error(`AI Service Error (${this.provider}):`, error.message);
            throw error;
        }
    }

    // Error handling
    handleError(provider, error) {
        const errorMessage = error.response?.data?.error?.message || 
                           error.response?.data?.message || 
                           error.message || 
                           'Unknown error';

        const statusCode = error.response?.status || 500;

        return new Error(`${provider} API Error (${statusCode}): ${errorMessage}`);
    }

    // Health check for the AI service
    async healthCheck() {
        try {
            const testMessages = [
                { role: 'user', content: 'Hello, are you working?' }
            ];

            const response = await this.sendMessage(testMessages, { maxTokens: 10 });
            
            return {
                status: 'healthy',
                provider: this.provider,
                responseReceived: !!response.content,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                provider: this.provider,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = new AIService();