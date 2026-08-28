<!-- Sync Impact Report
  Version change: (template) → 1.0.0
  Modified principles: (template placeholders) → 6 project principles
  Added sections: Quality Gates (binding to pasay-final-product-acceptance-001)
  Removed sections: none (template placeholders replaced)
  Follow-up TODOs: none
-->

# PASAY-MINIAPP Project Constitution

**Scope**: Governance for `jhackuy/pasay-opendesign` and the in-repo `PASAY-MINIAPP` /
`PASAY-FINAL-PRODUCT-ACCEPTANCE-001` workstream.

**Applies to**: every change set that touches `pasay-mini-app.html`, `index.html`,
`pasay-design-system.html`, `pasay-telegram-bot.html`, the `.qa-runtime/` harness, or
the spec/plan artifacts under `specs/` and `DESIGN-NNN-*.md`.

## Core Principles

### I. Spec-Freeze-Before-Implementation

A change MUST NOT be implemented until its specification is frozen.

- "Frozen" means the spec file (`specs/<NNN>-<name>/spec.md` or a `DESIGN-NNN-*.md` that
  the spec has explicitly superseded) has Status = `Frozen` in its header, all
  `[NEEDS CLARIFICATION]` markers are resolved, and an `/speckit.plan` (or equivalent
  plan document) is attached or explicitly waived.
- An implementer MUST refuse to land code diffs whose change set does not reference a
  frozen spec SHA.
- Hot-fix exceptions require an `OWNER-WAIVER` comment in the commit body naming the
  frozen spec being deviated from and the reason.

**Rationale**: prior runs (DESIGN-013 §7, DESIGN-021-FIX1-BLOCKED §一) repeatedly
discovered regressions only after implementation; pre-freezing the spec is the cheapest
place to catch them.

### II. Real-Browser Results Override Node Simulations

Real-browser measurements are the source of truth for any visual / layout / touch /
clipping / overflow / interaction claim. Node `vm` evaluations, source-string audits,
or static HTML analysis MUST be treated as informational only.

- A change is not `FINAL PASS` until `window.__BQA_ALLPASS === true`,
  `report.summary.pass === report.summary.total`, `consoleErrors === []`,
  and `pageExceptions === []` are observed in a real Chromium DOM at the contracted
  viewports.
- The Node-side `gates-runner.js` and `browser-qa-390-430.js` are not substitutes for
  this gate; they are guard rails for plumbing and MUST NOT be cited as "real browser
  QA".
- Forbidden-evidence categories (per DESIGN-013 §5.1): `function-exists`, `vm` source
  eval, source-string match for page names, source-string match for `scrollWidth` /
  `getBoundingClientRect` / `height < 44`. Any QA artifact using only these signals
  MUST be labeled `audit-only` and not FINAL.

**Rationale**: the design freezes `FROZEN` only on real-browser evidence; a Node-only
pass leaves the design legally unfrozen and blocks downstream release decisions.

### III. No Gate Weakening

Existing acceptance gates and their thresholds MUST NOT be relaxed to make a failing
build pass. If a gate is unreachable, the gate is the canary — fix the underlying
defect, not the gate.

- Forbidden actions:
  - Lowering the touch-target floor below 44×44 CSS px for any real interactive
    element.
  - Removing `primaryAction` / `bottomNavUsable` / `overflow` / `clipping` columns
    from `report.summary.ok` to push pass count up.
  - Muting `console.error` capture to exclude categories that already fail.
  - Marking `404 favicon` as "expected" rather than serving a real response.
- If a gate is structurally wrong, it MUST be re-discussed in the spec's
  "Items to Clarify" and amended via a new spec version + owner waiver; never via a
  silent code change.
- Gate-side counters (`.qa-runtime/real-browser-qa-evidence.json`,
  `real-browser-report-{390,430}.json`) MUST be regenerated from a real run, never
  hand-edited.

**Rationale**: gate weakening is the fastest way to make `FINAL PASS` meaningless; the
project's whole signal rests on those gates being hard.

### IV. No IA / Business-Logic / Routing Changes for Visual QA

Visual-QA failures (touch size, clipping, overflow, contrast) MUST be resolved by CSS,
layout primitives, or non-semantic sizing — NEVER by mutating Information Architecture,
business logic, or the routing table.

- Forbidden actions to "fix" a visual-QA failure:
  - Renaming a route or splitting a page to dodge a rect check.
  - Removing or hiding a business-logic branch to drop a control.
  - Adding a fake / placeholder CTA to satisfy a "primaryAction must exist" check.
  - Reordering / reducing Bottom-Nav items to shrink the layout.
  - Editing `view*()` functions, the seed data, or the operation dispatcher.
- Allowed actions: changing CSS, adjusting component spacing, enlarging hit areas via
  padding/min-height, fixing container overflow with `min-width: 0` /
  `flex-shrink: 0`, etc.
- The spec MUST declare any visual-QA fix that requires touching JS as `BLOCKED` and
  return to the owner.

**Rationale**: the design's value is in its IA and business surface; trading those for
a green QA panel destroys what the spec is trying to protect.

### V. OpenDesign Product File Is Design Source of Truth

