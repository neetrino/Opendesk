# Repository guidance

This repository is a template for product documentation, Cursor coding standards, and portable Agent workflows. Keep product and Agent-system concerns separate.

## Before substantial work

1. Read the explicit user task and preserve its scope.
2. Read `docs/TECH_CARD.md` when it exists and is relevant.
3. Read `docs/01-ARCHITECTURE.md` when it exists and is relevant.
4. Preserve the existing architecture and approved project decisions.

## Instruction locations

```text
Product documentation
→ docs/

Cursor coding standards
→ .cursor/rules/

Reusable workflows
→ .agents/skills/

Skill catalog and profiles
→ .agents/catalog/

Agent-system documentation
→ .agents/system/
```

Use the applicable Rule or Skill instead of copying its full content into this file.

## Decision precedence

```text
explicit approved task
→ approved TECH_CARD
→ existing project implementation
→ template recommendation
→ generic fallback
```

Preserve the existing implementation unless the approved task or TECH_CARD explicitly requires a migration or replacement.

## Working boundaries

- Do not change architecture, stack, public APIs, database schema, or business behavior outside the approved task.
- Do not perform production deployment.
- Do not perform production database migrations.
- Do not delete data.
- Do not commit or push without an explicit request.
- Do not hide or bypass test, lint, build, or validation failures.
- Do not weaken security controls to make a check pass.
- Preserve unrelated user changes and keep edits scoped.
- After meaningful changes, run project-appropriate validation and use `.agents/skills/verify-before-completion/`.

Report checks that were not run and any remaining uncertainty instead of claiming unsupported success.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
