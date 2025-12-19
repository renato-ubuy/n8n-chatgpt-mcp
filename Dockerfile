# ---- build stage ----
FROM node:18-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# This must create /app/dist (see your error about /app/dist/services/mcp-server.js)
RUN npm run build

# ---- runtime stage ----
FROM node:18-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/*.js ./
COPY --from=build /app/healthcheck.cjs ./

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 \
  && mkdir -p /app/data \
  && chown -R nodejs:nodejs /app

USER nodejs
ENV HOST=0.0.0.0

CMD ["node", "start.js"]
