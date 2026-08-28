'use strict';
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.resolve(__dirname, '..');
const SRC = path.join(WORKSPACE, 'pasay-mini-app.html');
const OUT = path.join(WORKSPACE, 'pasay-mini-app-bqa-390-430.html');

const PANEL_HTML = '<div id="__bqa_panel" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:#fff;overflow:auto;padding:22px 26px;box-sizing:border-box;font-family:-apple-system,Segoe UI,system-ui,sans-serif;color:#0b1220">'
  + '<h1 style="font-family:Georgia,serif;font-size:20px;margin:0 0 4px">PASAY \u00b7 Real Browser QA 390 / 430</h1>'
  + '<p style="margin:0 0 14px;color:#5b6472;font-size:13px">pasay-mini-app.html inlined</p>'
  + '<div id="__bqa_sum" style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px;font-weight:700;padding:12px 16px;border:1px solid #e4e7ec;border-radius:10px;background:#fff;margin-bottom:16px">running\u2026</div>'
  + '<table><thead><tr><th>Page</th></tr></thead><tbody id="__bqa_tb"></tbody></table>'
  + '</div>'
  + '<pre id="__bqa_report_blob" style="display:none"></pre>';

const RUNNER_BLOCK = '<script id="__bqa_runner">console.log("QA RUNNER STARTED");</script>';

console.log('PANEL_HTML length:', PANEL_HTML.length);
console.log('contains </div>:', PANEL_HTML.includes('</div>'));
console.log('contains </pre>:', PANEL_HTML.includes('</pre>'));
console.log('contains </table>:', PANEL_HTML.includes('</table>'));

const combined = PANEL_HTML + RUNNER_BLOCK;
console.log('combined length:', combined.length);
console.log('contains <script>:', combined.includes('<script>'));
console.log('contains </script>:', combined.includes('</script>'));

// Test the replacement
const src = fs.readFileSync(SRC, 'utf8');
const bodyCloseRe = /<\/body>/i;
const out = src.replace(bodyCloseRe, combined + '\n</body>');
fs.writeFileSync(OUT, out);
console.log('written:', OUT, 'len=', out.length);
console.log('contains </div>:', out.includes('__bqa_panel'));
console.log('contains </body>:', out.includes('</body>'));

// Find positions
const divIdx = out.indexOf('</div>');
const scriptIdx = out.indexOf('<script id="__bqa_runner">');
console.log('first </div> index:', divIdx);
console.log('<script id=__bqa_runner> index:', scriptIdx);
console.log('content between: ', out.substring(divIdx - 50, divIdx + 100));