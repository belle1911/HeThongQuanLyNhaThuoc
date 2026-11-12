import { FormEvent, useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Button, Icon } from './App'

export function ScanDialog({ message, onClose, onScan }: { message: string; onClose: () => void; onScan: (value: string) => boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const handled = useRef(false)
  const onScanRef = useRef(onScan)
  const [manualValue, setManualValue] = useState('')
  const [cameraMessage, setCameraMessage] = useState('Đang khởi động camera...')
  const [mirrorPreview, setMirrorPreview] = useState(false)

  useEffect(() => { onScanRef.current = onScan }, [onScan])

  useEffect(() => {
    let active = true
    let stopScanner: (() => void) | undefined
    const reader = new BrowserMultiFormatReader()

    async function startCamera() {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        if (!active) return
        if (!devices.length) {
          setCameraMessage('Không tìm thấy camera. Bạn vẫn có thể nhập mã bên dưới.')
          return
        }
        const camera = devices.find(device => /back|rear|environment/i.test(device.label)) || devices[0]
        setCameraMessage('Đưa mã QR hoặc mã vạch vào khung hình.')
        const controls = await reader.decodeFromVideoDevice(camera.deviceId, video.current || undefined, (result) => {
          if (result && active && !handled.current) {
            handled.current = true
            if (!onScanRef.current(result.getText())) {
              window.setTimeout(() => { handled.current = false }, 1200)
            }
          }
        })
        const facingMode = video.current?.srcObject instanceof MediaStream
          ? video.current.srcObject.getVideoTracks()[0]?.getSettings().facingMode
          : undefined
        setMirrorPreview(facingMode === 'user')
        if (active) stopScanner = () => controls.stop()
        else controls.stop()
      } catch {
        if (active) setCameraMessage('Không thể mở camera. Hãy cấp quyền truy cập hoặc nhập mã bên dưới.')
      }
    }

    void startCamera()
    return () => {
      active = false
      stopScanner?.()
    }
  }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = manualValue.trim()
    if (value) {
      handled.current = onScanRef.current(value)
    }
  }

  return <div className="dialog-layer scan-dialog-layer" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="dialog scan-dialog" role="dialog" aria-modal="true" aria-labelledby="scan-dialog-title">
      <div className="dialog__header">
        <div><div className="eyebrow">TRA CỨU NHANH</div><h2 id="scan-dialog-title">Quét QR / mã vạch</h2><p>Quét mã sản phẩm thuốc hoặc mã QR trên hóa đơn.</p></div>
        <button className="icon-button" onClick={onClose} aria-label="Đóng"><Icon name="close"/></button>
      </div>
      <div className="scan-camera-frame">
        <video ref={video} className={mirrorPreview ? 'scan-camera-preview--mirrored' : undefined} muted playsInline />
        <span className="scan-frame-corners" aria-hidden="true"/>
        <div className="scan-camera-status"><Icon name="scan" size={16}/>{cameraMessage}</div>
      </div>
      {message&&<div className="auth-alert scan-error"><Icon name="help"/><div><strong>Không tìm thấy dữ liệu</strong><span>{message}</span></div></div>}
      <form className="scan-manual-form" onSubmit={submit}>
        <label className="field"><span>Hoặc nhập mã thủ công</span><input autoFocus value={manualValue} onChange={event=>setManualValue(event.target.value)} placeholder="Mã thuốc, barcode hoặc mã hóa đơn"/></label>
        <div className="dialog__footer"><Button variant="secondary" onClick={onClose}>Đóng</Button><Button type="submit" icon="search">Tra cứu mã</Button></div>
      </form>
    </section>
  </div>
}
