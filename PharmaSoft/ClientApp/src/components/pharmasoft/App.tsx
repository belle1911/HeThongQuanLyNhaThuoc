'use client'

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import { AuthModule } from './AuthModule'
import { DemoAuthModule, DEMO_REMEMBERED_KEY, DEMO_SESSION_KEY } from './DemoAuthModule'
import { DemoCommerceProvider } from './DemoCommerce'
import { CustomerStore } from './CustomerStore'
import { AccountManagement } from './AccountManagement'
import { Dashboard } from './Dashboard'
import { MedicineManagement } from './MedicineManagement'
import { BusinessPartners } from './BusinessPartners'
import { AuditLog } from './AuditLog'
import { setActor } from '@/lib/persist'
import { SalesPOS } from './SalesPOS'
import { InventoryManagement } from './InventoryManagement'
import { BillingManagement } from './BillingManagement'
import { ReportsAnalytics } from './ReportsAnalytics'
import { DoctorChat, MedicineChatbot } from './CommunicationModules'
import { NotificationCenter, SystemSettings } from './SystemModules'
import { DeveloperHandoff } from './DeveloperHandoff'
import { RoleDashboard, UserProfile } from './RoleDashboard'
import { demoUsers, roleHome, roleMenus, SessionUser } from './roles'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export type IconName =
  | 'activity'
  | 'archive'
  | 'bell'
  | 'bot'
  | 'box'
  | 'calendar'
  | 'cart'
  | 'chart'
  | 'check'
  | 'chevron'
  | 'clipboard'
  | 'close'
  | 'customers'
  | 'doctor'
  | 'download'
  | 'file'
  | 'grid'
  | 'help'
  | 'invoice'
  | 'logout'
  | 'menu'
  | 'package'
  | 'percent'
  | 'plus'
  | 'search'
  | 'settings'
  | 'shield'
  | 'store'
  | 'truck'
  | 'users'

const paths: Record<IconName, ReactNode> = {
  activity: <><path d="M3 12h4l2.5-7 5 14 2.5-7h4" /></>,
  archive: <><path d="M4 7h16v13H4zM3 3h18v4H3zM9 11h6" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  bot: <><rect x="4" y="7" width="16" height="13" rx="3" /><path d="M12 3v4M8 12h.01M16 12h.01M8 16h8" /></>,
  box: <><path d="m21 8-9 5-9-5 9-5zM3 8v9l9 5 9-5V8M12 13v9" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  cart: <><circle cx="9" cy="20" r="1" /><circle cx="19" cy="20" r="1" /><path d="M3 4h2l2.5 11h11l2-7H7" /></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  chevron: <><path d="m9 18 6-6-6-6" /></>,
  clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4" /></>,
  close: <><path d="M18 6 6 18M6 6l12 12" /></>,
  customers: <><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-7 7-7s7 3 7 7M16 3c3 0 5 2 5 5s-2 5-5 5M18 15c2 .8 4 3 4 6" /></>,
  doctor: <><path d="M8 3v5a4 4 0 0 0 8 0V3M6 3h4M14 3h4M12 12v2a6 6 0 0 0 6 6h1" /><circle cx="20" cy="18" r="2" /></>,
  download: <><path d="M12 3v12m0 0 5-5m-5 5-5-5M4 21h16" /></>,
  file: <><path d="M6 2h9l5 5v15H6zM14 2v6h6M9 13h6M9 17h6" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.3 2.3 0 1 1 3.4 2c-1.2.7-1.2 1.3-1.2 2M12 17h.01" /></>,
  invoice: <><path d="M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  package: <><path d="m12 2 9 5-9 5-9-5zM3 7v10l9 5 9-5V7M12 12v10" /></>,
  percent: <><path d="m19 5-14 14" /><circle cx="7" cy="7" r="2" /><circle cx="17" cy="17" r="2" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  store: <><path d="M3 10h18l-2-6H5zM5 10v10h14V10M9 20v-6h6v6" /></>,
  truck: <><path d="M3 5h12v12H3zM15 9h4l3 4v4h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>,
  users: <><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3-7 7-7s7 3 7 7M17 11a3 3 0 1 0 0-6M17 14c3 0 5 2 5 5" /></>,
}

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

