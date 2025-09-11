#!/usr/bin/env bash
set -euo pipefail

# Deploy the n8n MCP servers (WS/SSE/OAuth) behind Traefik.
# Requires: docker, docker compose, Traefik network `traefik` present, valid DNS.

if ! command -v docker &>/dev/null; then
  echo "Error: docker is required." >&2
  exit 1
fi

DOMAIN=${DOMAIN:-right-api.com}
FQDN="n8n-mcp.${DOMAIN}"

if [[ -z "${N8N_API_KEY:-}" ]]; then
  echo "Error: N8N_API_KEY must be set in environment (export N8N_API_KEY=...)." >&2
  exit 1
fi

export DOMAIN="$DOMAIN"
export CERT_RESOLVER="letsencrypt"
export N8N_HOST=${N8N_HOST:-https://app.right-api.com}

echo "Deploying n8n MCP WS/SSE/OAuth at https://n8n-mcp.right-api.com"
echo "Using N8N_HOST=${N8N_HOST}"

docker compose -f docker-compose.standalone.yml up -d --build n8n-mcp-ws n8n-mcp-server n8n-mcp-oauth

echo "WS Health:   https://n8n-mcp.right-api.com/health (WS server)"
echo "WS Endpoint: wss://n8n-mcp.right-api.com/ws"
echo "SSE Path:    https://n8n-mcp.right-api.com/sse"
echo "OAuth Path:  https://n8n-mcp.right-api.com/oauth"
