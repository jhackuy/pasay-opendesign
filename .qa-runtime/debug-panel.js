'use strict';
const path = require('path');
const fs = require('fs');
// load build script's logic inline (can't easily import; copy)
const panelStart = '<div id="__bqa_panel" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:#fff;overflow:auto;padding:22px 26px;box-sizing:border-box;font-family:-apple-system,Segoe UI,system-ui,sans-serif;color:#0b1220">';
const panelEnd = '</div><pre id="__bqa_report_blob" style="display:none"></pre>';
const test = panelStart + '<h1>test</h1>' + panelEnd;
fs.writeFileSync(path.join(__dirname, 'panel-test.html'), test);
console.log('test panel length:', test.length);
console.log('contains </div>:', test.includes('</div>'));
console.log('contains </pre>:', test.includes('</pre>'));