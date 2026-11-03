import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useOnboardingStore } from './onboarding'
import { useCommerceStore } from './commerce'
import { submitApprovals } from '@/views/procurement/productApprovals'

export interface Supply { leadDays:number; minimum:number; increment:number; stock:number; tax:number; cost:number; original:number; promotion:'none'|'discount'|'fixed'; discount:number; fixed:number }
export type ProductEdit = Pick<Product, 'name'|'category'|'brand'|'sku'|'unit'|'salesArea'|'model'|'spec'|'taxCode'|'contractName'|'features'|'freightMode'|'attrs'|'description'|'cover'|'images'|'supply'|'parkIds'|'parks'>
export interface ApprovalEvent { time:string; action:string; actor?:string; status?:string; opinion?:string }
export interface ApprovalRecord { time:string; type:string; status:string; note:string; parkId?:string; parkName?:string; approver?:string; reviewedAt?:string; opinion?:string; events?:ApprovalEvent[] }
export interface Product { id:string; name:string; category:string; brand:string; sku:string; unit:string; salesArea?:string; model?:string; spec?:string; taxCode?:string; contractName?:string; features?:string; freightMode?:string; attrs?:{id:string;name:string;value:string}[]; code?:string; sales?:number; parkStatuses?:Record<string,'on_sale'|'offline'|'reviewing'|'rejected'>; parkRejectionReasons?:Record<string,string>; editDraft?:ProductEdit; pendingEdit?:ProductEdit; pendingPrice?:{parkIds:string[];values:Record<string,Supply>;note:string}; approvalLog?:ApprovalRecord[]; priceHistory?:{time:string;parkId:string;original:number;sale:number;tax?:number}[]; description:string; cover:string; images:string[]; supply:Supply; parkIds:string[]; parks:Record<string,Supply>; status:'draft'|'reviewing'|'rejected'|'on_sale'|'offline'|'price_review'; updatedAt:string }
export const defaultSupply = ():Supply => ({leadDays:3,minimum:1,increment:1,stock:500,tax:13,cost:85,original:100,promotion:'discount',discount:90,fixed:90})
export const newProduct = ():Product => ({id:crypto.randomUUID(),name:'',category:'',brand:'',sku:'',unit:'件',salesArea:'',model:'',spec:'',taxCode:'',contractName:'',features:'',freightMode:'免运费',attrs:[],description:'',cover:'',images:[],supply:defaultSupply(),parkIds:[],parks:{},status:'draft',updatedAt:new Date().toISOString()})

