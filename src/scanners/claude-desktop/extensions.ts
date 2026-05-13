import { join } from "node:path";
import type { InventoryItem, ScanResult } from "../../types.js";
import { paths } from "../../paths.js";
import { isDir, listDir, readJson } from "../../util/fs.js";

interface ExtensionManifest {
  name?: string;
  display_name?: string;
  version?: string;
  description?: string;
  author?: { name?: string } | string;
}

export function scanClaudeDesktopExtensions(): ScanResult {
  const warnings: string[] = [];
  const items: InventoryItem[] = [];

  if (!isDir(paths.claudeDesktop.extensions)) {
    return { tool: "claude-desktop", kind: "extension", items, warnings };
  }

  for (const entry of listDir(paths.claudeDesktop.extensions)) {
    const entryDir = join(paths.claudeDesktop.extensions, entry);
    if (!isDir(entryDir)) continue;
    const manifest = readJson<ExtensionManifest>(join(entryDir, "manifest.json"));
    items.push({
      tool: "claude-desktop",
      kind: "extension",
      name: manifest?.display_name ?? manifest?.name ?? entry,
      version: manifest?.version,
      scope: "user",
      path: entryDir,
      description: manifest?.description,
    });
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return { tool: "claude-desktop", kind: "extension", items, warnings };
}
