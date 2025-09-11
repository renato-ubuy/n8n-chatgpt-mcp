import { MCPPlugin, MCPBackendAdapter } from '../../src/types/plugin';
import { MCPBackendConfig, MCPTool } from '../../src/types/gateway';
import axios, { AxiosInstance } from 'axios';

// N8N Plugin Implementation Example
export const N8nPlugin: MCPPlugin = {
  name: '@mcp-gateway/n8n-plugin',
  version: '1.0.0',
  description: 'Connect to N8N workflow automation platform with full API access',
  author: 'MCP Gateway Team',
  license: 'MIT',
  tags: ['workflow', 'automation', 'n8n', 'official'],
  
  metadata: {
    category: 'workflow',
    icon: '🔄',
    documentation: 'https://docs.mcp-gateway.dev/plugins/n8n',
    homepage: 'https://n8n.io',
    repository: 'https://github.com/mcp-gateway/n8n-plugin'
  },

  backend: {
    create: async (config: MCPBackendConfig): Promise<MCPBackendAdapter> => {
      return new N8nBackendAdapter(config);
    },

    validateConfig: (config: Partial<MCPBackendConfig>): boolean => {
      return !!(
        config.baseUrl &&
        config.authentication?.credentials?.apiKey
      );
    },

    getDefaultConfig: (): Partial<MCPBackendConfig> => ({
      type: 'n8n',
      authentication: {
        type: 'api_key',
        credentials: {
          apiKey: ''
        }
      },
      capabilities: ['workflows', 'executions', 'nodes', 'credentials']
    }),

    getConfigSchema: () => ({
      type: 'object',
      properties: {
        baseUrl: {
          type: 'string',
          description: 'N8N instance URL (e.g., https://your-n8n.com)',
          pattern: '^https?://.+'
        },
        authentication: {
          type: 'object',
          properties: {
            type: { const: 'api_key' },
            credentials: {
              type: 'object',
              properties: {
                apiKey: {
                  type: 'string',
                  description: 'N8N API key from User Settings > API Keys'
                }
              },
              required: ['apiKey']
            }
          },
          required: ['type', 'credentials']
        }
      },
      required: ['baseUrl', 'authentication']
    })
  },

  // Plugin lifecycle hooks
  async install(): Promise<void> {
    console.log('🔄 Installing N8N plugin...');
    // Perform any installation setup
  },

  async configure(config: any): Promise<void> {
    console.log('⚙️ Configuring N8N plugin with:', config);
    // Validate N8N connection
  }
};

class N8nBackendAdapter implements MCPBackendAdapter {
  private client: AxiosInstance;
  private config: MCPBackendConfig;

