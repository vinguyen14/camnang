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
// Mô phỏng cách Sheets nhận giá trị như người dùng gõ: dấu ' đầu = ép văn bản (không lưu dấu '),
// chuỗi số thuần -> số, chuỗi bắt đầu bằng "=" -> công thức (đánh dấu để test phát hiện).
function sheetsInput(x) {
  if (typeof x !== 'string') return x;
  if (x.charAt(0) === "'") return x.substring(1);
  if (/^-?\d+(\.\d+)?$/.test(x.trim())) return Number(x);
  if (x.charAt(0) === '=') return { FORMULA: x };
  return x;
}

function makeSheet(name, rows) {
  let data = rows.map(r => r.slice());
  let hidden = false;
  return {
    _hidden: () => hidden,
    hideSheet: () => { hidden = true; },
    clearContents: () => { data = []; },
    getName: () => name,
    setName: (n) => { name = n; },
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
      setValues: (vals) => {
        if (vals.length !== nr || vals.some(v => v.length !== nc)) throw new Error('setValues: kích thước không khớp vùng ô');
        vals.forEach((v, i) => { data[row - 1 + i] = data[row - 1 + i] || []; v.forEach((x, j) => data[row - 1 + i][col - 1 + j] = sheetsInput(x)); });
      },
      clearContent: () => { for (let i = row - 1; i < row - 1 + nr; i++) for (let j = col - 1; j < col - 1 + nc; j++) if (data[i]) data[i][j] = ''; },
      };
    },
    appendRow: (r) => data.push(r.map(sheetsInput)),
    copyTo: (ss) => { const c = makeSheet(name + ' copy', data.map(r => r.slice())); ss._add(c); return c; },
    clear: () => { data = []; },
    deleteRow: (i) => data.splice(i - 1, 1),
    _data: () => data,
  };
}

