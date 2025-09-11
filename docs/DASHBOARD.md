# Admin Dashboard — Multi‑Host N8N Management (Planned)

This project will include a lightweight admin dashboard (similar to `ha-mcp-bridge`) to manage one or more N8N API hosts used by the MCP server.

Goals
- Add/remove/update multiple N8N hosts (base URL + API key + friendly name)
- Validate connectivity (simple `/api/v1/workflows` probe)
- Set a default host per runtime/session
- Persist host entries under `/app/data` (JSON) with optional encryption-at-rest (TBD)
- Expose minimal APIs for the UI and MCP tool to switch hosts

Planned UX
- Route: `/admin` (password-protected) served by the OAuth service container
- Views:
  - Hosts list (name, URL, status)
  - Add host (fields: name, base URL, API key)
  - Test/Set default/Delete actions per host
- Security:
  - Uses `ADMIN_USERNAME`/`ADMIN_PASSWORD` (same as OAuth admin)
  - CORS aligned with existing policy (`CORS_ORIGIN`)

API Sketch (subject to change)
- `GET /admin/api/hosts` → list hosts
- `POST /admin/api/hosts` → add host
- `PATCH /admin/api/hosts/:id` → update
- `DELETE /admin/api/hosts/:id` → remove
- `POST /admin/api/hosts/:id/test` → connectivity test
- `POST /admin/api/hosts/:id/default` → set default for session/server

Storage
- File: `/app/data/n8n-hosts.json`
- Structure:
```json
{
  "hosts": [
    { "id": "uuid", "name": "Prod", "url": "https://n8n.example.com", "apiKey": "***", "createdAt": "ISO", "updatedAt": "ISO" }
  ],
  "defaultHostId": "uuid"
}
```

Timeline
- Milestone 1: Read/write JSON storage + API endpoints
- Milestone 2: Simple HTML UI served by OAuth container
- Milestone 3: Integrate with MCP tools (`set_n8n_credentials`, list/switch hosts)

Notes
- The `mcp-gateway/web-admin.html` can inform the UI structure (fields and quick test helpers)
- Keep the scope minimal; avoid introducing heavy dependencies
