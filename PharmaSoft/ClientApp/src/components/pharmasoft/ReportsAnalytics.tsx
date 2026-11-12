import { useMemo, useState } from 'react'
import { Badge, Button, Icon, IconName } from './App'
import { PieChart, PieSegment } from './charts/PieChart'
import { BarChart, BarItem } from './charts/BarChart'
import { exportToExcel } from '@/lib/excel'
import { printReportStatement } from '@/lib/print'

type ReportGroup='revenue'|'profit'|'inventory'|'sales'|'suppliers'|'customers'
type Period='Hôm nay'|'7 ngày qua'|'30 ngày qua'|'Tháng này'|'Quý này'|'Tùy chọn'
const groups:{id:ReportGroup;label:string;icon:IconName;items:string[]}[]=[
  {id:'revenue',label:'Doanh thu',icon:'activity',items:['Theo ngày','Theo tuần','Theo tháng','Theo năm','So sánh doanh thu']},
  {id:'profit',label:'Lợi nhuận',icon:'chart',items:['Tổng quan lợi nhuận','Theo thuốc','Theo danh mục','Theo kỳ']},
  {id:'inventory',label:'Tồn kho',icon:'archive',items:['Tồn kho hiện tại','Định giá tồn kho','Sắp hết hàng','Hạn sử dụng','Nhập – xuất kho','Lịch sử biến động']},
  {id:'sales',label:'Bán hàng',icon:'cart',items:['Thuốc bán chạy','Thuốc bán chậm','Theo nhân viên','Theo khách hàng','Theo danh mục','Hủy & trả hàng']},
  {id:'suppliers',label:'Nhà cung cấp',icon:'truck',items:['Giá trị mua hàng','Lịch sử nhập hàng','Lịch sử giao dịch']},
  {id:'customers',label:'Khách hàng',icon:'customers',items:['Khách hàng hàng đầu','Tần suất mua hàng','Giá trị mua hàng','Thống kê thành viên']},
]
const periods:Period[]=['Hôm nay','7 ngày qua','30 ngày qua','Tháng này','Quý này','Tùy chọn']
const factors:Record<Period,number>={'Hôm nay':.045,'7 ngày qua':.24,'30 ngày qua':1,'Tháng này':.81,'Quý này':2.65,'Tùy chọn':1.42}
const money=(v:number)=>`${Math.round(v).toLocaleString('vi-VN')} VNĐ`
const medicineRows=[
  ['Panadol Extra 500mg','1.286','54.012.000 VNĐ','35.000 VNĐ','9.002.000 VNĐ','16,7%'],
  ['Vitamin C DHG 500mg','968','94.864.000 VNĐ','75.504.000 VNĐ','19.360.000 VNĐ','20,4%'],
  ['Smecta 3g','842','94.304.000 VNĐ','74.938.000 VNĐ','19.366.000 VNĐ','20,5%'],
  ['Augmentin 625mg','756','133.056.000 VNĐ','111.888.000 VNĐ','21.168.000 VNĐ','15,9%'],
  ['Omeprazol 20mg','690','44.850.000 VNĐ','33.120.000 VNĐ','11.730.000 VNĐ','26,2%'],
]
const inventoryRows=[
  ['Panadol Extra 500mg','286 Hộp','10.080.000 VNĐ','Còn hàng','18/09/2026'],
  ['Augmentin 625mg','42 Hộp','6.216.000 VNĐ','Sắp hết','22/01/2026'],
  ['Vitamin C DHG 500mg','164 Chai','12.792.000 VNĐ','Còn hàng','10/12/2026'],
  ['Smecta 3g','8 Hộp','712.000 VNĐ','Sắp hết hạn','06/08/2025'],
  ['Decolgen Forte','24 Hộp','1.128.000 VNĐ','Đã hết hạn','04/04/2025'],
]
const employeeRows=[
  ['Trần Thu Hà','468','186.420.000 VNĐ','398.000 VNĐ','27,2%'],
  ['Lê Hoàng Nam','382','154.680.000 VNĐ','405.000 VNĐ','22,6%'],
  ['Nguyễn Minh Tuấn','326','142.350.000 VNĐ','437.000 VNĐ','20,8%'],
  ['Phạm Ngọc Mai','284','118.760.000 VNĐ','418.000 VNĐ','17,4%'],
  ['Vũ Đức Long','198','82.040.000 VNĐ','414.000 VNĐ','12,0%'],
]
const supplierRows=[
  ['Công ty CP Dược Hậu Giang','28','286.450.000 VNĐ','24/06/2025','Đang hợp tác'],
  ['Dược phẩm Imexpharm','22','218.640.000 VNĐ','24/06/2025','Đang hợp tác'],
  ['Công ty CP Traphaco','18','164.820.000 VNĐ','23/06/2025','Đang hợp tác'],
  ['Zuellig Pharma Việt Nam','16','142.580.000 VNĐ','20/06/2025','Đang hợp tác'],
  ['Dược phẩm OPC','8','68.240.000 VNĐ','12/05/2025','Tạm ngưng'],
]
const customerRows=[
  ['Hoàng Mai Anh','Kim cương','42','18.640.000 VNĐ','444.000 VNĐ'],
  ['Nguyễn Thị Hồng','Vàng','36','14.280.000 VNĐ','397.000 VNĐ'],
  ['Trần Tuấn Kiệt','Bạc','28','10.860.000 VNĐ','388.000 VNĐ'],
  ['Phạm Đức Anh','Vàng','25','9.750.000 VNĐ','390.000 VNĐ'],
  ['Lê Ngọc Thảo','Bạc','22','8.420.000 VNĐ','383.000 VNĐ'],
]

