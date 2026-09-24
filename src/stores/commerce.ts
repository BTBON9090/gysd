import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useOnboardingStore } from './onboarding'

export type ListingStatus = 'reviewing' | 'rejected' | 'on_sale' | 'offline'
export type OrderStatus = 'pending_payment' | 'pending_contract' | 'in_service' | 'pending_acceptance' | 'completed' | 'cancelled'
export type RefundStatus = 'pending' | 'client_confirm' | 'refunded' | 'rejected' | 'cancelled'
export interface Park { id: string; name: string; address: string; joinedAt?: string }
export interface Shop { name: string; intro: string; logo: string; introImages: string[]; teamImages: string[]; savedAt?: string }
export interface Case { id: string; category: string; title: string; intro: string; cover: string; createdAt: string }
export interface Spec { name: string; point: string; price: number; unit: string; startDays: number; dayType: string; deliveryDays: number; standard: string }
export interface Service { id: string; category: string; name: string; intro: string; cover: string; regions: string[]; media: string[]; detail: string; guarantee: string; images: string[]; caseIds: string[]; faqs: { question: string; answer: string }[]; taxRate: number; specs: Spec[]; listings: Record<string, { status: ListingStatus; forced?: boolean; reason?: string; at: string }>; updatedAt: string; published: boolean }
export interface Order { id: string; serviceId: string; serviceName: string; parkId: string; category: string; customer: string; amount: number; paid: number; deliverySnapshot?: string; specSnapshot?: Spec; quantity?: number; customerRequest?: string; requestAttachments?: string[]; paymentAt?: string; contractUploadedAt?: string; contractConfirmedAt?: string; status: OrderStatus; createdAt: string; contractFile: string; contractState: 'none' | 'waiting' | 'rejected' | 'confirmed'; deliverables: string[]; deliveryNote: string; acceptanceAt: string; completedAt: string; afterSaleEnd: string; shareRate: number; afterSaleDays: number; refunded: number; settlement: 'waiting' | 'settled' }
export interface Refund { id: string; orderId: string; requested: number; agreed: number; reason: string; status: RefundStatus; decision: 'close' | 'continue'; note: string; createdAt: string }
export interface Invoice { id: string; kind: 'customer' | 'platform'; orderIds: string[]; amounts?: Record<string,number>; parkId: string; amount: number; number: string; file: string; status: 'issued' | 'issuing' | 'failed' | 'returned' | 'returning'; title: string; email: string; subjectType?: string; ticketType?: string; taxId?: string; address?: string; phone?: string; bank?: string; account?: string; createdAt: string }
export interface Review { id: string; orderId: string; parkId: string; direction: 'to_supplier' | 'to_customer'; score: number; content: string; anonymous: boolean; images: string[]; followup: boolean; createdAt: string }
export interface CommerceData { parks: Park[]; shop: Shop; cases: Case[]; services: Service[]; orders: Order[]; refunds: Refund[]; invoices: Invoice[]; reviews: Review[]; walletOpen: boolean }
export const CATEGORIES = [
  { value: '企业服务 / 信息技术 / 软件开发', label: '企业服务 / 信息技术 / 软件开发' },
  { value: '企业服务 / 信息技术 / 自动化服务', label: '企业服务 / 信息技术 / 自动化服务' },
  { value: '企业服务 / 财税法务 / 财税咨询', label: '企业服务 / 财税法务 / 财税咨询' },
  { value: '企业服务 / 人力资源 / 招聘服务', label: '企业服务 / 人力资源 / 招聘服务' },
  { value: '企业服务 / 品牌营销 / 内容制作', label: '企业服务 / 品牌营销 / 内容制作' },
]
export const CATEGORY_TREE = (() => {
  type Node = { value: string; label: string; children?: Node[] }
  const roots: Node[] = []
  for (const item of CATEGORIES) {
    let level = roots
    for (const name of item.value.split(' / ')) {
      let node = level.find(x => x.value === name)
      if (!node) { node = { value: name, label: name, children: [] }; level.push(node) }
      level = node.children!
    }
  }
  return roots
})()
// 预览地区样例；正式树由中台地区接口提供。
export const REGION_OPTIONS = [
  { value: '上海市', label: '上海市', children: [{ value: '上海市', label: '上海市' }] },
  { value: '北京市', label: '北京市', children: [{ value: '北京市', label: '北京市' }] },
  { value: '广东省', label: '广东省', children: [{ value: '深圳市', label: '深圳市' }, { value: '广州市', label: '广州市' }, { value: '东莞市', label: '东莞市' }] },
  { value: '江苏省', label: '江苏省', children: [{ value: '苏州市', label: '苏州市' }, { value: '南京市', label: '南京市' }, { value: '无锡市', label: '无锡市' }] },
  { value: '浙江省', label: '浙江省', children: [{ value: '杭州市', label: '杭州市' }, { value: '宁波市', label: '宁波市' }] },
  { value: '河南省', label: '河南省', children: [{ value: '郑州市', label: '郑州市' }, { value: '洛阳市', label: '洛阳市' }] },
  { value: '四川省', label: '四川省', children: [{ value: '成都市', label: '成都市' }] },
]
const PARK_OPTIONS: Park[] = [
  { id: 'park-lingang', name: '上海临港新片区智能制造产业园', address: '上海市浦东新区临港新片区' },
  { id: 'park-suzhou', name: '苏州工业园区企业服务中心', address: '江苏省苏州市工业园区' },
  { id: 'park-zhengzhou', name: '郑州航空港产业园', address: '河南省郑州市航空港区' },
]
const now = () => new Date().toISOString()
const id = () => crypto.randomUUID()
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const plusDays = (start: string, days: number) => new Date(new Date(start).getTime() + days * 86400000).toISOString()
export const money = (n: number) => `¥${Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const dateText = (s?: string) => s ? new Date(s).toLocaleString('zh-CN', { hour12: false }) : '—'
export const STATUS_LABEL: Record<ListingStatus | OrderStatus | RefundStatus, string> = { reviewing: '审核中', rejected: '已驳回', on_sale: '已上架', offline: '已下架', pending_payment: '待支付', pending_contract: '待签约', in_service: '服务中', pending_acceptance: '待验收', completed: '已完成', cancelled: '已取消', pending: '待处理', client_confirm: '待客户确认', refunded: '已退款' }
function defaults(parkName: string, serviceName: string, intro: string): CommerceData {
  const found = PARK_OPTIONS.find(p => p.name === parkName)
  const park: Park = found ? { ...found, joinedAt: now() } : { id: 'park-entry', name: parkName || PARK_OPTIONS[0].name, address: '入驻申请园区', joinedAt: now() }
  return { parks: [park], shop: { name: serviceName, intro, logo: '', introImages: [], teamImages: [] }, cases: [], services: [], orders: [], refunds: [], invoices: [], reviews: [], walletOpen: false }
}
function read(key: string, fallback: CommerceData): CommerceData {
  try { const value = JSON.parse(localStorage.getItem(key) || 'null'); if (value?.parks && value?.services && value?.orders) return { ...fallback, ...value } } catch { /* recover demo state */ }
  return fallback
}
export function emptyService(): Service { return { id: id(), category: '', name: '', intro: '', cover: '', regions: [], media: [], detail: '', guarantee: '', images: [], caseIds: [], faqs: [], taxRate: 6, specs: [{ name: '', point: '', price: 0, unit: '项', startDays: 0, dayType: '自然日', deliveryDays: 1, standard: '' }], listings: {}, updatedAt: now(), published: false } }
function demoCover(title: string, color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520"><rect width="800" height="520" fill="#f4f7fc"/><circle cx="667" cy="92" r="153" fill="${color}" opacity=".15"/><circle cx="723" cy="428" r="204" fill="${color}" opacity=".11"/><path d="M80 358h640M80 388h435" stroke="${color}" stroke-width="5" opacity=".19"/><rect x="80" y="83" width="58" height="8" rx="4" fill="${color}"/><text x="80" y="294" fill="#25344f" font-family="sans-serif" font-size="55" font-weight="700">${title}</text><text x="83" y="334" fill="${color}" font-family="sans-serif" font-size="21">WAN LIAN YI DA · DEMO</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
function demoData(base: CommerceData): CommerceData {
  const first = base.parks[0]
  const second = PARK_OPTIONS.find(park => park.id !== first.id && park.name !== first.name)!
  const stamp = now()
  const cases: Case[] = [
    { id: 'demo-case-process', category: CATEGORIES[1].value, title: '园区企业审批流程自动化', intro: '为园区企业梳理审批节点，交付流程配置、培训与上线支持，缩短跨部门协作时间。', cover: demoCover('流程自动化', '#4c69c7'), createdAt: plusDays(stamp, -20) },
    { id: 'demo-case-tax', category: CATEGORIES[2].value, title: '企业财税咨询与申报支持', intro: '针对成长型企业的财税问题形成诊断清单，提供申报辅导与定期答疑。', cover: demoCover('财税咨询', '#15948a'), createdAt: plusDays(stamp, -16) },
    { id: 'demo-case-recruit', category: CATEGORIES[3].value, title: '园区企业招聘流程优化', intro: '帮助企业建立岗位画像与面试评估表，提升招聘流程的透明度和效率。', cover: demoCover('招聘服务', '#ad7a3f'), createdAt: plusDays(stamp, -12) },
  ]
  const makeService = (serviceId: string, name: string, category: string, cover: string, price: number, caseId: string): Service => ({
    ...emptyService(), id: serviceId, name, category, cover, intro: `面向园区企业提供${name}，从需求梳理到成果交付全程可追踪。`,
    detail: `先与客户确认目标和范围，再执行${name}，交付可复核的成果与说明文档。`, guarantee: '按确认的交付标准执行，提供过程沟通与售后答疑。',
    images: [cover], caseIds: [caseId], faqs: [{ question: '服务如何开始？', answer: '下单后由服务团队联系确认需求和计划。' }],
    specs: [{ name: '标准版', point: '适合单个业务场景', price, unit: '项', startDays: 2, dayType: '工作日', deliveryDays: 15, standard: '交付方案文档、实施记录与验收说明' }],
    updatedAt: stamp, published: true,
  })
  const sale = makeService('demo-service-sale', '企业数字化流程咨询与自动化实施', CATEGORIES[1].value, demoCover('数字化实施', '#4664c2'), 9800, cases[0].id)
  sale.listings = { [first.id]: { status: 'on_sale', at: plusDays(stamp, -14) }, [second.id]: { status: 'offline', at: plusDays(stamp, -3) } }
  const reviewing = makeService('demo-service-review', '企业财税顾问服务', CATEGORIES[2].value, demoCover('财税顾问', '#15948a'), 2600, cases[1].id)
  reviewing.listings = { [first.id]: { status: 'reviewing', at: plusDays(stamp, -1) } }
  const rejected = makeService('demo-service-rejected', '园区人才招聘方案', CATEGORIES[3].value, demoCover('人才招聘', '#ad7a3f'), 4500, cases[2].id)
  rejected.listings = { [second.id]: { status: 'rejected', reason: '请补充服务交付说明后重新提交。', at: plusDays(stamp, -2) } }
  const draft = makeService('demo-service-draft', '会议空间运营支持', CATEGORIES[4].value, demoCover('空间运营', '#6a75b3'), 1200, cases[0].id)
  draft.published = false; draft.listings = {}
  const order = (orderId: string, status: OrderStatus, paid: number): Order => ({ id: orderId, serviceId: sale.id, serviceName: sale.name, parkId: first.id, category: sale.category, customer: '园区企业客户（演示）', amount: 9800, paid, deliverySnapshot: '一次性付款 · 支付后 2 工作日开始 · 15 天交付', specSnapshot: { ...sale.specs[0] }, quantity: 1, paymentAt: paid ? plusDays(stamp, -9) : '', status, createdAt: plusDays(stamp, -10), contractFile: '', contractState: 'none', deliverables: [], deliveryNote: '', acceptanceAt: '', completedAt: '', afterSaleEnd: '', shareRate: 10, afterSaleDays: 7, refunded: 0, settlement: 'waiting' })
  const completed = order('DEMO-ORDER-001', 'completed', 9800)
  completed.contractState = 'confirmed'; completed.contractFile = '合作协议.pdf'; completed.contractUploadedAt = plusDays(stamp, -8); completed.contractConfirmedAt = plusDays(stamp, -7); completed.deliverables = ['交付方案.pdf']; completed.deliveryNote = '已完成约定服务并提交交付方案。'; completed.acceptanceAt = plusDays(stamp, -6);  completed.completedAt = plusDays(stamp, -6); completed.afterSaleEnd = plusDays(stamp, 1)
  const inService = order('DEMO-ORDER-002', 'in_service', 9800)
  inService.contractState = 'confirmed'; inService.contractFile = '合作协议.pdf'; inService.contractUploadedAt = plusDays(stamp, -8); inService.contractConfirmedAt = plusDays(stamp, -7)
  const pendingContract = order('DEMO-ORDER-003', 'pending_contract', 9800)
  const pendingPayment = order('DEMO-ORDER-004', 'pending_payment', 0)
  const refunds: Refund[] = [{ id: 'demo-refund-001', orderId: inService.id, requested: 1200, agreed: 1200, reason: '客户调整交付范围', status: 'pending', decision: 'continue', note: '', createdAt: stamp }]
  const invoices: Invoice[] = [{ id: 'demo-invoice-001', kind: 'customer', orderIds: [completed.id], parkId: first.id, amount: 9800, number: 'DEMO-INV-001', file: '演示凭证.pdf', status: 'issued', title: '园区企业客户（演示）', email: 'demo@example.com', createdAt: stamp }]
  const reviews: Review[] = [{ id: 'demo-review-001', orderId: completed.id, parkId: first.id, direction: 'to_supplier', score: 5, content: '沟通清晰，交付成果符合预期。', anonymous: false, images: [], followup: false, createdAt: stamp }]
  return { ...base, parks: [first, { ...second, joinedAt: plusDays(stamp, -12) }], shop: { name: base.shop.name || '园区企业服务示例店铺', intro: base.shop.intro || '提供数字化、财税与人才服务，帮助园区企业高效开展业务。', logo: demoCover('企业服务', '#4664c2'), introImages: [demoCover('服务场景', '#15948a')], teamImages: [demoCover('专业团队', '#ad7a3f')], savedAt: stamp }, cases, services: [sale, reviewing, rejected, draft], orders: [completed, inService, pendingContract, pendingPayment], refunds, invoices, reviews, walletOpen: true }
}
export function serviceStatus(s: Service, parkId?: string, allParkIds: string[] = []): ListingStatus | 'draft' {
  if (parkId) return s.listings[parkId]?.status || 'draft'
  const statuses = Object.values(s.listings).map(x => x.status)
  for (const status of ['on_sale', 'reviewing', 'rejected'] as ListingStatus[]) if (statuses.includes(status)) return status
  return statuses.length && statuses.every(x => x === 'offline') && !allParkIds.some(id => !s.listings[id]) ? 'offline' : 'draft'
}
export const useCommerceStore = defineStore('commerce', () => {
  const ob = useOnboardingStore()
  const key = computed(() => `gysd-commerce-${ob.activeId}`)
  const fallback = () => defaults(ob.draft.park, ob.draft.serviceName || ob.draft.entityName, ob.draft.merchantIntro)
  const data = ref<CommerceData>(read(key.value, demoData(fallback())))
  watch(key, () => { data.value = read(key.value, demoData(fallback())); refreshTimedTransitions() })
  watch(() => ob.draft.park, (name) => {
    if (!name || data.value.services.length || data.value.orders.length || data.value.parks.length !== 1) return
    const old = data.value.parks[0]
    if (old.name === name) return
    const option = PARK_OPTIONS.find(p => p.name === name)
    data.value.parks[0] = option ? { ...option, joinedAt: old.joinedAt || now() } : { id: 'park-entry', name, address: '入驻申请园区', joinedAt: old.joinedAt || now() }
  })
  watch(() => ob.draft.serviceName, (name) => { if (name && !data.value.shop.name) data.value.shop.name = name })
  watch(() => ob.draft.merchantIntro, (intro) => { if (intro && !data.value.shop.intro) data.value.shop.intro = intro })
  watch(data, () => localStorage.setItem(key.value, JSON.stringify(data.value)), { deep: true })
  const joinedParks = computed(() => data.value.parks.filter(p => p.joinedAt))
  const availableParks = computed(() => PARK_OPTIONS.filter(p => !data.value.parks.some(item => item.id === p.id || item.name === p.name)))
  const activeRefund = (orderId: string) => { const latest = data.value.refunds.find(r => r.orderId === orderId); return latest && ['pending', 'client_confirm', 'rejected'].includes(latest.status) ? latest : undefined }
  const customerInvoiced = (orderId: string) => data.value.invoices.some(inv => inv.kind === 'customer' && inv.status === 'issued' && inv.orderIds.includes(orderId))
  const invoiceable = (o: Order) => Math.max(0, o.paid - o.refunded - data.value.invoices.filter(i => i.kind === 'customer' && i.status === 'issued' && i.orderIds.includes(o.id)).reduce((n, i) => n + (i.amounts?.[o.id] ?? i.amount / i.orderIds.length), 0))
  function joinPark(parkId: string) { const park = availableParks.value.find(p => p.id === parkId); if (!park) return false; data.value.parks.push({ ...park, joinedAt: now() }); return true }
  function saveShop(shop: Shop) { data.value.shop = { ...clone(shop), savedAt: now() } }
  function saveCase(item: Case) { const at = data.value.cases.findIndex(x => x.id === item.id); if (at < 0) data.value.cases.unshift(clone(item)); else data.value.cases[at] = clone(item) }
  function deleteCase(caseId: string) { data.value.cases = data.value.cases.filter(x => x.id !== caseId); data.value.services.forEach(s => s.caseIds = s.caseIds.filter(x => x !== caseId)) }
  function saveService(service: Service, parkIds?: string[]) {
    const copy = clone(service); copy.updatedAt = now()
    if (parkIds) { copy.published = true; copy.listings = { ...copy.listings, ...Object.fromEntries(parkIds.map(parkId => [parkId, { status: 'reviewing', at: now() }])) } }
    const at = data.value.services.findIndex(x => x.id === copy.id)
    if (at < 0) data.value.services.unshift(copy); else data.value.services[at] = copy
  }
  function changeListing(serviceId: string, parkIds: string[], status: ListingStatus, forced = false) { const s = data.value.services.find(x => x.id === serviceId); if (!s) return; parkIds.forEach(pid => s.listings[pid] = { status, at: now(), ...(forced ? { forced: true, reason: '运营模拟下架' } : status === 'rejected' ? { reason: '园区运营模拟驳回，请修改后重新提交' } : {}) }); s.updatedAt = now(); s.published = true }
  function deleteService(serviceId: string) { if (data.value.orders.some(o => o.serviceId === serviceId)) return false; data.value.services = data.value.services.filter(s => s.id !== serviceId); return true }
  function createOrder(serviceId: string, parkId: string, status: OrderStatus = 'pending_payment') {
    const s = data.value.services.find(x => x.id === serviceId); if (!s) return
    const order: Order = { id: `DD${Date.now()}${Math.floor(Math.random()*10000).toString().padStart(4,'0')}`, serviceId, serviceName: s.name, parkId, category: s.category, customer: '园区企业客户（演示）', amount: s.specs[0]?.price || 0, paid: status === 'pending_payment' ? 0 : s.specs[0]?.price || 0, deliverySnapshot: s.specs[0] ? `一次性付款 · 支付后 ${s.specs[0].startDays} ${s.specs[0].dayType}开始 · ${s.specs[0].deliveryDays} 天交付` : '按订单约定交付', specSnapshot: s.specs[0] ? { ...s.specs[0] } : undefined, quantity: 1, paymentAt: status === 'pending_payment' ? '' : now(), status, createdAt: now(), contractFile: '', contractState: 'none', deliverables: [], deliveryNote: '', acceptanceAt: '', completedAt: '', afterSaleEnd: '', shareRate: 10, afterSaleDays: 7, refunded: 0, settlement: 'waiting' }
    data.value.orders.unshift(order); return order
  }
  function submitContract(orderId: string, file: string) { const o = data.value.orders.find(x => x.id === orderId); if (!o || o.status !== 'pending_contract' || !['none','rejected'].includes(o.contractState) || activeRefund(o.id)) return false; o.contractFile = file; o.contractState = 'waiting'; o.contractUploadedAt = now(); return true }
  function confirmContract(orderId: string, approved: boolean) { const o = data.value.orders.find(x => x.id === orderId); if (!o || o.contractState !== 'waiting') return; o.contractState = approved ? 'confirmed' : 'rejected'; if (approved) { o.status = 'in_service'; o.contractConfirmedAt = now() } }
  function requestAcceptance(orderId: string, files: string[], note: string) { const o = data.value.orders.find(x => x.id === orderId); if (!o || o.status !== 'in_service' || o.contractState !== 'confirmed' || !o.paid || activeRefund(o.id) || !files.length) return false; o.deliverables = files; o.deliveryNote = note; o.status = 'pending_acceptance'; o.acceptanceAt = now(); return true }
  function concludeAcceptance(orderId: string, approved: boolean) { const o = data.value.orders.find(x => x.id === orderId); if (!o || o.status !== 'pending_acceptance') return; if (approved) { o.status = 'completed'; o.completedAt = now(); o.afterSaleEnd = plusDays(o.completedAt, o.afterSaleDays) } else { o.status = 'in_service'; o.acceptanceAt = '' } }
  function createRefund(orderId: string, amount: number, reason: string) {
    const o = data.value.orders.find(x => x.id === orderId); const active = activeRefund(orderId); if (!o || o.status === 'pending_payment' || active && active.status !== 'rejected' || amount <= 0 || amount > o.paid - o.refunded || customerInvoiced(orderId) || (o.afterSaleEnd && Date.now() > new Date(o.afterSaleEnd).getTime())) return false
    if (o.status === 'pending_contract') { o.refunded += o.paid - o.refunded; o.status = 'cancelled'; data.value.refunds.unshift({ id: id(), orderId, requested: o.paid, agreed: o.paid, reason, status: 'refunded', decision: 'close', note: '合同确认前系统即时全额退款', createdAt: now() }); return true }
    data.value.refunds.unshift({ id: id(), orderId, requested: amount, agreed: amount, reason, status: 'pending', decision: 'continue', note: '', createdAt: now() }); return true
  }
  function decideRefund(refundId: string, action: 'agree' | 'reject' | 'change', amount: number, decision: 'close' | 'continue', note: string) {
    const r = data.value.refunds.find(x => x.id === refundId); if (!r || r.status !== 'pending') return false
    const o = data.value.orders.find(x => x.id === r.orderId); if (!o) return false
    if (action === 'reject') { if (!note.trim()) return false; r.status = 'rejected'; r.note = note; return true }
    if (amount <= 0 || amount > o.paid - o.refunded || (action === 'change' && !note.trim())) return false
    r.agreed = amount; r.decision = decision; r.note = note
    if (action === 'change') r.status = 'client_confirm'; else finalizeRefund(r.id)
    return true
  }
  function finalizeRefund(refundId: string, clientAccept = true) { const r = data.value.refunds.find(x => x.id === refundId); if (!r || r.status !== 'client_confirm' && r.status !== 'pending') return; if (!clientAccept) { r.status = 'pending'; return }; const o = data.value.orders.find(x => x.id === r.orderId); if (!o) return; r.status = 'refunded'; o.refunded += r.agreed; if (r.decision === 'close') { o.status = 'cancelled'; o.afterSaleEnd = plusDays(now(), o.afterSaleDays) } }
  function cancelRefund(refundId: string) { const r = data.value.refunds.find(x => x.id === refundId); if (!r || !['pending','client_confirm','rejected'].includes(r.status)) return false; r.status = 'cancelled'; return true }
  function issueInvoice(kind: Invoice['kind'], orderIds: string[], number: string, file: string, title: string, email: string, details: Partial<Invoice> = {}) {
    const orders = data.value.orders.filter(o => orderIds.includes(o.id)); if (!orders.length) return false
    if (kind === 'customer' && orders.some(o => activeRefund(o.id) || invoiceable(o) <= 0)) return false
    if (kind === 'platform' && (orders.some(o => o.settlement !== 'settled' || data.value.invoices.some(i => i.kind === 'platform' && i.orderIds.includes(o.id) && ['issued','issuing','returning'].includes(i.status))) || new Set(orders.map(o => o.parkId)).size !== 1)) return false
    const amounts = Object.fromEntries(orders.map(o => [o.id, kind === 'customer' ? invoiceable(o) : (o.paid - o.refunded) * o.shareRate / 100]))
    const amount = Object.values(amounts).reduce((n, value) => n + value, 0)
    data.value.invoices.unshift({ id: id(), kind, orderIds, amounts, parkId: orders[0].parkId, amount, number, file, status: kind === 'customer' ? 'issued' : 'issuing', title, email, subjectType: details.subjectType, ticketType: details.ticketType, taxId: details.taxId, address: details.address, phone: details.phone, bank: details.bank, account: details.account, createdAt: now() }); return true
  }
  function returnInvoice(invoiceId: string) { const item = data.value.invoices.find(i => i.id === invoiceId); if (!item) return; item.status = item.kind === 'customer' ? 'returned' : 'returning' }
  function addReview(review: Review) { const order=data.value.orders.find(o=>o.id===review.orderId); if(!order||order.status!=='completed'||activeRefund(order.id)||review.score<1||review.score>5||!review.content.trim())return false;const same = data.value.reviews.some(r => r.orderId === review.orderId && r.direction === review.direction && r.followup === review.followup); if (same || review.followup && !data.value.reviews.some(r=>r.orderId===review.orderId&&r.direction===review.direction&&!r.followup)) return false; data.value.reviews.unshift(review); return true }
  function refreshTimedTransitions() {
    const current = Date.now()
    for (const o of data.value.orders) {
      if (o.status === 'pending_payment' && current >= new Date(o.createdAt).getTime() + 7 * 86400000) o.status = 'cancelled'
      if (o.status === 'pending_acceptance' && o.acceptanceAt && current >= new Date(o.acceptanceAt).getTime() + 7 * 86400000) concludeAcceptance(o.id, true)
      if ((o.status === 'completed' || o.status === 'cancelled') && o.afterSaleEnd && current >= new Date(o.afterSaleEnd).getTime() && !activeRefund(o.id) && o.paid - o.refunded > 0) o.settlement = 'settled'
    }
  }
  function reset() { data.value = fallback() }
  function seed() { data.value = demoData(fallback()) }
  function preparePublishDemo() {
    const sample = demoData(fallback()).services.find(item => item.id === 'demo-service-sale')!
    const draft = clone(sample)
    draft.id = 'demo-service-publish-flow'
    draft.name = `${sample.name}（发布演示）`
    draft.published = false
    draft.listings = {}
    const at = data.value.services.findIndex(item => item.id === draft.id)
    if (at < 0) data.value.services.unshift(draft)
    else if (data.value.services[at].published) data.value.services[at] = draft
    return draft.id
  }
  function addMissingExamples() {
    const sample = demoData(fallback())
    const current = data.value
    for (const park of sample.parks) if (!current.parks.some(item => item.id === park.id || item.name === park.name)) current.parks.push(park)
    if (!current.shop.savedAt) current.shop = sample.shop
    const appendMissing = <T extends { id: string }>(target: T[], examples: T[]) => {
      const present = new Set(target.map(item => item.id))
      for (const item of examples) if (!present.has(item.id)) target.push(item)
    }
    appendMissing(current.cases, sample.cases)
    appendMissing(current.services, sample.services)
    appendMissing(current.orders, sample.orders)
    appendMissing(current.refunds, sample.refunds)
    appendMissing(current.invoices, sample.invoices)
    appendMissing(current.reviews, sample.reviews)
    current.walletOpen = true
  }
  const sampleMarker = `gysd-demo-catalog-v2-${ob.activeId}`
  if (!localStorage.getItem(sampleMarker)) {
    addMissingExamples()
    localStorage.setItem(sampleMarker, '1')
  }
  refreshTimedTransitions()
  window.setInterval(refreshTimedTransitions, 60_000)
  return { data, joinedParks, availableParks, activeRefund, customerInvoiced, invoiceable, joinPark, saveShop, saveCase, deleteCase, saveService, changeListing, deleteService, createOrder, submitContract, confirmContract, requestAcceptance, concludeAcceptance, createRefund, decideRefund, finalizeRefund, cancelRefund, issueInvoice, returnInvoice, addReview, reset, seed, addMissingExamples, preparePublishDemo, refreshTimedTransitions }
})
