import { usePersistentState } from '@/lib/persist'
import { FormEvent, useMemo, useRef, useState } from 'react'
import { Badge, Button, Icon } from './App'
import { DemoProduct, useDemoCommerce } from './DemoCommerce'
import { exportToExcel, MEDICINE_COLUMNS } from '@/lib/excel'

type Medicine = DemoProduct
type Category = { id: string; name: string; count: number; description: string; status: 'Đang sử dụng' | 'Tạm ẩn' }
type Batch = { number: string; manufactured: string; expiry: string; quantity: number; purchase: number; supplier: string; status: string }

const initialCategories: Category[] = [
  { id: 'DM001', name: 'Giảm đau – Hạ sốt', count: 128, description: 'Nhóm thuốc hỗ trợ giảm đau và hạ sốt', status: 'Đang sử dụng' },
  { id: 'DM002', name: 'Kháng sinh', count: 86, description: 'Thuốc kê đơn điều trị nhiễm khuẩn', status: 'Đang sử dụng' },
  { id: 'DM003', name: 'Vitamin & khoáng chất', count: 214, description: 'Sản phẩm bổ sung vitamin và khoáng chất', status: 'Đang sử dụng' },
  { id: 'DM004', name: 'Tiêu hóa', count: 156, description: 'Thuốc và sản phẩm hỗ trợ đường tiêu hóa', status: 'Đang sử dụng' },
  { id: 'DM005', name: 'Cảm cúm – Hô hấp', count: 105, description: 'Thuốc không kê đơn cho triệu chứng cảm cúm', status: 'Đang sử dụng' },
  { id: 'DM006', name: 'Da liễu', count: 92, description: 'Thuốc dùng ngoài và sản phẩm chăm sóc da', status: 'Đang sử dụng' },
  { id: 'DM007', name: 'Tim mạch – Huyết áp', count: 74, description: 'Thuốc kê đơn tim mạch và huyết áp', status: 'Tạm ẩn' },
]
const sampleBatches: Batch[] = [
  { number: 'LO-2405A18', manufactured: '18/05/2024', expiry: '18/09/2026', quantity: 126, purchase: 35000, supplier: 'Công ty Dược phẩm GSK Việt Nam', status: 'Đang bán' },
  { number: 'LO-2408B06', manufactured: '06/08/2024', expiry: '06/12/2026', quantity: 98, purchase: 35500, supplier: 'Công ty CP Dược liệu Trung ương 2', status: 'Đang bán' },
  { number: 'LO-2501C12', manufactured: '12/01/2025', expiry: '12/05/2027', quantity: 62, purchase: 36000, supplier: 'Công ty TNHH Zuellig Pharma', status: 'Chờ bán' },
]
const money = (value: number) => `${value.toLocaleString('vi-VN')} VNĐ`

