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
  const mkClick = (a, d) => { const el = { dataset: Object.assign({ a: a }, d || {}), closest: () => el }; return { target: el }; };
  const fresh = () => { state = seed(); state.leases = []; state.paymentRecords = []; state.lang = 'zh'; __isFreshSeed = true; ensureVNextSeed(); ensureExpenseOperationSeed(); ensureRepairOperationSeed(); __odRebuildPaymentRecords(); wsResetFresh(); wsCreateWorkspace('X','o'); };
  const owner = () => { state.currentUserId = ws().members.find(m => m.role === 'owner' && m.status === 'active').userId; };
  console.log('=== J-A9c probe ===');
  fresh(); owner();
  const pa = wsAddProperty({ unit: '3101', tower: 'A', addr: 'P', type: '2BR' });
  const da = wsCreateTenantWithDraft({ name: 'Ana', unit: '3101', rent: 28000, ls: '2026-09-01', le: '2027-08-31', due: 5, propertyId: pa.prop.id });
  wsActivateLease(da.lease.lease_id);
  const obA = currentRentForLease(da.lease.lease_id);
  rentRecordPayment(obA.id, 10000, 'owner', { paid_at: '2026-09-03' });
  rentStartOperation(obA.id);
  const colOp = state.operations.find(o => o.kind === 'collect_rent' && o.domain && o.domain.rent_id === obA.id);
  rentRecordPayment(obA.id, 18000, 'owner', { paid_at: '2026-09-08' });
  rentOperationReconcile(colOp, TODAY);
  console.log('paid?', rentStatus(obA,'2026-09-10')==='paid', 'bal=', rentBalance(obA), 'col.esc=', colOp.esc);
  const snapA9 = JSON.stringify({ col: colOp.esc, ops: state.operations.length, task: state.tasks.length });
  rentOperationReconcile(colOp, TODAY);
  __odClickHandler(mkClick('confirm-rent', { id: obA.id }));
  __odClickHandler(mkClick('submit-payment', { rent: obA.id }));
  const stale = JSON.stringify({ col: colOp.esc, ops: state.operations.length, task: state.tasks.length });
  console.log('snap=', snapA9, 'stale=', stale, 'equal=', snapA9===stale);
  console.log('=== INV-32 probe ===');
  fresh(); owner();
  state.meta.localeManual = false; delete state.meta.locale; delete state.meta.lang;
  deriveLocaleFromMembership();
  const zhHome = viewHome(); const zhOps = viewOps(); const zhDetail = viewProperty('1608','overview');
  console.log('owner lang=', state.lang, 'role=', wsEffectiveRole());
  console.log('zhHome has 需你处理?', zhHome.indexOf('需你处理') !== -1);
  console.log('zhOps has 需要你处理?', zhOps.indexOf('需要你处理') !== -1);
  console.log('zhDetail has 当前租客?', zhDetail.indexOf('当前租客') !== -1);
  fresh(); owner();
  const i32 = wsGenerateInvite('secretary','LS'); wsAcceptInvite(i32.id,'lang-sec'); state.currentUserId='lang-sec';
  state.meta.localeManual=false; delete state.meta.locale; delete state.meta.lang;
  deriveLocaleFromMembership();
  const enHome = viewHome(); const enOps = viewOps(); const enDetail = viewProperty('1608','overview');
  console.log('sec lang=', state.lang, 'role=', wsEffectiveRole());
  console.log('enHome has NEEDS YOU?', enHome.indexOf('NEEDS YOU') !== -1);
  console.log('enOps has NEEDS YOU?', enOps.indexOf('NEEDS YOU') !== -1);
  console.log('enDetail has Current tenant?', enDetail.indexOf('Current tenant') !== -1);
`, ctx);
