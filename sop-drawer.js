/**
 * TRAINER OS - UNIVERSAL CONTEXT-AWARE SOP ENGINE
 * Version: 4.8 Enterprise
 * Tự động nhận diện ngữ cảnh 10 file, đồng bộ 2 chiều từ Google Sheets tab TrainerSOPs
 */

(function () {
    // 1. CSS INJECTION (TỰ ĐỘNG TIÊM PHONG CÁCH SAAS VÀO MỌI TRANG)
    const sopStyles = `
        /* SOP DRAWER STYLES */
        .universal-sop-overlay {
            position: fixed; inset: 0;
            background: rgba(15, 23, 42, 0.4);
            backdrop-filter: blur(3px);
            z-index: 999998;
            opacity: 0; pointer-events: none;
            transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .universal-sop-overlay.active {
            opacity: 1; pointer-events: auto;
        }
        .universal-sop-drawer {
            position: fixed; right: -460px; top: 0; bottom: 0;
            width: 460px; max-width: 95vw;
            background: #ffffff;
            z-index: 999999;
            box-shadow: -10px 0 35px -5px rgba(0, 0, 0, 0.15);
            transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex; flex-direction: column;
            font-family: 'Inter', sans-serif;
        }
        .universal-sop-drawer.active {
            right: 0;
        }
        .sop-timeline-item {
            position: relative;
            padding-left: 28px;
            padding-bottom: 24px;
            border-left: 2px solid #e2e8f0;
            margin-left: 14px;
        }
        .sop-timeline-item:last-child {
            border-left-color: transparent;
            padding-bottom: 0;
        }
        .sop-timeline-dot {
            position: absolute; left: -9px; top: 2px;
            width: 16px; height: 16px;
            border-radius: 50%;
            background: #ffffff;
            border: 4px solid #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }
        /* NÚT NỔI UNIVERSAL TRIGGER NẰM Ở MÉP PHẢI */
        .universal-sop-trigger {
            position: fixed;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            z-index: 99999;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: #ffffff;
            padding: 10px 8px 10px 12px;
            border-radius: 12px 0 0 12px;
            box-shadow: -4px 0 15px rgba(37, 99, 235, 0.3);
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            user-select: none;
        }
        .universal-sop-trigger:hover {
            padding-left: 16px;
            box-shadow: -6px 0 20px rgba(37, 99, 235, 0.4);
            background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        }
        .universal-sop-trigger span {
            writing-mode: vertical-rl;
            text-orientation: mixed;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
        }
    `;

    // 2. TỰ ĐỘNG NHẬN DIỆN NGỮ CẢNH TRANG (CONTEXT-AWARE ENGINE)
    function detectContext() {
        const path = (window.location.pathname || '').toLowerCase();
        if (path.includes('spcb')) return 'SPCB';
        if (path.includes('kv1')) return 'KV1';
        if (path.includes('thuehkd')) return 'TAX';
        if (path.includes('industry')) {
            const checkedRadio = document.querySelector('input[name="industryType"]:checked');
            return checkedRadio ? checkedRadio.value.toUpperCase() : 'FNB';
        }
        return 'ALL';
    }

    // 3. HTML INJECTION (TIÊM CẤU TRÚC GIAO DIỆN)
    function injectSOPDom() {
        // Tránh trùng lặp nếu trang đã có
        if (document.getElementById('universal-sop-drawer')) return;

        // Tiêm Style
        const styleEl = document.createElement('style');
        styleEl.innerHTML = sopStyles;
        document.head.appendChild(styleEl);

        // Tiêm Nút Nổi Kích Hoạt (FAB)
        const triggerBtn = document.createElement('div');
        triggerBtn.id = 'universal-sop-trigger-btn';
        triggerBtn.className = 'universal-sop-trigger';
        triggerBtn.title = 'Mở Cẩm Nang Quy Trình L&D';
        triggerBtn.innerHTML = `
            <i class="fas fa-book-open text-xs"></i>
            <span>SOP</span>
        `;
        triggerBtn.onclick = () => window.openUniversalSOP();
        document.body.appendChild(triggerBtn);

        // Tiêm Drawer & Overlay
        const container = document.createElement('div');
        container.innerHTML = `
            <div id="universal-sop-overlay" class="universal-sop-overlay" onclick="window.closeUniversalSOP()"></div>
            <div id="universal-sop-drawer" class="universal-sop-drawer">
                <!-- HEADER NGĂN KÉO -->
                <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                    <div>
                        <div class="flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shadow-inner">
                                <i class="fas fa-book-open"></i>
                            </div>
                            <h3 class="text-base font-bold text-slate-800">Cẩm Nang Trainer (SOP)</h3>
                        </div>
                        <p class="text-[11px] text-slate-500 mt-0.5" id="sop-header-subtitle">Quy trình vận hành chuẩn</p>
                    </div>
                    <button onclick="window.closeUniversalSOP()" class="text-slate-400 hover:text-rose-500 w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center transition shadow-xs">
                        <i class="fas fa-times text-sm"></i>
                    </button>
                </div>

                <!-- TOOLBAR BỘ LỌC & TÌM KIẾM BƯỚC -->
                <div class="p-4 border-b border-slate-100 bg-white flex flex-col gap-3 shrink-0 shadow-xs">
                    <div class="flex items-center gap-2">
                        <select id="sop-course-filter" onchange="window.filterSOPByCourse(this.value)" class="flex-1 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                            <option value="ALL">-- Tất cả quy trình --</option>
                            <option value="SPCB">Khóa Cơ bản (SPCB - Retail)</option>
                            <option value="KV1">Khóa Sản phẩm KV1</option>
                            <option value="TAX">Chuyên đề HĐĐT & Thuế</option>
                            <option value="FNB">Chuyên ngành KiotViet FNB</option>
                            <option value="SALON">Chuyên ngành KV Salon</option>
                            <option value="HOTEL">Chuyên ngành KV Hotel</option>
                        </select>
                        <button onclick="window.syncSOPFromCloud(true)" class="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-blue-600 border border-slate-200 rounded-lg text-xs transition" title="Tải lại từ Google Sheets">
                            <i id="sop-refresh-icon" class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    <div class="relative">
                        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                        <input type="text" id="sop-search-input" oninput="window.searchSOPSteps(this.value)" placeholder="Tìm kiếm bước quy trình..." class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition">
                    </div>
                </div>

                <!-- NỘI DUNG TIMELINE CÁC BƯỚC -->
                <div id="sop-steps-body" class="flex-grow overflow-y-auto custom-scrollbar p-6 bg-slate-50/30 space-y-2">
                    <!-- Dữ liệu render tại đây -->
                </div>

                <!-- FOOTER TRẠNG THÁI -->
                <div class="p-3 border-t border-slate-100 bg-slate-50 text-center shrink-0 flex items-center justify-between px-6">
                    <span class="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                        <i class="fas fa-database text-blue-500"></i> Tab: <b class="text-slate-600 font-mono">TrainerSOPs</b>
                    </span>
                    <span id="sop-status-label" class="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Sẵn sàng
                    </span>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // Lắng nghe phím ESC để đóng
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') window.closeUniversalSOP();
        });

        // Tự động lắng nghe thay đổi radio trong industry.html nếu có
        document.querySelectorAll('input[name="industryType"]').forEach(r => {
            r.addEventListener('change', () => {
                if (document.getElementById('universal-sop-drawer')?.classList.contains('active')) {
                    window.openUniversalSOP(r.value.toUpperCase());
                }
            });
        });
    }

    // 4. LOGIC XỬ LÝ DỮ LIỆU & RENDER TIMELINE
    let cachedSops = [];
    let currentFilterCourse = 'ALL';

    window.openUniversalSOP = async function (specificCourse = null) {
        injectSOPDom();

        const overlay = document.getElementById('universal-sop-overlay');
        const drawer = document.getElementById('universal-sop-drawer');
        overlay.classList.add('active');
        drawer.classList.add('active');

        // Xác định khóa học mục tiêu dựa trên ngữ cảnh
        const targetCourse = specificCourse || detectContext();
        currentFilterCourse = targetCourse;

        const selectEl = document.getElementById('sop-course-filter');
        if (selectEl) selectEl.value = targetCourse;

        const subtitleEl = document.getElementById('sop-header-subtitle');
        if (subtitleEl) {
            subtitleEl.innerText = targetCourse === 'ALL' ? 'Quy trình vận hành toàn hệ thống' : `Quy trình khóa: ${targetCourse}`;
        }

        document.getElementById('sop-search-input').value = '';

        // Tải dữ liệu (Ưu tiên đọc SessionStorage)
        await window.loadSOPData(false);
    };

    window.closeUniversalSOP = function () {
        const overlay = document.getElementById('universal-sop-overlay');
        const drawer = document.getElementById('universal-sop-drawer');
        if (overlay) overlay.classList.remove('active');
        if (drawer) drawer.classList.remove('active');
    };

    window.loadSOPData = async function (forceRefresh = false) {
        const bodyEl = document.getElementById('sop-steps-body');
        const statusLabel = document.getElementById('sop-status-label');

        // 1. Kiểm tra cache phiên nếu không ép tải lại
        const sessionData = sessionStorage.getItem('kv_sop_cache');
        if (sessionData && !forceRefresh) {
            try {
                cachedSops = JSON.parse(sessionData);
                window.renderSOPTimeline();
                return;
            } catch (e) {}
        }

        // 2. Fetch dữ liệu từ Google Apps Script
        const apiUrl = localStorage.getItem('kv_api_url') || '';
        if (!apiUrl) {
            bodyEl.innerHTML = `
                <div class="text-center py-16 px-4">
                    <div class="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3 border border-amber-200">
                        <i class="fas fa-plug"></i>
                    </div>
                    <h4 class="text-sm font-bold text-slate-800 mb-1">Chưa Kết Nối API</h4>
                    <p class="text-xs text-slate-500 mb-4">Vui lòng vào Cài đặt Hệ thống để dán Link Web App Google Sheets.</p>
                    <a href="settings.html" class="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition">
                        <i class="fas fa-cog"></i> Vào Cài Đặt Ngay
                    </a>
                </div>
            `;
            return;
        }

        bodyEl.innerHTML = `
            <div class="text-center py-20">
                <i class="fas fa-circle-notch fa-spin text-3xl text-blue-500 mb-3"></i>
                <p class="text-xs font-bold text-slate-600">Đang đồng bộ cẩm nang từ Google Sheets...</p>
            </div>
        `;
        if (statusLabel) statusLabel.innerText = 'Đang tải...';

        try {
            const res = await fetch(apiUrl);
            const data = await res.json();
            cachedSops = data.sops || [];
            
            // Lưu cache phiên
            sessionStorage.setItem('kv_sop_cache', JSON.stringify(cachedSops));
            if (statusLabel) statusLabel.innerText = `${cachedSops.length} bước`;

            window.renderSOPTimeline();
        } catch (err) {
            bodyEl.innerHTML = `
                <div class="text-center py-16 px-4 text-rose-500">
                    <i class="fas fa-exclamation-triangle text-3xl mb-3"></i>
                    <h4 class="text-sm font-bold mb-1">Lỗi Kết Nối Cẩm Nang</h4>
                    <p class="text-xs text-slate-500">Không thể lấy dữ liệu từ Google Sheets: ${err.message}</p>
                </div>
            `;
            if (statusLabel) statusLabel.innerText = 'Lỗi!';
        }
    };

    window.syncSOPFromCloud = async function () {
        const icon = document.getElementById('sop-refresh-icon');
        if (icon) icon.classList.add('fa-spin');
        await window.loadSOPData(true);
        if (icon) icon.classList.remove('fa-spin');
    };

    window.filterSOPByCourse = function (courseCode) {
        currentFilterCourse = courseCode;
        const subtitleEl = document.getElementById('sop-header-subtitle');
        if (subtitleEl) {
            subtitleEl.innerText = courseCode === 'ALL' ? 'Quy trình vận hành toàn hệ thống' : `Quy trình khóa: ${courseCode}`;
        }
        window.renderSOPTimeline();
    };

    window.searchSOPSteps = function (query) {
        window.renderSOPTimeline(query.toLowerCase().trim());
    };

    window.renderSOPTimeline = function (keyword = '') {
        const bodyEl = document.getElementById('sop-steps-body');
        if (!bodyEl) return;

        let filtered = cachedSops.slice();

        // 1. Lọc theo Khóa
        if (currentFilterCourse !== 'ALL') {
            filtered = filtered.filter(s => (s.courseId || '').toUpperCase() === currentFilterCourse.toUpperCase());
        }

        // 2. Lọc theo từ khóa tìm kiếm
        if (keyword) {
            filtered = filtered.filter(s => 
                (s.stepName || '').toLowerCase().includes(keyword) || 
                (s.stepDesc || '').toLowerCase().includes(keyword) ||
                (s.courseId || '').toLowerCase().includes(keyword)
            );
        }

        // 3. Sắp xếp thứ tự bước
        filtered.sort((a, b) => {
            const courseCompare = (a.courseId || '').localeCompare(b.courseId || '');
            if (courseCompare !== 0 && currentFilterCourse === 'ALL') return courseCompare;
            return (parseInt(a.stepOrder) || 0) - (parseInt(b.stepOrder) || 0);
        });

        if (filtered.length === 0) {
            bodyEl.innerHTML = `
                <div class="text-center py-16 px-4 text-slate-400">
                    <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl mx-auto mb-3">
                        <i class="fas fa-inbox"></i>
                    </div>
                    <p class="text-xs font-bold text-slate-600">Chưa có Cẩm nang cho mục này</p>
                    <p class="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">Vui lòng mở Google Sheets, vào tab <b class="text-slate-600 font-mono">TrainerSOPs</b> để soạn thảo quy trình chuẩn.</p>
                </div>
            `;
            return;
        }

        let html = '';
        let lastCourse = null;

        filtered.forEach(sop => {
            // Nhóm tiêu đề khóa nếu đang hiển thị Tất cả
            if (currentFilterCourse === 'ALL' && sop.courseId !== lastCourse) {
                lastCourse = sop.courseId;
                html += `
                    <div class="pt-3 pb-2 mb-2 border-b border-slate-200 flex items-center justify-between">
                        <span class="text-xs font-black text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                            Khóa: ${escapeHtml(sop.courseId)}
                        </span>
                    </div>
                `;
            }

            html += `
                <div class="sop-timeline-item">
                    <div class="sop-timeline-dot"></div>
                    <div class="flex items-start justify-between gap-2 mb-1">
                        <h4 class="font-bold text-slate-800 text-[13px] leading-snug">
                            Bước ${sop.stepOrder}: ${escapeHtml(sop.stepName)}
                        </h4>
                        ${currentFilterCourse === 'ALL' ? `<span class="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">${escapeHtml(sop.courseId)}</span>` : ''}
                    </div>
                    <div class="text-[12px] text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200/90 whitespace-pre-wrap leading-relaxed shadow-xs">
                        ${escapeHtml(sop.stepDesc)}
                    </div>
                </div>
            `;
        });

        bodyEl.innerHTML = html;
    };

    // 5. TƯƠNG THÍCH NGƯỢC 100% VỚI NÚT SOP CŨ (VÍ DỤ TRÊN SPCB.HTML)
    window.loadAndOpenSOP = function (courseId) {
        window.openUniversalSOP(courseId);
    };
    window.closeSOP = function () {
        window.closeUniversalSOP();
    };

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // 6. TỰ ĐỘNG KHỞI TẠO KHI TẢI TRANG
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectSOPDom);
    } else {
        injectSOPDom();
    }
})();
