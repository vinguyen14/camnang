/**
 * TRAINER OS - UNIVERSAL CONTEXT-AWARE SOP ENGINE (SELF-HEALING EDITION)
 * Version: 4.9 Enterprise
 * Tính năng: Tự cứu sinh Offline khi API lỗi, tự nhận diện ngữ cảnh, đồng bộ 2 chiều Google Sheets
 */

(function () {
    // 1. BỘ DỮ LIỆU CẨM NANG DỰ PHÒNG (BUILT-IN FALLBACK - ĐẢM BẢO KHÔNG BAO GIỜ BỊ LỖI)
    const DEFAULT_FALLBACK_SOPS = [
        // ALL / GENERAL
        { courseId: 'ALL', stepOrder: 1, stepName: 'Quản trị Lịch Đào Tạo Năm & Nhắc Hẹn', stepDesc: 'Đầu mỗi tháng, Trainer truy cập tab Cài Đặt Hệ Thống (settings.html) để cấu hình ngày thi các khóa KV1, Thuế, FNB, Salon, Hotel và các đợt Onboard thứ 2 hàng tuần.\nHệ thống sẽ tự động kích hoạt Chuông Thông Báo (0 - 7 ngày) trên Header của tất cả các giao diện để nhắc Trainer chuẩn bị.' },
        { courseId: 'ALL', stepOrder: 2, stepName: 'Quy trình Điều Phối Onboard Tân Binh', stepDesc: '1. Nhận danh sách: HRBP gửi danh sách nhân sự mới trước 10:00 sáng Thứ 7 hàng tuần.\n2. Kiểm tra điều kiện mở lớp: Lớp chỉ mở khi có tối thiểu 6 học viên. Nếu <= 5 học viên, bàn giao về cho Quản lý trực tiếp (SM) tự kèm cặp theo tài liệu chuẩn.\n3. Gửi thư mời: L&D gửi kế hoạch và thư mời học trước 12:00 Thứ 7 (cho nhóm gia nhập T2-T4) hoặc trước 16:00 (cho nhóm T5-T6).' },
        { courseId: 'ALL', stepOrder: 3, stepName: 'Quản Lý & Cấp Phát Tồn Kho Quà Tặng', stepDesc: '1. Cập nhật tồn kho: Sử dụng Tool Quản lý Quà trên tools.html để ghi nhận số lượng Nhập/Xuất thực tế sau mỗi đợt trao thưởng.\n2. Cảnh báo an toàn: Khi tồn kho một món quà xuống dưới 20%, hệ thống tự động đánh dấu đỏ cảnh báo để Trainer lên kế hoạch đặt hàng bổ sung.\n3. Bấm nút "Lưu Tồn Kho (Lên Sheets)" để đồng bộ số liệu sang Google Sheets.' },
        { courseId: 'ALL', stepOrder: 4, stepName: 'Vận Hành Hệ Thống & Sao Lưu Đám Mây', stepDesc: '1. Định kỳ cuối tuần hoặc sau khi kết thúc một khóa đào tạo, Trainer truy cập trang Cài Đặt (settings.html).\n2. Vào mục "Đồng bộ Đám mây" và bấm nút "Thực hiện Backup" để sao lưu an toàn toàn bộ MasterDB, Roster, Vault, Database nhân sự lên Google Sheets.\n3. Nếu đổi máy tính làm việc, chỉ cần dán link API và bấm "Tải Data Về Máy" để phục hồi 100% dữ liệu.' },
        
        // SPCB (RETAIL ONBOARDING)
        { courseId: 'SPCB', stepOrder: 1, stepName: 'Khởi tạo Dữ liệu & Cấu hình Khóa học', stepDesc: '1. Nhập thông tin ban đầu: Chọn ngày học Buổi 1 (Thứ 3), nhập Mã Khóa (VD: 26KV14), dán link Google Meet 3 buổi, link Zalo group và link Drive Record bài giảng.\n2. Nạp Roster học viên: Dán toàn bộ danh sách tân binh copy từ Excel vào khung Roster (bắt buộc có cột Email công ty).\n3. Bấm "Lưu Cấu hình & Chuyển bước": Hệ thống tự động phân loại phòng ban thành Khu vực (Hà Nội, Sài Gòn, Mekong...) và biên dịch kịch bản động.' },
        { courseId: 'SPCB', stepOrder: 2, stepName: 'Truyền thông Mời học & Chào mừng (T7 - CN)', stepDesc: '1. Sáng Thứ 7 (trước 12:00): Bấm nút "Gửi Mail Tự Động" để gửi kế hoạch đào tạo khóa mới cho các Leader/SM có tân binh tham gia.\n2. Sáng Chủ Nhật: Lần lượt bấm nút "Gửi Zalo" để gửi 7 tin nhắn kịch bản chào mừng vào Group Zalo lớp:\n- Tin 1 & 2: Chào mừng và giới thiệu Trainer đồng hành.\n- Tin 3 & 4: Lịch trình gia nhập T2 và đào tạo hội nhập.\n- Tin 5 & 6: Gửi link đăng ký trải nghiệm phần mềm KiotViet (refcode=3670) và dặn dò lưu ý.\n- Tin 7: Nhắc nhở chuẩn bị tai nghe và micro hoạt động ổn định.' },
        { courseId: 'SPCB', stepOrder: 3, stepName: 'Vận hành Lớp học Hằng ngày (T2 - T5)', stepDesc: '1. Chiều Thứ 2 (16:30): Gửi tin Zalo nhắc lịch bắt đầu đào tạo vào sáng mai kèm link Meet Buổi 1.\n2. Sáng Thứ 3 (08:30): Đào tạo Buổi 1 (Tổng quan & 6 bước demo). Trưa 12:00 nhắc làm Quiz LMS (45 câu). Dán kết quả LMS vào AI Daily Grader để chấm điểm và kiểm tra học viên lạ.\n3. Thứ 4 (08:30): Đào tạo Buổi 2 (Phân nhánh Retail/FNB/Booking - 86 câu). Lưu ý hướng dẫn kỹ phần tạo Nhóm Khách Hàng. Chấm điểm báo cáo Buổi 2.\n4. Thứ 5 (08:30): Đào tạo Buổi 3. Chiều 16:30 gửi tin dặn dò ôn thi, gửi link Thư viện E-learning Github và link Record bài giảng.' },
        { courseId: 'SPCB', stepOrder: 4, stepName: 'Tổ chức Thi Final Lần 1 & Xử lý Kết quả (T6)', stepDesc: '1. Sáng Thứ 6 (09:00): Gửi tin Zalo dặn dò làm bài thi Final trên LMS lúc 10:00 (30 câu trắc nghiệm, thời gian 60 phút, điều kiện đạt >= 80%).\n2. Chấm điểm L1: Xuất dữ liệu từ LMS và dán vào khung AI Final Grader -> Bấm "Chấm Điểm Thi & Xét Duyệt L1".\n3. Xử lý kết quả:\n- Nếu 100% Pass: Bấm "Bỏ qua L2" -> Gửi tin Zalo chúc mừng, cấp quyền Xóm Đào, form khảo sát. Khối Non-Sale rời nhóm, Sales ở lại học tiếp COC-CRM.\n- Nếu có học viên Rớt/Miss: Bấm "Gửi Mail Tự Động" thông báo kết quả L1 và hẹn lịch thi lại L2 trước 10:00 sáng Thứ 7.' },
        { courseId: 'SPCB', stepOrder: 5, stepName: 'Chấm Thi Lại L2 & Chốt Điểm Cuối Khóa (T7)', stepDesc: '1. Sáng Thứ 7 (10:00): Xuất dữ liệu làm bài thi lại từ LMS và dán vào khung LMS Lần 2 -> Bấm "Chấm Điểm Lần 2 & Chốt Kết Quả".\n2. Hệ thống tự động giữ nguyên các bạn đã Pass L1 và cập nhật điểm mới cao nhất cho các bạn thi lại L2.\n3. Gửi Mail kết quả Final cho học viên và SM. Gửi kịch bản Zalo kết thúc tuần đào tạo.' },
        { courseId: 'SPCB', stepOrder: 6, stepName: 'Nộp Báo Cáo & Đóng Khóa MasterDB', stepDesc: '1. Lấy dữ liệu tự động: Bấm "Lấy Data Tự Động" để hệ thống tự điền Sĩ số, Số lượng Đạt, Số lượng Fail.\n2. Điểm khảo sát CSAT: Mặc định 4.8/5 hoặc điền theo kết quả khảo sát thực tế.\n3. Đánh giá chất lượng: Nhập Điểm Sáng (Highlights), Tồn Đọng (Issues) và Kế Hoạch Đề Xuất (Action Plan) cho Trainer tháng tới.\n4. Dán link File Master danh sách và link Khóa học LMS.\n5. Bấm "XÁC NHẬN NỘP BÁO CÁO ĐÓNG KHÓA": Hệ thống đồng bộ 16 cột lên Google Sheets và bắn pháo hoa Confetti chúc mừng.' },

        // KV1 (RETAIL NÂNG CAO)
        { courseId: 'KV1', stepOrder: 1, stepName: 'Lọc Dữ Liệu Nhân Sự & Cập Nhật LMS', stepDesc: '1. Xác định đối tượng: Nhân viên Sales gia nhập sau tháng đầu tiên (toàn bộ nhân sự tuyển dụng tháng M-2).\n2. Lọc danh sách: Vào tools.html -> Chọn Tool Lọc HRM -> Chọn tháng dạy -> Bấm "Chạy Pipeline Tách Data" -> Chọn tab "Bước 2: Gọn (KV1)" -> Bấm "Đóng gói sang KV1".\n3. Cập nhật tài khoản LMS: Copy cột Email Công ty trong danh sách, mở LMS và dán đè vào cột Email cá nhân để kích hoạt tài khoản làm bài thi cho học viên.' },
        { courseId: 'KV1', stepOrder: 2, stepName: 'Gửi Mail Mời Học & Kế Hoạch Đầu Tháng', stepDesc: '1. Kiểm tra cấu hình: Chọn tháng dạy và kiểm tra hạn chót thi Lần 1 (trước 15:00 DL1) và Lần 2 (trước 16:00 DL2).\n2. Nội dung đào tạo: Tính năng Phần mềm KiotViet Retail nâng cao. Hình thức: Tự học và thi trắc nghiệm trên LMS (40 câu, 60 phút, tỷ lệ đạt >= 80%).\n3. Bấm "Copy Nội Dung Mail" và gửi thông báo đến học viên, đồng thời CC cho các anh/chị SM/Leader và Admin chi nhánh để hỗ trợ đôn đốc.' },
        { courseId: 'KV1', stepOrder: 3, stepName: 'Khởi Tạo Group Zalo & Hướng Dẫn 2 Bước', stepDesc: '1. Tạo group Zalo: "Group chat Test SP KV1 [Tháng/Năm]".\n2. Gửi Tin nhắn 1: Thông báo mục tiêu khóa học và đề nghị học viên thả tim xác nhận đã nhận email.\n3. Gửi Tin nhắn 2 (Quy trình học 2 bước):\n- Bước 1: Học trên Thư viện Github (xem lý thuyết, mô phỏng tình huống thực tế và chơi game ôn tập).\n- Bước 2: Đăng nhập LMS làm bài tập từng phần, sau đó mở khóa làm Bài thi tổng hợp cuối khóa.' },
        { courseId: 'KV1', stepOrder: 4, stepName: 'Đôn Đốc Tiến Độ & Nhắc Deadline (T-1)', stepDesc: '1. Thời điểm: Chiều trước ngày hạn chót 1 ngày (trước 15:00 ngày T-1).\n2. Kiểm tra tiến độ trên LMS, lọc ra danh sách các bạn chưa hoàn thành hoặc chưa làm bài.\n3. Gửi tin nhắn đôn đốc vào Group Zalo kèm file danh sách nhắc nhở các bạn tranh thủ làm bài trước hạn chót.' },
        { courseId: 'KV1', stepOrder: 5, stepName: 'Chấm Điểm Lần 1 & Phân Loại Học Viên', stepDesc: '1. Đúng 15:00 ngày DL1: Trích xuất kết quả thi từ LMS (chứa cột Email, Số câu hỏi, Số câu trả lời đúng).\n2. Dán vào khung AI Auto-Grader (Bước 5) -> Bấm "Chấm Điểm Lần 1".\n3. Phân luồng:\n- Nếu 100% Pass: Bấm "Bỏ qua Lần 2 -> Đi tới Đóng khóa".\n- Nếu có học viên Fail/Miss: Copy template mail thông báo kết quả L1 và gia hạn làm lại L2 trước 16:00 ngày DL2.' },
        { courseId: 'KV1', stepOrder: 6, stepName: 'Chấm Điểm Thi Lại L2 & Chốt Chứng Chỉ', stepDesc: '1. Đúng 16:00 ngày DL2: Trích xuất kết quả LMS đợt 2 và dán vào khung LMS Lần 2 -> Bấm "Chấm Điểm Lần 2 & Chốt Kết Quả Final".\n2. Hệ thống tự động giữ nguyên kết quả Pass L1 và chỉ cập nhật điểm mới nếu cao hơn.\n3. Copy template "Mail Báo Điểm Final" gửi thông báo kết thúc chương trình đánh giá KV1 tháng này.' },
        { courseId: 'KV1', stepOrder: 7, stepName: 'Đóng Khóa & Báo Cáo MasterDB', stepDesc: '1. Bấm "Lấy dữ liệu từ Bảng Chấm Điểm" để tự điền Tổng HV, Pass, Fail.\n2. Kiểm tra mã khóa tự động: KV1-MM-YY.\n3. Nhập CSAT, Highlights, Issues và Action Plan để phục vụ báo cáo AI.\n4. Bấm "XÁC NHẬN NỘP BÁO CÁO ĐÓNG KHÓA" để ghi nhận dữ liệu 16 cột lên MasterDB.' },

        // TAX (CHUYÊN ĐỀ THUẾ)
        { courseId: 'TAX', stepOrder: 1, stepName: 'Lọc Danh Sách & Gửi Mail Mời Học', stepDesc: '1. Đối tượng: Nhân viên kinh doanh mới bắt đầu sang tháng làm việc thứ hai (M-2) theo danh sách HDĐT & CKS toàn quốc.\n2. Thời gian học online tập trung: 09:00 - 12:00, Thứ 6 đầu tiên của tháng trên Google Meet.\n3. Gửi email thông báo mời học trước ngày học tối thiểu 1 ngày (nhắc học viên phản hồi trước 17:00 Thứ 5 nếu có lý do bất khả kháng).' },
        { courseId: 'TAX', stepOrder: 2, stepName: 'Lập Group Zalo & Khảo Sát Trước Đào Tạo', stepDesc: '1. Tạo Group Zalo: "Đào tạo hóa đơn điện tử Tháng [MM/YYYY]".\n2. Gửi tin nhắn chào mừng, yêu cầu học viên bấm Yes trên Google Calendar và Like xác nhận tin nhắn.\n3. Gửi link form khảo sát trước đào tạo để ghi nhận các vướng mắc thực tế từ khách hàng.' },
        { courseId: 'TAX', stepOrder: 3, stepName: 'Tổ Chức Lớp Online & Hướng Dẫn LMS', stepDesc: '1. Sáng Thứ 6 (08:30): Gửi link Google Meet vào group nhắc học viên chuẩn bị máy tính, tai nghe, micro.\n2. Giảng dạy: 09:00 - 12:00 (Tổng quan quy định pháp lý, quy trình khởi tạo HĐĐT/CKS trên KiotViet và xử lý lỗi thường gặp).\n3. Sau buổi học: Gửi hướng dẫn tự học Phần 2 trên Github (Khóa học Kế toán 01, link tài liệu luật, Chatbot Thuế Kevin) và thông tin đăng nhập LMS (Email công ty + 123456A@).' },
        { courseId: 'TAX', stepOrder: 4, stepName: 'Điểm Danh & Gửi Mail Tổng Kết', stepDesc: '1. Sử dụng Tool Điểm danh AI trên tools.html để đối chiếu danh sách tham gia Google Meet.\n2. Gửi mail tổng kết cho học viên và CC cho các Quản lý (SM), đính kèm file điểm danh.\n3. Thông báo thời hạn hoàn thành bài kiểm tra trắc nghiệm trên LMS (đạt >= 80%) trước 23:59 ngày DL1.' },
        { courseId: 'TAX', stepOrder: 5, stepName: 'Báo Cáo Học Viên Miss & Mail Kết Quả L1', stepDesc: '1. Trưa ngày DL1: Gửi tin Zalo hối thúc các bạn chưa hoàn thành trước 15:00.\n2. Xuất kết quả LMS Lần 1: Gửi mail công bố điểm L1 và thông báo lịch test Lần 2 (hạn chót 11:00 Thứ 6 tuần kế tiếp).' },
        { courseId: 'TAX', stepOrder: 6, stepName: 'Chấm Thi L2 & Xuất Bảng Điểm Final', stepDesc: '1. Trích xuất kết quả LMS đợt 2.\n2. Gửi mail thông báo kết quả cuối khóa cho học viên và SM.\n3. Cấp chứng chỉ điện tử tự động trên hệ thống LMS cho các bạn đạt yêu cầu.' },
        { courseId: 'TAX', stepOrder: 7, stepName: 'Nộp Báo Cáo Đóng Khóa MasterDB', stepDesc: '1. Kiểm tra Mã Khóa: TAX-MM-YY (Nhóm Khóa: TAX).\n2. Điền đầy đủ Sĩ số, Pass, Fail, CSAT (4.8/5) và nhận xét Highlights/Issues.\n3. Dán link file danh sách quản lý chung và link khóa học LMS.\n4. Bấm "XÁC NHẬN NỘP BÁO CÁO ĐÓNG KHÓA" lên API.' },

        // FNB / SALON / HOTEL
        { courseId: 'FNB', stepOrder: 1, stepName: 'Lọc Danh Sách M-3 & Gửi Mail Đăng Ký', stepDesc: '1. Đối tượng: Nhân viên Sales gia nhập sau 2 tháng làm việc (tuyển dụng tháng M-3).\n2. Hình thức: Học viên tự lựa chọn hoàn thành tối thiểu 1 trong 3 khóa chuyên ngành: FNB, Salon hoặc Hotel.\n3. Gửi mail đầu tháng đính kèm file danh sách đủ điều kiện, thông báo hạn chót L1 (40 câu trắc nghiệm, 60 phút, đạt >= 80%).' },
        { courseId: 'FNB', stepOrder: 2, stepName: 'Tạo Group Chat & Hướng Dẫn Tự Học', stepDesc: '1. Tạo Group Zalo: "Group chat MM/YYYY Đào tạo Sản phẩm KiotViet FNB / Booking".\n2. Gửi tin nhắn hướng dẫn 2 bước:\n- Bước 1: Học trên Thư viện Github chuyên ngành FNB (xem lý thuyết, mô phỏng Order, Thu ngân, Bếp/Bar).\n- Bước 2: Đăng nhập LMS làm bài tập từng phần để mở khóa làm bài quiz cuối khóa.' },
        { courseId: 'FNB', stepOrder: 3, stepName: 'Đôn Đốc Nhắc Nhở Giữa Kỳ', stepDesc: '1. Kiểm tra tiến độ học tập trên LMS định kỳ 3 ngày/lần.\n2. Trước hạn chót 1 ngày (11:00 ngày T-1), gửi tin nhắn đôn đốc vào group Zalo kèm file theo dõi tiến độ.' },
        { courseId: 'FNB', stepOrder: 4, stepName: 'Chấm Điểm L1 & Thông Báo Thi Lại L2', stepDesc: '1. Trích xuất dữ liệu LMS khóa FNB đợt 1.\n2. Soạn email gửi kết quả thi lần 1 cho SM và học viên, đồng thời gia hạn thi lại lần 2 trước 16:00 ngày DL2.' },
        { courseId: 'FNB', stepOrder: 5, stepName: 'Chấm Thi L2 & Chốt Bảng Điểm Cuối Kỳ', stepDesc: '1. Trích xuất kết quả LMS đợt 2, cập nhật điểm cao nhất cho học viên thi lại.\n2. Gửi mail công bố bảng điểm Final chính thức kết thúc khóa học chuyên ngành FNB tháng này.' },
        { courseId: 'FNB', stepOrder: 6, stepName: 'Đóng Khóa Độc Lập Cho Ngành FNB', stepDesc: '1. Truy cập industry.html -> Chọn Radio: "KiotViet FNB" (Mã: FNB-MM-YY).\n2. Điền số liệu HV khóa FNB, CSAT, Highlights và Action Plan.\n3. Bấm "XÁC NHẬN NỘP BÁO CÁO ĐÓNG KHÓA" để đẩy dữ liệu lên MasterDB.' },

        { courseId: 'SALON', stepOrder: 1, stepName: 'Lọc Danh Sách & Truyền Thông Khóa Salon', stepDesc: '1. Đối tượng: Nhân viên Sales tháng M-3 đăng ký học chuyên ngành Salon.\n2. Gửi mail thông báo và link khóa học LMS KiotViet Salon.\n3. Tham gia group chat chung FNB/Booking để nhận thông báo đồng bộ.' },
        { courseId: 'SALON', stepOrder: 2, stepName: 'Hướng Dẫn Tự Học & Mô Phỏng Salon', stepDesc: '1. Hướng dẫn học trên Github chuyên ngành Salon: Quy trình đặt lịch hẹn, quản lý nhân viên hoa hồng, gói dịch vụ liệu trình.\n2. Làm bài tập từng phần trên LMS để kích hoạt bài test 40 câu cuối khóa.' },
        { courseId: 'SALON', stepOrder: 3, stepName: 'Chấm Điểm Thi & Báo Cáo Khóa Salon', stepDesc: '1. Trích xuất kết quả thi L1 và L2 trên LMS.\n2. Chốt danh sách học viên hoàn thành chứng chỉ chuyên ngành Salon.\n3. Truy cập industry.html -> Chọn Radio: "KiotViet Salon" (Mã: SALON-MM-YY) -> Nộp báo cáo 16 cột lên MasterDB.' },

        { courseId: 'HOTEL', stepOrder: 1, stepName: 'Lọc Danh Sách & Truyền Thông Khóa Hotel', stepDesc: '1. Đối tượng: Nhân viên Sales tháng M-3 đăng ký học chuyên ngành Khách sạn.\n2. Gửi mail thông báo và link khóa học LMS KiotViet Hotel.\n3. Tham gia group chat chung FNB/Booking nhận thông báo lịch thi.' },
        { courseId: 'HOTEL', stepOrder: 2, stepName: 'Hướng Dẫn Nghiệp Vụ Khách Sạn & Test LMS', stepDesc: '1. Hướng dẫn tài liệu Github Hotel: Sơ đồ phòng, nhận/trả phòng giờ/ngày/đêm, phụ trội, buồng phòng.\n2. Hoàn thành bài kiểm tra 40 câu trắc nghiệm (đạt >= 80%).' },
        { courseId: 'HOTEL', stepOrder: 3, stepName: 'Chấm Điểm Thi & Báo Cáo Khóa Hotel', stepDesc: '1. Trích xuất kết quả thi L1 và L2 trên LMS.\n2. Gửi mail công bố kết quả final.\n3. Truy cập industry.html -> Chọn Radio: "KiotViet Hotel" (Mã: HOTEL-MM-YY) -> Nộp báo cáo 16 cột lên MasterDB.' }
    ];

    // 2. CSS STYLES INJECTION
    const sopStyles = `
        .universal-sop-overlay {
            position: fixed; inset: 0;
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(3px);
            z-index: 999998;
            opacity: 0; pointer-events: none;
            transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .universal-sop-overlay.active { opacity: 1; pointer-events: auto; }
        
        .universal-sop-drawer {
            position: fixed; right: -460px; top: 0; bottom: 0;
            width: 460px; max-width: 95vw;
            background: #ffffff;
            z-index: 999999;
            box-shadow: -10px 0 35px -5px rgba(0, 0, 0, 0.15);
            transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex; flex-direction: column;
            font-family: 'Inter', sans-serif;
        }
        .universal-sop-drawer.active { right: 0; }
        
        .sop-timeline-item {
            position: relative;
            padding-left: 28px;
            padding-bottom: 24px;
            border-left: 2px solid #e2e8f0;
            margin-left: 14px;
        }
        .sop-timeline-item:last-child { border-left-color: transparent; padding-bottom: 0; }
        
        .sop-timeline-dot {
            position: absolute; left: -9px; top: 2px;
            width: 16px; height: 16px;
            border-radius: 50%;
            background: #ffffff;
            border: 4px solid #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .universal-sop-trigger {
            position: fixed;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            z-index: 99999;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: #ffffff;
            padding: 10px 8px 10px 12px;
            border-radius: 12px 0 0 12px;
            box-shadow: -4px 0 15px rgba(37, 99, 235, 0.3);
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            user-select: none;
        }
        .universal-sop-trigger:hover {
            padding-left: 16px;
            box-shadow: -6px 0 20px rgba(37, 99, 235, 0.4);
            background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        }
        .universal-sop-trigger span {
            writing-mode: vertical-rl;
            text-orientation: mixed;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.1em;
            text-transform: uppercase;
        }
    `;

    // 3. TỰ ĐỘNG NHẬN DIỆN NGỮ CẢNH TRANG
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

    // 4. TIÊM DOM GIAO DIỆN
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
                <div class="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                    <div>
                        <div class="flex items-center gap-2">
                            <div class="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shadow-inner">
                                <i class="fas fa-book-open"></i>
                            </div>
                            <h3 class="text-base font-bold text-slate-800">Cẩm Nang Trainer (SOP)</h3>
                        </div>
                        <p class="text-[11px] text-slate-500 mt-0.5" id="sop-header-subtitle">Quy trình vận hành chuẩn</p>
                    </div>
                    <button onclick="window.closeUniversalSOP()" class="text-slate-400 hover:text-rose-500 w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center transition shadow-xs">
                        <i class="fas fa-times text-sm"></i>
                    </button>
                </div>

                <div class="p-4 border-b border-slate-100 bg-white flex flex-col gap-3 shrink-0 shadow-xs">
                    <div class="flex items-center gap-2">
                        <select id="sop-course-filter" onchange="window.filterSOPByCourse(this.value)" class="flex-1 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                            <option value="ALL">-- Tất cả quy trình --</option>
                            <option value="SPCB">Khóa Cơ bản (SPCB - Retail)</option>
                            <option value="KV1">Khóa Sản phẩm KV1</option>
                            <option value="TAX">Chuyên đề HĐĐT & Thuế</option>
                            <option value="FNB">Chuyên ngành KiotViet FNB</option>
                            <option value="SALON">Chuyên ngành KV Salon</option>
                            <option value="HOTEL">Chuyên ngành KV Hotel</option>
                        </select>
                        <button onclick="window.syncSOPFromCloud(true)" class="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-blue-600 border border-slate-200 rounded-lg text-xs transition" title="Tải lại từ Google Sheets">
                            <i id="sop-refresh-icon" class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    <div class="relative">
                        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                        <input type="text" id="sop-search-input" oninput="window.searchSOPSteps(this.value)" placeholder="Tìm kiếm bước quy trình..." class="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition">
                    </div>
                </div>

                <div id="sop-steps-body" class="flex-grow overflow-y-auto custom-scrollbar p-6 bg-slate-50/30 space-y-2"></div>

                <div class="p-3 border-t border-slate-100 bg-slate-50 text-center shrink-0 flex items-center justify-between px-6">
                    <span class="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                        <i class="fas fa-database text-blue-500"></i> Nguồn: <b id="sop-source-badge" class="text-slate-600 font-mono">Dự phòng</b>
                    </span>
                    <span id="sop-status-label" class="text-[10px] font-bold px-2 py-0.5 rounded border">Sẵn sàng</span>
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

    // 5. LOGIC DỮ LIỆU & TỰ CỨU SINH (SELF-HEALING)
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
        const statusLabel = document.getElementById('sop-status-label');
        const sourceBadge = document.getElementById('sop-source-badge');

        // 1. Nếu đã có Cache phiên và không ép tải lại
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

        // 2. Nếu chưa có API -> DÙNG NGAY BẢN DỰ PHÒNG KHÔNG BÁO LỖI
        if (!apiUrl) {
            currentSops = DEFAULT_FALLBACK_SOPS;
            updateStatusBadge(false, currentSops.length);
            window.renderSOPTimeline();
            return;
        }

        // 3. Thử tải dữ liệu từ Google Sheets
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
            // TỰ CỨU SINH: Bắt lỗi Failed to fetch và nạp ngay 31 bước dự phòng
            console.warn("Kích hoạt chế độ SOP Dự phòng do API chưa phản hồi:", err.message);
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
            statusLabel.className = 'text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200';
        } else {
            sourceBadge.innerText = 'Dự phòng (Offline)';
            sourceBadge.className = 'text-amber-600 font-mono font-bold';
            statusLabel.innerText = `Chế độ Offline (${count} bước)`;
            statusLabel.className = 'text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200';
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
                    <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl mx-auto mb-3">
                        <i class="fas fa-inbox"></i>
                    </div>
                    <p class="text-xs font-bold text-slate-600">Không tìm thấy bước phù hợp</p>
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
                    <div class="pt-3 pb-2 mb-2 border-b border-slate-200 flex items-center justify-between">
                        <span class="text-xs font-black text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                            Khóa: ${escapeHtml(sop.courseId)}
                        </span>
                    </div>
                `;
            }

            html += `
                <div class="sop-timeline-item">
                    <div class="sop-timeline-dot"></div>
                    <div class="flex items-start justify-between gap-2 mb-1">
                        <h4 class="font-bold text-slate-800 text-[13px] leading-snug">
                            Bước ${sop.stepOrder}: ${escapeHtml(sop.stepName)}
                        </h4>
                        ${currentFilterCourse === 'ALL' ? `<span class="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">${escapeHtml(sop.courseId)}</span>` : ''}
                    </div>
                    <div class="text-[12px] text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200/90 whitespace-pre-wrap leading-relaxed shadow-xs">
                        ${escapeHtml(sop.stepDesc)}
                    </div>
                </div>
            `;
        });

        bodyEl.innerHTML = html;
    };

    window.loadAndOpenSOP = function (courseId) { window.openUniversalSOP(courseId); };
    window.closeSOP = function () { window.closeUniversalSOP(); };

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectSOPDom);
    } else {
        injectSOPDom();
    }
})();
