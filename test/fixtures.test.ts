import { describe, expect, test } from "bun:test";

import { scanAll } from "../src/scanners/index";
import { scanProjectOverlay } from "../src/scanners/project/overlay";
import { scanClaudeCodePlugins } from "../src/scanners/claude-code/plugins";
import { scanClaudeCodeSkills } from "../src/scanners/claude-code/skills";
import { scanClaudeCodeMcps } from "../src/scanners/claude-code/mcps";
import { scanClaudeCodeAgents, scanClaudeCodeCommands } from "../src/scanners/claude-code/agents";
import { scanClaudeCodeHooks } from "../src/scanners/claude-code/hooks";
import { scanClaudeDesktopMcps } from "../src/scanners/claude-desktop/mcps";
import { scanClaudeDesktopExtensions } from "../src/scanners/claude-desktop/extensions";
import { scanCodexPlugins, scanCodexMarketplaces } from "../src/scanners/codex/plugins";
import { scanCodexSkills } from "../src/scanners/codex/skills";
import { scanCodexHooks } from "../src/scanners/codex/hooks";
import { scanCursorMcps } from "../src/scanners/cursor/mcps";
import { scanCursorHooks } from "../src/scanners/cursor/hooks";
import { renderJson } from "../src/render/json";

const options = {
  home: process.env.STACK_HOME!,
  cwd: process.env.STACK_TEST_PROJECT!,
  includeProject: true,
};

describe("claude-code scanners against fixtures", () => {
  test("plugins: reads installed_plugins.json with version, scope, marketplace, sha", () => {
    const result = scanClaudeCodePlugins(options);
    expect(result.items).toHaveLength(1);
    const plugin = result.items[0]!;
    expect(plugin.name).toBe("demo-plugin");
    expect(plugin.version).toBe("1.2.3");
    expect(plugin.scope).toBe("user");
    expect(plugin.source).toBe("demo-market");
    expect(plugin.extra?.gitSha).toBe("abcdef1");
  });

  test("skills: merges user, project, and bundled sources with lockfile versions", () => {
    const result = scanClaudeCodeSkills(options);
    const names = result.items.map((i) => i.name);
    expect(names).toContain("alpha-skill");
    expect(names).toContain("proj-skill");
    expect(names).toContain("demo-plugin:bundled-skill");

    const alpha = result.items.find((i) => i.name === "alpha-skill")!;
    expect(alpha.scope).toBe("user");
    expect(alpha.version).toBe("0.9.0");
    expect(alpha.source).toBe("agents");
    expect(alpha.extra?.commit).toBe("1234567");

    const proj = result.items.find((i) => i.name === "proj-skill")!;
    expect(proj.scope).toBe("project");

    const bundled = result.items.find((i) => i.name === "demo-plugin:bundled-skill")!;
    expect(bundled.scope).toBe("bundled");
  });

  test("mcps: detects transport per server", () => {
    const result = scanClaudeCodeMcps(options);
    const byName = Object.fromEntries(result.items.map((i) => [i.name, i]));
    expect(byName["ebrain"]!.extra?.transport).toBe("http");
    expect(byName["ebrain"]!.source).toBe("https://example.com/mcp");
    expect(byName["media-mcp"]!.extra?.transport).toBe("stdio");
    expect(byName["media-mcp"]!.source).toBe("node server.js");
  });

  test("agents and commands: frontmatter name wins, basename is fallback", () => {
    const agents = scanClaudeCodeAgents(options);
    expect(agents.items.map((i) => i.name)).toContain("reviewer");

    const commands = scanClaudeCodeCommands(options);
    const names = commands.items.map((i) => i.name);
    expect(names).toContain("ship");
    expect(names).toContain("release");
    const release = commands.items.find((i) => i.name === "release")!;
    expect(release.scope).toBe("bundled");
    expect(release.source).toBe("demo-plugin");
  });

  test("hooks: user settings, local settings, and project settings all surface", () => {
    const result = scanClaudeCodeHooks(options);
    const names = result.items.map((i) => `${i.scope}:${i.name}`);
    expect(names).toContain("user:PreToolUse:Bash");
    expect(names).toContain("user:SessionStart");
    expect(names).toContain("project:PostToolUse:Write");
  });
});

