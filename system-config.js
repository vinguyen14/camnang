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
  const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbw_-mVQH6OLCPSuz78lY_kAmZUtmFOa6WB__Oo6VUJ_9IPukh4C0y8c5LZ7C98_cE4hbQ/exec';
  const API_URL_PATTERN = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
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
    if (existing !== null && (!isValidApiUrl(existing) || existing.trim() === DEFAULT_API_URL)) {
      localStorage.removeItem('kv_api_url');
    }
  } catch (e) {}

  // 6. TỰ ĐỘNG ĐÍNH KÈM TOKEN cho mọi request tới Web App Apps Script
  //    - GET: thêm ?token=...
  //    - POST (body JSON dạng chuỗi): thêm trường "token"
  function isApiRequest(url) {
    return typeof url === 'string' && url.indexOf('https://script.google.com/macros/s/') === 0;
  }

  if (typeof window.fetch === 'function') {
    const nativeFetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        const url = typeof input === 'string' ? input : (input && input.url);
        const token = window.getApiToken();
        if (token && isApiRequest(url) && typeof input === 'string') {
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
      return nativeFetch.call(this, input, init);
    };
  }

  window.SYSTEM_DEFAULT_API_URL = DEFAULT_API_URL;
})(typeof window !== 'undefined' ? window : this);
