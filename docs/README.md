# 📚 Right API - Technical Documentation

Welcome to the technical documentation for Right API, the universal MCP gateway platform.

## 📖 Documentation Structure

### 🚀 Getting Started
- [Quick Start Guide](./QUICK_START.md) - Get up and running in 5 minutes
- [Installation](./INSTALLATION.md) - Detailed installation instructions
- [Configuration](./CONFIGURATION.md) - Environment and setup configuration

### 🏗️ Architecture & Design
- [System Architecture](./ARCHITECTURE.md) - High-level system design
- [Plugin System](./PLUGIN_SYSTEM.md) - How plugins work and are managed
- [Workflow Engine](./WORKFLOW_ENGINE.md) - Visual workflow builder details
- [Authentication](./AUTHENTICATION.md) - OAuth 2.1 and security implementation

### 🔌 Plugin Development
- [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md) - Create custom plugins
- [Plugin API Reference](./PLUGIN_API.md) - Complete API documentation
- [Best Practices](./PLUGIN_BEST_PRACTICES.md) - Development guidelines
- [Examples](./PLUGIN_EXAMPLES.md) - Sample plugin implementations

### 🌐 API Documentation
- [REST API](./API/REST.md) - HTTP API endpoints
- [MCP Protocol](./API/MCP.md) - Model Context Protocol implementation
- [WebSocket API](./API/WEBSOCKET.md) - Real-time communication
- [Authentication API](./API/AUTHENTICATION.md) - OAuth and token management

### 🚀 Deployment & Operations
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Docker Configuration](./DOCKER.md) - Container setup and management
- [Monitoring](./MONITORING.md) - Observability and health checks
- [Scaling](./SCALING.md) - Horizontal and vertical scaling strategies

### 🔧 Troubleshooting & Support
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and solutions
- [FAQ](./FAQ.md) - Frequently asked questions
- [Performance Tuning](./PERFORMANCE.md) - Optimization guidelines
- [Security Best Practices](./SECURITY.md) - Security hardening guide

## 🎯 Key Concepts

### MCP Gateway Architecture
Right API acts as a universal gateway between Claude.ai and multiple backend services, providing:

- **Plugin Management**: npm-style plugin installation and management
- **Workflow Orchestration**: Visual builder for connecting multiple services
- **Multi-tenancy**: Isolated environments for different users/organizations
- **Enterprise Security**: OAuth 2.1, rate limiting, and audit logging

### Plugin Ecosystem
Our plugin system enables:

```typescript
// Install any MCP backend as a plugin
npm install @right-api/slack-plugin
npm install @right-api/github-plugin
npm install @right-api/custom-database-plugin
```

### Visual Workflows
Create complex automation flows without code:

```yaml
trigger: slack.message_received
conditions:
  - channel: "#support"
  - contains: "bug"
actions:
  - github.create_issue
  - slack.thread_reply
  - notion.add_to_database
```

## 🔗 Quick Links

| Topic | Description | Link |
|-------|-------------|------|
| 🚀 Quick Start | Get running in 5 minutes | [Guide](./QUICK_START.md) |
| 🔌 Plugin Development | Build your first plugin | [Guide](./PLUGIN_DEVELOPMENT.md) |
| 🏗️ Architecture | Understand the system | [Overview](./ARCHITECTURE.md) |
| 🌐 API Reference | Complete API docs | [Reference](./API.md) |
| 🚀 Deployment | Production setup | [Guide](./DEPLOYMENT.md) |

## 📊 Examples & Tutorials

### Basic Examples
- [Hello World Plugin](./examples/hello-world-plugin.md)
- [Simple Workflow](./examples/simple-workflow.md)
- [OAuth Integration](./examples/oauth-integration.md)

### Advanced Examples
- [Multi-Backend Workflow](./examples/multi-backend-workflow.md)
- [Custom Authentication](./examples/custom-auth.md)
- [Enterprise Integration](./examples/enterprise-integration.md)

## 🤝 Contributing to Documentation

We welcome documentation improvements! See our [Documentation Style Guide](./DOCUMENTATION_STYLE.md) for guidelines.

### Documentation Standards
- Clear, concise language
- Code examples for all concepts
- Visual diagrams where helpful
- Step-by-step tutorials
- Real-world examples

## 📝 Changelog

See [CHANGELOG.md](../CHANGELOG.md) for version history and updates.

## 🆘 Getting Help

- 📚 **Documentation**: You're here!
- 🐛 **Issues**: [GitHub Issues](https://github.com/right-api/mcp-gateway/issues)
- 💬 **Discord**: [Community Server](https://discord.gg/right-api)
- 📧 **Email**: [support@right-api.com](mailto:support@right-api.com)

---

**Ready to dive deeper?** Start with our [Quick Start Guide](./QUICK_START.md) or explore the [Architecture Overview](./ARCHITECTURE.md).