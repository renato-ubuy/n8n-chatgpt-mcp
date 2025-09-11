# Multi-stage build for optimal image size
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ sqlite-dev

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    sqlite \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodeuser:nodejs /app/dist ./dist
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodejs /app/package*.json ./

# Create necessary directories
RUN mkdir -p /app/data /app/plugins /app/logs && \
    chown -R nodeuser:nodejs /app

# Copy configuration files
COPY --chown=nodeuser:nodejs docker-entrypoint.sh /usr/local/bin/
COPY --chown=nodeuser:nodejs examples/ ./examples/

# Make entrypoint executable
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Default command
CMD ["node", "dist/index.js"]

# Labels
LABEL org.opencontainers.image.title="MCP Gateway" \
      org.opencontainers.image.description="Universal MCP Gateway - Connect any backend to Claude.ai" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.vendor="MCP Gateway Team" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/mcp-gateway/universal-gateway"