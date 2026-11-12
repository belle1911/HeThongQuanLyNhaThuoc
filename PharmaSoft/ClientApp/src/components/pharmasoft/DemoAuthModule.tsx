'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Icon } from './App'
import { DemoAccount, demoUsers, SessionUser } from './roles'

type DemoUser = DemoAccount & { status: 'active' | 'locked' }
type View = 'login' | 'register' | 'signupOtp' | 'forgot' | 'recoveryOtp' | 'reset' | 'success'
type PendingRegistration = { name:string;email:string;phone:string;username:string;password:string }

export const DEMO_USERS_KEY='pharmasoft-demo-users-v3'
export const DEMO_SESSION_KEY='pharmasoft-demo-session'
export const DEMO_REMEMBERED_KEY='pharmasoft-demo-remembered-user'

function seededUsers():DemoUser[]{return demoUsers.map(user=>({...user,status:'active'}))}
export function readDemoUsers():DemoUser[]{
  if(typeof window==='undefined')return seededUsers()
  try{
    const stored=JSON.parse(localStorage.getItem(DEMO_USERS_KEY)||'[]') as DemoUser[]
    if(stored.length)return stored
  }catch{}
  const users=seededUsers();localStorage.setItem(DEMO_USERS_KEY,JSON.stringify(users));return users
}
function saveDemoUsers(users:DemoUser[]){localStorage.setItem(DEMO_USERS_KEY,JSON.stringify(users))}
function generateOtp(){return String(Math.floor(100000+Math.random()*900000))}
function initials(name:string){return name.split(' ').filter(Boolean).slice(-2).map(part=>part[0]).join('').toUpperCase()}

