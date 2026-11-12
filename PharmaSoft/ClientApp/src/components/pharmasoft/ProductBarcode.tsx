import { useEffect, useRef, useState } from 'react'
import JsBarcode from 'jsbarcode'

export function ProductBarcode({ value }: { value: string }) {
  const svg = useRef<SVGSVGElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const barcode = value.trim()
    if (!barcode || !/^[\x20-\x7E]+$/.test(barcode)) {
      setError('Mã vạch cần có ký tự ASCII để tạo hình mã.')
      return
    }

    if (svg.current) {
      JsBarcode(svg.current, barcode, {
        format: 'CODE128',
        displayValue: true,
        fontSize: 13,
        height: 48,
        margin: 6,
        textMargin: 2,
        width: 1.5,
      })
      setError('')
    }
  }, [value])

  return <div className="product-barcode">
    {error ? <span role="status">{error}</span> : <svg ref={svg} aria-label={`Mã vạch ${value}`} />}
  </div>
}
