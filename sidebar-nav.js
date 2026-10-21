/**
 * TRAINER OS v5.5 ENTERPRISE - SHARED SIDEBAR COMPONENT
 * Tự động đồng bộ Menu, Logo, Avatar, Trạng thái API và phím tắt mở Workflow
 * Tác giả: L&D KiotViet
 */

(function () {
  'use strict';

  // 1. Cấu hình danh mục Menu hệ thống
  const MENU_GROUPS = [
    {
      group: 'Tổng quan & Phân tích',
      items: [
        {
          id: 'dashboard',
          file: 'index.html',
          label: 'Dashboard & Analytics',
          badge: '',
          icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>`
        },
        {
          id: 'radar',
          file: 'radar.html',
          label: 'Radar Đánh Giá & Lỗ Hổng Năng Lực',
          badge: 'Mới',
          icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke-width="1.8"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 3v9l6 3"/><circle cx="12" cy="12" r="3" stroke-width="1.5"/></svg>`
        },
        {
          id: 'knowledge-hub',
          file: 'knowledge-hub.html',
          label: 'Master Knowledge Hub',
          badge: '',
          icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`
        }
      ]
    },
    {
      group: 'Chương trình Đào tạo',
      items: [
        {
          id: 'spcb',
          file: 'spcb.html',
          label: 'SPCB - Retail Cơ bản Onboard',
          badge: '',
          icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>`
        },
        {
          id: 'kv1',
          file: 'kv1.html',
          label: 'KV1 - Retail Nâng cao M-2',
          badge: '',
          icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>`
        },
        {
          id: 'thuehkd',
          file: 'thuehkd.html',
          label: 'HĐĐT & Thuế HKD (TAX)',
          badge: '',
          icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>`
        },
        {
          id: 'industry',
          file: 'industry.html',
          label: 'Chuyên ngành FNB - Salon - Hotel (M-3)',
          badge: '',
          icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`
        }
      ]
    },
    {
      group: 'Công cụ & Hệ sinh thái',
      items: [
        {
          id: 'tools',
          file: 'tools.html',
          label: 'Runner Tools & Kho Quà & Lịch',
          badge: '',
          icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`
        },
        {
          id: 'coderunner',
          file: 'coderunner.html',
          label: 'Code Runner & API Testbed',
          badge: 'Mới',
          icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`
        },
        {
          id: 'vault',
          file: 'vault.html',
          label: 'Second Brain Vault (Tài liệu)',
          badge: '',
          icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>`
        },
        {
          id: 'knowledge',
          file: 'knowledge.html',
          label: 'Sơ đồ Tri thức 3D Matrix & Mindmap',
          badge: '',
          icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3" stroke-width="1.8"/><circle cx="6" cy="12" r="3" stroke-width="1.8"/><circle cx="18" cy="19" r="3" stroke-width="1.8"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98"/></svg>`
        },
        {
          id: 'settings',
          file: 'settings.html',
          label: 'Cấu hình Hệ thống & Cloud Sync',
          badge: '',
          icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>`
        }
      ]
    }
  ];

  // 2. Lấy thông tin trang hiện tại
  function getCurrentPage() {
    const rawPath = window.location.pathname.split('/').pop() || 'index.html';
    return rawPath.split('?')[0].split('#')[0] || 'index.html';
  }

  // 3. Lấy thông tin Profile Trainer
  function getTrainerProfile() {
    const defaultProfile = {
      name: 'Trainer KiotViet',
      role: 'Senior L&D Specialist',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&fit=crop&q=80'
    };
    try {
      const stored = localStorage.getItem('kv_trainer_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          name: parsed.name || defaultProfile.name,
          role: parsed.role || defaultProfile.role,
          avatar: parsed.avatar || defaultProfile.avatar
        };
      }
    } catch (e) {
      console.warn('Lỗi đọc kv_trainer_profile:', e);
    }
    return defaultProfile;
  }

  // 4. Lấy trạng thái kết nối GAS
  function getApiStatus() {
    const apiUrl = localStorage.getItem('kv_api_url');
    return Boolean(apiUrl && apiUrl.trim().length > 10);
  }

  // 5. Render toàn bộ cấu trúc HTML của Sidebar
  function renderSidebar() {
    let sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) {
      sidebarEl = document.querySelector('aside');
    }

    if (!sidebarEl) {
      // Nếu không tìm thấy thẻ aside nào, tự tạo mới
      sidebarEl = document.createElement('aside');
      sidebarEl.id = 'sidebar';
      document.body.prepend(sidebarEl);
    }

    // Đặt class chuẩn mực cho container sidebar
    sidebarEl.className = 'fixed left-0 top-0 h-screen w-16 bg-white/95 backdrop-blur-md border-r border-slate-200/80 flex flex-col justify-between items-center py-3.5 z-50 transition-all duration-300 shadow-sm select-none';

    const currentPage = getCurrentPage();
    const profile = getTrainerProfile();
    const hasApi = getApiStatus();

    // Top: Logo KiotViet mới (https://i.postimg.cc/13fmPWCq/Logo-Vie.png)
    let html = `
      <div class="flex flex-col items-center w-full">
        <div id="btn-sidebar-logo" class="cursor-pointer group relative p-1.5 rounded-xl hover:bg-slate-100 transition-colors" title="Nhấp đúp để mở System Workflow">
          <img src="https://i.postimg.cc/13fmPWCq/Logo-Vie.png" alt="KiotViet Logo" class="h-8 w-8 object-contain transition-transform group-hover:scale-105" />
          <div class="absolute left-16 ml-2 px-2.5 py-1.5 bg-slate-900/95 text-white text-[11px] font-medium rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[100000] border border-slate-700">
            Trainer OS v5.5 Enterprise
            <span class="block text-[9px] text-blue-400 font-normal">Nhấp đúp: Mở System Workflow</span>
          </div>
        </div>
        <div class="w-8 h-[1px] bg-slate-200/80 my-3"></div>
      </div>
    `;

    // Middle: Danh sách Menu cuộn êm
    html += `<div class="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-1.5 px-2 custom-scrollbar">`;

    MENU_GROUPS.forEach((grp, gIdx) => {
      if (gIdx > 0) {
        html += `<div class="w-6 h-[1px] bg-slate-200/70 my-1.5"></div>`;
      }
      grp.items.forEach(item => {
        const isActive = (currentPage === item.file);
        const activeClass = isActive
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-600/20'
          : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100/90';

        html += `
          <a href="${item.file}" class="relative group flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 ${activeClass}">
            ${item.icon}
            
            ${item.badge ? `
              <span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow">
                •
              </span>
            ` : ''}

            <!-- Tooltip nổi chuẩn z-[100000] -->
            <div class="absolute left-16 ml-2 px-3 py-1.5 bg-slate-900/95 text-white text-xs font-medium rounded-md shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-[100000] border border-slate-700/60 backdrop-blur-sm">
              <span class="font-semibold text-slate-100">${item.label}</span>
              ${item.badge ? `<span class="ml-1.5 px-1.5 py-0.2 bg-rose-500 text-[10px] rounded text-white font-bold">${item.badge}</span>` : ''}
              ${isActive ? `<span class="block text-[10px] text-emerald-400 font-normal">Đang mở</span>` : ''}
            </div>
          </a>
        `;
      });
    });

    html += `</div>`;

    // Bottom: Đèn trạng thái API & Avatar Trainer
    html += `
      <div class="flex flex-col items-center w-full pt-2 gap-2.5">
        <div class="w-8 h-[1px] bg-slate-200/80"></div>
        
        <!-- Đèn tín hiệu API -->
        <div id="btn-api-status" class="cursor-pointer group relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 transition-colors" title="Trạng thái kết nối Google Sheets">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${hasApi ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 ${hasApi ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
          </span>
          <div class="absolute left-16 ml-2 px-2.5 py-1.5 bg-slate-900/95 text-white text-[11px] font-medium rounded-md shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[100000] border border-slate-700">
            ${hasApi ? 'GAS API: Đã kích hoạt' : 'GAS API: Chưa cài đặt URL'}
            <span class="block text-[9px] text-slate-400 font-normal">Nhấp đúp: Mở System Workflow</span>
          </div>
        </div>

        <!-- Avatar Trainer -->
        <div id="btn-sidebar-avatar" class="cursor-pointer group relative flex items-center justify-center" title="Hồ sơ Trainer (Nhấp đúp mở Workflow)">
          <div class="w-10 h-10 rounded-full ring-2 ring-blue-500/30 overflow-hidden shadow-sm hover:ring-blue-500 transition-all">
            <img src="${profile.avatar}" alt="${profile.name}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&fit=crop&q=80'" />
          </div>
          <div class="absolute left-16 ml-2 px-3 py-2 bg-slate-900/95 text-white text-xs rounded-md shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[100000] border border-slate-700">
            <div class="font-bold text-slate-100">${profile.name}</div>
            <div class="text-[10px] text-blue-400">${profile.role}</div>
            <div class="mt-1 text-[9px] text-slate-400 border-t border-slate-700/80 pt-1">Nhấp đúp: Mở System Workflow</div>
          </div>
        </div>
      </div>
    `;

    sidebarEl.innerHTML = html;

    // Gắn sự kiện nhấp đúp (Double-click) mở system-workflow.html
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

  // Khởi chạy khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSidebar);
  } else {
    renderSidebar();
  }

  // Lắng nghe cập nhật profile từ tab/cửa sổ khác
  window.addEventListener('storage', (e) => {
    if (e.key === 'kv_trainer_profile' || e.key === 'kv_api_url') {
      renderSidebar();
    }
  });

  // Hỗ trợ custom event nội bộ nếu settings.html cập nhật profile
  window.addEventListener('trainer_profile_updated', renderSidebar);

})();
