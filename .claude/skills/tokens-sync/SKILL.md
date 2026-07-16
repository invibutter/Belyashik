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
   - **Do not use `get_variable_defs`/`get_metadata` for this step.** Those tools only return variables that are bound to a specific layer/node — they miss entire collections (e.g. a `_Color Primitives` collection) if nothing on the inspected node happens to use them directly. This was a real bug found in the first version of this skill.
   - Load the `figma-use` skill, then use `use_figma` to run a read-only script calling `figma.variables.getLocalVariableCollectionsAsync()` — this returns **every** collection in the file (including ones like primitive palettes that nothing might be currently bound to), each with its modes and variable IDs.
   - For each collection, resolve every variable across every mode via `figma.variables.getVariableByIdAsync()`. When a variable's value for a mode is `{ type: 'VARIABLE_ALIAS', id }`, resolve it to the *other variable's name* (don't flatten it to a raw hex) — this preserves the primitive → semantic alias chain as a DTCG `{path.to.token}` reference.
   - Map the result into `app/tokens/tokens.json`, W3C DTCG format (`$value`/`$type`). Suggested shape (adapt to whatever collections/modes actually exist — don't assume this exact one):
     - `color.primitive.*` — flat leaf names from the primitive collection (e.g. `color.primitive.blue-600`), no need to repeat a redundant group segment if the leaf name already encodes it
     - `color.<mode>.*` per color mode (e.g. `color.light.*`, `color.dark.*`) — semantic tokens as `{color.primitive.*}` references
     - `typography.<mode>.*` per typography mode (e.g. `typography.desktop.*`, `typography.mobile.*`)
     - single-mode collections (spacing, radius, border-width, etc.) stay flat, no mode prefix
   - Preserve any manually-added semantic aliases already in the file that aren't literal Figma variables (e.g. a `color.brand.*` entry) — update their reference target if the thing they point to was renamed, but don't delete them just because they're not sourced from this scan.
   - Never silently remove a token that exists in the current `tokens.json` but wasn't seen in this scan — see the confirmation step below.
   - Fix obvious naming typos from Figma (e.g. a mistyped "Sencondary") when mapping to token paths — the token path is a developer-facing identifier, not a mirror of every source typo.

3. **BUILD**
   - Confirm `app/style-dictionary.config.js` exists; if missing, create it following the existing project pattern: a `css` platform outputting `src/styles/tokens.css` (full flat `:root` reference, every token including every mode — no name-cleaning needed here since the mode segment keeps names unique) and a `tailwind` platform outputting `src/styles/theme.css` (`@theme { ... }` block, "live" tokens only).
   - `theme.css` is intentionally a curated subset, not everything: primitives + one designated default mode per category (currently `light` for color, nothing wired for typography modes) + any semantic aliases like `color.brand.*`, with the mode segment stripped from the generated CSS variable name via a custom `name`-cleaning step in the `css/theme` format. This is what makes `bg-brand-blue`, `bg-blue-600`, etc. work as real Tailwind classes.
   - If there's more than one mode for a token category (e.g. Light/Dark, Desktop/Mobile) and `style-dictionary.config.js` doesn't yet handle it, don't silently pick one — tell the user which modes exist and confirm which one should be "live" in `theme.css` before building, unless a default mode is already established in the file (check `CLAUDE.md` first).
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
- EXPORT reads the full Variables panel via `use_figma` + `getLocalVariableCollectionsAsync()` — never scope discovery to only what's bound on inspected layers
- Generated files (`tokens.css`, `theme.css`) are never hand-edited — always produced via the build step
- Branch/commit workflow follows the repo-wide rule: no direct pushes to `main`, ever

## Don't
- Don't rely on `get_variable_defs`/`get_metadata` alone to discover "all" variables — they only see what's bound to a layer, not full collections
- Don't delete a token from `tokens.json` without explicit user confirmation
- Don't hand-edit `tokens.css` or `theme.css` — regenerate them
- Don't silently choose which mode is "live" in `theme.css` when a category has more than one — confirm with the user
- Don't push to `main` directly, even though this skill automates commit+push
- Don't open or merge a pull request as part of this skill — sync ends at push
- Don't guess a Figma file/node if none was provided or resolvable
