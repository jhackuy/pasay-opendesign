const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync('pasay-mini-app.html', 'utf8');
const s = html.indexOf('<script>'), e = html.indexOf('</script>', s);
const body = html.slice(s + 8, e);
const _ls = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const sandbox = {
  console, window: {},
  document: { querySelector: () => ({ innerHTML: '', value: '', addEventListener: () => {} }), querySelectorAll: () => [], createElement: () => ({ classList: { add: () => {}, remove: () => {} } }), addEventListener: () => {}, body: {} },
  localStorage: _ls, location: { hash: '' },
  setTimeout, clearTimeout, Date, Object, Array, JSON, Math, String, Number, Boolean, RegExp, Error, Promise, Map, Set, Symbol,
  URLSearchParams: require('url').URLSearchParams
};
sandbox.global = sandbox; sandbox.self = sandbox;
Object.assign(sandbox.window, { addEventListener: () => {}, localStorage: _ls, __OD_INTEGRITY: false, rxSim: null });
sandbox.rxSim = null;
const ctx = vm.createContext(sandbox);
vm.runInContext(body, ctx);
vm.runInContext(`
  const fresh = () => { state = seed(); state.leases = []; state.paymentRecords = []; state.lang = 'zh'; __isFreshSeed = true; ensureVNextSeed(); ensureExpenseOperationSeed(); ensureRepairOperationSeed(); __odRebuildPaymentRecords(); wsResetFresh(); wsCreateWorkspace('X','o'); };
  const owner = () => { state.currentUserId = ws().members.find(m => m.role === 'owner' && m.status === 'active').userId; };
  fresh(); owner();
  const pf1 = wsAddProperty({ unit: '1608', tower: 'A', addr: 'A', type: '1BR' });
  const pf2 = wsAddProperty({ unit: '1608', tower: 'B', addr: 'B', type: '2BR' });
  console.log('after add: pf1=', JSON.stringify(pf1.prop.archive_message_url), 'pf2=', JSON.stringify(pf2.prop.archive_message_url), 'eq=', pf1.prop.archive_message_url === pf2.prop.archive_message_url);
  const df1 = wsCreateTenantWithDraft({ name: 'FA', unit: '1608', rent: 11000, ls: '2026-09-01', le: '2027-05-31', propertyId: pf1.prop.id });
  console.log('after df1: pf1=', JSON.stringify(pf1.prop.archive_message_url), 'pf2=', JSON.stringify(pf2.prop.archive_message_url));
  console.log('J-F8 cond:', pf1.prop.archive_message_url.indexOf('t.me/c/') === 0, pf2.prop.archive_message_url.indexOf('t.me/c/') === 0, pf1.prop.archive_message_url !== pf2.prop.archive_message_url);
`, ctx);
