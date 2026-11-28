# 📋 CHANGELOG - TRAINER OS v2 (31/10/2026)

> **Phiên bản:** `he-thong-quan-tri-v2-311026`  
> **Bản gốc đối chiếu (Baseline):** `he-thong-quan-tri-v1-311126` (Giữ nguyên 100%)  
> **Tiêu chuẩn tuân thủ:** Golden Rules — Bảo toàn 100% tính năng hiện có, bảo toàn 100% nội dung tiếng Việt hardcode trong `<textarea>` / kịch bản Email & Zalo / Alert.

---

## Đợt 1: Lõi Hệ Thống, Backend GAS & Shared Components (5 Files)

### 1. `trainer_database codejs.txt` (Google Apps Script Backend)
- **Mở rộng `directKeys` trong `sync_up` (L277):** Nâng từ 9 keys lên đầy đủ **19 keys** hệ thống (`kv_employee_trash`, `kv_vault_trash`, `kv_product_radar`, `kv_wp_docs`, `kv_wp_docs_v2`, `kv_survey_spcb`, `kv_survey_tax`, `kv_doc_hub_backlog`, `kv_w3_compliance_done`, `kv_hrm_traceability`), chấm dứt tình trạng rơi dữ liệu khi Sao lưu lên Cloud.
- **Bảo toàn cấu trúc cây thư mục `VaultFolders` & `VaultItems`:** Bổ sung lưu và đọc trường `isExpanded` (cho `VaultFolders`) và `order` (cho `VaultItems`) trên Google Sheets.
- **Ép kiểu an toàn khi `sync_down`:** Toàn bộ trường chuỗi (`tags`, `title`, `note`, `code`, `email`, ...) được ép kiểu `String(... ?? '')` để ngăn lỗi `item.tags.split is not a function` khi Google Sheets tự động chuyển tag dạng số thành kiểu `Number`.
- **Anti-Null Guard:** Kiểm tra an toàn `(data.courseId || "").toString().trim()` trước khi đối chiếu khóa học trong `MasterDB` và `KetQuaHocVien`.

### 2. `sidebar-nav js.txt` (Universal Sidebar Engine)
- **Điều hướng chuẩn xác 3 chuyên ngành:** Cập nhật 3 link submenu Chuyên ngành thành `industry.html?type=FNB`, `industry.html?type=SALON`, `industry.html?type=HOTEL` để tự động chọn đúng phân hệ ngành khi mở trang.
- **Bảo vệ giao diện Sidebar trước Light Mode:** Khóa cứng màu nền tối `#1e293b !important` và chữ trắng `#ffffff !important` cho `#sidebar .sb-tooltip` để không bị CSS Light Mode của `system-workflow.html` ghi đè làm mất chữ.
- **Đồng bộ chấm đỏ Radar toàn cục (`#sidebar-alert-dot`):** Tự động kiểm tra `kv_product_radar` trên mọi trang để bật chấm đỏ cảnh báo cạnh mục **Radar Sản Phẩm Mới** nếu có tính năng đã Launching nhưng Trainer chưa Clear hoặc Video cần quay lại gấp.
- **Hàm `window.refreshSidebarProfile()` & Chống XSS:** Tự động cập nhật tên và chức danh trên Sidebar ngay lập tức khi lưu ở `settings.html` mà không cần tải lại trang.

### 3. `report-memo js.txt` (A4 Executive Memo & TSV Interceptor)
- **Chống XSS trên Phiếu Báo Cáo A4:** Bọc `escMemo()` cho toàn bộ dữ liệu học viên (`code`, `name`, `dept`, `email`, `status`) khi dựng bảng xem trước và bản in A4.
- **Chuẩn hóa múi giờ địa phương (`formatLocalIsoDate`):** Thay thế `new Date().toISOString().split('T')[0]` (bị lệch lùi 1 ngày trước 07:00 sáng giờ Việt Nam) bằng hàm lấy ngày theo giờ địa phương.
- **Mở rộng nhận diện Ngày Khai Giảng / Kết Thúc:** Tự động đọc dự phòng từ `conf-deadline-1`, `conf-class-date`, `conf-deadline-2` trên các trang khóa học.

### 4. `sop-drawer js.txt` (Universal SOP Drawer)
- **Chuẩn hóa `z-index`:** Hạ `z-index` của nút nổi `.universal-sop-trigger` từ `99999` xuống `990` để không đè lên các Modal xác nhận hoặc chế độ Toàn màn hình của Bảng vẽ / Code Studio.
- **An toàn sự kiện Copy:** Thay thế chuỗi `onclick="window.copyStepContent('...')"` bằng thuộc tính `data-step-order` và `data-course-id` để không bị gãy nút Copy khi nội dung SOP chứa dấu nháy đơn `'`.

### 5. `settings html.txt` (Cài đặt & Đồng bộ Đám mây 2 chiều)
- **Cầu nối đồng bộ `localforage` ↔ `localStorage` cho Bảng vẽ (`kv_global_whiteboard`):** Tích hợp thư viện `localforage.min.js` và tự động đọc/ghi dữ liệu bảng vẽ từ IndexedDB (`localforage`) khi thực hiện **Đẩy Toàn Bộ Lên Mây** (`backupToCloud`) và **Kéo Dữ Liệu Về Máy** (`restoreFromCloud`).
- **Mở rộng `KEYS_TO_SYNC` lên 20 keys:** Bao phủ toàn bộ dữ liệu cấu hình, lịch 12 tháng, khảo sát, vết lọc HRM, thùng rác và tiến độ tuần 3.

---

## Đợt 2: Trung Tâm Chỉ Huy & 4 Phân Hệ Khóa Học (5 Files)

### 6. `index html.txt` (Dashboard Trung Tâm Chỉ Huy)
- **Sửa lỗi Chuông thông báo luôn hiện chấm đỏ:** Lưu dấu vân tay danh sách thông báo đã đọc (`noti_read_date_key`) để khi bấm **"Đánh dấu đã đọc"** và chuyển tab không bị bật sáng lại chấm đỏ.
- **Lọc chuẩn xác theo Năm & Quý (`getFilteredMasterData` & `updateTrendChart`):** Trích xuất năm thực tế từ `startDate` / `finishDate` / `courseId` / `timestamp` thay vì gán cứng mọi khóa học không có `startDate` về năm 2026.
- **Chống XSS & Bảo toàn từ khóa tìm kiếm:** Bọc `escapeHtml()` cho bảng MasterDB, trạng thái trống (Empty State), khung Chat AI; giữ nguyên giá trị ô tìm kiếm khi chuyển đổi giữa tab Tổng quan và Tất cả khóa học.
- **Tính điểm CSAT động trên Slide thuyết trình (`#sl-csat`):** Tự động tính trung bình cộng CSAT thực tế từ danh sách khóa học thay vì hiển thị cố định `4.9/5.0`.
- **Sửa lỗi Bảng vẽ (`setWbMode`) & Đồng bộ Cloud:** Truyền tham số `event` tường minh vào `setWbMode(mode, ev)` và lưu đồng thời vào cả `localforage` + `localStorage`.

