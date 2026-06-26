---
name: mcp-builder
description: "Generates a complete Model Context Protocol (MCP) server from a plain-English description of the tools you need. Use when asked to 'create an MCP server', 'build MCP tools', 'add MCP integration', 'expose X as an MCP tool', or 'wire up Y to Claude'. Outputs runnable TypeScript or Python and registers the server in .claude/settings.json."
---

# MCP Builder — Bridge to the Wider Tool Ecosystem

You scaffold production-ready MCP servers from a description. MCP (Model Context Protocol) is the open standard that lets Claude call external tools, read resources, and receive structured context at inference time. This skill generates a complete, runnable server and registers it in the project's Claude settings.

## Context

MCP servers communicate over stdio (default) or HTTP+SSE. Each server exposes:
- **Tools** — callable functions with JSON Schema input definitions
- **Resources** — readable data sources (files, DB rows, API responses)
- **Prompts** — named system-prompt templates (optional)

Claude Code discovers servers via `.claude/settings.json` → `mcpServers`.

## Inputs

Ask the user (or infer from context):
1. What tools should the server expose? (names, inputs, outputs)
2. TypeScript or Python? (default: TypeScript with `@modelcontextprotocol/sdk`)
3. Any external APIs, DBs, or services involved?
4. Authentication method? (API key env var, OAuth, none)
5. Where should the server file live? (default: `.claude/mcp-servers/<name>/`)

## Workflow

### 1. Clarify the tool contract

For each tool, define:
- `name`: snake_case verb-noun (`get_weather`, `search_docs`)
- `description`: one sentence — this is what Claude reads to decide whether to call it
- `inputSchema`: JSON Schema object listing parameters
- Return shape: what the tool returns (string, JSON object, array)

### 2. Scaffold the server

#### TypeScript (preferred)

```bash
mkdir -p .claude/mcp-servers/<name>
cd .claude/mcp-servers/<name>
cat > package.json << 'EOF'
{
  "name": "<name>-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": { "start": "node index.js", "build": "tsc" },
  "dependencies": { "@modelcontextprotocol/sdk": "^1.0.0" },
  "devDependencies": { "typescript": "^5.0.0" }
}
EOF
```

Canonical TypeScript server template:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "<name>", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "tool_name",
      description: "What this tool does in one sentence.",
      inputSchema: {
        type: "object",
        properties: {
          param: { type: "string", description: "What param does" },
        },
        required: ["param"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "tool_name") {
    // implement tool logic here
    const result = `processed: ${args?.param}`;
    return { content: [{ type: "text", text: result }] };
  }

  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

#### Python (alternative)

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types

app = Server("<name>")

@app.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="tool_name",
            description="What this tool does.",
            inputSchema={
                "type": "object",
                "properties": {
                    "param": {"type": "string", "description": "What param does"},
                },
                "required": ["param"],
            },
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if name == "tool_name":
        result = f"processed: {arguments['param']}"
        return [types.TextContent(type="text", text=result)]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as streams:
        await app.run(*streams, app.create_initialization_options())

import asyncio
asyncio.run(main())
```

### 3. Implement tool logic

Fill in the actual business logic inside the tool handler. If the tool calls an external API:
- Read API key from `process.env.API_KEY` (TS) or `os.environ["API_KEY"]` (Python)
- Never hardcode credentials
- Use `fetch` (TS) or `httpx` / `aiohttp` (Python) for HTTP

### 4. Register in `.claude/settings.json`

```json
{
  "mcpServers": {
    "<name>": {
      "command": "node",
      "args": [".claude/mcp-servers/<name>/index.js"],
      "env": {
        "API_KEY": "${API_KEY}"
      }
    }
  }
}
```

For Python:
```json
{
  "mcpServers": {
    "<name>": {
      "command": "python",
      "args": [".claude/mcp-servers/<name>/server.py"]
    }
  }
}
```

### 5. Install dependencies and build

TypeScript:
```bash
cd .claude/mcp-servers/<name> && npm install && npx tsc
```

Python:
```bash
pip install mcp
```

### 6. Validate

Test the server manually by sending a `list_tools` request over stdio:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node .claude/mcp-servers/<name>/index.js
```

Verify:
- [ ] Response contains the expected tools array
- [ ] Each tool has `name`, `description`, `inputSchema`
- [ ] `settings.json` is valid JSON with the new server entry

### 7. Commit

```bash
git add .claude/mcp-servers/<name>/ .claude/settings.json
git commit -m "feat: add <name> MCP server with <tool list>"
```

## Output Format

```
MCP Server created: <name>
Language: TypeScript | Python
Tools exposed:
  - <tool_name>: <one-line description>
  - ...
Registered in: .claude/settings.json

Files created:
  .claude/mcp-servers/<name>/index.ts (or server.py)
  .claude/mcp-servers/<name>/package.json (TypeScript only)

To activate: restart Claude Code or reload MCP servers.
```

## Wrap Up

Tell the user the server is ready. Note that MCP servers require a session restart to be discovered. Suggest pairing with the `skill-creator` skill to add workflow-level guidance on top of the new tools.
