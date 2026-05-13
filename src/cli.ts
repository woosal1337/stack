#!/usr/bin/env node
import mri from "mri";
import { homedir } from "node:os";
import pc from "picocolors";
import type { CliOptions, ItemKind, ScanResult, Scope, Tool } from "./types.js";
import { scanAll } from "./scanners/index.js";
import { renderResult, renderSummary } from "./render/table.js";
import { renderJson } from "./render/json.js";

const VERSION = "0.1.0";

const HELP = `
${pc.bold("stack")} — list every plugin, skill, MCP, agent, command, hook installed for Claude / Codex / Cursor.

${pc.bold("Usage")}
  stack [flags]

${pc.bold("Flags")}
  --tool <name>       Filter by tool: claude-code | claude-desktop | codex | cursor | project | all
  --kind <name>       Filter by kind: plugin | skill | mcp | agent | command | hook | extension | marketplace | memory | all
  --scope <name>      Filter by scope: user | project | bundled | all
  --search <q>        Substring filter against name + description
  --json              Machine-readable JSON output
  --versions-only     Compact name@version output
  --doctor            Surface warnings (missing manifests, broken symlinks, etc)
  --no-project        Skip $PWD project overlay scan
  --no-color          Disable ANSI colors
  --cwd <path>        Override project root (default: cwd)
  -h, --help          Show this help
  -v, --version       Show version

${pc.bold("Examples")}
  stack
  stack --tool claude-code --kind skill
  stack --search compound --json
  stack --versions-only
`;

function parseArgs(argv: string[]): CliOptions {
  const args = mri(argv, {
    boolean: ["json", "versions-only", "doctor", "no-project", "no-color", "help", "version"],
    string: ["tool", "kind", "scope", "search", "cwd"],
    alias: { h: "help", v: "version" },
    default: { "no-color": !process.stdout.isTTY },
  });

  return {
    tool: (args.tool as CliOptions["tool"]) ?? "all",
    kind: (args.kind as CliOptions["kind"]) ?? "all",
    scope: (args.scope as CliOptions["scope"]) ?? "all",
    search: args.search,
    json: Boolean(args.json),
    versionsOnly: Boolean(args["versions-only"]),
    doctor: Boolean(args.doctor),
    noProject: Boolean(args["no-project"]),
    noColor: Boolean(args["no-color"]),
    help: Boolean(args.help),
    version: Boolean(args.version),
    cwd: typeof args.cwd === "string" ? args.cwd : process.cwd(),
  };
}

function applyFilters(results: ScanResult[], opts: CliOptions): ScanResult[] {
  return results
    .filter((r) => opts.tool === "all" || r.tool === opts.tool)
    .filter((r) => opts.kind === "all" || r.kind === opts.kind)
    .map((r) => ({
      ...r,
      items: r.items
        .filter((item) => opts.scope === "all" || item.scope === opts.scope)
        .filter((item) => {
          if (!opts.search) return true;
          const q = opts.search.toLowerCase();
          return (
            item.name.toLowerCase().includes(q) ||
            (item.description ?? "").toLowerCase().includes(q)
          );
        }),
    }));
}

function renderVersionsOnly(results: ScanResult[]): string {
  const lines: string[] = [];
  for (const r of results) {
    for (const item of r.items) {
      const ver = item.version ?? "unknown";
      lines.push(`${r.tool}/${r.kind}/${item.name}@${ver}`);
    }
  }
  return lines.sort().join("\n");
}

function renderDoctor(results: ScanResult[], color: boolean): string {
  const lines: string[] = [];
  for (const r of results) {
    for (const w of r.warnings) {
      const prefix = `[${r.tool}/${r.kind}]`;
      lines.push(color ? `${pc.yellow(prefix)} ${w}` : `${prefix} ${w}`);
    }
  }
  if (lines.length === 0) {
    return color ? pc.green("✓ no issues detected") : "ok: no issues detected";
  }
  return lines.join("\n");
}

function main(): void {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    process.stdout.write(`${HELP}\n`);
    return;
  }
  if (opts.version) {
    process.stdout.write(`stack ${VERSION}\n`);
    return;
  }

  // mri parses --no-* as false on the positive key, so re-derive:
  const home = homedir();
  const includeProject = !opts.noProject;
  const useColor = !opts.noColor;

  const results = scanAll({
    home,
    cwd: opts.cwd,
    includeProject,
  });

  validateFilters(opts);
  const filtered = applyFilters(results, opts);

  if (opts.json) {
    process.stdout.write(`${renderJson(filtered)}\n`);
    return;
  }

  if (opts.versionsOnly) {
    process.stdout.write(`${renderVersionsOnly(filtered)}\n`);
    return;
  }

  if (opts.doctor) {
    process.stdout.write(`${renderDoctor(results, useColor)}\n`);
    return;
  }

  const termWidth = process.stdout.columns && process.stdout.columns > 60
    ? process.stdout.columns
    : 140;

  const blocks: string[] = [];
  for (const r of filtered) {
    const block = renderResult(r, { color: useColor, termWidth });
    if (block) blocks.push(block);
  }

  if (blocks.length === 0) {
    process.stdout.write(`${useColor ? pc.dim("no matching entries") : "no matching entries"}\n`);
    return;
  }

  process.stdout.write(`${blocks.join("\n\n")}\n\n`);
  process.stdout.write(`${renderSummary(filtered, { color: useColor })}\n`);
}

function validateFilters(opts: CliOptions): void {
  const tools: (Tool | "all")[] = [
    "all",
    "claude-code",
    "claude-desktop",
    "codex",
    "cursor",
    "project",
  ];
  const kinds: (ItemKind | "all")[] = [
    "all",
    "plugin",
    "skill",
    "mcp",
    "agent",
    "command",
    "hook",
    "extension",
    "marketplace",
    "memory",
  ];
  const scopes: (Scope | "all")[] = ["all", "user", "project", "bundled", "unknown"];

  if (opts.tool && !tools.includes(opts.tool)) {
    fail(`invalid --tool: ${opts.tool}. expected one of: ${tools.join(", ")}`);
  }
  if (opts.kind && !kinds.includes(opts.kind)) {
    fail(`invalid --kind: ${opts.kind}. expected one of: ${kinds.join(", ")}`);
  }
  if (opts.scope && !scopes.includes(opts.scope)) {
    fail(`invalid --scope: ${opts.scope}. expected one of: ${scopes.join(", ")}`);
  }
}

function fail(message: string): never {
  process.stderr.write(`stack: ${message}\n`);
  process.exit(2);
}

try {
  main();
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`stack: ${msg}\n`);
  process.exit(1);
}
