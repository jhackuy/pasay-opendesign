const fs = require('fs');
const path = require('path');
const vm = require('vm');
const _ls = (() => { const s = {}; return { getItem: k => (k in s ? s[k] : null), setItem: (k,v) => { s[k] = String(v); }, removeItem: k => { delete s[k]; } }; })();
const _noop = () => {};
const _docStub = { addEventListener: _noop, createElement: () => ({ classList:{add:_noop,remove:_noop}, addEventListener:_noop, appendChild:_noop, remove:_noop, innerHTML:'', querySelectorAll:()=>[], querySelector:()=>null }), querySelector: () => ({ innerHTML:'', addEventListener:_noop, classList:{add:_noop,remove:_noop,toggle:_noop}, value:'', textContent:'', style:{}, dataset:{}, children:[] }), querySelectorAll: () => [], body: { appendChild: _noop } };
const sandbox = { console, window: {}, document: _docStub, localStorage: _ls, location: { hash: '' }, setTimeout, clearTimeout, setInterval, clearInterval, Date, Object, Array, JSON, Math, String, Number, Boolean, RegExp, Error, Promise, Map, Set, Symbol, URLSearchParams: require('url').URLSearchParams };
sandbox.global = sandbox; sandbox.self = sandbox;
Object.assign(sandbox.window, { addEventListener: _noop, localStorage: _ls, __OD_INTEGRITY: false, rxSim: null });
sandbox.rxSim = null;
const html = fs.readFileSync(path.join(__dirname, 'pasay-mini-app.html'), 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/i);
const ctx = vm.createContext(sandbox);
vm.runInContext(m[1], ctx, { timeout: 20000 });
const g = s => { try { return sandbox[s] || sandbox.window[s]; } catch(e){ return null; } };
try { if (g('__OD_GATE_BOOTSTRAP_A3')) g('__OD_GATE_BOOTSTRAP_A3')(); } catch(e){ console.log('A3 threw', e.message); }
try { if (g('__OD_GATE_HOME_LAYOUT')) g('__OD_GATE_HOME_LAYOUT')(); } catch(e){ console.log('Home threw', e.message); }
try { if (g('__OD_GATE_PROPERTY_ARCHIVE_007C_FINAL')) g('__OD_GATE_PROPERTY_ARCHIVE_007C_FINAL')(); } catch(e){ console.log('007C threw', e.message); }
const state = sandbox.state;
console.log('currentUserId =', state.currentUserId);
console.log('meta.role =', state.meta.role);
console.log('workspace status =', state.workspace && state.workspace.status);
console.log('members =', JSON.stringify((state.workspace && state.workspace.members || []).map(x => ({id:x.id, role:x.role, status:x.status, userId:x.userId}))));
console.log('effectiveRole =', (() => { try { return sandbox.wsEffectiveRole(); } catch(e){ return 'ERR:'+e.message; } })());
