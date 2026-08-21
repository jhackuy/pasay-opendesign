/* ─────────────────────────────────────────────────────────────────────────────
   gates-runner.js — Node-runnable test harness for OP-R1 复发 (Gate A) +
   5 路 Owner 评审 (Gate B).

   用法：
     node gates-runner.js

   该文件不重复业务逻辑：从 pasay-mini-app.html 抽取 <script> 块内容，
   用最小 stub 注入到 Node 全局，再调用 window.__OD_GATE_A / window.__OD_GATE_B。
   ──────────────────────────────────────────────────────────────────────────── */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ─────────────── 最小浏览器 stub ─────────────── */
const _ls = (() => {
  const store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
})();

const _noop = () => {};
const _docStub = {
  addEventListener: _noop,
  createElement: () => ({ classList: { add: _noop, remove: _noop }, addEventListener: _noop, appendChild: _noop, remove: _noop, innerHTML: '', querySelectorAll: () => [], querySelector: () => null }),
  querySelector: () => ({ innerHTML: '', addEventListener: _noop, classList: { add: _noop, remove: _noop, toggle: _noop }, value: '', textContent: '', style: {}, dataset: {}, children: [] }),
  querySelectorAll: () => [],
  body: { appendChild: _noop }
};

const sandbox = {
  console,
  window: {},       // populated below (see Object.assign trick)
  document: _docStub,
  localStorage: _ls,
  location: { hash: '' },
  setTimeout, clearTimeout, setInterval, clearInterval,
  Date, Object, Array, JSON, Math, String, Number, Boolean, RegExp, Error,
  Promise, Map, Set, Symbol,
  URLSearchParams: require('url').URLSearchParams
};
sandbox.global = sandbox;
sandbox.self = sandbox;

/* 确保 window.addEventListener / window.localStorage 在 VM scope 直接可见
   （VM 中 let/const/var 声明的变量在 global，不在 window；window.addEventListener 必须显式挂载） */
Object.assign(sandbox.window, {
  addEventListener: _noop,
  localStorage: _ls,
  __OD_INTEGRITY: false,
  rxSim: null      /* 运行时被 HTML 覆盖为真实函数；rxSim 也在 global scope 供 Gate 直接调用 */
});
/* rxSim 同时挂 global scope（Gate 函数直接调用 rxSim） */
sandbox.rxSim = null;

/* ─────────────── 抽取 HTML 的 <script> 块 ─────────────── */
const htmlPath = path.join(__dirname, 'pasay-mini-app.html');
const html = fs.readFileSync(htmlPath, 'utf8');

/* 找到第一个 <script> 与最后一个 </script>，中间就是脚本主体。
   这里只有一个 <script> 块，所以直接用第一个匹配即可。 */
const scriptStart = html.indexOf('<script>');
const scriptEnd = html.indexOf('</script>', scriptStart);
if (scriptStart < 0 || scriptEnd < 0) {
  throw new Error('Could not locate <script> block in pasay-mini-app.html');
}
const scriptBody = html.slice(scriptStart + '<script>'.length, scriptEnd);

/* ─────────────── 在 sandbox 中执行脚本 ─────────────── */
const ctx = vm.createContext(sandbox);
try {
  vm.runInContext(scriptBody, ctx, { filename: 'pasay-mini-app.html', timeout: 30000 });
} catch (e) {
  console.error('[gates-runner] Script execution error:', e && e.message ? e.message : e);
  console.error(e && e.stack ? e.stack : '');
  process.exit(2);
}

/* ─────────────── 取出 window 上的 gate 函数 ─────────────── */
const gateA = ctx.window.__OD_GATE_A;
const gateB = ctx.window.__OD_GATE_B;
const gateC = ctx.window.__OD_GATE_C;
const gateD = ctx.window.__OD_GATE_D;
const gateE = ctx.window.__OD_GATE_E;
const gateF = ctx.window.__OD_GATE_F;
const gateG = ctx.window.__OD_GATE_G;
const gateH = ctx.window.__OD_GATE_H;
const gateI = ctx.window.__OD_GATE_I;
const gateJ = ctx.window.__OD_GATE_J;
const gateK = ctx.window.__OD_GATE_K;
if (typeof gateA !== 'function' || typeof gateB !== 'function') {
  console.error('[gates-runner] Gates not exposed on window. __OD_GATE_A =', typeof gateA, ', __OD_GATE_B =', typeof gateB);
  process.exit(2);
}

/* ─────────────── 运行 Gate A–G 并报告 ─────────────── */
function format(name, r) {
  const head = `[${name}] pass=${r.pass}  ${r.passed}/${r.total}`;
  const lines = r.results.map((x, i) => '  ' + (i + 1) + '. ' + (x.pass ? '✓' : '✗') + '  ' + x.msg);
  return head + '\n' + lines.join('\n');
}

let allPass = true;
try {
  const a = ctx.window.__OD_GATE_A();
  console.log('\n═══════ Gate A — OP-R1 → REP full cycle (004E) ═══════');
  console.log(format('A', a));
  allPass = allPass && a.pass;
} catch (e) {
  console.error('Gate A threw:', e && e.stack ? e.stack : e);
  allPass = false;
}

try {
  const b = ctx.window.__OD_GATE_B();
  console.log('\n═══════ Gate B — 5 路 Owner 评审出口 (004E) ═══════');
  console.log(format('B', b));
  allPass = allPass && b.pass;
} catch (e) {
  console.error('Gate B threw:', e && e.stack ? e.stack : e);
  allPass = false;
}

try {
  const c = ctx.window.__OD_GATE_C();
  console.log('\n═══════ Gate C — 1701 unit recurrence (004E Fix 1) ═══════');
  console.log(format('C', c));
  allPass = allPass && c.pass;
} catch (e) {
  console.error('Gate C threw:', e && e.stack ? e.stack : e);
  allPass = false;
}

try {
  const d = ctx.window.__OD_GATE_D();
  console.log('\n═══════ Gate D — Multi-generation reset (004E Fix 2) ═══════');
  console.log(format('D', d));
  allPass = allPass && d.pass;
} catch (e) {
  console.error('Gate D threw:', e && e.stack ? e.stack : e);
  allPass = false;
}

try {
  const e = ctx.window.__OD_GATE_E();
  console.log('\n═══════ Gate E — 1701 full lifecycle, no hardcoded 1608 (004F P0-1) ═══════');
  console.log(format('E', e));
  allPass = allPass && e.pass;
} catch (e) {
  console.error('Gate E threw:', e && e.stack ? e.stack : e);
  allPass = false;
}

try {
  const f = ctx.window.__OD_GATE_F();
  console.log('\n═══════ Gate F — Real graph reset + dangling reference scan (004F P0-3) ═══════');
  console.log(format('F', f));
  allPass = allPass && f.pass;
} catch (e) {
  console.error('Gate F threw:', e && e.stack ? e.stack : e);
  allPass = false;
}

try {
  const g = ctx.window.__OD_GATE_G();
  console.log('\n═══════ Gate G — 12-gen ID stress test (004F P1) ═══════');
  console.log(format('G', g));
  allPass = allPass && g.pass;
} catch (e) {
  console.error('Gate G threw:', e && e.stack ? e.stack : e);
  allPass = false;
}

try {
  const h = ctx.window.__OD_GATE_H();
  console.log('\n═══════ Gate H — Production dispatcher integrity (004G P0-1) ═══════');
  console.log(format('H', h));
  allPass = allPass && h.pass;
} catch (e) {
  console.error('Gate H threw:', e && e.stack ? e.stack : e);
  allPass = false;
}

try {
  const i = ctx.window.__OD_GATE_I();
  console.log('\n═══════ Gate I — Independent Chain Isolation (004G P0-2) ═══════');
  console.log(format('I', i));
  allPass = allPass && i.pass;
} catch (e) {
  console.error('Gate I threw:', e && e.stack ? e.stack : e);
  allPass = false;
}

