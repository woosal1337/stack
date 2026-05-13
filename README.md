# stack

> List every plugin, skill, MCP, agent, command, and hook installed for Claude Code, Claude Desktop, Codex, and Cursor on this machine.

```
$ bunx github:woosal1337/stack
```

A single, read-only command that answers "what is actually installed on this machine, across every coding-agent tool I use, and at what version?" Inspired by [`ccusage`](https://github.com/ryoppippi/ccusage).

## Why

The agentic-CLI surface has gotten wide. On one machine you can have:

- Claude Code: plugins, skills (user / project / bundled-in-plugin), MCPs (user, project, plugin), agents, slash commands, hooks, settings overlays.
- Claude Desktop: a separate MCP config and DXT extensions.
- Codex: plugins via marketplace, hooks.
- Cursor: MCPs, hooks.
- Project overlays: `.claude/`, `.mcp.json`, `CLAUDE.md`, `AGENTS.md`.

`stack` walks all of those locations and renders a compact, table-style inventory with versions, scope, and sources. It never writes anything.

## Install

No install needed. Run via Bun or Node:

```bash
bunx github:woosal1337/stack
# or
npx github:woosal1337/stack
```

To install locally:

```bash
bun install -g github:woosal1337/stack
stack
```

## Usage

```bash
stack                      # full inventory, grouped by tool
stack --tool claude-code   # claude-code only
stack --kind mcp           # MCPs across all tools
stack --kind skill --scope user
stack --search compound    # substring match against name + description
stack --versions-only      # tool/kind/name@version, one per line
stack --json               # machine-readable
stack --doctor             # surface warnings only
stack --no-project         # skip $PWD overlay
```

### Flags

| Flag | Effect |
|---|---|
| `--tool <name>` | `claude-code` `claude-desktop` `codex` `cursor` `project` `all` (default) |
| `--kind <name>` | `plugin` `skill` `mcp` `agent` `command` `hook` `extension` `marketplace` `memory` `all` (default) |
| `--scope <name>` | `user` `project` `bundled` `all` (default) |
| `--search <q>` | substring filter on name + description |
| `--json` | JSON output |
| `--versions-only` | compact `tool/kind/name@version` lines |
| `--doctor` | only show warnings |
| `--no-project` | skip `$PWD` overlay scan |
| `--no-color` | disable ANSI colors |
| `--cwd <path>` | override project root |
| `-h, --help` | show help |
| `-v, --version` | show version |

## What it scans

| Tool | Locations |
|---|---|
| Claude Code | `~/.claude/plugins/installed_plugins.json`, `~/.claude/skills/`, `~/.claude/agents/`, `~/.claude/commands/`, `~/.claude/settings.json`, `~/.claude.json` (mcpServers + per-project), plugin-bundled `agents/` and `commands/` inside `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/` |
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json`, `~/Library/Application Support/Claude/Claude Extensions/` |
| Codex | `~/.codex/config.toml` (plugins + marketplaces), `~/.codex/skills/`, `~/.codex/hooks.json` |
| Cursor | `~/.cursor/mcp.json`, `~/.cursor/hooks.json` |
| Project overlay (current working directory) | `.mcp.json`, `.claude/`, `CLAUDE.md`, `AGENTS.md` |

Version resolution order per item: manifest `.version` → version segment in install path → marketplace lockfile → `unknown`.

## Output

```
Claude Code Plugins  (4)
┌────────────────────────────────────┬──────────────┬───────────┬────────────────────────────┐
│ NAME                               │ VERSION      │ SCOPE     │ SOURCE                     │
├────────────────────────────────────┼──────────────┼───────────┼────────────────────────────┤
│ codex                              │ 1.0.4        │ user      │ openai-codex               │
│ compound-engineering               │ 3.6.0        │ user      │ compound-engineering-pl... │
│ discord                            │ 0.0.4        │ user      │ claude-plugins-official    │
│ frontend-design                    │ —            │ project   │ claude-plugins-official    │
└────────────────────────────────────┴──────────────┴───────────┴────────────────────────────┘
```

## Develop

```bash
bun install
bun run dev          # run from source
bun test             # unit tests
bun run typecheck    # tsc --noEmit
bun run build        # bundle to dist/cli.js with shebang
```

## License

MIT
