import { currentActor, usePersistentState } from '@/lib/persist'
import { FormEvent, useMemo, useRef, useState } from 'react'
import { Badge, Button, Icon } from './App'
import { printElement } from '@/lib/print'
import { evaluatePromotion, initialPromotions, markPromotionUsed } from '@/lib/promotions'
import { initialsOf, nowTimeVN, todayVN } from '@/lib/today'
import { DemoOrder, DemoProduct, deriveStatus, isExpired, useDemoCommerce } from './DemoCommerce'
import { ProductImage } from './ProductImage'

// POS dùng chung danh sách thuốc và tồn kho với Quản lý thuốc và Cửa hàng online (commerce.products)
type Product = DemoProduct
type CartItem = Product & { quantity: number; discount: number }
type Customer = { id: string; name: string; phone: string; level: string; points: number }
type PaymentMethod = 'Tiền mặt' | 'Chuyển khoản' | 'Thanh toán QR'

const initialCustomers: Customer[] = [
  { id: 'KH-008642', name: 'Nguyễn Thị Hồng', phone: '0903 182 456', level: 'Vàng', points: 2840 },
  { id: 'KH-008641', name: 'Trần Tuấn Kiệt', phone: '0987 443 220', level: 'Bạc', points: 1260 },
  { id: 'KH-008640', name: 'Hoàng Mai Anh', phone: '0912 675 889', level: 'Kim cương', points: 6520 },
]
const money = (value: number) => `${Math.round(value).toLocaleString('vi-VN')} VNĐ`