try {
  const j = ctx.window.__OD_GATE_J();
  console.log('\n═══════ Gate J — Real Projection Reset + dangling scan (004G P1) ═══════');
  console.log(format('J', j));
  allPass = allPass && j.pass;
} catch (e) {
  console.error('Gate J threw:', e && e.stack ? e.stack : e);
  allPass = false;
}

try {
  const k = ctx.window.__OD_GATE_K();
  console.log('\n═══════ Gate K — Regression A–J (004G) ═══════');
  console.log(format('K', k));
  allPass = allPass && k.pass;
} catch (e) {
  console.error('Gate K threw:', e && e.stack ? e.stack : e);
  allPass = false;
}

/* ─────────────── Lease Renewal Vertical Slice Gates (005A / 005A1 / 005A2) ─────────────── */
const leaseGates = { A:'__OD_LEASE_GATE_A', B:'__OD_LEASE_GATE_B', C:'__OD_LEASE_GATE_C', D:'__OD_LEASE_GATE_D', E:'__OD_LEASE_GATE_E', F:'__OD_LEASE_GATE_F', G:'__OD_LEASE_GATE_G', H:'__OD_LEASE_GATE_H', I:'__OD_LEASE_GATE_I', J:'__OD_LEASE_GATE_J', K:'__OD_LEASE_GATE_K', L:'__OD_LEASE_GATE_L', M:'__OD_LEASE_GATE_M' };
const leaseTitles = {
  A:'Foundation reuse (single lifecycle engine)',
  B:'≤1 active human task per lease op',
  C:'Tenant reply/Owner approval ≠ Lease truth',
  D:'Secretary task fields (Who/Unit/Action/Reason/Deadline/Expected)',
  E:'Full happy path detect→…→Lease updated→CLOSED',
  F:'Negotiation branch (same operation continues)',
  G:'Unreachable branch (snooze/retry/escalation continuity)',
  H:'Repair/Expense/Rent regression unaffected',
  I:'Transition Matrix (lease_action kind guard + source-state matrix, 005A1 P0-1)',
  J:'12-month calendar truth (leaseEndFromStart, 005A1 P0-2)',
  K:'Owner real terms change (terms_before≠terms_after, 005A1 P1)',
  L:'Rejected Evidence Cannot Resurrect (005A2 P0)',
  M:'Calendar Month Clamp + Verified Lease truth (005A2 P1)'
};
const leasePhase = {
  A:'005A', B:'005A', C:'005A', D:'005A', E:'005A', F:'005A', G:'005A', H:'005A',
  I:'005A1', J:'005A1', K:'005A1',
  L:'005A2', M:'005A2'
};
Object.keys(leaseGates).forEach(letter => {
  const fn = ctx.window[leaseGates[letter]];
  if (typeof fn !== 'function') { console.error('Lease Gate ' + letter + ' not exposed.'); allPass = false; return; }
  try {
    const r = fn();
    console.log('\n═══════ Lease Gate ' + letter + ' — ' + leaseTitles[letter] + ' (' + (leasePhase[letter] || '005A') + ') ═══════');
    console.log(format('Lease-' + letter, r));
    allPass = allPass && r.pass;
  } catch (e) {
    console.error('Lease Gate ' + letter + ' threw:', e && e.stack ? e.stack : e);
    allPass = false;
  }
});

/* ─────────────── Move-out Operation Vertical Slice Gates (005B / 005B1 / 005B2) ─────────────── */
const moveoutGates = { A:'__OD_MOVEOUT_GATE_A', B:'__OD_MOVEOUT_GATE_B', C:'__OD_MOVEOUT_GATE_C', D:'__OD_MOVEOUT_GATE_D', E:'__OD_MOVEOUT_GATE_E', F:'__OD_MOVEOUT_GATE_F', G:'__OD_MOVEOUT_GATE_G', H:'__OD_MOVEOUT_GATE_H', I:'__OD_MOVEOUT_GATE_I', J:'__OD_MOVEOUT_GATE_J', K:'__OD_MOVEOUT_GATE_K', L:'__OD_MOVEOUT_GATE_L', M:'__OD_MOVEOUT_GATE_M', N:'__OD_MOVEOUT_GATE_N', O:'__OD_MOVEOUT_GATE_O', P:'__OD_MOVEOUT_GATE_P', Q:'__OD_MOVEOUT_GATE_Q', R:'__OD_MOVEOUT_GATE_R', S:'__OD_MOVEOUT_GATE_S', T:'__OD_MOVEOUT_GATE_T', U:'__OD_MOVEOUT_GATE_U', V:'__OD_MOVEOUT_GATE_V', W:'__OD_MOVEOUT_GATE_W' };
const moveoutTitles = {
  A:'Foundation reuse (single lifecycle engine)',
  B:'Lease Renewal NOT_RENEW → Move-out continuity',
  C:'Active human task invariant (≤1) per phase',
  D:'Inspection truth (submit / reject / verify)',
  E:'Settlement math (Case 1 refund / Case 2 tenant owes / Case 3 zero + Attack 7)',
  F:'Owner Approval ≠ Settlement',
  G:'Evidence rejection integrity (Attack 4)',
  H:'Verified Result Controls Vacancy Truth',
  I:'Owner change settlement + full change→approve→execute→verify persistence (005B1)',
  J:'Transition Matrix / Replay Safety (Attack 1 / 2 / 3 / 5)',
  K:'Child Operation Isolation with real Repair/Expense truth (Attack 6 · 005B1)',
  L:'Complete Happy Path (→ CLOSED/MOVED_OUT)',
  M:'Damage / Deduction Path (verified evidence-backed · 005B1)',
  N:'Outstanding Rent Integration (real rent truth)',
  O:'Global Dangling Reference Scan',
  P:'Aggregate Regression (A–O + Q/R/S/T + U/V/W + 004G K + 005A2 M)',
  Q:'Rejected Inspection Evidence Cannot Affect Money (005B1 P0-1)',
  R:'Owner Approved Change Persistence (change→approve→execute→verify · 005B1 P0-2)',
  S:'Cross-Lease Financial Isolation (utilities per lease_id · 005B1 P0-3)',
  T:'Child Truth Integrity (real Repair + real Expense + 0 dangling · 005B1 P1)',
  U:'Default Lease → Move-out continuity backfill + idempotent + conflict reject (005B2 P0-1)',
  V:'Temporal truth: cannot vacate before moveout_date; truth date = moveout_date (005B2 P0-2)',
  W:'Collection truth: partial verified → op refuses CLOSE; remaining_tenant_balance tracking (005B2 P0-3)'
};
const moveoutPhase = {
  A:'005B', B:'005B', C:'005B', D:'005B', E:'005B', F:'005B', G:'005B', H:'005B', I:'005B', J:'005B', K:'005B', L:'005B', M:'005B', N:'005B', O:'005B', P:'005B',
  Q:'005B1', R:'005B1', S:'005B1', T:'005B1',
  U:'005B2', V:'005B2', W:'005B2'
};
Object.keys(moveoutGates).forEach(letter => {
  const fn = ctx.window[moveoutGates[letter]];
  if (typeof fn !== 'function') { console.error('Move-out Gate ' + letter + ' not exposed.'); allPass = false; return; }
  try {
    const r = fn();
    console.log('\n═══════ Move-out Gate ' + letter + ' — ' + moveoutTitles[letter] + ' (' + (moveoutPhase[letter] || '005B') + ') ═══════');
    console.log(format('Moveout-' + letter, r));
    allPass = allPass && r.pass;
  } catch (e) {
    console.error('Move-out Gate ' + letter + ' threw:', e && e.stack ? e.stack : e);
    allPass = false;
  }
});

