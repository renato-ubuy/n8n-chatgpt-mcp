FROM node:18-alpine

WORKDIR /app

# Copy package manifest and install production deps
COPY package.json ./
RUN npm install --only=production

# Copy project files
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create data directory for persistent storage
RUN mkdir -p /app/data

# Set ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Health check (mode-aware)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.cjs

# Expose ports for all server modes
# SSE: 3004, WS: 3006, OAuth: 3007
EXPOSE 3004 3006 3007

# Start the application (mode via MCP_MODE=oauth|sse|ws)
CMD ["sh", "-c", "node start.js"]
