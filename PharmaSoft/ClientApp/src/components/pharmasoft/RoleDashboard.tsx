import { FormEvent, useRef, useState } from 'react'
import { Button, Icon, IconName } from './App'
import { SessionUser, roleMenus } from './roles'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { OTPModal } from './OTPModal'

const content={
  pharmacist:{title:'Bảng điều hành dược sĩ',subtitle:'Theo dõi thuốc, khách hàng và hoạt động tư vấn trong ca.',stats:[['Thuốc cần kiểm tra','12','archive','amber'],['Khách hàng hôm nay','48','customers','blue'],['Đơn đã xử lý','72','invoice','green'],['Cảnh báo hạn dùng','8','calendar','orange']],tasks:[['Kiểm tra thuốc sắp hết','Quản lý thuốc'],['Mở quầy bán hàng','Bán hàng'],['Tra cứu thuốc','Chatbot tư vấn thuốc']]},
  cashier:{title:'Bảng điều hành thu ngân',subtitle:'Quản lý giao dịch bán hàng và thanh toán trong ca.',stats:[['Doanh thu ca','18.640.000 VNĐ','activity','green'],['Đơn đã thanh toán','86','invoice','blue'],['Chưa thanh toán','3','help','amber'],['Khách hàng mới','12','customers','purple']],tasks:[['Bắt đầu bán hàng','Bán hàng'],['Kiểm tra hóa đơn','Hóa đơn'],['Tra cứu khách hàng','Khách hàng']]},
  warehouse:{title:'Bảng điều hành kho',subtitle:'Theo dõi nhập, xuất, kiểm kê và cảnh báo tồn kho.',stats:[['Phiếu nhập chờ xác nhận','4','download','blue'],['Phiếu xuất chờ duyệt','3','box','purple'],['Sản phẩm sắp hết','12','archive','amber'],['Lô sắp hết hạn','8','calendar','orange']],tasks:[['Tạo phiếu nhập','Nhập hàng'],['Tạo phiếu xuất','Xuất hàng'],['Bắt đầu kiểm kê','Kiểm kê kho']]},
  doctor:{title:'Bảng điều hành bác sĩ',subtitle:'Quản lý trạng thái và các hội thoại khách hàng mô phỏng.',stats:[['Hội thoại đang chờ','3','bell','amber'],['Đang tư vấn','1','doctor','green'],['Đã hoàn tất hôm nay','12','check','blue'],['Tin nhắn chưa đọc','5','file','purple']],tasks:[['Mở cổng bác sĩ','Chat bác sĩ'],['Xem thông báo','Thông báo'],['Xem hồ sơ của tôi','Hồ sơ cá nhân']]},
  customer:{title:'Xin chào, Nguyễn Thị Hồng',subtitle:'Tra cứu thông tin thuốc và sử dụng các kênh hỗ trợ mô phỏng.',stats:[['Điểm tích lũy','2.840','percent','green'],['Hạng thành viên','Vàng','shield','amber'],['Hóa đơn gần đây','6','invoice','blue'],['Thông báo mới','2','bell','purple']],tasks:[['Tra cứu thuốc','Chatbot tư vấn thuốc'],['Chat với bác sĩ','Chat bác sĩ'],['Xem hồ sơ của tôi','Hồ sơ cá nhân']]},
}
export function RoleDashboard({user,onNavigate}:{user:SessionUser;onNavigate:(route:string)=>void}){
  const data=content[user.role as keyof typeof content]
  if(!data)return null
  const title=user.role==='customer'?`Xin chào, ${user.name}`:data.title
  return <div className="role-dashboard"><section className="role-welcome"><div><span className="role-welcome-avatar">{user.initials}</span><div><div className="eyebrow">{user.roleLabel.toUpperCase()}</div><h2>{title}</h2><p>{data.subtitle}</p></div></div><span className="role-session"><i/> Đang trong phiên làm việc</span></section><section className="role-dashboard-stats">{data.stats.map(item=><div className="card" key={item[0]}><span className={`role-stat-icon ${item[3]}`}><Icon name={item[2] as IconName}/></span><div><small>{item[0]}</small><strong>{item[1]}</strong><em>Cập nhật lúc 14:35</em></div></div>)}</section><section className="role-dashboard-grid"><div className="card role-tasks"><div><h3>Thao tác nhanh</h3><p>Các chức năng thường dùng theo quyền {user.roleLabel}.</p></div>{data.tasks.map(task=><button key={task[0]} onClick={()=>onNavigate(task[1])}><span><Icon name="activity"/></span><div><strong>{task[0]}</strong><small>Mở phân hệ {task[1]}</small></div><Icon name="chevron"/></button>)}</div><div className="card role-permissions"><div><h3>Quyền truy cập của bạn</h3><p>{user.description}</p></div><div>{roleMenus[user.role].filter(x=>x!=='Tổng quan').map(route=><span key={route}><Icon name="check"/>{route}</span>)}</div></div></section></div>
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