const navGroups = [
  { label: 'VẬN HÀNH', items: [
    ['Tổng quan', 'grid'], ['Quản lý thuốc', 'package'], ['Danh mục thuốc', 'clipboard'],
    ['Nhà cung cấp', 'truck'], ['Khách hàng', 'customers'], ['Nhân viên', 'users'],
  ]},
  { label: 'KINH DOANH', items: [
    ['Cửa hàng thuốc', 'store'], ['Giỏ hàng', 'cart'], ['Đơn hàng & Hóa đơn', 'invoice'],
    ['Bán hàng', 'cart'], ['Hóa đơn', 'invoice'], ['Quản lý kho', 'archive'],
    ['Nhập hàng', 'download'], ['Xuất hàng', 'box'], ['Kiểm kê kho', 'check'], ['Khuyến mãi', 'percent'],
  ]},
  { label: 'HỆ THỐNG', items: [
    ['Báo cáo – Thống kê', 'chart'], ['Quản lý tài khoản', 'shield'], ['Nhật ký hoạt động', 'activity'], ['Chatbot tư vấn thuốc', 'bot'],
    ['Chat bác sĩ', 'doctor'], ['Thông báo', 'bell'], ['Cài đặt hệ thống', 'settings'], ['Tài liệu bàn giao', 'file'],
  ]},
] as { label: string; items: [string, IconName][] }[]

const medicines = [
  { id: 'SP-240301', name: 'Panadol Extra 500mg', detail: 'Hộp 15 vỉ x 12 viên', stock: 286, unit: 'Hộp', expiry: '18/09/2026', price: '42.000 VNĐ', status: 'Còn hàng', kind: 'ok' },
  { id: 'SP-240176', name: 'Augmentin 625mg', detail: 'Hộp 2 vỉ x 7 viên', stock: 42, unit: 'Hộp', expiry: '22/01/2026', price: '176.000 VNĐ', status: 'Sắp hết', kind: 'warning' },
  { id: 'SP-240089', name: 'Vitamin C DHG 500mg', detail: 'Chai 100 viên nén', stock: 164, unit: 'Chai', expiry: '10/12/2026', price: '98.000 VNĐ', status: 'Còn hàng', kind: 'ok' },
  { id: 'SP-230942', name: 'Smecta 3g', detail: 'Hộp 30 gói', stock: 8, unit: 'Hộp', expiry: '06/08/2025', price: '112.000 VNĐ', status: 'Sắp hết hạn', kind: 'danger' },
  { id: 'SP-240318', name: 'Omeprazol 20mg', detail: 'Hộp 3 vỉ x 10 viên', stock: 96, unit: 'Hộp', expiry: '28/03/2027', price: '65.000 VNĐ', status: 'Còn hàng', kind: 'ok' },
]

export function Button({ children, variant = 'primary', icon, onClick, type = 'button' }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost'; icon?: IconName; onClick?: () => void; type?: 'button' | 'submit' }) {
  return <button type={type} className={`button button--${variant}`} onClick={onClick}>{icon && <Icon name={icon} size={18} />}<span>{children}</span></button>
}

export function Badge({ children, kind = 'ok' }: { children: ReactNode; kind?: string }) {
  return <span className={`badge badge--${kind}`}>{children}</span>
}

function Sidebar({ active, onSelect, mobileOpen, onClose, allowed }: { active: string; onSelect: (value: string) => void; mobileOpen: boolean; onClose: () => void; allowed: string[] }) {
  return <>
    {mobileOpen && <button className="sidebar-overlay" aria-label="Đóng menu" onClick={onClose} />}
    <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
      <div className="brand">
        <div className="brand__mark"><span className="brand__cross" /></div>
        <div><strong>PHARMASOFT</strong><small>Quản lý nhà thuốc</small></div>
        <button className="icon-button sidebar__close" onClick={onClose} aria-label="Đóng"><Icon name="close" /></button>
      </div>
      <nav className="sidebar__nav">
        {navGroups.map(group => ({...group,items:group.items.filter(([label])=>allowed.includes(label))})).filter(group=>group.items.length>0).map(group => <div className="nav-group" key={group.label}>
          <div className="nav-group__label">{group.label}</div>
          {group.items.map(([label, icon]) => <button key={label} className={`nav-item ${active === label ? 'nav-item--active' : ''}`} onClick={() => { onSelect(label); onClose() }}>
            <Icon name={icon} size={19} /><span>{label}</span>{active === label && <span className="nav-item__active-dot" />}
          </button>)}
        </div>)}
      </nav>
      <div className="sidebar__support">
        <div className="support-icon"><Icon name="help" /></div>
        <div><strong>Cần hỗ trợ?</strong><span>1900 1234</span></div>
        <Icon name="chevron" size={16} />
      </div>
    </aside>
  </>
}

