/**
 * TRAINER OS - ENTERPRISE BACKEND SCRIPT
 * Version: 5.0 Enterprise
 * Hỗ trợ: MasterDB 16 Cột, KetQuaHocVien 14 Cột (gắn Mã Khóa & Phân Hệ), Gemini 2.5 Flash, Multi-Sheet Scanner
 */

const SPREADSHEET_ID = '1_QQJxBMOc4DWqrSSuWno91EUaRV6FSRO8WlYXrbc9HI'; // ID Sheet của bạn
const SHEET_MASTER = 'MasterDB';
const SHEET_GIFT = 'KhoQua';
const SHEET_KNOWLEDGE = 'KnowledgeDB';
const SHEET_SOP = 'TrainerSOPs';
const SHEET_NHANSU = 'NhanSu';
const SHEET_VAULT_FOLDERS = 'VaultFolders';
const SHEET_VAULT_ITEMS = 'VaultItems';
const SHEET_SETTINGS = 'Settings';
const SHEET_TEMPLATES = 'Templates';
const SHEET_KETQUA_HOCVIEN = 'KetQuaHocVien';

// ============================================================================
// BẢO MẬT (Sprint 0 - 21/11/2026)
// Cấu hình trong Apps Script > Project Settings > Script Properties:
//   - API_TOKEN       (bắt buộc): chuỗi ngẫu nhiên >= 32 ký tự. Mọi request phải gửi kèm.
//   - ADMIN_PASSWORD  (bắt buộc cho clear_data): mật khẩu dài, KHÔNG có giá trị mặc định.
//   - GEMINI_API_KEY  (bắt buộc cho ask_ai): KHÔNG có giá trị mặc định.
//   - GEMINI_MODELS   (tùy chọn): danh sách model thử lần lượt khi quá tải, cách nhau dấu phẩy.
//   - ALLOWED_EMAIL_DOMAINS (tùy chọn): danh sách domain cách nhau dấu phẩy, mặc định "kiotviet.com".
//   - GIFT_SPREADSHEET_ID (tùy chọn): ID Google Sheet Kho quà bên ngoài (tab "Kho"). Chỉ đặt khi tài khoản
//     deploy CÓ QUYỀN XEM file đó. Khuyên dùng thay thế: tab KhoQua_Import với =IMPORTRANGE(...) trong Sheet chính.
// ============================================================================
const KNOWN_ACTIONS = ["clear_data", "save_gifts", "add_knowledge", "delete_knowledge", "ask_ai", "send_email", "sync_up", "sync_down", "batch_upsert", "submit_report"];
const SYNC_EXCLUDED_KEYS = ["kv_api_url", "kv_api_token"]; // Không bao giờ đồng bộ cấu hình kết nối lên/xuống Cloud
const HIDDEN_SHEETS_IN_DUMP = [SHEET_SETTINGS, 'KhoQua_Import']; // Không trả về trong doGet().sheets
const HIDDEN_COLUMNS_IN_DUMP = ["password", "mật khẩu", "mat khau"]; // Không trả về cột chứa mật khẩu
const MAX_EMAIL_RECIPIENTS = 200;

// ======================= ĐỒNG BỘ CLOUD TIN CẬY (Sprint 2 - 24/11/2026) =======================
const NO_LOCK_ACTIONS = ["ask_ai", "send_email"]; // Không đọc/ghi Sheet -> không cần khóa
const LOCK_WAIT_MS = 30000;
const SETTINGS_CHUNK_SIZE = 45000;            // Giới hạn 1 ô Google Sheets là 50.000 ký tự
const SETTINGS_BACKUP_PREFIX = 'Settings_bk_'; // Bản sao Settings trước mỗi lần Backup
const SETTINGS_BACKUP_KEEP = 5;
const SYNCED_SETTING_KEYS = [
  'kv_trainer_profile', 'kv_dynamic_calendar',
  'kv_global_notepad', 'kv_global_whiteboard', 'kv_master_db',
  'kv_gift_db', 'kv_roster_SPCB', 'kv_roster_KV1',
  'kv_employee_trash', 'kv_vault_trash', 'kv_product_radar',
  'kv_wp_docs', 'kv_wp_docs_v2', 'kv_survey_spcb', 'kv_survey_tax',
  'kv_doc_hub_backlog', 'kv_w3_compliance_done', 'kv_hrm_traceability'
];

// Ô VĂN BẢN: thêm dấu ' phía trước -> Google Sheets lưu NGUYÊN VĂN (dấu ' không được lưu):
// "00123" không thành 123, "2026-01-05" không thành ngày, "=IMPORTXML(...)" không chạy như công thức.
function textCell(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number' || typeof v === 'boolean' || v instanceof Date) return v;
  return "'" + String(v);
}

// Như textCell nhưng để số thuần (VD "20") là số thật - dùng cho MasterDB / KetQuaHocVien.
// Chuỗi số có số 0 ở đầu ("0007", mã NV) vẫn giữ là văn bản.
function cellForWrite(v) {
  if (typeof v === 'string' && /^-?(0|[1-9]\d*)(\.\d+)?$/.test(v.trim())) return v.trim();
  return textCell(v);
}

function normalizeCourseId(v) {
  return (v === null || v === undefined ? '' : String(v)).trim().toUpperCase();
}

