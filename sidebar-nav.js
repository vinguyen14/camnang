/**
 * TRAINER OS v6.4 ENTERPRISE - DUAL-ENGINE UNIVERSAL SIDEBAR
 * - Tích hợp Menu Accordion xổ mượt mà cho "Chuyên ngành" (FNB, Salon, Hotel)
 * - Tách bạch: "Sản phẩm KV1" (kv1.html) & "Tất cả khóa học" (index.html?tab=khoa-hoc)
 * - Miễn nhiễm hoàn toàn với lỗi ghi đè body.className (system-workflow.html)
 * - Tự động dời lề chuẩn xác bằng CSS Variables trên :root và <html>
 * - Dual-Logo: Logo chữ KiotViet khi mở rộng, Icon Bông hoa khi thu gọn
 * - Giữ nguyên vẹn 100% menu module con của settings, industry, thuehkd
 */

(function () {
  'use strict';

  const KIOTVIET_LOGO_URL = 'https://i.postimg.cc/xjKmwPcn/1.jpg';
  const BONGHOA_LOGO_URL = 'https://i.postimg.cc/yxQsM5RD/Bong-Hoa-Logo.png';

  function getCurrentFile() {
    const raw = window.location.pathname.split('/').pop() || 'index.html';
    return raw.split('?')[0].split('#')[0] || 'index.html';
  }

  function initAuroraRoot() {
    const file = getCurrentFile();
    const isCustomDarkPage = (file === 'coderunner.html' || file === 'system-workflow.html');
    let saved = 'light';
    try {
      const raw = localStorage.getItem('kv_aurora_theme_mode');
      if (raw === 'dark' || raw === 'light') saved = raw;
    } catch (e) {}

    document.documentElement.classList.add('aurora-sidebar');
    if (file === 'coderunner.html' || file === 'system-workflow.html') {
      document.documentElement.classList.add('aurora-sidebar-force-dark');
    } else {
      document.documentElement.classList.add('aurora-ui');
    }
    if (!document.documentElement.getAttribute('data-aurora') || isCustomDarkPage) {
      document.documentElement.setAttribute('data-aurora', saved);
    } else if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-aurora', saved);
    }
  }

  initAuroraRoot();

  function injectFavicon() {
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'shortcut icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = BONGHOA_LOGO_URL;
  }

  // BỘ ICON ĐA SẮC VUI NHỘN (PLAYFUL 3D-FLAT VECTOR LIBRARY - ZERO EXTERNAL CDN)
  const AURORA_ICONS = {
    dashboard: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 11.5L12 4.5L20 11.5V19.5C20 20.6 19.1 21.5 18 21.5H6C4.9 21.5 4 20.6 4 19.5V11.5Z" fill="#FEF3C7"/><path d="M2.5 11.8L12 3.5L21.5 11.8C22 12.2 21.7 13 21 13H19.5L12 6.4L4.5 13H3C2.3 13 2 12.2 2.5 11.8Z" fill="#FB7185"/><path d="M9.6 14.5C9.6 13.7 10.3 13 11.1 13H12.9C13.7 13 14.4 13.7 14.4 14.5V21.5H9.6V14.5Z" fill="#8B5CF6"/><circle cx="13" cy="17.5" r="0.9" fill="#FDE047"/><rect x="6.2" y="9.8" width="3.2" height="2.6" rx="0.8" fill="#38BDF8"/></svg>`,
    cube: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2.5L20.5 7.2L12 12L3.5 7.2L12 2.5Z" fill="#DDD6FE"/><path d="M3.5 7.2L12 12V21.5L3.5 16.8V7.2Z" fill="#38BDF8"/><path d="M20.5 7.2L12 12V21.5L20.5 16.8V7.2Z" fill="#8B5CF6"/><path d="M7.6 4.9L16.1 9.6V13.8L14 12.6V10.8L5.5 6.1L7.6 4.9Z" fill="#FB7185"/><ellipse cx="12" cy="7.2" rx="2.6" ry="0.9" fill="#FFFFFF" fill-opacity="0.5"/></svg>`,
    tax: `<svg viewBox="0 0 24 24" fill="none"><path d="M5 3.5C5 2.7 5.7 2 6.5 2H17.5C18.3 2 19 2.7 19 3.5V20.5L16.5 19L14 20.5L12 19L10 20.5L7.5 19L5 20.5V3.5Z" fill="#D1FAE5"/><rect x="5" y="2" width="14" height="4.5" rx="1.5" fill="#10B981"/><rect x="7.5" y="9" width="7" height="1.8" rx="0.9" fill="#34D399"/><rect x="7.5" y="12.5" width="5" height="1.8" rx="0.9" fill="#6EE7B7"/><circle cx="16.8" cy="15.8" r="4.6" fill="#FBBF24" stroke="#FFFFFF" stroke-width="1.2"/><text x="16.8" y="17.9" text-anchor="middle" font-size="6.4" font-weight="900" fill="#78350F" font-family="sans-serif">%</text></svg>`,
    monitor: `<svg viewBox="0 0 24 24" fill="none"><rect x="2.5" y="4" width="19" height="13.5" rx="3" fill="#4F46E5"/><rect x="4.5" y="6" width="15" height="9.5" rx="1.5" fill="#7DD3FC"/><path d="M4.5 6H19.5V8.4C19.5 9.1 18.9 9.6 18.2 9.6C17.5 9.6 17 9.1 17 8.4C17 9.1 16.4 9.6 15.7 9.6C15.1 9.6 14.5 9.1 14.5 8.4C14.5 9.1 13.9 9.6 13.2 9.6C12.6 9.6 12 9.1 12 8.4C12 9.1 11.4 9.6 10.7 9.6C10.1 9.6 9.5 9.1 9.5 8.4C9.5 9.1 8.9 9.6 8.2 9.6C7.6 9.6 7 9.1 7 8.4C7 9.1 6.4 9.6 5.7 9.6C5.1 9.6 4.5 9.1 4.5 8.4V6Z" fill="#FB7185"/><path d="M9.5 17.5H14.5L15.5 20.3H8.5L9.5 17.5Z" fill="#A5B4FC"/><rect x="7.5" y="19.8" width="9" height="1.8" rx="0.9" fill="#6366F1"/><circle cx="16.2" cy="12.5" r="1.4" fill="#FDE047"/></svg>`,
    books: `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="14.5" width="16" height="5.5" rx="1.8" fill="#10B981"/><rect x="6" y="15.8" width="12.5" height="2.8" rx="0.9" fill="#ECFDF5"/><rect x="3" y="9" width="16.5" height="5.5" rx="1.8" fill="#F59E0B"/><rect x="5" y="10.3" width="13" height="2.8" rx="0.9" fill="#FEF3C7"/><rect x="5" y="3.5" width="15.5" height="5.5" rx="1.8" fill="#F43F5E"/><rect x="7" y="4.8" width="11.5" height="2.8" rx="0.9" fill="#FFE4E6"/><circle cx="17.8" cy="6.2" r="1" fill="#FDE047"/></svg>`,
    bento: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8.2" height="8.2" rx="2.6" fill="#A855F7"/><rect x="12.8" y="3" width="8.2" height="8.2" rx="2.6" fill="#FB7185"/><rect x="3" y="12.8" width="8.2" height="8.2" rx="2.6" fill="#38BDF8"/><rect x="12.8" y="12.8" width="8.2" height="8.2" rx="2.6" fill="#34D399"/><circle cx="5.4" cy="5.4" r="1.1" fill="#FFFFFF" fill-opacity="0.55"/><circle cx="15.2" cy="5.4" r="1.1" fill="#FFFFFF" fill-opacity="0.55"/><circle cx="5.4" cy="15.2" r="1.1" fill="#FFFFFF" fill-opacity="0.55"/><circle cx="15.2" cy="15.2" r="1.1" fill="#FFFFFF" fill-opacity="0.55"/></svg>`,
    terminal: `<svg viewBox="0 0 24 24" fill="none"><rect x="2.5" y="3.5" width="19" height="17" rx="3.5" fill="#312E81"/><rect x="2.5" y="3.5" width="19" height="4.8" rx="2" fill="#4F46E5"/><circle cx="6" cy="5.9" r="1.1" fill="#FB7185"/><circle cx="9.2" cy="5.9" r="1.1" fill="#FBBF24"/><circle cx="12.4" cy="5.9" r="1.1" fill="#34D399"/><path d="M6.8 12L10.3 14.8L6.8 17.6" stroke="#34D399" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="12" y="16" width="5.2" height="2" rx="1" fill="#38BDF8"/></svg>`,
    radar: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.5" fill="#134E4A"/><circle cx="12" cy="12" r="6.8" stroke="#2DD4BF" stroke-width="1.3" stroke-opacity="0.65"/><circle cx="12" cy="12" r="3.6" stroke="#5EEAD4" stroke-width="1.3" stroke-opacity="0.8"/><path d="M12 12L18.8 5.2C20.5 7 21.5 9.4 21.5 12H12Z" fill="#A3E635" fill-opacity="0.65"/><circle cx="12" cy="12" r="1.9" fill="#FDE047"/><circle cx="16.5" cy="8.2" r="2.2" fill="#FB7185" stroke="#FFFFFF" stroke-width="1"/></svg>`,
    mindmap: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 12L6 6.5M12 12L18.5 7M12 12L6.5 18M12 12L18 17.5" stroke="#CBD5E1" stroke-width="2" stroke-linecap="round"/><circle cx="6" cy="6.5" r="3" fill="#FBBF24"/><circle cx="18.5" cy="7" r="2.8" fill="#38BDF8"/><circle cx="6.5" cy="18" r="2.8" fill="#34D399"/><circle cx="18" cy="17.5" r="3" fill="#F472B6"/><circle cx="12" cy="12" r="3.8" fill="#8B5CF6" stroke="#FFFFFF" stroke-width="1.2"/></svg>`,
    vault: `<svg viewBox="0 0 24 24" fill="none"><path d="M3 6C3 4.6 4.1 3.5 5.5 3.5H9.6C10.4 3.5 11.1 3.9 11.5 4.5L12.6 6H18.5C19.9 6 21 7.1 21 8.5V10.5H3V6Z" fill="#F59E0B"/><rect x="5" y="7" width="14" height="5" rx="1.2" fill="#FEF3C7"/><rect x="2.5" y="8.5" width="19" height="11.5" rx="3" fill="#FBBF24"/><rect x="8.5" y="13" width="7" height="2.2" rx="1.1" fill="#FFFBEB" fill-opacity="0.88"/><circle cx="17.5" cy="11.5" r="1.5" fill="#2DD4BF"/></svg>`,
    bolt: `<svg viewBox="0 0 24 24" fill="none"><path d="M13.5 2.5L4.8 13.3C4.4 13.8 4.7 14.5 5.4 14.5H11.5L10.3 21.5L19.2 10.7C19.6 10.2 19.3 9.5 18.6 9.5H12.5L13.5 2.5Z" fill="#FBBF24" stroke="#F97316" stroke-width="1.2" stroke-linejoin="round"/><circle cx="18.5" cy="5.5" r="1.5" fill="#F472B6"/><circle cx="5.5" cy="18.5" r="1.3" fill="#38BDF8"/></svg>`,
    database: `<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 14.5V18C4.5 19.9 7.9 21.5 12 21.5C16.1 21.5 19.5 19.9 19.5 18V14.5H4.5Z" fill="#10B981"/><ellipse cx="12" cy="14.5" rx="7.5" ry="3" fill="#34D399"/><path d="M4.5 9.8V13.2C4.5 15.1 7.9 16.7 12 16.7C16.1 16.7 19.5 15.1 19.5 13.2V9.8H4.5Z" fill="#7C3AED"/><ellipse cx="12" cy="9.8" rx="7.5" ry="3" fill="#A78BFA"/><path d="M4.5 5.2V8.6C4.5 10.5 7.9 12.1 12 12.1C16.1 12.1 19.5 10.5 19.5 8.6V5.2H4.5Z" fill="#0284C7"/><ellipse cx="12" cy="5.2" rx="7.5" ry="3" fill="#38BDF8"/><circle cx="16.2" cy="10.2" r="1" fill="#FDE047"/><circle cx="16.2" cy="15" r="1" fill="#FFFFFF"/></svg>`,
    gear: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2.5C12.7 2.5 13.3 3 13.5 3.7L13.8 5C14.5 5.2 15.2 5.6 15.8 6.1L17.1 5.6C17.8 5.3 18.6 5.6 19 6.2L20 7.9C20.4 8.5 20.2 9.4 19.6 9.8L18.5 10.6C18.6 11.1 18.7 11.5 18.7 12C18.7 12.5 18.6 12.9 18.5 13.4L19.6 14.2C20.2 14.6 20.4 15.5 20 16.1L19 17.8C18.6 18.4 17.8 18.7 17.1 18.4L15.8 17.9C15.2 18.4 14.5 18.8 13.8 19L13.5 20.3C13.3 21 12.7 21.5 12 21.5H10C9.3 21.5 8.7 21 8.5 20.3L8.2 19C7.5 18.8 6.8 18.4 6.2 17.9L4.9 18.4C4.2 18.7 3.4 18.4 3 17.8L2 16.1C1.6 15.5 1.8 14.6 2.4 14.2L3.5 13.4C3.4 12.9 3.3 12.5 3.3 12C3.3 11.5 3.4 11.1 3.5 10.6L2.4 9.8C1.8 9.4 1.6 8.5 2 7.9L3 6.2C3.4 5.6 4.2 5.3 4.9 5.6L6.2 6.1C6.8 5.6 7.5 5.2 8.2 5L8.5 3.7C8.7 3 9.3 2.5 10 2.5H12Z" transform="translate(1 0)" fill="#818CF8"/><circle cx="12" cy="12" r="4.3" fill="#FBBF24" stroke="#FFFFFF" stroke-width="1.4"/></svg>`,
    chat: `<svg viewBox="0 0 24 24" fill="none"><path d="M10 4.5H18.5C19.9 4.5 21 5.6 21 7V13.5C21 14.9 19.9 16 18.5 16H16L13.5 18.2V16H10C8.6 16 7.5 14.9 7.5 13.5V7C7.5 5.6 8.6 4.5 10 4.5Z" fill="#38BDF8"/><path d="M5.5 8H14C15.4 8 16.5 9.1 16.5 10.5V16C16.5 17.4 15.4 18.5 14 18.5H8.5L5.2 21V18.5H5.5C4.1 18.5 3 17.4 3 16V10.5C3 9.1 4.1 8 5.5 8Z" fill="#FB7185"/><circle cx="7" cy="13.2" r="1.1" fill="#FFFFFF"/><circle cx="9.8" cy="13.2" r="1.1" fill="#FFFFFF"/><circle cx="12.6" cy="13.2" r="1.1" fill="#FFFFFF"/></svg>`,
    classboard: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4.5" width="18" height="12.5" rx="2.5" fill="#10B981" stroke="#F59E0B" stroke-width="1.8"/><path d="M7.5 17L5.5 21M16.5 17L18.5 21M12 17V20" stroke="#F59E0B" stroke-width="1.8" stroke-linecap="round"/><path d="M7 12L10 9.5L13 11.5L17 8" stroke="#FEF3C7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="8" r="1.3" fill="#FDE047"/></svg>`,
    checklist: `<svg viewBox="0 0 24 24" fill="none"><rect x="4.5" y="4" width="15" height="17.5" rx="2.8" fill="#8B5CF6"/><rect x="6.5" y="6.5" width="11" height="13" rx="1.6" fill="#FFFBEB"/><rect x="8.5" y="2.2" width="7" height="3.2" rx="1.2" fill="#FBBF24"/><path d="M8.5 10.5L9.8 11.8L12.2 9.2" stroke="#10B981" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><rect x="13.2" y="10" width="2.8" height="1.5" rx="0.7" fill="#CBD5E1"/><path d="M8.5 15L9.8 16.3L12.2 13.7" stroke="#FB7185" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><rect x="13.2" y="14.5" width="2.8" height="1.5" rx="0.7" fill="#CBD5E1"/></svg>`,
    medal: `<svg viewBox="0 0 24 24" fill="none"><path d="M7 3H11L13.5 10.5H9.5L7 3Z" fill="#FB7185"/><path d="M17 3H13L10.5 10.5H14.5L17 3Z" fill="#8B5CF6"/><circle cx="12" cy="14.8" r="6.4" fill="#FBBF24" stroke="#FEF3C7" stroke-width="1.3"/><path d="M12 11.2L13.1 13.4L15.5 13.7L13.7 15.4L14.2 17.8L12 16.6L9.8 17.8L10.3 15.4L8.5 13.7L10.9 13.4L12 11.2Z" fill="#FFFBEB"/></svg>`,
    rocket: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2.5C15.5 5 17 9 16.5 13.5L12 16L7.5 13.5C7 9 8.5 5 12 2.5Z" fill="#8B5CF6"/><path d="M7.5 11.5L4.5 14.5L7.5 15.5V11.5Z" fill="#FB7185"/><path d="M16.5 11.5L19.5 14.5L16.5 15.5V11.5Z" fill="#FB7185"/><circle cx="12" cy="9" r="2.1" fill="#7DD3FC"/><path d="M10 16.5L12 21.5L14 16.5H10Z" fill="#FBBF24"/></svg>`,
    envelope: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="3" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.2"/><path d="M3.6 6.2L12 13L20.4 6.2" fill="#FB7185"/><circle cx="12" cy="13.2" r="2.2" fill="#38BDF8" stroke="#FFFFFF" stroke-width="1"/></svg>`,
    bell: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3.5C8.5 3.5 6 6.2 6 9.8V14.5L4 17H20L18 14.5V9.8C18 6.2 15.5 3.5 12 3.5Z" fill="#FBBF24"/><path d="M9.8 17.8C10 19.3 10.9 20.5 12 20.5C13.1 20.5 14 19.3 14.2 17.8H9.8Z" fill="#F97316"/><circle cx="17.5" cy="6" r="2.6" fill="#F43F5E" stroke="#FFFFFF" stroke-width="1.2"/></svg>`,
    users: `<svg viewBox="0 0 24 24" fill="none"><circle cx="15.5" cy="8.5" r="3.2" fill="#FB7185"/><path d="M11.5 18.5C11.5 15.7 13.6 14 16.2 14C18.8 14 21 15.7 21 18.5H11.5Z" fill="#F43F5E"/><circle cx="8.8" cy="8" r="3.6" fill="#38BDF8"/><path d="M3 19.5C3 16 5.6 13.8 8.8 13.8C12 13.8 14.5 16 14.5 19.5H3Z" fill="#6366F1"/><circle cx="12" cy="5" r="1.2" fill="#FDE047"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="4.5" width="17" height="16.5" rx="3" fill="#FFF7ED" stroke="#CBD5E1" stroke-width="1"/><path d="M3.5 7.5C3.5 5.8 4.8 4.5 6.5 4.5H17.5C19.2 4.5 20.5 5.8 20.5 7.5V9.8H3.5V7.5Z" fill="#F43F5E"/><rect x="7" y="2.5" width="2.2" height="3.8" rx="1.1" fill="#FBBF24"/><rect x="14.8" y="2.5" width="2.2" height="3.8" rx="1.1" fill="#FBBF24"/><rect x="7" y="12" width="3" height="2.6" rx="0.8" fill="#A78BFA"/><rect x="11.2" y="12" width="3" height="2.6" rx="0.8" fill="#38BDF8"/><rect x="7" y="15.8" width="3" height="2.6" rx="0.8" fill="#34D399"/><circle cx="16.5" cy="16.5" r="2" fill="#FBBF24"/></svg>`,
    gift: `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="10.5" width="16" height="10" rx="2.2" fill="#FB7185"/><rect x="3" y="7" width="18" height="4" rx="1.5" fill="#F43F5E"/><rect x="10.5" y="7" width="3" height="13.5" fill="#FDE047"/><path d="M12 7C9.5 7 8 5.8 8.5 4.4C9 3 11 4.2 12 7Z" fill="#FBBF24"/><path d="M12 7C14.5 7 16 5.8 15.5 4.4C15 3 13 4.2 12 7Z" fill="#FBBF24"/></svg>`,
    link: `<svg viewBox="0 0 24 24" fill="none"><rect x="2.8" y="9" width="10.5" height="6" rx="3" transform="rotate(-25 8 12)" stroke="#8B5CF6" stroke-width="2.4"/><rect x="10.8" y="9" width="10.5" height="6" rx="3" transform="rotate(-25 16 12)" stroke="#10B981" stroke-width="2.4"/><circle cx="17.5" cy="5.5" r="1.3" fill="#FBBF24"/></svg>`,
    alert: `<svg viewBox="0 0 24 24" fill="none"><path d="M10.7 3.8C11.3 2.7 12.7 2.7 13.3 3.8L21 17.5C21.6 18.6 20.8 20 19.5 20H4.5C3.2 20 2.4 18.6 3 17.5L10.7 3.8Z" fill="#FBBF24"/><rect x="11" y="8.5" width="2" height="5.5" rx="1" fill="#78350F"/><circle cx="12" cy="16.5" r="1.2" fill="#78350F"/></svg>`,
    filter: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5H20L13.8 12.8V19L10.2 20.8V12.8L4 5.5Z" fill="#38BDF8" stroke="#6366F1" stroke-width="1.2" stroke-linejoin="round"/><circle cx="9" cy="4.2" r="1.6" fill="#FB7185"/><circle cx="14.5" cy="4.2" r="1.6" fill="#FBBF24"/><circle cx="12" cy="8.2" r="1.4" fill="#34D399"/></svg>`,
    code: `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4.5" width="18" height="15" rx="3.5" fill="#10B981"/><path d="M9 9.5L6.2 12L9 14.5M15 9.5L17.8 12L15 14.5M12.8 8.5L11.2 15.5" stroke="#ECFDF5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    chart: `<svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="13" width="4" height="7.5" rx="1.3" fill="#FB7185"/><rect x="9.8" y="9" width="4" height="11.5" rx="1.3" fill="#FBBF24"/><rect x="16" y="5" width="4" height="15.5" rx="1.3" fill="#34D399"/><circle cx="18" cy="3.2" r="1.3" fill="#8B5CF6"/></svg>`,
    fnb: `<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 11.5C4.5 7.5 7.8 5 12 5C16.2 5 19.5 7.5 19.5 11.5H4.5Z" fill="#F97316"/><rect x="3.5" y="11.5" width="17" height="2.4" rx="1.2" fill="#34D399"/><rect x="4" y="14" width="16" height="2.2" rx="1.1" fill="#F43F5E"/><path d="M4.5 16.5H19.5V17.5C19.5 18.6 18.6 19.5 17.5 19.5H6.5C5.4 19.5 4.5 18.6 4.5 17.5V16.5Z" fill="#FBBF24"/><circle cx="9" cy="8" r="0.9" fill="#FEF3C7"/><circle cx="13.5" cy="7.5" r="0.9" fill="#FEF3C7"/></svg>`,
    salon: `<svg viewBox="0 0 24 24" fill="none"><circle cx="7" cy="16.5" r="3.2" stroke="#F472B6" stroke-width="2.2" fill="#FDF2F8"/><circle cx="16.5" cy="17.5" r="3" stroke="#FB7185" stroke-width="2.2" fill="#FFF1F2"/><path d="M9.5 14L17 4.5M14.5 14.8L8.5 5.2" stroke="#8B5CF6" stroke-width="2.2" stroke-linecap="round"/><circle cx="18.5" cy="7.5" r="1.4" fill="#FBBF24"/></svg>`,
    hotel: `<svg viewBox="0 0 24 24" fill="none"><rect x="4.5" y="4" width="15" height="17" rx="2.5" fill="#14B8A6"/><rect x="8.5" y="2" width="7" height="2.6" rx="1" fill="#FBBF24"/><rect x="7.5" y="7" width="3" height="2.6" rx="0.7" fill="#CCFBF1"/><rect x="13.5" y="7" width="3" height="2.6" rx="0.7" fill="#CCFBF1"/><rect x="7.5" y="11.5" width="3" height="2.6" rx="0.7" fill="#FDE047"/><rect x="13.5" y="11.5" width="3" height="2.6" rx="0.7" fill="#CCFBF1"/><rect x="10" y="16" width="4" height="5" rx="1" fill="#0F766E"/></svg>`,
    robot: `<svg viewBox="0 0 24 24" fill="none"><rect x="11" y="2.5" width="2" height="3.2" fill="#8B5CF6"/><circle cx="12" cy="2.5" r="1.5" fill="#FBBF24"/><rect x="4.5" y="6" width="15" height="13" rx="4" fill="#8B5CF6"/><rect x="7" y="9" width="10" height="5.5" rx="2" fill="#1E1B4B"/><circle cx="9.8" cy="11.8" r="1.4" fill="#38BDF8"/><circle cx="14.2" cy="11.8" r="1.4" fill="#34D399"/><rect x="9" y="16" width="6" height="1.4" rx="0.7" fill="#DDD6FE"/></svg>`,
    sun: `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#FBBF24"/><path d="M12 2.5V4.8M12 19.2V21.5M2.5 12H4.8M19.2 12H21.5M5.3 5.3L6.9 6.9M17.1 17.1L18.7 18.7M18.7 5.3L17.1 6.9M6.9 17.1L5.3 18.7" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round"/><circle cx="10.4" cy="10.5" r="1.2" fill="#FEF3C7"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" fill="none"><path d="M19.2 14.5C18 15 16.6 15.2 15.2 14.9C11.4 14.1 8.9 10.4 9.7 6.6C10 5.3 10.6 4.1 11.5 3.2C7.4 3.7 4.2 7.2 4.2 11.5C4.2 16.2 8 20 12.7 20C15.9 20 18.7 18.2 20 15.5C19.8 15.1 19.5 14.7 19.2 14.5Z" fill="#8B5CF6"/><circle cx="17.5" cy="6.5" r="1.5" fill="#FBBF24"/><circle cx="14.5" cy="4.2" r="0.9" fill="#F472B6"/></svg>`,
    sheet: `<svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="#10B981"/><rect x="6" y="7" width="5.5" height="3.2" rx="0.8" fill="#ECFDF5"/><rect x="12.5" y="7" width="5.5" height="3.2" rx="0.8" fill="#A7F3D0"/><rect x="6" y="11.4" width="5.5" height="3.2" rx="0.8" fill="#A7F3D0"/><rect x="12.5" y="11.4" width="5.5" height="3.2" rx="0.8" fill="#ECFDF5"/><rect x="6" y="15.8" width="12" height="2.4" rx="0.8" fill="#6EE7B7"/></svg>`
  };

  function picon(key, size, extraClass) {
    const svg = AURORA_ICONS[key] || AURORA_ICONS.bento;
    const px = size || 19;
    const cls = extraClass ? `aurora-picon ${extraClass}` : 'aurora-picon';
    return `<span class="${cls}" style="width:${px}px;height:${px}px;" aria-hidden="true">${svg}</span>`;
  }

  // CẤU TRÚC MENU 100% CHUẨN XÁC VỚI SUBMENU ACCORDION CHO CHUYÊN NGÀNH
  const SIDEBAR_STRUCTURE = [
    {
      group: 'TỔNG QUAN',
      items: [
        {
          id: 'index',
          file: 'index.html',
          label: 'Bảng điều khiển',
          icon: picon('dashboard', 20, 'sb-nav-svg')
        }
      ]
    },
    {
      group: 'QUẢN TRỊ KHÓA HỌC',
      items: [
        {
          id: 'spcb',
          file: 'spcb.html',
          label: 'Cơ bản (TS-DS)',
          icon: picon('cube', 20, 'sb-nav-svg')
        },
        {
          id: 'thuehkd',
          file: 'thuehkd.html',
          label: 'Chuyên đề Thuế',
          icon: picon('tax', 20, 'sb-nav-svg')
        },
        {
          id: 'kv1',
          file: 'kv1.html',
          label: 'Sản phẩm KV1',
          icon: picon('monitor', 20, 'sb-nav-svg')
        },
        {
          id: 'industry',
          label: 'Chuyên ngành',
          isAccordion: true,
          icon: picon('books', 20, 'sb-nav-svg'),
          subItems: [
            { label: 'KiotViet FNB', file: 'industry.html?type=FNB', type: 'FNB', iconKey: 'fnb', color: 'hover:text-orange-500' },
            { label: 'KV Salon', file: 'industry.html?type=SALON', type: 'SALON', iconKey: 'salon', color: 'hover:text-pink-500' },
            { label: 'KV Hotel', file: 'industry.html?type=HOTEL', type: 'HOTEL', iconKey: 'hotel', color: 'hover:text-emerald-500' }
          ]
        },
        {
          id: 'all-courses',
          file: 'index.html?tab=khoa-hoc',
          label: 'Tất cả khóa học',
          icon: picon('bento', 20, 'sb-nav-svg')
        }
      ]
    },
    {
      group: 'CÔNG CỤ & TÀI NGUYÊN',
      items: [
        {
          id: 'coderunner',
          file: 'coderunner.html',
          label: 'HTML Code Studio',
          icon: picon('terminal', 20, 'sb-nav-svg')
        },
        {
          id: 'import-studio',
          file: 'import-studio.html',
          label: 'Import Studio',
          icon: picon('sheet', 20, 'sb-nav-svg')
        },
        {
          id: 'radar',
          file: 'radar.html',
          label: 'Radar Sản Phẩm Mới',
          icon: picon('radar', 20, 'sb-nav-svg')
        },
        {
          id: 'knowledge',
          file: 'knowledge.html',
          label: 'Sơ đồ Vận hành',
          icon: picon('mindmap', 20, 'sb-nav-svg')
        },
        {
          id: 'vault',
          file: 'vault.html',
          label: 'Kho Lưu Trữ Vault',
          icon: picon('vault', 20, 'sb-nav-svg')
        },
        {
          id: 'tools',
          file: 'tools.html',
          label: 'Runner Tools',
          icon: picon('bolt', 20, 'sb-nav-svg')
        }
      ]
    },
    {
      group: 'DỮ LIỆU & HỆ THỐNG',
      items: [
        {
          id: 'knowledge-hub',
          file: 'knowledge-hub.html',
          label: 'Master Data Hub',
          icon: picon('database', 20, 'sb-nav-svg')
        },
        {
          id: 'settings',
          file: 'settings.html',
          label: 'Cài đặt Hệ thống',
          icon: picon('gear', 20, 'sb-nav-svg')
        }
      ]
    }
  ];

  function injectStyles() {
    if (document.getElementById('sidebar-fast-styles')) return;
    const style = document.createElement('style');
    style.id = 'sidebar-fast-styles';
    style.innerHTML = `
      :root {
        --sb-width: 15rem; /* 240px */
      }
      :root.sb-collapsed {
        --sb-width: 4rem; /* 64px */
      }

      #sidebar {
        width: var(--sb-width) !important;
        min-width: var(--sb-width) !important;
        transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1) !important;
        box-shadow: 2px 0 10px 0 rgba(0, 0, 0, 0.05) !important;
      }
      
      :root.sb-collapsed #sidebar .sb-text,
      :root.sb-collapsed #sidebar .sb-group-title,
      :root.sb-collapsed #sidebar .sb-arrow,
      :root.sb-collapsed #sidebar .sb-submenu {
        display: none !important;
      }
      :root.sb-collapsed #sidebar .sb-divider {
        display: block !important;
      }
      :root:not(.sb-collapsed) #sidebar .sb-divider {
        display: none !important;
      }

      :root.sb-collapsed #sidebar #sb-header-row {
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        height: auto !important;
        padding: 10px 6px 8px !important;
        gap: 6px !important;
      }
      :root.sb-collapsed #sidebar #btn-secret-logo {
        flex: none !important;
        width: 100% !important;
        justify-content: center !important;
        overflow: visible !important;
        background: transparent !important;
      }
      :root.sb-collapsed #sb-logo-full {
        display: none !important;
      }
      :root.sb-collapsed #sb-logo-icon {
        display: block !important;
        width: 28px !important;
        height: 28px !important;
        min-width: 28px !important;
        background: #ffffff !important;
        border-radius: 8px !important;
        padding: 2px !important;
        margin: 0 auto !important;
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.12) !important;
      }
      :root:not(.sb-collapsed) #sb-logo-full {
        display: block !important;
      }
      :root:not(.sb-collapsed) #sb-logo-icon {
        display: none !important;
      }

      :root.sb-collapsed #btn-sidebar-toggle {
        margin: 0 auto !important;
        padding: 4px 10px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      :root.sb-collapsed #sidebar a.sidebar-item,
      :root.sb-collapsed #sidebar .sb-accordion-trigger {
        justify-content: center !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        width: 40px !important;
        height: 36px !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
      :root.sb-collapsed #sidebar #sidebar-alert-dot {
        position: absolute !important;
        top: 4px !important;
        right: 5px !important;
        margin-left: 0 !important;
        width: 7px !important;
        height: 7px !important;
        box-shadow: 0 0 0 1.5px rgba(255, 255, 255, 0.94) !important;
      }
      html.sb-collapsed.aurora-ui[data-aurora="dark"] #sidebar #sidebar-alert-dot {
        box-shadow: 0 0 0 1.5px rgba(18, 20, 42, 0.95) !important;
      }
      :root.sb-collapsed #sidebar .sb-footer-box {
        padding-left: 6px !important;
        padding-right: 6px !important;
        align-items: center !important;
      }
      :root.sb-collapsed #sidebar .sb-footer-item {
        justify-content: center !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }

      #sidebar .sb-tooltip {
        background-color: #0f172a !important;
        color: #ffffff !important;
      }

      :root.sb-collapsed #sidebar .group:hover .sb-tooltip {
        opacity: 1 !important;
        pointer-events: auto !important;
      }
      :root:not(.sb-collapsed) #sidebar .sb-tooltip {
        display: none !important;
      }

      .sb-scroll::-webkit-scrollbar {
        width: 4px;
      }
      .sb-scroll::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }

      html.has-standalone-sidebar body {
        margin-left: var(--sb-width) !important;
        width: calc(100vw - var(--sb-width)) !important;
        max-width: calc(100vw - var(--sb-width)) !important;
        min-width: calc(100vw - var(--sb-width)) !important;
        transition: margin-left 0.22s cubic-bezier(0.4, 0, 0.2, 1), width 0.22s cubic-bezier(0.4, 0, 0.2, 1) !important;
        box-sizing: border-box !important;
      }

      /* === AURORA SIDEBAR GLASSMORPHISM (ALL 13 WORKSPACE PAGES) === */
      html.aurora-sidebar #sidebar {
        background: rgba(255, 255, 255, 0.72) !important;
        backdrop-filter: blur(22px) saturate(160%) !important;
        -webkit-backdrop-filter: blur(22px) saturate(160%) !important;
        border-right: 1px solid rgba(139, 92, 246, 0.14) !important;
        box-shadow: 4px 0 28px -6px rgba(109, 40, 217, 0.07) !important;
      }
      html.aurora-sidebar #sidebar .sb-surface {
        background: transparent !important;
      }
      html.aurora-sidebar #sidebar .sb-divider-line {
        background: rgba(139, 92, 246, 0.12) !important;
      }
      html.aurora-sidebar #sidebar .sb-group-title {
        color: #8b8ca7 !important;
        font-size: 9.5px !important;
        letter-spacing: 0.08em !important;
      }
      html.aurora-sidebar #sidebar a.sidebar-item,
      html.aurora-sidebar #sidebar .sb-accordion-trigger {
        border-radius: 10px !important;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      html.aurora-sidebar #sidebar a.sidebar-item:not(.active-menu-item):hover,
      html.aurora-sidebar #sidebar .sb-accordion-trigger:not(.sb-accordion-active):hover {
        background: rgba(139, 92, 246, 0.09) !important;
        color: #6d28d9 !important;
      }
      html.aurora-sidebar #sidebar a.active-menu-item,
      html.aurora-sidebar #sidebar .sb-accordion-active {
        background: linear-gradient(95deg, #8b5cf6 0%, #7c3aed 100%) !important;
        color: #ffffff !important;
        font-weight: 700 !important;
        box-shadow: 0 5px 15px -3px rgba(139, 92, 246, 0.44) !important;
      }
      html.aurora-sidebar #sidebar a.active-menu-item svg,
      html.aurora-sidebar #sidebar .sb-accordion-active svg {
        color: #ffffff !important;
      }
      .aurora-picon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease;
        filter: drop-shadow(0 2px 4px rgba(15, 23, 42, 0.14));
      }
      .aurora-picon svg {
        width: 100%;
        height: 100%;
        display: block;
      }
      html.aurora-sidebar #sidebar a.active-menu-item .sb-nav-svg {
        background: rgba(255, 255, 255, 0.22);
        border-radius: 7px;
        padding: 2px;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
      }
      #sidebar .sidebar-item:hover .aurora-picon,
      main .sidebar-item:hover .aurora-picon,
      .set-menu:hover .aurora-picon,
      .tree-node:hover .aurora-picon,
      .tool-card:hover .aurora-picon,
      a.saas-card:hover .aurora-picon {
        transform: scale(1.15) rotate(-4deg);
      }
      .aurora-page-badge {
        width: 36px;
        height: 36px;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.14) 0%, rgba(236, 72, 153, 0.10) 100%);
        border: 1px solid rgba(139, 92, 246, 0.22);
        box-shadow: 0 4px 12px -4px rgba(139, 92, 246, 0.24);
      }
      html.aurora-ui[data-aurora="dark"] .aurora-page-badge {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.24) 0%, rgba(56, 189, 248, 0.14) 100%);
        border-color: rgba(167, 139, 250, 0.32);
        box-shadow: 0 6px 16px -4px rgba(0, 0, 0, 0.38);
      }
      html.aurora-ui .aurora-greet-badge {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.16) 0%, rgba(236, 72, 153, 0.12) 100%) !important;
        border: 1px solid rgba(139, 92, 246, 0.24) !important;
      }
      html.aurora-ui[data-aurora="dark"] .aurora-greet-badge {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.26) 0%, rgba(56, 189, 248, 0.16) 100%) !important;
        border-color: rgba(167, 139, 250, 0.34) !important;
      }
      html.aurora-sidebar #sidebar #btn-sidebar-toggle:hover {
        background: rgba(139, 92, 246, 0.1) !important;
        color: #7c3aed !important;
      }
      html.aurora-sidebar #sidebar .sb-footer-box {
        background: rgba(255, 255, 255, 0.42) !important;
        border-top-color: rgba(139, 92, 246, 0.12) !important;
      }
      html.aurora-sidebar #sidebar .sb-footer-item:hover {
        background: rgba(139, 92, 246, 0.08) !important;
      }

      /* DARK AURORA SIDEBAR */
      html.aurora-sidebar[data-aurora="dark"] #sidebar,
      html.aurora-sidebar.aurora-sidebar-force-dark #sidebar {
        background: rgba(16, 17, 34, 0.82) !important;
        border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
        box-shadow: 4px 0 30px -6px rgba(0, 0, 0, 0.48) !important;
      }
      html.aurora-sidebar[data-aurora="dark"] #sidebar .sb-divider-line {
        background: rgba(255, 255, 255, 0.08) !important;
      }
      html.aurora-sidebar[data-aurora="dark"] #sidebar .sb-divider {
        background: rgba(255, 255, 255, 0.12) !important;
      }
      html.aurora-sidebar[data-aurora="dark"] #sidebar .sb-group-title {
        color: #6e7191 !important;
      }
      html.aurora-sidebar[data-aurora="dark"] #sidebar a.sidebar-item:not(.active-menu-item),
      html.aurora-sidebar[data-aurora="dark"] #sidebar .sb-accordion-trigger:not(.sb-accordion-active) {
        color: #cbd5e1 !important;
      }
      html.aurora-sidebar[data-aurora="dark"] #sidebar a.sidebar-item:not(.active-menu-item):hover,
      html.aurora-sidebar[data-aurora="dark"] #sidebar .sb-accordion-trigger:not(.sb-accordion-active):hover {
        background: rgba(139, 92, 246, 0.18) !important;
        color: #ddd6fe !important;
      }
      html.aurora-sidebar[data-aurora="dark"] #sidebar #sb-logo-full {
        border-radius: 8px !important;
        padding: 2px 6px !important;
        background: rgba(255, 255, 255, 0.94) !important;
      }
      html.aurora-sidebar[data-aurora="dark"] #sidebar #sb-logo-icon {
        background: transparent !important;
      }
      html.aurora-sidebar[data-aurora="dark"] #sidebar #btn-sidebar-toggle {
        color: #94a3b8 !important;
      }
      html.aurora-sidebar[data-aurora="dark"] #sidebar #btn-sidebar-toggle:hover {
        background: rgba(255, 255, 255, 0.08) !important;
        color: #c4b5fd !important;
      }
      html.aurora-sidebar[data-aurora="dark"] #sidebar #sb-profile-name,
      html.aurora-sidebar[data-aurora="dark"] #sidebar #sb-theme-label {
        color: #f1f5f9 !important;
      }
      html.aurora-sidebar[data-aurora="dark"] #sidebar #sb-profile-title,
      html.aurora-sidebar[data-aurora="dark"] #sidebar #btn-secret-api span {
        color: #94a3b8 !important;
      }
      html.aurora-sidebar[data-aurora="dark"] #sidebar #sb-theme-pill {
        background: rgba(139, 92, 246, 0.20) !important;
        color: #ddd6fe !important;
        border-color: rgba(167, 139, 250, 0.30) !important;
      }
      html.aurora-sidebar[data-aurora="dark"] #sidebar .sb-footer-item:hover,
      html.aurora-sidebar[data-aurora="dark"] #sidebar .sb-submenu a:hover {
        background: rgba(255, 255, 255, 0.07) !important;
      }
      html.aurora-sidebar[data-aurora="dark"] #sidebar .sb-submenu a {
        color: #94a3b8 !important;
      }
      html.aurora-sidebar[data-aurora="dark"] #sidebar .sb-footer-box {
        background: rgba(13, 15, 30, 0.58) !important;
        border-top-color: rgba(255, 255, 255, 0.08) !important;
      }

      /* === UNIVERSAL AURORA MESH GLASSMORPHISM (ALL 11 STANDARD WORKSPACE PAGES) === */
      html.aurora-ui {
        --aurora-glass-bg: rgba(255, 255, 255, 0.78);
        --aurora-glass-hover: rgba(255, 255, 255, 0.92);
        --aurora-glass-border: rgba(255, 255, 255, 0.88);
        --aurora-glass-ring: rgba(139, 92, 246, 0.11);
        --aurora-glass-shadow: 0 10px 30px -12px rgba(79, 70, 229, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.94);
        --aurora-header-bg: rgba(255, 255, 255, 0.62);
        --aurora-header-border: rgba(139, 92, 246, 0.12);
      }
      html.aurora-ui[data-aurora="dark"] {
        color-scheme: dark;
        --aurora-glass-bg: rgba(21, 23, 42, 0.74);
        --aurora-glass-hover: rgba(29, 32, 58, 0.88);
        --aurora-glass-border: rgba(255, 255, 255, 0.08);
        --aurora-glass-ring: rgba(139, 92, 246, 0.18);
        --aurora-glass-shadow: 0 14px 36px -14px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.06);
        --aurora-header-bg: rgba(16, 18, 35, 0.74);
        --aurora-header-border: rgba(255, 255, 255, 0.07);
      }

      html.aurora-ui body {
        background-color: #f6f5fc !important;
        background-image:
          radial-gradient(circle at 8% 12%, rgba(216, 180, 254, 0.34) 0%, transparent 42%),
          radial-gradient(circle at 92% 16%, rgba(254, 215, 170, 0.32) 0%, transparent 40%),
          radial-gradient(circle at 82% 86%, rgba(251, 207, 232, 0.28) 0%, transparent 44%),
          radial-gradient(circle at 18% 88%, rgba(224, 231, 255, 0.32) 0%, transparent 46%) !important;
        background-attachment: fixed !important;
        color: #18182b;
      }
      html.aurora-ui[data-aurora="dark"] body {
        background-color: #0b0d19 !important;
        background-image:
          radial-gradient(circle at 10% 10%, rgba(139, 92, 246, 0.20) 0%, transparent 42%),
          radial-gradient(circle at 90% 12%, rgba(236, 72, 153, 0.13) 0%, transparent 40%),
          radial-gradient(circle at 78% 86%, rgba(99, 102, 241, 0.14) 0%, transparent 46%),
          radial-gradient(circle at 22% 82%, rgba(56, 189, 248, 0.07) 0%, transparent 44%) !important;
        background-attachment: fixed !important;
        color: #f1f5f9 !important;
      }

      html.aurora-ui main.content-area,
      html.aurora-ui main.bg-slate-50,
      html.aurora-ui main.bg-slate-100,
      html.aurora-ui .content-area {
        background: transparent !important;
        background-color: transparent !important;
      }
      html.aurora-ui header {
        background: var(--aurora-header-bg) !important;
        backdrop-filter: blur(18px) saturate(150%) !important;
        -webkit-backdrop-filter: blur(18px) saturate(150%) !important;
        border-bottom: 1px solid var(--aurora-header-border) !important;
      }
      html.aurora-ui .saas-card,
      html.aurora-ui .tool-card,
      html.aurora-ui .feature-card,
      html.aurora-ui .stepper-container {
        background: var(--aurora-glass-bg) !important;
        backdrop-filter: blur(16px) saturate(140%) !important;
        -webkit-backdrop-filter: blur(16px) saturate(140%) !important;
        border: 1px solid var(--aurora-glass-border) !important;
        outline: 1px solid var(--aurora-glass-ring);
        box-shadow: var(--aurora-glass-shadow) !important;
        border-radius: 16px;
      }
      html.aurora-ui .stepper-container {
        padding: 16px 16px 14px 16px !important;
        align-items: flex-start !important;
      }
      html.aurora-ui .stepper-line,
      html.aurora-ui .stepper-line-fill {
        top: 31px !important;
      }
      html.aurora-ui .step-wrap {
        flex: 1 1 0% !important;
        min-width: 0 !important;
        width: auto !important;
        z-index: 3;
      }
      html.aurora-ui .step-label {
        position: static !important;
        transform: none !important;
        margin-top: 8px !important;
        display: block !important;
        line-height: 1.25 !important;
      }
      html.aurora-ui[data-aurora="dark"] .step-wrap.completed .step-circle {
        background: rgba(139, 92, 246, 0.24) !important;
        border-color: #a78bfa !important;
        color: #ede9fe !important;
      }
      html.aurora-ui[data-aurora="dark"] .step-wrap.completed .step-label {
        color: #c4b5fd !important;
      }
      html.aurora-ui .btn-primary {
        background: linear-gradient(95deg, #8b5cf6 0%, #7c3aed 100%) !important;
        border: 1px solid rgba(255, 255, 255, 0.18) !important;
        color: #ffffff !important;
        box-shadow: 0 6px 16px -4px rgba(124, 58, 237, 0.40) !important;
        border-radius: 10px;
      }
      html.aurora-ui .btn-primary:hover {
        background: linear-gradient(95deg, #7c3aed 0%, #6d28d9 100%) !important;
        box-shadow: 0 8px 20px -4px rgba(124, 58, 237, 0.50) !important;
      }

      /* DARK MODE WORKSPACE OVERRIDES (SHARED ACROSS PAGES) */
      html.aurora-ui[data-aurora="dark"] .text-slate-900,
      html.aurora-ui[data-aurora="dark"] .text-slate-800 { color: #f1f5f9 !important; }
      html.aurora-ui[data-aurora="dark"] .text-slate-700 { color: #cbd5e1 !important; }
      html.aurora-ui[data-aurora="dark"] .text-slate-600,
      html.aurora-ui[data-aurora="dark"] .text-slate-500 { color: #94a3b8 !important; }
      html.aurora-ui[data-aurora="dark"] .text-slate-400 { color: #7e8ba4 !important; }
      html.aurora-ui[data-aurora="dark"] .border-slate-200,
      html.aurora-ui[data-aurora="dark"] .border-slate-100,
      html.aurora-ui[data-aurora="dark"] .border-slate-300 { border-color: rgba(255, 255, 255, 0.09) !important; }
      html.aurora-ui[data-aurora="dark"] .divide-slate-100 > :not([hidden]) ~ :not([hidden]),
      html.aurora-ui[data-aurora="dark"] .divide-slate-200 > :not([hidden]) ~ :not([hidden]) { border-color: rgba(255, 255, 255, 0.08) !important; }

      html.aurora-ui[data-aurora="dark"] .bg-white:not(.aurora-keep-light):not(#memoPrintArea) {
        background-color: rgba(22, 24, 44, 0.84) !important;
      }
      html.aurora-ui[data-aurora="dark"] .bg-slate-50:not(main):not(#memoPrintArea *),
      html.aurora-ui[data-aurora="dark"] [class*="bg-slate-50/"]:not(main),
      html.aurora-ui[data-aurora="dark"] .saas-card-inner,
      html.aurora-ui[data-aurora="dark"] .vault-sidebar,
      html.aurora-ui[data-aurora="dark"] .vault-main,
      html.aurora-ui[data-aurora="dark"] .radar-container,
      html.aurora-ui[data-aurora="dark"] .radar-list-pane {
        background-color: rgba(18, 20, 38, 0.78) !important;
      }
      html.aurora-ui[data-aurora="dark"] .bg-slate-100:not(main) {
        background-color: rgba(255, 255, 255, 0.08) !important;
      }
      html.aurora-ui[data-aurora="dark"] [class*="bg-slate-100/"]:not(main),
      html.aurora-ui[data-aurora="dark"] #radarFeatureList {
        background-color: rgba(12, 14, 30, 0.62) !important;
      }
      html.aurora-ui[data-aurora="dark"] [class*="bg-slate-200/"]:not(main),
      html.aurora-ui[data-aurora="dark"] #workspace-tab-bar {
        background-color: rgba(15, 17, 34, 0.78) !important;
        border-color: rgba(255, 255, 255, 0.08) !important;
      }
      html.aurora-ui #pane-primary {
        background-color: rgba(255, 255, 255, 0.56) !important;
      }
      html.aurora-ui[data-aurora="dark"] #pane-primary {
        background-color: rgba(18, 20, 38, 0.62) !important;
      }
      html.aurora-ui[data-aurora="dark"] .resizer,
      html.aurora-ui[data-aurora="dark"] .resizer-divider {
        background-color: rgba(255, 255, 255, 0.08) !important;
      }
      html.aurora-ui[data-aurora="dark"] .bg-blue-50 { background-color: rgba(59, 130, 246, 0.14) !important; border-color: rgba(96, 165, 250, 0.25) !important; }
      html.aurora-ui[data-aurora="dark"] .bg-purple-50,
      html.aurora-ui[data-aurora="dark"] .bg-purple-100 { background-color: rgba(139, 92, 246, 0.18) !important; border-color: rgba(167, 139, 250, 0.32) !important; }
      html.aurora-ui[data-aurora="dark"] .bg-blue-100 { background-color: rgba(59, 130, 246, 0.18) !important; border-color: rgba(96, 165, 250, 0.32) !important; }
      html.aurora-ui[data-aurora="dark"] .bg-emerald-100 { background-color: rgba(16, 185, 129, 0.18) !important; border-color: rgba(52, 211, 153, 0.30) !important; }
      html.aurora-ui[data-aurora="dark"] .bg-rose-100 { background-color: rgba(244, 63, 94, 0.18) !important; border-color: rgba(251, 113, 133, 0.30) !important; }
      html.aurora-ui[data-aurora="dark"] .bg-amber-100 { background-color: rgba(245, 158, 11, 0.18) !important; border-color: rgba(251, 191, 36, 0.30) !important; }
      html.aurora-ui[data-aurora="dark"] .bg-emerald-50 { background-color: rgba(16, 185, 129, 0.14) !important; border-color: rgba(52, 211, 153, 0.25) !important; }
      html.aurora-ui[data-aurora="dark"] .bg-orange-50 { background-color: rgba(249, 115, 22, 0.15) !important; border-color: rgba(251, 146, 60, 0.25) !important; }
      html.aurora-ui[data-aurora="dark"] .bg-pink-50,
      html.aurora-ui[data-aurora="dark"] .bg-rose-50,
      html.aurora-ui[data-aurora="dark"] [class*="bg-rose-50/"] { background-color: rgba(244, 63, 94, 0.14) !important; border-color: rgba(251, 113, 133, 0.25) !important; }
      html.aurora-ui[data-aurora="dark"] .bg-amber-50 { background-color: rgba(245, 158, 11, 0.14) !important; border-color: rgba(251, 191, 36, 0.25) !important; }
      html.aurora-ui[data-aurora="dark"] .bg-indigo-50 { background-color: rgba(99, 102, 241, 0.15) !important; border-color: rgba(129, 140, 248, 0.28) !important; }
      html.aurora-ui[data-aurora="dark"] .bg-teal-50 { background-color: rgba(20, 184, 166, 0.15) !important; border-color: rgba(45, 212, 191, 0.28) !important; }
      html.aurora-ui[data-aurora="dark"] .bg-cyan-50 { background-color: rgba(6, 182, 212, 0.15) !important; border-color: rgba(34, 211, 238, 0.28) !important; }

      html.aurora-ui[data-aurora="dark"] .text-blue-700,
      html.aurora-ui[data-aurora="dark"] .text-blue-600 { color: #93c5fd !important; }
      html.aurora-ui[data-aurora="dark"] .text-purple-700,
      html.aurora-ui[data-aurora="dark"] .text-purple-600 { color: #c4b5fd !important; }
      html.aurora-ui[data-aurora="dark"] .text-emerald-700,
      html.aurora-ui[data-aurora="dark"] .text-emerald-600 { color: #6ee7b7 !important; }
      html.aurora-ui[data-aurora="dark"] .text-rose-700,
      html.aurora-ui[data-aurora="dark"] .text-rose-600 { color: #fda4af !important; }
      html.aurora-ui[data-aurora="dark"] .text-amber-700,
      html.aurora-ui[data-aurora="dark"] .text-amber-600 { color: #fcd34d !important; }
      html.aurora-ui[data-aurora="dark"] .text-cyan-700,
      html.aurora-ui[data-aurora="dark"] .text-cyan-600 { color: #67e8f9 !important; }
      html.aurora-ui[data-aurora="dark"] .text-orange-600,
      html.aurora-ui[data-aurora="dark"] .text-orange-500 { color: #fdba74 !important; }
      html.aurora-ui[data-aurora="dark"] .text-pink-600,
      html.aurora-ui[data-aurora="dark"] .text-pink-500 { color: #f9a8d4 !important; }
      html.aurora-ui[data-aurora="dark"] .text-teal-700,
      html.aurora-ui[data-aurora="dark"] .text-teal-600,
      html.aurora-ui[data-aurora="dark"] .text-teal-500 { color: #5eead4 !important; }
      html.aurora-ui[data-aurora="dark"] .form-label { color: #cbd5e1 !important; }

      html.aurora-ui[data-aurora="dark"] .btn-outline,
      html.aurora-ui[data-aurora="dark"] .copy-btn {
        background: rgba(255, 255, 255, 0.06) !important;
        color: #e2e8f0 !important;
        border-color: rgba(255, 255, 255, 0.14) !important;
      }
      html.aurora-ui[data-aurora="dark"] .btn-outline:hover,
      html.aurora-ui[data-aurora="dark"] .copy-btn:hover {
        background: rgba(139, 92, 246, 0.18) !important;
        border-color: rgba(167, 139, 250, 0.45) !important;
      }
      html.aurora-ui[data-aurora="dark"] .saas-input,
      html.aurora-ui[data-aurora="dark"] .text-area-code,
      html.aurora-ui[data-aurora="dark"] select,
      html.aurora-ui[data-aurora="dark"] input:not([type="checkbox"]):not([type="radio"]):not([type="color"]):not(#auroraHeaderSearch),
      html.aurora-ui[data-aurora="dark"] textarea:not(#stickyNoteText) {
        background-color: #16182c !important;
        border-color: rgba(148, 163, 184, 0.22) !important;
        color: #f1f5f9 !important;
      }
      html.aurora-ui[data-aurora="dark"] select option,
      html.aurora-ui[data-aurora="dark"] select optgroup {
        background-color: #16182c;
        color: #f1f5f9;
      }
      html.aurora-ui[data-aurora="dark"] table th {
        background: rgba(15, 17, 34, 0.75) !important;
        color: #94a3b8 !important;
        border-bottom-color: rgba(255, 255, 255, 0.08) !important;
      }
      html.aurora-ui[data-aurora="dark"] table td {
        border-bottom-color: rgba(255, 255, 255, 0.06) !important;
        color: #cbd5e1;
      }
      html.aurora-ui[data-aurora="dark"] tr.selected-row,
      html.aurora-ui[data-aurora="dark"] tbody tr:hover {
        background-color: rgba(139, 92, 246, 0.10) !important;
      }
      html.aurora-ui[data-aurora="dark"] main .sidebar-item,
      html.aurora-ui[data-aurora="dark"] .set-menu,
      html.aurora-ui[data-aurora="dark"] .tree-node,
      html.aurora-ui[data-aurora="dark"] .industry-pill,
      html.aurora-ui[data-aurora="dark"] .workspace-tab {
        color: #cbd5e1 !important;
      }
      html.aurora-ui[data-aurora="dark"] main .sidebar-item:not(.active):hover,
      html.aurora-ui[data-aurora="dark"] .set-menu:not(.active):hover,
      html.aurora-ui[data-aurora="dark"] .tree-node:not(.active):hover,
      html.aurora-ui[data-aurora="dark"] .industry-pill:not(.active):hover,
      html.aurora-ui[data-aurora="dark"] .workspace-tab:not(.active):hover {
        background: rgba(139, 92, 246, 0.12) !important;
        color: #f1f5f9 !important;
      }
      html.aurora-ui[data-aurora="dark"] main .sidebar-item.active,
      html.aurora-ui[data-aurora="dark"] .set-menu.active,
      html.aurora-ui[data-aurora="dark"] .tree-node.active,
      html.aurora-ui[data-aurora="dark"] .industry-pill.active,
      html.aurora-ui[data-aurora="dark"] .workspace-tab.active {
        background: rgba(139, 92, 246, 0.22) !important;
        border-color: rgba(167, 139, 250, 0.38) !important;
        color: #ede9fe !important;
      }
      html.aurora-ui[data-aurora="dark"] .feature-card.selected {
        background: linear-gradient(135deg, rgba(109, 40, 217, 0.30) 0%, rgba(24, 22, 48, 0.94) 100%) !important;
        border-color: #a78bfa !important;
        box-shadow: 0 0 0 1px rgba(167, 139, 250, 0.45), 0 10px 25px -5px rgba(109, 40, 217, 0.28) !important;
        color: #f1f5f9 !important;
      }
      html.aurora-ui[data-aurora="dark"] .step-wrap:not(.active):not(.completed) .step-circle {
        background-color: #1c1f38 !important;
        color: #94a3b8 !important;
        border-color: rgba(255, 255, 255, 0.14) !important;
      }
      html.aurora-ui[data-aurora="dark"] .step-wrap.active .step-circle {
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
        border-color: #a78bfa !important;
        color: #ffffff !important;
        box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.22) !important;
      }
      html.aurora-ui[data-aurora="dark"] .step-wrap.active .step-label {
        color: #f8fafc !important;
      }
      html.aurora-ui[data-aurora="dark"] .stepper-line {
        background-color: rgba(255, 255, 255, 0.12) !important;
      }
      html.aurora-ui[data-aurora="dark"] .modal-content,
      html.aurora-ui[data-aurora="dark"] .widget-panel,
      html.aurora-ui[data-aurora="dark"] .col-config-dropdown {
        background-color: #15172b !important;
        border-color: rgba(255, 255, 255, 0.10) !important;
      }

      /* LIGHT PAPER SAFETY: KEEP A4 PRINT MEMO, MINDMAP & WHITEBOARD CRISP */
      html.aurora-ui[data-aurora="dark"] #memoPrintArea,
      html.aurora-ui[data-aurora="dark"] #memoPrintArea .bg-white {
        background: #ffffff !important;
        background-color: #ffffff !important;
        color: #1e293b !important;
      }
      html.aurora-ui[data-aurora="dark"] #memoPrintArea .bg-slate-50,
      html.aurora-ui[data-aurora="dark"] #memoPrintArea .bg-slate-100 { background-color: #f8fafc !important; }
      html.aurora-ui[data-aurora="dark"] #memoPrintArea .text-slate-800,
      html.aurora-ui[data-aurora="dark"] #memoPrintArea .text-slate-900 { color: #1e293b !important; }
      html.aurora-ui[data-aurora="dark"] #memoPrintArea .text-slate-700 { color: #334155 !important; }
      html.aurora-ui[data-aurora="dark"] #memoPrintArea .text-slate-600,
      html.aurora-ui[data-aurora="dark"] #memoPrintArea .text-slate-500 { color: #475569 !important; }
      html.aurora-ui[data-aurora="dark"] #memoPrintArea .text-slate-400 { color: #94a3b8 !important; }
      html.aurora-ui[data-aurora="dark"] #memoPrintArea .border-slate-100 { border-color: #f1f5f9 !important; }
      html.aurora-ui[data-aurora="dark"] #memoPrintArea .border-slate-200 { border-color: #e2e8f0 !important; }
      html.aurora-ui[data-aurora="dark"] div:has(> #markmap-svg) {
        background-color: #f8fafc !important;
      }
      html.aurora-ui[data-aurora="dark"] #notesWidget #drawArea,
      html.aurora-ui[data-aurora="dark"] #notesWidget .bg-white.relative {
        background-color: #ffffff !important;
      }
      html.aurora-ui[data-aurora="dark"] #notesWidget #stickyNoteText {
        background-color: #fef9c3 !important;
        color: #1e293b !important;
      }
    `;
    document.head.appendChild(style);
  }

  function getCurrentUrl() {
    const file = getCurrentFile();
    const search = window.location.search || '';
    return file + search;
  }

  function isSidebarExpanded() {
    return localStorage.getItem('kv_sidebar_expanded') !== 'false';
  }

  function syncContentOffset(expanded) {
    document.documentElement.classList.toggle('sb-collapsed', !expanded);

    const toggleIcon = document.getElementById('icon-toggle');
    if (toggleIcon) {
      toggleIcon.classList.toggle('rotate-180', !expanded);
    }

    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 240);
  }

  window.toggleSidebar = function () {
    const willExpand = document.documentElement.classList.contains('sb-collapsed');
    syncContentOffset(willExpand);
    localStorage.setItem('kv_sidebar_expanded', String(willExpand));
  };

  // HÀM XỔ / ĐÓNG MENU CON CHUYÊN NGÀNH
  window.toggleSidebarAccordion = function (menuId, iconId) {
    const menu = document.getElementById(menuId);
    const icon = document.getElementById(iconId);
    if (!menu || !icon) return;

    if (menu.style.maxHeight && menu.style.maxHeight !== '0px') {
      menu.style.maxHeight = '0px';
      icon.style.transform = 'rotate(0deg)';
    } else {
      menu.style.maxHeight = menu.scrollHeight + 'px';
      icon.style.transform = 'rotate(90deg)';
    }
  };

  function buildSidebarDOM() {
    injectStyles();

    const expanded = isSidebarExpanded();
    document.documentElement.classList.toggle('sb-collapsed', !expanded);

    let sidebarEl = document.getElementById('sidebar');
    let isStandalonePage = false;
    const isFlexShell = !!document.querySelector('.flex.h-screen, .flex.h-full');

    if (!sidebarEl) {
      sidebarEl = document.createElement('aside');
      sidebarEl.id = 'sidebar';
      document.body.prepend(sidebarEl);
      isStandalonePage = true;
    } else {
      if (!isFlexShell) isStandalonePage = true;
    }

    if (isStandalonePage) {
      document.documentElement.classList.add('has-standalone-sidebar');
      sidebarEl.className = `fixed left-0 top-0 h-screen bg-white border-r border-slate-200 z-[9999] flex flex-col justify-between select-none`;
    } else {
      sidebarEl.className = `relative h-screen bg-white border-r border-slate-200 z-40 flex flex-col justify-between shrink-0 select-none`;
    }

    const currentFile = getCurrentFile();
    const currentUrl = getCurrentUrl();

    let profName = "L&D KiotViet";
    let profTitle = "Administrator";
    try {
      const prof = JSON.parse(localStorage.getItem('kv_trainer_profile'));
      if (prof) {
        profName = prof.name || profName;
        profTitle = prof.title || profTitle;
      }
    } catch (e) {}

    function esc(s) {
      return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    const safeProfName = esc(profName);
    const safeProfTitle = esc(profTitle);

    let html = `
      <div class="sb-surface flex flex-col w-full bg-white shrink-0">
        <div id="sb-header-row" class="sb-surface flex items-center justify-between h-14 w-full px-3 bg-white">
          <div id="btn-secret-logo" class="sb-surface cursor-pointer flex items-center overflow-hidden flex-1 bg-white select-none" title="Nhấp đúp: Mở System Architecture Workflow">
            <img id="sb-logo-full" src="${KIOTVIET_LOGO_URL}" alt="KiotViet" class="h-7 max-w-[130px] object-contain" />
            <img id="sb-logo-icon" src="${BONGHOA_LOGO_URL}" alt="KV" class="h-7 w-7 object-contain hidden" />
          </div>

          <button id="btn-sidebar-toggle" class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors flex-shrink-0" title="Đóng / Mở menu">
            <svg id="icon-toggle" class="w-4 h-4 transition-transform duration-200 ${expanded ? '' : 'rotate-180'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="sb-divider-line w-full h-[1px] bg-slate-200"></div>
    `;

    html += `<div id="sb-scroll-container" class="sb-surface flex-1 w-full overflow-x-hidden sb-scroll px-2 space-y-2 py-3 bg-white">`;

    SIDEBAR_STRUCTURE.forEach((sec) => {
      html += `<div class="space-y-0.5">`;
      html += `<div class="sb-group-title px-2.5 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">${sec.group}</div>`;
      html += `<div class="sb-divider w-6 h-[1px] bg-slate-200 mx-auto my-2 hidden"></div>`;

      sec.items.forEach((item) => {
        if (item.isAccordion) {
          // XỬ LÝ ACCORDION "CHUYÊN NGÀNH"
          const isCurrentActive = (currentFile === 'industry.html');
          html += `
            <div class="flex flex-col">
              <div onclick="window.toggleSidebarAccordion('sub-cn', 'icon-cn-arrow')" class="sidebar-item sb-accordion-trigger relative group flex items-center justify-between h-8 w-full px-2 rounded-lg cursor-pointer transition-colors duration-150 ${isCurrentActive ? 'sb-accordion-active bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-medium'}">
                <div class="flex items-center min-w-0">
                  ${item.icon}
                  <span class="sb-text ml-2.5 text-xs tracking-tight truncate">${item.label}</span>
                </div>
                <svg id="icon-cn-arrow" class="sb-arrow w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isCurrentActive ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
                
                <div class="sb-tooltip absolute left-16 ml-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-2xl whitespace-nowrap opacity-0 pointer-events-none transition-all duration-150 z-[100000] border border-slate-700">
                  ${item.label}
                </div>
              </div>

              <!-- SUBMENU XỔ RA KHI CLICK -->
              <div id="sub-cn" class="sb-submenu overflow-hidden transition-all duration-300 ease-in-out pl-8 flex flex-col gap-1 pr-2" style="max-height: ${isCurrentActive ? '120px' : '0px'};">
                ${item.subItems.map(sub => `
                  <a href="${sub.file}" class="py-1.5 px-2 text-[12px] font-semibold text-slate-500 ${sub.color} hover:bg-slate-50 rounded-md transition-colors flex items-center gap-2">
                    ${picon(sub.iconKey || 'bento', 15, 'sb-sub-svg')}
                    <span>${sub.label}</span>
                  </a>
                `).join('')}
              </div>
            </div>
          `;
        } else {
          let isActive = false;
          if (item.file.includes('?')) {
            isActive = (currentUrl === item.file);
          } else {
            isActive = (currentFile === item.file && !window.location.search.includes('tab=khoa-hoc'));
          }

          const itemClass = isActive
            ? 'bg-blue-50 text-blue-600 font-bold active-menu-item shadow-2xs'
            : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-medium';

          const radarDot = item.id === 'radar'
            ? `<span id="sidebar-alert-dot" class="w-2 h-2 rounded-full bg-rose-500 hidden ml-auto animate-pulse shrink-0"></span>`
            : '';

          html += `
            <a href="${item.file}" class="sidebar-item relative group flex items-center h-8 w-full px-2 rounded-lg transition-colors duration-150 ${itemClass}">
              ${item.icon}
              <span class="sb-text ml-2.5 text-xs tracking-tight truncate flex-1">${item.label}</span>
              ${radarDot}

              <div class="sb-tooltip absolute left-16 ml-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-2xl whitespace-nowrap opacity-0 pointer-events-none transition-all duration-150 z-[100000] border border-slate-700">
                ${item.label}
                ${isActive ? `<span class="block text-[10px] text-blue-400 font-normal">Đang mở</span>` : ''}
              </div>
            </a>
          `;
        }
      });
      html += `</div>`;
    });

    html += `</div>`;

    const showAuroraThemeToggle = document.documentElement.classList.contains('aurora-ui');

    html += `
      <div class="sb-surface sb-footer-box w-full px-2.5 py-2.5 flex flex-col gap-1 border-t border-slate-200 bg-white shrink-0">
        ${showAuroraThemeToggle ? `
        <button id="btn-sb-aurora-theme" type="button" onclick="window.toggleAuroraTheme && window.toggleAuroraTheme()" class="sb-footer-item relative cursor-pointer group flex items-center justify-between h-8 px-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors w-full text-left" title="Chuyển Giao diện Sáng / Tối (Aurora)">
          <span class="flex items-center min-w-0">
            <span id="sb-theme-icon" class="w-4 h-4 flex items-center justify-center flex-shrink-0 text-violet-600"></span>
            <span id="sb-theme-label" class="sb-text ml-2.5 text-[11px] font-semibold truncate">Giao diện Sáng</span>
          </span>
          <span id="sb-theme-pill" class="sb-text text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/70 shrink-0">Light</span>
          <div class="sb-tooltip absolute left-16 ml-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-2xl whitespace-nowrap opacity-0 pointer-events-none transition-all duration-150 z-[100000] border border-slate-700">
            Chuyển Sáng / Tối
          </div>
        </button>
        ` : ''}
        <div id="btn-secret-api" class="sb-footer-item cursor-pointer group flex items-center h-7 px-2 rounded-lg hover:bg-slate-50 transition-colors" title="Nhấp đúp: Mở System Architecture Workflow">
          <span class="flex h-2 w-2 relative flex-shrink-0">
            <span id="sb-api-ping" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-300 opacity-75"></span>
            <span id="sb-api-dot" class="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
          </span>
          <span id="sb-api-status" class="sb-text ml-2 text-[11px] font-semibold text-slate-500 truncate">Đang kiểm tra Cloud...</span>
        </div>

        <div id="btn-secret-avatar" class="sb-footer-item cursor-pointer group flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors" title="Nhấp đúp: Mở System Architecture Workflow">
          <div class="w-8 h-8 rounded-full ring-2 ring-blue-500/20 bg-blue-50/50 p-0.5 overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center">
            <img src="${BONGHOA_LOGO_URL}" alt="Bông Hoa Logo" class="w-full h-full object-contain" />
          </div>
          <div class="sb-text flex flex-col overflow-hidden text-left">
            <span class="text-xs font-bold text-slate-800 truncate" id="sb-profile-name">${safeProfName}</span>
            <span class="text-[10px] text-slate-400 font-medium truncate" id="sb-profile-title">${safeProfTitle}</span>
          </div>

          <div class="sb-tooltip absolute left-16 ml-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-md shadow-2xl whitespace-nowrap opacity-0 pointer-events-none transition-opacity z-[100000] border border-slate-700">
            <div class="font-bold text-slate-100" id="sb-tooltip-name">${safeProfName}</div>
            <div class="text-[10px] text-blue-400" id="sb-tooltip-title">${safeProfTitle}</div>
            <div class="mt-1 text-[9px] text-slate-400 border-t border-slate-700 pt-1">Nhấp đúp: Mở System Workflow</div>
          </div>
        </div>
      </div>
    `;

    sidebarEl.innerHTML = html;

    // Tự động kiểm tra cảnh báo Radar trên toàn hệ thống
    try {
      const radarRaw = localStorage.getItem('kv_product_radar');
      if (radarRaw) {
        const radarList = JSON.parse(radarRaw);
        if (Array.isArray(radarList)) {
          // Mục nhập tay: cùng công thức isUrgent của radar.html.
          // Mục lấy từ Cổng học tập (source 'portal'): chỉ báo khi là tính năng MỚI trong 14 ngày mà bạn chưa học
          // (nếu tính cả mục "Cập nhật" thì chấm đỏ sẽ sáng mãi vì có hàng trăm mục).
          const recentCut = Date.now() - 14 * 864e5;
          const isRecent = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || '')); return !!m && new Date(+m[1], +m[2] - 1, +m[3]).getTime() >= recentCut; };
          const hasUrgent = radarList.some(f => {
            if (!f) return false;
            if (f.source === 'portal') return f.type === 'NEW' && !f.cleared && isRecent(f.updateDate);
            return f.status === 'Đã Launching' && (!f.cleared || f.videoStatus === 'Cần quay lại gấp');
          });
          const dotEl = document.getElementById('sidebar-alert-dot');
          if (dotEl) dotEl.classList.toggle('hidden', !hasUrgent);
        }
      }
    } catch (e) {}

    const toggleBtn = document.getElementById('btn-sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.toggleSidebar();
      });
    }

    const activeEl = sidebarEl.querySelector('.active-menu-item');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }

    syncContentOffset(expanded);
    syncSidebarThemeUI();
    injectHeaderPageBadge();
    upgradeWorkspaceIcons();
    observeAuroraIcons();
    alignAuroraSteppers();
    requestAnimationFrame(alignAuroraSteppers);

    const openWorkflow = (e) => {
      e.preventDefault();
      window.location.href = 'system-workflow.html';
    };

    ['btn-secret-logo', 'btn-secret-avatar', 'btn-secret-api'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('dblclick', openWorkflow);
    });
    if (typeof window.refreshSidebarApiStatus === 'function') window.refreshSidebarApiStatus();
  }

  // Sprint 2: Trạng thái Cloud thật (trước đây luôn ghi cứng "Cloud API Active" kể cả khi lỗi)
  const API_STATUS_COLORS = {
    ok: 'bg-emerald-500', unauthorized: 'bg-amber-500', busy: 'bg-amber-500',
    error: 'bg-rose-500', offline: 'bg-rose-500', unknown: 'bg-slate-400'
  };
  window.refreshSidebarApiStatus = function () {
    const textEl = document.getElementById('sb-api-status');
    if (!textEl || typeof window.getApiStatus !== 'function') return;
    const s = window.getApiStatus();
    textEl.textContent = s.state === 'unknown' ? 'Đang kiểm tra Cloud...' : s.label;
    const box = document.getElementById('btn-secret-api');
    if (box) box.title = (s.message ? s.message + ' — ' : '') + 'Nhấp đúp: Mở System Architecture Workflow';
    const color = API_STATUS_COLORS[s.state] || API_STATUS_COLORS.unknown;
    ['sb-api-dot', 'sb-api-ping'].forEach(function (id) {
      const el = document.getElementById(id);
      if (!el) return;
      Object.keys(API_STATUS_COLORS).forEach(function (k) { el.classList.remove(API_STATUS_COLORS[k]); });
      el.classList.remove('bg-slate-300', 'bg-emerald-400');
      el.classList.add(color);
      if (id === 'sb-api-ping') el.style.display = (s.state === 'ok') ? '' : 'none';
    });
  };
  window.addEventListener('kv_api_status', function () { window.refreshSidebarApiStatus(); });
  const PAGE_BADGE_MAP = {
    'spcb.html': 'cube',
    'thuehkd.html': 'tax',
    'kv1.html': 'monitor',
    'radar.html': 'radar',
    'vault.html': 'vault',
    'tools.html': 'bolt',
    'import-studio.html': 'sheet',
    'settings.html': 'gear',
    'knowledge.html': 'mindmap',
    'knowledge-hub.html': 'database'
  };

  function resolvePageBadgeKey() {
    const file = getCurrentFile();
    if (file === 'industry.html') {
      const q = (window.location.search || '').toUpperCase();
      if (q.includes('FNB')) return 'fnb';
      if (q.includes('SALON')) return 'salon';
      if (q.includes('HOTEL')) return 'hotel';
      return 'books';
    }
    return PAGE_BADGE_MAP[file] || '';
  }

  function injectHeaderPageBadge() {
    if (!document.documentElement.classList.contains('aurora-ui')) return;
    if (document.querySelector('[data-aurora-badge="1"]')) return;
    const file = getCurrentFile();
    if (file === 'index.html' || file === 'knowledge-hub.html') return;
    const key = resolvePageBadgeKey();
    if (!key) return;

    const badge = document.createElement('span');
    badge.className = 'aurora-page-badge';
    badge.setAttribute('data-aurora-badge', '1');
    badge.innerHTML = picon(key, 21);

    if (file === 'tools.html') {
      const h2 = document.querySelector('main h2');
      if (h2 && !h2.parentElement.querySelector('[data-aurora-badge="1"]')) {
        h2.classList.add('flex', 'items-center', 'gap-3');
        h2.prepend(badge);
      }
      return;
    }

    const header = document.querySelector('header');
    const h1 = header ? header.querySelector('h1') : null;
    if (!h1) return;

    const innerIcon = h1.querySelector('i');
    if (innerIcon && !innerIcon.id) innerIcon.remove();

    const parent = h1.parentElement;
    if (parent && parent.classList.contains('flex')) {
      parent.insertBefore(badge, h1);
    } else if (parent && parent.parentElement && parent.parentElement.classList.contains('flex')) {
      parent.parentElement.insertBefore(badge, parent);
    } else {
      h1.classList.add('flex', 'items-center', 'gap-3');
      h1.prepend(badge);
    }
  }

  const FA_PLAYFUL_MAP = [
    ['fa-box-open', 'cube'], ['fa-cube', 'cube'],
    ['fa-file-invoice-dollar', 'tax'], ['fa-receipt', 'tax'],
    ['fa-desktop', 'monitor'], ['fa-tv', 'monitor'],
    ['fa-terminal', 'terminal'], ['fa-laptop-code', 'terminal'],
    ['fa-code', 'code'],
    ['fa-satellite-dish', 'radar'],
    ['fa-project-diagram', 'mindmap'], ['fa-sitemap', 'mindmap'],
    ['fa-folder-open', 'vault'], ['fa-folder-plus', 'vault'], ['fa-folder', 'vault'], ['fa-archive', 'vault'],
    ['fa-bolt', 'bolt'], ['fa-magic', 'bolt'],
    ['fa-database', 'database'], ['fa-server', 'database'],
    ['fa-cogs', 'gear'], ['fa-cog', 'gear'], ['fa-sliders-h', 'gear'],
    ['fa-comments', 'chat'], ['fa-comment-dots', 'chat'],
    ['fa-chalkboard-teacher', 'classboard'], ['fa-chalkboard', 'classboard'],
    ['fa-tasks', 'checklist'], ['fa-list-check', 'checklist'], ['fa-clipboard-list', 'checklist'], ['fa-clipboard-check', 'checklist'], ['fa-check-double', 'checklist'],
    ['fa-medal', 'medal'], ['fa-award', 'medal'], ['fa-trophy', 'medal'], ['fa-graduation-cap', 'medal'],
    ['fa-cloud-upload-alt', 'rocket'], ['fa-rocket', 'rocket'], ['fa-paper-plane', 'rocket'],
    ['fa-envelope', 'envelope'], ['fa-envelope-open-text', 'envelope'],
    ['fa-bell', 'bell'],
    ['fa-users', 'users'], ['fa-user-circle', 'users'], ['fa-user-tie', 'users'],
    ['fa-calendar-alt', 'calendar'], ['fa-calendar-check', 'calendar'], ['fa-calendar', 'calendar'],
    ['fa-gift', 'gift'],
    ['fa-link', 'link'],
    ['fa-exclamation-triangle', 'alert'], ['fa-exclamation-circle', 'alert'],
    ['fa-filter', 'filter'],
    ['fa-chart-bar', 'chart'], ['fa-chart-line', 'chart'], ['fa-chart-pie', 'chart'], ['fa-poll-h', 'chart'],
    ['fa-utensils', 'fnb'], ['fa-coffee', 'fnb'],
    ['fa-spa', 'salon'], ['fa-cut', 'salon'],
    ['fa-hotel', 'hotel'],
    ['fa-book-open', 'books'], ['fa-book', 'books'],
    ['fa-th-large', 'bento'], ['fa-layer-group', 'bento'], ['fa-gauge-high', 'dashboard'],
    ['fa-robot', 'robot'],
    ['fa-file-excel', 'sheet']
  ];

  const PLAYFUL_ICON_SKIP = /fa-(spin|spinner|circle-notch|bars|arrow-left|arrow-right|chevron-|times|xmark|plus|save|copy|circle\b|search|magnifying-glass|pen\b)/;

  function mapFaToPlayfulKey(iEl) {
    const cls = String(iEl.className || '');
    if (!cls || PLAYFUL_ICON_SKIP.test(cls)) return '';
    if (cls.includes('fa-trash') && iEl.closest('.set-menu')) return 'alert';
    for (let idx = 0; idx < FA_PLAYFUL_MAP.length; idx++) {
      if (cls.includes(FA_PLAYFUL_MAP[idx][0])) return FA_PLAYFUL_MAP[idx][1];
    }
    return '';
  }

  function resolveIconSize(iEl) {
    if (iEl.closest('.tool-icon-box, .w-12.h-12')) return 26;
    if (iEl.closest('.w-10.h-10, .aurora-greet-badge')) return 23;
    if (iEl.closest('.w-9.h-9')) return 20;
    if (iEl.closest('main .sidebar-item, main .set-menu, .floating-tool button')) return 19;
    if (iEl.closest('h2, h3, h4')) return 18;
    if (iEl.closest('.tree-node')) return 17;
    return 16;
  }

  const PLAYFUL_ICON_SELECTORS = [
    '.aurora-greet-badge i',
    'main .sidebar-item i',
    'main .set-menu i',
    '.tree-node i',
    '.tool-icon-box i',
    '.saas-card .w-12.h-12 i',
    '.saas-card .w-10.h-10 i',
    '.saas-card .w-9.h-9 i',
    '.saas-card h2 i, .saas-card h3 i, .saas-card h4 i',
    'main h2 i, main h3 i, main h4 i',
    '#btn-finalize i',
    '#toolsGrid i',
    '.btn-outline i, .btn-primary i, .aurora-cta-btn i, header button i',
    '#hub-sidebar a i, #hub-sidebar button i, #section-icon i',
    '.floating-tool button i'
  ].join(', ');

  function upgradeWorkspaceIcons(root) {
    if (!document.documentElement.classList.contains('aurora-ui')) return;
    const scope = root && root.querySelectorAll ? root : document;
    const nodes = scope.querySelectorAll(PLAYFUL_ICON_SELECTORS);
    nodes.forEach((iEl) => {
      if (!iEl || !iEl.parentNode || iEl.id) return;
      if (iEl.closest('#sidebar, table, thead, tbody, .v-table, [data-aurora-badge="1"]')) return;
      const key = mapFaToPlayfulKey(iEl);
      if (!key) return;
      const px = resolveIconSize(iEl);
      const wrap = document.createElement('span');
      wrap.innerHTML = picon(key, px);
      const pNode = wrap.firstElementChild;
      if (pNode) iEl.parentNode.replaceChild(pNode, iEl);
    });
  }

  function observeAuroraIcons() {
    if (!document.documentElement.classList.contains('aurora-ui') || !document.body) return;
    let queued = false;
    const obs = new MutationObserver((mutations) => {
      let hasCandidate = false;
      for (let i = 0; i < mutations.length; i++) {
        const added = mutations[i].addedNodes;
        for (let j = 0; j < added.length; j++) {
          const n = added[j];
          if (n.nodeType === 1 && !n.classList.contains('aurora-picon') && !n.hasAttribute('data-aurora-badge')) {
            if (n.tagName === 'I' || (n.querySelector && n.querySelector('i'))) {
              hasCandidate = true;
              break;
            }
          }
        }
        if (hasCandidate) break;
      }
      if (!hasCandidate || queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        upgradeWorkspaceIcons();
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function alignAuroraSteppers() {
    const steppers = document.querySelectorAll('.stepper-container');
    steppers.forEach((box) => {
      if (typeof ResizeObserver === 'function' && !box.dataset.stepperObserved) {
        box.dataset.stepperObserved = '1';
        const ro = new ResizeObserver(() => alignAuroraSteppers());
        ro.observe(box);
      }
      const circles = box.querySelectorAll('.step-circle');
      if (circles.length < 2) return;
      const br = box.getBoundingClientRect();
      if (!br.width) return;
      const firstR = circles[0].getBoundingClientRect();
      const lastR = circles[circles.length - 1].getBoundingClientRect();
      const leftPx = (firstR.left - br.left) + firstR.width / 2;
      const rightPx = (br.right - lastR.right) + lastR.width / 2;
      const spanPx = Math.max(0, (lastR.left + lastR.width / 2) - (firstR.left + firstR.width / 2));
      const line = box.querySelector('.stepper-line');
      const fill = box.querySelector('.stepper-line-fill');
      if (line) {
        line.style.left = leftPx + 'px';
        line.style.right = rightPx + 'px';
      }
      if (fill) {
        fill.style.left = leftPx + 'px';
        fill.style.maxWidth = spanPx + 'px';
      }
    });
  }

  window.refreshSidebarProfile = function () {
    try {
      const prof = JSON.parse(localStorage.getItem('kv_trainer_profile'));
      if (!prof) return;
      const nameEl = document.getElementById('sb-profile-name');
      const titleEl = document.getElementById('sb-profile-title');
      const tipNameEl = document.getElementById('sb-tooltip-name');
      const tipTitleEl = document.getElementById('sb-tooltip-title');
      if (nameEl) nameEl.textContent = prof.name || 'L&D KiotViet';
      if (titleEl) titleEl.textContent = prof.title || 'Administrator';
      if (tipNameEl) tipNameEl.textContent = prof.name || 'L&D KiotViet';
      if (tipTitleEl) tipTitleEl.textContent = prof.title || 'Administrator';
    } catch (e) {}
  };

  function syncSidebarThemeUI() {
    var mode = window.getAuroraTheme();
    var isDark = mode === 'dark';
    var iconEl = document.getElementById('sb-theme-icon');
    var labelEl = document.getElementById('sb-theme-label');
    var pillEl = document.getElementById('sb-theme-pill');
    if (iconEl) {
      iconEl.innerHTML = picon(isDark ? 'sun' : 'moon', 18, 'sb-nav-svg');
    }
    if (labelEl) labelEl.textContent = isDark ? 'Giao diện Tối' : 'Giao diện Sáng';
    if (pillEl) pillEl.textContent = isDark ? 'Dark' : 'Light';
  }

  window.getAuroraTheme = function () {
    try {
      var saved = localStorage.getItem('kv_aurora_theme_mode');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    return document.documentElement.getAttribute('data-aurora') === 'dark' ? 'dark' : 'light';
  };

  window.setAuroraTheme = function (mode) {
    var next = mode === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-aurora', next);
    try {
      localStorage.setItem('kv_aurora_theme_mode', next);
    } catch (e) {}
    syncSidebarThemeUI();
    try {
      window.dispatchEvent(new CustomEvent('aurora-theme-changed', { detail: { mode: next } }));
    } catch (e) {}
    return next;
  };

  window.toggleAuroraTheme = function () {
    var current = document.documentElement.getAttribute('data-aurora') || window.getAuroraTheme();
    return window.setAuroraTheme(current === 'dark' ? 'light' : 'dark');
  };

  injectFavicon();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildSidebarDOM);
  } else {
    buildSidebarDOM();
  }
})();
/* =====================================================================================
 * CHẾ ĐỘ ĐIỆN THOẠI (< 768px) - 27/11/2026
 * Trước đây sidebar luôn chiếm 1 cột (64-240px) làm nội dung bị ép, không xem được trên điện thoại.
 * Trên điện thoại: sidebar ẩn hẳn, trượt ra dạng ngăn kéo khi bấm nút menu (nút ☰ có sẵn trên trang
 * hoặc nút tròn góc dưới trái), bấm ra ngoài / chọn mục thì tự đóng. Máy tính: giữ nguyên như cũ.
 * ===================================================================================== */
(function () {
  'use strict';
  if (window.__kvMobileShell) return;
  window.__kvMobileShell = true;
  const MQ = window.matchMedia('(max-width: 767px)');
  const html = document.documentElement;

  const css = `
  @media (max-width: 767px) {
    #sidebar { position: fixed !important; top: 0; bottom: 0; left: 0; z-index: 90 !important;
      width: 264px !important; min-width: 264px !important; max-width: 86vw;
      transition: transform .25s ease !important; }
    html:not(.kv-nav-open) body #sidebar { transform: translateX(-105%) !important; }
    html.kv-nav-open body #sidebar { transform: none !important; box-shadow: 0 0 40px rgba(0,0,0,.35) !important; }
    html.kv-nav-open::after { content: ''; position: fixed; inset: 0; background: rgba(10,10,25,.42); z-index: 85; }
    html body #kv-mobile-menu { display: flex; }
    body { overflow-x: hidden; }
    /* Trang độc lập (Cài đặt, Công cụ...): bỏ lề trái dành cho sidebar khi sidebar đã là ngăn kéo */
    html.has-standalone-sidebar:not(.kv-no-such) body { margin-left: 0 !important; width: 100% !important;
      max-width: 100% !important; min-width: 0 !important; }
    /* Thanh "Kỳ báo cáo" trên Dashboard: cho xuống dòng thay vì tràn ngang */
    div:has(> * > #reportTimeRange) > * { flex-wrap: wrap; min-width: 0; max-width: 100%; }
    div:has(> #reportTimeRange) > span:first-child { white-space: nowrap; }
    #reportTimeRange { max-width: 100%; }
  }
  #kv-mobile-menu { display: none; position: fixed; left: 14px; bottom: 18px; z-index: 84; width: 46px; height: 46px;
    border-radius: 999px; align-items: center; justify-content: center; border: 0; color: #fff; font-size: 17px;
    background: linear-gradient(135deg, #6d5ae6, #2563eb); box-shadow: 0 8px 22px -6px rgba(60,50,200,.55); }`;

  function addCss() {
    if (document.getElementById('kv-mobile-css')) return;
    const st = document.createElement('style');
    st.id = 'kv-mobile-css';
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }

  const isMobile = () => MQ.matches;
  // Mở ngăn kéo: tạm bỏ chế độ thu gọn để hiện đủ chữ; đóng lại thì trả về như cũ (không đổi lựa chọn trên máy tính)
  let restoreCollapsed = false;
  function openNav(open) {
    if (open && !html.classList.contains('kv-nav-open')) {
      restoreCollapsed = html.classList.contains('sb-collapsed');
      html.classList.remove('sb-collapsed');
    } else if (!open && html.classList.contains('kv-nav-open') && restoreCollapsed) {
      html.classList.add('sb-collapsed');
    }
    html.classList.toggle('kv-nav-open', !!open);
  }

  // Nút ☰ có sẵn trên trang (gọi toggleSidebar) -> trên điện thoại mở/đóng ngăn kéo thay vì thu gọn
  function wrapToggle() {
    const orig = window.toggleSidebar;
    if (typeof orig !== 'function' || orig.__kvMobile) return;
    const wrapped = function () {
      if (isMobile()) { openNav(!html.classList.contains('kv-nav-open')); return; }
      return orig.apply(this, arguments);
    };
    wrapped.__kvMobile = true;
    window.toggleSidebar = wrapped;
  }

  function addFloatingButton() {
    if (document.getElementById('kv-mobile-menu') || !document.body) return;
    // Trang đã có nút ☰ ở header thì không cần nút nổi
    const hasHeaderToggle = [...document.querySelectorAll('[onclick*="toggleSidebar"]')].some(el => !el.closest('#sidebar'));
    if (hasHeaderToggle) return;
    const btn = document.createElement('button');
    btn.id = 'kv-mobile-menu';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Mở menu');
    btn.innerHTML = '<i class="fas fa-bars"></i>';
    btn.addEventListener('click', (e) => { e.stopPropagation(); openNav(!html.classList.contains('kv-nav-open')); });
    document.body.appendChild(btn);
  }

  function init() {
    addCss();
    wrapToggle();
    addFloatingButton();
    document.addEventListener('click', (e) => {
      if (!isMobile() || !html.classList.contains('kv-nav-open')) return;
      const sb = document.getElementById('sidebar');
      if (e.target.closest('#kv-mobile-menu') || e.target.closest('[onclick*="toggleSidebar"]')) return;
      if (sb && sb.contains(e.target)) {
        if (e.target.closest('a[href]')) openNav(false); // Chọn trang -> đóng
        return;
      }
      openNav(false); // Bấm ra ngoài -> đóng
    }, true);
    MQ.addEventListener ? MQ.addEventListener('change', () => openNav(false)) : MQ.addListener(() => openNav(false));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.addEventListener('load', wrapToggle);
})();
