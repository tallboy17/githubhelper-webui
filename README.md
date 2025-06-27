# AI Assistant Backend

A configurable AI assistant backend with Express.js and support for a custom AI provider.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Required for Health Check
- `CUSTOM_AI_URL`: Base URL for your custom AI service (e.g., `https://api.your-ai-service.com`)
- `CUSTOM_AI_HEALTH_PATH`: Health check endpoint path (e.g., `/health`, `/status`, `/ping`)

### Optional
- `PORT`: Server port (default: 3000)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:3000)
- `AI_AGENT_PROVIDER`: AI provider name (default: custom)

## Example .env file
```
PORT=3000
FRONTEND_URL=http://localhost:3000
AI_AGENT_PROVIDER=custom
CUSTOM_AI_URL=https://api.your-ai-service.com
CUSTOM_AI_HEALTH_PATH=/health
```

## Supported AI Providers

- **Custom**: Default and only provider for custom AI services

## Health Check Endpoint

The `/api/health` endpoint now polls your custom AI service and returns the health status in the same format as the external service:

**Expected external service response format:**
```json
{
  "model": "gemini-2.0-flash",
  "status": "healthy",
  "timestamp": "2025-06-20T04:53:55.027489+00:00"
}
```

**Our endpoint response:**
```json
{
  "model": "gemini-2.0-flash",
  "status": "healthy",
  "timestamp": "2025-06-20T04:53:55.027489+00:00",
  "api": "healthy",
  "ai": {
    "status": "healthy",
    "model": "gemini-2.0-flash"
  }
}
```

## Installation

```bash
npm install
npm start
```

## Development

```bash
npm run dev
``` 