function freshEnv(props, fetchResponder) {
  const sheets = {
    MasterDB: makeSheet('MasterDB', [['Timestamp', 'Nhóm Khóa', 'Mã Khóa'], [1, 'SPCB', '26KV01']]),
    KetQuaHocVien: makeSheet('KetQuaHocVien', [
      ["Timestamp", "Mã Khóa", "Nhóm Khóa", "STT", "Mã NV", "Họ Tên", "Phòng Ban", "Email Công Ty", "Lần Kiểm Tra", "Điểm", "Kết Quả", "Username LMS", "Password", "Điểm Danh"],
      ['t', 'OLD', 'SPCB', 1, 'NV1', 'A', 'D', 'a@kiotviet.com', '1', '90', 'Pass', 'u1', 'OldSecret!', 'x'],
    ]),
    Settings: makeSheet('Settings', [['Key', 'Value'], ['kv_api_url', "https://evil.example/exec"], ['kv_trainer_profile', '{"name":"X"}']]),
  };
  sheets.KhoQua = makeSheet('KhoQua', [['Tên Quà', 'Tồn Đầu', 'Xuất Kho', 'Tồn Cuối'], ['Bình nước', 30, 5, 25]]);
  const sentEmails = [];
  const fetched = [];
  const openedIds = [];
  let extraSheets = []; // sheet tạo bằng copyTo (đổi tên sau khi tạo)
  const allSheets = () => Object.values(sheets).concat(extraSheets);
  const ss = {
    getSheetByName: (n) => allSheets().find(s => s.getName() === n) || null,
    insertSheet: (n) => (sheets[n] = makeSheet(n, [])),
    getSheets: () => allSheets(),
    deleteSheet: (s) => { extraSheets = extraSheets.filter(x => x !== s); Object.keys(sheets).forEach(k => { if (sheets[k] === s) delete sheets[k]; }); },
    _add: (s) => { extraSheets.push(s); },
    getName: () => 'MockSS',
  };
  let lockHeld = false;
  const lockState = { busy: false, acquired: 0, released: 0 };
  const ctx = {
    console: { log: () => {} }, // Ẩn log thời gian của ask_ai khi chạy test
    SpreadsheetApp: { openById: (id) => {
      openedIds.push(id);
      if (id === 'NO_ACCESS_GIFT_ID') throw new Error('Bạn không có quyền truy cập vào tài liệu yêu cầu.');
      if (id === 'EXTERNAL_GIFT_ID') return { getSheetByName: (n) => n === 'Kho' ? makeSheet('Kho', [['h'], ['h'], ['Túi', '', '10.000', 50, 5, '']]) : null, getName: () => 'Kho quà' };
      return ss;
    } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (props[k] === undefined ? null : props[k]), setProperty: (k, v) => { props[k] = v; } }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ setMimeType: () => ({ body: JSON.parse(s), getContent: () => s }) }) },
    GmailApp: { sendEmail: (to, s, b) => sentEmails.push({ to, s, b }) },
    UrlFetchApp: { fetch: (url) => {
      fetched.push(url);
      const body = fetchResponder ? fetchResponder(url) : '{"candidates":[{"content":{"parts":[{"text":"ok"}]}}]}';
      return { getContentText: () => body };
    } },
    Utilities: { formatDate: (d, tz, fmt) => (fmt && fmt.indexOf('yyyyMMdd_') === 0 ? '20261124_1000' + String(Date.now() % 100).padStart(2, '0') : '2026-11-21 10:00:00'), getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', sleep: () => {} },
    Logger: { log: () => {} },
    LockService: { getScriptLock: () => ({
      tryLock: () => { if (lockState.busy || lockHeld) return false; lockHeld = true; lockState.acquired++; return true; },
      releaseLock: () => { if (lockHeld) { lockHeld = false; lockState.released++; } }
    }) },
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  const post = (obj) => ctx.doPost({ postData: { contents: JSON.stringify(obj) } }).body;
  const get = (params) => ctx.doGet({ parameter: params || {} }).body;
  return { ctx, sheets, ss, sentEmails, fetched, openedIds, post, get, props, lockState };
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
  // Tab KhoQua_Import (IMPORTRANGE) được ưu tiên, không mở file ngoài
  const env5 = freshEnv({ API_TOKEN: TOKEN, GIFT_SPREADSHEET_ID: 'NO_ACCESS_GIFT_ID' });
  env5.sheets.KhoQua_Import = makeSheet('KhoQua_Import', [['Túi tote', '', '45.000', 30, 8, ''], ['', '', '', '', '', ''], ['Áo mưa', '', '', 53, 9, '']]);
  const g5 = env5.get({ token: TOKEN });
  check('Có tab KhoQua_Import -> đọc từ IMPORTRANGE', g5.gifts.length === 2 && g5.gifts[0].name === 'Túi tote' && g5.gifts[0].in === 30 && g5.gifts[0].out === 8 && g5.gifts[1].cost === '-', g5.gifts);
  check('Có tab KhoQua_Import -> không mở file Kho quà ngoài', env5.openedIds.indexOf('NO_ACCESS_GIFT_ID') === -1, env5.openedIds);
  check('Tab KhoQua_Import bị ẩn khỏi danh sách sheet', g5.sheetList.indexOf('KhoQua_Import') === -1);
  const env6 = freshEnv({ API_TOKEN: TOKEN });
  env6.sheets.KhoQua_Import = makeSheet('KhoQua_Import', [['#REF!']]);
  const g6 = env6.get({ token: TOKEN });
  check('KhoQua_Import lỗi #REF! -> quay về tab KhoQua', g6.status === 'success' && g6.gifts.length === 1 && g6.gifts[0].name === 'Bình nước', g6.gifts);
  check('testAuth() chạy được khi có KhoQua_Import', (() => { try { env5.ctx.testAuth(); return true; } catch (e) { return false; } })());
  const env4 = freshEnv({ API_TOKEN: TOKEN });
  check('debugDoGet() chạy được', (() => { try { env4.ctx.debugDoGet(); return true; } catch (e) { return false; } })());
}