export function DemoAuthModule({onAuthenticated}:{onAuthenticated:(user:SessionUser,remember:boolean)=>void}){
  const [view,setView]=useState<View>('login')
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [showPassword,setShowPassword]=useState(false)
  const [loading,setLoading]=useState(false)
  const [otp,setOtp]=useState('')
  const [demoOtp,setDemoOtp]=useState('')
  const [otpExpires,setOtpExpires]=useState(0)
  const [seconds,setSeconds]=useState(0)
  const [attempts,setAttempts]=useState(5)
  const [pending,setPending]=useState<PendingRegistration|null>(null)
  const [recoveryId,setRecoveryId]=useState('')
  const [loginIdentifier,setLoginIdentifier]=useState(()=>typeof window==='undefined'?'':localStorage.getItem(DEMO_REMEMBERED_KEY)||'')
  const [loginPassword,setLoginPassword]=useState('')
  const [selectedDemoAccount,setSelectedDemoAccount]=useState('')
  const [sampleUsers]=useState(()=>readDemoUsers().filter(user=>demoUsers.some(sample=>sample.id===user.id)))

  useEffect(()=>{
    if(!otpExpires)return
    const tick=()=>setSeconds(Math.max(0,Math.ceil((otpExpires-Date.now())/1000)))
    tick();const timer=window.setInterval(tick,1000);return()=>window.clearInterval(timer)
  },[otpExpires])

  function go(next:View){setError('');setNotice('');setOtp('');setView(next)}
  function issueOtp(message:string){const code=generateOtp();setDemoOtp(code);setOtp('');setAttempts(5);setOtpExpires(Date.now()+120000);setNotice(message)}

  function login(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('')
    const data=new FormData(event.currentTarget),identifier=String(data.get('identifier')||'').trim().toLowerCase(),password=String(data.get('password')||''),remember=data.get('remember')==='on'
    if(!identifier||!password)return setError('Vui lòng nhập đầy đủ email hoặc username và mật khẩu.')
    if(identifier.includes('@')&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier))return setError('Email đăng nhập không đúng định dạng.')
    const user=readDemoUsers().find(item=>item.username.toLowerCase()===identifier||item.email.toLowerCase()===identifier)
    if(!user)return setError('Tài khoản không tồn tại. Hãy kiểm tra lại hoặc đăng ký tài khoản mới.')
    if(user.status==='locked')return setError('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.')
    if(user.password!==password)return setError('Mật khẩu không chính xác.')
    setLoading(true);window.setTimeout(()=>onAuthenticated(user,remember),450)
  }

  function register(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('')
    const data=new FormData(event.currentTarget)
    const registration={name:String(data.get('name')||'').trim(),email:String(data.get('email')||'').trim().toLowerCase(),phone:String(data.get('phone')||'').trim(),username:String(data.get('username')||'').trim(),password:String(data.get('password')||'')}
    const confirmation=String(data.get('confirmation')||'')
    if(!registration.name||!registration.email||!registration.phone||!registration.username||!registration.password)return setError('Vui lòng nhập đầy đủ các trường bắt buộc.')
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registration.email))return setError('Email không đúng định dạng.')
    if(!/^(0|\+84)[0-9\s]{8,12}$/.test(registration.phone))return setError('Số điện thoại không đúng định dạng Việt Nam.')
    if(!/^[a-zA-Z0-9._-]{4,30}$/.test(registration.username))return setError('Username cần 4–30 ký tự, chỉ gồm chữ, số, dấu chấm hoặc gạch ngang.')
    if(registration.password.length<8)return setError('Mật khẩu phải có ít nhất 8 ký tự.')
    if(registration.password!==confirmation)return setError('Mật khẩu xác nhận không khớp.')
    if(data.get('terms')!=='on')return setError('Bạn cần đồng ý với điều khoản sử dụng.')
    const users=readDemoUsers()
    if(users.some(user=>user.email.toLowerCase()===registration.email))return setError('Email này đã được sử dụng.')
    if(users.some(user=>user.username.toLowerCase()===registration.username.toLowerCase()))return setError('Username này đã tồn tại.')
    setPending(registration);issueOtp('Mã OTP đăng ký đã được tạo.');setView('signupOtp')
  }

  function beginRecovery(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('')
    const identifier=String(new FormData(event.currentTarget).get('identifier')||'').trim().toLowerCase()
    if(!identifier)return setError('Vui lòng nhập email hoặc username.')
    const user=readDemoUsers().find(item=>item.username.toLowerCase()===identifier||item.email.toLowerCase()===identifier)
    if(!user)return setError('Không tìm thấy tài khoản phù hợp.')
    if(user.status==='locked')return setError('Tài khoản đang bị khóa. Không thể đặt lại mật khẩu.')
    setRecoveryId(user.id);issueOtp('Mã OTP khôi phục đã được tạo.');setView('recoveryOtp')
  }

  function verifyOtp(purpose:'signup'|'recovery'){
    setError('')
    if(attempts<=0)return setError('Bạn đã nhập sai quá 5 lần. Hãy gửi lại mã OTP mới.')
    if(!/^\d{6}$/.test(otp))return setError('Vui lòng nhập mã OTP gồm đúng 6 chữ số.')
    if(seconds<=0)return setError('Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.')
    if(otp!==demoOtp){const remaining=attempts-1;setAttempts(remaining);if(remaining<=0)setOtpExpires(0);return setError(remaining>0?`Mã OTP không chính xác. Bạn còn ${remaining} lần thử.`:'Bạn đã nhập sai quá 5 lần. Hãy gửi lại mã OTP mới.')}
    if(purpose==='signup'&&pending){
      const user:DemoUser={id:`KH${Date.now().toString().slice(-6)}`,username:pending.username,password:pending.password,name:pending.name,initials:initials(pending.name),role:'customer',roleLabel:'Khách hàng',email:pending.email,phone:pending.phone,description:'Tài khoản khách hàng PHARMASOFT',createdAt:new Date().toLocaleDateString('vi-VN'),status:'active'}
      saveDemoUsers([...readDemoUsers(),user]);setNotice('Đăng ký và xác minh tài khoản thành công. Bạn có thể đăng nhập ngay.');setView('success')
    }else setView('reset')
  }

  function resetPassword(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('')
    const data=new FormData(event.currentTarget),password=String(data.get('password')||''),confirmation=String(data.get('confirmation')||'')
    if(password.length<8)return setError('Mật khẩu mới phải có ít nhất 8 ký tự.')
    if(password!==confirmation)return setError('Mật khẩu xác nhận không khớp.')
    saveDemoUsers(readDemoUsers().map(user=>user.id===recoveryId?{...user,password}:user))
    setNotice('Mật khẩu demo đã được cập nhật thành công.');setView('success')
  }

  function resend(purpose:'signup'|'recovery'){issueOtp(purpose==='signup'?'Mã OTP đăng ký mới đã được tạo.':'Mã OTP khôi phục mới đã được tạo.')}

  return <div className="demo-auth-shell">
    <section className="demo-auth-visual">
      <div className="auth-brand"><div className="brand__mark"/><div><strong>PHARMASOFT</strong><span>Quản lý nhà thuốc thông minh</span></div></div>
      <div className="demo-auth-visual__content"><span><Icon name="shield" size={16}/> PHARMACY OPERATIONS PLATFORM</span><strong>Vận hành nhà thuốc<br/>chính xác mỗi ngày.</strong><p>Một không gian thống nhất cho bán hàng, tồn kho, dược sĩ và chăm sóc khách hàng.</p><div><div><Icon name="activity"/><span><strong>20+ phân hệ</strong><small>Đầy đủ quy trình vận hành</small></span></div><div><Icon name="users"/><span><strong>7 vai trò</strong><small>Trải nghiệm theo đúng nhiệm vụ</small></span></div></div></div>
      <div className="demo-auth-disclaimer"><Icon name="help"/><span><strong>Chế độ DEMO</strong> Dữ liệu được lưu cục bộ trong trình duyệt, chưa kết nối backend.</span></div>
    </section>
    <section className="demo-auth-panel"><div className={`demo-auth-card ${view==='register'?'wide':''}`}>
      <div className="demo-auth-mobile-brand"><div className="brand__mark"/><strong>PHARMASOFT</strong><span>DEMO</span></div>
      {view==='login'&&<><AuthHeading eyebrow="ĐĂNG NHẬP HỆ THỐNG" title="Chào mừng trở lại" text="Đăng nhập để tiếp tục vào không gian làm việc của bạn."/><ErrorMessage text={error}/><form className="auth-form" onSubmit={login}><AuthField label="Email hoặc tên đăng nhập" icon="users" name="identifier" autoComplete="username" value={loginIdentifier} onChange={value=>{setLoginIdentifier(value);setSelectedDemoAccount('')}}/><label className="field"><span>Mật khẩu</span><div className="auth-input"><Icon name="shield"/><input name="password" type={showPassword?'text':'password'} autoComplete="current-password" value={loginPassword} onChange={event=>{setLoginPassword(event.target.value);setSelectedDemoAccount('')}}/><button type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword?'Ẩn':'Hiện'}</button></div></label><div className="auth-options"><label className="check-field"><input name="remember" type="checkbox" defaultChecked={Boolean(loginIdentifier)}/><span>Ghi nhớ đăng nhập</span></label><button type="button" onClick={()=>go('forgot')}>Quên mật khẩu?</button></div><button className="auth-submit" disabled={loading}>{loading?<><span className="spinner"/>Đang đăng nhập...</>:<>Đăng nhập <Icon name="chevron"/></>}</button></form><div className="auth-register-link">Chưa có tài khoản? <button onClick={()=>go('register')}>Đăng ký tài khoản</button></div><DemoAccounts accounts={sampleUsers} selectedId={selectedDemoAccount} onSelect={account=>{setLoginIdentifier(account.username);setLoginPassword(account.password);setSelectedDemoAccount(account.id);setError('')}}/></>}
      {view==='register'&&<><BackButton onClick={()=>go('login')} text="Quay lại đăng nhập"/><AuthHeading eyebrow="ĐĂNG KÝ KHÁCH HÀNG" title="Tạo tài khoản mới" text="Tài khoản đăng ký công khai được gán vai trò Khách hàng."/><ErrorMessage text={error}/><form className="auth-form" onSubmit={register}><div className="demo-register-grid"><AuthField label="Họ và tên *" icon="users" name="name"/><AuthField label="Email *" icon="file" name="email" type="email"/><AuthField label="Số điện thoại *" icon="customers" name="phone"/><AuthField label="Username *" icon="shield" name="username" autoComplete="username"/><AuthField label="Mật khẩu *" icon="shield" name="password" type="password" autoComplete="new-password"/><AuthField label="Xác nhận mật khẩu *" icon="check" name="confirmation" type="password" autoComplete="new-password"/></div><label className="check-field demo-terms"><input name="terms" type="checkbox"/><span>Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật.</span></label><button className="auth-submit">Đăng ký & nhận mã OTP</button></form></>}
      {view==='signupOtp'&&<OtpScreen email={pending?.email||''} code={demoOtp} seconds={seconds} attempts={attempts} otp={otp} setOtp={setOtp} error={error} notice={notice} onBack={()=>go('register')} onVerify={()=>verifyOtp('signup')} onResend={()=>resend('signup')}/>}
      {view==='forgot'&&<><BackButton onClick={()=>go('login')} text="Quay lại đăng nhập"/><div className="auth-step-icon"><Icon name="help"/></div><AuthHeading eyebrow="KHÔI PHỤC TÀI KHOẢN" title="Quên mật khẩu?" text="Nhập email hoặc username để nhận OTP giả lập." centered/><ErrorMessage text={error}/><form className="auth-form" onSubmit={beginRecovery}><AuthField label="Email hoặc username" icon="users" name="identifier"/><button className="auth-submit">Gửi mã OTP</button></form></>}
      {view==='recoveryOtp'&&<OtpScreen code={demoOtp} seconds={seconds} attempts={attempts} otp={otp} setOtp={setOtp} error={error} notice={notice} onBack={()=>go('forgot')} onVerify={()=>verifyOtp('recovery')} onResend={()=>resend('recovery')}/>}
      {view==='reset'&&<><div className="auth-step-icon"><Icon name="shield"/></div><AuthHeading eyebrow="MẬT KHẨU MỚI" title="Đặt lại mật khẩu" text="Tạo mật khẩu mới cho tài khoản demo của bạn." centered/><ErrorMessage text={error}/><form className="auth-form" onSubmit={resetPassword}><AuthField label="Mật khẩu mới" icon="shield" name="password" type="password" autoComplete="new-password"/><AuthField label="Xác nhận mật khẩu" icon="check" name="confirmation" type="password" autoComplete="new-password"/><button className="auth-submit">Lưu mật khẩu mới</button></form></>}
      {view==='success'&&<div className="auth-success"><span><Icon name="check" size={30}/></span><strong>Hoàn tất</strong><p>{notice}</p><button className="auth-submit" onClick={()=>go('login')}>Trở về đăng nhập</button></div>}
    </div><div className="auth-footer">© 2025 PHARMASOFT <span>•</span> Design prototype <span>•</span> Dữ liệu cục bộ</div></section>
  </div>
}

