'use strict';
/* 临时探测脚本：渲染各视图，统计 'undefined' 泄漏（PASAY-TASK-006 P0-9 根因定位） */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const _ls = (() => { const store = {}; return { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } }; })();
const _noop = () => {};
const _docStub = {
  addEventListener: _noop,
  createElement: () => ({ classList: { add: _noop, remove: _noop }, addEventListener: _noop, appendChild: _noop, remove: _noop, innerHTML: '', querySelectorAll: () => [], querySelector: () => null }),
  querySelector: () => ({ innerHTML: '', addEventListener: _noop, classList: { add: _noop, remove: _noop, toggle: _noop }, value: '', textContent: '', style: {}, dataset: {}, children: [] }),
  querySelectorAll: () => [],
  body: { appendChild: _noop }
};
const sandbox = {
  console, window: {}, document: _docStub, localStorage: _ls, location: { hash: '' },
  setTimeout, clearTimeout, setInterval, clearInterval,
  Date, Object, Array, JSON, Math, String, Number, Boolean, RegExp, Error,
  Promise, Map, Set, Symbol, URLSearchParams: require('url').URLSearchParams
};
sandbox.global = sandbox;
sandbox.self = sandbox;
Object.assign(sandbox.window, { addEventListener: _noop, localStorage: _ls, __OD_INTEGRITY: false, rxSim: null });
sandbox.rxSim = null;

const html = fs.readFileSync(path.join(__dirname, 'pasay-mini-app.html'), 'utf8');
const scriptStart = html.indexOf('<script>');
const scriptEnd = html.indexOf('</script>', scriptStart);
const scriptBody = html.slice(scriptStart + '<script>'.length, scriptEnd);

const probeCode = `
;(function(){
  try { ensureVNextSeed(); } catch(e){}
  try { ensureExpenseOperationSeed(); } catch(e){}
  try { ensureRepairOperationSeed(); } catch(e){}
  try { syncOperationTasks(); } catch(e){}
  function scan(label, fn){
    var out = fn();
    var hits = [];
    var re = /undefined/g, m;
    while ((m = re.exec(out))) { var s = Math.max(0, m.index - 70); hits.push(out.slice(s, m.index + 25).replace(/\\s+/g, ' ')); }
    console.log('\\n### ' + label + '  undefined=' + hits.length);
    hits.slice(0, 8).forEach(function(h){ console.log('   …' + h + '…'); });
    return hits.length;
  }
  function U(s){ return new URLSearchParams(s || ''); }
  var total = 0;
  total += scan('viewHome zh', function(){ state.lang='zh'; return viewHome(); });
  total += scan('viewHome en', function(){ state.lang='en'; return viewHome(); });
  total += scan('viewOps zh', function(){ state.lang='zh'; return viewOps(U()); });
  total += scan('viewOps en', function(){ state.lang='en'; return viewOps(U()); });
  total += scan('viewFinance zh', function(){ state.lang='zh'; return viewFinance(U()); });
  total += scan('viewFinance en', function(){ state.lang='en'; return viewFinance(U()); });
  total += scan('viewProps zh', function(){ state.lang='zh'; return viewProps(U()); });
  total += scan('viewProps en', function(){ state.lang='en'; return viewProps(U()); });
  total += scan('viewMore zh', function(){ state.lang='zh'; return viewMore(); });
  total += scan('viewMore en', function(){ state.lang='en'; return viewMore(); });
  total += scan('viewSetup zh', function(){ state.lang='zh'; return viewSetup(); });
  total += scan('viewSetup en', function(){ state.lang='en'; return viewSetup(); });
  total += scan('viewRents zh', function(){ state.lang='zh'; return viewRents(U()); });
  total += scan('viewTasks zh', function(){ state.lang='zh'; return viewTasks(U()); });
  console.log('\\nTOTAL undefined = ' + total);
  globalThis.__PROBE_TOTAL = total;
})();
`;

const ctx = vm.createContext(sandbox);
try {
  vm.runInContext(scriptBody + '\n' + probeCode, ctx, { filename: 'pasay-mini-app.html', timeout: 30000 });
} catch (e) {
  console.error('Script execution error:', e && e.message ? e.message : e);
  process.exit(2);
}
const total = ctx.__PROBE_TOTAL || 0;
process.exit(total > 0 ? 3 : 0);
