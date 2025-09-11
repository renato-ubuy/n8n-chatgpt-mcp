#!/usr/bin/env node

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body || '');
  next();
});

// Home Assistant configuration
const HA_URL = process.env.HOME_ASSISTANT_URL || 'https://ha.right-api.com';
const HA_TOKEN = process.env.HOME_ASSISTANT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyODQwYzIzMC04NTE4LTRhZWEtYmM4OC0zNTk1MjhiMDQ5MDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ3Mjg5NjIwfQ.dclIQI4D7-3udOfM_s2A2SHUbEGTM_7D3jneWtQj5NY';

// N8N configuration  
const N8N_URL = process.env.N8N_URL || 'https://app.right-api.com';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyODQwYzIzMC04NTE4LTRhZWEtYmM4OC0zNTk1MjhiMDQ5MDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzQ3Mjg5NjIwfQ.dclIQI4D7-3udOfM_s2A2SHUbEGTM_7D3jneWtQj5NY';

// MCP Tools
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

// Tool implementations
async function executeHomeAssistantTool(name, args) {
  switch (name) {
    case 'get_states':
      const statesUrl = args.entity_id 
        ? `${HA_URL}/api/states/${args.entity_id}`
        : `${HA_URL}/api/states`;
      
      const statesRes = await fetch(statesUrl, {
        headers: { 
          'Authorization': `Bearer ${HA_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      return await statesRes.json();

    case 'call_service':
      const { domain, service, entity_id, ...data } = args;
      const serviceRes = await fetch(`${HA_URL}/api/services/${domain}/${service}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HA_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entity_id, ...data })
      });
      return await serviceRes.json();

    case 'get_entities':
      const allStatesRes = await fetch(`${HA_URL}/api/states`, {
        headers: { 
          'Authorization': `Bearer ${HA_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      const states = await allStatesRes.json();
      if (args.domain) {
        return states.filter(state => state.entity_id.startsWith(args.domain + '.'));
      }
      return states;
  }
}

async function executeN8NTool(name, args) {
  switch (name) {
    case 'list_workflows':
      const workflowsRes = await fetch(`${N8N_URL}/api/v1/workflows`, {
        headers: {
          'Authorization': `Bearer ${N8N_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      const workflowsData = await workflowsRes.json();
      if (args.active !== undefined) {
        return workflowsData.data.filter(w => w.active === args.active);
      }
      return workflowsData.data;

    case 'execute_workflow':
      const { workflowId, data = {} } = args;
      const executeRes = await fetch(`${N8N_URL}/api/v1/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${N8N_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      return await executeRes.json();

    case 'get_executions':
      const { workflowId: execWorkflowId, limit = 20 } = args;
      const execUrl = execWorkflowId 
        ? `${N8N_URL}/api/v1/executions?workflowId=${execWorkflowId}&limit=${limit}`
        : `${N8N_URL}/api/v1/executions?limit=${limit}`;
      
      const execRes = await fetch(execUrl, {
        headers: {
          'Authorization': `Bearer ${N8N_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      return await execRes.json();
  }
}

// Root GET - Server info
app.get('/', (req, res) => {
  res.json({
    mcp: "1.0",
    name: "Home Assistant & N8N Gateway",
    version: "1.0.0",
    description: "Control your home and automate workflows",
    tools: tools.length
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Admin Dashboard - serve the HTML interface
app.get('/admin', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  try {
    const adminHtml = fs.readFileSync(path.join(__dirname, 'web-admin.html'), 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(adminHtml);
  } catch (error) {
    res.status(500).json({ error: 'Admin dashboard not found' });
  }
});

// Plugin management API endpoints
app.get('/api/plugins', (req, res) => {
  res.json({
    installed: [
      { id: 'home-assistant', name: 'Home Assistant', enabled: true, tools: 3 },
      { id: 'n8n', name: 'N8N Workflows', enabled: true, tools: 3 }
    ],
    available: [
      { id: 'github', name: 'GitHub Integration', tools: 5, category: 'development' },
      { id: 'slack', name: 'Slack Bot', tools: 7, category: 'communication' },
      { id: 'notion', name: 'Notion API', tools: 4, category: 'productivity' }
    ]
  });
});

// User management API
app.get('/api/users', (req, res) => {
  res.json({
    currentUser: { id: 1, name: 'Demo User', email: 'demo@example.com' },
    stats: { totalConnections: 42, toolsUsed: 6, uptime: '99.9%' }
  });
});

// Main MCP endpoint
app.post('/', async (req, res) => {
  try {
    const { jsonrpc, method, params = {}, id } = req.body;

    switch (method) {
      case 'initialize':
        return res.json({
          jsonrpc: '2.0',
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: {
              name: 'Home Assistant & N8N Gateway',
              version: '1.0.0'
            }
          },
          id
        });

      case 'tools/list':
        return res.json({
          jsonrpc: '2.0',
          result: { tools },
          id
        });

      case 'prompts/list':
        // HACK: Claude.ai only requests prompts/list and never tools/list
        console.log('HACK: Claude.ai requested prompts/list, sending tools instead!');
        return res.json({
          jsonrpc: '2.0',
          result: { tools },
          id
        });

      case 'resources/list':
        // ULTIMATE HACK: Claude.ai sometimes requests resources/list
        console.log('ULTIMATE HACK: Sending tools for resources/list request');
        return res.json({
          jsonrpc: '2.0',
          result: { tools },
          id
        });

      case 'tools/call':
        const { name, arguments: args = {} } = params;
        let result;

        // Execute the appropriate tool
        if (['get_states', 'call_service', 'get_entities'].includes(name)) {
          result = await executeHomeAssistantTool(name, args);
        } else if (['list_workflows', 'execute_workflow', 'get_executions'].includes(name)) {
          result = await executeN8NTool(name, args);
        } else {
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
    console.error('Error:', error);
    res.json({
      jsonrpc: '2.0',
      error: { code: -32603, message: error.message },
      id: req.body?.id
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MCP Server running on port ${PORT}`);
  console.log(`📋 ${tools.length} tools available`);
  console.log(`🏠 Home Assistant: ${HA_URL}`);
  console.log(`🔧 N8N: ${N8N_URL}`);
});