export function ReportsAnalytics(){
  const [group,setGroup]=useState<ReportGroup>('revenue')
  const [report,setReport]=useState('Theo tháng')
  const [period,setPeriod]=useState<Period>('30 ngày qua')
  const [query,setQuery]=useState('')
  const [detail,setDetail]=useState<{title:string;value:string;description:string}|null>(null)
  const [toast,setToast]=useState('')
  const factor=factors[period]
  const notify=(text:string)=>{setToast(text);window.setTimeout(()=>setToast(''),3000)}
  function selectGroup(id:ReportGroup,item:string){setGroup(id);setReport(item);setQuery('')}
  const currentGroup=groups.find(g=>g.id===group)!
  function handlePrintReport(){
    const rows=(group==='profit'?medicineRows:group==='sales'?(report==='Theo nhân viên'?employeeRows:medicineRows):group==='inventory'?inventoryRows:group==='suppliers'?supplierRows:group==='customers'?customerRows:medicineRows)
    const headers=group==='profit'?['THUỐC','SL BÁN','DOANH THU','GIÁ VỐN','LỢI NHUẬN','BIÊN LN']:group==='inventory'?['THUỐC','TỒN KHO','GIÁ TRỊ','TRẠNG THÁI','HẠN GẦN NHẤT']:group==='suppliers'?['NHÀ CUNG CẤP','PHIẾU NHẬP','GIÁ TRỊ MUA','GẦN NHẤT','TRẠNG THÁI']:group==='customers'?['KHÁCH HÀNG','HẠNG','SỐ ĐƠN','TỔNG CHI TIÊU','TRUNG BÌNH / ĐƠN']:report==='Theo nhân viên'?['NHÂN VIÊN','ĐƠN HÀNG','DOANH THU','TRUNG BÌNH / ĐƠN','TỶ TRỌNG']:['SẢN PHẨM','DOANH THU','ĐƠN HÀNG','GIÁ TRỊ TB','TĂNG TRƯỞNG']
    printReportStatement({
      title:`BÁO CÁO ${currentGroup.label.toUpperCase()} — ${report.toUpperCase()}`,
      subtitle:`Dữ liệu phân tích thống kê nhà thuốc kỳ ${period}`,
      period:period,
      headers:headers,
      rows:rows
    })
  }
  return <div className="reports-module">
    <div className="simulation-banner"><Icon name="help"/><div><strong>Báo cáo mô phỏng</strong><span>Số liệu trên màn hình là dữ liệu mẫu phục vụ prototype, không phải phân tích từ cơ sở dữ liệu thực tế.</span></div></div>
    <div className="reports-shell">
      <aside className="report-nav card"><div className="report-nav-title"><strong>Danh mục báo cáo</strong><small>Chọn loại báo cáo cần xem</small></div>{groups.map(g=><div className="report-nav-group" key={g.id}><button className={group===g.id?'active':''} onClick={()=>selectGroup(g.id,g.items[0])}><span><Icon name={g.icon}/></span><strong>{g.label}</strong><Icon name="chevron" size={13}/></button>{group===g.id&&<div>{g.items.map(item=><button key={item} className={report===item?'active':''} onClick={()=>setReport(item)}>{item}</button>)}</div>}</div>)}</aside>
      <main className="report-content">
        <section className="card report-controls"><div><span className="report-heading-icon"><Icon name={currentGroup.icon}/></span><div><h2>Báo cáo {currentGroup.label.toLowerCase()}</h2><p>{report} • Dữ liệu cập nhật đến 24/06/2025, 14:35</p></div></div><div className="report-export-actions"><Button variant="secondary" icon="download" onClick={()=>{const cols=[{key:'col0',label:currentGroup.label,width:30},{key:'col1',label:'Giá trị',width:20},{key:'col2',label:'So sánh',width:15}];const rows=(group==='profit'?medicineRows:group==='sales'?(report==='Theo nhân viên'?employeeRows:medicineRows):group==='inventory'?inventoryRows:group==='suppliers'?supplierRows:group==='customers'?customerRows:medicineRows).map(r=>({col0:r[0],col1:r[1],col2:r[2]} as Record<string,unknown>));exportToExcel(cols,rows,`bao-cao-${group}`);notify('Đang tải file Excel báo cáo...')}}>Excel</Button><Button variant="secondary" icon="file" onClick={handlePrintReport}>PDF</Button><Button variant="secondary" icon="invoice" onClick={handlePrintReport}>In báo cáo</Button></div></section>
        <section className="card report-date-filter"><div className="period-tabs">{periods.map(p=><button key={p} className={period===p?'active':''} onClick={()=>setPeriod(p)}>{p==='Tùy chọn'&&<Icon name="calendar" size={13}/>} {p}</button>)}</div>{period==='Tùy chọn'&&<div className="report-custom-dates"><input type="date" defaultValue="2025-05-01"/><span>đến</span><input type="date" defaultValue="2025-06-24"/><Button>Áp dụng</Button></div>}</section>
        {group==='revenue'&&<RevenueReport factor={factor} period={period} onDetail={setDetail}/>}
        {group==='profit'&&<ProfitReport factor={factor} query={query} setQuery={setQuery} onDetail={setDetail}/>}
        {group==='inventory'&&<InventoryReport query={query} setQuery={setQuery} report={report} onDetail={setDetail}/>}
        {group==='sales'&&<SalesReport factor={factor} query={query} setQuery={setQuery} report={report} onDetail={setDetail}/>}
        {group==='suppliers'&&<SupplierReport factor={factor} query={query} setQuery={setQuery} onDetail={setDetail}/>}
        {group==='customers'&&<CustomerReport factor={factor} query={query} setQuery={setQuery} report={report} onDetail={setDetail}/>}
      </main>
    </div>
    {detail&&<div className="dialog-layer"><section className="dialog report-drill-dialog"><div className="dialog__header"><div><div className="eyebrow">CHI TIẾT SỐ LIỆU</div><h2>{detail.title}</h2><p>Kỳ báo cáo: {period}</p></div><button className="icon-button" onClick={()=>setDetail(null)}><Icon name="close"/></button></div><div className="drill-value"><span><Icon name={currentGroup.icon}/></span><small>GIÁ TRỊ GHI NHẬN</small><strong>{detail.value}</strong><p>{detail.description}</p></div><div className="drill-breakdown"><div><span>So với kỳ trước</span><strong className="green-text">↑ 12,4%</strong></div><div><span>Tỷ trọng tổng</span><strong>18,6%</strong></div><div><span>Số giao dịch</span><strong>286</strong></div></div><div className="dialog__footer report-footer"><Button variant="secondary" onClick={()=>setDetail(null)}>Đóng</Button><Button icon="download" onClick={()=>notify('Đã xuất dữ liệu chi tiết')}>Xuất chi tiết</Button></div></section></div>}
    {toast&&<div className="toast"><span><Icon name="check"/></span><div><strong>{toast}</strong><small>Tệp mẫu đang được chuẩn bị để tải xuống.</small></div><button onClick={()=>setToast('')}><Icon name="close"/></button></div>}
  </div>
}

