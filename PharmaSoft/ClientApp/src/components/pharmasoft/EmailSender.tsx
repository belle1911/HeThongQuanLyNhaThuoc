'use client'
/**
 * EmailSender.tsx — Modal gửi email từ hóa đơn
 * Giả lập gửi (prototype) — dễ dàng kết nối API thực sau.
 */
import { FormEvent, useState } from 'react'
import { Button, Icon } from './App'

interface EmailSenderProps {
  invoiceId: string
  customerEmail?: string
  customerName?: string
  onClose: () => void
  onSent: () => void
}

export function EmailSender({ invoiceId, customerEmail = '', customerName = '', onClose, onSent }: EmailSenderProps) {
  const [sending, setSending] = useState(false)
  const [step, setStep] = useState<'form' | 'sent'>('form')
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const data = new FormData(e.currentTarget)
    const email = String(data.get('email') || '')
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Địa chỉ email không hợp lệ.')
      return
    }

    setSending(true)
    // Giả lập gửi email (thay bằng API thực khi có backend)
    window.setTimeout(() => {
      setSending(false)
      setStep('sent')
    }, 1500)
  }

  return (
    <div className="dialog-layer" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="dialog email-sender-dialog" role="dialog" aria-modal="true">
        <div className="dialog__header">
          <div>
            <div className="eyebrow">GỬI HÓA ĐƠN</div>
            <h2>Gửi hóa đơn qua Email</h2>
            <p>Hóa đơn <strong>{invoiceId}</strong> sẽ được gửi dưới dạng PDF đính kèm.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Đóng">
            <Icon name="close" />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ gap: '14px' }}>
              <label className="field field--wide">
                <span>Địa chỉ email nhận <b>*</b></span>
                <input
                  name="email"
                  type="email"
                  defaultValue={customerEmail}
                  placeholder="khachhang@email.com"
                  autoFocus
                  required
                />
                {error && <small className="field__error">{error}</small>}
              </label>

              <label className="field field--wide">
                <span>Tiêu đề email</span>
                <input
                  name="subject"
                  defaultValue={`[PHARMASOFT] Hóa đơn ${invoiceId} — ${customerName}`}
                />
              </label>

              <label className="field field--wide">
                <span>Ghi chú thêm (tùy chọn)</span>
                <textarea
                  name="note"
                  rows={3}
                  placeholder="Thêm ghi chú cá nhân cho khách hàng..."
                  style={{ resize: 'vertical', minHeight: 70 }}
                />
              </label>

              <div className="email-preview-note" style={{
                display: 'flex', gap: 8, alignItems: 'flex-start',
                background: '#f7fbf8', border: '1px solid #d1ead9',
                borderRadius: 8, padding: '10px 12px', fontSize: 10, color: '#536159',
              }}>
                <Icon name="file" size={15} />
                <span>
                  Email sẽ bao gồm: thông tin hóa đơn, danh sách sản phẩm, tổng tiền và thông tin nhà thuốc.
                  File PDF đính kèm được tạo tự động.
                </span>
              </div>
            </div>

            <div className="dialog__footer">
              <Button variant="secondary" onClick={onClose}>Hủy bỏ</Button>
              <Button type="submit" icon="download">
                {sending ? 'Đang gửi...' : 'Gửi email'}
              </Button>
            </div>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 20px' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: '#e8f5e9', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px', color: '#16834a',
            }}>
              <Icon name="check" size={28} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Gửi thành công!</h3>
            <p style={{ color: '#7d8b83', fontSize: 12, margin: '0 0 24px' }}>
              Hóa đơn <strong>{invoiceId}</strong> đã được gửi đến địa chỉ email của khách hàng.
              Vui lòng kiểm tra hộp thư đến trong vài phút.
            </p>
            <Button onClick={() => { onSent(); onClose() }}>Đóng</Button>
          </div>
        )}
      </section>
    </div>
  )
}

