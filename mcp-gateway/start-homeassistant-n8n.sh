#!/bin/bash

# MCP Gateway - Home Assistant & N8N Quick Start Script
# This script helps you configure and deploy your MCP Gateway

set -e

echo "🏠🔧 MCP Gateway - Home Assistant & N8N Setup"
echo "============================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}📋 No .env file found. Creating from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo ""
fi

# Function to prompt for configuration
configure_env() {
    echo -e "${BLUE}🔧 Configuration Setup${NC}"
    echo "Please provide the following information:"
    echo ""
    
    # Home Assistant Configuration
    echo -e "${YELLOW}Home Assistant Configuration:${NC}"
    read -p "Enter your Home Assistant URL (e.g., http://192.168.1.100:8123): " HA_URL
    read -p "Enter your Home Assistant Long-Lived Token: " HA_TOKEN
    
    # N8N Configuration
    echo ""
    echo -e "${YELLOW}N8N Configuration:${NC}"
    read -p "Enter your N8N URL (e.g., http://192.168.1.101:5678): " N8N_URL
    read -p "Enter your N8N API Key: " N8N_KEY
    
    # Cloudflare Configuration (optional)
    echo ""
    echo -e "${YELLOW}Cloudflare Tunnel (optional - for remote access):${NC}"
    read -p "Enter your Cloudflare Tunnel Token (leave empty to skip): " CF_TOKEN
    if [ ! -z "$CF_TOKEN" ]; then
        read -p "Enter your domain (e.g., mcp-gateway.yourdomain.com): " CF_DOMAIN
    fi
    
    # Security Configuration
    echo ""
    echo -e "${YELLOW}Security Configuration:${NC}"
    JWT_SECRET=$(openssl rand -base64 32)
    SESSION_SECRET=$(openssl rand -base64 32)
    ADMIN_KEY=$(openssl rand -base64 16)
    
    echo -e "${GREEN}Generated secure secrets automatically${NC}"
    
    # Update .env file
    echo ""
    echo -e "${BLUE}📝 Updating .env file...${NC}"
    
    # Use sed to update the .env file
    sed -i.bak "s|HOME_ASSISTANT_URL=.*|HOME_ASSISTANT_URL=$HA_URL|" .env
    sed -i.bak "s|HOME_ASSISTANT_TOKEN=.*|HOME_ASSISTANT_TOKEN=$HA_TOKEN|" .env
    sed -i.bak "s|N8N_URL=.*|N8N_URL=$N8N_URL|" .env
    sed -i.bak "s|N8N_API_KEY=.*|N8N_API_KEY=$N8N_KEY|" .env
    sed -i.bak "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    sed -i.bak "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|" .env
    sed -i.bak "s|ADMIN_KEY=.*|ADMIN_KEY=$ADMIN_KEY|" .env
    
    if [ ! -z "$CF_TOKEN" ]; then
        sed -i.bak "s|CLOUDFLARE_TUNNEL_TOKEN=.*|CLOUDFLARE_TUNNEL_TOKEN=$CF_TOKEN|" .env
        sed -i.bak "s|CLOUDFLARE_DOMAIN=.*|CLOUDFLARE_DOMAIN=$CF_DOMAIN|" .env
        sed -i.bak "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://claude.ai,https://$CF_DOMAIN,http://localhost:3000|" .env
    fi
    
    # Remove backup file
    rm .env.bak
    
    echo -e "${GREEN}✅ Configuration updated successfully${NC}"
}

