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
  console.log('=== J-F8 archive probe ===');
  fresh(); owner();
  const pf1 = wsAddProperty({ unit: '1608', tower: 'A', addr: 'A', type: '1BR' });
  const pf2 = wsAddProperty({ unit: '1608', tower: 'B', addr: 'B', type: '2BR' });
  console.log('pf1 url=', JSON.stringify(pf1.prop.archive_message_url));
  console.log('pf2 url=', JSON.stringify(pf2.prop.archive_message_url));
  console.log('pf1===pf2?', pf1.prop.archive_message_url === pf2.prop.archive_message_url);
  console.log('=== J-A10b probe ===');
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
  const homeA = viewHome();
  console.log('homeA has 3101?', homeA.indexOf('3101') !== -1, 'opsA has 3101?', viewOps().indexOf('3101') !== -1);
  console.log('=== J-C2/C3 probe (OP-R1) ===');
  fresh(); owner();
  const opR = state.operations.find(o => o.id === 'OP-R1');
  console.log('OP-R1 kind=', opR && opR.kind, 'domain=', opR && JSON.stringify(opR.domain));
  opR.quotes = opR.quotes || [];
  rxSim('rx-confirm-info', opR); rxSim('rx-arrange-tech', opR); rxSim('rx-sim-quote', opR);
  const qC = (opR.quotes || [])[0];
  console.log('after quote: qC.status=', JSON.stringify(qC && qC.status), 'esc=', opR.esc, 'next=', opR.next_action_code);
  rxSim('rx-approve-quote', opR);
  console.log('after approve: qC.status=', JSON.stringify((opR.quotes||[])[0] && (opR.quotes||[])[0].status), 'esc=', opR.esc, 'next=', opR.next_action_code);
  console.log('=== INV-37/38 probe ===');
  fresh(); owner(); ensureOps008aScenarios();
  const op37 = state.operations.find(o => o.id === 'OP-REP-7789');
  console.log('op37 exists?', !!op37, 'next=', op37 && op37.next_action_code, 'esc=', op37 && op37.esc);
  const pb = op37 ? repairOperationBlock(op37) : '';
  console.log('pblock has btn btn-p?', /btn btn-p/.test(pb), 'len=', pb.length);
  const h38 = viewHome();
  console.log('home38 has 7789?', h38.indexOf('7789') !== -1, 'has 需要你处理?', h38.indexOf('需要你处理') !== -1);
  console.log('home38 section markers 需要:', h38.indexOf('需要'), '需你:', h38.indexOf('需你'));
`, ctx);
