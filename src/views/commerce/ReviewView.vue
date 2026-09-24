<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElDialog, ElInput, ElMessage, ElOption, ElPagination, ElRate, ElSelect, ElSwitch, ElTag } from 'element-plus'
import { dateText, useCommerceStore, type Order, type Review } from '@/stores/commerce'

const c = useCommerceStore()
const router = useRouter()
const route = useRoute()
const tab = ref('all')
const park = ref(String(route.query.park || ''))
const page = ref(1)
const pageSize = 10
const dialog = ref(false)
const error = ref('')
const form = reactive<Review>({ id: '', orderId: '', parkId: '', direction: 'to_customer', score: 5, content: '', anonymous: false, images: [], followup: false, createdAt: '' })
const tabs = [['all', '全部'], ['pending_me', '待我评价'], ['pending_client', '待客户评价'], ['both', '双方已评']]
const customerReviews = (id: string) => c.data.reviews.filter(x => x.orderId === id && x.direction === 'to_supplier')
const myReviews = (id: string) => c.data.reviews.filter(x => x.orderId === id && x.direction === 'to_customer')
const hasInitial = (id: string, direction: Review['direction']) => c.data.reviews.some(x => x.orderId === id && x.direction === direction && !x.followup)
const hasFollowup = (id: string) => myReviews(id).some(x => x.followup)
const base = computed(() => c.data.orders.filter(o => o.status === 'completed' && (!park.value || o.parkId === park.value) && (!route.query.order || o.id === route.query.order)))
function matches(o: Order, key: string) {
  const mine = hasInitial(o.id, 'to_customer')
  const theirs = hasInitial(o.id, 'to_supplier')
  return key === 'all' || key === 'pending_me' && !mine || key === 'pending_client' && !theirs || key === 'both' && mine && theirs
}
const tabRows = computed(() => base.value.filter(o => matches(o, tab.value)))
const rows = computed(() => tabRows.value.slice((page.value - 1) * pageSize, page.value * pageSize))
watch([park, tab], () => { page.value = 1 })
watch(() => tabRows.value.length, length => { page.value = Math.min(page.value, Math.max(1, Math.ceil(length / pageSize))) })
const count = (key: string) => base.value.filter(o => matches(o, key)).length
const incoming = computed(() => c.data.reviews.filter(x => x.direction === 'to_supplier'))
const score = computed(() => incoming.value.length ? (incoming.value.reduce((sum, x) => sum + x.score, 0) / incoming.value.length).toFixed(1) : '—')
function open(o: Order, followup = false) {
  Object.assign(form, { id: crypto.randomUUID(), orderId: o.id, parkId: o.parkId, direction: 'to_customer', score: 5, content: '', anonymous: false, images: [], followup, createdAt: new Date().toISOString() })
  error.value = ''
  dialog.value = true
}
function file(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  if (files.length > 6 || files.some(f => !f.type.startsWith('image/'))) { ElMessage.error('最多上传 6 张图片'); return }
  form.images = files.map(x => x.name)
}
function submit() {
  if (!form.content.trim() || form.score < 1 || form.score > 5) { error.value = '请填写评价内容并选择 1–5 星评分'; return }
  if (!c.addReview(form)) { error.value = '该订单当前无法提交本次评价'; return }
  dialog.value = false
  ElMessage.success(form.followup ? '已追加评价' : '已提交评价')
}
</script>

