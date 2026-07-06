---
type: agent-team
name: design-system-team
lead: design-system-lead
---

# Team: Design System

## Goal
Expand and maintain this project's design system on an ongoing basis: build a Storybook covering existing and new components, keep adding new Tailwind-styled components, and incrementally redesign/finish pages. This is a long-running initiative with no fixed end date, not a single sprint.

## Lead agent
`design-system-lead` — reads the shared task list and `CLAUDE.md`, breaks incoming goals into subtasks, assigns each to the right peer, validates completed work against the task list, and keeps the task list current between sessions. Note: the lead cannot invoke other agents directly — it recommends the next action, and the calling session runs the named peer.

## Peer agents
- **`component-builder`** — builds new Tailwind-styled components and their Storybook stories/docs
- **`page-composer`** — assembles and redesigns pages out of existing components
- **`code-reviewer`** — reviews any changed code (components, pages, config) against `CLAUDE.md` conventions and TypeScript correctness; read-only, suggests fixes
- **`component-tester`** — writes and runs tests for components
- **`docs-writer`** — writes/updates project-level docs (README, CLAUDE.md, guides)
- **`storybook-publisher`** — builds and publishes the static Storybook output periodically

## Shared task list location
`.claude/tasks/design-system.md`

## Workflow
1. Lead reads the goal and `.claude/tasks/design-system.md`, breaks it into subtasks assigned to specific peers.
2. The calling session runs each peer agent for its assigned subtask.
3. New/changed code goes through `code-reviewer` (and `component-tester` for components) before being marked done.
4. Lead updates the task list and reports overall progress.
5. `storybook-publisher` runs periodically to keep the published Storybook current.
6. Finished work is merged into `main` via the normal feature-branch + PR flow — this team does not bypass that process.
