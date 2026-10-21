/**
 * TRAINER OS - EXECUTIVE TRAINING REPORT MEMO & SMART LMS RESULT PARSER
 * Version: 5.5 Enterprise
 * Nâng cấp: Xử lý triệt để lỗi điểm phẩy (30,0 -> 30), lỗi 10000% -> 100%, làm tròn % (92,81 -> 93%), nhận diện Đơn vị/Đậu/Rớt
 */

(function () {
    window.currentParsedTrainees = [];

    const memoStyles = `
        .memo-overlay {
            position: fixed; inset: 0;
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(5px);
            z-index: 999999;
            display: none;
            overflow-y: auto;
            padding: 40px 16px;
        }
        .memo-overlay.active { 
            display: flex; 
            justify-content: center;
            align-items: flex-start;
        }
        .memo-paper {
            width: 100%; max-width: 840px;
            background: #ffffff;
            border-radius: 18px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 1px solid #cbd5e1;
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            overflow: hidden;
            position: relative;
            margin-bottom: 40px;
        }
        .trainee-parser-box {
            background: #ffffff;
            border: 2px dashed #93c5fd;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 24px;
            transition: all 0.2s ease-in-out;
        }
        .trainee-parser-box:focus-within {
            border-color: #2563eb;
            background: #eff6ff;
        }
        @media print {
            body * { visibility: hidden !important; }
            .memo-overlay, .memo-overlay * { visibility: visible !important; }
            .memo-overlay {
                position: absolute !important; left: 0 !important; top: 0 !important;
                width: 100% !important; background: transparent !important;
                padding: 0 !important; display: block !important;
            }
            .memo-paper {
                box-shadow: none !important; border: none !important;
                max-width: 100% !important; border-radius: 0 !important;
                margin: 0 !important;
            }
            .no-print { display: none !important; }
        }
    `;

    function formatVietnameseDate(rawDate) {
        if (!rawDate) return '--';
        if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
            const parts = rawDate.trim().split('-');
            const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
            return `${dayNames[d.getDay()]}, ${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return String(rawDate);
        const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        return `${dayNames[d.getDay()]}, ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }

    // ==========================================
    // BỘ KHỬ LỖI ĐIỂM SỐ & TỶ LỆ PHẦN TRĂM LMS
    // ==========================================
    function cleanLmsScore(rawScore) {
        if (!rawScore || rawScore.trim() === '' || rawScore.includes('#N/A')) return '-';
        let s = rawScore.replace(',', '.').trim();
        let num = parseFloat(s);
        if (isNaN(num)) return rawScore;
        // Nếu là số nguyên (ví dụ 30,0 -> 30)
        return (num % 1 === 0) ? String(Math.round(num)) : String(num);
    }

    function cleanLmsPercentage(rawPct, rawScore, totalQ, correctQ) {
        // Trường hợp 1: Tính trực tiếp từ số câu đúng / tổng số câu nếu có
        if (totalQ && correctQ !== undefined && !isNaN(parseFloat(totalQ)) && !isNaN(parseFloat(correctQ))) {
            const t = parseFloat(totalQ);
            const c = parseFloat(correctQ);
            if (t > 0) return `${Math.round((c / t) * 100)}%`;
        }

        if (!rawPct || rawPct.trim() === '' || rawPct.includes('#N/A')) {
            return '-';
        }

        // Bỏ ký tự % và đổi phẩy thành chấm
        let str = rawPct.replace('%', '').replace(',', '.').trim();
        let val = parseFloat(str);
        if (isNaN(val)) return rawPct;

        // Xử lý lỗi Google Sheets định dạng nhầm số 100 thành 10000%
        if (val === 10000 || val > 100) {
            val = val / 100;
        }

        // Làm tròn số học (ví dụ: 92,81 -> 93%)
        return `${Math.round(val)}%`;
    }

    function injectMemoDom() {
        if (document.getElementById('executiveReportModal')) return;

        const styleEl = document.createElement('style');
        styleEl.innerHTML = memoStyles;
        document.head.appendChild(styleEl);

        const modalContainer = document.createElement('div');
        modalContainer.id = 'executiveReportModal';
        modalContainer.className = 'memo-overlay';
        modalContainer.onclick = function (e) {
            if (e.target.id === 'executiveReportModal') window.closeReportMemo();
        };

        modalContainer.innerHTML = `
            <div class="memo-paper" onclick="event.stopPropagation()">
                <div class="no-print bg-slate-900 text-white px-6 py-3.5 flex justify-between items-center shrink-0">
                    <div class="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider">
                        <i class="fas fa-file-invoice text-blue-400 text-sm"></i>
                        <span id="memoTopTitle">Phiếu Báo Cáo Tổng Kết Khóa Học</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <button onclick="window.printReportMemo()" class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm">
                            <i class="fas fa-print"></i> In / Xuất PDF
                        </button>
                        <button onclick="window.closeReportMemo()" class="w-7 h-7 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition flex items-center justify-center">
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </div>
                </div>

                <div class="p-8 sm:p-10 space-y-6 bg-white" id="memoPrintArea">
                    <div class="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                        <div class="space-y-1">
                            <div class="flex items-center gap-3">
                                <img src="https://i.postimg.cc/13fmPWCq/Logo-Vie.png" alt="Logo" class="h-[36px] w-auto object-contain">
                                <span class="text-xs font-extrabold text-slate-300">|</span>
                                <span class="text-xs font-extrabold uppercase tracking-widest text-slate-700">Bộ Phận Đào Tạo (L&D)</span>
                            </div>
                            <p class="text-[11px] text-slate-500 font-medium">Hệ Thống Quản Trị Đào Tạo Nội Bộ Trainer OS</p>
                        </div>
                        <div class="text-right space-y-1">
                            <span id="memoBadgeCourseId" class="inline-block px-3 py-1 rounded-md bg-blue-50 text-blue-700 font-black text-xs font-mono border border-blue-200 uppercase">Mã: --</span>
                            <p class="text-[11px] text-slate-400 font-medium" id="memoDateCreated">Ngày tạo: --/--/----</p>
                        </div>
                    </div>

                    <div class="text-center py-2">
                        <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tight" id="memoReportHeaderTitle">Báo Cáo Đánh Giá Kết Quả Đào Tạo</h2>
                        <p class="text-xs font-semibold text-slate-500 mt-1" id="memoSubHeaderInfo">Khóa: -- | Thời gian: --</p>
                    </div>

                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-4 text-xs">
                        <div><p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phân Hệ Đào Tạo</p><p class="text-sm font-bold text-slate-800 mt-0.5" id="memoGroupName">--</p></div>
                        <div><p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Giảng Viên Phụ Trách</p><p class="text-sm font-bold text-slate-800 mt-0.5" id="memoTrainerName">--</p></div>
                        <div><p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thời Gian Diễn Ra</p><p class="text-xs font-bold text-slate-700 mt-0.5" id="memoTimeline">--</p></div>
                        <div><p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trạng Thái Khóa</p><p class="text-xs font-bold text-emerald-700 mt-0.5" id="memoStatus">Hoàn thành</p></div>
                    </div>

                    <div>
                        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><i class="fas fa-chart-pie text-blue-600"></i> Chỉ Số Hiệu Suất Học Viên (KPIs)</h4>
                        <div class="grid grid-cols-4 gap-3 text-center">
                            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200"><span class="text-[10px] font-bold text-slate-400 uppercase">Sĩ Số</span><p class="text-2xl font-black text-slate-800 mt-0.5" id="memoTotalHV">0</p></div>
                            <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200"><span class="text-[10px] font-bold text-emerald-600 uppercase">Đạt (Pass)</span><p class="text-2xl font-black text-emerald-600 mt-0.5" id="memoPassHV">0</p></div>
                            <div class="p-3 bg-rose-50 rounded-xl border border-rose-200"><span class="text-[10px] font-bold text-rose-500 uppercase">Trượt (Fail/Miss)</span><p class="text-2xl font-black text-rose-500 mt-0.5" id="memoFailHV">0</p></div>
                            <div class="p-3 bg-purple-50 rounded-xl border border-purple-200"><span class="text-[10px] font-bold text-purple-600 uppercase">Tỷ Lệ Pass</span><p class="text-2xl font-black text-purple-700 mt-0.5" id="memoPassRate">0%</p></div>
                        </div>
                        <div class="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs px-4">
                            <span class="text-slate-600 font-semibold">Mức Độ Hài Lòng Khóa Học (CSAT):</span>
                            <span class="font-extrabold text-blue-700 text-sm" id="memoCsat">4.8 / 5.0 ★</span>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><i class="fas fa-brain text-purple-600"></i> Đánh Giá Chất Lượng & Định Hướng</h4>
                        <div class="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs"><p class="font-bold text-emerald-800 uppercase text-[11px] mb-1 flex items-center gap-1"><i class="fas fa-star text-amber-500"></i> Điểm Sáng Nổi Bật (Highlights):</p><p class="text-slate-700 leading-relaxed font-medium" id="memoHighlights">--</p></div>
                        <div class="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 text-xs"><p class="font-bold text-rose-800 uppercase text-[11px] mb-1 flex items-center gap-1"><i class="fas fa-exclamation-circle text-rose-500"></i> Khó Khăn & Tồn Đọng (Issues):</p><p class="text-slate-700 leading-relaxed font-medium" id="memoIssues">--</p></div>
                        <div class="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs"><p class="font-bold text-blue-800 uppercase text-[11px] mb-1 flex items-center gap-1"><i class="fas fa-bullseye text-blue-600"></i> Kế Hoạch Đề Xuất (Action Plan):</p><p class="text-slate-700 leading-relaxed font-medium" id="memoActionPlan">--</p></div>
                    </div>

                    <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <p class="font-bold text-slate-600 uppercase text-[10px]">Tài liệu đính kèm:</p>
                        <div class="flex items-center gap-4 text-blue-600">
                            <a id="memoListLink" href="#" target="_blank" class="hover:underline flex items-center gap-1"><i class="fas fa-file-excel text-emerald-600"></i> Danh sách học viên</a>
                            <span class="text-slate-300">|</span>
                            <a id="memoQuizLink" href="#" target="_blank" class="hover:underline flex items-center gap-1"><i class="fas fa-graduation-cap text-purple-600"></i> Khóa học LMS</a>
                        </div>
                    </div>

                    <div class="pt-6 grid grid-cols-2 text-center text-xs">
                        <div class="space-y-1">
                            <p class="font-extrabold uppercase text-slate-700">Trưởng Bộ Phận L&D</p>
                            <p class="text-[11px] text-slate-400 italic">(Ký duyệt & xác nhận)</p>
                            <div class="h-16 flex items-center justify-center"><span class="px-3 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 font-mono text-[10px] font-bold tracking-wider">ĐÃ XÁC THỰC</span></div>
                            <p class="font-bold text-slate-800">L&D Management</p>
                        </div>
                        <div class="space-y-1">
                            <p class="font-extrabold uppercase text-slate-700">Giảng Viên Đào Tạo</p>
                            <p class="text-[11px] text-slate-400 italic">(Người lập báo cáo)</p>
                            <div class="h-16 flex items-center justify-center"><span class="font-serif italic text-blue-600 text-base font-bold" id="memoSignName">Trainer</span></div>
                            <p class="font-bold text-slate-800" id="memoFooterTrainer">Trainer</p>
                        </div>
                    </div>
                </div>

                <div class="no-print px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                    <span class="text-xs text-slate-400 font-medium">Báo cáo được xác thực bởi Trainer OS</span>
                    <div class="flex items-center gap-3" id="memoActionButtons">
                        <button onclick="window.closeReportMemo()" class="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition shadow-xs">Đóng Lại</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalContainer);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.closeReportMemo(); });
    }

    // ==========================================
    // BỘ PHÂN TÍCH LMS TOÀN DIỆN (PARSER)
    // ==========================================
    window.parseTraineeExcelResults = function () {
        const rawEl = document.getElementById('rawTraineeExcelInput');
        if (!rawEl) return;
        const raw = rawEl.value.trim();
        if (!raw) return alert("Vui lòng dán dữ liệu bảng điểm Excel vào ô!");

        const lines = raw.split(/\r?\n/);
        if (lines.length < 2) return alert("Dữ liệu không hợp lệ. Vui lòng copy cả dòng tiêu đề từ Excel!");

        // Nhận diện cột linh hoạt (Không bắt buộc đủ tất cả cột)
        const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());
        const iStt = headers.findIndex(h => h.includes('stt'));
        const iCode = headers.findIndex(h => h.includes('mã nv') || h.includes('mã nhân viên') || h === 'mã');
        const iName = headers.findIndex(h => h.includes('họ tên') || h.includes('họ và tên') || h.includes('tên'));
        const iDept = headers.findIndex(h => h.includes('đơn vị') || h.includes('phòng ban') || h.includes('bộ phận') || h.includes('chi nhánh'));
        const iEmail = headers.findIndex(h => h.includes('email'));
        const iAttempt = headers.findIndex(h => h.includes('lần làm') || h.includes('lần thi') || h.includes('lần'));
        const iTotalQ = headers.findIndex(h => h.includes('số câu hỏi') || h.includes('tổng câu'));
        const iCorrectQ = headers.findIndex(h => h.includes('số câu đúng') || h.includes('câu đúng'));
        const iScore = headers.findIndex(h => (h.includes('điểm') && !h.includes('%') && !h.includes('danh')));
        const iPct = headers.findIndex(h => (h.includes('điểm (%)') || h.includes('điểm %') || h.includes('tỷ lệ') || (h.includes('điểm') && h.includes('%'))));
        const iResult = headers.findIndex(h => h.includes('kết quả'));
        const iUser = headers.findIndex(h => h.includes('username') || h.includes('tài khoản'));
        const iPass = headers.findIndex(h => h.includes('password') || h.includes('mật khẩu'));
        const iAtt = headers.findIndex(h => h.includes('điểm danh') || h.includes('chuyên cần'));

        if (iName === -1 && iCode === -1 && iEmail === -1) {
            return alert("Bảng dán vào thiếu các cột nhận diện tối thiểu (Họ tên hoặc Email hoặc Mã NV)!");
        }

        let trainees = [];
        let countPass = 0, countFail = 0;
        let deptStats = {};

        for (let r = 1; r < lines.length; r++) {
            if (!lines[r].trim()) continue;
            const cols = lines[r].split('\t');
            if (cols.length < 2) continue;

            const stt = iStt !== -1 ? cols[iStt]?.trim() : String(r);
            const code = iCode !== -1 ? cols[iCode]?.trim() : '';
            const name = iName !== -1 ? cols[iName]?.trim() : (code || `Học viên ${r}`);
            const dept = iDept !== -1 ? cols[iDept]?.trim() : '-';
            const email = iEmail !== -1 ? cols[iEmail]?.trim() : '';
            const attempt = iAttempt !== -1 ? cols[iAttempt]?.trim() : '1';
            const totalQ = iTotalQ !== -1 ? cols[iTotalQ]?.trim() : null;
            const correctQ = iCorrectQ !== -1 ? cols[iCorrectQ]?.trim() : null;

            // Xử lý Điểm Số (30,0 -> 30)
            const rawScore = iScore !== -1 ? cols[iScore]?.trim() : (correctQ || '');
            const scoreClean = cleanLmsScore(rawScore);

            // Xử lý Điểm % (10000% -> 100%, 92,81 -> 93%)
            const rawPct = iPct !== -1 ? cols[iPct]?.trim() : '';
            const pctClean = cleanLmsPercentage(rawPct, scoreClean, totalQ, correctQ);

            // Xử lý Kết Quả (Đậu/Rớt/Pass/Fail/#N/A)
            const rawRes = iResult !== -1 ? cols[iResult]?.trim().toLowerCase() : '';
            let isPass = false;
            let resultDisplay = 'Fail';

            if (rawRes.includes('đậu') || rawRes.includes('đạt') || rawRes.includes('pass')) {
                isPass = true;
                resultDisplay = 'Pass';
            } else if (rawRes.includes('rớt') || rawRes.includes('trượt') || rawRes.includes('fail')) {
                isPass = false;
                resultDisplay = 'Fail';
            } else if (rawRes.includes('#n/a') || rawScore.includes('#n/a') || rawPct.includes('#n/a')) {
                isPass = false;
                resultDisplay = '#N/A';
            } else {
                // Nếu bảng không có cột Kết quả -> Tự tính từ %
                const numericPct = parseFloat(pctClean.replace('%', ''));
                if (!isNaN(numericPct) && numericPct >= 80) {
                    isPass = true;
                    resultDisplay = 'Pass';
                } else {
                    isPass = false;
                    resultDisplay = (rawScore === '-' || rawScore === '') ? '#N/A' : 'Fail';
                }
            }

            if (isPass) countPass++; else countFail++;

            if (!deptStats[dept]) deptStats[dept] = { total: 0, pass: 0 };
            deptStats[dept].total++;
            if (isPass) deptStats[dept].pass++;

            const username = iUser !== -1 ? cols[iUser]?.trim() : (email || code);
            const password = iPass !== -1 ? cols[iPass]?.trim() : 'Tự khởi tạo';
            const attendance = iAtt !== -1 ? cols[iAtt]?.trim() : '';

            trainees.push({
                stt, code, name, dept, email, attempt,
                score: scoreClean,
                pct: pctClean,
                result: resultDisplay,
                isPass, username, password, attendance
            });
        }

        const totalHV = trainees.length;
        if (totalHV === 0) return alert("Không bóc tách được học viên nào!");

        const passRate = Math.round((countPass / totalHV) * 100);
        window.currentParsedTrainees = trainees;

        // Tự động phân tích Điểm Sáng & Tồn Đọng
        let highlights = '';
        let perfectDepts = Object.keys(deptStats).filter(d => deptStats[d].total > 0 && deptStats[d].pass === deptStats[d].total && d !== '-');
        if (perfectDepts.length > 0) {
            highlights = `Chi nhánh/Đơn vị ${perfectDepts.slice(0, 3).join(', ')} đạt tỷ lệ Pass tuyệt đối 100%.`;
        } else {
            highlights = `Học viên hoàn thành tốt kỳ thi với tỷ lệ Đạt ${passRate}%.`;
        }

        let issues = '';
        const naTrainees = trainees.filter(t => t.result === '#N/A');
        const failTrainees = trainees.filter(t => t.result === 'Fail');

        if (naTrainees.length > 0) {
            issues = `Còn ${naTrainees.length} học viên chưa hoàn thành bài thi (#N/A): ${naTrainees.slice(0, 2).map(x => x.name + ' - ' + x.dept).join(', ')}${naTrainees.length > 2 ? '...' : ''}.`;
        } else if (failTrainees.length > 0) {
            issues = `Có ${failTrainees.length} học viên chưa đạt điểm chuẩn (Fail): ${failTrainees.slice(0, 2).map(x => x.name).join(', ')}.`;
        } else {
            issues = `Không có học viên trượt, lớp học đạt chất lượng 100%.`;
        }

        let actionPlan = countFail > 0 
            ? `Hẹn lịch thi lại L2 cho các bạn chưa đạt và bàn giao SM chi nhánh hỗ trợ đôn đốc hoàn thành chứng chỉ.`
            : `Bàn giao kết quả cho Quản lý chi nhánh theo dõi học viên thực chiến.`;

        // Điền vào form đóng khóa
        if (document.getElementById('totalTrainees')) document.getElementById('totalTrainees').value = totalHV;
        if (document.getElementById('passedTrainees')) document.getElementById('passedTrainees').value = countPass;
        if (document.getElementById('failedTrainees')) document.getElementById('failedTrainees').value = countFail;
        if (document.getElementById('csat')) document.getElementById('csat').value = '4.8/5';
        if (document.getElementById('highlights')) document.getElementById('highlights').value = highlights;
        if (document.getElementById('issues')) document.getElementById('issues').value = issues;
        if (document.getElementById('actionPlan')) document.getElementById('actionPlan').value = actionPlan;

        // Render Preview
        const previewContainer = document.getElementById('traineeParsedPreviewBox');
        if (previewContainer) {
            previewContainer.classList.remove('hidden');
            previewContainer.innerHTML = `
                <div class="mt-4 p-4 bg-white rounded-xl border border-blue-200 shadow-xs">
                    <div class="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                        <span class="text-xs font-bold text-slate-800">
                            Kết Quả LMS: <b class="text-blue-600">${totalHV} Học viên</b> | Đạt: <b class="text-emerald-600">${countPass} (${passRate}%)</b> | Trượt/Miss: <b class="text-rose-600">${countFail}</b>
                        </span>
                        <span class="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Đã chuẩn hóa Điểm & %</span>
                    </div>
                    <div class="max-h-48 overflow-y-auto custom-scrollbar text-xs divide-y divide-slate-100">
                        ${trainees.map(t => `
                            <div class="py-2 flex items-center justify-between">
                                <div class="min-w-0 pr-2">
                                    <span class="font-bold text-slate-800">${t.name}</span>
                                    <span class="text-slate-400 font-mono text-[10px] ml-1">(${t.dept})</span>
                                </div>
                                <div class="flex items-center gap-2.5 shrink-0">
                                    <span class="font-bold text-[11px] text-slate-700">${t.score} đ</span>
                                    <span class="font-mono font-bold text-[11px] text-blue-600">${t.pct}</span>
                                    <span class="px-2 py-0.5 rounded font-bold text-[10px] ${t.isPass ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">${t.result}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        alert(`⚡ ĐÃ BÓC TÁCH VÀ CHUẨN HÓA THÀNH CÔNG ${totalHV} HỌC VIÊN!\n\n- Sĩ số: ${totalHV}\n- Đạt (Đậu): ${countPass} (${passRate}%)\n- Trượt / Chưa thi (#N/A): ${countFail}\n\nToàn bộ điểm phẩy, tỷ lệ 10000% đã được tự động chuẩn hóa về số đẹp!`);
    };

    function autoInjectTraineeParserAndPreview() {
        const submitBtn = document.getElementById('btnSubmit');
        if (!submitBtn || document.getElementById('traineeParserContainer')) return;

        const parserWrapper = document.createElement('div');
        parserWrapper.id = 'traineeParserContainer';
        parserWrapper.className = 'trainee-parser-box';
        parserWrapper.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-bold text-blue-700 uppercase flex items-center gap-2">
                    <i class="fas fa-file-excel text-emerald-600 text-base"></i> Dán Bảng Điểm Thi Học Viên (Từ LMS / Excel)
                </label>
                <span class="text-[10px] text-slate-500 font-medium">Hỗ trợ nhận diện cột Đơn vị, tự sửa điểm 30,0 và lỗi 10000%</span>
            </div>
            <textarea id="rawTraineeExcelInput" class="w-full h-24 p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-mono outline-none focus:border-blue-500 focus:bg-white custom-scrollbar resize-none" placeholder="Copy từ LMS/Excel (có cột Họ tên, Đơn vị, Điểm, Điểm %, Kết quả...) dán vào đây..."></textarea>
            <div class="mt-2.5 flex justify-between items-center">
                <button type="button" onclick="window.parseTraineeExcelResults()" class="btn-primary py-2 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 border-none shadow-sm flex items-center gap-1.5">
                    <i class="fas fa-bolt text-amber-300"></i> Phân Tích & Chuẩn Hóa Số Liệu Tự Động
                </button>
            </div>
            <div id="traineeParsedPreviewBox" class="hidden"></div>
        `;

        const previewBtn = document.createElement('button');
        previewBtn.type = 'button';
        previewBtn.id = 'btnAutoPreviewMemo';
        previewBtn.className = 'w-full py-3.5 mb-3 rounded-xl border border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-sm shadow-sm transition flex items-center justify-center gap-2';
        previewBtn.innerHTML = '<i class="fas fa-eye text-blue-600"></i> Xem Trước Báo Cáo (Preview Form A4)';
        
        previewBtn.onclick = function () {
            const courseId = (document.getElementById('courseId') || document.getElementById('db-code'))?.value || '';
            const total = document.getElementById('totalTrainees')?.value || '0';
            const pass = document.getElementById('passedTrainees')?.value || '0';
            const fail = document.getElementById('failedTrainees')?.value || '0';
            const csat = document.getElementById('csat')?.value || '4.8/5';
            const highlights = document.getElementById('highlights')?.value || '';
            const issues = document.getElementById('issues')?.value || '';
            const actionPlan = document.getElementById('actionPlan')?.value || '';
            const status = document.getElementById('status')?.value || 'Hoàn thành';
            const start = (document.getElementById('conf-date-tue') || document.getElementById('start') || document.getElementById('conf-dl1'))?.value || '';
            const finish = (document.getElementById('conf-dl2') || document.getElementById('finish'))?.value || new Date().toISOString().split('T')[0];
            const listLink = document.getElementById('listLink')?.value || '';
            const quizLink = document.getElementById('quizLink')?.value || '';

            let group = 'Chung';
            const checkedIndustry = document.querySelector('input[name="industryType"]:checked');
            if (checkedIndustry) group = checkedIndustry.value;
            else if (window.location.pathname.includes('spcb')) group = 'SPCB';
            else if (window.location.pathname.includes('kv1')) group = 'KV1';
            else if (window.location.pathname.includes('thuehkd')) group = 'TAX';

            const payload = {
                courseId, groupName: group, totalTrainees: total, passedTrainees: pass, failedTrainees: fail,
                csat, highlights, issues, actionPlan, status, startDate: start, finishDate: finish, listLink, quizLink
            };

            window.openReportMemo(payload, true, function () {
                submitBtn.click();
            });
        };

        submitBtn.parentElement.insertBefore(parserWrapper, submitBtn.parentElement.firstChild);
        submitBtn.parentElement.insertBefore(previewBtn, submitBtn);
    }

    const originalFetch = window.fetch;
    window.fetch = function (url, options) {
        if (options && options.method === 'POST' && typeof options.body === 'string') {
            try {
                const parsedBody = JSON.parse(options.body);
                if (parsedBody && parsedBody.courseId && parsedBody.totalTrainees !== undefined) {
                    if (window.currentParsedTrainees && window.currentParsedTrainees.length > 0) {
                        parsedBody.traineeDetails = window.currentParsedTrainees;
                        options.body = JSON.stringify(parsedBody);
                    }
                }
            } catch (e) {}
        }
        return originalFetch.apply(this, arguments);
    };

    window.openReportMemo = function (courseData, isPreview = false, submitCallback = null) {
        injectMemoDom();

        const modal = document.getElementById('executiveReportModal');
        const prof = JSON.parse(localStorage.getItem('kv_trainer_profile')) || { name: 'Nguyễn Lê Nhật Vi', title: 'L&D Specialist' };
        
        const total = parseInt(courseData.totalTrainees) || 0;
        const pass = parseInt(courseData.passedTrainees) || 0;
        const fail = parseInt(courseData.failedTrainees) || 0;
        const rate = total > 0 ? Math.round((pass / total) * 100) : 0;
        const cId = courseData.courseId || 'CHƯA ĐẶT';

        const formattedStart = formatVietnameseDate(courseData.startDate);
        const formattedFinish = formatVietnameseDate(courseData.finishDate);
        const formattedToday = formatVietnameseDate(new Date());

        document.getElementById('memoTopTitle').innerText = isPreview ? 'XEM TRƯỚC PHIẾU BÁO CÁO (PREVIEW)' : 'PHIẾU BÁO CÁO TỔNG KẾT';
        document.getElementById('memoBadgeCourseId').innerText = `MÃ: ${cId}`;
        document.getElementById('memoDateCreated').innerText = `Ngày lập: ${formattedToday}`;
        document.getElementById('memoReportHeaderTitle').innerText = `Báo Cáo Tổng Kết Khóa ${cId}`;
        document.getElementById('memoSubHeaderInfo').innerText = `Phân hệ: ${courseData.groupName || 'Chung'} | Thời gian: ${formattedStart} đến ${formattedFinish}`;

        document.getElementById('memoGroupName').innerText = courseData.groupName || 'Khóa học nội bộ';
        document.getElementById('memoTrainerName').innerText = `${prof.name} (${prof.title})`;
        document.getElementById('memoTimeline').innerText = `${formattedStart} ➔ ${formattedFinish}`;
        document.getElementById('memoStatus').innerText = courseData.status || 'Hoàn thành';

        document.getElementById('memoTotalHV').innerText = total;
        document.getElementById('memoPassHV').innerText = pass;
        document.getElementById('memoFailHV').innerText = fail;
        document.getElementById('memoPassRate').innerText = `${rate}%`;
        document.getElementById('memoCsat').innerText = `${courseData.csat || '4.8/5'} ★`;

        document.getElementById('memoHighlights').innerText = courseData.highlights || 'Học viên hoàn thành tốt nội dung chương trình đào tạo theo kế hoạch.';
        document.getElementById('memoIssues').innerText = courseData.issues || 'Không có khó khăn lớn phát sinh trong quá trình vận hành.';
        document.getElementById('memoActionPlan').innerText = courseData.actionPlan || 'Tiếp tục bàn giao danh sách học viên cho Quản lý trực tiếp theo dõi.';

        const listLinkEl = document.getElementById('memoListLink');
        if (courseData.listLink && courseData.listLink.startsWith('http')) {
            listLinkEl.href = courseData.listLink;
            listLinkEl.classList.remove('opacity-50', 'pointer-events-none');
        } else {
            listLinkEl.classList.add('opacity-50', 'pointer-events-none');
        }

        const quizLinkEl = document.getElementById('memoQuizLink');
        if (courseData.quizLink && courseData.quizLink.startsWith('http')) {
            quizLinkEl.href = courseData.quizLink;
            quizLinkEl.classList.remove('opacity-50', 'pointer-events-none');
        } else {
            quizLinkEl.classList.add('opacity-50', 'pointer-events-none');
        }

        document.getElementById('memoSignName').innerText = prof.name;
        document.getElementById('memoFooterTrainer').innerText = prof.name;

        const actionBox = document.getElementById('memoActionButtons');
        if (isPreview && typeof submitCallback === 'function') {
            actionBox.innerHTML = `
                <button onclick="window.closeReportMemo()" class="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition shadow-xs">
                    Quay Lại Sửa
                </button>
                <button id="btnConfirmSubmitFromMemo" class="btn-primary py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 border-emerald-700 shadow-md text-xs font-bold flex items-center gap-2">
                    <i class="fas fa-cloud-upload-alt"></i> Xác Nhận & Nộp Lên Cloud
                </button>
            `;
            document.getElementById('btnConfirmSubmitFromMemo').onclick = function () {
                window.closeReportMemo();
                submitCallback();
            };
        } else {
            actionBox.innerHTML = `
                <button onclick="window.printReportMemo()" class="btn-primary py-2.5 px-5 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <i class="fas fa-print"></i> In / Xuất PDF
                </button>
                <button onclick="window.closeReportMemo()" class="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition shadow-xs">
                    Đóng Lại
                </button>
            `;
        }

        modal.classList.add('active');
        modal.scrollTop = 0;
    };

    window.closeReportMemo = function () {
        const modal = document.getElementById('executiveReportModal');
        if (modal) modal.classList.remove('active');
    };

    window.printReportMemo = function () {
        window.print();
    };

    window.openCourseMemoModal = function (courseId) {
        let db = [];
        try {
            db = JSON.parse(localStorage.getItem('kv_master_db')) || [];
        } catch(e) {}
        
        const course = db.find(d => String(d.courseId).toUpperCase() === String(courseId).toUpperCase());
        if (!course) return alert(`Không tìm thấy hồ sơ lưu trữ của khóa [${courseId}]!`);
        window.openReportMemo(course, false);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectMemoDom();
            autoInjectTraineeParserAndPreview();
        });
    } else {
        injectMemoDom();
        autoInjectTraineeParserAndPreview();
    }
})();
```

---

#### FILE 2: `index.html` (Đổi Logo Mới, Avatar Mới, Nút Ẩn Mở Workflow Bí Mật & Đồng Bộ Sidebar)

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trainer OS | Agentic Dashboard & Analytics</title>
    
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Nunito:wght@600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js"></script>

    <style>
        html { scroll-behavior: smooth; }
        body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; color: #1e293b; overflow: hidden; }
        
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }

        @keyframes fadeUpIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fadeUpIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .delay-100 { animation-delay: 0.08s; }
        .delay-200 { animation-delay: 0.15s; }
        .delay-300 { animation-delay: 0.22s; }

        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .skeleton { position: relative; overflow: hidden; background-color: #e5e7eb; }
        .skeleton::after {
            content: ''; position: absolute; top: 0; right: 0; bottom: 0; left: 0; transform: translateX(-100%);
            background-image: linear-gradient(90deg, rgba(255,255,255, 0) 0, rgba(255,255,255, 0.5) 20%, rgba(255,255,255, 0.8) 60%, rgba(255,255,255, 0));
            animation: shimmer 1.5s infinite;
        }

        .content-area { height: calc(100vh - 64px); overflow-y: auto; overflow-x: hidden; padding: 24px 32px; }
        .saas-card { 
            background: #ffffff; border-radius: 16px; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.02); 
            border: 1px solid #e5e7eb; 
            transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.1);
        }
        .saas-card:hover { 
            box-shadow: 0 12px 20px -4px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.03); 
            border-color: #cbd5e1; 
        }

        /* SIDEBAR STYLES */
        .sidebar-saas { background-color: #ffffff; border-right: 1px solid #e5e7eb; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow-x: hidden; }
        .sidebar-logo { height: 64px; display: flex; align-items: center; padding: 0 20px; border-bottom: 1px solid #e5e7eb; }
        .nav-group-title { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; padding: 0 24px; margin-top: 20px; margin-bottom: 8px; }
        
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px; margin: 2px 12px; font-size: 13.5px; font-weight: 500; color: #4b5563; cursor: pointer; transition: all 0.2s; border-radius: 8px; white-space: nowrap; }
        .nav-item:hover { background-color: #f3f4f6; color: #1f2937; }
        .nav-item.active { background-color: #eff6ff; color: #2563eb; font-weight: 600; }
        .nav-item.active i { color: #2563eb; }
        .nav-item i { width: 20px; text-align: center; color: #9ca3af; font-size: 16px; transition: color 0.2s; flex-shrink: 0; }

        .sidebar-collapsed { width: 64px !important; min-width: 64px !important; }
        .sidebar-collapsed .logo-full { display: none; }
        .sidebar-collapsed .logo-icon { display: block !important; margin: 0 auto; text-align: center; }
        .sidebar-collapsed .sidebar-logo { justify-content: center; padding: 0; }
        .sidebar-collapsed .nav-group-title { display: none; }
        .sidebar-collapsed .nav-item span:not(#tooltip-text) { display: none; }
        .sidebar-collapsed .nav-item i.fa-chevron-right { display: none; }
        .sidebar-collapsed .pulse-dot { display: none; }
        .sidebar-collapsed #submenu-cn { display: none !important; }
        .sidebar-collapsed .nav-item { justify-content: center !important; padding: 0 !important; margin: 6px auto !important; width: 40px !important; height: 40px !important; border-radius: 10px; }
        .sidebar-collapsed .nav-item i { margin: 0 !important; font-size: 16px !important; }
        .sidebar-collapsed .user-profile-area { justify-content: center !important; padding: 16px 0 !important; gap: 0 !important; }
        .sidebar-collapsed .user-profile-area .flex-grow { display: none !important; }

        .saas-input { width: 100%; background: #ffffff; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; transition: all 0.2s; }
        .saas-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .btn-outline { background: white; color: #374151; border: 1px solid #d1d5db; padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;}
        .btn-outline:hover { background-color: #f8fafc; border-color: #94a3b8; }
        .btn-primary { background-color: #2563eb; color: white; border: 1px solid #1d4ed8; padding: 7px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.15);}
        .btn-primary:hover { background-color: #1d4ed8; }

        table { width: 100%; border-collapse: collapse; }
        table th { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; padding: 12px 14px; border-bottom: 1px solid #e5e7eb; background: #f8fafc; text-align: left; }
        table td { font-size: 12.5px; padding: 12px 14px; border-bottom: 1px solid #f1f5f9; }

        /* WIDGETS */
        .widget-panel { position: fixed; bottom: 80px; right: 30px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.12); border: 1px solid #e5e7eb; z-index: 1000; transform: translateY(10px); opacity: 0; pointer-events: none; transition: all 0.3s; display: flex; flex-direction: column; overflow: hidden; }
        .widget-panel.active { transform: translateY(0); opacity: 1; pointer-events: auto; }
        .widget-panel.fullscreen-widget { width: 100vw !important; height: 100vh !important; bottom: 0 !important; right: 0 !important; border-radius: 0 !important; }
        #notesWidget { width: 450px; height: 600px; }
        #chatWidget { width: 340px; height: 450px; }
        .floating-tool { bottom: 20px; right: 30px; z-index: 100; }
        .wb-tool-btn { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #4b5563; transition: all 0.2s; background: #f9fafb; border: 1px solid #e5e7eb; cursor: pointer; }
        .wb-tool-btn:hover { background-color: #e5e7eb; color: #2563eb; }
        .wb-tool-btn.active { background-color: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
        input[type="color"] { -webkit-appearance: none; border: none; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; padding: 0; }
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type="color"]::-webkit-color-swatch { border: 1px solid #cbd5e1; border-radius: 4px; }

        .progress-bar-container { background-color: #f1f5f9; border-radius: 9999px; height: 18px; position: relative; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 9999px; transition: width 0.8s ease-in-out; }
        .tooltip-box { display: none; position: absolute; top: 110%; left: 0; background: #1e293b; color: white; padding: 8px 12px; border-radius: 8px; font-size: 11px; z-index: 9999; width: max-content; box-shadow: 0 10px 25px rgba(0,0,0,0.2); white-space: pre-line; line-height: 1.5;}
        .group:hover > .tooltip-box { display: block; animation: fadeUpIn 0.2s ease forwards; }

        /* FULLSCREEN PRESENTATION */
        #presentation-overlay { position: fixed; inset: 0; background: #f8fafc; z-index: 99999; display: none; font-family: 'Inter', sans-serif; overflow: hidden; background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 30px 30px;}
        #presentation-overlay.active { display: block; }
        .tech-slide { position: absolute; inset: 0; padding: 60px 80px; opacity: 0; transform: translateY(30px); transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; pointer-events: none; }
        .tech-slide.active { opacity: 1; transform: translateY(0); pointer-events: auto; z-index: 10;}
        .tech-title { font-size: 2.5rem; font-weight: 800; color: #1e293b; margin-bottom: 5px; text-transform: uppercase; letter-spacing: -0.05em;}
        .tech-subtitle { font-size: 1.1rem; color: #64748b; font-weight: 500; margin-bottom: 40px;}
        .tech-stat-card { background: rgba(255, 255, 255, 0.95); border: 1px solid #e2e8f0; border-radius: 20px; padding: 28px; text-align: center; box-shadow: 0 10px 35px -10px rgba(0,0,0,0.06); backdrop-filter: blur(10px); }
        .tech-stat-val { font-size: 3.5rem; font-weight: 800; color: var(--accent); margin: 8px 0; line-height: 1;}
        .tech-stat-label { font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;}
        .insight-box { padding: 18px; background: white; border-left: 4px solid #3b82f6; margin-bottom: 12px; border-radius: 0 12px 12px 0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04); font-size: 14px; color: #334155; line-height: 1.6;}
        .tech-nav { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); display: flex; gap: 15px; background: white; padding: 10px 18px; border-radius: 100px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); z-index: 100000; }
        .tech-nav button { width: 40px; height: 40px; border-radius: 50%; border: none; background: #f1f5f9; color: #475569; font-size: 16px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center;}
        .tech-nav button:hover { background: #3b82f6; color: white; }

        .modal { display: none; opacity: 0; transition: opacity 0.2s; z-index: 99999; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); }
        .modal.active { display: flex; opacity: 1; }
        .modal-content { transform: scale(0.98) translateY(10px); opacity: 0; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .modal.active .modal-content { transform: scale(1) translateY(0); opacity: 1; }
    </style>
</head>
<body>

    <div class="flex h-screen">
        <!-- SIDEBAR CHUẨN KIOTVIET L&D (LOGO MỚI & 2 MODULE MỚI) -->
        <aside id="sidebar" class="sidebar-saas w-64 flex flex-col z-50 shrink-0">
            <!-- LOGO THƯƠNG HIỆU MỚI -->
            <div class="sidebar-logo">
                <img src="https://i.postimg.cc/13fmPWCq/Logo-Vie.png" alt="Logo" class="h-[36px] max-w-[175px] object-contain logo-full">
                <div class="logo-icon hidden w-[34px] h-[34px] overflow-hidden rounded-full shadow-sm">
                    <img src="https://i.postimg.cc/13fmPWCq/Logo-Vie.png" class="h-[34px] w-[34px] object-cover" alt="Logo">
                </div>
            </div>

            <nav class="flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar">
                <div class="nav-group-title">Tổng quan</div>
                <div onclick="switchTab('tong-quan')" class="nav-item active" data-title="Bảng điều khiển"><i class="fas fa-chart-line"></i> <span>Bảng điều khiển</span></div>

                <div class="nav-group-title">Quản trị Khóa học</div>
                <a href="spcb.html" class="nav-item" data-title="Cơ bản (TS-DS)"><i class="fas fa-box"></i> <span>Cơ bản (TS-DS)</span></a>
                <a href="thuehkd.html" class="nav-item" data-title="Chuyên đề Thuế"><i class="fas fa-file-invoice-dollar"></i> <span>Chuyên đề Thuế</span></a>
                
                <div class="flex flex-col">
                    <div class="nav-item group justify-between" onclick="toggleAccordion('submenu-cn', 'icon-cn')" data-title="Chuyên ngành">
                        <div class="flex items-center gap-3"><i class="fas fa-laptop-code"></i> <span>Chuyên ngành</span></div>
                        <i id="icon-cn" class="fas fa-chevron-right text-[10px] text-slate-400 transition-transform duration-300"></i>
                    </div>
                    <div id="submenu-cn" class="max-h-0 overflow-hidden transition-all duration-300 ease-in-out pl-[44px] flex flex-col gap-1 pr-4">
                        <a href="kv1.html" class="py-2 text-[13px] font-medium text-slate-500 hover:text-blue-600 transition-colors">Sản phẩm KV1</a>
                        <a href="industry.html" class="py-2 text-[13px] font-medium text-slate-500 hover:text-orange-500 transition-colors">KiotViet FNB</a>
                        <a href="industry.html" class="py-2 text-[13px] font-medium text-slate-500 hover:text-pink-500 transition-colors">KV Salon</a>
                        <a href="industry.html" class="py-2 text-[13px] font-medium text-slate-500 hover:text-emerald-500 transition-colors">KV Hotel</a>
                    </div>
                </div>
                <div onclick="switchTab('khoa-hoc')" class="nav-item" data-title="Tất cả khóa học"><i class="fas fa-th-large"></i> <span>Tất cả khóa học</span></div>

                <div class="nav-group-title">Công cụ & Tài nguyên</div>
                <!-- 2 MODULE MỚI ĐÃ ĐỒNG BỘ VÀO SIDEBAR -->
                <a href="coderunner.html" class="nav-item" data-title="HTML Code Studio"><i class="fas fa-laptop-code text-blue-600"></i> <span>HTML Code Studio</span></a>
                <a href="radar.html" class="nav-item relative" data-title="Radar Sản Phẩm Mới">
                    <i class="fas fa-satellite-dish text-purple-600"></i> <span>Radar Sản Phẩm Mới</span>
                    <span id="sidebar-alert-dot" class="w-2 h-2 rounded-full bg-rose-500 absolute right-4 animate-pulse hidden"></span>
                </a>
                <a href="knowledge.html" class="nav-item relative" data-title="Sơ đồ Vận hành">
                    <i class="fas fa-project-diagram"></i> <span>Sơ đồ Vận hành</span>
                    <span class="pulse-dot absolute right-4 w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                </a>
                <a href="vault.html" class="nav-item" data-title="Kho Lưu Trữ Vault"><i class="fas fa-box-open"></i> <span>Kho Lưu Trữ Vault</span></a>
                <a href="tools.html" class="nav-item" data-title="Runner Tools"><i class="fas fa-bolt"></i> <span>Runner Tools</span></a>
                
                <div class="nav-group-title">Dữ liệu & Hệ thống</div>
                <a href="knowledge-hub.html" class="nav-item" data-title="Master Data Hub"><i class="fas fa-database"></i> <span>Master Data Hub</span></a>
                <a href="settings.html" class="nav-item" data-title="Cài đặt hệ thống"><i class="fas fa-cog"></i> <span>Cài đặt hệ thống</span></a>
            </nav>

            <!-- USER PROFILE AREA VỚI AVATAR MỚI & BÍ MẬT EASTER EGG KHI NHẤP ĐÚP -->
            <div class="user-profile-area p-4 border-t border-slate-200 shrink-0 flex items-center gap-3 bg-slate-50/50 hover:bg-slate-100 transition cursor-pointer select-none" ondblclick="secretOpenWorkflow(event)" onclick="location.href='settings.html'" title="Click để vào Cài đặt Profile (Nhấp đúp mở System Workflow)">
                <div class="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0 border border-slate-300 overflow-hidden shadow-xs">
                    <img src="https://i.postimg.cc/13fmPWCq/Logo-Vie.png" class="w-full h-full object-cover" alt="Avatar">
                </div>
                <div class="overflow-hidden flex-grow">
                    <p id="display-prof-name" class="text-[13px] font-bold text-slate-800 truncate">L&D KiotViet</p>
                    <p id="display-prof-title" class="text-[11px] font-medium text-slate-500 truncate">Administrator</p>
                </div>
            </div>
        </aside>

        <!-- MAIN LAYOUT -->
        <div class="flex-1 flex flex-col overflow-hidden relative">
            <header class="h-16 bg-white flex items-center justify-between px-6 z-40 shrink-0 shadow-sm border-b border-slate-200">
                <div class="flex items-center gap-4">
                    <button onclick="toggleSidebar()" class="w-8 h-8 rounded bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition border border-slate-200">
                        <i class="fas fa-bars"></i>
                    </button>
                    <!-- NÚT MỞ BÍ MẬT SYSTEM-WORKFLOW.HTML (NHẤP ĐÚP HOẶC CTRL+CLICK VÀO ĐÈN TRẠNG THÁI) -->
                    <div id="db-status-indicator" onclick="secretOpenWorkflow(event)" class="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer select-none group" title="Hệ Thống Trạng Thái (Nhấp đúp để mở System Architecture Map)">
                        <i class="fas fa-circle text-[8px] text-amber-500 group-hover:scale-125 transition-transform"></i>
                        <span>Local Mode</span>
                    </div>
                </div>

                <div class="flex items-center gap-6">
                    <button onclick="openCanvaReportModal()" class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm hover:shadow transition flex items-center gap-1.5">
                        <i class="fas fa-magic text-amber-300"></i> AI Slide Generator
                    </button>

                    <!-- Notification Bell -->
                    <div class="relative">
                        <i id="bellIcon" onclick="toggleNoti(event)" class="far fa-bell text-slate-400 hover:text-blue-600 cursor-pointer text-xl relative">
                            <span id="unreadDot" class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white hidden"></span>
                        </i>
                        <div id="notiDropdown" class="hidden absolute right-0 top-10 w-[340px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                            <div class="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                                <span class="font-bold text-slate-800 text-sm">Thông báo Lịch Đào Tạo</span>
                                <span onclick="markAllRead(event)" class="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline">Đã đọc</span>
                            </div>
                            <div class="max-h-[350px] overflow-y-auto custom-scrollbar p-0" id="notiContent"></div>
                        </div>
                    </div>

                    <!-- Profile Header Link với Avatar Mới -->
                    <div class="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer" onclick="location.href='settings.html'">
                        <div class="text-right hidden md:block">
                            <p class="text-sm font-bold text-slate-800 leading-tight" id="header-prof-name">L&D KiotViet</p>
                            <p class="text-[11px] text-slate-500" id="header-prof-title">Administrator</p>
                        </div>
                        <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shadow-xs">
                            <img src="https://i.postimg.cc/13fmPWCq/Logo-Vie.png" class="w-full h-full object-cover" alt="Avatar">
                        </div>
                    </div>
                </div>
            </header>

            <main class="content-area" id="main-tab-container">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div class="saas-card p-5 flex items-center gap-4 animate-fade-up"><div class="w-14 h-14 rounded-2xl skeleton shrink-0"></div><div class="w-full"><div class="h-6 skeleton w-1/2 rounded mb-2"></div><div class="h-3 skeleton w-3/4 rounded"></div></div></div>
                    <div class="saas-card p-5 flex items-center gap-4 animate-fade-up delay-100"><div class="w-14 h-14 rounded-2xl skeleton shrink-0"></div><div class="w-full"><div class="h-6 skeleton w-1/2 rounded mb-2"></div><div class="h-3 skeleton w-3/4 rounded"></div></div></div>
                    <div class="saas-card p-5 flex items-center gap-4 animate-fade-up delay-200"><div class="w-14 h-14 rounded-2xl skeleton shrink-0"></div><div class="w-full"><div class="h-6 skeleton w-1/2 rounded mb-2"></div><div class="h-3 skeleton w-3/4 rounded"></div></div></div>
                    <div class="saas-card p-5 flex items-center gap-4 animate-fade-up delay-300"><div class="w-14 h-14 rounded-2xl skeleton shrink-0"></div><div class="w-full"><div class="h-6 skeleton w-1/2 rounded mb-2"></div><div class="h-3 skeleton w-3/4 rounded"></div></div></div>
                </div>
            </main>
        </div>
    </div>

    <!-- WIDGET SỔ VẼ WHITEBOARD (FABRIC.JS 100%) -->
    <div id="notesWidget" class="widget-panel">
        <div class="bg-slate-800 px-4 py-3 flex justify-between items-center shrink-0">
            <span class="font-bold text-sm text-white flex items-center gap-2"><i class="fas fa-object-group text-purple-400"></i> Bảng Phác Thảo Ghi chú</span>
            <div class="flex items-center gap-4">
                <button onclick="toggleFullscreen()" class="text-slate-400 hover:text-white" title="Toàn màn hình"><i class="far fa-window-maximize"></i></button>
                <button onclick="toggleNotes()" class="text-slate-400 hover:text-rose-500" title="Đóng"><i class="fas fa-times text-lg"></i></button>
            </div>
        </div>
        
        <div class="flex text-xs border-b border-slate-200 bg-slate-50 shrink-0">
            <button onclick="switchNoteTab('draw')" id="tab-draw" class="flex-1 py-2.5 font-bold text-purple-600 bg-white border-b-2 border-purple-500 transition-colors"><i class="fas fa-pencil-alt mr-1"></i> Bảng vẽ Hình khối</button>
            <button onclick="switchNoteTab('text')" id="tab-text" class="flex-1 py-2.5 font-semibold text-slate-500 hover:text-slate-800 transition-colors"><i class="fas fa-font mr-1"></i> Sổ Ghi chú Text</button>
        </div>
        
        <div id="drawToolbar" class="bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap gap-4 items-center shrink-0">
            <div class="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                <button class="wb-tool-btn active" onclick="setWbMode('select')" title="Chọn"><i class="fas fa-mouse-pointer"></i></button>
                <button class="wb-tool-btn" onclick="setWbMode('draw')" title="Bút vẽ"><i class="fas fa-pen"></i></button>
                <div class="w-px h-5 bg-slate-300 mx-1"></div>
                <button class="wb-tool-btn" onclick="addShape('rect')" title="Ô vuông"><i class="far fa-square"></i></button>
                <button class="wb-tool-btn" onclick="addShape('circle')" title="Hình tròn"><i class="far fa-circle"></i></button>
                <button class="wb-tool-btn" onclick="addPureText()" title="Viết Text trong suốt"><i class="fas fa-font"></i></button>
                <button class="wb-tool-btn bg-amber-100 text-amber-600 border-amber-200 hover:bg-amber-200" onclick="addStickyNote()" title="Ghi chú Vàng"><i class="fas fa-sticky-note"></i></button>
            </div>
            <div class="flex items-center gap-3 bg-slate-100 p-1.5 rounded-lg">
                <div class="flex items-center gap-1.5" title="Màu Nền"><i class="fas fa-fill-drip text-slate-400 text-xs"></i><input type="color" id="shapeBgColor" value="#fef08a" onchange="applyWbColor('bg', this.value)"></div>
                <div class="w-px h-5 bg-slate-300"></div>
                <div class="flex items-center gap-1.5" title="Màu Chữ/Viền"><i class="fas fa-palette text-slate-400 text-xs"></i><input type="color" id="textColor" value="#1e293b" onchange="applyWbColor('text', this.value)"></div>
                <div class="w-px h-5 bg-slate-300"></div>
                <button class="wb-tool-btn text-rose-500 hover:text-rose-600 border-none bg-transparent" onclick="deleteSelected()" title="Xóa"><i class="fas fa-trash-alt"></i></button>
            </div>
            <div class="flex items-center gap-2 ml-auto">
                <button onclick="newDrawing()" class="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm"><i class="fas fa-plus"></i> Clear</button>
            </div>
        </div>

        <div class="relative flex-grow bg-white" id="note-container">
            <div id="drawArea" class="absolute inset-0 block" style="background-image: radial-gradient(#cbd5e1 1.5px, transparent 1.5px); background-size: 20px 20px;">
                <canvas id="fabricCanvas"></canvas>
            </div>
            <textarea id="stickyNoteText" oninput="saveTextNotes()" class="absolute inset-0 w-full h-full p-5 bg-yellow-50 resize-none outline-none text-[15px] font-medium text-slate-800 custom-scrollbar hidden shadow-inner leading-relaxed" placeholder="Bắt đầu gõ ghi chú của bạn vào đây..."></textarea>
        </div>
    </div>

    <!-- AI CHATBOT KEVIN -->
    <div id="chatWidget" class="widget-panel">
        <div class="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center shrink-0">
            <span class="font-semibold text-sm text-slate-800"><i class="fas fa-robot text-blue-500 mr-2"></i> Kevin - AI Assistant</span>
            <button onclick="toggleChat()" class="text-slate-400 hover:text-slate-700"><i class="fas fa-times"></i></button>
        </div>
        <div id="chatHistory" class="flex-grow p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3 bg-slate-50">
            <div class="bg-white border border-slate-200 p-3 rounded-lg shadow-sm text-[13px] text-slate-700 w-11/12">Xin chào! Tôi là Kevin. Tôi có thể đọc toàn bộ dữ liệu khóa học và kho quà tặng để hỗ trợ bạn thống kê thông tin.</div>
        </div>
        <div class="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0">
            <input type="text" id="chatInput" onkeypress="handleChatEnter(event)" class="saas-input" placeholder="Hỏi Kevin về khóa học...">
            <button onclick="sendChatMessage()" class="w-9 h-9 shrink-0 bg-blue-600 text-white rounded flex items-center justify-center hover:bg-blue-700"><i class="fas fa-paper-plane text-xs"></i></button>
        </div>
    </div>

    <div class="fixed floating-tool flex flex-col gap-3">
        <button onclick="toggleNotes()" class="w-12 h-12 bg-white text-purple-600 border-2 border-slate-200 rounded-full shadow-lg hover:bg-slate-50 flex items-center justify-center transition-all" title="Bảng Phác Thảo">
            <i class="fas fa-paint-brush text-lg"></i>
        </button>
        <button onclick="toggleChat()" class="w-12 h-12 bg-slate-800 text-white border-2 border-white rounded-full shadow-lg hover:bg-slate-900 hover:scale-110 flex items-center justify-center transition-all" title="Trợ lý AI">
            <i class="fas fa-robot text-lg"></i>
        </button>
    </div>

    <!-- MODAL NẠP DỮ LIỆU KHẢO SÁT -->
    <div id="surveyModal" class="modal fixed inset-0 items-center justify-center p-4 bg-slate-900/60 z-[99999]">
        <div class="modal-content bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-200 flex justify-between bg-slate-50">
                <h3 class="font-bold text-slate-800 flex items-center gap-2"><i class="fas fa-clipboard-check text-purple-600"></i> Nạp Dữ Liệu Khảo Sát Học Viên</h3>
                <button onclick="closeSurveyInput()" class="text-slate-500"><i class="fas fa-times"></i></button>
            </div>
            <div class="p-6 grid grid-cols-2 gap-4">
                <div>
                    <label class="text-xs font-bold text-blue-600 block mb-2">Data Khảo sát SPCB (Copy từ Excel)</label>
                    <textarea id="survey-spcb" oninput="saveSurveyDrafts()" class="saas-input h-64 text-[11px] font-mono" placeholder="Dán các cột điểm 1-5 và ý kiến góp ý của học viên..."></textarea>
                </div>
                <div>
                    <label class="text-xs font-bold text-emerald-600 block mb-2">Data Khảo sát Thuế - Kế toán</label>
                    <textarea id="survey-tax" oninput="saveSurveyDrafts()" class="saas-input h-64 text-[11px] font-mono" placeholder="Dán các cột điểm 1-5 và ý kiến góp ý của học viên..."></textarea>
                </div>
            </div>
            <div class="p-4 bg-slate-50 text-right">
                <button onclick="closeSurveyInput(); showToast('Đã lưu dữ liệu Khảo sát vào hệ thống!');" class="btn-primary">Lưu Data & Đóng</button>
            </div>
        </div>
    </div>

    <!-- TRÌNH CHIẾU SLIDE BÁO CÁO FULLSCREEN -->
    <div id="presentation-overlay">
        <button onclick="closePresentation()" class="fixed top-8 right-8 w-10 h-10 bg-white rounded-full text-slate-400 hover:text-rose-500 shadow-md text-xl z-[100000] flex items-center justify-center transition"><i class="fas fa-times"></i></button>
        <div class="fixed top-8 left-8 z-[100000] font-bold text-slate-800 tracking-widest bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100"><i class="fas fa-layer-group text-blue-600 mr-2"></i> TRAINER OS REPORT</div>
        
        <div class="tech-slide active" id="tslide-1">
            <div class="h-full flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
                <div class="w-24 h-24 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-4xl mb-8 shadow-2xl shadow-blue-500/30 transform rotate-12"><i class="fas fa-chart-pie -rotate-12"></i></div>
                <h1 class="text-6xl font-black text-slate-800 mb-6 tracking-tight leading-tight">Báo Cáo Tổng Kết<br><span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Hoạt Động Đào Tạo</span></h1>
                <p class="text-2xl text-slate-500 font-medium mb-12" id="slide-period-title">Báo cáo động (Real-time) từ Hệ thống AI</p>
                <div class="text-5xl font-black text-slate-300" id="slide-year">2026</div>
            </div>
        </div>

        <div class="tech-slide" id="tslide-2">
            <div class="max-w-6xl mx-auto w-full">
                <h2 class="tech-title text-center">I. Hiệu Suất Tổng Quan</h2>
                <p class="tech-subtitle text-center" id="slide-sub-period">Dữ liệu Master DB cập nhật tức thời</p>
                
                <div class="grid grid-cols-4 gap-8 mt-10">
                    <div class="tech-stat-card" style="--accent: #3b82f6"><div class="tech-stat-val" id="sl-total-class">0</div><p class="tech-stat-label">Tổng Lớp Học</p></div>
                    <div class="tech-stat-card" style="--accent: #10b981"><div class="tech-stat-val" id="sl-total-hv">0</div><p class="tech-stat-label">Học Viên</p></div>
                    <div class="tech-stat-card" style="--accent: #f59e0b"><div class="tech-stat-val" id="sl-pass-rate">0%</div><p class="tech-stat-label">Tỷ lệ Pass</p></div>
                    <div class="tech-stat-card" style="--accent: #8b5cf6"><div class="tech-stat-val" id="sl-csat">4.8/5</div><p class="tech-stat-label">Mức Hài Lòng (CSAT)</p></div>
                </div>
                
                <div class="mt-12 grid grid-cols-2 gap-8">
                    <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
                        <h3 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2 border-b border-slate-100 pb-3"><i class="fas fa-chalkboard-teacher text-blue-500"></i> Trực Tiếp (Taught)</h3>
                        <div id="sl-taught-detail" class="space-y-3"></div>
                    </div>
                    <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
                        <h3 class="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2 border-b border-slate-100 pb-3"><i class="fas fa-laptop-house text-emerald-500"></i> Tự Học (LMS/Self)</h3>
                        <div id="sl-self-detail" class="space-y-3"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="tech-slide" id="tslide-3">
            <div class="max-w-6xl mx-auto w-full h-full flex flex-col">
                <h2 class="tech-title text-center">II. AI Phân Tích & Insight</h2>
                <p class="tech-subtitle text-center">Đánh giá chất lượng và định hướng hành động</p>
                
                <div class="grid grid-cols-2 gap-10 mt-6 flex-grow overflow-hidden">
                    <div class="flex flex-col h-full">
                        <h3 class="text-blue-600 font-bold text-xl mb-4 bg-blue-50 py-2 px-4 rounded-lg inline-block w-max"><i class="fas fa-comment-dots mr-2"></i>Phản hồi từ Khảo sát</h3>
                        <div id="sl-survey-insights" class="overflow-y-auto pr-4 flex-grow custom-scrollbar"></div>
                    </div>
                    <div class="flex flex-col h-full">
                        <h3 class="text-emerald-600 font-bold text-xl mb-4 bg-emerald-50 py-2 px-4 rounded-lg inline-block w-max"><i class="fas fa-brain mr-2"></i>Đánh giá Hệ thống L&D</h3>
                        <div id="sl-ai-evaluation" class="overflow-y-auto pr-4 flex-grow custom-scrollbar"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="tech-nav">
            <button onclick="changeSlide(-1)"><i class="fas fa-chevron-left"></i></button>
            <button onclick="changeSlide(1)"><i class="fas fa-chevron-right"></i></button>
        </div>
    </div>

    <!-- MODAL BÁO CÁO AI CANVA PRO -->
    <div id="canvaReportModal" class="modal fixed inset-0 items-center justify-center p-4 z-[99999]">
        <div class="modal-content bg-white w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-200">
            <div class="px-6 py-4 bg-gradient-to-r from-purple-700 to-blue-700 flex justify-between items-center shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-amber-300 font-bold"><i class="fas fa-magic"></i></div>
                    <div>
                        <h3 class="font-bold text-white text-base leading-tight">AI Report Generator (Canva Pro Edition)</h3>
                        <p class="text-[11px] text-purple-200" id="canvaPeriodTag">Kỳ báo cáo: Toàn bộ thời gian</p>
                    </div>
                </div>
                <button onclick="closeModal('canvaReportModal')" class="text-white/70 hover:text-white w-8 h-8 flex items-center justify-center bg-white/10 rounded-full transition"><i class="fas fa-times"></i></button>
            </div>
            
            <div class="flex flex-grow overflow-hidden">
                <div class="w-2/3 border-r border-slate-200 bg-slate-50 flex flex-col p-6 relative">
                    <div class="flex justify-between items-center mb-4 shrink-0">
                        <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Kịch bản Slide (Markdown format)</p>
                        <button id="btnCopyCanva" onclick="copyToCanva()" class="btn-primary bg-slate-800 border-slate-900 shadow-md hidden opacity-0 transition-opacity duration-300"><i class="far fa-copy mr-1"></i> Copy kịch bản</button>
                    </div>
                    <div id="canvaReportContent" class="flex-grow bg-white border border-slate-200 rounded-xl p-6 overflow-y-auto custom-scrollbar text-[14px] leading-relaxed text-slate-700 font-mono shadow-inner relative">
                        <div class="flex flex-col items-center justify-center h-full text-slate-400">
                            <i class="fas fa-robot text-5xl mb-4 text-slate-300"></i>
                            <p class="font-medium">Bấm nút "Tạo Báo Cáo" bên phải để AI bắt đầu phân tích dữ liệu kỳ này...</p>
                        </div>
                    </div>
                </div>

                <div class="w-1/3 bg-white p-6 flex flex-col">
                    <div class="mb-6">
                        <h4 class="font-bold text-slate-800 mb-2">Trợ lý Kevin đọc số liệu gì?</h4>
                        <ul class="text-[13px] text-slate-600 space-y-2">
                            <li><i class="fas fa-check text-emerald-500 mr-2"></i> Lọc dữ liệu theo kỳ bạn chọn</li>
                            <li><i class="fas fa-check text-emerald-500 mr-2"></i> Điểm CSAT trung bình thực tế</li>
                            <li><i class="fas fa-check text-emerald-500 mr-2"></i> Điểm sáng nổi bật (Highlights)</li>
                            <li><i class="fas fa-check text-emerald-500 mr-2"></i> Tồn đọng (Issues) & Kế hoạch tiếp theo</li>
                        </ul>
                    </div>
                    
                    <button onclick="generateCanvaReport()" id="btnGenReport" class="btn-primary w-full py-4 text-sm bg-gradient-to-r from-purple-600 to-blue-600 border-none shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all mb-8">
                        <i class="fas fa-bolt text-amber-300 mr-2"></i> TẠO BÁO CÁO NGAY
                    </button>

                    <div class="mt-auto bg-blue-50 border border-blue-200 rounded-xl p-5">
                        <h4 class="font-bold text-blue-800 mb-2 text-sm"><i class="fas fa-info-circle mr-1"></i> Hướng dẫn tạo Slide trên Canva</h4>
                        <ol class="text-[12px] text-blue-700 space-y-1.5 list-decimal pl-4">
                            <li>Bấm <b>Copy Kịch bản</b>.</li>
                            <li>Vào Canva, chọn tạo <b>Canva Docs</b>.</li>
                            <li>Dán (Ctrl+V) toàn bộ nội dung vào Doc.</li>
                            <li>Bấm nút <b>Chuyển đổi (Convert) ➔ Thành Bản thuyết trình</b>.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Global Tooltip Nổi -->
    <div id="global-tooltip" class="fixed bg-slate-800 text-white text-[12px] font-medium px-3 py-1.5 rounded-lg shadow-xl pointer-events-none opacity-0 transition-opacity duration-200 z-[100000] whitespace-nowrap flex items-center">
        <div class="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
        <span id="tooltip-text" class="relative z-10"></span>
    </div>

    <!-- Global Toast Banner -->
    <div id="toast" class="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl font-medium text-sm z-[100000] opacity-0 pointer-events-none transition-all duration-300 flex items-center gap-3">
        <span id="toast-msg"></span>
    </div>

    <!-- SCRIPTS LÕI BÁO CÁO TIÊN TIẾN -->
    <script>
        localforage.config({ name: 'TrainerOS_Database' });
        const GOOGLE_API_URL = localStorage.getItem('kv_api_url') || "";
        let globalMasterDB = []; 
        let globalGiftsDB = [];
        let perfChartInstance = null;
        let trendChartInstance = null;
        let fCanvas = null;

        let currentReportTimeRange = 'all';
        let masterTableSearchKeyword = '';

        // NÚT MỞ BÍ MẬT FILE SYSTEM-WORKFLOW.HTML (EASTER EGG NHẤP ĐÚP)
        let secretClickCount = 0;
        function secretOpenWorkflow(e) {
            secretClickCount++;
            if (secretClickCount >= 2 || e.ctrlKey || e.metaKey) {
                secretClickCount = 0;
                window.open('system-workflow.html', '_blank');
            }
            setTimeout(() => { secretClickCount = 0; }, 800);
        }

        const courseCatalog = [
            { id: 'SPCB', group: 'Retail', title: 'Cơ bản (TS-DS)', desc: 'Quy trình Onboard 3 ngày dành cho nhân viên kinh doanh mới.', link: 'spcb.html', icon: 'fa-box', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
            { id: 'TAX', group: 'Specialist', title: 'Chuyên đề Thuế', desc: 'Hóa đơn điện tử, Chữ ký số & Kế toán Hộ kinh doanh.', link: 'thuehkd.html', icon: 'fa-file-invoice-dollar', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
            { id: 'KV1', group: 'Advanced', title: 'Sản phẩm KV1', desc: 'Chuyên ngành bán lẻ nâng cao và xử lý tình huống KV1.', link: 'kv1.html', icon: 'fa-laptop-code', color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
            { id: 'FNB', group: 'Industry', title: 'KiotViet FNB', desc: 'Quy trình vận hành ngành Nhà hàng & Cafe.', link: 'industry.html', icon: 'fa-utensils', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
            { id: 'SALON', group: 'Industry', title: 'KiotViet Salon', desc: 'Kịch bản vận hành ngành Spa & Thẩm mỹ viện.', link: 'industry.html', icon: 'fa-spa', color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-200' },
            { id: 'HOTEL', group: 'Industry', title: 'KiotViet Hotel', desc: 'Kịch bản quản lý Khách sạn & Nhà nghỉ.', link: 'industry.html', icon: 'fa-hotel', color: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-200' }
        ];

        const defaultGifts = [ { name: 'Túi tote', in: 0, out: 0 }, { name: 'Bình nước', in: 0, out: 0 }, { name: 'Áo mưa', in: 0, out: 0 }, { name: 'Cốc', in: 0, out: 0 }, { name: 'Sổ', in: 0, out: 0 } ];

        function showToast(msg) {
            const t = document.getElementById('toast');
            if(!t) return;
            document.getElementById('toast-msg').innerHTML = `<i class="fas fa-check-circle text-emerald-400 mr-2"></i> ${msg}`;
            t.classList.replace('opacity-0', 'opacity-100');
            t.classList.remove('pointer-events-none');
            setTimeout(() => {
                t.classList.replace('opacity-100', 'opacity-0');
                t.classList.add('pointer-events-none');
            }, 3000);
        }

        async function fetchDatabase() {
            try {
                if(!GOOGLE_API_URL) throw new Error("Local");
                document.getElementById('db-status-indicator').innerHTML = `<i class="fas fa-circle-notch fa-spin text-[10px] text-emerald-500"></i> Syncing...`;
                const response = await fetch(GOOGLE_API_URL);
                const data = await response.json();
                if (data && Array.isArray(data.master)) {
                    globalMasterDB = data.master;
                    localStorage.setItem('kv_master_db', JSON.stringify(data.master));
                    if(data.gifts && data.gifts.length > 0) {
                        globalGiftsDB = data.gifts;
                        localStorage.setItem('kv_gift_db', JSON.stringify(data.gifts));
                    }
                }
                document.getElementById('db-status-indicator').innerHTML = `<i class="fas fa-circle text-[8px] text-emerald-500"></i> Cloud API Active`;
            } catch (err) {
                try {
                    const localDB = JSON.parse(localStorage.getItem('kv_master_db'));
                    globalMasterDB = Array.isArray(localDB) ? localDB : [];
                    globalGiftsDB = JSON.parse(localStorage.getItem('kv_gift_db')) || defaultGifts;
                } catch(e) { globalMasterDB = []; globalGiftsDB = defaultGifts; }
                document.getElementById('db-status-indicator').innerHTML = `<i class="fas fa-circle text-[8px] text-amber-500"></i> Local Mode`;
            }
        }

        function getFilteredMasterData() {
            let data = Array.isArray(globalMasterDB) ? globalMasterDB.slice() : [];
            const r = currentReportTimeRange;
            if (r === 'all') return data;

            return data.filter(d => {
                let m = parseInt(d.month) || 0;
                if (!m && d.startDate) {
                    const parts = d.startDate.split('-');
                    if (parts.length >= 2) m = parseInt(parts[1]) || 0;
                }
                if (!m && d.timestamp) {
                    m = new Date(d.timestamp).getMonth() + 1;
                }

                if (r === 'year') return true;
                if (r === 'q1') return m >= 1 && m <= 3;
                if (r === 'q2') return m >= 4 && m <= 6;
                if (r === 'q3') return m >= 7 && m <= 9;
                if (r === 'q4') return m >= 10 && m <= 12;
                if (r.startsWith('m')) {
                    const targetM = parseInt(r.replace('m', ''));
                    return m === targetM;
                }
                return true;
            });
        }

        function getTimeRangeLabel() {
            const r = currentReportTimeRange;
            if (r === 'all') return 'Toàn bộ thời gian';
            if (r === 'year') return 'Cả năm 2026';
            if (r === 'q1') return 'Quý 1/2026 (Tháng 1 - 3)';
            if (r === 'q2') return 'Quý 2/2026 (Tháng 4 - 6)';
            if (r === 'q3') return 'Quý 3/2026 (Tháng 7 - 9)';
            if (r === 'q4') return 'Quý 4/2026 (Tháng 10 - 12)';
            if (r.startsWith('m')) return `Tháng ${r.replace('m', '').padStart(2, '0')}/2026`;
            return 'Toàn bộ thời gian';
        }

        function applyReportFilter(rangeVal) {
            currentReportTimeRange = rangeVal || document.getElementById('reportTimeRange').value;
            switchTab('tong-quan');
            showToast(`Đã lọc báo cáo: ${getTimeRangeLabel()}`);
        }

        function toggleSidebar() { 
            document.getElementById('sidebar').classList.toggle('sidebar-collapsed'); 
        }

        function toggleAccordion(menuId, iconId) {
            const menu = document.getElementById(menuId); const icon = document.getElementById(iconId);
            if (menu.style.maxHeight && menu.style.maxHeight !== '0px') {
                menu.style.maxHeight = '0px'; icon.style.transform = 'rotate(0deg)';
            } else {
                menu.style.maxHeight = menu.scrollHeight + 'px'; icon.style.transform = 'rotate(90deg)';
            }
        }

        const tooltip = document.getElementById('global-tooltip');
        const tooltipText = document.getElementById('tooltip-text');
        document.querySelectorAll('.nav-item[data-title]').forEach(item => {
            item.addEventListener('mouseenter', (e) => {
                if (document.getElementById('sidebar').classList.contains('sidebar-collapsed')) {
                    const rect = item.getBoundingClientRect();
                    tooltipText.innerText = item.getAttribute('data-title');
                    tooltip.style.top = (rect.top + (rect.height / 2) - 14) + 'px'; 
                    tooltip.style.left = (rect.right + 12) + 'px'; 
                    tooltip.style.opacity = '1';
                }
            });
            item.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });
        });

        function getDynamicCalendar() { 
            try { return JSON.parse(localStorage.getItem('kv_dynamic_calendar')) || {}; } 
            catch(e) { return {}; }
        }
        
        function generateSmartAlerts(isDropdown = false) {
            const today = new Date(); const calData = getDynamicCalendar(); let alertsHTML = '';
            const mKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
            const lastReadTime = localStorage.getItem('noti_read_time') || 0; let hasUnread = false;

            if (!calData[mKey]) {
                if(isDropdown) return `<div class="p-6 text-sm text-slate-500 text-center"><i class="fas fa-calendar-times text-3xl text-slate-200 mb-2 block"></i>Chưa cài lịch tháng này</div>`;
                return `<div class="saas-card p-4 flex items-start gap-4 mb-3 border-l-4 border-l-slate-300"><div class="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center font-bold text-lg shrink-0"><i class="fas fa-calendar-times"></i></div><div><h4 class="font-semibold text-slate-800 text-sm">Chưa cài đặt lịch</h4><p class="text-xs font-medium text-slate-500 mt-0.5">Vào Cài đặt Hệ thống để cấu hình</p></div></div>`;
            }

            const checkUpcoming = (dateStr, eventName, type) => {
                if(!dateStr) return; const evDate = new Date(dateStr); const diffDays = Math.ceil((evDate - today) / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays <= 7) {
                    let dayTxt = diffDays === 0 ? "Hôm nay" : `Còn ${diffDays} ngày`;
                    let icon = 'fa-calendar-day'; let color = 'text-blue-500'; let bg = 'bg-blue-50'; let border = 'border-l-blue-500';
                    if(type==='kv1') { icon='fa-laptop-code'; }
                    if(type==='tax') { icon='fa-file-invoice-dollar'; color='text-emerald-500'; bg='bg-emerald-50'; border='border-l-emerald-500'; }
                    if(type==='fnb') { icon='fa-utensils'; color='text-orange-500'; bg='bg-orange-50'; border='border-l-orange-500'; }
                    if(type==='salon') { icon='fa-spa'; color='text-pink-500'; bg='bg-pink-50'; border='border-l-pink-500'; }
                    if(type==='hotel') { icon='fa-hotel'; color='text-teal-500'; bg='bg-teal-50'; border='border-l-teal-500'; }

                    const isUnread = (new Date().getTime() - lastReadTime) > 0; if(isUnread) hasUnread = true;

                    if(isDropdown) {
                        alertsHTML += `<div class="p-4 border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer flex gap-3 items-start relative"><div class="w-10 h-10 rounded-full ${bg} ${color} flex items-center justify-center shrink-0 mt-0.5"><i class="fas ${icon}"></i></div><div><h4 class="font-semibold text-slate-800 text-sm leading-tight">${eventName}</h4><p class="text-xs text-slate-500 mt-1"><i class="far fa-clock mr-1"></i>${dayTxt}</p></div><span class="noti-unread-dot w-2 h-2 rounded-full bg-blue-500 absolute top-4 right-4 ${isUnread ? '' : 'hidden'}"></span></div>`;
                    } else {
                        alertsHTML += `<div class="saas-card p-4 flex items-start gap-4 mb-3 border-l-4 ${border} hover:shadow-md transition"><div class="w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center font-bold text-lg shrink-0"><i class="fas ${icon}"></i></div><div><h4 class="font-semibold text-slate-800 text-sm">${eventName}</h4><p class="text-xs font-medium text-slate-500 mt-0.5"><i class="far fa-clock mr-1"></i>${dayTxt}</p></div></div>`;
                    }
                }
            };
            
            const monthData = calData[mKey];
            checkUpcoming(monthData.kv1, "Khóa KV1", "kv1"); checkUpcoming(monthData.tax, "Khóa HĐĐT - Thuế", "tax");
            checkUpcoming(monthData.fnb, "Khóa FNB", "fnb"); checkUpcoming(monthData.salon, "Khóa Salon", "salon"); checkUpcoming(monthData.hotel, "Khóa Hotel", "hotel");
            if(monthData.onboards) monthData.onboards.forEach((d, i) => checkUpcoming(d, `Lớp Onboard Tuần ${i+1}`, "onboard"));

            const unreadDot = document.getElementById('unreadDot');
            if(unreadDot) { if(hasUnread && alertsHTML !== '') unreadDot.classList.remove('hidden'); else unreadDot.classList.add('hidden'); }

            if(alertsHTML === '') {
                if(isDropdown) return `<div class="p-6 text-center text-xs text-slate-400">Không có thông báo mới</div>`;
                return `<div class="saas-card p-4 flex items-center gap-3 mb-6"><i class="fas fa-check-circle text-emerald-500"></i><p class="text-sm font-medium text-slate-600">Trong 7 ngày tới không có sự kiện đào tạo nào.</p></div>`;
            }
            return alertsHTML;
        }

        function toggleNoti(e) { 
            if(e) e.stopPropagation(); 
            const drop = document.getElementById('notiDropdown'); 
            drop.classList.toggle('hidden'); 
            if(!drop.classList.contains('hidden')) { document.getElementById('notiContent').innerHTML = generateSmartAlerts(true); } 
        }

        function markAllRead(e) {
            e.stopPropagation(); localStorage.setItem('noti_read_time', new Date().getTime());
            const unreadDot = document.getElementById('unreadDot');
            if(unreadDot) unreadDot.classList.add('hidden');
            document.querySelectorAll('.noti-unread-dot').forEach(el => el.classList.add('hidden'));
        }

        window.addEventListener('click', function(e) {
            const noti = document.getElementById('notiDropdown');
            const notiIcon = document.getElementById('bellIcon');
            if (noti && !noti.classList.contains('hidden') && !noti.contains(e.target) && !notiIcon.contains(e.target)) {
                noti.classList.add('hidden');
            }
        });

        function switchTab(tabId) {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            const clickedElement = document.querySelector(`[onclick="switchTab('${tabId}')"]`);
            if(clickedElement) clickedElement.classList.add('active');

            const container = document.getElementById('main-tab-container');

            if (tabId === 'tong-quan') {
                const filteredData = getFilteredMasterData();
                let sumTotal = 0, sumPass = 0, sumFail = 0;
                let breakCourse = {};
                
                filteredData.forEach(d => {
                    let g = d.groupName || 'Khác';
                    breakCourse[g] = (breakCourse[g] || 0) + 1;
                    sumTotal += parseInt(d.totalTrainees) || 0; 
                    sumPass += parseInt(d.passedTrainees) || 0;
                    sumFail += parseInt(d.failedTrainees) || 0;
                });
                
                const passRate = sumTotal > 0 ? Math.round((sumPass/sumTotal)*100) : 0;
                const alerts = generateSmartAlerts(false);

                const renderMasterDetailTable = () => {
                    let searchData = filteredData;
                    if(masterTableSearchKeyword) {
                        const kw = masterTableSearchKeyword.toLowerCase();
                        searchData = searchData.filter(d => 
                            (d.courseId && d.courseId.toLowerCase().includes(kw)) ||
                            (d.groupName && d.groupName.toLowerCase().includes(kw)) ||
                            (d.highlights && d.highlights.toLowerCase().includes(kw)) ||
                            (d.issues && d.issues.toLowerCase().includes(kw))
                        );
                    }

                    if(searchData.length === 0) {
                        return `<tr><td colspan="9" class="text-center py-10 text-slate-400 italic">Không tìm thấy khóa học nào trong kỳ báo cáo này.</td></tr>`;
                    }

                    return searchData.slice().sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).map((d, idx) => {
                        let p = parseInt(d.totalTrainees) || 0;
                        let s = parseInt(d.passedTrainees) || 0;
                        let rate = p > 0 ? Math.round((s/p)*100) : 0;

                        return `
                            <tr class="hover:bg-slate-50 transition">
                                <td class="text-center font-mono font-bold text-slate-400">${idx + 1}</td>
                                <td>
                                    <span class="font-extrabold text-blue-600 block">${d.courseId || '-'}</span>
                                    <span class="text-[10px] text-slate-400">${d.startDate || ''}</span>
                                </td>
                                <td><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">${d.groupName || 'Khác'}</span></td>
                                <td class="text-center font-bold text-slate-800">${p}</td>
                                <td class="text-center"><span class="font-bold text-emerald-600">${s}</span> / <span class="font-bold text-rose-500">${d.failedTrainees || 0}</span></td>
                                <td class="text-center"><span class="px-2 py-0.5 rounded-full text-xs font-black ${rate>=80?'bg-emerald-50 text-emerald-700 border border-emerald-200':'bg-rose-50 text-rose-700 border border-rose-200'}">${rate}%</span></td>
                                <td class="text-center font-bold text-purple-600">${d.csat || '4.8/5'}</td>
                                <td>
                                    <p class="text-[11px] text-slate-700 line-clamp-1" title="${d.highlights || ''}"><b class="text-emerald-600">Sáng:</b> ${d.highlights || '-'}</p>
                                    <p class="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title="${d.issues || ''}"><b class="text-rose-500">Tồn:</b> ${d.issues || '-'}</p>
                                </td>
                                <td class="text-right whitespace-nowrap">
                                    <button onclick="openCourseMemoModal('${d.courseId}')" class="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs">
                                        <i class="fas fa-file-invoice"></i> Xem Phiếu
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('');
                };

                container.innerHTML = `
                    <div class="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs animate-fade-up">
                        <div class="flex items-center gap-3">
                            <span class="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                <i class="fas fa-calendar-alt text-blue-600"></i> Kỳ Báo Cáo:
                            </span>
                            <select id="reportTimeRange" onchange="applyReportFilter()" class="saas-input py-1.5 px-3 text-xs font-bold text-blue-700 bg-blue-50 border-blue-200 rounded-lg cursor-pointer w-48">
                                <option value="all" ${currentReportTimeRange==='all'?'selected':''}>Toàn bộ thời gian</option>
                                <option value="year" ${currentReportTimeRange==='year'?'selected':''}>Cả năm 2026</option>
                                <option value="q1" ${currentReportTimeRange==='q1'?'selected':''}>Quý 1 (Tháng 1 - 3)</option>
                                <option value="q2" ${currentReportTimeRange==='q2'?'selected':''}>Quý 2 (Tháng 4 - 6)</option>
                                <option value="q3" ${currentReportTimeRange==='q3'?'selected':''}>Quý 3 (Tháng 7 - 9)</option>
                                <option value="q4" ${currentReportTimeRange==='q4'?'selected':''}>Quý 4 (Tháng 10 - 12)</option>
                                <optgroup label="Theo Từng Tháng">
                                    <option value="m1" ${currentReportTimeRange==='m1'?'selected':''}>Tháng 01</option>
                                    <option value="m2" ${currentReportTimeRange==='m2'?'selected':''}>Tháng 02</option>
                                    <option value="m3" ${currentReportTimeRange==='m3'?'selected':''}>Tháng 03</option>
                                    <option value="m4" ${currentReportTimeRange==='m4'?'selected':''}>Tháng 04</option>
                                    <option value="m5" ${currentReportTimeRange==='m5'?'selected':''}>Tháng 05</option>
                                    <option value="m6" ${currentReportTimeRange==='m6'?'selected':''}>Tháng 06</option>
                                    <option value="m7" ${currentReportTimeRange==='m7'?'selected':''}>Tháng 07</option>
                                    <option value="m8" ${currentReportTimeRange==='m8'?'selected':''}>Tháng 08</option>
                                    <option value="m9" ${currentReportTimeRange==='m9'?'selected':''}>Tháng 09</option>
                                    <option value="m10" ${currentReportTimeRange==='m10'?'selected':''}>Tháng 10</option>
                                    <option value="m11" ${currentReportTimeRange==='m11'?'selected':''}>Tháng 11</option>
                                    <option value="m12" ${currentReportTimeRange==='m12'?'selected':''}>Tháng 12</option>
                                </optgroup>
                            </select>
                            <span class="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
                                ${filteredData.length} Khóa Học
                            </span>
                        </div>

                        <div class="flex items-center gap-2">
                            <button onclick="openSurveyInput()" class="btn-outline text-xs !py-1.5 font-bold hover:bg-purple-50 text-purple-700 border-purple-200 shadow-xs" title="Nạp dữ liệu khảo sát học viên">
                                <i class="fas fa-clipboard-list"></i> Nạp Khảo Sát
                            </button>
                            <button onclick="exportMasterDBToCSV()" class="btn-outline text-xs !py-1.5 font-bold hover:bg-slate-50 border-slate-300 shadow-xs" title="Xuất dữ liệu ra Excel">
                                <i class="fas fa-file-excel text-emerald-600"></i> Xuất Excel (CSV)
                            </button>
                            <button onclick="runTechPresentation()" class="btn-outline text-xs !py-1.5 font-bold hover:bg-slate-50 border-slate-300 shadow-xs" title="Trình chiếu Slide Fullscreen">
                                <i class="fas fa-tv text-blue-600"></i> Trình Chiếu
                            </button>
                            <button onclick="openCanvaReportModal()" class="btn-primary text-xs !py-1.5 font-bold bg-gradient-to-r from-purple-600 to-blue-600 border-none shadow-sm hover:shadow transition" title="Tạo slide bằng AI">
                                <i class="fas fa-magic text-amber-300"></i> Canva AI Slide
                            </button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div class="saas-card p-5 flex items-center justify-between group animate-fade-up">
                            <div class="flex items-center gap-4">
                                <div class="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center text-2xl group-hover:scale-110 transition"><i class="fas fa-users"></i></div>
                                <div><h3 class="text-2xl font-bold text-slate-800">${sumTotal}</h3><p class="text-[13px] font-medium text-slate-600 mt-0.5">Tổng số học viên</p></div>
                            </div>
                        </div>
                        <div class="saas-card p-5 flex items-center justify-between group animate-fade-up delay-100">
                            <div class="flex items-center gap-4">
                                <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-2xl group-hover:scale-110 transition"><i class="fas fa-chalkboard-teacher"></i></div>
                                <div><h3 class="text-2xl font-bold text-slate-800">${Object.keys(breakCourse).length}</h3><p class="text-[13px] font-medium text-slate-600 mt-0.5">Phân hệ hoạt động</p></div>
                            </div>
                        </div>
                        <div class="saas-card p-5 flex items-center justify-between group animate-fade-up delay-200">
                            <div class="flex items-center gap-4">
                                <div class="w-14 h-14 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center text-2xl group-hover:scale-110 transition"><i class="fas fa-graduation-cap"></i></div>
                                <div><h3 class="text-2xl font-bold text-slate-800">${filteredData.length}</h3><p class="text-[13px] font-medium text-slate-600 mt-0.5">Lớp mở trong kỳ</p></div>
                            </div>
                        </div>
                        <div class="saas-card p-5 flex items-center justify-between group relative overflow-hidden animate-fade-up delay-300">
                            <div class="flex items-center gap-4">
                                <div class="w-14 h-14 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center text-2xl group-hover:scale-110 transition"><i class="fas fa-calendar-check"></i></div>
                                <div class="z-10"><h3 class="text-2xl font-bold text-slate-800">${passRate}%</h3><p class="text-[13px] font-medium text-slate-600 mt-0.5">Tỷ lệ hoàn thành (Pass)</p></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div class="lg:col-span-2 space-y-6">
                            <div class="saas-card p-6 h-[380px] flex flex-col relative animate-fade-up delay-200">
                                <div class="flex justify-between items-center mb-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm"><i class="fas fa-chart-bar"></i></div>
                                        <div><h3 class="text-[14px] font-bold text-slate-800">Hiệu suất Đạt/Fail theo Phân Hệ</h3><p class="text-[11px] text-slate-400">Số liệu cập nhật theo: ${getTimeRangeLabel()}</p></div>
                                    </div>
                                </div>
                                <div class="flex-grow relative w-full h-full"><canvas id="performanceChart"></canvas></div>
                            </div>

                            <div class="saas-card p-6 h-[340px] flex flex-col relative animate-fade-up delay-300">
                                <div class="flex justify-between items-center mb-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm"><i class="fas fa-chart-line"></i></div>
                                        <div><h3 class="text-[14px] font-bold text-slate-800">Xu Hướng Số Lượng Học Viên & Tỷ Lệ Pass Năm 2026</h3><p class="text-[11px] text-slate-400">Đo lường sự biến thiên quy mô qua 12 tháng</p></div>
                                    </div>
                                </div>
                                <div class="flex-grow relative w-full h-full"><canvas id="trendChart"></canvas></div>
                            </div>
                        </div>

                        <div class="space-y-6 animate-fade-up delay-300">
                            <div class="saas-card p-0 overflow-hidden">
                                <div class="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                                    <div class="flex items-center gap-2"><i class="fas fa-calendar-alt text-blue-500"></i> <span class="font-bold text-sm text-slate-800">Lịch trình đào tạo sắp tới</span></div>
                                </div>
                                <div class="p-2">${alerts}</div>
                            </div>
                            
                            <div class="saas-card p-5 h-72 flex flex-col relative">
                                <div class="flex justify-between items-start mb-3">
                                    <p class="text-[13px] font-bold text-slate-800">Tồn Kho Quà Tặng</p>
                                    <select id="filterMerch" onchange="renderMerchHTML()" class="text-[11px] border border-slate-200 rounded px-2 py-1 text-slate-600 outline-none bg-slate-50 cursor-pointer"><option value="all">Tất cả</option><option value="low">Sắp hết</option></select>
                                </div>
                                <div id="merchContainer" class="flex-grow overflow-y-auto custom-scrollbar flex flex-col justify-start gap-3 pr-2 pb-2"></div>
                            </div>
                        </div>
                    </div>

                    <div class="saas-card p-6 animate-fade-up delay-300">
                        <div class="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
                            <div>
                                <h3 class="text-[15px] font-bold text-slate-800">Chi Tiết Báo Cáo Các Khóa Học (MasterDB)</h3>
                                <p class="text-xs text-slate-400">Hiển thị thông tin 16 cột chuẩn: Pass/Fail, CSAT, Điểm sáng & Tồn đọng</p>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="relative w-64">
                                    <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                                    <input type="text" oninput="handleMasterTableSearch(this.value)" placeholder="Tìm mã khóa, nhận xét..." class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-400 transition">
                                </div>
                            </div>
                        </div>

                        <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
                            <table class="w-full">
                                <thead>
                                    <tr>
                                        <th class="w-12 text-center">STT</th>
                                        <th>Mã Khóa & Ngày</th>
                                        <th>Phân Hệ</th>
                                        <th class="text-center">Tổng HV</th>
                                        <th class="text-center">Đạt / Trượt</th>
                                        <th class="text-center">Tỷ Lệ Pass</th>
                                        <th class="text-center">CSAT</th>
                                        <th class="w-72">Highlights & Issues</th>
                                        <th class="w-28 text-right">Phiếu Báo Cáo</th>
                                    </tr>
                                </thead>
                                <tbody id="masterDetailTableBody" class="divide-y divide-slate-100">
                                    ${renderMasterDetailTable()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;

                setTimeout(() => { 
                    updatePerfChart(filteredData); 
                    updateTrendChart();
                    renderMerchHTML(); 
                }, 100);
            } 
            else if (tabId === 'khoa-hoc') {
                let courseCardsHtml = courseCatalog.map(c => {
                    let totalClasses = 0, totalHV = 0, passHV = 0;
                    data.forEach(d => {
                        let g = (d.groupName || '').toUpperCase();
                        if(g === c.id || (c.id === 'SPCB' && g.includes('RETAIL')) || (c.id === 'TAX' && g.includes('THUẾ'))) {
                            totalClasses++;
                            totalHV += parseInt(d.totalTrainees) || 0;
                            passHV += parseInt(d.passedTrainees) || 0;
                        }
                    });
                    let pRate = totalHV > 0 ? Math.round((passHV / totalHV) * 100) : 0;

                    return `
                        <div class="saas-card p-6 flex flex-col justify-between group border-t-4 ${c.border}">
                            <div>
                                <div class="flex justify-between items-start mb-4">
                                    <div class="w-12 h-12 rounded-xl ${c.bg} ${c.color} flex items-center justify-center text-xl shadow-inner"><i class="fas ${c.icon}"></i></div>
                                    <span class="text-[11px] font-bold px-2.5 py-1 rounded-full ${c.bg} ${c.color} border ${c.border}">${c.group}</span>
                                </div>
                                <h3 class="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition">${c.title}</h3>
                                <p class="text-xs text-slate-500 mb-6 leading-relaxed line-clamp-2">${c.desc}</p>
                                
                                <div class="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-6 text-center">
                                    <div><p class="text-[10px] text-slate-400 font-bold uppercase">Lớp</p><p class="text-base font-extrabold text-slate-800">${totalClasses}</p></div>
                                    <div><p class="text-[10px] text-slate-400 font-bold uppercase">Học viên</p><p class="text-base font-extrabold text-slate-800">${totalHV}</p></div>
                                    <div><p class="text-[10px] text-slate-400 font-bold uppercase">Pass</p><p class="text-base font-extrabold text-emerald-600">${pRate}%</p></div>
                                </div>
                            </div>
                            
                            <a href="${c.link}" class="btn-primary w-full py-2.5 justify-center shadow-md">
                                <i class="fas fa-play text-xs"></i> Vào Vận Hành Khóa
                            </a>
                        </div>
                    `;
                }).join('');

                container.innerHTML = `
                    <div class="mb-6 flex justify-between items-end animate-fade-up">
                        <div>
                            <h2 class="text-2xl font-bold text-slate-800">Danh Mục Quản Trị Khóa Học</h2>
                            <p class="text-sm text-slate-500 mt-1">Hệ thống kịch bản, bộ đề thi và tự động hóa quy trình đào tạo</p>
                        </div>
                        <span class="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">${courseCatalog.length} Module Tiêu Chuẩn</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up delay-100">
                        ${courseCardsHtml}
                    </div>
                `;
            }
        }

        function handleMasterTableSearch(val) {
            masterTableSearchKeyword = val;
            const tbody = document.getElementById('masterDetailTableBody');
            if(!tbody) return;
            const filteredData = getFilteredMasterData();

            let searchData = filteredData;
            if(masterTableSearchKeyword) {
                const kw = masterTableSearchKeyword.toLowerCase();
                searchData = searchData.filter(d => 
                    (d.courseId && d.courseId.toLowerCase().includes(kw)) ||
                    (d.groupName && d.groupName.toLowerCase().includes(kw)) ||
                    (d.highlights && d.highlights.toLowerCase().includes(kw)) ||
                    (d.issues && d.issues.toLowerCase().includes(kw))
                );
            }

            if(searchData.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" class="text-center py-10 text-slate-400 italic">Không tìm thấy khóa học nào phù hợp từ khóa "${val}".</td></tr>`;
                return;
            }

            tbody.innerHTML = searchData.slice().sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).map((d, idx) => {
                let p = parseInt(d.totalTrainees) || 0;
                let s = parseInt(d.passedTrainees) || 0;
                let rate = p > 0 ? Math.round((s/p)*100) : 0;

                return `
                    <tr class="hover:bg-slate-50 transition">
                        <td class="text-center font-mono font-bold text-slate-400">${idx + 1}</td>
                        <td>
                            <span class="font-extrabold text-blue-600 block">${d.courseId || '-'}</span>
                            <span class="text-[10px] text-slate-400">${d.startDate || ''}</span>
                        </td>
                        <td><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">${d.groupName || 'Khác'}</span></td>
                        <td class="text-center font-bold text-slate-800">${p}</td>
                        <td class="text-center"><span class="font-bold text-emerald-600">${s}</span> / <span class="font-bold text-rose-500">${d.failedTrainees || 0}</span></td>
                        <td class="text-center"><span class="px-2 py-0.5 rounded-full text-xs font-black ${rate>=80?'bg-emerald-50 text-emerald-700 border border-emerald-200':'bg-rose-50 text-rose-700 border border-rose-200'}">${rate}%</span></td>
                        <td class="text-center font-bold text-purple-600">${d.csat || '4.8/5'}</td>
                        <td>
                            <p class="text-[11px] text-slate-700 line-clamp-1" title="${d.highlights || ''}"><b class="text-emerald-600">Sáng:</b> ${d.highlights || '-'}</p>
                            <p class="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title="${d.issues || ''}"><b class="text-rose-500">Tồn:</b> ${d.issues || '-'}</p>
                        </td>
                        <td class="text-right whitespace-nowrap">
                            <button onclick="openCourseMemoModal('${d.courseId}')" class="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs">
                                <i class="fas fa-file-invoice"></i> Xem Phiếu
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // XUẤT MASTERDB RA FILE EXCEL (.XLS) CHUẨN ĐẸP 17 CỘT
        function exportMasterDBToCSV() {
            const data = getFilteredMasterData();
            if(data.length === 0) return alert('Không có dữ liệu trong kỳ báo cáo này để xuất!');

            const cleanDate = (val) => {
                if(!val) return '-';
                const str = String(val).trim();
                if(/^\d{4}-\d{2}-\d{2}$/.test(str)) {
                    const p = str.split('-');
                    return `${p[2]}/${p[1]}/${p[0]}`;
                }
                const d = new Date(val);
                if(isNaN(d.getTime())) return str;
                return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
            };

            let excelHtml = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="utf-8">
                    <!--[if gte mso 9]>
                    <xml>
                        <x:ExcelWorkbook>
                            <x:ExcelWorksheets>
                                <x:ExcelWorksheet>
                                    <x:Name>MasterDB_BaoCao</x:Name>
                                    <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                                </x:ExcelWorksheet>
                            </x:ExcelWorksheets>
                        </x:ExcelWorkbook>
                    </xml>
                    <![endif]-->
                </head>
                <body>
                    <table border="1" style="border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 11pt;">
                        <thead>
                            <tr style="background-color: #0066cc; color: #ffffff; font-weight: bold; text-align: center; height: 35px;">
                                <th style="padding: 6px 10px;">STT</th>
                                <th style="padding: 6px 15px;">Mã Khóa Học</th>
                                <th style="padding: 6px 15px;">Phân Hệ</th>
                                <th style="padding: 6px 10px;">Tháng</th>
                                <th style="padding: 6px 12px;">Ngày Bắt Đầu</th>
                                <th style="padding: 6px 12px;">Ngày Kết Thúc</th>
                                <th style="padding: 6px 10px;">Sĩ Số (Tổng HV)</th>
                                <th style="padding: 6px 10px;">Số Đạt (Pass)</th>
                                <th style="padding: 6px 10px;">Số Trượt (Fail)</th>
                                <th style="padding: 6px 10px;">Tỷ Lệ Pass</th>
                                <th style="padding: 6px 10px;">Mức CSAT</th>
                                <th style="padding: 6px 20px; width: 280px;">Điểm Sáng (Highlights)</th>
                                <th style="padding: 6px 20px; width: 280px;">Khó Khăn / Tồn Đọng (Issues)</th>
                                <th style="padding: 6px 20px; width: 280px;">Kế Hoạch Hành Động (Action Plan)</th>
                                <th style="padding: 6px 15px;">Trạng Thái</th>
                                <th style="padding: 6px 20px;">Link Danh Sách Lớp</th>
                                <th style="padding: 6px 20px;">Link Khóa Học LMS</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            data.forEach((d, idx) => {
                let p = parseInt(d.totalTrainees) || 0;
                let s = parseInt(d.passedTrainees) || 0;
                let fail = parseInt(d.failedTrainees) || 0;
                let rate = p > 0 ? Math.round((s/p)*100) + '%' : '0%';

                const highlightsClean = (d.highlights || '').replace(/\n/g, '<br>');
                const issuesClean = (d.issues || '').replace(/\n/g, '<br>');
                const planClean = (d.actionPlan || '').replace(/\n/g, '<br>');

                excelHtml += `
                    <tr style="height: 28px;">
                        <td style="text-align: center;">${idx + 1}</td>
                        <td style="font-weight: bold; text-align: center; color: #0066cc;">${d.courseId || '-'}</td>
                        <td style="text-align: center;">${d.groupName || 'Khác'}</td>
                        <td style="text-align: center;">${d.month || '-'}</td>
                        <td style="text-align: center;">${cleanDate(d.startDate)}</td>
                        <td style="text-align: center;">${cleanDate(d.finishDate)}</td>
                        <td style="text-align: center; font-weight: bold;">${p}</td>
                        <td style="text-align: center; font-weight: bold; color: #107c41;">${s}</td>
                        <td style="text-align: center; font-weight: bold; color: #d83b01;">${fail}</td>
                        <td style="text-align: center; font-weight: bold; background-color: #f2f9f5;">${rate}</td>
                        <td style="text-align: center; font-weight: bold; color: #5c2d91;">${d.csat || '4.8/5'}</td>
                        <td style="vertical-align: top;">${highlightsClean || '-'}</td>
                        <td style="vertical-align: top;">${issuesClean || '-'}</td>
                        <td style="vertical-align: top;">${planClean || '-'}</td>
                        <td style="text-align: center; font-weight: bold;">${d.status || 'Hoàn thành'}</td>
                        <td style="vertical-align: top;">${d.listLink && d.listLink.startsWith('http') ? `<a href="${d.listLink}">Mở Danh Sách</a>` : '-'}</td>
                        <td style="vertical-align: top;">${d.quizLink && d.quizLink.startsWith('http') ? `<a href="${d.quizLink}">Mở Bài Thi LMS</a>` : '-'}</td>
                    </tr>
                `;
            });

            excelHtml += `</tbody></table></body></html>`;

            const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `BaoCao_L&D_MasterDB_${currentReportTimeRange}_${new Date().toISOString().split('T')[0]}.xls`;
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('Đã xuất báo cáo Excel (.xls) 17 cột thành công!');
        }

        Chart.defaults.font.family = 'Inter'; 
        Chart.defaults.color = '#94a3b8';

        function updatePerfChart(filteredData) {
            const ctx = document.getElementById('performanceChart'); if(!ctx) return;
            let data = filteredData || getFilteredMasterData();
            
            const groups = {};
            data.forEach(i => {
                const name = i.groupName || 'Khác';
                if(!groups[name]) groups[name] = { pass: 0, fail: 0 };
                groups[name].pass += parseInt(i.passedTrainees) || 0;
                groups[name].fail += parseInt(i.failedTrainees) || 0;
            });

            const labels = Object.keys(groups);
            const passData = labels.map(l => groups[l].pass);
            const failData = labels.map(l => groups[l].fail);

            if(perfChartInstance) perfChartInstance.destroy();
            perfChartInstance = new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: { 
                    labels: labels.length ? labels : ['Chưa có dữ liệu'], 
                    datasets: [
                        { label: 'Đạt (Pass)', data: passData.length ? passData : [0], backgroundColor: '#3b82f6', borderRadius: 4, barThickness: 24 },
                        { label: 'Trượt (Fail)', data: failData.length ? failData : [0], backgroundColor:'#ef4444', borderRadius: 4, barThickness: 24 }
                    ] 
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: { usePointStyle: true, boxWidth: 6, font: {size: 11} } } }, scales: { y: { stacked: true, beginAtZero: true, border: {display: false}, grid: {color: '#f1f5f9', borderDash:[4,4]}, ticks: {font: {size: 10}} }, x: { stacked: true, border: {display: false}, grid: {display: false}, ticks: {font: {size: 10}} } } }
            });
        }

        function updateTrendChart() {
            const ctx = document.getElementById('trendChart'); if(!ctx) return;
            const fullData = globalMasterDB;
            
            const monthlyHV = Array(12).fill(0);
            const monthlyPass = Array(12).fill(0);

            fullData.forEach(d => {
                let m = parseInt(d.month) || 0;
                if(!m && d.startDate) {
                    const parts = d.startDate.split('-');
                    if(parts.length >= 2) m = parseInt(parts[1]) || 0;
                }
                if(m >= 1 && m <= 12) {
                    monthlyHV[m - 1] += parseInt(d.totalTrainees) || 0;
                    monthlyPass[m - 1] += parseInt(d.passedTrainees) || 0;
                }
            });

            const monthlyRate = monthlyHV.map((tot, idx) => tot > 0 ? Math.round((monthlyPass[idx] / tot) * 100) : 0);
            const labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

            if(trendChartInstance) trendChartInstance.destroy();
            trendChartInstance = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Số Lượng Học Viên',
                            data: monthlyHV,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.08)',
                            fill: true,
                            tension: 0.35,
                            borderWidth: 2.5,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Tỷ Lệ Pass (%)',
                            data: monthlyRate,
                            borderColor: '#10b981',
                            backgroundColor: 'transparent',
                            borderDash: [4, 4],
                            tension: 0.2,
                            borderWidth: 2,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'bottom', labels: { usePointStyle: true, boxWidth: 6, font: {size: 11} } } },
                    scales: {
                        y: { type: 'linear', position: 'left', beginAtZero: true, grid: {color: '#f1f5f9'}, ticks: {font: {size: 10}} },
                        y1: { type: 'linear', position: 'right', min: 0, max: 100, grid: {display: false}, ticks: {callback: v => v + '%', font: {size: 10}} },
                        x: { grid: {display: false}, ticks: {font: {size: 10}} }
                    }
                }
            });
        }

        function getIconForGift(name) {
            const n = name.toLowerCase();
            if(n.includes('túi')) return 'fa-shopping-bag text-orange-500';
            if(n.includes('bình') || n.includes('cốc')) return 'fa-mug-hot text-blue-500';
            if(n.includes('mưa') || n.includes('ô')) return 'fa-umbrella text-indigo-500';
            if(n.includes('sổ')) return 'fa-book text-emerald-500';
            return 'fa-gift text-purple-500';
        }

        function renderMerchHTML() {
            const container = document.getElementById('merchContainer'); if(!container) return;
            const filterEl = document.getElementById('filterMerch');
            const filter = filterEl ? filterEl.value : 'all';
            const gifts = JSON.parse(localStorage.getItem('kv_gift_db')) || globalGiftsDB || [];
            
            let html = '';
            gifts.forEach(g => {
                let ton = parseInt(g.in) - parseInt(g.out); if (isNaN(ton)) ton = 0;
                let percent = g.in > 0 ? Math.round((ton / g.in) * 100) : 0;
                
                if(filter === 'low' && percent > 20) return;
                if(parseInt(g.in) === 0 && parseInt(g.out) === 0) return;

                let barColor = percent > 50 ? 'bg-blue-500' : (percent > 20 ? 'bg-amber-500' : 'bg-rose-500');
                let iconClass = getIconForGift(g.name);

                html += `
                    <div class="flex items-center gap-3 w-full group relative cursor-pointer mb-1">
                        <div class="w-[80px] shrink-0 flex items-center gap-2 text-[11px] font-semibold text-slate-700">
                            <div class="w-6 h-6 rounded bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-white transition"><i class="fas ${iconClass}"></i></div>
                            <span class="truncate">${g.name}</span>
                        </div>
                        <div class="flex-grow progress-bar-container border border-slate-200 relative">
                            <div class="progress-bar-fill ${barColor}" style="width: ${Math.max(5, percent)}%"></div>
                            <div class="absolute inset-0 flex items-center justify-end pr-2 text-[9px] font-bold text-slate-700 pointer-events-none">Tồn: ${ton}</div>
                        </div>
                        <div class="tooltip-box whitespace-nowrap !text-[10px] !top-auto !bottom-[110%] !left-auto !right-0"><span class="text-slate-400">Nhập:</span> ${g.in} | <span class="text-slate-400">Xuất:</span> ${g.out} | <span class="text-emerald-400">Tồn:</span> ${ton}</div>
                    </div>
                `;
            });
            container.innerHTML = html || `<div class="h-full flex items-center justify-center text-xs text-slate-400">Không có dữ liệu tồn kho.</div>`;
        }

        function openSurveyInput() { 
            document.getElementById('survey-spcb').value = localStorage.getItem('kv_survey_spcb') || '';
            document.getElementById('survey-tax').value = localStorage.getItem('kv_survey_tax') || '';
            document.getElementById('surveyModal').classList.add('active'); 
        }
        function closeSurveyInput() { document.getElementById('surveyModal').classList.remove('active'); }
        function saveSurveyDrafts() {
            localStorage.setItem('kv_survey_spcb', document.getElementById('survey-spcb').value);
            localStorage.setItem('kv_survey_tax', document.getElementById('survey-tax').value);
        }

        function closePresentation() { document.getElementById('presentation-overlay').classList.remove('active'); }
        let curSlide = 1; const maxSlide = 3;
        function changeSlide(dir) {
            document.getElementById(`tslide-${curSlide}`).classList.remove('active');
            curSlide += dir;
            if(curSlide > maxSlide) curSlide = maxSlide; if(curSlide < 1) curSlide = 1;
            document.getElementById(`tslide-${curSlide}`).classList.add('active');
        }

        async function runTechPresentation() {
            let data = getFilteredMasterData();
            if(data.length === 0) return alert('Chưa có dữ liệu MasterDB trong kỳ này để tạo báo cáo!');

            document.getElementById('slide-year').innerText = new Date().getFullYear();
            document.getElementById('slide-period-title').innerText = `Kỳ Báo Cáo: ${getTimeRangeLabel()}`;
            document.getElementById('slide-sub-period').innerText = `Dữ liệu phân tích theo: ${getTimeRangeLabel()}`;

            let totalHV = 0, totalPass = 0; let groupStats = {};
            data.forEach(d => {
                let g = d.groupName || 'Other';
                if(!groupStats[g]) groupStats[g] = { classes: 0, hv: 0, pass: 0 };
                groupStats[g].classes++;
                groupStats[g].hv += parseInt(d.totalTrainees) || 0;
                groupStats[g].pass += parseInt(d.passedTrainees) || 0;
                totalHV += parseInt(d.totalTrainees) || 0;
                totalPass += parseInt(d.passedTrainees) || 0;
            });

            document.getElementById('sl-total-class').innerText = data.length;
            document.getElementById('sl-total-hv').innerText = totalHV;
            document.getElementById('sl-pass-rate').innerText = totalHV > 0 ? Math.round((totalPass/totalHV)*100) + '%' : '0%';

            let taughtHtml = '', selfHtml = '';
            for(let key in groupStats) {
                let s = groupStats[key];
                let pRate = s.hv > 0 ? Math.round((s.pass/s.hv)*100) : 0;
                let html = `<div class="flex justify-between items-center bg-slate-800 p-3 rounded mb-2">
                                <span class="font-bold text-white">${key}</span>
                                <span class="text-sm text-slate-300">${s.classes} Lớp | ${s.hv} HV | <span class="${pRate>=80?'text-emerald-400 font-bold':'text-rose-400 font-bold'}">Pass: ${pRate}%</span></span>
                            </div>`;
                if(key === 'SPCB' || key === 'TAX') taughtHtml += html; else selfHtml += html;
            }
            document.getElementById('sl-taught-detail').innerHTML = taughtHtml || '<p class="italic text-slate-400">Chưa có dữ liệu</p>';
            document.getElementById('sl-self-detail').innerHTML = selfHtml || '<p class="italic text-slate-400">Chưa có dữ liệu</p>';

            curSlide = 1;
            document.querySelectorAll('.tech-slide').forEach(el => el.classList.remove('active'));
            document.getElementById('tslide-1').classList.add('active');
            document.getElementById('presentation-overlay').classList.add('active');

            const sSpcb = localStorage.getItem('kv_survey_spcb') || '';
            const sTax = localStorage.getItem('kv_survey_tax') || '';
            const insightBox = document.getElementById('sl-survey-insights');
            const evalBox = document.getElementById('sl-ai-evaluation');

            if(!sSpcb && !sTax) {
                insightBox.innerHTML = `<div class="insight-box"><strong>Thông tin Khảo sát:</strong><br>Chưa có dữ liệu khảo sát nháp. Bạn có thể bấm "Nạp Khảo Sát" để bổ sung phản hồi học viên.</div>`;
                evalBox.innerHTML = `<div class="insight-box">Hệ thống đang hoạt động ổn định. Tỷ lệ Pass trung bình là ${totalHV > 0 ? Math.round((totalPass/totalHV)*100) : 0}%.</div>`;
            } else {
                insightBox.innerHTML = `<div class="text-center py-10 text-slate-400"><i class="fas fa-circle-notch fa-spin text-4xl text-blue-500 mb-4"></i><p class="font-bold">AI đang phân tích ý kiến...</p></div>`;
                evalBox.innerHTML = `<div class="text-center py-10 text-slate-400"><i class="fas fa-brain fa-pulse text-4xl text-emerald-500 mb-4"></i><p class="font-bold">Đang tổng hợp định hướng...</p></div>`;
                
                const promptInsight = `Đóng vai Quản lý đào tạo. Đọc nhận xét sau của học viên và tóm tắt thành 2 mục ngắn gọn (có dùng icon): Điểm Sáng và Điểm Cần Cải Thiện.\nData: ${sSpcb} ${sTax}`;
                const aiInsight = await askAgenticAI(promptInsight);
                insightBox.innerHTML = `<div class="insight-box bg-blue-50 border-blue-200 text-[13px] leading-relaxed">${formatAIResponse(aiInsight)}</div>`;

                const promptEval = `Đóng vai Giám đốc L&D. Tỷ lệ Pass kỳ này (${getTimeRangeLabel()}) là ${totalHV > 0 ? Math.round((totalPass/totalHV)*100) : 0}%. Đưa ra 2 Lời khuyên ngắn gọn cho Trainer. (Dùng icon)`;
                const aiEval = await askAgenticAI(promptEval);
                evalBox.innerHTML = `<div class="insight-box bg-emerald-50 border-emerald-200 text-[13px] leading-relaxed">${formatAIResponse(aiEval)}</div>`;
            }
        }

        function openCanvaReportModal() {
            document.getElementById('canvaPeriodTag').innerText = `Kỳ báo cáo: ${getTimeRangeLabel()}`;
            document.getElementById('canvaReportModal').classList.add('active');
            document.getElementById('canvaReportContent').innerHTML = `<div class="flex flex-col items-center justify-center h-full text-slate-400"><i class="fas fa-robot text-5xl mb-4 text-slate-300"></i><p class="font-medium">Sẵn sàng phân tích dữ liệu cho kỳ: <b>${getTimeRangeLabel()}</b>...</p></div>`;
            const btnCopy = document.getElementById('btnCopyCanva');
            btnCopy.classList.add('hidden', 'opacity-0');
        }

        function closeModal(id) { document.getElementById(id).classList.remove('active'); }

        async function generateCanvaReport() {
            const data = getFilteredMasterData();
            if(data.length === 0) return alert('Hệ thống chưa có dữ liệu MasterDB trong kỳ này để phân tích!');

            const btnGen = document.getElementById('btnGenReport');
            const contentBox = document.getElementById('canvaReportContent');
            const btnCopy = document.getElementById('btnCopyCanva');

            btnGen.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Đang phân tích...';
            btnGen.classList.add('pointer-events-none', 'opacity-70');
            btnCopy.classList.add('hidden', 'opacity-0');
            contentBox.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-purple-600"><i class="fas fa-brain fa-pulse text-5xl mb-4"></i><p class="font-bold">Kevin đang tổng hợp số liệu kỳ ${getTimeRangeLabel()}...</p></div>`;

            let totalHV = 0, totalPass = 0;
            let listHighlights = []; let listIssues = []; let listPlans = [];
            
            data.forEach(d => {
                totalHV += parseInt(d.totalTrainees) || 0;
                totalPass += parseInt(d.passedTrainees) || 0;
                if(d.highlights) listHighlights.push(d.highlights);
                if(d.issues) listIssues.push(d.issues);
                if(d.actionPlan) listPlans.push(d.actionPlan);
            });

            const passRate = totalHV > 0 ? Math.round((totalPass/totalHV)*100) : 0;
            const periodStr = getTimeRangeLabel();

            const prompt = `Bạn là Giám đốc Đào tạo (L&D Director). Hãy tổng hợp số liệu sau và viết một kịch bản Báo cáo Tổng kết kỳ "${periodStr}" định dạng thuần Markdown (Không dùng code block, chỉ viết text).
            MỤC ĐÍCH: Để copy thẳng vào Canva Docs để tự động chuyển thành Slide thuyết trình.
            
            DỮ LIỆU ĐẦU VÀO:
            - Kỳ báo cáo: ${periodStr}
            - Tổng số lớp đã mở: ${data.length}
            - Tổng học viên: ${totalHV}
            - Tỷ lệ Pass: ${passRate}%
            - Điểm sáng ghi nhận: ${listHighlights.slice(0,5).join(' | ') || 'Hoàn thành tốt các lớp tiêu chuẩn'}
            - Tồn đọng gặp phải: ${listIssues.slice(0,5).join(' | ') || 'Cần tăng cường thực hành thao tác'}
            - Kế hoạch đề xuất: ${listPlans.slice(0,5).join(' | ') || 'Bám sát kèm cặp học viên'}

            YÊU CẦU 5 SLIDE (Dùng # Heading 1 cho tiêu đề Slide, gạch đầu dòng cho nội dung):
            # Slide 1: Báo Cáo Đào Tạo Kỳ ${periodStr}
            # Slide 2: Những Con Số Ấn Tượng
            # Slide 3: Thành Tựu & Điểm Sáng
            # Slide 4: Thách Thức & Điểm Nghẽn
            # Slide 5: Kế Hoạch Hành Động Kỳ Tới`;

            let aiResponse = await askAgenticAI(prompt);
            
            if(aiResponse.includes("⚠️ Lỗi")) {
                contentBox.innerHTML = `<div class="text-rose-500 font-bold p-4 bg-rose-50 rounded-lg">${aiResponse}</div>`;
            } else {
                const formattedHtml = aiResponse.replace(/# Slide(.*?)\n/g, '<h2 class="text-lg font-bold text-purple-700 mt-4 mb-2 border-b border-slate-200 pb-1"><i class="fas fa-tv mr-2 text-slate-400"></i>Slide$1</h2>')
                                                .replace(/\n/g, '<br>');
                contentBox.innerHTML = formattedHtml;
                contentBox.setAttribute('data-raw-markdown', aiResponse);
                btnCopy.classList.remove('hidden');
                setTimeout(() => btnCopy.classList.remove('opacity-0'), 100);
            }

            btnGen.innerHTML = '<i class="fas fa-bolt text-amber-300 mr-2"></i> TẠO LẠI BÁO CÁO';
            btnGen.classList.remove('pointer-events-none', 'opacity-70');
        }

        function copyToCanva() {
            const rawText = document.getElementById('canvaReportContent').getAttribute('data-raw-markdown');
            if(!rawText) return;
            navigator.clipboard.writeText(rawText).then(() => {
                const btnCopy = document.getElementById('btnCopyCanva');
                const oldHtml = btnCopy.innerHTML;
                btnCopy.innerHTML = '<i class="fas fa-check mr-1 text-emerald-400"></i> Đã Copy Thành Công';
                btnCopy.classList.replace('bg-slate-800', 'bg-emerald-600');
                setTimeout(() => {
                    btnCopy.innerHTML = oldHtml;
                    btnCopy.classList.replace('bg-emerald-600', 'bg-slate-800');
                }, 3000);
            });
        }

        function switchNoteTab(tab) {
            const dBtn = document.getElementById('tab-draw'); const tBtn = document.getElementById('tab-text');
            const drawArea = document.getElementById('drawArea'); const drawToolbar = document.getElementById('drawToolbar');
            const textArea = document.getElementById('stickyNoteText');
            
            if(tab === 'draw') { 
                dBtn.className = "flex-1 py-2.5 font-bold text-purple-600 bg-white border-b-2 border-purple-500"; 
                tBtn.className = "flex-1 py-2.5 font-semibold text-slate-500 bg-slate-50 border-b border-slate-200"; 
                drawArea.classList.remove('hidden'); drawToolbar.classList.remove('hidden'); textArea.classList.add('hidden'); 
            } else { 
                tBtn.className = "flex-1 py-2.5 font-bold text-purple-600 bg-white border-b-2 border-purple-500"; 
                dBtn.className = "flex-1 py-2.5 font-semibold text-slate-500 bg-slate-50 border-b border-slate-200"; 
                textArea.classList.remove('hidden'); drawArea.classList.add('hidden'); drawToolbar.classList.add('hidden');
                document.getElementById('stickyNoteText').focus();
            }
        }

        function saveTextNotes() { 
            localStorage.setItem('kv_global_notepad', document.getElementById('stickyNoteText').value); 
        }

        async function initFabric() {
            if(fCanvas) return;
            const canvasEl = document.getElementById('fabricCanvas'); const wrapper = document.getElementById('drawArea');
            if(!canvasEl || !wrapper) return;
            canvasEl.width = wrapper.clientWidth; canvasEl.height = wrapper.clientHeight;
            
            fCanvas = new fabric.Canvas('fabricCanvas', { isDrawingMode: false });
            fCanvas.on('selection:created', updateColorPickers); 
            fCanvas.on('selection:updated', updateColorPickers);
            fCanvas.on('object:modified', saveDrawingToLocal); 
            fCanvas.on('path:created', saveDrawingToLocal);
            
            let savedData = await localforage.getItem('kv_global_whiteboard');
            if(savedData) fCanvas.loadFromJSON(savedData, fCanvas.renderAll.bind(fCanvas));
        }

        async function saveDrawingToLocal() { 
            if(fCanvas) await localforage.setItem('kv_global_whiteboard', JSON.stringify(fCanvas.toJSON())); 
        }

        function updateColorPickers(e) {
            let obj = e.selected ? e.selected[0] : null; if(!obj) return;
            if(obj.type === 'textbox') { document.getElementById('shapeBgColor').value = obj.backgroundColor || '#ffffff'; document.getElementById('textColor').value = obj.fill || '#000000'; } 
            else if (obj.type === 'rect' || obj.type === 'circle') { document.getElementById('shapeBgColor').value = obj.fill; document.getElementById('textColor').value = obj.stroke; } 
            else if (obj.type === 'i-text') { document.getElementById('textColor').value = obj.fill; }
            else if (obj.type === 'path') { document.getElementById('shapeBgColor').value = obj.stroke; }
        }

        function setWbMode(mode) {
            document.querySelectorAll('.wb-tool-btn').forEach(b => b.classList.remove('active')); 
            if(event && event.currentTarget) event.currentTarget.classList.add('active');
            if(!fCanvas) return;
            if(mode === 'draw') { 
                fCanvas.isDrawingMode = true; 
                fCanvas.freeDrawingBrush.color = document.getElementById('shapeBgColor').value; 
                fCanvas.freeDrawingBrush.width = 4; 
            } else { 
                fCanvas.isDrawingMode = false; 
            }
        }

        function addShape(type) {
            if(!fCanvas) return;
            let bgColor = document.getElementById('shapeBgColor').value; 
            let strokeColor = document.getElementById('textColor').value; 
            let shape;
            if(type === 'rect') shape = new fabric.Rect({ left: 100, top: 100, fill: bgColor, stroke: strokeColor, strokeWidth: 2, width: 100, height: 80, rx: 5, ry: 5 });
            else if(type === 'circle') shape = new fabric.Circle({ left: 150, top: 100, fill: bgColor, stroke: strokeColor, strokeWidth: 2, radius: 40 });
            fCanvas.add(shape); fCanvas.setActiveObject(shape); fCanvas.isDrawingMode = false; saveDrawingToLocal();
        }

        function addStickyNote() {
            if(!fCanvas) return;
            let bgColor = document.getElementById('shapeBgColor').value; 
            let txColor = document.getElementById('textColor').value;
            let text = new fabric.Textbox('Gõ nội dung...', { left: 100, top: 100, width: 200, fontSize: 16, fontFamily: 'Nunito', fill: txColor, backgroundColor: bgColor, padding: 12, borderColor: '#3b82f6', cornerColor: '#3b82f6' });
            fCanvas.add(text); fCanvas.setActiveObject(text); fCanvas.isDrawingMode = false; saveDrawingToLocal();
        }

        function addPureText() {
            if(!fCanvas) return;
            let txColor = document.getElementById('textColor').value;
            let text = new fabric.IText('Chữ ghi chú', { left: 150, top: 150, fontFamily: 'Nunito', fill: txColor, fontSize: 20 });
            fCanvas.add(text); fCanvas.setActiveObject(text); fCanvas.isDrawingMode = false; saveDrawingToLocal();
        }

        function applyWbColor(type, hex) {
            if(!fCanvas) return;
            if(fCanvas.isDrawingMode && type === 'bg') fCanvas.freeDrawingBrush.color = hex;
            const activeObj = fCanvas.getActiveObject(); if(!activeObj) return;
            if(type === 'bg') { 
                if(activeObj.type === 'textbox') activeObj.set('backgroundColor', hex); 
                else if (activeObj.type === 'path') activeObj.set('stroke', hex); 
                else activeObj.set('fill', hex); 
            } else if (type === 'text') { 
                if(activeObj.type === 'textbox' || activeObj.type === 'i-text') activeObj.set('fill', hex); 
                else activeObj.set('stroke', hex); 
            }
            fCanvas.renderAll(); saveDrawingToLocal();
        }

        function deleteSelected() { 
            if(!fCanvas) return;
            const activeObjs = fCanvas.getActiveObjects(); 
            if (activeObjs.length) { 
                fCanvas.discardActiveObject(); 
                activeObjs.forEach(object => fCanvas.remove(object)); 
                saveDrawingToLocal(); 
            } 
        }

        function newDrawing() { 
            if(!fCanvas) return;
            if(confirm("Xóa SẠCH toàn bộ hình vẽ trên bảng này?")) { 
                fCanvas.clear(); 
                localforage.removeItem('kv_global_whiteboard'); 
            } 
        }

        function toggleFullscreen() {
            const widget = document.getElementById('notesWidget'); 
            widget.classList.toggle('fullscreen-widget');
            setTimeout(() => { 
                if(fCanvas) { 
                    const wrapper = document.getElementById('drawArea'); 
                    fCanvas.setWidth(wrapper.clientWidth); 
                    fCanvas.setHeight(wrapper.clientHeight); 
                    fCanvas.renderAll(); 
                } 
            }, 300); 
        }

        function toggleNotes() { 
            document.getElementById('chatWidget').classList.remove('active'); 
            const widget = document.getElementById('notesWidget'); 
            widget.classList.toggle('active');
            if(widget.classList.contains('active')) { 
                document.getElementById('stickyNoteText').value = localStorage.getItem('kv_global_notepad') || ''; 
                setTimeout(initFabric, 200); 
            }
        }

        function toggleChat() { 
            document.getElementById('notesWidget').classList.remove('active'); 
            document.getElementById('chatWidget').classList.toggle('active'); 
        }

        function handleChatEnter(e) { if(e.key === 'Enter') sendChatMessage(); }

        function formatAIResponse(text) {
            if (typeof text !== 'string') return text;
            return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-800">$1</strong>')
                       .replace(/\*(.*?)\*/g, '<em class="text-slate-600">$1</em>')
                       .replace(/\n/g, '<br>');
        }

        async function askAgenticAI(promptText) {
            if(!GOOGLE_API_URL) return "⚠️ Lỗi: Vui lòng cài đặt Link API Google Sheets trong phần Cài đặt Hệ thống.";
            try {
                const res = await fetch(GOOGLE_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({ action: "ask_ai", prompt: promptText })
                });
                const data = await res.json();
                return data.status === 'success' ? data.reply : "⚠️ Lỗi từ Server: " + data.message;
            } catch(e) { return "⚠️ Lỗi kết nối mạng hoặc Server không phản hồi."; }
        }

        async function sendChatMessage() {
            const input = document.getElementById('chatInput'); 
            const text = input.value.trim(); 
            if(!text) return;
            
            const history = document.getElementById('chatHistory');
            history.innerHTML += `<div class="bg-blue-600 text-white p-3 rounded-xl text-[13px] self-end max-w-[85%] shadow-sm ml-auto animate-fade-up">${text}</div>`;
            input.value = ''; 
            history.scrollTop = history.scrollHeight;

            const replyId = 'ai-reply-' + new Date().getTime();
            history.innerHTML += `<div id="${replyId}" class="bg-white border border-slate-200 p-3 rounded-xl shadow-sm text-[13px] text-slate-700 max-w-[85%] flex gap-3 items-start animate-fade-up mr-auto"><i class="fas fa-robot text-blue-500 mt-1 text-lg"></i><div class="leading-relaxed flex-grow text-slate-400 italic"><i class="fas fa-circle-notch fa-spin mr-1"></i> Kevin đang phân tích...</div></div>`;
            history.scrollTop = history.scrollHeight;

            let giftData = "Trống";
            try {
                const gifts = JSON.parse(localStorage.getItem('kv_gift_db')) || globalGiftsDB || [];
                if(gifts.length > 0) {
                    giftData = gifts.map(g => `- ${g.name}: Tồn kho ${Math.max(0, g.in - g.out)} cái`).join('\n');
                }
            } catch(e) {}

            let systemContext = `Dưới đây là Data hệ thống hiện tại:\n1. Tổng số khóa học đã lưu: ${globalMasterDB.length} khóa.\n2. Kỳ báo cáo đang xem: ${getTimeRangeLabel()}.\n3. Tình hình Tồn Kho Quà Tặng:\n${giftData}\n`;
            const finalPrompt = `${systemContext}\nCâu hỏi: ${text}`;

            let aiResponse = await askAgenticAI(finalPrompt);
            const replyBox = document.getElementById(replyId);
            if(replyBox) {
                replyBox.innerHTML = `<i class="fas fa-robot text-purple-500 mt-1 text-lg"></i><div class="leading-relaxed flex-grow text-slate-700">${formatAIResponse(aiResponse)}</div>`;
                history.scrollTop = history.scrollHeight;
            }
        }

        window.onload = () => {
            try {
                const profStr = localStorage.getItem('kv_trainer_profile');
                if(profStr && profStr !== 'undefined') {
                    const prof = JSON.parse(profStr);
                    if(prof) {
                        const name = prof.name || "L&D KiotViet";
                        const title = prof.title || "Administrator";

                        document.getElementById('display-prof-name').innerText = name;
                        document.getElementById('display-prof-title').innerText = title;
                        document.getElementById('header-prof-name').innerText = name;
                        document.getElementById('header-prof-title').innerText = title;
                    }
                }
            } catch(e) {}
            
            try {
                const dbStr = localStorage.getItem('kv_master_db');
                globalMasterDB = (dbStr && dbStr !== 'undefined') ? JSON.parse(dbStr) : [];
            } catch(e) { globalMasterDB = []; }
            if(!Array.isArray(globalMasterDB)) globalMasterDB = [];
            
            switchTab('tong-quan');

            fetchDatabase().then(() => {
                switchTab('tong-quan');
            });
        };
    </script>
    <script src="sop-drawer.js"></script>
    <script src="report-memo.js"></script>
</body>
</html>
