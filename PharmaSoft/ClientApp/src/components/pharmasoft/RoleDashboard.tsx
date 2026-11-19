import { FormEvent, useRef, useState } from 'react'
import { Button, Icon, IconName } from './App'
import { SessionUser, roleMenus } from './roles'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { OTPModal } from './OTPModal'
import { deriveStatus, isExpired, useDemoCommerce } from './DemoCommerce'
import { readCollection } from '@/lib/persist'
import { nowTimeVN, todayISO, vnToISO } from '@/lib/today'

const content={
  pharmacist:{title:'Bảng điều hành dược sĩ',subtitle:'Theo dõi thuốc, khách hàng và hoạt động tư vấn trong ca.',stats:[['Thuốc cần kiểm tra','12','archive','amber'],['Khách hàng hôm nay','48','customers','blue'],['Đơn đã xử lý','72','invoice','green'],['Cảnh báo hạn dùng','8','calendar','orange']],tasks:[['Kiểm tra thuốc sắp hết','Quản lý thuốc'],['Mở quầy bán hàng','Bán hàng'],['Tra cứu thuốc','Chatbot tư vấn thuốc']]},
  cashier:{title:'Bảng điều hành thu ngân',subtitle:'Quản lý giao dịch bán hàng và thanh toán trong ca.',stats:[['Doanh thu ca','18.640.000 VNĐ','activity','green'],['Đơn đã thanh toán','86','invoice','blue'],['Chưa thanh toán','3','help','amber'],['Khách hàng đã lưu','12','customers','purple']],tasks:[['Bắt đầu bán hàng','Bán hàng'],['Kiểm tra hóa đơn','Hóa đơn'],['Tra cứu khách hàng','Khách hàng']]},
  warehouse:{title:'Bảng điều hành kho',subtitle:'Theo dõi nhập, xuất, kiểm kê và cảnh báo tồn kho.',stats:[['Phiếu nhập chờ xác nhận','4','download','blue'],['Phiếu xuất chờ duyệt','3','box','purple'],['Sản phẩm sắp hết','12','archive','amber'],['Lô sắp hết hạn','8','calendar','orange']],tasks:[['Tạo phiếu nhập','Nhập hàng'],['Tạo phiếu xuất','Xuất hàng'],['Bắt đầu kiểm kê','Kiểm kê kho']]},
  doctor:{title:'Bảng điều hành bác sĩ',subtitle:'Quản lý trạng thái và các hội thoại khách hàng mô phỏng.',stats:[['Hội thoại đang chờ','3','bell','amber'],['Đang tư vấn','1','doctor','green'],['Đã hoàn tất hôm nay','12','check','blue'],['Tin nhắn chưa đọc','5','file','purple']],tasks:[['Mở cổng bác sĩ','Chat bác sĩ'],['Xem thông báo','Thông báo'],['Xem hồ sơ của tôi','Hồ sơ cá nhân']]},
  customer:{title:'Xin chào, Nguyễn Thị Hồng',subtitle:'Tra cứu thông tin thuốc và sử dụng các kênh hỗ trợ mô phỏng.',stats:[['Điểm tích lũy','2.840','percent','green'],['Hạng thành viên','Vàng','shield','amber'],['Hóa đơn gần đây','6','invoice','blue'],['Thông báo mới','2','bell','purple']],tasks:[['Tra cứu thuốc','Chatbot tư vấn thuốc'],['Chat với bác sĩ','Chat bác sĩ'],['Xem hồ sơ của tôi','Hồ sơ cá nhân']]},
}
type CommerceData=ReturnType<typeof useDemoCommerce>
/** Giá trị thật cho các ô thống kê, theo nhãn của ô. */
function liveStats(user:SessionUser,products:CommerceData['products'],orders:CommerceData['orders']):Record<string,string>{
  const today=todayISO()
  const active=orders.filter(o=>o.orderStatus!=='Đã hủy')
  const todayOrders=active.filter(o=>vnToISO(o.createdAt)===today)
  const isPaid=(o:CommerceData['orders'][number])=>o.paymentStatus==='Đã thanh toán'||o.paymentStatus==='Hoàn tiền một phần'
  const lowStock=products.filter(p=>!isExpired(p.expiry)&&p.stock<p.minimum).length
  const expiryWarnings=products.filter(p=>['Đã hết hạn','Sắp hết hạn'].includes(deriveStatus(p))).length
  const money=(v:number)=>`${Math.round(v).toLocaleString('vi-VN')} VNĐ`
  if(user.role==='pharmacist')return{
    'Thuốc cần kiểm tra':String(lowStock),
    'Khách hàng hôm nay':String(new Set(todayOrders.map(o=>o.customerId)).size),
    'Đơn đã xử lý':String(todayOrders.length),
    'Cảnh báo hạn dùng':String(expiryWarnings),
  }
  if(user.role==='cashier')return{
    // Doanh thu ca = các đơn POS hôm nay do chính thu ngân này bán
    'Doanh thu ca':money(todayOrders.filter(o=>o.employee===user.name&&isPaid(o)).reduce((sum,o)=>sum+o.total,0)),
    'Đơn đã thanh toán':String(todayOrders.filter(isPaid).length),
    'Chưa thanh toán':String(active.filter(o=>['Chưa thanh toán','Chờ xác nhận'].includes(o.paymentStatus)).length),
    'Khách hàng đã lưu':String(readCollection<unknown[]>('pos-customers',[]).length),
  }
  if(user.role==='warehouse'){
    const receipts=readCollection<Array<{status:string}>>('inventory-receipts',[])
    const issues=readCollection<Array<{status:string}>>('inventory-issues',[])
    const batches=readCollection<Array<{expiry:string}>>('inventory-stock',[])
    const nearExpiry=batches.filter(b=>{const iso=vnToISO(b.expiry);if(!iso||iso<today)return false;return (new Date(iso).getTime()-new Date(today).getTime())/86400000<=90}).length
    return{
      'Phiếu nhập chờ xác nhận':String(receipts.filter(r=>r.status==='Chờ xác nhận').length),
      'Phiếu xuất chờ duyệt':String(issues.filter(r=>r.status==='Chờ duyệt').length),
      'Sản phẩm sắp hết':String(lowStock),
      'Lô sắp hết hạn':String(nearExpiry),
    }
  }
  if(user.role==='customer'){
    const customers=readCollection<Array<{name:string;phone:string;level:string;points:number}>>('pos-customers',[])
    const digits=(s:string)=>s.replace(/\D/g,'')
    const profile=customers.find(c=>digits(c.phone)===digits(user.phone))||customers.find(c=>c.name===user.name)
    const notices=readCollection<Array<{read:boolean}>>('notices',[])
    return{
      'Điểm tích lũy':profile?profile.points.toLocaleString('vi-VN'):'0',
      'Hạng thành viên':profile?.level||'Thành viên',
      'Hóa đơn gần đây':String(orders.filter(o=>o.customerId===user.id||digits(o.phone)===digits(user.phone)).length),
      'Thông báo mới':String(notices.filter(n=>!n.read).length),
    }
  }
  return {}
}
export function RoleDashboard({user,onNavigate}:{user:SessionUser;onNavigate:(route:string)=>void}){
  const commerce=useDemoCommerce()
  const data=content[user.role as keyof typeof content]
  if(!data)return null
  // Số liệu tính từ dữ liệu thật; vai trò bác sĩ dùng dữ liệu hội thoại mô phỏng nên giữ nguyên
  const live=liveStats(user,commerce.products,commerce.orders)
  const stats=data.stats.map(item=>item[0] in live?[item[0],live[item[0]],item[2],item[3]]:item)
  const updatedLabel=user.role==='doctor'?'Dữ liệu mô phỏng':`Cập nhật lúc ${nowTimeVN()}`
  const title=user.role==='customer'?`Xin chào, ${user.name}`:data.title
  return <div className="role-dashboard"><section className="role-welcome"><div><span className="role-welcome-avatar">{user.initials}</span><div><div className="eyebrow">{user.roleLabel.toUpperCase()}</div><h2>{title}</h2><p>{data.subtitle}</p></div></div><span className="role-session"><i/> Đang trong phiên làm việc</span></section><section className="role-dashboard-stats">{stats.map(item=><div className="card" key={item[0]}><span className={`role-stat-icon ${item[3]}`}><Icon name={item[2] as IconName}/></span><div><small>{item[0]}</small><strong>{item[1]}</strong><em>{updatedLabel}</em></div></div>)}</section><section className="role-dashboard-grid"><div className="card role-tasks"><div><h3>Thao tác nhanh</h3><p>Các chức năng thường dùng theo quyền {user.roleLabel}.</p></div>{data.tasks.map(task=><button key={task[0]} onClick={()=>onNavigate(task[1])}><span><Icon name="activity"/></span><div><strong>{task[0]}</strong><small>Mở phân hệ {task[1]}</small></div><Icon name="chevron"/></button>)}</div><div className="card role-permissions"><div><h3>Quyền truy cập của bạn</h3><p>{user.description}</p></div><div>{roleMenus[user.role].filter(x=>x!=='Tổng quan').map(route=><span key={route}><Icon name="check"/>{route}</span>)}</div></div></section></div>
}
export function UserProfile({user,prototypeMode=false}:{user:SessionUser;prototypeMode?:boolean}){
  const [profile,setProfile]=useState(user),[editing,setEditing]=useState(false),[message,setMessage]=useState('')
  const [otpOpen,setOtpOpen]=useState(false)
  const [avatar,setAvatar]=useState<string|null>(null)
  const [phoneVerified,setPhoneVerified]=useState(false)
  const avatarInputRef=useRef<HTMLInputElement>(null)

  function handleAvatar(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]
    if(file){
      const reader=new FileReader()
      reader.onload=(ev)=>{if(typeof ev.target?.result==='string')setAvatar(ev.target.result)}
      reader.readAsDataURL(file)
    }
  }

  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setMessage('')
    const data=new FormData(event.currentTarget),name=String(data.get('name')||'').trim(),username=String(data.get('username')||'').trim(),phone=String(data.get('phone')||'').trim()
    if(!name||!username){setMessage('Họ tên và username không được để trống.');return}
    if(!prototypeMode){
      const {error}=await getSupabaseBrowserClient().from('profiles').update({full_name:name,username,phone}).eq('id',profile.id)
      if(error){setMessage(`Không thể cập nhật hồ sơ: ${error.message}`);return}
    }
    setProfile({...profile,name,username,phone,initials:name.split(' ').slice(-2).map(part=>part[0]).join('')});setEditing(false);setMessage(prototypeMode?'Hồ sơ mẫu đã được cập nhật trong phiên Design Preview.':'Hồ sơ đã được lưu trên Supabase.')
  }
  return <div className="user-profile-page">
    <section className="card profile-hero">
      <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatar} style={{display:'none'}}/>
      <span onClick={()=>avatarInputRef.current?.click()} style={{cursor:'pointer',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}} title="Nhấn để đổi ảnh đại diện">
        {avatar ? <img src={avatar} alt="Avatar" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : profile.initials}
      </span>
      <div><div className="eyebrow">HỒ SƠ TÀI KHOẢN</div><h2>{profile.name}</h2><p>{profile.roleLabel} • {profile.id}</p></div>
      <div style={{display:'flex',gap:8}}>
        <Button variant="secondary" icon="shield" onClick={()=>setOtpOpen(true)}>{phoneVerified?'Đã xác thực OTP':'Xác thực SĐT (OTP)'}</Button>
        <Button variant="secondary" icon="settings" onClick={()=>setEditing(!editing)}>{editing?'Đóng':'Chỉnh sửa hồ sơ'}</Button>
      </div>
    </section>
    {message&&<div className="profile-save-message">{message}</div>}
    {editing&&<form className="card profile-edit-form" onSubmit={save}><label className="field"><span>Họ và tên</span><input name="name" defaultValue={profile.name}/></label><label className="field"><span>Username</span><input name="username" defaultValue={profile.username}/></label><label className="field"><span>Số điện thoại</span><input name="phone" defaultValue={profile.phone}/></label><Button type="submit">Lưu hồ sơ</Button></form>}
    <section className="profile-info-grid">
      <div className="card"><small>TÊN ĐĂNG NHẬP</small><strong>{profile.username}</strong></div>
      <div className="card"><small>EMAIL</small><strong>{profile.email}</strong></div>
      <div className="card"><small>SỐ ĐIỆN THOẠI</small><strong>{profile.phone}</strong>{phoneVerified&&<small style={{color:'#16834a',fontWeight:600}}>✓ Đã xác thực OTP</small>}</div>
      <div className="card"><small>VAI TRÒ</small><strong>{profile.roleLabel}</strong></div>
      <div className="card"><small>NGÀY TẠO</small><strong>{profile.createdAt||'Chưa đồng bộ'}</strong></div>
      <div className="card"><small>TRẠNG THÁI</small><strong>{profile.status==='locked'?'Đã khóa':'Đang hoạt động'}</strong></div>
    </section>
    <section className="card profile-permission-card"><h3>Phạm vi quyền truy cập</h3><p>{profile.description}</p><div>{roleMenus[profile.role].map(route=><span key={route}><Icon name="check"/>{route}</span>)}</div></section>
    {otpOpen&&<OTPModal defaultPhone={profile.phone} onVerified={(p)=>{setPhoneVerified(true);setOtpOpen(false);setMessage(`Đã xác thực thành công số điện thoại ${p} qua OTP!`)}} onClose={()=>setOtpOpen(false)}/>}
  </div>
}
