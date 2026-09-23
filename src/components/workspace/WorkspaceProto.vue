<script setup lang="ts">
import { MessageSquareText, ArrowRight, Store, Package } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()

/** V0.9 原型参考：低饱和回退皮肤，用于分屏对比 */
const metrics = [
  { label: '今日 GMV', value: '¥0', sub: '入驻首日' },
  { label: '待处理订单', value: '0', sub: '待确认 / 待发货' },
  { label: '可用余额', value: '¥0.00', sub: '待结算 ¥0' },
  { label: '店铺评分', value: '—', sub: '暂无评价' },
]

const todos = [
  { title: '开通店铺并完善店招信息', desc: '入驻通过后的下一步', icon: Store, path: '/shop/info' },
  { title: '完成首次商品 / 服务上架', desc: '上架后进入运营审核', icon: Package, path: '/service' },
]

const chain = [
  { label: '店铺管理', tag: '铺' },
  { label: '商品管理', tag: '品' },
  { label: '交易管理', tag: '交' },
  { label: '物流配送', tag: '流' },
  { label: '营销活动', tag: '营' },
  { label: '结算对账', tag: '算' },
  { label: '电子合同', tag: '合' },
]
</script>

<template>
  <div class="proto">
    <h1 class="proto-title">经营看板</h1>

    <section class="p-card">
      <div class="p-card-head">
        <MessageSquareText :size="16" />
        <strong>短信通知</strong>
      </div>
      <div class="p-sms">
        <div class="p-sms-row">
          <span><strong>发送至 138****8000</strong> <em>已送达</em></span>
          <time>2026-09-22 18:18</time>
        </div>
        <p>【万联易达】尊敬的临港企服，您的供应商入驻申请已审核通过，账号已启用。请使用手机号138****8000登录开通店铺。</p>
      </div>
    </section>

    <section class="p-metrics">
      <div v-for="m in metrics" :key="m.label" class="p-metric">
        <span class="p-label">{{ m.label }}</span>
        <strong class="p-value">{{ m.value }}</strong>
        <span class="p-sub">{{ m.sub }}</span>
      </div>
    </section>

    <section class="p-grid">
      <div class="p-card">
        <div class="p-card-head"><strong>待办事项</strong></div>
        <button v-for="t in todos" :key="t.title" class="p-todo" type="button" @click="router.push(t.path)">
          <span class="p-todo-ic"><component :is="t.icon" :size="16" /></span>
          <span class="p-todo-txt">
            <strong>{{ t.title }}</strong>
            <small>{{ t.desc }}</small>
          </span>
          <ArrowRight :size="14" />
        </button>
      </div>
      <div class="p-card">
        <div class="p-card-head"><strong>后续经营链路</strong></div>
        <ul class="p-chain">
          <li v-for="c in chain" :key="c.label">
            <span class="p-chain-tag">{{ c.tag }}</span>
            <span>{{ c.label }}</span>
            <em>占位</em>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 回退为接近原型的朴素灰阶，刻意保留“未设计”感 */
.proto {
  padding: 28px 32px 48px;
  max-width: 1280px;
  margin: 0 auto;
  filter: grayscale(0.35);
}
.proto-title {
  margin: 0 0 18px;
  font-size: 24px;
  color: #111;
}
.p-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 16px;
}
.p-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 15px;
  color: #111;
}
.p-sms {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 12px;
}
.p-sms-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 6px;
}
.p-sms-row em {
  font-style: normal;
  color: #16a34a;
}
.p-sms time {
  color: #9ca3af;
  font-size: 12px;
}
.p-sms p {
  margin: 0;
  font-size: 14px;
  color: #374151;
  line-height: 1.7;
}
.p-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}
.p-metric {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.p-label {
  font-size: 13px;
  color: #6b7280;
}
.p-value {
  font-size: 28px;
  color: #111827;
}
.p-sub {
  font-size: 12px;
  color: #9ca3af;
}
.p-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 14px;
}
.p-todo {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
  margin-bottom: 10px;
  cursor: pointer;
  text-align: left;
}
.p-todo-ic {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f3f4f6;
  display: grid;
  place-items: center;
  color: #4b5563;
}
.p-todo-txt {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.p-todo-txt strong {
  font-size: 14px;
  color: #111;
}
.p-todo-txt small {
  font-size: 12px;
  color: #6b7280;
}
.p-chain {
  list-style: none;
  margin: 0;
  padding: 0;
}
.p-chain li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 4px;
  font-size: 14px;
  color: #111;
}
.p-chain-tag {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: #f3f4f6;
  display: grid;
  place-items: center;
  font-size: 12px;
  color: #4b5563;
}
.p-chain em {
  margin-left: auto;
  font-style: normal;
  font-size: 12px;
  color: #9ca3af;
}
</style>
