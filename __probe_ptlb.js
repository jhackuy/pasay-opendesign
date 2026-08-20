/* Trace ME/1 specifically */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.resolve(__dirname, 'pasay-mini-app.html'), 'utf8');
const code = html.slice(html.indexOf('<script>') + '<script>'.length, html.indexOf('</script>'));

const _ls = (() => { const store = {}; return { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } }; })();
const _noop = () => {};
const _docStub = {
  addEventListener: _noop,
  createElement: () => ({ classList: { add: _noop, remove: _noop }, addEventListener: _noop, appendChild: _noop, remove: _noop, innerHTML: '', querySelectorAll: () => [], querySelector: () => null, dataset: {}, style: {}, children: [] }),
  querySelector: () => ({ innerHTML: '', addEventListener: _noop, classList: { add: _noop, remove: _noop, toggle: _noop }, value: '', textContent: '', style: {}, dataset: {}, children: [], remove: _noop, closest: () => null }),
  querySelectorAll: () => [],
  body: { appendChild: _noop }
};
const sandbox = {
  console, window: {}, document: _docStub, localStorage: _ls,
  location: { hash: '' },
  setTimeout, clearTimeout, setInterval, clearInterval,
  Date, Object, Array, JSON, Math, String, Number, Boolean, RegExp, Error,
  Promise, Map, Set, Symbol,
  URLSearchParams: require('url').URLSearchParams
};
sandbox.global = sandbox; sandbox.self = sandbox;
Object.assign(sandbox.window, { addEventListener: _noop, localStorage: _ls, __OD_INTEGRITY: false, rxSim: null });
sandbox.rxSim = null;
const ctx = vm.createContext(sandbox);
try {
  vm.runInContext(code, ctx, { filename: 'pasay-mini-app.html', timeout: 60000 });
} catch (e) {
  console.log('SCRIPT ERR:', e.message);
  process.exit(1);
}
// Debug BEFORE the gate
vm.runInContext(`
  var orig = console.log;
  __odResetSeedForGates();
  orig('After resetSeed: paymentRecords.length=', state.paymentRecords.length);
  state.tenants.forEach(function(t){ if (!t.status) t.status = 'active'; });
  assembleSeedLeases();
  orig('After assembleSeedLeases: paymentRecords.length=', state.paymentRecords.length);
  orig('R-2026-06-1608.payments=', JSON.stringify(state.rents.find(function(r){ return r.id === 'R-2026-06-1608'; }).payments));
  orig('R-2026-06-1608.lease_id=', state.rents.find(function(r){ return r.id === 'R-2026-06-1608'; }).lease_id);
`, ctx, { filename: 'debug1' });

const r = sandbox.window.__OD_MOVEOUT_GATE_E ? sandbox.window.__OD_MOVEOUT_GATE_E() : null;
if (!r) { console.log('no gate; trying ME call directly'); process.exit(1); }
console.log('Pass:', r.pass, 'Total:', r.results.length);
r.results.forEach(x => { if (!x.pass) console.log('FAIL:', x.msg); });
console.log('--- debugging ME/1 ---');
try {
  vm.runInContext(`
    var op1 = __odSetupMoveOutGates();
    var orig = console.log;
    orig('Lease:', op1.domain.lease_id);
    var lease = state.leases.find(function(l){ return l.lease_id === op1.domain.lease_id; });
    orig('Lease truth:', JSON.stringify({unit:lease.unit, tenant:lease.tenant_id, monthly_rent:lease.monthly_rent}));
    moSim('mo-confirm-date', op1); syncOperationTasks();
    moSim('mo-arrange-inspection', op1); syncOperationTasks();
    moSim('mo-submit-inspection', op1);
    moSim('mo-verify-inspection', op1);
    orig('settlement:', JSON.stringify({deductions: op1.settlement.deductions, total: op1.settlement.total_deductions, refund: op1.settlement.refund_amount, balance: op1.settlement.tenant_balance_due}));
    orig('R-2026-07-1608:', JSON.stringify(state.rents.find(function(r){ return r.id === 'R-2026-07-1608'; })));
    orig('paidAmt(R-2026-07-1608):', paidAmt(state.rents.find(function(r){ return r.id === 'R-2026-07-1608'; })));
    orig('R-2026-06-1608:', JSON.stringify(state.rents.find(function(r){ return r.id === 'R-2026-06-1608'; })));
    orig('paidAmt(R-2026-06-1608):', paidAmt(state.rents.find(function(r){ return r.id === 'R-2026-06-1608'; })));
    orig('paymentRecords count:', state.paymentRecords.length);
    orig('paymentRecords for R-2026-06-1608:', state.paymentRecords.filter(function(p){ return p.rent_obligation_id === 'R-2026-06-1608'; }).length);
    orig('R-2026-06-1608.lease_id:', state.rents.find(function(r){ return r.id === 'R-2026-06-1608'; }).lease_id);
    orig('R-2026-06-1608.payments:', JSON.stringify(state.rents.find(function(r){ return r.id === 'R-2026-06-1608'; }).payments));
  `, ctx, { filename: 'debug-me' });
} catch (e) {
  console.log('DEBUG ERR:', e.message);
}