### 7. `spcb html.txt` (Khóa Cơ Bản TS-DS)
- **Sửa lỗi mất cột "Kết quả" khi Copy bảng điểm L1 & L2 (`copyTableToClipboard`):** Chỉ bỏ cột cuối (nút Xóa) đối với bảng `#daily-result-table`, giữ nguyên 100% cột **Kết quả (Pass/Fail/Miss)** khi copy `#result-table-1` và `#result-table-2`.
- **Khôi phục tự động Danh sách Học viên & Cấu hình Bước 1 khi F5:** Tự động nạp lại `rosterData` từ `kv_roster_SPCB` và cấu hình mã lớp/ngày học/link Zalo/Meet từ `kv_config_meta_SPCB` ngay khi tải trang.
- **Chấm điểm Lần 2 chuẩn xác (Idempotent) & Hiển thị điểm `0%`:** Lưu tách biệt `scoreL1`/`statusL1` để bấm chấm Lần 2 nhiều lần không bị ghi đè sai trạng thái Lần 1; hiển thị rõ `0%` cho học viên làm bài đạt 0 điểm thay vì `-`.
- **Đồng bộ danh sách học viên lên Sheet `KetQuaHocVien`:** Tự động cập nhật `window.currentParsedTrainees` sau khi chấm điểm để `report-memo.js` đính kèm toàn bộ học viên lên Cloud khi bấm Đóng khóa.
- **Tối ưu UX:** Thêm CSS `.step-wrap.skipped`, sửa lỗi nhấp nháy khi bấm chuyển bước nhanh (`stepSwitchTimer`), cuộn `.content-area` lên đầu trang, đóng menu cấu hình cột khi click ra ngoài, và thêm hộp thoại `confirm()` trước khi xóa học viên phát sinh.

### 8. `kv1 html.txt` (Khóa Sản Phẩm KV1 Nâng Cao)
- **Tự động nạp lại `rosterData` khi sửa danh sách ở Bước 1:** Lắng nghe sự kiện `input` và cập nhật `rosterData` ngay khi bấm hoàn thành Bước 1 (thay vì phải F5 trang mới chấm được điểm ở Bước 5).
- **Sửa lỗi lùi năm Tháng M-2 (Tháng 01 & Tháng 02):** Tự động lùi `joinYear` đi 1 năm khi tháng hiện tại là Tháng 01 hoặc Tháng 02 (VD: Tháng 01/2026 -> gia nhập Tháng 11/2025).
- **Tự động điền Mã khóa `#courseId` ngay từ Bước 1:** Sinh sẵn mã `KV1-MM-YY` trong `updateKv1Templates()` ngay cả khi người dùng nhảy thẳng tới Bước 7.
- **Chấm điểm L2 Idempotent, Hiển thị `0%`, Chống XSS & Đồng bộ `KetQuaHocVien`:** Chuẩn hóa toàn bộ luồng chấm điểm tự động và đính kèm `trainees` khi đóng khóa.

### 9. `industry html.txt` (Khóa Chuyên Ngành FNB / Salon / Hotel)
- **Tự động nhận diện Ngành từ Sidebar (`?type=FNB|SALON|HOTEL`):** Đọc tham số URL để tự động chọn đúng Radio ngành hàng, nạp đúng lịch từ `kv_dynamic_calendar` (`fnb`, `salon`, `hotel`) và mở đúng Cẩm nang SOP của ngành đang chọn (`openSelectedIndustrySOP()`).
- **Khởi tạo Tháng/Năm hiện tại chuẩn xác trên `window.onload`:** Luôn đặt `#conf-month` và `#conf-year` theo tháng/năm hiện tại ngay cả khi đã có lịch trong `kv_dynamic_calendar`.

### 10. `thuehkd html.txt` (Khóa Chuyên Đề Thuế HKD)
- **Khởi tạo Tháng/Năm hiện tại & Ngày địa phương:** Luôn đồng bộ `#conf-month` và `#conf-year` theo thời gian thực khi mở trang, sử dụng `formatLocalIsoDate()` không lệch múi giờ UTC, và chuẩn hóa tháng 2 chữ số (`01`–`12`).

---

## Đợt 3: Công Cụ Tác Nghiệp, Kho Lưu Trữ, Radar & Code Studio (4 Files)

### 11. `tools html.txt` (Bộ 7 Công Cụ Runner Tools)
- **Sửa lỗi nghiêm trọng Bộ lọc HRM (`processHRMFilter`):** Thuật toán mới tự động nhận diện cả 3 định dạng ngày phổ biến: `DD/MM/YYYY` (chuẩn Việt Nam, lấy tháng ở vị trí thứ 2), `YYYY-MM-DD` (lấy tháng ở vị trí thứ 2), và `MM/DD/YYYY` (khi phần tử thứ 2 > 12), khắc phục triệt để lỗi lấy nhầm Ngày thành Tháng.
- **Kết nối Trợ lý AI thực tế (`sendChatMessage`):** Kết nối khung Chat trong `tools.html` với endpoint `ask_ai` (Gemini AI) trên Google Apps Script kèm ngữ cảnh tồn kho quà tặng & nhân sự (tự động fallback khi Offline).
- **Chống XSS, Empty State & Đóng Dropdown khi click ra ngoài:** Bọc `escapeHtml()` và `escapeJsStr()` cho bảng Nhân sự, Thùng rác, Quà tặng, Điểm danh AI; thêm trạng thái trống khi lọc không có kết quả; tự động đóng `#gsheetFilterPanel` và `#notiDropdown` khi click ra ngoài.

### 12. `vault html.txt` (Kho Lưu Trữ Second Brain Vault)
- **Sửa lỗi thanh kéo co giãn Sidebar (`initResizer`):** Tính toán độ rộng theo `e.clientX - sidebar.getBoundingClientRect().left` để không bị nhảy lệch 256px (chiều rộng của thanh menu chính bên trái).
- **Chống vòng lặp thư mục cha-con (`isDescendantFolder`):** Vô hiệu hóa chính thư mục đang sửa và các thư mục con của nó trong danh sách chọn Thư mục cha.
- **Chống mồ côi tài nguyên khi khôi phục từ Thùng rác (`ensureValidFolderOnRestore`):** Nếu thư mục cũ của tài nguyên đã bị xóa, tự động gán về thư mục đang mở hoặc thư mục gốc đầu tiên.
- **Hoàn thiện Popup Chi tiết & Chống XSS:** Hiển thị đầy đủ danh sách Tags (`#detTags`) và Icon phân loại (`#detIcon`) khi xem chi tiết tài nguyên; reset checkbox chọn tất cả khi mở Thùng rác.

