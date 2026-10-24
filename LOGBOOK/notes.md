# Notes

## Patterns

- **One version, several files.** `package.json` is the only place today; add `features/*/feature.json` copies to the checklist if the module ever gets one.

## Anti-patterns

- Bumping only `package.json`. The copies drift and nobody notices until an app is rebuilt with stale feature data.
- Editing code under `vendor/`, `libs/` or `node_modules/` to silence PHP deprecations. Update the library instead.

## Gotchas

- **History.** The repository was created from the zip published on the marketplace downloader on 2026-10-24 (single import commit), then upgraded to PHP 8.5 on `main` with a major version bump. Repositories that existed before also keep their older history on the `siberian` branch and the downloader import on `import-downloader-<version>` (topic `compare-import`).
- **Third-party libraries** bundled in the module were not modified, so they can still print PHP 8.5 deprecation notices.
- **Encryption on download.** The downloader encrypts only the `*.php` and `*.phtml` files under `resources/` for each customer. Code outside `resources/` is delivered as is.

## Glossary

- **Downloader**: `Xtraball/marketplace-module-downloader`, the service that delivers licensed packages.
- **SK / LK**: the customer's Siberian licence key and the module licence key.
