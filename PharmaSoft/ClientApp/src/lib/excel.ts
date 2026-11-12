/**
 * excel.ts — Xuất file .xlsx thực từ dữ liệu bảng
 * Dùng thư viện SheetJS (xlsx) — không cần server
 */

export interface ExcelColumn {
  key: string
  label: string
  width?: number
}

/** Xuất mảng object thành file .xlsx và tự động download */
export function exportToExcel<T extends Record<string, unknown>>(
  columns: ExcelColumn[],
  rows: T[],
  filename = 'pharmasoft-export',
): void {
  import('xlsx').then((XLSX) => {
    // Tạo header row
    const header = columns.map((c) => c.label)

    // Tạo data rows
    const data = rows.map((row) =>
      columns.map((c) => {
        const val = row[c.key]
        if (val === null || val === undefined) return ''
        return String(val)
      }),
    )

    // Tạo worksheet
    const wsData = [header, ...data]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Set column widths
    ws['!cols'] = columns.map((c) => ({ wch: c.width ?? 20 }))

    // Style header row (bold)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!ws[cellRef]) continue
      ws[cellRef].s = { font: { bold: true }, fill: { fgColor: { rgb: 'E8F5E9' } } }
    }

    // Tạo workbook
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Dữ liệu')

    // Thêm metadata
    wb.Props = {
      Title: 'PHARMASOFT Export',
      Subject: filename,
      Author: 'PHARMASOFT System',
      CreatedDate: new Date(),
    }

    // Download
    XLSX.writeFile(wb, `${filename}-${formatDate()}.xlsx`)
  })
}

/** Xuất nhiều sheet cùng lúc */
export function exportMultiSheet(
  sheets: Array<{ name: string; columns: ExcelColumn[]; rows: Record<string, unknown>[] }>,
  filename = 'pharmasoft-report',
): void {
  import('xlsx').then((XLSX) => {
    const wb = XLSX.utils.book_new()

    sheets.forEach(({ name, columns, rows }) => {
      const header = columns.map((c) => c.label)
      const data = rows.map((row) =>
        columns.map((c) => {
          const val = row[c.key]
          return val === null || val === undefined ? '' : String(val)
        }),
      )
      const ws = XLSX.utils.aoa_to_sheet([header, ...data])
      ws['!cols'] = columns.map((c) => ({ wch: c.width ?? 20 }))
      XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31))
    })

    XLSX.writeFile(wb, `${filename}-${formatDate()}.xlsx`)
  })
}

function formatDate(): string {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

// ─── Preset column definitions cho từng module ───────────────────────────────

export const INVOICE_COLUMNS: ExcelColumn[] = [
  { key: 'id', label: 'Mã hóa đơn', width: 20 },
  { key: 'date', label: 'Ngày', width: 12 },
  { key: 'time', label: 'Giờ', width: 10 },
  { key: 'customer', label: 'Khách hàng', width: 25 },
  { key: 'phone', label: 'Điện thoại', width: 15 },
  { key: 'employee', label: 'Nhân viên', width: 20 },
  { key: 'payment', label: 'PTTT', width: 15 },
  { key: 'total', label: 'Tổng tiền (VNĐ)', width: 18 },
  { key: 'status', label: 'Trạng thái', width: 18 },
]

export const MEDICINE_COLUMNS: ExcelColumn[] = [
  { key: 'id', label: 'Mã sản phẩm', width: 15 },
  { key: 'name', label: 'Tên thuốc', width: 35 },
  { key: 'category', label: 'Danh mục', width: 25 },
  { key: 'unit', label: 'Đơn vị', width: 10 },
  { key: 'stock', label: 'Tồn kho', width: 12 },
  { key: 'price', label: 'Giá bán (VNĐ)', width: 18 },
  { key: 'expiry', label: 'Hạn sử dụng', width: 15 },
  { key: 'status', label: 'Trạng thái', width: 15 },
]

export const CUSTOMER_COLUMNS: ExcelColumn[] = [
  { key: 'id', label: 'Mã KH', width: 12 },
  { key: 'name', label: 'Tên khách hàng', width: 25 },
  { key: 'phone', label: 'Điện thoại', width: 15 },
  { key: 'email', label: 'Email', width: 25 },
  { key: 'address', label: 'Địa chỉ', width: 30 },
  { key: 'tier', label: 'Hạng thành viên', width: 18 },
  { key: 'totalSpent', label: 'Tổng chi tiêu', width: 18 },
  { key: 'status', label: 'Trạng thái', width: 15 },
]

export const SUPPLIER_COLUMNS: ExcelColumn[] = [
  { key: 'id', label: 'Mã NCC', width: 12 },
  { key: 'name', label: 'Tên nhà cung cấp', width: 35 },
  { key: 'contact', label: 'Liên hệ', width: 20 },
  { key: 'phone', label: 'Điện thoại', width: 15 },
  { key: 'email', label: 'Email', width: 25 },
  { key: 'taxCode', label: 'Mã số thuế', width: 15 },
  { key: 'status', label: 'Trạng thái', width: 15 },
]

export const EMPLOYEE_COLUMNS: ExcelColumn[] = [
  { key: 'id', label: 'Mã NV', width: 12 },
  { key: 'name', label: 'Họ tên', width: 25 },
  { key: 'role', label: 'Vai trò', width: 20 },
  { key: 'phone', label: 'Điện thoại', width: 15 },
  { key: 'email', label: 'Email', width: 25 },
  { key: 'joinDate', label: 'Ngày vào làm', width: 15 },
  { key: 'status', label: 'Trạng thái', width: 15 },
]

export const INVENTORY_COLUMNS: ExcelColumn[] = [
  { key: 'id', label: 'Mã phiếu', width: 20 },
  { key: 'date', label: 'Ngày', width: 12 },
  { key: 'type', label: 'Loại', width: 12 },
  { key: 'supplier', label: 'Nhà cung cấp / Lý do', width: 30 },
  { key: 'items', label: 'Số sản phẩm', width: 15 },
  { key: 'total', label: 'Giá trị (VNĐ)', width: 18 },
  { key: 'employee', label: 'Nhân viên', width: 20 },
  { key: 'status', label: 'Trạng thái', width: 18 },
]

