# Documentation visual tests

The committed baselines cover all component routes from `menu.json` in light and
dark modes at desktop, tablet, and mobile Chromium viewports.

## Running the suite

- `npm run test:visual` runs Playwright in the current environment.
- `npm run test:visual:linux` performs a clean build and runs the suite in the
  pinned Playwright Linux image used by CI.
- `npm run audit:docs` compares structural, geometric, image, overflow, and
  browser-error signatures with the PrimeReact v10.9.8 documentation site.

## Updating baselines

Run `npm run test:visual:update` to regenerate snapshots in the pinned Linux
image. This is deliberately separate from the normal test command. Review every
changed image before committing it; CI never updates snapshots and never depends
on the live PrimeReact site.

For short-lived local investigation only,
`npm run test:visual:update:local` bypasses the Linux container. Do not commit
snapshots produced by that command.