export function MedicineManagement({ initialTab }: { initialTab: 'medicines' | 'categories' }) {
  const [tab, setTab] = useState<'medicines' | 'categories'>(initialTab)
  const {products:medicines,setProducts:setMedicines}=useDemoCommerce()
  const [categories, setCategories] = usePersistentState('categories',initialCategories)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Tất cả danh mục')
  const [stock, setStock] = useState('Tất cả tồn kho')
  const [expiry, setExpiry] = useState('Tất cả hạn dùng')
  const [sort, setSort] = useState('Tên A–Z')
  const [dialog, setDialog] = useState<'medicine-form' | 'detail' | 'delete-medicine' | 'import' | 'category-form' | 'category-detail' | 'delete-category' | 'batch' | null>(null)
  const [selected, setSelected] = useState<Medicine | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [editing, setEditing] = useState(false)
  const [detailTab, setDetailTab] = useState<'info' | 'batches' | 'history'>('info')
  const [toast, setToast] = useState('')
  const [categoryQuery, setCategoryQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const filtered = useMemo(() => {
    const result = medicines.filter(m => (m.name.toLowerCase().includes(query.toLowerCase()) || m.id.toLowerCase().includes(query.toLowerCase()) || m.barcode.includes(query)) &&
      (category === 'Tất cả danh mục' || m.category === category) &&
      (stock === 'Tất cả tồn kho' || (stock === 'Còn hàng' && m.stock > m.minimum) || (stock === 'Sắp hết' && m.stock > 0 && m.stock <= m.minimum) || (stock === 'Hết hàng' && m.stock === 0)) &&
      (expiry === 'Tất cả hạn dùng' || m.status === expiry))
    return [...result].sort((a,b) => sort === 'Tên A–Z' ? a.name.localeCompare(b.name) : sort === 'Giá tăng dần' ? a.price-b.price : sort === 'Giá giảm dần' ? b.price-a.price : sort === 'Tồn kho tăng dần' ? a.stock-b.stock : b.stock-a.stock)
  }, [medicines, query, category, stock, expiry, sort])
  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(categoryQuery.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = useMemo(() => filtered.slice((page-1)*pageSize, page*pageSize), [filtered, page])

  function handleExport(){
    const rows = filtered.map(m => ({
      id: m.id, name: m.name, category: m.category, unit: m.unit,
      stock: m.stock, price: m.price.toLocaleString('vi-VN') + ' VNĐ', expiry: m.expiry, status: m.status
    } as Record<string, unknown>))
    exportToExcel(MEDICINE_COLUMNS, rows, 'danh-sach-thuoc')
    notify('Đang tải file Excel danh mục thuốc...')
  }

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(''), 3000) }
  function openMedicine(medicine: Medicine) { setSelected(medicine); setDetailTab('info'); setDialog('detail') }
  function saveMedicine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const value = (key: string) => String(data.get(key) || '')
    const medicine: Medicine = {
      id: value('id') || `MED-${String(medicines.length + 1).padStart(4,'0')}`, name: value('name'), barcode: value('barcode'), ingredient: value('ingredient'), category: value('category'), unit: value('unit'),
      purchase: Number(value('purchase').replace(/\D/g,'')), price: Number(value('price').replace(/\D/g,'')), stock: selected?.stock || 0, expiry: selected?.expiry || 'Chưa có lô', status: selected?.status || 'Chưa nhập kho',
      manufacturer: value('manufacturer'), origin: value('origin'), form: value('form'), strength: value('strength'), minimum: Number(value('minimum')), description: value('description'), color: selected?.color || 'green',
      listed:selected?.listed??true,featured:selected?.featured??false,newArrival:selected?.newArrival??!editing,discount:selected?.discount||0,prescription:selected?.prescription??value('category').toLowerCase().includes('kháng sinh'),
    }
    setMedicines(editing && selected ? medicines.map(m => m.id === selected.id ? medicine : m) : [medicine, ...medicines])
    setDialog(null); notify(editing ? 'Cập nhật thuốc thành công' : 'Đã thêm thuốc vào danh mục')
  }
  function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const name = String(data.get('name')); const description = String(data.get('description'))
    if (editing && selectedCategory) setCategories(categories.map(c => c.id === selectedCategory.id ? {...c,name,description} : c))
    else setCategories([...categories,{id:`DM${String(categories.length+1).padStart(3,'0')}`,name,count:0,description,status:'Đang sử dụng'}])
    setDialog(null); notify(editing ? 'Cập nhật danh mục thành công' : 'Đã thêm danh mục mới')
  }
  function deleteMedicine() { if (selected) setMedicines(medicines.filter(m => m.id !== selected.id)); setDialog(null); notify('Đã xóa thuốc khỏi danh mục') }
  function deleteCategory() { if (selectedCategory) setCategories(categories.filter(c => c.id !== selectedCategory.id)); setDialog(null); notify('Đã xóa danh mục') }

  return <div className="medicine-module">
    <div className="medicine-tabs"><button className={tab === 'medicines' ? 'active' : ''} onClick={() => setTab('medicines')}><Icon name="package" />Danh sách thuốc <span>{medicines.length}</span></button><button className={tab === 'categories' ? 'active' : ''} onClick={() => setTab('categories')}><Icon name="clipboard" />Danh mục thuốc <span>{categories.length}</span></button></div>
    {tab === 'medicines' ? <>
      <div className="medicine-summary">
        <div className="card"><span className="medicine-stat green"><Icon name="package" /></span><div><small>Tổng sản phẩm</small><strong>1.248</strong><em>8 sản phẩm mới tháng này</em></div></div>
        <div className="card"><span className="medicine-stat amber"><Icon name="archive" /></span><div><small>Sắp hết hàng</small><strong>12</strong><em>Dưới mức tồn tối thiểu</em></div></div>
        <div className="card"><span className="medicine-stat orange"><Icon name="calendar" /></span><div><small>Sắp hết hạn</small><strong>8</strong><em>Trong vòng 60 ngày</em></div></div>
        <div className="card"><span className="medicine-stat red"><Icon name="close" /></span><div><small>Đã hết hạn</small><strong>3</strong><em>Cần xử lý ngay</em></div></div>
      </div>
      <section className="card medicine-table-card">
        <div className="medicine-toolbar-top"><div className="table-search medicine-search"><Icon name="search" size={17} /><input value={query} onChange={e => {setQuery(e.target.value);setPage(1)}} placeholder="Tìm tên, mã thuốc hoặc barcode..." /></div><Button variant="secondary" icon="download" onClick={() => setDialog('import')}>Nhập dữ liệu</Button><Button variant="secondary" icon="file" onClick={handleExport}>Xuất dữ liệu</Button><Button icon="plus" onClick={() => { setSelected(null); setEditing(false); setDialog('medicine-form') }}>Thêm thuốc</Button></div>
        <div className="medicine-filters">
          <select value={category} onChange={e => {setCategory(e.target.value);setPage(1)}}><option>Tất cả danh mục</option>{categories.map(c => <option key={c.id}>{c.name}</option>)}</select>
          <select value={stock} onChange={e => {setStock(e.target.value);setPage(1)}}><option>Tất cả tồn kho</option><option>Còn hàng</option><option>Sắp hết</option><option>Hết hàng</option></select>
          <select value={expiry} onChange={e => {setExpiry(e.target.value);setPage(1)}}><option>Tất cả hạn dùng</option><option>Sắp hết hạn</option><option>Đã hết hạn</option><option>Còn hàng</option></select>
          <span className="filter-spacer" /><label>Sắp xếp:<select value={sort} onChange={e => setSort(e.target.value)}><option>Tên A–Z</option><option>Giá tăng dần</option><option>Giá giảm dần</option><option>Tồn kho tăng dần</option><option>Tồn kho giảm dần</option></select></label>
          {(query || category !== 'Tất cả danh mục' || stock !== 'Tất cả tồn kho' || expiry !== 'Tất cả hạn dùng') && <button className="clear-filter" onClick={() => {setQuery('');setCategory('Tất cả danh mục');setStock('Tất cả tồn kho');setExpiry('Tất cả hạn dùng');setPage(1)}}><Icon name="close" size={13} />Xóa bộ lọc</button>}
        </div>
        <div className="table-wrap medicine-table-wrap"><table className="medicine-data-table"><thead><tr><th>STT</th><th>THUỐC</th><th>MÃ / BARCODE</th><th>HOẠT CHẤT</th><th>DANH MỤC</th><th>ĐƠN VỊ</th><th>GIÁ NHẬP</th><th>GIÁ BÁN</th><th>TỒN KHO</th><th>HẠN DÙNG</th><th>TRẠNG THÁI</th><th /></tr></thead><tbody>{paginated.map((m, index) => <tr key={m.id} onDoubleClick={() => openMedicine(m)}>
          <td style={{textAlign:'center',fontWeight:600,color:'#7d8b83'}}>{(page - 1) * pageSize + index + 1}</td>
          <td><button className="medicine-identity" onClick={() => openMedicine(m)}><span className={`medicine-product-image ${m.color}`}><Icon name="package" /></span><div><strong>{m.name}</strong><small>{m.manufacturer}</small></div></button></td>
          <td><strong className="medicine-code">{m.id}</strong><small className="barcode">{m.barcode}</small></td><td><span className="ingredient">{m.ingredient}</span></td><td><span className="category-tag">{m.category}</span></td><td>{m.unit}</td><td>{money(m.purchase)}</td><td><strong>{money(m.price)}</strong></td><td><strong className={m.stock <= m.minimum ? 'stock-low' : ''}>{m.stock}</strong><small>Tối thiểu: {m.minimum}</small></td><td><span className={m.status.includes('hạn') || m.status.includes('Đã') ? 'expiry-warning' : ''}>{m.expiry}</span></td><td><Badge kind={m.status === 'Đã hết hạn' ? 'danger' : m.status.includes('Sắp') ? 'warning' : m.status === 'Chưa nhập kho' ? 'neutral' : 'ok'}>{m.status}</Badge></td>
          <td><div className="medicine-row-actions"><button title="Xem chi tiết" onClick={() => openMedicine(m)}><Icon name="file" /></button><button title="Chỉnh sửa" onClick={() => {setSelected(m);setEditing(true);setDialog('medicine-form')}}><Icon name="settings" /></button><button className="delete" title="Xóa" onClick={() => {setSelected(m);setDialog('delete-medicine')}}><Icon name="close" /></button></div></td>
        </tr>)}</tbody></table>{filtered.length === 0 && <div className="empty-state"><div><Icon name="search" /></div><strong>Không tìm thấy thuốc phù hợp</strong><span>Hãy thay đổi từ khóa hoặc xóa các bộ lọc hiện tại.</span><Button variant="secondary" onClick={() => {setQuery('');setCategory('Tất cả danh mục');setStock('Tất cả tồn kho');setExpiry('Tất cả hạn dùng');setPage(1)}}>Xóa bộ lọc</Button></div>}</div>
        <div className="pagination"><span>Hiển thị <strong>{paginated.length}</strong> trong tổng số <strong>{filtered.length}</strong> thuốc</span><div><button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>‹</button>{Array.from({length:totalPages},(_,i)=>i+1).map(p=><button key={p} className={page===p?'active':''} onClick={()=>setPage(p)}>{p}</button>)}<button disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>›</button></div></div>
      </section>
    </> : <>
      <div className="category-heading"><div><h2>Danh mục thuốc</h2><p>Tổ chức sản phẩm theo nhóm để dễ dàng tìm kiếm và báo cáo.</p></div><Button icon="plus" onClick={() => {setEditing(false);setSelectedCategory(null);setDialog('category-form')}}>Thêm danh mục</Button></div>
      <section className="card categories-card"><div className="category-toolbar"><div className="table-search"><Icon name="search" size={17} /><input value={categoryQuery} onChange={e => setCategoryQuery(e.target.value)} placeholder="Tìm kiếm danh mục..." /></div><span>{filteredCategories.length} danh mục</span></div>
        <div className="category-grid">{filteredCategories.map((item,index) => <article className="category-item" key={item.id}><div className="category-item-top"><span className={`category-icon cat-${index%5}`}><Icon name="clipboard" /></span><div className="category-menu"><button onClick={() => {setEditing(true);setSelectedCategory(item);setDialog('category-form')}}><Icon name="settings" /></button><button onClick={() => {setSelectedCategory(item);setDialog('delete-category')}}><Icon name="close" /></button></div></div><button className="category-content" onClick={() => {setSelectedCategory(item);setDialog('category-detail')}}><strong>{item.name}</strong><p>{item.description}</p></button><div className="category-meta"><span><b>{item.count}</b> sản phẩm</span><Badge kind={item.status === 'Tạm ẩn' ? 'warning' : 'ok'}>{item.status}</Badge></div></article>)}</div>
      </section>
    </>}

    {dialog === 'medicine-form' && <MedicineForm medicine={selected} editing={editing} categories={categories} onClose={() => setDialog(null)} onSubmit={saveMedicine} />}
    {dialog === 'detail' && selected && <MedicineDetail medicine={selected} tab={detailTab} setTab={setDetailTab} onClose={() => setDialog(null)} onEdit={() => {setEditing(true);setDialog('medicine-form')}} onBatch={(batch) => {setSelectedBatch(batch);setDialog('batch')}} />}
    {dialog === 'batch' && selectedBatch && <BatchDialog batch={selectedBatch} onClose={() => {setDialog('detail');setSelectedBatch(null)}} />}
    {dialog === 'delete-medicine' && selected && <ConfirmDialog title="Xóa thuốc khỏi danh mục?" text={`${selected.name} sẽ bị xóa khỏi danh sách. Các dữ liệu giao dịch trước đây vẫn được lưu trong lịch sử.`} confirm="Xóa thuốc" danger onClose={() => setDialog(null)} onConfirm={deleteMedicine} />}
    {dialog === 'import' && <ImportDialog onClose={() => setDialog(null)} onComplete={() => {setDialog(null);notify('Nhập dữ liệu thuốc thành công')}} />}
    {dialog === 'category-form' && <CategoryForm category={selectedCategory} editing={editing} onClose={() => setDialog(null)} onSubmit={saveCategory} />}
    {dialog === 'category-detail' && selectedCategory && <div className="dialog-layer"><section className="dialog category-detail-dialog"><div className="dialog__header"><div><div className="eyebrow">CHI TIẾT DANH MỤC</div><h2>{selectedCategory.name}</h2><p>{selectedCategory.id}</p></div><button className="icon-button" onClick={() => setDialog(null)}><Icon name="close" /></button></div><div className="category-detail-body"><span className="category-detail-icon"><Icon name="clipboard" /></span><p>{selectedCategory.description}</p><div><span><small>SỐ SẢN PHẨM</small><strong>{selectedCategory.count}</strong></span><span><small>TRẠNG THÁI</small><Badge kind={selectedCategory.status === 'Tạm ẩn' ? 'warning' : 'ok'}>{selectedCategory.status}</Badge></span><span><small>CẬP NHẬT GẦN NHẤT</small><strong>22/06/2025</strong></span></div></div><div className="dialog__footer report-footer"><Button variant="secondary" onClick={() => setDialog(null)}>Đóng</Button><Button icon="settings" onClick={() => {setEditing(true);setDialog('category-form')}}>Chỉnh sửa</Button></div></section></div>}
    {dialog === 'delete-category' && selectedCategory && <ConfirmDialog title="Xóa danh mục?" text={`Danh mục “${selectedCategory.name}” có ${selectedCategory.count} sản phẩm. Bạn cần chuyển các sản phẩm sang danh mục khác trước khi xóa.`} confirm="Xóa danh mục" danger onClose={() => setDialog(null)} onConfirm={deleteCategory} />}
    {toast && <div className="toast"><span><Icon name="check" /></span><div><strong>{toast}</strong><small>Dữ liệu đã được cập nhật trên hệ thống.</small></div><button onClick={() => setToast('')}><Icon name="close" /></button></div>}
  </div>
}

