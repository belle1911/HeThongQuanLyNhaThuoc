import { usePersistentState } from '@/lib/persist'
import { FormEvent, useMemo, useState } from 'react'
import { Badge, Button, Icon, IconName } from './App'
import { exportToExcel, SUPPLIER_COLUMNS, CUSTOMER_COLUMNS, EMPLOYEE_COLUMNS } from '@/lib/excel'

type Mode = 'supplier' | 'customer' | 'employee'
type RecordItem = {
  id: string; name: string; phone: string; email: string; address: string; status: string; notes: string;
  tax?: string; contact?: string; dob?: string; gender?: string; level?: string; points?: number;
  position?: string; account?: string; startDate?: string;
}

const seed: Record<Mode, RecordItem[]> = {
  supplier: [
    { id:'NCC-001',name:'Công ty CP Dược Hậu Giang',phone:'0292 3891 433',email:'kinhdoanh@dhgpharma.com.vn',address:'288 Bis Nguyễn Văn Cừ, Q. Ninh Kiều, Cần Thơ',tax:'1800156801',contact:'Nguyễn Hoàng Phúc',status:'Đang hợp tác',notes:'Nhà cung cấp chiến lược, giao hàng thứ 2 và thứ 5.' },
    { id:'NCC-002',name:'Công ty CP Dược phẩm Imexpharm',phone:'0277 3851 941',email:'sales@imexpharm.com',address:'04 Đường 30/4, P.1, TP. Cao Lãnh, Đồng Tháp',tax:'1400384433',contact:'Trần Minh Anh',status:'Đang hợp tác',notes:'Chuyên nhóm kháng sinh và thuốc kê đơn.' },
    { id:'NCC-003',name:'Công ty CP Traphaco',phone:'024 3683 0751',email:'phanphoi@traphaco.com.vn',address:'75 Yên Ninh, Ba Đình, Hà Nội',tax:'0100108656',contact:'Lê Thu Hương',status:'Đang hợp tác',notes:'Đối soát công nợ cuối tháng.' },
    { id:'NCC-004',name:'Công ty TNHH Zuellig Pharma Việt Nam',phone:'028 3910 2650',email:'order.vn@zuelligpharma.com',address:'KCN Tân Tạo, Q. Bình Tân, TP.HCM',tax:'0302204179',contact:'Phạm Quốc Bảo',status:'Đang hợp tác',notes:'Nhà phân phối đa quốc gia.' },
    { id:'NCC-005',name:'Công ty CP Dược phẩm OPC',phone:'028 3751 7111',email:'kinhdoanh@opcpharma.com',address:'1017 Hồng Bàng, Q.6, TP.HCM',tax:'0302560110',contact:'Võ Thanh Sơn',status:'Tạm ngưng',notes:'Tạm ngưng nhập hàng từ tháng 05/2025.' },
  ],
  customer: [
    { id:'KH-008642',name:'Nguyễn Thị Hồng',phone:'0903 182 456',email:'hong.nguyen@gmail.com',address:'18 Nguyễn Thị Minh Khai, Q.1, TP.HCM',dob:'12/08/1988',gender:'Nữ',level:'Vàng',points:2840,status:'Đang hoạt động',notes:'Ưu tiên nhận thông báo qua Zalo.' },
    { id:'KH-008641',name:'Trần Tuấn Kiệt',phone:'0987 443 220',email:'kiet.tran@outlook.com',address:'72 Lê Văn Sỹ, Q.3, TP.HCM',dob:'25/11/1992',gender:'Nam',level:'Bạc',points:1260,status:'Đang hoạt động',notes:'' },
    { id:'KH-008640',name:'Hoàng Mai Anh',phone:'0912 675 889',email:'maianh.hoang@gmail.com',address:'115 Điện Biên Phủ, Q. Bình Thạnh, TP.HCM',dob:'03/04/1985',gender:'Nữ',level:'Kim cương',points:6520,status:'Đang hoạt động',notes:'Khách hàng thân thiết từ năm 2021.' },
    { id:'KH-008639',name:'Phạm Đức Minh',phone:'0938 221 670',email:'ducminh.pham@gmail.com',address:'28 Trường Sa, Q. Phú Nhuận, TP.HCM',dob:'19/02/1997',gender:'Nam',level:'Thành viên',points:380,status:'Đang hoạt động',notes:'' },
    { id:'KH-008638',name:'Lê Ngọc Thảo',phone:'0908 754 116',email:'ngocthao.le@gmail.com',address:'86 Phan Xích Long, Q. Phú Nhuận, TP.HCM',dob:'08/09/1990',gender:'Nữ',level:'Bạc',points:980,status:'Tạm khóa',notes:'Yêu cầu tạm dừng nhận thông báo.' },
  ],
  employee: [
    { id:'NV-001',name:'Nguyễn Minh Tuấn',phone:'0903 456 789',email:'tuan.nguyen@pharmasoft.vn',address:'Q. Bình Thạnh, TP.HCM',position:'Quản lý cửa hàng',account:'tuan.nguyen',startDate:'12/03/2021',status:'Đang làm việc',notes:'Phụ trách vận hành chi nhánh trung tâm.' },
    { id:'NV-002',name:'Trần Thu Hà',phone:'0987 234 561',email:'ha.tran@pharmasoft.vn',address:'Q.3, TP.HCM',position:'Dược sĩ',account:'ha.tran',startDate:'18/07/2022',status:'Đang làm việc',notes:'Chứng chỉ hành nghề số CCHN-02861.' },
    { id:'NV-003',name:'Lê Hoàng Nam',phone:'0912 876 345',email:'nam.le@pharmasoft.vn',address:'TP. Thủ Đức, TP.HCM',position:'Dược sĩ',account:'nam.le',startDate:'06/01/2023',status:'Đang làm việc',notes:'Phụ trách ca chiều.' },
    { id:'NV-004',name:'Phạm Ngọc Mai',phone:'0938 112 220',email:'mai.pham@pharmasoft.vn',address:'Q. Tân Bình, TP.HCM',position:'Thu ngân',account:'mai.pham',startDate:'15/09/2023',status:'Nghỉ phép',notes:'Nghỉ phép đến 28/06/2025.' },
    { id:'NV-005',name:'Vũ Đức Long',phone:'0908 554 321',email:'long.vu@pharmasoft.vn',address:'Q.8, TP.HCM',position:'Nhân viên kho',account:'long.vu',startDate:'22/11/2022',status:'Đang làm việc',notes:'Phụ trách nhập kho và kiểm kê.' },
  ],
}

