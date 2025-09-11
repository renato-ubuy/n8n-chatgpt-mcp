# 🧪 MCP Gateway Testing Guide

## Quick Start

1. **Start the server:**
```bash
node start-dev.js
```

2. **Test the endpoints:**

### 📋 Health Check
```bash
curl http://localhost:3000/health
```

### 🔐 Authentication Flow

**1. Initiate OAuth:**
```bash
curl -X POST http://localhost:3000/api/auth/oauth/authorize \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "default",
    "redirectUri": "http://localhost:3000/callback",
    "scopes": ["read", "write"]
  }'
```

**2. Complete OAuth (simulate callback):**
```bash
curl -X POST http://localhost:3000/api/auth/oauth/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "demo_auth_code",
    "state": "demo_state"
  }'
```

**3. Validate token:**
```bash
curl -X POST http://localhost:3000/api/auth/validate \
  -H "Authorization: Bearer gw_demo_token_1234567890"
```

### 🏪 Marketplace API

**Search plugins:**
```bash
curl "http://localhost:3000/api/marketplace/search?q=n8n"
```

**Get featured plugins:**
```bash
curl http://localhost:3000/api/marketplace/featured
```

**Get marketplace stats:**
```bash
curl http://localhost:3000/api/marketplace/stats
```

### 🔌 MCP Gateway API

**Get available backends:**
```bash
curl http://localhost:3000/api/mcp/backends \
  -H "Authorization: Bearer gw_demo_token_1234567890"
```

**Execute MCP request:**
```bash
curl -X POST http://localhost:3000/api/mcp/rpc \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer gw_demo_token_1234567890" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 1
  }'
```

## Advanced Testing

### 🔄 Complete Authentication + MCP Flow

```bash
# 1. Get OAuth URL
AUTH_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/oauth/authorize \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "default", "redirectUri": "http://localhost:3000/callback"}')

echo "OAuth URL: $(echo $AUTH_RESPONSE | jq -r .authorizationUrl)"

# 2. Get access token
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/oauth/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "demo_code", "state": "demo_state"}')

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r .accessToken)
echo "Access Token: $ACCESS_TOKEN"

# 3. Use token to access MCP
curl -X POST http://localhost:3000/api/mcp/rpc \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "workflows/execute",
    "params": {"workflowId": "demo-workflow", "input": {"message": "Hello MCP!"}},
    "id": 1
  }' | jq
```

### 🚀 Plugin Installation Simulation

```bash
# Search for plugins
curl "http://localhost:3000/api/marketplace/search?q=slack&category=communication" | jq

# Get plugin details
curl "http://localhost:3000/api/marketplace/plugins/slack-plugin" | jq

# Install plugin (would require authentication in full version)
curl -X POST http://localhost:3000/api/marketplace/plugins/slack-plugin/install \
  -H "Authorization: Bearer gw_demo_token_1234567890" | jq
```

## Integration with Claude.ai

To connect this to Claude.ai, you would:

1. **Configure Claude.ai MCP settings:**
   - Server URL: `http://localhost:3000/api/mcp/rpc`
   - Authentication: Bearer token from OAuth flow

2. **Set up OAuth redirect:**
   - Configure Claude.ai to redirect to your gateway's OAuth endpoint
   - Handle the callback in your application

3. **Use in Claude conversations:**
   ```
   Use the MCP Gateway to execute an N8N workflow
   ```

## Docker Testing

```bash
# Build and run with Docker
docker build -t mcp-gateway .
docker run -p 3000:3000 mcp-gateway

# Or use Docker Compose (if you have docker-compose.yml)
docker-compose up
```

## Production Deployment

For production, you'll want to:

1. Fix the TypeScript compilation errors
2. Set up environment variables for secrets
3. Configure real OAuth providers
4. Set up SSL/TLS certificates
5. Deploy with proper database backend
6. Configure monitoring and logging

## Troubleshooting

**Server won't start?**
- Check if port 3000 is available: `lsof -i :3000`
- Try a different port: `PORT=3001 node start-dev.js`

**API calls failing?**
- Check server logs for errors
- Verify JSON syntax in curl commands
- Ensure Authorization headers are correct

**Need help?**
- Check the server console for detailed logs
- All endpoints return JSON with `success` field
- Error responses include descriptive `error` messages