describe("claude-desktop scanners against fixtures", () => {
  test("mcps: reads platform-resolved claude_desktop_config.json", () => {
    const result = scanClaudeDesktopMcps();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.name).toBe("notion");
    expect(result.items[0]!.extra?.transport).toBe("http");
  });

  test("extensions: reads manifest display_name and version", () => {
    const result = scanClaudeDesktopExtensions();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.name).toBe("Example Ext");
    expect(result.items[0]!.version).toBe("2.0.0");
  });
});

describe("codex scanners against fixtures", () => {
  test("plugins: name@marketplace split, version from marketplace source path", () => {
    const result = scanCodexPlugins();
    expect(result.items).toHaveLength(1);
    const plugin = result.items[0]!;
    expect(plugin.name).toBe("compound");
    expect(plugin.source).toBe("official");
    expect(plugin.version).toBe("3.6.0");
    expect(plugin.enabled).toBe(true);
  });

  test("marketplaces: source and type", () => {
    const result = scanCodexMarketplaces();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.name).toBe("official");
    expect(result.items[0]!.extra?.sourceType).toBe("git");
  });

  test("skills and hooks", () => {
    expect(scanCodexSkills().items.map((i) => i.name)).toContain("codex-skill");
    const hooks = scanCodexHooks();
    expect(hooks.items).toHaveLength(1);
    expect(hooks.items[0]!.name).toBe("PostToolUse");
    expect(hooks.items[0]!.source).toBe("codex-notify");
  });
});

describe("cursor scanners against fixtures", () => {
  test("mcps and hooks", () => {
    const mcps = scanCursorMcps();
    expect(mcps.items).toHaveLength(1);
    expect(mcps.items[0]!.name).toBe("linear");
    expect(mcps.items[0]!.source).toBe("npx -y linear-mcp");

    const hooks = scanCursorHooks();
    expect(hooks.items).toHaveLength(1);
    expect(hooks.items[0]!.name).toBe("beforeSubmit");
  });
});

describe("project overlay", () => {
  test("returns separate mcp and memory results", () => {
    const results = scanProjectOverlay(options);
    expect(results).toHaveLength(2);

    const mcp = results.find((r) => r.kind === "mcp")!;
    expect(mcp.items).toHaveLength(1);
    expect(mcp.items[0]!.name).toBe("project-tool");
    expect(mcp.items.every((i) => i.kind === "mcp")).toBe(true);

    const memory = results.find((r) => r.kind === "memory")!;
    expect(memory.items.map((i) => i.name).sort()).toEqual(["AGENTS.md", "CLAUDE.md"]);
    expect(memory.items.every((i) => i.kind === "memory")).toBe(true);
  });

  test("memory items no longer leak into the mcp group", () => {
    const results = scanProjectOverlay(options);
    const mcp = results.find((r) => r.kind === "mcp")!;
    expect(mcp.items.some((i) => i.kind === "memory")).toBe(false);
  });
});

describe("scanAll + renderJson", () => {
  test("full scan covers every tool and groups project memory separately", () => {
    const results = scanAll(options);
    const keys = new Set(results.map((r) => `${r.tool}.${r.kind}`));
    expect(keys.has("claude-code.plugin")).toBe(true);
    expect(keys.has("claude-desktop.extension")).toBe(true);
    expect(keys.has("codex.marketplace")).toBe(true);
    expect(keys.has("cursor.mcp")).toBe(true);
    expect(keys.has("project.mcp")).toBe(true);
    expect(keys.has("project.memory")).toBe(true);

    const parsed = JSON.parse(renderJson(results)) as {
      schema: number;
      results: Record<string, { count: number; items: { kind: string }[] }>;
    };
    expect(parsed.schema).toBe(1);
    expect(parsed.results["project.memory"]!.count).toBe(2);
    expect(parsed.results["project.mcp"]!.items.every((i) => i.kind === "mcp")).toBe(true);
  });
});
