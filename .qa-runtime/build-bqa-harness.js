'use strict';
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.resolve(__dirname, '..');
const SRC = path.join(WORKSPACE, 'pasay-mini-app.html');
const OUT = path.join(WORKSPACE, 'pasay-mini-app-bqa-390-430.html');

/* Build the QA runner script as a single string with proper escaping.
   Note: use single-quoted JS strings and double-quoted HTML attributes to
   avoid escaping confusion. */
const C = "color"; /* CSS prop name shortcut */
const CELL_STYLE = "padding:8px 11px;border-bottom:1px solid #e4e7ec;font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700";
const ROW_STYLE = "padding:8px 11px;border-bottom:1px solid #e4e7ec";
const MONO_STYLE = "padding:8px 11px;border-bottom:1px solid #e4e7ec;font-family:ui-monospace,Menlo,Consolas,monospace";

const SCRIPT = [
  '(function(){',
  'var CELL_STYLE="padding:8px 11px;border-bottom:1px solid #e4e7ec;font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700";',
  'var ROW_STYLE="padding:8px 11px;border-bottom:1px solid #e4e7ec";',
  'var MONO_STYLE="padding:8px 11px;border-bottom:1px solid #e4e7ec;font-family:ui-monospace,Menlo,Consolas,monospace";',
  'window.addEventListener("error",function(e){',
  '  var sum=document.getElementById("__bqa_sum");',
  '  if(sum)sum.textContent="ERR: "+(e.message||e)+" @ "+(e.filename||"?")+":"+(e.lineno||"?")+":"+(e.colno||"?");',
  '});',
  'var tb=document.getElementById("__bqa_tb");',
  'var sum=document.getElementById("__bqa_sum");',
  'function cell(ok){return "<td style=\\"" + CELL_STYLE + ";color:" + (ok?"#0a7d43":"#c0392b") + "\\">" + (ok?"PASS":"FAIL") + "</td>";}',
  'function row(page,vw,e){',
  '  var leaks=(e.leaks||[]).join(", ");',
  '  return "<tr><td style=\\"" + ROW_STYLE + "\\">" + (e.page||page||"?") + "</td>"',
  '    + "<td style=\\"" + MONO_STYLE + "\\">" + vw + "</td>"',
  '    + cell(!e.docOverflow) + cell(!e.appOverflow) + cell(!(e.rectIssues&&e.rectIssues.length))',
  '    + cell(!e.overlap) + cell(!!e.bottomNavUsable) + cell(!!e.primaryAction)',
  '    + "<td style=\\"" + MONO_STYLE + ";color:" + (leaks?"#c0392b":"#0a7d43") + ";font-weight:700\\">" + (leaks||"0") + "</td>"',
  '    + "<td style=\\"" + MONO_STYLE + ";font-weight:700;color:" + (e.ok?"#0a7d43":"#c0392b") + "\\">" + (e.ok?"PASS":"FAIL") + (e.error?(" \\u00b7 "+e.error):"") + "</td></tr>";',
  '}',
  'function renderReport(report){',
  '  if(!tb||!sum){window.__BQA_ALLPASS=false;return;}',
  '  var total=0,pass=0;',
  '  [390,430].forEach(function(vw){',
  '    var entries=(report&&report.viewports&&report.viewports[String(vw)])||[];',
  '    entries.forEach(function(e){total++;if(e.ok)pass++;tb.insertAdjacentHTML("beforeend",row(null,vw,e));});',
  '  });',
  '  var pageCount=(report&&report.pages&&report.pages.length)||0;',
  '  var expectedTotal=pageCount*2;',
  '  var allPass=total>0&&pass===total;',
  '  var hardAssert=(typeof window.__OD_RUN_BROWSER_QA==="function")&&total===expectedTotal&&pass===total&&allPass;',
  '  sum.textContent="REAL-BROWSER QA \\u00b7 pages="+pageCount+" \\u00d7 2 viewports (390/430) \\u00b7 entries="+total+" pass="+pass+" allPass="+allPass;',
  '  sum.style.color=allPass?"#0a7d43":"#c0392b";',
  '  sum.style.background=allPass?"#e6f7ec":"#fbe6e6";',
  '  sum.style.borderColor=allPass?"#0a7d43":"#c0392b";',
  '  window.__BQA_ALLPASS=allPass;',
  '  window.__BQA_REPORT=report;',
  '  window.__BQA_TOTAL=total;',
  '  window.__BQA_PASS=pass;',
  '  window.__BQA_PAGE_COUNT=pageCount;',
  '  window.__BQA_HARD_ASSERT=hardAssert;',
  '  var ua=(typeof navigator!=="undefined")?navigator.userAgent:"";',
  '  var verify={browser:ua, href:(typeof location!=="undefined")?location.href:"", hardAssert:hardAssert, allPass:allPass, total:total, pass:pass, pageCount:pageCount, expectedTotal:expectedTotal, viewport390Count:(report&&report.viewports&&report.viewports["390"]||[]).length, viewport430Count:(report&&report.viewports&&report.viewports["430"]||[]).length, timestamp:new Date().toISOString()};',
  '  window.__BQA_VERIFY=verify;',
  '  try{document.getElementById("__bqa_report_blob").textContent="BQA_REPORT_BEGIN\\n"+JSON.stringify(report,null,2)+"\\nBQA_REPORT_END";}catch(_){}',
  '  try{document.getElementById("__bqa_verify_blob").textContent="BQA_VERIFY_BEGIN\\n"+JSON.stringify(verify,null,2)+"\\nBQA_VERIFY_END";}catch(_){}',
  '}',
  'function fail(msg){',
  '  if(sum){sum.textContent=msg;sum.style.color="#c0392b";sum.style.background="#fbe6e6";}',
  '  window.__BQA_ALLPASS=false;',
  '}',
  'function runNow(){',
  '  if(typeof window.__OD_RUN_BROWSER_QA!=="function")return false;',
  '  var report;',
  '  try{report=window.__OD_RUN_BROWSER_QA();}catch(e){fail("QA threw: "+(e&&e.message||e));return true;}',
  '  if(!report||!report.viewports){fail("QA returned no report");return true;}',
  '  renderReport(report);',
  '  return true;',
  '}',
  'if(sum){var ee=window.__BQA_EARLY_ERRORS||[];var tail=ee.length?"\\n\\nERRORS:\\n"+ee.join("\\n"):"";sum.textContent="QA runner started; typeof __OD_RUN_BROWSER_QA="+typeof window.__OD_RUN_BROWSER_QA+"; app="+(document.getElementById("app")?"present":"null")+tail;}',
  'if(runNow())return;',
  'var tries=0;',
  '(function tick(){tries++;if(runNow())return;if(tries>240){fail("app never booted");return;}try{requestAnimationFrame(tick);}catch(_){setTimeout(tick,16);}})();',
  '})();'
].join('\n');

