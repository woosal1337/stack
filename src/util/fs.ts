import { existsSync, readdirSync, readFileSync, statSync, lstatSync, readlinkSync } from "node:fs";
import { join } from "node:path";
import { parse as parseToml } from "smol-toml";

export function exists(path: string): boolean {
  try {
    return existsSync(path);
  } catch {
    return false;
  }
}

export function readJson<T = unknown>(path: string): T | undefined {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return undefined;
  }
}

export function readToml<T = Record<string, unknown>>(path: string): T | undefined {
  try {
    return parseToml(readFileSync(path, "utf8")) as T;
  } catch {
    return undefined;
  }
}

export function readText(path: string): string | undefined {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
}

export function listDir(path: string): string[] {
  try {
    return readdirSync(path);
  } catch {
    return [];
  }
}

export function isDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

export function isSymlink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

export function resolveSymlink(path: string): string | undefined {
  try {
    if (!lstatSync(path).isSymbolicLink()) return undefined;
    return readlinkSync(path);
  } catch {
    return undefined;
  }
}

/** Parse YAML frontmatter from a markdown file. Returns the parsed key/value map. */
export function readFrontmatter(path: string): Record<string, string> | undefined {
  const raw = readText(path);
  if (!raw) return undefined;
  if (!raw.startsWith("---")) return undefined;
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return undefined;
  const block = raw.slice(3, end).trim();
  const out: Record<string, string> = {};
  let currentKey: string | undefined;
  let buffer: string[] = [];
  for (const line of block.split("\n")) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (match) {
      if (currentKey) out[currentKey] = buffer.join(" ").trim();
      currentKey = match[1];
      buffer = match[2] ? [match[2]] : [];
    } else if (currentKey) {
      buffer.push(line.trim());
    }
  }
  if (currentKey) out[currentKey] = buffer.join(" ").trim();
  return out;
}

/** Strip surrounding quotes and "|" / ">" block markers from a frontmatter value. */
export function cleanFrontmatterValue(value: string): string {
  let v = value.trim();
  if (v.startsWith(">") || v.startsWith("|")) v = v.slice(1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v;
}

export function safeJoin(...parts: string[]): string {
  return join(...parts);
}
