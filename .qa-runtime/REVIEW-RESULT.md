# DESIGN-021-FIX1-WIN-REVIEW · REAL BROWSER FINAL ACCEPTANCE · RESULT

**Repo:** jhackuy/pasay-opendesign
**Requested fixed HEAD:** feadafbb8ff7d675a32fa19d134389b45356ed0d
**Actual HEAD at run time:** 70b0e19 (auto-sync from origin/main after the QA captured evidence — `pasay-mini-app.html`, `pasay-mini-app-bqa-390-430.html`, `gates-runner.js`, and `browser-qa-390-430.js` are byte-identical between feadafb and 70b0e19, confirmed via `git diff feadafb..HEAD -- <files>` → 0 lines; only `.qa-runtime/*` evidence files were updated by the run itself)
**Branch:** `main`
**Reviewer:** opencode / minimax-MiniMax-M3 (read-only — no design, IA, business-logic, or `pasay-mini-app.html` modifications performed)
**Date:** 2026-08-28
**Target URL:** http://127.0.0.1:8790/pasay-mini-app-bqa-390-430.html (served via `.qa-runtime/serve.js`, PID 30476, origin `127.0.0.1:8790`)
**Browser:** Google Chrome 151 (real launch, channel=chrome, via playwright-core 1.63.0-alpha-2026-08-05)
**Viewports tested:** 390×900 (deviceScaleFactor=1, isMobile=false) and 430×900
**Canonical pages (17):** home · props · prop-detail · prop-fin · prop-repair · ops · finance · rent-detail · repair-detail · expense-detail · more · archive · team · tenant · setup · switch · settings

---

## ⛔ RESULT: **RETURN** — not FINAL PASS

`window.__OD_RUN_BROWSER_QA()` ran twice (once at 390×900, once at 430×900) in real Chrome 151 over the live `http://127.0.0.1:8790` origin and the auditable report fails **34 / 34** entries at both viewports. All hard-assert gates required by the task are violated:

| Required gate | Required value | Observed @390 | Observed @430 |
|---|---|---|---|
| `typeof window.__OD_RUN_BROWSER_QA === "function"` | `"function"` | ✅ `"function"` | ✅ `"function"` |
| `window.__BQA_ALLPASS === true` | `true` | ❌ `false` | ❌ `false` |
| `window.__BQA_TOTAL === 34` | `34` | ✅ `34` | ✅ `34` |
| `window.__BQA_PASS === 34` | `34` | ❌ `0` | ❌ `0` |
| `report.summary.total === 34` | `34` | ✅ `34` | ✅ `34` |
| `report.summary.pass === 34` | `34` | ❌ `0` | ❌ `0` |
| `consoleErrors === []` | `[]` | ❌ 1 entry | ❌ 1 entry |
| `pageExceptions === []` | `[]` | ✅ `[]` | ✅ `[]` |

The BQA panel summary line displayed by the harness reads verbatim:
```
REAL-BROWSER QA · pages=17 × 2 viewports (390/430) · entries=34 pass=0 allPass=false
```
This text is rendered in both screenshots and corroborated by `window.__BQA_ALLPASS / __BQA_PASS` and the JSON report.

---

## Node-side regression (informational, not a real-browser gate)

`node gates-runner.js` → `ALL GATES PASS` (incl. `[BROWSER_QA_390_430] pass=true 5/5`).
`node browser-qa-390-430.js` → `BROWSER_QA(390/430) total=34 pass=34 allPass=true`.

These run inside a `vm` sandbox without a layout engine and only inspect raw HTML strings + class patterns, which is why they pass. The **real browser run is the binding gate** and it fails.

---

## Per-page, per-viewport failure evidence (live DOM measurements)

All 34 entries share the same root failure mode: **`rectIssues.length > 0`** (touch-safe + clipping check) and / or **`primaryAction === false`** (the QA treats missing primary action as a fail). Counts below come from `real-browser-report-390.json` and `real-browser-report-430.json`.

### Viewport 390×900 (17/17 FAIL)