`pasay-mini-app.html` is the single source of truth for the PASAY Mini App design.
Mirror artifacts (`pasay-mini-app-bqa-390-430.html`, `pasay-dark-qa-390-430.html`,
`pasay-product-studio.html`) are generated or imported views and MUST NOT diverge from
the source of truth.

- The author-of-record for a change is the committer who updates the source file;
  mirror artifacts MUST be regenerated by `node .qa-runtime/build-bqa-harness.js`
  (or the equivalent build script) in the same commit.
- Diff review MUST first compare against `pasay-mini-app.html`; mirror divergence is
  always a build-pipeline bug, not an intended change.
- Theme switches and design-system one-offs (e.g. `pasay-design-system.html`) are
  reference materials; they MUST NOT be the unit of acceptance for the production app.

**Rationale**: mirror divergence has caused prior audits (DESIGN-021-FIX2-BLOCKED) to
chase ghosts; consolidating on one source of truth makes the diff authoritative.

### VI. Final Chrome QA Runs on Local Windows

The final acceptance run for any freeze-bound change MUST be executed on the
contracted Windows Chrome browser at the contracted viewports (390×900 and 430×900,
deviceScaleFactor=1, isMobile=false) on a Windows machine with real network/CDP
access.

- Required: Google Chrome 151 (channel=chrome), real launch (no `--headless=old`,
  no `--virtual-time-budget` shortcuts that bypass the named-pipe IPC), playwright-core
  driving the real browser, origin `http://127.0.0.1:8790`.
- A sandbox / container that cannot launch real Chromium is NOT a valid environment
  for the final run. Such environments MUST label their output `BLOCKED` /
  `RETURN`, not `FINAL PASS`.
- Acceptance is recorded in
  `.qa-runtime/real-browser-qa-evidence.json` +
  `.qa-runtime/real-browser-report-{390,430}.json` +
  `.qa-runtime/real-browser-qa-{390,430}.png`, all written by the same real run.

**Rationale**: prior sandboxes (DESIGN-013 §5, DESIGN-021-FIX1-BLOCKED §二) repeatedly
recorded EPERM on Chromium's Mojo IPC; declaring FINAL PASS without a real local run
re-introduces the very gap the contract was written to close.

## Quality Gates

These gates are the binding acceptance for any freeze-bound change. None may be
weakened (Principle III) or replaced by a Node simulation (Principle II).

| Gate | Threshold | Source-of-truth |
|---|---|---|
| Real-Browser `__BQA_ALLPASS` | `true` | `.qa-runtime/real-browser-qa-evidence.json` |
| Real-Browser `__BQA_TOTAL / __BQA_PASS` | `34 / 34` | same |
| Real-Browser `report.summary.pass` | `34 / 34` | `.qa-runtime/real-browser-report-{390,430}.json` |
| Console errors during run | `[]` | same |
| Page exceptions during run | `[]` | same |
| Touch target floor | `height ≥ 44 && width ≥ 44` CSS px | per-entry `rectIssues === []` |
| Horizontal overflow | `documentElement.scrollWidth ≤ vw` and `app.scrollWidth ≤ app.clientWidth + 1` | per-entry `docOverflow / appOverflow === false` |
| Bottom-Nav usability | 5 items, each ≥ 44px tall | per-entry `bottomNavUsable === true` |
| Bottom-Nav 5-item count | unchanged from frozen spec | `nav.nav .nav-i` count |
| Canonical page count | 17 (Issue #20 contract) | `__BQA_PAGE_COUNT === 17` |
| Existing primaryAction usability | visible, enabled, `getBoundingClientRect` inside viewport, ≥ 44×44 | per-entry `primaryAction` is informational; if present, full rect check applies |
| `/favicon.ico` response | `204 No Content` | `serve.js` route |

## Governance

- **Authority**: This constitution supersedes any `DESIGN-NNN-*.md` write-up that
  conflicts with it. In case of conflict, the constitution wins and the conflicting
  write-up is amended.
- **Amendments**: Require (a) a frozen spec amendment (`specs/<NNN>/spec.md` new
  version or a `DESIGN-NNN-FIXn` report), (b) explicit version bump of this
  constitution, (c) owner ratification recorded in the commit body.
- **Versioning**:
  - MAJOR: removal or redefinition of an existing principle.
  - MINOR: new principle added or existing principle materially expanded.
  - PATCH: clarifications, wording, typo fixes, non-semantic refinements.
- **Compliance review**: every PR / change set MUST be checked against Principle I
  (spec frozen?), Principle III (no gate weakening?), Principle IV (no IA/JS edit
  for visual?), Principle V (mirror diff is zero?), Principle VI (real local
  Windows Chrome run attached?). A PR that fails any check returns BLOCKED.
- **Waivers**: Hot-fixes may deviate from Principle I if an `OWNER-WAIVER` comment
  in the commit body names the spec being deviated from and the reason. Waivers do
  NOT apply to Principle II, III, IV, V, VI.
- **Final-Pass gate**: a change may be declared `FINAL PASS` only when ALL Quality
  Gates above are green in a real local Windows Chrome run, the spec is `Frozen`,
  and no waiver is in effect.

**Version**: 1.0.0 | **Ratified**: 2026-08-28 | **Last Amended**: 2026-08-28
