const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawn } = require('child_process');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const REPORT_FILE = path.join(ROOT, 'scratch', 'regression_report.json');
const LOG_FILE = path.join(ROOT, 'scratch', 'regression_report.log');

const logs = [];
function log(msg) {
  logs.push(msg);
  try { fs.writeFileSync(LOG_FILE, logs.join('\n'), 'utf8'); } catch (e) {}
}

// 1. Check Mirror Sync Pairs (.html / .js <-> .txt)
const SYNC_PAIRS = [
  ['index.html', 'index html.txt'],
  ['spcb.html', 'spcb html.txt'],
  ['kv1.html', 'kv1 html.txt'],
  ['industry.html', 'industry html.txt'],
  ['thuehkd.html', 'thuehkd html.txt'],
  ['knowledge.html', 'knowledge html.txt'],
  ['knowledge-hub.html', 'knowledge-hub html.txt'],
  ['radar.html', 'radar html.txt'],
  ['vault.html', 'vault html.txt'],
  ['tools.html', 'tools html.txt'],
  ['coderunner.html', 'coderunner html.txt'],
  ['settings.html', 'settings html.txt'],
  ['system-workflow.html', 'system-workflow html.txt'],
  ['sidebar-nav.js', 'sidebar-nav js.txt'],
  ['report-memo.js', 'report-memo js.txt'],
  ['sop-drawer.js', 'sop-drawer js.txt'],
  ['system-config.js', 'system-config js.txt'],
  ['code.js', 'trainer_database codejs.txt'],
  ['trainer_database.js', 'trainer_database codejs.txt']
];

const syncResults = [];
for (const [src, txt] of SYNC_PAIRS) {
  const p1 = path.join(ROOT, src);
  const p2 = path.join(ROOT, txt);
  if (!fs.existsSync(p1) || !fs.existsSync(p2)) {
    syncResults.push({ pair: `${src} <-> ${txt}`, pass: false, detail: 'Missing file' });
    log(`[FAIL] Sync ${src} <-> ${txt}: Missing file`);
    continue;
  }
  const b1 = fs.readFileSync(p1);
  const b2 = fs.readFileSync(p2);
  const pass = b1.equals(b2);
  syncResults.push({ pair: `${src} <-> ${txt}`, pass, size: b1.length });
  log(`[${pass ? 'PASS' : 'FAIL'}] Sync ${src} <-> ${txt} (${b1.length} bytes)`);
}

// 2. Check V8 JS Syntax for all .js and inline <script> in .html
const JS_FILES = ['sidebar-nav.js', 'report-memo.js', 'sop-drawer.js', 'system-config.js', 'trainer_database.js', 'code.js'];
const HTML_FILES = [
  'index.html', 'spcb.html', 'kv1.html', 'industry.html', 'thuehkd.html',
  'knowledge.html', 'knowledge-hub.html', 'radar.html', 'vault.html',
  'tools.html', 'coderunner.html', 'settings.html', 'system-workflow.html',
  'admin.html', 'gamification.html'
];

const syntaxResults = [];
for (const jf of JS_FILES) {
  const p = path.join(ROOT, jf);
  if (!fs.existsSync(p)) continue;
  const code = fs.readFileSync(p, 'utf8');
  try {
    new vm.Script(code, { filename: jf });
    syntaxResults.push({ file: jf, pass: true, blocks: 1 });
    log(`[PASS] V8 Syntax ${jf}`);
  } catch (e) {
    syntaxResults.push({ file: jf, pass: false, error: e.message });
    log(`[FAIL] V8 Syntax ${jf}: ${e.message}`);
  }
}

