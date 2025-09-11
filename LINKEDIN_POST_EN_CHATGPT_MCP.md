# LinkedIn Post — N8N + ChatGPT/Claude MCP

Hi everyone! 🚀

We’ve just shipped a robust MCP bridge that connects ChatGPT (and Claude) to n8n automation — securely, fast, and easy to deploy.

What we achieved
- Full ChatGPT Connectors support via SSE ✅
- WebSocket + OAuth support for Claude and advanced scenarios ✅
- Tight CORS at the app and Traefik levels (allowlist) ✅
- Fresh docs and curl examples for quick testing ✅
- Docker + Traefik deployment with clean ports and health checks ✅

What this enables
- Manage n8n workflows directly from ChatGPT/Claude: create, update, execute, list history, and more.
- Securely connect any n8n instance by host + API key or via OAuth for Claude.
- Flexibility: SSE for ChatGPT, WS/OAuth for Claude — choose per use case.

Technical highlights
- SSE endpoint compatible with ChatGPT Connectors at `/sse` with POST to `/sse/message`.
- CORS controlled via `CORS_ORIGIN` (comma-separated allowlist), e.g.:
  `https://chat.openai.com, https://chatgpt.com, https://n8n-mcp.right-api.com`.
- Traefik labels aligned with the same CORS policy (allowlist, expose-headers, allow-credentials).
- Ports standardized: SSE 3004, WS 3006, OAuth 3007.

Security
- Session separation and minimal, configurable persistence under `/app/data`.
- Set strong admin credentials and precise `CORS_ORIGIN` in production.

Getting started
- Run in SSE mode for ChatGPT: `MCP_MODE=sse` and `PORT=3004`.
- Set `CORS_ORIGIN` to ChatGPT + your domain(s).
- Connect the ChatGPT Connector to `/sse` as described in README (curl test included).

Repo
- GitHub: https://github.com/shaike1/n8n-chatgpt-mcp

Credits & CTA
- Feedback is welcome, stars ⭐️ and PRs too.
- Need help deploying or integrating? DM me.

—
Release: v1.0.2-chatgpt (CORS/Traefik tightened, docs updated)
