import pc from "picocolors";
import type { InventoryItem, ItemKind, ScanResult, Tool } from "../types.js";
import { pad } from "../util/width.js";

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
  { header: "VERSION", width: 10, get: (i) => i.version ?? dim("—") },
  { header: "SCOPE", width: 8, get: (i) => i.scope },
  { header: "SOURCE", width: 26, get: (i) => i.source ?? dim("—") },
];

const COLUMNS_SKILL: Column[] = [
  { header: "NAME", width: 36, get: (i) => i.name },
  { header: "VERSION", width: 10, get: (i) => i.version ?? dim("—") },
  { header: "SCOPE", width: 8, get: (i) => i.scope },
  { header: "SOURCE", width: 18, get: (i) => i.source ?? dim("—") },
  { header: "DESCRIPTION", width: 60, get: (i) => i.description ?? dim("—") },
];

const COLUMNS_MCP: Column[] = [
  { header: "NAME", width: 28, get: (i) => i.name },
  { header: "TRANSPORT", width: 10, get: (i) => String(i.extra?.transport ?? "—") },
  { header: "SCOPE", width: 8, get: (i) => i.scope },
  { header: "SOURCE", width: 50, get: (i) => i.source ?? dim("—") },
];

function columnsFor(kind: ItemKind, termWidth: number): Column[] {
  const cols =
    kind === "skill" || kind === "command" || kind === "agent"
      ? COLUMNS_SKILL
      : kind === "mcp"
        ? COLUMNS_MCP
        : COLUMNS_DEFAULT;
  return adaptToTerminal(cols, termWidth);
}

/** Shrink the widest column(s) so the rendered table fits within the terminal. */
function adaptToTerminal(cols: Column[], termWidth: number): Column[] {
  const overhead = cols.length * 3 + 1; // " | " between cells + outer borders
  const totalContent = cols.reduce((n, c) => n + c.width, 0);
  const totalWidth = totalContent + overhead;
  if (totalWidth <= termWidth) return cols;

  const excess = totalWidth - termWidth;
  // Shrink from the rightmost (typically DESCRIPTION/SOURCE) but keep a min of 8.
  const out = cols.map((c) => ({ ...c }));
  let remaining = excess;
  for (let i = out.length - 1; i >= 0 && remaining > 0; i--) {
    const min = 8;
    const give = Math.min(out[i]!.width - min, remaining);
    if (give > 0) {
      out[i]!.width -= give;
      remaining -= give;
    }
  }
  return out;
}

export function renderResult(
  result: ScanResult,
  opts: { color: boolean; termWidth: number },
): string {
  if (result.items.length === 0) return "";
  const cols = columnsFor(result.kind, opts.termWidth);
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
  lines.push(opts.color ? pc.bold(pc.magenta("stack — summary")) : "stack — summary");
  for (const [tool, kinds] of grouped) {
    const parts = [...kinds.entries()].map(([k, n]) => `${KIND_LABEL[k]} ${n}`).join("  ");
    const label = opts.color ? pc.bold(TOOL_LABEL[tool]) : TOOL_LABEL[tool];
    lines.push(`  ${label.padEnd(18)} ${opts.color ? pc.dim(parts) : parts}`);
  }
  return lines.join("\n");
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
