'use client'

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react'
import { SessionUser } from './roles'
import { persistCollection, readCollection } from '@/lib/persist'
import { evaluatePromotion, initialPromotions, markPromotionUsed, Promotion } from '@/lib/promotions'

export type DemoProduct={
  id:string;name:string;barcode:string;image?:string;ingredient:string;category:string;unit:string;purchase:number;price:number;stock:number;expiry:string;status:string;manufacturer:string;origin:string;form:string;strength:string;minimum:number;description:string;color:string;listed?:boolean;featured?:boolean;newArrival?:boolean;discount?:number;prescription?:boolean
}
export type CartLine={productId:string;quantity:number}
export type DemoOrder={
  id:string;invoiceId:string;customerId:string;customerName:string;phone:string;address:string;note:string;createdAt:string;items:Array<{productId:string;name:string;unit:string;quantity:number;unitPrice:number;discount:number;lineTotal:number}>;subtotal:number;promotionCode:string;discount:number;shippingFee:number;surcharge:number;total:number;paymentMethod:'COD'|'Chuyển khoản'|'Tiền mặt'|'Thanh toán QR';paymentStatus:string;orderStatus:string;transactionId:string;timeline:Array<{time:string;label:string;actor:string}>;cancelReason?:string;
  /** Nhân viên bán (đơn tại quầy POS) */
  employee?:string
}

export const initialDemoOrders: DemoOrder[] = [
  {
    id: 'DH59886538',
    invoiceId: 'HD59886538',
    customerId: 'KH008642',
    customerName: 'Nguyễn Thị Hồng',
    phone: '0903 182 456',
    address: '128 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP.HCM',
    note: 'Giao giờ hành chính, gọi trước khi giao.',
    createdAt: '08:18:06 11/11/2026',
    items: [
      {
        productId: 'MED-0001',
        name: 'Panadol Extra 500mg',
        unit: 'Hộp',
        quantity: 1,
        unitPrice: 42000,
        discount: 5,
        lineTotal: 39900,
      },
    ],
    subtotal: 42000,
    promotionCode: '',
    discount: 2100,
    shippingFee: 30000,
    surcharge: 0,
    total: 69900,
    paymentMethod: 'COD',
    paymentStatus: 'Chưa thanh toán',
    orderStatus: 'Đã tiếp nhận',
    transactionId: '',
    timeline: [
      { time: '08:18:06 11/11/2026', label: 'Đơn hàng được tạo', actor: 'Nguyễn Thị Hồng' },
      { time: '08:18:10 11/11/2026', label: 'Đã giữ tồn kho cho đơn hàng', actor: 'Hệ thống PHARMASOFT' },
    ],
  },
  {
    id: 'DH250624-0186',
    invoiceId: 'HD250624-0186',
    customerId: 'KH008642',
    customerName: 'Nguyễn Thị Hồng',
    phone: '0903 182 456',
    address: '45 Lê Duẩn, Bến Nghé, Quận 1, TP.HCM',
    note: 'Đơn mua định kỳ hàng tháng',
    createdAt: '14:28:00 24/06/2025',
    items: [
      {
        productId: 'MED-0001',
        name: 'Panadol Extra 500mg',
        unit: 'Hộp',
        quantity: 2,
        unitPrice: 42000,
        discount: 0,
        lineTotal: 84000,
      },
      {
        productId: 'MED-0003',
        name: 'Vitamin C DHG 500mg',
        unit: 'Chai',
        quantity: 3,
        unitPrice: 98000,
        discount: 5,
        lineTotal: 279300,
      },
    ],
    subtotal: 378000,
    promotionCode: 'HEALTH10',
    discount: 37800,
    shippingFee: 0,
    surcharge: 0,
    total: 340200,
    paymentMethod: 'Chuyển khoản',
    paymentStatus: 'Đã thanh toán',
    orderStatus: 'Hoàn tất',
    transactionId: 'GD250624881',
    timeline: [
      { time: '14:28:00 24/06/2025', label: 'Đơn hàng được tạo', actor: 'Nguyễn Thị Hồng' },
      { time: '14:30:15 24/06/2025', label: 'Thanh toán thành công qua QR ngân hàng', actor: 'Hệ thống PHARMASOFT' },
      { time: '16:00:00 24/06/2025', label: 'Giao hàng thành công', actor: 'Shipper GHTK' },
    ],
  },
]

