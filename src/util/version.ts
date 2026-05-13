import { execSync } from "node:child_process";
import { sep } from "node:path";

/** Extract a semver-looking segment from a filesystem path, e.g. `.../compound-engineering/3.6.0/...` */
export function versionFromPath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  const parts = path.split(sep);
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (part && /^\d+\.\d+\.\d+/.test(part)) return part;
  }
  return undefined;
}

/** Best-effort git short SHA of a working tree. Returns undefined if not a repo or git is missing. */
export function gitSha(cwd: string): string | undefined {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
      timeout: 1500,
    }).trim();
  } catch {
    return undefined;
  }
}
