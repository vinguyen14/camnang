/**
 * TRAINER OS v5.5 ENTERPRISE - SHARED SIDEBAR & FAVICON COMPONENT
 * - Đỉnh: Logo KiotViet Bông hoa xanh truyền thống
 * - Đáy Avatar: Logo Vie (https://i.postimg.cc/13fmPWCq/Logo-Vie.png)
 * - Tự động tiêm Favicon Tab: Logo Vie
 * - Cơ chế Toggle Mở Rộng (256px) / Thu Gọn (64px) có ghi nhớ LocalStorage
 */

(function () {
  'use strict';

  // 1. TỰ ĐỘNG TIÊM FAVICON LOGO VIE VÀO TAB TRÌNH DUYỆT (Khắc phục lỗi icon mất mạng)
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

  // 2. CẤU HÌNH DANH MỤC MENU HỆ THỐNG
  const MENU_SECTIONS = [
    {
      title: 'TỔNG QUAN',
      items: [
        {
          id: 'dashboard',
          file: 'index.html',
          label: 'Dashboard & Analytics',
          badge: '',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`
        },
        {
          id: 'radar',
          file: 'radar.html',
          label: 'Radar Đánh Giá & Lỗ Hổng',
          badge: 'Mới',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke-width="1.8"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 3v9l6 3"/><circle cx="12" cy="12" r="3" stroke-width="1.5"/></svg>`
        },
        {
          id: 'knowledge-hub',
          file: 'knowledge-hub.html',
          label: 'Master Knowledge Hub',
          badge: '',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`
        }
      ]
    },
    {
      title: 'ĐÀO TẠO',
      items: [
        {
          id: 'spcb',
          file: 'spcb.html',
          label: 'SPCB - Retail Cơ bản Onboard',
          badge: '',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>`
        },
        {
          id: 'kv1',
          file: 'kv1.html',
          label: 'KV1 - Retail Nâng cao M-2',
          badge: '',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>`
        },
        {
          id: 'thuehkd',
          file: 'thuehkd.html',
          label: 'HĐĐT & Thuế HKD (TAX)',
          badge: '',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>`
        },
        {
          id: 'industry',
          file: 'industry.html',
          label: 'Chuyên ngành FnB - Salon (M-3)',
          badge: '',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`
        }
      ]
    },
    {
      title: 'CÔNG CỤ & HỆ THỐNG',
      items: [
        {
          id: 'tools',
          file: 'tools.html',
          label: 'Runner Tools & Kho Quà & Lịch',
          badge: '',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`
        },
        {
          id: 'coderunner',
          file: 'coderunner.html',
          label: 'Code Runner & API Testbed',
          badge: 'Mới',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`
        },
        {
          id: 'vault',
          file: 'vault.html',
          label: 'Second Brain Vault (Tài liệu)',
          badge: '',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>`
        },
        {
          id: 'knowledge',
          file: 'knowledge.html',
          label: 'Sơ đồ Tri thức 3D Matrix',
          badge: '',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3" stroke-width="1.8"/><circle cx="6" cy="12" r="3" stroke-width="1.8"/><circle cx="18" cy="19" r="3" stroke-width="1.8"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98"/></svg>`
        },
        {
          id: 'settings',
          file: 'settings.html',
          label: 'Cài Đặt Hệ Thống & Đồng Bộ',
          badge: '',
          icon: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>`
        }
      ]
    }
  ];

  // 3. XÁC ĐỊNH TRANG HIỆN TẠI
  function getCurrentPage() {
    const rawPath = window.location.pathname.split('/').pop() || 'index.html';
    return rawPath.split('?')[0].split('#')[0] || 'index.html';
  }

  // 4. QUẢN LÝ TRẠNG THÁI MỞ RỘNG (EXPANDED)
  function isExpanded() {
    return localStorage.getItem('kv_sidebar_expanded') === 'true';
  }

  function toggleSidebar() {
    const nextState = !isExpanded();
    localStorage.setItem('kv_sidebar_expanded', String(nextState));
    renderSidebar();
  }

  // 5. LẤY PROFILE TRAINER
  function getTrainerProfile() {
    const defaultProfile = {
      name: 'Trainer KiotViet',
      role: 'Senior L&D Specialist'
    };
    try {
      const stored = localStorage.getItem('kv_trainer_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          name: parsed.name || defaultProfile.name,
          role: parsed.role || defaultProfile.role
        };
      }
    } catch (e) {}
    return defaultProfile;
  }

  // 6. KIỂM TRA TRẠNG THÁI API GAS
  function getApiStatus() {
    const apiUrl = localStorage.getItem('kv_api_url');
    return Boolean(apiUrl && apiUrl.trim().length > 10);
  }

  // 7. RENDER GIAO DIỆN CHÍNH CỦA SIDEBAR
  function renderSidebar() {
    let sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) {
      sidebarEl = document.querySelector('aside');
    }
    if (!sidebarEl) {
      sidebarEl = document.createElement('aside');
      sidebarEl.id = 'sidebar';
      document.body.prepend(sidebarEl);
    }

    const expanded = isExpanded();
    const currentPage = getCurrentPage();
    const profile = getTrainerProfile();
    const hasApi = getApiStatus();

    // Kích thước chuẩn: w-64 khi mở rộng, w-16 khi thu gọn
    sidebarEl.className = `fixed left-0 top-0 h-screen ${
      expanded ? 'w-64' : 'w-16'
    } bg-white/95 backdrop-blur-md border-r border-slate-200/90 flex flex-col justify-between py-3 z-50 transition-all duration-300 shadow-sm select-none`;

    // 7.1 ĐỈNH SIDEBAR: LOGO KIOTVIET BÔNG HOA XANH + NÚT TOGGLE
    let html = `
      <div class="flex flex-col w-full px-2.5">
        <div class="flex items-center ${expanded ? 'justify-between px-1.5' : 'justify-center'} h-11 w-full">
          <!-- Logo Bông hoa KiotViet chính hãng -->
          <div id="btn-sidebar-logo" class="cursor-pointer group relative flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors" title="Nhấp đúp: Mở System Workflow">
            <svg class="w-8 h-8 flex-shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="10" r="5" fill="#0070F3" opacity="0.9"/>
              <circle cx="29" cy="16.5" r="5" fill="#0090FF" opacity="0.9"/>
              <circle cx="26" cy="27" r="5" fill="#00A3FF" opacity="0.9"/>
              <circle cx="14" cy="27" r="5" fill="#0070F3" opacity="0.95"/>
              <circle cx="11" cy="16.5" r="5" fill="#0050D8" opacity="0.95"/>
              <circle cx="20" cy="19.5" r="3.2" fill="#FFFFFF"/>
            </svg>
            ${
              expanded
                ? `<div class="flex flex-col overflow-hidden">
                    <span class="font-bold text-slate-800 text-sm tracking-tight whitespace-nowrap">KiotViet</span>
                    <span class="text-[10px] text-blue-600 font-semibold tracking-wider uppercase -mt-0.5">Trainer OS v5.5</span>
                   </div>`
                : `<div class="absolute left-16 ml-2 px-2.5 py-1.5 bg-slate-900/95 text-white text-[11px] font-medium rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[100000] border border-slate-700">
                    KiotViet Trainer OS
                    <span class="block text-[9px] text-blue-400 font-normal">Nhấp đúp: Mở System Workflow</span>
                   </div>`
            }
          </div>

          <!-- Nút Toggle Thu gọn / Mở rộng -->
          <button id="btn-sidebar-toggle" class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="${expanded ? 'Thu gọn thanh menu' : 'Mở rộng thanh menu'}">
            <svg class="w-4 h-4 transition-transform duration-200 ${expanded ? '' : 'rotate-180'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
            </svg>
          </button>
        </div>
        <div class="w-full h-[1px] bg-slate-200/80 my-2.5"></div>
      </div>
    `;

    // 7.2 PHẦN THÂN: DANH SÁCH MENU CUỘN ÊM
    html += `<div class="flex-1 w-full overflow-y-auto overflow-x-hidden px-2 custom-scrollbar space-y-3">`;

    MENU_SECTIONS.forEach((section) => {
      html += `<div class="space-y-1">`;
      if (expanded) {
        html += `<div class="px-2.5 pt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">${section.title}</div>`;
      } else {
        html += `<div class="w-6 h-[1px] bg-slate-200/70 mx-auto my-1.5"></div>`;
      }

      section.items.forEach((item) => {
        const isActive = (currentPage === item.file);
        const activeClass = isActive
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-semibold'
          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100';

        html += `
          <a href="${item.file}" class="relative group flex items-center ${
            expanded ? 'justify-start px-3' : 'justify-center'
          } h-10 w-full rounded-xl transition-all duration-150 ${activeClass}">
            ${item.icon}

            ${
              expanded
                ? `
                  <span class="ml-3 text-xs tracking-tight truncate flex-1">${item.label}</span>
                  ${
                    item.badge
                      ? `<span class="ml-2 px-1.5 py-0.5 bg-rose-500 text-[10px] font-bold text-white rounded-full leading-none">${item.badge}</span>`
                      : ''
                  }
                  ${
                    isActive
                      ? `<span class="w-1.5 h-1.5 rounded-full bg-white ml-2 flex-shrink-0"></span>`
                      : ''
                  }
                `
                : `
                  ${
                    item.badge
                      ? `<span class="absolute 1.5 -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                         </span>`
                      : ''
                  }
                  <!-- Tooltip chỉ hiển thị khi sidebar Thu gọn -->
                  <div class="absolute left-16 ml-2 px-3 py-1.5 bg-slate-900/95 text-white text-xs font-medium rounded-md shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[100000] border border-slate-700">
                    <span>${item.label}</span>
                    ${item.badge ? `<span class="ml-1.5 px-1.5 py-0.5 bg-rose-500 text-[9px] rounded text-white font-bold">${item.badge}</span>` : ''}
                    ${isActive ? `<span class="block text-[10px] text-emerald-400 font-normal mt-0.5">Đang xem</span>` : ''}
                  </div>
                `
            }
          </a>
        `;
      });
      html += `</div>`;
    });

    html += `</div>`;

    // 7.3 ĐÁY SIDEBAR: API CLOUD STATUS + AVATAR LOGO VIE
    html += `
      <div class="w-full px-2.5 pt-2 flex flex-col gap-2">
        <div class="w-full h-[1px] bg-slate-200/80"></div>

        <!-- Trạng thái kết nối Google Sheets API -->
        <div id="btn-api-status" class="cursor-pointer group flex items-center ${
          expanded ? 'justify-start px-2 py-1.5 bg-slate-50 border border-slate-100' : 'justify-center h-9'
        } rounded-xl hover:bg-slate-100 transition-colors" title="Nhấp đúp: Mở System Workflow">
          <span class="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${
              hasApi ? 'bg-emerald-400' : 'bg-amber-400'
            } opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 ${
              hasApi ? 'bg-emerald-500' : 'bg-amber-500'
            }"></span>
          </span>
          ${
            expanded
              ? `<span class="ml-2.5 text-[11px] font-medium ${
                  hasApi ? 'text-emerald-700' : 'text-amber-700'
                } truncate">
                  ${hasApi ? 'Cloud API Active' : 'API Chưa Cấu Hình'}
                 </span>`
              : `<div class="absolute left-16 ml-2 px-2.5 py-1.5 bg-slate-900/95 text-white text-[11px] font-medium rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[100000] border border-slate-700">
                  ${hasApi ? 'Cloud API Active' : 'API Chưa Cấu Hình'}
                  <span class="block text-[9px] text-slate-400 font-normal">Nhấp đúp: Mở System Workflow</span>
                 </div>`
          }
        </div>

        <!-- Avatar Người Dùng: Chuẩn LOGO VIE (https://i.postimg.cc/13fmPWCq/Logo-Vie.png) -->
        <div id="btn-sidebar-avatar" class="cursor-pointer group flex items-center ${
          expanded ? 'gap-3 p-1.5 hover:bg-slate-100' : 'justify-center p-1'
        } rounded-xl transition-colors" title="Nhấp đúp: Mở System Workflow">
          <div class="w-9 h-9 rounded-full ring-2 ring-blue-500/20 bg-white p-0.5 overflow-hidden flex-shrink-0 shadow-sm group-hover:ring-blue-500 transition-all flex items-center justify-center">
            <img src="https://i.postimg.cc/13fmPWCq/Logo-Vie.png" alt="Vie Logo" class="w-full h-full object-contain" />
          </div>
          ${
            expanded
              ? `<div class="flex flex-col overflow-hidden text-left">
                  <span class="text-xs font-bold text-slate-800 truncate">${profile.name}</span>
                  <span class="text-[10px] text-blue-600 font-medium truncate">${profile.role}</span>
                 </div>`
              : `<div class="absolute left-16 ml-2 px-3 py-2 bg-slate-900/95 text-white text-xs rounded-md shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[100000] border border-slate-700">
                  <div class="font-bold text-slate-100">${profile.name}</div>
                  <div class="text-[10px] text-blue-400">${profile.role}</div>
                  <div class="mt-1 text-[9px] text-slate-400 border-t border-slate-700/80 pt-1">Nhấp đúp: Mở System Workflow</div>
                 </div>`
          }
        </div>
      </div>
    `;

    sidebarEl.innerHTML = html;

    // GẮN SỰ KIỆN TƯƠNG TÁC
    // 1. Nút Toggle Expand / Collapse
    const toggleBtn = document.getElementById('btn-sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar();
      });
    }

    // 2. Nhấp đúp mở System Workflow
    const openWorkflow = () => {
      window.location.href = 'system-workflow.html';
    };

    const logoBtn = document.getElementById('btn-sidebar-logo');
    if (logoBtn) logoBtn.addEventListener('dblclick', openWorkflow);

    const apiBtn = document.getElementById('btn-api-status');
    if (apiBtn) apiBtn.addEventListener('dblclick', openWorkflow);

    const avatarBtn = document.getElementById('btn-sidebar-avatar');
    if (avatarBtn) avatarBtn.addEventListener('dblclick', openWorkflow);
  }

  // KHỞI TẠO TỰ ĐỘNG
  injectVieFavicon();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSidebar);
  } else {
    renderSidebar();
  }

  // Lắng nghe cập nhật qua tab
  window.addEventListener('storage', (e) => {
    if (e.key === 'kv_trainer_profile' || e.key === 'kv_api_url' || e.key === 'kv_sidebar_expanded') {
      renderSidebar();
    }
  });

  window.addEventListener('trainer_profile_updated', renderSidebar);
})();