// Đọc sheet Settings -> { key: value }, tự ráp các phần __chunk_i_of_N. Bỏ qua key thiếu chunk
// (trước đây ráp thiếu -> JSON hỏng được nạp thẳng vào máy).
function readSettingsMap(ss) {
  const sheet = ss.getSheetByName(SHEET_SETTINGS);
  const map = {};
  if (!sheet || sheet.getLastRow() < 2) return map;
  const rows = sheet.getDataRange().getValues();
  const chunks = {};
  for (let i = 1; i < rows.length; i++) {
    const key = String(rows[i][0] === null || rows[i][0] === undefined ? '' : rows[i][0]).trim();
    if (!key) continue;
    const val = rows[i][1] === null || rows[i][1] === undefined ? '' : String(rows[i][1]);
    const m = key.match(/^(.*?)__chunk_(\d+)_of_(\d+)$/);
    if (m) {
      if (!chunks[m[1]]) chunks[m[1]] = { total: parseInt(m[3], 10), parts: {} };
      chunks[m[1]].parts[parseInt(m[2], 10)] = val;
    } else {
      map[key] = val;
    }
  }
  Object.keys(chunks).forEach(k => {
    const c = chunks[k];
    let joined = '';
    for (let i = 0; i < c.total; i++) {
      if (!(i in c.parts)) { console.log('Settings: bỏ qua ' + k + ' vì thiếu phần ' + i + '/' + c.total); return; }
      joined += c.parts[i];
    }
    map[k] = joined;
  });
  return map;
}

// Ghi { key: value } vào Settings trong 1 lần setValues (tự chia chunk > 45.000 ký tự)
function writeSettingsMap(ss, map) {
  let sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet) sheet = ss.insertSheet(SHEET_SETTINGS);
  const rows = [["Key", "Value"]];
  Object.keys(map).forEach(k => {
    if (SYNC_EXCLUDED_KEYS.indexOf(k) !== -1) return;
    const raw = String(map[k]);
    if (raw.length > SETTINGS_CHUNK_SIZE) {
      const total = Math.ceil(raw.length / SETTINGS_CHUNK_SIZE);
      for (let c = 0; c < total; c++) {
        rows.push([k + "__chunk_" + c + "_of_" + total, textCell(raw.substring(c * SETTINGS_CHUNK_SIZE, (c + 1) * SETTINGS_CHUNK_SIZE))]);
      }
    } else {
      rows.push([k, textCell(raw)]);
    }
  });
  sheet.clear();
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
}

// Chụp bản sao sheet Settings (ẩn) trước khi ghi đè; giữ SETTINGS_BACKUP_KEEP bản mới nhất
function snapshotSettingsSheet(ss) {
  const sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet || sheet.getLastRow() < 2) return '';
  const baseName = SETTINGS_BACKUP_PREFIX + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss");
  let name = baseName;
  let n = 1;
  while (ss.getSheetByName(name)) name = baseName + '_' + (++n); // Trùng giây -> thêm _2, _3...
  const copy = sheet.copyTo(ss);
  copy.setName(name);
  try { copy.hideSheet(); } catch (e) {}
  ss.getSheets()
    .map(s => s.getName())
    .filter(nm => nm.indexOf(SETTINGS_BACKUP_PREFIX) === 0)
    .sort()
    .reverse()
    .slice(SETTINGS_BACKUP_KEEP)
    .forEach(nm => ss.deleteSheet(ss.getSheetByName(nm)));
  return name;
}

// Ghi đè 1 sheet danh sách CHỈ KHI máy gửi lên danh sách có dữ liệu. Danh sách rỗng/không gửi -> giữ nguyên Cloud.
function replaceListSheetIfProvided(ss, sheetName, headers, raw, mapper) {
  if (raw === undefined || raw === null || raw === '') return 'kept';
  let arr;
  try { arr = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return 'invalid'; }
  if (!Array.isArray(arr) || arr.length === 0) return 'kept';
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  const rows = [headers].concat(arr.map(o => mapper(o || {}).map(textCell)));
  sheet.clear();
  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
  return arr.length;
}

// Đọc sheet danh sách -> mảng object. Ngày -> chuỗi ISO, giá trị khác -> chuỗi (giữ boolean). null nếu chưa có dữ liệu.
function readListSheet(ss, sheetName, mapper) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return null;
  const rows = sheet.getDataRange().getValues().slice(1)
    .filter(r => r.some(c => c !== '' && c !== null && c !== undefined));
  return rows.map(r => mapper(r.map(c => {
    if (typeof c === 'boolean') return c;
    if (c instanceof Date) return Utilities.formatDate(c, "GMT+7", "yyyy-MM-dd'T'HH:mm:ss");
    return c === null || c === undefined ? '' : String(c);
  })));
}

const MASTER_HEADERS = ["Timestamp", "Nhóm Khóa", "Mã Khóa", "Tháng", "Bắt Đầu", "Kết Thúc", "Tổng HV", "Đạt", "Fail", "CSAT", "Highlights", "Issues", "ActionPlan", "Trạng Thái", "Link DS", "Link Quiz"];

function masterRowFromItem(d, courseId) {
  return [
    d.timestamp || new Date().getTime(), d.groupName || "Chung", courseId, d.month || "",
    d.startDate || "", d.finishDate || "", d.totalTrainees || 0, d.passedTrainees || 0, d.failedTrainees || 0,
    d.csat || "", // Sprint 1: không mặc định 4.8/5
    d.highlights || "", d.issues || "", d.actionPlan || "", d.status || "Hoàn thành", d.listLink || "", d.quizLink || ""
  ];
}