### 13. `radar html.txt` (Trạm Radar Cập Nhật Sản Phẩm & L&D Readiness)
- **Đồng bộ bộ lọc "Sắp Demo" (`upcoming`) với Huy hiệu đếm:** Loại trừ các tính năng đã ở trạng thái `'Đã Launching'` và tính số ngày theo mốc 00:00 giờ địa phương để con số trên huy hiệu **Sắp Demo** luôn khớp 100% với danh sách thẻ bên dưới.
- **Hỗ trợ đủ 3 trạng thái HDSD:** Hiển thị huy hiệu riêng cho trạng thái `'Đang viết'` (`Đang soạn HDSD` màu vàng cam) bên cạnh `'Đã cập nhật HDSD'` và `'Chưa có bài'`.
- **Làm sạch màn hình Live Iframe khi xóa tính năng:** Khi xóa tính năng đang mở trên màn hình test bên phải, tự động chuyển sang tính năng kế tiếp hoặc đưa Iframe về trạng thái trống an toàn.

### 14. `coderunner html.txt` (HTML Code Studio & Device Sandbox)
- **Giải cứu kẹt Toàn màn hình (`toggleFullscreenPreview`):** Thêm nút nổi **"Thoát Fullscreen (ESC)"** ngay trong khung Preview và lắng nghe phím tắt `Escape` để thoát chế độ toàn màn hình bất kỳ lúc nào.
- **Tự động lưu nháp (`kv_coderunner_draft`):** Lưu mã nguồn đang soạn vào `localStorage` theo thời gian thực để tải lại trang không bị mất code.
- **Chèn Console Interceptor không phân biệt hoa thường (`/<head[^>]*>/i`) & Giải phóng bộ nhớ Blob (`URL.revokeObjectURL`).**

---

## Đợt 4: Ma Trận Tri Thức, Master Data Hub & Kiến Trúc Hệ Thống (3 Files)

### 15. `knowledge html.txt` (Sơ Đồ Vận Hành 3D Matrix)
- **Kích hoạt thanh tìm kiếm Header (`filterKnowledgeDocs`):** Lọc trực tiếp các bài viết và tự động vẽ lại sơ đồ Mindmap theo từ khóa tìm kiếm (tiêu đề, vai trò, nội dung).
- **An toàn hiệu năng khi trích xuất AI (`DOMParser`):** Sử dụng `new DOMParser().parseFromString(html, 'text/html')` trong `aiExtractStepsFromHTML()` thay vì gán trực tiếp `innerHTML` để không kích hoạt tải ảnh/script ngầm.
- **Chuẩn hóa Header API POST, xử lý lỗi `#aiLoadingOverlay` bằng khối `finally`, sửa lỗi `setWbMode` và đồng bộ Bảng vẽ 2 chiều.**

### 16. `knowledge-hub html.txt` (Master Data Hub)
- **Sửa lỗi khóa cứng kích thước khi đóng Split-Screen (`toggleSplitScreen`):** Reset cả `primary.style.flex = ''` và `pane.style.flex = ''` khi tắt chế độ chia đôi màn hình để khung chính tự động giãnเต็ม 100% chiều ngang.
- **Bảo vệ bộ nhớ `localStorage` (`QuotaExceededError`) & Kiểm tra URL an toàn:** Bọc `try/catch` khi lưu `kv_doc_hub_db` và kiểm tra giao thức `http(s)://` trước khi mở Iframe tài liệu.

### 17. `system-workflow html.txt` (Live Telemetry Architecture Observer)
- **Cô lập CSS Light Mode (`:not(#sidebar)`):** Ngăn các quy tắc `.text-white` và `.text-slate-*` của chế độ Sáng làm hỏng màu chữ và Tooltip của thanh menu chính.
- **Cập nhật hồ sơ kỹ thuật khớp 100% thực tế v6.4:** Cập nhật mô tả của `radar.html` (Trạm Radar Cập Nhật Sản Phẩm & L&D Readiness) và `coderunner.html` (HTML Code Studio & Device Sandbox), đồng thời tự động vẽ lại đường dây SVG khi đóng/mở Sidebar (`transitionend`).

---

## 3. Bản Vá Nghiệm Thu Bảo Mật & Chống Sập (Security & Resilience Hardening - 03/11/2026)

### 3.1. Bảo mật Mật khẩu (Hybrid Salted SHA-256):
> ⚠️ **Đã được thay thế bởi Sprint 0 (21/11/2026)** — xem mục 4 bên dưới. Cơ chế hash phía trình duyệt cũ không có giá trị bảo mật thực (mã PIN 6 số, salt công khai) và đã bị gỡ bỏ.
- ~~Phía Client: kiểm tra mật khẩu xóa bộ nhớ bằng SHA-256 phía trình duyệt.~~ → Thay bằng xác nhận gõ cụm từ chống bấm nhầm.
- ~~Phía Backend: `clear_data` có mật khẩu mặc định fallback.~~ → Bỏ fallback, bắt buộc cấu hình `ADMIN_PASSWORD` trong Script Properties.

### 3.2. Bảo mật Gemini API Key:
- Gỡ bỏ hoàn toàn Gemini API Key hardcode trong mã nguồn backend GAS.
- Buộc đọc qua `PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY')`. Nếu chưa cấu hình, hệ thống trả về thông báo lỗi rõ ràng thay vì để lộ khóa bí mật.

### 3.3. Khắc phục sự cố giới hạn dung lượng Google Sheets (Chunking Engine):
- Google Sheets giới hạn tối đa 50.000 ký tự trên mỗi ô (cell). Bản vá đã triển khai cơ chế **tự động cắt nhỏ dữ liệu (Chunking Engine)** cho khóa `kv_global_whiteboard` và `kv_master_db` khi chuỗi dài > 45.000 ký tự thành các ô phụ `key__chunk_0_of_N`.
- Cơ chế `sync_down` tự động ráp nối (reassemble) các chunk lại nguyên vẹn trước khi nạp vào máy tính.
- Thêm tiền tố nháy đơn `'` cho chuỗi ngày tháng và số trong sheet `Settings` để tránh việc Google Sheets tự động biến đổi định dạng.

### 3.4. Bọc an toàn toàn bộ `JSON.parse` (Bulletproof Storage):
- Bọc toàn bộ các lệnh đọc `localStorage` tại 13 trang HTML và file module vào khối `try/catch` với giá trị dự phòng (`fallback defaults`).
- Đã kiểm thử thành công: Dù dữ liệu LocalStorage có bị corrupt (hỏng chuỗi JSON), 100% trang HTML đều không bị crash hay trắng trang (white-screen).