// 11. Gemini quá tải -> chuyển model dự phòng
{
  const BUSY = JSON.stringify({ error: { code: 503, status: 'UNAVAILABLE', message: 'This model is currently experiencing high demand.' } });
  const OK = (t) => JSON.stringify({ candidates: [{ content: { parts: [{ text: t }] } }] });
  const modelOf = (u) => decodeURIComponent(u.split('/models/')[1].split(':')[0]);

  check('Model mặc định không còn gemini-2.5-flash (đã ngừng cấp)', !/gemini-2\.5-flash/.test(code.split('DEFAULT_GEMINI_MODELS =')[1].split('\n')[0]));

  const env = freshEnv({ API_TOKEN: TOKEN, GEMINI_API_KEY: 'k' }, (u) => modelOf(u) === 'gemini-flash-lite-latest' ? BUSY : OK('từ ' + modelOf(u)));
  const r = env.post({ action: 'ask_ai', prompt: 'kho quà', token: TOKEN });
  check('Model chính quá tải -> tự chuyển model dự phòng và trả lời', r.reply === 'từ gemini-flash-latest' && env.fetched.length === 2, { reply: r.reply, n: env.fetched.length });

  const env2 = freshEnv({ API_TOKEN: TOKEN, GEMINI_API_KEY: 'k' }, () => BUSY);
  const r2 = env2.post({ action: 'ask_ai', prompt: 'x', token: TOKEN });
  check('Mọi model quá tải -> thử hết 3 model, báo bận kèm lý do từng model', env2.fetched.length === 3 && /đang bận/.test(r2.reply) && (r2.reply.match(/đang quá tải/g) || []).length === 3, { n: env2.fetched.length, reply: r2.reply });

  // Tình huống 24/11: model ngừng cấp cho người dùng mới
  const GONE = JSON.stringify({ error: { code: 404, status: 'NOT_FOUND', message: 'This model models/gemini-2.5-flash is no longer available to new users.' } });
  const env7 = freshEnv({ API_TOKEN: TOKEN, GEMINI_API_KEY: 'k', GEMINI_MODELS: 'gemini-2.5-flash, gemini-3.8-flash' }, (u) => modelOf(u) === 'gemini-2.5-flash' ? GONE : OK('ok 3.8'));
  check('Model ngừng hỗ trợ -> chuyển model kế tiếp', env7.post({ action: 'ask_ai', prompt: 'x', token: TOKEN }).reply === 'ok 3.8');
  const env8 = freshEnv({ API_TOKEN: TOKEN, GEMINI_API_KEY: 'k', GEMINI_MODELS: 'old-a, old-b' }, () => GONE);
  const r8 = env8.post({ action: 'ask_ai', prompt: 'x', token: TOKEN });
  check('Mọi model ngừng hỗ trợ -> nhắc Admin cập nhật GEMINI_MODELS', /GEMINI_MODELS/.test(r8.reply) && /không còn khả dụng/.test(r8.reply), r8.reply);

  const BADKEY = JSON.stringify({ error: { code: 400, status: 'INVALID_ARGUMENT', message: 'API key not valid.' } });
  const env3 = freshEnv({ API_TOKEN: TOKEN, GEMINI_API_KEY: 'k' }, () => BADKEY);
  const r3 = env3.post({ action: 'ask_ai', prompt: 'x', token: TOKEN });
  check('Sai key (lỗi cố định) -> không thử model khác', env3.fetched.length === 1 && /^⚠️ Lỗi từ Google AI: API key not valid/.test(r3.reply), { n: env3.fetched.length });

  const env4 = freshEnv({ API_TOKEN: TOKEN, GEMINI_API_KEY: 'k', GEMINI_MODELS: 'model-a, model-b' }, (u) => modelOf(u) === 'model-a' ? BUSY : OK('b'));
  const r4 = env4.post({ action: 'ask_ai', prompt: 'x', token: TOKEN });
  check('GEMINI_MODELS ghi đè danh sách model', r4.reply === 'b' && env4.fetched.map(modelOf).join() === 'model-a,model-b');
  check('Key Gemini không lộ trong câu trả lời lỗi', JSON.stringify(r2).indexOf('key=') === -1);

  // Câu trả lời chia nhiều part (lỗi mất chữ 24/11) -> ghép đủ, bỏ phần "thought"
  const MULTI = JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'suy nghĩ nội bộ', thought: true }, { text: '### 📊 TỔNG KẾT BÁO C' }, { text: 'ÁO\n- Ý 1\n- Ý 2' }] } }] });
  const env5 = freshEnv({ API_TOKEN: TOKEN, GEMINI_API_KEY: 'k' }, () => MULTI);
  const r5 = env5.post({ action: 'ask_ai', prompt: 'tổng kết', token: TOKEN });
  check('Câu trả lời nhiều part -> ghép đủ nội dung', r5.reply === '### 📊 TỔNG KẾT BÁO CÁO\n- Ý 1\n- Ý 2', r5.reply);
  const LONG = JSON.stringify({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'Rất dài' }] } }] });
  const env6 = freshEnv({ API_TOKEN: TOKEN, GEMINI_API_KEY: 'k' }, () => LONG);
  check('Bị cắt vì quá dài -> có ghi chú cho người dùng', /quá dài/.test(env6.post({ action: 'ask_ai', prompt: 'x', token: TOKEN }).reply));
}

