import type { InventoryItem, ScanResult, ScanOptions } from "../../types.js";
import { paths } from "../../paths.js";
import { readJson } from "../../util/fs.js";

interface HookEntry {
  type?: string;
  command?: string;
  matcher?: string;
}

interface HookGroup {
  matcher?: string;
  hooks?: HookEntry[];
}

interface SettingsFile {
  hooks?: Record<string, HookGroup[]>;
}

export function scanClaudeCodeHooks(options: ScanOptions): ScanResult {
  const warnings: string[] = [];
  const items: InventoryItem[] = [];

  const sources: { path: string; scope: "user" | "project" }[] = [
    { path: paths.claude.settings, scope: "user" },
    { path: paths.claude.settingsLocal, scope: "user" },
  ];

  if (options.includeProject) {
    sources.push({ path: paths.project(options.cwd).claudeSettings, scope: "project" });
    sources.push({ path: paths.project(options.cwd).claudeSettingsLocal, scope: "project" });
  }

  for (const { path, scope } of sources) {
    const config = readJson<SettingsFile>(path);
    if (!config?.hooks) continue;
    for (const [event, groups] of Object.entries(config.hooks)) {
      for (const group of groups) {
        for (const hook of group.hooks ?? []) {
          items.push({
            tool: "claude-code",
            kind: "hook",
            name: `${event}${group.matcher ? `:${group.matcher}` : ""}`,
            scope,
            source: shortenCommand(hook.command),
            path,
            extra: { type: hook.type },
          });
        }
      }
    }
  }

  return { tool: "claude-code", kind: "hook", items, warnings };
}

function shortenCommand(command: string | undefined): string | undefined {
  if (!command) return undefined;
  if (command.length <= 60) return command;
  return `${command.slice(0, 57)}…`;
}