export const initialDemoProducts:DemoProduct[]=[
  {id:'MED-0001',name:'Panadol Extra 500mg',barcode:'8935001800456',ingredient:'Paracetamol, Caffeine',category:'Giảm đau – Hạ sốt',unit:'Hộp',purchase:35000,price:42000,stock:286,expiry:'18/09/2026',status:'Còn hàng',manufacturer:'GSK',origin:'Ireland',form:'Viên nén bao phim',strength:'500mg + 65mg',minimum:50,description:'Thông tin sản phẩm được hiển thị theo hồ sơ quản lý đã phê duyệt.',color:'green',listed:true,featured:true,discount:5},
  {id:'MED-0002',name:'Augmentin 625mg',barcode:'8935001801286',ingredient:'Amoxicillin, Acid clavulanic',category:'Kháng sinh',unit:'Hộp',purchase:148000,price:176000,stock:42,expiry:'22/01/2026',status:'Sắp hết',manufacturer:'GlaxoSmithKline',origin:'Anh',form:'Viên nén bao phim',strength:'625mg',minimum:50,description:'Thuốc kê đơn. Chỉ bán sau khi dược sĩ kiểm tra đơn thuốc hợp lệ.',color:'blue',listed:true,prescription:true},
  {id:'MED-0003',name:'Vitamin C DHG 500mg',barcode:'8934602002382',ingredient:'Acid ascorbic',category:'Vitamin & khoáng chất',unit:'Chai',purchase:78000,price:98000,stock:164,expiry:'10/12/2026',status:'Còn hàng',manufacturer:'Dược Hậu Giang',origin:'Việt Nam',form:'Viên nén',strength:'500mg',minimum:30,description:'Thông tin sử dụng cần đối chiếu nhãn sản phẩm và tư vấn chuyên môn.',color:'orange',listed:true,featured:true,newArrival:true,discount:10},
  {id:'MED-0004',name:'Smecta 3g',barcode:'3582910037891',ingredient:'Diosmectite',category:'Tiêu hóa',unit:'Hộp',purchase:89000,price:112000,stock:8,expiry:'06/08/2025',status:'Sắp hết hạn',manufacturer:'Ipsen Pharma',origin:'Pháp',form:'Bột pha hỗn dịch',strength:'3g',minimum:20,description:'Thông tin sản phẩm cần đối chiếu tờ hướng dẫn sử dụng đi kèm.',color:'purple',listed:true},
  {id:'MED-0005',name:'Omeprazol 20mg',barcode:'8936113130257',ingredient:'Omeprazole',category:'Tiêu hóa',unit:'Hộp',purchase:48000,price:65000,stock:96,expiry:'28/03/2027',status:'Còn hàng',manufacturer:'Domesco',origin:'Việt Nam',form:'Viên nang cứng',strength:'20mg',minimum:25,description:'Thuốc kê đơn. Cần dược sĩ kiểm tra trước khi xác nhận giao.',color:'cyan',listed:true,prescription:true,newArrival:true},
  {id:'MED-0006',name:'Efferalgan 500mg',barcode:'8936113008426',ingredient:'Paracetamol',category:'Giảm đau – Hạ sốt',unit:'Hộp',purchase:41000,price:52000,stock:118,expiry:'15/11/2026',status:'Còn hàng',manufacturer:'UPSA SAS',origin:'Pháp',form:'Viên sủi',strength:'500mg',minimum:30,description:'Đọc kỹ hướng dẫn sử dụng và tham khảo dược sĩ khi cần.',color:'red',listed:true,featured:true},
  {id:'MED-0007',name:'Berocca Performance',barcode:'8936013245568',ingredient:'Vitamin nhóm B, C, khoáng chất',category:'Vitamin & khoáng chất',unit:'Tuýp',purchase:116000,price:135000,stock:67,expiry:'20/10/2025',status:'Sắp hết hạn',manufacturer:'Bayer',origin:'Thụy Sĩ',form:'Viên sủi',strength:'Đa vitamin',minimum:15,description:'Thông tin thành phần được lấy từ hồ sơ sản phẩm mẫu.',color:'yellow',listed:true,discount:12},
  {id:'MED-0008',name:'Decolgen Forte',barcode:'4806018004201',ingredient:'Paracetamol, Phenylephrine',category:'Cảm cúm – Hô hấp',unit:'Hộp',purchase:47000,price:63000,stock:0,expiry:'04/04/2025',status:'Đã hết hạn',manufacturer:'United Pharma',origin:'Việt Nam',form:'Viên nén',strength:'Phối hợp',minimum:20,description:'Sản phẩm hết hạn không được phép bán.',color:'gray',listed:false},
  // Trước đây chỉ có ở danh sách riêng của POS, nay gộp chung một nguồn tồn kho
  {id:'MED-0009',name:'Salonpas Hisamitsu',barcode:'4987188100555',ingredient:'Methyl salicylate, L-Menthol',category:'Da liễu',unit:'Hộp',purchase:28000,price:35000,stock:148,expiry:'16/02/2027',status:'Còn hàng',manufacturer:'Hisamitsu',origin:'Nhật Bản',form:'Miếng dán',strength:'Hộp 20 miếng',minimum:30,description:'Dùng ngoài da. Đọc kỹ hướng dẫn sử dụng trước khi dùng.',color:'green',listed:true},
  {id:'MED-0010',name:'Boganic Traphaco',barcode:'8934609000985',ingredient:'Cao Actiso, cao Rau đắng đất, cao Bìm bìm',category:'Gan – Mật',unit:'Hộp',purchase:105000,price:126000,stock:74,expiry:'08/12/2026',status:'Còn hàng',manufacturer:'Traphaco',origin:'Việt Nam',form:'Viên bao đường',strength:'Hộp 5 vỉ x 10 viên',minimum:20,description:'Thông tin sử dụng cần đối chiếu nhãn sản phẩm và tư vấn chuyên môn.',color:'orange',listed:true},
  {id:'MED-0011',name:'Oresol 245',barcode:'8936113058902',ingredient:'Glucose, Natri clorid, Kali clorid, Natri citrat',category:'Tiêu hóa',unit:'Gói',purchase:4800,price:6500,stock:320,expiry:'25/06/2026',status:'Còn hàng',manufacturer:'Domesco',origin:'Việt Nam',form:'Bột pha dung dịch',strength:'4,1g',minimum:100,description:'Pha đúng lượng nước theo hướng dẫn trên bao bì.',color:'blue',listed:true},
  {id:'MED-0012',name:'Khẩu trang y tế 4 lớp',barcode:'8938538012456',ingredient:'Vải không dệt, lớp lọc kháng khuẩn',category:'Thiết bị y tế',unit:'Hộp',purchase:40000,price:54000,stock:84,expiry:'Không áp dụng',status:'Còn hàng',manufacturer:'Nam Anh',origin:'Việt Nam',form:'Khẩu trang',strength:'Hộp 50 cái',minimum:20,description:'Sản phẩm dùng một lần.',color:'cyan',listed:true},
]

