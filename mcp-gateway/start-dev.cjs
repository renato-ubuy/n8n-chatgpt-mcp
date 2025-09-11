#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

console.log('🚀 Starting Universal MCP Gateway (Development Mode)...');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'https://claude.ai'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      gateway: 'operational',
      auth: 'operational',
      marketplace: 'operational'
    }
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'Universal MCP Gateway',
    version: '1.0.0',
    description: 'Universal MCP Gateway - Connect any MCP backend to Claude.ai',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      marketplace: '/api/marketplace',
      mcp: '/api/mcp'
    },
    documentation: 'https://docs.right-api.com/mcp-gateway'
  });
});

// Mock authentication endpoints
app.post('/api/auth/oauth/authorize', (req, res) => {
  const { tenantId, redirectUri, scopes } = req.body;
  
  res.json({
    success: true,
    authorizationUrl: `https://claude.ai/oauth/authorize?client_id=demo&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${(scopes || ['read', 'write']).join(' ')}&state=demo_state`,
    state: 'demo_state',
    message: 'Redirect user to authorizationUrl to complete OAuth flow'
  });
});

app.post('/api/auth/oauth/callback', (req, res) => {
  const { code, state } = req.body;
  
  res.json({
    success: true,
    accessToken: 'gw_demo_token_' + Date.now(),
    identity: {
      id: 'demo_user',
      name: 'Demo User',
      email: 'demo@claude.ai',
      provider: 'claude'
    },
    message: 'Authentication successful'
  });
});

app.post('/api/auth/validate', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token && token.startsWith('gw_demo_token_')) {
    res.json({
      success: true,
      valid: true,
      token: {
        id: 'demo_token',
        name: 'Demo Token',
        permissions: ['read', 'write'],
        expiresAt: new Date(Date.now() + 3600000)
      },
      identity: {
        id: 'demo_user',
        name: 'Demo User',
        email: 'demo@claude.ai',
        provider: 'claude'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      valid: false,
      error: 'Invalid or expired token'
    });
  }
});

// Mock marketplace endpoints
app.get('/api/marketplace/search', (req, res) => {
  const { q: query } = req.query;
  
  const plugins = [
    {
      id: 'n8n-plugin',
      name: 'N8N Workflow Automation',
      version: '1.0.0',
      description: 'Complete N8N workflow automation integration',
      author: 'Right API Team',
      category: 'automation',
      tags: ['n8n', 'workflow', 'automation'],
      downloads: 1250,
      rating: 4.8,
      reviews: 24,
      verified: true,
      featured: true,
      pricing: { type: 'free' },
      screenshots: ['/images/n8n-plugin-1.png'],
      documentation: 'Complete N8N integration documentation'
    },
    {
      id: 'slack-plugin',
      name: 'Slack Workspace',
      version: '1.2.0',
      description: 'Complete Slack workspace automation and communication',
      author: 'Right API Team',
      category: 'communication',
      tags: ['slack', 'messaging', 'communication'],
      downloads: 987,
      rating: 4.9,
      reviews: 18,
      verified: true,
      featured: true,
      pricing: { type: 'free' },
      screenshots: ['/images/slack-plugin-1.png'],
      documentation: 'Slack workspace integration documentation'
    }
  ];
  
  const filteredPlugins = query 
    ? plugins.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || 
                          p.description.toLowerCase().includes(query.toLowerCase()))
    : plugins;
  
  res.json({
    success: true,
    results: filteredPlugins,
    count: filteredPlugins.length,
    query: query || ''
  });
});

app.get('/api/marketplace/featured', (req, res) => {
  res.json({
    success: true,
    plugins: [
      {
        id: 'n8n-plugin',
        name: 'N8N Workflow Automation',
        description: 'Complete N8N workflow automation integration',
        rating: 4.8,
        downloads: 1250,
        featured: true
      }
    ]
  });
});

app.get('/api/marketplace/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalPlugins: 25,
      totalDownloads: 15430,
      averageRating: 4.7,
      featuredPlugins: 8,
      verifiedPlugins: 20,
      freePlugins: 22,
      paidPlugins: 3,
      categories: 6
    }
  });
});

// Mock MCP endpoint
app.post('/api/mcp/rpc', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || !token.startsWith('gw_demo_token_')) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  const request = req.body;
  
  res.json({
    jsonrpc: '2.0',
    result: {
      message: `Successfully processed ${request.method} request`,
      data: request.params || {},
      backend: 'demo-backend',
      timestamp: new Date().toISOString()
    },
    id: request.id
  });
});

app.get('/api/mcp/backends', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || !token.startsWith('gw_demo_token_')) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  res.json({
    success: true,
    backends: [
      {
        id: 'n8n-demo',
        name: 'N8N Demo Instance',
        type: 'n8n',
        status: 'active',
        capabilities: ['workflows', 'executions'],
        tools: 15
      },
      {
        id: 'slack-demo',
        name: 'Slack Demo Workspace',
        type: 'slack',
        status: 'active',
        capabilities: ['messaging', 'channels'],
        tools: 8
      }
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
app.listen(port, () => {
  console.log('🌟 Universal MCP Gateway started successfully!');
  console.log(`📍 Server running on http://localhost:${port}`);
  console.log('');
  console.log('🔗 Available endpoints:');
  console.log(`  • Health: http://localhost:${port}/health`);
  console.log(`  • API Info: http://localhost:${port}/api`);
  console.log(`  • Authentication: http://localhost:${port}/api/auth`);
  console.log(`  • Marketplace: http://localhost:${port}/api/marketplace`);
  console.log(`  • MCP Gateway: http://localhost:${port}/api/mcp`);
  console.log('');
  console.log('🎯 Ready to test! Try the commands below:');
  console.log('');
});