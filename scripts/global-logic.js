// GLOBAL DATA & CONFIG
window.SECRET_KEY = "014023";
window.holidays = { "1-1": "Tết Dương Lịch", "1-2": "Nghỉ Tết Dương", "1-3": "Nghỉ Tết Dương", "2-16": "Giao Thừa", "2-17": "Mùng 1 Tết", "2-18": "Mùng 2 Tết", "2-19": "Mùng 3 Tết", "2-20": "Mùng 4 Tết", "2-21": "Mùng 5 Tết", "4-27": "Giỗ Tổ Hùng Vương", "4-30": "Giải Phóng Miền Nam", "5-1": "Quốc Tế Lao Động", "5-2": "Nghỉ Lễ 30/4 - 1/5", "5-3": "Nghỉ Lễ 30/4 - 1/5", "9-1": "Quốc Khánh", "9-2": "Quốc Khánh 2/9" };

window.courseConfig = [
    { id: 'SPCB', prefix: '26KV', title: 'Sản phẩm Cơ bản', desc: 'Khóa học về sản phẩm cơ bản cho nhân viên bán hàng', sessions: 5, color: 'blue', status: 'Đang diễn ra' },
    { id: 'KV1', prefix: 'KV1-26', title: 'Sản phẩm KV1', desc: 'Nâng cao kỹ năng quản lý tình huống nghiệp vụ', sessions: 1, color: 'indigo', status: 'Đang diễn ra' },
    { id: 'TAX', prefix: 'INV-26', title: 'HĐĐT - Thuế - Kế toán', desc: 'Khóa học chuyên sâu về hóa đơn, thuế và kế toán', sessions: 4, color: 'slate', status: 'Đang lên kế hoạch' },
    { id: 'FNB', prefix: 'FNB-26', title: 'KiotViet FNB', desc: 'Nghiệp vụ dành riêng cho Nhà hàng, Cafe', sessions: 2, color: 'orange', status: 'Đã hoàn thành' },
    { id: 'SALON', prefix: 'SL-26', title: 'KiotViet Salon', desc: 'Nghiệp vụ quản lý tiệm Spa, Hair Salon', sessions: 2, color: 'fuchsia', status: 'Đang lên kế hoạch' },
    { id: 'HOTEL', prefix: 'HL-26', title: 'KiotViet Hotel', desc: 'Giải pháp quản lý cơ sở lưu trú, khách sạn', sessions: 2, color: 'emerald', status: 'Đang lên kế hoạch' }
];

window.loadMasterDB = function() {
    let data = JSON.parse(localStorage.getItem('kv_master_db')) || [];
    const now = new Date().getTime();
    data = data.filter(item => (now - (item.timestamp || 0)) <= (365 * 24 * 60 * 60 * 1000));
    return data;
};

// GLOBAL MODAL LOGIC
window.openModal = function(id) {
    const modal = document.getElementById(id); modal.classList.remove('hidden'); modal.classList.add('flex');
    setTimeout(() => modal.classList.add('opacity-100'), 10);
    const content = document.getElementById(id + 'Content');
    if(content) setTimeout(() => content.classList.add('scale-100', 'opacity-100'), 50);
};

window.closeModal = function(id) {
    const modal = document.getElementById(id); modal.classList.remove('opacity-100');
    const content = document.getElementById(id + 'Content');
    if(content) content.classList.remove('scale-100', 'opacity-100');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
};

window.deleteTargetIdx = null;
window.requestDelete = function(idx) {
    window.deleteTargetIdx = idx;
    const passInput = document.getElementById('authPassword');
    if(passInput) passInput.value = '';
    window.openModal('authModal');
    if(passInput) setTimeout(() => passInput.focus(), 100);
};

window.handleAuthKeyPress = function(e) { if (e.key === 'Enter') executeDelete(); };

window.executeDelete = function() {
    const pin = document.getElementById('authPassword').value;
    if(pin !== window.SECRET_KEY) { alert("Sai mã PIN an toàn!"); return; }
    
    setTimeout(() => {
        const msg = window.deleteTargetIdx === -1 
            ? "Bạn có chắc chắn muốn XÓA SẠCH toàn bộ dữ liệu không?" 
            : "Bạn có chắc chắn muốn xóa báo cáo này không?";
        
        if(confirm(msg)) {
            let db = window.loadMasterDB();
            if(window.deleteTargetIdx === -1) {
                db = [];
            } else {
                db.splice(window.deleteTargetIdx, 1);
            }
            localStorage.setItem('kv_master_db', JSON.stringify(db));
            window.closeModal('authModal');
            if(typeof renderAnalytics === 'function') renderAnalytics();
        }
    }, 100);
};

