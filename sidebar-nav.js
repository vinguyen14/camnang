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

  // CẤU TRÚC MENU 100% CHUẨN XÁC VỚI SUBMENU ACCORDION CHO CHUYÊN NGÀNH
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
          id: 'kv1',
          file: 'kv1.html',
          label: 'Sản phẩm KV1',
          icon: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`
        },
        {
          id: 'industry',
          label: 'Chuyên ngành',
          isAccordion: true,
          icon: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>`,
          subItems: [
            { label: 'KiotViet FNB', file: 'industry.html', color: 'hover:text-orange-500' },
            { label: 'KV Salon', file: 'industry.html', color: 'hover:text-pink-500' },
            { label: 'KV Hotel', file: 'industry.html', color: 'hover:text-emerald-500' }
          ]
        },
        {
          id: 'all-courses',
          file: 'index.html?tab=khoa-hoc',
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
          icon: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`
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

      :root.sb-collapsed #sb-logo-full {
        display: none !important;
      }
      :root.sb-collapsed #sb-logo-icon {
        display: block !important;
        margin: 0 auto !important;
      }
      :root:not(.sb-collapsed) #sb-logo-full {
        display: block !important;
      }
      :root:not(.sb-collapsed) #sb-logo-icon {
        display: none !important;
      }

      :root.sb-collapsed #btn-sidebar-toggle {
        margin: 4px auto 0 auto !important;
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
    `;
    document.head.appendChild(style);
  }

  function getCurrentFile() {
    const raw = window.location.pathname.split('/').pop() || 'index.html';
    return raw.split('?')[0].split('#')[0] || 'index.html';
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

    let html = `
      <div class="flex flex-col w-full bg-white shrink-0">
        <div class="flex items-center justify-between h-14 w-full px-3 bg-white">
          <div id="btn-secret-logo" class="cursor-pointer flex items-center overflow-hidden flex-1 bg-white select-none" title="Nhấp đúp: Mở System Architecture Workflow">
            <img id="sb-logo-full" src="${KIOTVIET_LOGO_URL}" alt="KiotViet" class="h-7 max-w-[130px] object-contain bg-white" />
            <img id="sb-logo-icon" src="${BONGHOA_LOGO_URL}" alt="KV" class="h-8 w-8 object-contain bg-white hidden" />
          </div>

          <button id="btn-sidebar-toggle" class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors flex-shrink-0" title="Đóng / Mở menu">
            <svg id="icon-toggle" class="w-4 h-4 transition-transform duration-200 ${expanded ? '' : 'rotate-180'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="w-full h-[1px] bg-slate-200"></div>
    `;

    html += `<div id="sb-scroll-container" class="flex-1 w-full overflow-x-hidden sb-scroll px-2 space-y-2 py-3 bg-white">`;

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
              <div onclick="window.toggleSidebarAccordion('sub-cn', 'icon-cn-arrow')" class="sidebar-item relative group flex items-center justify-between h-8 w-full px-2 rounded-lg cursor-pointer transition-colors duration-150 ${isCurrentActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50 font-medium'}">
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
                    <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
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

          html += `
            <a href="${item.file}" class="sidebar-item relative group flex items-center h-8 w-full px-2 rounded-lg transition-colors duration-150 ${itemClass}">
              ${item.icon}
              <span class="sb-text ml-2.5 text-xs tracking-tight truncate flex-1">${item.label}</span>

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

    html += `
      <div class="w-full px-2.5 py-2.5 flex flex-col gap-1 border-t border-slate-200 bg-white shrink-0">
        <div id="btn-secret-api" class="cursor-pointer group flex items-center h-7 px-2 rounded-lg hover:bg-slate-50 transition-colors" title="Nhấp đúp: Mở System Architecture Workflow">
          <span class="flex h-2 w-2 relative flex-shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="sb-text ml-2 text-[11px] font-semibold text-slate-500 truncate">Cloud API Active</span>
        </div>

        <div id="btn-secret-avatar" class="cursor-pointer group flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors" title="Nhấp đúp: Mở System Architecture Workflow">
          <div class="w-8 h-8 rounded-full ring-2 ring-blue-500/20 bg-blue-50/50 p-0.5 overflow-hidden flex-shrink-0 shadow-sm flex items-center justify-center">
            <img src="${BONGHOA_LOGO_URL}" alt="Bông Hoa Logo" class="w-full h-full object-contain" />
          </div>
          <div class="sb-text flex flex-col overflow-hidden text-left">
            <span class="text-xs font-bold text-slate-800 truncate" id="sb-profile-name">${profName}</span>
            <span class="text-[10px] text-slate-400 font-medium truncate" id="sb-profile-title">${profTitle}</span>
          </div>

          <div class="sb-tooltip absolute left-16 ml-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-md shadow-2xl whitespace-nowrap opacity-0 pointer-events-none transition-opacity z-[100000] border border-slate-700">
            <div class="font-bold text-slate-100">${profName}</div>
            <div class="text-[10px] text-blue-400">${profTitle}</div>
            <div class="mt-1 text-[9px] text-slate-400 border-t border-slate-700 pt-1">Nhấp đúp: Mở System Workflow</div>
          </div>
        </div>
      </div>
    `;

    sidebarEl.innerHTML = html;

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

    const openWorkflow = (e) => {
      e.preventDefault();
      window.location.href = 'system-workflow.html';
    };

    ['btn-secret-logo', 'btn-secret-avatar', 'btn-secret-api'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('dblclick', openWorkflow);
    });
  }

  injectFavicon();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildSidebarDOM);
  } else {
    buildSidebarDOM();
  }
})();
