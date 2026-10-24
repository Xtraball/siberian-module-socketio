# Recipe: release a new version of SocketIO

## 1. Change the code on `main`

Siberian runs this module on PHP 8.5. Avoid what 8.5 deprecates: the casts `(boolean)`, `(integer)`, `(double)`, `(binary)` (use `(bool)`, `(int)`, `(float)`, `(string)`), optional parameters placed before required ones, and implicit nullable types (`Type $x = null` needs `?Type`).

## 2. Bump the version everywhere it is stored

Every file below must end up with the same version:

- `package.json`: `version` (top level) is the only place. This module has no `features/*/feature.json`; if one is added, keep its `version` equal to the module version.

Raise `dependencies.system.version` in `package.json` only when the change needs a newer Siberian (the floor is 5.1.0).

## 3. Lint with PHP 8.5

```bash
docker run --rm -v "$PWD":/w -w /w php:8.5-cli sh -c 'find . \( -name vendor -o -name node_modules -o -name .git \) -prune -o \( -name "*.php" -o -name "*.phtml" \) -print0 | xargs -0 -n1 php -d error_reporting=-1 -d display_errors=1 -l | grep -v "^No syntax errors"'
```

No output means clean. Templates with `{{PLACEHOLDER}}` markers are completed at install time and are expected to fail.

## 4. Commit, tag, push

```bash
git add -A && git commit -m "<what changed>, release X.Y.Z"
git tag -a vX.Y.Z -m "vX.Y.Z: <summary>"
git push origin main vX.Y.Z
```

Never reuse or move a published tag; release a new patch version instead.

## 5. Ship it through the downloader

Package the tag (the docs in this repo are left out of the archive by `.gitattributes`):

```bash
git archive --format=zip -o "<downloader checkout>/archives/SocketIO-X.Y.Z.zip" vX.Y.Z
```

Then follow `RECIPE.md` in `Xtraball/marketplace-module-downloader` (build, review `src/data/modules.json`, deploy). Not registered in the marketplace downloader yet (no entry in its `scripts/modules.json`).
