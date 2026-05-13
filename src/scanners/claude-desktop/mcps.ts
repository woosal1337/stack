import type { InventoryItem, ScanResult } from "../../types.js";
import { paths } from "../../paths.js";
import { readJson } from "../../util/fs.js";

interface DesktopConfig {
  mcpServers?: Record<
    string,
    { command?: string; args?: string[]; url?: string; env?: Record<string, string> }
  >;
}

export function scanClaudeDesktopMcps(): ScanResult {
  const warnings: string[] = [];
  const items: InventoryItem[] = [];

  const config = readJson<DesktopConfig>(paths.claudeDesktop.config);
  if (!config) {
    return { tool: "claude-desktop", kind: "mcp", items, warnings };
  }

  for (const [name, server] of Object.entries(config.mcpServers ?? {})) {
    const transport = server.url ? "http" : server.command ? "stdio" : "unknown";
    const source =
      server.url ??
      compactCommand(server.command, server.args);
    items.push({
      tool: "claude-desktop",
      kind: "mcp",
      name,
      scope: "user",
      source,
      extra: { transport },
    });
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return { tool: "claude-desktop", kind: "mcp", items, warnings };
}

function compactCommand(command?: string, args?: string[]): string | undefined {
  if (!command) return undefined;
  const head = command.split("/").pop() ?? command;
  const tail = args?.join(" ") ?? "";
  const combined = `${head} ${tail}`.trim();
  return combined.length > 60 ? `${combined.slice(0, 57)}…` : combined;
}
