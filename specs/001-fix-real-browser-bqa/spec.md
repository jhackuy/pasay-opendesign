# Feature Specification: Fix Real-Browser BQA on Windows Chrome 151 (390 / 430)

**Feature Branch**: `[001-fix-real-browser-bqa]`
**Created**: 2026-08-28
**Status**: Draft
**Input**: User description: "修复 PASAY Mini App 在 Windows Chrome 151、390×900 和 430×900 下的真实浏览器 BQA 失败。当前基线为 17 个 canonical pages × 2 viewport = 34 项，真实结果 0/34；主要问题是 tb-back、iconb、btn.sm、tab、fchip、attach 等真实交互目标不足 44×44 CSS px，以及部分 tab/fchip 裁切和横向溢出。要求所有真实交互目标至少 44×44 CSS px、零裁切、零横向溢出；已有 primaryAction 必须合格，但自然没有 primaryAction 的页面不得因此失败；不得新增虚假 CTA，不得修改 IA、Bottom Nav、业务逻辑、路由和文案；favicon.ico 404 只能在 QA server 返回 204；最终必须由 Windows Chrome 151 在 http://127.0.0.1:8790 实测 34/34、__BQA_ALLPASS=true、consoleErrors=[]、pageExceptions=[]。这是基于当前失败证据重新制定的新补丁，不得声称恢复 Issue #20 已丢失的旧补丁。"

> Drafted from `DESIGN-021-FIX3-SPEC.md` v0 (treated as input only). Per the project's
> constitution (`.specify/memory/constitution.md` v1.0.0) this feature MUST NOT be
> implemented until this spec is `Frozen` and `/speckit.plan` is attached.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Owner opens the Mini App in real Chrome 151 and gets a clean PASS panel (Priority: P1)

A product reviewer (Owner) opens `http://127.0.0.1:8790/pasay-mini-app-bqa-390-430.html`
in real Google Chrome 151 on Windows, viewport 390×900, then 430×900. The browser runs
the inlined QA harness; the rendered panel reads `REAL-BROWSER QA · pages=17 × 2 viewports
(390/430) · entries=34 pass=34 allPass=true` and the page console shows zero errors /
exceptions.

**Why this priority**: this is the contract for `PASAY_FINAL_PRODUCT_FREEZE_V1`; without
it nothing downstream can ship.

**Independent Test**: Load the URL in real Chrome 151 at both viewports; read
`window.__BQA_ALLPASS / __BQA_TOTAL / __BQA_PASS / __BQA_PAGE_COUNT / __BQA_VERIFY` and
`window.__BQA_REPORT` from devtools; capture `consoleErrors` and `pageExceptions` via
CDP.

**Acceptance Scenarios**:

1. **Given** real Chrome 151 at viewport 390×900, **When** the page loads and the
   harness finishes, **Then** `window.__BQA_ALLPASS === true`,
   `__BQA_TOTAL === 34`, `__BQA_PASS === 34`, `report.summary.pass === 34`,
   `consoleErrors === []`, `pageExceptions === []`.
2. **Given** the same page at viewport 430×900, **When** the harness re-runs,
   **Then** the same five gates hold at 430.
3. **Given** the Owner opens `pasay-mini-app.html` directly (no harness), **When**
   navigating between any two canonical pages, **Then** no visible touch target is
   below 44×44 CSS px and no control is clipped by the viewport edge.

---

### User Story 2 - Pages without a natural primary action still pass (Priority: P1)

The 9 canonical pages that have no natural `.btn-p` (home, props, ops, finance, more,
archive, setup, switch, settings) MUST pass the BQA gate without adding any new CTA.
The QA panel still records whether a primary action was found, but absence is not a
fail condition.

**Why this priority**: Per constitution Principle IV, fixing visual QA MUST NOT add
fake CTAs or alter business surface. The 9-page subset is half of the canonical list,
so this user story is essential to ship the freeze.

**Independent Test**: For each of the 9 listed pages, run the harness and verify the
per-entry `primaryAction` field can be `false` while `ok === true`; verify no new
`<button class="btn-p …">` was introduced by comparing the diff of `view*()` render
output before/after.

**Acceptance Scenarios**:

1. **Given** a canonical page with no natural primary action, **When** the harness
   measures it, **Then** `primaryAction === false` is allowed and `ok === true` is
   achievable without a new CTA.
2. **Given** a canonical page with an existing primary action (e.g. prop-detail,
   rent-detail, expense-detail, team, tenant), **When** the harness measures it,
   **Then** the existing primary action MUST satisfy the full touch-target / clipping
   check (height ≥ 44, width ≥ 44, inside viewport).
3. **Given** the diff vs the frozen baseline, **When** `git diff` is inspected,
   **Then** `view*()` render strings and `data-a` literal values are byte-equivalent
   except for CSS-only changes; no new `.btn-p` or `.btn-p.sm` element is introduced.

---

### User Story 3 - Reviewer can verify the source of truth by one diff (Priority: P2)

