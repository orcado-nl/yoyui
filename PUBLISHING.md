# Publishing YoYui to npm

This document describes how to publish a new version of `@orcado/yoyui` to the npm registry. This is different from local development (see `development.md`), which uses `yalc` to test changes in another project without publishing.

## Prerequisites

- You must be a member of the `orcado-nl` npm organization, and logged in locally (`npm whoami` should show your username).
- Your npm account must have two-factor authentication (2FA) enabled with "Authentication and writes", since publishing requires an OTP code.

## One-time setup notes

A few things in this fork's build pipeline had to be corrected after forking from PrimeReact, so publishing works correctly. These should already be fixed in the repo, but are worth knowing about if something looks wrong:

- **`rollup.config.js` → `addPackageJson()`**: this function writes `dist/package.json` from a hardcoded template. The `"name"` field must read from `pkg.name` (i.e. `@orcado/yoyui`), not the original hardcoded `"primereact"`.
- **`rollup.config.js` → `ALIAS_COMPONENT_ENTRIES` / `ALIAS_ICON_COMPONENT_ENTRIES` / `CORE_PASSTHROUGH_DEPENDENCIES`**: these map internal imports (e.g. `../virtualscroller/VirtualScroller`) to external package paths. They must point to `@orcado/yoyui/...`, not `primereact/...`, or consuming projects will get "Module not found" errors for inter-component dependencies.
- **`security:check`** (part of `build:check`) runs `npm audit --omit=dev --audit-level critical`. If a critical vulnerability exists in a dependency, this step exits with a non-zero code and silently halts the rest of the `&&`-chained build script (no visible error, just no output). If a build seems to do nothing, check this first.

  **Temporary workaround** if you need to build despite an unresolved critical vulnerability:

  1. In `package.json`, find:
     ```json
     "build:package": "npm run build:check && rollup -c && gulp build-resources && npm run build:api"
     ```
     and temporarily remove the `npm run build:check && ` part, so it becomes:
     ```json
     "build:package": "rollup -c && gulp build-resources && npm run build:api"
     ```
  2. Run `npm run build:lib` as normal — the build should now complete.
  3. Restore the original line (with `npm run build:check && ` back in) afterwards, so lint/format/type/security checks run normally on future builds.

  This is only a stopgap to unblock a build — it does not fix the vulnerability itself, so treat it as temporary and follow up on the underlying dependency issue when possible.

## Steps to publish

1. **Bump the version**

   Edit the `"version"` field in the root `package.json` (this is what `dist/package.json` reads from during the build). Use a normal semantic version — do not reuse or go lower than a version that's already published (check with `npm view @orcado/yoyui versions`).

2. **Build the library**

   ```bash
   npm run build:lib
   ```

   (or `npm run build:lib:windows` on Windows). This runs lint/format/type/security checks, bundles the components with Rollup, and generates resources with Gulp — including the per-component folders (e.g. `dist/button/`, `dist/toolbar/`) needed for subpath imports like `@orcado/yoyui/button`.

3. **Verify the build output**

   ```bash
   cat dist/package.json
   ```

   Confirm `"name"` is `@orcado/yoyui` and `"version"` matches what you set in step 1. Also check that the component folders you expect (e.g. `dist/toolbar/`) exist and contain built files.

4. **Publish from the `dist/` directory — not the repo root**

   The repo root `package.json` is for the Next.js documentation site. The actual publishable package is generated inside `dist/`, so you must `cd` into it first:

   ```bash
   cd dist
   npm publish --dry-run
   ```

   Check the file list in the output: it should include the component folders directly (not nested under an extra `dist/`), the correct package name, and the correct version.

5. **Publish for real**

   Before running the actual publish, double-check:
   - You're in the `dist/` directory, not the repo root.
   - You have your authenticator app ready for the OTP code.
   - The version in `dist/package.json` matches what you intend to publish.

   ```bash
   npm publish
   ```

   You'll be prompted for an OTP code from your authenticator app (due to 2FA).

   If you need to publish a version that isn't meant to become the default install target (e.g. a pre-release), tag it explicitly:

   ```bash
   npm publish --tag next
   ```

   Otherwise, a normal `npm publish` sets it as `latest` — unless the version number is lower than the currently published `latest`, in which case you must force it explicitly:

   ```bash
   npm publish --tag latest
   ```

6. **Confirm the publish**

   ```bash
   npm view @orcado/yoyui
   ```

   Check the version, `dist-tags`, and that `readme` isn't empty. (If npmjs.com shows a stale "no README" warning right after publishing, that's usually just a browser cache issue — hard refresh or check in an incognito window.)

7. **Test in a real project**

   ```bash
   npm install @orcado/yoyui@latest
   ```

   Then verify subpath imports resolve correctly, e.g.:

   ```tsx
   import { Button } from '@orcado/yoyui/button';
   ```
