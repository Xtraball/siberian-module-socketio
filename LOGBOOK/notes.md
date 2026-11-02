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

## 2026-11-01 Translations for the 14 core locales (3.1.0)

- **What.** `resources/translations/<code>/<file>.po` for ca, cs, de, el, es, fr, hi, it, ja, nl, pt_BR, ru, tr, zh_Hans, same file name, contexts and `#, mobile` flags as `resources/translations/default/`. English stays the default. Machine translated (`#. machine-translated (2026-11), to be reviewed`).
- **Loader.** Nothing to change in the core (Siberian PR 983: shipped locales rank after the user files and installed packs).
- **Gaps fixed.** Texts passed to `p__()` but missing from the default catalog were added to it.
- **Test.** `php tests/translations.php`.
- **Remember.** A new text in the code means a line in the default catalog and in the 14 locales, or the test fails.

- **csv to po (2026-11-01).** The module used a legacy `resources/translations/default/*.csv` (+ `mobile.csv.list`). Its static `__()` / `__js()` calls are now `p__()` / `p__js()` with the context `socketio`, the texts are in `resources/translations/default/socketio.po` (`#, mobile` for the former mobile list), the csv and the list are removed. Texts the core already translates (Save, Cancel...) stay `__()`.
