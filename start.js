// Simple launcher that selects which MCP server to run
const mode = (process.env.MCP_MODE || 'oauth').toLowerCase();

const target = mode === 'ws'
  ? './mcp-ws-server.js'
  : mode === 'sse'
    ? './mcp-http-server.js'
    : './oauth-mcp-server.js';

console.log(`[start] MCP_MODE=${mode} launching ${target}`);
import(target).catch((err) => {
  console.error('[start] Failed to start server:', err);
  process.exit(1);
});

