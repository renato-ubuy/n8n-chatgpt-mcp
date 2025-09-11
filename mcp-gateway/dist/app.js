"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPGatewayApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const gateway_service_1 = require("./services/gateway-service");
const auth_service_1 = require("./services/auth-service");
const marketplace_1 = require("./services/marketplace");
const plugin_manager_1 = require("./services/plugin-manager");
const performance_monitor_1 = require("./services/performance-monitor");
const security_manager_1 = require("./services/security-manager");
const auth_1 = require("./routes/auth");
const marketplace_2 = require("./routes/marketplace");
class MCPGatewayApp {
    constructor() {
        this.app = (0, express_1.default)();
        this.initializeServices();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandlers();
    }
    initializeServices() {
        this.gatewayService = new gateway_service_1.GatewayService();
        this.authService = new auth_service_1.AuthService();
        this.marketplace = new marketplace_1.Marketplace();
        this.pluginManager = new plugin_manager_1.PluginManager();
        this.performanceMonitor = new performance_monitor_1.PerformanceMonitor();
        this.securityManager = new security_manager_1.SecurityManager();
        // Setup service event listeners
        this.setupServiceEventHandlers();
    }
    setupMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));
        // CORS configuration
        this.app.use((0, cors_1.default)({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Request logging middleware
        this.app.use((req, res, next) => {
            const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            req.requestId = requestId;
            console.log(`📨 ${req.method} ${req.path} [${requestId}]`);
            // Performance monitoring
            this.performanceMonitor.startRequest(requestId, req.method, req.headers.authorization || 'anonymous');
            // Override res.json to capture response time
            const originalJson = res.json;
            res.json = function (body) {
                const duration = Date.now() - parseInt(requestId.split('_')[1]);
                res.locals.duration = duration;
                return originalJson.call(this, body);
            };
            next();
        });
    }
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0',
                uptime: process.uptime(),
                services: {
                    gateway: 'operational',
                    auth: 'operational',
                    marketplace: 'operational',
                    security: this.securityManager.getSecurityStatus().securityLevel
                }
            });
        });
        // API version info
        this.app.get('/api', (req, res) => {
            res.json({
                name: 'Universal MCP Gateway',
                version: '1.0.0',
                description: 'Universal MCP Gateway - Connect any MCP backend to Claude.ai',
                endpoints: {
                    auth: '/api/auth',
                    marketplace: '/api/marketplace',
                    mcp: '/api/mcp'
                },
                documentation: 'https://docs.right-api.com/mcp-gateway'
            });
        });
        // Authentication routes
        this.app.use('/api/auth', (0, auth_1.createAuthRoutes)(this.authService));
        // Marketplace routes
        this.app.use('/api/marketplace', (0, marketplace_2.createMarketplaceRoutes)(this.marketplace, this.pluginManager, this.authService));
        // MCP Gateway routes
        this.app.use('/api/mcp', this.createMCPRoutes());
        // Admin routes (protected)
        this.app.use('/api/admin', this.createAdminRoutes());
        // Plugin management routes
        this.app.use('/api/plugins', this.createPluginRoutes());
        // Workflow routes
        this.app.use('/api/workflows', this.createWorkflowRoutes());
    }
    createMCPRoutes() {
        const router = express_1.default.Router();
        // Authenticate middleware
        const authenticateToken = async (req, res, next) => {
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: 'Access token required' });
            }
            const gatewayToken = await this.authService.validateToken(token);
            if (!gatewayToken) {
                return res.status(403).json({ error: 'Invalid or expired token' });
            }
            req.user = { token: gatewayToken };
            next();
        };
        // MCP JSON-RPC endpoint
        router.post('/rpc', authenticateToken, async (req, res) => {
            try {
                const request = req.body;
                const requestId = req.requestId;
                const userToken = req.user.token;
                // Security validation
                const securityValidation = await this.securityManager.validateRequest(request, userToken);
                if (!securityValidation.valid) {
                    return res.status(400).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32600,
                            message: securityValidation.reason || 'Security validation failed'
                        },
                        id: request.id
                    });
                }
                // Process the MCP request
                const response = await this.processGatewayRequest({
                    gatewayToken: userToken.token,
                    method: request.method,
                    params: request.params,
                    requestId,
                    timestamp: new Date()
                });
                // Record performance metrics
                this.performanceMonitor.endRequest(requestId, res.locals.duration || 0, response.error ? 'error' : 'success');
                if (response.error) {
                    res.status(500).json({
                        jsonrpc: '2.0',
                        error: response.error,
                        id: request.id
                    });
                }
                else {
                    res.json({
                        jsonrpc: '2.0',
                        result: response.result,
                        id: request.id
                    });
                }
            }
            catch (error) {
                console.error('MCP request failed:', error);
                this.performanceMonitor.endRequest(req.requestId || '', res.locals.duration || 0, 'error');
                res.status(500).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: 'Internal error',
                        data: error?.message || 'Unknown error'
                    },
                    id: req.body?.id
                });
            }
        });
        // Get available backends
        router.get('/backends', authenticateToken, async (req, res) => {
            try {
                const backends = this.getAllBackends();
                res.json({
                    success: true,
                    backends: backends.map(backend => ({
                        id: backend.id,
                        name: backend.name,
                        type: backend.type,
                        status: backend.status,
                        capabilities: backend.config.capabilities,
                        tools: backend.tools.length
                    }))
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error?.message || 'Unknown error'
                });
            }
        });
        // Get backend tools
        router.get('/backends/:backendId/tools', authenticateToken, async (req, res) => {
            try {
                const { backendId } = req.params;
                const backend = this.gatewayService.getBackend(backendId);
                if (!backend) {
                    return res.status(404).json({
                        success: false,
                        error: 'Backend not found'
                    });
                }
                res.json({
                    success: true,
                    backend: {
                        id: backend.id,
                        name: backend.name,
                        type: backend.type
                    },
                    tools: backend.tools
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error?.message || 'Unknown error'
                });
            }
        });
        return router;
    }
    createAdminRoutes() {
        const router = express_1.default.Router();
        // Admin authentication middleware (simplified for demo)
        const adminAuth = (req, res, next) => {
            const adminKey = req.headers['x-admin-key'];
            if (adminKey !== process.env.ADMIN_KEY) {
                return res.status(403).json({ error: 'Admin access required' });
            }
            next();
        };
        // System stats
        router.get('/stats', adminAuth, async (req, res) => {
            try {
                const stats = {
                    system: {
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        version: process.version
                    },
                    performance: this.performanceMonitor.getGlobalMetrics(),
                    security: this.securityManager.getSecurityStatus(),
                    tenants: this.authService.getAllTenants().length,
                    identities: this.authService.getAllIdentities().length,
                    tokens: this.authService.getAllTokens().length,
                    backends: this.getAllBackends().length,
                    plugins: this.pluginManager.getInstalledPlugins().length
                };
                res.json({
                    success: true,
                    stats
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error?.message || 'Unknown error'
                });
            }
        });
        // Security incidents
        router.get('/security/incidents', adminAuth, (req, res) => {
            try {
                const incidents = this.securityManager.getRecentIncidents(100);
                res.json({
                    success: true,
                    incidents
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: error?.message || 'Unknown error'
                });
            }
        });
        return router;
    }
    createPluginRoutes() {
        const router = express_1.default.Router();
        // Plugin management endpoints would go here
        // These would be protected and allow plugin installation/management
        return router;
    }
    createWorkflowRoutes() {
        const router = express_1.default.Router();
        // Workflow management endpoints would go here
        // These would allow creating and managing visual workflows
        return router;
    }
    setupServiceEventHandlers() {
        // Gateway service events
        this.gatewayService.on('backend:registered', (backend) => {
            console.log(`🔌 Backend registered: ${backend.name}`);
            this.performanceMonitor.registerBackend(backend.id, backend.name);
        });
        this.gatewayService.on('backend:error', (error) => {
            console.error('Backend error:', error);
        });
        // Security events
        this.securityManager.on('security:incident', (incident) => {
            console.warn(`🚨 Security incident: ${incident.type} - ${incident.message}`);
        });
        // Performance alerts
        this.performanceMonitor.on('performance:alert', (alert) => {
            console.warn(`⚠️ Performance alert: ${alert.type}`, alert);
        });
        // Plugin events
        this.pluginManager.on('plugin:installed', (plugin) => {
            console.log(`📦 Plugin installed: ${plugin.name}`);
        });
        // Marketplace events
        this.marketplace.on('plugin:downloaded', (event) => {
            console.log(`📥 Plugin downloaded: ${event.pluginId}`);
        });
        // Auth events
        this.authService.on('token:created', (token) => {
            console.log(`🔑 Token created: ${token.name}`);
        });
    }
    setupErrorHandlers() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found',
                path: req.originalUrl,
                method: req.method
            });
        });
        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Unhandled error:', error);
            // Record security incident for errors
            this.securityManager.logIncident({
                type: 'unhandled_error',
                message: `Unhandled error in ${req.method} ${req.path}: ${error.message}`,
                timestamp: new Date(),
                severity: 'medium',
                metadata: {
                    method: req.method,
                    path: req.path,
                    error: error.message
                }
            });
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                requestId: req.requestId
            });
        });
    }
    // Helper methods
    async processGatewayRequest(request) {
        // Simplified gateway request processing
        return {
            result: { message: 'Gateway request processed successfully' },
            error: null
        };
    }
    getAllBackends() {
        // Return empty array for now - would integrate with actual gateway service
        return [];
    }
    getApp() {
        return this.app;
    }
    async start(port = 3000) {
        return new Promise((resolve) => {
            this.app.listen(port, () => {
                console.log(`🚀 Universal MCP Gateway started on port ${port}`);
                console.log(`📊 Admin panel: http://localhost:${port}/admin`);
                console.log(`🔒 Authentication: http://localhost:${port}/api/auth`);
                console.log(`🏪 Marketplace: http://localhost:${port}/api/marketplace`);
                console.log(`🔌 MCP Gateway: http://localhost:${port}/api/mcp`);
                resolve();
            });
        });
    }
    async stop() {
        // Cleanup services
        await this.gatewayService.destroy();
        await this.authService.destroy();
        await this.marketplace.destroy();
        await this.pluginManager.destroy();
        await this.performanceMonitor.destroy();
        await this.securityManager.destroy();
    }
}
exports.MCPGatewayApp = MCPGatewayApp;
//# sourceMappingURL=app.js.map