// CHUÔNG THÔNG BÁO
function checkNotifications() {
    const today = new Date(); const todayStr = `${today.getMonth() + 1}-${today.getDate()}`;
    const isWknd = today.getDay() === 0 || today.getDay() === 6; const holName = window.holidays[todayStr];
    const notifBox = document.getElementById('notification-content');
    const badge1 = document.getElementById('bell-badge'); const badge2 = document.getElementById('bell-badge-solid');

    if (holName) {
        badge1.classList.remove('hidden'); badge2.classList.remove('hidden');
        notifBox.innerHTML = `<div class="p-3 bg-rose-50 rounded-lg border border-rose-100"><p class="text-xs font-bold text-rose-600">Hôm nay là: ${holName}</p></div>`;
    } else if (isWknd) {
        badge1.classList.remove('hidden'); badge2.classList.remove('hidden');
        notifBox.innerHTML = `<div class="p-3 bg-indigo-50 rounded-lg border border-indigo-100"><p class="text-xs font-bold text-indigo-600">Cuối tuần rồi!</p></div>`;
    } else {
        notifBox.innerHTML = `<p class="text-[11px] text-slate-400 text-center py-4 font-medium italic">Không có thông báo mới.</p>`;
    }
}

// ROUTER CONFIG
const routes = {
    'dashboard': { file: 'views/dashboard.html', sidebar: 'dashboard', title: 'Dashboard' },
    'courses': { file: 'views/courses.html', sidebar: 'courses', title: 'Danh Sách Khóa Học' },
    'analytics': { file: 'views/analytics.html', sidebar: 'analytics', title: 'Analytics & Báo Cáo' },
    'tools': { file: 'views/tools.html', sidebar: 'tools', title: 'Công Cụ Trợ Lý' },
    'calendar': { file: 'views/calendar.html', sidebar: 'calendar', title: 'Lịch Đào Tạo 2026' },
    'course-detail': { file: 'views/course-detail.html', sidebar: 'courses' },
    'tasks': { file: 'views/tasks.html', sidebar: 'courses' }
};

const appRoot = document.getElementById('app-root');
const headerTitle = document.getElementById('header-title');

async function router() {
    let hash = window.location.hash.replace('#', '') || 'dashboard';
    
    let routeKey = hash;
    if(hash.startsWith('course-')) { localStorage.setItem('currentCourseId', hash.split('-')[1].toUpperCase()); routeKey = 'course-detail'; } 
    else if(hash.startsWith('tasks-')) { localStorage.setItem('currentCourseId', hash.split('-')[1].toUpperCase()); routeKey = 'tasks'; }

    if (!routes[routeKey]) routeKey = 'dashboard';

    updateSidebarActive(routes[routeKey].sidebar);
    
    // Tối ưu tiêu đề, không bị 2 dòng nữa
    if(routes[routeKey].title) {
        headerTitle.innerHTML = `<h1 class="text-xl font-black text-slate-800 tracking-tight">${routes[routeKey].title}</h1>`;
    } else {
        headerTitle.innerHTML = '';
    }

    appRoot.classList.remove('fade-in'); appRoot.classList.add('fade-out');

    try {
        const response = await fetch(`${routes[routeKey].file}?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error('File not found');
        const htmlString = await response.text();
        
        setTimeout(() => {
            appRoot.innerHTML = htmlString;
            executeScripts(appRoot);
            appRoot.classList.remove('fade-out'); appRoot.classList.add('fade-in');
        }, 200);
    } catch (error) {
        appRoot.innerHTML = `<div class="text-center mt-20 text-slate-500">Đang phát triển file <b>${routes[routeKey].file}</b>...</div>`;
    }
}

function updateSidebarActive(sidebarId) {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${sidebarId}`) item.classList.add('active');
    });
}

function executeScripts(container) {
    container.querySelectorAll('script').forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode.replaceChild(newScript, oldScript);
    });
}

window.addEventListener('DOMContentLoaded', () => { router(); checkNotifications(); });
window.addEventListener('hashchange', router);