### 3.5. Tinh gọn & Loại bỏ Code dư thừa:
- Xóa bỏ khối thẻ `<aside id="sidebar">` tĩnh và đoạn code hydrate profile cũ tại 4 trang: `coderunner.html`, `radar.html`, `knowledge.html`, `vault.html`. Tất cả được ủy quyền toàn quyền cho `sidebar-nav.js`.
### 3.6. Cấu hình Model AI Tối Ưu (Gemini 2.5 Flash):
- **Model lựa chọn:** `gemini-2.5-flash` qua endpoint `v1beta`.
  - **Lý do lựa chọn:** Đây là model tối ưu nhất hiện nay cho các tác vụ trợ lý doanh nghiệp: thời gian phản hồi siêu tốc (< 1.5 giây), khả năng tóm tắt phản hồi học viên và tổng hợp kịch bản Canva Slide cực kỳ chuẩn xác, đồng thời tiết kiệm token vượt trội so với các bản Pro cồng kềnh.
- **Cơ chế Khóa API:** ~~Tích hợp sẵn key trong mã nguồn~~ → Từ Sprint 0, key **chỉ** đọc từ Script Properties (`GEMINI_API_KEY`), không có giá trị mặc định. Model thực tế đang dùng: `gemini-flash-lite-latest`.
### 3.7. Kiến Trúc Điều Phối Cấu Hình Tập Trung (Single Config Hub - system-config.js):
- **Giải quyết triệt để vấn đề sửa thủ công:** Tạo file trung tâm điều phối cấu hình duy nhất: `system-config.js`.
- **Cơ chế hoạt động:**
  - Định nghĩa sẵn biến `DEFAULT_API_URL` và hàm toàn cục `getGlobalApiUrl()` & `setGlobalApiUrl()`.
  - Toàn bộ 13 trang web HTML chỉ cần nhúng tệp này và tự động gọi API từ 1 nguồn duy nhất.
  - Khi có link Web App mới, người dùng chỉ cần:
    1. Đổi 1 dòng duy nhất trong `system-config.js`.
    2. HOẶC dán trực tiếp trên giao diện `settings.html` ➔ hệ thống sẽ tự động phát sóng (`Broadcast`) link mới cho tất cả các trang khác ngay tức thì mà không cần chạm vào code.
- **Tối ưu vòng xoay trạng thái:** Xử lý triệt để lỗi kẹt nút `Syncing...` vô tận khi API gặp sự cố phân quyền, tự động đổi sang trạng thái `API Error (Offline)` màu đỏ có tooltip giải thích rõ ràng sau khi hết thời gian chờ.
---

## 4. Sprint 0 — Vá Bảo Mật Khẩn Cấp (21/11/2026)

> Nguồn: Báo cáo kiểm thử hồi quy 21/11/2026 (SEC-01 → SEC-07, OPS-02). Snapshot trước khi sửa: `_backups/snapshot_20261121_110151_Pre_Sprint0_Security_Hotfix`.

### 4.1. Backend (`code.js` = `trainer_database.js` = `trainer_database codejs.txt`)
- **Bắt buộc API Token cho mọi request** (`doPost` và `doGet`). Token đọc từ Script Properties `API_TOKEN`; nếu chưa cấu hình → từ chối tất cả (fail-closed). So sánh chuỗi thời gian hằng.
- **Bỏ toàn bộ giá trị mặc định bí mật:** `ADMIN_PASSWORD` và `GEMINI_API_KEY` chỉ đọc từ Script Properties, thiếu thì trả lỗi rõ ràng.
- **`send_email`:** chỉ gửi tới domain trong `ALLOWED_EMAIL_DOMAINS` (mặc định `kiotviet.com`), tối đa 200 người nhận, bắt buộc có tiêu đề + nội dung.
- **Không lưu mật khẩu LMS:** cột `Password` trong `KetQuaHocVien` luôn ghi rỗng; `doGet` ẩn mọi cột tên `Password`/`Mật khẩu` và ẩn sheet `Settings`.
- **Không đồng bộ `kv_api_url`** lên/xuống Cloud (chặn tấn công đổi link API qua Restore).
- Action không xác định → trả lỗi `UNKNOWN_ACTION` thay vì rơi vào nhánh ghi MasterDB.
- `add_knowledge` chỉ nhận URL `http(s)://`; `delete_knowledge` kiểm tra thiếu `id`.
- Hàm tiện ích chạy 1 lần trong trình soạn thảo Apps Script: `generateApiToken()`, `purgeStoredPasswords()`; `testAuth()` báo trạng thái cấu hình.

### 4.2. Client
- **`system-config.js`:** tự động gắn `token` vào mọi request tới `script.google.com/macros/s/...` (GET: query `?token=`, POST: trường `token` trong body). Chỉ chấp nhận link Web App đúng định dạng; link rỗng/sai → dùng link mặc định; không còn chép cứng link mặc định vào localStorage.
- **`settings.html`:** thêm ô **API Token** (chỉ lưu trên máy, không sync); bỏ `kv_api_url` khỏi danh sách sync; Restore chỉ nhận các key dữ liệu đã biết; hiển thị lỗi khi Cloud từ chối; thay "mật khẩu" xóa bộ nhớ bằng xác nhận gõ cụm từ `XOA DU LIEU` (giữ lại link API + token).
- **`report-memo.js`:** loại bỏ trường `password` khỏi `traineeDetails` trước khi gửi lên Cloud.
- `index.html`, `knowledge.html`, `knowledge-hub.html`, `tools.html`, `sop-drawer.js`: đọc link API qua `getGlobalApiUrl()` thay vì đọc thẳng localStorage.
- `system-workflow.html`: gỡ mật khẩu hiển thị trên giao diện.
- `scratch/test_gemini*.js`: đọc key từ biến môi trường `GEMINI_API_KEY`.

### 4.3. Việc Admin phải làm thủ công (ngoài mã nguồn)
Xem `HUONG-DAN-TRIEN-KHAI-SPRINT0.md`.

