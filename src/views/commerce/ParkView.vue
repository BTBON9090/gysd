<script setup lang="ts">
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus'
import { ArrowUpRight, Building2, Check, ClipboardList, ExternalLink, MapPin, MessageSquareText, Plus, Store } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useCommerceStore } from '@/stores/commerce'

const c = useCommerceStore()
const router = useRouter()
function count(parkId: string, kind: 'service' | 'order' | 'review') {
  if (kind === 'service') return c.data.services.filter(service => service.listings[parkId]?.status === 'on_sale').length
  if (kind === 'order') return c.data.orders.filter(order => order.parkId === parkId).length
  return c.data.reviews.filter(review => review.parkId === parkId).length
}
async function join(parkId: string, name: string) {
  try {
    await ElMessageBox.confirm(`确认加入「${name}」？加入后即可在此园区发布服务。`, '确认申请加入', { confirmButtonText: '确认加入', cancelButtonText: '取消' })
    if (c.joinPark(parkId)) ElMessage.success('已加入园区')
  } catch { /* cancelled */ }
}
function go(kind: string, parkId: string) { router.push({ path: `/${kind}`, query: { park: parkId } }) }
function client(parkId: string) { router.push({ path: '/customer-demo', query: { park: parkId } }) }
</script>

<template>
  <div class="biz-page park-page">
    <header class="biz-head park-head">
      <div class="park-heading">
        <span class="park-heading-icon"><Building2 :size="25" :stroke-width="1.9" /></span>
        <div><p class="biz-eyebrow">园区与服务 / 我的园区</p><h1>我的园区</h1><p>从已加入园区查看业务进展，也可申请加入其他园区。</p></div>
      </div>
      <div class="park-overview"><span><b>{{ c.joinedParks.length }}</b> 已加入</span><i></i><span><b>{{ c.availableParks.length }}</b> 可申请</span></div>
    </header>

    <section class="park-group joined-group">
      <div class="park-group-head"><div><h2>已加入园区 <span>{{ c.joinedParks.length }}</span></h2><p>下方数据为各园区累计记录，点击数字可查看明细。</p></div></div>
      <div class="park-grid">
        <article v-for="park in c.joinedParks" :key="park.id" class="park-card joined-card">
          <div class="park-card-top"><span class="park-card-icon"><Building2 :size="21" /></span><ElTag type="success" effect="light"><Check :size="13" /> 已入驻</ElTag></div>
          <h3>{{ park.name }}</h3>
          <p class="park-meta"><MapPin :size="14" /> {{ park.address }}</p>
          <p class="park-date">入驻时间 {{ park.joinedAt?.slice(0, 10) || '—' }}</p>
          <div class="park-stats">
            <button type="button" @click="go('service', park.id)"><Store :size="15" /><strong>{{ count(park.id, 'service') }}</strong><span>已上架服务</span><ArrowUpRight :size="13" class="stat-arrow" /></button>
            <button type="button" @click="go('order', park.id)"><ClipboardList :size="15" /><strong>{{ count(park.id, 'order') }}</strong><span>订单</span><ArrowUpRight :size="13" class="stat-arrow" /></button>
            <button type="button" @click="go('review', park.id)"><MessageSquareText :size="15" /><strong>{{ count(park.id, 'review') }}</strong><span>评价</span><ArrowUpRight :size="13" class="stat-arrow" /></button>
          </div>
          <footer><ElButton text type="primary" @click="client(park.id)">查看园区客户端 <ExternalLink :size="14" /></ElButton></footer>
        </article>
      </div>
    </section>

    <section class="park-group available-group">
      <div class="park-group-head"><div><h2>可申请园区 <span>{{ c.availableParks.length }}</span></h2><p>申请后即时加入，可在新园区发布服务。</p></div></div>
      <div v-if="!c.availableParks.length" class="biz-empty"><h3>暂无可申请园区</h3><p>平台内可加入的园区都已展示在上方。</p></div>
      <div v-else class="park-grid">
        <article v-for="park in c.availableParks" :key="park.id" class="park-card available-card">
          <div class="park-card-top"><span class="park-card-icon"><MapPin :size="20" /></span><span class="available-label">开放申请</span></div>
          <h3>{{ park.name }}</h3><p class="park-meta"><MapPin :size="14" /> {{ park.address }}</p>
          <footer><ElButton type="primary" @click="join(park.id, park.name)"><Plus :size="14" /> 申请加入</ElButton><ElButton text @click="client(park.id)">查看园区客户端 <ExternalLink :size="14" /></ElButton></footer>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.park-page{max-width:1190px}.park-head{align-items:center;margin-bottom:34px}.park-heading{display:flex;align-items:center;gap:16px}.park-heading-icon{width:48px;height:48px;display:grid;place-items:center;flex:none;border-radius:12px;background:#e9efff;color:#3659c2}.park-overview{display:flex;align-items:center;gap:18px;border:1px solid #e1e8f3;border-radius:9px;padding:10px 16px;color:#687991;font-size:13px;background:#fff}.park-overview b{font-size:19px;color:#2447ac;margin-right:4px}.park-overview i{width:1px;height:22px;background:#e2e8f2}.park-group{padding-top:23px;margin-top:24px;border-top:1px solid #e4eaf3}.park-group-head{margin-bottom:16px}.park-group-head h2{margin:0 0 3px;font-size:17px;color:#1f2e48}.park-group-head h2 span{display:inline-grid;place-items:center;min-width:21px;height:21px;margin-left:7px;padding:0 5px;border-radius:6px;background:#edf2ff;color:#3458bd;font-size:12px}.park-group-head p{margin:0;color:#77859a;font-size:12px}.park-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.joined-group .park-grid:has(> :only-child){grid-template-columns:1fr}.park-card{min-width:0;border:1px solid #dfe6f1;border-radius:12px;background:#fff;padding:20px 21px 15px}.park-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:14px}.park-card-icon{width:38px;height:38px;border-radius:9px;display:grid;place-items:center;background:#eaf0ff;color:#3659c2}.park-card h3{margin:0 0 8px;font-size:17px;line-height:1.45;color:#1d2c46}.park-meta{display:flex;align-items:center;gap:5px;margin:0;color:#75839a;font-size:12px}.park-meta svg{flex:none}.park-date{margin:11px 0 0;color:#8290a3;font-size:12px}.park-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;margin-top:20px;padding:15px 0;border-top:1px solid #e6ebf4;border-bottom:1px solid #e6ebf4}.park-stats button{position:relative;min-width:0;display:grid;grid-template-columns:18px 1fr;column-gap:4px;align-items:center;text-align:left;border:0;border-right:1px solid #e7ecf4;background:transparent;padding:0 12px;color:#6c7d98;cursor:pointer}.park-stats button:first-child{padding-left:0}.park-stats button:last-child{border-right:0;padding-right:0}.park-stats strong{font-size:22px;line-height:1.1;color:#223c75;font-variant-numeric:tabular-nums}.park-stats button>span{grid-column:1/-1;margin-top:7px;font-size:12px;white-space:nowrap}.park-stats button:hover strong,.park-stats button:hover .stat-arrow{color:#3459c8}.stat-arrow{position:absolute;right:9px;top:3px;opacity:0}.park-stats button:hover .stat-arrow{opacity:1}.park-card footer{display:flex;align-items:center;gap:8px;margin-top:11px;flex-wrap:wrap}.park-card footer :deep(.el-button){margin-left:0}.available-group{margin-top:31px}.available-group .park-group-head h2 span{background:#f0f3f7;color:#687991}.available-card{background:#fbfcff;border-style:dashed}.available-card .park-card-icon{background:#f1f4f9;color:#6c7d97}.available-label{font-size:12px;color:#718198;background:#eff2f7;border-radius:6px;padding:4px 7px}.available-card footer{margin-top:20px}.available-card .park-meta{margin-top:13px}@media(max-width:950px){.park-grid{grid-template-columns:1fr}.park-head{align-items:flex-start}.park-overview{white-space:nowrap}}@media(max-width:700px){.park-head{flex-direction:column}.park-heading{align-items:flex-start}}
</style>

<style scoped>
.park-page{min-width:800px}
</style>
