import type { ScanOptions, ScanResult } from "../types.js";

import { scanClaudeCodePlugins } from "./claude-code/plugins.js";
import { scanClaudeCodeSkills } from "./claude-code/skills.js";
import { scanClaudeCodeMcps } from "./claude-code/mcps.js";
import { scanClaudeCodeAgents, scanClaudeCodeCommands } from "./claude-code/agents.js";
import { scanClaudeCodeHooks } from "./claude-code/hooks.js";

import { scanClaudeDesktopMcps } from "./claude-desktop/mcps.js";
import { scanClaudeDesktopExtensions } from "./claude-desktop/extensions.js";

import { scanCodexPlugins, scanCodexMarketplaces } from "./codex/plugins.js";
import { scanCodexHooks } from "./codex/hooks.js";
import { scanCodexSkills } from "./codex/skills.js";

import { scanCursorMcps } from "./cursor/mcps.js";
import { scanCursorHooks } from "./cursor/hooks.js";

import { scanProjectOverlay } from "./project/overlay.js";

export function scanAll(options: ScanOptions): ScanResult[] {
  const results: ScanResult[] = [
    scanClaudeCodePlugins(options),
    scanClaudeCodeSkills(options),
    scanClaudeCodeMcps(options),
    scanClaudeCodeAgents(options),
    scanClaudeCodeCommands(options),
    scanClaudeCodeHooks(options),

    scanClaudeDesktopMcps(),
    scanClaudeDesktopExtensions(),

    scanCodexPlugins(),
    scanCodexMarketplaces(),
    scanCodexSkills(),
    scanCodexHooks(),

    scanCursorMcps(),
    scanCursorHooks(),
  ];

  if (options.includeProject) {
    results.push(...scanProjectOverlay(options));
  }

  return results;
}
