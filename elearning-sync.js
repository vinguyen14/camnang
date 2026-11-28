/**
 * ĐỒNG BỘ THƯ VIỆN GIÁO TRÌNH <- CỔNG HỌC TẬP E-LEARNING (27/11/2026)
 *
 * Hai nguồn:
 *   - Sheet "Masterdata E-Learning" (qua Apps Script của Hub): XÁC ĐỊNH khóa học gồm những tính năng nào.
 *   - Sheet của Cổng học tập kiotvietlnd.github.io/elearning (CSV công khai) + updates-meta.json:
 *     đầy đủ mọi tính năng, link mới nhất, ngày cập nhật — nhưng không cho biết tính năng có nằm trong khóa học hay không.
 *
 * Cách ghép (tự động mỗi lần mở Hub, dữ liệu Cổng lưu đệm 30 phút):
 *   1. Bài có trong Sheet khóa học  -> tag "Trong khóa học". Nếu Cổng có tên / video / quiz / infographic / mô tả mới
 *      hơn thì hiển thị bản mới, ghi lại giá trị cũ để xem đã đổi gì.
 *   2. Bài chỉ có trên Cổng          -> tag "Ngoài khóa học" (tính năng mới, chưa đưa vào giáo trình).
 *   3. Nhật ký đồng bộ: thời điểm đồng bộ, thời điểm Cổng cập nhật, đồng bộ những phần nào, thay đổi nào mới xuất hiện.
 * Chỉ ĐỌC hai nguồn, không ghi gì vào Google Sheet.
 */
