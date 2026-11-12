'use client'
/**
 * PieChart.tsx — Biểu đồ tròn SVG thuần, không cần thư viện
 * Props:
 *   segments: mảng { label, value, color }
 *   size: đường kính (default 200)
 *   onClick: (segment) => void — nhấn vào segment
 */
import { useState } from 'react'

export interface PieSegment {
  label: string
  value: number
  color: string
  detail?: string
}

interface PieChartProps {
  segments: PieSegment[]
  size?: number
  showLegend?: boolean
  title?: string
  onClick?: (segment: PieSegment) => void
  centerLabel?: string
  centerValue?: string
}

const DEFAULT_COLORS = [
  '#16834a', '#3b82f6', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#10b981', '#f97316',
]

export function PieChart({
  segments,
  size = 180,
  showLegend = true,
  title,
  onClick,
  centerLabel,
  centerValue,
}: PieChartProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const r = size / 2
  const cx = r
  const cy = r
  const radius = r - 8
  const holeRadius = radius * 0.52  // donut

  const total = segments.reduce((sum, s) => sum + s.value, 0)
  if (total === 0) return null

  // Tính góc của từng segment
  let currentAngle = -Math.PI / 2  // bắt đầu từ 12 giờ
  const paths = segments.map((seg, i) => {
    const pct = seg.value / total
    const angle = pct * 2 * Math.PI
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    const x1 = cx + radius * Math.cos(startAngle)
    const y1 = cy + radius * Math.sin(startAngle)
    const x2 = cx + radius * Math.cos(endAngle)
    const y2 = cy + radius * Math.sin(endAngle)
    const xi1 = cx + holeRadius * Math.cos(startAngle)
    const yi1 = cy + holeRadius * Math.sin(startAngle)
    const xi2 = cx + holeRadius * Math.cos(endAngle)
    const yi2 = cy + holeRadius * Math.sin(endAngle)
    const largeArc = angle > Math.PI ? 1 : 0
    const color = seg.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
    const isHovered = hovered === seg.label
    const midAngle = startAngle + angle / 2
    const offset = isHovered ? 6 : 0
    const ox = offset * Math.cos(midAngle)
    const oy = offset * Math.sin(midAngle)

    const d = [
      `M ${x1 + ox} ${y1 + oy}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2 + ox} ${y2 + oy}`,
      `L ${xi2 + ox} ${yi2 + oy}`,
      `A ${holeRadius} ${holeRadius} 0 ${largeArc} 0 ${xi1 + ox} ${yi1 + oy}`,
      'Z',
    ].join(' ')

    return { d, color, seg, pct, isHovered }
  })

  return (
    <div className="pie-chart-wrap" style={{ display: 'flex', flexDirection: showLegend ? 'row' : 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
          {paths.map(({ d, color, seg, isHovered }) => (
            <path
              key={seg.label}
              d={d}
              fill={color}
              opacity={hovered && !isHovered ? 0.55 : 1}
              stroke="white"
              strokeWidth={2}
              style={{ cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s ease' }}
              onMouseEnter={() => setHovered(seg.label)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onClick?.(seg)}
            >
              <title>{seg.label}: {(seg.value / total * 100).toFixed(1)}%</title>
            </path>
          ))}
        </svg>
        {/* Center text */}
        {(centerLabel || centerValue) && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          }}>
            {centerValue && <strong style={{ fontSize: 14, color: '#18241e' }}>{centerValue}</strong>}
            {centerLabel && <small style={{ fontSize: 9, color: '#7d8b83' }}>{centerLabel}</small>}
          </div>
        )}
      </div>

      {showLegend && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          {title && <strong style={{ fontSize: 11, marginBottom: 2 }}>{title}</strong>}
          {paths.map(({ color, seg, pct }) => (
            <button
              key={seg.label}
              onClick={() => onClick?.(seg)}
              onMouseEnter={() => setHovered(seg.label)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, border: 0,
                background: hovered === seg.label ? '#f3f8f5' : 'transparent',
                borderRadius: 6, padding: '3px 6px', cursor: onClick ? 'pointer' : 'default',
                textAlign: 'left', transition: 'background 0.15s',
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#536159', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seg.label}</span>
              <strong style={{ fontSize: 10, color: '#18241e', flexShrink: 0 }}>{(pct * 100).toFixed(1)}%</strong>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

