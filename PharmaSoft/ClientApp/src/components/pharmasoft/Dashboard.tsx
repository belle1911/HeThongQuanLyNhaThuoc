import { useMemo, useState } from 'react'
import { Badge, Button, Icon, IconName } from './App'

type Period = 'Hôm nay' | 'Hôm qua' | '7 ngày qua' | '30 ngày qua' | 'Tháng này' | 'Tùy chọn'
type Metric = { label: string; value: string; change: string; positive: boolean; icon: IconName; tone: string; report: string }

const periods: Period[] = ['Hôm nay', 'Hôm qua', '7 ngày qua', '30 ngày qua', 'Tháng này', 'Tùy chọn']
const factors: Record<Period, number> = { 'Hôm nay': 1, 'Hôm qua': .91, '7 ngày qua': 6.7, '30 ngày qua': 27.8, 'Tháng này': 21.4, 'Tùy chọn': 12.6 }
const currency = (value: number) => `${Math.round(value).toLocaleString('vi-VN')} VNĐ`

const activitySets = {
  'Hóa đơn': [
    ['HD250624-0186', 'Nguyễn Văn Minh', '486.000 VNĐ', '14:28', 'Đã thanh toán'],
    ['HD250624-0185', 'Lê Thu Trang', '1.248.000 VNĐ', '14:16', 'Đã thanh toán'],
    ['HD250624-0184', 'Khách lẻ', '215.000 VNĐ', '13:52', 'Chưa thanh toán'],
    ['HD250624-0183', 'Phạm Đức Anh', '678.500 VNĐ', '13:41', 'Đã thanh toán'],
  ],
  'Nhập kho': [
    ['PN250624-0028', 'Công ty Dược Hậu Giang', '24.680.000 VNĐ', '13:20', 'Đã nhập kho'],
    ['PN250624-0027', 'Dược phẩm Imexpharm', '18.250.000 VNĐ', '11:05', 'Chờ duyệt'],
    ['PN250623-0026', 'Traphaco', '9.840.000 VNĐ', 'Hôm qua', 'Đã nhập kho'],
  ],
  'Xuất kho': [
    ['PX250624-0016', 'Điều chuyển Chi nhánh 02', '86 sản phẩm', '12:10', 'Đã xuất kho'],
    ['PX250624-0015', 'Hủy hàng hết hạn', '12 sản phẩm', '09:35', 'Chờ duyệt'],
    ['PX250623-0014', 'Điều chuyển Chi nhánh 03', '54 sản phẩm', 'Hôm qua', 'Đã xuất kho'],
  ],
  'Khách hàng': [
    ['KH-008642', 'Nguyễn Thị Hồng', '0903 182 456', '14:05', 'Khách hàng mới'],
    ['KH-008641', 'Trần Tuấn Kiệt', '0987 443 220', '11:32', 'Thành viên Bạc'],
    ['KH-008640', 'Hoàng Mai Anh', '0912 675 889', '09:18', 'Thành viên Vàng'],
  ],
  'Hệ thống': [
    ['HT-240625', 'Nguyễn Minh Tuấn', 'Cập nhật quyền Dược sĩ', '14:02', 'Thành công'],
    ['HT-240624', 'Trần Thu Hà', 'Đồng bộ dữ liệu tồn kho', '11:48', 'Thành công'],
    ['HT-240623', 'Hệ thống', 'Sao lưu dữ liệu tự động', '03:00', 'Thành công'],
  ],
}

const alerts = [
  { title: 'Thuốc sắp hết hàng', count: 12, detail: '5 sản phẩm dưới mức tồn tối thiểu', tone: 'amber', icon: 'archive' as IconName, route: 'Quản lý kho', action: 'Kiểm tra kho' },
  { title: 'Thuốc sắp hết hạn', count: 8, detail: 'Hết hạn trong vòng 60 ngày', tone: 'orange', icon: 'calendar' as IconName, route: 'Kiểm kê kho', action: 'Xem hạn dùng' },
  { title: 'Thuốc đã hết hạn', count: 3, detail: 'Cần xử lý và lập phiếu hủy', tone: 'red', icon: 'close' as IconName, route: 'Kiểm kê kho', action: 'Xử lý ngay' },
  { title: 'Hóa đơn chưa thanh toán', count: 6, detail: 'Tổng giá trị 4.820.000 VNĐ', tone: 'purple', icon: 'invoice' as IconName, route: 'Hóa đơn', action: 'Đối soát' },
  { title: 'Phiếu nhập chờ duyệt', count: 4, detail: '2 phiếu đã chờ hơn 24 giờ', tone: 'blue', icon: 'download' as IconName, route: 'Nhập hàng', action: 'Duyệt phiếu' },
]

