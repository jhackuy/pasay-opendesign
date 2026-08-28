# DESIGN-013 · FINAL FREEZE CLOSEOUT · Issue #20

**Contract**: `PASAY-FINAL-PRODUCT-ACCEPTANCE-001`
**Issue**: https://github.com/jhackuy/noxout-opendesign/issues/20
**Executor**: OpenDesign (this run)
**Final HEAD SHA**: `cc60ed2`

---

## 1. Final Conclusion

```
PASAY_FINAL_PRODUCT_ACCEPTANCE = RETURN
PASAY_DESIGN_FREEZE_V1         = NOT_FROZEN
```

**Reason**: Section A (Repair property_id authority) is fully PASS. Section B (REAL 390/430 Browser QA) cannot be proven in this sandbox — see §6.

---

## 2. Baseline / Final SHAs

| | SHA | Note |
|---|---|---|
| Baseline (Issue #20 contract) | `6f856615765e092bfffdff2f10eccbf2b83133df` | unchanged |
| Final HEAD | `cc60ed2` | clean working tree |

---

## 3. Changed Files (Section A only)

| File | Change |
|---|---|
| `pasay-mini-app.html` | A.1–A.9 · PRP-id authority + auto-copied Operation + J-F4 truly-uses-production-path |

No new files created; no `index.html`, `pasay-design-system.html`, `pasay-telegram-bot.html` mutations.

---

## 4. Section A — Repair property_id authority · ALL FIXED

### A.1–A.4 · Production entry REJECTs without explicit PRP-id

Refactored:
- `sheetReportRepair(unitSel)` — form now uses **PRP-id** selector (label = `物业 PRP-xxxx · unit · tower`). The legacy unit-based dropdown at `#rr-unit` is gone.
- `submit-repair` handler — delegates to the new single production entry point `doCreateRepairFromPayload({ property_id, issue, … })`. Behavior:
  - Missing `property_id` → `{ok:false, reason:'property_id required (PRP-xxxx)'}` + **zero mutation**.
  - Unknown PRP-id → `{ok:false, reason:'unknown property_id: …'}` + zero mutation.
  - Non-PRP format (e.g. unit `'1608'`) → `{ok:false, reason:'property_id must be PRP-xxxx format: …'}` + zero mutation.
  - Legacy `repairProperty()` (read path) still falls back by unit **only when the unit maps to exactly one Property**, and explicitly does NOT guess when multiple Properties share the same unit.

### A.5 · Repair → Operation production path auto-copies `repair.property_id`

`doCreateRepairFromPayload` after a successful insert immediately calls `createChildOperation({ id:'OP-REP-'+repair.id, kind:'repair', domain:{ repair_id, unit, property_id: prop.id } })`. An A.7 guard re-asserts `op.domain.property_id === prop.id` even if any upstream stripped it (truth written into `op.tl` for audit).

Operation id is deterministic (`'OP-REP-' + repair.id`) so re-entry is idempotent and tests can locate it.

### A.6 · J-F4 truly creates via production entry

The test at line ~13304 was using `state.repairs.push(...)` directly (bypassing the auto-copied Operation). It now calls:

```js
const createFA = doCreateRepairFromPayload({ id:'REP-FA', property_id:pf1.prop.id, issue:'A unit leak', … });
const createFB = doCreateRepairFromPayload({ id:'REP-FB', property_id:pf2.prop.id, issue:'B unit ac', … });
```

Both calls return `{ok:true, op: <OP-REP-REP-FA>|<OP-REP-REP-FB>}` from the same code path the UI uses. The asserted chain is real, not hand-built.

### A.7 · Property Detail / Repair Detail / related Expense / Operation all stay isolated by PRP

Added assertions proving:
- `viewProperty(pf1.prop.id,'overview')` contains `REP-FA` and **not** `REP-FB`; vice versa for PRP-B.
- `viewRepair('REP-FA')` resolves to PRP-A; `viewRepair('REP-FB')` resolves to PRP-B; no cross-PRP content.
- `viewOp(opRFA.id)` contains `pf1.prop.id` and **not** `pf2.prop.id`; vice versa.

### A.8 · Removed "missing Operation still PASS" fallback

Old test at line 13223:
```js
A(!!opRFA ? propOfOpRFA === pf1.prop.id : repairsForProp(pf1.prop.id).some(r => r.id === 'REP-FA'), '[J-F4d] …');
```
This silently passed when the Operation was absent. Replaced with two hard assertions:
- `[J-F4d-pre]` A.8 · both Operations MUST exist (`!!opRFA && !!opRFB`); missing one = FAIL.
- `[J-F4d]` A.5+A.9 · `opRFA.domain.property_id === pf1.prop.id` and `opRFB.domain.property_id === pf2.prop.id` (no manual injection).

### A.9 · Removed manual `op.domain.property_id = pf1.prop.id` injection

Old test at line 13221:
```js
if (opRFA) opRFA.domain.property_id = pf1.prop.id;
```
Deleted. `op.domain.property_id` is now produced exclusively by `doCreateRepairFromPayload`. The new assertion verifies it came from the production path.

---

## 5. Section B — REAL 390 / 430 Browser QA · **CANNOT PROVE**

### 5.1 Forbidden-evidence audit (must explicitly disavow)

The pre-existing `BROWSER_QA_390_430` Node gate passes by checking:
- `__OD_RUN_BROWSER_QA` exposure (function-exists → **forbidden**)
- Source-string match for the 16 page names (`'home'`, `'props'`, … → **forbidden**)
- Source-string match for `scrollWidth` / `getBoundingClientRect` / `height < 44` (`>undefined<` etc. → **forbidden**)
- Node-side structural layout QA: 6 core views parsed for `width:\s*(\d+)px` overflows and leak tokens. This is run in Node `vm` with the HTML source evaluated as text (**VM / source-string → forbidden**).

These collectively constitute VM + source-string + function-exists evidence and do **not** satisfy Section B per the contract.

### 5.2 Real-browser paths attempted (all blocked)

Per the contract the only sanctioned paths are OpenDesign Preview with real Chrome/Edge DOM **OR** Playwright with real Chromium/Chrome/Edge. Both were attempted:

1. **Playwright (`playwright-core`) + Chromium 1234** — `chromium.launch()` fails on `spawn EPERM` because Chromium's Mojo IPC needs named pipes.
2. **Playwright + manual Chromium `--remote-debugging-port=9222`** — Chromium itself fails to start: `mojo\public\cpp\platform\platform_channel.cc:108] Check failed: . : 拒绝访问。 (0x5)`. Mojo IPC is blocked by the sandbox.
3. **Manual `chrome --headless=new --dump-dom --virtual-time-budget=15000`** — Same Mojo EPERM. Crashpad fails to launch. No DOM produced.
4. **`playwright-cli` (the daemon)** — fails on `C:\Users\Admin\AppData\Local\ms-playwright\daemon\<session>\default.err` with EPERM.
5. **OD export `pasay-dark-qa-390-430.html` to PNG (HTTP API works without auth)** — produces 42 KB PNG, **but** pixel inspection shows: `#0a7d43` PASS-green = 0 / `#c0392b` FAIL-red = 0 across 44 100 sampled pixels. The QA panel was captured at "running…" state (pre-JS).
6. **OD export `pasay-dark-qa-390-430.html` to standalone HTML (HTTP API works without auth)** — HTML is the original source (1.1 MB); no post-JS DOM is persisted in the export.

These errors are at the documented sandbox boundary (`programs cannot open named pipes`), not a software defect in Chromium or OpenDesign. The daemon's electron-based renderer (`Open Design.exe`) is already running on the host but does not expose a remote-debugging port we can attach to from this shell.

### 5.3 What we kept (real, not forbidden)

`pasay-mini-app.html` exposes `window.__OD_RUN_BROWSER_QA()` which, when the page is opened in a real Chromium DOM, will iterate 16 core routes at 390/430 viewports and capture auditable measurements: `document.documentElement.scrollWidth > vw`, `app.scrollWidth > app.clientWidth`, `getBoundingClientRect` on every `.btn / .nav-i / .iconb / button` for height<44 or right-edge clipping, leak tokens in `app.innerHTML`, `bottomNavUsable` (`nav.nav .nav-i` count === 5), topbar/main overlap, `primaryAction` (`.btn-p`) presence.

This function is execution-ready and unchanged. It cannot be invoked from this sandbox; invoking it requires the user opening the file in a real browser (Preview, Playwright on a different machine, etc.). Per the contract's *REAL_BROWSER → PASS* requirement, this is **BLOCKED in this run**.

---

## 6. Historical Domain Gate regression — ALL PASS

```
node gates-runner.js → exit 0
```

Verified gates (all green at final HEAD `cc60ed2`):
- Gate A — OP-R1 → REP full cycle (004E) — **PASS**
- Gate B — 5-route Owner review (004E) — **PASS**
- Gate C — 1701 unit recurrence (004E Fix 1) — **PASS**
- Gate D — Multi-generation reset (004E Fix 2) — **PASS**
- Gate E — 1701 full lifecycle (004F P0-1) — **PASS**
- Gate F — Real graph reset (004F P0-3) — **PASS**
- Gate G — 12-gen ID stress (004F P1) — **PASS**
- Gate H — Production dispatcher (004G P0-1) — **PASS**
- Gate I — Independent Chain Isolation (004G P0-2) — **PASS**
- Gate J — Real Projection Reset (004G P1) — **PASS**
- Gate K — Regression A-J (004G) — **PASS**
- Lease Gates A–M (005A / 005A1 / 005A2) — **PASS**
- Move-out Gates A–W (005B / 005B1 / 005B2) — **PASS**
- Telegram Exact Menu Truth (006A2, with 7 negative self-tests) — **PASS**
- Bootstrap-007A / 007A2 / 007A3 — **PASS**
- Property Archive 007C Final + static — **PASS**
- Home Layout FIX2 + static (banner div balance) — **PASS**
- Operations 008A + static — **PASS**
- Mini App 008B / FIX1 / FIX2 / FIX3 — **PASS**
- MINIAPP_RENDER_CLEAN — **PASS**
- RENDER-UX-CLOSEOUT-R1 — **PASS**
- Mini App 009A Data Coherence — **PASS**
- Membership Role Truth P0 (PASAY-TASK-006) — **PASS**
- Property/Tenant/Lease Bootstrap P0 (PASAY-TASK-007) — **PASS**
- Rent Collection Truth P0 (PASAY-TASK-008) — **PASS**
- **Repair Operation P0 (PASAY-TASK-009)** — **PASS** (Section A changes preserved regression)
- Expense Operation P0 (PASAY-TASK-010) — **PASS**
- Finance Workspace P0 (PASAY-TASK-011) — **PASS**
- Daily Operations Command Center P0 (PASAY-TASK-012) — **PASS**
- **PASAY_FINAL_PRODUCT_FREEZE_V1** — **94/94** — J-F4-pre / J-F4d-pre / J-F4d / A.1 / A.1b / A.2 / A.2b / A.7-prop / A.7-rep / A.7-op all green
- BROWSER_QA_390_430 (Node-side, audit-only) — **5/5** (forbidden-evidence audit per §5.1; **does not satisfy Section B contract**)

---

## 7. New Section-A assertions added (excerpt)

```
✓ [J-F4-pre] 两条 Repair 真实经生产入口创建（A=PRP-A · B=PRP-B · ok=true）
✓ [J-F4] Same-unit 1608：Repair 主记录按 Property.id 隔离（A=PRP-A · B=PRP-B · repairProperty 各自命中）
✓ [J-F4b] Same-unit 1608：repairsForProp(PRP-A)=[REP-FA] · repairsForProp(PRP-B)=[REP-FB]（查询不串房）
✓ [J-F4c] Same-unit 1608：REP-FA Detail 解析到 PRP-A（repairProperty）
✓ [J-F4c] Same-unit 1608：REP-FB Detail 解析到 PRP-B（repairProperty）
✓ [J-F4d-pre] A.8 · 两 Repair 均自动生成 Operation（无 fallback · 缺一即 fail）
✓ [J-F4d] Same-unit 1608：Repair Operation 经 property_id 关联真实 PRP（A→PRP-A · B→PRP-B · A.5 自动 copy · A.9 无手动注入）
✓ [J-F4e] Same-unit 1608：Related Expense 按 property_id 隔离（REP-FA→PRP-A · REP-FB→PRP-B）
✓ [A.1]  doCreateRepairFromPayload 无 property_id → REJECT · zero mutation（repairs/operations 不变）
✓ [A.1b] property_id undefined → REJECT · zero mutation
✓ [A.2]  未知 PRP → REJECT · zero mutation（不靠 unit fallback 猜）
✓ [A.2b] 非 PRP-xxxx 格式（1608）→ REJECT · zero mutation（不靠 unit fallback 猜）
✓ [A.7-prop] Property Detail 各自只含对应 PRP 的 Repair（不串房）
✓ [A.7-rep] Repair Detail 各自解析到正确 PRP
✓ [A.7-op]  Operation Detail 各自只含对应 PRP（property_id 不串）
```

---

## 8. Conclusion (verbatim per contract)

```
PASAY_FINAL_PRODUCT_ACCEPTANCE = RETURN
PASAY_DESIGN_FREEZE_V1         = NOT_FROZEN
```

**Reason**: Section A (Repair property_id authority · A.1–A.9) is **fully closed** and the new production entry point `doCreateRepairFromPayload` is in use by both the UI handler and the J-F4 cross-domain attack test. All historical Domain Gates still pass.

**Section B (REAL 390/430 Browser QA)** cannot be proven in this run because every real-browser path the contract permits (OpenDesign Preview, Playwright with real Chromium) hits the documented sandbox EPERM on Chromium's Mojo IPC, and the OD export captures pre-JS DOM (verified by pixel inspection on the rendered PNG: PASS-green / FAIL-red = 0). This is a runtime constraint, not a defect in the design, but the contract requires Section B as a hard prerequisite for `FROZEN`.

Per §7 ("Allowed Fix Policy") of Issue #20: new product questions requiring an Owner decision go to `BLOCKED_FOR_OWNER_DECISION` and stop. The decision here is whether to:

1. Authorize Section B execution outside this sandbox (e.g. run `playwright-cli` or `chrome --dump-dom --virtual-time-budget` from a machine without the named-pipe restriction, then re-issue the freeze decision), OR
2. Accept that `PASAY_DESIGN_FREEZE_V1` is conditional on the production reviewer running the harness file in their own Chromium and confirming `[J-F4] … PASS` chain via the visible `#__qa_panel`.

```
BLOCKED_FOR_OWNER_DECISION
```

---

## 9. STOP

No MINIAPP-M001 work initiated. No new product surface added. No Telegram / Bottom-Nav IA change. Working tree clean at `cc60ed2`.

Per directive, **STOP** after this report.