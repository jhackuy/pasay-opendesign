'use strict';
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const _ls = (() => { const store = {}; return { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } }; })();
const _noop = () => {};
const _docStub = {
  addEventListener: _noop,
  createElement: () => ({ classList: { add: _noop, remove: _noop }, addEventListener: _noop, appendChild: _noop, remove: _noop, innerHTML: '', querySelectorAll: () => [], querySelector: () => null }),
  querySelector: () => ({ innerHTML: '', addEventListener: _noop, classList: { add: _noop, remove: _noop, toggle: _noop }, value: '', textContent: '', style: {}, dataset: {}, children: [] }),
  querySelectorAll: () => [], body: { appendChild: _noop }
};
const sandbox = { console, window: {}, document: _docStub, localStorage: _ls, location: { hash: '' }, setTimeout, clearTimeout, setInterval, clearInterval, Date, Object, Array, JSON, Math, String, Number, Boolean, RegExp, Error, Promise, Map, Set, Symbol, URLSearchParams: require('url').URLSearchParams };
sandbox.global = sandbox; sandbox.self = sandbox;
Object.assign(sandbox.window, { addEventListener: _noop, localStorage: _ls, __OD_INTEGRITY: false, rxSim: null });
sandbox.rxSim = null;
const html = fs.readFileSync(path.join(__dirname, 'pasay-mini-app.html'), 'utf8');
const ss = html.indexOf('<script>'); const se = html.indexOf('</script>', ss);
const body = html.slice(ss + '<script>'.length, se);
const probe = `
;(function(){
  const fr = () => { state = seed(); state.leases = []; __isFreshSeed = true;
    if (typeof ensureVNextSeed === 'function') ensureVNextSeed();
    if (typeof ensureExpenseOperationSeed === 'function') ensureExpenseOperationSeed();
    if (typeof ensureRepairOperationSeed === 'function') ensureRepairOperationSeed();
    if (typeof syncOperationTasks === 'function') syncOperationTasks();
    wsResetFresh(); };
  const asOwner = () => { const o = ws().members.find(m => m.role === 'owner' && m.status === 'active'); if (o) state.currentUserId = o.userId; };
  const envOwner = () => { fr(); wsCreateWorkspace('B Co', 'B-owner'); asOwner(); };
  const U = '2010';

  envOwner();
  const pr1 = wsAddProperty({ unit: U, tower: 'T', addr: 'A', type: '2BR' });
  console.log('pr1.ok =', pr1.ok, ' id =', pr1.ok ? pr1.prop.id : '-');
  const t1 = wsCreateTenantWithDraft({ name: 'Christopher Dela Cruz', phone: '0917 555 0999', unit: U, rent: 128500, deposit: 257000, ls: '2026-09-01', le: '2027-08-31', due: 5 });
  console.log('t1.ok =', t1.ok, ' lease status =', t1.ok ? t1.lease.status : '-', ' lease_id =', t1.ok ? t1.lease.lease_id : '-');
  console.log('state.leases =', JSON.stringify(state.leases.map(l => ({ id: l.lease_id, unit: l.unit, status: l.status }))));
  console.log('active_lease(U) =', active_lease(U) ? active_lease(U).lease_id : null);
  console.log('propOccupancy =', propOccupancy(prop(U)));
  console.log('P(U) status =', prop(U) ? prop(U).status : 'undefined');
})();
`;
const ctx = vm.createContext(sandbox);
try { vm.runInContext(body + '\n' + probe, ctx, { filename: 'dbg', timeout: 30000 }); }
catch (e) { console.error('ERR:', e && e.message ? e.message : e); process.exit(2); }
