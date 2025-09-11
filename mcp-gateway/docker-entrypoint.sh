#!/bin/sh
set -e

# MCP Gateway Docker Entrypoint Script

echo "🚀 Starting MCP Gateway..."

# Initialize plugins directory if it doesn't exist
if [ ! -d "/app/plugins" ]; then
    echo "📦 Initializing plugins directory..."
    mkdir -p /app/plugins
fi

# Initialize data directory
if [ ! -d "/app/data" ]; then
    echo "💾 Initializing data directory..."
    mkdir -p /app/data
fi

# Check if database needs initialization
if [ ! -f "/app/data/gateway.db" ]; then
    echo "🗄️ Initializing database..."
    # Database will be created automatically by the application
fi

# Install default plugins if none exist
if [ ! -f "/app/plugins/package.json" ]; then
    echo "🔌 Installing default plugins..."
    cd /app/plugins
    npm init -y
    
    # Install official plugins
    echo "Installing N8N plugin..."
    npm install --save-optional @mcp-gateway/n8n-plugin || echo "⚠️ N8N plugin not available yet"
    
    echo "Installing Slack plugin..."
    npm install --save-optional @mcp-gateway/slack-plugin || echo "⚠️ Slack plugin not available yet"
    
    cd /app
fi

# Set up environment
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}
export HOST=${HOST:-0.0.0.0}

# Log configuration
echo "🔧 Configuration:"
echo "  - Environment: $NODE_ENV"
echo "  - Port: $PORT"
echo "  - Host: $HOST"
echo "  - Auth Enabled: ${AUTH_ENABLED:-true}"
echo "  - Plugins Directory: ${PLUGINS_DIR:-/app/plugins}"
echo "  - Log Level: ${LOG_LEVEL:-info}"

# Wait for dependencies
if [ "$DATABASE_URL" ]; then
    echo "⏳ Waiting for database connection..."
    # Add database connection check if needed
fi

# Start the application
echo "🚀 Starting MCP Gateway server..."
exec "$@"