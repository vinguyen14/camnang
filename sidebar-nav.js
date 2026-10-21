/**
 * TRAINER OS v5.5.4 ENTERPRISE - UNIVERSAL SIDEBAR COMPONENT
 * - Logo KiotViet đỉnh: https://i.postimg.cc/Y9sjBhYn/kiotviet-logo-horizontal.jpg
 * - Logo Avatar Bông hoa: https://i.postimg.cc/DZJ5T4R8/Bong-Hoa-Logo.png
 * - Xóa bỏ triệt để lỗi Logo x2 (Duy nhất 1 Header Container)
 * - Tự động đồng bộ Nút ba gạch [ ≡ ] có sẵn trên mọi trang
 * - Đẩy lề hoàn toàn cả Topbar & Nội dung (Hết đè trên settings.html, knowledge-hub.html)
 * - Thiết kế Compact: Luôn hiển thị đầy đủ Master Data Hub & Cài đặt Hệ thống
 * - Mở bí mật system-workflow.html khi nhấp đúp Logo/Avatar/API dot
 */

(function () {
  'use strict';

  const KIOTVIET_LOGO_URL = 'https://i.postimg.cc/Y9sjBhYn/kiotviet-logo-horizontal.jpg';
  const BONGHOA_LOGO_URL = 'https://i.postimg.cc/DZJ5T4R8/Bong-Hoa-Logo.png';

  // 1. TỰ ĐỘNG TIÊM FAVICON BÔNG HOA VÀO TAB TRÌNH DUYỆT
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

  // 2. DANH MỤC 12 MỤC CHUẨN XÁC 100%
  const SIDEBAR_STRUCTURE = [
    {
      group: 'TỔNG QUAN',
      items: [
        {
          id: 'index',
          file: 'index.html',
          label: 'Bảng điều khiển',
          icon: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/></svg>`
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
          icon: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`
        },
        {
          id: 'thuehkd',
          file: 'thuehkd.html',
          label: 'Chuyên đề Thuế',
          icon: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>`
        },
        {
          id: 'industry',
          file: 'industry.html',
          label: 'Chuyên ngành',
          hasArrow: true,
          icon: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>`
        },
        {
          id: 'kv1',
          file: 'kv1.html',
          label: 'Tất cả khóa học',
          icon: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>`
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
          icon: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`
        },
        {
          id: 'radar',
          file: 'radar.html',
          label: 'Radar Sản Phẩm Mới',
          icon: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke-width="1.8"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 3v9l6 3"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`
        },
        {
          id: 'knowledge',
          file: 'knowledge.html',
          label: 'Sơ đồ Vận hành',
          icon: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 12l5 5L22 7M2 12l5 5L12 12"/></svg>`
        },
        {
          id: 'vault',
          file: 'vault.html',
          label: 'Kho Lưu Trữ Vault',
          icon: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>`
        },
        {
          id: 'tools',
          file: 'tools.html',
          label: 'Runner Tools',
          icon: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`
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
          icon: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3" stroke-width="1.8"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`
        },
        {
          id: 'settings',
          file: 'settings.html',
          label: 'Cài đặt Hệ thống',
          icon: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`
        }
      ]
    }
  ];

  // 3. CSS HIỆU NĂNG CAO & COMPACT SAAS UI
  function injectStyles() {
    if (document.getElementById('sidebar-fast-styles')) return;
    const style = document.createElement('style');
    style.id = 'sidebar-fast-styles';
    style.innerHTML = `
      #sidebar {
        transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 1px 0 4px 0 rgba(0, 0, 0, 0.04);
      }
      #sidebar.is-collapsed {
        width: 4rem !important; /* 64px */
      }
      #sidebar:not(.is-collapsed) {
        width: 15rem !important; /* 240px */
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
      /* Logo KiotViet: Biến đổi êm dịu khi Mở / Thu gọn */
      #sidebar.is-collapsed #sb-logo-img {
        width: 2.25rem !important;
        height: 2.25rem !important;
        object-fit: cover !important;
        object-position: left center !important;
        border-radius: 0.375rem !important;
      }
      #sidebar:not(.is-collapsed) #sb-logo-img {
        max-height: 1.85rem !important;
        max-width: 8.5rem !important;
        object-fit: contain !important;
      }
      /* Scrollbar mỏng tinh tế */
      .sb-scroll::-webkit-scrollbar {
        width: 4px;
      }
      .sb-scroll::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
    `;
    document.head.appendChild(style);
  }

  function getCurrentFile() {
    const raw = window.location.pathname.split('/').pop() || 'index.html';
    return raw.split('?')[0].split('#')[0] || 'index.html';
  }

  function isSidebarExpanded() {
    return localStorage.getItem('kv_sidebar_expanded') !== 'false';
  }

  // 4. UNIVERSAL LAYOUT PUSHER V2 (Đẩy cả Thân trang LẪN Topbar)
  function syncContentOffset(expanded) {
    const sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) return;

    const marginWidth = expanded ? '15rem' : '4rem'; // 240px hoặc 64px

    // 4.1 Đẩy toàn bộ các vùng nội dung anh em sau sidebar
    let contentEl = sidebarEl.nextElementSibling;
    while (contentEl) {
      if (
        contentEl.tagName !== 'SCRIPT' &&
        contentEl.tagName !== 'STYLE' &&
        contentEl.id !== 'sop-drawer-root' &&
        contentEl.id !== 'report-memo-root'
      ) {
        contentEl.style.setProperty('transition', 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1), width 0.2s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 'important');
        contentEl.style.setProperty('margin-left', marginWidth, 'important');
        contentEl.style.setProperty('width', `calc(100vw - ${marginWidth})`, 'important');
        contentEl.style.setProperty('max-width', `calc(100vw - ${marginWidth})`, 'important');
        contentEl.style.setProperty('box-sizing', 'border-box', 'important');
      }
      contentEl = contentEl.nextElementSibling;
    }

    // 4.2 Đẩy cả Topbar/Header cố định của các trang như settings.html, knowledge-hub.html
    const topbars = document.querySelectorAll('header, nav, .top-bar, .topbar, #topbar, #header');
    topbars.forEach((tb) => {
      if (tb.closest('#sidebar')) return;
      const pos = window.getComputedStyle(tb).position;
      if (pos === 'fixed' || pos === 'sticky') {
        tb.style.setProperty('transition', 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1), width 0.2s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 'important');
        tb.style.setProperty('left', marginWidth, 'important');
        tb.style.setProperty('width', `calc(100vw - ${marginWidth})`, 'important');
      }
    });

    document.body.classList.toggle('sb-expanded', expanded);
    document.body.classList.toggle('sb-collapsed', !expanded);
  }

  // 5. HÀM CHUYỂN ĐỔI TRẠNG THÁI SIDEBAR (Dùng chung cho Nút <<, >> và Nút ba gạch [ ≡ ])
  function toggleSidebar() {
    const sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) return;

    const currentlyCollapsed = sidebarEl.classList.contains('is-collapsed');
    const willExpand = currentlyCollapsed;

    sidebarEl.classList.toggle('is-collapsed', !willExpand);
    syncContentOffset(willExpand);
    localStorage.setItem('kv_sidebar_expanded', String(willExpand));

    const toggleIcon = document.getElementById('icon-toggle');
    if (toggleIcon) {
      toggleIcon.classList.toggle('rotate-180', !willExpand);
    }
  }

  // 6. RENDER DOM DUY NHẤT 1 LẦN (TRIỆT TIÊU LỖI LOGO X2)
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

    sidebarEl.className = `fixed left-0 top-0 h-screen bg-white border-r border-slate-200 z-50 flex flex-col justify-between py-2.5 select-none ${
      expanded ? '' : 'is-collapsed'
    }`;

    // 6.1 HEADER DUY NHẤT 1 KHỐI (Không bao giờ bị x2 Logo)
    let html = `
      <div class="flex flex-col w-full px-2.5">
        <div class="flex items-center justify-between h-9 w-full">
          <!-- Logo KiotViet chuẩn ảnh (Nhấp đúp mở System Workflow) -->
          <div id="btn-secret-logo" class="cursor-pointer group flex items-center overflow-hidden flex-1" title="Nhấp đúp: Mở System Workflow">
            <img id="sb-logo-img" src="${KIOTVIET_LOGO_URL}" alt="KiotViet" class="transition-all duration-200" />
          </div>

          <!-- Nút mũi tên thu gọn / mở rộng -->
          <button id="btn-sidebar-toggle" class="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors flex-shrink-0" title="Đóng / Mở menu">
            <svg id="icon-toggle" class="w-4 h-4 transition-transform duration-200 ${expanded ? '' : 'rotate-180'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="w-full h-[1px] bg-slate-100 my-1.5"></div>
    `;

    // 6.2 THÂN MENU COMPACT: ĐẦY ĐỦ 12 MỤC (KÈM CẢ MASTER DATA HUB & CÀI ĐẶT HỆ THỐNG)
    html += `<div id="sb-scroll-container" class="flex-1 w-full overflow-x-hidden sb-scroll px-2 space-y-2 pb-6">`;

    SIDEBAR_STRUCTURE.forEach((sec) => {
      html += `<div class="space-y-0.5">`;
      html += `<div class="sb-group-title px-2.5 pt-1.5 pb-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">${sec.group}</div>`;
      html += `<div class="sb-divider w-6 h-[1px] bg-slate-200/80 mx-auto my-1.5 hidden"></div>`;

      sec.items.forEach((item) => {
        const isActive = (currentFile === item.file);
        const itemClass = isActive
          ? 'bg-blue-50 text-blue-600 font-bold active-menu-item'
          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-medium';

        html += `
          <a href="${item.file}" class="sidebar-item relative group flex items-center h-8 w-full px-2 rounded-lg transition-colors duration-150 ${itemClass}">
            ${item.icon}
            <span class="sb-text ml-2.5 text-xs tracking-tight truncate flex-1">${item.label}</span>
            ${item.hasArrow ? `<svg class="sb-arrow w-3.5 h-3.5 text-slate-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>` : ''}

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

    // 6.3 BOTTOM: CLOUD API ACTIVE + AVATAR BÔNG HOA KIOTVIET
    html += `
      <div class="w-full px-2.5 pt-1.5 flex flex-col gap-1 border-t border-slate-100 bg-white">
        <!-- Trạng thái Cloud API -->
        <div id="btn-secret-api" class="cursor-pointer group flex items-center h-7 px-2 rounded-lg hover:bg-slate-50 transition-colors" title="Nhấp đúp: Mở System Workflow">
          <span class="flex h-2 w-2 relative flex-shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="sb-text ml-2 text-[11px] font-semibold text-slate-500 truncate">Cloud API Active</span>
        </div>

        <!-- Avatar Người Dùng: Bông Hoa KiotViet Chính Hãng -->
        <div id="btn-secret-avatar" class="cursor-pointer group flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 transition-colors" title="Nhấp đúp: Mở System Workflow">
          <div class="w-8 h-8 rounded-full ring-2 ring-blue-500/20 bg-blue-50/50 p-0.5 overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center">
            <img src="${BONGHOA_LOGO_URL}" alt="Bông Hoa Logo" class="w-full h-full object-contain" />
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

    // GẮN SỰ KIỆN NÚT TOGGLE CỦA SIDEBAR
    const toggleBtn = document.getElementById('btn-sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar();
      });
    }

    // ĐỒNG BỘ NÚT BA GẠCH [ ≡ ] CÓ SẴN TRÊN MỌI TRANG
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('button, [role="button"], a');
      if (!btn || btn.closest('#sidebar')) return;

      const svg = btn.querySelector('svg');
      const htmlContent = btn.innerHTML.toLowerCase();
      const isHamburger =
        (btn.id && (btn.id.includes('menu') || btn.id.includes('toggle') || btn.id.includes('sidebar'))) ||
        (btn.className && (btn.className.includes('menu') || btn.className.includes('hamburger'))) ||
        htmlContent.includes('m4 6h16') ||
        htmlContent.includes('m3 12h18') ||
        htmlContent.includes('fa-bars') ||
        (svg && svg.querySelectorAll('line').length === 3);

      if (isHamburger) {
        e.preventDefault();
        e.stopPropagation();
        toggleSidebar();
      }
    });

    // TỰ ĐỘNG CUỘN ĐẾN MỤC ĐANG ACTIVE (Đảm bảo Cài đặt Hệ thống luôn nhìn thấy)
    setTimeout(() => {
      const activeEl = sidebarEl.querySelector('.active-menu-item');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 150);

    // KÍCH HOẠT PUSHER ĐẨY LỀ NGAY LẬP TỨC
    syncContentOffset(expanded);

    // SỰ KIỆN NHẤP ĐÚP MỞ SYSTEM WORKFLOW ẨN
    const openWorkflow = (e) => {
      e.preventDefault();
      window.location.href = 'system-workflow.html';
    };

    ['btn-secret-logo', 'btn-secret-avatar', 'btn-secret-api'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('dblclick', openWorkflow);
    });
  }

  // KHỞI CHẠY TỨC THÌ
  injectFavicon();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildSidebarDOM);
  } else {
    buildSidebarDOM();
  }
})();
