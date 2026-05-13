import pc from "picocolors";
import type { InventoryItem, ItemKind, ScanResult, Tool } from "../types.js";

const TOOL_LABEL: Record<Tool, string> = {
  "claude-code": "Claude Code",
  "claude-desktop": "Claude Desktop",
  codex: "Codex",
  cursor: "Cursor",
  project: "Project",
};

const KIND_LABEL: Record<ItemKind, string> = {
  plugin: "Plugins",
  skill: "Skills",
  mcp: "MCPs",
  agent: "Agents",
  command: "Commands",
  hook: "Hooks",
  extension: "Extensions",
  marketplace: "Marketplaces",
  memory: "Memory",
};

interface Column {
  header: string;
  width: number;
  get: (item: InventoryItem) => string;
}

const COLUMNS_DEFAULT: Column[] = [
  { header: "NAME", width: 36, get: (i) => i.name },
  { header: "VERSION", width: 12, get: (i) => i.version ?? dim("—") },
  { header: "SCOPE", width: 9, get: (i) => i.scope },
  { header: "SOURCE", width: 26, get: (i) => i.source ?? dim("—") },
];

const COLUMNS_SKILL: Column[] = [
  { header: "NAME", width: 32, get: (i) => i.name },
  { header: "VERSION", width: 10, get: (i) => i.version ?? dim("—") },
  { header: "SCOPE", width: 8, get: (i) => i.scope },
  { header: "SOURCE", width: 14, get: (i) => i.source ?? dim("—") },
  { header: "DESCRIPTION", width: 50, get: (i) => i.description ?? dim("—") },
];

const COLUMNS_MCP: Column[] = [
  { header: "NAME", width: 28, get: (i) => i.name },
  { header: "TRANSPORT", width: 11, get: (i) => String(i.extra?.transport ?? "—") },
  { header: "SCOPE", width: 9, get: (i) => i.scope },
  { header: "SOURCE", width: 50, get: (i) => i.source ?? dim("—") },
];

function columnsFor(kind: ItemKind): Column[] {
  if (kind === "skill" || kind === "command" || kind === "agent") return COLUMNS_SKILL;
  if (kind === "mcp") return COLUMNS_MCP;
  return COLUMNS_DEFAULT;
}

export function renderResult(result: ScanResult, opts: { color: boolean }): string {
  if (result.items.length === 0) return "";
  const cols = columnsFor(result.kind);
  const header = `${TOOL_LABEL[result.tool]} ${KIND_LABEL[result.kind]}  (${result.items.length})`;

  const lines: string[] = [];
  lines.push(opts.color ? pc.bold(pc.cyan(header)) : header);
  lines.push(topRule(cols));
  lines.push(headerRow(cols, opts.color));
  lines.push(midRule(cols));
  for (const item of result.items) {
    lines.push(dataRow(cols, item, opts.color));
  }
  lines.push(bottomRule(cols));

  if (result.warnings.length > 0) {
    for (const w of result.warnings) {
      lines.push(opts.color ? pc.yellow(`! ${w}`) : `! ${w}`);
    }
  }

  return lines.join("\n");
}

export function renderSummary(results: ScanResult[], opts: { color: boolean }): string {
  const grouped = new Map<Tool, Map<ItemKind, number>>();
  for (const r of results) {
    if (r.items.length === 0) continue;
    if (!grouped.has(r.tool)) grouped.set(r.tool, new Map());
    grouped.get(r.tool)!.set(r.kind, r.items.length);
  }

  const lines: string[] = [];
  lines.push(opts.color ? pc.bold(pc.magenta("agentstack — summary")) : "agentstack — summary");
  for (const [tool, kinds] of grouped) {
    const parts = [...kinds.entries()]
      .map(([k, n]) => `${KIND_LABEL[k]} ${n}`)
      .join("  ");
    const label = opts.color ? pc.bold(TOOL_LABEL[tool]) : TOOL_LABEL[tool];
    lines.push(`  ${label.padEnd(18)} ${opts.color ? pc.dim(parts) : parts}`);
  }
  return lines.join("\n");
}

function pad(value: string, width: number): string {
  const stripped = stripAnsi(value);
  if (stripped.length >= width) return value.slice(0, width);
  return value + " ".repeat(width - stripped.length);
}

function stripAnsi(value: string): string {
  return value.replace(/\[[0-9;]*m/g, "");
}

function topRule(cols: Column[]): string {
  return "┌" + cols.map((c) => "─".repeat(c.width + 2)).join("┬") + "┐";
}

function midRule(cols: Column[]): string {
  return "├" + cols.map((c) => "─".repeat(c.width + 2)).join("┼") + "┤";
}

function bottomRule(cols: Column[]): string {
  return "└" + cols.map((c) => "─".repeat(c.width + 2)).join("┴") + "┘";
}

function headerRow(cols: Column[], color: boolean): string {
  const cells = cols.map((c) => ` ${pad(color ? pc.dim(c.header) : c.header, c.width)} `);
  return "│" + cells.join("│") + "│";
}

function dataRow(cols: Column[], item: InventoryItem, color: boolean): string {
  const cells = cols.map((c) => {
    const raw = c.get(item);
    return ` ${pad(applyColor(c.header, raw, color), c.width)} `;
  });
  return "│" + cells.join("│") + "│";
}

function applyColor(header: string, value: string, color: boolean): string {
  if (!color) return value;
  if (header === "NAME") return pc.bold(value);
  if (header === "VERSION" && value && value !== "—") return pc.green(value);
  if (header === "SCOPE") {
    if (value === "user") return pc.blue(value);
    if (value === "project") return pc.yellow(value);
    if (value === "bundled") return pc.magenta(value);
  }
  return value;
}

function dim(value: string): string {
  return pc.dim(value);
}