const configs = {
  supplier: { noun:'nhà cung cấp', title:'Danh sách nhà cung cấp', description:'Quản lý đối tác cung ứng, liên hệ và lịch sử giao dịch.', icon:'truck' as IconName, statuses:['Đang hợp tác','Tạm ngưng'], filter:'Trạng thái hợp tác' },
  customer: { noun:'khách hàng', title:'Danh sách khách hàng', description:'Quản lý hồ sơ, hạng thành viên và lịch sử mua hàng.', icon:'customers' as IconName, statuses:['Đang hoạt động','Tạm khóa'], filter:'Hạng thành viên' },
  employee: { noun:'nhân viên', title:'Danh sách nhân viên', description:'Quản lý thông tin nhân sự, tài khoản và trạng thái làm việc.', icon:'users' as IconName, statuses:['Đang làm việc','Nghỉ phép','Đã nghỉ việc'], filter:'Vị trí công việc' },
}
const money = (value:number) => `${value.toLocaleString('vi-VN')} VNĐ`
const supplierTransactions = [
  ['PN250624-0028','24/06/2025','Phiếu nhập hàng','24.680.000 VNĐ','Đã hoàn thành'],['PN250612-0022','12/06/2025','Phiếu nhập hàng','18.240.000 VNĐ','Đã hoàn thành'],['TT250605-0188','05/06/2025','Thanh toán công nợ','35.500.000 VNĐ','Đã thanh toán'],['PN250528-0019','28/05/2025','Phiếu nhập hàng','12.850.000 VNĐ','Đã hoàn thành'],
]
const purchases = [
  ['HD250624-0186','24/06/2025','3 sản phẩm','486.000 VNĐ','Đã thanh toán'],['HD250612-0142','12/06/2025','5 sản phẩm','1.248.000 VNĐ','Đã thanh toán'],['HD250528-0089','28/05/2025','2 sản phẩm','325.000 VNĐ','Chưa thanh toán'],['HD250510-0041','10/05/2025','4 sản phẩm','786.500 VNĐ','Đã thanh toán'],
]
const debtHistory = [
  ['CN-2505-018','28/05/2025','Phát sinh công nợ','325.000 VNĐ','Còn nợ'],['TT-2504-112','30/04/2025','Thanh toán công nợ','620.000 VNĐ','Đã thanh toán'],['CN-2504-009','12/04/2025','Phát sinh công nợ','620.000 VNĐ','Đã thanh toán'],
]

