export type RoleKey='admin'|'manager'|'pharmacist'|'cashier'|'warehouse'|'doctor'|'customer'
export type SessionUser={id:string;username:string;name:string;initials:string;role:RoleKey;roleLabel:string;email:string;phone:string;description:string;createdAt?:string;status?:'active'|'locked'}
export type DemoAccount=SessionUser&{password:string}
export const demoUsers:DemoAccount[]=[
  {id:'TK001',username:'admin',password:'Admin@123',name:'Nguyễn Minh Tuấn',initials:'MT',role:'admin',roleLabel:'Quản trị viên',email:'tuan.nguyen@pharmasoft.vn',phone:'0903 456 789',description:'Toàn quyền quản trị hệ thống',createdAt:'12/03/2025',status:'active'},
  {id:'TK002',username:'manager01',password:'Manager@123',name:'Trần Thu Hà',initials:'TH',role:'manager',roleLabel:'Quản lý cửa hàng',email:'ha.tran@pharmasoft.vn',phone:'0987 234 561',description:'Điều hành hoạt động nhà thuốc',createdAt:'18/03/2025',status:'active'},
  {id:'TK003',username:'duocsi01',password:'Duocsi@123',name:'Lê Hoàng Nam',initials:'HN',role:'pharmacist',roleLabel:'Dược sĩ',email:'nam.le@pharmasoft.vn',phone:'0912 876 345',description:'Quản lý thuốc và tư vấn tại quầy',createdAt:'25/03/2025',status:'active'},
  {id:'TK004',username:'cashier01',password:'Cashier@123',name:'Phạm Ngọc Mai',initials:'NM',role:'cashier',roleLabel:'Thu ngân',email:'mai.pham@pharmasoft.vn',phone:'0938 112 220',description:'Bán hàng và thanh toán',createdAt:'02/04/2025',status:'active'},
  {id:'TK005',username:'warehouse01',password:'Warehouse@123',name:'Vũ Đức Long',initials:'ĐL',role:'warehouse',roleLabel:'Nhân viên kho',email:'long.vu@pharmasoft.vn',phone:'0908 554 321',description:'Nhập, xuất và kiểm kê kho',createdAt:'08/04/2025',status:'active'},
  {id:'TK006',username:'doctor01',password:'Doctor@123',name:'BS. Nguyễn Hoàng Anh',initials:'HA',role:'doctor',roleLabel:'Bác sĩ',email:'hoanganh.doctor@pharmasoft.vn',phone:'0901 286 115',description:'Quản lý hội thoại chuyên môn',createdAt:'15/04/2025',status:'active'},
  {id:'KH008642',username:'customer01',password:'Customer@123',name:'Nguyễn Thị Hồng',initials:'NH',role:'customer',roleLabel:'Khách hàng',email:'hong.nguyen@gmail.com',phone:'0903 182 456',description:'Tra cứu và chăm sóc khách hàng',createdAt:'22/06/2025',status:'active'},
]
const common=['Tổng quan','Thông báo']
export const roleMenus:Record<RoleKey,string[]>={
  admin:['Tổng quan','Quản lý thuốc','Danh mục thuốc','Nhà cung cấp','Khách hàng','Nhân viên','Bán hàng','Hóa đơn','Quản lý kho','Nhập hàng','Xuất hàng','Kiểm kê kho','Khuyến mãi','Báo cáo – Thống kê','Quản lý tài khoản','Nhật ký hoạt động','Chatbot tư vấn thuốc','Chat bác sĩ','Thông báo','Cài đặt hệ thống','Tài liệu bàn giao'],
  manager:['Tổng quan','Quản lý thuốc','Danh mục thuốc','Nhà cung cấp','Khách hàng','Nhân viên','Bán hàng','Hóa đơn','Quản lý kho','Nhập hàng','Xuất hàng','Kiểm kê kho','Khuyến mãi','Báo cáo – Thống kê','Quản lý tài khoản','Nhật ký hoạt động','Thông báo','Cài đặt hệ thống'],
  pharmacist:[...common,'Quản lý thuốc','Danh mục thuốc','Khách hàng','Bán hàng','Hóa đơn','Chatbot tư vấn thuốc','Chat bác sĩ'],
  cashier:[...common,'Khách hàng','Bán hàng','Hóa đơn','Khuyến mãi'],
  warehouse:[...common,'Quản lý thuốc','Danh mục thuốc','Nhà cung cấp','Quản lý kho','Nhập hàng','Xuất hàng','Kiểm kê kho'],
  doctor:[...common,'Chat bác sĩ'],
  customer:['Cửa hàng thuốc','Giỏ hàng','Đơn hàng & Hóa đơn',...common,'Chatbot tư vấn thuốc','Chat bác sĩ'],
}
export const roleHome:Record<RoleKey,string>={admin:'Tổng quan',manager:'Tổng quan',pharmacist:'Tổng quan',cashier:'Tổng quan',warehouse:'Tổng quan',doctor:'Tổng quan',customer:'Cửa hàng thuốc'}