/* ─────────────── Telegram Exact Menu Truth Gate (006A2) ───────────────
   Reads pasay-telegram-bot.html and asserts the current Telegram top-level
   menu structure (button count + exact order + no forbidden current labels)
   and the .menu-grid layout (desktop 3 columns, mobile unchanged 3 columns).

   The mandatory truth:
     EXPECTED_TOP_LEVEL_MENU = [Home, Properties, Tasks, Rent, Expense, Archive]
     Desktop layout = 3 columns × 2 rows
     Mobile  layout = 3 columns × 2 rows — EVERY @media(max-width:560px)
     block is scanned (balanced braces); any .menu-grid column override
     must be exactly repeat(3, ...), never 1 / 2 / 4 / 5 / 6 / 1fr / auto.

   Forbidden current-truth labels (the 006A1 historical error):
     Collections, Expenses, Finance

   Optional htmlOverride parameter is for the in-memory self-test only —
   production always reads the real file. The file is never mutated on disk. */

/* Balanced-brace extraction of EVERY '@media' block whose header matches
   max-width: 560px. Unlike html.match(/@media ...\{[\s\S]*?\}/) this scans
   ALL occurrences and reads each block to its true closing brace — a later
   second media block that overrides .menu-grid columns cannot bypass it. */
function extractAllMediaBlocks(css) {
  const blocks = [];
  let idx = 0;
  for (;;) {
    const at = css.indexOf('@media', idx);
    if (at === -1) break;
    const open = css.indexOf('{', at);
    if (open === -1) break;
    const header = css.slice(at + 6, open);
    let depth = 0;
    let i = open;
    for (; i < css.length; i++) {
      const ch = css[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    if (i >= css.length) break; // unbalanced CSS — stop scanning
    if (/max-width\s*:\s*560px/i.test(header)) {
      blocks.push({ header: header.trim(), content: css.slice(open + 1, i) });
    }
    idx = i + 1;
  }
  return blocks;
}

/* Within a CSS fragment, find every `.menu-grid { ... }` rule (balanced
   braces) and return the raw values of any grid-template-columns decls. */
function findMenuGridColumnOverrides(css) {
  /* Strip CSS comments first so a `.menu-grid` mention inside a comment can
     never be mistaken for a real rule. */
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  let idx = 0;
  for (;;) {
    const sel = css.indexOf('.menu-grid', idx);
    if (sel === -1) break;
    const open = css.indexOf('{', sel);
    if (open === -1) break;
    let depth = 0;
    let i = open;
    for (; i < css.length; i++) {
      const ch = css[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) break;
      }
    }
    if (i >= css.length) break;
    const decls = css.slice(open + 1, i);
    const gtc = decls.match(/grid-template-columns\s*:\s*([^;}]+)/);
    if (gtc) out.push(gtc[1].trim());
    idx = i + 1;
  }
  return out;
}

