import type { InventoryItem, ScanResult, ScanOptions } from "../../types.js";
import { paths } from "../../paths.js";
import { readJson } from "../../util/fs.js";

interface McpServerConfig {
  command?: string;
  args?: string[];
  url?: string;
  type?: string;
  env?: Record<string, string>;
}

interface ClaudeUserConfig {
  mcpServers?: Record<string, McpServerConfig>;
  projects?: Record<string, { mcpServers?: Record<string, McpServerConfig> }>;
}

export function scanClaudeCodeMcps(options: ScanOptions): ScanResult {
  const warnings: string[] = [];
  const items: InventoryItem[] = [];

  const config = readJson<ClaudeUserConfig>(paths.claude.userConfig);
  if (!config) {
    return { tool: "claude-code", kind: "mcp", items, warnings };
  }

  for (const [name, server] of Object.entries(config.mcpServers ?? {})) {
    items.push(buildMcpItem(name, server, "user"));
  }

  if (options.includeProject && config.projects) {
    const projectEntry = config.projects[options.cwd];
    if (projectEntry?.mcpServers) {
      for (const [name, server] of Object.entries(projectEntry.mcpServers)) {
        items.push(buildMcpItem(name, server, "project"));
      }
    }
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return { tool: "claude-code", kind: "mcp", items, warnings };
}

function buildMcpItem(
  name: string,
  server: McpServerConfig,
  scope: "user" | "project",
): InventoryItem {
  const transport = server.url ? "http" : server.command ? "stdio" : (server.type ?? "unknown");
  const source = server.url ?? compactCommand(server.command, server.args);
  return {
    tool: "claude-code",
    kind: "mcp",
    name,
    scope,
    source,
    extra: { transport },
  };
}

function compactCommand(command?: string, args?: string[]): string | undefined {
  if (!command) return undefined;
  const head = command.split("/").pop() ?? command;
  const tail = args?.join(" ") ?? "";
  const combined = `${head} ${tail}`.trim();
  return combined.length > 60 ? `${combined.slice(0, 57)}…` : combined;
}
