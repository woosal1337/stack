import { readFileSync, writeFileSync, chmodSync } from "node:fs";

const target = "dist/cli.js";
const content = readFileSync(target, "utf8");
if (!content.startsWith("#!")) {
  writeFileSync(target, `#!/usr/bin/env node\n${content}`);
}
chmodSync(target, 0o755);
