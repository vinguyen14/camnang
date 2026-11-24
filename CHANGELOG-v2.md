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