function DashboardMetric({ item, onClick }: { item: Metric; onClick: () => void }) {
  return <button className="dash-metric card" onClick={onClick}>
    <span className={`dash-metric__icon ${item.tone}`}><Icon name={item.icon} /></span>
    <span className="dash-metric__body"><small>{item.label}</small><strong>{item.value}</strong><em className={item.positive ? 'up' : 'down'}>{item.positive ? '↑' : '↓'} {item.change} <i>so với kỳ trước</i></em></span>
    <Icon name="chevron" size={15} />
  </button>
}

export function Dashboard({ onNavigate }: { onNavigate: (route: string) => void }) {
  const [period, setPeriod] = useState<Period>('Hôm nay')
  const [activityTab, setActivityTab] = useState<keyof typeof activitySets>('Hóa đơn')
  const [report, setReport] = useState<Metric | null>(null)
  const [invoice, setInvoice] = useState<string[] | null>(null)
  const factor = factors[period]
  const metrics = useMemo<Metric[]>(() => [
    { label: 'Doanh thu hôm nay', value: currency(28450000 * factor), change: '12,5%', positive: true, icon: 'activity', tone: 'green', report: 'Báo cáo doanh thu ngày' },
    { label: 'Doanh thu tháng', value: currency(684250000 * (period === 'Tháng này' ? 1 : Math.min(factor / 21.4, 1))), change: '8,4%', positive: true, icon: 'chart', tone: 'blue', report: 'Báo cáo doanh thu tháng' },
    { label: 'Đơn hàng hôm nay', value: Math.round(186 * factor).toLocaleString('vi-VN'), change: '8,2%', positive: true, icon: 'invoice', tone: 'purple', report: 'Báo cáo đơn hàng' },
    { label: 'Tổng số thuốc', value: '1.248', change: '24 sản phẩm', positive: true, icon: 'package', tone: 'cyan', report: 'Báo cáo danh mục thuốc' },
    { label: 'Khách hàng', value: '8.642', change: '5,4%', positive: true, icon: 'customers', tone: 'indigo', report: 'Báo cáo khách hàng' },
    { label: 'Thuốc sắp hết hàng', value: '12', change: '3 sản phẩm', positive: false, icon: 'archive', tone: 'amber', report: 'Báo cáo tồn kho thấp' },
    { label: 'Thuốc sắp hết hạn', value: '8', change: '2 sản phẩm', positive: false, icon: 'calendar', tone: 'orange', report: 'Báo cáo hạn sử dụng' },
    { label: 'Lợi nhuận dự kiến', value: currency(8650000 * factor), change: '10,8%', positive: true, icon: 'activity', tone: 'emerald', report: 'Báo cáo lợi nhuận' },
  ], [factor, period])
  const activeRows = activitySets[activityTab]

  return <div className="dashboard-v2">
    <section className="dashboard-filter card">
      <div className="period-tabs">{periods.map(item => <button key={item} className={period === item ? 'active' : ''} onClick={() => setPeriod(item)}>{item === 'Tùy chọn' && <Icon name="calendar" size={14} />}{item}</button>)}</div>
      {period === 'Tùy chọn' && <div className="custom-dates"><label><span>Từ ngày</span><input type="date" defaultValue="2025-06-01" /></label><span>→</span><label><span>Đến ngày</span><input type="date" defaultValue="2025-06-24" /></label><Button>Áp dụng</Button></div>}
      <div className="filter-updated"><span className="live-dot" /> Cập nhật lúc 14:30, 24/06/2025</div>
    </section>

    <section className="dashboard-metrics">{metrics.map(item => <DashboardMetric key={item.label} item={item} onClick={() => setReport(item)} />)}</section>

    <section className="dash-charts-primary">
      <div className="card dash-chart-card">
        <div className="dash-card-heading"><div><h2>Doanh thu theo ngày</h2><p>Đơn vị: triệu VNĐ • {period}</p></div><div className="chart-legend"><span><i className="green" />Năm 2025</span><span><i className="gray" />Năm 2024</span></div></div>
        <div className="revenue-highlight"><strong>{currency(164820000 * Math.min(factor / 6.7, 1.8))}</strong><Badge kind="ok">↑ 14,2%</Badge></div>
        <div className="dual-line-chart">
          <div className="dash-y-axis"><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span></div>
          <div className="dash-plot"><i /><i /><i /><i /><i />
            <svg viewBox="0 0 800 210" preserveAspectRatio="none">
              <defs><linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#16834a" stopOpacity=".2" /><stop offset="1" stopColor="#16834a" stopOpacity="0" /></linearGradient></defs>
              <path className="dash-area" d="M0 174 C50 160 60 138 115 145 S180 175 230 124 S305 80 345 108 S430 160 460 122 S530 46 575 80 S650 126 690 69 S760 52 800 29 L800 210 L0 210Z" />
              <path className="dash-line dash-line--main" d="M0 174 C50 160 60 138 115 145 S180 175 230 124 S305 80 345 108 S430 160 460 122 S530 46 575 80 S650 126 690 69 S760 52 800 29" />
              <path className="dash-line dash-line--prev" d="M0 186 C70 174 70 154 115 162 S185 183 230 145 S300 112 345 134 S420 166 460 143 S525 89 575 112 S650 146 690 102 S760 85 800 65" />
            </svg>
            <div className="dash-x-axis"><span>18/06</span><span>19/06</span><span>20/06</span><span>21/06</span><span>22/06</span><span>23/06</span><span>24/06</span></div>
          </div>
        </div>
      </div>
      <div className="card dash-chart-card monthly-card">
        <div className="dash-card-heading"><div><h2>Doanh thu theo tháng</h2><p>6 tháng gần nhất</p></div><button className="mini-action">Chi tiết <Icon name="chevron" size={13} /></button></div>
        <div className="monthly-total"><small>Tổng 6 tháng</small><strong>3,42 tỷ VNĐ</strong><span>↑ 11,6%</span></div>
        <div className="monthly-bars">{[58,72,64,84,76,96].map((height, index) => <div key={index}><span className="bar-value">{[462,568,512,671,606,684][index]}tr</span><i style={{height: `${height}%`}} /><small>T{index + 1}</small></div>)}</div>
      </div>
    </section>

    <section className="dash-charts-secondary">
      <div className="card comparison-card">
        <div className="dash-card-heading"><div><h2>So sánh doanh số</h2><p>Doanh thu và lợi nhuận theo tuần</p></div><div className="chart-legend"><span><i className="green" />Doanh thu</span><span><i className="blue" />Lợi nhuận</span></div></div>
        <div className="comparison-bars">{[82,66,91,76].map((height, i) => <div className="comparison-group" key={i}><div><i className="sales" style={{height: `${height}%`}} /><i className="profit" style={{height: `${height * .46}%`}} /></div><span>Tuần {i + 1}</span></div>)}</div>
      </div>
      <div className="card category-card">
        <div className="dash-card-heading"><div><h2>Doanh thu theo danh mục</h2><p>Tỷ trọng doanh thu</p></div><button className="row-menu">•••</button></div>
        <div className="donut-layout"><div className="category-donut"><div><strong>684,2tr</strong><small>Tổng doanh thu</small></div></div><div className="donut-legend">{[['Thuốc kê đơn','38%','green'],['Thuốc không kê đơn','27%','blue'],['Vitamin & TPCN','19%','amber'],['Dược mỹ phẩm','10%','purple'],['Khác','6%','gray']].map(x => <div key={x[0]}><i className={x[2]} /><span>{x[0]}</span><strong>{x[1]}</strong></div>)}</div></div>
      </div>
      <div className="card inventory-chart-card">
        <div className="dash-card-heading"><div><h2>Tổng quan tồn kho</h2><p>1.248 sản phẩm</p></div><button className="mini-action" onClick={() => onNavigate('Quản lý kho')}>Xem kho <Icon name="chevron" size={13} /></button></div>
        <div className="inventory-donut-row"><div className="inventory-donut"><div><strong>82%</strong><small>Ổn định</small></div></div><div><div><i className="green" /><span>Còn hàng</span><strong>1.025</strong></div><div><i className="amber" /><span>Sắp hết</span><strong>156</strong></div><div><i className="red" /><span>Hết hàng</span><strong>67</strong></div></div></div>
      </div>
    </section>

    <section className="dash-bottom-grid">
      <div className="card best-sellers">
        <div className="dash-card-heading"><div><h2>Top 10 thuốc bán chạy</h2><p>Theo số lượng bán trong {period.toLowerCase()}</p></div><button className="mini-action">Xem báo cáo <Icon name="chevron" size={13} /></button></div>
        <div className="seller-list">{[
          ['Panadol Extra 500mg','1.286','54,01tr'],['Vitamin C DHG 500mg','968','94,86tr'],['Smecta 3g','842','94,30tr'],['Augmentin 625mg','756','133,06tr'],['Omeprazol 20mg','690','44,85tr'],['Efferalgan 500mg','628','26,38tr'],['Berocca Performance','584','78,84tr'],['Salonpas Hisamitsu','542','18,97tr'],['Boganic Traphaco','496','62,49tr'],['Decolgen Forte','458','28,85tr'],
        ].map((item, index) => <div key={item[0]}><span className={`rank rank-${index + 1}`}>{index + 1}</span><div><strong>{item[0]}</strong><small>{item[1]} sản phẩm</small></div><span className="seller-bar"><i style={{width: `${100 - index * 7}%`}} /></span><b>{item[2]}</b></div>)}</div>
      </div>
      <div className="card alert-panel">
        <div className="dash-card-heading"><div><h2>Cảnh báo cần xử lý</h2><p>Cập nhật theo dữ liệu thời gian thực</p></div><span className="alert-total">33 cảnh báo</span></div>
        <div className="alert-list">{alerts.map(alert => <button key={alert.title} onClick={() => onNavigate(alert.route)}><span className={`alert-icon ${alert.tone}`}><Icon name={alert.icon} /></span><div><strong>{alert.title}</strong><small>{alert.detail}</small></div><b>{alert.count}</b><span className="alert-action">{alert.action}<Icon name="chevron" size={12} /></span></button>)}</div>
      </div>
    </section>

    <section className="card recent-panel">
      <div className="dash-card-heading recent-heading"><div><h2>Hoạt động gần đây</h2><p>Theo dõi giao dịch và thay đổi mới nhất</p></div><button className="mini-action">Xem tất cả <Icon name="chevron" size={13} /></button></div>
      <div className="activity-tabs">{(Object.keys(activitySets) as (keyof typeof activitySets)[]).map(tab => <button key={tab} className={activityTab === tab ? 'active' : ''} onClick={() => setActivityTab(tab)}>{tab}<span>{activitySets[tab].length}</span></button>)}</div>
      <div className="recent-list">{activeRows.map((row, index) => <button key={row[0]} onClick={() => activityTab === 'Hóa đơn' && setInvoice(row)}>
        <span className={`recent-icon recent-${index}`}><Icon name={activityTab === 'Hóa đơn' ? 'invoice' : activityTab === 'Nhập kho' ? 'download' : activityTab === 'Xuất kho' ? 'box' : activityTab === 'Khách hàng' ? 'customers' : 'settings'} /></span>
        <div><strong>{row[0]}</strong><small>{row[1]}</small></div><span>{row[2]}</span><time>{row[3]}</time><Badge kind={row[4].includes('Chưa') || row[4].includes('Chờ') ? 'warning' : 'ok'}>{row[4]}</Badge><Icon name="chevron" size={14} />
      </button>)}</div>
    </section>

    {report && <div className="dialog-layer"><section className="dialog dashboard-report-dialog"><div className="dialog__header"><div><div className="eyebrow">BÁO CÁO NHANH</div><h2>{report.report}</h2><p>Dữ liệu tổng hợp theo bộ lọc “{period}”.</p></div><button className="icon-button" onClick={() => setReport(null)}><Icon name="close" /></button></div><div className="report-dialog-body"><span className={`dash-metric__icon ${report.tone}`}><Icon name={report.icon} /></span><small>{report.label}</small><strong>{report.value}</strong><Badge kind={report.positive ? 'ok' : 'warning'}>{report.positive ? '↑' : '↓'} {report.change} so với kỳ trước</Badge><div className="report-mini-grid"><div><span>Kế hoạch</span><strong>92%</strong></div><div><span>Cùng kỳ</span><strong>{report.positive ? '+8,6%' : '-2,1%'}</strong></div><div><span>Dự báo</span><strong>Tích cực</strong></div></div></div><div className="dialog__footer report-footer"><Button variant="secondary" onClick={() => setReport(null)}>Đóng</Button><Button icon="chart" onClick={() => onNavigate('Báo cáo – Thống kê')}>Mở báo cáo đầy đủ</Button></div></section></div>}
    {invoice && <div className="dialog-layer"><section className="dialog invoice-detail"><div className="dialog__header"><div><div className="eyebrow">CHI TIẾT HÓA ĐƠN</div><h2>{invoice[0]}</h2><p>Ngày tạo: 24/06/2025 • {invoice[3]}</p></div><button className="icon-button" onClick={() => setInvoice(null)}><Icon name="close" /></button></div><div className="invoice-customer"><span><Icon name="customers" /></span><div><small>KHÁCH HÀNG</small><strong>{invoice[1]}</strong><p>0903 456 789 • Thành viên Bạc</p></div><Badge kind={invoice[4].includes('Chưa') ? 'warning' : 'ok'}>{invoice[4]}</Badge></div><div className="invoice-lines"><div><span>Panadol Extra 500mg × 2</span><strong>84.000 VNĐ</strong></div><div><span>Vitamin C DHG 500mg × 3</span><strong>294.000 VNĐ</strong></div><div><span>Khẩu trang y tế × 2</span><strong>108.000 VNĐ</strong></div></div><div className="invoice-total"><span>Tổng thanh toán</span><strong>{invoice[2]}</strong></div><div className="dialog__footer report-footer"><Button variant="secondary" onClick={() => setInvoice(null)}>Đóng</Button><Button icon="file" onClick={() => { setInvoice(null); onNavigate('Hóa đơn') }}>Xem hóa đơn đầy đủ</Button></div></section></div>}
  </div>
}
