'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Button, Icon } from './App'
import type { RoleKey, SessionUser } from './roles'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

type AuthView = 'login' | 'register' | 'registerOtp' | 'recover' | 'reset' | 'success'

const roleLabels: Record<RoleKey,string> = {
  admin:'Quản trị viên',manager:'Quản lý cửa hàng',pharmacist:'Dược sĩ',cashier:'Thu ngân',
  warehouse:'Nhân viên kho',doctor:'Bác sĩ',customer:'Khách hàng',
}

async function loadProfile(user: User): Promise<SessionUser> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (error) throw new Error(`Không thể tải hồ sơ: ${error.message}. Hãy kiểm tra migration profiles và RLS.`)
  const role = data.role as RoleKey
  return {
    id:data.id, username:data.username, name:data.full_name,
    initials:data.full_name.split(' ').slice(-2).map((part:string)=>part[0]).join(''),
    role, roleLabel:data.role_label || roleLabels[role], email:data.email, phone:data.phone || '',
    description:data.description || 'Tài khoản PHARMASOFT',
  }
}

export function AuthModule({ onAuthenticated,recoveryMode=false,onRecoveryComplete }: { onAuthenticated: (user: SessionUser) => void; recoveryMode?:boolean; onRecoveryComplete?:()=>void }) {
  const [view,setView]=useState<AuthView>(recoveryMode?'reset':'login')
  const [showPassword,setShowPassword]=useState(false)
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [identifier,setIdentifier]=useState('')
  const [loginPassword,setLoginPassword]=useState('')
  const [pendingEmail,setPendingEmail]=useState('')
  const [otp,setOtp]=useState(['','','','','',''])
  const [attemptsRemaining,setAttemptsRemaining]=useState(5)
  const [resendSeconds,setResendSeconds]=useState(0)
  const otpRefs=useRef<(HTMLInputElement|null)[]>([])

  useEffect(()=>setError(''),[view])
  useEffect(()=>{
    if(resendSeconds<=0)return
    const timer=window.setInterval(()=>setResendSeconds(value=>Math.max(0,value-1)),1000)
    return()=>window.clearInterval(timer)
  },[resendSeconds])

  async function login(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('')
    if(!identifier.trim()||!loginPassword)return setError('Vui lòng nhập username/email và mật khẩu.')
    setLoading(true)
    try{
      const supabase=getSupabaseBrowserClient()
      const {data,error:invokeError}=await supabase.functions.invoke('login',{body:{identifier:identifier.trim(),password:loginPassword}})
      if(invokeError||data?.error)throw new Error(data?.message||invokeError?.message||'Đăng nhập thất bại.')
      if(!data?.session?.access_token||!data?.session?.refresh_token)throw new Error('Backend không trả về phiên đăng nhập hợp lệ.')
      const {error:sessionError}=await supabase.auth.setSession({access_token:data.session.access_token,refresh_token:data.session.refresh_token})
      if(sessionError)throw sessionError
      onAuthenticated(await loadProfile(data.user))
    }catch(reason){setError(reason instanceof Error?reason.message:'Không thể kết nối Supabase Auth.')}
    finally{setLoading(false)}
  }

  async function register(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('')
    const form=new FormData(event.currentTarget),fullName=String(form.get('fullName')||'').trim(),email=String(form.get('email')||'').trim().toLowerCase(),phone=String(form.get('phone')||'').trim(),username=String(form.get('username')||'').trim(),password=String(form.get('password')||''),confirmation=String(form.get('confirmation')||''),terms=form.get('terms')
    if(!fullName||!email||!phone||!username||!password)return setError('Vui lòng nhập đầy đủ các trường bắt buộc.')
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return setError('Email không đúng định dạng.')
    if(!/^(0|\+84)[0-9\s]{8,12}$/.test(phone))return setError('Số điện thoại không đúng định dạng Việt Nam.')
    if(!/^[a-zA-Z0-9._-]{4,30}$/.test(username))return setError('Username cần 4–30 ký tự và chỉ gồm chữ, số, dấu chấm, gạch ngang.')
    if(password.length<8)return setError('Mật khẩu phải có ít nhất 8 ký tự.')
    if(password!==confirmation)return setError('Mật khẩu nhập lại không khớp.')
    if(!terms)return setError('Bạn cần đồng ý với điều khoản sử dụng.')
    setLoading(true)
    try{
      const supabase=getSupabaseBrowserClient()
      const {data,error:signUpError}=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName,phone,username}}})
      if(signUpError)throw signUpError
      if(data.session){
        await supabase.auth.signOut()
        throw new Error('Supabase đang tự động xác nhận email. Hãy bật Confirm email và cấu hình template OTP trước khi đăng ký.')
      }
      if(!data.user)throw new Error('Supabase không tạo được yêu cầu đăng ký.')
      setPendingEmail(email);setOtp(['','','','','','']);setAttemptsRemaining(5);setResendSeconds(60);setView('registerOtp')
    }catch(reason){setError(reason instanceof Error?reason.message:'Không thể gửi OTP đăng ký.')}
    finally{setLoading(false)}
  }

  async function verifyRegistrationOtp(event:FormEvent){
    event.preventDefault();const token=otp.join('')
    if(token.length!==6)return setError('Vui lòng nhập đủ mã OTP gồm 6 chữ số.')
    setLoading(true);setError('')
    try{
      const supabase=getSupabaseBrowserClient()
      const {data,error:invokeError}=await supabase.functions.invoke('verify-signup-otp',{body:{email:pendingEmail,token}})
      if(invokeError||data?.error){
        if(typeof data?.attempts_remaining==='number')setAttemptsRemaining(data.attempts_remaining)
        throw new Error(data?.message||invokeError?.message||'OTP không hợp lệ.')
      }
      if(!data?.session?.access_token||!data?.session?.refresh_token)throw new Error('OTP đã xác minh nhưng không nhận được phiên đăng nhập.')
      const {error:sessionError}=await supabase.auth.setSession({access_token:data.session.access_token,refresh_token:data.session.refresh_token})
      if(sessionError)throw sessionError
      onAuthenticated(await loadProfile(data.user))
    }catch(reason){setError(reason instanceof Error?reason.message:'Không thể xác minh OTP.')}
    finally{setLoading(false)}
  }

  async function resendOtp(){
    if(resendSeconds>0||loading)return
    setLoading(true);setError('')
    try{
      const {error:resendError}=await getSupabaseBrowserClient().auth.resend({type:'signup',email:pendingEmail})
      if(resendError)throw resendError
      setResendSeconds(60);setAttemptsRemaining(5);setNotice('Mã OTP mới đã được gửi đến email.')
    }catch(reason){setError(reason instanceof Error?reason.message:'Không thể gửi lại OTP.')}
    finally{setLoading(false)}
  }

  async function recover(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const email=String(new FormData(event.currentTarget).get('email')||'').trim()
    if(!email)return setError('Vui lòng nhập email đã đăng ký.')
    setLoading(true);setError('')
    try{
      const {error:resetError}=await getSupabaseBrowserClient().auth.resetPasswordForEmail(email,{redirectTo:window.location.origin})
      if(resetError)throw resetError
      setNotice('Supabase đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra email.');setView('success')
    }catch(reason){setError(reason instanceof Error?reason.message:'Không thể gửi email khôi phục.')}
    finally{setLoading(false)}
  }

  async function resetPassword(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=new FormData(event.currentTarget),password=String(form.get('password')||''),confirmation=String(form.get('confirmation')||'')
    if(password.length<8)return setError('Mật khẩu mới phải có ít nhất 8 ký tự.')
    if(password!==confirmation)return setError('Mật khẩu nhập lại không khớp.')
    setLoading(true);setError('')
    try{
      const supabase=getSupabaseBrowserClient()
      const {error:updateError}=await supabase.auth.updateUser({password})
      if(updateError)throw updateError
      await supabase.auth.signOut()
      window.history.replaceState({},document.title,window.location.pathname)
      onRecoveryComplete?.();setNotice('Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.');setView('success')
    }catch(reason){setError(reason instanceof Error?reason.message:'Không thể cập nhật mật khẩu.')}
    finally{setLoading(false)}
  }

  function changeOtp(index:number,value:string){const digit=value.replace(/\D/g,'').slice(-1),next=[...otp];next[index]=digit;setOtp(next);if(digit&&index<5)otpRefs.current[index+1]?.focus()}

  return <div className="auth-shell">
    <section className="auth-visual"><div className="auth-brand"><div className="brand__mark"/><div><strong>PHARMASOFT</strong><span>Quản lý nhà thuốc thông minh</span></div></div><div className="auth-visual__content"><span className="auth-kicker"><Icon name="shield" size={16}/> XÁC THỰC BỞI SUPABASE</span><h1>Quản lý nhà thuốc<br/>hiệu quả mỗi ngày.</h1><p>Tài khoản và Email OTP được xử lý bởi Supabase Auth, không lưu mật khẩu trong ứng dụng.</p><div className="auth-feature-grid"><div><span><Icon name="activity"/></span><strong>Vận hành tức thời</strong><small>Dữ liệu được cập nhật liên tục</small></div><div><span><Icon name="shield"/></span><strong>Bảo mật phân quyền</strong><small>RLS cho 7 vai trò hệ thống</small></div></div></div><div className="auth-trust"><Icon name="shield"/><span><strong>Kết nối bảo mật</strong> bằng publishable key và Row Level Security</span></div></section>
    <section className="auth-panel"><div className={`auth-card ${view==='register'?'auth-card--register':''}`}>
      {view==='login'&&<><div className="auth-mobile-brand"><div className="brand__mark"/><strong>PHARMASOFT</strong></div><div className="auth-heading"><span>ĐĂNG NHẬP HỆ THỐNG</span><h2>Chào mừng trở lại</h2><p>Sử dụng username hoặc email đã đăng ký trên Supabase.</p></div>{error&&<AuthError text={error}/>}<form onSubmit={login} className="auth-form"><label className="field"><span>Username hoặc email</span><div className="auth-input"><Icon name="users"/><input value={identifier} onChange={event=>setIdentifier(event.target.value)} autoComplete="username"/></div></label><label className="field"><span>Mật khẩu</span><div className="auth-input"><Icon name="shield"/><input value={loginPassword} onChange={event=>setLoginPassword(event.target.value)} type={showPassword?'text':'password'} autoComplete="current-password"/><button type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword?'Ẩn':'Hiện'}</button></div></label><div className="auth-options"><label className="check-field"><input type="checkbox" defaultChecked/><span>Ghi nhớ đăng nhập</span></label><button type="button" onClick={()=>setView('recover')}>Quên mật khẩu?</button></div><button className="auth-submit" disabled={loading}>{loading?<><span className="spinner"/>Đang xác thực...</>:<>Đăng nhập <Icon name="chevron"/></>}</button></form><div className="auth-register-link">Chưa có tài khoản khách hàng? <button onClick={()=>setView('register')}>Đăng ký ngay</button></div></>}
      {view==='register'&&<><button className="auth-back" onClick={()=>setView('login')}>‹ Quay lại đăng nhập</button><div className="auth-heading"><span>ĐĂNG KÝ KHÁCH HÀNG</span><h2>Tạo tài khoản PHARMASOFT</h2><p>Email cần được xác minh bằng OTP trước khi tài khoản được kích hoạt.</p></div>{error&&<AuthError text={error}/>}<form onSubmit={register} className="auth-form register-form"><div className="register-grid"><label className="field field--wide"><span>Họ và tên *</span><div className="auth-input"><Icon name="users"/><input name="fullName" autoFocus/></div></label><label className="field"><span>Email *</span><div className="auth-input"><Icon name="file"/><input name="email" type="email"/></div></label><label className="field"><span>Số điện thoại *</span><div className="auth-input"><Icon name="customers"/><input name="phone"/></div></label><label className="field field--wide"><span>Username *</span><div className="auth-input"><Icon name="shield"/><input name="username" autoComplete="username"/></div></label><label className="field"><span>Mật khẩu *</span><div className="auth-input"><Icon name="shield"/><input name="password" type="password" autoComplete="new-password"/></div></label><label className="field"><span>Nhập lại mật khẩu *</span><div className="auth-input"><Icon name="check"/><input name="confirmation" type="password" autoComplete="new-password"/></div></label></div><label className="check-field register-terms"><input name="terms" type="checkbox"/><span>Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của PHARMASOFT.</span></label><button className="auth-submit" disabled={loading}>{loading?<><span className="spinner"/>Đang gửi OTP...</>:'Đăng ký & gửi mã OTP'}</button></form></>}
      {view==='registerOtp'&&<><button className="auth-back" onClick={()=>setView('register')}>‹ Thay đổi thông tin</button><div className="auth-step-icon"><Icon name="shield"/></div><div className="auth-heading centered"><span>XÁC MINH EMAIL</span><h2>Nhập mã OTP</h2><p>Mã 6 chữ số đã được Supabase gửi đến <strong>{pendingEmail}</strong>. OTP tuân theo thời hạn được cấu hình trong Supabase Auth.</p></div>{notice&&<div className="auth-success-note"><Icon name="check"/>{notice}</div>}{error&&<AuthError text={error}/>}<form onSubmit={verifyRegistrationOtp} className="auth-form"><div className="otp-row">{otp.map((value,index)=><input key={index} ref={element=>{otpRefs.current[index]=element}} value={value} onChange={event=>changeOtp(index,event.target.value)} inputMode="numeric" aria-label={`Số OTP ${index+1}`}/>)}</div><div className="otp-attempts">Còn tối đa <strong>{attemptsRemaining}</strong> lần thử trong phiên xác minh hiện tại.</div><button className="auth-submit" disabled={loading}>{loading?<><span className="spinner"/>Đang xác minh với Supabase...</>:'Xác minh & kích hoạt tài khoản'}</button><div className="resend">Chưa nhận được mã? <button type="button" disabled={resendSeconds>0||loading} onClick={resendOtp}>{resendSeconds>0?`Gửi lại sau ${resendSeconds}s`:'Gửi lại mã'}</button></div></form></>}
      {view==='recover'&&<><button className="auth-back" onClick={()=>setView('login')}>‹ Quay lại đăng nhập</button><div className="auth-step-icon"><Icon name="help"/></div><div className="auth-heading centered"><span>KHÔI PHỤC MẬT KHẨU</span><h2>Quên mật khẩu?</h2><p>Supabase sẽ gửi liên kết đặt lại mật khẩu đến email đã đăng ký.</p></div>{error&&<AuthError text={error}/>}<form onSubmit={recover} className="auth-form"><label className="field"><span>Email</span><div className="auth-input"><Icon name="file"/><input name="email" type="email"/></div></label><button className="auth-submit" disabled={loading}>{loading?<><span className="spinner"/>Đang gửi...</>:'Gửi email khôi phục'}</button></form></>}
      {view==='reset'&&<><div className="auth-step-icon"><Icon name="shield"/></div><div className="auth-heading centered"><span>ĐẶT LẠI MẬT KHẨU</span><h2>Tạo mật khẩu mới</h2><p>Phiên khôi phục đã được Supabase xác thực. Hãy nhập mật khẩu mới cho tài khoản.</p></div>{error&&<AuthError text={error}/>}<form onSubmit={resetPassword} className="auth-form"><label className="field"><span>Mật khẩu mới</span><div className="auth-input"><Icon name="shield"/><input name="password" type="password" autoComplete="new-password"/></div></label><label className="field"><span>Nhập lại mật khẩu</span><div className="auth-input"><Icon name="check"/><input name="confirmation" type="password" autoComplete="new-password"/></div></label><button className="auth-submit" disabled={loading}>{loading?<><span className="spinner"/>Đang cập nhật...</>:'Cập nhật mật khẩu'}</button></form></>}
      {view==='success'&&<div className="auth-success"><span><Icon name="check" size={30}/></span><h2>Đã gửi yêu cầu</h2><p>{notice}</p><Button onClick={()=>setView('login')}>Trở về đăng nhập</Button></div>}
    </div><div className="auth-footer">© 2025 PHARMASOFT <span>•</span> Supabase Auth <span>•</span> Kết nối bảo mật</div></section>
  </div>
}

function AuthError({text}:{text:string}){return <div className="auth-alert"><Icon name="help"/><div><strong>Không thể hoàn tất</strong><span>{text}</span></div></div>}
