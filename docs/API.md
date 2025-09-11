# 🌐 Right API - Complete API Reference

## 📋 Table of Contents

- [Authentication](#-authentication)
- [MCP Protocol](#-mcp-protocol)
- [REST API](#-rest-api)
- [WebSocket API](#-websocket-api)
- [Plugin API](#-plugin-api)
- [Workflow API](#-workflow-api)
- [Error Handling](#-error-handling)
- [Rate Limiting](#-rate-limiting)

## 🔐 Authentication

### OAuth 2.1 Flow

Right API uses OAuth 2.1 with PKCE for secure authentication.

#### Authorization Endpoint
```http
GET /oauth/authorize
```

**Parameters:**
```javascript
{
  "client_id": "string",
  "response_type": "code",
  "redirect_uri": "string",
  "scope": "string",
  "state": "string",
  "code_challenge": "string",
  "code_challenge_method": "S256"
}
```

#### Token Exchange
```http
POST /oauth/token
```

**Request:**
```json
{
  "grant_type": "authorization_code",
  "code": "string",
  "redirect_uri": "string",
  "client_id": "string",
  "code_verifier": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "string",
  "scope": "string"
}
```

### Token Usage

Include the access token in requests:

```http
Authorization: Bearer <access_token>
```

## 🔌 MCP Protocol

### Tool Discovery

```http
POST /
Content-Type: application/json
```

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "slack_send_message",
        "description": "Send a message to a Slack channel",
        "inputSchema": {
          "type": "object",
          "properties": {
            "channel": {"type": "string"},
            "text": {"type": "string"}
          },
          "required": ["channel", "text"]
        }
      }
    ]
  }
}
```

### Tool Execution

```http
POST /
Content-Type: application/json
```

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "slack_send_message",
    "arguments": {
      "channel": "#general",
      "text": "Hello from Right API!"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Message sent successfully to #general"
      }
    ]
  }
}
```

## 🌐 REST API

### Gateway Management

#### Get Gateway Status
```http
GET /api/v1/gateway/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 86400,
  "plugins": {
    "loaded": 5,
    "active": 3
  },
  "workflows": {
    "total": 12,
    "active": 8
  }
}
```

#### List Available Plugins
```http
GET /api/v1/plugins
Authorization: Bearer <token>
```

**Response:**
```json
{
  "plugins": [
    {
      "id": "slack",
      "name": "Slack Integration",
      "version": "1.2.0",
      "status": "active",
      "tools": 8,
      "description": "Complete Slack workspace integration"
    }
  ]
}
```

### Plugin Management

#### Install Plugin
```http
POST /api/v1/plugins/install
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "packageName": "@right-api/github-plugin",
  "version": "latest",
  "config": {
    "apiKey": "ghp_xxxxxxxxxxxx",
    "organization": "my-org"
  }
}
```

**Response:**
```json
{
  "success": true,
  "plugin": {
    "id": "github",
    "version": "1.0.0",
    "status": "installing"
  },
  "installId": "install_123456"
}
```

#### Plugin Configuration
```http
PUT /api/v1/plugins/{pluginId}/config
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "config": {
    "apiKey": "new_api_key",
    "timeout": 30000,
    "retries": 3
  }
}
```

### Workflow Management

#### Create Workflow
```http
POST /api/v1/workflows
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Support Ticket Automation",
  "description": "Automate support ticket processing",
  "trigger": {
    "type": "webhook",
    "config": {
      "path": "/support-webhook"
    }
  },
  "steps": [
    {
      "id": "classify",
      "plugin": "ai",
      "action": "classify_text",
      "config": {
        "categories": ["bug", "feature", "question"]
      }
    },
    {
      "id": "create_issue",
      "plugin": "github",
      "action": "create_issue",
      "condition": "classify.result === 'bug'",
      "config": {
        "repository": "backend",
        "labels": ["bug", "automated"]
      }
    }
  ]
}
```

**Response:**
```json
{
  "id": "workflow_123",
  "name": "Support Ticket Automation",
  "status": "created",
  "webhookUrl": "https://gateway.right-api.com/webhooks/workflow_123",
  "createdAt": "2025-07-07T18:00:00Z"
}
```

#### Execute Workflow
```http
POST /api/v1/workflows/{workflowId}/execute
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "input": {
    "text": "The login button doesn't work on mobile",
    "user": "user@example.com"
  },
  "context": {
    "requestId": "req_123"
  }
}
```

**Response:**
```json
{
  "executionId": "exec_456",
  "status": "running",
  "startedAt": "2025-07-07T18:05:00Z",
  "steps": [
    {
      "id": "classify",
      "status": "completed",
      "result": {
        "category": "bug",
        "confidence": 0.95
      }
    },
    {
      "id": "create_issue",
      "status": "running"
    }
  ]
}
```

## 🔌 WebSocket API

### Real-time Events

Connect to WebSocket for real-time updates:

```javascript
const ws = new WebSocket('wss://gateway.right-api.com/ws');

// Authentication
ws.send(JSON.stringify({
  type: 'auth',
  token: 'Bearer <access_token>'
}));

// Subscribe to events
ws.send(JSON.stringify({
  type: 'subscribe',
  events: ['workflow.execution', 'plugin.status']
}));
```

### Event Types

#### Workflow Execution Events
```json
{
  "type": "workflow.execution.started",
  "data": {
    "workflowId": "workflow_123",
    "executionId": "exec_456",
    "startedAt": "2025-07-07T18:05:00Z"
  }
}
```

```json
{
  "type": "workflow.execution.step.completed",
  "data": {
    "workflowId": "workflow_123",
    "executionId": "exec_456",
    "stepId": "classify",
    "result": {
      "category": "bug",
      "confidence": 0.95
    }
  }
}
```

#### Plugin Status Events
```json
{
  "type": "plugin.status.changed",
  "data": {
    "pluginId": "slack",
    "status": "active",
    "previousStatus": "installing"
  }
}
```

## 🔧 Plugin API

### Plugin Interface

```typescript
interface MCPPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  
  // Plugin lifecycle
  initialize(config: PluginConfig): Promise<void>;
  cleanup(): Promise<void>;
  
  // Tool definitions
  getTools(): MCPTool[];
  
  // Tool execution
  executeTool(name: string, args: any): Promise<MCPResult>;
  
  // Health checks
  healthCheck(): Promise<HealthStatus>;
}
```

### Tool Definition

```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema?: JSONSchema;
  examples?: ToolExample[];
  category?: string;
  tags?: string[];
}
```

### Example Plugin Implementation

```typescript
export class SlackPlugin implements MCPPlugin {
  id = 'slack';
  name = 'Slack Integration';
  version = '1.0.0';
  description = 'Complete Slack workspace integration';

  private client: SlackAPI;

  async initialize(config: PluginConfig) {
    this.client = new SlackAPI(config.apiToken);
    await this.client.test();
  }

  getTools(): MCPTool[] {
    return [
      {
        name: 'slack_send_message',
        description: 'Send a message to a Slack channel',
        inputSchema: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Channel name or ID' },
            text: { type: 'string', description: 'Message text' }
          },
          required: ['channel', 'text']
        }
      }
    ];
  }

  async executeTool(name: string, args: any): Promise<MCPResult> {
    switch (name) {
      case 'slack_send_message':
        const result = await this.client.chat.postMessage({
          channel: args.channel,
          text: args.text
        });
        
        return {
          content: [{
            type: 'text',
            text: `Message sent to ${args.channel}: ${result.ts}`
          }]
        };
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
```

## ⚠️ Error Handling

### Standard Error Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "field": "channel",
      "reason": "Channel not found"
    }
  }
}
```

### Error Codes

| Code | Description | Category |
|------|-------------|----------|
| -32700 | Parse error | Protocol |
| -32600 | Invalid request | Protocol |
| -32601 | Method not found | Protocol |
| -32602 | Invalid params | Protocol |
| -32603 | Internal error | Protocol |
| 1000 | Authentication required | Auth |
| 1001 | Invalid token | Auth |
| 1002 | Token expired | Auth |
| 2000 | Plugin not found | Plugin |
| 2001 | Plugin not configured | Plugin |
| 2002 | Plugin error | Plugin |
| 3000 | Workflow not found | Workflow |
| 3001 | Workflow execution failed | Workflow |

## 🚦 Rate Limiting

### Limits

| Endpoint Category | Rate Limit | Window |
|------------------|------------|---------|
| Authentication | 10 requests | 1 minute |
| Tool Calls | 100 requests | 1 minute |
| Plugin Management | 20 requests | 1 minute |
| Workflow Execution | 50 requests | 1 minute |
| WebSocket Events | 1000 events | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1625097600
X-RateLimit-Window: 60
```

### Rate Limit Exceeded Response

```json
{
  "error": {
    "code": 429,
    "message": "Rate limit exceeded",
    "data": {
      "retryAfter": 30,
      "limit": 100,
      "window": 60
    }
  }
}
```

## 📊 Usage Examples

### Complete Integration Example

```typescript
import { RightAPIClient } from '@right-api/client';

const client = new RightAPIClient({
  baseUrl: 'https://gateway.right-api.com',
  auth: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret'
  }
});

// Authenticate
await client.authenticate();

// Install plugin
await client.plugins.install('@right-api/slack-plugin', {
  apiToken: 'xoxb-your-slack-token'
});

// Create workflow
const workflow = await client.workflows.create({
  name: 'Alert on Critical Issues',
  trigger: {
    type: 'webhook'
  },
  steps: [
    {
      plugin: 'github',
      action: 'get_issue_details'
    },
    {
      plugin: 'slack',
      action: 'send_message',
      condition: 'issue.priority === "critical"'
    }
  ]
});

// Execute tool directly
const result = await client.tools.execute('slack_send_message', {
  channel: '#alerts',
  text: 'Critical issue detected!'
});
```

## 🔗 SDK Libraries

### Official SDKs

- **TypeScript/JavaScript**: `@right-api/client`
- **Python**: `right-api-python`
- **Go**: `right-api-go`
- **Rust**: `right-api-rust`

### Community SDKs

- **PHP**: `right-api/php-client`
- **Ruby**: `right-api-ruby`
- **Java**: `right-api-java`

---

**Need help?** Check our [FAQ](./FAQ.md) or join our [Discord community](https://discord.gg/right-api).