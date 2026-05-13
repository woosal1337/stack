import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import { join } from "node:path";

import { scanClaudeCodePlugins } from "../src/scanners/claude-code/plugins";
import { scanClaudeCodeMcps } from "../src/scanners/claude-code/mcps";
import { scanCodexPlugins } from "../src/scanners/codex/plugins";
import { readFrontmatter, cleanFrontmatterValue } from "../src/util/fs";
import { versionFromPath } from "../src/util/version";

describe("util/version", () => {
  test("extracts semver from path", () => {
    expect(versionFromPath("/a/b/compound-engineering/3.6.0/x")).toBe("3.6.0");
    expect(versionFromPath("/a/b/no-version/x")).toBeUndefined();
    expect(versionFromPath(undefined)).toBeUndefined();
  });
});

describe("util/fs", () => {
  test("reads YAML frontmatter", () => {
    const dir = mkdtempSync(join(tmpdir(), "as-test-"));
    const file = join(dir, "SKILL.md");
    writeFileSync(
      file,
      "---\nname: example\ndescription: |\n  one line\n  two lines\n---\nbody\n",
    );
    const fm = readFrontmatter(file);
    expect(fm?.name).toBe("example");
    expect(cleanFrontmatterValue(fm!.description!)).toContain("one line");
  });
});

describe("scanClaudeCodePlugins", () => {
  test("smoke: reads real $HOME if present, otherwise empty", () => {
    const result = scanClaudeCodePlugins({
      home: homedir(),
      cwd: process.cwd(),
      includeProject: false,
    });
    expect(result.tool).toBe("claude-code");
    expect(result.kind).toBe("plugin");
    expect(Array.isArray(result.items)).toBe(true);
  });
});

describe("scanClaudeCodeMcps", () => {
  test("smoke: returns ok shape", () => {
    const result = scanClaudeCodeMcps({
      home: homedir(),
      cwd: process.cwd(),
      includeProject: false,
    });
    expect(result.tool).toBe("claude-code");
    expect(result.kind).toBe("mcp");
  });
});

describe("scanCodexPlugins", () => {
  test("smoke: returns ok shape", () => {
    const result = scanCodexPlugins();
    expect(result.tool).toBe("codex");
    expect(result.kind).toBe("plugin");
  });
});