# Function to test connections
test_connections() {
    echo ""
    echo -e "${BLUE}🔍 Testing Connections...${NC}"
    
    # Load environment
    source .env
    
    # Test Home Assistant
    echo -n "Testing Home Assistant connection... "
    if curl -s -f -H "Authorization: Bearer $HOME_ASSISTANT_TOKEN" "$HOME_ASSISTANT_URL/api/" > /dev/null; then
        echo -e "${GREEN}✅ Connected${NC}"
    else
        echo -e "${RED}❌ Failed${NC}"
        echo -e "${YELLOW}Please check your Home Assistant URL and token${NC}"
    fi
    
    # Test N8N
    echo -n "Testing N8N connection... "
    if curl -s -f -H "X-N8N-API-KEY: $N8N_API_KEY" "$N8N_URL/api/v1/workflows" > /dev/null; then
        echo -e "${GREEN}✅ Connected${NC}"
    else
        echo -e "${RED}❌ Failed${NC}"
        echo -e "${YELLOW}Please check your N8N URL and API key${NC}"
    fi
}

# Function to start services
start_services() {
    echo ""
    echo -e "${BLUE}🚀 Starting MCP Gateway Services...${NC}"
    
    # Check if Cloudflare tunnel is configured
    source .env
    if [ ! -z "$CLOUDFLARE_TUNNEL_TOKEN" ] && [ "$CLOUDFLARE_TUNNEL_TOKEN" != "your-cloudflare-tunnel-token" ]; then
        echo "Starting with Cloudflare tunnel..."
        docker-compose --profile cloudflare up -d
    else
        echo "Starting without Cloudflare tunnel (local only)..."
        docker-compose up -d mcp-gateway
    fi
    
    echo ""
    echo -e "${GREEN}🎉 MCP Gateway is starting up!${NC}"
    echo ""
    echo "Services status:"
    docker-compose ps
    
    echo ""
    echo -e "${YELLOW}📍 Access URLs:${NC}"
    echo "• Local: http://localhost:3000"
    if [ ! -z "$CLOUDFLARE_DOMAIN" ] && [ "$CLOUDFLARE_DOMAIN" != "mcp-gateway.yourdomain.com" ]; then
        echo "• Remote: https://$CLOUDFLARE_DOMAIN"
    fi
    echo "• Health Check: http://localhost:3000/health"
    echo "• API Documentation: http://localhost:3000/api"
}

# Function to show logs
show_logs() {
    echo ""
    echo -e "${BLUE}📋 Showing recent logs...${NC}"
    docker-compose logs --tail=50 mcp-gateway
}

# Function to stop services
stop_services() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping MCP Gateway Services...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ Services stopped${NC}"
}

# Function to show status
show_status() {
    echo ""
    echo -e "${BLUE}📊 Service Status:${NC}"
    docker-compose ps
    
    echo ""
    echo -e "${BLUE}🔍 Health Checks:${NC}"
    if curl -s http://localhost:3000/health > /dev/null; then
        echo -e "Gateway: ${GREEN}✅ Healthy${NC}"
    else
        echo -e "Gateway: ${RED}❌ Unhealthy${NC}"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo -e "${BLUE}Choose an option:${NC}"
    echo "1) Configure environment (.env)"
    echo "2) Test connections"
    echo "3) Start services"
    echo "4) Stop services"
    echo "5) Show status"
    echo "6) Show logs"
    echo "7) Quick start (configure + test + start)"
    echo "8) Exit"
    echo ""
}

# Quick start function
quick_start() {
    configure_env
    test_connections
    read -p "Continue with starting services? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_services
    fi
}

# Check prerequisites
check_prereqs() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose first.${NC}"
        exit 1
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl not found. Please install curl first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Main script
main() {
    check_prereqs
    
    if [ "$1" == "quick" ]; then
        quick_start
        exit 0
    fi
    
    while true; do
        show_menu
        read -p "Enter your choice [1-8]: " choice
        
        case $choice in
            1) configure_env ;;
            2) test_connections ;;
            3) start_services ;;
            4) stop_services ;;
            5) show_status ;;
            6) show_logs ;;
            7) quick_start ;;
            8) echo "Goodbye! 👋"; exit 0 ;;
            *) echo -e "${RED}Invalid option. Please choose 1-8.${NC}" ;;
        esac
    done
}

# Handle script arguments
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    quick)
        quick_start
        ;;
    *)
        main "$@"
        ;;
esac