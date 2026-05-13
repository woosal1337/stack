import { join } from "node:path";
import type { InventoryItem, ScanResult, ScanOptions, Scope } from "../../types.js";
import { paths } from "../../paths.js";
import {
  exists,
  isDir,
  isSymlink,
  listDir,
  readFrontmatter,
  readJson,
  resolveSymlink,
  cleanFrontmatterValue,
} from "../../util/fs.js";
import { activePluginPaths } from "./plugin-cache.js";

interface SkillLock {
  skills?: Record<string, { version?: string; source?: string; commit?: string }>;
}

export function scanClaudeCodeSkills(options: ScanOptions): ScanResult {
  const warnings: string[] = [];
  const items: InventoryItem[] = [];

  const sources: { dir: string; scope: Scope; pluginName?: string }[] = [
    { dir: paths.claude.skillsDir, scope: "user" },
  ];

  if (options.includeProject) {
    sources.push({ dir: paths.project(options.cwd).claudeSkillsDir, scope: "project" });
  }

  for (const { pluginName, path } of activePluginPaths()) {
    const sub = join(path, "skills");
    if (isDir(sub)) {
      sources.push({ dir: sub, scope: "bundled", pluginName });
    }
  }

  const lock = readJson<SkillLock>(paths.agents.skillLock);
  const seen = new Set<string>();

  for (const { dir, scope, pluginName } of sources) {
    if (!isDir(dir)) continue;

    for (const entry of listDir(dir)) {
      if (entry.startsWith(".")) continue;
      const entryPath = join(dir, entry);
      if (!isDir(entryPath) && !isSymlink(entryPath)) continue;

      const manifestPath = join(entryPath, "SKILL.md");
      const fm = exists(manifestPath) ? readFrontmatter(manifestPath) : undefined;

      const description = fm?.description ? cleanFrontmatterValue(fm.description) : undefined;
      const baseName = (fm?.name && cleanFrontmatterValue(fm.name)) || entry;
      const displayName = pluginName ? `${pluginName}:${baseName}` : baseName;

      const dedupeKey = `${scope}:${pluginName ?? ""}:${baseName}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const linkTarget = resolveSymlink(entryPath);
      const lockEntry = lock?.skills?.[baseName];

      items.push({
        tool: "claude-code",
        kind: "skill",
        name: displayName,
        version: lockEntry?.version,
        scope,
        source: lockEntry?.source ?? pluginName ?? (linkTarget ? sourceFromLink(linkTarget) : undefined),
        path: entryPath,
        description: description ? truncate(description, 120) : undefined,
        extra: {
          link: linkTarget,
          commit: lockEntry?.commit?.slice(0, 7),
        },
      });
    }
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return { tool: "claude-code", kind: "skill", items, warnings };
}

function sourceFromLink(target: string): string | undefined {
  if (target.includes("/.agents/skills/")) return "agents";
  if (target.includes("/open-design/")) return "open-design";
  if (target.includes("/plugins/cache/")) return "plugin";
  return undefined;
}

function truncate(value: string, n: number): string {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > n ? `${flat.slice(0, n - 1)}…` : flat;
}
