#!/usr/bin/env node

/**
 * Proper MCP Server - JSON-RPC over HTTP
 * Follows MCP specification exactly for Claude.ai
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS for Claude.ai
app.use(cors({
  origin: ['https://claude.ai', 'https://*.anthropic.com', '*'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// Server state
let isInitialized = false;
const serverInfo = {
  name: "Home Assistant & N8N Gateway",
  version: "1.0.0"
};

const capabilities = {
  tools: {}
};

// Home Assistant adapter functions
const HomeAssistantAdapter = {
  async getStates(params = {}) {
    const url = params.entity_id 
      ? `https://ha.right-api.com/api/states/${params.entity_id}`
      : 'https://ha.right-api.com/api/states';
    
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${process.env.HOME_ASSISTANT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  },

  async callService(params) {
    const { domain, service, entity_id, ...data } = params;
    const response = await fetch(`https://ha.right-api.com/api/services/${domain}/${service}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HOME_ASSISTANT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entity_id,
        ...data
      })
    });
    return await response.json();
  },

  async getEntities(params = {}) {
    const states = await this.getStates();
    if (params.domain) {
      return states.filter(state => state.entity_id.startsWith(params.domain + '.'));
    }
    return states;
  }
};

// N8N adapter functions
const N8NAdapter = {
  async listWorkflows(params = {}) {
    const response = await fetch('https://app.right-api.com/api/v1/workflows', {
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (params.active !== undefined) {
      return data.data.filter(w => w.active === params.active);
    }
    return data.data;
  },

  async executeWorkflow(params) {
    const { workflowId, data = {} } = params;
    const response = await fetch(`https://app.right-api.com/api/v1/workflows/${workflowId}/execute`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return await response.json();
  },

  async getExecutions(params = {}) {
    const { workflowId, limit = 20 } = params;
    const url = workflowId 
      ? `https://app.right-api.com/api/v1/executions?workflowId=${workflowId}&limit=${limit}`
      : `https://app.right-api.com/api/v1/executions?limit=${limit}`;
    
    const response = await fetch(url, {
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  }
};

// Available tools
const tools = [
  {
    name: 'get_states',
    description: 'Get Home Assistant entity states',
    inputSchema: {
      type: 'object',
      properties: {
        entity_id: { type: 'string', description: 'Specific entity ID (optional)' }
      }
    }
  },
  {
    name: 'call_service', 
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
    name: 'get_entities',
    description: 'List Home Assistant entities by domain',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Domain filter (e.g., light, sensor)' }
      }
    }
  },
  {
    name: 'list_workflows',
    description: 'List all N8N workflows',
    inputSchema: {
      type: 'object',
      properties: {
        active: { type: 'boolean', description: 'Filter by active status' }
      }
    }
  },
  {
    name: 'execute_workflow',
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
    name: 'get_executions',
    description: 'Get N8N workflow execution history',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string', description: 'Filter by workflow ID' },
        limit: { type: 'number', description: 'Limit results (default: 20)' }
      }
    }
  }
];

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    mcp: 'ready',
    protocol: 'json-rpc-http',
    timestamp: new Date().toISOString() 
  });
});

// Main MCP JSON-RPC endpoint
app.post('/', async (req, res) => {
  try {
    const { jsonrpc, method, params, id } = req.body;

    // Validate JSON-RPC format
    if (jsonrpc !== '2.0') {
      return res.json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request' },
        id
      });
    }

    console.log(`MCP Request: ${method}`, params);

    switch (method) {
      case 'initialize':
        isInitialized = true;
        return res.json({
          jsonrpc: '2.0',
          result: {
            protocolVersion: '1.0.0',
            capabilities,
            serverInfo
          },
          id
        });

      case 'tools/list':
        if (!isInitialized) {
          return res.json({
            jsonrpc: '2.0',
            error: { code: -32002, message: 'Server not initialized' },
            id
          });
        }
        return res.json({
          jsonrpc: '2.0',
          result: { tools },
          id
        });

      case 'tools/call':
        if (!isInitialized) {
          return res.json({
            jsonrpc: '2.0',
            error: { code: -32002, message: 'Server not initialized' },
            id
          });
        }

        const { name, arguments: args = {} } = params;
        let result;

        switch (name) {
          case 'get_states':
            result = await HomeAssistantAdapter.getStates(args);
            break;
          case 'call_service':
            result = await HomeAssistantAdapter.callService(args);
            break;
          case 'get_entities':
            result = await HomeAssistantAdapter.getEntities(args);
            break;
          case 'list_workflows':
            result = await N8NAdapter.listWorkflows(args);
            break;
          case 'execute_workflow':
            result = await N8NAdapter.executeWorkflow(args);
            break;
          case 'get_executions':
            result = await N8NAdapter.getExecutions(args);
            break;
          default:
            return res.json({
              jsonrpc: '2.0',
              error: { code: -32601, message: `Unknown tool: ${name}` },
              id
            });
        }

        return res.json({
          jsonrpc: '2.0',
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          },
          id
        });

      default:
        return res.json({
          jsonrpc: '2.0',
          error: { code: -32601, message: `Method not found: ${method}` },
          id
        });
    }

  } catch (error) {
    console.error('MCP Error:', error);
    res.json({
      jsonrpc: '2.0',
      error: { code: -32603, message: error.message },
      id: req.body.id
    });
  }
});

// Legacy endpoints for testing
app.get('/mcp/tools', (req, res) => {
  res.json({ tools });
});

app.post('/mcp/call', async (req, res) => {
  const { name, arguments: args = {} } = req.body;
  
  try {
    let result;
    switch (name) {
      case 'get_states':
        result = await HomeAssistantAdapter.getStates(args);
        break;
      case 'call_service':
        result = await HomeAssistantAdapter.callService(args);
        break;
      case 'get_entities':
        result = await HomeAssistantAdapter.getEntities(args);
        break;
      case 'list_workflows':
        result = await N8NAdapter.listWorkflows(args);
        break;
      case 'execute_workflow':
        result = await N8NAdapter.executeWorkflow(args);
        break;
      case 'get_executions':
        result = await N8NAdapter.getExecutions(args);
        break;
      default:
        return res.status(400).json({ error: `Unknown tool: ${name}` });
    }

    res.json({
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MCP JSON-RPC Server running on port ${PORT}`);
  console.log(`🔗 MCP Endpoint: http://localhost:${PORT}/`);
  console.log(`🌐 Public URL: https://different-recently-analytical-instructor.trycloudflare.com`);
  console.log(`📋 Tools: ${tools.length} available`);
  console.log(`⚡ JSON-RPC over HTTP ready for Claude.ai`);
});

module.exports = app;