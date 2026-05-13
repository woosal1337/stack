# Security policy

## Threat model

`stack` is a strictly read-only CLI. It does the following, and only the following:

1. Reads JSON / TOML / Markdown files inside `~/.claude`, `~/.codex`, `~/.cursor`, `~/Library/Application Support/Claude`, and the current working directory.
2. Optionally invokes `git rev-parse --short HEAD` as a subprocess for version resolution.
3. Writes formatted output to stdout / stderr.

It does not:

- Write, modify, or delete any file on disk.
- Open network sockets.
- Phone home, collect telemetry, or report usage.
- Execute commands beyond the single read-only `git rev-parse` invocation noted above.

Anything outside this contract is a security bug. Please report it.

## Supported versions

Until `1.0.0`, only the latest published version on `main` is supported.

## Reporting a vulnerability

Please email **woosal@pm.me** with:

- A short description of the issue.
- A reproducer (commands, files, expected vs. actual behavior).
- Your suggested severity, if any.

Please do **not** open a public issue for vulnerabilities. Expect a first response within a week.

## Out of scope

- Issues caused by malicious files in `~/.claude`, `~/.codex`, etc. `stack` is a passive reader. If an attacker can already write into those directories, the integrity of your dev environment is already compromised.
- Reports against dependencies (`mri`, `picocolors`, `smol-toml`). Please report those upstream.
