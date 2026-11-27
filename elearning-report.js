/**
 * THẺ "SỨC KHỎE KHO HỌC LIỆU" TRÊN DASHBOARD (27/11/2026)
 * Đọc kho E-Learning (getHubApiUrl - Web App chỉ đọc), tính độ phủ video/quiz theo đúng công thức
 * của Master Data Hub (Sẵn sàng = trung bình % có video và % có quiz) và hiển thị ngay trên trang Tổng quan.
 * - Tự gắn trước hàng biểu đồ (#performanceChart) mỗi khi tab Tổng quan được vẽ lại (bọc switchTab).
 * - Lưu bản tóm tắt (vài KB) 60 phút để không tải lại ~700 KB mỗi lần mở Dashboard; có nút Làm mới.
 * - Bấm vào khóa thiếu học liệu -> mở thẳng danh sách đã lọc trong Master Data Hub.
 */
(function () {
  'use strict';
  const CACHE_KEY = 'kv_elearning_report_v2'; // v2: có ghép dữ liệu Cổng học tập
  const TTL_MS = 60 * 60 * 1000;
  const MOUNT_ID = 'elearning-health-card';

  const DOMAINS = [
    [/retail|bán lẻ/i, 'Retail', '#2563eb'], [/fnb|f&b|nhà hàng/i, 'FNB', '#ea7a12'],
    [/salon|spa/i, 'Salon', '#db2777'], [/hotel|khách sạn/i, 'Hotel', '#0d9488'],
    [/kế toán|thuế|tax/i, 'Kế toán', '#7c3aed']
  ];
  const domainOf = (name) => { const d = DOMAINS.find(x => x[0].test(String(name || ''))); return d ? { label: d[1], color: d[2] } : { label: 'Khác', color: '#64748b' }; };
  const isUrl = (v) => /^https?:\/\//i.test(String(v || '').trim());
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);

  // ---------- Tính bản tóm tắt từ dữ liệu kho ----------
  function summarize(data) {
    const sheets = data.sheets || {};
    const names = data.sheetList || Object.keys(sheets);
    const find = (re) => names.find(n => re.test(n));
    const lessonsSheet = find(/elearning|masterdata/i);
    const lessons = ((sheets[lessonsSheet] || {}).items || []).filter(it => String(it['Nội dung'] || it['Khóa học'] || '').trim());
    const count = (re) => { const n = find(re); return n ? ((sheets[n] || {}).items || []).length : 0; };

    const byDomain = {}, byCourse = {};
    let video = 0, quiz = 0;
    lessons.forEach(it => {
      const course = String(it['Khóa học'] || it['Khóa'] || 'Chưa phân loại').trim();
      const hasV = isUrl(it['YouTube']), hasQ = isUrl(it['Github']);
      if (hasV) video++;
      if (hasQ) quiz++;
      const d = domainOf(course);
      const D = byDomain[d.label] = byDomain[d.label] || { label: d.label, color: d.color, total: 0, video: 0, quiz: 0 };
      D.total++; if (hasV) D.video++; if (hasQ) D.quiz++;
      const C = byCourse[course] = byCourse[course] || { course, total: 0, missVideo: 0, missQuiz: 0 };
      C.total++; if (!hasV) C.missVideo++; if (!hasQ) C.missQuiz++;
    });
    const videoPct = pct(video, lessons.length), quizPct = pct(quiz, lessons.length);
    return {
      at: Date.now(),
      sheet: lessonsSheet || '',
      total: lessons.length,
      videoPct, quizPct,
      readiness: lessons.length ? Math.round(videoPct * 0.5 + quizPct * 0.5) : 0, // = công thức "Mức độ sẵn sàng" của Master Data Hub
      missVideo: lessons.length - video, missQuiz: lessons.length - quiz,
      courses: Object.keys(byCourse).length,
      mcq: count(/mcq|đề thi/i), cases: count(/tình huống|scenario/i), exercises: count(/exercise|bài tập/i),
      domains: Object.values(byDomain).map(D => ({ label: D.label, color: D.color, total: D.total, readiness: Math.round(pct(D.video, D.total) * 0.5 + pct(D.quiz, D.total) * 0.5) })),
      gaps: Object.values(byCourse).filter(C => C.missVideo + C.missQuiz > 0)
        .sort((a, b) => (b.missVideo + b.missQuiz) - (a.missVideo + a.missQuiz)).slice(0, 4)
    };
  }

  function readCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { return null; } }
  function writeCache(s) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch (e) {} }

  // Nạp module đồng bộ Cổng học tập (elearning-sync.js) khi cần, để số liệu khớp với Master Data Hub
  function ensureSync() {
    if (window.KhPortalSync) return Promise.resolve(window.KhPortalSync);
    return new Promise((resolve) => {
      const sc = document.createElement('script');
      sc.src = 'elearning-sync.js';
      sc.onload = () => resolve(window.KhPortalSync || null);
      sc.onerror = () => resolve(null);
      document.head.appendChild(sc);
    });
  }

  let inflight = null; // Dùng chung 1 lần tải khi tab được vẽ lại liên tục
  async function load(force) {
    const url = typeof window.getHubApiUrl === 'function' ? window.getHubApiUrl() : '';
    if (!url) throw new Error('Chưa cấu hình link kho E-Learning');
    const cached = readCache();
    if (!force && cached && cached.url === url && Date.now() - cached.at < TTL_MS) return cached;
    if (inflight) return inflight;
    inflight = (async () => {
      const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), 45000) : null;
      try {
        const res = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
        const data = await res.json();
        if (data.status !== 'success') throw new Error(data.message || 'Kho E-Learning không trả dữ liệu');
        // Ghép link mới nhất từ Cổng học tập (chỉ bài TRONG khóa học); lỗi Cổng thì vẫn dùng Sheet khóa học
        let portal = null;
        try { const sync = await ensureSync(); if (sync) portal = await sync.applyToDataset(data); } catch (e) { portal = null; }
        const s = summarize(data);
        s.url = url;
        if (portal) s.portal = { out: portal.outCourse, changed: portal.changed.length };
        writeCache(s);
        return s;
      } catch (e) {
        throw new Error(e && e.name === 'AbortError' ? 'Kho E-Learning không phản hồi sau 45 giây' : (e && e.message) || 'Lỗi kết nối');
      } finally {
        if (timer) clearTimeout(timer);
        inflight = null;
      }
    })();
    return inflight;
  }

  // ---------- Giao diện ----------
  const css = `
  #${MOUNT_ID} { --er-card: var(--aurora-glass-bg, #fff); --er-line: rgba(30,27,60,.09); --er-ink: #1d1b30; --er-muted: #6b6883; --er-accent: #5a48d8; --er-soft: rgba(90,72,216,.08); --er-miss: #b4233f;
    background: var(--er-card); border: 1px solid var(--aurora-glass-border, #e2e8f0); border-radius: 18px; box-shadow: var(--aurora-glass-shadow, 0 1px 3px rgba(0,0,0,.05)); padding: 20px 22px; margin-bottom: 24px; backdrop-filter: blur(18px); color: var(--er-ink); }
  html[data-aurora="dark"] #${MOUNT_ID} { --er-line: rgba(255,255,255,.08); --er-ink: #ecebf7; --er-muted: #a6a3bd; --er-accent: #a99cff; --er-soft: rgba(169,156,255,.12); --er-miss: #ff8aa0; }
  #${MOUNT_ID} .er-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  #${MOUNT_ID} .er-eyebrow { font-size: 10.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--er-accent); }
  #${MOUNT_ID} .er-title { font-family: 'Fraunces', Georgia, serif; font-size: 18px; font-weight: 600; margin-top: 2px; }
  #${MOUNT_ID} .er-sub { font-size: 11.5px; color: var(--er-muted); margin-top: 2px; }
  #${MOUNT_ID} .er-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 650; padding: 6px 11px; border-radius: 10px; border: 1px solid var(--er-line); background: transparent; color: var(--er-ink); cursor: pointer; text-decoration: none; }
  #${MOUNT_ID} .er-btn:hover { border-color: var(--er-accent); color: var(--er-accent); }
  #${MOUNT_ID} .er-btn.er-primary { background: var(--er-accent); color: #fff; border-color: transparent; }
  #${MOUNT_ID} .er-grid { display: grid; grid-template-columns: 1.1fr 1fr 1fr; gap: 20px; margin-top: 16px; }
  #${MOUNT_ID} .er-kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  #${MOUNT_ID} .er-kpi { border: 1px solid var(--er-line); border-radius: 14px; padding: 10px 12px; }
  #${MOUNT_ID} .er-kpi b { font-family: 'Fraunces', Georgia, serif; font-size: 22px; display: block; line-height: 1.1; }
  #${MOUNT_ID} .er-kpi span { font-size: 10.5px; color: var(--er-muted); }
  #${MOUNT_ID} h4 { font-size: 10.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--er-muted); margin-bottom: 8px; }
  #${MOUNT_ID} .er-row { display: grid; grid-template-columns: 64px 1fr 40px; align-items: center; gap: 8px; font-size: 11.5px; margin-bottom: 7px; }
  #${MOUNT_ID} .er-bar { height: 7px; border-radius: 999px; background: var(--er-line); overflow: hidden; }
  #${MOUNT_ID} .er-bar i { display: block; height: 100%; border-radius: inherit; }
  #${MOUNT_ID} .er-gap { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 10px; border-radius: 10px; border: 1px solid var(--er-line); margin-bottom: 6px; font-size: 11.5px; color: var(--er-ink); text-decoration: none; }
  #${MOUNT_ID} .er-gap:hover { border-color: var(--er-accent); }
  #${MOUNT_ID} .er-gap small { color: var(--er-miss); font-weight: 600; white-space: nowrap; }
  #${MOUNT_ID} .er-note { font-size: 11.5px; color: var(--er-muted); }
  @media (max-width: 1024px) { #${MOUNT_ID} .er-grid { grid-template-columns: 1fr; } }`;
  function ensureCss() {
    if (document.getElementById('er-css')) return;
    const st = document.createElement('style'); st.id = 'er-css'; st.textContent = css; document.head.appendChild(st);
    if (!document.getElementById('kh-font')) {
      const l = document.createElement('link'); l.id = 'kh-font'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap';
      document.head.appendChild(l);
    }
  }

  const hubLink = (params) => 'knowledge-hub.html' + (params ? '?' + new URLSearchParams(params).toString() : '');

  function render(card, s, err) {
    if (err) {
      card.innerHTML = `<div class="er-head"><div><div class="er-eyebrow">Thư viện học liệu</div><div class="er-title">Sức khỏe kho học liệu E-Learning</div>
        <div class="er-sub" style="color:var(--er-miss)">Chưa tải được dữ liệu: ${esc(err)}</div></div>
        <div style="display:flex;gap:8px"><button class="er-btn" data-er-refresh><i class="fas fa-rotate"></i>Thử lại</button><a class="er-btn" href="${hubLink()}">Mở thư viện</a></div></div>`;
      return;
    }
    const time = new Date(s.at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    card.innerHTML = `
      <div class="er-head">
        <div><div class="er-eyebrow">Thư viện học liệu</div><div class="er-title">Sức khỏe kho học liệu E-Learning</div>
          <div class="er-sub">${s.total} bài trong khóa học • ${s.courses} khóa • cập nhật ${esc(time)}${s.portal ? ` • đồng bộ Cổng học tập: ${s.portal.changed} bài cập nhật, ${s.portal.out} tính năng ngoài khóa` : ''}</div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="er-btn" data-er-refresh title="Tải lại số liệu từ kho"><i class="fas fa-rotate"></i>Làm mới</button>
          <a class="er-btn er-primary" href="${hubLink()}"><i class="fas fa-book-open"></i>Mở thư viện</a>
        </div>
      </div>
      <div class="er-grid">
        <div class="er-kpis">
          <div class="er-kpi"><b>${s.readiness}<span style="font-size:12px">/100</span></b><span>Mức sẵn sàng</span></div>
          <div class="er-kpi"><b>${s.videoPct}%</b><span>Bài có video (${s.missVideo} thiếu)</span></div>
          <div class="er-kpi"><b>${s.quizPct}%</b><span>Bài có quiz (${s.missQuiz} thiếu)</span></div>
          <div class="er-kpi"><b>${s.mcq + s.cases + s.exercises}</b><span>${s.mcq} đề • ${s.cases} tình huống • ${s.exercises} bài tập</span></div>
        </div>
        <div><h4>Mức sẵn sàng theo ngành</h4>
          ${s.domains.map(d => `<div class="er-row"><span>${esc(d.label)}</span><span class="er-bar"><i style="width:${d.readiness}%;background:${d.color}"></i></span><b style="text-align:right">${d.readiness}%</b></div>`).join('') || '<div class="er-note">Chưa có dữ liệu</div>'}
        </div>
        <div><h4>Khóa cần bổ sung học liệu</h4>
          ${s.gaps.length ? s.gaps.map(g => `<a class="er-gap" href="${hubLink({ sheet: s.sheet, course: g.course, gap: g.missVideo >= g.missQuiz ? 'video' : 'quiz' })}" title="Mở danh sách bài còn thiếu trong Master Data Hub">
              <span>${esc(g.course)}</span><small>${g.missVideo ? g.missVideo + ' thiếu video' : ''}${g.missVideo && g.missQuiz ? ' • ' : ''}${g.missQuiz ? g.missQuiz + ' thiếu quiz' : ''}</small></a>`).join('')
            : '<div class="er-note">🎉 Tất cả khóa đã đủ video và quiz.</div>'}
        </div>
      </div>`;
  }

  async function mount(force) {
    const chart = document.getElementById('performanceChart');
    if (!chart) return;
    let row = chart.closest('.grid');
    while (row && row.parentElement && row.parentElement.closest('.grid')) row = row.parentElement.closest('.grid');
    if (!row || !row.parentElement) return;
    ensureCss();
    let card = document.getElementById(MOUNT_ID);
    if (!card) {
      card = document.createElement('section');
      card.id = MOUNT_ID;
      card.innerHTML = '<div class="er-note"><i class="fas fa-circle-notch fa-spin"></i> Đang tải số liệu kho học liệu...</div>';
      row.parentElement.insertBefore(card, row);
      card.addEventListener('click', (e) => { if (e.target.closest('[data-er-refresh]')) mount(true); });
    }
    // Sau khi tải xong, vẽ vào thẻ ĐANG hiển thị (thẻ cũ có thể đã bị thay khi người dùng chuyển tab)
    try { const s = await load(force); const cur = document.getElementById(MOUNT_ID); if (cur) render(cur, s); }
    catch (e) { const cur = document.getElementById(MOUNT_ID); if (cur) render(cur, null, e && e.message ? e.message : 'Lỗi kết nối'); }
  }

  // Tab Tổng quan được vẽ lại mỗi lần chuyển tab -> gắn lại thẻ sau mỗi lần switchTab('tong-quan')
  function hook() {
    if (typeof window.switchTab !== 'function' || window.switchTab.__erWrapped) return;
    const orig = window.switchTab;
    window.switchTab = function (tabId) {
      const r = orig.apply(this, arguments);
      if (tabId === 'tong-quan') setTimeout(() => mount(false), 0);
      return r;
    };
    window.switchTab.__erWrapped = true;
  }
  hook();
  window.addEventListener('load', () => { hook(); mount(false); });
  window.refreshElearningHealth = () => mount(true);
})();
