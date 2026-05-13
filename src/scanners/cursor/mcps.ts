import type { InventoryItem, ScanResult } from "../../types.js";
import { paths } from "../../paths.js";
import { readJson } from "../../util/fs.js";

interface CursorMcpFile {
  mcpServers?: Record<
    string,
    { command?: string; args?: string[]; url?: string; env?: Record<string, string> }
  >;
}

export function scanCursorMcps(): ScanResult {
  const warnings: string[] = [];
  const items: InventoryItem[] = [];

  const config = readJson<CursorMcpFile>(paths.cursor.mcp);
  if (!config) {
    return { tool: "cursor", kind: "mcp", items, warnings };
  }

  for (const [name, server] of Object.entries(config.mcpServers ?? {})) {
    const transport = server.url ? "http" : server.command ? "stdio" : "unknown";
    const source =
      server.url ??
      (server.command
        ? `${server.command.split("/").pop()} ${(server.args ?? []).join(" ")}`.trim()
        : undefined);
    items.push({
      tool: "cursor",
      kind: "mcp",
      name,
      scope: "user",
      source: source && source.length > 60 ? `${source.slice(0, 57)}…` : source,
      extra: { transport },
    });
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return { tool: "cursor", kind: "mcp", items, warnings };
}
