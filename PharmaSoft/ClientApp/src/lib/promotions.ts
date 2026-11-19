/**
 * Khuyến mãi dùng chung cho POS, cửa hàng online và màn hình Khuyến mãi.
 * Mã được đọc từ collection "promotions" (quản lý ở màn hình Khuyến mãi), không còn viết cứng trong code.
 */
import { todayISO, vnToISO } from './today'

export type Promotion = { code: string; name: string; start: string; end: string; type: string; value: number; minimum: number; maximum: number; applies: string; limit: number; used: number; status: string }

export const initialPromotions: Promotion[] = [
  { code: 'HEALTH10', name: 'Chăm sóc sức khỏe tháng 6', start: '01/06/2025', end: '30/06/2025', type: 'Theo phần trăm', value: 10, minimum: 300000, maximum: 100000, applies: 'Toàn bộ đơn hàng', limit: 500, used: 286, status: 'Đang hoạt động' },
  { code: 'VITAMIN20', name: 'Ưu đãi Vitamin & khoáng chất', start: '15/06/2025', end: '15/07/2025', type: 'Theo phần trăm', value: 20, minimum: 200000, maximum: 150000, applies: 'Danh mục Vitamin & khoáng chất', limit: 300, used: 128, status: 'Đang hoạt động' },
  { code: 'GIAM50', name: 'Giảm trực tiếp 50.000 VNĐ', start: '01/06/2025', end: '30/06/2025', type: 'Số tiền cố định', value: 50000, minimum: 500000, maximum: 50000, applies: 'Toàn bộ đơn hàng', limit: 200, used: 174, status: 'Đang hoạt động' },
  { code: 'KHACHMOI', name: 'Chào mừng khách hàng mới', start: '01/01/2025', end: '31/12/2025', type: 'Theo phần trăm', value: 15, minimum: 100000, maximum: 80000, applies: 'Khách hàng mới', limit: 1000, used: 642, status: 'Tạm dừng' },
  { code: 'TET2025', name: 'Khuyến mãi Tết Ất Tỵ', start: '15/01/2025', end: '15/02/2025', type: 'Theo phần trăm', value: 12, minimum: 250000, maximum: 120000, applies: 'Toàn bộ đơn hàng', limit: 800, used: 800, status: 'Đã kết thúc' },
]

/** Trạng thái thực tế theo ngày hiện tại và số lượt đã dùng. */
export function effectiveStatus(promotion: Promotion, today = todayISO()): string {
  if (promotion.status === 'Tạm dừng') return 'Tạm dừng'
  const end = vnToISO(promotion.end), start = vnToISO(promotion.start)
  if ((end && end < today) || promotion.used >= promotion.limit) return 'Đã kết thúc'
  if (start && start > today) return 'Chưa bắt đầu'
  return promotion.status === 'Đã kết thúc' ? 'Đã kết thúc' : 'Đang hoạt động'
}

export type PromotionLine = { price: number; quantity: number; discount?: number; category?: string }
export type PromotionResult = { ok: true; code: string; amount: number; label: string } | { ok: false; code: string; message: string }

/**
 * Kiểm tra và tính số tiền giảm của một mã cho giỏ hàng.
 * subtotal = tổng tiền hàng trước giảm giá (giống cách tính cũ của HEALTH10/GIAM50).
 */
export function evaluatePromotion(promotions: Promotion[], rawCode: string, lines: PromotionLine[]): PromotionResult {
  const code = rawCode.trim().toUpperCase()
  const promotion = promotions.find(item => item.code.toUpperCase() === code)
  if (!promotion) return { ok: false, code, message: 'Mã khuyến mãi không tồn tại' }
  const status = effectiveStatus(promotion)
  if (status === 'Tạm dừng') return { ok: false, code, message: 'Chương trình khuyến mãi đang tạm dừng' }
  if (status === 'Chưa bắt đầu') return { ok: false, code, message: `Mã chỉ áp dụng từ ngày ${promotion.start}` }
  if (status === 'Đã kết thúc') return { ok: false, code, message: promotion.used >= promotion.limit ? 'Mã đã hết lượt sử dụng' : `Mã đã hết hạn từ ngày ${promotion.end}` }

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
  if (subtotal < promotion.minimum) return { ok: false, code, message: `Đơn hàng cần tối thiểu ${promotion.minimum.toLocaleString('vi-VN')} VNĐ` }

  // "Danh mục X": chỉ giảm trên các sản phẩm thuộc danh mục đó
  const categoryMatch = /^Danh mục (.+)$/.exec(promotion.applies)
  const base = categoryMatch ? lines.filter(line => line.category === categoryMatch[1]).reduce((sum, line) => sum + line.price * line.quantity, 0) : subtotal
  if (base <= 0) return { ok: false, code, message: `Mã chỉ áp dụng cho ${promotion.applies.toLowerCase()}` }

  const raw = promotion.type === 'Theo phần trăm' ? base * promotion.value / 100 : promotion.value
  const capped = promotion.maximum > 0 ? Math.min(raw, promotion.maximum) : raw
  const amount = Math.round(Math.min(capped, base))
  const label = promotion.type === 'Theo phần trăm'
    ? `Giảm ${promotion.value}%${promotion.maximum > 0 ? `, tối đa ${promotion.maximum.toLocaleString('vi-VN')} VNĐ` : ''}`
    : `Giảm trực tiếp ${promotion.value.toLocaleString('vi-VN')} VNĐ`
  return { ok: true, code: promotion.code, amount, label }
}

/** Tăng lượt sử dụng của mã sau khi đơn được tạo thành công. */
export function markPromotionUsed(promotions: Promotion[], code: string): Promotion[] {
  return promotions.map(item => item.code.toUpperCase() === code.toUpperCase() ? { ...item, used: item.used + 1 } : item)
}