export function BusinessPartners({ mode }: { mode: Mode }) {
  const config = configs[mode]
  const [records,setRecords] = usePersistentState('partners-'+mode,seed[mode])
  const [query,setQuery] = useState('')
  const [status,setStatus] = useState('Tất cả')
  const [secondary,setSecondary] = useState('Tất cả')
  const [dialog,setDialog] = useState<'form'|'detail'|'delete'|null>(null)
  const [selected,setSelected] = useState<RecordItem|null>(null)
  const [editing,setEditing] = useState(false)
  const [detailTab,setDetailTab] = useState('Thông tin chung')
  const [errors,setErrors] = useState<Record<string,string>>({})
  const [toast,setToast] = useState('')
  const [page,setPage] = useState(1)
  const pageSize = 10
  const secondaryValues = mode==='customer' ? ['Thành viên','Bạc','Vàng','Kim cương'] : mode==='employee' ? ['Quản lý cửa hàng','Dược sĩ','Thu ngân','Nhân viên kho'] : []
  const filtered = useMemo(()=>records.filter(r => (r.name.toLowerCase().includes(query.toLowerCase())||r.id.toLowerCase().includes(query.toLowerCase())||r.phone.includes(query)) && (status==='Tất cả'||r.status===status) && (secondary==='Tất cả'||(mode==='customer'?r.level:r.position)===secondary)),[records,query,status,secondary,mode])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = useMemo(() => filtered.slice((page-1)*pageSize, page*pageSize), [filtered, page])

  function handleExport(){
    if(mode==='supplier'){
      const rows=filtered.map(r=>({id:r.id,name:r.name,contact:r.contact||'',phone:r.phone,email:r.email,taxCode:r.tax||'',status:r.status} as Record<string,unknown>))
      exportToExcel(SUPPLIER_COLUMNS,rows,'nha-cung-cap')
    }else if(mode==='customer'){
      const rows=filtered.map(r=>({id:r.id,name:r.name,phone:r.phone,email:r.email,address:r.address,tier:r.level||'',totalSpent:`${r.points||0} điểm`,status:r.status} as Record<string,unknown>))
      exportToExcel(CUSTOMER_COLUMNS,rows,'khach-hang')
    }else{
      const rows=filtered.map(r=>({id:r.id,name:r.name,role:r.position||'',phone:r.phone,email:r.email,joinDate:r.startDate||'',status:r.status} as Record<string,unknown>))
      exportToExcel(EMPLOYEE_COLUMNS,rows,'nhan-vien')
    }
    notify(`Đang tải file Excel danh sách ${config.noun}...`)
  }
  function notify(text:string){setToast(text);window.setTimeout(()=>setToast(''),3000)}
  function openDetail(item:RecordItem){setSelected(item);setDetailTab('Thông tin chung');setDialog('detail')}
  function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const data=new FormData(event.currentTarget);const get=(key:string)=>String(data.get(key)||'').trim();const nextErrors:Record<string,string>={}
    if(!get('name'))nextErrors.name=`Vui lòng nhập tên ${config.noun}.`
    if(!/^(0|\+84)[0-9\s]{8,12}$/.test(get('phone')))nextErrors.phone='Số điện thoại không đúng định dạng Việt Nam.'
    if(get('email')&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get('email')))nextErrors.email='Email không đúng định dạng.'
    if(Object.keys(nextErrors).length){setErrors(nextErrors);return}
    const item:RecordItem={id:get('id')||`${mode==='supplier'?'NCC':mode==='customer'?'KH':'NV'}-${String(records.length+1).padStart(3,'0')}`,name:get('name'),phone:get('phone'),email:get('email'),address:get('address'),status:get('status'),notes:get('notes'),tax:get('tax'),contact:get('contact'),dob:get('dob'),gender:get('gender'),level:get('level'),points:Number(get('points')),position:get('position'),account:get('account'),startDate:get('startDate')}
    setRecords(editing&&selected?records.map(r=>r.id===selected.id?item:r):[item,...records]);setDialog(null);setErrors({});notify(editing?`Cập nhật ${config.noun} thành công`:`Đã thêm ${config.noun} mới`)
  }
  function remove(){if(selected)setRecords(records.filter(r=>r.id!==selected.id));setDialog(null);notify(`Đã xóa ${config.noun}`)}

  return <div className={`partner-module partner-${mode}`}>
    <div className="partner-summary">
      {/* Số liệu đếm từ danh sách thực tế thay cho số cố định */}
      <div className="card"><span className="partner-stat green"><Icon name={config.icon}/></span><div><small>Tổng {config.noun}</small><strong>{records.length.toLocaleString('vi-VN')}</strong><em>Đang quản lý trên hệ thống</em></div></div>
      <div className="card"><span className="partner-stat blue"><Icon name="check"/></span><div><small>{mode==='employee'?'Đang làm việc':'Đang hoạt động'}</small><strong>{records.filter(r=>['Đang hoạt động','Đang hợp tác','Đang làm việc'].includes(r.status)).length.toLocaleString('vi-VN')}</strong><em>Trạng thái bình thường</em></div></div>
      <div className="card"><span className="partner-stat amber"><Icon name={mode==='employee'?'calendar':'close'}/></span><div><small>{mode==='employee'?'Nghỉ phép / tạm khóa':'Tạm ngưng / tạm khóa'}</small><strong>{records.filter(r=>['Nghỉ phép','Tạm khóa','Tạm ngưng'].includes(r.status)).length.toLocaleString('vi-VN')}</strong><em>Cần theo dõi</em></div></div>
      <div className="card"><span className="partner-stat purple"><Icon name={mode==='supplier'?'download':mode==='customer'?'activity':'shield'}/></span><div><small>{mode==='supplier'?'Có mã số thuế':mode==='customer'?'Điểm đã tích lũy':'Có tài khoản đăng nhập'}</small><strong>{mode==='supplier'?records.filter(r=>r.tax).length.toLocaleString('vi-VN'):mode==='customer'?records.reduce((sum,r)=>sum+(r.points||0),0).toLocaleString('vi-VN'):records.filter(r=>r.account).length.toLocaleString('vi-VN')}</strong><em>Tính từ danh sách hiện có</em></div></div>
    </div>
    <section className="card partner-list-card">
      <div className="partner-list-heading"><div><h2>{config.title}</h2><p>{config.description}</p></div><div><Button variant="secondary" icon="download" onClick={handleExport}>Xuất dữ liệu</Button><Button icon="plus" onClick={()=>{setSelected(null);setEditing(false);setErrors({});setDialog('form')}}>Thêm {config.noun}</Button></div></div>
      <div className="partner-toolbar"><div className="table-search partner-search"><Icon name="search" size={17}/><input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder={`Tìm tên, mã hoặc số điện thoại ${config.noun}...`}/></div><select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="Tất cả">Tất cả trạng thái</option>{config.statuses.map(x=><option key={x}>{x}</option>)}</select>{secondaryValues.length>0&&<select value={secondary} onChange={e=>{setSecondary(e.target.value);setPage(1)}}><option value="Tất cả">{config.filter}</option>{secondaryValues.map(x=><option key={x}>{x}</option>)}</select>}</div>
      <div className="table-wrap"><table className="partner-table"><thead><tr><th>{mode==='supplier'?'NHÀ CUNG CẤP':mode==='customer'?'KHÁCH HÀNG':'NHÂN VIÊN'}</th><th>LIÊN HỆ</th>{mode==='supplier'?<><th>NGƯỜI LIÊN HỆ</th><th>MÃ SỐ THUẾ</th></>:mode==='customer'?<><th>HẠNG THÀNH VIÊN</th><th>ĐIỂM TÍCH LŨY</th></>:<><th>VỊ TRÍ</th><th>TÀI KHOẢN</th></>}<th>ĐỊA CHỈ</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>{paginated.map((item,index)=><tr key={item.id} onDoubleClick={()=>openDetail(item)}><td><button className="partner-identity" onClick={()=>openDetail(item)}><span className={`partner-avatar avatar-${index%5}`}>{mode==='supplier'?<Icon name="store"/>:item.name.split(' ').slice(-2).map(x=>x[0]).join('')}</span><div><strong>{item.name}</strong><small>{item.id}</small></div></button></td><td><strong>{item.phone}</strong><small>{item.email}</small></td>{mode==='supplier'?<><td>{item.contact}</td><td><span className="partner-code">{item.tax}</span></td></>:mode==='customer'?<><td><span className={`member-level level-${item.level?.toLowerCase().replace(' ','-')}`}>{item.level}</span></td><td><strong className="points">{item.points?.toLocaleString('vi-VN')} điểm</strong></td></>:<><td><span className="position-chip">{item.position}</span></td><td><strong>{item.account}</strong></td></>}<td><span className="address-cell">{item.address}</span></td><td><Badge kind={item.status.includes('Đang')?'ok':'warning'}>{item.status}</Badge></td><td><div className="partner-actions"><button title="Chi tiết" onClick={()=>openDetail(item)}><Icon name="file"/></button><button title="Chỉnh sửa" onClick={()=>{setSelected(item);setEditing(true);setErrors({});setDialog('form')}}><Icon name="settings"/></button><button className="delete" title="Xóa" onClick={()=>{setSelected(item);setDialog('delete')}}><Icon name="close"/></button></div></td></tr>)}</tbody></table>{filtered.length===0&&<div className="empty-state"><div><Icon name="search"/></div><strong>Không tìm thấy dữ liệu</strong><span>Hãy thử từ khóa hoặc bộ lọc khác.</span><Button variant="secondary" onClick={()=>{setQuery('');setStatus('Tất cả');setSecondary('Tất cả');setPage(1)}}>Xóa bộ lọc</Button></div>}</div>
      <div className="pagination"><span>Hiển thị <strong>{paginated.length}</strong> trong tổng số <strong>{filtered.length}</strong> {config.noun}</span><div><button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>‹</button>{Array.from({length:totalPages},(_,i)=>i+1).map(p=><button key={p} className={page===p?'active':''} onClick={()=>setPage(p)}>{p}</button>)}<button disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>›</button></div></div>
    </section>
    {dialog==='form'&&<PartnerForm mode={mode} item={selected} editing={editing} errors={errors} onClose={()=>setDialog(null)} onSubmit={save}/>}
    {dialog==='detail'&&selected&&<PartnerDetail mode={mode} item={selected} tab={detailTab} setTab={setDetailTab} onClose={()=>setDialog(null)} onEdit={()=>{setEditing(true);setErrors({});setDialog('form')}}/>}
    {dialog==='delete'&&selected&&<div className="dialog-layer"><section className="confirm-dialog"><span className="confirm-icon red"><Icon name="close"/></span><h2>Xóa {config.noun}?</h2><p><strong>{selected.name}</strong> sẽ bị xóa khỏi danh sách. Các hóa đơn và giao dịch trước đây vẫn được lưu để đối soát.</p><div><Button variant="secondary" onClick={()=>setDialog(null)}>Hủy bỏ</Button><button className="danger-button" onClick={remove}>Xác nhận xóa</button></div></section></div>}
    {toast&&<div className="toast"><span><Icon name="check"/></span><div><strong>{toast}</strong><small>Dữ liệu đã được cập nhật trên hệ thống.</small></div><button onClick={()=>setToast('')}><Icon name="close"/></button></div>}
  </div>
}

