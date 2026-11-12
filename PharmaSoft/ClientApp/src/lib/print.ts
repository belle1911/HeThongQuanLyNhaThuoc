/**
 * print.ts — In tài liệu riêng lẻ (hóa đơn, phiếu trả, báo cáo)
 * mà KHÔNG in sidebar, topbar, dialog backdrop.
 */

/** Mở iframe ẩn, in nội dung HTML hoàn chỉnh, rồi xóa iframe */
export function printHtmlDirect(fullHtml: string): void {
  const frame = document.createElement('iframe')
  // Cung cấp kích thước viewport đầy đủ thay vì 0x0 để Chrome render layout A4 chuẩn xác
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:100%;height:100%;border:0;opacity:0;pointer-events:none;z-index:-9999;'
  frame.setAttribute('aria-hidden', 'true')
  document.body.appendChild(frame)

  const doc = frame.contentDocument || frame.contentWindow?.document
  if (!doc) return

  doc.open()
  doc.write(fullHtml)
  doc.close()

  let printed = false
  const runPrint = () => {
    if (printed) return
    printed = true
    try {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
    } catch (e) {
      console.error('[print error]', e)
    } finally {
      setTimeout(() => {
        if (frame.parentNode) {
          frame.parentNode.removeChild(frame)
        }
      }, 4000)
    }
  }

  frame.onload = runPrint
  setTimeout(runPrint, 300)
}

/** In phần tử theo className (lấy phần tử đầu tiên khớp) */
export function printElement(className: string): void {
  const el = document.querySelector(`.${className}`) as HTMLElement | null
  if (!el) {
    console.warn(`[print] Không tìm thấy .${className}`)
    return
  }
  printHtml(el.outerHTML, className)
}

/** In phần tử theo id */
export function printElementById(id: string): void {
  const el = document.getElementById(id) as HTMLElement | null
  if (!el) {
    console.warn(`[print] Không tìm thấy #${id}`)
    return
  }
  printHtml(el.outerHTML, id)
}

