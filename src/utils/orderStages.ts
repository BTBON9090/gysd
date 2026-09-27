import type { Order, OrderStage } from '@/stores/commerce'

export const STAGE_LABEL: Record<OrderStage['status'], string> = { pending: '未开始', in_progress: '待交付', pending_acceptance: '待验收', accepted: '验收通过', rejected: '验收驳回' }
export function orderStages(o: Order): OrderStage[] {
  if (o.stages?.length) return o.stages
  return [{ id: 'single', name: '全额付款与交付', amount: o.amount, paid: o.paid, refunded: o.refunded, paymentAt: o.paymentAt, status: o.status === 'completed' ? 'accepted' : o.status === 'pending_acceptance' ? 'pending_acceptance' : o.status === 'in_service' ? o.deliverables.length ? 'rejected' : 'in_progress' : 'pending', standard: o.specSnapshot?.standard || '按合同约定交付', files: o.deliverables, note: o.deliveryNote, submittedAt: o.acceptanceAt, acceptedAt: o.completedAt }]
}
export const stageProgress = (o: Order) => `${orderStages(o).filter(s => s.status === 'accepted').length} / ${orderStages(o).length} 期已验收`
export const outstanding = (o: Order) => Math.max(0, o.amount - o.paid)
export const netPaid = (o: Order) => Math.max(0, o.paid - o.refunded)
