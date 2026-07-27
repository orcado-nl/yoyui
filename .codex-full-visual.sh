#!/usr/bin/env bash
set -o pipefail

CI=1 npx playwright test tests/visual/component-docs.visual.spec.js --grep='InputTextarea' --repeat-each=5 --workers=4
