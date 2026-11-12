# PHARMASOFT (ASP.NET Core + giao diện Figma + lưu dữ liệu thật)

## Chạy ngay (chỉ cần .NET SDK 8 trở lên)
```powershell
cd PharmaSoft.Web
dotnet run
```
Mở http://localhost:5080. Dữ liệu thêm/sửa/xóa được **lưu vào thư mục `PharmaSoft.Web/data`** (file JSON), tắt máy bật lại vẫn còn,
mở bằng trình duyệt khác vẫn thấy. Lịch sử thao tác nằm ở menu **Nhật ký hoạt động** (chỉ Quản trị viên và Quản lý).

## Đăng nhập thử
| Vai trò | Tài khoản | Mật khẩu |
|---|---|---|
| Quản trị viên | admin | Admin@123 |
| Quản lý | manager01 | Manager@123 |
| Dược sĩ | duocsi01 | Duocsi@123 |
| Thu ngân | cashier01 | Cashier@123 |
| Nhân viên kho | warehouse01 | Warehouse@123 |
| Bác sĩ | doctor01 | Doctor@123 |
| Khách hàng | customer01 | Customer@123 |

Xóa toàn bộ dữ liệu đã lưu để về dữ liệu mẫu ban đầu: tắt app, xóa thư mục `PharmaSoft.Web/data`.

## Chạy với Oracle 23ai + Docker + DBeaver (1 lệnh)
Mở Docker Desktop (đợi Running), mở thư mục PharmaSoft trong VS Code, vào Terminal và gõ:
```powershell
powershell -ExecutionPolicy Bypass -File .\run-oracle.ps1
```
(hoặc bấm đúp `run-oracle.bat`). Script tự: bật Oracle -> cấp quyền -> tạo 28 bảng + Duality View -> chạy web tại http://localhost:5080.
Mật khẩu nằm trong `Database/.env`. Kết nối DBeaver: Host `localhost`, Port `1521`, Service name `FREEPDB1`, User `pharmasoft`.
Dữ liệu web lưu vào `APP_DATA` (JSON) và `APP_AUDIT`, đồng thời tự đồng bộ xuống các bảng quan hệ (medicines, orders, customers, ...). Xóa trên web = xóa mềm. Lỗi đồng bộ từng dòng nằm trong bảng `SYNC_LOG`.
Nếu có lỗi: gửi file `Database/schema-log.txt` hoặc nội dung terminal.

## Cấu trúc
- `PharmaSoft.Web/` : ASP.NET Core. `wwwroot/` là giao diện đã build. API: `/api/data`, `/api/audit`, `/api/health`.
- `ClientApp/`      : mã nguồn giao diện (React) từ Figma. Sửa xong chạy `npm install` rồi `npm run build` (kết quả ghi vào `wwwroot`).
- `Database/`       : schema Oracle 23ai đầy đủ (28 bảng, Duality View) để phát triển tiếp.
