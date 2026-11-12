# 📋 PHARMASOFT — TÀI LIỆU SRS & CẤU TRÚC JIRA

---

## PHẦN 1: SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

### 1. Giới thiệu tổng quan (Introduction)
* **Tên hệ thống**: PHARMASOFT — Hệ thống Quản lý Nhà thuốc Toàn diện.
* **Mục tiêu**: Tự động hóa quy trình quản lý bán lẻ thuốc, quản lý kho theo chuẩn FEFO/FIFO, theo dõi hạn dùng, kiểm soát công nợ, quản lý nhân sự và lập báo cáo tài chính - kinh doanh tức thời.
* **Đối tượng sử dụng**: Quản trị viên, Quản lý chi nhánh, Dược sĩ, Thu ngân, Thủ kho, Bác sĩ tư vấn và Khách hàng.

---

### 2. Yêu cầu chức năng (Functional Requirements - FR)

| Mã FR | Tên chức năng | Mô tả chi tiết |
|---|---|---|
| **FR-01** | **Bảng điều khiển (Dashboard)** | Hiển thị tối thiểu 4 nhóm chỉ số tổng quan (Doanh thu, Đơn hàng, Khách hàng, Tồn kho thấp, Thuốc hết hạn). Biểu đồ doanh thu theo thời gian thực. |
| **FR-02** | **Quản lý danh mục thuốc (CRUD)** | Thêm, sửa, xóa (có popup xác nhận an toàn), tìm kiếm đa tiêu chí, phân loại màu sắc trạng thái, phân trang tối ưu, hiển thị số thứ tự (STT). |
| **FR-03** | **Lưu trữ hình ảnh** | Tải lên hình ảnh thuốc và ảnh đại diện người dùng, tự động nén và lưu trữ base64/URL. |
| **FR-04** | **Xuất dữ liệu Excel** | Xuất toàn bộ danh sách thuốc, hóa đơn, nhà cung cấp, khách hàng và báo cáo ra file định dạng chuẩn `.xlsx` (SheetJS). |
| **FR-05** | **Báo cáo & Biểu đồ tương tác** | Tối thiểu 4 nhóm báo cáo (Doanh thu, Lợi nhuận, Tồn kho, Khách hàng). Tích hợp biểu đồ tròn (Pie Chart) và biểu đồ cột (Bar Chart) có hỗ trợ click vào từng phần tử để mở popup chi tiết số liệu. |
| **FR-06** | **Chức năng In ấn thật (Print)** | In hóa đơn bán hàng và phiếu nhập/xuất kho bằng giải pháp iframe in độc lập, áp dụng CSS `@page { size: A4; margin: 15mm; }`, tự động loại bỏ sidebar/header và nút thao tác. |
| **FR-07** | **Gửi Email hóa đơn** | Hỗ trợ gửi thông tin hóa đơn và phiếu thanh toán trực tiếp qua email cho khách hàng. |
| **FR-08** | **Xác thực OTP (SMS)** | Tạo và xác thực mã OTP ngẫu nhiên 6 chữ số, thời gian hết hạn 120 giây, giới hạn tối đa 5 lần nhập sai, phục vụ xác minh số điện thoại và khôi phục tài khoản. |
| **FR-09** | **Phân quyền người dùng (RBAC)** | Phân quyền 7 vai trò: Admin, Manager, Pharmacist, Cashier, Warehouse, Doctor, Customer với ma trận quyền xem/tạo/sửa/xóa/duyệt/xuất độc lập. |

---

### 3. Yêu cầu phi chức năng (Non-Functional Requirements - NFR)

1. **Hiệu năng (Performance)**:
   - Tốc độ tải dữ liệu dưới 1 giây đối với danh sách 1.000+ sản phẩm.
   - Build ứng dụng hoàn tất dưới 2 giây với Vite.
2. **Khả năng sử dụng (Usability)**:
   - Giao diện chuẩn Y tế (màu xanh lá `#16834a`), giữ nguyên layout hiện đại, thân thiện, dễ thao tác tại quầy thuốc.
3. **Bảo mật (Security)**:
   - Phân tách vai trò rõ ràng, che số điện thoại khách hàng (`090****567`).
   - OTP có thời hạn và giới hạn số lần thử để chống brute-force.
4. **Kiểm thử (Testability)**:
   - Đạt 100% pass trên bộ Unit Test cho các logic nghiệp vụ quan trọng (OTP, Excel, RBAC, Tính toán hóa đơn).

---

## PHẦN 2: CẤU TRÚC DỰ ÁN JIRA (JIRA BACKLOG & SPRINT)

### Cấu trúc Epic & User Stories

```
[EPIC 1] CORE SYSTEM & PERFORMANCE (Hệ thống & Tối ưu hóa)
├── PS-01 (Story): Tối ưu hiệu năng load dữ liệu và phân trang động cho các bảng dữ liệu
├── PS-02 (Story): Bổ sung cột STT và màu sắc phân loại trạng thái trên danh mục
└── PS-03 (Story): Popup modal xác nhận khi xóa sản phẩm hoặc danh mục

[EPIC 2] DASHBOARD & REPORTING (Thống kê & Báo cáo nâng cao)
├── PS-04 (Story): Dashboard tổng quan hiển thị 8+ chỉ số thời gian thực
├── PS-05 (Story): Xây dựng biểu đồ PieChart SVG tương tác (nhấn vào xem chi tiết)
├── PS-06 (Story): Xây dựng biểu đồ BarChart SVG tương tác theo danh mục và kỳ
└── PS-07 (Story): 4 loại báo cáo chuyên sâu (Doanh thu, Lợi nhuận, Tồn kho, Khách hàng)

[EPIC 3] IMPORT / EXPORT & PRINTING (Xuất dữ liệu & In ấn thực)
├── PS-08 (Story): Tích hợp thư viện xlsx để xuất file Excel (.xlsx) danh sách thực
├── PS-09 (Story): Chức năng in thật hóa đơn bán lẻ chuyên nghiệp (iframe isolation)
└── PS-10 (Story): Chức năng in thật chứng từ kho và phiếu trả hàng

[EPIC 4] COMMUNICATION & SECURITY (Email, OTP & Bảo mật)
├── PS-11 (Story): Modal gửi hóa đơn qua email khách hàng
├── PS-12 (Story): Module tạo và xác thực mã OTP 6 số qua SMS
├── PS-13 (Story): Phân quyền người dùng theo ma trận 7 vai trò (RBAC)
└── PS-14 (Story): Upload và xem trước hình ảnh thuốc và ảnh hồ sơ cá nhân

[EPIC 5] QUALITY ASSURANCE (Kiểm thử & Tài liệu)
├── PS-15 (Task): Xây dựng bộ Unit Test tự động (Node Test Runner)
└── PS-16 (Task): Hoàn thiện tài liệu SRS và cấu trúc bàn giao Jira
```

