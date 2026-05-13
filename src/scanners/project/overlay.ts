import type { InventoryItem, ScanResult, ScanOptions } from "../../types.js";
import { paths } from "../../paths.js";
import { exists, readJson } from "../../util/fs.js";

interface ProjectMcpFile {
  mcpServers?: Record<
    string,
    { command?: string; args?: string[]; url?: string; type?: string }
  >;
}

export function scanProjectOverlay(options: ScanOptions): ScanResult {
  const warnings: string[] = [];
  const items: InventoryItem[] = [];
  const p = paths.project(options.cwd);

  const mcp = readJson<ProjectMcpFile>(p.mcpJson);
  if (mcp?.mcpServers) {
    for (const [name, server] of Object.entries(mcp.mcpServers)) {
      const transport = server.url ? "http" : server.command ? "stdio" : (server.type ?? "unknown");
      items.push({
        tool: "project",
        kind: "mcp",
        name,
        scope: "project",
        source:
          server.url ??
          (server.command
            ? `${server.command.split("/").pop()} ${(server.args ?? []).join(" ")}`.trim()
            : undefined),
        path: p.mcpJson,
        extra: { transport },
      });
    }
  }

  if (exists(p.claudeMd)) {
    items.push({
      tool: "project",
      kind: "memory",
      name: "CLAUDE.md",
      scope: "project",
      path: p.claudeMd,
    });
  }

  if (exists(p.agentsMd)) {
    items.push({
      tool: "project",
      kind: "memory",
      name: "AGENTS.md",
      scope: "project",
      path: p.agentsMd,
    });
  }

  return { tool: "project", kind: "mcp", items, warnings };
}