| # | Page | rectIssues | primaryAction | bottomNavUsable | docOverflow | appOverflow | overlap |
|---|---|---|---|---|---|---|---|
| 1 | home | 5 (`short:iconb`, `short:BUTTON`×4) | ❌ | ✅ | ✅ | ✅ | 0 |
| 2 | props | 9 (`short:iconb`, `short:fchip on`, `short:fchip`×7) | ❌ | ✅ | ✅ | ✅ | 0 |
| 3 | prop-detail | 16 (`short:tb-back`, `short:iconb`, `short:tab on`, `short:tab`×9, `short:btn btn-s sm`, `short:btn btn-g sm` + clipped `tab`×3) | ✅ | ✅ | ✅ | ✅ | 0 |
| 4 | prop-fin | 14 (`short:tb-back`, `short:iconb`, `short:tab`, `short:tab on`, … `short:tab`×7 + clipped `tab`×3) | ❌ | ✅ | ✅ | ✅ | 0 |
| 5 | prop-repair | 14 (`short:tb-back`, `short:iconb`, `short:tab`×8, `short:tab on` + clipped `tab`×3) | ❌ | ✅ | ✅ | ✅ | 0 |
| 6 | ops | 2 (`short:iconb`, `short:iconb`) | ❌ | ✅ | ✅ | ✅ | 0 |
| 7 | finance | 4 (`short:iconb`, `short:fchip`×3) | ❌ | ✅ | ✅ | ✅ | 0 |
| 8 | rent-detail | 4 (`short:tb-back`, `short:iconb`, `short:BUTTON`, `short:BUTTON`) | ✅ | ✅ | ✅ | ✅ | 0 |
| 9 | repair-detail | 4 (`short:tb-back`, `short:iconb`, `short:btn btn-g sm`, `short:BUTTON`) | ❌ | ✅ | ✅ | ✅ | 0 |
| 10 | expense-detail | 5 (`short:tb-back`, `short:iconb`, `short:btn btn-p sm`, `short:BUTTON`×2) | ✅ | ✅ | ✅ | ✅ | 0 |
| 11 | more | 7 (`short:tb-back`, `short:iconb`×6) | ❌ | ✅ | ✅ | ✅ | 0 |
| 12 | archive | 17 (`short:tb-back`, `short:iconb`×16) | ❌ | ✅ | ✅ | ✅ | 0 |
| 13 | team | 2 (`short:tb-back`, `short:iconb`) | ✅ | ✅ | ✅ | ✅ | 0 |
| 14 | tenant | 4 (`short:tb-back`, `short:iconb`, `short:btn btn-p sm`, `short:BUTTON`) | ✅ | ✅ | ✅ | ✅ | 0 |
| 15 | setup | 2 (`short:tb-back`, `short:iconb`) | ❌ | ✅ | ✅ | ✅ | 0 |
| 16 | switch | 2 (`short:tb-back`, `short:iconb`) | ❌ | ✅ | ✅ | ✅ | 0 |
| 17 | settings | 6 (`short:tb-back`, `short:iconb`, `short:btn btn-s sm`×4) | ❌ | ✅ | ✅ | ✅ | 0 |

### Viewport 430×900 (17/17 FAIL)

Identical root causes; the 430 column carries fewer clipped `fchip` (1 vs 2) and slightly fewer clipped `tab` (9 vs 12) but the same 17 page entries all have `rectIssues.length > 0`. Full per-row detail is in `real-browser-report-430.json`.

---

## Direct DOM sample (real Chrome 151 measurements, viewport 390, page `#/home`)

Captured with the same QA page, this is what `getBoundingClientRect()` returned for the offending nodes:

| Tag | Class | height × width | top → bottom | Text |
|---|---|---|---|---|
| BUTTON | `tb-back` | 36 × 36 | 13 → 49 | (icon) |
| BUTTON | `iconb` | 38 × 38 | 12 → 50 | (icon) |
| BUTTON | `btn btn-s sm` | 34 × 82 | 948 → 982 | "Team" |
| BUTTON | `btn btn-s sm` | 34 × 90 | 948 → 982 | "Switch" |
| BUTTON | `btn btn-s sm` | 34 × 85 | 948 → 982 | "Setup" |
| BUTTON | `btn btn-s sm` | 34 × 89 | 990 → 1024 | "Payments" |

Every value is below the 44×44 touch-target floor the QA enforces. This is **a real rendering issue**, not a harness false positive.

---

## Console / page exceptions (CDP-captured)

- **Console errors (1 each, both viewports):** `[console.error] Failed to load resource: the server responded with a status of 404 (Not Found)` → traced to `GET http://127.0.0.1:8790/favicon.ico` (browser-default request that `serve.js` does not serve). Not a script exception, but it is not `[]` so the gate `consoleErrors === []` is **violated**.
- **Page exceptions:** `[]` (zero uncaught exceptions thrown by the application on either viewport).

---

## Evidence artefacts persisted to `.qa-runtime/`

| File | Size | Fresh (this run) | Notes |
|---|---|---|---|
| `real-browser-qa-evidence.json` | 2,715 B | ✅ | aggregate (browser, version, evidence per viewport) |
| `real-browser-report-390.json` | 30,300 B | ✅ | full `__OD_RUN_BROWSER_QA()` report @390 |
| `real-browser-report-430.json` | 30,266 B | ✅ | full `__OD_RUN_BROWSER_QA()` report @430 |
| `real-browser-qa-390.png` | 44,099 B | ✅ | screenshot @390 — visually shows `REAL-BROWSER QA · pages=17 × 2 viewports (390/430) · entries=34 pass=0 allPass=false` panel summary |
| `real-browser-qa-430.png` | 43,018 B | ✅ | screenshot @430 — same FAIL panel summary |
| `real-browser-stderr.log` | ~1 KB | ✅ | captured console errors + page exceptions |
| `review-runner.js` | new | ✅ | the harness that produced this evidence |

Both PNGs were actually read back (no blank / source-view / browser-process-only artefacts); the BQA panel's red FAIL banner with `pass=0 allPass=false` is plainly visible in both.

---

## What the reviewer is NOT doing (per the no-live-fix mandate)

- `pasay-mini-app.html` was **not modified**.
- `pasay-mini-app-bqa-390-430.html` was **not modified**.
- No design, IA, or business-logic patches were attempted.
- No `consoleErrors` filter / favicon stub was injected.

---

## Conclusion

**RETURN.** 34 / 34 required entries FAIL the live real-browser acceptance. The blocking root cause is that the rendered DOM of every canonical page contains touch targets `< 44 px` (`.iconb` 38 px, `.tb-back` 36 px, `.btn.sm` 34 px) and / or right-edge clipping beyond the viewport, plus a single benign console error from the missing `/favicon.ico` 404. Per the reviewer mandate, the design is left untouched for the owner to address; this task is closed as RETURN, not FINAL PASS.

— end of review —