function MetricStrip({items,onDetail}:{items:[string,string,string,IconName][];onDetail:(x:{title:string;value:string;description:string})=>void}){return <div className="report-metrics">{items.map(([label,value,change,icon])=><button className="card" key={label} onClick={()=>onDetail({title:label,value,description:`Số liệu ${label.toLowerCase()} trong kỳ báo cáo đang chọn.`})}><span><Icon name={icon}/></span><small>{label}</small><strong>{value}</strong><em className={change.startsWith('+')?'positive':'negative'}>{change} so với kỳ trước</em></button>)}</div>}
function ReportTable({title,subtitle,headers,rows,query,setQuery,onDetail}:{title:string;subtitle:string;headers:string[];rows:string[][];query:string;setQuery:(x:string)=>void;onDetail:(x:{title:string;value:string;description:string})=>void}){const filtered=rows.filter(r=>r.join(' ').toLowerCase().includes(query.toLowerCase()));return <section className="card report-table-card"><div className="report-card-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><div className="table-search"><Icon name="search" size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Lọc dữ liệu trong bảng..."/></div></div><div className="table-wrap"><table><thead><tr>{headers.map(x=><th key={x}>{x}</th>)}<th/></tr></thead><tbody>{filtered.map((row,i)=><tr key={`${row[0]}-${i}`}>{row.map((cell,j)=><td key={j}>{j===0?<strong>{cell}</strong>:cell}</td>)}<td><button className="mini-action" onClick={()=>onDetail({title:row[0],value:row[2]||row[1],description:`Chi tiết dữ liệu của ${row[0]} trong kỳ báo cáo.`})}>Chi tiết <Icon name="chevron"/></button></td></tr>)}</tbody></table></div><div className="pagination"><span>Hiển thị <strong>{filtered.length}</strong> dòng dữ liệu</span><div><button disabled>‹</button><button className="active">1</button><button>2</button><button>›</button></div></div></section>}

