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

interface CodexHooksFile {
  hooks?: Record<string, HookGroup[]>;
}

export function scanCodexHooks(): ScanResult {
  const warnings: string[] = [];
  const items: InventoryItem[] = [];

  const config = readJson<CodexHooksFile>(paths.codex.hooks);
  if (!config?.hooks) {
    return { tool: "codex", kind: "hook", items, warnings };
  }

  for (const [event, groups] of Object.entries(config.hooks)) {
    for (const group of groups) {
      for (const hook of group.hooks ?? []) {
        items.push({
          tool: "codex",
          kind: "hook",
          name: event,
          scope: "user",
          source: shortenCommand(hook.command),
          extra: { type: hook.type },
        });
      }
    }
  }

  return { tool: "codex", kind: "hook", items, warnings };
}

function shortenCommand(command: string | undefined): string | undefined {
  if (!command) return undefined;
  return command.length <= 60 ? command : `${command.slice(0, 57)}…`;
}