export function SalesPOS() {
  const commerce = useDemoCommerce()
  const products = commerce.products
  const [cart, setCart] = useState<CartItem[]>([])
  const [query, setQuery] = useState('')
  const [barcode, setBarcode] = useState('')
  const [category, setCategory] = useState('Tất cả')
  const [customers, setCustomers] = usePersistentState('pos-customers', initialCustomers)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerOpen, setCustomerOpen] = useState(false)
  const [payment, setPayment] = useState<PaymentMethod>('Tiền mặt')
  const [paid, setPaid] = useState('')
  const [promoCode, setPromoCode] = useState('')
  // Chỉ lưu mã đã áp dụng; số tiền giảm được tính lại mỗi khi giỏ hàng thay đổi
  const [appliedCode, setAppliedCode] = useState<string | null>(null)
  const [promotions, setPromotions] = usePersistentState('promotions', initialPromotions)
  const [dialog, setDialog] = useState<'customer' | 'confirm' | 'success' | 'failure' | 'cancel' | null>(null)
  const [toast, setToast] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [soldAt, setSoldAt] = useState('')
  // Số tiền chốt tại thời điểm thanh toán (không đổi dù khuyến mãi sau đó hết lượt)
  const [receipt, setReceipt] = useState({ beforeDiscount: 0, discount: 0, total: 0, paid: 0, change: 0 })
  const barcodeRef = useRef<HTMLInputElement>(null)
  // Nhân viên bán hàng = tài khoản đang đăng nhập
  const seller = currentActor()
  function getImage(product: Product) {
    return product.image
  }
  // Danh mục lấy từ danh sách thuốc thực tế
  const categories = useMemo(() => ['Tất cả', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))], [products])
  const filtered = useMemo(() => products.filter(p => (p.name.toLowerCase().includes(query.toLowerCase()) || p.id.toLowerCase().includes(query.toLowerCase()) || p.barcode.includes(query)) && (category === 'Tất cả' || p.category === category)), [products, query, category])
  const beforeDiscount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemDiscount = cart.reduce((sum, item) => sum + item.price * item.quantity * item.discount / 100, 0)
  const promoResult = appliedCode ? evaluatePromotion(promotions, appliedCode, cart.map(item => ({ price: item.price, quantity: item.quantity, category: item.category }))) : null
  const promotion = promoResult?.ok ? promoResult : null
  const promoAmount = promotion?.amount || 0
  const total = Math.max(0, beforeDiscount - itemDiscount - promoAmount)
  const paidNumber = Number(paid.replace(/\D/g, '')) || 0
  const change = Math.max(0, paidNumber - total)

  function notify(text: string) { setToast(text); window.setTimeout(() => setToast(''), 2800) }
  function addProduct(product: Product) {
    if (isExpired(product.expiry)) { notify('Không thể bán thuốc thuộc lô đã hết hạn'); return }
    if (product.stock <= 0) { notify('Sản phẩm đã hết hàng'); return }
    const current = cart.find(item => item.id === product.id)
    if (current && current.quantity >= product.stock) { notify(`Tồn kho chỉ còn ${product.stock} ${product.unit}`); return }
    const image = getImage(product)
    setCart(current ? cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...cart, { ...product, image, quantity: 1, discount: 0 }])
    notify(`Đã thêm ${product.name}`)
  }
  function updateQuantity(id: string, next: number) {
    const product = products.find(p => p.id === id); if (!product) return
    if (next < 1) { setCart(cart.filter(item => item.id !== id)); return }
    if (next > product.stock) { notify(`Không thể bán quá ${product.stock} ${product.unit} đang tồn kho`); return }
    setCart(cart.map(item => item.id === id ? { ...item, quantity: next } : item))
  }
  function scan(event: FormEvent) {
    event.preventDefault(); const product = products.find(p => p.barcode === barcode.trim())
    if (product) addProduct(product); else notify('Không tìm thấy sản phẩm với mã vạch này')
    setBarcode(''); barcodeRef.current?.focus()
  }
  function applyPromotion() {
    if (!promoCode.trim()) { notify('Vui lòng nhập mã khuyến mãi'); return }
    const result = evaluatePromotion(promotions, promoCode, cart.map(item => ({ price: item.price, quantity: item.quantity, category: item.category })))
    if (result.ok) { setAppliedCode(result.code); notify('Áp dụng khuyến mãi thành công') }
    else notify(result.message)
  }
  function quickPay(value: number) { setPaid(String(value)) }
  function checkout() {
    if (cart.length === 0) { notify('Vui lòng thêm sản phẩm vào giỏ hàng'); return }
    if (payment === 'Tiền mặt' && paidNumber < total) { setDialog('failure'); return }
    setDialog('confirm')
  }
  function completePayment() {
    // Kiểm tra lại ngay trước khi thanh toán: tồn kho có thể đã đổi (đơn online, nhập/xuất kho...)
    for (const item of cart) {
      const current = products.find(p => p.id === item.id)
      if (!current) { notify(`${item.name} không còn trong danh mục thuốc`); setDialog(null); return }
      if (isExpired(current.expiry)) { notify(`${item.name} đã hết hạn, vui lòng xóa khỏi đơn`); setDialog(null); return }
      if (item.quantity > current.stock) { notify(`${item.name} chỉ còn ${current.stock} ${current.unit} trong kho`); setDialog(null); return }
    }

    // Mã đơn/hóa đơn duy nhất: ngày (giờ máy) + 6 số cuối của mốc thời gian, tránh trùng với đơn đã có
    const now = new Date()
    const day = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    let stamp = now.getTime()
    while (commerce.orders.some(o => o.id === `DH${day}-${String(stamp).slice(-6)}` || o.invoiceId === `HD${day}-${String(stamp).slice(-6)}`)) stamp++
    const genInvoiceNo = `HD${day}-${String(stamp).slice(-6)}`
    const orderId = `DH${day}-${String(stamp).slice(-6)}`
    const nowStr = now.toLocaleString('vi-VN')
    setSoldAt(`${todayVN(now)} • ${nowTimeVN(now)}`)
    setReceipt({ beforeDiscount, discount: itemDiscount + promoAmount, total, paid: payment === 'Tiền mặt' ? paidNumber : total, change })

    commerce.setProducts(current => current.map(p => { const item = cart.find(c => c.id === p.id); if (!item) return p; const stock = p.stock - item.quantity; return { ...p, stock, status: deriveStatus({ ...p, stock }) } }))
    setInvoiceNo(genInvoiceNo)

    const posOrder: DemoOrder = {
      id: orderId,
      invoiceId: genInvoiceNo,
      customerId: customer?.id || 'KL-WALKIN',
      customerName: customer?.name || 'Khách lẻ',
      phone: customer?.phone || '—',
      address: 'Mua trực tiếp tại Nhà thuốc PHARMASOFT',
      note: `Bán tại quầy POS • ${payment}`,
      createdAt: nowStr,
      items: cart.map(item => ({
        productId: item.id,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.price,
        discount: item.discount,
        lineTotal: Math.round(item.price * item.quantity * (1 - item.discount / 100))
      })),
      subtotal: beforeDiscount,
      promotionCode: promotion?.code || '',
      discount: itemDiscount + promoAmount,
      shippingFee: 0,
      surcharge: 0,
      total: total,
      paymentMethod: payment === 'Tiền mặt' ? 'Tiền mặt' : payment === 'Chuyển khoản' ? 'Chuyển khoản' : 'Thanh toán QR',
      paymentStatus: 'Đã thanh toán',
      orderStatus: 'Hoàn tất',
      transactionId: `GD${String(stamp).slice(-10)}`,
      employee: seller,
      timeline: [
        { time: nowStr, label: 'Thanh toán thành công tại quầy POS', actor: seller },
        { time: nowStr, label: 'Đã xuất hóa đơn và trừ tồn kho', actor: 'Hệ thống PHARMASOFT' }
      ]
    }
    commerce.addOrder(posOrder)
    if (promotion) setPromotions(markPromotionUsed(promotions, promotion.code))
    setDialog('success')
  }
  function newOrder() { setCart([]); setCustomer(null); setPayment('Tiền mặt'); setPaid(''); setAppliedCode(null); setPromoCode(''); setDialog(null) }
  const paymentIcon = (method: PaymentMethod) => method === 'Tiền mặt' ? 'invoice' : method === 'Chuyển khoản' ? 'activity' : 'grid'

  return <div className="pos-module">
    <section className="pos-workspace">
      <div className="pos-catalog card">
        <div className="pos-catalog-header"><div><h2>Chọn sản phẩm</h2><p>{filtered.length} sản phẩm khả dụng</p></div><form className="barcode-form" onSubmit={scan}><Icon name="grid" size={17} /><input ref={barcodeRef} value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Quét hoặc nhập mã vạch..." /><button>Thêm</button></form></div>
        <div className="pos-search-row"><div className="table-search pos-search"><Icon name="search" size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm theo tên, mã thuốc, hoạt chất..." /></div><span><Icon name="archive" size={15} /> Tồn kho được cập nhật tức thời</span></div>
        <div className="pos-categories">{categories.map(item => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className="pos-products">{filtered.map(product => <button className={`pos-product ${isExpired(product.expiry) ? 'expired' : ''}`} key={product.id} onClick={() => addProduct(product)}><ProductImage className="medicine-product-image" name={product.name} image={getImage(product)} color={product.color}/><div className="pos-product-info"><strong>{product.name}</strong><small>Mã thuốc: {product.id}</small><small>Barcode: {product.barcode}</small><b>{money(product.price)}</b></div><div className="pos-product-meta"><span className={product.stock <= 10 ? 'low' : ''}>{product.stock} {product.unit}</span><small>HSD: {product.expiry}</small></div>{isExpired(product.expiry) && <em>ĐÃ HẾT HẠN</em>}<span className="pos-add"><Icon name="plus" size={14} /></span></button>)}</div>
        {filtered.length === 0 && <div className="pos-empty"><Icon name="search" /><strong>Không tìm thấy sản phẩm</strong><span>Thử từ khóa hoặc danh mục khác.</span></div>}
      </div>

      <aside className="pos-cart card">
        <div className="pos-cart-header"><div><span><Icon name="cart" /></span><div><h2>Đơn hàng hiện tại</h2><p>{cart.reduce((a, b) => a + b.quantity, 0)} sản phẩm</p></div></div><button onClick={() => cart.length && setDialog('cancel')} disabled={!cart.length}>Hủy đơn</button></div>
        <div className="pos-employee"><span className="avatar">{initialsOf(seller)}</span><div><small>NHÂN VIÊN BÁN HÀNG</small><strong>{seller}</strong></div><Badge kind="ok">{new Date().getHours() < 12 ? 'Ca sáng' : new Date().getHours() < 18 ? 'Ca chiều' : 'Ca tối'}</Badge></div>
        <div className="pos-customer-wrap">
          <button className="pos-customer-select" onClick={() => setCustomerOpen(!customerOpen)}><span><Icon name="customers" /></span><div>{customer ? <><small>{customer.id} • Hạng {customer.level}</small><strong>{customer.name}</strong><em>{customer.phone} • {customer.points.toLocaleString('vi-VN')} điểm</em></> : <><small>KHÁCH HÀNG</small><strong>Khách lẻ</strong><em>Chọn khách hàng để tích điểm</em></>}</div><Icon name="chevron" size={15} /></button>
          {customerOpen && <div className="customer-picker"><div className="table-search"><Icon name="search" size={15} /><input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Tìm tên hoặc số điện thoại..." /></div><button className="walk-in" onClick={() => { setCustomer(null); setCustomerOpen(false) }}><span>KL</span><div><strong>Khách lẻ</strong><small>Không lưu thông tin</small></div></button>{customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)).map(c => <button key={c.id} onClick={() => { setCustomer(c); setCustomerOpen(false) }}><span>{c.name.split(' ').slice(-2).map(x => x[0]).join('')}</span><div><strong>{c.name}</strong><small>{c.phone} • {c.level}</small></div><b>{c.points.toLocaleString('vi-VN')}đ</b></button>)}<button className="add-customer-link" onClick={() => { setCustomerOpen(false); setDialog('customer') }}><Icon name="plus" size={14} />Thêm khách hàng mới</button></div>}
        </div>

        <div className="cart-column-labels"><span>SẢN PHẨM</span><span>SL</span><span>THÀNH TIỀN</span></div>
        <div className="cart-items">{cart.length === 0 ? <div className="cart-empty"><span><Icon name="cart" size={25} /></span><strong>Chưa có sản phẩm</strong><small>Tìm kiếm hoặc quét mã vạch để thêm thuốc vào đơn hàng.</small></div> : cart.map(item => <article className="cart-item" key={item.id}><div className="cart-item-main"><ProductImage className="medicine-product-image" name={item.name} image={item.image} color={item.color}/><div><strong>{item.name}</strong><small>{item.id} • {item.unit} • {money(item.price)}</small></div><button onClick={() => setCart(cart.filter(x => x.id !== item.id))}><Icon name="close" size={14} /></button></div><div className="cart-item-controls"><div className="quantity-stepper"><button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button><input value={item.quantity} onChange={e => updateQuantity(item.id, Number(e.target.value) || 1)} /><button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button></div><label>Giảm<select value={item.discount} onChange={e => setCart(cart.map(x => x.id === item.id ? { ...x, discount: Number(e.target.value) } : x))}><option value={0}>0%</option><option value={5}>5%</option><option value={10}>10%</option></select></label><strong>{money(item.price * item.quantity * (1 - item.discount / 100))}</strong></div></article>)}</div>

        <div className="pos-promotion"><div><Icon name="percent" size={16} /><input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="Nhập mã khuyến mãi" /><button onClick={applyPromotion}>Áp dụng</button></div>{promotion && <span><Icon name="check" size={13} /><b>{promotion.code}</b> – {promotion.label}<button onClick={() => setAppliedCode(null)}><Icon name="close" size={12} /></button></span>}{promoResult && !promoResult.ok && <span className="field__error"><b>{promoResult.code}</b> – Chưa được giảm: {promoResult.message}<button onClick={() => setAppliedCode(null)}><Icon name="close" size={12} /></button></span>}</div>
        <div className="cart-totals"><div><span>Tổng tiền hàng</span><strong>{money(beforeDiscount)}</strong></div><div><span>Giảm giá sản phẩm</span><strong className="discount">− {money(itemDiscount)}</strong></div><div><span>Khuyến mãi</span><strong className="discount">− {money(promoAmount)}</strong></div><div className="cart-final"><span>Khách cần trả</span><strong>{money(total)}</strong></div></div>
        <div className="payment-methods"><small>PHƯƠNG THỨC THANH TOÁN</small><div>{(['Tiền mặt', 'Chuyển khoản', 'Thanh toán QR'] as PaymentMethod[]).map(method => <button key={method} className={payment === method ? 'active' : ''} onClick={() => { setPayment(method); if (method !== 'Tiền mặt') setPaid(String(total)) }}><Icon name={paymentIcon(method)} /><span>{method}</span>{payment === method && <i><Icon name="check" size={10} /></i>}</button>)}</div></div>
        {payment === 'Tiền mặt' ? <div className="cash-payment"><label><span>Tiền khách đưa</span><div><input value={paid} onChange={e => setPaid(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="0" /><b>VNĐ</b></div></label><div className="quick-cash">{[total, Math.ceil(total / 100000) * 100000, 500000, 1000000].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map(v => <button key={v} onClick={() => quickPay(v)}>{v === total ? 'Đủ tiền' : `${(v / 1000).toLocaleString('vi-VN')}k`}</button>)}</div><div className="change-row"><span>Tiền thừa trả khách</span><strong>{money(change)}</strong></div></div> : <div className="digital-payment-note"><Icon name={payment === 'Thanh toán QR' ? 'grid' : 'activity'} /><div><strong>{payment === 'Thanh toán QR' ? 'Mã QR sẽ hiển thị khi xác nhận' : 'Thông tin chuyển khoản sẽ hiển thị khi xác nhận'}</strong><span>Giao dịch thanh toán đang được mô phỏng trong prototype.</span></div></div>}
        <button className="checkout-button" disabled={!cart.length} onClick={checkout}><span><Icon name="check" />Xác nhận thanh toán</span><strong>{money(total)}</strong></button>
      </aside>
    </section>

    {dialog === 'customer' && <NewCustomerDialog onClose={() => setDialog(null)} onSave={newCustomer => { setCustomers([newCustomer, ...customers]); setCustomer(newCustomer); setDialog(null); notify('Đã thêm và chọn khách hàng mới') }} />}
    {dialog === 'cancel' && <div className="dialog-layer"><section className="confirm-dialog"><span className="confirm-icon red"><Icon name="close" /></span><h2>Hủy đơn hàng hiện tại?</h2><p>Toàn bộ {cart.length} sản phẩm và thông tin thanh toán trong đơn sẽ bị xóa.</p><div><Button variant="secondary" onClick={() => setDialog(null)}>Tiếp tục bán</Button><button className="danger-button" onClick={newOrder}>Hủy đơn hàng</button></div></section></div>}
    {dialog === 'failure' && <div className="dialog-layer"><section className="payment-result failure"><span><Icon name="close" size={28} /></span><h2>Thanh toán chưa thành công</h2><p>{payment === 'Tiền mặt' ? 'Số tiền khách đưa chưa đủ để hoàn tất đơn hàng.' : 'Giao dịch bị từ chối hoặc quá thời gian xác nhận.'}</p><div className="failure-detail"><span>Số tiền cần thanh toán</span><strong>{money(total)}</strong>{payment === 'Tiền mặt' && <><span>Còn thiếu</span><strong>{money(total - paidNumber)}</strong></>}</div><Button onClick={() => setDialog(null)}>Kiểm tra lại thanh toán</Button></section></div>}
    {dialog === 'confirm' && <PaymentConfirm method={payment} total={total} paid={paidNumber} change={change} itemCount={cart.reduce((a, b) => a + b.quantity, 0)} onClose={() => setDialog(null)} onConfirm={completePayment} onFail={() => setDialog('failure')} />}
    {dialog === 'success' && <InvoiceSuccess invoiceNo={invoiceNo} soldAt={soldAt} seller={seller} cart={cart} customer={customer} payment={payment} beforeDiscount={receipt.beforeDiscount} discount={receipt.discount} total={receipt.total} paid={receipt.paid} change={receipt.change} onNew={newOrder} onPrint={() => printElement('print-invoice')} onDownload={() => { printElement('print-invoice'); notify('Đang mở hộp thoại lưu PDF...') }} />}
    {toast && <div className="toast"><span><Icon name="check" /></span><div><strong>{toast}</strong><small>Thao tác đã được cập nhật trong đơn hàng.</small></div><button onClick={() => setToast('')}><Icon name="close" /></button></div>}
  </div>
}

function NewCustomerDialog({ onClose, onSave }: { onClose: () => void; onSave: (c: Customer) => void }) {
  const [error, setError] = useState(''); function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const d = new FormData(e.currentTarget); const name = String(d.get('name') || ''); const phone = String(d.get('phone') || ''); if (!name) return setError('Vui lòng nhập họ và tên.'); if (!/^(0|\+84)[0-9\s]{8,12}$/.test(phone)) return setError('Số điện thoại không đúng định dạng.'); onSave({ id: `KH-00${8650 + Math.floor(Math.random() * 30)}`, name, phone, level: 'Thành viên', points: 0 }) }
  return <div className="dialog-layer"><section className="dialog new-customer-dialog"><div className="dialog__header"><div><div className="eyebrow">KHÁCH HÀNG MỚI</div><h2>Thêm nhanh khách hàng</h2><p>Khách hàng sẽ được chọn cho đơn hiện tại sau khi lưu.</p></div><button className="icon-button" onClick={onClose}><Icon name="close" /></button></div><form onSubmit={submit}><div className="form-grid"><label className="field field--wide"><span>Họ và tên *</span><input name="name" placeholder="Nguyễn Văn An" autoFocus /></label><label className="field field--wide"><span>Số điện thoại *</span><input name="phone" placeholder="0901 234 567" />{error && <small className="field__error">{error}</small>}</label><label className="field"><span>Giới tính</span><select><option>Không xác định</option><option>Nữ</option><option>Nam</option></select></label><label className="field"><span>Ngày sinh</span><input placeholder="DD/MM/YYYY" /></label></div><div className="dialog__footer"><Button variant="secondary" onClick={onClose}>Hủy bỏ</Button><Button type="submit">Thêm khách hàng</Button></div></form></section></div>
}

function PaymentConfirm({ method, total, paid, change, itemCount, onClose, onConfirm, onFail }: { method: PaymentMethod; total: number; paid: number; change: number; itemCount: number; onClose: () => void; onConfirm: () => void; onFail: () => void }) {
  return <div className="dialog-layer"><section className="dialog payment-confirm-dialog"><div className="dialog__header"><div><div className="eyebrow">XÁC NHẬN GIAO DỊCH</div><h2>{method}</h2><p>Kiểm tra thông tin trước khi hoàn tất thanh toán.</p></div><button className="icon-button" onClick={onClose}><Icon name="close" /></button></div>{method === 'Thanh toán QR' && <div className="mock-qr"><div className="qr-grid">{Array.from({ length: 64 }, (_, i) => <i key={i} className={(i * 7 + i % 5) % 3 === 0 ? 'on' : ''} />)}</div><span>PHARMASOFT</span><strong>{money(total)}</strong><small>Quét mã bằng ứng dụng ngân hàng</small></div>}{method === 'Chuyển khoản' && <div className="bank-info"><span><Icon name="activity" /></span><div><small>NGÂN HÀNG TMCP NGOẠI THƯƠNG VIỆT NAM</small><strong>1028 668 888</strong><p>PHARMASOFT • Nội dung: THANHTOAN POS</p></div></div>}<div className="payment-confirm-summary"><div><span>Số lượng sản phẩm</span><strong>{itemCount}</strong></div><div><span>Tổng thanh toán</span><strong>{money(total)}</strong></div>{method === 'Tiền mặt' && <><div><span>Khách đưa</span><strong>{money(paid)}</strong></div><div><span>Tiền thừa</span><strong className="green-text">{money(change)}</strong></div></>}</div><div className="payment-simulation-note"><Icon name="help" /><span>Đây là giao dịch mô phỏng. Không có khoản tiền thực nào được xử lý.</span></div><div className="dialog__footer report-footer"><button className="simulate-fail" onClick={onFail}>Mô phỏng thất bại</button><Button variant="secondary" onClick={onClose}>Quay lại</Button><Button icon="check" onClick={onConfirm}>Xác nhận đã thanh toán</Button></div></section></div>
}

function InvoiceSuccess({ invoiceNo, soldAt, seller, cart, customer, payment, beforeDiscount, discount, total, paid, change, onNew, onPrint, onDownload }: { invoiceNo: string; soldAt: string; seller: string; cart: CartItem[]; customer: Customer | null; payment: PaymentMethod; beforeDiscount: number; discount: number; total: number; paid: number; change: number; onNew: () => void; onPrint: () => void; onDownload: () => void }) {
  return <div className="dialog-layer invoice-layer"><section className="payment-success-layout">
    <div className="payment-success-side"><span className="success-check"><Icon name="check" size={32} /></span><h2>Thanh toán thành công</h2><p>Đơn hàng đã được ghi nhận và tồn kho đã được cập nhật.</p><div><small>MÃ HÓA ĐƠN</small><strong>{invoiceNo}</strong></div><div className="success-actions"><Button icon="plus" onClick={onNew}>Tạo đơn hàng mới</Button><Button variant="secondary" icon="file" onClick={onPrint}>In hóa đơn</Button><Button variant="secondary" icon="download" onClick={onDownload}>Tải hóa đơn</Button></div></div>
    <article className="print-invoice"><header><div className="invoice-logo"><span className="brand__mark" /><div><strong>PHARMASOFT</strong><small>NHÀ THUỐC TRUNG TÂM</small></div></div><p>128 Nguyễn Thị Minh Khai, P.6, Q.3, TP.HCM<br />Hotline: 1900 1234 • MST: 0312345678</p><h2>HÓA ĐƠN BÁN HÀNG</h2><span>Số: {invoiceNo}</span></header>
      <div className="invoice-meta"><div><span>Ngày bán</span><strong>{soldAt}</strong></div><div><span>Nhân viên</span><strong>{seller}</strong></div><div><span>Khách hàng</span><strong>{customer?.name || 'Khách lẻ'}</strong></div><div><span>Điện thoại</span><strong>{customer?.phone || '—'}</strong></div></div>
      <table><thead><tr><th>SẢN PHẨM</th><th>SL</th><th>ĐƠN GIÁ</th><th>GIẢM</th><th>THÀNH TIỀN</th></tr></thead><tbody>{cart.map(item => <tr key={item.id}><td className="invoice-product-cell"><ProductImage className="invoice-product-image" name={item.name} image={item.image} color={item.color}/><span><strong>{item.name}</strong><small>{item.id} • {item.unit}</small></span></td><td>{item.quantity}</td><td>{money(item.price)}</td><td>{item.discount}%</td><td>{money(item.price * item.quantity * (1 - item.discount / 100))}</td></tr>)}</tbody></table>
      <div className="invoice-summary"><div><span>Tổng tiền hàng</span><strong>{money(beforeDiscount)}</strong></div><div><span>Tổng giảm giá</span><strong>− {money(discount)}</strong></div><div className="invoice-payable"><span>THANH TOÁN</span><strong>{money(total)}</strong></div><div><span>Phương thức</span><strong>{payment}</strong></div><div><span>Khách đưa</span><strong>{money(paid)}</strong></div>{payment === 'Tiền mặt' && <div><span>Tiền thừa</span><strong>{money(change)}</strong></div>}</div><footer><strong>Cảm ơn Quý khách!</strong><span>Hóa đơn được tạo tự động bởi PHARMASOFT</span></footer>
    </article>
  </section></div>
}
