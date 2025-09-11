"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
class N8nAdapter {
    constructor(config) {
        this.isConnected = false;
        this.config = config;
        this.client = axios_1.default.create({
            baseURL: config.baseUrl,
            headers: {
                'X-N8N-API-KEY': config.authentication.credentials.apiKey,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
    }
    async connect() {
        try {
            // Test connection by getting N8N info
            const response = await this.client.get('/api/v1/workflows');
            console.log(`✅ Connected to N8N: Found ${response.data.data?.length || 0} workflows`);
            this.isConnected = true;
        }
        catch (error) {
            console.error('❌ Failed to connect to N8N:', error.message);
            throw new Error(`N8N connection failed: ${error.message}`);
        }
    }
    async disconnect() {
        this.isConnected = false;
        console.log('🔌 Disconnected from N8N');
    }
    async getTools() {
        const tools = [
            {
                name: 'list_workflows',
                description: 'List all available workflows',
                inputSchema: {
                    type: 'object',
                    properties: {
                        active: {
                            type: 'boolean',
                            description: 'Filter by active status'
                        },
                        tags: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Filter by workflow tags'
                        }
                    }
                },
                backendId: this.config.id,
                category: 'workflows',
                tags: ['n8n', 'workflows', 'list']
            },
            {
                name: 'execute_workflow',
                description: 'Execute a workflow manually',
                inputSchema: {
                    type: 'object',
                    required: ['workflowId'],
                    properties: {
                        workflowId: {
                            type: 'string',
                            description: 'Workflow ID to execute'
                        },
                        data: {
                            type: 'object',
                            description: 'Input data for the workflow'
                        }
                    }
                },
                backendId: this.config.id,
                category: 'execution',
                tags: ['n8n', 'workflow', 'execute']
            },
            {
                name: 'get_workflow',
                description: 'Get workflow details',
                inputSchema: {
                    type: 'object',
                    required: ['workflowId'],
                    properties: {
                        workflowId: {
                            type: 'string',
                            description: 'Workflow ID'
                        }
                    }
                },
                backendId: this.config.id,
                category: 'workflows',
                tags: ['n8n', 'workflow', 'details']
            },
            {
                name: 'activate_workflow',
                description: 'Activate or deactivate a workflow',
                inputSchema: {
                    type: 'object',
                    required: ['workflowId', 'active'],
                    properties: {
                        workflowId: {
                            type: 'string',
                            description: 'Workflow ID'
                        },
                        active: {
                            type: 'boolean',
                            description: 'Activation status'
                        }
                    }
                },
                backendId: this.config.id,
                category: 'management',
                tags: ['n8n', 'workflow', 'activate']
            },
            {
                name: 'get_executions',
                description: 'Get workflow execution history',
                inputSchema: {
                    type: 'object',
                    properties: {
                        workflowId: {
                            type: 'string',
                            description: 'Filter by workflow ID'
                        },
                        status: {
                            type: 'string',
                            enum: ['success', 'error', 'waiting', 'running'],
                            description: 'Filter by execution status'
                        },
                        limit: {
                            type: 'integer',
                            default: 20,
                            description: 'Number of executions to return'
                        }
                    }
                },
                backendId: this.config.id,
                category: 'execution',
                tags: ['n8n', 'executions', 'history']
            },
            {
                name: 'get_execution',
                description: 'Get specific execution details',
                inputSchema: {
                    type: 'object',
                    required: ['executionId'],
                    properties: {
                        executionId: {
                            type: 'string',
                            description: 'Execution ID'
                        },
                        includeData: {
                            type: 'boolean',
                            default: false,
                            description: 'Include execution data'
                        }
                    }
                },
                backendId: this.config.id,
                category: 'execution',
                tags: ['n8n', 'execution', 'details']
            },
            {
                name: 'create_workflow',
                description: 'Create a new workflow',
                inputSchema: {
                    type: 'object',
                    required: ['name', 'nodes'],
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Workflow name'
                        },
                        nodes: {
                            type: 'array',
                            description: 'Workflow nodes configuration'
                        },
                        connections: {
                            type: 'object',
                            description: 'Node connections'
                        },
                        active: {
                            type: 'boolean',
                            default: false,
                            description: 'Activate workflow after creation'
                        },
                        tags: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Workflow tags'
                        }
                    }
                },
                backendId: this.config.id,
                category: 'workflows',
                tags: ['n8n', 'workflow', 'create']
            },
            {
                name: 'update_workflow',
                description: 'Update an existing workflow',
                inputSchema: {
                    type: 'object',
                    required: ['workflowId'],
                    properties: {
                        workflowId: {
                            type: 'string',
                            description: 'Workflow ID to update'
                        },
                        name: {
                            type: 'string',
                            description: 'Updated workflow name'
                        },
                        nodes: {
                            type: 'array',
                            description: 'Updated workflow nodes'
                        },
                        connections: {
                            type: 'object',
                            description: 'Updated node connections'
                        },
                        tags: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Updated workflow tags'
                        }
                    }
                },
                backendId: this.config.id,
                category: 'workflows',
                tags: ['n8n', 'workflow', 'update']
            },
            {
                name: 'webhook_trigger',
                description: 'Trigger a workflow via webhook',
                inputSchema: {
                    type: 'object',
                    required: ['webhookPath'],
                    properties: {
                        webhookPath: {
                            type: 'string',
                            description: 'Webhook path/ID'
                        },
                        method: {
                            type: 'string',
                            enum: ['GET', 'POST', 'PUT', 'DELETE'],
                            default: 'POST',
                            description: 'HTTP method'
                        },
                        data: {
                            type: 'object',
                            description: 'Payload data for webhook'
                        },
                        headers: {
                            type: 'object',
                            description: 'Custom headers'
                        }
                    }
                },
                backendId: this.config.id,
                category: 'webhooks',
                tags: ['n8n', 'webhook', 'trigger']
            }
        ];
        return tools;
    }
    async callTool(name, args) {
        if (!this.isConnected) {
            throw new Error('N8N adapter not connected');
        }
        try {
            console.log(`⚡ Calling N8N tool: ${name}`, args);
            switch (name) {
                case 'list_workflows':
                    const workflowsResponse = await this.client.get('/api/v1/workflows');
                    let workflows = workflowsResponse.data.data || [];
                    if (args.active !== undefined) {
                        workflows = workflows.filter((w) => w.active === args.active);
                    }
                    if (args.tags?.length) {
                        workflows = workflows.filter((w) => args.tags.some((tag) => w.tags?.includes(tag)));
                    }
                    return workflows.map((w) => ({
                        id: w.id,
                        name: w.name,
                        active: w.active,
                        tags: w.tags || [],
                        createdAt: w.createdAt,
                        updatedAt: w.updatedAt
                    }));
                case 'execute_workflow':
                    const executeResponse = await this.client.post(`/api/v1/workflows/${args.workflowId}/execute`, { data: args.data || {} });
                    return executeResponse.data;
                case 'get_workflow':
                    const workflowResponse = await this.client.get(`/api/v1/workflows/${args.workflowId}`);
                    return workflowResponse.data;
                case 'activate_workflow':
                    const activateResponse = await this.client.patch(`/api/v1/workflows/${args.workflowId}`, { active: args.active });
                    return activateResponse.data;
                case 'get_executions':
                    let executionsUrl = '/api/v1/executions';
                    const params = {
                        limit: args.limit || 20
                    };
                    if (args.workflowId)
                        params.workflowId = args.workflowId;
                    if (args.status)
                        params.status = args.status;
                    const executionsResponse = await this.client.get(executionsUrl, { params });
                    return executionsResponse.data.data || [];
                case 'get_execution':
                    const executionResponse = await this.client.get(`/api/v1/executions/${args.executionId}`, { params: { includeData: args.includeData || false } });
                    return executionResponse.data;
                case 'create_workflow':
                    const createResponse = await this.client.post('/api/v1/workflows', {
                        name: args.name,
                        nodes: args.nodes,
                        connections: args.connections || {},
                        active: args.active || false,
                        tags: args.tags || []
                    });
                    return createResponse.data;
                case 'update_workflow':
                    const updateData = {};
                    if (args.name)
                        updateData.name = args.name;
                    if (args.nodes)
                        updateData.nodes = args.nodes;
                    if (args.connections)
                        updateData.connections = args.connections;
                    if (args.tags)
                        updateData.tags = args.tags;
                    const updateResponse = await this.client.patch(`/api/v1/workflows/${args.workflowId}`, updateData);
                    return updateResponse.data;
                case 'webhook_trigger':
                    // Construct webhook URL
                    const webhookUrl = `${this.config.baseUrl}/webhook/${args.webhookPath}`;
                    const method = args.method || 'POST';
                    const webhookResponse = await (0, axios_1.default)({
                        method: method.toLowerCase(),
                        url: webhookUrl,
                        data: args.data || {},
                        headers: {
                            'Content-Type': 'application/json',
                            ...args.headers
                        }
                    });
                    return {
                        status: webhookResponse.status,
                        data: webhookResponse.data,
                        headers: webhookResponse.headers
                    };
                default:
                    throw new Error(`Unknown N8N tool: ${name}`);
            }
        }
        catch (error) {
            console.error(`❌ N8N tool error (${name}):`, error.message);
            throw new Error(`N8N API error: ${error.response?.data?.message || error.message}`);
        }
    }
    async authenticate(credentials) {
        try {
            this.client.defaults.headers['X-N8N-API-KEY'] = credentials.apiKey;
            await this.client.get('/api/v1/workflows');
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getStatus() {
        if (!this.isConnected)
            return 'disconnected';
        try {
            await this.client.get('/api/v1/workflows');
            return 'connected';
        }
        catch (error) {
            return 'error';
        }
    }
    async healthCheck() {
        try {
            const response = await this.client.get('/api/v1/workflows');
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
}
exports.N8nAdapter = N8nAdapter;
//# sourceMappingURL=n8n-adapter.js.map