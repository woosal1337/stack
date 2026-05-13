import { join } from "node:path";
import type { InventoryItem, ScanResult } from "../../types.js";
import { paths } from "../../paths.js";
import {
  isDir,
  listDir,
  readFrontmatter,
  cleanFrontmatterValue,
} from "../../util/fs.js";

export function scanCodexSkills(): ScanResult {
  const warnings: string[] = [];
  const items: InventoryItem[] = [];

  if (!isDir(paths.codex.skillsDir)) {
    return { tool: "codex", kind: "skill", items, warnings };
  }

  for (const entry of listDir(paths.codex.skillsDir)) {
    if (entry.startsWith(".")) continue;
    const entryPath = join(paths.codex.skillsDir, entry);
    if (!isDir(entryPath)) continue;
    const fm = readFrontmatter(join(entryPath, "SKILL.md"));
    const name = (fm?.name && cleanFrontmatterValue(fm.name)) || entry;
    const description = fm?.description ? cleanFrontmatterValue(fm.description) : undefined;
    items.push({
      tool: "codex",
      kind: "skill",
      name,
      scope: "user",
      path: entryPath,
      description: description ? truncate(description, 120) : undefined,
    });
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  return { tool: "codex", kind: "skill", items, warnings };
}

function truncate(value: string, n: number): string {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > n ? `${flat.slice(0, n - 1)}…` : flat;
}
