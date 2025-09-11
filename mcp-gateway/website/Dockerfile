# Right API Website Dockerfile
FROM nginx:alpine

# Install dependencies for build tools
RUN apk add --no-cache \
    nodejs \
    npm \
    curl \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install build dependencies
RUN npm ci --only=production

# Copy source files
COPY src/ ./src/
COPY assets/ ./assets/
COPY build.js ./

# Build the website
RUN npm run build

# Copy built files to nginx
RUN cp -r dist/* /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Create non-root user for security
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 -G nginx-user

# Set proper permissions
RUN chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d

# Switch to non-root user
USER nginx-user

# Expose port
EXPOSE 80

# Labels for metadata
LABEL org.opencontainers.image.title="Right API Website" \
      org.opencontainers.image.description="Professional website for Right API MCP Gateway" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.vendor="Right API Team" \
      org.opencontainers.image.licenses="MIT"

# Start nginx
CMD ["nginx", "-g", "daemon off;"]