function StatCard({ label, value, change, icon, tone }: { label: string; value: string; change: string; icon: IconName; tone: string }) {
  return <div className="card stat-card">
    <div className={`stat-card__icon stat-card__icon--${tone}`}><Icon name={icon} /></div>
    <div className="stat-card__content"><span>{label}</span><strong>{value}</strong><small><b>↑ {change}</b> so với hôm qua</small></div>
    <button className="icon-button subtle" aria-label={`Xem ${label}`}><Icon name="chevron" size={17} /></button>
  </div>
}

function AddMedicineDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [submitted, setSubmitted] = useState(false)
  if (!open) return null
  function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    const form = event.currentTarget as HTMLFormElement
    if (new FormData(form).get('name')) {
      onSuccess()
      setSubmitted(false)
    }
  }
  return <div className="dialog-layer" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="dialog__header"><div><div className="eyebrow">SẢN PHẨM MỚI</div><h2 id="dialog-title">Thêm thuốc vào danh mục</h2><p>Nhập thông tin cơ bản. Bạn có thể bổ sung lô thuốc sau.</p></div><button className="icon-button" onClick={onClose} aria-label="Đóng"><Icon name="close" /></button></div>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label className="field field--wide"><span>Tên thuốc <b>*</b></span><input name="name" placeholder="Ví dụ: Paracetamol 500mg" autoFocus />{submitted && <small className="field__error">Vui lòng nhập tên thuốc.</small>}</label>
          <label className="field"><span>Mã sản phẩm</span><input value="Tự động tạo" disabled /></label>
          <label className="field"><span>Danh mục</span><select defaultValue=""><option value="" disabled>Chọn danh mục</option><option>Thuốc giảm đau</option><option>Kháng sinh</option><option>Vitamin & khoáng chất</option></select></label>
          <label className="field"><span>Đơn vị tính</span><select defaultValue="Hộp"><option>Hộp</option><option>Chai</option><option>Vỉ</option><option>Viên</option></select></label>
          <label className="field"><span>Giá bán dự kiến</span><div className="field__suffix"><input inputMode="numeric" placeholder="0" /><span>VNĐ</span></div></label>
        </div>
        <div className="dialog__footer"><Button variant="secondary" onClick={onClose}>Hủy bỏ</Button><Button type="submit" icon="plus">Thêm thuốc</Button></div>
      </form>
    </section>
  </div>
}

