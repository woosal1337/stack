# Changelog

All notable changes to stack are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-06-11

### Added

- Cross-platform Claude Desktop paths: `%APPDATA%\Claude` on Windows, `$XDG_CONFIG_HOME/Claude` (default `~/.config/Claude`) on Linux, unchanged on macOS.
- `STACK_HOME` environment variable to override the scanned home directory.
- Fixture-based test suite: a generated fake home exercises every scanner hermetically, including plugin caches, lockfile version resolution, and bundled skill sources.
- CI matrix across ubuntu, macos, and windows (windows marked experimental).
- npm package `@woosal1337/stack` with tag-triggered publish (provenance) and GitHub Release automation.
- Demo GIF recorded with vhs.

### Fixed

- `CLAUDE.md` and `AGENTS.md` project memory items no longer render under the MCPs group; the project overlay now returns separate `mcp` and `memory` results in every output format (tables, `--json`, `--versions-only`).

## [0.1.0] - 2026-06-08

### Added

- Initial release: read-only inventory CLI for Claude Code, Claude Desktop, Codex, and Cursor — plugins, skills, MCPs, agents, commands, hooks, extensions, marketplaces, and project memory, with table/JSON/versions-only/doctor output.
