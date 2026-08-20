/* Probe PTLB gate via gates-runner sandbox pattern */
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
const gate = sandbox.__OD_GATE_PROPERTY_TENANT_LEASE_BOOTSTRAP_P0;
if (!gate) { console.log('NO GATE EXPOSED'); process.exit(1); }
try {
  const r = gate();
  console.log('Pass:', r.pass, 'Total:', r.results.length, 'Passed:', r.passed);
  r.results.forEach(x => { if (!x.pass) console.log('FAIL:', x.msg); });
} catch (e) {
  console.log('OUTER ERR:', e.message);
  console.log(e.stack.split('\n').slice(0,8).join('\n'));
}