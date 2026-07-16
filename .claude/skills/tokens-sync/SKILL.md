---
name: tokens-sync
description: Use when the user wants to sync design tokens end-to-end from a Figma file into this repo — export Figma Variables to tokens.json, rebuild the generated CSS/Tailwind theme files, and commit the result. Triggered via /tokens-sync [FIGMA_URL].
---

# Skill: Tokens Sync

When the user runs `/tokens-sync [FIGMA_URL]` (or asks to "sync tokens from Figma" / "pull the latest tokens").

## Steps

1. **Parse input**
   - Extract `fileKey` (and `nodeId` if present) from the given Figma URL.
   - If no URL was given and there's no obvious file to reuse from a prior run, ask the user for one — never guess a file key.

2. **EXPORT**
   - Use the Figma MCP tools (`get_metadata` to enumerate pages/components, `get_variable_defs` across the relevant pages/components) to collect all Variables: colors, spacing, radius, border-width, typography.
   - Merge the result into `app/tokens/tokens.json` in W3C DTCG format (`$value`/`$type`).
   - Preserve alias/reference tokens using `{path.to.token}` syntax — both ones sourced from Figma's own variable aliases, and any manually-added semantic aliases already in the file (e.g. a `color.brand.*` entry that isn't a literal Figma variable name). Don't flatten or drop an alias into its resolved value.
   - Never silently remove a token that exists in the current `tokens.json` but wasn't seen in this Figma scan — see the confirmation step below.

3. **BUILD**
   - Confirm `app/style-dictionary.config.js` exists; if missing, create it following the existing project pattern: a `css` platform outputting `src/styles/tokens.css` (`:root` variables, all tokens) and a `tailwind` platform outputting `src/styles/theme.css` (`color`/`spacing`/`radius` tokens only, wrapped in `@theme { ... }` via the custom `css/theme` format).
   - Run `npm run tokens:build` (fall back to `npx style-dictionary build --config style-dictionary.config.js` if that script doesn't exist) from `app/`.
   - Confirm the build succeeds with no errors before moving on.

4. **DIFF**
   - Run `git diff` scoped to `app/tokens/tokens.json`, `app/src/styles/tokens.css`, and `app/src/styles/theme.css`.
   - Show the diff to the user before doing anything else. Summarize it as: tokens added, tokens changed (value or reference), tokens renamed (same value, different path — treat as a rename, not delete+add), tokens removed.
   - **If any token would be removed**, stop and ask the user to explicitly confirm before continuing — never delete a token silently. If a rename is ambiguous (the value isn't uniquely traceable to one old token), ask the user which old token maps to which new one instead of guessing.

5. **COMMIT**
   - Check the current git branch. If it's `main`, create a new branch first (e.g. `chore/tokens-sync-<yyyy-mm-dd>`) — never commit or push directly to `main`, even for this automated flow.
   - `git add app/tokens/tokens.json app/src/styles/tokens.css app/src/styles/theme.css`
   - `git commit -m "chore(tokens): sync from Figma"`
   - `git push` to that branch (create the upstream if it's new). Don't open or merge a PR automatically — that stays a separate, explicit step the user asks for.

## Output format
End with a short report:
- Total token count after sync
- Added / changed / renamed / removed counts (removed only if the user confirmed)
- Link to the pushed commit

## Conventions to follow
- `tokens.json` stays in W3C DTCG format (`$value`/`$type`), consistent with `CLAUDE.md`
- Generated files (`tokens.css`, `theme.css`) are never hand-edited — always produced via the build step
- Branch/commit workflow follows the repo-wide rule: no direct pushes to `main`, ever

## Don't
- Don't delete a token from `tokens.json` without explicit user confirmation
- Don't hand-edit `tokens.css` or `theme.css` — regenerate them
- Don't push to `main` directly, even though this skill automates commit+push
- Don't open or merge a pull request as part of this skill — sync ends at push
- Don't guess a Figma file/node if none was provided or resolvable
