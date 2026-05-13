import { join } from "node:path";
import type { InventoryItem, ScanResult, ScanOptions, Scope } from "../../types.js";
import { paths } from "../../paths.js";
import {
  isDir,
  listDir,
  readFrontmatter,
  cleanFrontmatterValue,
} from "../../util/fs.js";
import { activePluginPaths } from "./plugin-cache.js";

export function scanClaudeCodeAgents(options: ScanOptions): ScanResult {
  return scanMarkdownEntries(options, "agent", "agents");
}

export function scanClaudeCodeCommands(options: ScanOptions): ScanResult {
  return scanMarkdownEntries(options, "command", "commands");
}

function scanMarkdownEntries(
  options: ScanOptions,
  kind: "agent" | "command",
  subdir: "agents" | "commands",
): ScanResult {
  const warnings: string[] = [];
  const items: InventoryItem[] = [];

  const sources: { dir: string; scope: Scope; pluginName?: string }[] = [
    { dir: join(paths.claude.root, subdir), scope: "user" },
  ];

  if (options.includeProject) {
    sources.push({ dir: join(options.cwd, ".claude", subdir), scope: "project" });
  }

  for (const { pluginName, path } of activePluginPaths()) {
    const sub = join(path, subdir);
    if (isDir(sub)) {
      sources.push({ dir: sub, scope: "bundled", pluginName });
    }
  }

  const seen = new Set<string>();
  for (const { dir, scope, pluginName } of sources) {
    if (!isDir(dir)) continue;
    for (const entry of walkMarkdown(dir)) {
      const fm = readFrontmatter(entry.path);
      const name = (fm?.name && cleanFrontmatterValue(fm.name)) || entry.basename;
      const dedupeKey = `${scope}:${pluginName ?? ""}:${name}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      const description = fm?.description ? cleanFrontmatterValue(fm.description) : undefined;
      items.push({
        tool: "claude-code",
        kind,
        name,
        scope,
        source: pluginName,
        path: entry.path,
        description: description ? truncate(description, 100) : undefined,
      });
    }
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return { tool: "claude-code", kind, items, warnings };
}

function walkMarkdown(dir: string, maxDepth = 2): { path: string; basename: string }[] {
  const out: { path: string; basename: string }[] = [];
  const stack: { dir: string; depth: number }[] = [{ dir, depth: 0 }];
  while (stack.length > 0) {
    const { dir: d, depth } = stack.pop()!;
    for (const entry of listDir(d)) {
      if (entry.startsWith(".")) continue;
      const fullPath = join(d, entry);
      if (entry.endsWith(".md")) {
        out.push({ path: fullPath, basename: entry.replace(/\.md$/, "") });
      } else if (isDir(fullPath) && depth < maxDepth) {
        stack.push({ dir: fullPath, depth: depth + 1 });
      }
    }
  }
  return out;
}

function truncate(value: string, n: number): string {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > n ? `${flat.slice(0, n - 1)}…` : flat;
}
