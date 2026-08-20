/* Probe to find which line crashes */
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

// Patch toast to throw (so we see where it fails)
// const origConsoleError = console.error;

const ctx = vm.createContext(sandbox);
try {
  vm.runInContext(code, ctx, { filename: 'pasay-mini-app.html', timeout: 60000 });
} catch (e) {
  console.log('SCRIPT ERR:', e.message);
  process.exit(1);
}
// Run gate H step-by-step
const runGate = sandbox.window.__OD_GATE_H;
try {
  const r = runGate();
  console.log('Pass:', r.pass, 'Total:', r.results.length);
  r.results.forEach(x => { if (!x.pass) console.log('FAIL:', x.msg); });
} catch (e) {
  console.log('GATE H ERR:', e.message);
  console.log(e.stack.split('\n').slice(0,15).join('\n'));
}

// Run gate H in traced mode by wrapping each step
console.log('--- tracing gate H steps ---');
const STEPS = [
  'reset',
  'H1: rx-confirm-info click',
  'H2: reset click',
  'H3: nav click',
  'H3b: toggle-lang click'
];
let stepIx = 0;
try {
  vm.runInContext(`
(function() {
  const origConsole = console.log;
  try {
    __odResetSeedForGates();
    stepIx = 1; origConsole('Step: after reset');
    const r1 = state.operations.find(o => o.id === 'OP-R1');
    origConsole('r1=', r1 ? r1.id : 'null');
    stepIx = 2;
    __odClickHandler({ target: { dataset: { a: 'rx-confirm-info', id: 'OP-R1' }, closest: function(s){ return s==='[data-a]'?this:null; } } });
    origConsole('Step: after rx-confirm-info click; r1.demoStage=' + r1.demoStage);
  } catch (e) {
    throw { step: stepIx, msg: e.message, stack: e.stack };
  }
})();
  `, ctx, { filename: 'probe' });
  console.log('OK');
} catch (e) {
  console.log('STEP', e.step, 'FAILED:', e.msg);
  if (e.stack) console.log(e.stack.split('\n').slice(0,15).join('\n'));
}