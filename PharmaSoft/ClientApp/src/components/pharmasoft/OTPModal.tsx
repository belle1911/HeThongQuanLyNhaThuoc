'use client'
/**
 * OTPModal.tsx — Xác thực OTP qua SMS/điện thoại
 * Flow: nhập SĐT → gửi OTP → nhập mã → xác nhận
 */
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Button, Icon } from './App'
import { createOTPSession, formatPhone, isValidViPhone, maskPhone, otpSecondsLeft, OTPSession, verifyOTP } from '@/lib/otp'

interface OTPModalProps {
  title?: string
  description?: string
  defaultPhone?: string
  onVerified: (phone: string) => void
  onClose: () => void
}

export function OTPModal({
  title = 'Xác thực số điện thoại',
  description = 'Mã OTP gồm 6 chữ số sẽ được gửi về số điện thoại của bạn.',
  defaultPhone = '',
  onVerified,
  onClose,
}: OTPModalProps) {
  const [step, setStep] = useState<'phone' | 'otp' | 'done'>('phone')
  const [phone, setPhone] = useState(defaultPhone)
  const [phoneError, setPhoneError] = useState('')
  const [session, setSession] = useState<OTPSession | null>(null)
  const [otpInput, setOtpInput] = useState('')
  const [otpError, setOtpError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [sending, setSending] = useState(false)
  const intervalRef = useRef<number | null>(null)
  // Dev: hiển thị code (production: xóa)
  const [devCode, setDevCode] = useState('')

  function startCountdown(sess: OTPSession) {
    setCountdown(otpSecondsLeft(sess))
    intervalRef.current = window.setInterval(() => {
      const left = otpSecondsLeft(sess)
      setCountdown(left)
      if (left <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, 1000)
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  function handleSendOTP(e: FormEvent) {
    e.preventDefault()
    setPhoneError('')
    if (!isValidViPhone(phone)) {
      setPhoneError('Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng Việt Nam (10 chữ số, bắt đầu 0).')
      return
    }
    setSending(true)
    // Giả lập gọi API gửi SMS
    window.setTimeout(() => {
      const sess = createOTPSession(phone)
      setSession(sess)
      setDevCode(sess.code)   // hiện mã để test (xóa production)
      startCountdown(sess)
      setStep('otp')
      setSending(false)
    }, 1200)
  }

  function handleVerifyOTP(e: FormEvent) {
    e.preventDefault()
    if (!session) return
    setOtpError('')
    const result = verifyOTP(session, otpInput)
    if (result === 'ok') {
      setStep('done')
      window.setTimeout(() => onVerified(phone), 1000)
    } else if (result === 'expired') {
      setOtpError('Mã OTP đã hết hiệu lực. Vui lòng gửi lại mã mới.')
    } else if (result === 'too-many') {
      setOtpError('Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã mới.')
    } else {
      setSession({ ...session, attempts: session.attempts + 1 })
      setOtpError(`Mã OTP không đúng. Còn ${5 - (session.attempts + 1)} lần thử.`)
    }
  }

  function handleResend() {
    if (countdown > 0) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    const sess = createOTPSession(phone)
    setSession(sess)
    setDevCode(sess.code)
    setOtpInput('')
    setOtpError('')
    startCountdown(sess)
  }

  return (
    <div className="dialog-layer" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="dialog otp-dialog" role="dialog" aria-modal="true" style={{ maxWidth: 420 }}>
        <div className="dialog__header">
          <div>
            <div className="eyebrow">XÁC THỰC OTP</div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Đóng">
            <Icon name="close" />
          </button>
        </div>

        {step === 'phone' && (
          <form onSubmit={handleSendOTP}>
            <div className="form-grid" style={{ gap: 12 }}>
              <label className="field field--wide">
                <span>Số điện thoại <b>*</b></span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901 234 567"
                  inputMode="tel"
                  autoFocus
                />
                {phoneError && <small className="field__error">{phoneError}</small>}
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 10, color: '#7d8b83', background: '#f7fbf8', borderRadius: 8, padding: '8px 12px' }}>
                <Icon name="shield" size={14} />
                <span>Mã OTP chỉ có hiệu lực trong <strong>2 phút</strong>. Không chia sẻ mã với bất kỳ ai.</span>
              </div>
            </div>
            <div className="dialog__footer">
              <Button variant="secondary" onClick={onClose}>Hủy bỏ</Button>
              <Button type="submit" icon="bell">{sending ? 'Đang gửi...' : 'Gửi mã OTP'}</Button>
            </div>
          </form>
        )}

        {step === 'otp' && session && (
          <form onSubmit={handleVerifyOTP}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: '#7d8b83', marginBottom: 4 }}>Mã OTP đã được gửi đến</div>
              <strong style={{ fontSize: 15 }}>{formatPhone(phone)} ({maskPhone(phone)})</strong>
            </div>

            {/* DEV ONLY: hiện mã để test */}
            {devCode && (
              <div style={{ background: '#fffbea', border: '1px dashed #f59e0b', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 11, textAlign: 'center' }}>
                <span style={{ color: '#92400e' }}>🔧 Demo — Mã OTP: </span>
                <strong style={{ fontSize: 20, letterSpacing: 4, color: '#d97706' }}>{devCode}</strong>
              </div>
            )}

            <div className="form-grid" style={{ gap: 12 }}>
              <label className="field field--wide">
                <span>Nhập mã OTP <b>*</b></span>
                <input
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  style={{ letterSpacing: 8, fontSize: 20, textAlign: 'center' }}
                />
                {otpError && <small className="field__error">{otpError}</small>}
              </label>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10 }}>
                <span style={{ color: countdown > 0 ? '#e59b28' : '#7d8b83' }}>
                  {countdown > 0 ? `Hết hiệu lực sau: ${countdown}s` : 'Mã đã hết hiệu lực'}
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  style={{
                    border: 0, background: 'transparent', color: countdown > 0 ? '#b0b8b4' : '#16834a',
                    fontWeight: 600, fontSize: 10, cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                  }}
                  disabled={countdown > 0}
                >
                  Gửi lại mã
                </button>
              </div>
            </div>

            <div className="dialog__footer">
              <Button variant="secondary" onClick={() => { setStep('phone'); setOtpInput(''); setOtpError('') }}>Quay lại</Button>
              <Button type="submit" icon="check" disabled={otpInput.length !== 6}>Xác nhận</Button>
            </div>
          </form>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '24px 20px 32px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#16834a' }}>
              <Icon name="check" size={26} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 15 }}>Xác thực thành công!</h3>
            <p style={{ color: '#7d8b83', fontSize: 11 }}>Số điện thoại {formatPhone(phone)} đã được xác thực.</p>
          </div>
        )}
      </section>
    </div>
  )
}

