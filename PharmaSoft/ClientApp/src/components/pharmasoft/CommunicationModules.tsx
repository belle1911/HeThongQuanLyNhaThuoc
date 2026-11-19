import { usePersistentState } from '@/lib/persist'
import { todayVN } from '@/lib/today'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Badge, Button, Icon } from './App'
import { ProductImage } from './ProductImage'

type ChatMessage={id:number;sender:'user'|'bot';text:string;time:string;products?:Medicine[];error?:boolean;doctorReferral?:boolean}
type Medicine={id:string;name:string;category:string;price:string;stock:number;unit:string;expiry:string;ingredient:string;color:string;prescription?:boolean;usage?:string;precautions?:string}
const medicines:Medicine[]=[
  {id:'MED-0001',name:'Panadol Extra 500mg',category:'Giảm đau – Hạ sốt',price:'42.000 VNĐ',stock:286,unit:'Hộp',expiry:'18/09/2026',ingredient:'Paracetamol 500mg, Caffeine 65mg',color:'green',prescription:false,usage:'Người lớn: 1-2 viên mỗi 4-6 giờ khi đau hoặc sốt. Tối đa 8 viên/ngày (4g Paracetamol).',precautions:'Không dùng chung với các thuốc khác chứa Paracetamol; không uống rượu bia trong thời gian dùng thuốc; thận trọng người suy gan, thận.'},
  {id:'MED-0006',name:'Efferalgan 500mg',category:'Giảm đau – Hạ sốt',price:'52.000 VNĐ',stock:118,unit:'Hộp',expiry:'15/11/2026',ingredient:'Paracetamol 500mg (dạng sủi)',color:'red',prescription:false,usage:'Hòa tan hoàn toàn 1 viên trong 150-200ml nước lọc. Uống sau khi tan hết bọt khí. Cách nhau 4-6 giờ nếu còn sốt/đau.',precautions:'Viên sủi chứa muối Natri (~412mg/viên), thận trọng với người ăn kiêng muối, cao huyết áp. Không uống quá 4g/ngày.'},
  {id:'MED-0003',name:'Vitamin C DHG 500mg',category:'Vitamin & khoáng chất',price:'98.000 VNĐ',stock:164,unit:'Chai',expiry:'10/12/2026',ingredient:'Acid ascorbic (Vitamin C) 500mg',color:'orange',prescription:false,usage:'Người lớn: 1 viên/ngày, uống vào buổi sáng hoặc trưa sau bữa ăn. Uống kèm nhiều nước.',precautions:'Tránh uống sau 16h vì có thể gây mất ngủ và lắng đọng tạo sỏi thận oxalat; thận trọng người có tiền sử sỏi thận.'},
  {id:'MED-0007',name:'Berocca Performance',category:'Vitamin & khoáng chất',price:'135.000 VNĐ',stock:67,unit:'Tuýp',expiry:'20/10/2025',ingredient:'Vitamin nhóm B, Vitamin C, Kẽm, Magie, Canxi',color:'yellow',prescription:false,usage:'1 viên sủi/ngày. Hòa tan vào 200ml nước lọc, uống vào buổi sáng để nạp năng lượng.',precautions:'Nước tiểu có thể chuyển màu vàng sáng do Vitamin B2 (vô hại); không uống quá liều khuyến nghị; chứa muối natri.'},
  {id:'MED-0004',name:'Smecta 3g',category:'Tiêu hóa',price:'112.000 VNĐ',stock:8,unit:'Hộp',expiry:'06/08/2025',ingredient:'Diosmectite 3g',color:'purple',prescription:false,usage:'Người lớn: 3 gói/ngày chia 3 lần. Pha gói bột vào khoảng 50ml nước ấm hoặc thức ăn sệt.',precautions:'Uống cách xa bữa ăn và cách các loại thuốc khác ít nhất 2 giờ vì Diosmectite có thể làm giảm hấp thu thuốc khác. Bắt buộc bù nước điện giải kèm theo.'},
  {id:'MED-0005',name:'Omeprazol 20mg',category:'Tiêu hóa',price:'65.000 VNĐ',stock:96,unit:'Hộp',expiry:'28/03/2027',ingredient:'Omeprazole 20mg (Ức chế bơm proton PPI)',color:'cyan',prescription:true,usage:'1 viên/ngày vào buổi sáng trước khi ăn 30-60 phút. Nuốt nguyên viên, không nhai hoặc nghiền nát hạt vi bao.',precautions:'Thuốc kê đơn (Rx). Cần theo dõi của bác sĩ nếu dùng trên 8 tuần; có thể tương tác với Clopidogrel, Diazepam.'},
  {id:'MED-0002',name:'Augmentin 625mg',category:'Kháng sinh',price:'176.000 VNĐ',stock:42,unit:'Hộp',expiry:'22/01/2026',ingredient:'Amoxicillin 500mg + Acid clavulanic 125mg',color:'blue',prescription:true,usage:'THUỐC KÊ ĐƠN BẮT BUỘC. Liều thông thường người lớn: 1 viên x 2-3 lần/ngày ngay đầu bữa ăn để giảm khó chịu dạ dày.',precautions:'BẮT BUỘC có đơn bác sĩ. Chống chỉ định người dị ứng Penicillin. Phải dùng đủ liệu trình 7-10 ngày, không tự ý ngưng thuốc tránh kháng kháng sinh.'},
  {id:'MED-0008',name:'Decolgen Forte',category:'Cảm cúm – Hô hấp',price:'63.000 VNĐ',stock:24,unit:'Hộp',expiry:'04/04/2025',ingredient:'Paracetamol 500mg, Phenylephrine 10mg, Chlorpheniramine 2mg',color:'gray',prescription:false,usage:'Người lớn: 1-2 viên/lần, 3-4 lần/ngày sau khi ăn.',precautions:'Có thể gây buồn ngủ, khô miệng; không lái xe hay vận hành máy móc sau khi uống; thận trọng người tăng huyết áp, cường giáp.'},
  {id:'MED-0010',name:'Boganic Traphaco',category:'Gan – Mật',price:'126.000 VNĐ',stock:74,unit:'Hộp',expiry:'08/12/2026',ingredient:'Cao Actisô, Cao Biển súc (Rau đắng), Cao Bìm bìm',color:'orange',prescription:false,usage:'Người lớn: 1-2 viên/lần, ngày 3 lần sau bữa ăn.',precautions:'Không dùng cho người bị tắc mật, viêm gan cấp tính, người tỳ vị hư hàn tiêu chảy.'},
  {id:'MED-0011',name:'Oresol 245',category:'Tiêu hóa',price:'6.500 VNĐ',stock:320,unit:'Gói',expiry:'25/06/2026',ingredient:'Natri clorid, Kali clorid, Natri citrat, Glucose khan',color:'blue',prescription:false,usage:'Pha đúng 1 gói vào đúng thể tích nước sôi để nguội ghi trên bao bì (200ml). Uống từng ngụm nhỏ dần trong ngày.',precautions:'BẮT BUỘC pha đúng thể tích nước; không chia nhỏ gói; dung dịch đã pha chỉ uống trong 24 giờ.'},
  {id:'MED-0012',name:'Khẩu trang y tế 4 lớp',category:'Thiết bị y tế',price:'54.000 VNĐ',stock:84,unit:'Hộp',expiry:'Không áp dụng',ingredient:'Vải không dệt kháng khuẩn cao cấp 4 lớp',color:'cyan',prescription:false,usage:'Đeo che kín mũi và miệng, điều chỉnh nẹp mũi ôm sát.',precautions:'Khẩu trang dùng một lần, thay mới khi bị bẩn hoặc ướt.'},
]
const suggestions=['Thuốc giảm đau hạ sốt','Cách dùng Panadol Extra','Triệu chứng cảm cúm','Thuốc dạ dày Omeprazol','Kháng sinh Augmentin','Lưu ý khi dùng Paracetamol']
const now=()=>new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})