function PartnerForm({mode,item,editing,errors,onClose,onSubmit}:{mode:Mode;item:RecordItem|null;editing:boolean;errors:Record<string,string>;onClose:()=>void;onSubmit:(e:FormEvent<HTMLFormElement>)=>void}){
  const config=configs[mode];return <div className="dialog-layer"><section className="dialog partner-form-dialog"><div className="dialog__header"><div><div className="eyebrow">{editing?'CHỈNH SỬA THÔNG TIN':`${config.noun.toUpperCase()} MỚI`}</div><h2>{editing?`Cập nhật ${config.noun}`:`Thêm ${config.noun}`}</h2><p>Nhập đầy đủ thông tin liên hệ và quản lý.</p></div><button className="icon-button" onClick={onClose}><Icon name="close"/></button></div><form onSubmit={onSubmit}><div className="partner-form-grid"><label className="field"><span>Mã {config.noun}</span><input name="id" defaultValue={item?.id} placeholder="Tự động nếu để trống"/></label><label className="field"><span>{mode==='supplier'?'Tên nhà cung cấp':'Họ và tên'} *</span><input name="name" defaultValue={item?.name}/>{errors.name&&<small className="field__error">{errors.name}</small>}</label><label className="field"><span>Số điện thoại *</span><input name="phone" defaultValue={item?.phone} placeholder="0901 234 567"/>{errors.phone&&<small className="field__error">{errors.phone}</small>}</label><label className="field"><span>Email</span><input name="email" type="email" defaultValue={item?.email} placeholder="email@example.com"/>{errors.email&&<small className="field__error">{errors.email}</small>}</label>
  {mode==='supplier'&&<><label className="field"><span>Mã số thuế</span><input name="tax" defaultValue={item?.tax}/></label><label className="field"><span>Người liên hệ</span><input name="contact" defaultValue={item?.contact}/></label></>}
  {mode==='customer'&&<><label className="field"><span>Ngày sinh</span><input name="dob" defaultValue={item?.dob} placeholder="DD/MM/YYYY"/></label><label className="field"><span>Giới tính</span><select name="gender" defaultValue={item?.gender||'Nữ'}><option>Nữ</option><option>Nam</option><option>Khác</option></select></label><label className="field"><span>Hạng thành viên</span><select name="level" defaultValue={item?.level||'Thành viên'}><option>Thành viên</option><option>Bạc</option><option>Vàng</option><option>Kim cương</option></select></label><label className="field"><span>Điểm tích lũy</span><input name="points" inputMode="numeric" defaultValue={item?.points||0}/></label></>}
  {mode==='employee'&&<><label className="field"><span>Vị trí *</span><select name="position" defaultValue={item?.position||'Dược sĩ'}><option>Quản lý cửa hàng</option><option>Dược sĩ</option><option>Thu ngân</option><option>Nhân viên kho</option></select></label><label className="field"><span>Tài khoản</span><input name="account" defaultValue={item?.account} placeholder="ten.dangnhap"/></label><label className="field"><span>Ngày bắt đầu</span><input name="startDate" defaultValue={item?.startDate} placeholder="DD/MM/YYYY"/></label></>}
  <label className="field"><span>Trạng thái</span><select name="status" defaultValue={item?.status||config.statuses[0]}>{config.statuses.map(x=><option key={x}>{x}</option>)}</select></label><label className="field field--wide"><span>Địa chỉ</span><input name="address" defaultValue={item?.address} placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"/></label><label className="field field--wide"><span>Ghi chú</span><textarea name="notes" defaultValue={item?.notes} placeholder="Thông tin bổ sung..."/></label></div><div className="dialog__footer"><Button variant="secondary" onClick={onClose}>Hủy bỏ</Button><Button type="submit">{editing?'Lưu thay đổi':`Thêm ${config.noun}`}</Button></div></form></section></div>
}