### 4.4. Bản vá 24/11/2026 — Web App lỗi CORS khi token đúng
- **Nguyên nhân:** `doGet` luôn mở Sheet Kho quà của team khác (ID hardcode). Tài khoản deploy mới không có quyền xem file đó; dù đã `try/catch`, Google vẫn đánh dấu cả lượt chạy thất bại nên Web App trả trang lỗi HTML → trình duyệt báo CORS, Dashboard hiện "API Error (Offline)".
- **Sửa:** chỉ đọc Sheet Kho quà ngoài khi cấu hình Script Property `GIFT_SPREADSHEET_ID`; mặc định dùng tab `KhoQua` trong Sheet chính. Bỏ ID hardcode khỏi mã nguồn.
- `testAuth()` báo thêm trạng thái quyền đọc Sheet Kho quà; thêm `debugDoGet()` để chạy thử `doGet` trong trình soạn thảo.
- **Kho quà qua IMPORTRANGE:** `doGet` ưu tiên đọc tab `KhoQua_Import` (công thức `=IMPORTRANGE(...; "Kho!A3:F")` trong Sheet chính), sau đó mới tới `GIFT_SPREADSHEET_ID`, cuối cùng là tab `KhoQua`. Bỏ qua dòng lỗi `#REF!`; ẩn tab `KhoQua_Import` khỏi danh sách sheet của Master Data Hub.
- **Trợ lý AI chịu quá tải:** `ask_ai` thử lần lượt các model (mặc định `gemini-flash-lite-latest` → `gemini-flash-latest` → `gemini-3.8-flash`, model nhanh nhất trước; ghi đè bằng Script Property `GEMINI_MODELS`). Gặp lỗi tạm thời (503 quá tải, 429 hết hạn mức, 404 model không tồn tại) thì chờ 0,8 giây rồi chuyển model; lỗi cố định (sai key…) thì báo ngay.
- **Trợ lý AI mất chữ:** ghép đủ mọi phần văn bản của câu trả lời Gemini (trước đây chỉ lấy `parts[0]` nên câu trả lời dài bị cắt giữa chừng), bỏ phần "thought"; ghi chú khi bị cắt do `MAX_TOKENS`. Hướng dẫn Kevin không dùng tiêu đề `#` vì khung chat chỉ hiển thị chữ đậm/nghiêng và xuống dòng.
- **Model Gemini ngừng hỗ trợ:** bỏ `gemini-2.5-flash` / `gemini-2.5-flash-lite` (Google ngừng cấp cho người dùng mới) khỏi danh sách mặc định. Phân loại lỗi thành *quá tải* / *model không còn khả dụng* / *lỗi cố định*; khi tất cả đều thất bại, thông báo liệt kê lý do của từng model và nhắc Admin cập nhật `GEMINI_MODELS` nếu mọi model đều ngừng hỗ trợ.
- **Lưu lịch sử chat Trợ lý AI:** thêm `chat-history.js` (nạp ở `index.html`, `tools.html`). Lịch sử khung chat của từng trang được lưu trên máy (tối đa 60 tin) và khôi phục khi quay lại trang; tin đang chờ trả lời lúc rời trang được ghi chú rõ; thêm nút 🗑 xóa lịch sử. Không đồng bộ lên Cloud.

---

## 5. Sprint 1 — Đúng Số Liệu (24/11/2026)

> Nguồn: Báo cáo kiểm thử hồi quy 21/11/2026 (DATA-03 → DATA-06, BUG-02 → BUG-06, BUG-10). Snapshot trước khi sửa: `_backups/snapshot_20261124_101112_Pre_Sprint1_Data_Accuracy`.

### 5.1. Thư viện dùng chung `trainer-utils.js` (+ `scripts/test_trainer_utils.js`, 62 test)
Ngày giờ theo giờ địa phương, ngày lễ Việt Nam theo từng năm (bảng Tết 2025–2030), phân loại Đạt/Không đạt, đọc ngày vào làm HRM, tính CSAT từ khảo sát, kiểm tra số liệu đóng khóa, lưu kết quả chấm Lần 1. Nạp ở `index`, `tools`, `settings`, `spcb`, `kv1`, `industry`, `thuehkd`.

### 5.2. Năm 2026 gán cứng (hỏng từ 01/01/2027)
- **Dashboard:** thêm bộ chọn **Năm** (mặc định năm hiện tại, danh sách từ dữ liệu thật); bộ lọc Năm/Quý/Tháng, nhãn kỳ báo cáo, biểu đồ xu hướng theo năm đang chọn.
- **Tools – Lịch onboarding:** năm theo thời gian thực, nút chuyển năm, ngày Tết đúng từng năm; sửa lỗi bỏ sót ngày onboarding đầu tiên và đếm ngược lệch do giờ UTC.
- **Cài đặt – Lịch đào tạo:** chọn được năm (năm trước → 2 năm tới); trước đây chỉ ghi được lịch 2026 nên sang 2027 các trang khóa học không có lịch.

### 5.3. Số liệu sai / bịa
- **"Không đạt", "Chưa đạt" bị tính là Đạt** khi dán kết quả học viên → sửa, kiểm tra Không đạt trước.
- **CSAT:** chỉ lấy cột điểm 1–5 của đúng mã khóa (trước đây lấy cả timestamp "3/11/2026" → 3 điểm, cột số buổi…); khớp mã khóa chính xác (26KV14 ≠ 26KV141); không còn tự điền 4.8/5 hay CSAT chung vào khóa — có nút "Dùng CSAT chung" nếu Trainer muốn; Dashboard/slide hiện N/A khi không có CSAT (trước đây coi là 4.8, khảo sát trống coi là 5.0); backend không mặc định 4.8/5.
- **Lọc HRM:** so cả năm và tháng (trước đây người vào làm tháng 9 năm bất kỳ đều lọt danh sách M-2), đọc thêm số serial Excel và dạng 05-Mar-2026, báo các dòng không đọc được ngày.

### 5.4. Chấm điểm & đóng khóa
- SPCB: ô "Số câu hỏi" trống/0 không còn cho ra NaN (Fail) hoặc Infinity (Pass).
- SPCB/KV1: lưu kết quả Lần 1 theo mã khóa; F5 hoặc sửa danh sách không còn biến học viên đã Pass Lần 1 thành Miss khi chấm Lần 2.
- SPCB/KV1/Chuyên ngành/Thuế: chặn đóng khóa khi thiếu mã khóa hoặc Đạt + Trượt > Tổng; bỏ mã khóa điền sẵn `26KV14` (dễ ghi đè nhầm khóa cũ).
- Radar, xuất Excel Dashboard: ngày theo giờ Việt Nam thay cho `toISOString()`.

> ⚠️ Backend `code.js` có thay đổi nhỏ (không mặc định CSAT 4.8/5): cần dán lại vào Apps Script và deploy New version.

---

## 6. Sprint 2 — Đồng Bộ Cloud Tin Cậy (24/11/2026)

> Nguồn: Báo cáo kiểm thử hồi quy 21/11/2026 (DATA-01, DATA-02, DATA-07, DATA-08, BUG-05, BUG-08). Snapshot trước khi sửa: `_backups/snapshot_20261124_105055_Pre_Sprint2_Cloud_Sync`.

