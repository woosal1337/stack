import { homedir } from "node:os";
import { join } from "node:path";

const HOME = process.env.STACK_HOME ?? homedir();

function claudeDesktopRoot(): string {
  if (process.platform === "darwin") {
    return join(HOME, "Library", "Application Support", "Claude");
  }
  if (process.platform === "win32") {
    return join(process.env.APPDATA ?? join(HOME, "AppData", "Roaming"), "Claude");
  }
  return join(process.env.XDG_CONFIG_HOME ?? join(HOME, ".config"), "Claude");
}

const CLAUDE_DESKTOP_ROOT = claudeDesktopRoot();

export const paths = {
  home: HOME,

  claude: {
    root: join(HOME, ".claude"),
    settings: join(HOME, ".claude", "settings.json"),
    settingsLocal: join(HOME, ".claude", "settings.local.json"),
    userConfig: join(HOME, ".claude.json"),
    skillsDir: join(HOME, ".claude", "skills"),
    agentsDir: join(HOME, ".claude", "agents"),
    commandsDir: join(HOME, ".claude", "commands"),
    pluginsDir: join(HOME, ".claude", "plugins"),
    installedPlugins: join(HOME, ".claude", "plugins", "installed_plugins.json"),
    pluginsCache: join(HOME, ".claude", "plugins", "cache"),
    externalSkills: join(HOME, ".claude", "external"),
  },

  claudeDesktop: {
    root: CLAUDE_DESKTOP_ROOT,
    config: join(CLAUDE_DESKTOP_ROOT, "claude_desktop_config.json"),
    extensions: join(CLAUDE_DESKTOP_ROOT, "Claude Extensions"),
    extensionsManifest: join(CLAUDE_DESKTOP_ROOT, "extensions-installations.json"),
  },

  codex: {
    root: join(HOME, ".codex"),
    config: join(HOME, ".codex", "config.toml"),
    hooks: join(HOME, ".codex", "hooks.json"),
    skillsDir: join(HOME, ".codex", "skills"),
    pluginsDir: join(HOME, ".codex", "plugins"),
    bundledMarketplaces: join(HOME, ".codex", ".tmp", "bundled-marketplaces"),
  },

  cursor: {
    root: join(HOME, ".cursor"),
    mcp: join(HOME, ".cursor", "mcp.json"),
    hooks: join(HOME, ".cursor", "hooks.json"),
  },

  agents: {
    root: join(HOME, ".agents"),
    skillsDir: join(HOME, ".agents", "skills"),
    skillLock: join(HOME, ".agents", ".skill-lock.json"),
  },

  project: (cwd: string) => ({
    root: cwd,
    claudeDir: join(cwd, ".claude"),
    claudeSettings: join(cwd, ".claude", "settings.json"),
    claudeSettingsLocal: join(cwd, ".claude", "settings.local.json"),
    claudeSkillsDir: join(cwd, ".claude", "skills"),
    claudeAgentsDir: join(cwd, ".claude", "agents"),
    claudeCommandsDir: join(cwd, ".claude", "commands"),
    mcpJson: join(cwd, ".mcp.json"),
    claudeMd: join(cwd, "CLAUDE.md"),
    agentsMd: join(cwd, "AGENTS.md"),
    codexDir: join(cwd, ".codex"),
  }),
};
