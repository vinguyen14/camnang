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
const KNOWN_ACTIONS = ["clear_data", "save_gifts", "add_knowledge", "delete_knowledge", "ask_ai", "send_email", "sync_up", "sync_down", "submit_report"];
const SYNC_EXCLUDED_KEYS = ["kv_api_url", "kv_api_token"]; // Không bao giờ đồng bộ cấu hình kết nối lên/xuống Cloud
const HIDDEN_SHEETS_IN_DUMP = [SHEET_SETTINGS, 'KhoQua_Import']; // Không trả về trong doGet().sheets
const HIDDEN_COLUMNS_IN_DUMP = ["password", "mật khẩu", "mat khau"]; // Không trả về cột chứa mật khẩu
const MAX_EMAIL_RECIPIENTS = 200;

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
const DEFAULT_GEMINI_MODELS = ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'];

function getGeminiModels() {
  const raw = getScriptProp('GEMINI_MODELS');
  const list = raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
  return list.length > 0 ? list : DEFAULT_GEMINI_MODELS;
}

// Lỗi tạm thời: quá tải (503/UNAVAILABLE), vượt hạn mức (429/RESOURCE_EXHAUSTED), model không tồn tại (404)
function isTransientGeminiError(err) {
  const code = Number(err.code) || 0;
  const status = String(err.status || '');
  const msg = String(err.message || '').toLowerCase();
  return code === 503 || code === 429 || code === 500 || code === 404 ||
    status === 'UNAVAILABLE' || status === 'RESOURCE_EXHAUSTED' || status === 'NOT_FOUND' ||
    msg.indexOf('high demand') !== -1 || msg.indexOf('overloaded') !== -1;
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

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

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
        const rows = data.gifts.map(g => [g.name, g.in, g.out, (parseInt(g.in) || 0) - (parseInt(g.out) || 0)]);
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
          "parts": [{ "text": "Bạn là Kevin - Trợ lý Đào tạo (L&D Director) của KiotViet. Luôn trả lời chuyên nghiệp, cấu trúc rõ ràng, dùng bullet point và format Markdown đẹp mắt." }]
        }
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
        let lastError = "";
        let lastTransient = true;
        for (let m = 0; m < models.length; m++) {
          const url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(models[m]) + ":generateContent?key=" + GEMINI_API_KEY;
          let json;
          try {
            json = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());
          } catch (fetchErr) {
            lastError = String(fetchErr);
            continue;
          }
          if (json.error) {
            lastError = json.error.message || String(json.error.status || 'Lỗi không xác định');
            lastTransient = isTransientGeminiError(json.error);
            if (lastTransient) {
              if (m < models.length - 1) Utilities.sleep(800);
              continue; // Thử model kế tiếp
            }
            break; // Lỗi cố định (sai key, nội dung bị chặn...) -> không thử tiếp
          }
          if (json.candidates && json.candidates.length > 0 && json.candidates[0].content && json.candidates[0].content.parts) {
            aiText = json.candidates[0].content.parts[0].text;
            lastError = "";
            break;
          }
        }
        if (lastError) {
          aiText = lastTransient
            ? "⚠️ Trợ lý AI đang bận (Google AI: " + lastError + "). Vui lòng thử lại sau ít phút."
            : "⚠️ Lỗi từ Google AI: " + lastError;
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
    else if (data.action === "sync_up") {
      const payloadData = typeof data.payload === 'string' ? JSON.parse(data.payload) : (data.payload || {});
      
      let sheetSet = ss.getSheetByName(SHEET_SETTINGS);
      if(!sheetSet) sheetSet = ss.insertSheet(SHEET_SETTINGS);
      sheetSet.clear();
      sheetSet.appendRow(["Key", "Value"]);
      
      const directKeys = [
        'kv_trainer_profile', 'kv_dynamic_calendar',
        'kv_global_notepad', 'kv_global_whiteboard', 'kv_master_db', 
        'kv_gift_db', 'kv_roster_SPCB', 'kv_roster_KV1',
        'kv_employee_trash', 'kv_vault_trash', 'kv_product_radar',
        'kv_wp_docs', 'kv_wp_docs_v2', 'kv_survey_spcb', 'kv_survey_tax',
        'kv_doc_hub_backlog', 'kv_w3_compliance_done', 'kv_hrm_traceability'
      ];
      directKeys.forEach(k => {
        if(payloadData[k] !== undefined && payloadData[k] !== null) {
          const rawVal = typeof payloadData[k] === 'object' ? JSON.stringify(payloadData[k]) : String(payloadData[k]);
          // Chia nhỏ nếu chuỗi dài hơn 45.000 ký tự (giới hạn cell Google Sheets là 50.000)
          const CHUNK_SIZE = 45000;
          if (rawVal.length > CHUNK_SIZE) {
            const totalChunks = Math.ceil(rawVal.length / CHUNK_SIZE);
            for (let c = 0; c < totalChunks; c++) {
              const part = rawVal.substring(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
              sheetSet.appendRow([k + "__chunk_" + c + "_of_" + totalChunks, "'" + part]);
            }
          } else {
            sheetSet.appendRow([k, "'" + rawVal]);
          }
        }
      });

      if(payloadData.kv_employee_db) {
        let arr = typeof payloadData.kv_employee_db === 'string' ? JSON.parse(payloadData.kv_employee_db) : payloadData.kv_employee_db;
        let sheetNS = ss.getSheetByName(SHEET_NHANSU);
        if(!sheetNS) sheetNS = ss.insertSheet(SHEET_NHANSU);
        sheetNS.clear(); 
        sheetNS.appendRow(["Email", "Họ Tên", "Phòng Ban", "Vị Trí", "Vai Trò", "Mã NV"]);
        if(Array.isArray(arr) && arr.length > 0) {
          const rows = arr.map(e => [e.email || "", e.name || "", e.dept || "", e.position || "", e.role || "", e.code || ""]);
          sheetNS.getRange(2, 1, rows.length, 6).setValues(rows);
        }
      }

      if(payloadData.kv_vault_folders) {
        let arr = typeof payloadData.kv_vault_folders === 'string' ? JSON.parse(payloadData.kv_vault_folders) : payloadData.kv_vault_folders;
        let sheetVF = ss.getSheetByName(SHEET_VAULT_FOLDERS);
        if(!sheetVF) sheetVF = ss.insertSheet(SHEET_VAULT_FOLDERS);
        sheetVF.clear(); 
        sheetVF.appendRow(["Folder ID", "Parent ID", "Tên Thư Mục", "Icon", "Order", "Is Expanded"]);
        if(Array.isArray(arr) && arr.length > 0) {
          const rows = arr.map(f => [f.id || "", f.parentId || "", f.name || "", f.icon || "fa-folder", f.order || 0, f.isExpanded !== false]);
          sheetVF.getRange(2, 1, rows.length, 6).setValues(rows);
        }
      }

      if(payloadData.kv_vault_items) {
        let arr = typeof payloadData.kv_vault_items === 'string' ? JSON.parse(payloadData.kv_vault_items) : payloadData.kv_vault_items;
        let sheetVI = ss.getSheetByName(SHEET_VAULT_ITEMS);
        if(!sheetVI) sheetVI = ss.insertSheet(SHEET_VAULT_ITEMS);
        sheetVI.clear(); 
        sheetVI.appendRow(["Item ID", "Folder ID", "Tiêu đề", "Phân loại", "Nội dung", "Ghi chú", "Tags", "Is Pinned", "Ngày tạo", "Order"]);
        if(Array.isArray(arr) && arr.length > 0) {
          const rows = arr.map(i => [i.id || "", i.folderId || "", i.title || "", i.type || "link", i.content || "", i.note || "", i.tags || "", Boolean(i.isPinned), i.createdAt || "", i.order || 0]);
          sheetVI.getRange(2, 1, rows.length, 10).setValues(rows);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 8. TẢI CẤU HÌNH TỪ CLOUD (SYNC DOWN)
    else if (data.action === "sync_down") {
      let configData = {};
      
      let sheetSet = ss.getSheetByName(SHEET_SETTINGS);
      if(sheetSet && sheetSet.getLastRow() > 1) {
        let sData = sheetSet.getDataRange().getValues();
        let chunkStore = {};
        for(let i = 1; i < sData.length; i++) {
          if(sData[i][0]) {
            const rawKey = String(sData[i][0]).trim();
            let rawVal = String(sData[i][1] || '');
            if (rawVal.startsWith("'")) rawVal = rawVal.substring(1);
            if (rawKey.includes('__chunk_')) {
              const match = rawKey.match(/^(.*?)__chunk_(\d+)_of_(\d+)$/);
              if (match) {
                const baseKey = match[1];
                const chunkIdx = parseInt(match[2], 10);
                if (!chunkStore[baseKey]) chunkStore[baseKey] = [];
                chunkStore[baseKey][chunkIdx] = rawVal;
              }
            } else {
              configData[rawKey] = rawVal;
            }
          }
        }
        for (let bKey in chunkStore) {
          configData[bKey] = chunkStore[bKey].join('');
        }
        // Không trả về cấu hình kết nối (dữ liệu cũ có thể còn lưu kv_api_url)
        SYNC_EXCLUDED_KEYS.forEach(k => { delete configData[k]; });
      }

      let sheetNS = ss.getSheetByName(SHEET_NHANSU);
      if(sheetNS && sheetNS.getLastRow() > 1) {
        let nsData = sheetNS.getDataRange().getValues();
        let arr = [];
        for(let i = 1; i < nsData.length; i++) {
          arr.push({
            email: String(nsData[i][0] ?? ''),
            name: String(nsData[i][1] ?? ''),
            dept: String(nsData[i][2] ?? ''),
            position: String(nsData[i][3] ?? ''),
            role: String(nsData[i][4] ?? ''),
            code: String(nsData[i][5] ?? '')
          });
        }
        configData['kv_employee_db'] = JSON.stringify(arr);
      }

      let sheetVF = ss.getSheetByName(SHEET_VAULT_FOLDERS);
      if(sheetVF && sheetVF.getLastRow() > 1) {
        let vfData = sheetVF.getDataRange().getValues();
        let arr = [];
        for(let i = 1; i < vfData.length; i++) {
          arr.push({
            id: String(vfData[i][0] ?? ''),
            parentId: vfData[i][1] ? String(vfData[i][1]) : null,
            name: String(vfData[i][2] ?? ''),
            icon: String(vfData[i][3] || 'fa-folder'),
            order: parseInt(vfData[i][4]) || 0,
            isExpanded: vfData[i][5] !== undefined && vfData[i][5] !== '' ? (vfData[i][5] === true || String(vfData[i][5]).toLowerCase() === 'true') : true
          });
        }
        configData['kv_vault_folders'] = JSON.stringify(arr);
      }

      let sheetVI = ss.getSheetByName(SHEET_VAULT_ITEMS);
      if(sheetVI && sheetVI.getLastRow() > 1) {
        let viData = sheetVI.getDataRange().getValues();
        let arr = [];
        for(let i = 1; i < viData.length; i++) {
          arr.push({
            id: String(viData[i][0] ?? ''),
            folderId: String(viData[i][1] ?? ''),
            title: String(viData[i][2] ?? ''),
            type: String(viData[i][3] || 'link'),
            content: String(viData[i][4] ?? ''),
            note: String(viData[i][5] ?? ''),
            tags: String(viData[i][6] ?? ''),
            isPinned: viData[i][7] === true || String(viData[i][7]).toLowerCase() === 'true',
            createdAt: String(viData[i][8] ?? ''),
            order: parseInt(viData[i][9]) || 0
          });
        }
        configData['kv_vault_items'] = JSON.stringify(arr);
      }

      return ContentService.createTextOutput(JSON.stringify({ status: "success", payload: JSON.stringify(configData) })).setMimeType(ContentService.MimeType.JSON);
    }

    // 9. ĐÓNG KHÓA VÀO MASTER DB VÀ TAB KETQUAHOCVIEN (TOÀN DIỆN 100%)
    else {
      // 9.1. Ghi nhận 16 cột tổng quan vào MasterDB
      const sheet = ss.getSheetByName(SHEET_MASTER);
      if (!sheet) return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Sheet MasterDB không tồn tại" })).setMimeType(ContentService.MimeType.JSON);
     
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Timestamp", "Nhóm Khóa", "Mã Khóa", "Tháng", "Bắt Đầu", "Kết Thúc", "Tổng HV", "Đạt", "Fail", "CSAT", "Highlights", "Issues", "ActionPlan", "Trạng Thái", "Link DS", "Link Quiz"]);
      }
     
      const courseIdToMatch = (data.courseId || "").toString().trim().toUpperCase();
      if (!courseIdToMatch) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Thiếu Mã Khóa (courseId)" })).setMimeType(ContentService.MimeType.JSON);
      }
      const allData = sheet.getDataRange().getValues();
      let rowIndex = -1;
      for(let i = 1; i < allData.length; i++) { 
        if(allData[i][2] && allData[i][2].toString().trim().toUpperCase() === courseIdToMatch) { 
          rowIndex = i + 1; 
          break; 
        } 
      }

      const rowData = [
        data.timestamp || new Date().getTime(), 
        data.groupName || "Chung", 
        courseIdToMatch, 
        data.month || "", 
        data.startDate || "", 
        data.finishDate || "", 
        data.totalTrainees || 0, 
        data.passedTrainees || 0, 
        data.failedTrainees || 0, 
        data.csat || "4.8/5", 
        data.highlights || "", 
        data.issues || "", 
        data.actionPlan || "", 
        data.status || "Hoàn thành", 
        data.listLink || "", 
        data.quizLink || ""
      ];
      
      if(rowIndex !== -1) {
        sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }

      // 9.2. Ghi nhận chi tiết từng học viên vào tab KetQuaHocVien (Có gắn Mã Khóa & Nhóm Khóa)
      if (data.traineeDetails && Array.isArray(data.traineeDetails) && data.traineeDetails.length > 0) {
        let sheetKQ = ss.getSheetByName(SHEET_KETQUA_HOCVIEN);
        if (!sheetKQ) {
          sheetKQ = ss.insertSheet(SHEET_KETQUA_HOCVIEN);
          sheetKQ.appendRow([
            "Timestamp", "Mã Khóa", "Nhóm Khóa", "STT", "Mã NV", 
            "Họ Tên", "Phòng Ban", "Email Công Ty", "Lần Kiểm Tra", "Điểm", 
            "Kết Quả", "Username LMS", "Password", "Điểm Danh"
          ]);
        }
        
        // Chống trùng lặp: Xóa các dòng học viên cũ của Mã Khóa này nếu nộp lại
        const lastRowKQ = sheetKQ.getLastRow();
        if (lastRowKQ > 1) {
          const kqValues = sheetKQ.getRange(2, 2, lastRowKQ - 1, 1).getValues(); // Cột B: Mã Khóa
          for (let r = kqValues.length - 1; r >= 0; r--) {
            if (kqValues[r][0] && kqValues[r][0].toString().trim().toUpperCase() === courseIdToMatch) {
              sheetKQ.deleteRow(r + 2);
            }
          }
        }
        
        // Tạo các dòng mới chuẩn 14 cột
        const timeNowStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
        const rowsToInsert = data.traineeDetails.map((t, idx) => [
          timeNowStr,
          courseIdToMatch,
          data.groupName || "",
          t.stt || (idx + 1),
          t.code || "",
          t.name || "",
          t.dept || "",
          t.email || "",
          t.attempt || "1",
          t.score || "",
          t.result || "",
          t.username || "",
          "", // Sprint 0: KHÔNG lưu mật khẩu LMS lên Sheet (giữ cột để không lệch cấu trúc)
          t.attendance || ""
        ]);
        
        if (rowsToInsert.length > 0) {
          sheetKQ.getRange(sheetKQ.getLastRow() + 1, 1, rowsToInsert.length, 14).setValues(rowsToInsert);
        }
      }
     
      return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.message })).setMimeType(ContentService.MimeType.JSON);
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
      if (HIDDEN_SHEETS_IN_DUMP.indexOf(sName) !== -1) return; // Ẩn sheet cấu hình nội bộ
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