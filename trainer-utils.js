/**
 * TRAINER OS - THƯ VIỆN TIỆN ÍCH DÙNG CHUNG (Sprint 1 - 24/11/2026)
 * Gom các phép tính dễ sai về một chỗ để mọi trang dùng chung và có unit test
 * (scripts/test_trainer_utils.js):
 *   - Ngày giờ theo giờ địa phương (không lệch múi giờ UTC)
 *   - Ngày nghỉ lễ Việt Nam theo TỪNG NĂM (trước đây gán cứng Tết 2026)
 *   - Phân loại kết quả Đạt / Không đạt
 *   - Đọc ngày vào làm trong file HRM (nhiều định dạng, kể cả số serial Excel)
 *   - Tính CSAT từ dữ liệu khảo sát Google Forms dán vào (chỉ cột điểm, đúng mã khóa)
 */
(function (root) {
  'use strict';

  const U = {};

  // ======================= NGÀY GIỜ =======================
  function pad2(n) { return String(n).padStart(2, '0'); }

  // Date -> "YYYY-MM-DD" theo giờ địa phương (thay cho toISOString() bị lùi 1 ngày trước 7h sáng)
  U.formatLocalIsoDate = function (date) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  };

  // "YYYY-MM-DD" | "DD/MM/YYYY" -> Date lúc 00:00 giờ địa phương (new Date("YYYY-MM-DD") là giờ UTC)
  U.parseLocalDate = function (str) {
    if (str instanceof Date) return new Date(str.getFullYear(), str.getMonth(), str.getDate());
    const s = String(str || '').trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return validDate(+m[1], +m[2], +m[3]);
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return validDate(+m[3], +m[2], +m[1]);
    return null;
  };

  function validDate(y, mo, d) {
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return dt;
  }

  // ======================= NGÀY NGHỈ LỄ =======================
  // Mùng 1 Tết Nguyên Đán (âm lịch) theo năm dương lịch. Thêm năm mới vào bảng này khi cần.
  const LUNAR_NEW_YEAR = {
    2025: [1, 29], 2026: [2, 17], 2027: [2, 6], 2028: [1, 26], 2029: [2, 13], 2030: [2, 3]
  };

  // Trả về { "M-D": "Tên ngày lễ" } cho một năm. Tết: từ Giao thừa tới Mùng 5.
  U.getVietnamHolidays = function (year) {
    const y = parseInt(year, 10) || new Date().getFullYear();
    const h = { '1-1': 'Tết Dương Lịch', '4-30': 'Giải Phóng Miền Nam', '5-1': 'Quốc Tế Lao Động', '9-2': 'Quốc Khánh' };
    const tet = LUNAR_NEW_YEAR[y];
    if (tet) {
      const first = new Date(y, tet[0] - 1, tet[1]);
      const names = ['Giao Thừa', 'Mùng 1 Tết', 'Mùng 2 Tết', 'Mùng 3 Tết', 'Mùng 4 Tết', 'Mùng 5 Tết'];
      names.forEach((name, i) => {
        const d = new Date(first);
        d.setDate(first.getDate() + i - 1);
        if (d.getFullYear() === y) h[(d.getMonth() + 1) + '-' + d.getDate()] = name;
      });
    }
    return h;
  };
  U.hasLunarNewYearData = function (year) { return !!LUNAR_NEW_YEAR[parseInt(year, 10)]; };

  // ======================= KẾT QUẢ ĐẠT / KHÔNG ĐẠT =======================
  // Trả về 'fail' | 'pass' | 'na' | '' (không xác định). Kiểm tra "không đạt" TRƯỚC "đạt".
  U.classifyResult = function (raw) {
    const s = String(raw || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!s) return '';
    if (s.indexOf('#n/a') !== -1 || s === 'n/a') return 'na';
    // Lưu ý: \b của JavaScript không nhận chữ có dấu (đ, ạ...) nên không dùng \b cho từ tiếng Việt
    if (/(không|chưa|ko|k)\s*(đạt|đậu|qua|pass)|rớt|trượt|fail|not pass/.test(s)) return 'fail';
    if (/đạt|đậu|pass|(^|\s)qua(\s|$)/.test(s)) return 'pass';
    return '';
  };

  // ======================= NGÀY VÀO LÀM (HRM) =======================
  const MONTH_ABBR = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

  // Trả về { y, m, d } hoặc null. Hỗ trợ: DD/MM/YYYY, D/M/YY, YYYY-MM-DD, MM/DD/YYYY (khi số thứ 2 > 12),
  // DD-Mon-YYYY (05-Mar-2026), số serial Excel (45678), có kèm giờ phía sau.
  U.parseHrmDate = function (raw) {
    const s = String(raw == null ? '' : raw).trim().split(/\s+/)[0];
    if (!s) return null;

    if (/^\d{5}(\.\d+)?$/.test(s)) { // Serial Excel: số ngày kể từ 30/12/1899
      const serial = Math.floor(parseFloat(s));
      if (serial < 20000 || serial > 80000) return null;
      const dt = new Date(1899, 11, 30);
      dt.setDate(dt.getDate() + serial);
      return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() };
    }

    let m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
    if (m) return checkYmd(+m[1], +m[2], +m[3]);

    m = s.match(/^(\d{1,2})[-\/.\s]([A-Za-z]{3})[A-Za-z]*[-\/.\s](\d{2,4})$/);
    if (m && MONTH_ABBR[m[2].toLowerCase()]) return checkYmd(fullYear(+m[3]), MONTH_ABBR[m[2].toLowerCase()], +m[1]);

    m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})$/);
    if (m) {
      const a = +m[1], b = +m[2], y = fullYear(+m[3]);
      if (b > 12 && a <= 12) return checkYmd(y, a, b);   // MM/DD/YYYY
      return checkYmd(y, b, a);                           // DD/MM/YYYY (chuẩn Việt Nam)
    }
    return null;
  };

  function fullYear(y) { return y < 100 ? 2000 + y : y; }
  function checkYmd(y, mo, d) { return validDate(y, mo, d) ? { y: y, m: mo, d: d } : null; }

  // Mốc "tháng M-k" so với ngày tham chiếu -> { y, m } (VD: tháng 01/2027, k=2 -> 11/2026)
  U.monthsBefore = function (refDate, k) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - k, 1);
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  };

  // ======================= CSAT TỪ KHẢO SÁT =======================
  U.normalizeCourseCode = function (code) {
    return String(code || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]/g, '');
  };

  // Ô khớp mã khóa khi: trùng hẳn (bỏ ký tự đặc biệt) hoặc chứa mã khóa như một từ riêng.
  // "26KV14 - Sản phẩm cơ bản" khớp "26KV14"; "26KV141" KHÔNG khớp "26KV14".
  U.isCourseCodeMatch = function (cellValue, targetCode) {
    const target = U.normalizeCourseCode(targetCode);
    if (!cellValue || !target) return false;
    if (U.normalizeCourseCode(cellValue) === target) return true;
    const tokens = String(cellValue).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^A-Z0-9]+/);
    return tokens.indexOf(target) !== -1;
  };

  const HEADER_HINT = /timestamp|dấu thời gian|thời gian|ngày giờ|ngày gửi/i;
  const COURSE_HEADER = /mã\s*(khóa|khoá|lớp)|khóa\s*học|khoá\s*học|course|lớp\s*học|mã lớp/i;
  const NOT_RATING_HEADER = /số\s*(buổi|lần|điện thoại|câu)|sđt|stt|mã\s*nv|năm|tháng|tuổi|thâm niên|điểm\s*(thi|kiểm tra|lms)/i;
  const RATING_HEADER = /đánh giá|mức độ|hài lòng|chấm điểm|thang điểm|rating|csat|\(1\s*-\s*5\)|1\s*-\s*5|1 đến 5/i;
  const TRIVIAL = /^(không|không có|ko|k|không ạ|không ý kiến|ko có|k có|ok|quá ok|tốt|rất tốt|tuyệt vời|none|-|\.|dạ không|chưa có)?$/i;

  function isRatingValue(v) { return /^[1-5]$/.test(String(v).trim()); }

  // Chia văn bản TSV thành các khối, mỗi khối bắt đầu bằng 1 dòng tiêu đề (có thể nhiều form dán nối nhau)
  function splitBlocks(text) {
    const lines = String(text || '').split(/\r?\n/).filter(l => l.trim());
    const blocks = [];
    let cur = null;
    lines.forEach(line => {
      const cols = line.split('\t').map(c => c.trim());
      if (HEADER_HINT.test(cols[0] || '') && !/\d/.test(cols[0])) {
        cur = { header: cols, rows: [] };
        blocks.push(cur);
      } else {
        if (!cur) { cur = { header: null, rows: [] }; blocks.push(cur); }
        cur.rows.push(cols);
      }
    });
    return blocks;
  }

  // Xác định cột điểm: tiêu đề giống câu hỏi đánh giá HOẶC >= 80% giá trị là số nguyên 1-5
  function ratingColumns(block, courseCol) {
    const nCols = Math.max(block.header ? block.header.length : 0, ...block.rows.map(r => r.length));
    const cols = [];
    for (let c = 0; c < nCols; c++) {
      if (c === 0 || c === courseCol) continue;
      const h = block.header ? (block.header[c] || '') : '';
      if (NOT_RATING_HEADER.test(h)) continue;
      const vals = block.rows.map(r => r[c]).filter(v => v !== undefined && String(v).trim() !== '');
      if (vals.length === 0) continue;
      const ratio = vals.filter(isRatingValue).length / vals.length;
      if (ratio >= 0.8 || (RATING_HEADER.test(h) && ratio >= 0.5)) cols.push(c);
    }
    return cols;
  }

  function courseColumn(block) {
    if (block.header) {
      const idx = block.header.findIndex(h => COURSE_HEADER.test(h));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  // Trả về { responseCount, scoreCount, avg (số|null), feedbacks[] } cho 1 mã khóa (hoặc toàn bộ nếu không có mã)
  U.computeSurveyCsat = function (surveyText, targetCode) {
    const result = { responseCount: 0, scoreCount: 0, avg: null, feedbacks: [] };
    let sum = 0;
    splitBlocks(surveyText).forEach(block => {
      const cCol = courseColumn(block);
      const rCols = ratingColumns(block, cCol);
      block.rows.forEach(row => {
        if (targetCode) {
          const candidates = cCol !== -1 ? [row[cCol]] : [row[1], row[0], row[2]];
          if (!candidates.some(v => U.isCourseCodeMatch(v, targetCode))) return;
        }
        result.responseCount++;
        rCols.forEach(c => {
          if (isRatingValue(row[c])) { sum += parseInt(row[c], 10); result.scoreCount++; }
        });
        row.forEach((col, idx) => {
          if (idx === 0 || idx === cCol || rCols.indexOf(idx) !== -1) return;
          if (col && col.length > 8 && isNaN(col) && !/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(col) && !TRIVIAL.test(col.toLowerCase())) {
            if (result.feedbacks.indexOf(col) === -1) result.feedbacks.push(col);
          }
        });
      });
    });
    if (result.scoreCount > 0) result.avg = Math.round((sum / result.scoreCount) * 10) / 10;
    return result;
  };

  // Đọc giá trị CSAT đã lưu ("4,6/5", "4.6", "") -> số trong (0,5] hoặc null
  U.parseCsatValue = function (v) {
    const n = parseFloat(String(v == null ? '' : v).replace(',', '.'));
    return (!isNaN(n) && n > 0 && n <= 5) ? n : null;
  };

  // ======================= KIỂM TRA TRƯỚC KHI ĐÓNG KHÓA =======================
  // Trả về '' nếu hợp lệ, hoặc thông báo lỗi tiếng Việt.
  U.validateCourseReport = function (p) {
    const code = String((p && p.courseId) || '').trim();
    if (!code || /^\[.*\]$/.test(code) || !U.normalizeCourseCode(code)) {
      return '⚠️ Chưa có Mã Khóa. Vui lòng nhập Mã Khóa trước khi đóng khóa (tránh ghi đè nhầm khóa khác).';
    }
    const toInt = (v) => (String(v == null ? '' : v).trim() === '' ? 0 : Number(v));
    const total = toInt(p.totalTrainees), passed = toInt(p.passedTrainees), failed = toInt(p.failedTrainees);
    if ([total, passed, failed].some(n => !Number.isInteger(n) || n < 0)) {
      return '⚠️ Số học viên (Tổng / Đạt / Trượt) phải là số nguyên không âm.';
    }
    if (passed + failed > total) {
      return `⚠️ Số liệu không khớp: Đạt (${passed}) + Trượt (${failed}) = ${passed + failed} lớn hơn Tổng học viên (${total}). Vui lòng kiểm tra lại.`;
    }
    return '';
  };

  // ======================= KẾT QUẢ CHẤM LẦN 1 (L1) =======================
  // Lưu kết quả Lần 1 theo email để chấm Lần 2 sau khi F5 / sửa danh sách ở Bước 1 không làm
  // học viên đã Pass Lần 1 bị tính thành Miss/Fail. Lưu riêng theo trang + mã khóa.
  U.roundOneStorageKey = function (page, courseCode) {
    const code = U.normalizeCourseCode(courseCode) || 'CHUA_CO_MA';
    return 'kv_grade_L1_' + String(page).toUpperCase() + '_' + code;
  };

  U.saveRoundOneResults = function (storage, key, roster) {
    const map = {};
    (roster || []).forEach(r => {
      if (r && r.email) map[String(r.email).toLowerCase()] = { score: Number(r.scoreL1) || 0, status: r.statusL1 || 'Miss' };
    });
    try { storage.setItem(key, JSON.stringify({ savedAt: Date.now(), results: map })); } catch (e) {}
    return Object.keys(map).length;
  };

  // Gắn lại scoreL1/statusL1 (và hiển thị) cho học viên có trong kết quả đã lưu. Trả về số học viên khôi phục.
  U.restoreRoundOneResults = function (storage, key, roster) {
    let saved = null;
    try { saved = JSON.parse(storage.getItem(key) || 'null'); } catch (e) { saved = null; }
    if (!saved || !saved.results) return 0;
    let restored = 0;
    (roster || []).forEach(r => {
      const hit = r && r.email ? saved.results[String(r.email).toLowerCase()] : null;
      if (!hit) return;
      r.scoreL1 = hit.score; r.statusL1 = hit.status;
      r.score = hit.score; r.status = hit.status; r.attempt = hit.status === 'Miss' ? 0 : 1;
      restored++;
    });
    return restored;
  };

  root.TrainerUtils = U;
  if (typeof module !== 'undefined' && module.exports) module.exports = U;
})(typeof window !== 'undefined' ? window : this);
