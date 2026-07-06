---
name: new-component-with-story
description: Use when the user asks to create a new React component together with its Storybook story and MDX documentation.
---

# Skill: New Component with Storybook Story

When user asks to create a new component (e.g. "create a Badge component with a story", "add a new component + story + docs").

## Steps
1. Read `CLAUDE.md` at the repo root to confirm current conventions (exports, prop typing, variant pattern, styling approach).
2. Check whether Storybook is installed in `app/` (look for `storybook`/`@storybook/react-vite` in `app/package.json` and a `.storybook/` folder). If missing, install and initialize Storybook for Vite + React first (`@storybook/react-vite` + `.storybook/main.ts` + `.storybook/preview.ts`), and wire up Tailwind by importing `src/index.css` in `.storybook/preview.ts`.
3. Create `app/src/components/<Name>.tsx`:
   - Named export function component
   - Props interface extends the relevant native element attributes
   - Variants modeled as a string literal union + `Record<Variant, string>` class map, if the component has variants
   - Tailwind utility classes only, no custom CSS
   - `import type` for type-only imports
4. Create `app/src/components/<Name>.stories.tsx`:
   - Standard CSF3 format: `Meta<typeof Name>` + one named `StoryObj` export per variant/state
   - `title` follows `Components/<Name>`
5. Create `app/src/components/<Name>.mdx`:
   - Uses `@storybook/blocks` (`Meta`, `Canvas`, `Controls`) referencing the stories file
   - Short description of the component's purpose and variants, plus a props table via `<Controls />`
6. Run `oxlint` and `npm run build` (or `tsc -b`) in `app/` to confirm no type or lint errors.

## Output format
List the files created/changed with a one-line description each, then show the full content of each new file for review.

## Conventions to follow
- Named exports for components (see `Button.tsx`)
- Props interface extends native HTML element attributes
- Variant union + `Record<Variant, string>` map for variant styling
- Tailwind utility classes composed via template literals, no separate CSS files
- `import type` for type-only imports (`verbatimModuleSyntax`)
- If this is the first time Storybook or MDX is introduced, add a note to `CLAUDE.md` (Tech Stack / File Structure) per its "Keeping this file updated" rule

## Don't
- Don't use `any` in component or story props
- Don't add a `tailwind.config.js` — Tailwind v4 CSS-first config stays in `index.css`
- Don't hand-write CSS for story previews — reuse the same Tailwind classes as the component
- Don't skip the MDX doc even for a trivial component
- Don't default-export the component (only `App.tsx` uses a default export, per `CLAUDE.md`)
