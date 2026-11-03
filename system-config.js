/**
 * TRAINER OS v6.4 ENTERPRISE - GLOBAL SYSTEM CONFIGURATION HUB
 * - Nơi tập trung duy nhất (Single Source of Truth) quản lý cấu hình toàn hệ thống.
 * - Mọi trang HTML (13 file) đều đọc link API qua hàm getGlobalApiUrl().
 * - Khi có link Web App mới, chỉ cần sửa DUY NHẤT biến DEFAULT_API_URL ở đây
 *   hoặc dán trên giao diện Settings, toàn bộ hệ thống sẽ tự động ăn khớp 100%.
 */

(function (window) {
  'use strict';

  // 1. LINK WEB APP GOOGLE APPS SCRIPT MẶC ĐỊNH DUY NHẤT CỦA TOÀN DỰ ÁN
  const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbw_-mVQH6OLCPSuz78lY_kAmZUtmFOa6WB__Oo6VUJ_9IPukh4C0y8c5LZ7C98_cE4hbQ/exec';

  // 2. HÀM LẤY LINK API TẬP TRUNG (Ưu tiên: LocalStorage > Mặc định hệ thống)
  window.getGlobalApiUrl = function () {
    try {
      const customUrl = localStorage.getItem('kv_api_url');
      if (customUrl && typeof customUrl === 'string' && customUrl.trim().startsWith('http')) {
        return customUrl.trim();
      }
    } catch (e) {}
    return DEFAULT_API_URL;
  };

  // 3. HÀM CẬP NHẬT LINK API TOÀN HỆ THỐNG
  window.setGlobalApiUrl = function (newUrl) {
    if (!newUrl || typeof newUrl !== 'string') return;
    const cleanUrl = newUrl.trim();
    try {
      localStorage.setItem('kv_api_url', cleanUrl);
    } catch (e) {}
    // Phát sự kiện toàn hệ thống cho các tab/trang lắng nghe
    window.dispatchEvent(new CustomEvent('kv_api_url_changed', { detail: { url: cleanUrl } }));
  };

  // 4. TỰ ĐỘNG KHỞI TẠO NẾU MÁY CHƯA CÓ LINK
  try {
    const existing = localStorage.getItem('kv_api_url');
    if (!existing || !existing.trim().startsWith('http')) {
      localStorage.setItem('kv_api_url', DEFAULT_API_URL);
    }
  } catch (e) {}

  window.SYSTEM_DEFAULT_API_URL = DEFAULT_API_URL;
})(typeof window !== 'undefined' ? window : this);