function RevenueReport({factor,period,onDetail}:{factor:number;period:Period;onDetail:(x:any)=>void}){
  const revenue=684250000*factor,orders=Math.round(1286*factor)
  const categoryBars:BarItem[]=[
    {label:'T.kê đơn',value:260},
    {label:'KK đơn',value:185},
    {label:'Vitamin',value:130},
    {label:'D.mỹ phẩm',value:68},
    {label:'Khác',value:41},
  ]
  return <><MetricStrip onDetail={onDetail} items={[[`Doanh thu ${period.toLowerCase()}`,money(revenue),'+12,5%','activity'],['Tổng đơn hàng',orders.toLocaleString('vi-VN'),'+8,2%','invoice'],['Giá trị đơn trung bình',money(532000),'+4,1%','cart'],['Doanh thu hoàn tiền',money(8420000*factor),'-2,6%','archive']]}/><section className="report-chart-grid"><div className="card report-main-chart"><div className="report-card-heading"><div><h2>Xu hướng doanh thu</h2><p>So sánh doanh thu theo ngày với cùng kỳ</p></div><div className="chart-legend"><span><i className="green"/>Kỳ này</span><span><i className="gray"/>Kỳ trước</span></div></div><div className="report-line-chart"><div className="report-y"><span>40tr</span><span>30tr</span><span>20tr</span><span>10tr</span><span>0</span></div><div className="report-plot"><i/><i/><i/><i/><i/><svg viewBox="0 0 800 230" preserveAspectRatio="none"><defs><linearGradient id="reportArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#16834a" stopOpacity=".22"/><stop offset="1" stopColor="#16834a" stopOpacity="0"/></linearGradient></defs><path className="area" d="M0 190 C60 174 80 145 130 155 S205 190 255 126 S330 75 385 112 S470 167 515 105 S590 48 640 82 S720 64 800 28 L800 230 L0 230Z"/><path className="primary" d="M0 190 C60 174 80 145 130 155 S205 190 255 126 S330 75 385 112 S470 167 515 105 S590 48 640 82 S720 64 800 28"/><path className="secondary" d="M0 204 C70 188 85 170 130 179 S210 202 255 154 S325 112 385 141 S470 188 515 136 S590 86 640 111 S725 98 800 72"/></svg><div className="report-x">{['18/06','19/06','20/06','21/06','22/06','23/06','24/06'].map(x=><span key={x}>{x}</span>)}</div></div></div></div><div className="card comparison-panel"><div className="report-card-heading"><div><h2>Doanh thu theo danh mục</h2><p>Nhấn vào cột để xem chi tiết</p></div></div><BarChart bars={categoryBars} height={160} unit="tr" onClick={(bar)=>onDetail({title:bar.label,value:money((revenue*bar.value/684).toFixed(0) as unknown as number),description:`Doanh thu danh mục ${bar.label} trong kỳ báo cáo.`})}/></div></section><section className="card revenue-period-table"><div className="report-card-heading"><div><h2>Doanh thu theo kỳ</h2><p>Tổng hợp doanh thu, đơn hàng và tăng trưởng</p></div></div><div className="table-wrap"><table><thead><tr><th>THỜI GIAN</th><th>DOANH THU</th><th>ĐƠN HÀNG</th><th>TRUNG BÌNH / ĐƠN</th><th>SO VỚI KỲ TRƯỚC</th><th /></tr></thead><tbody>{['Tuần 1','Tuần 2','Tuần 3','Tuần 4'].map((x,i)=><tr key={x}><td><strong>{x}</strong></td><td><strong>{money(142000000+i*9800000)}</strong></td><td>{268+i*23}</td><td>{money(524000+i*7000)}</td><td><Badge kind="ok">↑ {8+i*1.4}%</Badge></td><td><button className="mini-action" onClick={()=>onDetail({title:x,value:money(142000000+i*9800000),description:'Chi tiết doanh thu theo ngày trong tuần.'})}>Xem chi tiết <Icon name="chevron"/></button></td></tr>)}</tbody></table></div></section></>
}

