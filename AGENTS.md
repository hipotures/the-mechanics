# Agent instructions — The Mechanics

This file is the authoritative repository-local instruction set for Codex, Claude Code, and other coding agents working on **The Mechanics**. All repository content, code, comments, documentation, commit messages, and issue updates must be in **English**.

## Mission

Build and maintain a **standalone, reusable design system and visual playground** for varied software interfaces. The desired visual direction is **Sharp Retro-Tech / Structured Technical Minimalism**: precise geometry, a strong hierarchy of primary regions, lighter nested boundaries, compact legible typography, and restrained decoration.

**Read [GitHub issue #1](https://github.com/hipotures/the-mechanics/issues/1) before implementing the initial project.** That issue defines the initial scope and acceptance criteria. These repository files are required design inputs:

- `docs/component-coverage.md`: component/token standardization contract and priority levels.
- `fixtures/demo-data.json`: deterministic synthetic data for all demo application types and edge cases.
- `references/sharp-retro-tech-target.html`: self-contained visual concept; a reference, **not** production source code or final tokens.

If additional authorized screenshots or design references are added under `references/`, inspect them before proposing visual changes.

## Design intent and nonnegotiable principles

- Maintain **one visual grammar** across five application archetypes (Analytics, Workspace, Data Management, Commerce, Website/Content) and a Component Gallery; the applications must not look like unrelated templates.
- Provide three complete, independently tuned themes: **Light / Paper-Stone**, **Dark / Graphite**, **Coffee / Espresso-Mocha**. Theme changes must not alter component geometry, layout, dimensions, or behavior.
- Use a clearly documented **three-level visual hierarchy**:
  1. Strongest: top-level application regions.
  2. Medium: functional panels and tables.
  3. Subtle: nested groups, records, and row headers.
- A nested header must never compete with a parent header. Strong outer borders are acceptable; repeating equally strong borders inside each card is not.
- Prioritize information density, readability, and task focus. Avoid rounded-card SaaS styling, pill-heavy UI, excessive shadows, indistinct white-on-white light surfaces, and near-black dark surfaces.
- Color must communicate intent and state, not just decoration. Numeric and chart content must remain readable in all themes.
- Select sensible, internally consistent tokens for typography (including a technical monospace), spacing, radius, border, control density, surfaces, charts, motion, and interactive states. Make judgment calls from the design intent when precise values are unspecified; do not stall on minor choices.
- Maintain accessible focus states, keyboard controls, semantic markup, readable contrast, and reduced-motion behavior. Verify material claims rather than claiming blanket compliance.
- All examples and fixtures must be synthetic. Do not use actual customer data, secrets, personal records, or copyrighted excerpts.

## Technical direction

- Start the playground with **Vite, Tailwind CSS 4, and daisyUI 5**, following the current official documentation. Pin dependencies and document the install/build/start workflow.
- Use daisyUI as an open component/prototyping foundation where useful, not as a demand that every consuming application must install Tailwind/daisyUI.
- Keep **public, portable style tokens/theme CSS/component styling** independent from playground-specific page layouts and demo data. Define and document a stable namespaced public CSS API.
- Preserve a plausible CSS-only consumer path for existing **React, Svelte, plain HTML/JavaScript, and Rust/Datastar** applications. Do not add dependencies on any of those frameworks merely to create the playground.
- Use `fixtures/demo-data.json` as the deterministic primary input, with explicitly documented derived data. Do not generate random chart values, use live timestamps in screenshot fixtures, or silently omit long labels, nulls, negative values, or error cases.
- Keep architecture simple. Avoid unrelated refactors, multiple competing component systems, or extensive test infrastructure not needed for this scope.

## Disk-backed temporary files and OOM prevention (mandatory)

**Never use `/tmp`, `/dev/shm`, `/run/user/*`, or another RAM-backed filesystem for experiments, builds, large temporary files, downloads, browser profiles, archives, screenshots, caches, logs, or test artifacts.** On this VM `/tmp` is a tmpfs backed by RAM. A multi-gigabyte write there can cause out-of-memory termination. Do not assume that a directory named "temporary" is disk-backed; verify the actual mount.

Before running anything likely to write substantial data:

1. Inspect the current filesystem and resources using `findmnt -T "$PWD"`, `df -h .`, `free -h`, and, when relevant, `findmnt -T /tmp`.
2. Create **repository-local, disk-backed** directories (for example `./tmp/work`, `./tmp/logs`, `./tmp/screenshots`, `./.cache`) and confirm that the target is not mounted as `tmpfs` or `ramfs`. Do not create project working directories under `/tmp`.
3. Set `TMPDIR` to an absolute, verified disk-backed path **before launching** package managers, installers, builds, browsers, scripts, or tests. Configure additional tools' temp/cache directories explicitly when they do not respect `TMPDIR`.
4. Set `XDG_CACHE_HOME` and any relevant package manager caches to project-local disk-backed paths when they may grow large. For Playwright, use a verified disk-backed `PLAYWRIGHT_BROWSERS_PATH` (such as `./.cache/ms-playwright`). Store browser profiles, screenshots, traces and videos on disk.
5. Ensure all transient directories, browser binaries, caches, profiles, traces and unapproved screenshot outputs are ignored by Git. Only commit curated review screenshots deliberately.
6. Limit heavy test/build/browser concurrency on this **8 GiB RAM, no-swap** VM. Start with one browser worker; do not launch many browser instances or Vite/build processes concurrently. Shut down child processes and stale development servers after a run.
7. If a required tool insists on writing large files to RAM-backed storage and cannot be redirected, **stop that operation and report the blocker**. Do not silently proceed, install system packages with `sudo`, or enable swap without the owner's explicit approval.

Example shell preflight from the repository root (adjust paths only after checking the mount):

```sh
mkdir -p tmp/work tmp/logs tmp/screenshots .cache/ms-playwright .cache/npm
findmnt -T "$PWD/tmp/work"
df -h "$PWD/tmp/work"
free -h
export TMPDIR="$PWD/tmp/work"
export TMP="$TMPDIR"
export TEMP="$TMPDIR"
export XDG_CACHE_HOME="$PWD/.cache"
export PLAYWRIGHT_BROWSERS_PATH="$PWD/.cache/ms-playwright"
export npm_config_cache="$PWD/.cache/npm"
```

The VM is **Ubuntu 26.04.1**, with **Node.js 22.22.1 and `corepack` available** but without `npm` or `npx` in the initial environment. Do not assume `npm` exists; prefer an unprivileged, project-pinned package manager invoked through `corepack` (for example `corepack pnpm`) when feasible. Install development dependencies as the normal user. Any missing system libraries requiring administrative privileges must be reported for owner approval rather than installed with `sudo`.

## External references, provenance, and licensing

- Public TypeUI Cypherpunk and Nostalgia pages, Inkline Town, and other references establish **aesthetic goals**, not a license to copy proprietary packages or paid design skills.
- Do not bypass access controls or publish copied third-party HTML, scripts, stylesheets, fonts, or unlicensed assets.
- Build an original implementation using licensed open-source dependencies and independently authored code. Record relevant dependencies and licenses.
- Treat the committed HTML mockup as an illustrative target. Its markup, specific measurements, and colors are not obligatory.

## Autonomous work and visual verification

An agent assigned implementation is authorized to complete the work **end to end**, including installing local development and browser-testing dependencies when needed.

1. Inspect the repository, issue, fixtures, reference and available disk/RAM/browser installations; avoid unnecessary downloads.
2. Implement usable demo pages for all five archetypes and the Component Gallery, plus all three themes.
3. Start the app and use **Playwright** to navigate the actual UI and capture screenshots.
4. Review rendered screenshots directly. Cover all **15 app/theme combinations** at desktop and mobile widths, and inspect the Component Gallery in all themes.
5. Check functional interactions, focus/keyboard behavior, contrast, row density, chart labels/legends, wrapping, mobile overflow, and parent/child visual hierarchy.
6. Iterate at least once on visual findings; stop when results meet the issue's acceptance criteria. Keep evidence and a concise record of changed design decisions and unresolved limitations.
7. Rebuild, run focused smoke/interaction checks, review the diff, and document actual results.

Before browser/build-heavy operations, follow the mandatory disk-backed temporary-storage and OOM policy above. Prefer existing installed browsers; install Playwright and its browser only if required. Control concurrency and terminate orphan servers/browsers.

Successful compilation or DOM assertions **do not** count as visual verification. Do not call any screen or state tested if it was not inspected.

## Git and scope policy

- Work on the **currently checked-out working branch**; do not create/switch branches unless the owner explicitly asks.
- Commit completed work and push to that branch's configured upstream. Never force-push or rewrite history.
- Do not create tags or publish packages/images without explicit authorization.
- Do not touch or attempt to migrate **Intelitex, HomeStack, Gitiary, or other repositories**. This project is a standalone exploration until the owner approves a design and requests integration.
- Keep generated screenshots in a documented evidence location; do not commit huge caches, browser binaries, `node_modules`, or transient test artifacts.
- If a real blocker prevents progress, report it precisely. Otherwise make independent, documented design decisions consistent with the issue instead of asking for approval on every token or visual detail.

## Expected delivery report

At task completion provide:
- Current branch and pushed commit SHA.
- Local start/build commands.
- Which five example apps and component groups are implemented.
- Which themes, viewport sizes, and interactions were actually inspected with Playwright.
- Locations of screenshots, token/CSS distribution instructions, `README.md`, `DESIGN.md`, and any verification report.
- Known limitations and decisions requiring owner review.

**Do not treat the owner’s approval of implementation as approval to migrate the design into other applications.**
