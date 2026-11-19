import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Badge, Button, Icon } from './App'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { demoUsers } from './roles'

type Account = { id: string; name: string; initials: string; email: string; phone: string; role: string; status: 'Đang hoạt động' | 'Đã khóa'; lastLogin: string }
const roles = ['Quản trị viên', 'Quản lý cửa hàng', 'Dược sĩ', 'Thu ngân', 'Nhân viên kho', 'Bác sĩ', 'Khách hàng']
const permissionRows = ['Tổng quan & báo cáo', 'Quản lý thuốc', 'Bán hàng & hóa đơn', 'Quản lý kho', 'Khách hàng', 'Tài khoản & phân quyền']
const permissionMap: Record<string, boolean[][]> = {
  'Quản trị viên': permissionRows.map(() => [true, true, true, true, true, true]),
  'Quản lý cửa hàng': [[true,false,false,false,false,true],[true,true,true,false,true,true],[true,true,true,false,true,true],[true,true,true,false,true,true],[true,true,true,false,false,true],[true,true,true,false,true,false]],
  'Dược sĩ': [[true,false,false,false,false,false],[true,true,true,false,false,false],[true,true,true,false,false,false],[true,false,false,false,false,false],[true,true,true,false,false,false],[false,false,false,false,false,false]],
  'Thu ngân': [[true,false,false,false,false,false],[true,false,false,false,false,false],[true,true,true,false,false,true],[false,false,false,false,false,false],[true,true,true,false,false,false],[false,false,false,false,false,false]],
  'Nhân viên kho': [[true,false,false,false,false,false],[true,true,true,false,false,true],[false,false,false,false,false,false],[true,true,true,true,true,true],[false,false,false,false,false,false],[false,false,false,false,false,false]],
  'Bác sĩ': [[true,false,false,false,false,false],[true,false,false,false,false,false],[false,false,false,false,false,false],[false,false,false,false,false,false],[true,false,false,false,false,false],[false,false,false,false,false,false]],
  'Khách hàng': [[true,false,false,false,false,false],[true,false,false,false,false,false],[false,false,false,false,false,false],[false,false,false,false,false,false],[true,false,true,false,false,false],[false,false,false,false,false,false]],
}
const prototypeAccounts:Account[]=demoUsers.map(user=>({id:user.id,name:user.name,initials:user.initials,email:user.email,phone:user.phone,role:user.roleLabel,status:'Đang hoạt động',lastLogin:'Chưa ghi nhận'}))

