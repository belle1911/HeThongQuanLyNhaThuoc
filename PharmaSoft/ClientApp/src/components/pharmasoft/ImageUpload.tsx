'use client'
/**
 * ImageUpload.tsx — Component upload & preview ảnh
 * Lưu ảnh dạng base64 trong state/localStorage (không cần server)
 * Props:
 *   value: base64 string hiện tại
 *   onChange: callback khi chọn ảnh mới
 *   shape: 'circle' | 'square'
 *   size: px
 *   label: tên trường
 */
import { useRef, useState } from 'react'
import { Icon } from './App'

interface ImageUploadProps {
  value?: string | null           // base64 URL hoặc URL ảnh
  onChange: (base64: string) => void
  shape?: 'circle' | 'square'
  size?: number
  label?: string
  accept?: string
  maxSizeMB?: number
}

export function ImageUpload({
  value,
  onChange,
  shape = 'circle',
  size = 80,
  label = 'Ảnh đại diện',
  accept = 'image/jpeg,image/png,image/webp',
  maxSizeMB = 2,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  function processFile(file: File) {
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận tệp hình ảnh (JPG, PNG, WebP).')
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Ảnh không được vượt quá ${maxSizeMB}MB.`)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        // Resize về max 400x400 để tiết kiệm bộ nhớ
        resizeImage(result, 400, 400).then(onChange)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // Reset input để có thể chọn cùng file lại
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const borderRadius = shape === 'circle' ? '50%' : '10px'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius,
          border: `2px dashed ${dragging ? '#16834a' : '#d1ead9'}`,
          background: dragging ? '#eaf6ef' : '#f7fbf8',
          cursor: 'pointer',
          overflow: 'hidden',
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        title="Nhấn hoặc kéo thả ảnh vào đây"
      >
        {value ? (
          <>
            <img
              src={value}
              alt={label}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* Hover overlay */}
            <div style={{
              position: 'absolute', inset: 0, background: '#00000055',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, transition: 'opacity 0.15s', borderRadius,
            }}
              className="img-upload-overlay"
            >
              <Icon name="settings" size={20} />
            </div>
          </>
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 4, color: '#7d8b83',
          }}>
            <Icon name="plus" size={22} />
            <span style={{ fontSize: 9, fontWeight: 600 }}>Tải ảnh</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
        aria-label={`Chọn ${label}`}
      />

      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: 9, color: '#7d8b83', display: 'block' }}>
          JPG, PNG, WebP — tối đa {maxSizeMB}MB
        </span>
        {error && <span style={{ fontSize: 9, color: '#e34b4b', display: 'block', marginTop: 2 }}>{error}</span>}
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            style={{ border: 0, background: 'transparent', color: '#e34b4b', fontSize: 9, fontWeight: 600, cursor: 'pointer', marginTop: 2 }}
          >
            Xóa ảnh
          </button>
        )}
      </div>

      <style>{`.img-upload-overlay:hover, div:hover > .img-upload-overlay { opacity: 1 !important; color: white; }`}</style>
    </div>
  )
}

/** Resize ảnh base64 về kích thước tối đa */
async function resizeImage(base64: string, maxW: number, maxH: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxW || height > maxH) {
        const ratio = Math.min(maxW / width, maxH / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.src = base64
  })
}

