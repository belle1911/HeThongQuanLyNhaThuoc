import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'

/**
 * Lưu dữ liệu vào backend ASP.NET Core (API /api/data/{tên}) thay vì chỉ giữ trong trình duyệt.
 * - bootstrap(): tải toàn bộ dữ liệu từ server trước khi hiện giao diện.
 * - usePersistentState(): giống useState nhưng tự lưu lên server mỗi khi thay đổi.
 * - Các khóa localStorage của tài khoản và giỏ hàng/đơn hàng cũng được đồng bộ lên server.
 * Nếu không kết nối được server, giao diện vẫn chạy bằng dữ liệu mẫu như trước.
 */

const SYNCED_LOCALSTORAGE: Record<string, string> = {
  'pharmasoft-demo-users-v3': 'users',
  'pharmasoft-demo-commerce-v1': 'commerce',
}
const SESSION_KEY = 'pharmasoft-demo-session'

const cache: Record<string, unknown> = {}
const timers = new Map<string, number>()
let rawSetItem: (k: string, v: string) => void = (k, v) => localStorage.setItem(k, v)

let actorName = ''
/** App gọi hàm này mỗi khi đăng nhập/đăng xuất để lịch sử ghi đúng người thực hiện. */
export function setActor(name?: string | null) { actorName = name || '' }

export function currentActor(): string {
  if (actorName) return actorName
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    return s?.name || s?.username || 'Không rõ'
  } catch { return 'Không rõ' }
}

function push(collection: string, value: unknown) {
  window.clearTimeout(timers.get(collection))
  timers.set(collection, window.setTimeout(() => {
    fetch(`/api/data/${collection}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Actor': encodeURIComponent(currentActor()) },
      body: JSON.stringify(value),
    }).catch(() => { /* mất kết nối: bỏ qua, lần thay đổi sau sẽ lưu lại */ })
  }, 500))
}

export async function bootstrap(): Promise<void> {
  const original = Storage.prototype.setItem
  rawSetItem = (k, v) => original.call(localStorage, k, v)

  try {
    const res = await fetch('/api/data')
    if (res.ok) {
      const all = (await res.json()) as Record<string, unknown>
      for (const [name, value] of Object.entries(all)) cache[name] = value
    }
  } catch { /* chạy không có server */ }

  for (const [key, collection] of Object.entries(SYNCED_LOCALSTORAGE)) {
    if (collection in cache) rawSetItem(key, JSON.stringify(cache[collection]))      // server là nguồn đúng
    else {
      const local = localStorage.getItem(key)
      if (local) { try { cache[collection] = JSON.parse(local); push(collection, cache[collection]) } catch { /* bỏ qua */ } }
    }
  }

  // Mỗi lần giao diện ghi localStorage cho tài khoản/giỏ hàng, đồng bộ lên server
  Storage.prototype.setItem = function (key: string, value: string) {
    original.call(this, key, value)
    if (this === localStorage) {
      const collection = SYNCED_LOCALSTORAGE[key]
      if (collection) { try { const v = JSON.parse(value); cache[collection] = v; push(collection, v) } catch { /* bỏ qua */ } }
    }
  }
}

export function usePersistentState<T>(collection: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => (collection in cache ? (cache[collection] as T) : initial))
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      if (!(collection in cache)) { cache[collection] = value; push(collection, value) }   // lần đầu: nạp dữ liệu mẫu lên server
      return
    }
    cache[collection] = value
    push(collection, value)
  }, [value, collection])
  return [value, setValue]
}

export type AuditRow = {
  id: number; at: string; actor: string; action: string; collection: string
  entityId?: string | null; summary?: string | null; oldValue?: string | null; newValue?: string | null
}

export async function fetchAudit(limit = 300, collection = ''): Promise<AuditRow[]> {
  const q = new URLSearchParams({ limit: String(limit) })
  if (collection) q.set('collection', collection)
  const res = await fetch(`/api/audit?${q}`)
  if (!res.ok) throw new Error('Không tải được nhật ký')
  return res.json()
}
