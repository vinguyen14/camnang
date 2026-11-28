/**
 * BKL-002 · THẺ KPI TÓM TẮT THEO NGÀNH (28/11/2026)
 * Dùng cho industry.html (FNB / SALON / HOTEL) và thuehkd.html (TAX).
 * Đọc kv_master_db (các báo cáo đóng khóa đã nộp, Dashboard tải từ Cloud) — chỉ đọc, không ghi.
 *   - Bento KPI: số lớp, học viên, tỷ lệ hoàn thành (đạt / tổng), CSAT trung bình, lớp gần nhất.
 *   - Bảng đối chiếu nhanh tỷ lệ hoàn thành theo tháng của năm đang chọn.
 * Cách dùng: <div id="course-kpi" data-groups="FNB,SALON,HOTEL"></div> rồi nạp file này.
 * Năm lấy từ ô #conf-year của trang; ngành đang chọn (industry.html) lấy từ radio name="industryType".
 */
(function () {
  'use strict';

  const META = {
    FNB:   { label: 'F&B',      icon: 'fa-utensils',     color: '#ea7a12', soft: 'rgba(234,122,18,.10)' },
    SALON: { label: 'Salon',    icon: 'fa-spa',          color: '#db2777', soft: 'rgba(219,39,119,.10)' },
    HOTEL: { label: 'Hotel',    icon: 'fa-hotel',        color: '#0d9488', soft: 'rgba(13,148,136,.10)' },
    TAX:   { label: 'Thuế HKD', icon: 'fa-file-invoice-dollar', color: '#059669', soft: 'rgba(5,150,105,.10)' }
  };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v) => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.').replace(/[^\d.]/g, '')); return isFinite(n) ? n : 0; };

  function readDb() {
    try {
      const d = JSON.parse(localStorage.getItem('kv_master_db') || '[]');
      return Array.isArray(d) ? d : [];
    } catch (e) { return []; }
  }

  // Ngành của một báo cáo (giống cách Dashboard gom nhóm)
  function groupOf(d) {
    const g = String(d && d.groupName || '').toUpperCase();
    if (g === 'TAX' || g.includes('THUẾ') || g.includes('THUE')) return 'TAX';
    if (g.includes('FNB') || g.includes('F&B')) return 'FNB';
    if (g.includes('SALON')) return 'SALON';
    if (g.includes('HOTEL')) return 'HOTEL';
    return g;
  }

  // Năm và tháng của báo cáo: ưu tiên ngày bắt đầu, sau đó tới timestamp + trường month
  function ymOf(d) {
    const m = /^(\d{4})-(\d{1,2})/.exec(String(d.startDate || ''));
    if (m) return { y: +m[1], m: +m[2] };
    const t = Number(d.timestamp);
    if (t) { const x = new Date(t); return { y: x.getFullYear(), m: +d.month || (x.getMonth() + 1) }; }
    return { y: 0, m: +d.month || 0 };
  }

  // CSAT có thể là "4.8", "96%", "4,7/5" → quy về thang 5
  function csatOf(v) {
    const s = String(v == null ? '' : v).trim();
    if (!s) return null;
    const n = num(s.split('/')[0]);
    if (!n) return null;
    if (s.includes('%') || n > 5) return Math.min(5, n / 20);
    return n;
  }

  function stats(rows) {
    let total = 0, passed = 0, csatSum = 0, csatN = 0, last = null;
    rows.forEach(d => {
      total += num(d.totalTrainees);
      passed += num(d.passedTrainees);
      const c = csatOf(d.csat);
      if (c != null) { csatSum += c; csatN++; }
      const ts = Number(d.timestamp) || Date.parse(d.startDate || '') || 0;
      if (!last || ts > last.ts) last = { ts, id: d.courseId || '', start: d.startDate || '' };
    });
    return {
      classes: rows.length, total, passed,
      rate: total ? Math.round(passed / total * 100) : null,
      csat: csatN ? Math.round(csatSum / csatN * 10) / 10 : null,
      last
    };
  }

  function rateColor(r) {
    if (r == null) return '#94a3b8';
    if (r >= 85) return '#059669';
    if (r >= 70) return '#d97706';
    return '#e11d48';
  }

  function css() {
    if (document.getElementById('ckpi-css')) return;
    const st = document.createElement('style');
    st.id = 'ckpi-css';
    st.textContent = `
      #course-kpi { margin-bottom: 20px; }
      .ckpi-head { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-bottom:10px; }
      .ckpi-head h3 { font-size:12px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:#475569; }
      .ckpi-head span { font-size:11px; color:#94a3b8; }
      .ckpi-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; }
      .ckpi-card { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:14px 16px; transition:box-shadow .15s, border-color .15s; }
      .ckpi-card.on { border-color: var(--c); box-shadow: 0 0 0 3px var(--s); }
      .ckpi-top { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
      .ckpi-ic { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; background:var(--s); color:var(--c); }
      .ckpi-name { font-weight:800; color:#1e293b; font-size:14px; }
      .ckpi-sub { font-size:11px; color:#94a3b8; }
      .ckpi-nums { display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; text-align:center; background:#f8fafc; border-radius:10px; padding:8px 4px; }
      .ckpi-nums b { display:block; font-size:16px; font-weight:800; color:#0f172a; }
      .ckpi-nums small { font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase; }
      .ckpi-bar { height:6px; border-radius:99px; background:#e2e8f0; overflow:hidden; margin-top:10px; }
      .ckpi-bar i { display:block; height:100%; border-radius:99px; }
      .ckpi-foot { display:flex; justify-content:space-between; font-size:11px; color:#64748b; margin-top:6px; gap:8px; }
      .ckpi-table-wrap { margin-top:12px; background:#fff; border:1px solid #e2e8f0; border-radius:16px; overflow-x:auto; }
      .ckpi-table { width:100%; border-collapse:collapse; font-size:12px; min-width:560px; }
      .ckpi-table th { font-size:10px; text-transform:uppercase; color:#94a3b8; font-weight:800; padding:8px 6px; text-align:center; border-bottom:1px solid #f1f5f9; }
      .ckpi-table th:first-child, .ckpi-table td:first-child { text-align:left; padding-left:14px; white-space:nowrap; }
      .ckpi-table td { padding:8px 6px; text-align:center; border-bottom:1px solid #f8fafc; font-weight:700; }
      .ckpi-pill { display:inline-block; min-width:38px; padding:2px 6px; border-radius:6px; font-size:11px; }
      .ckpi-empty { font-size:12px; color:#64748b; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:14px; padding:12px 14px; }
      .ckpi-empty a { color:#7c3aed; font-weight:700; }
      html[data-aurora="dark"] .ckpi-card, html[data-aurora="dark"] .ckpi-table-wrap { background:rgba(24,26,48,.85); border-color:rgba(255,255,255,.08); }
      html[data-aurora="dark"] .ckpi-name, html[data-aurora="dark"] .ckpi-nums b { color:#ecebf7; }
      html[data-aurora="dark"] .ckpi-nums, html[data-aurora="dark"] .ckpi-empty { background:rgba(255,255,255,.04); }
      html[data-aurora="dark"] .ckpi-head h3 { color:#cbd5e1; }
      @media (max-width: 767px) { .ckpi-nums b { font-size:14px; } }
    `;
    document.head.appendChild(st);
  }

  function render() {
    const box = document.getElementById('course-kpi');
    if (!box) return;
    const groups = String(box.dataset.groups || 'FNB,SALON,HOTEL').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const yEl = document.getElementById('conf-year');
    const year = parseInt(yEl && yEl.value, 10) || new Date().getFullYear();
    const sel = document.querySelector('input[name="industryType"]:checked');
    const active = sel ? String(sel.value).toUpperCase() : (groups.length === 1 ? groups[0] : '');

    const all = readDb();
    const rows = all.filter(d => groups.includes(groupOf(d)) && ymOf(d).y === year);

    let html = `<div class="ckpi-head"><h3><i class="fas fa-chart-simple"></i> Tóm tắt năm ${year}</h3>
      <span>Từ ${rows.length} báo cáo đóng khóa đã nộp · tỷ lệ hoàn thành = học viên đạt / tổng học viên</span></div>`;

    if (!all.length) {
      html += `<div class="ckpi-empty"><i class="fas fa-circle-info"></i> Chưa có số liệu trên máy này. Mở <a href="index.html">Dashboard</a> một lần để tải dữ liệu báo cáo từ Cloud.</div>`;
      box.innerHTML = html;
      return;
    }

    html += '<div class="ckpi-grid">';
    groups.forEach(g => {
      const meta = META[g] || { label: g, icon: 'fa-layer-group', color: '#7c3aed', soft: 'rgba(124,58,237,.10)' };
      const s = stats(rows.filter(d => groupOf(d) === g));
      const rateTxt = s.rate == null ? '–' : s.rate + '%';
      html += `<div class="ckpi-card ${g === active ? 'on' : ''}" style="--c:${meta.color};--s:${meta.soft}">
        <div class="ckpi-top"><span class="ckpi-ic"><i class="fas ${meta.icon}"></i></span>
          <div><div class="ckpi-name">${esc(meta.label)}</div><div class="ckpi-sub">${s.classes ? s.classes + ' lớp đã đóng' : 'Chưa có lớp nào'}</div></div></div>
        <div class="ckpi-nums">
          <div><b>${s.total}</b><small>Học viên</small></div>
          <div><b style="color:${rateColor(s.rate)}">${rateTxt}</b><small>Hoàn thành</small></div>
          <div><b>${s.csat == null ? '–' : s.csat}</b><small>CSAT /5</small></div>
        </div>
        <div class="ckpi-bar"><i style="width:${s.rate || 0}%;background:${rateColor(s.rate)}"></i></div>
        <div class="ckpi-foot"><span>${s.passed}/${s.total} đạt</span><span>${s.last && s.last.id ? 'Gần nhất: ' + esc(s.last.id) : ''}</span></div>
      </div>`;
    });
    html += '</div>';

    // Bảng đối chiếu theo tháng
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    html += '<div class="ckpi-table-wrap"><table class="ckpi-table"><thead><tr><th>Tỷ lệ hoàn thành</th>';
    months.forEach(m => { html += `<th>T${m}</th>`; });
    html += '</tr></thead><tbody>';
    groups.forEach(g => {
      const meta = META[g] || { label: g, color: '#7c3aed' };
      html += `<tr><td><span style="color:${meta.color}"><i class="fas fa-circle" style="font-size:7px;vertical-align:2px"></i></span> ${esc(meta.label)}</td>`;
      months.forEach(m => {
        const s = stats(rows.filter(d => groupOf(d) === g && ymOf(d).m === m));
        if (s.rate == null) { html += '<td style="color:#cbd5e1">·</td>'; return; }
        const c = rateColor(s.rate);
        html += `<td><span class="ckpi-pill" title="${s.passed}/${s.total} học viên · ${s.classes} lớp" style="color:${c};background:${c}1a">${s.rate}%</span></td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    box.innerHTML = html;
  }

  function init() {
    css();
    render();
    const yEl = document.getElementById('conf-year');
    if (yEl) yEl.addEventListener('input', render);
    document.querySelectorAll('input[name="industryType"]').forEach(r => r.addEventListener('change', render));
    // Dashboard ở tab khác vừa tải dữ liệu mới
    window.addEventListener('storage', (e) => { if (e.key === 'kv_master_db') render(); });
  }

  window.CourseKpi = { render };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
