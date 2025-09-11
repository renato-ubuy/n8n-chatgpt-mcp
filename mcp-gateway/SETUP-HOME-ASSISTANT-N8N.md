# 🏠🔧 MCP Gateway - Home Assistant & N8N Setup Guide

This guide will help you configure your MCP Gateway to manage **Home Assistant** and **N8N workflows** with secure remote access via Cloudflare tunnels.

## 📋 Prerequisites

- Home Assistant instance running and accessible
- N8N instance running and accessible  
- Cloudflare account with a domain
- Docker and Docker Compose installed

## 🔧 Quick Setup

### 1. Clone and Configure

```bash
# Navigate to your MCP Gateway directory
cd /path/to/mcp-gateway

# Copy environment template
cp .env.example .env

# Edit your configuration
nano .env
```

### 2. Configure Home Assistant

#### Get Home Assistant Token:
1. Open Home Assistant web interface
2. Go to **Profile** → **Security** → **Long-lived access tokens**
3. Click **"Create Token"**
4. Give it a name like "MCP Gateway"
5. Copy the generated token

#### Update `.env` file:
```bash
# Home Assistant Configuration
HOME_ASSISTANT_URL=http://192.168.1.100:8123  # Your HA IP
HOME_ASSISTANT_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOi...  # Your token
```

### 3. Configure N8N

#### Get N8N API Key:
1. Open N8N web interface
2. Go to **Settings** → **API** 
3. Click **"Create API Key"**
4. Give it a name like "MCP Gateway"
5. Copy the generated API key

#### Update `.env` file:
```bash
# N8N Configuration
N8N_URL=http://192.168.1.101:5678  # Your N8N IP
N8N_API_KEY=n8n_api_1234567890abcdef...  # Your API key
```

### 4. Setup Cloudflare Tunnel (Remote Access)

#### Create Cloudflare Tunnel:
1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. Navigate to **Access** → **Tunnels**
3. Click **"Create a tunnel"**
4. Choose **"Cloudflared"**
5. Name your tunnel (e.g., "mcp-gateway")
6. Copy the tunnel token

#### Configure Domain:
1. Add a public hostname:
   - **Subdomain**: `mcp-gateway`
   - **Domain**: `yourdomain.com`
   - **Service**: `http://mcp-gateway:3000`
2. Save the tunnel

#### Update `.env` file:
```bash
# Cloudflare Tunnel Configuration
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiYWJjZGVmZ2hpams...  # Your tunnel token
CLOUDFLARE_DOMAIN=mcp-gateway.yourdomain.com

# Update CORS to include your domain
CORS_ORIGIN=https://claude.ai,https://mcp-gateway.yourdomain.com,http://localhost:3000
```

## 🚀 Launch Your Gateway

### Option 1: Full Stack with Cloudflare
```bash
# Start everything including Cloudflare tunnel
docker-compose --profile cloudflare up -d
```

### Option 2: Local Development
```bash
# Start just the gateway for local testing
docker-compose up -d mcp-gateway
```

### Option 3: With Monitoring
```bash
# Include monitoring stack
docker-compose --profile cloudflare --profile monitoring up -d
```

## 🧪 Test Your Setup

### 1. Health Check
```bash
curl https://mcp-gateway.yourdomain.com/health
```

### 2. Test Home Assistant Integration
```bash
# Get OAuth token first
TOKEN=$(curl -s -X POST https://mcp-gateway.yourdomain.com/api/auth/oauth/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "demo_code", "state": "demo_state"}' | jq -r .accessToken)

# List Home Assistant entities
curl -H "Authorization: Bearer $TOKEN" \
  https://mcp-gateway.yourdomain.com/api/mcp/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "get_entities",
    "params": {"domain": "light"},
    "id": 1
  }'
```

### 3. Test N8N Integration
```bash
# List N8N workflows
curl -H "Authorization: Bearer $TOKEN" \
  https://mcp-gateway.yourdomain.com/api/mcp/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0", 
    "method": "list_workflows",
    "params": {"active": true},
    "id": 1
  }'
```

## 🔌 Claude.ai Integration