// Thêm mới / cập nhật nhiều khóa học trong MasterDB: đọc 1 lần, sửa trong bộ nhớ, ghi lại 1 lần
function upsertMasterRows(ss, items) {
  const sheet = ss.getSheetByName(SHEET_MASTER);
  if (!sheet) return { error: "Sheet MasterDB không tồn tại", upserted: 0, skipped: items.length };
  const values = sheet.getLastRow() > 0 ? sheet.getDataRange().getValues() : [MASTER_HEADERS.slice()];
  const index = {};
  for (let i = 1; i < values.length; i++) {
    const id = normalizeCourseId(values[i][2]);
    if (id && !(id in index)) index[id] = i;
  }
  let upserted = 0, skipped = 0;
  items.forEach(item => {
    const id = normalizeCourseId(item && item.courseId);
    if (!id) { skipped++; return; }
    const row = masterRowFromItem(item, id);
    if (id in index) values[index[id]] = row;
    else { index[id] = values.length; values.push(row); }
    upserted++;
  });
  const width = MASTER_HEADERS.length;
  const out = values.map(r => {
    const row = r.slice(0, width);
    while (row.length < width) row.push('');
    return row.map(cellForWrite);
  });
  sheet.getRange(1, 1, out.length, width).setValues(out);
  return { upserted: upserted, skipped: skipped };
}

const RESULT_HEADERS = ["Timestamp", "Mã Khóa", "Nhóm Khóa", "STT", "Mã NV", "Họ Tên", "Phòng Ban", "Email Công Ty", "Lần Kiểm Tra", "Điểm", "Kết Quả", "Username LMS", "Password", "Điểm Danh"];

