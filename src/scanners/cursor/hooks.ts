import type { InventoryItem, ScanResult } from "../../types.js";
import { paths } from "../../paths.js";
import { readJson } from "../../util/fs.js";

interface HookEntry {
  type?: string;
  command?: string;
}

interface HookGroup {
  hooks?: HookEntry[];
}

interface CursorHooksFile {
  hooks?: Record<string, HookGroup[]>;
}

export function scanCursorHooks(): ScanResult {
  const warnings: string[] = [];
  const items: InventoryItem[] = [];

  const config = readJson<CursorHooksFile>(paths.cursor.hooks);
  if (!config?.hooks) {
    return { tool: "cursor", kind: "hook", items, warnings };
  }

  for (const [event, groups] of Object.entries(config.hooks)) {
    for (const group of groups) {
      for (const hook of group.hooks ?? []) {
        items.push({
          tool: "cursor",
          kind: "hook",
          name: event,
          scope: "user",
          source: hook.command && hook.command.length > 60 ? `${hook.command.slice(0, 57)}…` : hook.command,
          extra: { type: hook.type },
        });
      }
    }
  }

  return { tool: "cursor", kind: "hook", items, warnings };
}