function ProfitReport({factor,query,setQuery,onDetail}:{factor:number;query:string;setQuery:(x:string)=>void;onDetail:(x:any)=>void}){
  const sales=684250000*factor,cost=492660000*factor,profit=sales-cost
  const categorySegments:PieSegment[]=[
    {label:'Thuốc kê đơn',value:34,color:'#16834a'},
    {label:'Không kê đơn',value:28,color:'#3b82f6'},
    {label:'Vitamin & TPCN',value:22,color:'#f59e0b'},
    {label:'Dược mỹ phẩm',value:10,color:'#8b5cf6'},
    {label:'Khác',value:6,color:'#94a3b8'},
  ]
  return <><MetricStrip onDetail={onDetail} items={[[`Tổng doanh thu`,money(sales),'+12,5%','activity'],['Tổng giá vốn',money(cost),'+9,8%','archive'],['Lợi nhuận gộp',money(profit),'+18,4%','chart'],['Biên lợi nhuận',`${(profit/sales*100).toFixed(1)}%`,'+1,6%','percent']]}/><section className="report-chart-grid"><div className="card profit-waterfall"><div className="report-card-heading"><div><h2>Cơ cấu lợi nhuận</h2><p>Doanh thu, giá vốn và lợi nhuận gộp</p></div></div><div className="profit-bars">{[['Doanh thu',100,'green',sales],['Giá vốn',72,'red',cost],['Lợi nhuận',28,'blue',profit]].map(x=><button key={x[0]} onClick={()=>onDetail({title:x[0],value:money(x[3] as number),description:'Thành phần cấu thành lợi nhuận gộp.'})}><strong>{money(x[3] as number)}</strong><i className={x[2] as string} style={{height:`${x[1]}%`}}/><span>{x[0]}</span></button>)}</div></div><div className="card category-profit"><div className="report-card-heading"><div><h2>Lợi nhuận theo danh mục</h2><p>Nhấn vào phần tròn để xem chi tiết</p></div></div><div style={{padding:'8px 16px'}}><PieChart segments={categorySegments} size={150} centerLabel="Lợi nhuận" centerValue="191,5tr" onClick={(seg)=>onDetail({title:seg.label,value:`${seg.value}%`,description:`Tỷ trọng lợi nhuận danh mục ${seg.label} đạt ${seg.value}% trong kỳ.`})}/></div></div></section><ReportTable title="Lợi nhuận theo thuốc" subtitle="Xếp hạng theo lợi nhuận gộp trong kỳ" headers={['THUỐC','SỐ LƯỢNG BÁN','DOANH THU','GIÁ VỐN','LỢI NHUẬN','BIÊN LN']} rows={medicineRows} query={query} setQuery={setQuery} onDetail={onDetail}/></>}
