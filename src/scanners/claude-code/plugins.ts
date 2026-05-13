import type { InventoryItem, ScanResult, ScanOptions } from "../../types.js";
import { paths } from "../../paths.js";
import { readJson, exists } from "../../util/fs.js";

interface InstalledPluginRecord {
  scope?: "user" | "project";
  projectPath?: string;
  installPath?: string;
  version?: string;
  installedAt?: string;
  lastUpdated?: string;
  gitCommitSha?: string;
}

interface InstalledPluginsFile {
  version?: number;
  plugins?: Record<string, InstalledPluginRecord[]>;
}

export function scanClaudeCodePlugins(_options: ScanOptions): ScanResult {
  const warnings: string[] = [];
  const items: InventoryItem[] = [];

  if (!exists(paths.claude.installedPlugins)) {
    return { tool: "claude-code", kind: "plugin", items, warnings };
  }

  const data = readJson<InstalledPluginsFile>(paths.claude.installedPlugins);
  if (!data?.plugins) {
    warnings.push(`Could not parse ${paths.claude.installedPlugins}`);
    return { tool: "claude-code", kind: "plugin", items, warnings };
  }

  for (const [fullName, records] of Object.entries(data.plugins)) {
    for (const record of records) {
      const [name, marketplace] = fullName.split("@");
      items.push({
        tool: "claude-code",
        kind: "plugin",
        name: name ?? fullName,
        version: record.version && record.version !== "unknown" ? record.version : undefined,
        scope: record.scope === "project" ? "project" : "user",
        source: marketplace,
        path: record.installPath,
        extra: {
          installedAt: record.installedAt,
          lastUpdated: record.lastUpdated,
          gitSha: record.gitCommitSha?.slice(0, 7),
        },
      });
    }
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return { tool: "claude-code", kind: "plugin", items, warnings };
}
