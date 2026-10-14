/**
 * TRAINER OS - EXECUTIVE TRAINING REPORT MEMO (CHUẨN DOANH NGHIỆP A4)
 * Version: 5.1 Enterprise UX (Fixed Scroll Clipping & Vietnamese Date Format)
 * Tính năng: Xem trước trước khi nộp, xem lại từ MasterDB, in ấn xuất PDF chuẩn A4, chữ ký Trainer & Leader
 */

(function () {
    // 1. CSS CHO PHIẾU BÁO CÁO (ĐÃ FIX LỖI CUỘN MẤT ĐỈNH)
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
            align-items: flex-start; /* Fix triệt để lỗi mất đỉnh khi nội dung dài */
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
            margin-bottom: 40px; /* Đảm bảo đáy không bị sát màn hình khi cuộn hết */
        }

        /* ĐỊNH DẠNG CHUYÊN BIỆT KHI BẤM IN / XUẤT PDF */
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

    // 2. HÀM CHUYỂN ĐỔI NGÀY THÁNG TIẾNG VIỆT CHUẨN XÁC
    function formatVietnameseDate(rawDate) {
        if (!rawDate) return '--';
        
        // Trường hợp định dạng YYYY-MM-DD thuần túy (tránh lệch múi giờ UTC)
        if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.trim())) {
            const parts = rawDate.trim().split('-');
            const y = parseInt(parts[0]);
            const m = parseInt(parts[1]) - 1;
            const day = parseInt(parts[2]);
            const d = new Date(y, m, day);
            const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
            return `${dayNames[d.getDay()]}, ${parts[2]}/${parts[1]}/${y}`;
        }

        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return String(rawDate);

        const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const thu = dayNames[d.getDay()];
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();

        return `${thu}, ${day}/${month}/${year}`;
    }

    // 3. TIÊM CSS VÀ MODAL VÀO TRANG
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
                <!-- THANH ĐIỀU KHIỂN TRÊN CÙNG (ẨN KHI IN) -->
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

                <!-- TỜ GIẤY BÁO CÁO CHUẨN A4 -->
                <div class="p-8 sm:p-10 space-y-6 bg-white" id="memoPrintArea">
                    <!-- 1. HEADER DOANH NGHIỆP -->
                    <div class="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                        <div class="space-y-1">
                            <div class="flex items-center gap-2">
                                <span class="text-xl font-black text-blue-600 tracking-tight">KiotViet</span>
                                <span class="text-xs font-extrabold text-slate-400">|</span>
                                <span class="text-xs font-extrabold uppercase tracking-widest text-slate-700">Bộ Phận Đào Tạo (L&D)</span>
                            </div>
                            <p class="text-[11px] text-slate-500 font-medium">Hệ Thống Quản Trị Đào Tạo Nội Bộ Trainer OS</p>
                        </div>
                        <div class="text-right space-y-1">
                            <span id="memoBadgeCourseId" class="inline-block px-3 py-1 rounded-md bg-blue-50 text-blue-700 font-black text-xs font-mono border border-blue-200 uppercase">
                                Mã: --
                            </span>
                            <p class="text-[11px] text-slate-400 font-medium" id="memoDateCreated">Ngày tạo: --/--/----</p>
                        </div>
                    </div>

                    <!-- TIÊU ĐỀ CHÍNH -->
                    <div class="text-center py-2">
                        <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tight" id="memoReportHeaderTitle">
                            Báo Cáo Đánh Giá Kết Quả Đào Tạo
                        </h2>
                        <p class="text-xs font-semibold text-slate-500 mt-1" id="memoSubHeaderInfo">
                            Khóa: -- | Thời gian: --
                        </p>
                    </div>

                    <!-- 2. THÔNG TIN CHUNG (GRID 2 CỘT) -->
                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phân Hệ Đào Tạo</p>
                            <p class="text-sm font-bold text-slate-800 mt-0.5" id="memoGroupName">--</p>
                        </div>
                        <div>
                            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Giảng Viên Phụ Trách (Trainer)</p>
                            <p class="text-sm font-bold text-slate-800 mt-0.5" id="memoTrainerName">--</p>
                        </div>
                        <div>
                            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thời Gian Diễn Ra</p>
                            <p class="text-xs font-bold text-slate-700 mt-0.5" id="memoTimeline">--</p>
                        </div>
                        <div>
                            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trạng Thái Khóa</p>
                            <p class="text-xs font-bold text-emerald-700 mt-0.5" id="memoStatus">Hoàn thành</p>
                        </div>
                    </div>

                    <!-- 3. CHỈ SỐ HIỆU SUẤT ĐÀO TẠO (4 KHỐI KPIS) -->
                    <div>
                        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                            <i class="fas fa-chart-pie text-blue-600"></i> Chỉ Số Hiệu Suất Học Viên (KPIs)
                        </h4>
                        <div class="grid grid-cols-4 gap-3 text-center">
                            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <span class="text-[10px] font-bold text-slate-400 uppercase">Sĩ Số</span>
                                <p class="text-2xl font-black text-slate-800 mt-0.5" id="memoTotalHV">0</p>
                            </div>
                            <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                                <span class="text-[10px] font-bold text-emerald-600 uppercase">Đạt (Pass)</span>
                                <p class="text-2xl font-black text-emerald-600 mt-0.5" id="memoPassHV">0</p>
                            </div>
                            <div class="p-3 bg-rose-50 rounded-xl border border-rose-200">
                                <span class="text-[10px] font-bold text-rose-500 uppercase">Trượt (Fail/Miss)</span>
                                <p class="text-2xl font-black text-rose-500 mt-0.5" id="memoFailHV">0</p>
                            </div>
                            <div class="p-3 bg-purple-50 rounded-xl border border-purple-200">
                                <span class="text-[10px] font-bold text-purple-600 uppercase">Tỷ Lệ Pass</span>
                                <p class="text-2xl font-black text-purple-700 mt-0.5" id="memoPassRate">0%</p>
                            </div>
                        </div>
                        <div class="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs px-4">
                            <span class="text-slate-600 font-semibold">Mức Độ Hài Lòng Khóa Học (CSAT):</span>
                            <span class="font-extrabold text-blue-700 text-sm" id="memoCsat">4.8 / 5.0 ★</span>
                        </div>
                    </div>

                    <!-- 4. ĐÁNH GIÁ CHẤT LƯỢNG & ĐỊNH HƯỚNG HÀNH ĐỘNG -->
                    <div class="space-y-3">
                        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <i class="fas fa-brain text-purple-600"></i> Đánh Giá Chất Lượng & Định Hướng
                        </h4>
                        
                        <div class="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs">
                            <p class="font-bold text-emerald-800 uppercase text-[11px] mb-1 flex items-center gap-1">
                                <i class="fas fa-star text-amber-500"></i> Điểm Sáng Nổi Bật (Highlights):
                            </p>
                            <p class="text-slate-700 leading-relaxed font-medium" id="memoHighlights">--</p>
                        </div>

                        <div class="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 text-xs">
                            <p class="font-bold text-rose-800 uppercase text-[11px] mb-1 flex items-center gap-1">
                                <i class="fas fa-exclamation-circle text-rose-500"></i> Khó Khăn & Tồn Đọng (Issues):
                            </p>
                            <p class="text-slate-700 leading-relaxed font-medium" id="memoIssues">--</p>
                        </div>

                        <div class="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs">
                            <p class="font-bold text-blue-800 uppercase text-[11px] mb-1 flex items-center gap-1">
                                <i class="fas fa-bullseye text-blue-600"></i> Kế Hoạch Đề Xuất (Action Plan):
                            </p>
                            <p class="text-slate-700 leading-relaxed font-medium" id="memoActionPlan">--</p>
                        </div>
                    </div>

                    <!-- 5. PHỤ LỤC LIÊN KẾT -->
                    <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <p class="font-bold text-slate-600 uppercase text-[10px]">Tài liệu đính kèm:</p>
                        <div class="flex items-center gap-4 text-blue-600">
                            <a id="memoListLink" href="#" target="_blank" class="hover:underline flex items-center gap-1">
                                <i class="fas fa-file-excel text-emerald-600"></i> Danh sách học viên
                            </a>
                            <span class="text-slate-300">|</span>
                            <a id="memoQuizLink" href="#" target="_blank" class="hover:underline flex items-center gap-1">
                                <i class="fas fa-graduation-cap text-purple-600"></i> Khóa học LMS
                            </a>
                        </div>
                    </div>

                    <!-- 6. CHỮ KÝ XÁC NHẬN CHUẨN DOANH NGHIỆP -->
                    <div class="pt-6 grid grid-cols-2 text-center text-xs">
                        <div class="space-y-1">
                            <p class="font-extrabold uppercase text-slate-700">Trưởng Bộ Phận L&D</p>
                            <p class="text-[11px] text-slate-400 italic">(Ký duyệt & xác nhận)</p>
                            <div class="h-16 flex items-center justify-center">
                                <span class="px-3 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 font-mono text-[10px] font-bold tracking-wider">ĐÃ XÁC THỰC</span>
                            </div>
                            <p class="font-bold text-slate-800">L&D Management</p>
                        </div>
                        <div class="space-y-1">
                            <p class="font-extrabold uppercase text-slate-700">Giảng Viên Đào Tạo</p>
                            <p class="text-[11px] text-slate-400 italic">(Người lập báo cáo)</p>
                            <div class="h-16 flex items-center justify-center">
                                <span class="font-serif italic text-blue-600 text-base font-bold" id="memoSignName">Trainer</span>
                            </div>
                            <p class="font-bold text-slate-800" id="memoFooterTrainer">Trainer</p>
                        </div>
                    </div>
                </div>

                <!-- THANH HÀNH ĐỘNG DƯỚI ĐÁY MODAL (ẨN KHI IN) -->
                <div class="no-print px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
                    <span class="text-xs text-slate-400 font-medium">Báo cáo được xác thực bởi Trainer OS</span>
                    <div class="flex items-center gap-3" id="memoActionButtons">
                        <button onclick="window.closeReportMemo()" class="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition shadow-xs">
                            Đóng Lại
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modalContainer);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') window.closeReportMemo();
        });
    }

    // 4. MỞ BÁO CÁO (ĐÃ FORMAT CHUẨN THỨ, NGÀY, THÁNG, NĂM)
    window.openReportMemo = function (courseData, isPreview = false, submitCallback = null) {
        injectMemoDom();

        const modal = document.getElementById('executiveReportModal');
        const prof = JSON.parse(localStorage.getItem('kv_trainer_profile')) || { name: 'Nguyễn Lê Nhật Vi', title: 'L&D Specialist' };
        
        const total = parseInt(courseData.totalTrainees) || 0;
        const pass = parseInt(courseData.passedTrainees) || 0;
        const fail = parseInt(courseData.failedTrainees) || 0;
        const rate = total > 0 ? Math.round((pass / total) * 100) : 0;
        const cId = courseData.courseId || 'CHƯA ĐẶT';

        // Format ngày tháng chuẩn tiếng Việt: Thứ [X], DD/MM/YYYY
        const formattedStart = formatVietnameseDate(courseData.startDate);
        const formattedFinish = formatVietnameseDate(courseData.finishDate);
        const formattedToday = formatVietnameseDate(new Date());

        // Điền dữ liệu vào form A4
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

        // Cập nhật nút bấm
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
        // Tự động cuộn mượt lên đỉnh tờ giấy khi mở
        modal.scrollTop = 0;
    };

    window.closeReportMemo = function () {
        const modal = document.getElementById('executiveReportModal');
        if (modal) modal.classList.remove('active');
    };

    window.printReportMemo = function () {
        window.print();
    };

    // 5. TỰ ĐỘNG CHÈN NÚT "XEM TRƯỚC BÁO CÁO" TẠI CÁC TRANG ĐÓNG KHÓA
    function autoInjectPreviewButtonOnClosingPages() {
        const submitBtn = document.getElementById('btnSubmit');
        if (!submitBtn || document.getElementById('btnAutoPreviewMemo')) return;

        const previewBtn = document.createElement('button');
        previewBtn.type = 'button';
        previewBtn.id = 'btnAutoPreviewMemo';
        previewBtn.className = 'w-full py-3.5 mb-3 rounded-xl border border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-sm shadow-sm transition flex items-center justify-center gap-2';
        previewBtn.innerHTML = '<i class="fas fa-eye text-blue-600"></i> Xem Trước Báo Cáo (Preview Form)';
        
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

        submitBtn.parentElement.insertBefore(previewBtn, submitBtn);
    }

    // 6. HỖ TRỢ XEM LẠI PHIẾU TỪ DASHBOARD (INDEX.HTML)
    window.openCourseMemoModal = function (courseId) {
        let db = [];
        try {
            db = JSON.parse(localStorage.getItem('kv_master_db')) || [];
        } catch(e) {}
        
        const course = db.find(d => String(d.courseId).toUpperCase() === String(courseId).toUpperCase());
        if (!course) {
            alert(`Không tìm thấy hồ sơ lưu trữ của khóa [${courseId}]!`);
            return;
        }

        window.openReportMemo(course, false);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectMemoDom();
            autoInjectPreviewButtonOnClosingPages();
        });
    } else {
        injectMemoDom();
        autoInjectPreviewButtonOnClosingPages();
    }
})();
