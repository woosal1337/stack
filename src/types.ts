export type Tool = "claude-code" | "claude-desktop" | "codex" | "cursor" | "project";

export type ItemKind =
  | "plugin"
  | "skill"
  | "mcp"
  | "agent"
  | "command"
  | "hook"
  | "extension"
  | "marketplace"
  | "memory";

export type Scope = "user" | "project" | "bundled" | "unknown";

export interface InventoryItem {
  tool: Tool;
  kind: ItemKind;
  name: string;
  version?: string;
  scope: Scope;
  source?: string;
  path?: string;
  description?: string;
  enabled?: boolean;
  extra?: Record<string, string | number | boolean | undefined>;
}

export interface ScanResult {
  tool: Tool;
  kind: ItemKind;
  items: InventoryItem[];
  warnings: string[];
}

export interface ScanOptions {
  home: string;
  cwd: string;
  includeProject: boolean;
}

export interface CliOptions {
  tool?: Tool | "all";
  kind?: ItemKind | "all";
  scope?: Scope | "all";
  search?: string;
  json: boolean;
  versionsOnly: boolean;
  doctor: boolean;
  noProject: boolean;
  noColor: boolean;
  help: boolean;
  version: boolean;
  cwd: string;
}
