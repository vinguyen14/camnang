/**
 * Unit test cho trainer-utils.js (Sprint 1 - đúng số liệu).
 * Chạy: node scripts/test_trainer_utils.js
 */
const path = require('path');
const U = require(path.join(__dirname, '..', 'trainer-utils.js'));

const results = [];
function check(name, cond, detail) {
  results.push(!!cond);
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${!cond && detail !== undefined ? '  -> ' + JSON.stringify(detail) : ''}`);
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------- Ngày giờ ----------
check('formatLocalIsoDate lúc 06:30 sáng không bị lùi 1 ngày', U.formatLocalIsoDate(new Date(2026, 0, 5, 6, 30)) === '2026-01-05');
const p1 = U.parseLocalDate('2026-03-05');
check('parseLocalDate YYYY-MM-DD -> 00:00 giờ địa phương', p1 && p1.getFullYear() === 2026 && p1.getMonth() === 2 && p1.getDate() === 5 && p1.getHours() === 0);
check('parseLocalDate DD/MM/YYYY', eq(U.formatLocalIsoDate(U.parseLocalDate('05/03/2026')), '2026-03-05'));
check('parseLocalDate ngày không tồn tại -> null', U.parseLocalDate('2026-02-30') === null);

// ---------- Ngày lễ ----------
const h26 = U.getVietnamHolidays(2026), h27 = U.getVietnamHolidays(2027), h28 = U.getVietnamHolidays(2028);
check('Tết 2026: Mùng 1 = 17/02', h26['2-17'] === 'Mùng 1 Tết' && h26['2-16'] === 'Giao Thừa' && h26['2-21'] === 'Mùng 5 Tết');
check('Tết 2027: Mùng 1 = 06/02, không còn dùng ngày Tết 2026', h27['2-6'] === 'Mùng 1 Tết' && h27['2-5'] === 'Giao Thừa' && !h27['2-17']);
check('Tết 2028: Giao thừa 25/01', h28['1-25'] === 'Giao Thừa' && h28['1-26'] === 'Mùng 1 Tết');
check('Ngày lễ cố định có mọi năm', h27['1-1'] && h27['4-30'] && h27['5-1'] && h27['9-2']);
check('Năm ngoài bảng Tết vẫn có ngày lễ cố định', U.getVietnamHolidays(2035)['9-2'] && !U.hasLunarNewYearData(2035));

// ---------- Đạt / Không đạt ----------
const cases = [
  ['Không đạt', 'fail'], ['Chưa đạt', 'fail'], ['KHÔNG ĐẬU', 'fail'], ['Rớt', 'fail'], ['Trượt', 'fail'],
  ['Fail', 'fail'], ['Failed', 'fail'], ['Not pass', 'fail'], ['ko đạt', 'fail'],
  ['Đạt', 'pass'], ['ĐẬU', 'pass'], ['Pass', 'pass'], ['Passed', 'pass'], ['Đạt yêu cầu', 'pass'],
  ['#N/A', 'na'], ['', ''], ['Đang học', '']
];
cases.forEach(([raw, exp]) => check(`classifyResult("${raw}") = ${exp || '(trống)'}`, U.classifyResult(raw) === exp, U.classifyResult(raw)));

// ---------- Ngày vào làm HRM ----------
const hrm = [
  ['05/03/2026', { y: 2026, m: 3, d: 5 }],
  ['5/3/26', { y: 2026, m: 3, d: 5 }],
  ['2026-03-05', { y: 2026, m: 3, d: 5 }],
  ['03/25/2026', { y: 2026, m: 3, d: 25 }],
  ['05-Mar-2026', { y: 2026, m: 3, d: 5 }],
  ['05/03/2026 08:15', { y: 2026, m: 3, d: 5 }],
  ['45658', { y: 2025, m: 1, d: 1 }],
  ['31/02/2026', null], ['abc', null], ['', null]
];
hrm.forEach(([raw, exp]) => check(`parseHrmDate("${raw}")`, eq(U.parseHrmDate(raw), exp), U.parseHrmDate(raw)));
check('monthsBefore tháng 01/2027, M-2 = 11/2026', eq(U.monthsBefore(new Date(2027, 0, 15), 2), { y: 2026, m: 11 }));
check('monthsBefore tháng 11/2026, M-3 = 08/2026', eq(U.monthsBefore(new Date(2026, 10, 24), 3), { y: 2026, m: 8 }));

// ---------- CSAT ----------
check('Mã khóa: "26KV14 - Sản phẩm cơ bản" khớp 26KV14', U.isCourseCodeMatch('26KV14 - Sản phẩm cơ bản', '26KV14'));
check('Mã khóa: 26KV141 KHÔNG khớp 26KV14', !U.isCourseCodeMatch('26KV141', '26KV14'));
check('Mã khóa: "26-kv-14" khớp 26KV14', U.isCourseCodeMatch('26-kv-14', '26KV14'));

const survey = [
  'Dấu thời gian\tMã khóa học\tĐánh giá giảng viên (1-5)\tĐánh giá nội dung (1-5)\tSố buổi tham gia\tGóp ý',
  '3/11/2026 10:00:00\t26KV14\t5\t4\t2\tGiảng viên nhiệt tình, ví dụ thực tế',
  '4/11/2026 09:00:00\t26KV14\t4\t4\t3\tkhông',
  '5/11/2026 11:00:00\t26KV141\t1\t1\t1\tPhòng học nóng quá',
].join('\n');
const s1 = U.computeSurveyCsat(survey, '26KV14');
check('CSAT chỉ tính cột điểm của đúng khóa (bỏ timestamp ngày 3, cột số buổi, khóa 26KV141)', s1.avg === 4.3 && s1.scoreCount === 4 && s1.responseCount === 2, s1);
check('CSAT lấy góp ý có ý nghĩa, bỏ câu trả lời trống/"không"', eq(s1.feedbacks, ['Giảng viên nhiệt tình, ví dụ thực tế']), s1.feedbacks);
check('CSAT khóa không có khảo sát -> avg null (không bịa 4.8)', U.computeSurveyCsat(survey, '26KV99').avg === null);
check('CSAT toàn bộ (không truyền mã) tính mọi khóa', U.computeSurveyCsat(survey, '').scoreCount === 6);

const twoForms = survey + '\n' + [
  'Timestamp\tMã lớp\tMức độ hài lòng\tGhi chú',
  '6/11/2026 08:00:00\tTAX-11-26\t5\tRất hữu ích cho hộ kinh doanh',
  '6/11/2026 08:05:00\tTAX-11-26\t3\t'
].join('\n');
const s2 = U.computeSurveyCsat(twoForms, 'TAX-11-26');
check('Nhiều form dán nối nhau: nhận đúng tiêu đề từng khối', s2.avg === 4 && s2.responseCount === 2, s2);
check('Không có dữ liệu -> avg null', U.computeSurveyCsat('', '26KV14').avg === null);

// ---------- Giá trị CSAT đã lưu ----------
check('parseCsatValue("4,6/5") = 4.6', U.parseCsatValue('4,6/5') === 4.6);
check('parseCsatValue("") = null (không mặc định 4.8)', U.parseCsatValue('') === null);
check('parseCsatValue("N/A") = null', U.parseCsatValue('N/A') === null);

// ---------- Kiểm tra trước khi đóng khóa ----------
check('Đóng khóa: thiếu mã khóa -> báo lỗi', /Mã Khóa/.test(U.validateCourseReport({ courseId: '', totalTrainees: 10, passedTrainees: 8, failedTrainees: 2 })));
check('Đóng khóa: mã là chữ gợi ý "[Mã Khóa]" -> báo lỗi', /Mã Khóa/.test(U.validateCourseReport({ courseId: '[MÃ KHÓA]', totalTrainees: 1, passedTrainees: 1, failedTrainees: 0 })));
check('Đóng khóa: Đạt + Trượt > Tổng -> báo lỗi', /không khớp/.test(U.validateCourseReport({ courseId: '26KV15', totalTrainees: 10, passedTrainees: 9, failedTrainees: 3 })));
check('Đóng khóa: số âm / không phải số -> báo lỗi', U.validateCourseReport({ courseId: 'X', totalTrainees: 'abc', passedTrainees: 1, failedTrainees: 0 }) !== '');
check('Đóng khóa: hợp lệ -> không lỗi', U.validateCourseReport({ courseId: '26KV15', totalTrainees: '20', passedTrainees: '18', failedTrainees: '2' }) === '');
check('Đóng khóa: có người vắng (Đạt + Trượt < Tổng) vẫn hợp lệ', U.validateCourseReport({ courseId: 'TAX-11-26', totalTrainees: 20, passedTrainees: 15, failedTrainees: 3 }) === '');

// ---------- Lưu / khôi phục kết quả Lần 1 ----------
const mem = (() => { const s = {}; return { getItem: k => (k in s ? s[k] : null), setItem: (k, v) => { s[k] = String(v); }, _s: s }; })();
const keyA = U.roundOneStorageKey('SPCB', '26KV15'), keyB = U.roundOneStorageKey('SPCB', '26KV16');
check('Khóa lưu L1 tách theo mã khóa', keyA !== keyB && /SPCB_26KV15$/.test(keyA));
const graded = [
  { email: 'A@kiotviet.com', scoreL1: 90, statusL1: 'Pass' },
  { email: 'b@kiotviet.com', scoreL1: 50, statusL1: 'Fail' },
  { email: 'c@kiotviet.com', scoreL1: 0, statusL1: 'Miss' }
];
check('Lưu kết quả L1 cho 3 học viên', U.saveRoundOneResults(mem, keyA, graded) === 3);
// Mô phỏng F5: danh sách được đọc lại, mọi người về Miss
const reparsed = [
  { email: 'a@kiotviet.com', score: 0, status: 'Miss' },
  { email: 'b@kiotviet.com', score: 0, status: 'Miss' },
  { email: 'd@kiotviet.com', score: 0, status: 'Miss' }
];
const nRestored = U.restoreRoundOneResults(mem, keyA, reparsed);
check('Sau F5: khôi phục đúng 2 học viên có kết quả L1', nRestored === 2);
check('Sau F5: học viên đã Pass L1 vẫn là Pass (không bị thành Miss)', reparsed[0].statusL1 === 'Pass' && reparsed[0].scoreL1 === 90 && reparsed[0].status === 'Pass');
check('Sau F5: học viên mới thêm vẫn là Miss', reparsed[2].status === 'Miss' && reparsed[2].statusL1 === undefined);
check('Khóa khác không dính kết quả L1 của khóa trước', U.restoreRoundOneResults(mem, keyB, [{ email: 'a@kiotviet.com', status: 'Miss' }]) === 0);

const passed = results.filter(Boolean).length;
console.log(`\nKẾT QUẢ: ${passed}/${results.length} PASS`);
process.exit(passed === results.length ? 0 : 1);
