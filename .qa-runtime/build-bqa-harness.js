/*
 * Build pasay-mini-app-bqa-390-430.html (inlined variant):
 *   - Read pasay-mini-app.html
 *   - Insert QA panel HTML right after <body ...>
 *   - Append QA runner script at the end of <body>
 * The QA runs synchronously after the mini-app IIFE, so OD export captures
 * the completed panel with real DOM metrics.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.resolve(__dirname, '..');
const SRC = path.join(WORKSPACE, 'pasay-mini-app.html');
const OUT = path.join(WORKSPACE, 'pasay-mini-app-bqa-390-430.html');

const QA_PANEL = `
<div id="__bqa_panel" style="position:fixed;inset:0;z-index:99999;background:rgba(246,247,249,0.97);overflow:auto;padding:22px 26px;box-sizing:border-box;font-family:-apple-system,'Segoe UI',system-ui,sans-serif;color:#0b1220">
  <h1 style="font-family:Georgia,serif;font-size:20px;margin:0 0 4px">PASAY · Real Browser QA 390 / 430 · Inlined Harness</h1>
  <p style="margin:0 0 14px;color:#5b6472;font-size:13px">pasay-mini-app.html inlined as same-document HTML · <code>window.__OD_RUN_BROWSER_QA()</code> executed on real DOM · measurements via <code>scrollWidth</code> / <code>getBoundingClientRect</code> / <code>documentElement.clientWidth</code></p>
  <div id="__bqa_sum" style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px;font-weight:700;padding:12px 16px;border:1px solid #e4e7ec;border-radius:10px;background:#fff;margin-bottom:16px">running…</div>
  <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e4e7ec;border-radius:12px;overflow:hidden;font-size:12.5px">
    <thead><tr>
      <th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">Page</th>
      <th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">Viewport</th>
      <th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">docOverflow</th>
      <th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">appOverflow</th>
      <th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">clip / short touch</th>
      <th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">overlap</th>
      <th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">BottomNav(5)</th>
      <th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">Primary</th>
      <th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">leak tokens</th>
      <th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">Verdict</th>
    </tr></thead>
    <tbody id="__bqa_tb"></tbody>
  </table>
  <pre id="__bqa_report_blob" style="display:none"></pre>
</div>
`;

const QA_RUNNER = `
<script id="__bqa_runner">
(function(){
  function renderReport(report){
    var tb = document.getElementById('__bqa_tb');
    var sum = document.getElementById('__bqa_sum');
    if (!tb || !sum) { window.__BQA_ALLPASS = false; return; }
    var total = 0, pass = 0;
    [390, 430].forEach(function(vw){
      var entries = (report && report.viewports && report.viewports[String(vw)]) || [];
      entries.forEach(function(e){
        total++;
        if (e.ok) pass++;
        var tr = document.createElement('tr');
        function cell(ok){ return '<td style="padding:8px 11px;border-bottom:1px solid #e4e7ec;font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700;color:' + (ok ? '#0a7d43' : '#c0392b') + '">' + (ok ? 'PASS' : 'FAIL') + '</td>'; }
        var leaks = (e.leaks || []).join(', ');
        tr.innerHTML =
          '<td style="padding:8px 11px;border-bottom:1px solid #e4e7ec">' + (e.page || '?') + '</td>' +
          '<td style="padding:8px 11px;border-bottom:1px solid #e4e7ec;font-family:ui-monospace,Menlo,Consolas,monospace">' + vw + '</td>' +
          cell(!e.docOverflow) +
          cell(!e.appOverflow) +
          cell(!(e.rectIssues && e.rectIssues.length)) +
          cell(!e.overlap) +
          cell(!!e.bottomNavUsable) +
          cell(!!e.primaryAction) +
          '<td style="padding:8px 11px;border-bottom:1px solid #e4e7ec;font-family:ui-monospace,Menlo,Consolas,monospace;color:' + (leaks ? '#c0392b' : '#0a7d43') + ';font-weight:700">' + (leaks || '0') + '</td>' +
          '<td style="padding:8px 11px;border-bottom:1px solid #e4e7ec;font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700;color:' + (e.ok ? '#0a7d43' : '#c0392b') + '">' + (e.ok ? 'PASS' : 'FAIL') + (e.error ? (' · ' + e.error) : '') + '</td>';
        tb.appendChild(tr);
      });
    });
    var allPass = total > 0 && pass === total;
    sum.textContent = 'REAL-BROWSER QA · Microsoft Edge headless via OpenDesign export · pasay-mini-app.html inlined · viewports=390/430 · pages=' + total + ' pass=' + pass + ' allPass=' + allPass;
    sum.style.color = allPass ? '#0a7d43' : '#c0392b';
    sum.style.background = allPass ? '#e6f7ec' : '#fbe6e6';
    sum.style.borderColor = allPass ? '#0a7d43' : '#c0392b';
    window.__BQA_ALLPASS = allPass;
    window.__BQA_REPORT = report;
    window.__BQA_TOTAL = total;
    window.__BQA_PASS = pass;
    try {
      document.getElementById('__bqa_report_blob').textContent = 'BQA_REPORT_BEGIN\\n' + JSON.stringify(report, null, 2) + '\\nBQA_REPORT_END';
    } catch (_) {}
  }
  function fail(msg){
    var sum = document.getElementById('__bqa_sum');
    if (sum) { sum.textContent = msg; sum.style.color = '#c0392b'; sum.style.background = '#fbe6e6'; }
    window.__BQA_ALLPASS = false;
  }
  function runNow(){
    if (typeof window.__OD_RUN_BROWSER_QA !== 'function') {
      return false;
    }
    var report;
    try { report = window.__OD_RUN_BROWSER_QA(); } catch (e) { fail('QA threw: ' + (e && e.message || e)); return true; }
    if (!report || !report.viewports) { fail('QA returned no report'); return true; }
    renderReport(report);
    return true;
  }
  /* Diagnostic: paint something immediately so OD export sees we ran */
  var sum0 = document.getElementById('__bqa_sum');
  if (sum0) sum0.textContent = 'QA runner started; typeof __OD_RUN_BROWSER_QA=' + typeof window.__OD_RUN_BROWSER_QA + '; typeof __OD_RUN_GATES=' + typeof window.__OD_RUN_GATES + '; typeof __OD_GATE_A=' + typeof window.__OD_GATE_A + '; typeof __OD_GATE_BROWSER_QA_390_430=' + typeof window.__OD_GATE_BROWSER_QA_390_430 + '; typeof render=' + typeof render + '; typeof app=' + (document.getElementById('app') ? 'present' : 'null') + '; doc.readyState=' + document.readyState + '; scriptCount=' + document.scripts.length;
  if (runNow()) return;
  /* Retry on rAF in case app isn't booted yet */
  var tries = 0;
  (function tick(){
    tries++;
    if (runNow()) return;
    if (tries > 60) { fail('app never booted after 60 ticks'); return; }
    try { requestAnimationFrame(tick); } catch (_) { setTimeout(tick, 16); }
  })();
})();
</` + `script>
`;

function main() {
  const src = fs.readFileSync(SRC, 'utf8');
  /* Insert QA panel right after <body ...> opening tag */
  const bodyOpenRe = /<body[^>]*>/i;
  if (!bodyOpenRe.test(src)) throw new Error('No <body> tag in source');
  const out1 = src.replace(bodyOpenRe, function (m) { return m + '\n' + QA_PANEL; });
  /* Append QA runner right before </body> */
  const bodyCloseRe = /<\/body>/i;
  if (!bodyCloseRe.test(out1)) throw new Error('No </body> tag in source');
  const out2 = out1.replace(bodyCloseRe, QA_RUNNER + '\n</body>');
  fs.writeFileSync(OUT, out2);
  console.log('[build-bqa] wrote ' + OUT + ' (' + out2.length + ' bytes; src was ' + src.length + ')');
}

main();