export function productEditSnapshot(product:Product):ProductEdit {
  const keys: (keyof ProductEdit)[] = ['name','category','brand','sku','unit','salesArea','model','spec','taxCode','contractName','features','freightMode','attrs','description','cover','images','supply','parkIds','parks']
  const copy = JSON.parse(JSON.stringify(product)) as Product
  return Object.fromEntries(keys.map(key=>[key,copy[key]])) as ProductEdit
}
export function syncSupplyFields(product:Product, parkIds:string[], fields:string[]) {
  for (const id of parkIds) {
    const target=product.parks[id]; if (!target || !product.parkIds.includes(id)) continue
    for (const key of fields) {
      if (key==='promotion') { target.promotion=product.supply.promotion; target.discount=product.supply.discount; target.fixed=product.supply.fixed }
      else if (['leadDays','minimum','increment','stock','tax','cost','original'].includes(key)) { const k=key as Exclude<keyof Supply,'promotion'>; target[k]=product.supply[k] }
    }
  }
}
export function salePrice(s:Supply) { const n=Number(s.original)||0; return s.promotion==='discount' ? n*(Number(s.discount)||0)/100 : s.promotion==='fixed' ? (Number(s.fixed)||0) : n }
export function validSupplyPrice(s:Supply) {
  return [s.tax,s.cost,s.original].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0)
    && ['none','discount','fixed'].includes(s.promotion)
    && (s.promotion!=='discount'||(typeof s.discount==='number'&&Number.isFinite(s.discount)&&s.discount>=0&&s.discount<=100))
    && (s.promotion!=='fixed'||(typeof s.fixed==='number'&&Number.isFinite(s.fixed)&&s.fixed>=0))
}
export const useProductsStore=defineStore('products',()=>{
  const ob=useOnboardingStore(); const commerce=useCommerceStore(); const key=computed(()=>`gysd-products-${ob.activeId}`)
  function samples():Product[] { const names=['安全防护帽','防护手套','工业防护眼镜','一次性防护口罩','绝缘工具套装','办公打印纸','工业清洁剂','防滑安全鞋','劳保工作服','警示标识牌','电工胶带','工业收纳箱']; const statuses:Product['status'][]=['on_sale','on_sale','reviewing','rejected','offline','draft','price_review']; const available=commerce.joinedParks.map(p=>p.id); return names.map((name,i)=>{const p=newProduct();const ids=available.slice(0,(i%2)+1); const supply={...defaultSupply(),stock:120+i*30,original:50+i*12,cost:30+i*8};return {...p,id:`JC-PRODUCT-${String(i+1).padStart(3,'0')}`,name,category:ob.draft.businessCategories?.[0]||'个人防护 / 安全防护',brand:ob.draft.brands?.[0]?.name||'3M',sku:`SKU-${10001+i}`,code:`SP${20260001+i}`,model:`型号 ${i+1}`,spec:'标准款',features:'适用于企业日常采购与安全防护。',description:'商品规格清晰，支持按园区配置供货及价格。',supply,parkIds:ids,parks:Object.fromEntries(ids.map(id=>[id,{...supply}])),status:statuses[i%statuses.length],parkStatuses:Object.fromEntries(ids.map(id=>[id,i%7===2?'reviewing':i%7===3?'rejected':i%7===4?'offline':'on_sale'])),sales:i*13,updatedAt:new Date(Date.now()-i*86400000).toISOString()} }) }
  function read():Product[] {try { const raw=localStorage.getItem(key.value); const marker=key.value+'-demo-v2'; if(raw===null){const data=samples();localStorage.setItem(key.value,JSON.stringify(data));localStorage.setItem(marker,'1');return data} const data=JSON.parse(raw);if(Array.isArray(data)){if(!data.length&&!localStorage.getItem(marker)){const demo=samples();localStorage.setItem(key.value,JSON.stringify(demo));localStorage.setItem(marker,'1');return demo}localStorage.setItem(marker,'1');return data}return [] }catch{return []}}
  const products=ref<Product[]>(read());watch(key,()=>{products.value=read()});watch(products,()=>localStorage.setItem(key.value,JSON.stringify(products.value)),{deep:true,flush:'sync'})
  function save(product:Product){const item=JSON.parse(JSON.stringify({...product,updatedAt:new Date().toISOString()})) as Product; const i=products.value.findIndex(p=>p.id===item.id);if(i<0)products.value.unshift(item);else products.value[i]=item}
  function saveEditDraft(product:Product) {
    const existing=products.value.find(item=>item.id===product.id)
    if (!existing || existing.status==='draft') { save(product); return }
    save({...existing,editDraft:productEditSnapshot(product)})
  }
  function submitEdit(product:Product) {
    const existing=products.value.find(item=>item.id===product.id)
    if (!existing || existing.status==='draft') { save(product); return }
    if (existing.pendingPrice || existing.pendingEdit || existing.status==='reviewing' || Object.values(existing.parkStatuses || {}).includes('reviewing')) throw new Error('该商品已有待审核事项，请先完成审核')
    const sameSupply = (a:Supply|undefined,b:Supply|undefined) => !!a && !!b && (['leadDays','minimum','increment','stock','cost','original','promotion','discount','fixed'] as const).every(key=>a[key]===b[key])
    const before=[...existing.parkIds].sort(), after=[...product.parkIds].sort()
    const sameParks=before.length===after.length && before.every((id,index)=>id===after[index] && sameSupply(existing.parks[id],product.parks[id]))
    if (!sameSupply(existing.supply,product.supply) || !sameParks) throw new Error('已发布商品的供货、价格或园区发生变化，请使用调价、库存或上下架操作；如配置已更新，请重新打开编辑页面')
    const taxChanged=existing.supply.tax!==product.supply.tax || before.some(id=>existing.parks[id]?.tax!==product.parks[id]?.tax)
    if (taxChanged && (!validSupplyPrice(product.supply) || after.some(id=>!product.parks[id] || product.parks[id].tax!==product.supply.tax))) throw new Error('税点只能统一调整，请检查所有园区的税点')
    const snapshot=productEditSnapshot(product)
    save({...existing,editDraft:snapshot,pendingEdit:snapshot,approvalLog:submitApprovals(existing,'商品资料变更',[])})
  }
  function remove(id:string){products.value=products.value.filter(p=>p.id!==id)}
  function fillSamples(){const existing=new Set(products.value.map(p=>p.id)); products.value=[...products.value,...samples().filter(p=>!existing.has(p.id))]}
  function clearSamples(){products.value=products.value.filter(p=>!p.id.startsWith('JC-PRODUCT-'))}
  return {products,save,saveEditDraft,submitEdit,remove,fillSamples,clearSamples}
})