// Thay toàn bộ dòng học viên của 1 khóa trong KetQuaHocVien (nộp lại không bị trùng), ghi 1 lần
function replaceCourseRowsInResultSheet(ss, courseId, newRows) {
  let sheet = ss.getSheetByName(SHEET_KETQUA_HOCVIEN);
  if (!sheet) { sheet = ss.insertSheet(SHEET_KETQUA_HOCVIEN); }
  const width = RESULT_HEADERS.length;
  const existing = sheet.getLastRow() > 0 ? sheet.getDataRange().getValues() : [RESULT_HEADERS.slice()];
  const kept = [existing[0]].concat(existing.slice(1).filter(r => normalizeCourseId(r[1]) !== courseId));
  const all = kept.concat(newRows).map(r => {
    const row = r.slice(0, width);
    while (row.length < width) row.push('');
    return row.map(cellForWrite);
  });
  sheet.clearContents();
  sheet.getRange(1, 1, all.length, width).setValues(all);
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getScriptProp(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

// So sánh chuỗi thời gian hằng (tránh dò từng ký tự)
function safeEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Fail-closed: nếu chưa cấu hình API_TOKEN (hoặc quá ngắn) thì từ chối mọi request
function isAuthorized(token) {
  const expected = getScriptProp('API_TOKEN');
  if (!expected || expected.length < 16) return false;
  return safeEquals(String(token || ''), expected);
}

function unauthorizedResponse() {
  return jsonOut({ status: "error", code: "UNAUTHORIZED", message: "Thiếu hoặc sai API Token. Vào Cài đặt > Kết nối Cloud để nhập token." });
}

// Tab chứa =IMPORTRANGE("<link Sheet Kho quà>"; "Kho!A3:F") - cùng bố cục cột với tab "Kho" gốc:
// A: Tên quà | B: (bỏ qua) | C: Đơn giá | D: Tồn đầu | E: Xuất kho | F: (bỏ qua)
const SHEET_GIFT_IMPORT = 'KhoQua_Import';

function parseKhoRows(rows) {
  const gifts = [];
  (rows || []).forEach(r => {
    const name = String(r[0] ?? '').trim();
    if (!name || name.charAt(0) === '#') return; // Bỏ dòng trống và lỗi IMPORTRANGE (#REF!, #N/A...)
    gifts.push({
      name: name,
      in: parseInt(r[3]) || 0,
      out: parseInt(r[4]) || 0,
      cost: r[2] ? String(r[2]) : '-'
    });
  });
  return gifts;
}

function readGiftImportTab(ss) {
  const sheet = ss.getSheetByName(SHEET_GIFT_IMPORT);
  if (!sheet || sheet.getLastRow() < 1) return [];
  return parseKhoRows(sheet.getDataRange().getValues());
}

// Danh sách model Gemini thử lần lượt. Ghi đè bằng Script Property GEMINI_MODELS (cách nhau dấu phẩy).
// Thứ tự: model nhẹ, phản hồi nhanh nhất trước; model suy luận (chậm hơn) làm dự phòng.
// Các alias "-latest" được Google tự trỏ tới bản mới nhất, không bị ngừng hỗ trợ.
const DEFAULT_GEMINI_MODELS = ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.8-flash'];

function getGeminiModels() {
  const raw = getScriptProp('GEMINI_MODELS');
  const list = raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
  return list.length > 0 ? list : DEFAULT_GEMINI_MODELS;
}

// Ghép TẤT CẢ các phần văn bản của câu trả lời (model mới hay chia câu trả lời dài thành nhiều part),
// bỏ qua phần "suy nghĩ" (thought) của model. Báo rõ nếu Google cắt câu trả lời vì quá dài.
function extractGeminiText(json) {
  const cand = json && json.candidates && json.candidates[0];
  if (!cand || !cand.content || !Array.isArray(cand.content.parts)) return '';
  const text = cand.content.parts
    .filter(p => p && typeof p.text === 'string' && !p.thought)
    .map(p => p.text)
    .join('');
  if (!text) return '';
  if (cand.finishReason === 'MAX_TOKENS') {
    return text + '\n\n_(Câu trả lời quá dài nên bị cắt bớt. Hãy hỏi cụ thể hơn hoặc chia nhỏ yêu cầu.)_';
  }
  return text;
}

// Phân loại lỗi Gemini:
//   'unavailable' - model không tồn tại / ngừng hỗ trợ (404, "no longer available") -> chuyển model ngay
//   'busy'        - quá tải / vượt hạn mức (503, 429, 500, "high demand")            -> chờ rồi chuyển model
//   'fatal'       - lỗi cố định (sai key, nội dung bị chặn...)                        -> dừng, báo ngay
function classifyGeminiError(err) {
  const code = Number(err.code) || 0;
  const status = String(err.status || '');
  const msg = String(err.message || '').toLowerCase();
  if (code === 404 || status === 'NOT_FOUND' || msg.indexOf('no longer available') !== -1 ||
      msg.indexOf('is not found') !== -1 || msg.indexOf('not supported for generatecontent') !== -1) {
    return 'unavailable';
  }
  if (code === 503 || code === 429 || code === 500 || status === 'UNAVAILABLE' || status === 'RESOURCE_EXHAUSTED' ||
      msg.indexOf('high demand') !== -1 || msg.indexOf('overloaded') !== -1) {
    return 'busy';
  }
  return 'fatal';
}

function isTransientGeminiError(err) {
  return classifyGeminiError(err) !== 'fatal';
}

function buildGeminiFailureMessage(failures) {
  const last = failures[failures.length - 1];
  if (last.kind === 'fatal') return "⚠️ Lỗi từ Google AI: " + last.message;
  const shorten = (s) => s.length > 90 ? s.substring(0, 90) + '…' : s;
  const reasons = failures.map(f => "- " + f.model + ": " + (f.kind === 'busy' ? 'đang quá tải' : 'không còn khả dụng') + " (" + shorten(f.message) + ")").join("\n");
  if (failures.every(f => f.kind === 'unavailable')) {
    return "⚠️ Các model AI đang cấu hình không còn khả dụng. Admin cần cập nhật Script Property GEMINI_MODELS.\n" + reasons;
  }
  return "⚠️ Trợ lý AI đang bận, vui lòng thử lại sau ít phút.\n" + reasons;
}

function getAllowedEmailDomains() {
  const raw = getScriptProp('ALLOWED_EMAIL_DOMAINS') || 'kiotviet.com';
  return raw.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (!isAuthorized(data.token)) return unauthorizedResponse();
    delete data.token;

    // Action không xác định -> báo lỗi rõ ràng thay vì rơi vào nhánh ghi MasterDB
    if (data.action && KNOWN_ACTIONS.indexOf(data.action) === -1) {
      return jsonOut({ status: "error", code: "UNKNOWN_ACTION", message: "Action không hợp lệ: " + String(data.action).substring(0, 50) });
    }

    // Sprint 2: KHÓA GHI - mỗi lúc chỉ 1 yêu cầu được đọc/ghi Sheet, tránh 2 người sync cùng lúc
    // làm sheet trống giữa chừng, trùng hoặc mất dòng. AI và gửi email không chạm Sheet nên không cần khóa.
    const needsLock = NO_LOCK_ACTIONS.indexOf(data.action) === -1;
    const lock = needsLock ? LockService.getScriptLock() : null;
    if (lock && !lock.tryLock(LOCK_WAIT_MS)) {
      return jsonOut({ status: "error", code: "BUSY", message: "Hệ thống đang bận ghi dữ liệu của người khác, vui lòng thử lại sau vài giây." });
    }
    try {
      return routePost(data, SpreadsheetApp.openById(SPREADSHEET_ID));
    } finally {
      if (lock) lock.releaseLock();
    }
  } catch (error) {
    return jsonOut({ status: "error", message: error.message });
  }
}

function routePost(data, ss) {
    // 1. XÓA DATA BÁO CÁO CÓ MẬT KHẨU
    if(data.action === "clear_data") {
      const adminPwd = getScriptProp('ADMIN_PASSWORD');
      if (!adminPwd) {
        return jsonOut({ status: "error", message: "Chưa cấu hình ADMIN_PASSWORD trong Script Properties" });
      }
      if(safeEquals(String(data.pwd || ''), adminPwd)) {
        const sheet = ss.getSheetByName(SHEET_MASTER);
        if(sheet && sheet.getLastRow() > 1) {
          sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
        }
        return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Đã xóa sạch CSDL" })).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Sai mật khẩu" })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 2. LƯU DỮ LIỆU KHO QUÀ
    else if(data.action === "save_gifts") {
      let sheetGift = ss.getSheetByName(SHEET_GIFT);
      if(!sheetGift) sheetGift = ss.insertSheet(SHEET_GIFT);
      sheetGift.clear();
      sheetGift.appendRow(["Tên Quà", "Tồn Đầu", "Xuất Kho", "Tồn Cuối"]);
      if(data.gifts && data.gifts.length > 0) {
        const rows = data.gifts.map(g => [textCell(g.name), parseInt(g.in) || 0, parseInt(g.out) || 0, (parseInt(g.in) || 0) - (parseInt(g.out) || 0)]);
        sheetGift.getRange(2, 1, rows.length, 4).setValues(rows);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
   
    // 3. THÊM TÀI LIỆU KNOWLEDGE
    else if (data.action === "add_knowledge") {
      let sheetK = ss.getSheetByName(SHEET_KNOWLEDGE);
      if(!sheetK) sheetK = ss.insertSheet(SHEET_KNOWLEDGE);
      const newId = new Date().getTime();
      if (!/^https?:\/\//i.test(String(data.url || ''))) {
        return jsonOut({ status: "error", message: "URL tài liệu phải bắt đầu bằng http:// hoặc https://" });
      }
      let fetchedHtml = "";
      try {
        let response = UrlFetchApp.fetch(data.url, { muteHttpExceptions: true });
        fetchedHtml = response.getContentText();
        let bodyMatch = fetchedHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if(bodyMatch) fetchedHtml = bodyMatch[1];
      } catch(err) { 
        fetchedHtml = "<p>Lỗi không cào được dữ liệu từ link này.</p>"; 
      }

      sheetK.appendRow([newId, data.node, data.title, data.url, fetchedHtml, data.industry || 'retail', data.role || 'Tất cả']);
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. XÓA TÀI LIỆU KNOWLEDGE
    else if (data.action === "delete_knowledge") {
      let sheetK = ss.getSheetByName(SHEET_KNOWLEDGE);
      if(sheetK) {
        let kData = sheetK.getDataRange().getValues();
        const idToDelete = String(data.id ?? '');
        if (!idToDelete) return jsonOut({ status: "error", message: "Thiếu id tài liệu" });
        for (let i = 1; i < kData.length; i++) {
          if (String(kData[i][0]) === idToDelete) {
            sheetK.deleteRow(i + 1);
            return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Not found" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 5. TÍCH HỢP AI GEMINI FLASH LATEST (TỐI ƯU NHẤT CHO ENTERPRISE L&D: TỐC ĐỘ CAO, ĐỘ CHÍNH XÁC VÀ SUY LUẬN XUẤT SẮC)
    else if (data.action === "ask_ai") {
      // Khóa API CHỈ đọc từ Script Properties - không có giá trị mặc định trong mã nguồn
      const GEMINI_API_KEY = getScriptProp('GEMINI_API_KEY');
      if (!GEMINI_API_KEY) {
        return jsonOut({ status: "error", message: "Chưa cấu hình GEMINI_API_KEY trong Script Properties" });
      }

      const payload = {
        "contents": [{ "parts": [{ "text": data.prompt }] }],
        "systemInstruction": { 
          "parts": [{ "text": "Bạn là Kevin - Trợ lý Đào tạo (L&D Director) của KiotViet. Luôn trả lời chuyên nghiệp, ngắn gọn, cấu trúc rõ ràng bằng gạch đầu dòng (-). Khung chat chỉ hiển thị được **chữ đậm**, *chữ nghiêng* và xuống dòng: KHÔNG dùng tiêu đề Markdown (#, ##, ###), bảng hay khối code; thay tiêu đề bằng một dòng **chữ đậm**." }]
        },
        "generationConfig": { "maxOutputTokens": 8192 }
      };
      
      const options = {
        "method": "post",
        "contentType": "application/json",
        "payload": JSON.stringify(payload),
        "muteHttpExceptions": true
      };
      
      try {
        // Thử lần lượt từng model; model bị quá tải / giới hạn tạm thời -> chờ ngắn rồi chuyển model dự phòng
        const models = getGeminiModels();
        let aiText = "Xin lỗi, hiện tại tôi đang xử lý tác vụ khác. Hãy thử lại sau giây lát!";
        const failures = []; // { model, kind: 'busy' | 'unavailable' | 'fatal', message }
        let answered = false;
        for (let m = 0; m < models.length; m++) {
          const url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(models[m]) + ":generateContent?key=" + GEMINI_API_KEY;
          let json;
          const t0 = Date.now();
          try {
            json = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());
          } catch (fetchErr) {
            failures.push({ model: models[m], kind: 'busy', message: 'Không kết nối được' });
            continue;
          } finally {
            // Ghi thời gian từng model vào nhật ký "Lượt thực thi" để chẩn đoán độ chậm
            console.log('ask_ai ' + models[m] + ': ' + (Date.now() - t0) + ' ms' + (json && json.error ? ' (lỗi ' + (json.error.code || '') + ')' : ''));
          }
          if (json.error) {
            const kind = classifyGeminiError(json.error);
            failures.push({ model: models[m], kind: kind, message: String(json.error.message || json.error.status || 'Lỗi không xác định') });
            if (kind === 'busy') {
              if (m < models.length - 1) Utilities.sleep(800);
              continue; // Quá tải -> thử model kế tiếp
            }
            if (kind === 'unavailable') continue; // Model ngừng hỗ trợ / sai tên -> thử model kế tiếp ngay
            break; // Lỗi cố định (sai key, nội dung bị chặn...) -> không thử tiếp
          }
          const candidateText = extractGeminiText(json);
          if (candidateText) {
            aiText = candidateText;
            answered = true;
            break;
          }
          failures.push({ model: models[m], kind: 'busy', message: 'Câu trả lời trống' });
        }
        if (!answered && failures.length > 0) {
          aiText = buildGeminiFailureMessage(failures);
        }

        return ContentService.createTextOutput(JSON.stringify({ status: "success", reply: aiText })).setMimeType(ContentService.MimeType.JSON);
      } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: e.toString() })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 6. GỬI EMAIL TỰ ĐỘNG QUA GMAIL
    else if (data.action === "send_email") {
      try {
        // Chỉ cho phép gửi tới domain công ty, giới hạn số người nhận
        const recipients = String(data.to || '').split(/[,;\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
        if (recipients.length === 0) return jsonOut({ status: "error", message: "Không có người nhận" });
        if (recipients.length > MAX_EMAIL_RECIPIENTS) return jsonOut({ status: "error", message: "Vượt quá " + MAX_EMAIL_RECIPIENTS + " người nhận" });
        const allowedDomains = getAllowedEmailDomains();
        const invalid = recipients.filter(r => {
          const at = r.lastIndexOf('@');
          return at < 1 || allowedDomains.indexOf(r.substring(at + 1)) === -1;
        });
        if (invalid.length > 0) {
          return jsonOut({ status: "error", message: "Email ngoài domain được phép (" + allowedDomains.join(', ') + "): " + invalid.slice(0, 5).join(', ') });
        }
        if (!data.subject || !data.body) return jsonOut({ status: "error", message: "Thiếu tiêu đề hoặc nội dung email" });
        GmailApp.sendEmail(recipients.join(','), String(data.subject), String(data.body));
        return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
      } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: e.toString() })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 7. ĐỒNG BỘ CẤU HÌNH LÊN CLOUD (SYNC UP)
    // Sprint 2: GỘP thay vì xóa trắng - key nào máy gửi lên (khác null) thì ghi đè, key nào không gửi thì GIỮ NGUYÊN
    // bản trên Cloud (trước đây Backup từ máy mới chưa Restore sẽ xóa sạch lịch, roster... trên Cloud).
    // Luôn chụp bản sao Settings trước khi ghi đè (giữ 5 bản gần nhất) để khôi phục khi cần.
    else if (data.action === "sync_up") {
      const payloadData = typeof data.payload === 'string' ? JSON.parse(data.payload) : (data.payload || {});
      const backupName = snapshotSettingsSheet(ss);

      const current = readSettingsMap(ss);
      let updatedKeys = 0;
      SYNCED_SETTING_KEYS.forEach(k => {
        const v = payloadData[k];
        if (v === undefined || v === null || v === '') return;
        current[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
        updatedKeys++;
      });
      writeSettingsMap(ss, current);

      const listResults = {
        employees: replaceListSheetIfProvided(ss, SHEET_NHANSU, ["Email", "Họ Tên", "Phòng Ban", "Vị Trí", "Vai Trò", "Mã NV"],
          payloadData.kv_employee_db, e => [e.email, e.name, e.dept, e.position, e.role, e.code]),
        vaultFolders: replaceListSheetIfProvided(ss, SHEET_VAULT_FOLDERS, ["Folder ID", "Parent ID", "Tên Thư Mục", "Icon", "Order", "Is Expanded"],
          payloadData.kv_vault_folders, f => [f.id, f.parentId, f.name, f.icon || "fa-folder", Number(f.order) || 0, f.isExpanded !== false]),
        vaultItems: replaceListSheetIfProvided(ss, SHEET_VAULT_ITEMS, ["Item ID", "Folder ID", "Tiêu đề", "Phân loại", "Nội dung", "Ghi chú", "Tags", "Is Pinned", "Ngày tạo", "Order"],
          payloadData.kv_vault_items, i => [i.id, i.folderId, i.title, i.type || "link", i.content, i.note, i.tags, Boolean(i.isPinned), i.createdAt, Number(i.order) || 0])
      };

      return jsonOut({ status: "success", updatedKeys: updatedKeys, lists: listResults, backup: backupName });
    }

    // 8. TẢI CẤU HÌNH TỪ CLOUD (SYNC DOWN)
    else if (data.action === "sync_down") {
      const configData = readSettingsMap(ss);
      SYNC_EXCLUDED_KEYS.forEach(k => { delete configData[k]; });

      const nhanSu = readListSheet(ss, SHEET_NHANSU, r => ({
        email: r[0], name: r[1], dept: r[2], position: r[3], role: r[4], code: r[5]
      }));
      if (nhanSu) configData['kv_employee_db'] = JSON.stringify(nhanSu);

      const folders = readListSheet(ss, SHEET_VAULT_FOLDERS, r => ({
        id: r[0], parentId: r[1] ? r[1] : null, name: r[2], icon: r[3] || 'fa-folder',
        order: parseInt(r[4]) || 0,
        isExpanded: r[5] !== '' ? (r[5] === true || String(r[5]).toLowerCase() === 'true') : true
      }));
      if (folders) configData['kv_vault_folders'] = JSON.stringify(folders);

      const items = readListSheet(ss, SHEET_VAULT_ITEMS, r => ({
        id: r[0], folderId: r[1], title: r[2], type: r[3] || 'link', content: r[4], note: r[5], tags: r[6],
        isPinned: r[7] === true || String(r[7]).toLowerCase() === 'true',
        createdAt: r[8], order: parseInt(r[9]) || 0
      }));
      if (items) configData['kv_vault_items'] = JSON.stringify(items);

      return jsonOut({ status: "success", payload: JSON.stringify(configData) });
    }

    // 8b. GHI NHIỀU KHÓA HỌC VÀO MASTERDB TRONG 1 LẦN (Backup từ trang Cài đặt)
    // Sprint 2: thay cho việc gửi từng khóa một (N request, lỗi bị nuốt im lặng)
    else if (data.action === "batch_upsert") {
      const items = Array.isArray(data.items) ? data.items : [];
      if (items.length === 0) return jsonOut({ status: "success", upserted: 0 });
      if (items.length > 2000) return jsonOut({ status: "error", message: "Quá nhiều khóa học trong 1 lần (tối đa 2000)" });
      const result = upsertMasterRows(ss, items);
      return jsonOut({ status: "success", upserted: result.upserted, skipped: result.skipped });
    }

    // 9. ĐÓNG KHÓA VÀO MASTER DB VÀ TAB KETQUAHOCVIEN (TOÀN DIỆN 100%)
    else {
      const courseIdToMatch = normalizeCourseId(data.courseId);
      if (!courseIdToMatch) {
        return jsonOut({ status: "error", message: "Thiếu Mã Khóa (courseId)" });
      }
      const result = upsertMasterRows(ss, [data]);
      if (result.error) return jsonOut({ status: "error", message: result.error });

      // 9.2. Chi tiết từng học viên vào KetQuaHocVien: đọc 1 lần, bỏ dòng cũ của khóa này, ghi lại 1 lần
      if (data.traineeDetails && Array.isArray(data.traineeDetails) && data.traineeDetails.length > 0) {
        const timeNowStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
        const newRows = data.traineeDetails.map((t, idx) => [
          timeNowStr, courseIdToMatch, data.groupName || "", t.stt || (idx + 1), t.code, t.name, t.dept, t.email,
          t.attempt || "1", t.score, t.result, t.username,
          "", // Sprint 0: KHÔNG lưu mật khẩu LMS lên Sheet (giữ cột để không lệch cấu trúc)
          t.attendance
        ]);
        replaceCourseRowsInResultSheet(ss, courseIdToMatch, newRows);
      }

      return jsonOut({ status: "success" });
    }
}

function doGet(e) {
  try {
    const token = e && e.parameter ? e.parameter.token : '';
    if (!isAuthorized(token)) return unauthorizedResponse();

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
   
    let master = []; 
    const sheetMaster = ss.getSheetByName(SHEET_MASTER);
    if(sheetMaster && sheetMaster.getLastRow() > 1) {
      const dataMaster = sheetMaster.getDataRange().getValues();
      const headers = ["timestamp", "groupName", "courseId", "month", "startDate", "finishDate", "totalTrainees", "passedTrainees", "failedTrainees", "csat", "highlights", "issues", "actionPlan", "status", "listLink", "quizLink"];
      for (let i = 1; i < dataMaster.length; i++) { 
        let rowData = {}; 
        for (let j = 0; j < headers.length; j++) rowData[headers[j]] = dataMaster[i][j]; 
        master.push(rowData); 
      }
    }

    // KHO QUÀ - thứ tự ưu tiên:
    //   1. Tab KhoQua_Import trong Sheet chính (=IMPORTRANGE từ Sheet Kho quà gốc, tự cập nhật)
    //   2. Sheet Kho quà ngoài qua Script Property GIFT_SPREADSHEET_ID (tài khoản deploy phải có quyền xem)
    //   3. Tab KhoQua trong Sheet chính (do trang Tools lưu)
    // Lưu ý: mở một file không có quyền sẽ khiến Google đánh dấu cả lượt chạy thất bại dù đã try/catch
    // -> Web App trả trang lỗi (CORS). Vì vậy ưu tiên IMPORTRANGE, không mở file ngoài khi không cần.
    let gifts = readGiftImportTab(ss);
    if (gifts.length === 0) {
      const externalGiftId = getScriptProp('GIFT_SPREADSHEET_ID');
      if (externalGiftId) {
        try {
          const sheetKho = SpreadsheetApp.openById(externalGiftId).getSheetByName('Kho');
          if (sheetKho && sheetKho.getLastRow() >= 3) {
            gifts = parseKhoRows(sheetKho.getRange("A3:F" + sheetKho.getLastRow()).getValues());
          }
        } catch(err) {
          gifts = [];
        }
      }
    }
    if (gifts.length === 0) {
      let localGiftSheet = ss.getSheetByName(SHEET_GIFT);
      if(localGiftSheet && localGiftSheet.getLastRow() > 1) {
        const localGData = localGiftSheet.getDataRange().getValues();
        for(let i = 1; i < localGData.length; i++) {
          gifts.push({
            name: localGData[i][0].toString().trim(),
            in: parseInt(localGData[i][1]) || 0,
            out: parseInt(localGData[i][2]) || 0,
            cost: '-'
          });
        }
      }
    }

    let knowledge = []; 
    const sheetKnowledge = ss.getSheetByName(SHEET_KNOWLEDGE);
    if(sheetKnowledge && sheetKnowledge.getLastRow() > 1) {
      const kData = sheetKnowledge.getDataRange().getValues();
      for(let i = 1; i < kData.length; i++) {
        knowledge.push({ id: kData[i][0], node: kData[i][1], title: kData[i][2], url: kData[i][3], html: kData[i][4], industry: kData[i][5] || 'retail', role: kData[i][6] || 'Tất cả' });
      }
    }

    let sops = []; 
    const sheetSOP = ss.getSheetByName(SHEET_SOP);
    if(sheetSOP && sheetSOP.getLastRow() > 1) {
      const sopData = sheetSOP.getDataRange().getValues();
      for(let i = 1; i < sopData.length; i++) {
        sops.push({ courseId: sopData[i][0] ? sopData[i][0].toString() : "", stepOrder: sopData[i][1] || 0, stepName: sopData[i][2] || "", stepDesc: sopData[i][3] || "" });
      }
    }

    let templates = []; 
    const sheetTpl = ss.getSheetByName(SHEET_TEMPLATES);
    if(sheetTpl && sheetTpl.getLastRow() > 1) {
      const tplData = sheetTpl.getDataRange().getValues();
      for(let i = 1; i < tplData.length; i++) {
        templates.push({ id: tplData[i][0], content: tplData[i][1] });
      }
    }

    let sheets = {};
    let sheetList = [];
    const allSheets = ss.getSheets();
    
    allSheets.forEach(s => {
      const sName = s.getName();
      if (HIDDEN_SHEETS_IN_DUMP.indexOf(sName) !== -1 || sName.indexOf(SETTINGS_BACKUP_PREFIX) === 0) return; // Ẩn sheet cấu hình nội bộ & bản sao lưu
      sheetList.push(sName);
      if(s.getLastRow() > 0) {
        const rawValues = s.getDataRange().getValues();
        if(rawValues.length > 0) {
          const allHeaders = rawValues[0].map(h => h.toString().trim());
          // Loại bỏ cột mật khẩu khỏi dữ liệu trả về
          const keepIdx = [];
          allHeaders.forEach((h, idx) => { if (HIDDEN_COLUMNS_IN_DUMP.indexOf(h.toLowerCase()) === -1) keepIdx.push(idx); });
          const headers = keepIdx.map(idx => allHeaders[idx]);
          const items = [];
          for(let r = 1; r < rawValues.length; r++) {
            let rowObj = {};
            keepIdx.forEach(c => {
              rowObj[allHeaders[c]] = rawValues[r][c];
            });
            items.push(rowObj);
          }
          sheets[sName] = { headers: headers, items: items };
        } else {
          sheets[sName] = { headers: [], items: [] };
        }
      } else {
        sheets[sName] = { headers: [], items: [] };
      }
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      master: master, 
      gifts: gifts, 
      knowledge: knowledge, 
      sops: sops, 
      templates: templates,
      sheets: sheets,
      sheetList: sheetList
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) { 
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.message })).setMimeType(ContentService.MimeType.JSON); 
  }
}

// HÀM KIỂM TRA KẾT NỐI & KÍCH HOẠT ỦY QUYỀN TRUY CẬP (Chọn hàm này và bấm "Chạy" trên Apps Script)
function testAuth() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Logger.log("✅ Đã kết nối thành công tới Sheet: " + ss.getName());
  const props = PropertiesService.getScriptProperties();
  ['API_TOKEN', 'ADMIN_PASSWORD', 'GEMINI_API_KEY'].forEach(k => {
    Logger.log((props.getProperty(k) ? "✅ " : "❌ CHƯA CẤU HÌNH ") + k);
  });
  const importGifts = readGiftImportTab(ss);
  if (importGifts.length > 0) {
    Logger.log("✅ Kho quà đọc từ tab " + SHEET_GIFT_IMPORT + " (IMPORTRANGE): " + importGifts.length + " món");
    return;
  }
  if (ss.getSheetByName(SHEET_GIFT_IMPORT)) {
    Logger.log("⚠️ Tab " + SHEET_GIFT_IMPORT + " đang trống hoặc lỗi #REF! - mở tab và bấm 'Cho phép truy cập'");
  }
  const giftId = props.getProperty('GIFT_SPREADSHEET_ID');
  if (giftId) {
    try {
      SpreadsheetApp.openById(giftId).getName();
      Logger.log("✅ Có quyền đọc Sheet Kho quà (GIFT_SPREADSHEET_ID)");
    } catch (e) {
      Logger.log("❌ KHÔNG có quyền đọc Sheet Kho quà - hãy xin quyền xem hoặc xóa GIFT_SPREADSHEET_ID");
    }
  } else {
    Logger.log("ℹ️ Không cấu hình GIFT_SPREADSHEET_ID - dùng tab " + SHEET_GIFT + " trong Sheet chính");
  }
}

// Chạy trong trình soạn thảo để kiểm tra doGet giống như Web App (không in token ra log)
function debugDoGet() {
  const start = Date.now();
  const out = doGet({ parameter: { token: getScriptProp('API_TOKEN') } });
  const s = out.getContent();
  const data = JSON.parse(s);
  Logger.log('Trạng thái: ' + data.status + (data.message ? ' - ' + data.message : ''));
  Logger.log('Thời gian: ' + (Date.now() - start) + ' ms; kích thước: ' + (s.length / 1024).toFixed(0) + ' KB');
  Logger.log('MasterDB: ' + (data.master || []).length + ' khóa; Kho quà: ' + (data.gifts || []).length + ' món');
}

// CHẠY 1 LẦN: Tạo API_TOKEN ngẫu nhiên (in ra Log để dán vào trang Cài đặt). Không ghi đè nếu đã có.
function generateApiToken() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('API_TOKEN')) {
    Logger.log("API_TOKEN đã tồn tại. Xóa thủ công trong Script Properties nếu muốn tạo mới.");
    return;
  }
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  props.setProperty('API_TOKEN', token);
  Logger.log("✅ Đã tạo API_TOKEN (64 ký tự). Copy chuỗi dưới đây dán vào Trainer OS > Cài đặt > API Token:");
  Logger.log(token);
}

// CHẠY 1 LẦN: Xóa toàn bộ mật khẩu LMS đã lưu trước đây trong tab KetQuaHocVien
function purgeStoredPasswords() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_KETQUA_HOCVIEN);
  if (!sheet || sheet.getLastRow() < 2) { Logger.log("Không có dữ liệu cần xóa."); return; }
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim().toLowerCase());
  let cleared = 0;
  headers.forEach((h, idx) => {
    if (HIDDEN_COLUMNS_IN_DUMP.indexOf(h) !== -1) {
      sheet.getRange(2, idx + 1, sheet.getLastRow() - 1, 1).clearContent();
      cleared++;
    }
  });
  Logger.log("✅ Đã xóa " + cleared + " cột mật khẩu trong " + SHEET_KETQUA_HOCVIEN);
}