const PANEL_HTML = '<div id="__bqa_panel" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:#fff;overflow:auto;padding:22px 26px;box-sizing:border-box;font-family:-apple-system,Segoe UI,system-ui,sans-serif;color:#0b1220">'
  + '<h1 style="font-family:Georgia,serif;font-size:20px;margin:0 0 4px">PASAY \u00b7 Real Browser QA 390 / 430</h1>'
  + '<p style="margin:0 0 14px;color:#5b6472;font-size:13px">pasay-mini-app.html inlined \u00b7 <code>window.__OD_RUN_BROWSER_QA()</code> \u00b7 real Chromium DOM measurements</p>'
  + '<div id="__bqa_sum" style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px;font-weight:700;padding:12px 16px;border:1px solid #e4e7ec;border-radius:10px;background:#fff;margin-bottom:16px">running\u2026</div>'
  + '<table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e4e7ec;border-radius:12px;overflow:hidden;font-size:12.5px"><thead><tr>'
  + '<th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">Page</th>'
  + '<th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">Viewport</th>'
  + '<th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">docOverflow</th>'
  + '<th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">appOverflow</th>'
  + '<th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">clip</th>'
  + '<th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">overlap</th>'
  + '<th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">BottomNav(5)</th>'
  + '<th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">Primary</th>'
  + '<th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">leak</th>'
  + '<th style="text-align:left;padding:8px 11px;border-bottom:1px solid #e4e7ec;font-size:10.5px;text-transform:uppercase;color:#5b6472;background:#fafbfc">Verdict</th>'
  + '</tr></thead><tbody id="__bqa_tb"></tbody></table>'
  + '</div>'
  + '<pre id="__bqa_report_blob" style="display:none"></pre>'
  + '<pre id="__bqa_verify_blob" style="display:none"></pre>';

const RUNNER_BLOCK = '<script id="__bqa_runner">' + SCRIPT + '</script>';

/* Early error capture that runs BEFORE the mini-app's <script>.
   Captures errors during mini-app IIFE init() so we can diagnose. */
const EARLY_ERROR_CAPTURE = '<script>(function(){window.__BQA_EARLY_ERRORS=[];window.addEventListener("error",function(e){window.__BQA_EARLY_ERRORS.push((e.message||e)+" @ "+(e.filename||"?")+":"+(e.lineno||"?")+":"+(e.colno||"?"));},true);})();</script>';

function main() {
  const src = fs.readFileSync(SRC, 'utf8');
  /* Insert early error capture immediately after <body> */
  const bodyOpenRe = /<body[^>]*>/i;
  if (!bodyOpenRe.test(src)) throw new Error('No <body> tag in source');
  const srcWithEarly = src.replace(bodyOpenRe, function (m) { return m + '\n' + EARLY_ERROR_CAPTURE; });
  /* Append QA panel + runner right before </body> */
  const bodyCloseRe = /<\/body>/i;
  if (!bodyCloseRe.test(srcWithEarly)) throw new Error('No </body> tag in source');
  const out = srcWithEarly.replace(bodyCloseRe, PANEL_HTML + RUNNER_BLOCK + '\n</body>');
  fs.writeFileSync(OUT, out);
  console.log('[build-bqa] wrote ' + OUT + ' (' + out.length + ' bytes; src was ' + src.length + ')');
}

main();