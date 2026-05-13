# Contributing

Thanks for considering a contribution.

## Setup

```bash
git clone git@github.com:woosal1337/stack.git
cd stack
bun install
bun run dev -- --help
```

## Workflow

1. Open an issue first for anything larger than a tweak. A 3-line description of the problem and your proposed direction is enough.
2. Branch off `main`. Keep PRs small and focused.
3. Before pushing, run:
   ```bash
   bun run typecheck
   bun test
   bun run build
   ```
4. Conventional Commits in commit messages (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
5. PR description should answer: *what changed, why, and how do I verify it locally.*

## Code style

- **TypeScript, strict mode.** Avoid `any`. Prefer narrow types and discriminated unions.
- **Scanners are pure and read-only.** Each scanner returns `{ tool, kind, items, warnings }`. Never throw on malformed user files — surface a warning and return what you can.
- **Comments explain *why*, not *what*.** Default to writing none. Add one when the reason isn't obvious from the code.
- **No new runtime dependencies** unless they're tiny, MIT/BSD licensed, and pull their weight. Current deps: `mri`, `picocolors`, `smol-toml`.
- **One scanner per file.** New tool → new directory under `src/scanners/<tool>/`, wired up in `src/scanners/index.ts`.
- **No telemetry, no network calls.** If a feature would need one, open an issue to discuss first.

## Adding a new tool / surface

1. Add the data-source path to `src/paths.ts`.
2. Create the scanner under `src/scanners/<tool>/<kind>.ts`. Mirror the shape of an existing one.
3. Add it to `scanAll()` in `src/scanners/index.ts`.
4. If the kind needs a different table layout, extend `COLUMNS_*` in `src/render/table.ts`.
5. Add a smoke test in `test/scanners.test.ts` — verifying it returns the right shape against an empty `$HOME` is enough.

## Releases

Maintained by the project owner. Versions follow SemVer.
