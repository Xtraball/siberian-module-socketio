# SocketIO

Siberian CMS module `SocketIO` (repository `siberian-module-socketio`). Imported from the marketplace downloader on 2026-10-24 and upgraded to PHP 8.5.

## Stack

- PHP 8.5 (linted with 8.5.12), Siberian CMS 5.1.0 or newer (`dependencies.system.version` in `package.json`)
- Siberian package layout: `package.json` at the root, server code under `resources/`, app side under `features/`
- Not registered in the marketplace downloader yet (no entry in its `scripts/modules.json`).

## Conventions

- **No em-dashes.** Use commas, parentheses, or middle dots (`·`).
- **Dates: `YYYY-MM-DD`.** Always absolute. **LF line endings.**
- `main` is the release branch. Releases are annotated tags `vX.Y.Z`.
- Never commit secrets or licence keys.
- The module version is stored in more than one file, and the copies must always carry the same value (see below and `RECIPE.md`).

## Version locations

- `package.json`: `version` (top level) is the only place. This module has no `features/*/feature.json`; if one is added, keep its `version` equal to the module version.

## Non-goals

- Not a standalone library: the module only runs inside a Siberian CMS installation.

## Reading order for agents

1. This file (`LOGBOOK.md`).
2. `RECIPE.md` for how to release a new version.
3. `LOGBOOK/notes.md` for gotchas.

Do not read `LOGBOOK/ideas.md` unless the user explicitly asks; it is the human-owned inbox.

## Status

- LOGBOOK adopted: 2026-10-25
