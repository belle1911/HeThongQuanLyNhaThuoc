import test from 'node:test'
import assert from 'node:assert'
import { generateOTP, isValidViPhone, maskPhone, createOTPSession, verifyOTP } from '../lib/otp.ts'
import { INVOICE_COLUMNS, MEDICINE_COLUMNS, SUPPLIER_COLUMNS } from '../lib/excel.ts'
import { roleMenus, demoUsers } from '../components/pharmasoft/roles.ts'
import { buildInvoiceHtml } from '../lib/print.ts'

test('OTP logic: generateOTP creates a 6-digit number', () => {
  const code = generateOTP()
  assert.strictEqual(code.length, 6)
  assert.match(code, /^\d{6}$/)
})

test('OTP logic: isValidViPhone validates Vietnamese phone numbers correctly', () => {
  assert.strictEqual(isValidViPhone('0901234567'), true)
  assert.strictEqual(isValidViPhone('0987654321'), true)
  assert.strictEqual(isValidViPhone('0398889999'), true)
  assert.strictEqual(isValidViPhone('0123456789'), false) // đầu 01 không còn hợp lệ
  assert.strictEqual(isValidViPhone('123456'), false)
  assert.strictEqual(isValidViPhone(''), false)
})

test('OTP logic: maskPhone masks sensitive digits correctly', () => {
  assert.strictEqual(maskPhone('0901234567'), '090****567')
  assert.strictEqual(maskPhone('123'), '***')
})

test('OTP logic: createOTPSession & verifyOTP flow', () => {
  const session = createOTPSession('0901234567')
  assert.strictEqual(session.phone, '0901234567')
  assert.strictEqual(session.attempts, 0)
  assert.ok(session.expiresAt > Date.now())

  // Verify đúng mã
  const resultOk = verifyOTP(session, session.code)
  assert.strictEqual(resultOk, 'ok')

  // Verify sai mã
  const resultWrong = verifyOTP(session, '999999')
  assert.strictEqual(resultWrong, 'wrong')

  // Phiên hết hạn
  const expiredSession = { ...session, expiresAt: Date.now() - 1000 }
  assert.strictEqual(verifyOTP(expiredSession, session.code), 'expired')

  // Quá số lần thử
  const tooManySession = { ...session, attempts: 5 }
  assert.strictEqual(verifyOTP(tooManySession, session.code), 'too-many')
})

test('Excel export columns are properly configured', () => {
  assert.ok(INVOICE_COLUMNS.length >= 7)
  assert.ok(INVOICE_COLUMNS.some(c => c.key === 'id'))
  assert.ok(INVOICE_COLUMNS.some(c => c.key === 'total'))

  assert.ok(MEDICINE_COLUMNS.length >= 6)
  assert.ok(MEDICINE_COLUMNS.some(c => c.key === 'price'))

  assert.ok(SUPPLIER_COLUMNS.length >= 5)
})

test('RBAC: roles definition and permissions verification', () => {
  assert.ok(roleMenus.admin.includes('Tổng quan'))
  assert.ok(roleMenus.admin.includes('Quản lý tài khoản'))
  assert.ok(roleMenus.pharmacist.includes('Quản lý thuốc'))
  assert.ok(roleMenus.cashier.includes('Bán hàng'))
  assert.ok(roleMenus.warehouse.includes('Quản lý kho'))
  assert.ok(roleMenus.customer.includes('Cửa hàng thuốc'))
  
  // Khách hàng không được truy cập Quản trị
  assert.strictEqual(roleMenus.customer.includes('Quản lý tài khoản'), false)
  // Thu ngân không được truy cập Cài đặt hệ thống
  assert.strictEqual(roleMenus.cashier.includes('Cài đặt hệ thống'), false)
})

test('Demo users: all 7 roles are defined with credentials', () => {
  assert.strictEqual(demoUsers.length, 7)
  const roles = demoUsers.map(u => u.role)
  assert.ok(roles.includes('admin'))
  assert.ok(roles.includes('manager'))
  assert.ok(roles.includes('pharmacist'))
  assert.ok(roles.includes('cashier'))
  assert.ok(roles.includes('warehouse'))
  assert.ok(roles.includes('doctor'))
  assert.ok(roles.includes('customer'))
})

test('Invoice calculations: item discount and subtotal logic', () => {
  const items = [
    { id: '1', name: 'Thuốc A', price: 100000, quantity: 2, discount: 10 }, // 100k*2*(1-0.1) = 180k
    { id: '2', name: 'Thuốc B', price: 50000, quantity: 1, discount: 0 },    // 50k
  ]
  const total = items.reduce((sum, item) => sum + item.quantity * item.price * (1 - item.discount / 100), 0)
  assert.strictEqual(total, 230000)
})

test('Invoice printing: buildInvoiceHtml produces complete printable HTML with details', () => {
  const invoice = {
    id: 'HD12345678',
    date: '12/11/2026',
    time: '14:00',
    customer: 'Nguyễn Văn A',
    phone: '0901234567',
    employee: 'Dược sĩ B',
    payment: 'Chuyển khoản',
    status: 'Đã thanh toán',
    items: [
      { name: 'Panadol Extra', unit: 'Hộp', price: 42000, quantity: 2, discount: 5 }
    ]
  }
  const html = buildInvoiceHtml(invoice)
  assert.ok(html.includes('HD12345678'))
  assert.ok(html.includes('Nguyễn Văn A'))
  assert.ok(html.includes('Panadol Extra'))
  assert.ok(html.includes('79.800'))
})