(function () {
  'use strict';
  if (window.KhPortalSync) return;

  const PORTAL_CSV = 'https://docs.google.com/spreadsheets/d/1qofU1zM9WJ9fDrxxrmziBUHiMQ0K9BQxh5fKthGrKYI/export?format=csv&gid=0';
  const PORTAL_META = 'https://kiotvietlnd.github.io/elearning/tinh-nang-moi/updates-meta.json';
  const PORTAL_HOME = 'https://kiotvietlnd.github.io/elearning/';
  const CACHE_KEY = 'kv_portal_elearning_v1';
  const LOG_KEY = 'kv_portal_sync_log_v1';
  const TTL_MS = 30 * 60 * 1000;
  const FIELDS = [
    ['Nội dung', 'tên bài'], ['YouTube', 'video'], ['Github', 'quiz'],
    ['Infographic', 'infographic'], ['HDSD', 'HDSD'], ['Mô tả', 'mô tả']
  ];

  const S = { portal: null, pristine: null, sheet: '', report: null, loading: false, error: '' };

  // ---------- Tiện ích ----------
  const ls = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();
  const courseKey = s => norm(s).replace(/\s+/g, '');
  const urlKey = u => String(u || '').trim().toLowerCase().replace(/\/+$/, '');
  const quizPath = u => { const m = String(u || '').trim().match(/\/elearning\/(.+?)\/?$/i); return m ? m[1].toLowerCase() : ''; };
  const quizDomain = u => quizPath(u).split('/')[0] || '';
  const ytId = u => { const m = String(u || '').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{6,})/i); return m ? m[1] : ''; };
  // So sánh "cùng nội dung": video so theo mã video, link khác so không phân biệt hoa thường / dấu / cuối
  const same = (field, a, b) => {
    if (field === 'YouTube') return (ytId(a) || urlKey(a)) === (ytId(b) || urlKey(b));
    if (field === 'Nội dung' || field === 'Mô tả') return String(a || '').trim() === String(b || '').trim();
    return urlKey(a) === urlKey(b);
  };
  const fmtTime = d => { const x = new Date(d); return isNaN(x) ? '' : x.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }); };

  function parseCsv(text) {
    const rows = []; let row = [], cell = '', q = false;
    text = String(text || '').replace(/^﻿/, '');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (c !== '\r') cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  async function fetchText(url, ms) {
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), ms) : null;
    try {
      const res = await fetch(url, ctrl ? { signal: ctrl.signal, cache: 'no-store' } : { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.text();
    } finally { if (t) clearTimeout(t); }
  }

  async function loadPortal(force) {
    const cached = ls.get(CACHE_KEY);
    if (!force && cached && Date.now() - cached.fetchedAt < TTL_MS) return cached;
    const [csv, metaText] = await Promise.all([
      fetchText(PORTAL_CSV, 25000),
      fetchText(PORTAL_META, 15000).catch(() => '')
    ]);
    const rows = parseCsv(csv);
    if (!rows.length) throw new Error('Sheet Cổng học tập trống');
    const head = rows[0].map(h => h.trim());
    if (head.indexOf('Nội dung') === -1 || head.indexOf('Khóa học') === -1) throw new Error('Sheet Cổng học tập đổi cấu trúc cột');
    const items = rows.slice(1)
      .map(r => { const o = {}; head.forEach((h, i) => { if (h && !/^Cột \d+$/.test(h)) o[h] = String(r[i] || '').trim(); }); return o; })
      .filter(o => o['Nội dung']);
    let meta = null;
    try { meta = metaText ? JSON.parse(metaText) : null; } catch (e) { meta = null; }
    const data = { fetchedAt: Date.now(), items, meta: meta ? { generatedAt: meta.generatedAt || '', items: meta.items || {} } : null };
    ls.set(CACHE_KEY, data);
    return data;
  }

  // ---------- Ghép dữ liệu ----------
  function merge(courseItems, portal) {
    const pItems = portal.items;
    const used = new Set();
    const metaItems = (portal.meta && portal.meta.items) || {};
    const find = (pred) => { for (let i = 0; i < pItems.length; i++) if (!used.has(i) && pred(pItems[i])) return i; return -1; };
    const report = { at: Date.now(), portalAt: portal.fetchedAt, portalGeneratedAt: (portal.meta && portal.meta.generatedAt) || '',
      inCourse: 0, outCourse: 0, unmatched: 0, changed: [], counts: {}, outList: [] };

    const merged = courseItems.map(orig => {
      const it = Object.assign({}, orig);
      const c = courseKey(orig['Khóa học']), qp = quizPath(orig['Github']), hd = urlKey(orig['HDSD']), ti = norm(orig['Nội dung']);
      let idx = qp ? find(p => quizPath(p['Github']) === qp && courseKey(p['Khóa học']) === c) : -1;
      if (idx < 0 && hd) idx = find(p => urlKey(p['HDSD']) === hd && courseKey(p['Khóa học']) === c);
      if (idx < 0 && ti) idx = find(p => norm(p['Nội dung']) === ti && courseKey(p['Khóa học']) === c);
      if (idx < 0 && qp) idx = find(p => quizPath(p['Github']) === qp); // Cổng xếp bài sang khóa khác
      it.__scope = 'in';
      report.inCourse++;
      if (idx < 0) { it.__unmatched = true; report.unmatched++; return it; }
      used.add(idx);
      const p = pItems[idx];
      if (courseKey(p['Khóa học']) !== c) it.__portalCourse = p['Khóa học'];
      if (p['Ngày']) it.__date = p['Ngày'];
      const changes = [];
      FIELDS.forEach(([f, label]) => {
        const nv = p[f] || '';
        if (!nv || same(f, orig[f], nv)) return; // Cổng để trống thì giữ bản trong khóa học
        const ch = { field: f, label, from: orig[f] || '', to: nv };
        if (f === 'Github' && quizDomain(orig[f]) && quizDomain(nv) && quizDomain(orig[f]) !== quizDomain(nv)) ch.warn = 'Quiz mới thuộc ngành khác — nên kiểm tra lại trên Sheet Cổng';
        changes.push(ch);
        it[f] = nv;
        report.counts[label] = (report.counts[label] || 0) + 1;
      });
      if (changes.length) { it.__changes = changes; report.changed.push({ course: orig['Khóa học'], title: it['Nội dung'], changes }); }
      const m = metaItems[quizPath(it['Github'])];
      if (m) it.__meta = { type: m.type, label: m.typeLabel, date: m.commitDate, summary: m.summary };
      return it;
    });

    pItems.forEach((p, i) => {
      if (used.has(i)) return;
      const it = Object.assign({}, p);
      delete it['Ngày'];
      it.__scope = 'out';
      if (p['Ngày']) it.__date = p['Ngày'];
      const m = metaItems[quizPath(p['Github'])];
      if (m) it.__meta = { type: m.type, label: m.typeLabel, date: m.commitDate, summary: m.summary };
      report.outCourse++;
      report.outList.push({ course: p['Khóa học'], title: p['Nội dung'] });
      merged.push(it);
    });
    return { merged, report };
  }

  // Nhật ký: chỉ thêm dòng mới khi nội dung đồng bộ khác lần trước; đánh dấu thay đổi lần đầu xuất hiện
  function signatureOf(report) {
    return report.changed.map(c => c.course + '|' + c.title + '|' + c.changes.map(x => x.field + '>' + x.to).join(',')).concat(report.outList.map(o => 'out|' + o.course + '|' + o.title));
  }
  function writeLog(report) {
    const log = ls.get(LOG_KEY) || { entries: [], seen: {} };
    const sig = signatureOf(report);
    // Lần đầu chỉ ghi mốc; từ lần sau mới đánh dấu "mới phát hiện"
    const fresh = log.entries.length ? sig.filter(k => !log.seen[k]) : [];
    sig.forEach(k => { if (!log.seen[k]) log.seen[k] = report.at; });
    // Dọn mục không còn xuất hiện (đã được cập nhật vào Sheet khóa học)
    const live = new Set(sig);
    Object.keys(log.seen).forEach(k => { if (!live.has(k)) delete log.seen[k]; });
    const entry = { at: report.at, portalGeneratedAt: report.portalGeneratedAt, inCourse: report.inCourse, outCourse: report.outCourse,
      changed: report.changed.length, counts: report.counts, fresh: fresh.length };
    const last = log.entries[0];
    if (!last || fresh.length || last.changed !== entry.changed || last.outCourse !== entry.outCourse) log.entries.unshift(entry);
    else log.entries[0] = Object.assign({}, entry, { fresh: last.fresh, firstAt: last.firstAt || last.at });
    log.entries = log.entries.slice(0, 12);
    ls.set(LOG_KEY, log);
    report.freshKeys = new Set(fresh);
    report.seen = log.seen;
    report.log = log.entries;
  }

  // ---------- Gắn vào Hub ----------
  function elearningSheetName() {
    return (typeof AppState !== 'undefined' && (AppState.sheetList || []).find(s => typeof detectSheetType === 'function' && detectSheetType(s) === 'elearning')) || '';
  }

  function rerender() {
    try {
      if (typeof renderDynamicSidebar === 'function') renderDynamicSidebar();
      if (AppState.activeTabId === 'tab-home') { if (typeof renderMasterDashboard === 'function') renderMasterDashboard(); }
      else if (AppState.currentSheet === S.sheet && typeof renderItems === 'function') renderItems();
    } catch (e) { console.warn('[elearning-sync] render', e); }
  }

  function applyMerge() {
    if (!S.portal || !S.pristine || !S.sheet || !AppState.sheetsData[S.sheet]) return;
    const { merged, report } = merge(S.pristine, S.portal);
    AppState.sheetsData[S.sheet].items = merged;
    writeLog(report);
    S.report = report;
    rerender();
  }

  async function refresh(force) {
    if (S.loading) return;
    S.loading = true; S.error = '';
    rerenderBannerOnly();
    try {
      S.portal = await loadPortal(force);
      applyMerge();
      if (force && typeof showToast === 'function') showToast('Đã đồng bộ với Cổng học tập E-Learning');
    } catch (e) {
      S.error = (e && e.name === 'AbortError') ? 'Cổng học tập phản hồi quá lâu' : (e && e.message) || 'Không tải được Cổng học tập';
      console.warn('[elearning-sync]', e);
    } finally { S.loading = false; rerenderBannerOnly(); }
  }

  function capturePristine() {
    S.sheet = elearningSheetName();
    const sheet = S.sheet && AppState.sheetsData[S.sheet];
    if (!sheet || !Array.isArray(sheet.items)) { S.pristine = null; return; }
    // Bộ dữ liệu mới từ Hub -> lấy làm bản gốc (bỏ các dòng do lần ghép trước thêm vào)
    S.pristine = sheet.items.filter(it => it.__scope !== 'out').map(it => {
      const o = {}; Object.keys(it).forEach(k => { if (k.indexOf('__') !== 0) o[k] = it[k]; });
      return o;
    });
  }

  function hook() {
    const origApply = window.applyDataset;
    if (typeof origApply === 'function' && !origApply.__kvSync) {
      const wrapped = function () {
        const r = origApply.apply(this, arguments);
        capturePristine();
        if (S.portal) applyMerge(); else refresh(false);
        return r;
      };
      wrapped.__kvSync = true;
      window.applyDataset = wrapped;
    }
    const origSync = window.syncGoogleSheetsData;
    if (typeof origSync === 'function' && !origSync.__kvSync) {
      const wrappedSync = async function () { const r = await origSync.apply(this, arguments); refresh(true); return r; };
      wrappedSync.__kvSync = true;
      window.syncGoogleSheetsData = wrappedSync;
    }
    // Chỉ số sức khỏe ở trang Tổng quan tính theo bài TRONG khóa học
    const origDash = window.renderMasterDashboard;
    if (typeof origDash === 'function' && !origDash.__kvSync) {
      const wrappedDash = function () {
        const sheet = S.sheet && AppState.sheetsData[S.sheet];
        if (!sheet || !Array.isArray(sheet.items)) return origDash.apply(this, arguments);
        const all = sheet.items;
        sheet.items = all.filter(it => it.__scope !== 'out');
        try { return origDash.apply(this, arguments); } finally { sheet.items = all; }
      };
      wrappedDash.__kvSync = true;
      window.renderMasterDashboard = wrappedDash;
    }
    // Hub đã nạp dữ liệu trước khi file này chạy
    if (typeof AppState !== 'undefined' && AppState.sheetsData && Object.keys(AppState.sheetsData).length) { capturePristine(); refresh(false); }
  }

  // ---------- Khung "Đồng bộ với Cổng học tập" ----------
  function esc(s) { return typeof window.escapeHtml === 'function' ? window.escapeHtml(s) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function bannerHtml() {
    const r = S.report;
    const btn = `<button class="kh-btn" onclick="KhPortalSync.refresh(true)" ${S.loading ? 'disabled' : ''}><i class="fa-solid fa-rotate ${S.loading ? 'fa-spin' : ''}"></i>${S.loading ? 'Đang đồng bộ…' : 'Đồng bộ lại'}</button>`;
    if (!r) {
      const msg = S.error ? `<span style="color:var(--kh-miss)"><i class="fa-solid fa-triangle-exclamation"></i> ${esc(S.error)} — đang hiển thị theo Sheet khóa học.</span>`
        : 'Đang đối chiếu với Cổng học tập E-Learning…';
      return `<div class="kh-card kh-sync" id="kh-sync-banner"><div class="kh-sync-head"><div class="kh-text">${msg}</div>${btn}</div></div>`;
    }
    const parts = Object.keys(r.counts).map(k => `<span class="kh-chip kh-accent">${r.counts[k]} ${esc(k)}</span>`).join('');
    const changedRows = r.changed.map(c => {
      const key = c.course + '|' + c.title + '|' + c.changes.map(x => x.field + '>' + x.to).join(',');
      const since = r.seen && r.seen[key] ? fmtTime(r.seen[key]) : '';
      return `<tr><td>${esc(c.course)}</td><td><b>${esc(c.title)}</b>${r.freshKeys && r.freshKeys.has(key) ? ' <span class="kh-chip kh-gold">mới phát hiện</span>' : ''}</td>
        <td>${c.changes.map(x => `<div class="kh-sync-ch"><span class="kh-chip">${esc(x.label)}</span> ${x.field === 'Nội dung' || x.field === 'Mô tả'
          ? `<s>${esc(x.from || '(trống)')}</s> → ${esc(x.to)}`
          : `${x.from ? `<a href="${esc(x.from)}" target="_blank" rel="noopener">cũ</a>` : '(trống)'} → <a href="${esc(x.to)}" target="_blank" rel="noopener">mới</a>`}${x.warn ? ` <span style="color:var(--kh-miss)" title="${esc(x.warn)}"><i class="fa-solid fa-triangle-exclamation"></i></span>` : ''}</div>`).join('')}</td>
        <td class="kh-muted">${esc(since)}</td></tr>`;
    }).join('');
    const outRows = r.outList.map(o => `<li><span class="kh-muted">${esc(o.course)}</span> · ${esc(o.title)}</li>`).join('');
    const logRows = (r.log || []).map(e => `<li><b>${esc(fmtTime(e.at))}</b> — ${e.inCourse} bài trong khóa, ${e.changed} bài có cập nhật, ${e.outCourse} tính năng ngoài khóa${e.fresh ? ` · <span style="color:var(--kh-gold)">${e.fresh} thay đổi mới</span>` : ''}</li>`).join('');
    return `<div class="kh-card kh-sync" id="kh-sync-banner">
      <div class="kh-sync-head">
        <div class="min-w-0">
          <div class="kh-eyebrow"><i class="fa-solid fa-arrows-rotate"></i> Đồng bộ với Cổng học tập</div>
          <div class="kh-text">Đồng bộ lúc <b>${esc(fmtTime(r.portalAt))}</b>${r.portalGeneratedAt ? ` · Cổng cập nhật nội dung lúc <b>${esc(fmtTime(r.portalGeneratedAt))}</b>` : ''}
            ${S.error ? ` · <span style="color:var(--kh-miss)">${esc(S.error)} (đang dùng bản đã lưu)</span>` : ''}</div>
          <div class="kh-lesson-res" style="margin-top:8px">
            <span class="kh-chip kh-ok"><i class="fa-solid fa-graduation-cap"></i>${r.inCourse} bài trong khóa học</span>
            <span class="kh-chip kh-gold"><i class="fa-solid fa-star"></i>${r.outCourse} tính năng ngoài khóa học</span>
            <span class="kh-chip kh-accent"><i class="fa-solid fa-pen"></i>${r.changed.length} bài đã cập nhật theo Cổng</span>${parts}
            ${r.unmatched ? `<span class="kh-chip kh-miss">${r.unmatched} bài không tìm thấy trên Cổng</span>` : ''}
          </div>
        </div>
        <div class="kh-sync-actions">${btn}<a class="kh-btn" href="${PORTAL_HOME}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i>Mở Cổng</a></div>
      </div>
      ${r.changed.length ? `<details class="kh-sync-more"><summary>Xem các bài trong khóa học đã được cập nhật (${r.changed.length})</summary>
        <div class="kh-sync-table"><table><thead><tr><th>Khóa</th><th>Bài</th><th>Đã đổi</th><th>Phát hiện từ</th></tr></thead><tbody>${changedRows}</tbody></table></div>
        <p class="kh-text kh-muted" style="margin-top:8px">Hub hiển thị bản mới theo Cổng. Sheet khóa học vẫn giữ giá trị cũ — cập nhật vào Sheet để danh sách này trống.</p></details>` : ''}
      ${r.outList.length ? `<details class="kh-sync-more"><summary>Tính năng ngoài khóa học (${r.outList.length})</summary><ul class="kh-sync-list">${outRows}</ul></details>` : ''}
      ${logRows ? `<details class="kh-sync-more"><summary>Nhật ký đồng bộ</summary><ul class="kh-sync-list">${logRows}</ul></details>` : ''}
    </div>`;
  }

  function rerenderBannerOnly() {
    const el = document.getElementById('kh-sync-banner');
    if (!el) return;
    const keepOpen = [...el.querySelectorAll('details')].map(d => d.open);
    el.outerHTML = bannerHtml();
    const fresh = document.getElementById('kh-sync-banner');
    if (fresh) fresh.querySelectorAll('details').forEach((d, i) => { if (keepOpen[i]) d.open = true; });
  }

  const css = `
  .kh-sync { padding: 16px 18px; margin-bottom: 18px; }
  .kh-sync-head { display: flex; gap: 14px; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; }
  .kh-sync-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .kh-sync-more { margin-top: 12px; border-top: 1px dashed var(--kh-line); padding-top: 10px; }
  .kh-sync-more > summary { cursor: pointer; font-size: 12.5px; font-weight: 650; color: var(--kh-accent-ink); }
  .kh-sync-table { overflow-x: auto; margin-top: 10px; }
  .kh-sync-table table { width: 100%; border-collapse: collapse; font-size: 12px; color: var(--kh-ink); }
  .kh-sync-table th { text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em; color: var(--kh-faint); padding: 6px 8px; border-bottom: 1px solid var(--kh-line); }
  .kh-sync-table td { padding: 7px 8px; border-bottom: 1px solid var(--kh-line); vertical-align: top; }
  .kh-sync-table a { color: var(--kh-accent-ink); text-decoration: underline; }
  .kh-sync-table td:first-child, .kh-sync-table td:last-child { white-space: nowrap; }
  .kh-sync-ch + .kh-sync-ch { margin-top: 4px; }
  .kh-sync-list { margin-top: 8px; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 4px 16px; font-size: 12px; color: var(--kh-ink); }
  .kh-out-head { display: flex; align-items: center; gap: 8px; margin: 14px 0 4px; font-size: 11px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--kh-gold); }
  .kh-out-head::after { content: ''; flex: 1; border-top: 1px dashed currentColor; opacity: .4; }
  .kh-lesson.kh-out { opacity: .95; background: var(--kh-gold-soft); }
  .kh-tag-row { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 4px; }
  @media (max-width: 767px) { .kh-sync-table table { min-width: 560px; } }`;
  if (!document.getElementById('kh-sync-css')) {
    const st = document.createElement('style'); st.id = 'kh-sync-css'; st.textContent = css; document.head.appendChild(st);
  }

  // Dùng cho trang khác (thẻ báo cáo trên Dashboard): ghép bộ dữ liệu Hub với Cổng, giữ lại bài TRONG khóa học
  async function applyToDataset(data) {
    const sheets = (data && data.sheets) || {};
    const name = (data.sheetList || Object.keys(sheets)).find(n => /elearning|masterdata/i.test(n));
    if (!name || !sheets[name] || !Array.isArray(sheets[name].items)) return null;
    const portal = await loadPortal(false);
    const { merged, report } = merge(sheets[name].items, portal);
    sheets[name].items = merged.filter(it => it.__scope !== 'out');
    return report;
  }

  // Dùng cho trang Product Radar (học cá nhân): ghép Cổng với danh sách bài TRONG khóa học (nếu có) bằng đúng merge() ở trên.
  // Không ghi nhật ký, không đổi trạng thái của Hub. Không có danh sách khóa học → mọi bài gắn phạm vi 'unknown'.
  async function buildLearningFeed(courseItems, force) {
    const portal = await loadPortal(!!force);
    const clean = Array.isArray(courseItems)
      ? courseItems.filter(it => it && typeof it === 'object' && it.__scope !== 'out').map(it => {
          const o = {}; Object.keys(it).forEach(k => { if (k.indexOf('__') !== 0) o[k] = it[k]; }); return o;
        })
      : [];
    if (clean.length) {
      const { merged, report } = merge(clean, portal);
      return { portal, items: merged, report, hasCourse: true };
    }
    const metaItems = (portal.meta && portal.meta.items) || {};
    const items = portal.items.map(p => {
      const it = Object.assign({}, p);
      delete it['Ngày'];
      it.__scope = 'unknown';
      if (p['Ngày']) it.__date = p['Ngày'];
      const m = metaItems[quizPath(p['Github'])];
      if (m) it.__meta = { type: m.type, label: m.typeLabel, date: m.commitDate, summary: m.summary };
      return it;
    });
    return { portal, items, report: null, hasCourse: false };
  }

  window.KhPortalSync = {
    buildLearningFeed: (courseItems, force) => buildLearningFeed(courseItems, force),
    refresh: (force) => refresh(!!force),
    applyToDataset,
    bannerHtml,
    getPortal: (force) => loadPortal(!!force), // Trang Product Radar: lấy dữ liệu Cổng (có cache 30 phút)
    get report() { return S.report; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
})();