### 6.1. Backend (`code.js`) — cần dán lại vào Apps Script và deploy New version
- **Khóa ghi (LockService):** mỗi lúc chỉ 1 yêu cầu đọc/ghi Sheet; người thứ hai chờ tối đa 30 giây rồi nhận thông báo "Hệ thống đang bận" thay vì làm sheet trống giữa chừng / trùng / mất dòng. Trợ lý AI và gửi email không bị khóa.
- **Backup GỘP thay vì xóa trắng:** mục nào máy gửi lên trống thì giữ nguyên bản trên Cloud (trước đây Backup từ máy mới xóa sạch lịch, roster…). Danh sách nhân sự / Vault rỗng không xóa dữ liệu Cloud.
- **Tự lưu bản sao** sheet Settings (ẩn, tên `Settings_bk_<ngày giờ>`) trước mỗi lần Backup, giữ 5 bản gần nhất.
- **Ghi 1 lần** (`setValues`) thay vì từng dòng; nộp lại kết quả học viên đọc–lọc–ghi 1 lần (không trùng, không mất dòng khóa khác).
- **Action `batch_upsert`:** ghi nhiều khóa học vào MasterDB trong 1 request.
- **Giữ đúng dữ liệu:** bỏ mẹo dấu `'` khi đọc (trước đây mất 1 ký tự, có thể làm hỏng JSON ở ranh giới chunk); mã `00123` không thành `123`; nội dung bắt đầu bằng `=` `+` `-` `@` không bị chạy như công thức; ghép chunk kiểm tra đủ phần, thiếu thì bỏ qua thay vì trả JSON hỏng.
- `scripts/test_backend_security.js`: 82 test (thêm 23 test Sprint 2, mô phỏng cách Google Sheets nhận giá trị).

### 6.2. Client
- **`system-config.js`:** timeout 30 giây cho mọi request tới Apps Script; trạng thái kết nối chung (`getApiStatus`, sự kiện `kv_api_status`); hàm `ensureApiSuccess`.
- **Sidebar:** dòng trạng thái Cloud hiển thị thật (Active / Thiếu–sai API Token / Đang bận / Mất kết nối), cùng màu chấm; trước đây luôn ghi cứng "Cloud API Active".
- **SPCB / KV1 / Chuyên ngành / Thuế / Tools (kho quà):** Cloud báo lỗi thì báo lỗi, không còn hiện "HOÀN THÀNH XUẤT SẮC" / "Đã lưu thành công".
- **Tools:** không báo "Cloud API Active" khi Cloud từ chối; dữ liệu kho quà hỏng không làm sập trang.
- **Cài đặt:** Backup có hộp xác nhận, đẩy MasterDB 1 lần (`batch_upsert`); "Kéo về" chỉ tải xuống — không còn đẩy MasterDB cũ trên máy lên ghi đè dữ liệu mới trên Cloud.

---

## 7. Sprint 3 — Nền Tảng Kỹ Thuật (24/11/2026)

> Snapshot trước khi sửa: `_backups/snapshot_20261124_111505_Pre_Sprint3_Foundation`.

### 7.1. An toàn nội dung (XSS / chèn mã)
- **Master Data Hub (`knowledge-hub.html`):** 57 đối số trong các nút `onclick` chuyển từ `'${escapeHtml(x)}'` sang `${jsArg(x)}`. `escapeHtml` không có tác dụng bên trong chuỗi JS của thuộc tính (trình duyệt giải mã `&#039;` thành `'` trước khi chạy) → tên tài liệu có dấu `'` / nội dung xuống dòng làm nút "Sao chép đề bài", "Mở tài liệu"… không chạy; nội dung độc có thể chạy mã.
- Dashboard: escape tên quà (đọc từ Sheet của team khác) và link trong file Excel xuất ra.
- Vault: chỉ mở link `http(s)://`, kèm `noopener` (chặn `javascript:` / `data:`).

### 7.2. Game Quay số (`games/quayso.html`)
- Nạp `system-config.js` → có API Token; mặc định đọc dữ liệu từ Trainer OS (sheet có cột `Day, Title, Question, Answer`).
- Link API riêng của game lưu ở khóa riêng `kv_game_api_url` (trước đây dùng chung `kv_api_url` → đè link Trainer OS).
- Báo lỗi rõ ràng thay vì im lặng; escape nội dung từ Sheet.

### 7.3. Thư viện CDN
- Khóa phiên bản: `chart.js@4.4.1` (trước đây không ghi phiên bản), `d3@7.9.0` (trước đây `d3@7`).
- *Còn tồn đọng:* Tailwind vẫn dùng bản CDN (cần npm để build CSS tĩnh).

### 7.4. Quy trình & công cụ
- `scripts/sync_mirrors.js`: tự đồng bộ 21 cặp file `.txt` (gồm `code.js` → `trainer_database.js` / `trainer_database codejs.txt`); `--check` để chỉ kiểm tra.
- `scripts/run_all_tests.js [--sync]`: 1 lệnh chạy toàn bộ — mirror, cú pháp V8 (kể cả `games/`), unit test, test backend; kết quả ở `scratch/test_report.json`.
- Đưa các script công cụ (`backup_manager`, `run_regression_report`, `serve_preview`) vào git.
- Xóa thư mục `test/` (9 trang thử nghiệm cũ, có mật khẩu cũ) khỏi repo — vẫn khôi phục được từ lịch sử git.
- `.gitignore`: bỏ qua `scratch/`, file `.txt`, `trainer_database.js`. Dọn 176 MB bộ nhớ đệm Chrome trong `scratch/`.

---

## 8. Sửa nguồn dữ liệu Master Data Hub (27/11/2026)
- **Lỗi:** Master Data Hub vốn là kho tri thức sản phẩm E-Learning (Apps Script "KNOWLEDGE HUB MULTI-SHEET ENGINE" gắn với Sheet masterdata e-learning), nhưng dùng chung ô lưu link `kv_api_url` với Trainer OS. Từ khi gom cấu hình (v2.1), Hub hiển thị nhầm các sheet MasterDB / KetQuaHocVien / NhanSu… của Trainer OS.
- **Sửa:** Hub dùng link riêng `kv_hub_api_url` (`getHubApiUrl` / `setHubApiUrl` trong `system-config.js`), **mặc định đặt sẵn** Web App kho "Masterdata E-Learning - V1" (chỉ đọc, nội dung đào tạo) → mọi máy tự kết nối, không cần dán link; không cho dán nhầm link Trainer OS; bỏ dữ liệu đệm khi nguồn thay đổi.
- **Bảo mật:** API Token chỉ gắn vào request tới đúng backend Trainer OS, không gửi sang Apps Script khác (kho E-Learning, game).

