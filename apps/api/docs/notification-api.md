# Notification Agent API

A LangGraph-powered agent that can send notifications to Home Assistant via natural language requests.

## Endpoint

**POST** `/api/notification/send`

## Request Body

```json
{
  "message": "Send a notification with title 'Alert' and message 'System update available'"
}
```

## Response

Success:

```json
{
  "success": true,
  "messages": [
    {
      "type": "human",
      "content": "Send a notification with title 'Alert' and message 'System update available'"
    },
    {
      "type": "ai",
      "content": "I'll send that notification for you."
    },
    {
      "type": "tool",
      "content": "{\"status\": 200, \"body\": {...}}"
    }
  ]
}
```

Error:

```json
{
  "success": false,
  "error": "Failed to process notification request",
  "message": "Error details..."
}
```

## Environment Variables

Ensure these are set before using the endpoint:

```bash
HA_NOTIFICATION_URL="https://your-home-assistant/api/services/notify/your_target"
HA_NOTIFICATION_TOKEN="your_long_lived_access_token"
```

## Example Usage

### cURL

```bash
curl -X POST http://localhost:3000/api/notification/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Send a notification titled Test with message Hello World"
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3000/api/notification/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message:
      'Send a notification titled Alert with message System update available',
  }),
})

const data = await response.json()
console.log(data)
```

## How It Works

1. The agent receives your natural language message
2. GPT-4 determines if it needs to call the `send_ha_notification` tool
3. If yes, it extracts the title and message from your request
4. The tool calls Home Assistant's API
5. Returns the conversation history including the tool result
