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
        .qs-modal-overlay {
            position: fixed !important;
            inset: 0 !important;
            background: rgba(15, 23, 42, 0.75) !important;
            backdrop-filter: blur(5px) !important;
            -webkit-backdrop-filter: blur(5px) !important;
            z-index: 9999999 !important;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 16px !important;
        }
        .qs-modal-overlay.active {
            display: flex !important;
        }
        .qs-modal-box {
            background: #ffffff !important;
            width: 100% !important;
            max-width: 680px !important;
            border-radius: 18px !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35) !important;
            border: 1px solid #cbd5e1 !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
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
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.closeReportMemo();
                if (window.closeQuickSurveyModal) window.closeQuickSurveyModal();
            }
        });
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
        
        // Tự động tính toán điểm CSAT từ data khảo sát thực tế của khóa này
        if (typeof window.autoUpdateCsatField === 'function') {
            window.autoUpdateCsatField();
        } else if (document.getElementById('csat')) {
            document.getElementById('csat').value = '4.8/5';
        }

        if (document.getElementById('highlights')) document.getElementById('highlights').value = highlights;
        if (document.getElementById('issues')) document.getElementById('issues').value = issues;
        if (document.getElementById('actionPlan')) document.getElementById('actionPlan').value = actionPlan;

        function escMemo(s) {
            return String(s ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

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
                                    <span class="font-bold text-slate-800">${escMemo(t.name)}</span>
                                    <span class="text-slate-400 font-mono text-[10px] ml-1">(${escMemo(t.dept)})</span>
                                </div>
                                <div class="flex items-center gap-2.5 shrink-0">
                                    <span class="font-bold text-[11px] text-slate-700">${escMemo(t.score)} đ</span>
                                    <span class="font-mono font-bold text-[11px] text-blue-600">${escMemo(t.pct)}</span>
                                    <span class="px-2 py-0.5 rounded font-bold text-[10px] ${t.isPass ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">${escMemo(t.result)}</span>
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
            <div class="mt-2.5 flex justify-between items-center gap-2 flex-wrap">
                <button type="button" onclick="window.parseTraineeExcelResults()" class="btn-primary py-2 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 border-none shadow-sm flex items-center gap-1.5">
                    <i class="fas fa-bolt text-amber-300"></i> Phân Tích & Chuẩn Hóa Số Liệu Tự Động
                </button>
                <button type="button" onclick="window.openQuickSurveyModal()" class="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition flex items-center gap-1.5 shadow-xs">
                    <i class="fas fa-poll-h text-purple-600"></i> Nạp / Đồng Bộ Khảo Sát
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
            const nowLocal = new Date();
            const localIsoToday = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`;
            const start = (document.getElementById('conf-date-tue') || document.getElementById('start') || document.getElementById('conf-dl1') || document.getElementById('conf-deadline-1') || document.getElementById('conf-class-date'))?.value || '';
            const finish = (document.getElementById('conf-dl2') || document.getElementById('conf-deadline-2') || document.getElementById('finish'))?.value || localIsoToday;
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

        // Tự động lắng nghe thay đổi Mã Khóa để tính CSAT tức thời
        const c1 = document.getElementById('courseId');
        const c2 = document.getElementById('db-code');
        const c3 = document.getElementById('conf-course-code');
        [c1, c2, c3].forEach(el => {
            if (el) {
                el.addEventListener('input', function () { window.autoUpdateCsatField(this.value); });
                el.addEventListener('change', function () { window.autoUpdateCsatField(this.value); });
            }
        });
        setTimeout(() => { window.autoUpdateCsatField(); }, 400);
    }

    // ==================== BỘ TỰ ĐỘNG TÍNH CSAT THEO TỪNG MÃ KHÓA ====================
    window.isCourseCodeMatch = function (cellValue, targetCourseCode) {
        if (!cellValue || !targetCourseCode) return false;
        const cleanCell = String(cellValue).trim().toUpperCase();
        const cleanTarget = String(targetCourseCode).trim().toUpperCase();
        if (cleanCell === cleanTarget) return true;

        const normCell = cleanCell.replace(/[^A-Z0-9]/g, '');
        const normTarget = cleanTarget.replace(/[^A-Z0-9]/g, '');
        if (normCell && normTarget && normCell === normTarget) return true;

        if (normCell.length >= 4 && normTarget.length >= 4) {
            if (normCell.includes(normTarget) || normTarget.includes(normCell)) return true;
        }
        return false;
    };

    window.getCourseSurveyStats = function (targetCourseCode, customSurveyText = null) {
        let allSurveyText = customSurveyText;
        if (typeof allSurveyText !== 'string' || allSurveyText.trim() === '') {
            const sSpcb = localStorage.getItem('kv_survey_spcb') || '';
            const sTax = localStorage.getItem('kv_survey_tax') || '';
            allSurveyText = `${sSpcb}\n${sTax}`.trim();
        }

        if (!allSurveyText) {
            return { found: false, hasAnySurvey: false, avgCsat: '4.8/5', message: 'Chưa có dữ liệu khảo sát trong hệ thống' };
        }

        const lines = allSurveyText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) {
            return { found: false, hasAnySurvey: false, avgCsat: '4.8/5', message: 'Dữ liệu khảo sát trống' };
        }

        const scores = [];
        const feedbacks = [];
        const allScoresFallback = [];
        let matchCount = 0;
        const target = targetCourseCode ? String(targetCourseCode).trim() : '';

        const trivialRegex = /^(không|không có|ko|k|không ạ|không ý kiến|ko có|k có|ok|quá ok|tốt|rất tốt|tuyệt vời|none|-|\.|dạ không|chưa có)?$/i;

        lines.forEach(line => {
            const cols = line.split('\t').map(c => c.trim());
            if (cols.length < 2) return;

            const firstColLower = cols[0].toLowerCase();
            if (firstColLower.includes('timestamp') || firstColLower.includes('thời gian') || firstColLower.includes('đánh giá')) return;

            cols.forEach(col => {
                const num = parseFloat(col);
                if (!isNaN(num) && num >= 1 && num <= 5 && Number.isInteger(num)) {
                    allScoresFallback.push(num);
                }
            });

            if (target) {
                const isMatch = window.isCourseCodeMatch(cols[1], target) || 
                                window.isCourseCodeMatch(cols[0], target) || 
                                (cols[2] && window.isCourseCodeMatch(cols[2], target));

                if (isMatch) {
                    matchCount++;
                    cols.forEach((col, idx) => {
                        const num = parseFloat(col);
                        if (!isNaN(num) && num >= 1 && num <= 5 && Number.isInteger(num)) {
                            scores.push(num);
                        }
                        if (idx > 1 && col.length > 8 && isNaN(col) && !col.includes('/202') && !trivialRegex.test(col.toLowerCase())) {
                            feedbacks.push(col);
                        }
                    });
                }
            }
        });

        if (target && matchCount > 0 && scores.length > 0) {
            const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
            return {
                found: true,
                hasAnySurvey: true,
                isSpecific: true,
                courseCode: target,
                responseCount: matchCount,
                avgCsat: `${avg}/5`,
                scoreVal: parseFloat(avg),
                feedbacks: [...new Set(feedbacks)]
            };
        }

        if (allScoresFallback.length > 0) {
            const generalAvg = (allScoresFallback.reduce((a, b) => a + b, 0) / allScoresFallback.length).toFixed(1);
            return {
                found: false,
                hasAnySurvey: true,
                isSpecific: false,
                courseCode: target,
                avgCsat: `${generalAvg}/5`,
                scoreVal: parseFloat(generalAvg),
                responseCount: lines.length - 1,
                message: `Chưa có khảo sát riêng cho ${target || 'khóa này'} (Điểm CSAT chung: ${generalAvg}/5)`
            };
        }

        return { found: false, hasAnySurvey: false, avgCsat: '4.8/5', message: 'Chưa có dữ liệu khảo sát' };
    };

    window.autoUpdateCsatField = function (customCourseCode) {
        const csatInput = document.getElementById('csat');
        if (!csatInput) return;

        let courseCode = (typeof customCourseCode === 'string' && customCourseCode.trim()) ? customCourseCode.trim() : '';
        if (!courseCode) {
            const codeEl = document.getElementById('courseId') || document.getElementById('db-code') || document.getElementById('conf-course-code');
            if (codeEl && codeEl.value) {
                courseCode = codeEl.value.trim();
            }
        }

        // Tự động đồng bộ vào #courseId nếu đang trống
        const targetCourseInput = document.getElementById('courseId');
        if (targetCourseInput && !targetCourseInput.value && courseCode) {
            targetCourseInput.value = courseCode;
        }

        let hintEl = document.getElementById('csatAutoHint');
        if (!hintEl) {
            hintEl = document.createElement('div');
            hintEl.id = 'csatAutoHint';
            hintEl.className = 'text-[10px] mt-1.5 transition-all text-center';
            csatInput.parentElement.appendChild(hintEl);
        }

        if (!courseCode) {
            hintEl.innerHTML = '<span class="text-slate-400 italic">Nhập Mã Khóa để tự tính CSAT</span>';
            return;
        }

        const stats = window.getCourseSurveyStats(courseCode);
        const isDark = csatInput.closest('.bg-slate-800, .bg-slate-900, .bg-slate-700') !== null;

        if (stats.found && stats.isSpecific) {
            csatInput.value = stats.avgCsat;
            csatInput.classList.remove('border-purple-800', 'bg-purple-900/40', 'text-purple-300', 'border-purple-200', 'text-purple-700', 'bg-white', 'bg-slate-50');
            if (isDark) {
                csatInput.classList.add('border-emerald-500', 'bg-emerald-900/30', 'text-emerald-300');
            } else {
                csatInput.classList.add('border-emerald-500', 'bg-emerald-50', 'text-emerald-700');
            }
            hintEl.innerHTML = `
                <span class="${isDark ? 'text-emerald-400' : 'text-emerald-600'} font-bold flex items-center justify-center gap-1">
                    <i class="fas fa-check-circle text-emerald-500"></i> Tự động tính từ ${stats.responseCount} học viên khóa ${stats.courseCode}
                </span>
            `;

            if (stats.feedbacks && stats.feedbacks.length > 0) {
                const hlInput = document.getElementById('highlights');
                const issueInput = document.getElementById('issues');
                if (hlInput && (hlInput.value.includes('demo cơ bản') || hlInput.value.includes('tiến độ Onboard') || !hlInput.value)) {
                    hlInput.value = `Khóa ${stats.courseCode}: Học viên đánh giá cao sự chuẩn bị chu đáo và tương tác của GV.`;
                }
                if (issueInput && (issueInput.value.includes('thực hành thêm') || !issueInput.value)) {
                    issueInput.value = stats.feedbacks[0];
                }
            }
        } else if (stats.hasAnySurvey) {
            csatInput.value = stats.avgCsat || '4.8/5';
            hintEl.innerHTML = `
                <span class="${isDark ? 'text-amber-400' : 'text-amber-700'} font-semibold flex items-center justify-center gap-1 flex-wrap">
                    <i class="fas fa-info-circle text-amber-500"></i> CSAT chung (${stats.avgCsat}) &bull; 
                    <button type="button" onclick="window.openQuickSurveyModal('${courseCode}')" class="underline ${isDark ? 'text-blue-300 hover:text-white' : 'text-blue-600 hover:text-blue-800'} font-bold ml-1">Nạp data khóa ${courseCode}</button>
                </span>
            `;
        } else {
            csatInput.value = '4.8/5';
            hintEl.innerHTML = `
                <span class="${isDark ? 'text-slate-400' : 'text-slate-500'} flex items-center justify-center gap-1 flex-wrap">
                    <i class="fas fa-exclamation-triangle text-amber-500"></i> Chưa có data khảo sát &bull; 
                    <button type="button" onclick="window.openQuickSurveyModal('${courseCode}')" class="underline ${isDark ? 'text-blue-300 hover:text-white' : 'text-blue-600 hover:text-blue-800'} font-bold ml-1">Nạp ngay</button>
                </span>
            `;
        }
    };

    window.closeQuickSurveyModal = function () {
        const modal = document.getElementById('quickSurveyModal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    };

    function injectQuickSurveyModal() {
        let modal = document.getElementById('quickSurveyModal');
        if (modal) return modal;

        modal = document.createElement('div');
        modal.id = 'quickSurveyModal';
        modal.className = 'qs-modal-overlay';
        modal.onclick = function (e) {
            if (e.target.id === 'quickSurveyModal') window.closeQuickSurveyModal();
        };

        modal.innerHTML = `
            <div class="qs-modal-box" onclick="event.stopPropagation()">
                <div class="px-6 py-4 bg-gradient-to-r from-purple-700 to-blue-700 text-white flex justify-between items-center shrink-0">
                    <div class="flex items-center gap-2.5">
                        <i class="fas fa-poll-h text-amber-300 text-lg"></i>
                        <div>
                            <h3 class="font-bold text-sm">Nạp Nhanh Dữ Liệu Khảo Sát Học Viên</h3>
                            <p class="text-[11px] text-purple-200" id="quickSurveyCourseTag">Tự động phân tách và tính điểm CSAT tức thời</p>
                        </div>
                    </div>
                    <button type="button" onclick="window.closeQuickSurveyModal()" class="text-white/70 hover:text-white w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="p-6 space-y-3">
                    <label class="block text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Dán bảng khảo sát Google Form / Excel vào đây:</span>
                        <span id="quickSurveyBadge" class="text-[10px] font-bold text-slate-400">Chưa có dữ liệu</span>
                    </label>
                    <textarea id="quickSurveyInput" oninput="window.previewQuickSurvey()" class="w-full h-44 text-[11px] font-mono leading-relaxed p-3 border border-slate-300 rounded-xl outline-none focus:border-purple-500 custom-scrollbar resize-none bg-slate-50 focus:bg-white transition" placeholder="Copy từ Google Sheets (các cột Timestamp, Mã khóa, các cột điểm đánh giá 1-5, ý kiến đóng góp...) dán vào đây..."></textarea>
                    <div id="quickSurveyPreview" class="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-slate-700 min-h-[44px] flex items-center">
                        <span class="italic text-slate-400">Dán bảng khảo sát để hệ thống tính điểm CSAT và bóc tách góp ý của khóa này.</span>
                    </div>
                </div>
                <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                    <span class="text-[11px] text-slate-500"><i class="fas fa-bolt text-amber-500 mr-1"></i> Tính toán tự động và lưu trữ vào Trainer OS.</span>
                    <div class="flex items-center gap-2">
                        <button type="button" onclick="window.closeQuickSurveyModal()" class="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-semibold transition cursor-pointer">Đóng</button>
                        <button type="button" onclick="window.saveQuickSurveyData()" class="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer">
                            <i class="fas fa-check"></i> Lưu & Tự Tính CSAT
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    window.openQuickSurveyModal = function (targetCourse) {
        const modal = injectQuickSurveyModal();

        let code = (typeof targetCourse === 'string' && targetCourse.trim()) ? targetCourse.trim() : '';
        if (!code) {
            code = (document.getElementById('courseId') || document.getElementById('db-code') || document.getElementById('conf-course-code'))?.value || '';
        }
        code = code.trim().toUpperCase();

        const tag = document.getElementById('quickSurveyCourseTag');
        if (tag) tag.innerText = code ? `Đang tính toán cho khóa: ${code}` : 'Tự động tính CSAT theo từng mã khóa';

        const isTax = window.location.pathname.includes('thuehkd');
        const storageKey = isTax ? 'kv_survey_tax' : 'kv_survey_spcb';
        const existing = localStorage.getItem(storageKey) || '';

        const inputEl = document.getElementById('quickSurveyInput');
        if (inputEl) inputEl.value = existing;

        window.previewQuickSurvey(code);

        modal.style.display = 'flex';
        void modal.offsetWidth;
        modal.classList.add('active');
    };

    window.previewQuickSurvey = function (targetCode) {
        const inputEl = document.getElementById('quickSurveyInput');
        const badgeEl = document.getElementById('quickSurveyBadge');
        const prevEl = document.getElementById('quickSurveyPreview');
        if (!inputEl || !prevEl) return;

        let code = targetCode;
        if (!code || typeof code !== 'string') {
            code = (document.getElementById('courseId') || document.getElementById('db-code') || document.getElementById('conf-course-code'))?.value || '';
        }
        code = code.trim().toUpperCase();

        const val = inputEl.value.trim();
        const lines = val.split(/\r?\n/).filter(Boolean);

        if (lines.length <= 1) {
            if (badgeEl) badgeEl.innerText = 'Chưa có dữ liệu';
            prevEl.innerHTML = '<span class="italic text-slate-400">Dán bảng khảo sát để hệ thống tính điểm CSAT và bóc tách góp ý của khóa này.</span>';
            return;
        }

        if (badgeEl) {
            badgeEl.innerText = `${lines.length - 1} dòng phản hồi`;
            badgeEl.className = 'text-[10px] font-bold text-blue-600';
        }

        const stats = window.getCourseSurveyStats(code, val);
        if (stats.found && stats.isSpecific) {
            prevEl.innerHTML = `<span class="text-emerald-700 font-bold"><i class="fas fa-star text-amber-500 mr-1"></i>CSAT Khóa ${stats.courseCode}: ${stats.avgCsat}</span> &bull; <span class="text-slate-700 font-medium ml-1.5">${stats.responseCount} học viên đánh giá</span>${stats.feedbacks && stats.feedbacks.length > 0 ? ` &bull; <span class="text-slate-500 text-[10px] ml-1.5">${stats.feedbacks.length} góp ý chi tiết</span>` : ''}`;
        } else {
            prevEl.innerHTML = `<span class="text-blue-700 font-bold"><i class="fas fa-calculator text-blue-500 mr-1"></i>CSAT Chung: ${stats.avgCsat}</span> &bull; <span class="text-slate-600 font-medium ml-1.5">${lines.length - 1} phản hồi toàn hệ thống</span> &bull; <span class="text-amber-700 text-[10px] ml-1.5">Chưa có dòng nào ghi mã khóa [${code || 'này'}]</span>`;
        }
    };

    window.saveQuickSurveyData = function () {
        const inputEl = document.getElementById('quickSurveyInput');
        if (!inputEl) return;
        const val = inputEl.value.trim();
        if (!val) {
            alert('Vui lòng dán dữ liệu khảo sát vào ô trước khi lưu!');
            return;
        }

        const isTax = window.location.pathname.includes('thuehkd');
        const storageKey = isTax ? 'kv_survey_tax' : 'kv_survey_spcb';
        localStorage.setItem(storageKey, val);

        window.closeQuickSurveyModal();

        const code = (document.getElementById('courseId') || document.getElementById('db-code') || document.getElementById('conf-course-code'))?.value || '';
        window.autoUpdateCsatField(code);

        const stats = window.getCourseSurveyStats(code);
        alert(`⚡ ĐÃ ĐỒNG BỘ THÀNH CÔNG DỮ LIỆU KHẢO SÁT!\n\n- Mã khóa: ${code || 'Toàn hệ thống'}\n- Điểm CSAT: ${stats.avgCsat || '4.8/5'}\n${stats.isSpecific ? `- Số lượng học viên đánh giá: ${stats.responseCount}` : '- Đang áp dụng điểm CSAT trung bình'}`);
    };

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
        let prof = { name: 'Nguyễn Lê Nhật Vi', title: 'L&D Specialist' }; try { const savedP = JSON.parse(localStorage.getItem('kv_trainer_profile')); if(savedP) prof = savedP; } catch(e) {}
        
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
