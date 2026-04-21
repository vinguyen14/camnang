window.copyText = function(btn) {
    const pre = btn.nextElementSibling;
    navigator.clipboard.writeText(pre.innerText).then(() => {
        const old = btn.innerHTML; btn.innerHTML = `<i class="fas fa-check text-emerald-500"></i>`;
        setTimeout(() => btn.innerHTML = old, 1500);
    });
};

window.courseData = {
    'SPCB': {
        menu: [
            { id: 's1', title: 'T7 - Chủ Nhật', active: true }, { id: 's2', title: 'Thứ 2 (Nhắc lịch)' },
            { id: 's3', title: 'Thứ 3 (Buổi 1)' }, { id: 's4', title: 'Thứ 4 (Buổi 2)' },
            { id: 's5', title: 'Thứ 5 (Buổi 3)' }, { id: 's6', title: 'Thứ 6 (Test)' }
        ],
        content: {
            's1': `<h3 class="text-lg font-bold text-slate-800 mb-4">Chào mừng Group Zalo (10:00 Sáng CN)</h3><div class="space-y-4">
                <div class="p-4 bg-slate-50 border border-slate-100 rounded-xl relative"><button onclick="copyText(this)" class="absolute top-4 right-4 text-[10px] font-bold bg-white text-slate-500 px-3 py-1 rounded-lg border border-slate-200">Copy</button><pre class="font-sans text-[13px] text-slate-700 font-medium whitespace-pre-wrap pr-16">Chào mừng các bạn tới Group Zalo Đào tạo KiotViet</pre></div>
                <div class="p-4 bg-slate-50 border border-slate-100 rounded-xl relative"><button onclick="copyText(this)" class="absolute top-4 right-4 text-[10px] font-bold bg-white text-slate-500 px-3 py-1 rounded-lg border border-slate-200">Copy</button><pre class="font-sans text-[13px] text-slate-700 font-medium whitespace-pre-wrap pr-16">Xin chào các bạn 😉\nMình là Nhật Vi - Chuyên viên đào tạo...</pre></div>
                <div class="p-4 bg-blue-50 border border-blue-100 rounded-xl relative"><button onclick="copyText(this)" class="absolute top-4 right-4 text-[10px] font-bold bg-white text-blue-600 px-3 py-1 rounded-lg border">Copy</button><pre class="font-sans text-[13px] text-blue-800 font-bold whitespace-pre-wrap pr-16">Link đăng ký trải nghiệm phần mềm:\nhttps://www.kiotviet.vn/?refcode=3670</pre></div>
            </div>`,
            // ... (Dán toàn bộ content còn lại của SPCB, KV1, TAX vào đây để tránh quá dài)
        },
        docs: [
            { title: 'Slides dạy B1', link: 'https://kiotvietlnd.github.io/slides/san-pham-retail' },
            { title: 'HDSD LMS cho NV', link: 'https://kiotvietlnd.github.io/training/hdsd-lms-sales#dangnhap' },
            { title: 'Playlist KH Review', link: 'https://www.youtube.com/playlist?list=PLjB-7CLwd9mFRlvz4U4FW8HJfMLpBgaMa' },
            { title: 'Gamification SPCB', link: 'https://vinguyen14.github.io/camnang/gamification' }
        ]
    },
    'KV1': {
        // ... (Dán toàn bộ menu, content, docs của KV1 vào đây)
    },
    'TAX': {
        // ... (Dán toàn bộ menu, content, docs của TAX vào đây)
    }
};
