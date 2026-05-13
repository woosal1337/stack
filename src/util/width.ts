// Visual-width helpers for terminal rendering.
// - Strips ANSI SGR escape sequences when measuring.
// - Treats CJK ideographs, full-width forms, and most emoji as 2 columns.
// - Never produces an orphaned (unterminated) escape sequence when truncating.

const ESC = String.fromCharCode(0x1b);
const ANSI_RE = new RegExp(`${ESC}\\[[0-9;]*m`, "g");
const RESET = `${ESC}[0m`;

export function stripAnsi(value: string): string {
  return value.replace(ANSI_RE, "");
}

/** Visual column count for a single Unicode code point. */
export function charWidth(codePoint: number): number {
  if (codePoint === 0) return 0;
  if (codePoint < 0x20 || (codePoint >= 0x7f && codePoint < 0xa0)) return 0;
  if (codePoint >= 0x0300 && codePoint <= 0x036f) return 0;
  if (codePoint >= 0x200b && codePoint <= 0x200f) return 0;
  if (codePoint === 0xfeff) return 0;
  if (
    (codePoint >= 0x1100 && codePoint <= 0x115f) ||
    (codePoint >= 0x2e80 && codePoint <= 0x303e) ||
    (codePoint >= 0x3041 && codePoint <= 0x33ff) ||
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0xa000 && codePoint <= 0xa4cf) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe4f) ||
    (codePoint >= 0xff00 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x1f300 && codePoint <= 0x1f64f) ||
    (codePoint >= 0x1f680 && codePoint <= 0x1f6ff) ||
    (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) ||
    (codePoint >= 0x20000 && codePoint <= 0x2fffd) ||
    (codePoint >= 0x30000 && codePoint <= 0x3fffd)
  ) {
    return 2;
  }
  return 1;
}

export function displayWidth(value: string): number {
  const stripped = stripAnsi(value);
  let width = 0;
  for (const ch of stripped) {
    const cp = ch.codePointAt(0);
    if (cp !== undefined) width += charWidth(cp);
  }
  return width;
}

/**
 * Truncate to a visual width, preserving ANSI escape sequences. Appends `…` (1 col)
 * when content was clipped. Always emits an SGR reset if a color/style was open.
 */
export function truncate(value: string, maxWidth: number): string {
  if (maxWidth <= 0) return "";
  if (displayWidth(value) <= maxWidth) return value;

  let out = "";
  let width = 0;
  const target = maxWidth - 1;
  let i = 0;
  let hasOpenStyle = false;

  while (i < value.length) {
    if (value.charCodeAt(i) === 0x1b && value[i + 1] === "[") {
      const end = value.indexOf("m", i);
      if (end !== -1) {
        const code = value.slice(i, end + 1);
        out += code;
        const inner = code.slice(2, -1); // strip ESC[ and trailing m
        if (inner === "" || inner === "0") {
          hasOpenStyle = false;
        } else {
          hasOpenStyle = true;
        }
        i = end + 1;
        continue;
      }
    }

    const cp = value.codePointAt(i);
    if (cp === undefined) break;
    const w = charWidth(cp);
    if (width + w > target) break;
    const ch = String.fromCodePoint(cp);
    out += ch;
    width += w;
    i += ch.length;
  }

  out += "…";
  if (hasOpenStyle) out += RESET;
  return out;
}

export function pad(value: string, width: number): string {
  const truncated = truncate(value, width);
  const current = displayWidth(truncated);
  if (current >= width) return truncated;
  return truncated + " ".repeat(width - current);
}
