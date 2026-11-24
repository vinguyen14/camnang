/**
 * Kiểm thử bảo mật backend (Sprint 0) - chạy code.js trong môi trường giả lập Google Apps Script.
 * Chạy: node scripts/test_backend_security.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(ROOT, 'code.js'), 'utf8');

// ---------- Mock Google Sheets ----------
function makeSheet(name, rows) {
  let data = rows.map(r => r.slice());
  return {
    getName: () => name,
    getLastRow: () => data.length,
    getLastColumn: () => data.reduce((m, r) => Math.max(m, r.length), 0),
    getDataRange: () => ({ getValues: () => data.map(r => r.slice()) }),
    getRange: (row, col, nr, nc) => {
      if (typeof row === 'string') { // Hỗ trợ dạng "A3:F10"
        const m = row.match(/^([A-Z])(\d+):([A-Z])(\d+)$/);
        const c1 = m[1].charCodeAt(0) - 64, r1 = +m[2], c2 = m[3].charCodeAt(0) - 64, r2 = +m[4];
        row = r1; col = c1; nr = r2 - r1 + 1; nc = c2 - c1 + 1;
      }
      return {
      getValues: () => data.slice(row - 1, row - 1 + (nr || 1)).map(r => r.slice(col - 1, col - 1 + (nc || 1))),
      setValues: (vals) => { vals.forEach((v, i) => { data[row - 1 + i] = data[row - 1 + i] || []; v.forEach((x, j) => data[row - 1 + i][col - 1 + j] = x); }); },
      clearContent: () => { for (let i = row - 1; i < row - 1 + nr; i++) for (let j = col - 1; j < col - 1 + nc; j++) if (data[i]) data[i][j] = ''; },
      };
    },
    appendRow: (r) => data.push(r.slice()),
    clear: () => { data = []; },
    deleteRow: (i) => data.splice(i - 1, 1),
    _data: () => data,
  };
}

function freshEnv(props) {
  const sheets = {
    MasterDB: makeSheet('MasterDB', [['Timestamp', 'Nhóm Khóa', 'Mã Khóa'], [1, 'SPCB', '26KV01']]),
    KetQuaHocVien: makeSheet('KetQuaHocVien', [
      ["Timestamp", "Mã Khóa", "Nhóm Khóa", "STT", "Mã NV", "Họ Tên", "Phòng Ban", "Email Công Ty", "Lần Kiểm Tra", "Điểm", "Kết Quả", "Username LMS", "Password", "Điểm Danh"],
      ['t', 'OLD', 'SPCB', 1, 'NV1', 'A', 'D', 'a@kiotviet.com', '1', '90', 'Pass', 'u1', 'OldSecret!', 'x'],
    ]),
    Settings: makeSheet('Settings', [['Key', 'Value'], ['kv_api_url', "'https://evil.example/exec"], ['kv_trainer_profile', "'{\"name\":\"X\"}"]]),
  };
  sheets.KhoQua = makeSheet('KhoQua', [['Tên Quà', 'Tồn Đầu', 'Xuất Kho', 'Tồn Cuối'], ['Bình nước', 30, 5, 25]]);
  const sentEmails = [];
  const fetched = [];
  const openedIds = [];
  const ss = {
    getSheetByName: (n) => sheets[n] || null,
    insertSheet: (n) => (sheets[n] = makeSheet(n, [])),
    getSheets: () => Object.values(sheets),
    getName: () => 'MockSS',
  };
  const ctx = {
    console,
    SpreadsheetApp: { openById: (id) => {
      openedIds.push(id);
      if (id === 'NO_ACCESS_GIFT_ID') throw new Error('Bạn không có quyền truy cập vào tài liệu yêu cầu.');
      if (id === 'EXTERNAL_GIFT_ID') return { getSheetByName: (n) => n === 'Kho' ? makeSheet('Kho', [['h'], ['h'], ['Túi', '', '10.000', 50, 5, '']]) : null, getName: () => 'Kho quà' };
      return ss;
    } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (props[k] === undefined ? null : props[k]), setProperty: (k, v) => { props[k] = v; } }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ setMimeType: () => ({ body: JSON.parse(s), getContent: () => s }) }) },
    GmailApp: { sendEmail: (to, s, b) => sentEmails.push({ to, s, b }) },
    UrlFetchApp: { fetch: (url) => { fetched.push(url); return { getContentText: () => '{"candidates":[{"content":{"parts":[{"text":"ok"}]}}]}' }; } },
    Utilities: { formatDate: () => '2026-11-21 10:00:00', getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' },
    Logger: { log: () => {} },
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  const post = (obj) => ctx.doPost({ postData: { contents: JSON.stringify(obj) } }).body;
  const get = (params) => ctx.doGet({ parameter: params || {} }).body;
  return { ctx, sheets, sentEmails, fetched, openedIds, post, get, props };
}

const TOKEN = 'T'.repeat(40);
const results = [];
function check(name, cond, detail) {
  results.push({ name, pass: !!cond });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${!cond && detail ? '  -> ' + JSON.stringify(detail) : ''}`);
}

// 1. Fail-closed khi chưa cấu hình API_TOKEN
{
  const env = freshEnv({});
  const r = env.post({ action: 'sync_up', payload: '{}', token: '' });
  check('Chưa cấu hình API_TOKEN -> từ chối sync_up', r.code === 'UNAUTHORIZED', r);
  check('Chưa cấu hình API_TOKEN -> Settings không bị xóa', env.sheets.Settings._data().length === 3);
  const g = env.get({});
  check('Chưa cấu hình API_TOKEN -> từ chối doGet', g.code === 'UNAUTHORIZED', g);
}

// 2. Sai token / thiếu token
{
  const env = freshEnv({ API_TOKEN: TOKEN, ADMIN_PASSWORD: 'Long-Admin-Pass-123' });
  check('Thiếu token -> clear_data bị từ chối', env.post({ action: 'clear_data', pwd: 'Long-Admin-Pass-123' }).code === 'UNAUTHORIZED');
  check('Sai token -> send_email bị từ chối', env.post({ action: 'send_email', to: 'a@kiotviet.com', subject: 's', body: 'b', token: 'x'.repeat(40) }).code === 'UNAUTHORIZED');
  check('Sai token -> không gửi email nào', env.sentEmails.length === 0);
  check('Sai token -> doGet bị từ chối', env.get({ token: 'wrong' }).code === 'UNAUTHORIZED');
  check('Sai token -> submit report bị từ chối', env.post({ courseId: 'HACK', totalTrainees: 1, token: 'nope' }).code === 'UNAUTHORIZED');
  check('Sai token -> MasterDB không đổi', env.sheets.MasterDB._data().length === 2);
}

// 3. clear_data: mật khẩu cũ không còn dùng được
{
  const env = freshEnv({ API_TOKEN: TOKEN });
  const r = env.post({ action: 'clear_data', pwd: '014023', token: TOKEN });
  check('clear_data không có ADMIN_PASSWORD -> báo lỗi cấu hình (không fallback)', r.status === 'error' && /ADMIN_PASSWORD/.test(r.message), r);
  const env2 = freshEnv({ API_TOKEN: TOKEN, ADMIN_PASSWORD: 'Long-Admin-Pass-123' });
  check('clear_data với mật khẩu cũ 014023 -> sai mật khẩu', env2.post({ action: 'clear_data', pwd: '014023', token: TOKEN }).status === 'error');
  check('clear_data đúng token + đúng mật khẩu -> thành công', env2.post({ action: 'clear_data', pwd: 'Long-Admin-Pass-123', token: TOKEN }).status === 'success');
}

// 4. Gemini key
{
  const env = freshEnv({ API_TOKEN: TOKEN });
  const r = env.post({ action: 'ask_ai', prompt: 'hi', token: TOKEN });
  check('ask_ai không có GEMINI_API_KEY -> lỗi, không gọi Google', r.status === 'error' && env.fetched.length === 0, r);
  check('Mã nguồn không còn chứa key Gemini hardcode', !/AQ\.Ab8|AIza[0-9A-Za-z_-]{20,}/.test(code));
  check('Mã nguồn không còn mật khẩu 014023', code.indexOf('014023') === -1);
  const env2 = freshEnv({ API_TOKEN: TOKEN, GEMINI_API_KEY: 'test-key' });
  check('ask_ai có key -> hoạt động', env2.post({ action: 'ask_ai', prompt: 'hi', token: TOKEN }).reply === 'ok');
}

// 5. send_email
{
  const env = freshEnv({ API_TOKEN: TOKEN });
  const bad = env.post({ action: 'send_email', to: 'a@kiotviet.com,victim@gmail.com', subject: 's', body: 'b', token: TOKEN });
  check('send_email tới domain ngoài -> từ chối cả lô', bad.status === 'error' && env.sentEmails.length === 0, bad);
  const ok = env.post({ action: 'send_email', to: 'a@kiotviet.com, B@KiotViet.com', subject: 's', body: 'b', token: TOKEN });
  check('send_email tới domain công ty -> gửi được', ok.status === 'success' && env.sentEmails.length === 1, ok);
  const many = Array.from({ length: 201 }, (_, i) => `u${i}@kiotviet.com`).join(',');
  check('send_email > 200 người nhận -> từ chối', env.post({ action: 'send_email', to: many, subject: 's', body: 'b', token: TOKEN }).status === 'error');
  const env2 = freshEnv({ API_TOKEN: TOKEN, ALLOWED_EMAIL_DOMAINS: 'kiotviet.com, citigo.com.vn' });
  check('ALLOWED_EMAIL_DOMAINS cấu hình nhiều domain', env2.post({ action: 'send_email', to: 'x@citigo.com.vn', subject: 's', body: 'b', token: TOKEN }).status === 'success');
}

// 6. Mật khẩu LMS
{
  const env = freshEnv({ API_TOKEN: TOKEN });
  const r = env.post({ courseId: '26KV99', groupName: 'SPCB', totalTrainees: 1, token: TOKEN, traineeDetails: [{ name: 'B', email: 'b@kiotviet.com', username: 'ub', password: 'NewSecret!' }] });
  const kq = env.sheets.KetQuaHocVien._data();
  const newRow = kq.find(row => row[1] === '26KV99');
  check('Nộp báo cáo -> thành công', r.status === 'success', r);
  check('Nộp báo cáo -> cột Password ghi rỗng', newRow && newRow[12] === '', newRow);
  check('Token không bị ghi vào sheet', JSON.stringify(env.sheets).indexOf(TOKEN) === -1);
  const g = env.get({ token: TOKEN });
  const kqDump = g.sheets && g.sheets.KetQuaHocVien;
  check('doGet đúng token -> thành công', g.status === 'success', g.message);
  check('doGet ẩn cột Password', kqDump && kqDump.headers.indexOf('Password') === -1 && JSON.stringify(kqDump).indexOf('OldSecret!') === -1);
  check('doGet ẩn sheet Settings', g.sheetList && g.sheetList.indexOf('Settings') === -1 && !g.sheets.Settings);
  check('doGet vẫn trả về MasterDB', Array.isArray(g.master) && g.master.length === 2 && g.master.some(m => m.courseId === '26KV99'), g.master);
  env.ctx.purgeStoredPasswords();
  check('purgeStoredPasswords() xóa mật khẩu cũ trong sheet', JSON.stringify(env.sheets.KetQuaHocVien._data()).indexOf('OldSecret!') === -1);
}

// 7. kv_api_url không đồng bộ
{
  const env = freshEnv({ API_TOKEN: TOKEN });
  const down = env.post({ action: 'sync_down', token: TOKEN });
  const payload = JSON.parse(down.payload);
  check('sync_down không trả về kv_api_url cũ trên Cloud', payload.kv_api_url === undefined && payload.kv_trainer_profile, payload);
  env.post({ action: 'sync_up', token: TOKEN, payload: JSON.stringify({ kv_api_url: 'https://evil.example/exec', kv_trainer_profile: '{"name":"Y"}' }) });
  const keys = env.sheets.Settings._data().map(r => r[0]);
  check('sync_up không lưu kv_api_url', keys.indexOf('kv_api_url') === -1 && keys.indexOf('kv_trainer_profile') !== -1, keys);
}

// 8. Action lạ & add_knowledge
{
  const env = freshEnv({ API_TOKEN: TOKEN });
  check('Action không xác định -> UNKNOWN_ACTION', env.post({ action: 'GET_DATA', courseId: 'X', token: TOKEN }).code === 'UNKNOWN_ACTION');
  check('Action lạ không ghi vào MasterDB', env.sheets.MasterDB._data().length === 2);
  check('add_knowledge URL file:// -> từ chối', env.post({ action: 'add_knowledge', url: 'file:///etc/passwd', token: TOKEN }).status === 'error');
  check('delete_knowledge thiếu id -> báo lỗi rõ ràng', env.post({ action: 'delete_knowledge', token: TOKEN }).status === 'error');
}

// 9. generateApiToken
{
  const props = {};
  const env = freshEnv(props);
  env.ctx.generateApiToken();
  check('generateApiToken() tạo token 64 ký tự', props.API_TOKEN && props.API_TOKEN.length === 64);
  const before = props.API_TOKEN;
  env.ctx.generateApiToken();
  check('generateApiToken() không ghi đè token đã có', props.API_TOKEN === before);
}

// 10. Sheet Kho quà bên ngoài (lỗi CORS 24/11: mở file không có quyền làm hỏng cả lượt doGet)
{
  const env = freshEnv({ API_TOKEN: TOKEN });
  const g = env.get({ token: TOKEN });
  check('Không cấu hình GIFT_SPREADSHEET_ID -> chỉ mở Sheet chính', env.openedIds.every(id => id === env.openedIds[0]) && env.openedIds.length >= 1, env.openedIds);
  check('Không cấu hình GIFT_SPREADSHEET_ID -> dùng tab KhoQua', g.gifts.length === 1 && g.gifts[0].name === 'Bình nước', g.gifts);
  check('Mã nguồn không còn ID Sheet Kho quà hardcode', code.indexOf('1amqxx2UojQPvK2hqJohvHZNjrw5LV0_V9FoZa_0qzRg') === -1);
  const env2 = freshEnv({ API_TOKEN: TOKEN, GIFT_SPREADSHEET_ID: 'EXTERNAL_GIFT_ID' });
  const g2 = env2.get({ token: TOKEN });
  check('Có GIFT_SPREADSHEET_ID hợp lệ -> đọc Kho quà bên ngoài', g2.gifts.length === 1 && g2.gifts[0].name === 'Túi' && g2.gifts[0].in === 50, g2.gifts);
  const env3 = freshEnv({ API_TOKEN: TOKEN, GIFT_SPREADSHEET_ID: 'NO_ACCESS_GIFT_ID' });
  const g3 = env3.get({ token: TOKEN });
  check('GIFT_SPREADSHEET_ID không có quyền -> vẫn trả dữ liệu, dùng KhoQua', g3.status === 'success' && g3.gifts[0].name === 'Bình nước', g3);
  const env4 = freshEnv({ API_TOKEN: TOKEN });
  check('debugDoGet() chạy được', (() => { try { env4.ctx.debugDoGet(); return true; } catch (e) { return false; } })());
}

// 11. Mirror files
{
  for (const f of ['trainer_database.js', 'trainer_database codejs.txt']) {
    check(`Mirror ${f} giống hệt code.js`, fs.readFileSync(path.join(ROOT, f), 'utf8') === code);
  }
}

const passed = results.filter(r => r.pass).length;
console.log(`\nKẾT QUẢ: ${passed}/${results.length} PASS`);
process.exit(passed === results.length ? 0 : 1);