export function AccountManagement({prototypeMode=false}:{prototypeMode?:boolean}) {
  const [accounts, setAccounts] = useState<Account[]>(prototypeMode?prototypeAccounts:[])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('Tất cả vai trò')
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái')
  const [selectedRole, setSelectedRole] = useState('Quản trị viên')
  const [tab, setTab] = useState<'accounts' | 'roles'>('accounts')
  const [dialog, setDialog] = useState<'form' | 'detail' | 'lock' | 'reset' | null>(null)
  const [selected, setSelected] = useState<Account | null>(null)
  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState('')
  const [syncState,setSyncState]=useState('Đang đồng bộ Supabase...')
  useEffect(()=>{
    if(prototypeMode){
      try{
        const stored=JSON.parse(localStorage.getItem('pharmasoft-demo-users-v3')||'[]') as Array<{id:string;name:string;email:string;phone:string;role:string;roleLabel:string;status:string}>
        if(stored.length)setAccounts(stored.map(user=>({id:user.id,name:user.name,initials:user.name.split(' ').slice(-2).map(part=>part[0]).join(''),email:user.email,phone:user.phone,role:user.roleLabel,status:user.status==='locked'?'Đã khóa':'Đang hoạt động',lastLogin:'Tài khoản DEMO'})))
      }catch{}
      setSyncState('Tài khoản mẫu trong Figma Design Preview');return
    }
    getSupabaseBrowserClient().from('profiles').select('*').order('created_at',{ascending:false}).then(({data,error})=>{
      if(error){setSyncState(`Chưa thể đọc profiles: ${error.message}`);return}
      const roleLabels:Record<string,string>={admin:'Quản trị viên',manager:'Quản lý cửa hàng',pharmacist:'Dược sĩ',cashier:'Thu ngân',warehouse:'Nhân viên kho',doctor:'Bác sĩ',customer:'Khách hàng'}
      const remote:Account[]=(data||[]).map(profile=>({id:profile.id,name:profile.full_name,initials:profile.full_name.split(' ').slice(-2).map((part:string)=>part[0]).join(''),email:profile.email,phone:profile.phone||'—',role:profile.role_label||roleLabels[profile.role]||profile.role,status:profile.status==='locked'?'Đã khóa':'Đang hoạt động',lastLogin:'Tài khoản Supabase'}))
      setAccounts(remote);setSyncState(`${remote.length} tài khoản từ Supabase`)
    })
  },[prototypeMode])
  const filtered = useMemo(() => accounts.filter(a => (a.name.toLowerCase().includes(query.toLowerCase()) || a.email.toLowerCase().includes(query.toLowerCase())) && (roleFilter === 'Tất cả vai trò' || a.role === roleFilter) && (statusFilter === 'Tất cả trạng thái' || a.status === statusFilter)), [accounts, query, roleFilter, statusFilter])

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(''), 3000) }
  function open(type: typeof dialog, account: Account | null = null) { setSelected(account); setDialog(type) }
  async function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name'))
    if (!name) return
    if (editing && selected) {
      const roleMap:Record<string,string>={'Quản trị viên':'admin','Quản lý cửa hàng':'manager','Dược sĩ':'pharmacist','Thu ngân':'cashier','Nhân viên kho':'warehouse','Bác sĩ':'doctor','Khách hàng':'customer'}
      const role=String(data.get('role'))
      if(!prototypeMode){
        const {error}=await getSupabaseBrowserClient().from('profiles').update({full_name:name,phone:String(data.get('phone')),role:roleMap[role],role_label:role}).eq('id',selected.id)
        if(error){notify(`Không thể cập nhật Supabase: ${error.message}`);return}
      }else{
        try{
          const stored=JSON.parse(localStorage.getItem('pharmasoft-demo-users-v3')||'[]')
          localStorage.setItem('pharmasoft-demo-users-v3',JSON.stringify(stored.map((user:{id:string})=>user.id===selected.id?{...user,name,phone:String(data.get('phone')),role:roleMap[role],roleLabel:role}:user)))
        }catch{}
      }
      setAccounts(accounts.map(a => a.id === selected.id ? { ...a, name, email: String(data.get('email')), phone: String(data.get('phone')), role } : a))
    }
    else if(prototypeMode)setAccounts([...accounts,{id:`TK00${accounts.length+1}`,name,initials:name.split(' ').slice(-2).map(x=>x[0]).join(''),email:String(data.get('email')),phone:String(data.get('phone')),role:String(data.get('role')),status:'Đang hoạt động',lastLogin:'Chưa đăng nhập'}])
    else { notify('Tài khoản nhân sự phải được tạo an toàn trong Supabase Dashboard.');return }
    setDialog(null); notify(editing?'Cập nhật tài khoản thành công':'Đã thêm tài khoản vào prototype')
  }
  async function toggleLock() {
    if (!selected) return
    const nextStatus=selected.status === 'Đã khóa' ? 'active' : 'locked'
    if(!prototypeMode){
      const {error}=await getSupabaseBrowserClient().from('profiles').update({status:nextStatus}).eq('id',selected.id)
      if(error){notify(`Không thể cập nhật Supabase: ${error.message}`);return}
    }else{
      try{
        const stored=JSON.parse(localStorage.getItem('pharmasoft-demo-users-v3')||'[]')
        localStorage.setItem('pharmasoft-demo-users-v3',JSON.stringify(stored.map((user:{id:string})=>user.id===selected.id?{...user,status:nextStatus}:user)))
      }catch{}
    }
    setAccounts(accounts.map(a => a.id === selected.id ? { ...a, status: a.status === 'Đã khóa' ? 'Đang hoạt động' : 'Đã khóa' } : a))
    setDialog(null); notify(selected.status === 'Đã khóa' ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản')
  }
  async function sendPasswordReset(){
    if(!selected)return
    if(!prototypeMode){
      const {error}=await getSupabaseBrowserClient().auth.resetPasswordForEmail(selected.email,{redirectTo:window.location.origin})
      if(error){notify(`Không thể gửi liên kết: ${error.message}`);return}
    }
    setDialog(null);notify(prototypeMode?'Đã mô phỏng gửi liên kết đặt lại mật khẩu':'Supabase đã gửi liên kết đặt lại mật khẩu')
  }

  return <div className="account-module">
    <div className="account-tabs"><button className={tab === 'accounts' ? 'active' : ''} onClick={() => setTab('accounts')}><Icon name="users" />Danh sách tài khoản <span>{accounts.length}</span></button><button className={tab === 'roles' ? 'active' : ''} onClick={() => setTab('roles')}><Icon name="shield" />Vai trò & phân quyền</button></div>
    {tab === 'accounts' ? <>
      <div className="account-stats">
        <div className="card"><span className="account-stat-icon green"><Icon name="users" /></span><div><small>Tổng tài khoản</small><strong>{accounts.length}</strong><em>Trên toàn hệ thống</em></div></div>
        <div className="card"><span className="account-stat-icon blue"><Icon name="check" /></span><div><small>Đang hoạt động</small><strong>{accounts.filter(a => a.status === 'Đang hoạt động').length}</strong><em>Đăng nhập trong 30 ngày</em></div></div>
        <div className="card"><span className="account-stat-icon amber"><Icon name="shield" /></span><div><small>Tài khoản bị khóa</small><strong>{accounts.filter(a => a.status === 'Đã khóa').length}</strong><em>Cần kiểm tra</em></div></div>
      </div>
      <section className="card accounts-card">
        <div className="supabase-sync-status"><Icon name="shield" size={14}/><span>{syncState}</span></div>
        <div className="accounts-toolbar">
          <div className="table-search account-search"><Icon name="search" size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm theo tên hoặc email..." /></div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}><option>Tất cả vai trò</option>{roles.map(r => <option key={r}>{r}</option>)}</select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>Tất cả trạng thái</option><option>Đang hoạt động</option><option>Đã khóa</option></select>
          <Button icon="plus" onClick={() => prototypeMode?(setEditing(false),open('form')):notify('Tạo tài khoản nhân sự trong Supabase Dashboard, sau đó gán vai trò bằng SQL bảo mật.')}>Thêm tài khoản</Button>
        </div>
        <div className="table-wrap"><table className="accounts-table"><thead><tr><th>NGƯỜI DÙNG</th><th>LIÊN HỆ</th><th>VAI TRÒ</th><th>ĐĂNG NHẬP GẦN NHẤT</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>
          {filtered.map(account => <tr key={account.id}><td><div className="account-user"><span>{account.initials}</span><div><strong>{account.name}</strong><small>{account.id}</small></div></div></td><td><strong>{account.email}</strong><small>{account.phone}</small></td><td><span className="role-chip">{account.role}</span></td><td>{account.lastLogin}</td><td><Badge kind={account.status === 'Đã khóa' ? 'danger' : 'ok'}>{account.status}</Badge></td><td><div className="account-actions"><button title="Xem chi tiết" onClick={() => open('detail', account)}><Icon name="file" /></button><button title="Chỉnh sửa" onClick={() => { setEditing(true); open('form', account) }}><Icon name="settings" /></button><button title="Đặt lại mật khẩu" onClick={() => open('reset', account)}><Icon name="shield" /></button><button className={account.status === 'Đã khóa' ? 'unlock' : 'lock'} title={account.status === 'Đã khóa' ? 'Mở khóa' : 'Khóa'} onClick={() => open('lock', account)}><Icon name={account.status === 'Đã khóa' ? 'check' : 'logout'} /></button></div></td></tr>)}
        </tbody></table></div>
        <div className="pagination"><span>Hiển thị <strong>{filtered.length}</strong> tài khoản</span><div><button disabled>‹</button><button className="active">1</button><button>›</button></div></div>
      </section>
    </> : <section className="roles-layout">
      <aside className="card role-list"><div><strong>Vai trò hệ thống</strong><small>Chọn vai trò để xem quyền</small></div>{roles.map((role, index) => <button key={role} className={selectedRole === role ? 'active' : ''} onClick={() => setSelectedRole(role)}><span className={`role-icon role-${index}`}><Icon name={index === 0 ? 'shield' : index === 1 ? 'store' : index === 2 ? 'doctor' : index === 3 ? 'cart' : 'archive'} /></span><span><strong>{role}</strong><small>{accounts.filter(a => a.role === role).length} tài khoản</small></span><Icon name="chevron" size={15} /></button>)}</aside>
      <div className="card permission-card">
        <div className="permission-header"><div><span className="account-stat-icon green"><Icon name="shield" /></span><div><h2>{selectedRole}</h2><p>Quyền được áp dụng cho tất cả tài khoản thuộc vai trò này.</p></div></div><Button variant="secondary" icon="settings">Chỉnh sửa quyền</Button></div>
        <div className="permission-note"><Icon name="help" /><span>Ma trận bên dưới hiển thị quyền hiện tại. Thay đổi quyền có hiệu lực ngay sau khi lưu.</span></div>
        <div className="permission-table-wrap"><table className="permission-table"><thead><tr><th>NHÓM CHỨC NĂNG</th>{['XEM','TẠO','SỬA','XÓA','DUYỆT','XUẤT'].map(x => <th key={x}>{x}</th>)}</tr></thead><tbody>{permissionRows.map((row, i) => <tr key={row}><td>{row}</td>{permissionMap[selectedRole][i].map((allowed, j) => <td key={j}><span className={allowed ? 'permission-yes' : 'permission-no'}>{allowed ? <Icon name="check" size={15} /> : '—'}</span></td>)}</tr>)}</tbody></table></div>
      </div>
    </section>}

    {dialog === 'form' && <div className="dialog-layer"><section className="dialog account-dialog"><div className="dialog__header"><div><div className="eyebrow">{editing ? 'CHỈNH SỬA NGƯỜI DÙNG' : 'NGƯỜI DÙNG MỚI'}</div><h2>{editing ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}</h2><p>Thông tin đăng nhập sẽ được gửi đến người dùng qua email.</p></div><button className="icon-button" onClick={() => setDialog(null)}><Icon name="close" /></button></div><form onSubmit={saveAccount}><div className="form-grid"><label className="field field--wide"><span>Họ và tên *</span><input name="name" defaultValue={selected?.name} placeholder="Nguyễn Văn An" required /></label><label className="field"><span>Email *</span><input name="email" type="email" defaultValue={selected?.email} placeholder="email@pharmasoft.vn" required /></label><label className="field"><span>Số điện thoại</span><input name="phone" defaultValue={selected?.phone} placeholder="0901 234 567" /></label><label className="field field--wide"><span>Vai trò</span><select name="role" defaultValue={selected?.role || 'Dược sĩ'}>{roles.map(r => <option key={r}>{r}</option>)}</select></label></div><div className="dialog__footer"><Button variant="secondary" onClick={() => setDialog(null)}>Hủy bỏ</Button><Button type="submit">{editing ? 'Lưu thay đổi' : 'Tạo tài khoản'}</Button></div></form></section></div>}
    {dialog === 'detail' && selected && <div className="dialog-layer"><section className="dialog detail-dialog"><div className="dialog__header"><div><div className="eyebrow">CHI TIẾT TÀI KHOẢN</div><h2>Thông tin người dùng</h2></div><button className="icon-button" onClick={() => setDialog(null)}><Icon name="close" /></button></div><div className="detail-profile"><span>{selected.initials}</span><h3>{selected.name}</h3><Badge kind={selected.status === 'Đã khóa' ? 'danger' : 'ok'}>{selected.status}</Badge></div><div className="detail-grid"><div><small>MÃ TÀI KHOẢN</small><strong>{selected.id}</strong></div><div><small>VAI TRÒ</small><strong>{selected.role}</strong></div><div><small>EMAIL</small><strong>{selected.email}</strong></div><div><small>SỐ ĐIỆN THOẠI</small><strong>{selected.phone}</strong></div><div><small>ĐĂNG NHẬP GẦN NHẤT</small><strong>{selected.lastLogin}</strong></div><div><small>NGÀY TẠO</small><strong>12/03/2025</strong></div></div><div className="detail-footer"><Button variant="secondary" onClick={() => setDialog(null)}>Đóng</Button><Button icon="settings" onClick={() => { setEditing(true); setDialog('form') }}>Chỉnh sửa</Button></div></section></div>}
    {dialog === 'lock' && selected && <div className="dialog-layer"><section className="confirm-dialog"><span className={selected.status === 'Đã khóa' ? 'confirm-icon green' : 'confirm-icon red'}><Icon name={selected.status === 'Đã khóa' ? 'check' : 'logout'} /></span><h2>{selected.status === 'Đã khóa' ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}</h2><p>{selected.status === 'Đã khóa' ? `${selected.name} sẽ có thể đăng nhập và sử dụng hệ thống trở lại.` : `${selected.name} sẽ không thể đăng nhập cho đến khi tài khoản được mở khóa.`}</p><div><Button variant="secondary" onClick={() => setDialog(null)}>Hủy bỏ</Button><Button onClick={toggleLock}>{selected.status === 'Đã khóa' ? 'Mở khóa' : 'Xác nhận khóa'}</Button></div></section></div>}
    {dialog === 'reset' && selected && <div className="dialog-layer"><section className="confirm-dialog"><span className="confirm-icon green"><Icon name="shield" /></span><h2>Đặt lại mật khẩu?</h2><p>Supabase Auth sẽ gửi liên kết tạo mật khẩu mới đến <strong>{selected.email}</strong>.</p><div><Button variant="secondary" onClick={() => setDialog(null)}>Hủy bỏ</Button><Button onClick={sendPasswordReset}>Gửi liên kết</Button></div></section></div>}
    {toast && <div className="toast"><span><Icon name="check" /></span><div><strong>{toast}</strong><small>Thay đổi đã được cập nhật trên hệ thống.</small></div><button onClick={() => setToast('')}><Icon name="close" /></button></div>}
  </div>
}
