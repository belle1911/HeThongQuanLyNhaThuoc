/**
 * otp.ts — Logic tạo và xác thực mã OTP
 */

/** Tạo OTP 6 chữ số ngẫu nhiên */
export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** Định dạng số điện thoại Việt Nam */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  return phone
}

/** Kiểm tra số điện thoại VN hợp lệ */
export function isValidViPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return /^(0[3-9]\d{8})$/.test(digits)
}

/** Che số điện thoại (bảo mật) */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 10) {
    return `${digits.slice(0, 3)}****${digits.slice(-3)}`
  }
  return '***'
}

export interface OTPSession {
  code: string
  phone: string
  expiresAt: number  // timestamp ms
  attempts: number
}

const OTP_TTL_MS = 2 * 60 * 1000  // 2 phút
const MAX_ATTEMPTS = 5

/** Tạo phiên OTP mới */
export function createOTPSession(phone: string): OTPSession {
  return {
    code: generateOTP(),
    phone,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  }
}

/** Xác thực mã OTP */
export type OTPResult = 'ok' | 'expired' | 'wrong' | 'too-many'
export function verifyOTP(session: OTPSession, input: string): OTPResult {
  if (Date.now() > session.expiresAt) return 'expired'
  if (session.attempts >= MAX_ATTEMPTS) return 'too-many'
  if (input.trim() === session.code) return 'ok'
  return 'wrong'
}

/** Thời gian còn lại (giây) */
export function otpSecondsLeft(session: OTPSession): number {
  return Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 1000))
}

