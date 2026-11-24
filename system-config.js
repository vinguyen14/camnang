/**
 * TRAINER OS v6.4 ENTERPRISE - GLOBAL SYSTEM CONFIGURATION HUB
 * - Nơi tập trung duy nhất (Single Source of Truth) quản lý cấu hình toàn hệ thống.
 * - Mọi trang HTML (13 file) đều đọc link API qua hàm getGlobalApiUrl().
 * - Khi có link Web App mới, chỉ cần sửa DUY NHẤT biến DEFAULT_API_URL ở đây
 *   hoặc dán trên giao diện Settings, toàn bộ hệ thống sẽ tự động ăn khớp 100%.
 * - Sprint 0 (21/11/2026): Tự động đính kèm API Token vào mọi request gửi tới Web App,
 *   chỉ chấp nhận link Web App Google Apps Script hợp lệ.
 */

(function (window) {
  'use strict';

  // 1. LINK WEB APP GOOGLE APPS SCRIPT MẶC ĐỊNH DUY NHẤT CỦA TOÀN DỰ ÁN
  const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbxk_ZgUBCTN4ShKpQNgWilmXc12QFPIJf2Mdbk0XE6IOzGW01KGjAfbrXHZSQ2dVlbGGA/exec';
  // Link cũ đã ngừng dùng (bản cũ từng tự lưu vào localStorage của mọi máy) -> tự động gỡ để chuyển sang link mới
  const LEGACY_API_URLS = [
    'https://script.google.com/macros/s/AKfycbw_-mVQH6OLCPSuz78lY_kAmZUtmFOa6WB__Oo6VUJ_9IPukh4C0y8c5LZ7C98_cE4hbQ/exec'
  ];
  const API_URL_PATTERN =/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
  const TOKEN_KEY = 'kv_api_token';

  function isValidApiUrl(url) {
    return typeof url === 'string' && API_URL_PATTERN.test(url.trim());
  }

  // 2. HÀM LẤY LINK API TẬP TRUNG (Ưu tiên: link hợp lệ do người dùng nhập > Mặc định hệ thống)
  window.getGlobalApiUrl = function () {
    try {
      const customUrl = localStorage.getItem('kv_api_url');
      if (customUrl && isValidApiUrl(customUrl)) {
        return customUrl.trim();
      }
    } catch (e) {}
    return DEFAULT_API_URL;
  };

  // 3. HÀM CẬP NHẬT LINK API TOÀN HỆ THỐNG
  // Trả về true nếu lưu thành công. Link rỗng = quay về link mặc định. Link sai định dạng bị từ chối.
  window.setGlobalApiUrl = function (newUrl) {
    const cleanUrl = (typeof newUrl === 'string') ? newUrl.trim() : '';
    if (cleanUrl && !isValidApiUrl(cleanUrl)) return false;
    try {
      if (cleanUrl && cleanUrl !== DEFAULT_API_URL) localStorage.setItem('kv_api_url', cleanUrl);
      else localStorage.removeItem('kv_api_url');
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('kv_api_url_changed', { detail: { url: window.getGlobalApiUrl() } }));
    return true;
  };

  // 4. API TOKEN (chỉ lưu trên máy này, KHÔNG đồng bộ lên Cloud)
  window.getApiToken = function () {
    try { return (localStorage.getItem(TOKEN_KEY) || '').trim(); } catch (e) { return ''; }
  };
  window.setApiToken = function (token) {
    const clean = (typeof token === 'string') ? token.trim() : '';
    try {
      if (clean) localStorage.setItem(TOKEN_KEY, clean);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('kv_api_url_changed', { detail: { url: window.getGlobalApiUrl() } }));
  };

  // 5. DỌN DẸP: link cũ bị lưu sai định dạng hoặc trùng mặc định -> xóa để luôn dùng link chuẩn
  try {
    const existing = localStorage.getItem('kv_api_url');
    if (existing !== null && (!isValidApiUrl(existing) || existing.trim() === DEFAULT_API_URL || LEGACY_API_URLS.indexOf(existing.trim()) !== -1)) {
      localStorage.removeItem('kv_api_url');
    }
  } catch (e) {}

  // 6. TỰ ĐỘNG ĐÍNH KÈM TOKEN cho mọi request tới Web App Apps Script
  //    - GET: thêm ?token=...
  //    - POST (body JSON dạng chuỗi): thêm trường "token"
  function isApiRequest(url) {
    return typeof url === 'string' && url.indexOf('https://script.google.com/macros/s/') === 0;
  }

  // 7. TRẠNG THÁI KẾT NỐI CHUNG (Sprint 2) - mọi trang/sidebar/header cùng đọc 1 nguồn
  //    'ok' | 'unauthorized' | 'busy' | 'error' | 'offline' | 'unknown'
  const STATUS_KEY = 'kv_api_last_status';
  const STATUS_TEXT = {
    ok: 'Cloud API Active',
    unauthorized: 'Thiếu / sai API Token',
    busy: 'Cloud đang bận',
    error: 'API Error',
    offline: 'Mất kết nối Cloud',
    unknown: 'Chưa kiểm tra Cloud'
  };
  function readStatus() {
    try { return JSON.parse(sessionStorage.getItem(STATUS_KEY)) || { state: 'unknown', message: '' }; } catch (e) { return { state: 'unknown', message: '' }; }
  }
  window.getApiStatus = function () {
    const s = readStatus();
    return { state: s.state, message: s.message || '', label: STATUS_TEXT[s.state] || STATUS_TEXT.unknown, at: s.at || 0 };
  };
  window.setApiStatus = function (state, message) {
    const s = { state: STATUS_TEXT[state] ? state : 'error', message: message || '', at: Date.now() };
    try { sessionStorage.setItem(STATUS_KEY, JSON.stringify(s)); } catch (e) {}
    window.dispatchEvent(new CustomEvent('kv_api_status', { detail: window.getApiStatus() }));
  };
  function statusFromBody(body) {
    if (!body || typeof body !== 'object') return ['error', 'Phản hồi không hợp lệ'];
    if (body.status === 'error') {
      if (body.code === 'UNAUTHORIZED') return ['unauthorized', body.message];
      if (body.code === 'BUSY') return ['busy', body.message];
      return ['ok', body.message]; // Lỗi nghiệp vụ (VD thiếu mã khóa) - kết nối vẫn tốt
    }
    return ['ok', ''];
  }

  const API_TIMEOUT_MS = Number(window.KV_API_TIMEOUT_MS) > 0 ? Number(window.KV_API_TIMEOUT_MS) : 30000; // Đặt KV_API_TIMEOUT_MS chỉ khi kiểm thử

  if (typeof window.fetch === 'function') {
    const nativeFetch = window.fetch;
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url);
      const isApi = isApiRequest(url);
      let timer = null;
      try {
        // Timeout 30 giây cho request tới Apps Script (trước đây treo thì nút xoay mãi, không báo lỗi)
        if (isApi && typeof AbortController === 'function' && !(init && init.signal)) {
          const ctrl = new AbortController();
          timer = setTimeout(function () { ctrl.abort(); }, API_TIMEOUT_MS);
          init = Object.assign({}, init || {}, { signal: ctrl.signal });
        }
        const token = window.getApiToken();
        if (token && isApi && typeof input === 'string') {
          const method = ((init && init.method) || 'GET').toUpperCase();
          if (method === 'GET') {
            const sep = input.indexOf('?') === -1 ? '?' : '&';
            input = input + sep + 'token=' + encodeURIComponent(token);
          } else if (init && typeof init.body === 'string') {
            const parsed = JSON.parse(init.body);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              parsed.token = token;
              init = Object.assign({}, init, { body: JSON.stringify(parsed) });
            }
          }
        }
      } catch (e) {}
      const p = nativeFetch.call(this, input, init);
      if (!isApi) return p;
      return p.then(function (res) {
        if (timer) clearTimeout(timer);
        // Đọc bản sao phản hồi để cập nhật trạng thái, không ảnh hưởng code của trang
        res.clone().json()
          .then(function (body) { const s = statusFromBody(body); window.setApiStatus(s[0], s[1]); })
          .catch(function () { window.setApiStatus('error', 'Cloud trả về dữ liệu không phải JSON (có thể chưa deploy đúng quyền truy cập)'); });
        return res;
      }, function (err) {
        if (timer) clearTimeout(timer);
        const aborted = err && err.name === 'AbortError';
        window.setApiStatus('offline', aborted ? 'Cloud không phản hồi sau ' + Math.round(API_TIMEOUT_MS / 1000) + ' giây' : 'Không kết nối được Cloud (mạng hoặc CORS)');
        if (aborted) {
          const e2 = new Error('Cloud không phản hồi sau ' + Math.round(API_TIMEOUT_MS / 1000) + ' giây. Vui lòng thử lại.');
          e2.name = 'TimeoutError';
          throw e2;
        }
        throw err;
      });
    };
  }

  // Kiểm tra kết quả trả về từ Apps Script: ném lỗi kèm thông báo tiếng Việt nếu không thành công.
  // Dùng: fetch(url, ...).then(r => r.json()).then(window.ensureApiSuccess).then(...)
  window.ensureApiSuccess = function (data) {
    if (!data || data.status !== 'success') {
      const msg = (data && data.message) ? data.message : 'Cloud không xác nhận lưu thành công';
      const err = new Error(msg);
      err.code = data && data.code;
      throw err;
    }
    return data;
  };

  window.SYSTEM_DEFAULT_API_URL = DEFAULT_API_URL;
})(typeof window !== 'undefined' ? window : this);
