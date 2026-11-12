import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Icon } from './App'
import { fetchAudit, type AuditRow } from '@/lib/persist'

const actionLabel: Record<string, { text: string; kind: string }> = {
  CREATE: { text: 'Thêm mới', kind: 'ok' },
  UPDATE: { text: 'Chỉnh sửa', kind: 'info' },
  DELETE: { text: 'Xóa', kind: 'danger' },
  REPLACE: { text: 'Thay đổi', kind: 'info' },
  SEED: { text: 'Khởi tạo', kind: 'warning' },
  BULK: { text: 'Nhiều thay đổi', kind: 'warning' },
}

const collectionLabel: Record<string, string> = {
  users: 'Tài khoản', commerce: 'Cửa hàng', categories: 'Danh mục thuốc', invoices: 'Hóa đơn', promotions: 'Khuyến mãi',
  returns: 'Trả hàng', 'inventory-stock': 'Tồn kho', 'inventory-receipts': 'Nhập hàng', 'inventory-issues': 'Xuất hàng',
  'inventory-transfers': 'Điều chuyển', 'inventory-stocktakes': 'Kiểm kê', 'pos-products': 'Sản phẩm bán hàng',
  'pos-customers': 'Khách hàng bán hàng', notices: 'Thông báo', 'live-chat': 'Chat bác sĩ',
  'partners-supplier': 'Nhà cung cấp', 'partners-customer': 'Khách hàng', 'partners-employee': 'Nhân viên',
}
const labelOf = (c: string) => {
  const [base, sub] = c.split('.')
  const subLabel: Record<string, string> = { products: 'Thuốc', orders: 'Đơn hàng' }
  return (collectionLabel[base] ?? base) + (sub ? ` › ${subLabel[sub] ?? sub}` : '')
}

export function AuditLog() {
  const [rows, setRows] = useState<AuditRow[]>([])
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [query, setQuery] = useState('')
  const [action, setAction] = useState('Tất cả')
  const [open, setOpen] = useState<AuditRow | null>(null)

  const load = () => {
    setState('loading')
    fetchAudit(500).then(r => { setRows(r); setState('ok') }).catch(() => setState('error'))
  }
  useEffect(load, [])

  const filtered = useMemo(() => rows.filter(r =>
    (action === 'Tất cả' || r.action === action) &&
    `${r.actor} ${r.summary ?? ''} ${labelOf(r.collection)} ${r.entityId ?? ''}`.toLowerCase().includes(query.toLowerCase())), [rows, action, query])

  return <div className="account-module">
    <section className="card accounts-card">
      <div className="accounts-toolbar">
        <div className="table-search account-search"><Icon name="search" size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm theo người thực hiện, nội dung..." /></div>
        <select value={action} onChange={e => setAction(e.target.value)}>
          <option>Tất cả</option>{Object.entries(actionLabel).map(([k, v]) => <option key={k} value={k}>{v.text}</option>)}
        </select>
        <Button variant="secondary" icon="download" onClick={load}>Làm mới</Button>
      </div>
      {state === 'error' && <p style={{ padding: 16 }}>Không tải được nhật ký. Hãy chạy ứng dụng bằng ASP.NET Core (dotnet run) để có lịch sử thay đổi.</p>}
      <div className="table-scroll">
        <table className="accounts-table">
          <thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Thao tác</th><th>Phân hệ</th><th>Nội dung</th><th></th></tr></thead>
          <tbody>
            {filtered.map(r => {
              const a = actionLabel[r.action] ?? { text: r.action, kind: 'info' }
              return <tr key={r.id}>
                <td>{new Date(r.at).toLocaleString('vi-VN')}</td>
                <td><strong>{r.actor}</strong></td>
                <td><Badge kind={a.kind}>{a.text}</Badge></td>
                <td>{labelOf(r.collection)}</td>
                <td>{r.summary}{r.entityId ? <small style={{ display: 'block', opacity: .6 }}>Mã: {r.entityId}</small> : null}</td>
                <td>{(r.oldValue || r.newValue) && <button className="link-button" onClick={() => setOpen(r)}>Chi tiết</button>}</td>
              </tr>
            })}
            {state === 'ok' && filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>Chưa có lịch sử thay đổi.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="pagination"><span>Hiển thị <strong>{filtered.length}</strong> / {rows.length} bản ghi gần nhất</span></div>
    </section>

    {open && <div className="dialog-backdrop" onClick={() => setOpen(null)}>
      <div className="dialog" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        <div className="dialog__header"><h3>{open.summary}</h3><button className="icon-button" onClick={() => setOpen(null)} aria-label="Đóng"><Icon name="close" /></button></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 16 }}>
          <div><strong>Trước</strong><pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{pretty(open.oldValue)}</pre></div>
          <div><strong>Sau</strong><pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{pretty(open.newValue)}</pre></div>
        </div>
      </div>
    </div>}
  </div>
}

function pretty(v?: string | null) {
  if (!v) return '—'
  try { return JSON.stringify(JSON.parse(v), null, 2) } catch { return v }
}