/** Đọc ngày dạng DD/MM/YYYY. Trả về null nếu không phải ngày (vd: "Không áp dụng"). */
export function parseVnDate(value:string):Date|null{
  const match=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((value||'').trim())
  if(!match)return null
  const date=new Date(Number(match[3]),Number(match[2])-1,Number(match[1]))
  return Number.isNaN(date.getTime())?null:date
}
function startOfToday(){const now=new Date();return new Date(now.getFullYear(),now.getMonth(),now.getDate())}
/** Thuốc đã hết hạn khi ngày hết hạn nhỏ hơn hôm nay (theo giờ máy). */
export function isExpired(expiry:string):boolean{
  const date=parseVnDate(expiry)
  return !!date&&date<startOfToday()
}
/** Trạng thái hiển thị tính từ tồn kho và hạn dùng thực tế. */
export function deriveStatus(product:Pick<DemoProduct,'stock'|'expiry'|'minimum'>):string{
  if(isExpired(product.expiry))return 'Đã hết hạn'
  if(product.stock<=0)return 'Hết hàng'
  const date=parseVnDate(product.expiry)
  if(date&&date.getTime()-startOfToday().getTime()<=90*24*3600*1000)return 'Sắp hết hạn'
  if(product.stock<product.minimum)return 'Sắp hết'
  return 'Còn hàng'
}
/** Đơn đã hoàn tất (đã giao/đã bán tại quầy) hoặc đã hủy thì không được hủy nữa, chỉ được trả hàng. */
export function canCancelOrder(order:DemoOrder):boolean{
  return !['Hoàn tất','Đã hủy'].includes(order.orderStatus)&&!order.paymentStatus.toLowerCase().includes('hoàn tiền')
}

