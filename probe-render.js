'use strict';
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const _ls = (() => { const store = {}; return { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } }; })();
const _noop = () => {};
const _appEl = { innerHTML: '', addEventListener: _noop, classList: { add: _noop, remove: _noop }, querySelectorAll: () => [], querySelector: () => null, scrollTop: 0, style: {}, dataset: {}, children: [] };
const _docStub = {
  addEventListener: _noop,
  createElement: () => ({ classList: { add: _noop, remove: _noop }, addEventListener: _noop, appendChild: _noop, remove: _noop, innerHTML: '', querySelectorAll: () => [], querySelector: () => null }),
  querySelector: sel => (sel === '#app' ? _appEl : { innerHTML: '', addEventListener: _noop, classList: { add: _noop, remove: _noop, toggle: _noop }, value: '', textContent: '', style: {}, dataset: {}, children: [] }),
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
  function fresh(){ state = seed(); state.leases = []; __isFreshSeed = true;
    if (typeof ensureVNextSeed === 'function') ensureVNextSeed();
    if (typeof ensureExpenseOperationSeed === 'function') ensureExpenseOperationSeed();
    if (typeof ensureRepairOperationSeed === 'function') ensureRepairOperationSeed();
    if (typeof syncOperationTasks === 'function') syncOperationTasks();
    wsResetFresh(); }
  function mkClick(a, x){ var el = { dataset: Object.assign({a:a}, x||{}), closest: function(){ return el; } }; return { target: el }; }

  // RT-8
  fresh();
  console.log('--- RT-8 ---');
  console.log('accState =', wsAccessState());
  state.lang='zh'; location.hash='#/home';
  try { render(); } catch(e) { console.log('render threw:', e.message); }
  var app8 = document.querySelector('#app').innerHTML;
  console.log('app8 len =', app8.length);
  console.log('has Set up my company:', app8.indexOf('Set up my company') !== -1);
  console.log('has Join with invite:', app8.indexOf('Join with invite') !== -1);
  console.log('has 1608:', app8.indexOf('1608') !== -1);
  console.log('app8 head:', app8.slice(0, 300).replace(/\\n/g, ' '));

  // RT-10
  fresh(); wsCreateWorkspace('PI Co','PI-owner');
  var pinv = wsGenerateInvite('secretary','Pending User','u-pending');
  state.currentUserId='u-pending';
  console.log('--- RT-10 ---');
  console.log('accState =', wsAccessState());
  state.lang='zh'; location.hash='#/home';
  try { render(); } catch(e) { console.log('render threw:', e.message); }
  var app10 = document.querySelector('#app').innerHTML;
  console.log('app10 len =', app10.length, ' has 待接受:', app10.indexOf('待接受') !== -1, ' has 1608:', app10.indexOf('1608') !== -1);
  console.log('app10 head:', app10.slice(0, 300).replace(/\\n/g, ' '));

  // RT-11
  fresh(); wsCreateWorkspace('RM Co','RM-owner');
  var rmv = wsGenerateInvite('secretary','RM Sec','u-rm'); wsAcceptInvite(rmv.id,'u-rm');
  wsRemoveMember(rmv.id);
  state.currentUserId='u-rm';
  console.log('--- RT-11 ---');
  console.log('accState =', wsAccessState());
  state.lang='zh'; location.hash='#/home';
  try { render(); } catch(e) { console.log('render threw:', e.message); }
  var app11 = document.querySelector('#app').innerHTML;
  console.log('app11 len =', app11.length, ' has 无访问权限:', app11.indexOf('无访问权限') !== -1, ' has 1608:', app11.indexOf('1608') !== -1);
  console.log('app11 head:', app11.slice(0, 300).replace(/\\n/g, ' '));

  // RT-12
  fresh(); wsCreateWorkspace('A Co','A-owner');
  ws().otherWorkspaces = [JSON.parse(JSON.stringify(wsSeed().otherWorkspaces[0]))];
  state.currentUserId='u-lin';
  console.log('--- RT-12 ---');
  console.log('cur id:', ws().id, 'role:', currentRole());
  var r1 = wsSwitchTo('ws-2');
  console.log('switch ws-2:', r1.ok, 'id:', ws().id, 'role:', currentRole());
  var cands = ws().otherWorkspaces.map(function(o){ return o.id; });
  console.log('otherWorkspaces ids:', JSON.stringify(cands));
  var back = ws().otherWorkspaces.find(function(o){ return o.members && o.members.some(function(m){ return m.userId==='u-lin' && m.role==='owner' && m.status==='active'; }); });
  console.log('back candidate id:', back ? back.id : null);
  if (back) { var r2 = wsSwitchTo(back.id); console.log('switch back:', r2.ok, 'id:', ws().id, 'role:', currentRole()); }
})();
`;
const ctx = vm.createContext(sandbox);
try { vm.runInContext(body + '\n' + probe, ctx, { filename: 'dbg', timeout: 30000 }); }
catch (e) { console.error('ERR:', e && e.message ? e.message : e); process.exit(2); }
