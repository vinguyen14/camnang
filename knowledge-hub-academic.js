/**
 * MASTER DATA HUB - GIAO DIỆN HỌC THUẬT (27/11/2026)
 * Lớp giao diện "thư viện học liệu" đồng bộ Aurora (Sáng/Tối theo html[data-aurora]) + 4 kiểu hiển thị riêng:
 *   - Masterdata E-Learning  -> THƯ VIỆN GIÁO TRÌNH (mục lục theo khóa, huy hiệu đủ/thiếu học liệu)
 *   - MCQ Master             -> NGÂN HÀNG ĐỀ THI   (thẻ đề thi theo khóa)
 *   - Database Tình Huống    -> CASE STUDY         (Ngày x Buổi, thẻ lật xem gợi ý)
 *   - MasterExercises        -> SỔ TAY BÀI TẬP     (Ngành -> Buổi, yêu cầu / hướng dẫn / tiêu chí)
 * Nạp SAU script chính của knowledge-hub.html: ghi đè các hàm render*Cards và renderDynamicSidebar.
 * Chế độ Bảng, bộ lọc, tìm kiếm, split-screen của trang giữ nguyên.
 */
(function () {
  'use strict';
  const doc = document.documentElement;
  doc.classList.add('kh-academic');

  // ---------- Font tiêu đề kiểu học thuật ----------
  if (!document.getElementById('kh-font')) {
    const l = document.createElement('link');
    l.id = 'kh-font';
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap';
    document.head.appendChild(l);
  }

  // ---------- CSS ----------
  const css = `
  html.kh-academic {
    --kh-paper: #fbfaf7; --kh-card: rgba(255,255,255,.86); --kh-card-solid: #ffffff;
    --kh-ink: #1d1b30; --kh-muted: #67647d; --kh-faint: #9a97ad; --kh-line: rgba(29,27,48,.09);
    --kh-accent: #5a48d8; --kh-accent-soft: rgba(90,72,216,.08); --kh-accent-ink: #4535b8;
    --kh-ok: #0d8a5f; --kh-ok-soft: rgba(13,138,95,.09); --kh-miss: #b4233f; --kh-miss-soft: rgba(180,35,63,.07);
    --kh-gold: #a86a12; --kh-gold-soft: rgba(201,138,30,.10); --kh-shadow: 0 10px 28px -14px rgba(52,40,140,.16);
    --kh-serif: 'Fraunces', Georgia, 'Times New Roman', serif;
  }
  html.kh-academic[data-aurora="dark"] {
    --kh-paper: #0e1022; --kh-card: rgba(24,26,48,.82); --kh-card-solid: #171a31;
    --kh-ink: #ecebf7; --kh-muted: #a6a3bd; --kh-faint: #75728c; --kh-line: rgba(255,255,255,.08);
    --kh-accent: #a99cff; --kh-accent-soft: rgba(169,156,255,.12); --kh-accent-ink: #c3b9ff;
    --kh-ok: #4fd1a5; --kh-ok-soft: rgba(79,209,165,.12); --kh-miss: #ff8aa0; --kh-miss-soft: rgba(255,138,160,.10);
    --kh-gold: #f0b85a; --kh-gold-soft: rgba(240,184,90,.12); --kh-shadow: 0 14px 34px -16px rgba(0,0,0,.7);
  }
  .kh-serif { font-family: var(--kh-serif); letter-spacing: -.01em; }

  /* ===== Khung trang đồng bộ Aurora ===== */
  html.kh-academic main { background: transparent !important; }
  html.kh-academic main > header { background: var(--aurora-header-bg, rgba(255,255,255,.72)) !important; backdrop-filter: blur(18px); border-color: var(--kh-line) !important; }
  html.kh-academic #section-title { font-family: var(--kh-serif); font-size: 15px !important; color: var(--kh-ink) !important; }
  html.kh-academic #breadcrumb-category { color: var(--kh-accent-ink) !important; }
  html.kh-academic #workspace-tab-bar { background: transparent !important; border-color: var(--kh-line) !important; }
  html.kh-academic #workspace-tab-bar .workspace-tab { background: transparent; color: var(--kh-muted) !important; border-color: transparent !important; }
  html.kh-academic #workspace-tab-bar .workspace-tab.active { background: var(--kh-card) !important; color: var(--kh-accent-ink) !important; border-color: var(--kh-line) !important; border-bottom: 2px solid var(--kh-accent) !important; }
  html.kh-academic #pane-primary { background: var(--kh-paper) !important; }
  html.kh-academic #sub-filter-bar { background: transparent !important; border-color: var(--kh-line) !important; }
  html.kh-academic #sub-filter-bar button { background: var(--kh-card) !important; color: var(--kh-muted) !important; border: 1px solid var(--kh-line) !important; border-radius: 999px !important; }
  html.kh-academic #sub-filter-bar button.bg-kiot-blue { background: var(--kh-accent) !important; color: #fff !important; border-color: transparent !important; }
  html.kh-academic #local-search-input { background: var(--kh-card) !important; border-color: var(--kh-line) !important; color: var(--kh-ink) !important; }

  /* Khối "Bộ lọc phân hệ" trên trang Tổng quan (vốn nền tối chữ sáng) */
  html.kh-academic .saas-card.from-slate-900 { background: var(--kh-card) !important; color: var(--kh-ink) !important; border: 1px solid var(--kh-line) !important; }
  html.kh-academic .saas-card.from-slate-900 h3 { color: var(--kh-ink) !important; font-family: var(--kh-serif); font-size: 14px !important; text-transform: none !important; letter-spacing: 0 !important; }
  html.kh-academic .saas-card.from-slate-900 p { color: var(--kh-muted) !important; }
  html.kh-academic .saas-card.from-slate-900 button { background: var(--kh-paper) !important; color: var(--kh-muted) !important; border: 1px solid var(--kh-line) !important; border-radius: 999px !important; }
  html.kh-academic .saas-card.from-slate-900 button.bg-kiot-blue { background: var(--kh-accent) !important; color: #fff !important; border-color: transparent !important; }

  /* Ô cảnh báo nền nhạt trên trang Tổng quan khi ở chế độ Tối */
  html.kh-academic[data-aurora="dark"] #master-dashboard-view [class*="bg-amber-50"] { background: var(--kh-gold-soft) !important; border-color: transparent !important; }
  html.kh-academic[data-aurora="dark"] #master-dashboard-view [class*="bg-indigo-50"],
  html.kh-academic[data-aurora="dark"] #master-dashboard-view [class*="bg-violet-50"],
  html.kh-academic[data-aurora="dark"] #master-dashboard-view [class*="bg-purple-50"] { background: var(--kh-accent-soft) !important; border-color: transparent !important; }
  html.kh-academic[data-aurora="dark"] #master-dashboard-view [class*="bg-amber-50"] p,
  html.kh-academic[data-aurora="dark"] #master-dashboard-view [class*="bg-indigo-50"] p,
  html.kh-academic[data-aurora="dark"] #master-dashboard-view [class*="bg-violet-50"] p,
  html.kh-academic[data-aurora="dark"] #master-dashboard-view [class*="bg-purple-50"] p { color: var(--kh-muted) !important; }

  /* Panel mục lục (trước đây là khối tối "MASTER HUB") */
  html.kh-academic #hub-sidebar { background: var(--kh-card) !important; backdrop-filter: blur(20px); border-right: 1px solid var(--kh-line) !important; color: var(--kh-ink) !important; }
  html.kh-academic #hub-sidebar .bg-slate-950, html.kh-academic #hub-sidebar .bg-slate-900,
  html.kh-academic #hub-sidebar [class*="bg-slate-950/"], html.kh-academic #hub-sidebar .bg-slate-800,
  html.kh-academic #hub-sidebar [class*="bg-slate-800/"] { background: transparent !important; }
  html.kh-academic #hub-sidebar [class*="border-slate-"] { border-color: var(--kh-line) !important; }
  html.kh-academic #hub-sidebar .text-white, html.kh-academic #hub-sidebar h1 { color: var(--kh-ink) !important; }
  html.kh-academic #hub-sidebar .text-slate-300, html.kh-academic #hub-sidebar .text-slate-400,
  html.kh-academic #hub-sidebar .text-slate-500 { color: var(--kh-muted) !important; }
  html.kh-academic #hub-sidebar h1 { font-family: var(--kh-serif); font-size: 14px !important; text-transform: none !important; letter-spacing: 0 !important; }
  html.kh-academic #hub-sidebar button[onclick="openGlobalSearch()"] { background: var(--kh-paper) !important; border: 1px solid var(--kh-line) !important; }
  html.kh-academic #hub-sidebar kbd { background: var(--kh-card-solid) !important; color: var(--kh-faint) !important; border-color: var(--kh-line) !important; }
  html.kh-academic #btn-sync-now { background: var(--kh-accent-soft) !important; color: var(--kh-accent-ink) !important; }
  html.kh-academic #sidebar-btn-home { background: var(--kh-accent-soft) !important; color: var(--kh-accent-ink) !important; box-shadow: none !important; }
  html.kh-academic #sidebar-btn-home.kh-home-active { background: var(--kh-accent) !important; color: #fff !important; }
  html.kh-academic #sidebar-btn-home span, html.kh-academic #sidebar-btn-home i { color: inherit !important; }

  .kh-toc-group { margin: 14px 4px 6px; font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--kh-faint); }
  .kh-toc-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 12px; text-align: left; color: var(--kh-ink); transition: background .15s; }
  .kh-toc-item:hover { background: var(--kh-accent-soft); }
  .kh-toc-item.kh-active { background: var(--kh-accent-soft); box-shadow: inset 3px 0 0 var(--kh-accent); }
  .kh-toc-icon { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; font-size: 12px; flex-shrink: 0; }
  .kh-toc-title { font-size: 12.5px; font-weight: 650; line-height: 1.2; }
  .kh-toc-sub { font-size: 10.5px; color: var(--kh-muted); margin-top: 1px; }
  .kh-toc-count { margin-left: auto; font: 600 10.5px 'Fira Code', monospace; color: var(--kh-muted); background: var(--kh-paper); border: 1px solid var(--kh-line); border-radius: 999px; padding: 1px 7px; }

  /* ===== Thành phần chung ===== */
  .kh-wrap { display: flex; flex-direction: column; gap: 22px; }
  .kh-intro { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding-bottom: 14px; border-bottom: 1px solid var(--kh-line); }
  .kh-eyebrow { font-size: 10.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--kh-accent-ink); }
  .kh-h1 { font-family: var(--kh-serif); font-size: 26px; font-weight: 600; color: var(--kh-ink); line-height: 1.15; margin-top: 4px; }
  .kh-lead { font-size: 12.5px; color: var(--kh-muted); margin-top: 4px; max-width: 640px; }
  .kh-stats { display: flex; gap: 8px; flex-wrap: wrap; }
  .kh-stat { background: var(--kh-card); border: 1px solid var(--kh-line); border-radius: 12px; padding: 8px 12px; min-width: 92px; }
  .kh-stat b { display: block; font-family: var(--kh-serif); font-size: 19px; color: var(--kh-ink); line-height: 1.1; }
  .kh-stat span { font-size: 10.5px; color: var(--kh-muted); }
  .kh-card { background: var(--kh-card); border: 1px solid var(--kh-line); border-radius: 16px; box-shadow: var(--kh-shadow); backdrop-filter: blur(14px); }
  .kh-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 10.5px; font-weight: 600; padding: 3px 8px; border-radius: 999px; border: 1px solid var(--kh-line); color: var(--kh-muted); background: var(--kh-paper); white-space: nowrap; }
  .kh-chip.kh-ok { color: var(--kh-ok); background: var(--kh-ok-soft); border-color: transparent; }
  .kh-chip.kh-miss { color: var(--kh-miss); background: transparent; border-style: dashed; border-color: currentColor; opacity: .85; }
  .kh-chip.kh-accent { color: var(--kh-accent-ink); background: var(--kh-accent-soft); border-color: transparent; }
  .kh-chip.kh-gold { color: var(--kh-gold); background: var(--kh-gold-soft); border-color: transparent; }
  .kh-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 650; padding: 6px 11px; border-radius: 10px; border: 1px solid var(--kh-line); background: var(--kh-card-solid); color: var(--kh-ink); cursor: pointer; transition: all .15s; white-space: nowrap; }
  .kh-btn:hover { border-color: var(--kh-accent); color: var(--kh-accent-ink); }
  .kh-btn.kh-primary { background: var(--kh-accent); border-color: transparent; color: #fff; }
  .kh-btn.kh-primary:hover { filter: brightness(1.08); color: #fff; }
  .kh-btn[disabled] { opacity: .4; cursor: not-allowed; }
  .kh-text { font-size: 12.5px; line-height: 1.65; color: var(--kh-ink); }
  .kh-text.kh-muted { color: var(--kh-muted); }
  .kh-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .kh-bar { height: 6px; border-radius: 999px; background: var(--kh-line); overflow: hidden; }
  .kh-bar > i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--kh-accent), #c084fc); }

  /* ===== 1. Thư viện giáo trình ===== */
  .kh-course { padding: 0; overflow: hidden; }
  .kh-course > summary { list-style: none; cursor: pointer; display: flex; align-items: center; gap: 14px; padding: 16px 18px; }
  .kh-course > summary::-webkit-details-marker { display: none; }
  .kh-course-no { font-family: var(--kh-serif); font-size: 13px; font-weight: 700; width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; color: #fff; flex-shrink: 0; }
  .kh-course-title { font-family: var(--kh-serif); font-size: 17px; font-weight: 600; color: var(--kh-ink); }
  .kh-course-meta { font-size: 11px; color: var(--kh-muted); margin-top: 2px; }
  .kh-course-progress { margin-left: auto; width: 180px; flex-shrink: 0; }
  .kh-course-progress small { display: flex; justify-content: space-between; font-size: 10.5px; color: var(--kh-muted); margin-bottom: 4px; }
  .kh-course .kh-caret { color: var(--kh-faint); transition: transform .2s; }
  .kh-course[open] .kh-caret { transform: rotate(90deg); }
  .kh-lessons { border-top: 1px solid var(--kh-line); }
  .kh-lesson { display: grid; grid-template-columns: 34px 96px 1fr auto; gap: 14px; align-items: start; padding: 14px 18px; border-bottom: 1px solid var(--kh-line); }
  .kh-lesson:last-child { border-bottom: 0; }
  .kh-lesson-no { font-family: var(--kh-serif); font-size: 15px; font-weight: 600; color: var(--kh-faint); padding-top: 2px; }
  .kh-thumb { width: 96px; aspect-ratio: 16/10; border-radius: 9px; background: var(--kh-accent-soft) center/cover no-repeat; display: grid; place-items: center; color: var(--kh-accent-ink); border: 1px solid var(--kh-line); cursor: pointer; overflow: hidden; }
  .kh-lesson-title { font-size: 13.5px; font-weight: 650; color: var(--kh-ink); line-height: 1.35; }
  .kh-lesson-res { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
  .kh-lesson-actions { display: grid; grid-template-columns: repeat(2, minmax(0, auto)); gap: 6px; align-content: start; }
  .kh-lesson-actions .kh-btn { justify-content: center; }

  /* ===== 2. Ngân hàng đề thi ===== */
  .kh-exam-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
  .kh-exam { position: relative; padding: 18px 18px 14px; overflow: hidden; }
  .kh-exam::before { content: ''; position: absolute; inset: 0 0 auto 0; height: 4px; background: repeating-linear-gradient(90deg, var(--kh-accent) 0 14px, transparent 14px 20px); opacity: .55; }
  .kh-exam-label { font-size: 10px; font-weight: 700; letter-spacing: .14em; color: var(--kh-faint); text-transform: uppercase; }
  .kh-exam-title { font: 600 13px 'Fira Code', monospace; color: var(--kh-ink); margin: 6px 0 10px; word-break: break-word; }
  .kh-exam-foot { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--kh-line); }

  /* ===== 3. Case study ===== */
  .kh-day-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 10px; }
  .kh-day-head h3 { font-family: var(--kh-serif); font-size: 20px; font-weight: 600; color: var(--kh-ink); }
  .kh-sessions { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
  .kh-session-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: var(--kh-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: .06em; }
  .kh-case { padding: 16px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
  .kh-case-top { display: flex; gap: 10px; align-items: flex-start; }
  .kh-case-no { font-family: var(--kh-serif); font-weight: 700; font-size: 13px; color: var(--kh-accent-ink); background: var(--kh-accent-soft); border-radius: 9px; min-width: 34px; height: 34px; display: grid; place-items: center; flex-shrink: 0; }
  .kh-case-title { font-size: 13px; font-weight: 650; color: var(--kh-ink); line-height: 1.35; }
  .kh-case-q { border-left: 3px solid var(--kh-gold); background: var(--kh-gold-soft); border-radius: 0 10px 10px 0; padding: 10px 12px; }
  .kh-case-a { display: none; border-left: 3px solid var(--kh-ok); background: var(--kh-ok-soft); border-radius: 0 10px 10px 0; padding: 10px 12px; }
  .kh-case.kh-revealed .kh-case-a { display: block; }
  .kh-case .kh-hide-when-open { display: inline-flex; }
  .kh-case.kh-revealed .kh-hide-when-open { display: none; }
  .kh-case .kh-show-when-open { display: none; }
  .kh-case.kh-revealed .kh-show-when-open { display: inline-flex; }

  /* ===== 4. Sổ tay bài tập ===== */
  .kh-branch-head { display: flex; align-items: center; gap: 10px; margin: 6px 0 10px; }
  .kh-branch-head h3 { font-family: var(--kh-serif); font-size: 20px; font-weight: 600; color: var(--kh-ink); }
  .kh-session { padding: 0; overflow: hidden; margin-bottom: 12px; }
  .kh-session > summary { list-style: none; cursor: pointer; display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
  .kh-session > summary::-webkit-details-marker { display: none; }
  .kh-session-code { font: 700 11px 'Fira Code', monospace; color: var(--kh-accent-ink); background: var(--kh-accent-soft); padding: 4px 8px; border-radius: 8px; flex-shrink: 0; }
  .kh-session-title { font-size: 14px; font-weight: 650; color: var(--kh-ink); }
  .kh-session[open] .kh-caret { transform: rotate(90deg); }
  .kh-session .kh-caret { color: var(--kh-faint); transition: transform .2s; margin-left: auto; }
  .kh-ex { border-top: 1px solid var(--kh-line); padding: 14px 16px 16px 16px; display: grid; gap: 10px; }
  .kh-ex-head { display: flex; align-items: flex-start; gap: 10px; }
  .kh-ex-title { font-size: 13px; font-weight: 650; color: var(--kh-ink); line-height: 1.35; }
  .kh-ex-block { border-radius: 10px; padding: 10px 12px; background: var(--kh-paper); border: 1px solid var(--kh-line); }
  .kh-ex-block h5 { font-size: 10.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--kh-muted); margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
  .kh-ex-block.kh-criteria { background: var(--kh-ok-soft); border-color: transparent; }
  .kh-ex-block.kh-criteria h5 { color: var(--kh-ok); }
  details.kh-ex-guide > summary { cursor: pointer; list-style: none; font-size: 11.5px; font-weight: 650; color: var(--kh-accent-ink); display: inline-flex; align-items: center; gap: 6px; }
  details.kh-ex-guide > summary::-webkit-details-marker { display: none; }
  details.kh-ex-guide[open] > summary .kh-caret { transform: rotate(90deg); }

  /* Điện thoại: panel mục lục thành ngăn kéo, mở bằng nút "Mục lục" */
  .kh-toc-toggle { display: none; }
  @media (max-width: 767px) {
    html.kh-academic #hub-sidebar { position: fixed !important; top: 0; bottom: 0; left: 0; width: min(300px, 86vw) !important; z-index: 70; transform: translateX(-105%); transition: transform .25s ease; background: var(--kh-card-solid) !important; box-shadow: var(--kh-shadow); }
    html.kh-toc-open #hub-sidebar { transform: none; }
    html.kh-toc-open body::after { content: ''; position: fixed; inset: 0; background: rgba(10,10,25,.35); z-index: 65; }
    .kh-toc-toggle { display: inline-flex; }
    html.kh-academic #local-search-wrapper, html.kh-academic #view-mode-split span { display: none !important; }
    html.kh-academic main > header { padding-left: 10px !important; padding-right: 10px !important; }
  }
  @media (max-width: 900px) {
    .kh-lesson { grid-template-columns: 26px 1fr; }
    .kh-lesson .kh-thumb { display: none; }
    .kh-lesson-actions { grid-column: 2; flex-direction: row; flex-wrap: wrap; }
    .kh-course-progress { display: none; }
  }`;
  if (!document.getElementById('kh-academic-css')) {
    const st = document.createElement('style');
    st.id = 'kh-academic-css';
    st.textContent = css;
    document.head.appendChild(st);
  }

  // ---------- Tiện ích ----------
  const esc = (s) => (typeof window.escapeHtml === 'function' ? window.escapeHtml(s) : String(s == null ? '' : s));
  const arg = (s) => window.jsArg(s);
  const isUrl = (v) => /^https?:\/\//i.test(String(v || '').trim());
  const val = (item, keys) => { for (const k of keys) { const v = item[k]; if (v !== undefined && String(v).trim() !== '') return String(v).trim(); } return ''; };

  // Văn bản nhiều dòng: escape, giữ xuống dòng, tách các bước "1. 2. 3." thành dòng riêng
  function fmt(text) {
    let s = esc(String(text || '').trim());
    if (!s) return '';
    if (s.indexOf('\n') === -1) s = s.replace(/\s(\d{1,2}[.)]\s)/g, '\n$1');
    return s.replace(/\n{2,}/g, '\n').replace(/\n/g, '<br>');
  }

  const DOMAIN_COLORS = [
    [/retail|bán lẻ/i, '#2563eb', 'fa-shop', 'Retail'], [/fnb|f&b|nhà hàng/i, '#ea7a12', 'fa-utensils', 'FNB'],
    [/salon|spa/i, '#db2777', 'fa-spa', 'Salon'], [/hotel|khách sạn/i, '#0d9488', 'fa-hotel', 'Hotel'],
    [/kế toán|thuế|tax/i, '#7c3aed', 'fa-file-invoice-dollar', 'Kế toán']
  ];
  function domainOf(name) {
    const hit = DOMAIN_COLORS.find(d => d[0].test(String(name || '')));
    return hit ? { color: hit[1], icon: hit[2], label: hit[3] } : { color: '#5a48d8', icon: 'fa-graduation-cap', label: 'Chung & Khác' };
  }

  function groupBy(list, keyFn) {
    const map = new Map();
    list.forEach(it => { const k = keyFn(it) || 'Chưa phân loại'; if (!map.has(k)) map.set(k, []); map.get(k).push(it); });
    return map;
  }

  function intro(eyebrow, title, lead, stats) {
    return `<div class="kh-intro">
      <div><div class="kh-eyebrow">${eyebrow}</div><h2 class="kh-h1">${title}</h2><p class="kh-lead">${lead}</p></div>
      <div class="kh-stats">${stats.map(s => `<div class="kh-stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}</div>
    </div>`;
  }

  function prepContainer(container) {
    container.className = 'kh-wrap';
  }

  // ---------- Mục lục bên trái ----------
  const TYPE_META = {
    elearning: { label: 'Thư viện giáo trình', icon: 'fa-book-open', color: '#5a48d8' },
    mcq: { label: 'Ngân hàng đề thi', icon: 'fa-file-pen', color: '#0d8a5f' },
    scenario: { label: 'Case study tình huống', icon: 'fa-comments', color: '#c27b12' },
    exercise: { label: 'Sổ tay bài tập', icon: 'fa-screwdriver-wrench', color: '#db2777' }
  };

  window.renderDynamicSidebar = function () {
    const tree = document.getElementById('sidebar-dynamic-tree');
    if (!tree) return;
    let html = '';
    (AppState.sheetList || []).forEach(sheetName => {
      const meta = AppState.sheetsData[sheetName] || { items: [] };
      const type = typeof detectSheetType === 'function' ? detectSheetType(sheetName) : 'elearning';
      const t = TYPE_META[type] || TYPE_META.elearning;
      const count = (meta.items || []).length;
      const active = AppState.currentSheet === sheetName && AppState.activeTabId !== 'tab-home';
      html += `<button onclick="selectSheet(${arg(sheetName)})" class="kh-toc-item ${active ? 'kh-active' : ''}" title="${esc(sheetName)}">
        <span class="kh-toc-icon" style="background:${t.color}1a;color:${t.color}"><i class="fa-solid ${t.icon}"></i></span>
        <span class="min-w-0"><span class="kh-toc-title block truncate">${esc(t.label)}</span><span class="kh-toc-sub block truncate">${esc(sheetName)}</span></span>
        <span class="kh-toc-count">${count}</span>
      </button>`;
    });
    tree.innerHTML = html;
    const home = document.getElementById('sidebar-btn-home');
    if (home) home.classList.toggle('kh-home-active', AppState.activeTabId === 'tab-home');
  };
  // Đồng bộ trạng thái "đang chọn" khi đổi tab
  ['updateSidebarHighlight', 'activateTab'].forEach(fn => {
    const orig = window[fn];
    if (typeof orig !== 'function') return;
    window[fn] = function () { const r = orig.apply(this, arguments); try { window.renderDynamicSidebar(); } catch (e) {} return r; };
  });

  // Chữ trong khối đầu panel: "MASTER HUB" -> tên thư viện
  function retitlePanel() {
    const h1 = document.querySelector('#hub-sidebar h1');
    if (h1) h1.textContent = 'Thư viện học liệu';
    const sub = h1 && h1.nextElementSibling;
    if (sub) sub.textContent = 'Kho tri thức sản phẩm E-Learning';
    const tocLabel = document.querySelector('#sidebar-dynamic-tree') && document.querySelector('#sidebar-dynamic-tree').previousElementSibling;
    if (tocLabel) { const p = tocLabel.querySelector('p'); if (p) p.textContent = 'Mục lục học liệu'; }
    const homeLabel = document.querySelector('#sidebar-btn-home span span');
    if (homeLabel) homeLabel.textContent = 'Tổng quan thư viện';
    // Nút mở mục lục trên điện thoại
    const headerLeft = document.querySelector('main > header > div');
    if (headerLeft && !document.getElementById('kh-toc-toggle')) {
      const btn = document.createElement('button');
      btn.id = 'kh-toc-toggle';
      btn.className = 'kh-toc-toggle kh-btn';
      btn.type = 'button';
      btn.innerHTML = '<i class="fa-solid fa-book-open"></i>Mục lục';
      btn.addEventListener('click', (e) => { e.stopPropagation(); doc.classList.toggle('kh-toc-open'); });
      headerLeft.insertBefore(btn, headerLeft.firstChild);
      document.addEventListener('click', (e) => {
        if (!doc.classList.contains('kh-toc-open')) return;
        const panel = document.getElementById('hub-sidebar');
        if (panel && !panel.contains(e.target)) doc.classList.remove('kh-toc-open');
      });
      // Chọn mục xong thì đóng ngăn kéo
      document.getElementById('hub-sidebar').addEventListener('click', (e) => {
        if (e.target.closest('.kh-toc-item, #sidebar-btn-home')) setTimeout(() => doc.classList.remove('kh-toc-open'), 150);
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', retitlePanel); else retitlePanel();

  // ---------- 1. THƯ VIỆN GIÁO TRÌNH ----------
  window.renderElearningCards = function (data, container) {
    prepContainer(container);
    const sheet = AppState.currentSheet;
    const courses = groupBy(data, it => val(it, ['Khóa học', 'Khóa']));
    const has = (it, k) => isUrl(it[k]);
    const total = data.length;
    const vid = data.filter(it => has(it, 'YouTube')).length;
    const quiz = data.filter(it => has(it, 'Github')).length;
    const full = data.filter(it => has(it, 'YouTube') && has(it, 'Github') && has(it, 'HDSD')).length;

    let html = intro('Thư viện giáo trình', 'Giáo trình sản phẩm KiotViet',
      'Mỗi khóa là một chương; mỗi bài có đủ 4 loại học liệu: Hướng dẫn sử dụng, Infographic, Video và Quiz. Huy hiệu viền đứt là học liệu còn thiếu.',
      [[courses.size, 'khóa học'], [total, 'bài học'], [Math.round(vid / Math.max(1, total) * 100) + '%', 'có video'], [Math.round(quiz / Math.max(1, total) * 100) + '%', 'có quiz']]);

    let courseNo = 0;
    courses.forEach((lessons, course) => {
      courseNo++;
      const d = domainOf(course);
      const done = lessons.filter(it => has(it, 'YouTube') && has(it, 'Github') && has(it, 'HDSD')).length;
      const pct = Math.round(done / Math.max(1, lessons.length) * 100);
      const missV = lessons.filter(it => !has(it, 'YouTube')).length, missQ = lessons.filter(it => !has(it, 'Github')).length;
      html += `<details class="kh-card kh-course" ${courses.size <= 3 || courseNo === 1 ? 'open' : ''}>
        <summary>
          <span class="kh-course-no" style="background:${d.color}">${String(courseNo).padStart(2, '0')}</span>
          <span class="min-w-0"><span class="kh-course-title block">${esc(course)}</span>
            <span class="kh-course-meta block">${lessons.length} bài học${missV ? ` • <span style="color:var(--kh-miss)">${missV} thiếu video</span>` : ''}${missQ ? ` • <span style="color:var(--kh-miss)">${missQ} thiếu quiz</span>` : ''}</span></span>
          <span class="kh-course-progress"><small><span>Học liệu đầy đủ</span><b>${pct}%</b></small><span class="kh-bar block"><i style="width:${pct}%"></i></span></span>
          <i class="fa-solid fa-chevron-right kh-caret text-xs"></i>
        </summary>
        <div class="kh-lessons">`;
      lessons.forEach((it, idx) => {
        const title = val(it, ['Nội dung', 'Tên bài', 'Title']) || 'Bài học chưa đặt tên';
        const desc = val(it, ['Mô tả', 'Description']);
        const yt = val(it, ['YouTube']), gh = val(it, ['Github']), hdsd = val(it, ['HDSD']), info = val(it, ['Infographic']);
        const ytId = (typeof extractYouTubeId === 'function' && isUrl(yt)) ? extractYouTubeId(yt) : '';
        const thumbUrl = ytId ? `https://i.ytimg.com/vi/${encodeURIComponent(ytId)}/mqdefault.jpg` : (isUrl(info) ? info : '');
        const thumbClick = ytId ? `openInSplitMode(${arg(formatUniversalEmbedUrl(yt))}, ${arg(title)})` : (isUrl(info) ? `openLightboxModal(${arg(info)}, ${arg(title)})` : '');
        const chip = (ok, okLabel, missLabel, icon) => `<span class="kh-chip ${ok ? 'kh-ok' : 'kh-miss'}"><i class="fa-solid ${ok ? icon : 'fa-circle-exclamation'}"></i>${ok ? okLabel : missLabel}</span>`;
        html += `<div class="kh-lesson">
          <div class="kh-lesson-no">${idx + 1}</div>
          <div class="kh-thumb" ${thumbClick ? `onclick="${thumbClick}"` : ''} ${thumbUrl ? `style="background-image:url('${esc(thumbUrl)}')"` : ''}>${thumbUrl ? '' : '<i class="fa-solid fa-book-open"></i>'}</div>
          <div class="min-w-0">
            <div class="kh-lesson-title">${esc(title)}</div>
            ${desc ? `<div class="kh-text kh-muted kh-clamp-2" title="${esc(desc)}">${esc(desc)}</div>` : ''}
            <div class="kh-lesson-res">
              ${chip(isUrl(hdsd), 'HDSD', 'Thiếu HDSD', 'fa-book')}
              ${chip(isUrl(info), 'Infographic', 'Thiếu infographic', 'fa-image')}
              ${chip(isUrl(yt), 'Video', 'Thiếu video', 'fa-circle-play')}
              ${chip(isUrl(gh), 'Quiz', 'Thiếu quiz', 'fa-circle-question')}
            </div>
          </div>
          <div class="kh-lesson-actions">
            ${isUrl(yt) ? `<button class="kh-btn kh-primary" onclick="openInSplitMode(${arg(formatUniversalEmbedUrl(yt))}, ${arg(title)})"><i class="fa-solid fa-play"></i>Học video</button>` : ''}
            ${isUrl(gh) ? `<button class="kh-btn" onclick="openInSplitMode(${arg(formatUniversalEmbedUrl(gh))}, ${arg('Quiz: ' + title)})"><i class="fa-solid fa-circle-question"></i>Làm quiz</button>` : ''}
            ${isUrl(hdsd) ? `<button class="kh-btn" onclick="openResource(${arg(hdsd)}, ${arg(title)}, ${arg(sheet)})"><i class="fa-solid fa-book"></i>Đọc HDSD</button>` : ''}
            ${isUrl(info) ? `<button class="kh-btn" onclick="openLightboxModal(${arg(info)}, ${arg(title)})"><i class="fa-solid fa-image"></i>Infographic</button>` : ''}
          </div>
        </div>`;
      });
      html += `</div></details>`;
    });
    container.innerHTML = html;
    // Ảnh thu nhỏ chỉ tải khi mở chương (tránh tải hàng trăm ảnh cùng lúc)
    container.querySelectorAll('details.kh-course:not([open]) .kh-thumb[style]').forEach(t => { t.dataset.bg = t.style.backgroundImage; t.style.backgroundImage = ''; });
    container.querySelectorAll('details.kh-course').forEach(dt => dt.addEventListener('toggle', () => {
      if (dt.open) dt.querySelectorAll('.kh-thumb[data-bg]').forEach(t => { t.style.backgroundImage = t.dataset.bg; delete t.dataset.bg; });
    }));
  };

  // ---------- 2. NGÂN HÀNG ĐỀ THI ----------
  window.renderMcqCards = function (data, container) {
    prepContainer(container);
    const sheet = AppState.currentSheet;
    // Nhóm theo ngành nhận diện từ tên khóa ("CB1 Retail", "Retail TK1A" -> Retail); mỗi thẻ vẫn ghi tên khóa
    const courseOf = it => val(it, ['Khóa', 'Khóa học']);
    const groups = groupBy(data, it => domainOf(courseOf(it)).label);
    const courses = new Set(data.map(courseOf).filter(Boolean));
    const types = new Set(data.map(it => val(it, ['Loại câu hỏi'])).filter(Boolean));
    let html = intro('Ngân hàng đề thi', 'Đề kiểm tra trắc nghiệm', 'Các bộ đề MCQ theo ngành và khóa đào tạo. Mở đề để làm thử ngay bên cạnh, hoặc sao chép link gửi học viên.',
      [[data.length, 'bộ đề'], [courses.size, 'khóa'], [types.size, 'loại câu hỏi']]);
    groups.forEach((exams, branch) => {
      const d = domainOf(branch);
      html += `<section><div class="kh-day-head"><span class="kh-toc-icon" style="background:${d.color}1a;color:${d.color}"><i class="fa-solid ${d.icon}"></i></span><h3>${esc(branch)}</h3><span class="kh-text kh-muted">${exams.length} bộ đề</span></div><div class="kh-exam-grid">`;
      exams.forEach(it => {
        const course = courseOf(it) || branch;
        const name = val(it, ['Tên bộ đề', 'Title']) || 'Bộ đề';
        const kind = val(it, ['Loại câu hỏi']);
        const link = val(it, ['Link làm bài']);
        const edit = val(it, ['Link edit (Nếu có)', 'Link edit']);
        html += `<article class="kh-card kh-exam">
          <div class="kh-exam-label">Đề thi • ${esc(course)}</div>
          <div class="kh-exam-title">${esc(name)}</div>
          <div class="flex gap-2 flex-wrap">
            ${kind ? `<span class="kh-chip kh-accent"><i class="fa-solid fa-list-check"></i>${esc(kind)}</span>` : ''}
            ${link && !isUrl(link) ? `<span class="kh-chip"><i class="fa-solid fa-building-columns"></i>${esc(link)}</span>` : ''}
          </div>
          <div class="kh-exam-foot">
            ${isUrl(link) ? `<button class="kh-btn kh-primary" onclick="openInSplitMode(${arg(formatUniversalEmbedUrl(link))}, ${arg('Đề thi: ' + name)})"><i class="fa-solid fa-pen-to-square"></i>Làm bài</button>
              <button class="kh-btn" onclick="copyTextToClipboard(${arg(link)}, ${arg('Đã sao chép link làm bài thi!')})"><i class="fa-regular fa-copy"></i>Sao chép link</button>` : `<span class="kh-text kh-muted" style="font-size:11px">Làm bài trên ${esc(link || 'LMS')}</span>`}
            ${isUrl(edit) ? `<button class="kh-btn" onclick="openResource(${arg(edit)}, ${arg('Chỉnh sửa: ' + name)}, ${arg(sheet)})"><i class="fa-solid fa-gear"></i>Sửa đề</button>` : ''}
          </div>
        </article>`;
      });
      html += `</div></section>`;
    });
    container.innerHTML = html;
  };

  // ---------- 3. CASE STUDY ----------
  const SESSION_LABEL = { morning: ['Buổi sáng', 'fa-sun'], afternoon: ['Buổi chiều', 'fa-cloud-sun'] };
  window.khToggleCase = function (btn) { const c = btn.closest('.kh-case'); if (c) c.classList.toggle('kh-revealed'); };

  window.renderScenarioCards = function (data, container) {
    prepContainer(container);
    const days = groupBy(data, it => val(it, ['Day']).toLowerCase());
    const roadmaps = new Set(data.map(it => val(it, ['Roadmap'])).filter(Boolean));
    let html = intro('Case study', 'Tình huống thực tế theo lộ trình', 'Đọc tình huống, tự đưa ra hướng xử lý rồi mới bấm “Xem gợi ý” — dùng để luyện tập hoặc đố học viên trong buổi đào tạo.',
      [[data.length, 'tình huống'], [days.size, 'ngày học'], [roadmaps.size, 'lộ trình']]);
    let globalNo = 0;
    [...days.keys()].sort().forEach(dayKey => {
      const items = days.get(dayKey);
      const dayNo = (dayKey.match(/\d+/) || [''])[0];
      html += `<section><div class="kh-day-head"><h3>${dayNo ? 'Ngày ' + esc(dayNo) : esc(dayKey)}</h3><span class="kh-text kh-muted">${items.length} tình huống</span></div><div class="kh-sessions">`;
      const sessions = groupBy(items, it => val(it, ['Type']).toLowerCase());
      ['morning', 'afternoon', ...[...sessions.keys()].filter(k => k !== 'morning' && k !== 'afternoon')].forEach(sk => {
        if (!sessions.has(sk)) return;
        const lab = SESSION_LABEL[sk] || [sk, 'fa-clock'];
        html += `<div><div class="kh-session-label"><i class="fa-solid ${lab[1]}"></i>${esc(lab[0])}</div>`;
        sessions.get(sk).forEach(it => {
          globalNo++;
          const rawTitle = val(it, ['Title']) || 'Tình huống';
          const m = rawTitle.match(/^\s*Tình huống\s*(\d+)\s*[-–:]\s*(.*)$/i);
          const no = m ? m[1] : String(globalNo).padStart(2, '0');
          const title = m ? m[2] : rawTitle;
          const q = val(it, ['Question']), a = val(it, ['Answer']), rm = val(it, ['Roadmap']);
          html += `<article class="kh-card kh-case">
            <div class="kh-case-top"><span class="kh-case-no">${esc(no)}</span>
              <div class="min-w-0"><div class="kh-case-title">${esc(title)}</div>${rm ? `<div class="mt-1"><span class="kh-chip kh-gold"><i class="fa-solid fa-route"></i>${esc(rm)}</span></div>` : ''}</div></div>
            <div class="kh-case-q"><div class="kh-text">${fmt(q)}</div></div>
            <div class="kh-case-a"><div class="kh-eyebrow" style="color:var(--kh-ok);margin-bottom:4px">Gợi ý xử lý</div><div class="kh-text">${fmt(a)}</div></div>
            <div class="flex gap-2 flex-wrap">
              <button class="kh-btn kh-primary kh-hide-when-open" onclick="khToggleCase(this)"><i class="fa-solid fa-lightbulb"></i>Xem gợi ý</button>
              <button class="kh-btn kh-show-when-open" onclick="khToggleCase(this)"><i class="fa-solid fa-eye-slash"></i>Ẩn gợi ý</button>
              <button class="kh-btn" onclick="copyScenarioText(${arg(rawTitle)}, ${arg(q)}, ${arg(a)})"><i class="fa-regular fa-copy"></i>Sao chép</button>
            </div>
          </article>`;
        });
        html += `</div>`;
      });
      html += `</div></section>`;
    });
    container.innerHTML = html;
  };

  // ---------- 4. SỔ TAY BÀI TẬP ----------
  window.renderExerciseCards = function (data, container) {
    prepContainer(container);
    const branches = groupBy(data, it => val(it, ['NganhHang']));
    const sessionsAll = new Set(data.map(it => val(it, ['NganhHang']) + '|' + val(it, ['MaBuoi'])));
    let html = intro('Sổ tay bài tập', 'Bài tập thực hành trên phần mềm', 'Mỗi buổi gồm các bài tập có yêu cầu, hướng dẫn từng bước và tiêu chí xác nhận để Trainer chấm hoàn thành.',
      [[data.length, 'bài tập'], [sessionsAll.size, 'buổi học'], [branches.size, 'ngành hàng']]);
    branches.forEach((items, branch) => {
      const d = domainOf(branch);
      html += `<section><div class="kh-branch-head"><span class="kh-toc-icon" style="background:${d.color}1a;color:${d.color}"><i class="fa-solid ${d.icon}"></i></span><h3>Ngành ${esc(branch)}</h3><span class="kh-text kh-muted">${items.length} bài tập</span></div>`;
      const sessions = groupBy(items, it => val(it, ['MaBuoi']));
      let sIdx = 0;
      sessions.forEach((exs, code) => {
        sIdx++;
        const sTitle = val(exs[0], ['TenBuoi']) || code;
        const sDesc = val(exs[0], ['MoTaBuoi']);
        const shortCode = (code.match(/session_(\w+)/i) || [null, code])[1].toUpperCase();
        html += `<details class="kh-card kh-session" ${sIdx === 1 && branches.size <= 2 ? 'open' : ''}>
          <summary><span class="kh-session-code">Buổi ${esc(shortCode)}</span><span class="min-w-0"><span class="kh-session-title block">${esc(sTitle)}</span>${sDesc ? `<span class="kh-text kh-muted block">${esc(sDesc)}</span>` : ''}</span>
            <span class="kh-chip">${exs.length} bài</span><i class="fa-solid fa-chevron-right kh-caret text-xs"></i></summary>`;
        exs.forEach(it => {
          const ma = val(it, ['Mã']), nhom = val(it, ['NhomBaiTap']);
          const yc = val(it, ['YeuCau']), hd = val(it, ['HuongDan']), xn = val(it, ['XacNhan']), lt = val(it, ['LyThuyet']);
          html += `<div class="kh-ex">
            <div class="kh-ex-head">${ma ? `<span class="kh-chip kh-accent">${esc(ma)}</span>` : ''}<div class="kh-ex-title">${esc(nhom || 'Bài tập')}</div>
              <button class="kh-btn" style="margin-left:auto" onclick="copyExerciseText(${arg(ma)}, ${arg(nhom)}, ${arg(yc)}, ${arg(hd)}, ${arg(xn)})"><i class="fa-regular fa-copy"></i>Sao chép</button></div>
            ${lt ? `<div class="kh-ex-block"><h5><i class="fa-solid fa-book-bookmark"></i>Lý thuyết</h5><div class="kh-text">${fmt(lt)}</div></div>` : ''}
            ${yc ? `<div class="kh-ex-block"><h5><i class="fa-solid fa-bullseye"></i>Yêu cầu</h5><div class="kh-text">${fmt(yc)}</div></div>` : ''}
            ${hd ? `<details class="kh-ex-guide"><summary><i class="fa-solid fa-chevron-right kh-caret text-[10px]"></i>Hướng dẫn từng bước</summary><div class="kh-ex-block" style="margin-top:8px"><div class="kh-text">${fmt(hd)}</div></div></details>` : ''}
            ${xn ? `<div class="kh-ex-block kh-criteria"><h5><i class="fa-solid fa-circle-check"></i>Tiêu chí xác nhận</h5><div class="kh-text">${fmt(xn)}</div></div>` : ''}
          </div>`;
        });
        html += `</details>`;
      });
      html += `</section>`;
    });
    container.innerHTML = html;
  };

  // Mở thẳng từ Dashboard: knowledge-hub.html?sheet=...&course=...&gap=video|quiz
  (function openFromLink() {
    const p = new URLSearchParams(location.search);
    const sheet = p.get('sheet');
    if (!sheet) return;
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      const ready = (AppState.sheetList || []).indexOf(sheet) !== -1;
      if (!ready && tries < 60) return;
      clearInterval(timer);
      if (!ready) return;
      selectSheet(sheet);
      const gap = p.get('gap');
      if (gap === 'video' || gap === 'quiz') AppState.currentFilterGap = gap;
      const course = p.get('course');
      if (course) AppState.currentSubFilter = course;
      if (typeof renderDynamicSubFilters === 'function') renderDynamicSubFilters(sheet);
      if (typeof renderItems === 'function') renderItems();
    }, 500);
  })();

  // Vẽ lại nếu dữ liệu đã có sẵn trước khi module nạp xong
  try {
    if (window.AppState && (AppState.sheetList || []).length) {
      window.renderDynamicSidebar();
      if (AppState.currentSheet && AppState.activeTabId !== 'tab-home' && typeof renderItems === 'function') renderItems();
    }
  } catch (e) {}
})();