A reviewer comparing two candidate change sets (the new patch vs the previous attempt)
MUST be able to find the canonical spec, the constitutional principles, and the
mirror-generation script without leaving the repo root.

**Why this priority**: this is meta-acceptance; the project has previously spent
hours rediscovering which file is the source of truth. It must be cheap the next time.

**Independent Test**: From the repo root, run `ls specs/` and `.specify/memory/`,
inspect `.opencode/commands/`, confirm mirror artifacts are absent or regenerable.

**Acceptance Scenarios**:

1. **Given** the repo root, **When** the reviewer runs `ls specs/`, **Then** they
   find `001-fix-real-browser-bqa/spec.md` and a `checklists/requirements.md`.
2. **Given** `.specify/memory/constitution.md`, **When** the reviewer reads it,
   **Then** they find six named principles including "Real-Browser Results Override
   Node Simulations" and "Final Chrome QA Runs on Local Windows".
3. **Given** any change set claiming to fix the BQA, **When** the reviewer runs
   `git diff`, **Then** only `pasay-mini-app.html` (CSS region),
   `pasay-mini-app-bqa-390-430.html` (regenerated), `.qa-runtime/serve.js` (favicon
   route), and the canonical spec files appear — not view functions, not
   `gates-runner.js`, not `browser-qa-390-430.js`.

---

### Edge Cases

- **Tabs/filters overflow on narrow viewport**: When the natural width of the
  tab/fchip row exceeds the inner content area at 390×900, the result MUST freeze
  to "no clipped children inside the viewport", regardless of whether the row
  itself remains horizontally scrollable. The spec does not dictate how the result
  is achieved.
- **Existing `.btn-p` and `.btn-p.sm`**: these are part of the frozen visual. Their
  rendered dimensions, copy, and `data-a` MUST NOT change. If a different
  `.btn.sm` size variant is needed, it MUST be applied to non-primary variants
  (`.btn-s.sm`, `.btn-g.sm`, etc.) only.
- **Disabled / hidden / decorative controls**: An element with `disabled`,
  `aria-hidden="true"`, `display:none`, `visibility:hidden`, or zero `getBoundingClientRect`
  MUST NOT be counted toward the touch-target floor or clipping set.
- **Sandbox cannot launch real Chrome**: a final-pass claim without the real
  Windows Chrome 151 run is `BLOCKED` per constitution Principle VI; it MUST NOT
  be labeled `FINAL PASS` regardless of any other gate being green.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (Touch-target floor): Every real, visible, enabled, operable interactive
  element at the contracted viewports MUST render at `height ≥ 44 && width ≥ 44`
  in CSS px (per `Element.getBoundingClientRect()`).
- **FR-002** (No horizontal overflow): The document and the app scroll containers
  MUST NOT introduce a horizontal scrollbar at the contracted viewports
  (`documentElement.scrollWidth ≤ vw` and `app.scrollWidth ≤ app.clientWidth + 1`).
- **FR-003** (No clipped controls): No real, visible, enabled, operable interactive
  element MUST extend past the viewport's right edge or sit before its left edge
  (`rect.right ≤ vw + 1 && rect.left ≥ -1`).
- **FR-004** (Existing primaryAction usability): When a canonical page has an
  existing `.btn-p` (or `.btn.btn-p`) element, that element MUST pass FR-001 and
  FR-003 in addition to any presence check.
- **FR-005** (PrimaryAction is informational when absent): When a canonical page
  has no `.btn-p` (or `.btn.btn-p`) element, the absence MUST NOT count as a
  failure; the harness MUST still report the boolean for auditability.
- **FR-006** (favicon 204): `GET /favicon.ico` on the QA server
  (`http://127.0.0.1:8790`) MUST return `204 No Content` (or `200` with an empty
  body), and MUST NOT log a `console.error` in the browser.
- **FR-007** (Zero console errors / page exceptions): The run MUST produce
  `consoleErrors === []` and `pageExceptions === []` at both contracted viewports.
- **FR-008** (34/34 canonical coverage): The 17 canonical pages × 2 contracted
  viewports = 34 entries MUST all pass; `__BQA_PAGE_COUNT === 17` MUST hold.
- **FR-009** (Bottom Nav untouched): The 5-item Bottom Nav, its item order, and
  its labels MUST be unchanged.
- **FR-010** (Routing / IA / business logic untouched): The hash-routing table,
  `view*()` function outputs (as HTML strings), operation dispatch logic, seed
  data, and `.qa` quick-action items MUST be unchanged.
- **FR-011** (Copy untouched): All user-visible Chinese / English copy strings
  MUST be byte-equivalent to the frozen baseline.
- **FR-012** (No new CTA): No `<button class="btn-p …">` (or `.btn.btn-p`) MAY be
  introduced into any `view*()` output to satisfy FR-004 or FR-005.
- **FR-013** (Real-browser source of truth): The final acceptance run MUST be
  executed on real Google Chrome 151 (channel=chrome) on Windows at the contracted
  viewports with origin `http://127.0.0.1:8790`. Node simulations, source-string
  audits, and `vm`-side evaluations are NOT acceptable as substitutes.