type CommerceContextValue={
  products:DemoProduct[];setProducts:React.Dispatch<React.SetStateAction<DemoProduct[]>>;cart:CartLine[];orders:DemoOrder[];
  addToCart:(productId:string)=>{ok:boolean;message:string};updateCart:(productId:string,quantity:number)=>void;clearCart:()=>void;
  placeOrder:(user:SessionUser,data:{name:string;phone:string;address:string;note:string;paymentMethod:'COD'|'Chuyển khoản';promotionCode:string;prescriptionConfirmed:boolean})=>{ok:boolean;message:string;order?:DemoOrder};
  cancelOrder:(id:string,reason:string)=>{ok:boolean;message:string};
  addOrder:(order:DemoOrder)=>void;
  /** Cộng/trừ tồn kho bán hàng của một thuốc (tìm theo mã, nếu không có thì theo tên). */
  adjustStock:(match:{id?:string;name?:string},delta:number)=>boolean;
}
const CommerceContext=createContext<CommerceContextValue|null>(null)
const DATA_KEY='pharmasoft-demo-commerce-v1'
// Phiên bản dữ liệu: 2 = đã gộp danh sách thuốc riêng của POS vào danh sách chung
const DATA_VERSION=2
function saveCommerce(products:DemoProduct[],cart:CartLine[],orders:DemoOrder[]){
  try{localStorage.setItem(DATA_KEY,JSON.stringify({version:DATA_VERSION,products,cart,orders}))}catch{}
}

function loadInitialCommerce():{products:DemoProduct[];cart:CartLine[];orders:DemoOrder[]}{
  try{
    const stored=JSON.parse(localStorage.getItem(DATA_KEY)||'null')
    if(stored){
      let savedProducts:DemoProduct[]=Array.isArray(stored.products)&&stored.products.length?stored.products:initialDemoProducts
      if(stored.version!==DATA_VERSION){
        // Dữ liệu cũ: bổ sung các thuốc trước đây chỉ có trong POS (chỉ làm một lần)
        const ids=new Set(savedProducts.map(product=>product.id))
        savedProducts=[...savedProducts,...initialDemoProducts.filter(product=>!ids.has(product.id))]
      }
      return{
        products:savedProducts.map((product:DemoProduct,index:number)=>{
          const id=typeof product.id==='string'&&product.id.trim()?product.id.trim():`MED-${String(index+1).padStart(4,'0')}`
          return{...product,id,barcode:typeof product.barcode==='string'&&product.barcode.trim()?product.barcode.trim():id}
        }),
        cart:Array.isArray(stored.cart)?stored.cart:[],
        orders:Array.isArray(stored.orders)&&stored.orders.length?stored.orders:initialDemoOrders,
      }
    }
  }catch{}
  return{products:initialDemoProducts.map(product=>({...product,barcode:product.barcode||product.id})),cart:[],orders:initialDemoOrders}
}