function ManagementApp({ user, onLogout, prototypeMode = false, onRoleChange }: { user: SessionUser; onLogout: () => void; prototypeMode?: boolean; onRoleChange?: (user: SessionUser) => void }) {
  const [active, setActive] = useState(roleHome[user.role])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [passwordDialog,setPasswordDialog]=useState(false)
  const [passwordError,setPasswordError]=useState('')
  const [toast, setToast] = useState(false)
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState('7 ngày qua')
  const [unreadCount, setUnreadCount] = useState(5)
  const filteredMedicines = useMemo(() => medicines.filter(item => item.name.toLowerCase().includes(query.toLowerCase()) || item.id.toLowerCase().includes(query.toLowerCase())), [query])

  function success() {
    setDialogOpen(false)
    setToast(true)
    window.setTimeout(() => setToast(false), 3500)
  }
  function navigate(route: string) {
    if (route === 'Hồ sơ cá nhân' || roleMenus[user.role].includes(route)) setActive(route)
  }
  function changeDemoPassword(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setPasswordError('')
    const data=new FormData(event.currentTarget),current=String(data.get('current')||''),password=String(data.get('password')||''),confirmation=String(data.get('confirmation')||'')
    if(password.length<8)return setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự.')
    if(password!==confirmation)return setPasswordError('Mật khẩu xác nhận không khớp.')
    try{
      const key='pharmasoft-demo-users-v3',accounts=JSON.parse(localStorage.getItem(key)||'[]') as Array<{id:string;password:string}>
      const account=accounts.find(item=>item.id===user.id)
      if(!account||account.password!==current)return setPasswordError('Mật khẩu hiện tại không chính xác.')
      localStorage.setItem(key,JSON.stringify(accounts.map(item=>item.id===user.id?{...item,password}:item)))
      setPasswordDialog(false);setToast(true);window.setTimeout(()=>setToast(false),3000)
    }catch{setPasswordError('Không thể cập nhật dữ liệu demo lúc này.')}
  }

  return <div className="app-shell">
    <Sidebar active={active} onSelect={navigate} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} allowed={roleMenus[user.role]} />
    <main className="main">
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Mở menu"><Icon name="menu" /></button>
        <div className="global-search"><Icon name="search" size={19} /><input aria-label="Tìm kiếm toàn hệ thống" placeholder="Tìm thuốc, hóa đơn, khách hàng..." /><kbd>⌘ K</kbd></div>
        <div className="topbar__actions">
          <div className="popover-wrap">
            <button className="icon-button notification-button" onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false) }} aria-label="Thông báo"><Icon name="bell" />{unreadCount > 0 && <span>{unreadCount}</span>}</button>
            {notificationsOpen && <div className="popover notification-popover">
              <div className="popover__title"><strong>Thông báo mới</strong><button onClick={() => setUnreadCount(0)}>Đánh dấu đã đọc</button></div>
              <div className="notification-item"><i className="dot dot--amber" /><div><strong>12 sản phẩm sắp hết hàng</strong><span>Kiểm tra và tạo phiếu nhập hàng</span><small>10 phút trước</small></div></div>
              <div className="notification-item"><i className="dot dot--red" /><div><strong>Lô thuốc SM2406 sắp hết hạn</strong><span>Hạn dùng còn dưới 60 ngày</span><small>1 giờ trước</small></div></div>
              <button className="popover__footer" onClick={() => { navigate('Thông báo'); setNotificationsOpen(false) }}>Xem tất cả thông báo <Icon name="chevron" size={15} /></button>
            </div>}
          </div>
          <span className="topbar__divider" />
          <div className="popover-wrap">
            <button className="profile" onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false) }}>
              <span className="avatar">{user.initials}</span><span className="profile__info"><strong>{user.name}</strong><small>{user.roleLabel}</small></span><Icon name="chevron" size={15} />
            </button>
            {profileOpen && <div className={`popover profile-popover ${prototypeMode?'profile-popover--demo':''}`}>
              {prototypeMode&&<><div className="demo-role-menu-heading"><span>DEMO</span><div><strong>Chuyển đổi vai trò</strong><small>Kiểm thử giao diện không cần đăng nhập lại</small></div></div><div className="demo-role-menu">{demoUsers.map(item=><button key={item.role} className={item.role===user.role?'active':''} onClick={()=>{onRoleChange?.(item);setProfileOpen(false)}}><span><Icon name={item.role==='admin'?'shield':item.role==='manager'?'store':item.role==='pharmacist'?'doctor':item.role==='cashier'?'cart':item.role==='warehouse'?'archive':item.role==='doctor'?'doctor':'customers'} size={15}/></span><div><strong>{item.roleLabel}</strong><small>{item.username}</small></div>{item.role===user.role?<Icon name="check" size={14}/>:<Icon name="chevron" size={13}/>}</button>)}</div><div className="demo-role-warning"><Icon name="help" size={13}/><span>Production phải xác thực quyền từ backend.</span></div><hr/></>}
              <button onClick={() => {navigate('Hồ sơ cá nhân');setProfileOpen(false)}}><Icon name="users" />Hồ sơ cá nhân</button>{prototypeMode&&<button onClick={()=>{setPasswordDialog(true);setProfileOpen(false)}}><Icon name="shield"/>Đổi mật khẩu</button>}{roleMenus[user.role].includes('Quản lý tài khoản')&&<button onClick={() => {navigate('Quản lý tài khoản');setProfileOpen(false)}}><Icon name="settings" />Thiết lập tài khoản</button>}<hr /><button className="danger-text" onClick={onLogout}><Icon name="logout" />Đăng xuất</button>
            </div>}
          </div>
        </div>
      </header>

      <div className="page">
        {prototypeMode && <div className="prototype-toolbar"><div><span><Icon name="activity" size={14}/></span><strong>PHARMASOFT DEMO</strong><small>Dữ liệu mẫu • Đổi đủ 7 vai trò trong menu tài khoản ở góc phải</small></div><Badge kind="warning">DESIGN PROTOTYPE</Badge></div>}
        <div className="breadcrumb"><span>PHARMASOFT</span><Icon name="chevron" size={13} /><strong>{active}</strong></div>
        <div className="page-heading">
          <div><h1>{active === 'Tổng quan' ? (user.role==='admin'||user.role==='manager'?'Tổng quan nhà thuốc':`Tổng quan ${user.roleLabel.toLowerCase()}`) : active}</h1><p>{active === 'Quản lý tài khoản' ? 'Quản lý người dùng, vai trò và quyền truy cập hệ thống.' : active==='Hồ sơ cá nhân'?'Thông tin tài khoản và phạm vi quyền truy cập của bạn.':'Theo dõi hoạt động kinh doanh và vận hành trong ngày hôm nay.'}</p></div>
          {!['Quản lý tài khoản', 'Quản lý thuốc', 'Danh mục thuốc', 'Nhà cung cấp', 'Khách hàng', 'Nhân viên', 'Cửa hàng thuốc', 'Giỏ hàng', 'Đơn hàng & Hóa đơn', 'Bán hàng', 'Quản lý kho', 'Nhập hàng', 'Xuất hàng', 'Kiểm kê kho', 'Hóa đơn', 'Khuyến mãi', 'Báo cáo – Thống kê', 'Chatbot tư vấn thuốc', 'Chat bác sĩ', 'Thông báo', 'Cài đặt hệ thống', 'Tài liệu bàn giao', 'Hồ sơ cá nhân', 'Nhật ký hoạt động'].includes(active) && (active !== 'Tổng quan' || user.role === 'admin' || user.role === 'manager') && <div className="page-heading__actions"><Button variant="secondary" icon="download" onClick={() => navigate('Báo cáo – Thống kê')}>Xuất báo cáo</Button>{active === 'Tổng quan' ? <Button icon="chart" onClick={() => navigate('Báo cáo – Thống kê')}>Tạo báo cáo</Button> : <Button icon="plus" onClick={() => setDialogOpen(true)}>Thêm thuốc mới</Button>}</div>}
        </div>

        {active==='Hồ sơ cá nhân'?<UserProfile user={user} prototypeMode={prototypeMode}/>:active === 'Quản lý tài khoản' ? <AccountManagement prototypeMode={prototypeMode} /> : ['Cửa hàng thuốc','Giỏ hàng','Đơn hàng & Hóa đơn'].includes(active)?<CustomerStore key={active} user={user} initialView={active==='Giỏ hàng'?'cart':active==='Đơn hàng & Hóa đơn'?'orders':'store'}/>:active === 'Tổng quan' ? (user.role==='admin'||user.role==='manager'?<Dashboard onNavigate={navigate}/>:<RoleDashboard user={user} onNavigate={navigate}/>) : ['Quản lý thuốc', 'Danh mục thuốc'].includes(active) ? <MedicineManagement key={active} initialTab={active === 'Danh mục thuốc' ? 'categories' : 'medicines'} /> : ['Nhà cung cấp', 'Khách hàng', 'Nhân viên'].includes(active) ? <BusinessPartners key={active} mode={active === 'Nhà cung cấp' ? 'supplier' : active === 'Khách hàng' ? 'customer' : 'employee'} /> : active === 'Bán hàng' ? <SalesPOS /> : ['Quản lý kho', 'Nhập hàng', 'Xuất hàng', 'Kiểm kê kho'].includes(active) ? <InventoryManagement key={active} initialTab={active === 'Nhập hàng' ? 'receipts' : active === 'Xuất hàng' ? 'issues' : active === 'Kiểm kê kho' ? 'stocktakes' : 'overview'} /> : ['Hóa đơn', 'Khuyến mãi'].includes(active) ? <BillingManagement key={active} initialTab={active === 'Khuyến mãi' ? 'promotions' : 'invoices'} /> : active === 'Nhật ký hoạt động' ? <AuditLog /> : active === 'Báo cáo – Thống kê' ? <ReportsAnalytics /> : active === 'Chatbot tư vấn thuốc' ? <MedicineChatbot onNavigate={navigate} /> : active === 'Chat bác sĩ' ? <DoctorChat defaultPortal={user.role==='doctor'?'doctor':'customer'} demoDoctorAuthenticated={prototypeMode&&user.role==='doctor'} /> : active === 'Thông báo' ? <NotificationCenter onUnreadChange={setUnreadCount} onNavigate={navigate} /> : active === 'Cài đặt hệ thống' ? <SystemSettings /> : active === 'Tài liệu bàn giao' ? <DeveloperHandoff onNavigate={navigate} /> : <>
        <section className="stats-grid" aria-label="Chỉ số chính">
          <StatCard label="Doanh thu hôm nay" value="28.450.000 VNĐ" change="12,5%" icon="activity" tone="green" />
          <StatCard label="Đơn hàng" value="186" change="8,2%" icon="invoice" tone="blue" />
          <StatCard label="Khách hàng" value="142" change="5,4%" icon="customers" tone="purple" />
          <StatCard label="Sản phẩm sắp hết" value="12" change="3 sản phẩm" icon="archive" tone="amber" />
        </section>

        <section className="dashboard-grid">
          <div className="card revenue-card">
            <div className="card__header"><div><h2>Doanh thu bán hàng</h2><p>Cập nhật đến 14:30, 24/06/2025</p></div><select aria-label="Khoảng thời gian" value={period} onChange={event => setPeriod(event.target.value)}><option>7 ngày qua</option><option>30 ngày qua</option><option>Quý này</option></select></div>
            <div className="chart-summary"><div><span>Tổng doanh thu</span><strong>164.820.000 VNĐ</strong></div><Badge kind="ok">↑ 14,2%</Badge></div>
            <div className="line-chart">
              <div className="chart-y"><span>30tr</span><span>20tr</span><span>10tr</span><span>0</span></div>
              <div className="chart-area">
                <div className="grid-line line-1" /><div className="grid-line line-2" /><div className="grid-line line-3" /><div className="grid-line line-4" />
                <svg viewBox="0 0 700 190" preserveAspectRatio="none" aria-label={`Biểu đồ doanh thu ${period}`}>
                  <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16834A" stopOpacity=".24" /><stop offset="100%" stopColor="#16834A" stopOpacity=".01" /></linearGradient></defs>
                  <path className="area" d="M0 155 C45 148 55 115 105 122 S170 142 210 105 S275 70 315 92 S390 140 420 104 S485 35 525 68 S590 110 630 58 S680 38 700 20 L700 190 L0 190Z" />
                  <path className="line" d="M0 155 C45 148 55 115 105 122 S170 142 210 105 S275 70 315 92 S390 140 420 104 S485 35 525 68 S590 110 630 58 S680 38 700 20" />
                  {[['0','155'],['105','122'],['210','105'],['315','92'],['420','104'],['525','68'],['630','58'],['700','20']].map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r="4" />)}
                </svg>
                <div className="chart-x"><span>18/06</span><span>19/06</span><span>20/06</span><span>21/06</span><span>22/06</span><span>23/06</span><span>24/06</span></div>
              </div>
            </div>
          </div>

          <div className="card activity-card">
            <div className="card__header"><div><h2>Hoạt động gần đây</h2><p>Giao dịch mới nhất</p></div><button className="text-button">Xem tất cả</button></div>
            <div className="activity-list">
              <div className="activity-item"><div className="activity-icon green"><Icon name="cart" /></div><div><strong>Đơn hàng #HD240625-0186</strong><span>Nguyễn Văn Minh • 486.000 VNĐ</span><small>5 phút trước</small></div></div>
              <div className="activity-item"><div className="activity-icon blue"><Icon name="download" /></div><div><strong>Nhập kho thành công</strong><span>Phiếu nhập #PN-240624-08</span><small>28 phút trước</small></div></div>
              <div className="activity-item"><div className="activity-icon amber"><Icon name="archive" /></div><div><strong>Cảnh báo tồn kho thấp</strong><span>Augmentin 625mg còn 42 hộp</span><small>1 giờ trước</small></div></div>
              <div className="activity-item"><div className="activity-icon purple"><Icon name="users" /></div><div><strong>Khách hàng mới</strong><span>Trần Mai Anh đã được thêm</span><small>2 giờ trước</small></div></div>
            </div>
          </div>
        </section>

        <section className="card inventory-card">
          <div className="card__header inventory-header">
            <div><h2>Tình trạng kho thuốc</h2><p>Danh sách sản phẩm cần theo dõi</p></div>
            <div className="table-tools"><div className="table-search"><Icon name="search" size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên hoặc mã thuốc" /></div><button className="filter-button"><Icon name="settings" size={17} /> Bộ lọc <span>2</span></button></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>SẢN PHẨM</th><th>MÃ SẢN PHẨM</th><th>TỒN KHO</th><th>HẠN SỬ DỤNG</th><th>GIÁ BÁN</th><th>TRẠNG THÁI</th><th /></tr></thead>
              <tbody>
                {filteredMedicines.map(item => <tr key={item.id}>
                  <td><div className="medicine-cell"><div className="medicine-thumb"><Icon name="package" /></div><div><strong>{item.name}</strong><span>{item.detail}</span></div></div></td>
                  <td><span className="code">{item.id}</span></td><td><strong>{item.stock}</strong> <span className="muted">{item.unit}</span></td><td>{item.expiry}</td><td><strong>{item.price}</strong></td><td><Badge kind={item.kind}>{item.status}</Badge></td><td><button className="row-menu" aria-label={`Thao tác ${item.name}`}>•••</button></td>
                </tr>)}
              </tbody>
            </table>
            {filteredMedicines.length === 0 && <div className="empty-state"><div><Icon name="search" /></div><strong>Không tìm thấy thuốc</strong><span>Thử tìm bằng tên hoặc mã sản phẩm khác.</span><Button variant="secondary" onClick={() => setQuery('')}>Xóa tìm kiếm</Button></div>}
          </div>
          <div className="pagination"><span>Hiển thị <strong>{filteredMedicines.length}</strong> trong tổng số <strong>1.248</strong> sản phẩm</span><div><button disabled>‹</button><button className="active">1</button><button>2</button><button>3</button><span>…</span><button>250</button><button>›</button></div></div>
        </section>
        </>}
        <footer>© 2025 PHARMASOFT • Phiên bản 1.0.0 <span><Icon name="shield" size={14} /> Dữ liệu được bảo mật</span></footer>
      </div>
    </main>
    <AddMedicineDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSuccess={success} />
    {passwordDialog&&<div className="dialog-layer"><section className="dialog account-password-dialog"><div className="dialog__header"><div><div className="eyebrow">BẢO MẬT TÀI KHOẢN DEMO</div><h2>Đổi mật khẩu</h2><p>Mật khẩu mới chỉ được lưu cục bộ trong trình duyệt.</p></div><button className="icon-button" onClick={()=>setPasswordDialog(false)}><Icon name="close"/></button></div>{passwordError&&<div className="auth-alert"><Icon name="help"/><div><strong>Không thể cập nhật</strong><span>{passwordError}</span></div></div>}<form onSubmit={changeDemoPassword}><div className="form-grid"><label className="field field--wide"><span>Mật khẩu hiện tại</span><input name="current" type="password" required/></label><label className="field"><span>Mật khẩu mới</span><input name="password" type="password" minLength={8} required/></label><label className="field"><span>Xác nhận mật khẩu</span><input name="confirmation" type="password" minLength={8} required/></label></div><div className="dialog__footer"><Button variant="secondary" onClick={()=>setPasswordDialog(false)}>Hủy bỏ</Button><Button type="submit">Lưu mật khẩu mới</Button></div></form></section></div>}
    {toast && <div className="toast" role="status"><span><Icon name="check" /></span><div><strong>Thêm thuốc thành công</strong><small>Sản phẩm mới đã được lưu vào danh mục.</small></div><button onClick={() => setToast(false)} aria-label="Đóng"><Icon name="close" size={17} /></button></div>}
  </div>
}

