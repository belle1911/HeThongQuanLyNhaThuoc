/** Ngày giờ hiện tại theo giờ máy, thay cho các giá trị viết cứng (vd: 24/06/2025, 14:35). */
const pad = (n: number) => String(n).padStart(2, '0')

/** DD/MM/YYYY */
export function todayVN(date = new Date()): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

/** HH:mm */
export function nowTimeVN(date = new Date()): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** YYYY-MM-DD (dùng cho input type="date" và so sánh chuỗi) */
export function todayISO(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Ngày đầu tháng hiện tại, dạng YYYY-MM-DD */
export function monthStartISO(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-01`
}

/** YYMMDD, dùng trong mã chứng từ */
export function dateCode(date = new Date()): string {
  return `${String(date.getFullYear()).slice(2)}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
}

/** Đổi DD/MM/YYYY (có thể kèm giờ phía sau) sang YYYY-MM-DD. Trả về '' nếu không đọc được. */
export function vnToISO(value: string): string {
  const match = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(value || '')
  return match ? `${match[3]}-${pad(Number(match[2]))}-${pad(Number(match[1]))}` : ''
}

/**
 * Tạo mã chứng từ mới không trùng: PREFIX-YYMMDD-NNNN, số thứ tự tăng dần trong ngày.
 * Ví dụ nextDocumentCode('PN', ['PN-251119-0001']) => 'PN-251119-0002'
 */
export function nextDocumentCode(prefix: string, existingIds: string[], digits = 4): string {
  const head = `${prefix}-${dateCode()}-`
  const used = existingIds.filter(id => id.startsWith(head)).map(id => Number(id.slice(head.length)) || 0)
  const next = (used.length ? Math.max(...used) : 0) + 1
  return `${head}${String(next).padStart(digits, '0')}`
}

/** Chữ cái đầu của 2 từ cuối trong tên, vd: "Trần Thu Hà" => "TH" */
export function initialsOf(name: string): string {
  return name.trim().split(/\s+/).slice(-2).map(word => word[0] || '').join('').toUpperCase() || '?'
}
