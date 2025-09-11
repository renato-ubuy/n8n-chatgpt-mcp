# 🚀 Quick Start: Home Assistant + N8N Integration

Get your MCP Gateway running with **Home Assistant** and **N8N** in under 10 minutes!

## 📋 What You'll Need

- Home Assistant running and accessible on your network
- N8N running and accessible on your network  
- Docker and Docker Compose installed
- (Optional) Cloudflare account for remote access

## ⚡ Super Quick Start

### 1. One-Command Setup
```bash
# Quick interactive setup
./start-homeassistant-n8n.sh quick
```

### 2. Manual Setup (if you prefer control)

#### Step 1: Configure Environment
```bash
# Copy and edit configuration
cp .env.example .env
nano .env
```

Update these key settings:
```bash
# Home Assistant
HOME_ASSISTANT_URL=http://192.168.1.100:8123
HOME_ASSISTANT_TOKEN=your_ha_token_here

# N8N  
N8N_URL=http://192.168.1.101:5678
N8N_API_KEY=your_n8n_api_key_here
```

#### Step 2: Get Your Tokens

**Home Assistant Token:**
1. Go to Home Assistant → Profile → Security
2. Create "Long-lived access token"
3. Copy the token to your `.env` file

**N8N API Key:**
1. Go to N8N → Settings → API
2. Create API Key
3. Copy the key to your `.env` file

#### Step 3: Start Services
```bash
# Local only
docker-compose up -d

# With remote access (if you have Cloudflare tunnel)
docker-compose --profile cloudflare up -d
```

### 3. Test Everything
```bash
# Run comprehensive tests
node test-integrations.js
```

## 🎯 Using Your Gateway

### Connect to Claude.ai
1. In Claude.ai, go to MCP settings
2. Add server: `http://localhost:3000/api/mcp/rpc` (or your Cloudflare domain)
3. Use Bearer token from OAuth flow

### Example Claude Commands
```
"Turn on my living room lights"

"Show me all active automations in Home Assistant"

"Execute my morning routine workflow in N8N"

"What's the temperature of my bedroom sensor?"

"List all my N8N workflows and their status"
```

### API Examples
```bash
# Get access token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/oauth/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "demo_code", "state": "demo_state"}' | jq -r .accessToken)

# Control Home Assistant
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/mcp/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "call_service", 
    "params": {
      "domain": "light",
      "service": "turn_on",
      "entity_id": "light.living_room"
    },
    "id": 1
  }'

# Execute N8N workflow
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/mcp/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "execute_workflow",
    "params": {
      "workflowId": "123",
      "data": {"message": "Hello from Claude!"}
    },
    "id": 1
  }'
```

## 🌐 Remote Access Setup

### Option 1: Cloudflare Tunnel (Recommended)
1. Create tunnel at [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. Get tunnel token
3. Add to `.env`:
   ```bash
   CLOUDFLARE_TUNNEL_TOKEN=your_tunnel_token
   CLOUDFLARE_DOMAIN=mcp-gateway.yourdomain.com
   ```
4. Start with tunnel: `docker-compose --profile cloudflare up -d`

### Option 2: Port Forwarding
1. Forward port 3000 on your router
2. Access via `http://your-public-ip:3000`
3. **⚠️ Enable authentication and HTTPS for security**

### Option 3: VPN Access
1. Connect to your home VPN
2. Access via `http://gateway-local-ip:3000`

## 🔧 Troubleshooting

### Gateway Won't Start
```bash
# Check logs
docker logs mcp-gateway

# Check port availability
netstat -tulpn | grep :3000
```

### Home Assistant Connection Issues
```bash
# Test HA connection directly
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://YOUR_HA_IP:8123/api/

# Common issues:
# - Wrong IP address
# - Expired token
# - Firewall blocking
```

### N8N Connection Issues
```bash
# Test N8N connection directly
curl -H "X-N8N-API-KEY: YOUR_KEY" \
  http://YOUR_N8N_IP:5678/api/v1/workflows

# Common issues:
# - API not enabled in N8N
# - Wrong API key
# - Network unreachable
```

### Can't Access Remotely
```bash
# Check Cloudflare tunnel
docker logs mcp-cloudflared

# Verify tunnel configuration
# Check domain DNS settings
```

## 📚 What's Available

### 🏠 Home Assistant Tools
| Command | What it does |
|---------|-------------|
| `get_states` | Get device states |
| `call_service` | Control devices |
| `get_entities` | List all devices |
| `trigger_automation` | Run automations |
| `set_state` | Update device state |
| `get_history` | Device history |

### ⚡ N8N Tools
| Command | What it does |
|---------|-------------|
| `list_workflows` | Show workflows |
| `execute_workflow` | Run workflow |
| `get_executions` | Execution history |
| `activate_workflow` | Enable/disable |
| `webhook_trigger` | Trigger via webhook |
| `create_workflow` | Build new workflow |

## 🎉 Success!

If everything is working, you should see:
- ✅ Gateway health check passes
- ✅ Home Assistant entities visible
- ✅ N8N workflows accessible
- ✅ Claude.ai can control your home

## 🆘 Need Help?

### Quick Commands
```bash
# Show status
./start-homeassistant-n8n.sh status

# View logs
./start-homeassistant-n8n.sh logs

# Stop everything
./start-homeassistant-n8n.sh stop

# Full restart
docker-compose down && docker-compose up -d
```

### Common Solutions
1. **"Connection refused"** → Check if services are running
2. **"Unauthorized"** → Verify tokens and API keys
3. **"Not found"** → Check URLs and IP addresses
4. **CORS errors** → Update CORS_ORIGIN in .env

### Advanced Setup
- Read `SETUP-HOME-ASSISTANT-N8N.md` for detailed configuration
- Check `docker-compose.yml` for service options
- Review `.env.example` for all settings

---

**🏠 Your smart home is now Claude-powered!** 

Try saying: *"Claude, turn on my living room lights and start my evening routine"* 🚀