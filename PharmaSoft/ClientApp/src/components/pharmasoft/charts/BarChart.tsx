'use client'
/**
 * BarChart.tsx — Biểu đồ cột SVG thuần, không cần thư viện
 * Props:
 *   bars: mảng { label, value, color? }
 *   height: chiều cao chart area (default 180)
 *   onClick: (bar) => void — nhấn vào cột xem chi tiết
 */
import { useState } from 'react'

export interface BarItem {
  label: string
  value: number
  value2?: number   // so sánh (cột thứ 2)
  color?: string
  color2?: string
  detail?: string
}

interface BarChartProps {
  bars: BarItem[]
  height?: number
  unit?: string        // hiển thị sau số (vd: 'tr VNĐ', '%')
  formatValue?: (v: number) => string
  legend?: [string, string]   // tên 2 series nếu có value2
  onClick?: (bar: BarItem) => void
  maxValue?: number
}

export function BarChart({
  bars,
  height = 160,
  unit = '',
  formatValue,
  legend,
  onClick,
  maxValue,
}: BarChartProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  const max = maxValue ?? Math.max(...bars.map((b) => Math.max(b.value, b.value2 ?? 0)), 1)
  const hasSecond = bars.some((b) => b.value2 !== undefined)

  const fmt = formatValue ?? ((v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}tr`
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`
    return String(v)
  })

  return (
    <div className="bar-chart-wrap" style={{ width: '100%' }}>
      {legend && hasSecond && (
        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginBottom: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#536159' }}>
            <i style={{ width: 10, height: 10, borderRadius: 2, background: '#16834a', display: 'inline-block' }} />
            {legend[0]}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#536159' }}>
            <i style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6', display: 'inline-block' }} />
            {legend[1]}
          </span>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: hasSecond ? 2 : 8,
          height,
          padding: '0 4px',
        }}
      >
        {bars.map((bar) => {
          const isHov = hovered === bar.label
          const pct1 = (bar.value / max) * 100
          const pct2 = bar.value2 !== undefined ? (bar.value2 / max) * 100 : null
          const color1 = bar.color ?? '#16834a'
          const color2 = bar.color2 ?? '#3b82f6'

          return (
            <div
              key={bar.label}
              title={`${bar.label}: ${fmt(bar.value)}${unit}`}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                gap: 2,
                cursor: onClick ? 'pointer' : 'default',
              }}
              onMouseEnter={() => setHovered(bar.label)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onClick?.(bar)}
            >
              {/* Value label */}
              <span style={{
                fontSize: 9, color: isHov ? '#16834a' : '#7d8b83',
                fontWeight: isHov ? 700 : 400,
                transition: 'color 0.15s',
                textAlign: 'center',
                lineHeight: 1,
              }}>
                {fmt(bar.value)}{unit}
              </span>

              {/* Bar(s) */}
              <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', width: '100%', maxWidth: 48 }}>
                <div
                  style={{
                    flex: 1,
                    height: `${pct1}%`,
                    minHeight: 2,
                    background: color1,
                    borderRadius: '4px 4px 0 0',
                    opacity: hovered && !isHov ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    transform: isHov ? 'scaleY(1.03)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                    boxShadow: isHov ? `0 -3px 8px ${color1}44` : 'none',
                  }}
                />
                {pct2 !== null && (
                  <div
                    style={{
                      flex: 1,
                      height: `${pct2}%`,
                      minHeight: 2,
                      background: color2,
                      borderRadius: '4px 4px 0 0',
                      opacity: hovered && !isHov ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  />
                )}
              </div>

              {/* X label */}
              <span style={{
                fontSize: 9, color: '#91a097', textAlign: 'center',
                lineHeight: 1.2, marginTop: 2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                width: '100%',
              }}>
                {bar.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