function MedicineForm({ medicine, editing, categories, onClose, onSubmit }: { medicine: Medicine | null; editing: boolean; categories: Category[]; onClose: () => void; onSubmit: (e: FormEvent<HTMLFormElement>) => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') setPreview(ev.target.result)
      }
      reader.readAsDataURL(file)
    }
  }
  return <div className="dialog-layer"><section className="dialog medicine-form-dialog"><div className="dialog__header"><div><div className="eyebrow">{editing ? 'CHỈNH SỬA SẢN PHẨM' : 'SẢN PHẨM MỚI'}</div><h2>{editing ? 'Cập nhật thông tin thuốc' : 'Thêm thuốc vào danh mục'}</h2><p>Nhập thông tin quản lý sản phẩm. Các trường có dấu * là bắt buộc.</p></div><button className="icon-button" onClick={onClose}><Icon name="close" /></button></div><form onSubmit={onSubmit}><div className="medicine-form-layout"><div className="medicine-image-upload" onClick={() => fileRef.current?.click()} style={{cursor:'pointer'}}><input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:'none'}} />{preview ? <img src={preview} alt="Ảnh thuốc" style={{width:56,height:56,objectFit:'cover',borderRadius:8}} /> : <span><Icon name="package" size={28} /></span>}<strong>{preview ? 'Đã tải ảnh lên' : 'Hình ảnh thuốc'}</strong><small>PNG, JPG tối đa 5MB</small><button type="button" onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}>{preview ? 'Chọn ảnh khác' : 'Chọn hình ảnh'}</button></div><div className="medicine-form-grid">
    <label className="field"><span>Mã thuốc *</span><input name="id" defaultValue={medicine?.id} placeholder="Tự động nếu để trống" /></label><label className="field"><span>Tên thuốc *</span><input name="name" defaultValue={medicine?.name} placeholder="Ví dụ: Panadol Extra 500mg" required /></label>
    <label className="field"><span>Mã vạch / Barcode</span><input name="barcode" defaultValue={medicine?.barcode} placeholder="Nhập hoặc quét mã vạch" /></label><label className="field"><span>Hoạt chất</span><input name="ingredient" defaultValue={medicine?.ingredient} placeholder="Tên hoạt chất chính" /></label>
    <label className="field"><span>Danh mục *</span><select name="category" defaultValue={medicine?.category || categories[0].name}>{categories.map(c => <option key={c.id}>{c.name}</option>)}</select></label><label className="field"><span>Nhà sản xuất</span><input name="manufacturer" defaultValue={medicine?.manufacturer} placeholder="Tên nhà sản xuất" /></label>
    <label className="field"><span>Nước sản xuất</span><input name="origin" defaultValue={medicine?.origin} placeholder="Ví dụ: Việt Nam" /></label><label className="field"><span>Đơn vị tính *</span><select name="unit" defaultValue={medicine?.unit || 'Hộp'}><option>Hộp</option><option>Chai</option><option>Tuýp</option><option>Vỉ</option><option>Gói</option><option>Viên</option></select></label>
    <label className="field"><span>Dạng bào chế</span><input name="form" defaultValue={medicine?.form} placeholder="Ví dụ: Viên nén bao phim" /></label><label className="field"><span>Hàm lượng</span><input name="strength" defaultValue={medicine?.strength} placeholder="Ví dụ: 500mg" /></label>
    <label className="field"><span>Giá nhập</span><div className="field__suffix"><input name="purchase" inputMode="numeric" defaultValue={medicine?.purchase} placeholder="0" /><span>VNĐ</span></div></label><label className="field"><span>Giá bán *</span><div className="field__suffix"><input name="price" inputMode="numeric" defaultValue={medicine?.price} placeholder="0" required /><span>VNĐ</span></div></label>
    <label className="field"><span>Tồn kho tối thiểu</span><input name="minimum" inputMode="numeric" defaultValue={medicine?.minimum || 10} /></label><label className="field field--wide"><span>Mô tả quản lý</span><textarea name="description" defaultValue={medicine?.description} placeholder="Ghi chú ngắn về sản phẩm..." /></label>
  </div></div><div className="medicine-advice-note"><Icon name="help" /><span>Chỉ nhập thông tin quản lý sản phẩm theo hồ sơ đã được phê duyệt. Không sử dụng phần mô tả để đưa ra khuyến nghị liều dùng.</span></div><div className="dialog__footer"><Button variant="secondary" onClick={onClose}>Hủy bỏ</Button><Button type="submit">{editing ? 'Lưu thay đổi' : 'Thêm thuốc'}</Button></div></form></section></div>
}