## 9. Master Data Hub giao diện học thuật & thẻ báo cáo học liệu (27/11/2026)
- **`knowledge-hub-academic.js`** (mới): lớp giao diện "thư viện học liệu" đồng bộ Aurora (tự đổi Sáng/Tối), font tiêu đề serif; panel trái thành "Mục lục học liệu"; trên điện thoại mục lục là ngăn kéo mở bằng nút "Mục lục".
- Hiển thị riêng từng loại bảng (chế độ Lưới thẻ; chế độ Bảng giữ nguyên):
  - **Thư viện giáo trình** (Masterdata E-Learning): chương theo khóa, thanh % học liệu đầy đủ, mỗi bài có ảnh video + 4 huy hiệu HDSD / Infographic / Video / Quiz (viền đứt = còn thiếu).
  - **Ngân hàng đề thi** (MCQ Master): xem đề trực tiếp — danh sách bộ đề theo ngành bên trái, "tờ đề" bên phải đọc thẳng từ Google Sheet câu hỏi (CSV công khai): câu hỏi đánh số, lựa chọn A/B/C/D, nhóm theo chủ đề; đáp án ẩn, bấm hiện từng câu hoặc toàn bộ kèm giải thích; lọc chủ đề, tìm câu hỏi. Bộ đề chỉ có trên LMS (chưa có Sheet) được báo rõ.
  - **Case study** (Database Tình Huống): Ngày 1–3 × Buổi sáng/chiều, thẻ lật "Xem gợi ý".
  - **Sổ tay bài tập** (MasterExercises): Ngành → Buổi (thu gọn), mỗi bài có Yêu cầu, Hướng dẫn từng bước (thu gọn), Tiêu chí xác nhận.
- Mở thẳng danh sách đã lọc qua link `knowledge-hub.html?sheet=…&course=…&gap=video|quiz`.
- **`elearning-report.js`** (mới): thẻ "Sức khỏe kho học liệu E-Learning" trên Dashboard — mức sẵn sàng (cùng công thức với Hub), % video / quiz, số đề / tình huống / bài tập, mức sẵn sàng theo ngành, 4 khóa cần bổ sung nhiều nhất (bấm để mở danh sách thiếu trong Hub). Lưu tóm tắt 60 phút, có nút Làm mới.

## 10. Giao diện điện thoại & căn lề Master Data Hub (27/11/2026)
- **Điện thoại (< 768px), `sidebar-nav.js`:** trước đây menu trái luôn chiếm một cột làm nội dung bị ép, gần như không xem được. Nay menu ẩn hẳn, trượt ra dạng ngăn kéo khi bấm nút ☰ ở header (hoặc nút tròn góc dưới trái ở trang không có nút ☰), luôn hiện đủ chữ kể cả khi trên máy tính đang thu gọn; bấm ra ngoài / chọn trang thì tự đóng. Máy tính giữ nguyên như cũ.
- Thanh "Kỳ báo cáo" trên Dashboard xuống dòng thay vì tràn ngang trên điện thoại.
- **Master Data Hub:** nội dung căn giữa, rộng tối đa 1240px; thẻ Case study xếp lưới đều theo từng buổi (mã S1/C1…), nút cuối thẻ thẳng hàng; trên điện thoại ẩn breadcrumb / nút đổi chế độ xem và luôn hiển thị dạng thẻ 1 cột.

