/**
 * Đồng bộ các file song sinh ".txt" từ file gốc (.html / .js) - thay cho việc copy tay (Sprint 3).
 *   node scripts/sync_mirrors.js           -> sao chép file gốc sang bản .txt
 *   node scripts/sync_mirrors.js --check   -> chỉ kiểm tra, báo cặp nào lệch (exit 1 nếu có lệch)
 * File gốc luôn là bản chuẩn; KHÔNG sửa trực tiếp file .txt.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// [file gốc, file song sinh]
const MIRROR_PAIRS = [
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
  ['chat-history.js', 'chat-history js.txt'],
  ['trainer-utils.js', 'trainer-utils js.txt'],
  ['code.js', 'trainer_database.js'],
  ['code.js', 'trainer_database codejs.txt']
];

function checkPairs() {
  return MIRROR_PAIRS.map(([src, dst]) => {
    const a = path.join(ROOT, src), b = path.join(ROOT, dst);
    if (!fs.existsSync(a)) return { src, dst, ok: false, reason: 'thiếu file gốc' };
    if (!fs.existsSync(b)) return { src, dst, ok: false, reason: 'chưa có bản .txt' };
    const same = fs.readFileSync(a).equals(fs.readFileSync(b));
    return { src, dst, ok: same, reason: same ? '' : 'lệch nội dung' };
  });
}

function syncPairs() {
  let copied = 0;
  MIRROR_PAIRS.forEach(([src, dst]) => {
    const a = path.join(ROOT, src), b = path.join(ROOT, dst);
    if (!fs.existsSync(a)) return;
    if (fs.existsSync(b) && fs.readFileSync(a).equals(fs.readFileSync(b))) return;
    fs.copyFileSync(a, b);
    copied++;
    console.log(`  ↻ ${src}  →  ${dst}`);
  });
  return copied;
}

module.exports = { MIRROR_PAIRS, checkPairs, syncPairs };

if (require.main === module) {
  if (process.argv.includes('--check')) {
    const res = checkPairs();
    res.forEach(r => console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.src} ↔ ${r.dst}${r.reason ? '  (' + r.reason + ')' : ''}`));
    const bad = res.filter(r => !r.ok).length;
    console.log(`\nMirror: ${res.length - bad}/${res.length} khớp`);
    process.exit(bad ? 1 : 0);
  } else {
    const n = syncPairs();
    console.log(n ? `\nĐã đồng bộ ${n} file .txt` : 'Tất cả file .txt đã khớp, không cần đồng bộ');
  }
}