function InventoryReport({query,setQuery,report,onDetail}:{query:string;setQuery:(x:string)=>void;report:string;onDetail:(x:any)=>void}){
  const stockSegments:PieSegment[]=[
    {label:'Còn hàng',value:1025,color:'#16834a'},
    {label:'Sắp hết',value:156,color:'#f59e0b'},
    {label:'Hết hàng',value:67,color:'#ef4444'},
  ]
  return <><MetricStrip onDetail={onDetail} items={[[`Tổng giá trị tồn kho`,'186.420.000 VNĐ','+4,2%','activity'],['Tổng số lượng','12.486 đơn vị','+2,8%','package'],['Sắp hết hàng','12 sản phẩm','-3,0%','archive'],['Sắp / đã hết hạn','11 lô','-1,0%','calendar']]}/><section className="report-chart-grid"><div className="card inventory-value-chart"><div className="report-card-heading"><div><h2>Biến động giá trị tồn kho</h2><p>Giá trị nhập, xuất và tồn cuối kỳ</p></div></div><div className="inventory-movement-bars">{[72,86,64,91,78,96].map((h,i)=><button key={i} onClick={()=>onDetail({title:`Tháng ${i+1}`,value:money(128000000+i*11600000),description:'Chi tiết nhập xuất tồn trong tháng.'})}><div><i className="in" style={{height:`${h}%`}}/><i className="out" style={{height:`${h*.72}%`}}/></div><span>T{i+1}</span></button>)}</div><div className="chart-legend centered"><span><i className="green"/>Nhập kho</span><span><i className="blue"/>Xuất kho</span></div></div><div className="card inventory-status-report"><div className="report-card-heading"><div><h2>Trạng thái tồn kho</h2><p>Nhấn vào phần tròn xem chi tiết</p></div></div><div style={{padding:'8px 16px'}}><PieChart segments={stockSegments} size={150} centerLabel="Khả dụng" centerValue="82%" onClick={(seg)=>onDetail({title:seg.label,value:`${seg.value} sản phẩm`,description:`Số lượng sản phẩm ở trạng thái ${seg.label.toLowerCase()}.`})}/></div></div></section><ReportTable title={report} subtitle="Chi tiết tồn kho và hạn sử dụng theo sản phẩm" headers={['THUỐC','TỒN KHO','GIÁ TRỊ','TRẠNG THÁI','HẠN GẦN NHẤT']} rows={inventoryRows} query={query} setQuery={setQuery} onDetail={onDetail}/></>}
