const http = require('http');

const mode = (process.env.MCP_MODE || 'oauth').toLowerCase();
const port = mode === 'ws' ? (process.env.PORT || 3006)
  : mode === 'sse' ? (process.env.PORT || 3004)
  : (process.env.PORT || 3007);

const opts = { host: '127.0.0.1', port, path: '/health', timeout: 5000 };

const req = http.get(opts, (res) => {
  process.exit(res.statusCode === 200 ? 0 : 1);
});
req.on('error', () => process.exit(1));
req.end();