  constructor(config: MCPBackendConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'X-N8N-API-KEY': config.authentication.credentials.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async connect(): Promise<void> {
    try {
      // Test connection
      await this.client.get('/api/v1/workflows');
      console.log('✅ Connected to N8N instance');
    } catch (error) {
      throw new Error(`Failed to connect to N8N: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    // N8N doesn't require explicit disconnection
    console.log('🔌 Disconnected from N8N');
  }

  async getTools(): Promise<MCPTool[]> {
    return [
      {
        name: 'get_workflows',
        description: 'Get all N8N workflows with filtering options',
        inputSchema: {
          type: 'object',
          properties: {
            active: { type: 'boolean', description: 'Filter by active status' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
            limit: { type: 'number', description: 'Limit number of results' }
          }
        },
        backendId: this.config.id,
        category: 'workflow'
      },
      {
        name: 'get_workflow',
        description: 'Get detailed information about a specific workflow',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Workflow ID' }
          },
          required: ['id']
        },
        backendId: this.config.id,
        category: 'workflow'
      },
      {
        name: 'create_workflow',
        description: 'Create a new N8N workflow',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Workflow name' },
            nodes: { type: 'array', description: 'Workflow nodes configuration' },
            connections: { type: 'object', description: 'Node connections' },
            active: { type: 'boolean', description: 'Activate workflow after creation' },
            tags: { type: 'array', items: { type: 'string' }, description: 'Workflow tags' }
          },
          required: ['name', 'nodes']
        },
        backendId: this.config.id,
        category: 'workflow'
      },
      {
        name: 'execute_workflow',
        description: 'Execute a workflow manually with optional input data',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Workflow ID' },
            data: { type: 'object', description: 'Input data for workflow execution' }
          },
          required: ['id']
        },
        backendId: this.config.id,
        category: 'execution'
      },
      {
        name: 'get_executions',
        description: 'Get workflow execution history with filtering',
        inputSchema: {
          type: 'object',
          properties: {
            workflowId: { type: 'string', description: 'Filter by workflow ID' },
            status: { type: 'string', enum: ['success', 'error', 'running'], description: 'Filter by status' },
            limit: { type: 'number', description: 'Maximum number of executions to return' }
          }
        },
        backendId: this.config.id,
        category: 'execution'
      },
      {
        name: 'activate_workflow',
        description: 'Activate a workflow to start automatic execution',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Workflow ID' }
          },
          required: ['id']
        },
        backendId: this.config.id,
        category: 'workflow'
      },
      {
        name: 'deactivate_workflow',
        description: 'Deactivate a workflow to stop automatic execution',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Workflow ID' }
          },
          required: ['id']
        },
        backendId: this.config.id,
        category: 'workflow'
      }
    ];
  }

  async callTool(name: string, args: any): Promise<any> {
    console.log(`🔧 Executing N8N tool: ${name}`);

    switch (name) {
      case 'get_workflows':
        return this.getWorkflows(args);
      case 'get_workflow':
        return this.getWorkflow(args.id);
      case 'create_workflow':
        return this.createWorkflow(args);
      case 'execute_workflow':
        return this.executeWorkflow(args.id, args.data);
      case 'get_executions':
        return this.getExecutions(args);
      case 'activate_workflow':
        return this.activateWorkflow(args.id);
      case 'deactivate_workflow':
        return this.deactivateWorkflow(args.id);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async authenticate(credentials: any): Promise<boolean> {
    try {
      this.client.defaults.headers['X-N8N-API-KEY'] = credentials.apiKey;
      await this.client.get('/api/v1/workflows');
      return true;
    } catch {
      return false;
    }
  }

  async getStatus(): Promise<'connected' | 'disconnected' | 'error'> {
    try {
      await this.client.get('/api/v1/workflows', { timeout: 5000 });
      return 'connected';
    } catch {
      return 'error';
    }
  }

  async healthCheck(): Promise<boolean> {
    return (await this.getStatus()) === 'connected';
  }

  // N8N-specific methods
  private async getWorkflows(params: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (params.active !== undefined) {
      queryParams.append('active', params.active.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const response = await this.client.get(`/api/v1/workflows?${queryParams}`);
    let workflows = response.data.data;

    // Filter by tags if specified
    if (params.tags && params.tags.length > 0) {
      workflows = workflows.filter((workflow: any) =>
        workflow.tags?.some((tag: any) => params.tags.includes(tag.name))
      );
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          workflows,
          total: workflows.length,
          filtered: !!params.tags || params.active !== undefined
        }, null, 2)
      }]
    };
  }

  private async getWorkflow(id: string): Promise<any> {
    const response = await this.client.get(`/api/v1/workflows/${id}`);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response.data.data, null, 2)
      }]
    };
  }

  private async createWorkflow(workflow: any): Promise<any> {
    const response = await this.client.post('/api/v1/workflows', workflow);
    
    // Activate if requested
    if (workflow.active) {
      await this.client.post(`/api/v1/workflows/${response.data.data.id}/activate`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          workflow: response.data.data,
          message: `Workflow "${workflow.name}" created successfully${workflow.active ? ' and activated' : ''}`
        }, null, 2)
      }]
    };
  }

  private async executeWorkflow(id: string, data?: any): Promise<any> {
    const payload = data ? { data } : {};
    const response = await this.client.post(`/api/v1/workflows/${id}/execute`, payload);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          execution: response.data.data,
          message: `Workflow execution started with ID: ${response.data.data.id}`
        }, null, 2)
      }]
    };
  }

  private async getExecutions(params: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (params.workflowId) {
      queryParams.append('workflowId', params.workflowId);
    }
    if (params.status) {
      queryParams.append('status', params.status);
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const response = await this.client.get(`/api/v1/executions?${queryParams}`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          executions: response.data.data,
          total: response.data.data.length
        }, null, 2)
      }]
    };
  }

  private async activateWorkflow(id: string): Promise<any> {
    const response = await this.client.post(`/api/v1/workflows/${id}/activate`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          workflow: response.data.data,
          message: `Workflow activated successfully`
        }, null, 2)
      }]
    };
  }

  private async deactivateWorkflow(id: string): Promise<any> {
    const response = await this.client.post(`/api/v1/workflows/${id}/deactivate`);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          workflow: response.data.data,
          message: `Workflow deactivated successfully`
        }, null, 2)
      }]
    };
  }
}

export default N8nPlugin;