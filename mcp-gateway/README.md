# 🚀 Universal MCP Gateway

> **The Developer-First MCP Gateway** - Connect any backend to Claude.ai with our revolutionary plugin architecture

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![Self-Hosted](https://img.shields.io/badge/Self--Hosted-Privacy%20First-green.svg)](#)

---

## 🎯 **What Makes This Unique**

Unlike other MCP solutions that focus on **authentication** or **security**, Universal MCP Gateway is the **first developer-productivity platform** for the MCP ecosystem.

### **🆚 Competitive Comparison**

| Feature | MCPAuth | Syncado | **Universal MCP Gateway** |
|---------|---------|---------|---------------------------|
| **Focus** | Authentication | Enterprise Security | **Developer Productivity** |
| **Target** | Enterprises | CISOs | **Developers & Integrators** |
| **Unique Value** | OAuth 2.1 | Audit Logs | **Plugin Ecosystem + Visual Workflows** |
| **Architecture** | Auth Gateway | Security Layer | **Universal Backend Abstraction** |

---

## ✨ **Revolutionary Features**

### 🔌 **Plugin Architecture - "The npm for MCP"**
```bash
# Install backend integrations like npm packages
mcp-gateway install @mcp/slack-backend
mcp-gateway install @mcp/notion-backend  
mcp-gateway install @mcp/github-backend
```

### 🎨 **Visual Workflow Builder**
```typescript
// No-code backend orchestration
const workflow = {
  trigger: 'slack:message',
  actions: [
    'n8n:execute-workflow',
    'notion:create-page',
    'github:create-issue'
  ]
};
```

### 🧪 **Built-in Developer Tools**
- **Real-time Testing**: Test tools without Claude.ai
- **Debug Mode**: Step through workflow executions
- **Performance Monitoring**: Track response times and errors
- **API Playground**: Interactive tool testing

### 🏪 **Community Marketplace**
- **Verified Plugins**: Official backend integrations
- **Community Contributions**: User-created adapters
- **Plugin Templates**: Quick-start examples
- **Version Management**: Seamless updates

---

## 🚀 **Quick Start**

### **1️⃣ Using Docker (Recommended)**
```bash
# Clone and start
git clone https://github.com/mcp-gateway/universal-gateway.git
cd universal-gateway
cp .env.example .env

# Start with default plugins
docker-compose up -d

# Check status
curl http://localhost:3000/health
```

### **2️⃣ Development Setup**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Install your first plugin
npm run plugin:install @mcp/n8n-plugin
```

### **3️⃣ Connect to Claude.ai**
1. **Add MCP Server** in Claude.ai settings
2. **Server URL**: `http://your-domain:3000/mcp`
3. **Authentication**: Generate gateway token
4. **Ready!** Start using your backends

---

## 🔧 **Installation & Configuration**

### **Environment Variables**
```bash
# Core Configuration
PORT=3000
NODE_ENV=production
AUTH_ENABLED=true

# Database (SQLite default, PostgreSQL optional)
DATABASE_URL=sqlite:///app/data/gateway.db

# Plugin System
PLUGINS_DIR=./plugins
MARKETPLACE_URL=https://registry.mcp-gateway.dev

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=100

# CORS (for Claude.ai)
CORS_ORIGIN=https://claude.ai,http://localhost:3000
```

### **Docker Compose Profiles**
```bash
# Basic setup
docker-compose up -d

# With Redis caching
docker-compose --profile redis up -d

# With PostgreSQL
docker-compose --profile postgres up -d

# Full monitoring stack
docker-compose --profile monitoring up -d
```

---

## 🔌 **Plugin System**

### **Official Plugins**

| Plugin | Description | Status |
|--------|-------------|--------|
| **@mcp/n8n-plugin** | N8N workflow automation | ✅ Available |
| **@mcp/slack-plugin** | Slack messaging & workspace | ✅ Available |
| **@mcp/github-plugin** | GitHub repository management | ✅ Available |
| **@mcp/notion-plugin** | Notion database & pages | 🚧 Coming Soon |
| **@mcp/atlassian-plugin** | Jira, Confluence, Bitbucket | 🚧 Coming Soon |

### **Installing Plugins**
```bash
# Via CLI
mcp-gateway install @mcp/slack-plugin

# Via API
curl -X POST http://localhost:3000/api/plugins/install \
  -H "Content-Type: application/json" \
  -d '{"name": "@mcp/slack-plugin", "version": "latest"}'

# Via Web UI
# Navigate to http://localhost:3000/plugins
```

### **Creating Custom Plugins**
```typescript
// my-custom-plugin.ts
export const MyPlugin: MCPPlugin = {
  name: '@my-org/custom-plugin',
  version: '1.0.0',
  description: 'My custom MCP backend integration',
  
  backend: {
    create: async (config) => new MyBackendAdapter(config),
    validateConfig: (config) => !!config.apiKey,
    getDefaultConfig: () => ({ 
      authentication: { type: 'api_key' } 
    })
  },
  
  metadata: {
    category: 'custom',
    icon: '🎯',
    documentation: 'https://my-docs.com'
  }
};
```

---

## 🎨 **Visual Workflow Builder**

### **Creating Workflows**
```typescript
const workflowDefinition = {
  name: 'Slack to GitHub Automation',
  nodes: [
    {
      id: 'trigger',
      type: 'trigger',
      backendId: 'slack',
      toolName: 'on_message',
      config: { channel: '#dev-alerts' }
    },
    {
      id: 'process',
      type: 'action', 
      backendId: 'github',
      toolName: 'create_issue',
      config: {
        mapping: {
          title: 'trigger.output.text',
          body: 'trigger.output.user'
        }
      }
    }
  ],
  connections: [
    { sourceNodeId: 'trigger', targetNodeId: 'process' }
  ]
};

// Execute workflow
const execution = await workflowEngine.executeWorkflow(
  workflow.id, 
  inputData,
  gatewayToken
);
```

### **Workflow Features**
- **Visual Designer**: Drag-and-drop interface
- **Data Mapping**: Connect outputs to inputs
- **Conditional Logic**: Branch based on conditions
- **Error Handling**: Retry, continue, or stop on errors
- **Real-time Monitoring**: Watch executions live

---

## 🧪 **Developer Tools**

### **Testing Framework**
```typescript
// Create test session
const session = await devTools.createTestingSession(
  'Slack Integration Tests',
  'slack-backend',
  'send_message'
);

// Add test cases
await devTools.addTestCase(session.id, {
  name: 'Send simple message',
  input: { channel: '#test', text: 'Hello World' },
  assertions: [
    { type: 'equals', field: 'success', value: true }
  ]
});

// Run tests
const results = await devTools.runTestingSession(session.id);
```

### **Interactive Tool Testing**
```bash
# Test any backend tool directly
curl -X POST http://localhost:3000/api/dev/test-tool \
  -H "Content-Type: application/json" \
  -d '{
    "backendId": "slack",
    "toolName": "send_message",
    "args": {
      "channel": "#general",
      "text": "Test from MCP Gateway!"
    }
  }'
```

### **Performance Monitoring**
```typescript
// Get performance metrics
const metrics = await devTools.getPerformanceMetrics('slack-backend');

// Response
{
  "totalRequests": 1247,
  "averageResponseTime": 245,
  "errorRate": 0.02,
  "backends": {
    "slack": {
      "requestCount": 456,
      "averageResponseTime": 189,
      "errorCount": 3
    }
  }
}
```

---

## 🌐 **API Reference**

### **Core Endpoints**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/mcp` | POST | MCP protocol endpoint |
| `/api/backends` | GET | List all backends |
| `/api/tokens` | POST | Create gateway token |

### **Plugin Endpoints**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/plugins` | GET | List installed plugins |
| `/api/plugins/install` | POST | Install plugin |
| `/api/plugins/{id}/config` | PUT | Configure plugin |
| `/api/marketplace/search` | GET | Search marketplace |

### **Workflow Endpoints**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/workflows` | GET/POST | Manage workflows |
| `/api/workflows/{id}/execute` | POST | Execute workflow |
| `/api/workflows/{id}/debug` | POST | Start debug session |

---

## 🔐 **Security & Authentication**

### **Gateway Tokens**
```bash
# Create token for specific backends
curl -X POST http://localhost:3000/api/tokens \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Claude.ai Integration",
    "backendIds": ["slack", "github"],
    "permissions": ["read", "write"],
    "expiresAt": "2024-12-31T23:59:59Z"
  }'
```

### **Backend Authentication**
```typescript
// OAuth flow for backends
const backend = await gateway.addBackend({
  type: 'slack',
  authentication: {
    type: 'oauth',
    credentials: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
      scopes: ['chat:write', 'channels:read']
    }
  }
});
```

### **Rate Limiting**
- **Per-IP Limits**: Configurable requests per minute
- **Per-Token Limits**: Backend-specific quotas
- **Burst Protection**: Prevent abuse patterns

---

## 📊 **Monitoring & Observability**

### **Built-in Monitoring**
- **Health Checks**: Automatic backend health monitoring
- **Request Tracing**: Full request/response logging
- **Error Tracking**: Detailed error categorization
- **Performance Metrics**: Response time tracking

### **External Monitoring**
```yaml
# docker-compose.yml profiles
# Prometheus + Grafana stack
docker-compose --profile monitoring up -d

# Access dashboards
# Grafana: http://localhost:3001
# Prometheus: http://localhost:9090
```

### **Custom Metrics**
```typescript
// Add custom metrics
gateway.metrics.recordEvent('custom.workflow.executed', {
  workflowId: 'abc123',
  duration: 1500,
  success: true
});
```

---

## 🚀 **Production Deployment**

### **Docker Swarm**
```bash
# Deploy to swarm
docker stack deploy -c docker-compose.yml mcp-gateway
```

### **Kubernetes**
```yaml
# Apply Kubernetes manifests
kubectl apply -f k8s/
```

### **Reverse Proxy Setup**
```nginx
# nginx.conf
location /mcp {
    proxy_pass http://mcp-gateway:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### **SSL Configuration**
```bash
# Using Let's Encrypt
certbot --nginx -d your-domain.com
```

---

## 🤝 **Contributing**

### **Plugin Development**
1. **Use Plugin Template**: `npx create-mcp-plugin my-plugin`
2. **Implement Interface**: Follow MCPPlugin specification
3. **Add Tests**: Include comprehensive test suite
4. **Submit to Marketplace**: Publish via GitHub

### **Core Development**
1. **Fork Repository**: GitHub workflow
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Add Tests**: Maintain test coverage
4. **Submit PR**: Detailed description required

### **Documentation**
- **Plugin Docs**: Add to `docs/plugins/`
- **API Docs**: Update OpenAPI specification
- **Examples**: Include in `examples/` directory

---

## 🗺️ **Roadmap**

### **Q1 2024**
- ✅ Plugin architecture
- ✅ Visual workflow builder
- ✅ Developer tools
- ✅ Community marketplace

### **Q2 2024**
- 🚧 Advanced authentication (works with MCPAuth)
- 🚧 Enterprise features
- 🚧 Cloud hosting option
- 🚧 Mobile app integration

### **Q3 2024**
- 📅 AI-powered workflow suggestions
- 📅 Advanced debugging tools
- 📅 Workflow templates marketplace
- 📅 Multi-tenant cloud platform

---

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

---

## 💬 **Support & Community**

- **Documentation**: [docs.mcp-gateway.dev](https://docs.mcp-gateway.dev)
- **GitHub Issues**: [Report bugs & request features](https://github.com/mcp-gateway/universal-gateway/issues)
- **Discord Community**: [Join our Discord](https://discord.gg/mcp-gateway)
- **Email Support**: [team@mcp-gateway.dev](mailto:team@mcp-gateway.dev)

---

<div align="center">

**🌟 Star us on GitHub if you find this useful! 🌟**

*Built with ❤️ by developers, for developers*

[**Get Started →**](#-quick-start) | [**View Docs →**](https://docs.mcp-gateway.dev) | [**Join Community →**](https://discord.gg/mcp-gateway)

</div>