function SalesReport({factor,query,setQuery,report,onDetail}:{factor:number;query:string;setQuery:(x:string)=>void;report:string;onDetail:(x:any)=>void}){const rows=report==='Theo nhân viên'?employeeRows:medicineRows.map((r,i)=>[r[0],r[1],r[2],`${Math.round(286-i*32)} đơn`,i<3?'Bán chạy':'Ổn định']);return <><MetricStrip onDetail={onDetail} items={[[`Sản phẩm đã bán`,Math.round(4862*factor).toLocaleString('vi-VN'),'+9,4%','package'],['Hóa đơn hoàn tất',Math.round(1286*factor).toLocaleString('vi-VN'),'+8,2%','invoice'],['Hóa đơn đã hủy','18 hóa đơn','-2,1%','close'],['Sản phẩm trả lại','26 sản phẩm','-4,6%','archive']]}/><section className="card sales-ranking-chart"><div className="report-card-heading"><div><h2>Top 10 thuốc bán chạy</h2><p>Theo số lượng trong kỳ báo cáo</p></div></div><div className="horizontal-ranking">{medicineRows.map((r,i)=><button key={r[0]} onClick={()=>onDetail({title:r[0],value:r[2],description:`Đã bán ${r[1]} sản phẩm trong kỳ.`})}><span>{i+1}</span><strong>{r[0]}</strong><i><b style={{width:`${100-i*11}%`}}/></i><em>{r[1]} SP</em><small>{r[2]}</small></button>)}</div></section><ReportTable title={report} subtitle="Phân tích hiệu suất bán hàng chi tiết" headers={report==='Theo nhân viên'?['NHÂN VIÊN','ĐƠN HÀNG','DOANH THU','TRUNG BÌNH / ĐƠN','TỶ TRỌNG']:['SẢN PHẨM','SỐ LƯỢNG','DOANH THU','ĐƠN HÀNG','XẾP LOẠI']} rows={rows} query={query} setQuery={setQuery} onDetail={onDetail}/></>}
function SupplierReport({factor,query,setQuery,onDetail}:{factor:number;query:string;setQuery:(x:string)=>void;onDetail:(x:any)=>void}){return <><MetricStrip onDetail={onDetail} items={[[`Tổng giá trị mua`,money(880740000*factor),'+10,8%','activity'],['Phiếu nhập kho',`${Math.round(92*factor)} phiếu`,'+6,2%','download'],['Nhà cung cấp hoạt động','42 đối tác','+2,0%','truck'],['Công nợ phải trả',money(186500000*factor),'-5,3%','invoice']]}/><section className="card supplier-purchase-chart"><div className="report-card-heading"><div><h2>Giá trị mua theo nhà cung cấp</h2><p>Top 5 đối tác theo giá trị nhập hàng</p></div></div><div className="supplier-bars">{supplierRows.map((r,i)=><button key={r[0]} onClick={()=>onDetail({title:r[0],value:r[2],description:'Tổng giá trị nhập hàng và lịch sử giao dịch nhà cung cấp.'})}><strong>{r[0]}</strong><span><i style={{width:`${100-i*14}%`}}/></span><em>{r[2]}</em></button>)}</div></section><ReportTable title="Lịch sử giao dịch nhà cung cấp" subtitle="Tổng hợp phiếu nhập và giá trị giao dịch" headers={['NHÀ CUNG CẤP','PHIẾU NHẬP','GIÁ TRỊ MUA','GẦN NHẤT','TRẠNG THÁI']} rows={supplierRows} query={query} setQuery={setQuery} onDetail={onDetail}/></>}
function CustomerReport({factor,query,setQuery,report,onDetail}:{factor:number;query:string;setQuery:(x:string)=>void;report:string;onDetail:(x:any)=>void}){
  const memberSegments:PieSegment[]=[
    {label:'Thành viên',value:5358,color:'#16834a'},
    {label:'Bạc',value:1988,color:'#3b82f6'},
    {label:'Vàng',value:950,color:'#f59e0b'},
    {label:'Kim cương',value:346,color:'#8b5cf6'},
  ]
  return <><MetricStrip onDetail={onDetail} items={[[`Tổng khách hàng`,'8.642 khách','+5,4%','customers'],['Khách mua trong kỳ',Math.round(2148*factor).toLocaleString('vi-VN'),'+8,1%','cart'],['Tần suất trung bình','2,8 lần / tháng','+0,4%','activity'],['Giá trị trung bình',money(532000),'+4,1%','invoice']]}/><section className="report-chart-grid"><div className="card membership-report"><div className="report-card-heading"><div><h2>Phân bổ hạng thành viên</h2><p>Nhấn vào phần tròn xem chi tiết</p></div></div><div style={{padding:'8px 16px'}}><PieChart segments={memberSegments} size={150} centerLabel="Thành viên" centerValue="8.642" onClick={(seg)=>onDetail({title:`Hạng ${seg.label}`,value:`${seg.value} khách`,description:`Số lượng khách hàng hạng ${seg.label.toLowerCase()} trong hệ thống.`})}/></div></div><div className="card frequency-report"><div className="report-card-heading"><div><h2>Tần suất mua hàng</h2><p>Số lần mua trong 30 ngày</p></div></div><div className="frequency-list">{[['1 lần','46%',46],['2–3 lần','32%',32],['4–5 lần','15%',15],['Trên 5 lần','7%',7]].map(x=><div key={x[0]}><span>{x[0]}</span><i><b style={{width:`${x[2]}%`}}/></i><strong>{x[1]}</strong></div>)}</div></div></section><ReportTable title={report} subtitle="Xếp hạng khách hàng theo giá trị và tần suất mua" headers={['KHÁCH HÀNG','HẠNG','SỐ ĐƠN','TỔNG CHI TIÊU','TRUNG BÌNH / ĐƠN']} rows={customerRows} query={query} setQuery={setQuery} onDetail={onDetail}/></>}
