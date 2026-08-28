'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const os = require('os');

const file = path.join(__dirname, '..', 'pasay-mini-app-bqa-390-430.html');
const c = fs.readFileSync(file, 'utf8');
const s = c.indexOf('<script id="__bqa_runner">');
const e = c.indexOf('</script>', s);
const sc = c.substring(s + '<script id="__bqa_runner">'.length, e);
const tmp = path.join(os.tmpdir(), 'qa-' + Date.now() + '.js');
fs.writeFileSync(tmp, sc);
const r = spawnSync('node', ['-c', tmp]);
console.log('exit=' + r.status);
if (r.stderr) console.log('stderr=' + r.stderr.toString().substring(0, 500));
console.log('script length: ' + sc.length);