## 11. Thư viện giáo trình đồng bộ với Cổng học tập E-Learning (27/11/2026)
- **`elearning-sync.js`** (mới): mỗi lần mở Hub tự đối chiếu Sheet khóa học (Masterdata E-Learning) với Sheet của [Cổng học tập](https://kiotvietlnd.github.io/elearning/) + `updates-meta.json` (CSV/JSON công khai, chỉ đọc, đệm 30 phút, nút "Đồng bộ lại").
  - Ghép bài theo link quiz → link HDSD → tên bài (cùng khóa), cuối cùng theo link quiz ở khóa khác.
  - Tag **Trong khóa học** (có trong Sheet khóa học) / **Ngoài khóa học** (tính năng chỉ có trên Cổng, xếp thành nhóm riêng cuối mỗi chương).
  - Bài trong khóa có tên / video / quiz / infographic / HDSD / mô tả mới hơn trên Cổng → hiển thị bản mới, tag "Cập nhật: …" (rê chuột xem giá trị cũ → mới); quiz đổi sang ngành khác được gắn "Kiểm tra quiz".
  - Nhãn Mới / Cập nhật + ngày + tóm tắt thay đổi lấy từ `updates-meta.json`.
  - Khung "Đồng bộ với Cổng học tập": thời điểm đồng bộ, thời điểm Cổng cập nhật nội dung, đồng bộ những phần nào (số bài theo từng loại), danh sách bài đã cập nhật kèm "phát hiện từ", danh sách tính năng ngoài khóa, nhật ký 12 lần đồng bộ gần nhất (đánh dấu thay đổi mới so với lần trước).
- Chỉ số sức khỏe (trang Tổng quan Hub, thẻ báo cáo trên Dashboard) chỉ tính bài **trong khóa học**, dùng link mới nhất từ Cổng → hai nơi luôn khớp số. Không ghi gì vào Google Sheet.

## 12. Phát hành giao diện Aurora (27/11/2026)
- **Dashboard (`index.html`):** giao diện Aurora kính mờ, chế độ Sáng / Tối, đồng hồ & lời chào, tìm nhanh Ctrl+K, thẻ "Phân hệ & Công cụ".
- **`sidebar-nav.js`:** sidebar Aurora (kính mờ, bộ icon riêng), nút đổi Sáng / Tối ở chân sidebar (`setAuroraTheme` / `toggleAuroraTheme`), huy hiệu trang trên header, nâng cấp icon tự động, căn thanh bước (stepper) theo kích thước thật. Áp dụng cho các trang dùng sidebar chung.
- **Thanh bước (stepper) ở `kv1.html`, `spcb.html`:** nhãn bước không còn tràn / chồng lên nhau.
- **Điện thoại:** trang dùng sidebar độc lập (Cài đặt, Công cụ…) bỏ lề trái 240px khi sidebar đã là ngăn kéo; `settings.html`, `system-workflow.html` không còn tràn ngang ở khổ 375px.
- Kiểm tra: 15 trang ở khổ 1280px và 375px không lỗi JavaScript; 14/15 không tràn ngang (`gamification.html` là trang chiếu màn lớn, giữ nguyên).

## 13. Sửa lỗi và bảo mật 4 công cụ (27/11/2026)
- **Bảo mật chung:** khung xem trước (HTML Code Studio, Radar) không còn `allow-same-origin`, code bên trong không đọc được localStorage / API Token của trang chính. Chuỗi do người dùng nhập (tên, nhóm, ngày, id) đều được escape trước khi chèn vào trang; `onclick` dùng id được thay bằng `data-id` hoặc tham số an toàn.
- **HTML Code Studio:** mỗi lần chạy là môi trường mới (`srcdoc`), không còn lỗi biến trùng tên / setInterval cũ; console hiện `[Circular]`, Error kèm stack, bắt `info` và `unhandledrejection`, tối đa 500 dòng; Tab giữ được Ctrl+Z; lưu nháp sau 800ms, tự chạy sau 500ms, code > 60.000 ký tự không tự chạy; chọn mẫu / Dán hỏi trước và có nút Hoàn tác; Ctrl+S dùng được ở mọi chỗ.
- **Radar:** bỏ dữ liệu mẫu tự ghi vào danh sách thật (màn hình trống khi chưa có dữ liệu); dữ liệu hỏng được sao lưu `_corrupt_` trước khi làm mới; ngày tính theo giờ máy; bộ lọc từ huy hiệu tô đúng nút; sửa mục đã bị xóa không còn lỗi; khung xem trực tiếp có thông báo khi trang KiotViet chặn nhúng. Chấm đỏ Radar trên menu (`sidebar-nav.js`) dùng đúng công thức của trang Radar.
- **Kho lưu trữ:** dữ liệu hỏng được sao lưu trước, không còn bị ghi đè bằng dữ liệu mẫu; báo khi bộ nhớ đầy; sửa thư mục có icon ngoài danh sách không còn lỗi; số đếm tài nguyên luôn đúng; giữ từ khóa tìm khi ghim / xóa, tìm có debounce; Esc đóng modal.
- **Sơ đồ vận hành:** GitHub lỗi / giới hạn lượt gọi có nhãn rõ và dùng dữ liệu đã lưu (cache 15 phút, nút Quét khóa 10 giây); thêm 7 file còn thiếu; dây nối vẽ theo `<script src>` thật của từng trang, bỏ dây không có thật; số trang / module tính tự động; vẽ lại dây bằng ResizeObserver; dừng hiệu ứng khi tab ẩn.

## 14. Hiển thị điện thoại và màn hình vừa cho 4 công cụ (27/11/2026)
- **HTML Code Studio:** dưới 768px chuyển thành 2 tab "Code | Xem trước", console thu gọn dưới editor; nút "Vừa" tự thu khung thiết bị cho vừa vùng xem; thanh kéo chia đôi dùng được bằng cảm ứng và nhớ tỉ lệ.
- **Radar:** header gọn ở mọi khổ (tiêu đề 1 dòng, huy hiệu thu thành icon + số, nút "+ Thêm"); dưới 1024px 2 cột thành 1, xem trực tiếp mở khung toàn màn hình; bộ lọc cuộn ngang; modal 1 cột, nút Lưu luôn thấy.
- **Kho lưu trữ:** header gọn, ô tìm xuống dòng riêng trên điện thoại; cây thư mục thành thanh "Thư mục: … ▾"; danh sách tài nguyên dạng thẻ khi khung hẹp; nút sửa/xóa luôn hiện trên màn cảm ứng; thanh kéo nhớ độ rộng.
- **Sơ đồ vận hành:** dưới 768px các khối xếp dọc theo nhóm, mỗi khối ghi "Nạp / Được dùng ở" thay cho dây nối; chạm để xem chi tiết; lịch sử thay đổi dạng thẻ; màn vừa không chồng lấn.
- Không tràn ngang ở 375 / 768 / 1024 / 1440px; khổ ≥ 1280px giữ nguyên như cũ.

## 15. Nâng cấp tính năng 4 công cụ (28/11/2026)
- **Radar → trang học kiến thức mới cá nhân:** tự lấy tính năng Mới / Cập nhật từ Cổng học tập (dùng chung logic ghép của Master Data Hub để biết Trong / Ngoài khóa học). Mỗi mục có "Có gì mới", nút Đọc HDSD / Xem video / Học online / Infographic / Mở trong Master Hub, nút "Đã học" lưu theo từng người (`clearedBy`). Lọc Chưa học · Mới · Cập nhật · Ngoài khóa học · theo tháng, tiến độ "Đã học X/N tháng này". Mục nhập tay cũ chuyển sang tab "Theo dõi thủ công". `elearning-sync.js` thêm `getPortal()` và `buildLearningFeed()` (hàm thuần, không đổi hành vi Hub). Chấm đỏ menu chỉ báo mục thủ công cần xử lý hoặc tính năng Mới trong 14 ngày chưa học.
- **HTML Code Studio:** CodeMirror (tô màu cú pháp, số dòng, Ctrl+F tìm, Ctrl+H thay; tự quay về ô soạn thường nếu CDN lỗi); lịch sử 10 phiên bản để khôi phục; mở file và kéo thả file; mở bản xem thử ở tab mới (code vẫn chạy trong khung sandbox, không đọc được dữ liệu hệ thống); công tắc Tự chạy + nút Chạy; bấm lỗi trong console để nhảy tới dòng.
- **Kho lưu trữ:** tìm toàn kho không dấu, cả trong nội dung, nhiều từ khóa, hiện đường dẫn thư mục; phím `/` và Ctrl+K; lọc theo thẻ; xem trước YouTube / ảnh / Google Drive; kéo thả sắp xếp và chuyển thư mục; Xuất / Nhập JSON (Gộp hoặc Thay thế, có sao lưu); nút Đồng bộ Cloud (Đẩy lên / Tải về chỉ 3 khóa Kho lưu trữ, có xác nhận và sao lưu).
- **Sơ đồ vận hành:** thanh "Tình trạng hệ thống" (Cloud API, lần đồng bộ gần nhất, phiên bản đang chạy, kiểm tra sức khỏe từng trang); chế độ Dễ hiểu / Kỹ thuật; dây nối chỉ chạy hiệu ứng khi rê chuột, bỏ hiệu ứng nhấp nháy để nhẹ máy.

## 16. Thẻ KPI theo ngành, bộ lọc Radar, Import Studio (28/11/2026)
- **Thẻ KPI tóm tắt (BKL-002):** module mới `course-kpi.js` hiện trên Chuyên ngành (F&B, Salon, Hotel) và Chuyên đề Thuế: số lớp, số học viên, tỉ lệ hoàn thành, CSAT trung bình (/5), khóa gần nhất, và bảng tỉ lệ hoàn thành theo tháng T1–T12 của năm đang chọn. Đọc `kv_master_db`, tự cập nhật khi đổi năm, đổi ngành hoặc dữ liệu thay đổi; chưa có dữ liệu thì hiện hướng dẫn mở Dashboard.
- **Radar (BKL-003):** nút "📅 Sắp Demo"; lọc theo tháng và theo độ ưu tiên (Cao / Trung bình / Thấp) dùng chung cho cả hai tab; nút "Soạn tin Zalo / Email" tạo sẵn nội dung thông báo từ danh sách đang lọc (tối đa 30 mục, có link), bấm để sao chép.
- **Import Studio:** mục riêng trên menu (nhóm Công cụ & Tài nguyên), nhúng công cụ "KiotViet Import Studio V10" (`games/import-menu-v10.html`) trong khung chung của hệ thống, có nút mở tab riêng. Công cụ gốc giữ nguyên.
