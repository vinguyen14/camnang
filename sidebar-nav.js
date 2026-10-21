/**
 * TRAINER OS v5.5 ENTERPRISE - UNIVERSAL SIDEBAR & LAYOUT PUSHER
 * - Tự động đẩy lề (Universal Layout Pusher): Chống đè 100% nội dung trên mọi file
 * - Header 64px thông minh: Căn giữa Logo KiotViet, triệt tiêu lỗi chém cụt logo
 * - Danh mục & Tên chuẩn 100% Ảnh 1: Sơ đồ Vận hành -> knowledge.html
 * - Avatar: Logo Vie (https://i.postimg.cc/13fmPWCq/Logo-Vie.png)
 * - Trang ẩn: Nhấp đúp Logo/Avatar/API mở system-workflow.html
 */

(function () {
  'use strict';

  // 1. TỰ ĐỘNG TIÊM FAVICON LOGO VIE VÀO TAB TRÌNH DUYỆT
  function injectVieFavicon() {
    const vieFaviconUrl = 'https://i.postimg.cc/13fmPWCq/Logo-Vie.png';
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'shortcut icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = vieFaviconUrl;
  }

  // 2. DANH MỤC 100% CHUẨN XÁC TỪ ẢNH 1
  const SIDEBAR_STRUCTURE = [
    {
      group: 'TỔNG QUAN',
      items: [
        {
          id: 'index',
          file: 'index.html',
          label: 'Bảng điều khiển',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/></svg>`
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
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`
        },
        {
          id: 'thuehkd',
          file: 'thuehkd.html',
          label: 'Chuyên đề Thuế',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>`
        },
        {
          id: 'industry',
          file: 'industry.html',
          label: 'Chuyên ngành',
          hasArrow: true,
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>`
        },
        {
          id: 'kv1',
          file: 'kv1.html',
          label: 'Tất cả khóa học',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>`
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
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`
        },
        {
          id: 'radar',
          file: 'radar.html',
          label: 'Radar Sản Phẩm Mới',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke-width="1.8"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 3v9l6 3"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`
        },
        {
          id: 'knowledge',
          file: 'knowledge.html',
          label: 'Sơ đồ Vận hành',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 12l5 5L22 7M2 12l5 5L12 12"/></svg>`
        },
        {
          id: 'vault',
          file: 'vault.html',
          label: 'Kho Lưu Trữ Vault',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>`
        },
        {
          id: 'tools',
          file: 'tools.html',
          label: 'Runner Tools',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`
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
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3" stroke-width="1.8"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`
        },
        {
          id: 'settings',
          file: 'settings.html',
          label: 'Cài đặt Hệ thống',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`
        }
      ]
    }
  ];

  // 3. TIÊM CSS HIỆU NĂNG CAO & GIAO DIỆN HEADER COLLAPSED CHUẨN
  function injectStyles() {
    if (document.getElementById('sidebar-fast-styles')) return;
    const style = document.createElement('style');
    style.id = 'sidebar-fast-styles';
    style.innerHTML = `
      #sidebar {
        transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 1px 0 3px 0 rgba(0, 0, 0, 0.05);
      }
      #sidebar.is-collapsed {
        width: 4rem !important; /* 64px */
      }
      #sidebar:not(.is-collapsed) {
        width: 15rem !important; /* 240px */
      }
      /* Header Switching thông minh: Chống cắt xén Logo KiotViet */
      #sidebar.is-collapsed .sb-header-expanded {
        display: none !important;
      }
      #sidebar:not(.is-collapsed) .sb-header-collapsed {
        display: none !important;
      }
      #sidebar.is-collapsed .sb-text,
      #sidebar.is-collapsed .sb-group-title,
      #sidebar.is-collapsed .sb-arrow {
        display: none !important;
      }
      #sidebar:not(.is-collapsed) .sb-divider {
        display: none !important;
      }
      #sidebar.is-collapsed .sb-divider {
        display: block !important;
      }
      #sidebar.is-collapsed .sb-scroll {
        overflow-y: hidden !important;
      }
      #sidebar:not(.is-collapsed) .sb-scroll {
        overflow-y: auto !important;
      }
      /* Tooltip nổi chuẩn z-[100000] */
      #sidebar.is-collapsed .group:hover .sb-tooltip {
        opacity: 1 !important;
        pointer-events: auto !important;
      }
      #sidebar:not(.is-collapsed) .sb-tooltip {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function getCurrentFile() {
    const raw = window.location.pathname.split('/').pop() || 'index.html';
    return raw.split('?')[0].split('#')[0] || 'index.html';
  }

  function isSidebarExpanded() {
    return localStorage.getItem('kv_sidebar_expanded') !== 'false'; // Mặc định mở
  }

  // 4. THUẬT TOÁN ĐẨY LỀ ĐỘNG TOÀN NĂNG (UNIVERSAL LAYOUT PUSHER)
  // Quét tìm phần tử giao diện chính và ép lề chuẩn, không bao giờ bị đè chữ
  function syncContentOffset(expanded) {
    const sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) return;

    // Tìm phần tử nội dung liền kề
    let contentEl = sidebarEl.nextElementSibling;
    while (contentEl && (contentEl.tagName === 'SCRIPT' || contentEl.tagName === 'STYLE' || contentEl.id === 'sop-drawer-root' || contentEl.id === 'report-memo-root')) {
      contentEl = contentEl.nextElementSibling;
    }
    if (!contentEl) {
      contentEl = document.querySelector('main') || document.querySelector('#main-content') || document.querySelector('.flex-1') || document.querySelector('#app');
    }

    const marginWidth = expanded ? '15rem' : '4rem'; // 240px hoặc 64px

    if (contentEl) {
      contentEl.style.setProperty('transition', 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1), width 0.2s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 'important');
      contentEl.style.setProperty('margin-left', marginWidth, 'important');
      contentEl.style.setProperty('width', `calc(100vw - ${marginWidth})`, 'important');
      contentEl.style.setProperty('max-width', `calc(100vw - ${marginWidth})`, 'important');
      contentEl.style.setProperty('box-sizing', 'border-box', 'important');
    }

    // Đánh dấu class trên body để đồng bộ CSS toàn cục
    document.body.classList.toggle('sb-expanded', expanded);
    document.body.classList.toggle('sb-collapsed', !expanded);
  }

  // 5. RENDER DOM SIDEBAR DUY NHẤT 1 LẦN
  function buildSidebarDOM() {
    injectStyles();

    let sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) sidebarEl = document.querySelector('aside');
    if (!sidebarEl) {
      sidebarEl = document.createElement('aside');
      sidebarEl.id = 'sidebar';
      document.body.prepend(sidebarEl);
    }

    const currentFile = getCurrentFile();
    const expanded = isSidebarExpanded();

    sidebarEl.className = `fixed left-0 top-0 h-screen bg-white border-r border-slate-200 z-50 flex flex-col justify-between py-3 select-none ${
      expanded ? '' : 'is-collapsed'
    }`;

    // SVG Logo KiotViet chính hãng chuẩn vector (Giọt nước Xanh dương + Cánh cung Xanh lá)
    const kiotVietLogoSVG = `
      <svg class="w-8 h-8 flex-shrink-0" viewBox="0 0 36 36" fill="none">
        <path d="M7 18C7 11.925 11.925 7 18 7C18 13.075 13.075 18 7 18Z" fill="#0070F3"/>
        <path d="M7 18C7 24.075 11.925 29 18 29C18 22.925 13.075 18 7 18Z" fill="#0070F3"/>
        <path d="M19 8C24.523 8 29 12.477 29 18C23.477 18 19 13.523 19 8Z" fill="#22C55E"/>
      </svg>
    `;

    // 5.1 HEADER TÁCH BIỆT: MỞ RỘNG (DÀN NGANG) / THU GỌN (CĂN GIỮA ĐẸP MẮT)
    let html = `
      <div class="flex flex-col w-full px-2.5">
        <!-- Khi Mở Rộng: Logo + Text KiotViet + Nút << -->
        <div class="sb-header-expanded flex items-center justify-between h-10 w-full px-1">
          <div id="btn-secret-logo-exp" class="cursor-pointer group flex items-center gap-2.5 overflow-hidden" title="Nhấp đúp: Mở System Workflow">
            ${kiotVietLogoSVG}
            <span class="font-black text-slate-800 text-[19px] tracking-tight">KiotViet</span>
          </div>
          <button class="btn-toggle-action p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors" title="Thu gọn menu">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
          </button>
        </div>

        <!-- Khi Thu Gọn: Logo KiotViet căn giữa hoàn hảo + Nút >> nhỏ gọn ngay dưới -->
        <div class="sb-header-collapsed flex flex-col items-center justify-center w-full gap-1 pt-0.5">
          <div id="btn-secret-logo-col" class="cursor-pointer p-0.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center" title="Nhấp đúp: Mở System Workflow">
            ${kiotVietLogoSVG}
          </div>
          <button class="btn-toggle-action p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors" title="Mở rộng menu">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
      <div class="w-full h-[1px] bg-slate-100 my-2"></div>
    `;

    // 5.2 BODY: DANH MỤC MENU CHUẨN ẢNH 1
    html += `<div class="flex-1 w-full overflow-x-hidden sb-scroll px-2.5 space-y-2.5 custom-scrollbar">`;

    SIDEBAR_STRUCTURE.forEach((sec) => {
      html += `<div class="space-y-0.5">`;
      html += `<div class="sb-group-title px-2.5 pt-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">${sec.group}</div>`;
      html += `<div class="sb-divider w-7 h-[1px] bg-slate-200/80 mx-auto my-2 hidden"></div>`;

      sec.items.forEach((item) => {
        const isActive = (currentFile === item.file);
        const itemClass = isActive
          ? 'bg-blue-50 text-blue-600 font-bold'
          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-medium';

        html += `
          <a href="${item.file}" class="sidebar-item relative group flex items-center h-10 w-full px-2.5 rounded-xl transition-colors duration-150 ${itemClass}">
            ${item.icon}
            <span class="sb-text ml-3 text-xs tracking-tight truncate flex-1">${item.label}</span>
            ${item.hasArrow ? `<svg class="sb-arrow w-4 h-4 text-slate-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>` : ''}

            <!-- Tooltip khi Sidebar thu gọn -->
            <div class="sb-tooltip absolute left-16 ml-2 px-3 py-1.5 bg-slate-900/95 text-white text-xs font-semibold rounded-md shadow-2xl whitespace-nowrap opacity-0 pointer-events-none transition-all duration-150 z-[100000] border border-slate-700">
              ${item.label}
              ${isActive ? `<span class="block text-[10px] text-blue-400 font-normal">Đang mở</span>` : ''}
            </div>
          </a>
        `;
      });
      html += `</div>`;
    });

    html += `</div>`;

    // 5.3 BOTTOM: CLOUD API ACTIVE + AVATAR LOGO VIE (Nhấp đúp mở Workflow ẩn)
    html += `
      <div class="w-full px-2.5 pt-1.5 flex flex-col gap-1.5">
        <div class="w-full h-[1px] bg-slate-100"></div>

        <!-- Trạng thái Cloud API -->
        <div id="btn-secret-api" class="cursor-pointer group flex items-center h-8 px-2 rounded-lg hover:bg-slate-50 transition-colors" title="Nhấp đúp: Mở System Workflow">
          <span class="flex h-2 w-2 relative flex-shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="sb-text ml-2.5 text-[11px] font-semibold text-slate-500 truncate">Cloud API Active</span>
        </div>

        <!-- Avatar Người Dùng: Chuẩn LOGO VIE (Ảnh 1) -->
        <div id="btn-secret-avatar" class="cursor-pointer group flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-50 transition-colors" title="Nhấp đúp: Mở System Workflow">
          <div class="w-9 h-9 rounded-full ring-2 ring-blue-500/20 bg-blue-50/50 p-1 overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center">
            <img src="https://i.postimg.cc/13fmPWCq/Logo-Vie.png" alt="Vie Logo" class="w-full h-full object-contain" />
          </div>
          <div class="sb-text flex flex-col overflow-hidden text-left">
            <span class="text-xs font-bold text-slate-800 truncate">L&D KiotViet</span>
            <span class="text-[10px] text-slate-400 font-medium truncate">Administrator</span>
          </div>

          <!-- Tooltip Profile khi Thu gọn -->
          <div class="sb-tooltip absolute left-16 ml-2 px-3 py-2 bg-slate-900/95 text-white text-xs rounded-md shadow-2xl whitespace-nowrap opacity-0 pointer-events-none transition-opacity z-[100000] border border-slate-700">
            <div class="font-bold text-slate-100">L&D KiotViet</div>
            <div class="text-[10px] text-blue-400">Administrator</div>
            <div class="mt-1 text-[9px] text-slate-400 border-t border-slate-700 pt-1">Nhấp đúp: Mở System Workflow</div>
          </div>
        </div>
      </div>
    `;

    sidebarEl.innerHTML = html;

    // GẮN SỰ KIỆN TOGGLE CHO CẢ 2 NÚT THU GỌN VÀ MỞ RỘNG
    document.querySelectorAll('.btn-toggle-action').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentlyCollapsed = sidebarEl.classList.contains('is-collapsed');
        const willExpand = currentlyCollapsed;

        sidebarEl.classList.toggle('is-collapsed', !willExpand);
        syncContentOffset(willExpand);
        localStorage.setItem('kv_sidebar_expanded', String(willExpand));
      });
    });

    // KÍCH HOẠT ĐẨY LỀ NGAY KHI TẢI TRANG
    syncContentOffset(expanded);

    // GẮN SỰ KIỆN NHẤP ĐÚP MỞ SYSTEM WORKFLOW ẨN
    const openWorkflow = (e) => {
      e.preventDefault();
      window.location.href = 'system-workflow.html';
    };

    ['btn-secret-logo-exp', 'btn-secret-logo-col', 'btn-secret-avatar', 'btn-secret-api'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('dblclick', openWorkflow);
    });
  }

  // KHỞI CHẠY TỨC THÌ
  injectVieFavicon();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildSidebarDOM);
  } else {
    buildSidebarDOM();
  }
})();