function runTelegramExactMenuTruthGate(htmlOverride) {
  const html = htmlOverride || fs.readFileSync(path.join(__dirname, 'pasay-telegram-bot.html'), 'utf8');
  const expectedLabels = ['Home', 'Properties', 'Tasks', 'Rent', 'Expense', 'Archive'];
  const forbiddenCurrentLabels = ['Collections', 'Expenses', 'Finance'];
  const results = [];
  let pass = true;

  /* 1. Locate every .menu-grid menu instance using data-od-id="bot-fixed-menu*".
        Scoping to these two specific instances avoids matching banner text
        in historical / superseded sections (where the 006A1 labels are
        intentionally preserved as human-readable historical notes). */
  const blockRegex = /<div\s+class="menu-grid"[^>]*data-od-id="bot-fixed-menu[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
  const blocks = [];
  let bm;
  while ((bm = blockRegex.exec(html)) !== null) {
    blocks.push(bm[1]);
  }
  if (blocks.length < 2) {
    results.push({ pass: false, msg: 'expected at least 2 .menu-grid data-od-id=bot-fixed-menu* instances in pasay-telegram-bot.html, found ' + blocks.length });
    pass = false;
  } else {
    results.push({ pass: true, msg: 'found ' + blocks.length + ' .menu-grid instances (data-od-id=bot-fixed-menu*) in pasay-telegram-bot.html' });
  }

  /* 2. Per-instance: button_count + exact order + no forbidden current labels */
  blocks.forEach((block, idx) => {
    const instanceNo = idx + 1;
    const btnRegex = /<button\s+class="menu-btn">([^<]+?)<span>/g;
    const labels = [];
    let m;
    while ((m = btnRegex.exec(block)) !== null) {
      /* Strip leading non-ASCII characters (emoji surrogate pairs) and trim.
         This isolates the human-readable label from the icon prefix. */
      const stripped = m[1].replace(/^[^\x00-\x7F]+/, '').trim();
      labels.push(stripped);
    }
    if (labels.length !== 6) {
      results.push({ pass: false, msg: 'menu instance ' + instanceNo + ' button_count = ' + labels.length + ' (expected exactly 6)' });
      pass = false;
    } else {
      results.push({ pass: true, msg: 'menu instance ' + instanceNo + ' button_count = 6' });
    }
    const orderOK = labels.length === expectedLabels.length && labels.every((l, i) => l === expectedLabels[i]);
    if (!orderOK) {
      results.push({ pass: false, msg: 'menu instance ' + instanceNo + ' order = [' + labels.join(', ') + '] (expected exact [' + expectedLabels.join(', ') + '])' });
      pass = false;
    } else {
      results.push({ pass: true, msg: 'menu instance ' + instanceNo + ' exact order [' + labels.join(' / ') + ']' });
    }
    const foundForbidden = labels.filter(l => forbiddenCurrentLabels.indexOf(l) >= 0);
    if (foundForbidden.length > 0) {
      results.push({ pass: false, msg: 'menu instance ' + instanceNo + ' contains forbidden current-truth label(s): [' + foundForbidden.join(', ') + '] (must be [Home, Properties, Tasks, Rent, Expense, Archive] — NOT the 006A1 historical error Collections/Expenses/Finance)' });
      pass = false;
    } else {
      results.push({ pass: true, msg: 'menu instance ' + instanceNo + ' no forbidden current-truth labels (no Collections/Expenses/Finance)' });
    }
  });

  /* 3. GLOBAL .menu-grid column truth — inspect EVERY `.menu-grid { ... }`
        rule in the whole <style> block (balanced-brace extraction, comments
        stripped) and require every grid-template-columns declaration to be
        exactly repeat(3, ...). This is NOT a "one correct rule exists" test:
        a correct rule followed by a later cascade override such as
        .menu-grid { grid-template-columns: repeat(4, 1fr); } must FAIL. */
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (!styleMatch) {
    results.push({ pass: false, msg: 'no <style> block found — cannot verify global .menu-grid column truth' });
    pass = false;
  } else {
    const globalDecls = findMenuGridColumnOverrides(styleMatch[1]);
    results.push({ pass: true, msg: 'global: scanned ' + globalDecls.length + ' .menu-grid grid-template-columns declaration(s) across the whole <style> block (balanced-brace)' });
    let globalOK = true;
    globalDecls.forEach((v, i) => {
      const isThree = /^repeat\(\s*3\s*,/i.test(v);
      if (!isThree) globalOK = false;
      results.push({
        pass: isThree,
        msg: isThree
          ? '.menu-grid column declaration #' + (i + 1) + ' = "' + v + '" (repeat(3, ...) — exactly 3 columns)'
          : '.menu-grid column declaration #' + (i + 1) + ' = "' + v + '" (forbidden: ONLY repeat(3, ...) allowed on .menu-grid; not 1 / 2 / 4 / 5 / 6 / 1fr / auto / none / subgrid / etc.)'
      });
    });
    if (!globalOK) pass = false;
  }

  /* 4. Layout: mobile @media (max-width: 560px) — scan EVERY media block,
        not just the first one. The old logic (html.match with [\s\S]*?\})
        had two bypasses: `match()` only took the first occurrence, and the
        lazy `}` stopped at the first inner brace. A later second media block
        could therefore override .menu-grid to 4 columns and the gate would
        still report PASS. Now each block is read to its true closing brace
        (balanced-brace counting) and every .menu-grid grid-template-columns
        override inside ANY block is inspected.

        The ONLY correct mobile truth is exactly 3 columns:
          - no @media(max-width:560px) block touches .menu-grid
            grid-template-columns  → inherit desktop 3 columns → PASS
          - every override found must be exactly repeat(3, ...)   → PASS
          - ANY single override is repeat(1/2/4/5/6,...), 1fr,
            auto, none, subgrid, etc.                             → FAIL */
  const mobileBlocks = extractAllMediaBlocks(html);
  results.push({ pass: true, msg: 'mobile: scanned ' + mobileBlocks.length + ' @media(max-width:560px) block(s) with balanced-brace parsing (not just the first match)' });

  const overrides = [];
  mobileBlocks.forEach((blk, bi) => {
    findMenuGridColumnOverrides(blk.content).forEach(v => {
      overrides.push({ blockNo: bi + 1, value: v });
    });
  });

  if (overrides.length === 0) {
    results.push({ pass: true, msg: 'mobile: found 0 .menu-grid grid-template-columns overrides in all mobile media blocks — mobile inherits desktop 3 columns' });
  } else {
    let allOK = true;
    overrides.forEach(o => {
      const isThree = /^repeat\(\s*3\s*,/i.test(o.value);
      if (!isThree) allOK = false;
      results.push({
        pass: isThree,
        msg: isThree
          ? 'mobile media block #' + o.blockNo + ' overrides .menu-grid grid-template-columns to "' + o.value + '" (exactly repeat(3, ...) — 3 columns preserved)'
          : 'mobile media block #' + o.blockNo + ' overrides .menu-grid grid-template-columns to "' + o.value + '" (forbidden: ONLY repeat(3, ...) allowed on mobile; not 1 / 2 / 4 / 5 / 6 / 1fr / auto / none / subgrid / etc.)'
      });
    });
    if (!allOK) pass = false;
  }

  return { gate: 'TelegramExactMenuTruth', pass, total: results.length, passed: results.filter(r => r.pass).length, results };
}

/* ─────────────── Run Bootstrap-007A Gate (Merchant / Team / Invite / Binding / Switch / No-ID) ─────────────── */
{
  const gateBootstrap = ctx.window.__OD_GATE_BOOTSTRAP;
  if (typeof gateBootstrap === 'function') {
    try {
      const r = gateBootstrap();
      console.log('\n═══════ Bootstrap-007A Gate (007A1 · NO_WORKSPACE / Team / Invite / Binding / Switch / No-ID) ═══════');
      console.log(format('Bootstrap-007A', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('Bootstrap-007A gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('Bootstrap-007A gate not exposed on window (__OD_GATE_BOOTSTRAP = ' + typeof gateBootstrap + ')');
    allPass = false;
  }
}

/* ─────────────── Run Bootstrap-007A2 Gate (Authority & Membership Truth) ─────────────── */
{
  const gateBootstrapA2 = ctx.window.__OD_GATE_BOOTSTRAP_A2;
  if (typeof gateBootstrapA2 === 'function') {
    try {
      const r = gateBootstrapA2();
      console.log('\n═══════ Bootstrap-007A2 Gate (007A2 · Authority & Membership Truth) ═══════');
      console.log(format('Bootstrap-007A2', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('Bootstrap-007A2 gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('Bootstrap-007A2 gate not exposed on window (__OD_GATE_BOOTSTRAP_A2 = ' + typeof gateBootstrapA2 + ')');
    allPass = false;
  }
}

/* ─────────────── Run Bootstrap-007A3 Gate (Invite Identity & Action Authority) ─────────────── */
{
  const gateBootstrapA3 = ctx.window.__OD_GATE_BOOTSTRAP_A3;
  if (typeof gateBootstrapA3 === 'function') {
    try {
      const r = gateBootstrapA3();
      console.log('\n═══════ Bootstrap-007A3 Gate (007A3 · Invite Identity & Action Authority) ═══════');
      console.log(format('Bootstrap-007A3', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('Bootstrap-007A3 gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('Bootstrap-007A3 gate not exposed on window (__OD_GATE_BOOTSTRAP_A3 = ' + typeof gateBootstrapA3 + ')');
    allPass = false;
  }
}

/* ─────────────── Run Telegram Exact Menu Truth Gate (real + in-memory self-test) ─────────────── */
try {
  const realHtml = fs.readFileSync(path.join(__dirname, 'pasay-telegram-bot.html'), 'utf8');

  /* Real run: read the file on disk, no mutation. */
  const realMenuResult = runTelegramExactMenuTruthGate(realHtml);
  console.log('\n═══════ Telegram Exact Menu Truth Gate (006A2 Source of Truth sync) ═══════');
  console.log(format('TelegramExactMenuTruth', realMenuResult));
  allPass = allPass && realMenuResult.pass;

  /* Self-test (negative cases) — proves the gate is not a false gate.
     The mutations below are in-memory string operations only; pasay-telegram-bot.html
     on disk is never modified (we use `const mutated = realHtml.replace(...)` which
     creates a new string and leaves realHtml untouched). */
  console.log('\n─────── Telegram Exact Menu Truth Gate · SELF-TEST (in-memory, no file mutation) ───────');

  // Negative case A: Rent → Collections (the actual 006A1 historical error)
  {
    const mutated = realHtml.replace('💰 Rent<span>', '💰 Collections<span>');
    const r = runTelegramExactMenuTruthGate(mutated);
    const failingCount = r.results.filter(x => !x.pass).length;
    if (r.pass) {
      console.log('  ✗ NEGATIVE A: Rent → Collections · gate PASSED (false gate — must FAIL)');
      allPass = false;
    } else {
      console.log('  ✓ negative A: Rent → Collections · gate correctly failed (' + failingCount + ' failing assertions)');
    }
  }

  // Negative case B: Archive → Finance
  {
    const mutated = realHtml.replace('🗂 Archive<span>', '💵 Finance<span>');
    const r = runTelegramExactMenuTruthGate(mutated);
    const failingCount = r.results.filter(x => !x.pass).length;
    if (r.pass) {
      console.log('  ✗ NEGATIVE B: Archive → Finance · gate PASSED (false gate — must FAIL)');
      allPass = false;
    } else {
      console.log('  ✓ negative B: Archive → Finance · gate correctly failed (' + failingCount + ' failing assertions)');
    }
  }

  // Negative case C: change button_count by deleting one button
  {
    const mutated = realHtml.replace(/<button class="menu-btn">🗂 Archive<span>Property Channel · 长期档案归档<\/span><\/button>\s*/, '');
    const r = runTelegramExactMenuTruthGate(mutated);
    const failingCount = r.results.filter(x => !x.pass).length;
    if (r.pass) {
      console.log('  ✗ NEGATIVE C: button_count = 5 (deleted Archive) · gate PASSED (false gate — must FAIL)');
      allPass = false;
    } else {
      console.log('  ✓ negative C: button_count = 5 (deleted Archive) · gate correctly failed (' + failingCount + ' failing assertions)');
    }
  }

  // Negative case D: mobile @media overrides .menu-grid grid-template-columns to repeat(2, 1fr)
  // (must FAIL — only repeat(3, ...) is allowed on mobile)
  {
    const mutated = realHtml.replace(
      /@media \(max-width: 560px\) \{[\s\S]*?\}/,
      '@media (max-width: 560px) { .menu-grid { gap: 6px; grid-template-columns: repeat(2, 1fr); } .menu-btn { padding: 9px 10px; font-size: 13.5px; } .menu-btn span { font-size: 10.5px; } }'
    );
    const r = runTelegramExactMenuTruthGate(mutated);
    const failingCount = r.results.filter(x => !x.pass).length;
    if (r.pass) {
      console.log('  ✗ NEGATIVE D: mobile .menu-grid grid-template-columns = repeat(2, 1fr) · gate PASSED (false gate — must FAIL)');
      allPass = false;
    } else {
      console.log('  ✓ negative D: mobile repeat(2, 1fr) · gate correctly failed (' + failingCount + ' failing assertions)');
    }
  }

  // Negative case E: mobile @media overrides .menu-grid grid-template-columns to repeat(4, 1fr)
  // (must FAIL — only repeat(3, ...) is allowed on mobile; this is the 4-column loophole
  //  that the previous "deny-list" logic missed)
  {
    const mutated = realHtml.replace(
      /@media \(max-width: 560px\) \{[\s\S]*?\}/,
      '@media (max-width: 560px) { .menu-grid { gap: 6px; grid-template-columns: repeat(4, 1fr); } .menu-btn { padding: 9px 10px; font-size: 13.5px; } .menu-btn span { font-size: 10.5px; } }'
    );
    const r = runTelegramExactMenuTruthGate(mutated);
    const failingCount = r.results.filter(x => !x.pass).length;
    if (r.pass) {
      console.log('  ✗ NEGATIVE E: mobile .menu-grid grid-template-columns = repeat(4, 1fr) · gate PASSED (false gate — 4-column loophole must be closed)');
      allPass = false;
    } else {
      console.log('  ✓ negative E: mobile repeat(4, 1fr) · gate correctly failed (' + failingCount + ' failing assertions — 4-column loophole closed)');
    }
  }

  // Negative case F: a LATER second @media(max-width:560px) block overrides
  // .menu-grid to repeat(4, 1fr) while the original correct block stays in
  // place. (must FAIL — the gate must scan EVERY mobile media block, not
  // just the first one; this was the real bypass the old match() had)
  {
    const mutated = realHtml.replace(
      '</style>',
      '@media (max-width: 560px) { .menu-grid { grid-template-columns: repeat(4, 1fr); } }\n</style>'
    );
    const r = runTelegramExactMenuTruthGate(mutated);
    const failingCount = r.results.filter(x => !x.pass).length;
    if (r.pass) {
      console.log('  ✗ NEGATIVE F: later mobile @media repeat(4, 1fr) override · gate PASSED (false gate — must FAIL)');
      allPass = false;
    } else {
      console.log('  ✓ negative F: later mobile @media repeat(4, 1fr) override · gate correctly failed (' + failingCount + ' failing assertions — every mobile media block is scanned)');
    }
  }

  // Negative case G: a LATER GLOBAL .menu-grid rule (outside any media query)
  // overrides columns to repeat(4, 1fr) after the correct desktop rule.
  // A "one correct rule exists" style gate would miss this; the global scan
  // must FAIL on it. (must FAIL)
  {
    const mutated = realHtml.replace(
      '</style>',
      '.menu-grid { grid-template-columns: repeat(4, 1fr); }\n</style>'
    );
    const r = runTelegramExactMenuTruthGate(mutated);
    const failingCount = r.results.filter(x => !x.pass).length;
    if (r.pass) {
      console.log('  ✗ NEGATIVE G: later global .menu-grid repeat(4, 1fr) override · gate PASSED (false gate — must FAIL)');
      allPass = false;
    } else {
      console.log('  ✓ negative G: later global .menu-grid repeat(4, 1fr) override · gate correctly failed (' + failingCount + ' failing assertions)');
    }
  }

  // Positive multiple-media: TWO mobile media blocks, the second overrides
  // .menu-grid to repeat(3, 1fr). Must PASS — multiple blocks are fine as
  // long as every .menu-grid column override is exactly 3 columns.
  {
    const mutated = realHtml.replace(
      '</style>',
      '@media (max-width: 560px) { .menu-grid { grid-template-columns: repeat(3, 1fr); } }\n</style>'
    );
    const r = runTelegramExactMenuTruthGate(mutated);
    if (!r.pass) {
      console.log('  ✗ POSITIVE multiple-media: later @media repeat(3, 1fr) override · gate FAILED (false rejection — multiple 3-column blocks must PASS)');
      allPass = false;
    } else {
      console.log('  ✓ positive multiple-media: later @media repeat(3, 1fr) override · gate passed (' + r.passed + '/' + r.total + ')');
    }
  }

  // Sanity: re-run on real HTML to confirm the gate still passes after the self-test mutations
  {
    const r = runTelegramExactMenuTruthGate(realHtml);
    if (!r.pass) {
      console.log('  ✗ SANITY: real HTML no longer passes after self-test (regression)');
      allPass = false;
    } else {
      console.log('  ✓ sanity: real HTML still passes after self-test (' + r.passed + '/' + r.total + ')');
    }
  }
} catch (e) {
  console.error('Telegram Exact Menu Truth Gate threw:', e && e.stack ? e.stack : e);
  allPass = false;
}

/* ─────────────── Run PROPERTY_ARCHIVE_007C_FINAL Gate (PASAY-TASK-002 · FIX1) ─────────────── */
{
  const gate007C = ctx.window.__OD_GATE_PROPERTY_ARCHIVE_007C_FINAL;
  if (typeof gate007C === 'function') {
    try {
      const r = gate007C();
      console.log('\n═══════ PROPERTY_ARCHIVE_007C_FINAL Gate (PASAY-TASK-002 · FIX1) ═══════');
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('PropertyArchive-007C-Final', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('PropertyArchive-007C-Final gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('PropertyArchive-007C-Final gate not exposed on window (__OD_GATE_PROPERTY_ARCHIVE_007C_FINAL = ' + typeof gate007C + ')');
    allPass = false;
  }

  /* 静态契约断言：007C Final 契约事实。
     PASAY-TASK-004（008B）要求普通用户 UI 不暴露 Snapshot Policy 等工程术语 ——
     Mini App 的契约卡已移入 design-system 契约文档层（vnext-property-007c），
     因此 7/8 两项改对 pasay-design-system.html 断言；3/9/11 仍对 mini-app 源码断言。 */
  try {
    const miniSrc = fs.readFileSync(path.join(__dirname, 'pasay-mini-app.html'), 'utf8');
    const script = miniSrc.match(/<script>([\s\S]*?)<\/script>/i);
    const code = script ? script[1] : miniSrc;
    const dsSrc = fs.readFileSync(path.join(__dirname, 'pasay-design-system.html'), 'utf8');
    const checks = [
      { n: 3, cond: code.indexOf("a === 'open-master-post'") !== -1 && code.indexOf('window.open(p.archive_message_url') !== -1 && code.indexOf('data-a="open-master-post"') !== -1, msg: '[007C-3] Open Archive 使用 Telegram message deep-link（open-master-post handler + window.open(archive_message_url) + 真实导航按钮，非 modal-only / close-modal）' },
      { n: 7, cond: dsSrc.indexOf('Partial payment 不自动创建 Property Summary') !== -1, msg: '[007C-7] Partial payment 不自动生成 Property Summary / Snapshot（design-system 契约保留）' },
      { n: 8, cond: code.indexOf("kind: 'receipt'") !== -1 && (dsSrc.indexOf('receipts stay as archive records') !== -1 || dsSrc.indexOf('Receipt 本身作为 Archive record') !== -1), msg: '[007C-8] Receipt 继续作为 Archive record（receipt 分类 + design-system 契约文案）' },
      { n: 9, cond: code.indexOf("a === 'archive-snapshot'") !== -1 && code.indexOf('手动快照') !== -1, msg: '[007C-9] 手动 Create Snapshot 仍然存在（archive-snapshot action + 按钮）' },
      { n: 11, cond: code.indexOf('data-a="building-contacts-more"') !== -1 && code.indexOf('查看 ') !== -1, msg: '[007C-11] Primary contact 默认显示 + 其余联系人 View N more 展开' }
    ];
    let statAll = true;
    checks.forEach(c => { const ok = c.cond; statAll = statAll && ok; console.log('  ' + (ok ? '✓' : '✗') + '  ' + c.msg); });
    console.log(format('PropertyArchive-007C-Final-static', { gate: 'PropertyArchive-007C-Final-static', pass: statAll, total: checks.length, passed: checks.filter(c => c.cond).length, results: [] }));
    allPass = allPass && statAll;
  } catch (e) {
    console.error('PropertyArchive-007C-Final static assertions threw:', e && e.stack ? e.stack : e);
    allPass = false;
  }
}

/* ─────────────── Run Home Layout Regression Gate (PASAY-TASK-002 · FIX2) ─────────────── */
{
  const gateHome = ctx.window.__OD_GATE_HOME_LAYOUT;
  if (typeof gateHome === 'function') {
    try {
      const r = gateHome();
      console.log('\n═══════ Home Layout Regression Gate (PASAY-TASK-002 · FIX2) ═══════');
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('HomeLayout-FIX2', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('HomeLayout-FIX2 gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('HomeLayout-FIX2 gate not exposed on window (__OD_GATE_HOME_LAYOUT = ' + typeof gateHome + ')');
    allPass = false;
  }

  /* 函数源码级静态断言：setupBannerHtml 内部 div 必须平衡且以完整三层闭合结尾（不只查全文件 div 总数） */
  try {
    const miniSrc = fs.readFileSync(path.join(__dirname, 'pasay-mini-app.html'), 'utf8');
    const script = miniSrc.match(/<script>([\s\S]*?)<\/script>/i);
    const code = script ? script[1] : miniSrc;
    const fnMatch = code.match(/function setupBannerHtml\(\)\s*\{([\s\S]*?)\n\}/);
    const body = fnMatch ? fnMatch[1] : '';
    const open = (body.match(/<div\b/g) || []).length;
    const close = (body.match(/<\/div>/g) || []).length;
    const checks = [
      { n: 1, cond: fnMatch !== null && open === close && open >= 2, msg: '[FIX2-s1] setupBannerHtml 函数体内 <div>(' + open + ') 与 </div>(' + close + ') 计数平衡' },
      { n: 2, cond: /<\/button><\/div><\/div><\/div>'/.test(body), msg: "[FIX2-s2] setupBannerHtml return 以 </button></div></div></div>' 完整三层闭合结尾（banner 根节点已闭合）" },
      { n: 3, cond: body.indexOf('<div class="banner info"') !== -1 && (body.match(/<div class="banner info"/g) || []).length === 1, msg: '[FIX2-s3] 仅一个 .banner info 根节点（无重复/嵌套 banner）' }
    ];
    let statAll = true;
    checks.forEach(c => { const ok = c.cond; statAll = statAll && ok; console.log('  ' + (ok ? '✓' : '✗') + '  ' + c.msg); });
    console.log(format('HomeLayout-FIX2-static', { gate: 'HomeLayout-FIX2-static', pass: statAll, total: checks.length, passed: checks.filter(c => c.cond).length, results: [] }));
    allPass = allPass && statAll;
  } catch (e) {
    console.error('HomeLayout-FIX2 static assertions threw:', e && e.stack ? e.stack : e);
    allPass = false;
  }
}

/* ─────────────── Run Operations Work Queue Gate (PASAY-TASK-003 · 008A) ─────────────── */
{
  const gate008A = ctx.window.__OD_GATE_OPERATIONS_008A;
  if (typeof gate008A === 'function') {
    try {
      const r = gate008A();
      console.log('\n═══════ Operations Work Queue Gate (PASAY-TASK-003 · 008A) ═══════');
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('Operations-008A', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('Operations-008A gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('Operations-008A gate not exposed on window (__OD_GATE_OPERATIONS_008A = ' + typeof gate008A + ')');
    allPass = false;
  }

  /* 静态契约断言：源码文本（Operations ≠ Tasks / Waiting Contract 文案 / 禁止按钮 / Navigation 职责） */
  try {
    const miniSrc = fs.readFileSync(path.join(__dirname, 'pasay-mini-app.html'), 'utf8');
    const script = miniSrc.match(/<script>([\s\S]*?)<\/script>/i);
    const code = script ? script[1] : miniSrc;
    const checks = [
      { n: 1, cond: code.indexOf('需要人处理的在这里') !== -1 && code.indexOf('NEEDS YOU') !== -1, msg: '[008A-s1] Action Queue 视图声明（Operations ≠ Tasks 文案 + 需要你处理分组）' },
      { n: 2, cond: code.indexOf('Waiting for tenant') !== -1 && code.indexOf('等待租客') !== -1 && code.indexOf('Waiting for Owner decision') !== -1, msg: '[008A-s2] Waiting Contract 文案（等待租客 / 等待 Owner 决策等）' },
      { n: 3, cond: code.indexOf('任务完成不代表 Operation 结束') !== -1 && code.indexOf('Task done ≠ Operation closed') !== -1, msg: '[008A-s3] Task 完成 ≠ Operation Closed（Related Task 区块文案）' },
      { n: 4, cond: code.indexOf('部分支付 · 已收') !== -1 || code.indexOf('partially paid') !== -1, msg: '[008A-s4] Rent partial 卡片表达（部分支付 · 已收 / partially paid）' },
      { n: 5, cond: code.indexOf('时间线 · Activity') !== -1 && code.indexOf('TIMELINE · ACTIVITY') !== -1, msg: '[008A-s5] Activity 时间线与 Task 分离（时间线 · Activity 标题）' }
    ];
    let statAll = true;
    checks.forEach(c => { const ok = c.cond; statAll = statAll && ok; console.log('  ' + (ok ? '✓' : '✗') + '  ' + c.msg); });
    console.log(format('Operations-008A-static', { gate: 'Operations-008A-static', pass: statAll, total: checks.length, passed: checks.filter(c => c.cond).length, results: [] }));
    allPass = allPass && statAll;
  } catch (e) {
    console.error('Operations-008A static assertions threw:', e && e.stack ? e.stack : e);
    allPass = false;
  }
}

/* ─────────────── Run Mini App 008B Gate (PASAY-TASK-004 · Mobile Operations Console) ─────────────── */
{
  const gate008B = ctx.window.__OD_GATE_MINAPP_008B;
  if (typeof gate008B === 'function') {
    try {
      const r = gate008B();
      console.log('\n═══════ Mini App 008B Gate (PASAY-TASK-004 · Mobile Operations Console) ═══════');
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('MiniApp-008B', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('MiniApp-008B gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('MiniApp-008B gate not exposed on window (__OD_GATE_MINAPP_008B = ' + typeof gate008B + ')');
    allPass = false;
  }

  /* 静态断言：CSS / responsive（44×44 touch target · 390/430 无横向滚动） */
  try {
    const miniSrc = fs.readFileSync(path.join(__dirname, 'pasay-mini-app.html'), 'utf8');
    const checks = [
      { n: 1, cond: miniSrc.indexOf('.nav-i { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 9px 0 8px; min-height: 56px; min-width: 44px;') !== -1, msg: '[008B-s1] Bottom Nav touch target ≥ 44×44（.nav-i min-height 56px + min-width 44px）' },
      { n: 2, cond: miniSrc.indexOf('max-width: 430px') !== -1 && miniSrc.indexOf('overflow: hidden') !== -1, msg: '[008B-s2] 390/430 无横向滚动（容器 max-width 430 + overflow hidden）' },
      { n: 3, cond: miniSrc.indexOf('grid-template-columns: repeat(5, 1fr)') !== -1, msg: '[008B-s3] Bottom Nav 5 列布局（repeat(5, 1fr)）' },
      { n: 4, cond: miniSrc.indexOf('padding-bottom: env(safe-area-inset-bottom)') !== -1, msg: '[008B-s4] Bottom safe area 处理（env(safe-area-inset-bottom)）' }
    ];
    let statAll = true;
    checks.forEach(c => { const ok = c.cond; statAll = statAll && ok; console.log('  ' + (ok ? '✓' : '✗') + '  ' + c.msg); });
    console.log(format('MiniApp-008B-static', { gate: 'MiniApp-008B-static', pass: statAll, total: checks.length, passed: checks.filter(c => c.cond).length, results: [] }));
    allPass = allPass && statAll;
  } catch (e) {
    console.error('MiniApp-008B static assertions threw:', e && e.stack ? e.stack : e);
    allPass = false;
  }
}

/* ─────────────── Run Mini App 008B-FIX1 Gate (PASAY-TASK-004-FIX1 · UX Closeout) ─────────────── */
{
  const gateFix1 = ctx.window.__OD_GATE_MINAPP_008B_FIX1;
  if (typeof gateFix1 === 'function') {
    try {
      const r = gateFix1();
      console.log('\n═══════ Mini App 008B-FIX1 Gate (PASAY-TASK-004-FIX1 · UX Closeout) ═══════');
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('MiniApp-008B-FIX1', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('MiniApp-008B-FIX1 gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('MiniApp-008B-FIX1 gate not exposed on window (__OD_GATE_MINAPP_008B_FIX1 = ' + typeof gateFix1 + ')');
    allPass = false;
  }

  /* 静态断言：Bottom Nav label ≥11px + 无自然语言搜索文案 */
  try {
    const miniSrc = fs.readFileSync(path.join(__dirname, 'pasay-mini-app.html'), 'utf8');
    const checks = [
      { n: 1, cond: miniSrc.indexOf('.nav-i .nl { font-size: 11px;') !== -1, msg: '[FIX1-s1] Bottom Nav label ≥11px（.nav-i .nl font-size 11px）' },
      { n: 2, cond: miniSrc.indexOf('或输入自然语言') === -1 && miniSrc.indexOf('or ask…') === -1 && miniSrc.indexOf('natural-language command') === -1 && miniSrc.indexOf('自然语言指令') === -1, msg: '[FIX1-s2] Mini App 全站无「输入自然语言 / or ask」搜索文案' }
    ];
    let statAll = true;
    checks.forEach(c => { const ok = c.cond; statAll = statAll && ok; console.log('  ' + (ok ? '✓' : '✗') + '  ' + c.msg); });
    console.log(format('MiniApp-008B-FIX1-static', { gate: 'MiniApp-008B-FIX1-static', pass: statAll, total: checks.length, passed: checks.filter(c => c.cond).length, results: [] }));
    allPass = allPass && statAll;
  } catch (e) {
    console.error('MiniApp-008B-FIX1 static assertions threw:', e && e.stack ? e.stack : e);
    allPass = false;
  }
}

/* ─────────────── Run Mini App 008B-FIX2 Gate (PASAY-TASK-004-FIX2 · Finance Filter Truth) ─────────────── */
{
  const gateFix2 = ctx.window.__OD_GATE_MINAPP_008B_FIX2;
  if (typeof gateFix2 === 'function') {
    try {
      const r = gateFix2();
      console.log('\n═══════ Mini App 008B-FIX2 Gate (PASAY-TASK-004-FIX2 · Finance Filter Truth) ═══════');
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('MiniApp-008B-FIX2', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('MiniApp-008B-FIX2 gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('MiniApp-008B-FIX2 gate not exposed on window (__OD_GATE_MINAPP_008B_FIX2 = ' + typeof gateFix2 + ')');
    allPass = false;
  }
}

/* ─────────────── Run Mini App 008B-FIX3 Gate (PASAY-TASK-004-FIX3 · Status/Empty Truth + Closeout) ─────────────── */
{
  const gateFix3 = ctx.window.__OD_GATE_MINAPP_008B_FIX3;
  if (typeof gateFix3 === 'function') {
    try {
      const r = gateFix3();
      console.log('\n═══════ Mini App 008B-FIX3 Gate (PASAY-TASK-004-FIX3 · Status/Empty Truth + Closeout) ═══════');
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('MiniApp-008B-FIX3', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('MiniApp-008B-FIX3 gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('MiniApp-008B-FIX3 gate not exposed on window (__OD_GATE_MINAPP_008B_FIX3 = ' + typeof gateFix3 + ')');
    allPass = false;
  }
}

/* ─────────────── MINIAPP_RENDER_CLEAN Gate (PASAY-TASK-004-FIX3 · 模板泄漏全量扫描) ─────────────── */
{
  try {
    const miniSrc = fs.readFileSync(path.join(__dirname, 'pasay-mini-app.html'), 'utf8');
    const script = miniSrc.match(/<script>([\s\S]*?)<\/script>/i);
    const code = script ? script[1] : miniSrc;
    /* backtick 模板内（去掉 ${} 插值后）不得出现裸 `'+` 字符串拼接 */
    const re = /`([^`]*)`/g;
    let t, leakSites = 0;
    while ((t = re.exec(code)) !== null) {
      const stripped = t[1].replace(/\$\{[^}]*\}/g, '${X}');
      const bad = stripped.match(/'\+/g);
      if (bad) { leakSites += bad.length; }
    }
    const checks = [
      { n: 1, cond: leakSites === 0, msg: '[RENDER-1] backtick 模板内裸字符串拼接（\x27+）泄漏 = ' + leakSites + '（必须 0）' },
      { n: 2, cond: code.indexOf('${undefined}') === -1 && code.indexOf('${null}') === -1 && code.indexOf('${[object') === -1, msg: '[RENDER-2] 无 ${undefined} / ${null} / ${[object Object]} 直出' },
      { n: 3, cond: code.indexOf('"undefined"') === -1 && code.indexOf('>undefined<') === -1 && code.indexOf('>null<') === -1, msg: '[RENDER-3] 无 >undefined< / >null< 直出标记' }
    ];
    let statAll = true;
    checks.forEach(c => { const ok = c.cond; statAll = statAll && ok; console.log('  ' + (ok ? '✓' : '✗') + '  ' + c.msg); });
    console.log(format('MINIAPP_RENDER_CLEAN', { gate: 'MINIAPP_RENDER_CLEAN', pass: statAll, total: checks.length, passed: checks.filter(c => c.cond).length, results: [] }));
    allPass = allPass && statAll;
  } catch (e) {
    console.error('MINIAPP_RENDER_CLEAN gate threw:', e && e.stack ? e.stack : e);
    allPass = false;
  }
}

/* ─────────────── Run RENDER-UX-CLOSEOUT-R1 Gate (MINIAPP_RENDER_CLEAN_DOM + Property Row + 390/430) ─────────────── */
{
  const gateR1 = ctx.window.__OD_GATE_RENDER_UX_CLOSEOUT_R1;
  if (typeof gateR1 === 'function') {
    try {
      const r = gateR1();
      console.log('\n═══════ RENDER-UX-CLOSEOUT-R1 Gate (MINIAPP_RENDER_CLEAN_DOM · Property Row · 390/430) ═══════');
      (r.leakReport || []).forEach(function(pr) {
        console.log('  ' + (pr.ok ? '✓' : '✗') + '  [DOM] ' + pr.page + ' · render ' + (pr.ok ? 'clean · leak=0' : 'FAILED · leaks=' + (pr.leaks || []).join(',')));
      });
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('RenderUxCloseout-R1', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('RenderUxCloseout-R1 gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('RenderUxCloseout-R1 gate not exposed on window (__OD_GATE_RENDER_UX_CLOSEOUT_R1 = ' + typeof gateR1 + ')');
    allPass = false;
  }
}

/* ─────────────── Run Mini App 009A Data Coherence Gate (PASAY-TASK-005) ─────────────── */
{
  const gateData = ctx.window.__OD_GATE_MINAPP_009A_DATA;
  if (typeof gateData === 'function') {
    try {
      const r = gateData();
      console.log('\n═══════ Mini App 009A Data Coherence Gate (PASAY-TASK-005 · 1680 math / undefined / 7789 / Queue count) ═══════');
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('MiniApp-009A-Data', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('MiniApp-009A-Data gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('MiniApp-009A-Data gate not exposed on window (__OD_GATE_MINAPP_009A_DATA = ' + typeof gateData + ')');
    allPass = false;
  }

  /* Browser Visual Gate 暴露校验：真实浏览器 QA 由 OpenDesign Preview 执行（Node 无布局引擎） */
  const browserQA = ctx.window.__OD_RUN_BROWSER_QA;
  if (typeof browserQA === 'function') {
    console.log('  ✓ [009A-BROWSER] window.__OD_RUN_BROWSER_QA 已暴露（真实 DOM QA · 390/430 · render 到 #app · scrollWidth/rect/leak）— 由 OpenDesign Preview 执行');
  } else {
    console.error('  ✗ [009A-BROWSER] window.__OD_RUN_BROWSER_QA 未暴露（PASAY-TASK-005 要求浏览器专用 Gate）');
    allPass = false;
  }
}

/* ─────────────── Run Membership Role Truth P0 Gate (PASAY-TASK-006) ─────────────── */
{
  const gateRole = ctx.window.__OD_GATE_MEMBERSHIP_ROLE_TRUTH_P0;
  if (typeof gateRole === 'function') {
    try {
      const r = gateRole();
      console.log('\n═══════ Membership Role Truth P0 Gate (PASAY-TASK-006 · unique authority / meta.role / setup reconcile / no-membership / undefined) ═══════');
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('MEMBERSHIP_ROLE_TRUTH_P0', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('MEMBERSHIP_ROLE_TRUTH_P0 gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('MEMBERSHIP_ROLE_TRUTH_P0 gate not exposed on window (__OD_GATE_MEMBERSHIP_ROLE_TRUTH_P0 = ' + typeof gateRole + ')');
    allPass = false;
  }
}

/* ─────────────── Run Property/Tenant/Lease Bootstrap P0 Gate (PASAY-TASK-007) ─────────────── */
{
  const gatePTL = ctx.window.__OD_GATE_PROPERTY_TENANT_LEASE_BOOTSTRAP_P0;
  if (typeof gatePTL === 'function') {
    try {
      const r = gatePTL();
      console.log('\n═══════ Property/Tenant/Lease Bootstrap P0 Gate (PASAY-TASK-007 · first property operationalization / single truth / draft→activate) ═══════');
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('PROPERTY_TENANT_LEASE_BOOTSTRAP_P0', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('PROPERTY_TENANT_LEASE_BOOTSTRAP_P0 gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('PROPERTY_TENANT_LEASE_BOOTSTRAP_P0 gate not exposed on window (__OD_GATE_PROPERTY_TENANT_LEASE_BOOTSTRAP_P0 = ' + typeof gatePTL + ')');
    allPass = false;
  }
}

/* ─────────────── Run Rent Collection Truth P0 Gate (PASAY-TASK-008) ─────────────── */
{
  const gateRentCollection = ctx.window.__OD_GATE_RENT_COLLECTION_TRUTH_P0;
  if (typeof gateRentCollection === 'function') {
    try {
      const r = gateRentCollection();
      console.log('\n═══════ Rent Collection Truth P0 Gate (PASAY-TASK-008 · obligation / payment / lifecycle / operation) ═══════');
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('RENT_COLLECTION_TRUTH_P0', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('RENT_COLLECTION_TRUTH_P0 gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('RENT_COLLECTION_TRUTH_P0 gate not exposed on window (__OD_GATE_RENT_COLLECTION_TRUTH_P0 = ' + typeof gateRentCollection + ')');
    allPass = false;
  }
}

/* ─────────────── Run Repair Operation P0 Gate (PASAY-TASK-009) ─────────────── */
{
  const gateRepair = ctx.window.__OD_GATE_REPAIR_OPERATION_P0;
  if (typeof gateRepair === 'function') {
    try {
      const r = gateRepair();
      console.log('\n═══════ Repair Operation P0 Gate (PASAY-TASK-009 · report → quote → decision → verify → close) ═══════');
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('REPAIR_OPERATION_P0', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('REPAIR_OPERATION_P0 gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('REPAIR_OPERATION_P0 gate not exposed on window (__OD_GATE_REPAIR_OPERATION_P0 = ' + typeof gateRepair + ')');
    allPass = false;
  }
}

/* ─────────────── Run Expense Operation P0 Gate (PASAY-TASK-010) ─────────────── */
{
  const gateExpense = ctx.window.__OD_GATE_EXPENSE_OPERATION_P0;
  if (typeof gateExpense === 'function') {
    try {
      const r = gateExpense();
      console.log('\n═══════ Expense Operation P0 Gate (PASAY-TASK-010 · report → review → payment → paid → closed) ═══════');
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('EXPENSE_OPERATION_P0', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('EXPENSE_OPERATION_P0 gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('EXPENSE_OPERATION_P0 gate not exposed on window (__OD_GATE_EXPENSE_OPERATION_P0 = ' + typeof gateExpense + ')');
    allPass = false;
  }
}

/* ─────────────── Run Finance Workspace P0 Gate (PASAY-TASK-011) ─────────────── */
{
  const gateFin = ctx.window.__OD_GATE_FINANCE_WORKSPACE_P0;
  if (typeof gateFin === 'function') {
    try {
      const r = gateFin();
      console.log('\n═══════ Finance Workspace P0 Gate (PASAY-TASK-011 · rent performance + cash movement + month/property/status) ═══════');
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('FINANCE_WORKSPACE_P0', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('FINANCE_WORKSPACE_P0 gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('FINANCE_WORKSPACE_P0 gate not exposed on window (__OD_GATE_FINANCE_WORKSPACE_P0 = ' + typeof gateFin + ')');
    allPass = false;
  }
}

/* ─────────────── Run Daily Operations Command Center P0 Gate (PASAY-TASK-012) ─────────────── */
{
  const gateDcc = ctx.window.__OD_GATE_DAILY_OPERATIONS_COMMAND_CENTER_P0;
  if (typeof gateDcc === 'function') {
    try {
      const r = gateDcc();
      console.log('\n═══════ Daily Operations Command Center P0 Gate (PASAY-TASK-012 · Home + Queue cross-domain projection) ═══════');
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('DAILY_OPERATIONS_COMMAND_CENTER_P0', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('DAILY_OPERATIONS_COMMAND_CENTER_P0 gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('DAILY_OPERATIONS_COMMAND_CENTER_P0 gate not exposed on window (__OD_GATE_DAILY_OPERATIONS_COMMAND_CENTER_P0 = ' + typeof gateDcc + ')');
    allPass = false;
  }
}

/* ─────────────── Run Final Product Freeze V1 Total Gate (PASAY-TASK-013 / DESIGN-013) ─────────────── */
{
  const gateFinal = ctx.window.__OD_GATE_PASAY_FINAL_PRODUCT_FREEZE_V1;
  if (typeof gateFinal === 'function') {
    try {
      const r = gateFinal();
      console.log('\n═══════ PASAY_FINAL_PRODUCT_FREEZE_V1 (DESIGN-013 · 全产品跨域总验收 · 40 不变量 + Journey A–F) ═══════');
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('PASAY_FINAL_PRODUCT_FREEZE_V1', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('PASAY_FINAL_PRODUCT_FREEZE_V1 gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('PASAY_FINAL_PRODUCT_FREEZE_V1 gate not exposed on window (__OD_GATE_PASAY_FINAL_PRODUCT_FREEZE_V1 = ' + typeof gateFinal + ')');
    allPass = false;
  }
}

/* ─────────────── Run Browser QA 390/430 Gate (DESIGN-013 RETURN FIX · BLOCKER 3) ─────────────── */
{
  const gateBQA = ctx.window.__OD_GATE_BROWSER_QA_390_430;
  if (typeof gateBQA === 'function') {
    try {
      const r = gateBQA();
      console.log('\n═══════ BROWSER_QA_390_430 (DESIGN-013 RETURN FIX · BLOCKER 3 · real-browser + structural 390/430) ═══════');
      r.results.forEach(x => console.log('  ' + (x.pass ? '✓' : '✗') + '  ' + x.msg));
      console.log(format('BROWSER_QA_390_430', r));
      allPass = allPass && r.pass;
    } catch (e) {
      console.error('BROWSER_QA_390_430 gate threw:', e && e.stack ? e.stack : e);
      allPass = false;
    }
  } else {
    console.error('BROWSER_QA_390_430 gate not exposed on window (__OD_GATE_BROWSER_QA_390_430 = ' + typeof gateBQA + ')');
    allPass = false;
  }
}

console.log('\n═══════ Summary ═══════');
console.log(allPass ? '✓ ALL GATES PASS' : '✗ GATES FAILED');
process.exit(allPass ? 0 : 1);