function MedicineDetail({ medicine, tab, setTab, onClose, onEdit, onBatch }: { medicine: Medicine; tab: 'info'|'batches'|'history'; setTab: (t:'info'|'batches'|'history')=>void; onClose:()=>void; onEdit:()=>void; onBatch:(b:Batch)=>void }) {
  return <div className="dialog-layer"><section className="dialog medicine-detail-dialog"><div className="dialog__header medicine-detail-header"><div className={`medicine-detail-image ${medicine.color}`}><Icon name="package" size={29} /></div><div><div className="eyebrow">{medicine.id}</div><h2>{medicine.name}</h2><p>{medicine.manufacturer} • {medicine.origin}</p></div><Badge kind={medicine.status === 'Đã hết hạn'?'danger':medicine.status.includes('Sắp')?'warning':'ok'}>{medicine.status}</Badge><button className="icon-button" onClick={onClose}><Icon name="close" /></button></div><div className="detail-tabs"><button className={tab==='info'?'active':''} onClick={()=>setTab('info')}>Thông tin chung</button><button className={tab==='batches'?'active':''} onClick={()=>setTab('batches')}>Lô thuốc <span>3</span></button><button className={tab==='history'?'active':''} onClick={()=>setTab('history')}>Lịch sử thay đổi</button></div>
  {tab === 'info' && <div className="medicine-info-body"><div className="medicine-detail-grid">{[['Mã vạch',medicine.barcode],['Hoạt chất',medicine.ingredient],['Danh mục',medicine.category],['Đơn vị tính',medicine.unit],['Dạng bào chế',medicine.form],['Hàm lượng',medicine.strength],['Giá nhập',money(medicine.purchase)],['Giá bán',money(medicine.price)],['Tồn kho',`${medicine.stock} ${medicine.unit}`],['Tồn tối thiểu',`${medicine.minimum} ${medicine.unit}`],['Hạn gần nhất',medicine.expiry],['Nhà sản xuất',medicine.manufacturer]].map(x=><div key={x[0]}><small>{x[0]}</small><strong>{x[1]}</strong></div>)}</div><div className="medicine-description"><small>MÔ TẢ QUẢN LÝ</small><p>{medicine.description}</p></div></div>}
  {tab === 'batches' && <div className="batch-list"><div className="batch-summary"><span><small>TỔNG TỒN THEO LÔ</small><strong>{sampleBatches.reduce((a,b)=>a+b.quantity,0)} {medicine.unit}</strong></span><Button icon="plus">Thêm lô thuốc</Button></div>{sampleBatches.map(batch=><button key={batch.number} onClick={()=>onBatch(batch)}><span className="batch-icon"><Icon name="box" /></span><div><strong>{batch.number}</strong><small>Nhập từ {batch.supplier}</small></div><span><small>SỐ LƯỢNG</small><strong>{batch.quantity} {medicine.unit}</strong></span><span><small>HẠN SỬ DỤNG</small><strong>{batch.expiry}</strong></span><Badge kind={batch.status==='Chờ bán'?'warning':'ok'}>{batch.status}</Badge><Icon name="chevron" size={14}/></button>)}</div>}
  {tab === 'history' && <div className="medicine-history">{[['24/06/2025, 14:18','Nguyễn Minh Tuấn','Cập nhật giá bán','60.000 VNĐ → 63.000 VNĐ'],['22/06/2025, 09:42','Trần Thu Hà','Cập nhật tồn kho tối thiểu','15 → 20 hộp'],['18/06/2025, 16:05','Lê Hoàng Nam','Thêm lô thuốc','LO-2501C12 • 62 hộp'],['12/03/2025, 10:30','Nguyễn Minh Tuấn','Tạo sản phẩm','Thông tin sản phẩm được khởi tạo']].map((x,i)=><div key={x[0]}><span className={`history-dot h-${i}`}><Icon name={i===2?'download':i===3?'plus':'settings'} /></span><div><strong>{x[2]}</strong><small>{x[3]}</small><em>{x[1]} • {x[0]}</em></div></div>)}</div>}
  <div className="dialog__footer medicine-detail-footer"><Button variant="secondary" onClick={onClose}>Đóng</Button><Button icon="settings" onClick={onEdit}>Chỉnh sửa thuốc</Button></div></section></div>
}

