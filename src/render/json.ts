import type { ScanResult } from "../types.js";

export function renderJson(results: ScanResult[]): string {
  const grouped: Record<string, unknown> = {};
  for (const result of results) {
    if (result.items.length === 0) continue;
    const key = `${result.tool}.${result.kind}`;
    grouped[key] = {
      count: result.items.length,
      items: result.items,
      warnings: result.warnings,
    };
  }
  return JSON.stringify({ schema: 1, results: grouped }, null, 2);
}
