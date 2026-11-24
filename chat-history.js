/**
 * TRAINER OS - LƯU LỊCH SỬ CHAT TRỢ LÝ AI (Kevin)
 * - Tự lưu nội dung khung chat (#chatHistory) của từng trang vào localStorage của máy này
 *   và khôi phục khi quay lại trang (trước đây chuyển trang là mất lịch sử).
 * - Giữ tối đa MAX_MESSAGES tin gần nhất; thêm nút "Xóa lịch sử chat" ở đầu khung chat.
 * - Không đồng bộ lên Cloud. Nút "Xóa bộ nhớ tạm" ở trang Cài đặt cũng xóa lịch sử này.
 */
(function (window, document) {
  'use strict';

  const MAX_MESSAGES = 60;
  const KEY_PREFIX = 'kv_chat_history:';
  const INTERRUPTED_HTML = '<i class="fas fa-robot text-slate-400 mt-1 text-lg"></i>' +
    '<div class="leading-relaxed flex-grow text-slate-400 italic">Bạn đã rời trang trước khi nhận được câu trả lời. Hãy hỏi lại nhé.</div>';

  function storageKey() {
    const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return KEY_PREFIX + page;
  }

  function safeGet(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
  function safeSet(key, val) { try { window.localStorage.setItem(key, val); } catch (e) {} }
  function safeRemove(key) { try { window.localStorage.removeItem(key); } catch (e) {} }

  // Tin nhắn đang chờ trả lời (vòng xoay) lúc rời trang -> thay bằng ghi chú
  function markInterrupted(box) {
    box.querySelectorAll('.fa-spin').forEach(function (spinner) {
      let bubble = spinner;
      while (bubble.parentElement && bubble.parentElement !== box) bubble = bubble.parentElement;
      if (bubble.parentElement !== box) return;
      bubble.removeAttribute('id');
      bubble.classList.add('flex', 'gap-3', 'items-start');
      bubble.innerHTML = INTERRUPTED_HTML;
    });
  }

  function trim(box) {
    while (box.children.length > MAX_MESSAGES) box.removeChild(box.firstElementChild);
  }

  function addClearButton(box, initialHtml, key) {
    const header = box.previousElementSibling;
    if (!header || header.querySelector('[data-chat-clear]')) return;
    const closeBtn = header.querySelector('button');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('data-chat-clear', '1');
    btn.title = 'Xóa lịch sử chat';
    btn.className = 'text-slate-400 hover:text-rose-500 mr-3 text-xs';
    btn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    btn.addEventListener('click', function () {
      if (!window.confirm('Xóa toàn bộ lịch sử chat trên trang này?')) return;
      safeRemove(key);
      box.innerHTML = initialHtml;
    });
    if (closeBtn) {
      const group = document.createElement('div');
      group.className = 'flex items-center';
      closeBtn.parentNode.insertBefore(group, closeBtn);
      group.appendChild(btn);
      group.appendChild(closeBtn);
    } else {
      header.appendChild(btn);
    }
  }

  function init() {
    const box = document.getElementById('chatHistory');
    if (!box || box.getAttribute('data-history-ready')) return;
    box.setAttribute('data-history-ready', '1');

    const key = storageKey();
    const initialHtml = box.innerHTML;
    const saved = safeGet(key);
    if (saved) {
      box.innerHTML = saved;
      markInterrupted(box);
      box.scrollTop = box.scrollHeight;
    }

    let timer = null;
    const save = function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        trim(box);
        if (box.innerHTML.trim() === initialHtml.trim()) safeRemove(key);
        else safeSet(key, box.innerHTML);
      }, 250);
    };
    new MutationObserver(save).observe(box, { childList: true, subtree: true, characterData: true });

    addClearButton(box, initialHtml, key);

    // Mở khung chat thì cuộn xuống tin mới nhất
    const widget = document.getElementById('chatWidget');
    if (widget) {
      new MutationObserver(function () { box.scrollTop = box.scrollHeight; })
        .observe(widget, { attributes: true, attributeFilter: ['class', 'style'] });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
