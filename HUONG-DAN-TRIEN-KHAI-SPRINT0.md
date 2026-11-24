# Hướng dẫn triển khai Sprint 0 — Vá bảo mật

> Mã nguồn đã được sửa và kiểm thử. Tuy vậy, **hệ thống chỉ an toàn sau khi Admin hoàn thành các bước dưới đây** trên Google Apps Script.
>
> ⚠️ Sau bước 5, các trang sẽ **không đọc/ghi được Cloud** cho tới khi từng máy nhập API Token (bước 6). Nên làm trong giờ ít người dùng.

---

## Bước 1 — Thu hồi Gemini API Key cũ (làm ngay)

Key cũ đã nằm trong mã nguồn và trong nhiều bản sao lưu (`_backups/`, thư mục `v1`), nên cần coi như đã bị lộ.

1. Vào trang quản lý key mà bạn đã dùng để tạo key cũ (Google AI Studio → *API keys*, hoặc Google Cloud Console → *APIs & Services → Credentials*).
2. **Xóa / vô hiệu hóa** key cũ (bắt đầu bằng `AQ.Ab8…`).
3. Tạo key mới. Chỉ lưu key mới vào Script Properties ở bước 3, **không dán vào bất kỳ file nào**.

## Bước 2 — Cập nhật mã nguồn Apps Script

1. Mở project Apps Script đang chạy Web App.
2. Thay toàn bộ nội dung file mã nguồn bằng nội dung file `code.js` mới, rồi bấm **Lưu**.

## Bước 3 — Cấu hình Script Properties

Vào **Project Settings (⚙️) → Script Properties → Add script property**:

| Property | Giá trị | Bắt buộc |
|---|---|---|
| `ADMIN_PASSWORD` | Mật khẩu mới, dài (≥ 16 ký tự). **Không dùng lại mật khẩu cũ.** | Có (dùng cho xóa MasterDB) |
| `GEMINI_API_KEY` | Key mới tạo ở bước 1 | Có (dùng cho Trợ lý AI) |
| `ALLOWED_EMAIL_DOMAINS` | Ví dụ `kiotviet.com` hoặc `kiotviet.com, citigo.com.vn` | Không (mặc định `kiotviet.com`) |
| `API_TOKEN` | **Không tự gõ**, để bước 4 tạo tự động | Có |
| `GIFT_SPREADSHEET_ID` | ID Google Sheet Kho quà của team khác (tab `Kho`). **Chỉ đặt khi tài khoản deploy có quyền xem file đó**, nếu không Web App sẽ lỗi CORS. Nên dùng tab `KhoQua_Import` (bên dưới) thay cho cách này. | Không |

### Kho quà tự cập nhật từ file gốc (khuyên dùng)

1. Trong Sheet chính `Trainer_Database`, tạo tab mới tên đúng **`KhoQua_Import`**. Không dùng tab `KhoQua`, vì trang Tools xóa trắng tab đó mỗi lần lưu.
2. Ô **A1** của tab mới, gõ công thức. Google Sheet tiếng Việt dùng dấu **chấm phẩy** giữa các tham số:
   ```
   =IMPORTRANGE("https://docs.google.com/spreadsheets/d/ID_FILE_KHO_QUA"; "Kho!A3:F")
   ```
3. Ô báo `#REF!` thì rê chuột vào và bấm **Cho phép truy cập**.
4. Backend tự đọc tab này trước tiên. Dữ liệu tự cập nhật theo file gốc, và không bao giờ gây lỗi CORS như khi mở trực tiếp file ngoài.

## Bước 4 — Chạy 3 hàm tiện ích (một lần)

Trong trình soạn thảo Apps Script, chọn tên hàm ở thanh trên cùng rồi bấm **Chạy**:

1. **`generateApiToken`**: tạo `API_TOKEN` ngẫu nhiên 64 ký tự.
   - Mở **Nhật ký thực thi** (Execution log) và copy chuỗi token.
   - Lưu token ở nơi an toàn, ví dụ trình quản lý mật khẩu.
2. **`purgeStoredPasswords`**: xóa toàn bộ mật khẩu LMS đã lưu trước đây trong tab `KetQuaHocVien`.
3. **`testAuth`**: kiểm tra cấu hình. Log phải hiện ✅ cho cả `API_TOKEN`, `ADMIN_PASSWORD` và `GEMINI_API_KEY`.

## Bước 5 — Deploy phiên bản mới (giữ nguyên link)

1. **Deploy → Manage deployments**, chọn deployment hiện tại, bấm ✏️ **Edit**.
2. **Version:** chọn *New version*.
3. **Execute as:** *Me*.
4. **Who has access:** *Anyone*.
   - Các trang HTML gọi API trực tiếp từ trình duyệt, nên các chế độ yêu cầu đăng nhập Google sẽ bị lỗi CORS. Đây chính là lỗi "Bạn không có quyền truy cập" phát hiện trong lần kiểm thử 21/11.
   - Từ bản này, dữ liệu được bảo vệ bằng **API Token** thay cho cơ chế đăng nhập Google.
5. Bấm **Deploy**. Link `/exec` giữ nguyên, nên không cần sửa `system-config.js`.

## Bước 6 — Nhập token trên từng máy Trainer

1. Mở **Cài đặt Hệ thống → Cá nhân & API**.
2. Dán token vào ô **API Token (bảo mật)**, rồi bấm **Lưu**.
3. Gửi token cho từng Trainer **qua kênh riêng tư**, không đăng vào nhóm chat chung.
4. Token chỉ được lưu trên máy đó và **không** được đồng bộ lên Cloud.

## Bước 7 — Kiểm tra sau triển khai

- [ ] Mở Dashboard: header không còn báo "API Error (Offline)" và dữ liệu MasterDB tải được.
- [ ] Ở Cài đặt, bấm **Đẩy lên Cloud** rồi **Kéo về**: không báo lỗi.
- [ ] Mở link `/exec` trên một trình duyệt **chưa nhập token**: phải thấy `"code":"UNAUTHORIZED"`.
- [ ] Trợ lý AI trả lời được (nghĩa là `GEMINI_API_KEY` mới đang hoạt động).
- [ ] Sheet `KetQuaHocVien`: cột Password trống.

## Khi cần đổi token (ví dụ có người nghỉ việc)

1. Xóa property `API_TOKEN` trong Script Properties.
2. Chạy lại `generateApiToken`.
3. Gửi token mới cho các Trainer còn làm việc.

Không cần deploy lại.

## Hoàn tác (nếu có sự cố)

- **Mã nguồn local:** khôi phục snapshot `snapshot_20261121_110151_Pre_Sprint0_Security_Hotfix` bằng `scripts/backup_manager.js rollback`.
- **Apps Script:** Deploy → Manage deployments → chọn lại *Version* cũ.
  - ⚠️ Bản cũ **không có bảo mật**, chỉ nên dùng tạm thời.

## Ghi chú

- Mật khẩu admin cũ vẫn còn trong lịch sử git và trong `test/index.html` (trang prototype cũ). Sau khi đổi `ADMIN_PASSWORD` ở bước 3, mật khẩu cũ không còn tác dụng.
- Bộ test tự động cho backend: `node scripts/test_backend_security.js` (38 kiểm tra).
