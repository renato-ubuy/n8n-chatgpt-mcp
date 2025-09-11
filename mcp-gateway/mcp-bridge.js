#!/usr/bin/env node

/**
 * MCP Bridge - Connects Claude.ai to MCP Gateway
 * This runs as a local MCP server that proxies to the remote gateway
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

const GATEWAY_URL = process.env.GATEWAY_URL || 'https://born-peace-attraction-maintaining.trycloudflare.com';

class MCPBridge {
  constructor() {
    this.server = new Server(
      {
        name: 'home-n8n-gateway',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.accessToken = null;
    this.setupHandlers();
  }

  async authenticate() {
    try {
      const response = await fetch(`${GATEWAY_URL}/api/auth/oauth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'mcp_bridge', state: 'bridge_auth' })
      });
      
      const data = await response.json();
      if (data.success) {
        this.accessToken = data.accessToken;
        return true;
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
    return false;
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      if (!this.accessToken) {
        await this.authenticate();
      }

      return {
        tools: [
          // Home Assistant Tools
          {
            name: 'ha_get_states',
            description: 'Get Home Assistant entity states',
            inputSchema: {
              type: 'object',
              properties: {
                entity_id: { type: 'string', description: 'Specific entity ID (optional)' }
              }
            }
          },
          {
            name: 'ha_call_service',
            description: 'Call a Home Assistant service',
            inputSchema: {
              type: 'object',
              properties: {
                domain: { type: 'string', description: 'Service domain (e.g., light, switch)' },
                service: { type: 'string', description: 'Service name (e.g., turn_on, turn_off)' },
                entity_id: { type: 'string', description: 'Target entity ID' },
                data: { type: 'object', description: 'Additional service data' }
              },
              required: ['domain', 'service']
            }
          },
          {
            name: 'ha_get_entities',
            description: 'List Home Assistant entities by domain',
            inputSchema: {
              type: 'object',
              properties: {
                domain: { type: 'string', description: 'Domain filter (e.g., light, sensor)' }
              }
            }
          },
          {
            name: 'ha_trigger_automation',
            description: 'Trigger a Home Assistant automation',
            inputSchema: {
              type: 'object',
              properties: {
                entity_id: { type: 'string', description: 'Automation entity ID' }
              },
              required: ['entity_id']
            }
          },
          // N8N Tools
          {
            name: 'n8n_list_workflows',
            description: 'List all N8N workflows',
            inputSchema: {
              type: 'object',
              properties: {
                active: { type: 'boolean', description: 'Filter by active status' }
              }
            }
          },
          {
            name: 'n8n_execute_workflow',
            description: 'Execute an N8N workflow',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: { type: 'string', description: 'Workflow ID to execute' },
                data: { type: 'object', description: 'Input data for workflow' }
              },
              required: ['workflowId']
            }
          },
          {
            name: 'n8n_get_executions',
            description: 'Get N8N workflow execution history',
            inputSchema: {
              type: 'object',
              properties: {
                workflowId: { type: 'string', description: 'Filter by workflow ID' },
                limit: { type: 'number', description: 'Limit results (default: 20)' }
              }
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!this.accessToken) {
        await this.authenticate();
      }

      const { name, arguments: args } = request.params;
      
      // Map tool names to gateway methods
      const toolMapping = {
        'ha_get_states': 'get_states',
        'ha_call_service': 'call_service', 
        'ha_get_entities': 'get_entities',
        'ha_trigger_automation': 'trigger_automation',
        'n8n_list_workflows': 'list_workflows',
        'n8n_execute_workflow': 'execute_workflow',
        'n8n_get_executions': 'get_executions'
      };

      const gatewayMethod = toolMapping[name];
      if (!gatewayMethod) {
        throw new Error(`Unknown tool: ${name}`);
      }

      try {
        const response = await fetch(`${GATEWAY_URL}/api/mcp/rpc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: gatewayMethod,
            params: args || {},
            id: 1
          })
        });

        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error.message || 'Gateway error');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.result, null, 2)
            }
          ]
        };
      } catch (error) {
        throw new Error(`Failed to call ${name}: ${error.message}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Bridge connected to:', GATEWAY_URL);
  }
}

// Start the bridge
const bridge = new MCPBridge();
bridge.run().catch(console.error);