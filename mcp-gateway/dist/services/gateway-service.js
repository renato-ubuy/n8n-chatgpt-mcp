"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayService = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
const backend_registry_1 = require("./backend-registry");
const token_service_1 = require("./token-service");
const identity_service_1 = require("./identity-service");
const plugin_manager_1 = require("./plugin-manager");
const workflow_engine_1 = require("./workflow-engine");
const performance_monitor_1 = require("./performance-monitor");
const security_manager_1 = require("./security-manager");
const auth_service_1 = require("./auth-service");
const marketplace_1 = require("./marketplace");
class GatewayService extends events_1.EventEmitter {
    constructor() {
        super();
        this.backends = new Map();
        this.gatewayConfigs = new Map();
        this.rateLimiter = new Map();
        this.backendRegistry = new backend_registry_1.BackendRegistry();
        this.tokenService = new token_service_1.TokenService();
        this.identityService = new identity_service_1.IdentityService();
        this.pluginManager = new plugin_manager_1.PluginManager();
        this.workflowEngine = new workflow_engine_1.WorkflowEngine(this);
        this.performanceMonitor = new performance_monitor_1.PerformanceMonitor();
        this.securityManager = new security_manager_1.SecurityManager();
        this.authService = new auth_service_1.AuthService();
        this.marketplace = new marketplace_1.Marketplace();
        this.initializeBuiltInBackends();
        this.setupEventHandlers();
    }
    initializeBuiltInBackends() {
        // Register built-in backend types
        this.backendRegistry.register('n8n', {
            type: 'n8n',
            name: 'N8N Workflow Automation',
            description: 'Connect to N8N instances for workflow management',
            factory: {
                create: async (config) => {
                    const { N8nBackendAdapter } = await Promise.resolve().then(() => __importStar(require('./adapters/n8n-adapter')));
                    return new N8nBackendAdapter(config);
                },
                validateConfig: (config) => {
                    return !!(config.baseUrl && config.authentication?.credentials?.apiKey);
                },
                getDefaultConfig: () => ({
                    type: 'n8n',
                    authentication: {
                        type: 'api_key',
                        credentials: {}
                    },
                    capabilities: ['workflows', 'executions', 'nodes']
                })
            },
            authMethods: ['api_key'],
            capabilities: ['workflows', 'executions', 'nodes']
        });
        // Register Slack plugin
        this.backendRegistry.register('slack', {
            type: 'slack',
            name: 'Slack Workspace',
            description: 'Complete Slack workspace automation and communication',
            factory: {
                create: async (config) => {
                    const { SlackBackendAdapter } = await Promise.resolve().then(() => __importStar(require('./adapters/slack-adapter')));
                    return new SlackBackendAdapter(config);
                },
                validateConfig: (config) => {
                    return !!(config.authentication?.credentials?.botToken);
                },
                getDefaultConfig: () => ({
                    type: 'slack',
                    authentication: {
                        type: 'oauth',
                        credentials: {}
                    },
                    capabilities: ['messaging', 'channels', 'users', 'files']
                })
            },
            authMethods: ['oauth', 'bot_token'],
            capabilities: ['messaging', 'channels', 'users', 'files']
        });
        // Register GitHub plugin
        this.backendRegistry.register('github', {
            type: 'github',
            name: 'GitHub Repository',
            description: 'Complete GitHub repository and project management',
            factory: {
                create: async (config) => {
                    const { GitHubBackendAdapter } = await Promise.resolve().then(() => __importStar(require('./adapters/github-adapter')));
                    return new GitHubBackendAdapter(config);
                },
                validateConfig: (config) => {
                    return !!(config.authentication?.credentials?.personalAccessToken);
                },
                getDefaultConfig: () => ({
                    type: 'github',
                    authentication: {
                        type: 'token',
                        credentials: {}
                    },
                    capabilities: ['repositories', 'issues', 'pull_requests', 'actions']
                })
            },
            authMethods: ['token', 'oauth'],
            capabilities: ['repositories', 'issues', 'pull_requests', 'actions']
        });
        this.backendRegistry.register('generic', {
            type: 'generic',
            name: 'Generic MCP Server',
            description: 'Connect to any MCP-compatible server',
            factory: {
                create: async (config) => {
                    const { GenericBackendAdapter } = await Promise.resolve().then(() => __importStar(require('./adapters/generic-adapter')));
                    return new GenericBackendAdapter(config);
                },
                validateConfig: (config) => {
                    return !!(config.baseUrl);
                },
                getDefaultConfig: () => ({
                    type: 'generic',
                    authentication: {
                        type: 'bearer',
                        credentials: {}
                    },
                    capabilities: ['tools']
                })
            },
            authMethods: ['bearer', 'api_key', 'oauth'],
            capabilities: ['tools', 'resources', 'prompts']
        });
    }
    // Backend Management
    async addBackend(config) {
        const registration = this.backendRegistry.get(config.type);
        if (!registration) {
            throw new Error(`Backend type '${config.type}' not supported`);
        }
        if (!registration.factory.validateConfig(config)) {
            throw new Error(`Invalid configuration for backend type '${config.type}'`);
        }
        const adapter = await registration.factory.create(config);
        await adapter.connect();
        const tools = await adapter.getTools();
        const backend = {
            id: config.id,
            name: config.name,
            type: config.type,
            status: 'active',
            config,
            tools,
            adapter,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.backends.set(backend.id, backend);
        this.emit('backend:added', backend);
        // Register with performance monitoring
        this.performanceMonitor.registerBackend(backend.id, backend.name);
        // Security scan for new backend
        await this.securityManager.scanBackend(backend);
        return backend;
    }
    async removeBackend(backendId) {
        const backend = this.backends.get(backendId);
        if (!backend) {
            throw new Error(`Backend '${backendId}' not found`);
        }
        await backend.adapter.disconnect();
        this.backends.delete(backendId);
        this.emit('backend:removed', backend);
    }
    getBackend(backendId) {
        return this.backends.get(backendId);
    }
    getAllBackends() {
        return Array.from(this.backends.values());
    }
    // Gateway Token Management
    async createGatewayToken(name, backendIds, identityId, permissions = ['read', 'write'], expiresAt) {
        // Validate backends exist
        for (const backendId of backendIds) {
            if (!this.backends.has(backendId)) {
                throw new Error(`Backend '${backendId}' not found`);
            }
        }
        // Validate identity exists
        const identity = await this.identityService.getIdentity(identityId);
        if (!identity) {
            throw new Error(`Identity '${identityId}' not found`);
        }
        const token = await this.tokenService.createToken({
            id: (0, uuid_1.v4)(),
            name,
            description: `Gateway token for ${backendIds.join(', ')}`,
            backendIds,
            identityId,
            permissions,
            expiresAt,
            token: '', // Will be generated by TokenService
            createdAt: new Date(),
            isActive: true
        });
        this.emit('token:created', token);
        return token;
    }
    // MCP Request Handling
    async handleMCPRequest(gatewayToken, request) {
        const startTime = Date.now();
        const requestId = (0, uuid_1.v4)();
        try {
            // Validate token
            const token = await this.tokenService.validateToken(gatewayToken);
            if (!token) {
                return this.createErrorResponse(request.id, -32001, 'Invalid gateway token');
            }
            // Check rate limiting
            if (!this.checkRateLimit(token.id)) {
                return this.createErrorResponse(request.id, -32003, 'Rate limit exceeded');
            }
            // Security validation
            const securityCheck = await this.securityManager.validateRequest(request, token);
            if (!securityCheck.valid) {
                return this.createErrorResponse(request.id, -32004, securityCheck.reason);
            }
            // Update last used
            await this.tokenService.updateLastUsed(token.id);
            // Start performance tracking
            this.performanceMonitor.startRequest(requestId, request.method, token.id);
            // Route request based on method
            let response;
            switch (request.method) {
                case 'initialize':
                    response = this.handleInitialize(request);
                    break;
                case 'tools/list':
                    response = this.handleToolsList(request, token);
                    break;
                case 'tools/call':
                    response = await this.handleToolsCall(request, token);
                    break;
                case 'workflow/execute':
                    response = await this.handleWorkflowExecute(request, token);
                    break;
                case 'plugins/list':
                    response = await this.handlePluginsList(request, token);
                    break;
                case 'plugins/install':
                    response = await this.handlePluginInstall(request, token);
                    break;
                default:
                    response = this.createErrorResponse(request.id, -32601, 'Method not found');
            }
            // Record performance metrics
            this.performanceMonitor.endRequest(requestId, Date.now() - startTime, response.error ? 'error' : 'success');
            return response;
        }
        catch (error) {
            console.error('Gateway request error:', error);
            // Record error metrics
            this.performanceMonitor.endRequest(requestId, Date.now() - startTime, 'error');
            // Log security incident if needed
            await this.securityManager.logIncident({
                type: 'gateway_error',
                message: error.message,
                requestId,
                timestamp: new Date()
            });
            return this.createErrorResponse(request.id, -32603, 'Internal error', { error: error.message });
        }
    }
    handleInitialize(request) {
        return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            result: {
                protocolVersion: '2024-11-05',
                capabilities: {
                    tools: { listChanged: true },
                    resources: { subscribe: true, listChanged: true },
                    prompts: { listChanged: false },
                    logging: {}
                },
                serverInfo: {
                    name: 'Universal MCP Gateway',
                    version: '1.0.0'
                }
            }
        };
    }
    handleToolsList(request, token) {
        const tools = [];
        // Collect tools from all backends this token has access to
        for (const backendId of token.backendIds) {
            const backend = this.backends.get(backendId);
            if (backend && backend.status === 'active') {
                const backendTools = backend.tools.map(tool => ({
                    ...tool,
                    name: `${backend.name}:${tool.name}`,
                    description: `[${backend.name}] ${tool.description}`
                }));
                tools.push(...backendTools);
            }
        }
        return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            result: { tools }
        };
    }
    async handleToolsCall(request, token) {
        const { name, arguments: args } = request.params;
        // Parse backend and tool name
        const [backendName, toolName] = name.split(':', 2);
        if (!toolName) {
            return this.createErrorResponse(request.id, -32602, 'Invalid tool name format. Use "backend:tool"');
        }
        // Find backend
        const backend = Array.from(this.backends.values()).find(b => b.name === backendName && token.backendIds.includes(b.id));
        if (!backend) {
            return this.createErrorResponse(request.id, -32602, `Backend '${backendName}' not found or not accessible`);
        }
        try {
            const result = await backend.adapter.callTool(toolName, args);
            return {
                jsonrpc: '2.0',
                id: request.id ?? null,
                result
            };
        }
        catch (error) {
            return this.createErrorResponse(request.id, -32603, `Tool execution failed: ${error.message}`);
        }
    }
    createErrorResponse(id, code, message, data) {
        return {
            jsonrpc: '2.0',
            id,
            error: { code, message, data }
        };
    }
    // Health and Status
    async getGatewayStatus() {
        const backendStatuses = await Promise.all(Array.from(this.backends.values()).map(async (backend) => ({
            id: backend.id,
            name: backend.name,
            type: backend.type,
            status: await backend.adapter.getStatus(),
            toolCount: backend.tools.length
        })));
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            backends: backendStatuses,
            totalBackends: this.backends.size,
            totalTokens: await this.tokenService.getActiveTokenCount()
        };
    }
    // Rate Limiting
    checkRateLimit(tokenId) {
        const now = Date.now();
        const limit = this.rateLimiter.get(tokenId);
        if (!limit || now > limit.resetTime) {
            this.rateLimiter.set(tokenId, {
                count: 1,
                resetTime: now + 60000 // 1 minute window
            });
            return true;
        }
        if (limit.count >= 100) { // 100 requests per minute
            return false;
        }
        limit.count++;
        return true;
    }
    // Setup Event Handlers
    setupEventHandlers() {
        this.pluginManager.on('plugin:installed', (plugin) => {
            this.emit('plugin:installed', plugin);
        });
        this.workflowEngine.on('workflow:completed', (result) => {
            this.emit('workflow:completed', result);
        });
        this.performanceMonitor.on('performance:alert', (alert) => {
            this.emit('performance:alert', alert);
        });
    }
    // New Handler Methods
    async handleWorkflowExecute(request, token) {
        const { workflowId, input } = request.params;
        try {
            const result = await this.workflowEngine.executeWorkflow(workflowId, input, {
                tokenId: token.id,
                availableBackends: token.backendIds.map(id => this.backends.get(id)).filter(Boolean)
            });
            return {
                jsonrpc: '2.0',
                id: request.id ?? null,
                result
            };
        }
        catch (error) {
            return this.createErrorResponse(request.id, -32603, `Workflow execution failed: ${error.message}`);
        }
    }
    async handlePluginsList(request, token) {
        const plugins = await this.pluginManager.listAvailablePlugins();
        return {
            jsonrpc: '2.0',
            id: request.id ?? null,
            result: { plugins }
        };
    }
    async handlePluginInstall(request, token) {
        const { packageName, version, config } = request.params;
        try {
            const plugin = await this.pluginManager.installPlugin(packageName, version, config);
            return {
                jsonrpc: '2.0',
                id: request.id ?? null,
                result: { plugin }
            };
        }
        catch (error) {
            return this.createErrorResponse(request.id, -32603, `Plugin installation failed: ${error.message}`);
        }
    }
    // Enhanced Gateway Status
    async getGatewayStatus() {
        const backendStatuses = await Promise.all(Array.from(this.backends.values()).map(async (backend) => ({
            id: backend.id,
            name: backend.name,
            type: backend.type,
            status: await backend.adapter.getStatus(),
            toolCount: backend.tools.length,
            performance: this.performanceMonitor.getBackendMetrics(backend.id)
        })));
        const performanceMetrics = this.performanceMonitor.getGlobalMetrics();
        const securityStatus = await this.securityManager.getSecurityStatus();
        const pluginStats = await this.pluginManager.getStats();
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.2.0',
            backends: backendStatuses,
            totalBackends: this.backends.size,
            totalTokens: await this.tokenService.getActiveTokenCount(),
            performance: performanceMetrics,
            security: securityStatus,
            plugins: pluginStats,
            uptime: process.uptime()
        };
    }
    // Plugin Management Integration
    async installPlugin(packageName, version) {
        return await this.pluginManager.installPlugin(packageName, version);
    }
    async uninstallPlugin(pluginId) {
        await this.pluginManager.uninstallPlugin(pluginId);
    }
    getInstalledPlugins() {
        return this.pluginManager.getInstalledPlugins();
    }
    // Workflow Management Integration
    async createWorkflow(definition) {
        return await this.workflowEngine.createWorkflow(definition);
    }
    async executeWorkflow(workflowId, input) {
        return await this.workflowEngine.executeWorkflow(workflowId, input);
    }
    getWorkflows() {
        return this.workflowEngine.getAllWorkflows();
    }
    async destroy() {
        // Disconnect all backends
        await Promise.all(Array.from(this.backends.values()).map(backend => backend.adapter.disconnect().catch(console.error)));
        // Cleanup services
        await this.pluginManager.destroy();
        await this.workflowEngine.destroy();
        await this.performanceMonitor.destroy();
        await this.securityManager.destroy();
        this.backends.clear();
        this.gatewayConfigs.clear();
        this.rateLimiter.clear();
    }
}
exports.GatewayService = GatewayService;
//# sourceMappingURL=gateway-service.js.map