function PartnerDetail({mode,item,tab,setTab,onClose,onEdit}:{mode:Mode;item:RecordItem;tab:string;setTab:(x:string)=>void;onClose:()=>void;onEdit:()=>void}){
  const tabs=mode==='supplier'?['Thông tin chung','Lịch sử giao dịch']:mode==='customer'?['Thông tin chung','Lịch sử mua hàng','Lịch sử công nợ']:['Thông tin chung','Thông tin công việc'];const rows=mode==='supplier'?supplierTransactions:tab==='Lịch sử công nợ'?debtHistory:purchases
  return <div className="dialog-layer"><section className="dialog partner-detail-dialog"><div className="dialog__header partner-detail-header"><span className="partner-detail-avatar">{mode==='supplier'?<Icon name="store" size={25}/>:item.name.split(' ').slice(-2).map(x=>x[0]).join('')}</span><div><div className="eyebrow">{item.id}</div><h2>{item.name}</h2><p>{mode==='supplier'?item.contact:mode==='customer'?`${item.level} • ${item.points?.toLocaleString('vi-VN')} điểm`:item.position}</p></div><Badge kind={item.status.includes('Đang')?'ok':'warning'}>{item.status}</Badge><button className="icon-button" onClick={onClose}><Icon name="close"/></button></div><div className="detail-tabs">{tabs.map(x=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}</button>)}</div>
  {tab==='Thông tin chung'&&<div className="partner-detail-body"><div className="partner-info-grid">{[['Số điện thoại',item.phone],['Email',item.email],['Địa chỉ',item.address],...(mode==='supplier'?[['Mã số thuế',item.tax||'—'],['Người liên hệ',item.contact||'—']]:mode==='customer'?[['Ngày sinh',item.dob||'—'],['Giới tính',item.gender||'—'],['Hạng thành viên',item.level||'—'],['Điểm tích lũy',`${item.points?.toLocaleString('vi-VN')} điểm`]]:[['Vị trí',item.position||'—'],['Tài khoản',item.account||'—'],['Ngày bắt đầu',item.startDate||'—']])].map(x=><div key={x[0]}><small>{x[0]}</small><strong>{x[1]}</strong></div>)}</div><div className="partner-notes"><small>GHI CHÚ</small><p>{item.notes||'Chưa có ghi chú.'}</p></div>{mode==='customer'&&<div className="membership-card"><span><Icon name="percent"/></span><div><strong>Thành viên {item.level}</strong><small>Còn 660 điểm để nâng hạng tiếp theo</small><i><b style={{width:'72%'}}/></i></div><em>{item.points?.toLocaleString('vi-VN')}<small>điểm</small></em></div>}{mode==='employee'&&<div className="work-card"><div><Icon name="calendar"/><span><small>THÂM NIÊN</small><strong>2 năm 6 tháng</strong></span></div><div><Icon name="shield"/><span><small>TÀI KHOẢN HỆ THỐNG</small><strong>{item.account} • Đang hoạt động</strong></span></div></div>}</div>}
  {tab!=='Thông tin chung'&&tab!=='Thông tin công việc'&&<div className="partner-history"><div className="history-summary"><div><small>{mode==='supplier'?'TỔNG GIÁ TRỊ NHẬP':'TỔNG CHI TIÊU'}</small><strong>{mode==='supplier'?'684.250.000 VNĐ':'18.640.000 VNĐ'}</strong></div><div><small>{tab==='Lịch sử công nợ'?'CÔNG NỢ HIỆN TẠI':'SỐ GIAO DỊCH'}</small><strong>{tab==='Lịch sử công nợ'?'325.000 VNĐ':'42 giao dịch'}</strong></div></div><table><thead><tr><th>MÃ GIAO DỊCH</th><th>NGÀY</th><th>LOẠI</th><th>GIÁ TRỊ</th><th>TRẠNG THÁI</th></tr></thead><tbody>{rows.map(r=><tr key={r[0]}><td><strong>{r[0]}</strong></td><td>{r[1]}</td><td>{r[2]}</td><td><strong>{r[3]}</strong></td><td><Badge kind={r[4].includes('Chưa')||r[4].includes('Còn')?'warning':'ok'}>{r[4]}</Badge></td></tr>)}</tbody></table></div>}
  {tab==='Thông tin công việc'&&<div className="employment-info"><div className="employment-timeline"><span><Icon name="check"/></span><div><strong>Bắt đầu làm việc</strong><small>{item.startDate} • Nhân viên chính thức</small></div></div><div className="employment-timeline"><span><Icon name="users"/></span><div><strong>Vị trí hiện tại: {item.position}</strong><small>Chi nhánh Trung tâm • Ca làm việc toàn thời gian</small></div></div><div className="employment-timeline"><span><Icon name="shield"/></span><div><strong>Tài khoản: {item.account}</strong><small>Đăng nhập gần nhất: chưa ghi nhận</small></div></div></div>}
  <div className="dialog__footer medicine-detail-footer"><Button variant="secondary" onClick={onClose}>Đóng</Button><Button icon="settings" onClick={onEdit}>Chỉnh sửa</Button></div></section></div>
}