for (const hf of HTML_FILES) {
  const p = path.join(ROOT, hf);
  if (!fs.existsSync(p)) continue;
  const html = fs.readFileSync(p, 'utf8');
  const regex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let idx = 0;
  let allPass = true;
  let errMsg = '';
  while ((match = regex.exec(html)) !== null) {
    idx++;
    const scriptContent = match[1].trim();
    if (!scriptContent) continue;
    try {
      new vm.Script(scriptContent, { filename: `${hf}#script${idx}` });
    } catch (e) {
      allPass = false;
      errMsg = `Block #${idx}: ${e.message}`;
    }
  }
  syntaxResults.push({ file: hf, pass: allPass, blocks: idx, error: errMsg });
  log(`[${allPass ? 'PASS' : 'FAIL'}] V8 Inline Script Syntax ${hf} (${idx} blocks)${errMsg ? ' -> ' + errMsg : ''}`);
}

// 3. Run Chrome Headless CDP Regression Suite
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const baseDir = 'file:///' + ROOT.replace(/\\/g, '/') + '/';
const port = 9238;
const userDataDir = path.join(ROOT, 'scratch', 'chrome_reg_suite_run');

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function runChromeTests() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  const cdpResults = [];
  function record(name, pass, detail = '') {
    cdpResults.push({ name, pass, detail });
    log(`[${pass ? 'PASS' : 'FAIL'}] CDP: ${name}${detail ? ' -> ' + detail : ''}`);
  }

  try {
    let targets = null;
    for (let i = 0; i < 15; i++) {
      try {
        targets = await getJson(`http://127.0.0.1:${port}/json`);
        if (Array.isArray(targets) && targets.length) break;
      } catch (e) {}
      await new Promise(r => setTimeout(r, 500));
    }
    if (!targets || !targets.length) throw new Error('Chrome DevTools failed to bind port ' + port);
    const pageTarget = targets.find(t => t.type === 'page');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let msgId = 1;
    const pending = new Map();
    let pageErrors = [];

    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve } = pending.get(msg.id);
        pending.delete(msg.id);
        resolve(msg);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        pageErrors.push(d.text + ' ' + (d.exception ? d.exception.description : ''));
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        pending.set(id, { resolve });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evalExpr(expr) {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      return res.result && res.result.result ? res.result.result.value : undefined;
    }

    await new Promise(r => ws.onopen = r);
    await send('Page.enable');
    await send('Runtime.enable');

    // Seed localStorage and test index.html
    await send('Page.navigate', { url: baseDir + 'index.html' });
    await new Promise(r => setTimeout(r, 900));
    await evalExpr(`localStorage.setItem('kv_master_db', JSON.stringify([
      { courseId: '26KV01', groupName: 'SPCB', month: '1', startDate: '2026-01-05', totalTrainees: 20, passedTrainees: 18, failedTrainees: 2, csat: '4.9/5', highlights: 'Tốt', issues: 'Ít', actionPlan: 'Theo dõi' },
      { courseId: 'TAX-01-26', groupName: 'TAX', month: '1', startDate: '2026-01-10', totalTrainees: 15, passedTrainees: 14, failedTrainees: 1, csat: '4.8/5', highlights: 'Ổn', issues: 'Không', actionPlan: 'OK' }
    ])); localStorage.setItem('kv_gift_db', JSON.stringify([{ name: 'Túi tote', in: 50, out: 10 }, { name: 'Bình nước', in: 30, out: 5 }]));`);

    pageErrors = [];
    await send('Page.navigate', { url: baseDir + 'index.html' });
    await new Promise(r => setTimeout(r, 1400));
    await evalExpr(`switchTab('tong-quan');`);
    await new Promise(r => setTimeout(r, 250));

    const idxCheck = JSON.parse(await evalExpr(`(() => {
      const hasAurora = document.documentElement.classList.contains('aurora-ui');
      const hasSidebar = !!document.getElementById('sidebar');
      const hasPerfChart = !!document.getElementById('performanceChart');
      const hasTrendChart = !!document.getElementById('trendChart');
      const hasTableRows = document.querySelectorAll('#masterDetailTableBody tr').length;
      document.getElementById('btn-aurora-theme-toggle').click();
      const darkOk = document.documentElement.getAttribute('data-aurora') === 'dark';
      document.getElementById('btn-aurora-theme-toggle').click();
      const lightOk = document.documentElement.getAttribute('data-aurora') === 'light';
      return JSON.stringify({ hasAurora, hasSidebar, hasPerfChart, hasTrendChart, hasTableRows, darkOk, lightOk });
    })()`));

    record('index.html (Aurora Mesh UI, Light/Dark Toggle, Charts & Master Table)',
      pageErrors.length === 0 && idxCheck.hasAurora && idxCheck.hasSidebar && idxCheck.hasPerfChart && idxCheck.hasTrendChart && idxCheck.hasTableRows >= 1 && idxCheck.darkOk && idxCheck.lightOk,
      `errors=${pageErrors.length}, ${JSON.stringify(idxCheck)}`
    );

    const pagesToTest = [
      'spcb.html', 'thuehkd.html', 'kv1.html', 'industry.html?type=FNB',
      'knowledge-hub.html', 'knowledge.html', 'radar.html', 'vault.html',
      'tools.html', 'coderunner.html', 'settings.html', 'system-workflow.html'
    ];

    for (const p of pagesToTest) {
      pageErrors = [];
      await send('Page.navigate', { url: baseDir + p });
      for (let w = 0; w < 25; w++) {
        await new Promise(r => setTimeout(r, 150));
        const ready = await evalExpr(`document.readyState === 'complete' && document.querySelectorAll('#sidebar a.sidebar-item').length >= 10`);
        if (ready) break;
      }
      const isCustomDark = p === 'coderunner.html' || p === 'system-workflow.html';
      const check = JSON.parse(await evalExpr(`(() => {
        const hasSidebar = document.querySelectorAll('#sidebar a.sidebar-item').length >= 10;
        let darkToggleOk = true;
        if (!${isCustomDark} && typeof window.setAuroraTheme === 'function') {
          window.setAuroraTheme('dark');
          darkToggleOk = document.documentElement.getAttribute('data-aurora') === 'dark';
          window.setAuroraTheme('light');
          darkToggleOk = darkToggleOk && document.documentElement.getAttribute('data-aurora') === 'light';
        }
        const hasAuroraClass = ${isCustomDark} ? document.documentElement.classList.contains('aurora-sidebar') : document.documentElement.classList.contains('aurora-ui');
        const playfulCount = document.querySelectorAll('.aurora-picon svg').length;
        return JSON.stringify({ hasSidebar, hasAuroraClass, darkToggleOk, playfulCount });
      })()`));
      record(`${p} (Runtime, Universal Sidebar, Aurora Theme & Icons)`,
        pageErrors.length === 0 && check.hasSidebar && check.hasAuroraClass && check.darkToggleOk && check.playfulCount >= 13,
        `errors=${pageErrors.length}, ${JSON.stringify(check)}`
      );
    }

    ws.close();
  } finally {
    try { chrome.kill(); } catch (e) {}
  }

  const summary = {
    timestamp: new Date().toISOString(),
    syncPassed: syncResults.filter(x => x.pass).length,
    syncTotal: syncResults.length,
    syntaxPassed: syntaxResults.filter(x => x.pass).length,
    syntaxTotal: syntaxResults.length,
    cdpPassed: cdpResults.filter(x => x.pass).length,
    cdpTotal: cdpResults.length,
    syncResults,
    syntaxResults,
    cdpResults
  };
  fs.writeFileSync(REPORT_FILE, JSON.stringify(summary, null, 2), 'utf8');
  log(`\nFINAL SUMMARY: Sync ${summary.syncPassed}/${summary.syncTotal} | Syntax ${summary.syntaxPassed}/${summary.syntaxTotal} | CDP ${summary.cdpPassed}/${summary.cdpTotal}`);
}

runChromeTests().catch(err => {
  log(`FATAL ERROR: ${err.stack || err.message}`);
  process.exit(1);
});