function BatchDialog({ batch, onClose }: { batch: Batch; onClose:()=>void }) {
  return <div className="dialog-layer"><section className="dialog batch-dialog"><div className="dialog__header"><div><div className="eyebrow">CHI TIẾT LÔ THUỐC</div><h2>{batch.number}</h2><p>Thông tin nhập kho và hạn sử dụng</p></div><button className="icon-button" onClick={onClose}><Icon name="close"/></button></div><div className="batch-detail-grid">{[['Số lô',batch.number],['Ngày sản xuất',batch.manufactured],['Hạn sử dụng',batch.expiry],['Số lượng tồn',`${batch.quantity} hộp`],['Giá nhập',money(batch.purchase)],['Nhà cung cấp',batch.supplier]].map(x=><div key={x[0]}><small>{x[0]}</small><strong>{x[1]}</strong></div>)}</div><div className="batch-expiry-note"><Icon name="calendar"/><div><strong>Lô thuốc còn hạn sử dụng</strong><span>Hệ thống sẽ cảnh báo trước 90 ngày khi lô thuốc sắp hết hạn.</span></div></div><div className="dialog__footer report-footer"><Button onClick={onClose}>Hoàn tất</Button></div></section></div>
}

function CategoryForm({ category, editing, onClose, onSubmit }: { category: Category|null; editing:boolean; onClose:()=>void; onSubmit:(e:FormEvent<HTMLFormElement>)=>void }) {
  return <div className="dialog-layer"><section className="dialog category-form-dialog"><div className="dialog__header"><div><div className="eyebrow">{editing?'CHỈNH SỬA DANH MỤC':'DANH MỤC MỚI'}</div><h2>{editing?'Cập nhật danh mục':'Thêm danh mục thuốc'}</h2><p>Phân nhóm thuốc để quản lý và báo cáo hiệu quả.</p></div><button className="icon-button" onClick={onClose}><Icon name="close"/></button></div><form onSubmit={onSubmit}><div className="category-form-body"><label className="field"><span>Tên danh mục *</span><input name="name" defaultValue={category?.name} placeholder="Ví dụ: Thuốc dị ứng" required /></label><label className="field"><span>Mô tả</span><textarea name="description" defaultValue={category?.description} placeholder="Mô tả ngắn về nhóm sản phẩm..." /></label></div><div className="dialog__footer"><Button variant="secondary" onClick={onClose}>Hủy bỏ</Button><Button type="submit">{editing?'Lưu thay đổi':'Thêm danh mục'}</Button></div></form></section></div>
}