type HistorySession={id:number;title:string;preview:string;date:string;messages:ChatMessage[]}

export function MedicineChatbot({onNavigate}:{onNavigate?:(view:string)=>void}){
  const welcome:ChatMessage={id:1,sender:'bot',text:'Xin chào! Tôi là Trợ lý Dược sĩ AI PHARMASOFT.\n\nTôi có thể hỗ trợ bạn:\n• Tra cứu thông tin thuốc, giá bán, tồn kho và hạn sử dụng.\n• Hướng dẫn cách dùng và các lưu ý an toàn khi sử dụng thuốc.\n• Tư vấn cách xử trí ban đầu cho các triệu chứng thông thường (đau đầu, sốt, cảm cúm, đau dạ dày, tiêu chảy...).\n\n⚠️ Lưu ý an toàn: Trợ lý không tự ý chẩn đoán hoặc kê đơn thuốc đặc trị. Nếu có triệu chứng nghiêm trọng hoặc cần dùng thuốc kê đơn, vui lòng liên hệ Bác sĩ chuyên môn!',time:now()}
  const [open,setOpen]=useState(true)
  const [messages,setMessages]=useState<ChatMessage[]>([welcome])
  const [input,setInput]=useState('')
  const [loading,setLoading]=useState(false)
  const [selected,setSelected]=useState<Medicine|null>(null)
  const [activeSessionId,setActiveSessionId]=useState(1)
  const [history,setHistory]=useState<HistorySession[]>([
    {id:1,title:'Tư vấn thuốc giảm đau, sốt',preview:'Panadol Extra, Efferalgan 500mg...',date:'Hôm nay',messages:[welcome]},
    {id:2,title:'Cách dùng Oresol và Smecta',preview:'Pha đúng 200ml nước, bù điện giải...',date:'Hôm qua',messages:[
      {id:1,sender:'user',text:'Bị tiêu chảy nên uống thuốc gì và pha Oresol thế nào?',time:'10:15'},
      {id:2,sender:'bot',text:'💧 TƯ VẤN TIÊU CHẢY & BÙ NƯỚC ĐIỆN GIẢI:\n\n• Ưu tiên số 1: Bù nước bằng Oresol 245. BẮT BUỘC pha đúng 1 gói vào 200ml nước sôi để nguội, uống từng ngụm nhỏ sau mỗi lần đi ngoài.\n• Giảm tiêu chảy: Dùng Smecta 3g (uống cách xa bữa ăn và cách các thuốc khác ít nhất 2 giờ).\n• Lưu ý: Nếu đi ngoài phân có máu, mất nước mắt trũng hoặc sốt cao, cần đến cơ sở y tế ngay.',time:'10:16',products:medicines.filter(m=>m.id==='MED-0004'||m.id==='MED-0011')}
    ]},
    {id:3,title:'Cảnh báo kháng sinh Augmentin',preview:'Thuốc kê đơn, cần đơn bác sĩ...',date:'22/06/2025',messages:[
      {id:1,sender:'user',text:'Tôi bị đau họng có uống được Augmentin không?',time:'16:20'},
      {id:2,sender:'bot',text:'⚠️ CẢNH BÁO AN TOÀN — THUỐC KÊ ĐƠN (Rx):\n\nAugmentin 625mg là KHÁNG SINH KÊ ĐƠN BẮT BUỘC. Đa số đau họng thông thường là do virus, kháng sinh không có tác dụng và có thể gây dị ứng, rối loạn đường ruột hoặc vi khuẩn kháng thuốc.\n\n👨‍⚕️ Khuyến nghị: Bạn hãy súc họng nước muối ấm, uống nhiều nước và đi khám Bác sĩ hoặc bấm "Chat bác sĩ" để được chẩn đoán chính xác.',time:'16:21',products:medicines.filter(m=>m.id==='MED-0002'),doctorReferral:true}
    ]}
  ])
  const bottom=useRef<HTMLDivElement>(null)
  useEffect(()=>{bottom.current?.scrollIntoView({behavior:'smooth'})},[messages,loading])

  function reply(question:string):{text:string;products?:Medicine[];error?:boolean;doctorReferral?:boolean}{
    const raw=question.trim(),lower=raw.toLowerCase()

    // 1. Dấu hiệu nguy hiểm / Cấp cứu
    if(lower.includes('khó thở')||lower.includes('tức ngực')||lower.includes('đau thắt ngực')||lower.includes('co giật')||lower.includes('nôn ra máu')||lower.includes('ho ra máu')||lower.includes('sốt co giật')||lower.includes('mất ý thức')||lower.includes('hôn mê')||lower.includes('ngộ độc nặng')||lower.includes('sốc phản vệ')){
      return {text:'🚨 CẢNH BÁO Y TẾ KHẨN CẤP:\n\nTriệu chứng bạn mô tả là dấu hiệu nguy hiểm có thể đe dọa tính mạng.\n\n⛔ Vui lòng KHÔNG tự ý dùng bất kỳ loại thuốc nào tại nhà.\n🚑 Hãy gọi ngay Cấp cứu 115 hoặc đến khoa Cấp cứu của bệnh viện gần nhất để được can thiệp y tế kịp thời!',error:true,doctorReferral:true}
    }

    // 2. Thuốc kê đơn & Kháng sinh (Prescription Guardrails)
    if(lower.includes('augmentin')||lower.includes('kháng sinh')||lower.includes('amoxicillin')||lower.includes('cephalexin')||lower.includes('azithromycin')||lower.includes('ciprofloxacin')||lower.includes('huyết áp')||lower.includes('amlodipine')||lower.includes('tiểu đường')||lower.includes('insulin')||lower.includes('an thần')||lower.includes('thuốc ngủ')||lower.includes('diazepam')||lower.includes('corticoid')||lower.includes('prednisolone')){
      const match=medicines.filter(m=>m.prescription||m.category.includes('Kháng sinh')||lower.includes(m.name.toLowerCase()))
      return {text:'⚠️ CẢNH BÁO AN TOÀN — THUỐC KÊ ĐƠN (Rx):\n\nThuốc bạn đang tra cứu là THUỐC KÊ ĐƠN BẮT BUỘC. Theo quy định của Bộ Y tế và tiêu chuẩn thực hành dược:\n• Chatbot tuyệt đối không tự ý chẩn đoán hoặc hướng dẫn sử dụng kháng sinh/thuốc kê đơn khi chưa có chỉ định của bác sĩ.\n• Tự ý dùng thuốc kê đơn có thể gây kháng kháng sinh, sốc phản vệ hoặc tổn thương chức năng gan/thận.\n\n👨‍⚕️ Hướng dẫn cho bạn:\n1. Tham khảo ý kiến Bác sĩ chuyên khoa (bấm "Chat bác sĩ" trên menu để kết nối ngay).\n2. Xuất trình đơn thuốc hợp lệ từ cơ sở y tế khi mua thuốc tại quầy PHARMASOFT.',products:match.length?match:medicines.filter(m=>m.id==='MED-0002'),doctorReferral:true}
    }

    // 3. Triệu chứng đau đầu / sốt
    if(lower.includes('giảm đau')||lower.includes('hạ sốt')||lower.includes('đau đầu')||lower.includes('nhức đầu')||lower.includes('sốt')||lower.includes('đau răng')||lower.includes('đau cơ')||lower.includes('panadol')||lower.includes('efferalgan')){
      const prods=medicines.filter(m=>m.category.includes('Giảm đau'))
      return {text:'💊 TƯ VẤN TRIỆU CHỨNG ĐAU ĐẦU / SỐT THÔNG THƯỜNG:\n\n• Hoạt chất không kê đơn ưu tiên: Paracetamol (Panadol Extra 500mg, Efferalgan 500mg viên sủi).\n• Liều dùng tham khảo: Người lớn 1 viên 500mg (hoặc tối đa 2 viên nếu đau nhiều), cách nhau 4-6 giờ. Tối đa 4g (8 viên 500mg)/ngày.\n\n⚠️ Lưu ý an toàn:\n- Tuyệt đối KHÔNG uống rượu bia khi dùng thuốc (nguy cơ hủy hoại tế bào gan cấp tính).\n- Nghỉ ngơi nơi thoáng khí, chườm ấm trán/nách/bẹn và uống nhiều nước.\n- Nếu sốt cao trên 39°C kéo dài trên 3 ngày không hạ, cần đến bệnh viện khám ngay.',products:prods}
    }

    // 4. Cảm cúm, hắt hơi, sổ mũi
    if(lower.includes('cảm cúm')||lower.includes('sổ mũi')||lower.includes('nghẹt mũi')||lower.includes('chảy nước mũi')||lower.includes('hắt hơi')||lower.includes('cảm lạnh')||lower.includes('decolgen')){
      const prods=medicines.filter(m=>m.id==='MED-0008'||m.id==='MED-0003'||m.id==='MED-0007')
      return {text:'🤧 TƯ VẤN CẢM CÚM, NGHẸT MŨI, SỔ MŨI:\n\n• Thuốc tham khảo: Decolgen Forte (giảm nghẹt mũi, hắt hơi, hạ sốt nhẹ), xịt rửa mũi bằng nước muối sinh lý NaCl 0.9%.\n• Tăng sức đề kháng: Bổ sung Vitamin C DHG 500mg hoặc Berocca sủi giúp cơ thể nhanh hồi phục.\n\n⚠️ Lưu ý an toàn:\n- Thuốc cảm thường có hoạt chất kháng histamin gây buồn ngủ, tránh lái xe hoặc làm việc trên cao.\n- Giữ ấm cổ ngực, uống nhiều nước ấm pha mật ong gừng.\n- Nếu kèm khó thở hoặc sốt cao kéo dài trên 7 ngày, cần đến bệnh viện khám.',products:prods}
    }

    // 5. Đau dạ dày, ợ chua, trào ngược
    if(lower.includes('dạ dày')||lower.includes('đau bao tử')||lower.includes('ợ chua')||lower.includes('ợ nóng')||lower.includes('trào ngược')||lower.includes('omeprazol')){
      const prods=medicines.filter(m=>m.id==='MED-0005')
      return {text:'🫄 TƯ VẤN ĐAU DẠ DÀY / Ợ CHUA / TRÀO NGƯỢC:\n\n• Sản phẩm tham khảo: Omeprazol 20mg (giảm tiết acid dịch vị dạ dày).\n• Cách dùng đúng: Uống 1 viên vào buổi sáng trước bữa ăn 30-60 phút. Nuốt nguyên viên với nước lọc, không nhai hoặc nghiền nát.\n\n⚠️ Lưu ý an toàn & chế độ sinh hoạt:\n- Ăn đúng giờ, không để bụng quá đói hoặc quá no; tránh đồ cay nóng, nhiều dầu mỡ, kiêng rượu bia, cà phê.\n- Không nằm ngay sau khi ăn (chờ tối thiểu 2-3 tiếng).\n- Omeprazol là thuốc cần theo dõi. Nếu đau dữ dội, nôn ra máu hoặc sụt cân nhanh, hãy đến cơ sở y tế nội soi dạ dày ngay.',products:prods}
    }

    // 6. Tiêu chảy, rối loạn tiêu hóa, bù nước
    if(lower.includes('tiêu chảy')||lower.includes('đi ngoài')||lower.includes('ngộ độc')||lower.includes('smecta')||lower.includes('oresol')||lower.includes('rối loạn tiêu hóa')||lower.includes('bù nước')){
      const prods=medicines.filter(m=>m.id==='MED-0004'||m.id==='MED-0011')
      return {text:'💧 TƯ VẤN TIÊU CHẢY & RỐI LOẠN TIÊU HÓA:\n\n• Nguyên tắc quan trọng nhất: BÙ NƯỚC VÀ ĐIỆN GIẢI KỊP THỜI.\n• Sản phẩm tham khảo:\n  1. Oresol 245: BẮT BUỘC pha đúng 1 gói vào 200ml nước sôi để nguội, uống từng ngụm nhỏ rải rác.\n  2. Smecta 3g: Hấp phụ độc tố và bảo vệ niêm mạc ruột. Uống cách xa bữa ăn và cách xa các thuốc khác ít nhất 2 giờ.\n\n⚠️ Cảnh báo an toàn:\n- Nếu đi ngoài nhiều lần kiệt sức, phân có máu hoặc sốt cao, cần đưa người bệnh đến cơ sở y tế ngay.',products:prods}
    }

    // 7. Ho, đau rát họng, viêm họng
    if(lower.includes('đau họng')||lower.includes('rát họng')||lower.includes('viêm họng')||lower.includes('ho')||lower.includes('khản tiếng')){
      const prods=medicines.filter(m=>m.id==='MED-0003'||m.id==='MED-0006')
      return {text:'🫁 TƯ VẤN HO & ĐAU RÁT HỌNG:\n\n• Chăm sóc tại nhà: Súc họng bằng nước muối sinh lý ấm 3-4 lần/ngày, uống nhiều nước ấm, ngậm chanh mật ong hoặc viên ngậm thảo dược.\n• Hỗ trợ: Bổ sung Vitamin C 500mg tăng cường miễn dịch.\n\n⚠️ Lưu ý an toàn:\n- Đa số viêm họng cấp là do virus, KHÔNG tự ý mua kháng sinh uống khi chưa có chỉ định của bác sĩ.\n- Nếu ho khạc đờm đặc màu xanh/vàng kèm sốt cao, hoặc đau rát họng kéo dài trên 1 tuần, hãy đi khám tai mũi họng.',products:prods}
    }

    // 8. Dị ứng, mẩn ngứa, mề đay
    if(lower.includes('dị ứng')||lower.includes('mề đay')||lower.includes('mẩn ngứa')||lower.includes('ngứa da')||lower.includes('phát ban')){
      return {text:'🌿 TƯ VẤN DỊ ỨNG & MẨN NGỨA:\n\n• Xử trí ban đầu: Ngưng tiếp xúc ngay với tác nhân nghi ngờ (thức ăn lạ, mỹ phẩm, thời tiết lạnh, lông thú cưng).\n• Thuốc không kê đơn tham khảo: Thuốc kháng Histamin thế hệ mới (như Cetirizine 10mg hoặc Loratadine 10mg) giúp giảm ngứa, ít gây buồn ngủ.\n\n⚠️ CẢNH BÁO NGUY HIỂM:\n- Nếu xuất hiện phù môi, sưng mí mắt, tức ngực, khó thở, phải đến bệnh viện cấp cứu ngay vì đây là dấu hiệu phản vệ nguy kịch.',doctorReferral:true}
    }

    // 9. Mệt mỏi, suy nhược, bổ sung vitamin
    if(lower.includes('vitamin')||lower.includes('mệt mỏi')||lower.includes('suy nhược')||lower.includes('tăng đề kháng')||lower.includes('uể oải')||lower.includes('berocca')){
      const prods=medicines.filter(m=>m.category.includes('Vitamin'))
      return {text:'✨ TƯ VẤN NÂNG CAO SỨC KHỎE & BỔ SUNG VITAMIN:\n\n• Sản phẩm tham khảo:\n  1. Vitamin C DHG 500mg: Tăng sức đề kháng, chống oxy hóa, hỗ trợ hấp thu sắt.\n  2. Berocca Performance: Tổ hợp Vitamin nhóm B, C, Kẽm, Magie giúp phục hồi thể lực và giảm căng thẳng trí não.\n\n⚠️ Cách sử dụng tối ưu:\n- Uống vào buổi sáng hoặc trưa sau bữa ăn. KHÔNG uống buổi tối muộn (dễ gây mất ngủ, nguy cơ lắng cặn sỏi thận oxalat).\n- Uống kèm tối thiểu 1.5 - 2 lít nước lọc trong ngày.',products:prods}
    }

    // 10. Cách sử dụng / Liều dùng chung hoặc của thuốc đã chọn
    if(lower.includes('cách dùng')||lower.includes('hướng dẫn sử dụng')||lower.includes('uống như thế nào')||lower.includes('trước hay sau ăn')||lower.includes('liều dùng')||lower.includes('uống lúc nào')){
      if(selected&&selected.usage){
        return {text:`📋 HƯỚNG DẪN SỬ DỤNG CHO ${selected.name.toUpperCase()}:\n\n• Chỉ định / Nhóm: ${selected.category}\n• Cách dùng: ${selected.usage}\n• Lưu ý an toàn: ${selected.precautions||'Đọc kỹ tờ hướng dẫn sử dụng trong hộp thuốc.'}`}
      }
      return {text:'📋 NGUYÊN TẮC SỬ DỤNG THUỐC AN TOÀN TỪ DƯỢC SĨ:\n\n1. Đúng thuốc, đúng liều lượng, đúng thời điểm (đọc kỹ hướng dẫn sử dụng đi kèm thuốc).\n2. Thời điểm uống thuốc thông thường:\n   - Trước ăn 30-60 phút: Thuốc bảo vệ dạ dày, giảm tiết acid (Omeprazol).\n   - Sau ăn no: Thuốc giảm đau hạ sốt kháng viêm (Paracetamol, Decolgen), Vitamin.\n3. Uống thuốc với nước lọc đun sôi để nguội. Tránh uống cùng nước ngọt có ga, trà, cà phê hay rượu bia.\n4. Với viên sủi: Luôn hòa tan hoàn toàn trong cốc nước 150-200ml trước khi uống.\n\n💡 Bạn có thể chọn hoặc nhập tên một thuốc cụ thể để tôi hướng dẫn chi tiết hơn!'}
    }

    // 11. Lưu ý / Tác dụng phụ / Kiêng kỵ
    if(lower.includes('lưu ý')||lower.includes('tác dụng phụ')||lower.includes('chống chỉ định')||lower.includes('kiêng')||lower.includes('rượu bia')||lower.includes('bà bầu')||lower.includes('mang thai')||lower.includes('cho con bú')){
      if(selected&&selected.precautions){
        return {text:`⚠️ LƯU Ý AN TOÀN CHO ${selected.name.toUpperCase()}:\n\n${selected.precautions}\n\n• Nếu gặp triệu chứng bất thường như phát ban, ngứa, chóng mặt hoặc nôn ói, hãy ngưng thuốc và liên hệ dược sĩ/bác sĩ ngay.`}
      }
      return {text:'⚠️ CÁC LƯU Ý QUAN TRỌNG KHI SỬ DỤNG THUỐC:\n\n1. RƯỢU BIA: Tuyệt đối không uống rượu bia khi dùng thuốc (đặc biệt Paracetamol, kháng sinh, thuốc cảm).\n2. ĐỐI TƯỢNG ĐẶC BIỆT: Phụ nữ mang thai, mẹ cho con bú, trẻ nhỏ dưới 2 tuổi và người cao tuổi suy gan thận BẮT BUỘC phải có chỉ định của bác sĩ hoặc dược sĩ trước khi dùng thuốc.\n3. DỊ ỨNG: Ngưng sử dụng ngay lập tức nếu có dấu hiệu mẩn đỏ, ngứa, sưng mặt hoặc khó thở.\n4. HẠN DÙNG & BẢO QUẢN: Luôn kiểm tra hạn dùng, bảo quản nơi khô ráo, tránh ánh sáng trực tiếp, xa tầm tay trẻ em.'}
    }

    // 12. Tồn kho / Giá bán / Hạn sử dụng của thuốc cụ thể
    if((lower.includes('còn hàng')||lower.includes('tồn kho'))&&selected){
      return {text:`📦 ${selected.name} hiện còn ${selected.stock} ${selected.unit} trong hệ thống nhà thuốc (Mã: ${selected.id}).`}
    }
    if(lower.includes('giá')&&selected){
      return {text:`🏷️ Giá bán niêm yết của ${selected.name} là ${selected.price} / ${selected.unit}.`}
    }
    if((lower.includes('hạn')||lower.includes('hạn sử dụng'))&&selected){
      return {text:`📅 Lô thuốc ${selected.name} hiện tại có hạn sử dụng đến ngày ${selected.expiry}. Vui lòng đối chiếu trên bao bì khi nhận thuốc.`}
    }

    // 13. Tìm kiếm theo tên thuốc cụ thể
    const matchedProducts=medicines.filter(m=>lower.includes(m.name.toLowerCase())||lower.includes(m.id.toLowerCase())||lower.includes(m.ingredient.toLowerCase().split(',')[0].trim()))
    if(matchedProducts.length>0){
      const p=matchedProducts[0]
      return {
        text:`🔍 THÔNG TIN SẢN PHẨM: ${p.name.toUpperCase()}\n\n• Mã thuốc: ${p.id} • Nhóm: ${p.category}\n• Hoạt chất: ${p.ingredient}\n• Giá niêm yết: ${p.price} • Tồn kho: ${p.stock} ${p.unit}\n• Hạn dùng: ${p.expiry}\n• Phân loại: ${p.prescription?'Thuốc kê đơn (Rx) — Cần đơn bác sĩ':'Thuốc không kê đơn (OTC)'}\n\n${p.usage?`💡 Cách dùng: ${p.usage}\n`:''}${p.precautions?`⚠️ Lưu ý: ${p.precautions}`:''}`,
        products:matchedProducts
      }
    }

    // 14. Trường hợp chưa đủ thông tin / Không tìm thấy dữ liệu phù hợp -> Hướng dẫn liên hệ Bác sĩ / Dược sĩ
    return {
      text:'🤔 CHƯA ĐỦ THÔNG TIN ĐỂ TƯ VẤN AN TOÀN:\n\nHệ thống chưa ghi nhận đủ dữ liệu về độ tuổi, tiền sử bệnh và triệu chứng chi tiết của bạn để đưa ra khuyến nghị phù hợp.\n\n👨‍⚕️ Để đảm bảo an toàn tuyệt đối cho sức khỏe:\n1. Bấm vào mục "Chat bác sĩ" trên menu để được bác sĩ chuyên khoa tư vấn trực tuyến.\n2. Gọi Hotline Nhà thuốc PHARMASOFT: 1900 6868 để trao đổi trực tiếp với Dược sĩ chuyên môn.\n3. Hoặc bạn có thể thử đặt câu hỏi cụ thể hơn về tên thuốc (ví dụ: Panadol, Smecta, Vitamin C) hoặc triệu chứng (đau đầu, sốt, đau dạ dày...).',
      error:false,
      doctorReferral:true
    }
  }

  function send(text=input){
    const question=text.trim();if(!question||loading)return
    const userMsg:ChatMessage={id:Date.now(),sender:'user',text:question,time:now()}
    const nextMessages=[...messages,userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    // Cập nhật preview trong lịch sử
    setHistory(prev=>prev.map(item=>item.id===activeSessionId?{...item,preview:question.slice(0,35)+'...',messages:nextMessages}:item))

    window.setTimeout(()=>{
      const response=reply(question)
      const botMsg:ChatMessage={id:Date.now()+1,sender:'bot',text:response.text,time:now(),products:response.products,error:response.error,doctorReferral:response.doctorReferral}
      const finalMessages=[...nextMessages,botMsg]
      setMessages(finalMessages)
      setLoading(false)
      setHistory(prev=>prev.map(item=>item.id===activeSessionId?{...item,preview:response.text.slice(0,40)+'...',messages:finalMessages}:item))
    },600)
  }

  function submit(e:FormEvent){e.preventDefault();send()}

  function clear(){
    const newId=Date.now()
    const newSession:HistorySession={id:newId,title:'Cuộc trò chuyện mới',preview:'Bắt đầu tra cứu',date:'Bây giờ',messages:[welcome]}
    setHistory(prev=>[newSession,...prev])
    setActiveSessionId(newId)
    setMessages([welcome])
    setSelected(null)
  }

  function switchSession(session:HistorySession){
    setActiveSessionId(session.id)
    setMessages(session.messages&&session.messages.length?session.messages:[welcome])
    setSelected(null)
  }

  if(!open)return <div className="chatbot-entry card"><span><Icon name="bot" size={32}/></span><h2>Trợ lý tra cứu thuốc</h2><p>Tìm nhanh thông tin giá, tồn kho, danh mục, cách dùng và lưu ý từ hệ thống PHARMASOFT.</p><Button icon="bot" onClick={()=>setOpen(true)}>Mở chatbot</Button><div className="medical-disclaimer"><Icon name="shield"/><span>Không thay thế tư vấn của bác sĩ hoặc dược sĩ có chuyên môn.</span></div></div>

  return <div className="chatbot-shell card">
    <aside className="chat-history-panel">
      <div className="chat-history-title"><span><Icon name="bot"/></span><div><strong>Trợ lý PHARMASOFT</strong><small><i/> Sẵn sàng tra cứu</small></div></div>
      <Button icon="plus" onClick={clear}>Cuộc trò chuyện mới</Button>
      <div className="history-label">LỊCH SỬ TRÒ CHUYỆN</div>
      <div className="conversation-history">
        {history.map(item=><button key={item.id} className={activeSessionId===item.id?'active':''} onClick={()=>switchSession(item)}><Icon name="file"/><div><strong>{item.title}</strong><span>{item.preview}</span><small>{item.date}</small></div></button>)}
      </div>
      <div className="chat-data-note"><Icon name="help"/><span>Trợ lý AI tuân thủ nguyên tắc an toàn dược phẩm và không thay thế chẩn đoán y khoa.</span></div>
    </aside>

    <section className="chat-main">
      <header className="chat-main-header">
        <div><span className="chatbot-avatar"><Icon name="bot"/></span><div><strong>Trợ lý tra cứu & Tư vấn thuốc AI</strong><small>Thông tin quản lý sản phẩm • Hướng dẫn an toàn</small></div></div>
        <div style={{display:'flex',gap:6}}>
          {onNavigate&&<Button variant="secondary" icon="doctor" onClick={()=>onNavigate('Chat bác sĩ')}>Chat Bác sĩ</Button>}
          <button className="icon-button" title="Xóa cuộc trò chuyện" onClick={clear}><Icon name="archive"/></button>
          <button className="icon-button" title="Thu nhỏ" onClick={()=>setOpen(false)}><Icon name="close"/></button>
        </div>
      </header>

      <div className="medical-warning"><Icon name="shield"/><span><strong>Lưu ý an toàn:</strong> Chatbot không tự ý chẩn đoán hay kê đơn thuốc đặc trị. Hãy tham khảo ý kiến bác sĩ hoặc dược sĩ có chuyên môn trước khi dùng thuốc.</span></div>

      <div className="chat-messages">
        {messages.map(message=><div className={`chat-message ${message.sender} ${message.error?'error':''}`} key={message.id}>
          {message.sender==='bot'&&<span className="message-avatar"><Icon name={message.error?'help':'bot'}/></span>}
          <div className="message-content">
            <div className="message-bubble" style={{whiteSpace:'pre-line'}}>{message.text}</div>
            {message.doctorReferral&&onNavigate&&<div style={{marginTop:8}}>
              <Button icon="doctor" onClick={()=>onNavigate('Chat bác sĩ')}>Kết nối Bác sĩ tư vấn trực tuyến</Button>
            </div>}
            {message.products&&<div className="medicine-chat-results">
              {message.products.map(product=><button className={selected?.id===product.id?'selected':''} key={product.id} onClick={()=>{setSelected(product);setMessages(prev=>[...prev,{id:Date.now(),sender:'bot',text:`Đã chọn ${product.name} (${product.id}).\n• Giá niêm yết: ${product.price}\n• Tồn kho: ${product.stock} ${product.unit}\n• Hạn dùng: ${product.expiry}\n• Phân loại: ${product.prescription?'Thuốc kê đơn (Rx)':'Không kê đơn (OTC)'}\n\nBạn có thể hỏi thêm: "cách dùng thuốc này", "lưu ý tác dụng phụ" hoặc "giá thuốc này bao nhiêu".`,time:now()}])}}>
                <ProductImage className="medicine-product-image" name={product.name} strength={product.category} color={product.color}/>
                <div>
                  <strong>{product.name}</strong>
                  <small>{product.id} • {product.category} {product.prescription?'• Kê đơn':''}</small>
                  <b>{product.price}</b>
                </div>
                <div>
                  <Badge kind={product.stock<10?'warning':'ok'}>{product.stock} {product.unit}</Badge>
                  <small>HSD: {product.expiry}</small>
                </div>
                <Icon name="chevron"/>
              </button>)}
            </div>}
            <time>{message.time}</time>
          </div>
        </div>)}

        {loading&&<div className="chat-message bot"><span className="message-avatar"><Icon name="bot"/></span><div className="message-content"><div className="message-bubble typing"><i/><i/><i/></div><time>Đang phân tích và tra cứu dữ liệu...</time></div></div>}
        <div ref={bottom}/>
      </div>

      <div className="suggested-questions">
        <span>Gợi ý:</span>
        {suggestions.map(s=><button key={s} onClick={()=>send(s)}>{s}</button>)}
      </div>

      <form className="chat-composer" onSubmit={submit}>
        <button type="button" title="Gợi ý câu hỏi" onClick={()=>send('Nguyên tắc sử dụng thuốc an toàn')}><Icon name="grid"/></button>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Nhập tên thuốc, triệu chứng thông thường hoặc câu hỏi..." disabled={loading}/>
        <button className="send-button" disabled={!input.trim()||loading}><Icon name="chevron"/></button>
      </form>
    </section>
  </div>
}

type Doctor={id:number;name:string;initials:string;specialty:string;experience:string;status:'Đang trực tuyến'|'Đang bận'|'Ngoại tuyến';next:string;color:string}
type LiveMessage={id:number;sender:'customer'|'doctor';text:string;time:string;image?:boolean}
const doctors:Doctor[]=[
  {id:1,name:'BS. Nguyễn Hoàng Anh',initials:'HA',specialty:'Nội tổng quát',experience:'12 năm kinh nghiệm',status:'Đang trực tuyến',next:'Có thể trao đổi ngay',color:'green'},
  {id:2,name:'BS. Trần Minh Châu',initials:'MC',specialty:'Dược lâm sàng',experience:'9 năm kinh nghiệm',status:'Đang trực tuyến',next:'Có thể trao đổi ngay',color:'blue'},
  {id:3,name:'BS. Lê Thùy Dương',initials:'TD',specialty:'Nhi khoa',experience:'10 năm kinh nghiệm',status:'Đang bận',next:'Rảnh sau khoảng 15 phút',color:'purple'},
  {id:4,name:'BS. Phạm Quốc Việt',initials:'QV',specialty:'Da liễu',experience:'15 năm kinh nghiệm',status:'Ngoại tuyến',next:'Trực tuyến lúc 18:00',color:'orange'},
]
const initialLiveMessages:LiveMessage[]=[{id:1,sender:'customer',text:'Chào bác sĩ, tôi muốn trao đổi một số thông tin sức khỏe tổng quát.',time:'14:32'},{id:2,sender:'doctor',text:'Chào bạn. Đây là cuộc trò chuyện mô phỏng. Bạn có thể gửi nội dung để xem luồng trao đổi trong prototype.',time:'14:33'}]

export function DoctorChat({defaultPortal='customer',demoDoctorAuthenticated=false}:{defaultPortal?:'customer'|'doctor';demoDoctorAuthenticated?:boolean}){
  const [portal,setPortal]=useState<'customer'|'doctor'>(defaultPortal)
  const [doctorAuthenticated,setDoctorAuthenticated]=useState(demoDoctorAuthenticated)
  const [selectedDoctor,setSelectedDoctor]=useState<Doctor|null>(null)
  const [conversation,setConversation]=useState(false)
  const [messages,setMessages]=usePersistentState<LiveMessage[]>('live-chat',initialLiveMessages)
  const [input,setInput]=useState('')
  const [doctorInput,setDoctorInput]=useState('')
  const [doctorOnline,setDoctorOnline]=useState(true)
  const [ended,setEnded]=useState(false)
  const [unreadForDoctor,setUnreadForDoctor]=useState(2)
  const [unreadForCustomer,setUnreadForCustomer]=useState(0)
  const [loginError,setLoginError]=useState('')
  const bottom=useRef<HTMLDivElement>(null)
  useEffect(()=>bottom.current?.scrollIntoView({behavior:'smooth'}),[messages,portal])
  function sendCustomer(e:FormEvent){e.preventDefault();if(!input.trim()||ended)return;setMessages([...messages,{id:Date.now(),sender:'customer',text:input.trim(),time:now()}]);setInput('');setUnreadForDoctor(unreadForDoctor+1)}
  function sendDoctor(e:FormEvent){e.preventDefault();if(!doctorInput.trim()||ended)return;setMessages([...messages,{id:Date.now(),sender:'doctor',text:doctorInput.trim(),time:now()}]);setDoctorInput('');setUnreadForCustomer(unreadForCustomer+1)}
  function login(e:FormEvent<HTMLFormElement>){e.preventDefault();const d=new FormData(e.currentTarget);if(d.get('username')==='doctor01'&&d.get('password')==='Doctor@123'){setDoctorAuthenticated(true);setLoginError('')}else setLoginError('Tên đăng nhập hoặc mật khẩu không chính xác.')}
  function switchPortal(next:'customer'|'doctor'){setPortal(next);if(next==='doctor')setUnreadForDoctor(0);else setUnreadForCustomer(0)}
  return <div className="doctor-module">
    <div className="doctor-simulation-banner"><Icon name="doctor"/><div><strong>Mô phỏng trò chuyện – Không có bác sĩ thật đang kết nối</strong><span>Phiên bản thực tế cần API backend, xác thực bác sĩ, cơ sở dữ liệu và WebSocket để giao tiếp thời gian thực.</span></div><div className="portal-switch"><button className={portal==='customer'?'active':''} onClick={()=>switchPortal('customer')}>Giao diện khách hàng{unreadForCustomer>0&&<b>{unreadForCustomer}</b>}</button><button className={portal==='doctor'?'active':''} onClick={()=>switchPortal('doctor')}>Cổng bác sĩ{unreadForDoctor>0&&<b>{unreadForDoctor}</b>}</button></div></div>
    {portal==='customer'?<CustomerDoctorView doctors={doctors} selected={selectedDoctor} setSelected={setSelectedDoctor} conversation={conversation} start={()=>{if(selectedDoctor?.status==='Đang trực tuyến'){setConversation(true);setEnded(false)}}} messages={messages} input={input} setInput={setInput} send={sendCustomer} ended={ended} end={()=>setEnded(true)} bottom={bottom}/>:!doctorAuthenticated?<DoctorLogin error={loginError} onSubmit={login}/>:<DoctorDashboard online={doctorOnline} setOnline={setDoctorOnline} messages={messages} input={doctorInput} setInput={setDoctorInput} send={sendDoctor} ended={ended} end={()=>setEnded(true)} unread={unreadForDoctor} bottom={bottom} logout={()=>setDoctorAuthenticated(false)}/>}
  </div>
}

function CustomerDoctorView({doctors,selected,setSelected,conversation,start,messages,input,setInput,send,ended,end,bottom}:{doctors:Doctor[];selected:Doctor|null;setSelected:(x:Doctor)=>void;conversation:boolean;start:()=>void;messages:LiveMessage[];input:string;setInput:(x:string)=>void;send:(e:FormEvent)=>void;ended:boolean;end:()=>void;bottom:React.RefObject<HTMLDivElement|null>}){
  if(conversation&&selected)return <div className="live-chat-layout card"><aside className="customer-conversations"><div className="live-sidebar-title"><strong>Trò chuyện của tôi</strong><button><Icon name="search"/></button></div><button className="active"><span className={`doctor-avatar ${selected.color}`}>{selected.initials}<i/></span><div><strong>{selected.name}</strong><small>{messages.at(-1)?.text}</small><time>{messages.at(-1)?.time}</time></div></button><div className="past-conversations"><span>LỊCH SỬ</span><button><span className="doctor-avatar gray">TL</span><div><strong>BS. Đỗ Thanh Lam</strong><small>Cuộc trò chuyện đã kết thúc</small></div></button></div></aside><section className="live-chat-main"><LiveChatHeader doctor={selected} ended={ended} onEnd={end}/><div className="live-disclaimer"><Icon name="help"/><span>Đây là hội thoại mô phỏng, không phải tư vấn y tế thực tế.</span></div><LiveMessages messages={messages} bottom={bottom}/>{ended?<div className="conversation-ended"><Icon name="check"/><div><strong>Cuộc trò chuyện đã kết thúc</strong><span>Nội dung đã được lưu vào lịch sử mô phỏng.</span></div><Button variant="secondary">Đánh giá cuộc trò chuyện</Button></div>:<form className="live-composer" onSubmit={send}><button type="button" title="Đính kèm hình ảnh"><Icon name="file"/></button><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Nhập tin nhắn cho bác sĩ..."/><button className="send-button" disabled={!input.trim()}><Icon name="chevron"/></button><small>Hỗ trợ đính kèm JPG, PNG tối đa 5MB</small></form>}</section></div>
  return <div className="doctor-directory"><section className="doctor-welcome card"><div><span className="doctor-welcome-icon"><Icon name="doctor" size={28}/></span><div><span>TRÒ CHUYỆN CHUYÊN GIA</span><h2>Chat với bác sĩ</h2><p>Chọn một hồ sơ đang trực tuyến để trải nghiệm luồng hội thoại mô phỏng.</p></div></div><div className="doctor-safety"><Icon name="shield"/><span>Không sử dụng module này cho trường hợp khẩn cấp. Prototype không kết nối bác sĩ thật.</span></div></section><div className="directory-toolbar"><div><h2>Danh sách bác sĩ</h2><p>{doctors.filter(d=>d.status==='Đang trực tuyến').length} bác sĩ đang trực tuyến trong dữ liệu mẫu</p></div><div className="table-search"><Icon name="search"/><input placeholder="Tìm theo tên hoặc chuyên khoa..."/></div></div><section className="doctor-grid">{doctors.map(doctor=><article className={`doctor-card card ${selected?.id===doctor.id?'selected':''}`} key={doctor.id}><div className="doctor-card-top"><span className={`doctor-avatar large ${doctor.color}`}>{doctor.initials}<i className={doctor.status==='Đang trực tuyến'?'online':doctor.status==='Đang bận'?'busy':'offline'}/></span><Badge kind={doctor.status==='Đang trực tuyến'?'ok':doctor.status==='Đang bận'?'warning':'neutral'}>{doctor.status}</Badge></div><h3>{doctor.name}</h3><strong>{doctor.specialty}</strong><p>{doctor.experience}</p><div className="doctor-next"><Icon name="calendar"/><span>{doctor.next}</span></div><button className="doctor-profile-button" onClick={()=>setSelected(doctor)}>Xem hồ sơ</button>{selected?.id===doctor.id&&<div className="doctor-profile-expanded"><div><span>Chứng chỉ hành nghề</span><strong>CCHN-BS-02861</strong></div><div><span>Ngôn ngữ</span><strong>Tiếng Việt, Tiếng Anh</strong></div><p>Hồ sơ và trạng thái chỉ là dữ liệu mẫu cho prototype.</p><Button icon="doctor" onClick={start}>{doctor.status==='Đang trực tuyến'?'Bắt đầu trò chuyện':'Hiện không khả dụng'}</Button></div>}</article>)}</section></div>
}

function LiveChatHeader({doctor,ended,onEnd}:{doctor:Doctor;ended:boolean;onEnd:()=>void}){return <header className="live-chat-header"><span className={`doctor-avatar ${doctor.color}`}>{doctor.initials}<i className="online"/></span><div><strong>{doctor.name}</strong><small>{doctor.specialty} • {ended?'Cuộc trò chuyện đã kết thúc':'Đang trực tuyến (mô phỏng)'}</small></div><button className="icon-button"><Icon name="file"/></button><button className="end-chat-button" onClick={onEnd} disabled={ended}>Kết thúc</button></header>}
function LiveMessages({messages,bottom}:{messages:LiveMessage[];bottom:React.RefObject<HTMLDivElement|null>}){return <div className="live-messages"><div className="chat-date-divider"><span>Hôm nay, {todayVN()}</span></div>{messages.map(message=><div className={`live-message ${message.sender}`} key={message.id}>{message.sender==='doctor'&&<span className="doctor-avatar small green">HA</span>}<div><div>{message.image&&<span className="image-attachment"><Icon name="file"/>hinh-anh-dinh-kem.jpg</span>}{message.text}</div><time>{message.time}{message.sender==='customer'&&<Icon name="check" size={11}/>}</time></div></div>)}<div ref={bottom}/></div>}
function DoctorLogin({error,onSubmit}:{error:string;onSubmit:(e:FormEvent<HTMLFormElement>)=>void}){return <div className="doctor-login-shell card"><section className="doctor-login-visual"><span><Icon name="doctor" size={32}/></span><h2>Cổng thông tin bác sĩ</h2><p>Quản lý các cuộc hội thoại mô phỏng với khách hàng trên PHARMASOFT.</p><div><Icon name="shield"/><span>Giao diện dành cho tài khoản bác sĩ được xác thực trong sản phẩm thực tế.</span></div></section><section className="doctor-login-form"><span>ĐĂNG NHẬP BÁC SĨ</span><h2>Chào mừng trở lại</h2><p>Đăng nhập để quản lý các cuộc trò chuyện.</p>{error&&<div className="auth-alert"><Icon name="help"/><div><strong>Đăng nhập thất bại</strong><span>{error}</span></div></div>}<form onSubmit={onSubmit}><label className="field"><span>Tên đăng nhập</span><div className="auth-input"><Icon name="doctor"/><input name="username" placeholder="Tên đăng nhập bác sĩ"/></div></label><label className="field"><span>Mật khẩu</span><div className="auth-input"><Icon name="shield"/><input name="password" type="password" placeholder="Mật khẩu"/></div></label><button className="auth-submit">Đăng nhập cổng bác sĩ</button></form><div className="demo-login"><Icon name="help"/><span>Tài khoản mẫu: <strong>doctor01</strong> / <strong>Doctor@123</strong></span></div></section></div>}
function DoctorDashboard({online,setOnline,messages,input,setInput,send,ended,end,unread,bottom,logout}:{online:boolean;setOnline:(x:boolean)=>void;messages:LiveMessage[];input:string;setInput:(x:string)=>void;send:(e:FormEvent)=>void;ended:boolean;end:()=>void;unread:number;bottom:React.RefObject<HTMLDivElement|null>;logout:()=>void}){return <div className="doctor-dashboard card"><aside className="doctor-dashboard-sidebar"><div className="doctor-account"><span className="doctor-avatar large green">HA<i className={online?'online':'offline'}/></span><div><strong>BS. Nguyễn Hoàng Anh</strong><small>Nội tổng quát</small></div></div><label className="online-toggle"><span><i/>Trạng thái</span><button className={online?'active':''} onClick={()=>setOnline(!online)}><i/><b>{online?'Đang trực tuyến':'Ngoại tuyến'}</b></button></label><nav><button className="active"><Icon name="bell"/>Cuộc trò chuyện đến{unread>0&&<b>{unread}</b>}</button><button><Icon name="doctor"/>Đang tư vấn <span>1</span></button><button><Icon name="archive"/>Lịch sử <span>18</span></button><button><Icon name="users"/>Thông tin bệnh nhân</button></nav><button className="doctor-logout" onClick={logout}><Icon name="logout"/>Đăng xuất</button></aside><section className="doctor-queue"><header><h2>Cuộc trò chuyện</h2><p>1 hội thoại đang hoạt động</p></header><div className="queue-tabs"><button className="active">Đang chờ <span>1</span></button><button>Đang xử lý</button></div><button className="queue-item active"><span className="doctor-avatar blue">NH</span><div><strong>Nguyễn Thị Hồng</strong><small>{messages.at(-1)?.text}</small><time>Vừa xong</time></div>{unread>0&&<b>{unread}</b>}</button><div className="queue-history-label">GẦN ĐÂY</div><button className="queue-item"><span className="doctor-avatar gray">TK</span><div><strong>Trần Tuấn Kiệt</strong><small>Cuộc trò chuyện đã kết thúc</small><time>Hôm qua</time></div></button></section><section className="doctor-reply-panel"><header className="doctor-patient-header"><span className="doctor-avatar blue">NH</span><div><strong>Nguyễn Thị Hồng</strong><small>Mã KH-008642 • Hạng Vàng</small></div><button className="icon-button"><Icon name="users"/></button><button className="end-chat-button" onClick={end} disabled={ended}>Kết thúc tư vấn</button></header><div className="patient-info-strip"><div><small>NĂM SINH</small><strong>1988</strong></div><div><small>GIỚI TÍNH</small><strong>Nữ</strong></div><div><small>SỐ ĐIỆN THOẠI</small><strong>0903 182 456</strong></div><div><small>GHI CHÚ</small><strong>Hội thoại mô phỏng</strong></div></div><LiveMessages messages={messages} bottom={bottom}/>{ended?<div className="conversation-ended"><Icon name="check"/><div><strong>Đã kết thúc cuộc trò chuyện</strong><span>Hội thoại được lưu vào lịch sử mô phỏng.</span></div></div>:<form className="live-composer doctor-compose" onSubmit={send}><button type="button"><Icon name="file"/></button><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Nhập phản hồi cho khách hàng..."/><button className="send-button" disabled={!input.trim()}><Icon name="chevron"/></button><small>Phản hồi sẽ xuất hiện trong giao diện khách hàng của prototype.</small></form>}</section></div>}