### Configure Claude.ai MCP Settings:
1. In Claude.ai, go to MCP settings
2. Add server:
   - **Server URL**: `https://mcp-gateway.yourdomain.com/api/mcp/rpc`
   - **Authentication**: Bearer token from OAuth flow

### Example Claude Commands:
```
Turn on the living room lights through Home Assistant

Execute the "Morning Routine" workflow in N8N

Show me all active automations in Home Assistant

List the recent N8N workflow executions
```

## 🏠 Home Assistant Tools Available

| Tool | Description | Example Usage |
|------|-------------|---------------|
| `get_states` | Get entity states | Get all light states |
| `call_service` | Control devices | Turn on lights |
| `get_entities` | List entities by domain | Show all sensors |
| `trigger_automation` | Run automations | Trigger morning routine |
| `set_state` | Update entity state | Set thermostat temp |
| `get_history` | Entity history | Light usage history |

## ⚡ N8N Tools Available

| Tool | Description | Example Usage |
|------|-------------|---------------|
| `list_workflows` | List workflows | Show active workflows |
| `execute_workflow` | Run workflow manually | Execute data sync |
| `get_executions` | Execution history | Show recent runs |
| `activate_workflow` | Enable/disable | Activate automation |
| `webhook_trigger` | Trigger via webhook | External integration |
| `create_workflow` | Build new workflow | Create new automation |

## 🔐 Security Best Practices

### 1. Environment Variables
```bash
# Use strong secrets
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
ADMIN_KEY=$(openssl rand -base64 16)

# Add to .env file
echo "JWT_SECRET=$JWT_SECRET" >> .env
```

### 2. Network Security
```bash
# Restrict access in docker-compose.yml
networks:
  mcp-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### 3. Home Assistant Security
- Use dedicated user for MCP Gateway
- Limit token permissions
- Enable 2FA on Home Assistant

### 4. Cloudflare Security
- Enable Access policies
- Set up authentication rules
- Monitor tunnel usage

## 🔧 Troubleshooting

### Common Issues:

#### 1. Home Assistant Connection Failed
```bash
# Check connectivity
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://YOUR_HA_IP:8123/api/

# Check token validity
# Go to HA Profile → Security → Refresh tokens
```

#### 2. N8N API Key Invalid
```bash
# Test N8N connection
curl -H "X-N8N-API-KEY: YOUR_KEY" \
  http://YOUR_N8N_IP:5678/api/v1/workflows
```

#### 3. Cloudflare Tunnel Not Working
```bash
# Check tunnel status
docker logs mcp-cloudflared

# Verify tunnel token
# Check Cloudflare Zero Trust dashboard
```

#### 4. CORS Errors
```bash
# Update CORS_ORIGIN in .env
CORS_ORIGIN=https://claude.ai,https://your-actual-domain.com
```

## 📊 Monitoring

### Check Logs:
```bash
# Gateway logs
docker logs mcp-gateway -f

# Cloudflare tunnel logs  
docker logs mcp-cloudflared -f

# All services
docker-compose logs -f
```

### Metrics Dashboard:
```bash
# Start monitoring stack
docker-compose --profile monitoring up -d

# Access Grafana
open http://localhost:3001
# Login: admin / your-grafana-password
```

## 🎯 Next Steps

1. **Create Custom Workflows**: Build N8N workflows that trigger Home Assistant actions
2. **Set Up Automations**: Use Claude to trigger complex automation sequences
3. **Mobile Access**: Configure mobile app access through Cloudflare tunnel
4. **Backup Setup**: Enable automatic backups of configurations
5. **Advanced Security**: Set up client certificates and advanced access rules

## 🆘 Support

- **Documentation**: Check the `docs/` directory
- **Issues**: Create GitHub issues for bugs
- **Community**: Join our Discord/Slack for help
- **Enterprise**: Contact for enterprise support

---

Your **Home Assistant** and **N8N** are now accessible through Claude.ai with enterprise-grade security! 🎉

**Example interaction:**
> "Claude, turn on my living room lights and then execute my evening routine workflow in N8N"

The future of home automation is here! 🚀