<template>
  <div class="biz-page">
    <header class="biz-head"><div><h1>评价中心</h1><p>按订单查看双方评价，完成订单后可评价客户或追加评价。</p></div></header>
    <div v-if="!c.data.walletOpen" class="biz-empty"><h3>开通钱包后查看评价</h3><ElButton type="primary" @click="router.push('/wallet')">前往我的钱包</ElButton></div>
    <template v-else>
      <div class="review-summary"><span>客户评价综合评分</span><strong>{{ score }}</strong><span>{{ incoming.length }} 条客户评价</span><small>暂无评价时，对外展示默认 5.0 分</small></div>
      <div class="biz-toolbar"><ElSelect v-model="park" clearable placeholder="全部园区"><ElOption v-for="p in c.joinedParks" :key="p.id" :value="p.id" :label="p.name" /></ElSelect><span v-if="route.query.order" class="biz-muted">订单 {{ route.query.order }}</span><ElButton v-if="route.query.order" @click="router.push('/review')">查看全部</ElButton></div>
      <div class="biz-tabs"><button v-for="[key, label] in tabs" :key="key" class="biz-tab" :class="{active:tab===key}" @click="tab=key">{{ label }} {{ count(key) }}</button></div>
      <div v-if="!rows.length" class="biz-empty"><h3>暂无匹配的评价订单</h3><p>订单完成后会出现在评价中心。</p></div>
      <div v-else class="biz-list"><article v-for="o in rows" :key="o.id" class="biz-list-item review-order">
        <header class="review-order-head"><div><p class="biz-muted">{{ dateText(o.completedAt || o.createdAt) }} · {{ c.joinedParks.find(p=>p.id===o.parkId)?.name }}</p><h3>{{ o.serviceName }}</h3><span class="biz-muted">订单 {{ o.id }}</span></div><ElTag :type="hasInitial(o.id,'to_customer') && hasInitial(o.id,'to_supplier')?'success':'info'">{{ hasInitial(o.id,'to_customer') && hasInitial(o.id,'to_supplier')?'双方已评':!hasInitial(o.id,'to_customer')?'待我评价':'待客户评价' }}</ElTag></header>
        <div class="review-columns"><section><h4>客户评价</h4><div v-if="customerReviews(o.id).length" v-for="item in customerReviews(o.id)" :key="item.id" class="review-entry"><strong>{{ item.score }}.0 ★ <small v-if="item.followup">追评</small></strong><p>{{ item.content }}</p><small>{{ dateText(item.createdAt) }}</small></div><p v-else class="biz-muted">客户尚未评价</p></section><section><h4>我的评价</h4><div v-if="myReviews(o.id).length" v-for="item in myReviews(o.id)" :key="item.id" class="review-entry"><strong>{{ item.score }}.0 ★ <small v-if="item.followup">追评</small></strong><p>{{ item.content }}</p><small>{{ dateText(item.createdAt) }}</small></div><p v-else class="biz-muted">尚未评价客户</p></section></div>
        <footer><ElButton text type="primary" @click="router.push({path:`/order/${o.id}`,query:{tab:'settlement'}})">查看订单</ElButton><ElButton v-if="!hasInitial(o.id,'to_customer')" type="primary" :disabled="!!c.activeRefund(o.id)" @click="open(o)">评价客户</ElButton><ElButton v-else-if="!hasFollowup(o.id)" @click="open(o,true)">追加评价</ElButton><span v-if="c.activeRefund(o.id)" class="biz-muted">售后处理中，暂不可评价</span></footer>
      </article></div>
      <div v-if="tabRows.length > pageSize" class="biz-footer"><span>共 {{ tabRows.length }} 笔评价订单</span><ElPagination v-model:current-page="page" :page-size="pageSize" :total="tabRows.length" layout="prev, pager, next" background /></div>
    </template>
    <ElDialog v-model="dialog" :title="form.followup?'追加评价':'评价客户'" width="540px"><div class="biz-grid"><div class="biz-field full">订单 <strong>{{ form.orderId }}</strong></div><label class="biz-field full">评分 <ElRate v-model="form.score" /></label><label class="biz-field full">评价内容 <ElInput v-model="form.content" type="textarea" :rows="4" maxlength="1000" show-word-limit /></label><label class="biz-field full">图片 <small>最多 6 张</small><input type="file" accept="image/*" multiple @change="file" /></label><label class="biz-field full biz-inline">匿名评价 <ElSwitch v-model="form.anonymous" /></label></div><p v-if="error" class="biz-note danger" role="alert">{{ error }}</p><template #footer><ElButton @click="dialog=false">取消</ElButton><ElButton type="primary" @click="submit">提交评价</ElButton></template></ElDialog>
  </div>
</template>

<style scoped>
.review-summary{display:flex;align-items:baseline;gap:13px;border-bottom:1px solid #e4eaf2;padding:0 0 20px;margin-bottom:18px;color:#67768c;font-size:13px;flex-wrap:wrap}.review-summary strong{font-size:30px;color:#243f94}.review-summary small{margin-left:auto;color:#8b97a9}.review-order-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.review-order-head p{margin:0 0 5px}.review-order-head h3{margin:0 0 6px}.review-columns{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:18px;border-top:1px solid #e9edf4;padding-top:18px}.review-columns section+section{border-left:1px solid #e9edf4;padding-left:20px}.review-columns h4{font-size:13px;margin:0 0 12px}.review-entry+.review-entry{border-top:1px solid #edf1f5;padding-top:10px;margin-top:10px}.review-entry strong{color:#ba8030;font-size:13px}.review-entry strong small{color:#64748b;font-weight:500}.review-entry p{margin:7px 0;color:#34445b}.review-entry>small{color:#8a98a9}.review-order footer{margin-top:14px;border-top:1px solid #e9edf4;padding-top:12px}@media(max-width:850px){.review-columns{grid-template-columns:1fr}.review-columns section+section{border-left:0;border-top:1px solid #e9edf4;padding:14px 0 0}}
</style>
