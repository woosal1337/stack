import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const home = mkdtempSync(join(tmpdir(), "stack-fixture-home-"));
const project = mkdtempSync(join(tmpdir(), "stack-fixture-project-"));

process.env.STACK_HOME = home;
process.env.STACK_TEST_PROJECT = project;
delete process.env.XDG_CONFIG_HOME;
delete process.env.APPDATA;

function file(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function json(path: string, value: unknown): void {
  file(path, JSON.stringify(value, null, 2));
}

const pluginInstallPath = join(home, ".claude", "plugins", "cache", "demo-market", "demo-plugin", "1.2.3");

json(join(home, ".claude", "plugins", "installed_plugins.json"), {
  version: 1,
  plugins: {
    "demo-plugin@demo-market": [
      {
        scope: "user",
        version: "1.2.3",
        installPath: pluginInstallPath,
        installedAt: "2026-05-01T00:00:00Z",
        lastUpdated: "2026-06-01T00:00:00Z",
        gitCommitSha: "abcdef1234567890",
      },
    ],
  },
});

file(
  join(pluginInstallPath, "skills", "bundled-skill", "SKILL.md"),
  "---\nname: bundled-skill\ndescription: Skill shipped inside the demo plugin\n---\nbody\n",
);
file(
  join(pluginInstallPath, "commands", "release.md"),
  "---\nname: release\ndescription: Cut a release\n---\nbody\n",
);

json(join(home, ".claude.json"), {
  mcpServers: {
    ebrain: { url: "https://example.com/mcp" },
    "media-mcp": { command: "/usr/local/bin/node", args: ["server.js"] },
  },
});

json(join(home, ".claude", "settings.json"), {
  hooks: {
    PreToolUse: [
      { matcher: "Bash", hooks: [{ type: "command", command: "rtk hook claude" }] },
    ],
  },
});

json(join(home, ".claude", "settings.local.json"), {
  hooks: {
    SessionStart: [{ hooks: [{ type: "command", command: "echo session" }] }],
  },
});

file(
  join(home, ".claude", "skills", "alpha-skill", "SKILL.md"),
  "---\nname: alpha-skill\ndescription: Fixture skill for tests\n---\nbody\n",
);
file(
  join(home, ".claude", "agents", "reviewer.md"),
  "---\nname: reviewer\ndescription: Reviews things\n---\nbody\n",
);
file(join(home, ".claude", "commands", "ship.md"), "Ship it.\n");

json(join(home, ".agents", ".skill-lock.json"), {
  skills: {
    "alpha-skill": { version: "0.9.0", source: "agents", commit: "1234567890abcdef" },
  },
});

const desktopRoot =
  process.platform === "darwin"
    ? join(home, "Library", "Application Support", "Claude")
    : process.platform === "win32"
      ? join(home, "AppData", "Roaming", "Claude")
      : join(home, ".config", "Claude");

json(join(desktopRoot, "claude_desktop_config.json"), {
  mcpServers: {
    notion: { url: "https://mcp.notion.com/mcp" },
  },
});

json(join(desktopRoot, "Claude Extensions", "example-ext", "manifest.json"), {
  name: "example-ext",
  display_name: "Example Ext",
  version: "2.0.0",
  description: "A fixture desktop extension",
});

file(
  join(home, ".codex", "config.toml"),
  [
    '[plugins."compound@official"]',
    "enabled = true",
    "",
    "[marketplaces.official]",
    'source = "/marketplaces/official/3.6.0/repo"',
    'source_type = "git"',
    'last_updated = "2026-06-01"',
    "",
  ].join("\n"),
);

file(
  join(home, ".codex", "skills", "codex-skill", "SKILL.md"),
  "---\nname: codex-skill\ndescription: Codex fixture skill\n---\nbody\n",
);

json(join(home, ".codex", "hooks.json"), {
  hooks: {
    PostToolUse: [{ hooks: [{ type: "command", command: "codex-notify" }] }],
  },
});

json(join(home, ".cursor", "mcp.json"), {
  mcpServers: {
    linear: { command: "npx", args: ["-y", "linear-mcp"] },
  },
});

json(join(home, ".cursor", "hooks.json"), {
  hooks: {
    beforeSubmit: [{ hooks: [{ type: "command", command: "cursor-lint" }] }],
  },
});

json(join(project, ".mcp.json"), {
  mcpServers: {
    "project-tool": { command: "./bin/tool", args: [] },
  },
});

file(join(project, "CLAUDE.md"), "# Project instructions\n");
file(join(project, "AGENTS.md"), "# Agent instructions\n");
file(
  join(project, ".claude", "skills", "proj-skill", "SKILL.md"),
  "---\nname: proj-skill\ndescription: Project fixture skill\n---\nbody\n",
);
json(join(project, ".claude", "settings.json"), {
  hooks: {
    PostToolUse: [{ matcher: "Write", hooks: [{ type: "command", command: "project-check" }] }],
  },
});
