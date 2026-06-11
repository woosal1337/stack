<div align="center">

<img src="./assets/logo.png" alt="stack" width="180" />

# stack

**List every plugin, skill, MCP, agent, command, and hook installed for Claude Code, Claude Desktop, Codex, and Cursor on this machine.**

[![ci](https://github.com/woosal1337/stack/actions/workflows/ci.yml/badge.svg)](https://github.com/woosal1337/stack/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/%40woosal1337%2Fstack)](https://www.npmjs.com/package/@woosal1337/stack)
[![license](https://img.shields.io/github/license/woosal1337/stack?color=blue)](./LICENSE)
[![node](https://img.shields.io/badge/node-%E2%89%A518-43853d)](https://nodejs.org)

</div>

A single read-only command that answers *"what is actually installed on this machine, across every coding-agent tool I use, and at what version?"* Inspired by [`ccusage`](https://github.com/ryoppippi/ccusage).

## Why

The agentic-CLI surface has gotten wide. On one machine you can have:

- **Claude Code** — plugins, skills (user / project / bundled-in-plugin), MCPs (user, project, plugin), agents, slash commands, hooks, settings overlays.
- **Claude Desktop** — a separate MCP config and DXT extensions.
- **Codex** — plugins via marketplace, hooks.
- **Cursor** — MCPs, hooks.
- **Project overlays** — `.claude/`, `.mcp.json`, `CLAUDE.md`, `AGENTS.md`.

`stack` walks all of those locations and renders a compact, table-style inventory with versions, scopes, and sources. It never writes anything.

## Install

No install needed:

```bash
npx @woosal1337/stack
# or
bunx @woosal1337/stack
```

To install globally as the `stack` command:

```bash
npm install -g @woosal1337/stack
stack
```

Running straight from the repo also works: `bunx github:woosal1337/stack`.

Works on macOS, Linux, and (experimentally) Windows — Claude Desktop config paths resolve per platform.

## Demo

![stack demo](./assets/demo.gif)

```text
Claude Code Plugins  (4)
┌──────────────────────────────────────┬────────────┬──────────┬────────────────────────────┐
│ NAME                                 │ VERSION    │ SCOPE    │ SOURCE                     │
├──────────────────────────────────────┼────────────┼──────────┼────────────────────────────┤
│ codex                                │ 1.0.4      │ user     │ openai-codex               │
│ compound-engineering                 │ 3.6.0      │ user     │ compound-engineering-plug… │
│ discord                              │ 0.0.4      │ user     │ claude-plugins-official    │
│ frontend-design                      │ —          │ project  │ claude-plugins-official    │
└──────────────────────────────────────┴────────────┴──────────┴────────────────────────────┘

Claude Code MCPs  (3)
┌──────────────────────────────┬────────────┬──────────┬─────────────────────────────────┐
│ NAME                         │ TRANSPORT  │ SCOPE    │ SOURCE                          │
├──────────────────────────────┼────────────┼──────────┼─────────────────────────────────┤
│ ebrain                       │ stdio      │ user     │ gbrain serve                    │
│ linear-server                │ http       │ user     │ https://mcp.linear.app/mcp      │
│ media-mcp                    │ stdio      │ user     │ node /…/media-mcp/dist/index.js │
└──────────────────────────────┴────────────┴──────────┴─────────────────────────────────┘
```

## Usage

```bash
stack                       # full inventory, grouped by tool
stack --tool claude-code    # one tool only
stack --kind mcp            # MCPs across all tools
stack --kind skill --scope user
stack --search compound     # substring match against name + description
stack --versions-only       # tool/kind/name@version, one per line
stack --json                # machine-readable
stack --doctor              # surface warnings only
stack --no-project          # skip $PWD overlay
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
| Claude Code | `~/.claude/plugins/installed_plugins.json`, `~/.claude/skills/`, `~/.claude/agents/`, `~/.claude/commands/`, `~/.claude/settings.json`, `~/.claude.json` (mcpServers + per-project), plugin-bundled `agents/`, `commands/`, and `skills/` inside `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/` |
| Claude Desktop | `claude_desktop_config.json` and `Claude Extensions/` under `~/Library/Application Support/Claude` (macOS), `%APPDATA%\Claude` (Windows), or `$XDG_CONFIG_HOME/Claude` (Linux) |
| Codex | `~/.codex/config.toml` (plugins + marketplaces), `~/.codex/skills/`, `~/.codex/hooks.json` |
| Cursor | `~/.cursor/mcp.json`, `~/.cursor/hooks.json` |
| Project overlay (current working directory) | `.mcp.json`, `.claude/`, `CLAUDE.md`, `AGENTS.md` |

Version resolution order per item: manifest `.version` → version segment in install path → marketplace lockfile → `unknown`.

## Non-goals

- **Not a package manager.** `stack` never installs, removes, updates, or modifies anything. Read-only by design.
- **Not a config validator.** It surfaces what is installed, not whether it's wired up correctly. Use `claude mcp list` or per-tool diagnostics for that.
- **No telemetry.** No network calls except an optional local `git rev-parse` for version resolution.

## Develop

```bash
bun install
bun run dev          # run from source
bun test             # unit tests
bun run typecheck    # tsc --noEmit
bun run build        # bundle to dist/cli.js with shebang
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the workflow and code style. Security reports go to [SECURITY.md](./SECURITY.md).

## License

MIT, see [LICENSE](./LICENSE).