export function DemoCommerceProvider({children}:{children:ReactNode}){
  const [init]=useState(loadInitialCommerce)
  const [products,setProducts]=useState<DemoProduct[]>(init.products)
  const [cart,setCart]=useState<CartLine[]>(init.cart)
  const [orders,setOrders]=useState<DemoOrder[]>(init.orders)
  const placing=useRef(false)

  useEffect(()=>{
    saveCommerce(products,cart,orders)
  },[products,cart,orders])

  function addToCart(productId:string){const product=products.find(item=>item.id===productId);if(product&&isExpired(product.expiry))return{ok:false,message:'Sản phẩm đã hết hạn sử dụng, không thể bán.'};if(!product||!product.listed||product.stock<=0)return{ok:false,message:'Sản phẩm hiện không khả dụng.'};const current=cart.find(item=>item.productId===productId)?.quantity||0;if(current>=product.stock)return{ok:false,message:'Số lượng trong giỏ đã đạt mức tồn kho.'};setCart(existing=>existing.some(item=>item.productId===productId)?existing.map(item=>item.productId===productId?{...item,quantity:item.quantity+1}:item):[...existing,{productId,quantity:1}]);return{ok:true,message:'Đã thêm sản phẩm vào giỏ.'}}
  function updateCart(productId:string,quantity:number){const product=products.find(item=>item.id===productId);if(quantity<=0){setCart(items=>items.filter(item=>item.productId!==productId));return}setCart(items=>items.map(item=>item.productId===productId?{...item,quantity:Math.min(quantity,product?.stock||0)}:item).filter(item=>item.quantity>0))}
  function clearCart(){setCart([])}
  function addOrder(order:DemoOrder){
    // Chỉ cập nhật khi trùng đúng mã đơn; không ghi đè đơn khác chỉ vì trùng mã hóa đơn
    setOrders(current=>current.some(o=>o.id===order.id)?current.map(o=>o.id===order.id?order:o):[order,...current])
  }
  function adjustStock(match:{id?:string;name?:string},delta:number){
    const target=products.find(item=>(match.id&&item.id===match.id))||products.find(item=>match.name&&item.name.trim().toLowerCase()===match.name.trim().toLowerCase())
    if(!target||!delta)return false
    setProducts(current=>current.map(product=>{if(product.id!==target.id)return product;const stock=Math.max(0,product.stock+delta);return{...product,stock,status:deriveStatus({...product,stock})}}))
    return true
  }
  function placeOrder(user:SessionUser,data:{name:string;phone:string;address:string;note:string;paymentMethod:'COD'|'Chuyển khoản';promotionCode:string;prescriptionConfirmed:boolean}){
    if(placing.current)return{ok:false,message:'Đơn hàng đang được xử lý. Vui lòng không gửi lại.'};placing.current=true
    try{
      if(!cart.length)return{ok:false,message:'Giỏ hàng đang trống.'}
      const resolved=cart.map(line=>({line,product:products.find(item=>item.id===line.productId)}))
      if(resolved.some(item=>!item.product||item.line.quantity>item.product.stock))return{ok:false,message:'Tồn kho đã thay đổi. Vui lòng kiểm tra lại giỏ hàng.'}
      const expired=resolved.find(item=>item.product&&isExpired(item.product.expiry))
      if(expired)return{ok:false,message:`${expired.product!.name} đã hết hạn sử dụng. Vui lòng xóa khỏi giỏ hàng.`}
      if(resolved.some(item=>item.product?.prescription)&&!data.prescriptionConfirmed)return{ok:false,message:'Đơn có thuốc kê đơn. Vui lòng xác nhận cung cấp đơn thuốc để dược sĩ kiểm tra.'}
      const items=resolved.map(({line,product})=>{const p=product!;const discount=p.discount||0;return{productId:p.id,name:p.name,unit:p.unit,quantity:line.quantity,unitPrice:p.price,discount,lineTotal:Math.round(p.price*line.quantity*(1-discount/100))}})
      const subtotal=items.reduce((sum,item)=>sum+item.unitPrice*item.quantity,0),productDiscount=items.reduce((sum,item)=>sum+item.unitPrice*item.quantity*item.discount/100,0)
      // Mã khuyến mãi lấy từ màn hình Khuyến mãi (collection "promotions"), không viết cứng
      const promotions=readCollection<Promotion[]>('promotions',initialPromotions)
      const promo=data.promotionCode.trim()?evaluatePromotion(promotions,data.promotionCode,resolved.map(({line,product})=>({price:product!.price,quantity:line.quantity,category:product!.category}))):null
      if(promo&&!promo.ok)return{ok:false,message:`Mã ${promo.code}: ${promo.message}`}
      const code=promo?.ok?promo.code:'',codeDiscount=promo?.ok?promo.amount:0,discount=Math.round(productDiscount+codeDiscount),shippingFee=subtotal-discount>=500000?0:30000,surcharge=0,total=subtotal-discount+shippingFee+surcharge
      const stamp=Date.now(),id=`DH${String(stamp).slice(-8)}`,invoiceId=`HD${String(stamp).slice(-8)}`,createdAt=new Date().toLocaleString('vi-VN'),requiresPrescription=resolved.some(item=>item.product?.prescription)
      const order:DemoOrder={id,invoiceId,customerId:user.id,customerName:data.name,phone:data.phone,address:data.address,note:data.note,createdAt,items,subtotal,promotionCode:codeDiscount?code:'',discount,shippingFee,surcharge,total,paymentMethod:data.paymentMethod,paymentStatus:data.paymentMethod==='COD'?'Chưa thanh toán':'Chờ xác nhận',orderStatus:requiresPrescription?'Chờ dược sĩ kiểm tra đơn':'Đã tiếp nhận',transactionId:data.paymentMethod==='Chuyển khoản'?`GD${String(stamp).slice(-10)}`:'',timeline:[{time:createdAt,label:'Đơn hàng được tạo',actor:user.name},{time:createdAt,label:requiresPrescription?'Chờ kiểm tra đơn thuốc':'Đã giữ tồn kho cho đơn hàng',actor:'Hệ thống DEMO'}]}
      setProducts(current=>current.map(product=>{const line=cart.find(item=>item.productId===product.id);if(!line)return product;const stock=product.stock-line.quantity;return{...product,stock,status:deriveStatus({...product,stock})}}))
      setOrders(current=>[order,...current]);setCart([])
      if(code)persistCollection('promotions',markPromotionUsed(promotions,code))
      return{ok:true,message:'Đặt hàng thành công.',order}
    }finally{placing.current=false}
  }
  function cancelOrder(id:string,reason:string){
    const order=orders.find(item=>item.id===id)
    if(!order)return{ok:false,message:'Không tìm thấy đơn hàng.'}
    if(!canCancelOrder(order))return{ok:false,message:order.orderStatus==='Đã hủy'?'Đơn hàng đã được hủy trước đó.':'Đơn đã hoàn tất hoặc đã hoàn tiền, không thể hủy. Vui lòng dùng chức năng Trả hàng.'}
    // Hoàn lại đúng số lượng đã trừ khi đặt hàng; trạng thái tính lại theo tồn kho và hạn dùng
    setProducts(current=>current.map(product=>{const line=order.items.find(item=>item.productId===product.id);if(!line)return product;const stock=product.stock+line.quantity;return{...product,stock,status:deriveStatus({...product,stock})}}))
    setOrders(current=>current.map(item=>item.id===id?{...item,orderStatus:'Đã hủy',paymentStatus:'Đơn đã hủy',cancelReason:reason,timeline:[...item.timeline,{time:new Date().toLocaleString('vi-VN'),label:`Đã hủy: ${reason}`,actor:order.customerName}]}:item))
    return{ok:true,message:'Đã hủy đơn và hoàn lại tồn kho.'}
  }
  return <CommerceContext.Provider value={{products,setProducts,cart,orders,addToCart,updateCart,clearCart,placeOrder,cancelOrder,addOrder,adjustStock}}>{children}</CommerceContext.Provider>
}
export function useDemoCommerce(){const value=useContext(CommerceContext);if(!value)throw new Error('DemoCommerceProvider is missing');return value}
