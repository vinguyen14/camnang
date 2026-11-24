/**
 * CHẠY TOÀN BỘ KIỂM THỬ (Bước 2 của SOP) - Sprint 3
 *   node scripts/run_all_tests.js          -> kiểm tra (không sửa gì)
 *   node scripts/run_all_tests.js --sync   -> đồng bộ file .txt trước rồi kiểm tra
 *
 * Gồm: (1) file .txt khớp file gốc, (2) cú pháp V8 mọi file .js + <script> trong .html,
 *      (3) unit test trainer-utils, (4) test backend Apps Script (giả lập Google Sheets).
 * Kết quả ghi vào scratch/test_report.json. Exit code 0 = tất cả đạt.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');
const mirrors = require('./sync_mirrors');

const ROOT = path.resolve(__dirname, '..');
const report = { at: new Date().toISOString(), sections: [] };
let allOk = true;

function section(name, ok, detail) {
  report.sections.push({ name, ok, detail });
  if (!ok) allOk = false;
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
}

// 0. Đồng bộ (tùy chọn)
if (process.argv.includes('--sync')) {
  const n = mirrors.syncPairs();
  console.log(`(đã đồng bộ ${n} file .txt)\n`);
}

// 1. File .txt
const mres = mirrors.checkPairs();
const mbad = mres.filter(r => !r.ok);
section('File .txt khớp file gốc', mbad.length === 0,
  `${mres.length - mbad.length}/${mres.length}` + (mbad.length ? ' — lệch: ' + mbad.map(r => r.dst).join(', ') + ' (chạy lại với --sync)' : ''));

// 2. Cú pháp V8
const files = fs.readdirSync(ROOT).filter(f => /\.(js|html)$/.test(f))
  .concat(fs.existsSync(path.join(ROOT, 'games')) ? fs.readdirSync(path.join(ROOT, 'games')).filter(f => f.endsWith('.html')).map(f => 'games/' + f) : []);
const syntaxErrors = [];
files.forEach(f => {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const blocks = f.endsWith('.js') ? [src] : [...src.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  blocks.forEach((b, i) => {
    if (!b.trim()) return;
    try { new vm.Script(b, { filename: `${f}#${i}` }); } catch (e) { syntaxErrors.push(`${f} (khối ${i}): ${e.message}`); }
  });
});
section('Cú pháp JavaScript (V8)', syntaxErrors.length === 0, `${files.length} file` + (syntaxErrors.length ? ' — ' + syntaxErrors.join(' | ') : ''));

// 3 & 4. Unit test + test backend
['test_trainer_utils.js', 'test_backend_security.js'].forEach(t => {
  const r = spawnSync(process.execPath, [path.join(__dirname, t)], { cwd: ROOT, encoding: 'utf8', env: process.env });
  const out = (r.stdout || '') + (r.stderr || '');
  const summary = (out.match(/KẾT QUẢ: (\d+)\/(\d+) PASS/) || [])[0] || 'không đọc được kết quả';
  const fails = out.split('\n').filter(l => l.startsWith('FAIL')).slice(0, 5);
  section(t, r.status === 0, summary + (fails.length ? ' — ' + fails.join(' | ') : ''));
});

try {
  fs.mkdirSync(path.join(ROOT, 'scratch'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'scratch', 'test_report.json'), JSON.stringify(report, null, 2), 'utf8');
} catch (e) {}

console.log(allOk ? '\n🎉 TẤT CẢ ĐẠT' : '\n⚠️ CÓ HẠNG MỤC CHƯA ĐẠT');
process.exit(allOk ? 0 : 1);