- **FR-014** (Mirror regeneration): Any change to `pasay-mini-app.html` MUST be
  mirrored to `pasay-mini-app-bqa-390-430.html` by the build script in the same
  change set; mirror diff MUST be zero against the regenerated artifact.

### Key Entities *(include if feature involves data)*

- **Canonical page**: One of the 17 frozen routes
  (`home`, `props`, `prop-detail`, `prop-fin`, `prop-repair`, `ops`, `finance`,
  `rent-detail`, `repair-detail`, `expense-detail`, `more`, `archive`, `team`,
  `tenant`, `setup`, `switch`, `settings`). Each canonical page has one
  expected viewport-pair entry and one expected per-entry QA verdict.
- **Real interactive element**: A DOM element that satisfies all of:
  `Element.getBoundingClientRect()` returns nonzero area, the element is
  visible (`getComputedStyle(...).visibility !== 'hidden'`,
  `display !== 'none'`, `aria-hidden !== 'true'`), is enabled
  (`Element.disabled !== true`), and is operable (has a click handler, an
  `href`, a `data-a` action, a `tabindex`, or `role="button"` /
  `role="link"`). Decorative chips, badges, status dots, and timeline
  bullets are explicitly NOT real interactive elements.
- **Real-Browser QA Report**: The object returned by `window.__OD_RUN_BROWSER_QA()`,
  containing `viewports["390"]` and `viewports["430"]` per-entry verdicts and
  a `summary` block. The frozen contract consumes this object only as observed
  in real Chrome 151.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** (Final pass): In real Chrome 151 at both contracted viewports,
  `window.__BQA_ALLPASS === true` and `__BQA_PASS / __BQA_TOTAL === 34/34`.
- **SC-002** (Zero noise): Across the same run, the CDP-captured `consoleErrors`
  array is empty and the `pageExceptions` array is empty.
- **SC-003** (Visual freeze preserved): `git diff <baseline-sha> -- pasay-mini-app.html`
  produces changes confined to the CSS region. The `<script>` block is byte-equivalent.
- **SC-004** (Mirror parity): `git diff <baseline-sha> -- pasay-mini-app-bqa-390-430.html`
  is exactly the regenerated artifact's diff from the post-change
  `pasay-mini-app.html`; no manual edits to the mirror.
- **SC-005** (Surface preservation): `git diff <baseline-sha> -- pasay-mini-app.html`
  shows no additions to `view*()` function outputs (HTML-string byte-equivalent),
  no new `data-a` literals, no Bottom-Nav reordering, no IA mutation.
- **SC-006** (Server-side noise control): `curl -I http://127.0.0.1:8790/favicon.ico`
  returns `204 No Content` (or `200` with empty body) without producing a
  browser-side `console.error`.
- **SC-007** (Acceptance evidence persisted): New files
  `.qa-runtime/real-browser-qa-evidence.json`,
  `.qa-runtime/real-browser-report-390.json`,
  `.qa-runtime/real-browser-report-430.json`,
  `.qa-runtime/real-browser-qa-390.png`,
  `.qa-runtime/real-browser-qa-430.png` are written by the real run and
  replace the prior BLOCKED artifacts.

## Assumptions

- The real-Chrome-151 environment (DESIGN-013 §5 / DESIGN-021-FIX1-BLOCKED §二) is
  reachable on the Windows host that runs the final acceptance. If it is not, the
  spec returns `BLOCKED` per constitution Principle VI; it does NOT weaken gates
  per Principle III.
- The 17 canonical pages and their hashes (`#/home`, `#/props`, …, `#/settings`)
  are the frozen contract from Issue #20 / DESIGN-013 §5.2. This spec does not
  propose adding or removing pages.
- `.btn-p` and `.btn-p.sm` are part of the frozen visual surface and are exempt
  from any "make `.btn.sm` ≥ 44px" rule. Other `.btn.sm` variants (e.g.
  `.btn-s.sm`, `.btn-g.sm`) follow FR-001 / FR-003.
- `pasay-mini-app-bqa-390-430.html` is generated from `pasay-mini-app.html` by
  `node .qa-runtime/build-bqa-harness.js`. The harness's `__bqa_runner` IIFE and
  the `CELL/ROW/MONO_STYLE` injection are not modified by this spec.
- The QA server at `127.0.0.1:8790` is `.qa-runtime/serve.js`. Only the
  `/favicon.ico` route is in scope of FR-006.
- Visual-QA fixes are constrained to the CSS region of `pasay-mini-app.html`.
  JavaScript edits are NOT in scope of this spec; if any JS edit proves
  necessary to satisfy FR-001/FR-002/FR-003, the spec returns `BLOCKED`
  (constitution Principle IV) instead of approving the JS change.
- Counts of "interactive elements" in FR-001 / FR-003 exclude disabled,
  hidden, zero-area, and decorative elements. Concretely: `disabled`,
  `aria-hidden="true"`, `display:none`, `visibility:hidden`, or any element
  whose `getBoundingClientRect()` returns zero width or zero height is not
  counted as a touch target.