/** Mở iframe ẩn, in nội dung HTML có kèm styles của app */
function printHtml(html: string, label: string): void {
  const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((l) => l.outerHTML)
    .join('\n')

  const inlineStyles = Array.from(document.querySelectorAll('style'))
    .map((s) => `<style>${s.textContent}</style>`)
    .join('\n')

  const fullDoc = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8">
      <title>PHARMASOFT — ${label}</title>
      ${styleLinks}
      ${inlineStyles}
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { margin: 0; padding: 0; font-family: 'Be Vietnam Pro', Arial, sans-serif; color: #18241e; background: white; }
        .icon-button, .dialog__footer, button, .inventory-detail-actions,
        .simulate-fail { display: none !important; }
        .dialog, .invoice-management-detail, .return-detail-dialog,
        .report-module, .print-invoice-managed, .print-return, .print-invoice {
          position: static !important;
          width: 100% !important;
          max-width: 100% !important;
          border: none !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          margin: 0 !important;
          padding: 10px !important;
        }
        .managed-invoice-parties { display: flex; gap: 20px; margin-bottom: 16px; }
        .managed-invoice-items table { width: 100%; border-collapse: collapse; }
        .managed-invoice-items th, .managed-invoice-items td {
          border: 1px solid #ddd; padding: 6px 10px; font-size: 11px; text-align: left;
        }
        .managed-invoice-items thead th { background: #e8f5e9; font-weight: 700; color: #16834a; }
        .managed-invoice-total { margin-top: 12px; text-align: right; }
        .managed-invoice-total > div { display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0; }
        .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #16834a; padding-bottom: 12px; }
        .print-header h1 { color: #16834a; font-size: 18px; margin: 0 0 4px; }
        .print-header p { color: #666; font-size: 10px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h1>🏥 PHARMASOFT — Hệ thống quản lý nhà thuốc</h1>
        <p>In lúc ${new Date().toLocaleString('vi-VN')} • Tài liệu nội bộ, bảo mật</p>
      </div>
      ${html}
    </body>
    </html>
  `
  printHtmlDirect(fullDoc)
}

/** In hóa đơn đơn hàng khách hàng (DemoOrder) */
export function printOrderInvoice(order: {
  id: string
  invoiceId: string
  createdAt: string
  customerName: string
  phone: string
  address: string
  orderStatus: string
  paymentMethod: string
  paymentStatus: string
  transactionId?: string
  subtotal: number
  discount: number
  promotionCode?: string
  shippingFee: number
  surcharge: number
  total: number
  items: Array<{
    productId: string
    name: string
    image?: string
    unit: string
    quantity: number
    unitPrice: number
    discount: number
    lineTotal: number
  }>
}): void {
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Hóa đơn ${order.invoiceId}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Be Vietnam Pro', Arial, sans-serif; color: #18241e; margin: 0; padding: 0; font-size: 13px; line-height: 1.5; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #16834a; padding-bottom: 12px; margin-bottom: 16px; }
    .brand h1 { margin: 0; font-size: 20px; color: #16834a; letter-spacing: 0.5px; }
    .brand p { margin: 3px 0 0; color: #666; font-size: 11px; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { margin: 0; font-size: 18px; color: #16834a; }
    .invoice-title .meta { color: #666; font-size: 11px; margin-top: 4px; }
    .notice { background: #fff8e6; border: 1px solid #ffd591; border-radius: 6px; padding: 8px 12px; font-size: 11px; color: #874d00; margin-bottom: 16px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
    .party-box { background: #f8faf9; border: 1px solid #e3e9e5; border-radius: 6px; padding: 12px; }
    .party-box small { font-size: 10px; color: #7f8c85; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
    .party-box strong { font-size: 13px; color: #18241e; display: block; margin-bottom: 4px; }
    .party-box p { margin: 0; font-size: 11px; color: #526159; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #e8f5ed; color: #16834a; font-weight: 700; font-size: 11px; text-transform: uppercase; padding: 9px 8px; border: 1px solid #cce3d4; text-align: left; }
    td { padding: 9px 8px; border: 1px solid #e1e7e3; font-size: 12px; }
    tr:nth-child(even) td { background: #fafcfb; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .product-photo { width: 38px; height: 38px; object-fit: contain; vertical-align: middle; margin-right: 8px; }
    .product-photo-fallback { display: inline-grid; width: 38px; height: 38px; place-items: center; vertical-align: middle; margin-right: 8px; border-radius: 5px; background: #e8f5ed; color: #16834a; font-size: 8px; font-weight: 700; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 20px; }
    .totals-table { width: 340px; }
    .totals-table div { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #526159; }
    .totals-table .grand-total { border-top: 2px solid #16834a; margin-top: 6px; padding-top: 8px; font-size: 16px; font-weight: 700; color: #16834a; }
    .audit { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f8faf9; border: 1px solid #e3e9e5; border-radius: 6px; padding: 10px 14px; margin-bottom: 24px; font-size: 11px; }
    .audit small { font-size: 9px; color: #7f8c85; font-weight: 700; text-transform: uppercase; display: block; }
    .audit strong { font-size: 12px; color: #18241e; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; margin-top: 26px; }
    .sig-block { min-height: 80px; }
    .sig-block span { font-weight: 600; font-size: 12px; display: block; }
    .sig-block small { font-size: 10px; color: #888; font-style: italic; }
    .footer-note { text-align: center; margin-top: 24px; font-size: 10px; color: #888; border-top: 1px dashed #ccc; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>🏥 NHÀ THUỐC PHARMASOFT</h1>
      <p>128 Nguyễn Thị Minh Khai, Quận 3, TP.HCM • Hotline: 1900 6868</p>
    </div>
    <div class="invoice-title">
      <h2>HÓA ĐƠN BÁN HÀNG</h2>
      <div class="meta">Số: <strong>${order.invoiceId}</strong></div>
      <div class="meta">Đơn hàng: ${order.id} • ${order.createdAt}</div>
    </div>
  </div>

  <div class="notice">
    ℹ️ <strong>Trạng thái:</strong> ${order.orderStatus} • Chứng từ quản lý bán lẻ trích xuất từ Hệ thống PharmaSoft.
  </div>

  <div class="parties">
    <div class="party-box">
      <small>ĐƠN VỊ BÁN HÀNG</small>
      <strong>NHÀ THUỐC PHARMASOFT TRUNG TÂM</strong>
      <p>Địa chỉ: 128 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP.HCM</p>
      <p>Dược sĩ tư vấn: DS. Nguyễn Văn An</p>
    </div>
    <div class="party-box">
      <small>THÔNG TIN KHÁCH HÀNG</small>
      <strong>${order.customerName}</strong>
      <p>Điện thoại: ${order.phone}</p>
      <p>Địa chỉ giao: ${order.address || 'Tại quầy'}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:38px" class="text-center">STT</th>
        <th>Sản phẩm</th>
        <th class="text-center" style="width:65px">ĐVT</th>
        <th class="text-right" style="width:95px">Đơn giá</th>
        <th class="text-center" style="width:45px">SL</th>
        <th class="text-center" style="width:55px">Giảm</th>
        <th class="text-right" style="width:115px">Thành tiền</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map((item, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td>${item.image ? `<img class="product-photo" src="${item.image}" alt="${item.name}">` : '<span class="product-photo-fallback">THUỐC</span>'}<strong>${item.name}</strong><br><small style="color:#666">${item.productId}</small></td>
          <td class="text-center">${item.unit}</td>
          <td class="text-right">${Math.round(item.unitPrice).toLocaleString('vi-VN')} đ</td>
          <td class="text-center">${item.quantity}</td>
          <td class="text-center">${item.discount > 0 ? item.discount + '%' : '-'}</td>
          <td class="text-right"><strong>${Math.round(item.lineTotal).toLocaleString('vi-VN')} đ</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-table">
      <div><span>Tổng tiền hàng:</span><strong>${Math.round(order.subtotal).toLocaleString('vi-VN')} đ</strong></div>
      ${order.discount > 0 ? `<div><span>Giảm giá ${order.promotionCode ? '(' + order.promotionCode + ')' : ''}:</span><strong style="color:#cf4b4b">− ${Math.round(order.discount).toLocaleString('vi-VN')} đ</strong></div>` : ''}
      <div><span>Phí vận chuyển:</span><strong>${order.shippingFee > 0 ? Math.round(order.shippingFee).toLocaleString('vi-VN') + ' đ' : 'Miễn phí'}</strong></div>
      ${order.surcharge > 0 ? `<div><span>Phụ phí:</span><strong>${Math.round(order.surcharge).toLocaleString('vi-VN')} đ</strong></div>` : ''}
      <div class="grand-total"><span>TỔNG THANH TOÁN:</span><span>${Math.round(order.total).toLocaleString('vi-VN')} VNĐ</span></div>
    </div>
  </div>

  <div class="audit">
    <div><small>Phương thức TT</small><strong>${order.paymentMethod}</strong></div>
    <div><small>Trạng thái TT</small><strong>${order.paymentStatus}</strong></div>
    <div><small>Mã giao dịch</small><strong>${order.transactionId || 'Chưa phát sinh'}</strong></div>
  </div>

  <div class="signatures">
    <div class="sig-block">
      <span>Khách hàng</span>
      <small>(Ký và ghi rõ họ tên)</small>
    </div>
    <div class="sig-block">
      <span>Dược sĩ bán hàng</span>
      <small>(Ký và ghi rõ họ tên)</small>
    </div>
    <div class="sig-block">
      <span>Người lập phiếu</span>
      <small>(Ký và ghi rõ họ tên)</small>
    </div>
  </div>

  <div class="footer-note">
    Cảm ơn quý khách đã tin dùng sản phẩm của PHARMASOFT! Quý khách vui lòng kiểm tra kỹ hóa đơn và thuốc trước khi rời quầy.
  </div>
</body>
</html>`

  printHtmlDirect(html)
}

/**
 * Tạo nội dung HTML hóa đơn để in
 * (dùng khi muốn custom layout hơn outerHTML)
 */
export function buildInvoiceHtml(invoice: {
  id: string; date: string; time: string
  customer: string; phone: string; employee: string; payment: string; status: string
  items: Array<{ name: string; image?: string; unit: string; price: number; quantity: number; discount: number }>
}): string {
  const rows = invoice.items.map((item) => {
    const subtotal = item.price * item.quantity * (1 - item.discount / 100)
    return `
      <tr>
        <td>${item.image ? `<img src="${item.image}" alt="${item.name}" style="width:38px;height:38px;object-fit:contain;vertical-align:middle;margin-right:8px">` : '<span style="display:inline-grid;width:38px;height:38px;place-items:center;vertical-align:middle;margin-right:8px;border-radius:5px;background:#e8f5ed;color:#16834a;font-size:8px;font-weight:700">THUỐC</span>'}${item.name}</td>
        <td style="text-align:center">${item.unit}</td>
        <td style="text-align:right">${item.price.toLocaleString('vi-VN')}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:center">${item.discount}%</td>
        <td style="text-align:right"><strong>${subtotal.toLocaleString('vi-VN')} VNĐ</strong></td>
      </tr>`
  }).join('')

  const total = invoice.items.reduce(
    (sum, item) => sum + item.price * item.quantity * (1 - item.discount / 100), 0
  )

  return `
    <div style="border:2px solid #16834a;border-radius:8px;padding:20px;font-size:12px">
      <div style="display:flex;justify-content:space-between;margin-bottom:16px">
        <div>
          <div style="font-size:9px;color:#888;font-weight:700;letter-spacing:1px">MÃ HÓA ĐƠN</div>
          <div style="font-size:18px;font-weight:700;color:#16834a">${invoice.id}</div>
          <div style="color:#666">${invoice.date} • ${invoice.time}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:9px;color:#888;font-weight:700;letter-spacing:1px">NHÂN VIÊN</div>
          <div style="font-weight:600">${invoice.employee}</div>
          <div style="color:#666">${invoice.payment}</div>
        </div>
      </div>
      <div style="background:#f7fbf8;border-radius:6px;padding:12px;margin-bottom:16px">
        <div style="font-size:9px;color:#888;font-weight:700;letter-spacing:1px;margin-bottom:4px">KHÁCH HÀNG</div>
        <div style="font-weight:700;font-size:14px">${invoice.customer}</div>
        <div style="color:#666">${invoice.phone}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
        <thead>
          <tr style="background:#e8f5e9">
            <th style="border:1px solid #ddd;padding:8px;text-align:left">Sản phẩm</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:center">ĐVT</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:right">Đơn giá</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:center">SL</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:center">CK</th>
            <th style="border:1px solid #ddd;padding:8px;text-align:right">Thành tiền</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="text-align:right;border-top:2px solid #16834a;padding-top:12px">
        <div style="font-size:11px;color:#666;margin-bottom:4px">Tổng cộng</div>
        <div style="font-size:22px;font-weight:700;color:#16834a">${total.toLocaleString('vi-VN')} VNĐ</div>
      </div>
      <div style="text-align:center;margin-top:20px;color:#999;font-size:9px;border-top:1px dashed #ddd;padding-top:10px">
        Cảm ơn quý khách đã tin tưởng sử dụng dịch vụ của chúng tôi!<br>
        PHARMASOFT • Hệ thống quản lý nhà thuốc chuyên nghiệp
      </div>
    </div>`
}

/** In sao kê / Báo cáo tài chính, tồn kho, kinh doanh theo chuẩn A4 */
export function printReportStatement(report: {
  title: string
  subtitle: string
  period: string
  kpis?: Array<{ label: string; value: string; change?: string }>
  headers: string[]
  rows: string[][]
}): void {
  const kpiHtml = report.kpis && report.kpis.length > 0 ? `
    <div style="display:grid;grid-template-columns:repeat(${Math.min(report.kpis.length, 4)}, 1fr);gap:12px;margin-bottom:18px">
      ${report.kpis.map(k => `
        <div style="background:#f8faf9;border:1px solid #dce4df;border-radius:6px;padding:10px 12px">
          <small style="font-size:10px;color:#708076;text-transform:uppercase;font-weight:700;display:block">${k.label}</small>
          <strong style="font-size:15px;color:#18241e;display:block;margin:4px 0">${k.value}</strong>
          ${k.change ? `<span style="font-size:10px;color:#16834a">${k.change}</span>` : ''}
        </div>
      `).join('')}
    </div>
  ` : ''

  const rowsHtml = report.rows.map((row, idx) => `
    <tr style="${idx % 2 === 1 ? 'background:#fafcfb;' : ''}">
      <td style="border:1px solid #dfe5e1;padding:8px 10px;text-align:center;width:40px">${idx + 1}</td>
      ${row.map((cell, cIdx) => `
        <td style="border:1px solid #dfe5e1;padding:8px 10px;font-size:11px;${cIdx === 0 ? 'font-weight:600;' : ''}${cIdx >= 2 ? 'text-align:right;' : ''}">
          ${cell}
        </td>
      `).join('')}
    </tr>
  `).join('')

  const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${report.title} — PHARMASOFT</title>
  <style>
    @page { size: A4 portrait; margin: 15mm 12mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Be Vietnam Pro', Arial, sans-serif; color: #18241e; margin: 0; padding: 0; font-size: 12px; line-height: 1.5; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #16834a; padding-bottom: 12px; margin-bottom: 16px; }
    .brand h1 { margin: 0; font-size: 18px; color: #16834a; }
    .brand p { margin: 2px 0 0; color: #666; font-size: 10px; }
    .meta { text-align: right; }
    .meta h2 { margin: 0; font-size: 16px; color: #16834a; }
    .meta p { margin: 2px 0 0; color: #666; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 20px; }
    th { background: #e8f5ed; color: #16834a; font-weight: 700; font-size: 11px; text-transform: uppercase; padding: 9px 8px; border: 1px solid #cce3d4; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; margin-top: 35px; page-break-inside: avoid; }
    .sig-block { min-height: 90px; }
    .sig-block strong { display: block; font-size: 12px; margin-bottom: 4px; }
    .sig-block small { font-size: 10px; color: #888; font-style: italic; }
    .footer-note { text-align: center; margin-top: 30px; font-size: 9px; color: #888; border-top: 1px dashed #ccc; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>🏥 NHÀ THUỐC PHARMASOFT</h1>
      <p>128 Nguyễn Thị Minh Khai, P.6, Q.3, TP.HCM • Hotline: 1900 6868</p>
    </div>
    <div class="meta">
      <h2>${report.title.toUpperCase()}</h2>
      <p>Kỳ báo cáo: <strong>${report.period}</strong></p>
      <p>Trích xuất lúc: ${new Date().toLocaleString('vi-VN')}</p>
    </div>
  </div>

  <div style="background:#f4f9f6;border-left:4px solid #16834a;padding:8px 12px;margin-bottom:14px;font-size:11px">
    <strong>Ghi chú:</strong> ${report.subtitle}. Báo cáo số liệu chính thức phục vụ quản trị và sao kê nhà thuốc.
  </div>

  ${kpiHtml}

  <table>
    <thead>
      <tr>
        <th style="width:40px">STT</th>
        ${report.headers.map(h => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="signatures">
    <div class="sig-block">
      <strong>Người lập báo cáo</strong>
      <small>(Ký và ghi rõ họ tên)</small>
    </div>
    <div class="sig-block">
      <strong>Kế toán trưởng</strong>
      <small>(Ký và ghi rõ họ tên)</small>
    </div>
    <div class="sig-block">
      <strong>Giám đốc nhà thuốc</strong>
      <small>(Ký, đóng dấu)</small>
    </div>
  </div>

  <div class="footer-note">
    PHARMASOFT — Hệ thống Quản trị & Bán lẻ Dược phẩm • Bản in sao kê chính thức
  </div>
</body>
</html>`

  printHtmlDirect(fullHtml)
}