// 12. Sprint 2 - Đồng bộ Cloud tin cậy
{
  const settingsMap = (env) => env.post({ action: 'sync_down', token: TOKEN });
  const down = (env) => JSON.parse(settingsMap(env).payload);
  const hasFormula = (env) => JSON.stringify(env.ss.getSheets().map(s => s._data ? s._data() : [])).indexOf('"FORMULA"') !== -1;

  // Khóa ghi
  const envL = freshEnv({ API_TOKEN: TOKEN });
  envL.post({ action: 'sync_up', token: TOKEN, payload: JSON.stringify({ kv_trainer_profile: '{"name":"A"}' }) });
  check('Khóa ghi: sync_up lấy khóa và luôn trả khóa', envL.lockState.acquired === 1 && envL.lockState.released === 1, envL.lockState);
  envL.lockState.busy = true;
  const busy = envL.post({ courseId: '26KV77', totalTrainees: 1, token: TOKEN });
  check('Khóa ghi: đang có người ghi -> báo BUSY, không ghi MasterDB', busy.code === 'BUSY' && !envL.sheets.MasterDB._data().some(r => r[2] === '26KV77'), busy);
  const envAI = freshEnv({ API_TOKEN: TOKEN, GEMINI_API_KEY: 'k' });
  envAI.lockState.busy = true;
  check('Khóa ghi: Trợ lý AI không bị chặn khi đang ghi', envAI.post({ action: 'ask_ai', prompt: 'x', token: TOKEN }).status === 'success');
  const envErr = freshEnv({ API_TOKEN: TOKEN });
  delete envErr.sheets.MasterDB;
  envErr.post({ courseId: 'X1', totalTrainees: 1, token: TOKEN });
  check('Khóa ghi: lỗi giữa chừng vẫn trả khóa', envErr.lockState.acquired === envErr.lockState.released);

  // Gộp thay vì xóa trắng
  const envM = freshEnv({ API_TOKEN: TOKEN });
  envM.post({ action: 'sync_up', token: TOKEN, payload: JSON.stringify({ kv_dynamic_calendar: '{"2027-1":{"kv1":"2027-01-14"}}', kv_roster_SPCB: 'roster cũ' }) });
  envM.post({ action: 'sync_up', token: TOKEN, payload: JSON.stringify({ kv_trainer_profile: '{"name":"Máy mới"}', kv_dynamic_calendar: null, kv_roster_SPCB: null }) });
  const d1 = down(envM);
  check('Backup từ máy mới (key null) KHÔNG xóa lịch & roster trên Cloud', d1.kv_dynamic_calendar === '{"2027-1":{"kv1":"2027-01-14"}}' && d1.kv_roster_SPCB === 'roster cũ' && d1.kv_trainer_profile === '{"name":"Máy mới"}', d1);

  // Bản sao lưu trước khi ghi đè
  const bks = () => envM.ss.getSheets().filter(s => s.getName().indexOf('Settings_bk_') === 0);
  check('Mỗi lần Backup tạo bản sao Settings (ẩn)', bks().length === 2 && bks().every(s => s._hidden()), bks().map(s => s.getName()));
  for (let i = 0; i < 6; i++) envM.post({ action: 'sync_up', token: TOKEN, payload: JSON.stringify({ kv_trainer_profile: '{"n":' + i + '}' }) });
  check('Chỉ giữ 5 bản sao lưu gần nhất', bks().length === 5, bks().length);
  const g = envM.get({ token: TOKEN });
  check('Bản sao lưu bị ẩn khỏi doGet', !g.sheetList.some(n => n.indexOf('Settings_bk_') === 0));

  // Chunk
  const big = 'x'.repeat(100000) + 'END';
  const envC = freshEnv({ API_TOKEN: TOKEN });
  envC.post({ action: 'sync_up', token: TOKEN, payload: JSON.stringify({ kv_global_whiteboard: big }) });
  check('Chunk: dữ liệu 100.000 ký tự ráp lại nguyên vẹn', down(envC).kv_global_whiteboard === big);
  const sRows = envC.sheets.Settings._data();
  const lastChunk = sRows.findIndex(r => /__chunk_2_of_3$/.test(r[0]));
  sRows.splice(lastChunk, 1);
  check('Chunk: thiếu 1 phần -> bỏ qua key, không trả JSON hỏng', down(envC).kv_global_whiteboard === undefined);

  // Giữ đúng kiểu dữ liệu, chặn công thức
  const envT = freshEnv({ API_TOKEN: TOKEN });
  envT.post({ action: 'sync_up', token: TOKEN, payload: JSON.stringify({
    kv_global_notepad: "'bắt đầu bằng nháy",
    kv_wp_docs: '=IMPORTXML("https://evil.example","//a")',
    kv_employee_db: JSON.stringify([{ email: 'a@kiotviet.com', name: '+Tên lạ', code: '00123' }]),
    kv_vault_items: JSON.stringify([{ id: '1700000000000', title: '=HYPERLINK("x")', createdAt: '2026-01-05', tags: '2026' }])
  }) });
  const dT = down(envT);
  check('Giá trị bắt đầu bằng dấu \' không bị mất ký tự', dT.kv_global_notepad === "'bắt đầu bằng nháy", dT.kv_global_notepad);
  check('Không có ô nào bị Sheets chạy như công thức', !hasFormula(envT));
  check('Nội dung "=IMPORTXML(...)" giữ nguyên văn', dT.kv_wp_docs === '=IMPORTXML("https://evil.example","//a")');
  const emp = JSON.parse(dT.kv_employee_db)[0], vi = JSON.parse(dT.kv_vault_items)[0];
  check('Mã NV "00123" giữ số 0 đầu', emp.code === '00123', emp);
  check('Vault: id dài, ngày tạo, tags số giữ nguyên dạng chuỗi', vi.id === '1700000000000' && vi.createdAt === '2026-01-05' && vi.tags === '2026' && vi.title === '=HYPERLINK("x")', vi);

  // Danh sách rỗng không xóa dữ liệu Cloud
  envT.post({ action: 'sync_up', token: TOKEN, payload: JSON.stringify({ kv_employee_db: '[]' }) });
  check('Gửi danh sách nhân sự rỗng KHÔNG xóa NhanSu trên Cloud', JSON.parse(down(envT).kv_employee_db).length === 1);

  // batch_upsert
  const envB = freshEnv({ API_TOKEN: TOKEN });
  const rB = envB.post({ action: 'batch_upsert', token: TOKEN, items: [
    { courseId: '26kv01', groupName: 'SPCB', totalTrainees: '30', passedTrainees: '27' },
    { courseId: '26KV20', groupName: 'SPCB', totalTrainees: 10, highlights: '=cmd()' },
    { courseId: 'TAX-11-26', groupName: 'TAX' },
    { groupName: 'thiếu mã' }
  ] });
  const mRows = envB.sheets.MasterDB._data();
  check('batch_upsert: 3 khóa ghi, 1 khóa thiếu mã bị bỏ qua', rB.upserted === 3 && rB.skipped === 1, rB);
  check('batch_upsert: cập nhật khóa cũ (không tạo trùng 26KV01)', mRows.filter(r => r[2] === '26KV01').length === 1 && mRows.find(r => r[2] === '26KV01')[6] === 30, mRows);
  check('batch_upsert: thêm khóa mới, không chạy công thức trong ghi chú', mRows.some(r => r[2] === '26KV20') && !hasFormula(envB));
  check('batch_upsert: không mặc định CSAT 4.8/5', mRows.find(r => r[2] === 'TAX-11-26')[9] === '');

  // Nộp lại kết quả học viên không bị trùng, không ảnh hưởng khóa khác
  const envK = freshEnv({ API_TOKEN: TOKEN });
  const tds = [{ name: 'A', email: 'a@kiotviet.com', code: '0007' }, { name: 'B', email: 'b@kiotviet.com' }];
  envK.post({ courseId: '26KV30', totalTrainees: 2, token: TOKEN, traineeDetails: tds });
  envK.post({ courseId: '26KV30', totalTrainees: 2, token: TOKEN, traineeDetails: tds });
  const kq = envK.sheets.KetQuaHocVien._data();
  check('Nộp lại kết quả 2 lần -> không trùng dòng học viên', kq.filter(r => r[1] === '26KV30').length === 2, kq.length);
  check('Nộp lại kết quả -> giữ nguyên dòng của khóa khác', kq.some(r => r[1] === 'OLD'));
  check('Mã NV "0007" của học viên giữ số 0 đầu', kq.find(r => r[1] === '26KV30' && r[5] === 'A')[4] === '0007');
}

// 13. Mirror files
{
  for (const f of ['trainer_database.js', 'trainer_database codejs.txt']) {
    check(`Mirror ${f} giống hệt code.js`, fs.readFileSync(path.join(ROOT, f), 'utf8') === code);
  }
}

const passed = results.filter(r => r.pass).length;
console.log(`\nKẾT QUẢ: ${passed}/${results.length} PASS`);
process.exit(passed === results.length ? 0 : 1);
