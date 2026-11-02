import type { ApprovalRecord, Product } from '@/stores/products'

export function submitApprovals(product: Product, type: string, parks: { id: string; name: string }[], note = ''): ApprovalRecord[] {
  const time = new Date().toLocaleString('zh-CN', { hour12: false })
  const targets: ({ id: string; name: string } | undefined)[] = parks.length ? parks : [undefined]
  const previous = product.approvalLog || []
  return [...previous, ...targets.map(park => {
    const latest = [...previous].reverse().find(row => row.type === type && row.parkId === park?.id)
    const events = latest?.status === '驳回' && latest.events ? [...latest.events] : []
    events.push({ time, action: `${events.length ? '再次提交' : '提交'}${type}`, actor: '供应商', status: '已提交', ...(note ? { opinion: note } : {}) })
    return { time, type, status: '待审', note, ...(park ? { parkId: park.id, parkName: park.name } : {}), events }
  })]
}

export function finishApprovals(product: Product, type: string, result: 'approved' | 'rejected', parkIds?: string[]): ApprovalRecord[] {
  const time = new Date().toLocaleString('zh-CN', { hour12: false })
  const opinion = result === 'rejected' ? '演示审核未通过，请核对商品资料后重新提交。' : ''
  let matched = false
  const rows = (product.approvalLog || []).map(row => {
    if (row.type !== type || row.status !== '待审' || !row.events?.length || (parkIds && (!row.parkId || !parkIds.includes(row.parkId)))) return row
    matched = true
    const status = result === 'approved' ? '通过' : '驳回'
    return { ...row, status, approver: '园区运营（演示）', reviewedAt: time, opinion, events: [...row.events, { time, action: result === 'approved' ? '审核通过' : '审核驳回', actor: '园区运营（演示）', status, ...(opinion ? { opinion } : {}) }] }
  })
  return matched ? rows : [...rows, { time, type: '演示审核', status: result === 'approved' ? '通过' : '驳回', note: '', approver: '园区运营（演示）', reviewedAt: time, opinion }]
}
