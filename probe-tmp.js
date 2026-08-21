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
  const fresh = () => { state = seed(); state.leases = []; state.paymentRecords = []; __isFreshSeed = true; ensureVNextSeed(); ensureExpenseOperationSeed(); ensureRepairOperationSeed(); __odRebuildPaymentRecords(); wsResetFresh(); wsCreateWorkspace('X','o'); };
  fresh(); const owner = () => { state.currentUserId = ws().members.find(m => m.role === 'owner' && m.status === 'active').userId; }; owner();
  console.log('state.lang=', JSON.stringify(state.lang));
  console.log('all props archive?', state.props.every(p => p.archive_message_url && p.archive_message_url.indexOf('https://t.me/c/') === 0));
  const p1 = wsAddProperty({ unit: '1608', tower: 'A', addr: 'x', type: '1BR' });
  const p2 = wsAddProperty({ unit: '1608', tower: 'B', addr: 'y', type: '2BR' });
  console.log('archive p1/p2=', p1.prop.archive_message_url, '|', p2.prop.archive_message_url, '| diff=', p1.prop.archive_message_url !== p2.prop.archive_message_url);
  console.log('archive count in props after add=', state.props.filter(p => p.archive_message_url).length, '/', state.props.length);
  console.log('telegram gate on window?', typeof window.__OD_GATE_TELEGRAM_EXACT_MENU_TRUTH);
  console.log('window keys tg=', Object.keys(window).filter(k => /TELEGRAM/i.test(k)));
  console.log('inv24 fresh all archive?', state.props.every(p => p.archive_message_url && p.archive_message_url.indexOf('https://t.me/c/') === 0));
`);