function ConfirmDialog({ title, text, confirm, danger, onClose, onConfirm }: { title:string;text:string;confirm:string;danger?:boolean;onClose:()=>void;onConfirm:()=>void }) {
  return <div className="dialog-layer"><section className="confirm-dialog"><span className={`confirm-icon ${danger?'red':'green'}`}><Icon name={danger?'close':'check'}/></span><h2>{title}</h2><p>{text}</p><div><Button variant="secondary" onClick={onClose}>Hủy bỏ</Button><button className="danger-button" onClick={onConfirm}>{confirm}</button></div></section></div>
}

function ImportDialog({ onClose, onComplete }: { onClose:()=>void;onComplete:()=>void }) {
  const [file,setFile]=useState(false)
  return <div className="dialog-layer"><section className="dialog import-dialog"><div className="dialog__header"><div><div className="eyebrow">NHẬP DỮ LIỆU</div><h2>Nhập danh sách thuốc</h2><p>Sử dụng tệp Excel theo mẫu của PHARMASOFT.</p></div><button className="icon-button" onClick={onClose}><Icon name="close"/></button></div><div className="import-body"><button className={`drop-zone ${file?'has-file':''}`} onClick={()=>setFile(true)}><span><Icon name={file?'check':'download'} size={25}/></span><strong>{file?'danh-sach-thuoc-thang-06.xlsx':'Chọn hoặc kéo thả tệp vào đây'}</strong><small>{file?'128 dòng dữ liệu • 42 KB':'Hỗ trợ .xlsx, .xls hoặc .csv • Tối đa 10MB'}</small></button><button className="template-link"><Icon name="file" size={15}/>Tải tệp mẫu nhập dữ liệu</button><div className="import-note"><Icon name="help"/><span>Dữ liệu trùng mã thuốc sẽ được đánh dấu để bạn lựa chọn cập nhật hoặc bỏ qua trước khi nhập.</span></div></div><div className="dialog__footer report-footer"><Button variant="secondary" onClick={onClose}>Hủy bỏ</Button><Button onClick={onComplete}>{file?'Kiểm tra & nhập dữ liệu':'Tiếp tục'}</Button></div></section></div>
}
