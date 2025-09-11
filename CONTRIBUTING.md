# 🤝 Contributing to Right API

Thank you for your interest in contributing to Right API! This guide will help you get started with contributing to our universal MCP gateway platform.

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Setup](#-development-setup)
- [Contributing Guidelines](#-contributing-guidelines)
- [Pull Request Process](#-pull-request-process)
- [Plugin Development](#-plugin-development)
- [Documentation](#-documentation)
- [Community](#-community)

## 📜 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). We are committed to providing a welcoming and inclusive environment for all contributors.

## 🚀 Getting Started

### Ways to Contribute

- 🐛 **Bug Reports**: Help us identify and fix issues
- 💡 **Feature Requests**: Suggest new features and improvements
- 🔧 **Code Contributions**: Submit bug fixes and new features
- 🔌 **Plugin Development**: Create new MCP backend plugins
- 📚 **Documentation**: Improve our docs and guides
- 🎨 **UI/UX**: Enhance the user interface and experience
- 🧪 **Testing**: Write tests and improve test coverage

### Before You Start

1. **Check existing issues** and pull requests to avoid duplicates
2. **Join our Discord** for discussions and questions
3. **Read our documentation** to understand the architecture
4. **Set up your development environment** following this guide

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Docker** and Docker Compose
- **PostgreSQL** 13+ (for local development)
- **Redis** 6+ (for caching)
- **Git** for version control

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/your-username/right-api-mcp-gateway.git
cd right-api-mcp-gateway

# Add upstream remote
git remote add upstream https://github.com/right-api/mcp-gateway.git
```

### 2. Environment Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.development

# Edit environment variables
nano .env.development
```

**Development Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://localhost:5432/rightapi_dev
REDIS_URL=redis://localhost:6379

# Application
NODE_ENV=development
LOG_LEVEL=debug
PORT=3000

# Authentication
JWT_SECRET=your-dev-jwt-secret
ENCRYPTION_KEY=your-dev-encryption-key

# CORS
CORS_ORIGIN=http://localhost:3001,https://claude.ai
```

### 3. Database Setup

```bash
# Start PostgreSQL and Redis with Docker
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Run database migrations
npm run db:migrate

# Seed development data (optional)
npm run db:seed
```

### 4. Start Development Server

```bash
# Start the gateway
npm run dev

# In another terminal, start the web UI
cd web
npm install
npm run dev
```

### 5. Verify Setup

```bash
# Check health endpoint
curl http://localhost:3000/health

# Check available tools
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## 📝 Contributing Guidelines

### Branch Naming

Use descriptive branch names with prefixes:

```bash
feature/plugin-slack-integration
bugfix/oauth-token-refresh
docs/plugin-development-guide
refactor/workflow-engine-optimization
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat(plugins): add Slack integration plugin
fix(auth): resolve OAuth token refresh issue
docs(api): update plugin development guide
refactor(workflow): optimize execution engine
test(plugins): add unit tests for GitHub plugin
```

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check code style
npm run lint

# Fix code style issues
npm run lint:fix

# Format code
npm run format
```

### TypeScript Guidelines

- Use strict TypeScript configuration
- Provide proper type definitions for all functions
- Avoid `any` types - use proper interfaces
- Document complex types with JSDoc comments

**Example:**
```typescript
/**
 * Configuration for MCP plugin initialization
 */
interface PluginConfig {
  /** Unique plugin identifier */
  id: string;
  /** Plugin display name */
  name: string;
  /** Plugin version following semver */
  version: string;
  /** Plugin configuration parameters */
  config: Record<string, unknown>;
}

/**
 * Initialize a plugin with the provided configuration
 * @param config - Plugin configuration object
 * @returns Promise resolving to initialized plugin instance
 * @throws {PluginError} When plugin initialization fails
 */
async function initializePlugin(config: PluginConfig): Promise<MCPPlugin> {
  // Implementation
}
```

### Testing Requirements

All contributions must include appropriate tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=plugins/slack
```

**Test Structure:**
```typescript
describe('SlackPlugin', () => {
  let plugin: SlackPlugin;
  
  beforeEach(async () => {
    plugin = new SlackPlugin();
    await plugin.initialize(mockConfig);
  });
  
  describe('sendMessage', () => {
    it('should send message to specified channel', async () => {
      const result = await plugin.executeTool('slack_send_message', {
        channel: '#test',
        text: 'Hello World'
      });
      
      expect(result.content[0].text).toContain('Message sent');
    });
    
    it('should throw error for invalid channel', async () => {
      await expect(
        plugin.executeTool('slack_send_message', {
          channel: 'invalid-channel',
          text: 'Hello'
        })
      ).rejects.toThrow('Channel not found');
    });
  });
});
```

## 🔄 Pull Request Process

### 1. Prepare Your Changes

```bash
# Keep your fork up to date
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes and commit
git add .
git commit -m "feat: add your feature description"

# Push to your fork
git push origin feature/your-feature-name
```

### 2. Create Pull Request

1. **Go to GitHub** and create a pull request from your fork
2. **Fill out the PR template** completely
3. **Link related issues** using keywords (fixes #123)
4. **Add appropriate labels** (feature, bugfix, documentation, etc.)
5. **Request reviews** from relevant maintainers

### 3. PR Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] New tests added for new functionality

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Breaking changes documented
```

### 4. Review Process

- **Automated checks** must pass (tests, linting, security scans)
- **At least one maintainer** must approve
- **Address feedback** promptly and professionally
- **Squash commits** if requested before merging

## 🔌 Plugin Development

### Creating a New Plugin

```bash
# Use our plugin generator
npm run create-plugin -- --name my-awesome-service

# Or copy the template
cp -r src/plugins/template src/plugins/my-awesome-service
```

### Plugin Structure

```
src/plugins/my-awesome-service/
├── index.ts           # Main plugin export
├── plugin.ts          # Plugin implementation
├── types.ts           # TypeScript types
├── config.schema.json # Configuration schema
├── tests/
│   ├── plugin.test.ts # Unit tests
│   └── fixtures/      # Test fixtures
├── docs/
│   ├── README.md      # Plugin documentation
│   └── examples.md    # Usage examples
└── package.json       # Plugin metadata
```

### Plugin Implementation Template

```typescript
import { MCPPlugin, MCPTool, MCPResult } from '../../types';

export class MyAwesomeServicePlugin implements MCPPlugin {
  id = 'my-awesome-service';
  name = 'My Awesome Service';
  version = '1.0.0';
  description = 'Integration with My Awesome Service';

  private client: MyAwesomeServiceClient;

  async initialize(config: PluginConfig): Promise<void> {
    this.client = new MyAwesomeServiceClient(config.apiKey);
    await this.client.authenticate();
  }

  async cleanup(): Promise<void> {
    await this.client?.disconnect();
  }

  getTools(): MCPTool[] {
    return [
      {
        name: 'my_service_action',
        description: 'Perform an action in My Awesome Service',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['create', 'update', 'delete'] },
            data: { type: 'object' }
          },
          required: ['action']
        }
      }
    ];
  }

  async executeTool(name: string, args: any): Promise<MCPResult> {
    switch (name) {
      case 'my_service_action':
        return this.handleAction(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async handleAction(args: any): Promise<MCPResult> {
    const result = await this.client.performAction(args.action, args.data);
    
    return {
      content: [{
        type: 'text',
        text: `Action ${args.action} completed successfully`
      }]
    };
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      await this.client.ping();
      return { healthy: true };
    } catch (error) {
      return { 
        healthy: false, 
        error: error.message 
      };
    }
  }
}
```

### Plugin Testing

```typescript
import { MyAwesomeServicePlugin } from '../plugin';

describe('MyAwesomeServicePlugin', () => {
  let plugin: MyAwesomeServicePlugin;
  
  beforeEach(async () => {
    plugin = new MyAwesomeServicePlugin();
    await plugin.initialize({
      apiKey: 'test-api-key'
    });
  });
  
  afterEach(async () => {
    await plugin.cleanup();
  });

  it('should provide correct tools', () => {
    const tools = plugin.getTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('my_service_action');
  });

  it('should execute action successfully', async () => {
    const result = await plugin.executeTool('my_service_action', {
      action: 'create',
      data: { name: 'test' }
    });
    
    expect(result.content[0].text).toContain('completed successfully');
  });
});
```

## 📚 Documentation

### Documentation Standards

- **Clear and concise** language
- **Code examples** for all features
- **Step-by-step tutorials** where appropriate
- **API documentation** with TypeScript types
- **Screenshots** for UI features

### Documentation Structure

```
docs/
├── README.md              # Main documentation index
├── QUICK_START.md         # Getting started guide
├── API.md                 # Complete API reference
├── DEPLOYMENT.md          # Production deployment
├── PLUGIN_DEVELOPMENT.md  # Plugin creation guide
├── ARCHITECTURE.md        # System architecture
├── examples/              # Code examples
├── tutorials/             # Step-by-step guides
└── images/               # Screenshots and diagrams
```

### Writing Guidelines

1. **Use active voice** and present tense
2. **Start with examples** before explaining theory
3. **Include error scenarios** and troubleshooting
4. **Cross-reference** related documentation
5. **Keep examples current** with the latest API

## 💬 Community

### Communication Channels

- 💬 **Discord**: [Join our server](https://discord.gg/right-api)
- 🐛 **GitHub Issues**: Bug reports and feature requests
- 📧 **Email**: [developers@right-api.com](mailto:developers@right-api.com)
- 🐦 **Twitter**: [@RightAPI](https://twitter.com/RightAPI)

### Getting Help

1. **Check documentation** first
2. **Search existing issues** on GitHub
3. **Ask in Discord** for quick questions
4. **Create detailed issue** for bugs or feature requests

### Community Events

- **Monthly contributor calls** - First Wednesday of each month
- **Plugin development workshops** - Quarterly
- **Annual contributor summit** - RightAPI Conf

## 🏆 Recognition

We appreciate all contributions! Contributors will be:

- **Listed in our README** contributors section
- **Mentioned in release notes** for significant contributions
- **Invited to contributor-only events**
- **Eligible for contributor swag** and rewards

### Contributor Levels

- 🌟 **Contributor**: Made their first contribution
- 🔥 **Regular Contributor**: 5+ merged PRs
- 💎 **Core Contributor**: 20+ merged PRs or major feature
- 🚀 **Maintainer**: Trusted with repository access

## 📄 License

By contributing to Right API, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

---

**Ready to contribute?** Start by [forking the repository](https://github.com/right-api/mcp-gateway/fork) and setting up your development environment!

**Questions?** Join our [Discord community](https://discord.gg/right-api) or check our [FAQ](./docs/FAQ.md).