export default function App() {
  const supabaseConfigured=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const [session, setSession] = useState<SessionUser | null>(null)
  useEffect(() => { setActor(session?.name) }, [session])
  const [checkingSession, setCheckingSession] = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(false)
  useEffect(() => {
    if(!supabaseConfigured){
      try{
        const stored=localStorage.getItem(DEMO_SESSION_KEY)
        if(stored)setSession(JSON.parse(stored))
      }catch{localStorage.removeItem(DEMO_SESSION_KEY)}
      setCheckingSession(false);return
    }
    const supabase = getSupabaseBrowserClient()
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
        setSession(null)
        setCheckingSession(false)
      }
      if (event === 'SIGNED_OUT') setSession(null)
    })
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user && !window.location.hash.includes('type=recovery')) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle()
        if (profile?.status === 'active') {
          setSession({
            id: profile.id, username: profile.username, name: profile.full_name,
            initials: profile.full_name.split(' ').slice(-2).map((part: string) => part[0]).join(''),
            role: profile.role, roleLabel: profile.role_label || profile.role,
            email: profile.email, phone: profile.phone || '', description: profile.description || 'Tài khoản PHARMASOFT',
          })
        } else if (profile) {
          await supabase.auth.signOut()
        }
      }
      setCheckingSession(false)
    })
    return () => listener.subscription.unsubscribe()
  }, [supabaseConfigured])
  function safeDemoUser(user:SessionUser):SessionUser{return{id:user.id,username:user.username,name:user.name,initials:user.initials,role:user.role,roleLabel:user.roleLabel,email:user.email,phone:user.phone,description:user.description,createdAt:user.createdAt,status:user.status}}
  function authenticateDemo(user:SessionUser,remember:boolean){
    const safeUser=safeDemoUser(user)
    setSession(safeUser)
    if(remember){localStorage.setItem(DEMO_SESSION_KEY,JSON.stringify(safeUser));localStorage.setItem(DEMO_REMEMBERED_KEY,user.username)}
    else{localStorage.removeItem(DEMO_SESSION_KEY);localStorage.removeItem(DEMO_REMEMBERED_KEY)}
  }
  function switchDemoRole(user:SessionUser){const safeUser=safeDemoUser(user);setSession(safeUser);if(localStorage.getItem(DEMO_SESSION_KEY))localStorage.setItem(DEMO_SESSION_KEY,JSON.stringify(safeUser))}
  function logout(){if(supabaseConfigured)void getSupabaseBrowserClient().auth.signOut();else localStorage.removeItem(DEMO_SESSION_KEY);setSession(null)}
  if (checkingSession) return <div className="auth-shell"><section className="auth-panel"><div className="auth-step-icon"><span className="spinner" /></div><div className="auth-heading centered"><h2>Đang kiểm tra phiên đăng nhập</h2><p>PHARMASOFT đang chuẩn bị không gian làm việc của bạn.</p></div></section></div>
  if(!supabaseConfigured&&!session)return <DemoAuthModule onAuthenticated={authenticateDemo}/>
  return session
    ? <DemoCommerceProvider><ManagementApp key={session.role} user={session} prototypeMode={!supabaseConfigured} onRoleChange={supabaseConfigured?undefined:switchDemoRole} onLogout={logout} /></DemoCommerceProvider>
    : <AuthModule recoveryMode={recoveryMode} onRecoveryComplete={() => setRecoveryMode(false)} onAuthenticated={setSession} />
}
