import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TOOLS } from "./tools";

const server = new McpServer({ name: "devforge", version: "1.0.0" });

for (const tool of TOOLS) {
  server.tool(tool.name, tool.description, tool.inputSchema, async (args: any) => {
    try {
      const result = await tool.handler(args);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: error.message }) }] };
    }
  });
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