function AuthHeading({eyebrow,title,text,centered=false}:{eyebrow:string;title:string;text:string;centered?:boolean}){return <div className={`auth-heading ${centered?'centered':''}`}><span>{eyebrow}</span><strong className="demo-auth-title">{title}</strong><p>{text}</p></div>}
function ErrorMessage({text}:{text:string}){return text?<div className="auth-alert" role="alert"><Icon name="help"/><div><strong>Không thể hoàn tất</strong><span>{text}</span></div></div>:null}
function BackButton({onClick,text}:{onClick:()=>void;text:string}){return <button className="auth-back" onClick={onClick}>‹ {text}</button>}
function AuthField({label,icon,name,type='text',autoComplete,defaultValue,value,onChange}:{label:string;icon:'users'|'file'|'customers'|'shield'|'check';name:string;type?:string;autoComplete?:string;defaultValue?:string;value?:string;onChange?:(value:string)=>void}){return <label className="field"><span>{label}</span><div className="auth-input"><Icon name={icon}/><input name={name} type={type} autoComplete={autoComplete} value={value} defaultValue={value===undefined?defaultValue:undefined} onChange={onChange?event=>onChange(event.target.value):undefined}/></div></label>}
function OtpScreen({email,code,seconds,attempts,otp,setOtp,error,notice,onBack,onVerify,onResend}:{email?:string;code:string;seconds:number;attempts:number;otp:string;setOtp:(value:string)=>void;error:string;notice:string;onBack:()=>void;onVerify:()=>void;onResend:()=>void}){return <><BackButton onClick={onBack} text="Quay lại"/><div className="auth-step-icon"><Icon name="shield"/></div><AuthHeading eyebrow="XÁC MINH OTP DEMO" title="Nhập mã xác minh" text={email?`Mã được tạo cho ${email}.`:'Nhập mã để tiếp tục đặt lại mật khẩu.'} centered/><div className="demo-otp-code"><span>OTP GIẢ LẬP — KHÔNG GỬI EMAIL THẬT</span><strong>{code}</strong><small>Mã hết hạn sau {seconds}s • Còn {attempts}/5 lần thử</small></div>{notice&&<div className="auth-success-note"><Icon name="check"/>{notice}</div>}<ErrorMessage text={error}/><div className="auth-form"><label className="field"><span>Mã OTP gồm 6 chữ số</span><input className="demo-otp-input" value={otp} onChange={event=>setOtp(event.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" maxLength={6}/></label><button className="auth-submit" onClick={onVerify}>Xác minh mã OTP</button><div className="resend">Không nhận được mã? <button disabled={seconds>0&&attempts>0} onClick={onResend}>{seconds>0&&attempts>0?`Gửi lại sau ${seconds}s`:'Gửi lại mã'}</button></div></div></>}
function DemoAccounts({accounts,selectedId,onSelect}:{accounts:DemoAccount[];selectedId:string;onSelect:(account:DemoAccount)=>void}){return <section className="demo-account-help" aria-label="Tài khoản mẫu"><div className="demo-account-help__heading"><span><Icon name="users" size={14}/></span><div><strong>Tài khoản mẫu</strong><small>Chọn tài khoản để tự điền thông tin đăng nhập</small></div></div><div className="demo-account-help__list">{accounts.map(user=><button key={user.role} type="button" className={selectedId===user.id?'selected':''} aria-pressed={selectedId===user.id} onClick={()=>onSelect(user)}><span className={`demo-account-help__avatar demo-account-help__avatar--${user.role}`}>{user.initials}</span><span className="demo-account-help__details"><strong>{user.roleLabel}</strong><span>{user.username}</span><small>Mật khẩu: {user.password}</small></span><span className="demo-account-help__check">{selectedId===user.id&&<Icon name="check" size={14}/>}</span></button>)}</div><small className="demo-account-help__note">Tài khoản mẫu chỉ dùng trong bản DEMO.</small></section>}
