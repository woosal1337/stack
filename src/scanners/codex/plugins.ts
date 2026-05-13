import type { InventoryItem, ScanResult } from "../../types.js";
import { paths } from "../../paths.js";
import { readToml } from "../../util/fs.js";
import { versionFromPath } from "../../util/version.js";

interface CodexConfig {
  plugins?: Record<string, { enabled?: boolean }>;
  marketplaces?: Record<string, { source?: string; source_type?: string; last_updated?: string }>;
}

export function scanCodexPlugins(): ScanResult {
  const warnings: string[] = [];
  const items: InventoryItem[] = [];

  const config = readToml<CodexConfig>(paths.codex.config);
  if (!config) {
    return { tool: "codex", kind: "plugin", items, warnings };
  }

  for (const [fullName, entry] of Object.entries(config.plugins ?? {})) {
    const atIndex = fullName.lastIndexOf("@");
    const name = atIndex > 0 ? fullName.slice(0, atIndex) : fullName;
    const marketplace = atIndex > 0 ? fullName.slice(atIndex + 1) : undefined;
    const marketplaceMeta = marketplace ? config.marketplaces?.[marketplace] : undefined;
    items.push({
      tool: "codex",
      kind: "plugin",
      name,
      version: versionFromPath(marketplaceMeta?.source),
      scope: "user",
      source: marketplace,
      enabled: entry.enabled ?? true,
      extra: { sourceType: marketplaceMeta?.source_type },
    });
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return { tool: "codex", kind: "plugin", items, warnings };
}

export function scanCodexMarketplaces(): ScanResult {
  const warnings: string[] = [];
  const items: InventoryItem[] = [];

  const config = readToml<CodexConfig>(paths.codex.config);
  if (!config) {
    return { tool: "codex", kind: "marketplace", items, warnings };
  }

  for (const [name, meta] of Object.entries(config.marketplaces ?? {})) {
    items.push({
      tool: "codex",
      kind: "marketplace",
      name,
      scope: "user",
      source: meta.source,
      extra: {
        sourceType: meta.source_type,
        updated: meta.last_updated,
      },
    });
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return { tool: "codex", kind: "marketplace", items, warnings };
}
