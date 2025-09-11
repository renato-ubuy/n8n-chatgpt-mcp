// Minimal MCP client to validate the local n8n MCP server over stdio.
// Usage:
//   N8N_API_KEY=... N8N_API_URL=https://app.right-api.com node n8nmcp/test-client.mjs

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  const client = new Client(
    { name: "codex-mcp-test-client", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  const transport = new StdioClientTransport({
    command: "node",
    args: ["n8nmcp/index-mcp.js"],
    env: {
      ...process.env,
      // Ensure the child receives key+URL even if not exported globally
      N8N_API_KEY: process.env.N8N_API_KEY || "",
      N8N_API_URL: process.env.N8N_API_URL || process.env.N8N_HOST || "https://app.right-api.com",
    },
  });

  await client.connect(transport);
  console.log("MCP connected.");

  const tools = await client.listTools();
  console.log("Tools:", tools.tools.map(t => t.name));

  // Call get_workflows via MCP
  const res = await client.callTool({ name: "get_workflows", arguments: {} });
  const text = res.content?.[0]?.text || "";
  let data;
  try { data = JSON.parse(text); } catch { data = null; }
  const list = Array.isArray(data?.data) ? data.data : [];
  console.log("Workflows count:", list.length, "First:", list[0]?.id, list[0]?.name);

  await client.close();
}

main().catch((err) => {
  console.error("Client error:", err?.message || err);
  process.exit(1);
});

