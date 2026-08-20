/* Probe PTLB gate to find which line crashes */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const html = fs.readFileSync(path.resolve(__dirname, 'pasay-mini-app.html'), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
const code = scriptMatch[1];

const sandbox = {};
sandbox.console = console;
sandbox.setTimeout = setTimeout;
sandbox.queueMicrotask = queueMicrotask;
sandbox.process = process;
sandbox.URLSearchParams = URLSearchParams;
sandbox.Date = Date;
sandbox.Math = Math;
sandbox.JSON = JSON;
sandbox.Object = Object;
sandbox.Array = Array;
sandbox.Number = Number;
sandbox.String = String;
sandbox.Boolean = Boolean;
sandbox.ArrayBuffer = ArrayBuffer;
sandbox.Int8Array = Int8Array;
sandbox.Uint8Array = Uint8Array;
sandbox.Uint8ClampedArray = Uint8ClampedArray;
sandbox.Int16Array = Int16Array;
sandbox.Uint16Array = Uint16Array;
sandbox.Int32Array = Int32Array;
sandbox.Uint32Array = Uint32Array;
sandbox.Float32Array = Float32Array;
sandbox.Float64Array = Float64Array;
sandbox.BigInt64Array = BigInt64Array;
sandbox.BigUint64Array = BigUint64Array;
sandbox.Map = Map;
sandbox.Set = Set;
sandbox.WeakMap = WeakMap;
sandbox.WeakSet = WeakSet;
sandbox.Promise = Promise;
sandbox.Symbol = Symbol;
sandbox.Error = Error;
sandbox.TypeError = TypeError;
sandbox.RangeError = RangeError;
sandbox.SyntaxError = SyntaxError;
sandbox.localStorage = { getItem: () => null, setItem: () => null, removeItem: () => null };
sandbox.document = {
  addEventListener: () => null,
  getElementById: (id) => id === 'app' ? { innerHTML: '', setAttribute: () => null, classList: { add: () => null, remove: () => null, toggle: () => null } } : null,
  querySelector: () => null,
  querySelectorAll: () => null
};
sandbox.$ = (sel) => sel === '#app' ? sandbox.document.getElementById('app') : null;
sandbox.document.body = sandbox.document.getElementById('app');
sandbox.window = sandbox;
sandbox.window.addEventListener = () => null;
sandbox.location = { hash: '' };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

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