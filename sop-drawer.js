/**
 * TRAINER OS - UNIVERSAL CONTEXT-AWARE SOP ENGINE (ACTION CHECKLIST EDITION)
 * Version: 5.0 Enterprise UX
 * Tính năng: Bộ phân giải Checklist thông minh, gọt sạch thụt lề, highlight từ khóa, tự cứu sinh Offline
 */

(function () {
    // 1. BỘ DỮ LIỆU CẨM NANG DỰ PHÒNG CHUẨN KHOA HỌC
    const DEFAULT_FALLBACK_SOPS = [
        // ALL / GENERAL
        { courseId: 'ALL', stepOrder: 1, stepName: 'Quản trị Lịch Đào Tạo Năm & Nhắc Hẹn', stepDesc: '1. Cấu hình đầu tháng: Trainer truy cập tab Cài Đặt Hệ Thống (settings.html) để cấu hình ngày thi các khóa KV1, Thuế, FNB, Salon, Hotel và các đợt Onboard Thứ 2 hàng tuần.\n2. Tự động nhắc hẹn: Hệ thống tự động kích hoạt Chuông Thông Báo (0 - 7 ngày) trên Header của tất cả các giao diện để nhắc Trainer chuẩn bị.' },
        { courseId: 'ALL', stepOrder: 2, stepName: 'Quy trình Điều Phối Onboard Tân Binh', stepDesc: '1. Nhận danh sách tân binh: HRBP gửi danh sách nhân sự mới trước 10:00 sáng Thứ 7 hàng tuần.\n2. Kiểm tra điều kiện mở lớp: Lớp chỉ mở khi có tối thiểu 6 học viên. Nếu <= 5 học viên, bàn giao về cho Quản lý trực tiếp (SM) tự kèm cặp theo tài liệu chuẩn.\n3. Gửi thư mời đào tạo: L&D gửi kế hoạch và thư mời học trước 12:00 Thứ 7 (cho nhóm gia nhập T2-T4) hoặc trước 16:00 (cho nhóm T5-T6).' },
        { courseId: 'ALL', stepOrder: 3, stepName: 'Quản Lý & Cấp Phát Tồn Kho Quà Tặng', stepDesc: '1. Cập nhật tồn kho: Sử dụng Tool Quản lý Quà trên tools.html để ghi nhận số lượng Nhập/Xuất thực tế sau mỗi đợt trao thưởng.\n2. Cảnh báo an toàn: Khi tồn kho một món quà xuống dưới 20%, hệ thống tự động đánh dấu đỏ cảnh báo để Trainer lên kế hoạch đặt hàng bổ sung.\n3. Lưu trữ đám mây: Bấm nút "Lưu Tồn Kho (Lên Sheets)" để đồng bộ số liệu sang Google Sheets.' },
        { courseId: 'ALL', stepOrder: 4, stepName: 'Vận Hành Hệ Thống & Sao Lưu Đám Mây', stepDesc: '1. Định kỳ sao lưu: Cuối tuần hoặc sau khi kết thúc một khóa đào tạo, Trainer truy cập trang Cài Đặt (settings.html).\n2. Thực hiện Backup: Vào mục "Đồng bộ Đám mây" và bấm nút "Thực hiện Backup" để sao lưu an toàn toàn bộ MasterDB, Roster, Vault, Database nhân sự lên Google Sheets.\n3. Khôi phục máy mới: Nếu đổi máy tính làm việc, chỉ cần dán link API và bấm "Tải Data Về Máy" để phục hồi 100% dữ liệu.' },
        
        // SPCB (RETAIL ONBOARDING)
        { courseId: 'SPCB', stepOrder: 1, stepName: 'Khởi tạo Dữ liệu & Cấu hình Khóa học', stepDesc: '1. Thiết lập thông số ban đầu: Chọn ngày học Buổi 1 (Thứ 3), nhập Mã Khóa (VD: 26KV14), dán link Google Meet 3 buổi, link Zalo group và link Drive Record bài giảng.\n2. Nạp Roster học viên: Dán toàn bộ danh sách tân binh copy từ Excel vào khung Roster (bắt buộc có cột Email công ty).\n3. Kích hoạt hệ thống: Bấm "Lưu Cấu hình & Chuyển bước" để hệ thống tự động phân loại phòng ban thành Khu vực (Hà Nội, Sài Gòn, Mekong...) và biên dịch kịch bản động.' },
        { courseId: 'SPCB', stepOrder: 2, stepName: 'Truyền thông Mời học & Chào mừng (T7 - CN)', stepDesc: '1. Gửi Mail Mời Học: Sáng Thứ 7 (trước 12:00), bấm nút "Gửi Mail Tự Động" để gửi kế hoạch đào tạo khóa mới cho các Leader/SM có tân binh tham gia.\n2. Kịch bản Zalo Chào Mừng: Sáng Chủ Nhật, lần lượt bấm nút "Gửi Zalo" để gửi 7 tin nhắn kịch bản vào Group Zalo lớp:\n- Tin 1 & 2: Chào mừng và giới thiệu Trainer đồng hành.\n- Tin 3 & 4: Lịch trình gia nhập T2 và đào tạo hội nhập.\n- Tin 5 & 6: Gửi link đăng ký trải nghiệm phần mềm KiotViet (refcode=3670) và dặn dò lưu ý.\n- Tin 7: Nhắc nhở chuẩn bị tai nghe và micro hoạt động ổn định.' },
        { courseId: 'SPCB', stepOrder: 3, stepName: 'Vận hành Lớp học Hằng ngày (T2 - T5)', stepDesc: '1. Chiều Thứ 2 (16:30): Gửi tin Zalo nhắc lịch bắt đầu đào tạo vào sáng mai kèm link Google Meet Buổi 1.\n2. Sáng Thứ 3 (08:30): Đào tạo Buổi 1 (Tổng quan & 6 bước demo). Trưa 12:00 nhắc làm Quiz LMS (45 câu). Dán kết quả LMS vào AI Daily Grader để chấm điểm và phát hiện học viên lạ.\n3. Thứ 4 (08:30): Đào tạo Buổi 2 (Phân nhánh Retail/FNB/Booking - 86 câu). Hướng dẫn kỹ phần tạo Nhóm Khách Hàng. Chấm điểm báo cáo Buổi 2.\n4. Thứ 5 (08:30): Đào tạo Buổi 3. Chiều 16:30 gửi tin dặn dò ôn thi, gửi link Thư viện E-learning Github và link Drive Record bài giảng.' },
        { courseId: 'SPCB', stepOrder: 4, stepName: 'Tổ chức Thi Final Lần 1 & Xử lý Kết quả (T6)', stepDesc: '1. Sáng Thứ 6 (09:00): Gửi tin Zalo dặn dò làm bài thi Final trên LMS lúc 10:00 (30 câu trắc nghiệm, thời gian 60 phút, điều kiện đạt >= 80%).\n2. Chấm điểm L1: Xuất dữ liệu từ LMS và dán vào khung AI Final Grader -> Bấm "Chấm Điểm Thi & Xét Duyệt L1".\n3. Phân luồng kết quả:\n- Nếu 100% Pass: Bấm "Bỏ qua L2" -> Gửi tin Zalo chúc mừng, cấp quyền Xóm Đào, form khảo sát. Khối Non-Sale rời nhóm, Sales ở lại học tiếp COC-CRM.\n- Nếu có học viên Rớt/Miss: Bấm "Gửi Mail Tự Động" thông báo kết quả L1 và hẹn lịch thi lại L2 trước 10:00 sáng Thứ 7.' },
        { courseId: 'SPCB', stepOrder: 5, stepName: 'Chấm Thi Lại L2 & Chốt Điểm Cuối Khóa (T7)', stepDesc: '1. Chấm thi đợt 2: Sáng Thứ 7 (10:00), xuất dữ liệu làm bài thi lại từ LMS và dán vào khung LMS Lần 2 -> Bấm "Chấm Điểm Lần 2 & Chốt Kết Quả".\n2. Cập nhật thông minh: Hệ thống tự động giữ nguyên các bạn đã Pass L1 và cập nhật điểm mới cao nhất cho các bạn thi lại L2.\n3. Hoàn tất khóa: Gửi Mail kết quả Final cho học viên và SM. Gửi kịch bản Zalo kết thúc tuần đào tạo.' },
        { courseId: 'SPCB', stepOrder: 6, stepName: 'Nộp Báo Cáo & Đóng Khóa MasterDB', stepDesc: '1. Lấy số liệu tự động: Bấm "Lấy Data Tự Động" để hệ thống tự điền Sĩ số, Số lượng Đạt, Số lượng Fail.\n2. Đánh giá chất lượng: Điền CSAT (mặc định 4.8/5), nhập Điểm Sáng (Highlights), Tồn Đọng (Issues) và Kế Hoạch (Action Plan).\n3. Liên kết lưu trữ: Dán link File Master danh sách và link Khóa học LMS.\n4. Đóng khóa: Bấm "XÁC NHẬN NỘP BÁO CÁO ĐÓNG KHÓA" để đồng bộ 16 cột lên Google Sheets và kích hoạt Confetti chúc mừng.' },

        // KV1 (RETAIL NÂNG CAO)
        { courseId: 'KV1', stepOrder: 1, stepName: 'Lọc Dữ Liệu Nhân Sự & Cập Nhật LMS', stepDesc: '1. Xác định đối tượng: Nhân viên Sales gia nhập sau tháng đầu tiên (toàn bộ nhân sự tuyển dụng tháng M-2).\n2. Trích xuất danh sách: Vào tools.html -> Chọn Tool Lọc HRM -> Chọn tháng dạy -> Bấm "Chạy Pipeline Tách Data" -> Chọn tab "Bước 2: Gọn (KV1)" -> Bấm "Đóng gói sang KV1".\n3. Kích hoạt tài khoản: Copy cột Email Công ty trong danh sách, mở LMS và dán đè vào cột Email cá nhân để cấp quyền thi cho học viên.' },
        { courseId: 'KV1', stepOrder: 2, stepName: 'Gửi Mail Mời Học & Kế Hoạch Đầu Tháng', stepDesc: '1. Kiểm tra cấu hình hạn chót: Chọn tháng dạy và kiểm tra hạn chót thi Lần 1 (trước 15:00 DL1) và Lần 2 (trước 16:00 DL2).\n2. Tiêu chuẩn thi: Tính năng Phần mềm KiotViet Retail nâng cao trên LMS (40 câu, 60 phút, tỷ lệ đạt >= 80%).\n3. Phát động khóa học: Bấm "Copy Nội Dung Mail" gửi học viên, đồng thời CC cho các anh/chị SM/Leader và Admin chi nhánh để phối hợp nhắc nhở.' },
        { courseId: 'KV1', stepOrder: 3, stepName: 'Khởi Tạo Group Zalo & Hướng Dẫn 2 Bước', stepDesc: '1. Lập nhóm trao đổi: Tạo group Zalo: "Group chat Test SP KV1 [Tháng/Năm]".\n2. Gửi Tin nhắn 1: Thông báo mục tiêu khóa học và đề nghị học viên thả tim xác nhận đã nhận email.\n3. Gửi Tin nhắn 2 (Lộ trình 2 bước):\n- Bước 1: Học trên Thư viện Github (xem lý thuyết, mô phỏng tình huống thực tế và chơi game ôn tập).\n- Bước 2: Đăng nhập LMS làm bài tập từng phần, sau đó mở khóa làm Bài thi tổng hợp cuối khóa.' },
        { courseId: 'KV1', stepOrder: 4, stepName: 'Đôn Đốc Tiến Độ & Nhắc Deadline (T-1)', stepDesc: '1. Thời điểm đôn đốc: Chiều trước ngày hạn chót 1 ngày (trước 15:00 ngày T-1).\n2. Kiểm tra tiến độ LMS: Lọc danh sách các bạn chưa hoàn thành hoặc chưa làm bài thi.\n3. Nhắn tin nhắc nhở: Gửi tin nhắn đôn đốc vào Group Zalo kèm file danh sách nhắc nhở các bạn sắp xếp thời gian làm bài trước hạn.' },
        { courseId: 'KV1', stepOrder: 5, stepName: 'Chấm Điểm Lần 1 & Phân Loại Học Viên', stepDesc: '1. Xuất dữ liệu L1: Đúng 15:00 ngày DL1, trích xuất kết quả thi từ LMS (chứa Email, Số câu hỏi, Số câu trả lời đúng).\n2. AI Auto-Grader: Dán vào khung Bước 5 -> Bấm "Chấm Điểm Lần 1".\n3. Xử lý phân luồng:\n- Nếu 100% Pass: Bấm "Bỏ qua Lần 2 -> Đi tới Đóng khóa".\n- Nếu có học viên Fail/Miss: Copy template mail thông báo kết quả L1 và gia hạn thi lại L2 trước 16:00 ngày DL2.' },
        { courseId: 'KV1', stepOrder: 6, stepName: 'Chấm Điểm Thi Lại L2 & Chốt Chứng Chỉ', stepDesc: '1. Xuất dữ liệu L2: Đúng 16:00 ngày DL2, trích xuất kết quả LMS đợt 2 và dán vào khung LMS Lần 2 -> Bấm "Chấm Điểm Lần 2 & Chốt Kết Quả Final".\n2. Cập nhật kết quả: Hệ thống tự động giữ nguyên kết quả Pass L1 và ghi nhận điểm mới nếu cao hơn.\n3. Công bố kết quả: Copy template "Mail Báo Điểm Final" gửi thông báo kết thúc chương trình đánh giá KV1.' },
        { courseId: 'KV1', stepOrder: 7, stepName: 'Đóng Khóa & Báo Cáo MasterDB', stepDesc: '1. Đồng bộ số liệu: Bấm "Lấy dữ liệu từ Bảng Chấm Điểm" để tự điền Tổng HV, Pass, Fail.\n2. Kiểm tra mã khóa: Khóa tự sinh mã KV1-MM-YY.\n3. Báo cáo chất lượng: Nhập CSAT, Highlights, Issues và Action Plan.\n4. Ghi nhận dữ liệu: Bấm "XÁC NHẬN NỘP BÁO CÁO ĐÓNG KHÓA" để nạp 16 cột lên MasterDB.' },

        // TAX (CHUYÊN ĐỀ THUẾ)
        { courseId: 'TAX', stepOrder: 1, stepName: 'Lọc Danh Sách & Gửi Mail Mời Học', stepDesc: '1. Đối tượng tham gia: NVKD mới bắt đầu sang tháng làm việc thứ hai (M-2) theo danh sách HDĐT & CKS toàn quốc.\n2. Lịch học tập trung: 09:00 - 12:00, Thứ 6 đầu tiên của tháng trên Google Meet.\n3. Gửi thư mời: Gửi email thông báo mời học trước ngày học tối thiểu 1 ngày (nhắc học viên phản hồi trước 17:00 Thứ 5 nếu có lý do bất khả kháng).' },
        { courseId: 'TAX', stepOrder: 2, stepName: 'Lập Group Zalo & Khảo Sát Trước Đào Tạo', stepDesc: '1. Khởi tạo nhóm: Tạo Group Zalo: "Đào tạo hóa đơn điện tử Tháng [MM/YYYY]".\n2. Xác nhận lịch: Gửi tin nhắn chào mừng, yêu cầu học viên bấm Yes trên Google Calendar và Like xác nhận tin nhắn.\n3. Khảo sát vướng mắc: Gửi link form khảo sát trước đào tạo để ghi nhận các lỗi thực tế khách hàng hay gặp.' },
        { courseId: 'TAX', stepOrder: 3, stepName: 'Tổ Chức Lớp Online & Hướng Dẫn LMS', stepDesc: '1. Chuẩn bị đầu ngày: Sáng Thứ 6 (08:30), gửi link Google Meet vào group nhắc học viên chuẩn bị mic, tai nghe.\n2. Giảng dạy tập trung: 09:00 - 12:00 (Quy định pháp lý, quy trình khởi tạo HĐĐT/CKS trên KiotViet và xử lý sự cố).\n3. Triển khai tự học: Sau buổi học, gửi hướng dẫn tự học Phần 2 trên Github (Khóa Kế toán 01, link tra cứu luật, Chatbot Thuế Kevin) và thông tin đăng nhập LMS (Email công ty + 123456A@).' },
        { courseId: 'TAX', stepOrder: 4, stepName: 'Điểm Danh & Gửi Mail Tổng Kết', stepDesc: '1. Đối soát chuyên cần: Sử dụng Tool Điểm danh AI trên tools.html để đối chiếu danh sách tham gia Google Meet.\n2. Gửi mail tổng kết: CC cho các Quản lý (SM), đính kèm file điểm danh chi tiết.\n3. Nhắc thời hạn: Thông báo thời hạn hoàn thành bài kiểm tra trắc nghiệm trên LMS (đạt >= 80%) trước 23:59 ngày DL1.' },
        { courseId: 'TAX', stepOrder: 5, stepName: 'Báo Cáo Học Viên Miss & Mail Kết Quả L1', stepDesc: '1. Đôn đốc buổi trưa: Trưa ngày DL1, gửi tin Zalo hối thúc các bạn chưa hoàn thành trước 15:00.\n2. Công bố điểm đợt 1: Xuất kết quả LMS Lần 1, gửi mail thông báo điểm L1 và lịch thi lại Lần 2 (hạn chót 11:00 Thứ 6 tuần kế tiếp).' },
        { courseId: 'TAX', stepOrder: 6, stepName: 'Chấm Thi L2 & Xuất Bảng Điểm Final', stepDesc: '1. Xuất dữ liệu đợt 2: Trích xuất kết quả LMS đợt 2 và cập nhật bảng điểm tổng hợp.\n2. Báo cáo quản lý: Gửi mail thông báo kết quả cuối khóa cho học viên và SM.\n3. Cấp chứng chỉ: Hệ thống LMS tự động cấp chứng chỉ điện tử cho học viên đạt yêu cầu.' },
        { courseId: 'TAX', stepOrder: 7, stepName: 'Nộp Báo Cáo Đóng Khóa MasterDB', stepDesc: '1. Định danh khóa: Kiểm tra Mã Khóa: TAX-MM-YY (Nhóm Khóa: TAX).\n2. Đánh giá toàn diện: Điền đầy đủ Sĩ số, Pass, Fail, CSAT (4.8/5) và nhận xét Highlights/Issues.\n3. Dán link lưu trữ: Dán link file danh sách quản lý chung và link khóa học LMS.\n4. Đóng khóa: Bấm "XÁC NHẬN NỘP BÁO CÁO ĐÓNG KHÓA" lên API.' },

        // FNB / SALON / HOTEL
        { courseId: 'FNB', stepOrder: 1, stepName: 'Lọc Danh Sách M-3 & Gửi Mail Đăng Ký', stepDesc: '1. Xác định đối tượng: Nhân viên Sales gia nhập sau 2 tháng làm việc (tuyển dụng tháng M-3).\n2. Quyền tự chọn: Học viên tự lựa chọn hoàn thành tối thiểu 1 trong 3 khóa chuyên ngành: FNB, Salon hoặc Hotel.\n3. Thông báo đầu tháng: Gửi mail đính kèm file danh sách đủ điều kiện, thông báo hạn chót L1 (40 câu trắc nghiệm, 60 phút, đạt >= 80%).' },
        { courseId: 'FNB', stepOrder: 2, stepName: 'Tạo Group Chat & Hướng Dẫn Tự Học', stepDesc: '1. Tạo Group Zalo chung: "Group chat MM/YYYY Đào tạo Sản phẩm KiotViet FNB / Booking".\n2. Hướng dẫn 2 bước:\n- Bước 1: Tự học mô phỏng nghiệp vụ Order, Thu ngân, Bếp/Bar trên Thư viện Github FNB.\n- Bước 2: Đăng nhập LMS làm bài tập từng phần để mở khóa làm bài quiz cuối khóa.' },
        { courseId: 'FNB', stepOrder: 3, stepName: 'Đôn Đốc Nhắc Nhở Giữa Kỳ', stepDesc: '1. Kiểm tra định kỳ: Kiểm tra tiến độ học tập trên LMS 3 ngày/lần.\n2. Nhắc nhở hạn chót: Trước hạn chót 1 ngày (11:00 ngày T-1), gửi tin nhắn đôn đốc vào group Zalo kèm file theo dõi tiến độ.' },
        { courseId: 'FNB', stepOrder: 4, stepName: 'Chấm Điểm L1 & Thông Báo Thi Lại L2', stepDesc: '1. Trích xuất dữ liệu: Xuất kết quả thi LMS khóa FNB đợt 1.\n2. Báo cáo kết quả: Gửi mail điểm L1 cho SM và học viên, đồng thời gia hạn thi lại lần 2 trước 16:00 ngày DL2.' },
        { courseId: 'FNB', stepOrder: 5, stepName: 'Chấm Thi L2 & Chốt Bảng Điểm Cuối Kỳ', stepDesc: '1. Chấm thi đợt 2: Trích xuất kết quả LMS đợt 2, hệ thống tự lấy điểm cao nhất cho học viên thi lại.\n2. Báo cáo kết thúc: Gửi mail công bố bảng điểm Final chính thức kết thúc khóa học chuyên ngành FNB tháng này.' },
        { courseId: 'FNB', stepOrder: 6, stepName: 'Đóng Khóa Độc Lập Cho Ngành FNB', stepDesc: '1. Chọn đúng phân hệ: Truy cập industry.html -> Chọn Radio: "KiotViet FNB" (Mã: FNB-MM-YY).\n2. Nạp số liệu: Điền sĩ số HV khóa FNB, CSAT, Highlights và Action Plan.\n3. Đóng khóa: Bấm "XÁC NHẬN NỘP BÁO CÁO ĐÓNG KHÓA" để đẩy dữ liệu lên MasterDB.' },

        { courseId: 'SALON', stepOrder: 1, stepName: 'Lọc Danh Sách & Truyền Thông Khóa Salon', stepDesc: '1. Lọc nhân sự: Nhân viên Sales tháng M-3 đăng ký học chuyên ngành Salon.\n2. Gửi thông tin: Gửi mail thông báo và link khóa học LMS KiotViet Salon.\n3. Điều phối group: Tham gia group chat chung FNB/Booking để nhận thông báo đồng bộ.' },
        { courseId: 'SALON', stepOrder: 2, stepName: 'Hướng Dẫn Tự Học & Mô Phỏng Salon', stepDesc: '1. Học mô phỏng Github: Quy trình đặt lịch hẹn, quản lý nhân viên hoa hồng, gói dịch vụ liệu trình.\n2. Khảo sát trên LMS: Làm bài tập từng phần trên LMS để kích hoạt bài test 40 câu cuối khóa.' },
        { courseId: 'SALON', stepOrder: 3, stepName: 'Chấm Điểm Thi & Báo Cáo Khóa Salon', stepDesc: '1. Xuất kết quả: Trích xuất kết quả thi L1 và L2 trên LMS.\n2. Chốt chứng chỉ: Hoàn tất danh sách học viên hoàn thành chứng chỉ chuyên ngành Salon.\n3. Báo cáo MasterDB: Truy cập industry.html -> Chọn Radio: "KiotViet Salon" (Mã: SALON-MM-YY) -> Nộp báo cáo 16 cột.' },

        { courseId: 'HOTEL', stepOrder: 1, stepName: 'Lọc Danh Sách & Truyền Thông Khóa Hotel', stepDesc: '1. Lọc nhân sự: Nhân viên Sales tháng M-3 đăng ký học chuyên ngành Khách sạn.\n2. Gửi thông tin: Gửi mail thông báo và link khóa học LMS KiotViet Hotel.\n3. Điều phối group: Tham gia group chat chung FNB/Booking nhận thông báo lịch thi.' },
        { courseId: 'HOTEL', stepOrder: 2, stepName: 'Hướng Dẫn Nghiệp Vụ Khách Sạn & Test LMS', stepDesc: '1. Nghiệp vụ thực chiến: Hướng dẫn sơ đồ phòng, nhận/trả phòng giờ/ngày/đêm, phụ trội, buồng phòng trên Github.\n2. Đánh giá cuối khóa: Hoàn thành bài kiểm tra 40 câu trắc nghiệm (đạt >= 80%).' },
        { courseId: 'HOTEL', stepOrder: 3, stepName: 'Chấm Điểm Thi & Báo Cáo Khóa Hotel', stepDesc: '1. Xuất kết quả: Trích xuất kết quả thi L1 và L2 trên LMS.\n2. Báo cáo kết quả: Gửi mail công bố kết quả final.\n3. Báo cáo MasterDB: Truy cập industry.html -> Chọn Radio: "KiotViet Hotel" (Mã: HOTEL-MM-YY) -> Nộp báo cáo 16 cột.' }
    ];

    // 2. CSS STYLES CAO CẤP (ACTION CHECKLIST SAAS DESIGN)
    const sopStyles = `
        .universal-sop-overlay {
            position: fixed; inset: 0;
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(4px);
            z-index: 999998;
            opacity: 0; pointer-events: none;
            transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .universal-sop-overlay.active { opacity: 1; pointer-events: auto; }
        
        .universal-sop-drawer {
            position: fixed; right: -500px; top: 0; bottom: 0;
            width: 480px; max-width: 95vw;
            background: #f8fafc;
            z-index: 999999;
            box-shadow: -15px 0 40px -10px rgba(0, 0, 0, 0.18);
            transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex; flex-direction: column;
            font-family: 'Inter', sans-serif;
        }
        .universal-sop-drawer.active { right: 0; }
        
        /* TIMELINE HIỆN ĐẠI */
        .sop-step-wrapper {
            position: relative;
            padding-left: 28px;
            margin-bottom: 24px;
        }
        .sop-step-wrapper::before {
            content: '';
            position: absolute;
            left: 11px;
            top: 24px;
            bottom: -24px;
            width: 2px;
            background: #e2e8f0;
        }
        .sop-step-wrapper:last-child::before { display: none; }
        
        .sop-step-dot {
            position: absolute;
            left: 2px;
            top: 14px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #ffffff;
            border: 5px solid #2563eb;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
            z-index: 5;
        }

        /* THẺ BƯỚC THAO TÁC (ACTION CARD) */
        .sop-action-card {
            background: #ffffff;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 2px 6px -1px rgba(0, 0, 0, 0.04);
            overflow: hidden;
            transition: all 0.2s ease-in-out;
        }
        .sop-action-card:hover {
            border-color: #cbd5e1;
            box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.08);
            transform: translateY(-2px);
        }

        /* NÚT KÍCH HOẠT NỔI BÊN MÉP PHẢI */
        .universal-sop-trigger {
            position: fixed;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            z-index: 99999;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: #ffffff;
            padding: 12px 8px 12px 14px;
            border-radius: 14px 0 0 14px;
            box-shadow: -4px 0 16px rgba(37, 99, 235, 0.35);
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            user-select: none;
        }
        .universal-sop-trigger:hover {
            padding-left: 18px;
            box-shadow: -6px 0 22px rgba(37, 99, 235, 0.45);
            background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        }
        .universal-sop-trigger span {
            writing-mode: vertical-rl;
            text-orientation: mixed;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
        }
    `;

    // 3. THUẬT TOÁN BÓC TÁCH CHECKLIST & SMART HIGHLIGHTER (GIẢI QUYẾT TRIỆT TIÊU LỖI THỤT DÒNG)
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function highlightKeywords(text) {
        return text
            // Nền tảng & Hệ thống (Xanh dương / Tím)
            .replace(/\b(Google Meet|LMS|Zalo|Github|Excel|MasterDB|Drive|Canva)\b/gi, 
                '<span class="inline-flex items-center px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200/80">$1</span>')
            // Thời gian & Mốc nhắc (Vàng hổ phách)
            .replace(/\b(Thứ [2-7]|Chủ Nhật|T-1|DL1|DL2|\d{1,2}:\d{2}|\d{1,2}h\d{2})\b/gi, 
                '<span class="inline-flex items-center px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200/80">$1</span>')
            // Điều kiện Pass / Tiêu chuẩn (Xanh lá)
            .replace(/(&gt;=|\b)\s*(80%|100%\s*Pass|100%|Pass)\b/gi, 
                '<span class="inline-flex items-center px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200/80">$1 $2</span>')
            // Trượt / Cảnh báo (Đỏ)
            .replace(/\b(Fail|Miss|Rớt)\b/gi, 
                '<span class="inline-flex items-center px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 font-extrabold border border-rose-200/80">$1</span>');
    }

    function formatStepDescription(rawDesc) {
        if (!rawDesc) return '<p class="text-xs text-slate-400 italic">Chưa có hướng dẫn chi tiết.</p>';

        // Gọt sạch tab (\t), ký tự thụt lề thừa trên từng dòng
        const cleanLines = rawDesc
            .split('\n')
            .map(line => line.replace(/^[\t\s]+/, '').replace(/[\t\s]+$/, ''))
            .filter(Boolean);

        let html = '<div class="space-y-3">';
        let inSubBlock = false;

        cleanLines.forEach((line) => {
            const numMatch = line.match(/^(\d+)[\.\)]\s*(.*)/);
            const bulletMatch = line.match(/^[-•*]\s*(.*)/);

            if (numMatch) {
                if (inSubBlock) { html += '</div>'; inSubBlock = false; }
                const num = numMatch[1];
                const content = numMatch[2];
                
                // Tách tiêu đề nhiệm vụ nếu có dấu hai chấm ":"
                const colonIdx = content.indexOf(':');
                let headerTxt = '';
                let descTxt = content;

                if (colonIdx > 0 && colonIdx < 50) {
                    headerTxt = `<span class="font-bold text-slate-900">${highlightKeywords(escapeHtml(content.substring(0, colonIdx + 1)))}</span> `;
                    descTxt = content.substring(colonIdx + 1).trim();
                }

                html += `
                    <div class="flex items-start gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/70">
                        <div class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-sm">
                            ${num}
                        </div>
                        <div class="flex-grow text-[12px] text-slate-700 leading-relaxed min-w-0">
                            ${headerTxt}${highlightKeywords(escapeHtml(descTxt))}
                        </div>
                    </div>
                `;
            } else if (bulletMatch) {
                if (!inSubBlock) {
                    html += '<div class="pl-9 space-y-1.5 -mt-1">';
                    inSubBlock = true;
                }
                const bulletContent = highlightKeywords(escapeHtml(bulletMatch[1]));
                html += `
                    <div class="flex items-start gap-2 text-[11.5px] text-slate-600 leading-relaxed">
                        <i class="fas fa-circle text-[5px] text-blue-500 mt-2 shrink-0"></i>
                        <span>${bulletContent}</span>
                    </div>
                `;
            } else {
                if (inSubBlock) { html += '</div>'; inSubBlock = false; }
                const regularTxt = highlightKeywords(escapeHtml(line));
                html += `<div class="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 text-[11.5px] text-slate-700 leading-relaxed">${regularTxt}</div>`;
            }
        });

        if (inSubBlock) html += '</div>';
        html += '</div>';
        return html;
    }

    // 4. NHẬN DIỆN NGỮ CẢNH TRANG TỰ ĐỘNG
    function detectContext() {
        const path = (window.location.pathname || '').toLowerCase();
        if (path.includes('spcb')) return 'SPCB';
        if (path.includes('kv1')) return 'KV1';
        if (path.includes('thuehkd')) return 'TAX';
        if (path.includes('industry')) {
            const checkedRadio = document.querySelector('input[name="industryType"]:checked');
            return checkedRadio ? checkedRadio.value.toUpperCase() : 'FNB';
        }
        return 'ALL';
    }

    // 5. TIÊM DOM GIAO DIỆN
    function injectSOPDom() {
        if (document.getElementById('universal-sop-drawer')) return;

        const styleEl = document.createElement('style');
        styleEl.innerHTML = sopStyles;
        document.head.appendChild(styleEl);

        const triggerBtn = document.createElement('div');
        triggerBtn.id = 'universal-sop-trigger-btn';
        triggerBtn.className = 'universal-sop-trigger';
        triggerBtn.title = 'Mở Cẩm Nang Quy Trình L&D';
        triggerBtn.innerHTML = `
            <i class="fas fa-book-open text-xs"></i>
            <span>SOP</span>
        `;
        triggerBtn.onclick = () => window.openUniversalSOP();
        document.body.appendChild(triggerBtn);

        const container = document.createElement('div');
        container.innerHTML = `
            <div id="universal-sop-overlay" class="universal-sop-overlay" onclick="window.closeUniversalSOP()"></div>
            <div id="universal-sop-drawer" class="universal-sop-drawer">
                <!-- HEADER CHUẨN SAAS -->
                <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0 shadow-xs">
                    <div>
                        <div class="flex items-center gap-2.5">
                            <div class="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shadow-inner">
                                <i class="fas fa-book-open"></i>
                            </div>
                            <div>
                                <h3 class="text-[15px] font-bold text-slate-900 leading-tight">Cẩm Nang Trainer (SOP)</h3>
                                <p class="text-[11px] text-slate-500 font-medium" id="sop-header-subtitle">Quy trình vận hành chuẩn L&D</p>
                            </div>
                        </div>
                    </div>
                    <button onclick="window.closeUniversalSOP()" class="text-slate-400 hover:text-rose-500 w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-200 flex items-center justify-center transition">
                        <i class="fas fa-times text-sm"></i>
                    </button>
                </div>

                <!-- TOOLBAR BỘ LỌC & TÌM KIẾM -->
                <div class="p-4 border-b border-slate-200 bg-white flex flex-col gap-3 shrink-0">
                    <div class="flex items-center gap-2">
                        <select id="sop-course-filter" onchange="window.filterSOPByCourse(this.value)" class="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                            <option value="ALL">-- Tất cả quy trình --</option>
                            <option value="SPCB">Khóa Cơ bản (SPCB - Retail)</option>
                            <option value="KV1">Khóa Sản phẩm KV1</option>
                            <option value="TAX">Chuyên đề HĐĐT & Thuế</option>
                            <option value="FNB">Chuyên ngành KiotViet FNB</option>
                            <option value="SALON">Chuyên ngành KV Salon</option>
                            <option value="HOTEL">Chuyên ngành KV Hotel</option>
                        </select>
                        <button onclick="window.syncSOPFromCloud(true)" class="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-blue-600 border border-slate-200 rounded-xl text-xs transition shadow-xs" title="Đồng bộ từ Google Sheets">
                            <i id="sop-refresh-icon" class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    <div class="relative">
                        <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                        <input type="text" id="sop-search-input" oninput="window.searchSOPSteps(this.value)" placeholder="Tìm kiếm nhanh bước quy trình..." class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition">
                    </div>
                </div>

                <!-- NỘI DUNG ACTION CHECKLIST -->
                <div id="sop-steps-body" class="flex-grow overflow-y-auto custom-scrollbar p-6 bg-slate-100/70"></div>

                <!-- FOOTER TRẠNG THÁI -->
                <div class="p-3.5 border-t border-slate-200 bg-white text-center shrink-0 flex items-center justify-between px-6 shadow-xs">
                    <span class="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                        <i class="fas fa-database text-blue-500"></i> Nguồn: <b id="sop-source-badge" class="text-slate-600 font-mono">Dự phòng</b>
                    </span>
                    <span id="sop-status-label" class="text-[10px] font-bold px-2 py-0.5 rounded-full border">Sẵn sàng</span>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') window.closeUniversalSOP();
        });

        document.querySelectorAll('input[name="industryType"]').forEach(r => {
            r.addEventListener('change', () => {
                if (document.getElementById('universal-sop-drawer')?.classList.contains('active')) {
                    window.openUniversalSOP(r.value.toUpperCase());
                }
            });
        });
    }

    // 6. LOGIC DỮ LIỆU & RENDER THẺ CHECKLIST
    let currentSops = [];
    let currentFilterCourse = 'ALL';

    window.openUniversalSOP = async function (specificCourse = null) {
        injectSOPDom();

        const overlay = document.getElementById('universal-sop-overlay');
        const drawer = document.getElementById('universal-sop-drawer');
        overlay.classList.add('active');
        drawer.classList.add('active');

        const targetCourse = specificCourse || detectContext();
        currentFilterCourse = targetCourse;

        const selectEl = document.getElementById('sop-course-filter');
        if (selectEl) selectEl.value = targetCourse;

        const subtitleEl = document.getElementById('sop-header-subtitle');
        if (subtitleEl) {
            subtitleEl.innerText = targetCourse === 'ALL' ? 'Quy trình vận hành toàn hệ thống' : `Quy trình khóa: ${targetCourse}`;
        }

        document.getElementById('sop-search-input').value = '';
        await window.loadSOPData(false);
    };

    window.closeUniversalSOP = function () {
        const overlay = document.getElementById('universal-sop-overlay');
        const drawer = document.getElementById('universal-sop-drawer');
        if (overlay) overlay.classList.remove('active');
        if (drawer) drawer.classList.remove('active');
    };

    window.loadSOPData = async function (forceRefresh = false) {
        const sessionData = sessionStorage.getItem('kv_sop_cache');
        if (sessionData && !forceRefresh) {
            try {
                currentSops = JSON.parse(sessionData);
                updateStatusBadge(true, currentSops.length);
                window.renderSOPTimeline();
                return;
            } catch (e) {}
        }

        const apiUrl = localStorage.getItem('kv_api_url') || '';

        if (!apiUrl) {
            currentSops = DEFAULT_FALLBACK_SOPS;
            updateStatusBadge(false, currentSops.length);
            window.renderSOPTimeline();
            return;
        }

        try {
            const res = await fetch(apiUrl);
            const data = await res.json();
            
            if (data && data.sops && data.sops.length > 0) {
                currentSops = data.sops;
                sessionStorage.setItem('kv_sop_cache', JSON.stringify(currentSops));
                updateStatusBadge(true, currentSops.length);
            } else {
                throw new Error("Dữ liệu trống");
            }
        } catch (err) {
            console.warn("Kích hoạt chế độ SOP Dự phòng do API chưa kết nối:", err.message);
            currentSops = DEFAULT_FALLBACK_SOPS;
            updateStatusBadge(false, currentSops.length);
        }

        window.renderSOPTimeline();
    };

    function updateStatusBadge(isCloud, count) {
        const statusLabel = document.getElementById('sop-status-label');
        const sourceBadge = document.getElementById('sop-source-badge');
        if (!statusLabel || !sourceBadge) return;

        if (isCloud) {
            sourceBadge.innerText = 'TrainerSOPs (Cloud)';
            sourceBadge.className = 'text-blue-600 font-mono font-bold';
            statusLabel.innerText = `Cloud Active (${count} bước)`;
            statusLabel.className = 'text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200';
        } else {
            sourceBadge.innerText = 'Dự phòng (Offline)';
            sourceBadge.className = 'text-amber-600 font-mono font-bold';
            statusLabel.innerText = `Chế độ Offline (${count} bước)`;
            statusLabel.className = 'text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200';
        }
    }

    window.syncSOPFromCloud = async function () {
        const icon = document.getElementById('sop-refresh-icon');
        if (icon) icon.classList.add('fa-spin');
        await window.loadSOPData(true);
        if (icon) icon.classList.remove('fa-spin');
    };

    window.filterSOPByCourse = function (courseCode) {
        currentFilterCourse = courseCode;
        const subtitleEl = document.getElementById('sop-header-subtitle');
        if (subtitleEl) {
            subtitleEl.innerText = courseCode === 'ALL' ? 'Quy trình vận hành toàn hệ thống' : `Quy trình khóa: ${courseCode}`;
        }
        window.renderSOPTimeline();
    };

    window.searchSOPSteps = function (query) {
        window.renderSOPTimeline(query.toLowerCase().trim());
    };

    // SAO CHÉP NHANH TOÀN BỘ NỘI DUNG 1 BƯỚC
    window.copyStepContent = function (stepOrder, courseId, event) {
        if (event) event.stopPropagation();
        const sop = currentSops.find(s => s.stepOrder == stepOrder && (currentFilterCourse === 'ALL' ? s.courseId === courseId : true));
        if (!sop) return;

        const cleanText = `=== [${sop.courseId}] BƯỚC ${sop.stepOrder}: ${sop.stepName} ===\n${sop.stepDesc}`;
        navigator.clipboard.writeText(cleanText).then(() => {
            const btn = event.currentTarget;
            const oldHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check text-emerald-500"></i>';
            setTimeout(() => { btn.innerHTML = oldHtml; }, 1500);
        });
    };

    window.renderSOPTimeline = function (keyword = '') {
        const bodyEl = document.getElementById('sop-steps-body');
        if (!bodyEl) return;

        let filtered = currentSops.slice();

        if (currentFilterCourse !== 'ALL') {
            filtered = filtered.filter(s => (s.courseId || '').toUpperCase() === currentFilterCourse.toUpperCase());
        }

        if (keyword) {
            filtered = filtered.filter(s => 
                (s.stepName || '').toLowerCase().includes(keyword) || 
                (s.stepDesc || '').toLowerCase().includes(keyword) ||
                (s.courseId || '').toLowerCase().includes(keyword)
            );
        }

        filtered.sort((a, b) => {
            const courseCompare = (a.courseId || '').localeCompare(b.courseId || '');
            if (courseCompare !== 0 && currentFilterCourse === 'ALL') return courseCompare;
            return (parseInt(a.stepOrder) || 0) - (parseInt(b.stepOrder) || 0);
        });

        if (filtered.length === 0) {
            bodyEl.innerHTML = `
                <div class="text-center py-16 px-4 text-slate-400">
                    <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl mx-auto mb-3 border border-slate-200 shadow-xs">
                        <i class="fas fa-search"></i>
                    </div>
                    <p class="text-xs font-bold text-slate-700">Không tìm thấy bước quy trình</p>
                    <p class="text-[11px] text-slate-400 mt-1">Hãy thử tìm với từ khóa khác.</p>
                </div>
            `;
            return;
        }

        let html = '';
        let lastCourse = null;

        filtered.forEach(sop => {
            if (currentFilterCourse === 'ALL' && sop.courseId !== lastCourse) {
                lastCourse = sop.courseId;
                html += `
                    <div class="pt-2 pb-3 mb-4 border-b border-slate-200/80 flex items-center justify-between">
                        <span class="text-xs font-black text-blue-700 uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-lg border border-blue-200">
                            Khóa Học: ${escapeHtml(sop.courseId)}
                        </span>
                    </div>
                `;
            }

            html += `
                <div class="sop-step-wrapper">
                    <div class="sop-step-dot"></div>
                    
                    <div class="sop-action-card">
                        <!-- HEADER CỦA BƯỚC -->
                        <div class="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between gap-3">
                            <div class="flex items-center gap-2.5 min-w-0">
                                <span class="px-2 py-0.5 rounded-md bg-blue-600 text-white font-black text-[10px] tracking-wider uppercase shrink-0 shadow-xs">
                                    BƯỚC ${sop.stepOrder}
                                </span>
                                <h4 class="font-bold text-slate-900 text-[13px] leading-snug truncate" title="${escapeHtml(sop.stepName)}">
                                    ${escapeHtml(sop.stepName)}
                                </h4>
                            </div>
                            <div class="flex items-center gap-1.5 shrink-0">
                                ${currentFilterCourse === 'ALL' ? `<span class="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">${escapeHtml(sop.courseId)}</span>` : ''}
                                <button onclick="window.copyStepContent('${sop.stepOrder}', '${escapeHtml(sop.courseId)}', event)" class="p-1 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-md text-xs transition" title="Sao chép hướng dẫn bước này">
                                    <i class="far fa-copy"></i>
                                </button>
                            </div>
                        </div>

                        <!-- KHỐI CHECKLIST ĐÃ ĐƯỢC BÓC TÁCH VÀ TẨY SẠCH THỤT ĐẦU DÒNG -->
                        <div class="p-4 bg-white">
                            ${formatStepDescription(sop.stepDesc)}
                        </div>
                    </div>
                </div>
            `;
        });

        bodyEl.innerHTML = html;
    };

    window.loadAndOpenSOP = function (courseId) { window.openUniversalSOP(courseId); };
    window.closeSOP = function () { window.closeUniversalSOP(); };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectSOPDom);
    } else {
        injectSOPDom();
    }
})();
