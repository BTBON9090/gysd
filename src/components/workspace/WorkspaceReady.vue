<script setup lang="ts">
import { MessageSquareText, ArrowRight, Store, Package, TrendingUp, Clock3, Wallet, Star } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { ElButton, ElCard } from 'element-plus'

const router = useRouter()

const metrics = [
  { key: 'gmv', label: '今日 GMV', value: '¥0', sub: '入驻首日', icon: TrendingUp, tone: 'blue' },
  { key: 'orders', label: '待处理订单', value: '0', sub: '待确认 / 待发货', icon: Clock3, tone: 'orange' },
  { key: 'balance', label: '可用余额', value: '¥0.00', sub: '待结算 ¥0', icon: Wallet, tone: 'teal' },
  { key: 'rating', label: '店铺评分', value: '—', sub: '暂无评价', icon: Star, tone: 'purple' },
]

const todos = [
  { title: '开通店铺并完善店招信息', desc: '入驻通过后的下一步', icon: Store, path: '/shop/info', tone: 'blue' },
  { title: '完成首次商品 / 服务上架', desc: '上架后进入运营审核', icon: Package, path: '/service', tone: 'green' },
]

const chain = [
  { label: '店铺管理', tag: '铺', tone: 'purple', path: '/shop' },
  { label: '商品管理', tag: '品', tone: 'green', path: '/service' },
  { label: '交易管理', tag: '交', tone: 'orange', path: '/order' },
  { label: '物流配送', tag: '流', tone: 'cyan', path: '/order' },
  { label: '营销活动', tag: '营', tone: 'pink', path: '/workspace' },
  { label: '结算对账', tag: '算', tone: 'blue', path: '/wallet' },
  { label: '电子合同', tag: '合', tone: 'indigo', path: '/merchant' },
]
</script>

<template>
  <div class="ws">
    <header class="ws-head">
      <div>
        <p class="eyebrow">经营看板</p>
        <h1>早上好，周启明</h1>
        <p class="sub">今天是入驻首日，先开通店铺，生意就开张了。</p>
      </div>
      <ElButton type="primary" round @click="router.push('/shop/info')">
        去开通店铺
        <ArrowRight :size="15" style="margin-left: 6px" />
      </ElButton>
    </header>

    <section class="metrics" aria-label="经营指标">
      <ElCard v-for="m in metrics" :key="m.key" class="metric-card" :class="`tone-${m.tone}`" shadow="never">
        <div class="metric-top">
          <span class="metric-label">{{ m.label }}</span>
          <span class="metric-icon">
            <component :is="m.icon" :size="15" stroke-width="1.8" />
          </span>
        </div>
        <div class="metric-value">{{ m.value }}</div>
        <div class="metric-sub">{{ m.sub }}</div>
      </ElCard>
    </section>

    <ElCard class="block-card" shadow="never">
      <div class="card-head">
        <span class="card-icon tone-amber">
          <MessageSquareText :size="15" stroke-width="1.8" />
        </span>
        <h2>短信通知</h2>
      </div>
      <div class="sms">
        <div class="sms-meta">
          <span class="sms-to">发送至 138****8000</span>
          <span class="sms-ok">已送达</span>
          <time datetime="2026-09-22T18:18">2026-09-22 18:18</time>
        </div>
        <p class="sms-body">
          【万联易达】尊敬的临港企服，您的供应商入驻申请已审核通过，账号已启用。请使用手机号138****8000登录开通店铺。
        </p>
      </div>
    </ElCard>

    <section class="grid-2">
      <ElCard class="block-card" shadow="never">
        <div class="card-head">
          <h2>待办事项</h2>
          <span class="pill">2 项待完成</span>
        </div>
        <ul class="todo-list">
          <li v-for="t in todos" :key="t.title">
            <button class="todo-item" type="button" @click="router.push(t.path)">
              <span class="todo-icon" :class="`tone-${t.tone}`">
                <component :is="t.icon" :size="17" stroke-width="1.7" />
              </span>
              <span class="todo-text">
                <strong>{{ t.title }}</strong>
                <small>{{ t.desc }}</small>
              </span>
              <ArrowRight class="todo-arrow" :size="15" />
            </button>
          </li>
        </ul>
      </ElCard>

      <ElCard class="block-card" shadow="never">
        <div class="card-head">
          <h2>后续经营链路</h2>
          <span class="pill muted">7 个环节</span>
        </div>
        <ul class="chain-list">
          <li v-for="c in chain" :key="c.label">
            <button class="chain-item" type="button" @click="router.push(c.path)">
              <span class="chain-tag" :class="`tone-${c.tone}`">{{ c.tag }}</span>
              <span class="chain-label">{{ c.label }}</span>
              <span class="chain-state">占位</span>
            </button>
          </li>
        </ul>
      </ElCard>
    </section>
  </div>
</template>

<style scoped>
.ws {
  padding: var(--sp-page-y) var(--sp-page-x) 28px;
  max-width: 1280px;
  margin: 0 auto;
}

.ws-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--brand);
  letter-spacing: 0.04em;
}
.ws-head h1 {
  margin: 0;
  font-size: var(--fs-display);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  line-height: 1.25;
}
.sub {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 13.5px;
}

/* 指标卡：理财感但克制 */
.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--sp-gap);
  margin-bottom: var(--sp-gap);
}
.metric-card {
  border-radius: var(--r-lg);
  border: 1px solid var(--border-light);
  background: var(--bg-card);
}
.metric-card :deep(.el-card__body) {
  padding: 14px 16px 12px;
}
.metric-card:hover {
  border-color: var(--border-strong);
}
.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.metric-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}
.metric-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
}
.metric-value {
  font-family: var(--font-num);
  font-size: var(--fs-num-lg);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.metric-sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-placeholder);
}

.metric-card.tone-blue .metric-icon { background: var(--c-blue-bg); color: var(--c-blue); }
.metric-card.tone-orange .metric-icon { background: var(--c-orange-bg); color: var(--c-orange); }
.metric-card.tone-teal .metric-icon { background: var(--c-teal-bg); color: var(--c-teal); }
.metric-card.tone-purple .metric-icon { background: var(--c-purple-bg); color: var(--c-purple); }

/* 区块卡片 */
.block-card {
  border-radius: var(--r-lg);
  border: 1px solid var(--border-light);
  background: var(--bg-card);
  margin-bottom: var(--sp-gap);
}
.block-card :deep(.el-card__body) {
  padding: var(--sp-card);
}

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.card-head h2 {
  margin: 0;
  font-size: var(--fs-h3);
  font-weight: 700;
  color: var(--text-primary);
}
.card-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
}
.card-icon.tone-amber {
  background: var(--c-amber-bg);
  color: var(--c-amber);
}
.pill {
  margin-left: auto;
  height: 22px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  border-radius: var(--r-pill);
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 12px;
  font-weight: 600;
}
.pill.muted {
  background: var(--bg-chip);
  color: var(--text-secondary);
}

.sms {
  background: var(--status-success-soft);
  border: 1px solid rgba(22, 163, 74, 0.14);
  border-radius: var(--r-md);
  padding: 10px 12px;
}
.sms-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 12.5px;
}
.sms-to {
  font-weight: 600;
  color: var(--text-primary);
}
.sms-ok {
  color: var(--status-success);
  font-weight: 600;
  background: #fff;
  border: 1px solid rgba(22, 163, 74, 0.18);
  border-radius: var(--r-pill);
  padding: 0 7px;
  font-size: 11.5px;
  line-height: 18px;
}
.sms-meta time {
  margin-left: auto;
  color: var(--text-placeholder);
  font-size: 12px;
}
.sms-body {
  margin: 0;
  color: var(--text-regular);
  font-size: 13.5px;
  line-height: 1.7;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  gap: var(--sp-gap);
  align-items: start;
}
.grid-2 .block-card {
  margin-bottom: 0;
  height: 100%;
}

.todo-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.todo-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--r-md);
  background: var(--bg-card);
  cursor: pointer;
  text-align: left;
  transition: background var(--t-fast), border-color var(--t-fast);
}
.todo-item:hover {
  background: var(--bg-hover);
  border-color: var(--border-strong);
}
.todo-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.todo-icon.tone-blue { background: var(--c-blue-bg); color: var(--c-blue); }
.todo-icon.tone-green { background: var(--c-green-bg); color: var(--c-green); }
.todo-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.todo-text strong {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.todo-text small {
  font-size: 12.5px;
  color: var(--text-secondary);
}
.todo-arrow {
  color: var(--text-placeholder);
  transition: color var(--t-fast), transform var(--t-fast);
}
.todo-item:hover .todo-arrow {
  color: var(--brand);
  transform: translateX(2px);
}

.chain-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.chain-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 8px;
  border: none;
  border-radius: var(--r-sm);
  background: transparent;
  cursor: pointer;
  transition: background var(--t-fast);
}
.chain-item:hover {
  background: var(--bg-hover);
}
.chain-tag {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.chain-tag.tone-purple { background: var(--c-purple-bg); color: var(--c-purple); }
.chain-tag.tone-green { background: var(--c-green-bg); color: var(--c-green); }
.chain-tag.tone-orange { background: var(--c-orange-bg); color: var(--c-orange); }
.chain-tag.tone-cyan { background: var(--c-cyan-bg); color: var(--c-cyan); }
.chain-tag.tone-pink { background: var(--c-pink-bg); color: var(--c-pink); }
.chain-tag.tone-blue { background: var(--c-blue-bg); color: var(--c-blue); }
.chain-tag.tone-indigo { background: var(--c-indigo-bg); color: var(--c-indigo); }
.chain-label {
  flex: 1;
  text-align: left;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-regular);
}
.chain-state {
  font-size: 12px;
  color: var(--text-placeholder);
}

@media (max-width: 1100px) {
  .metrics {
    grid-template-columns: repeat(2, 1fr);
  }
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 720px) {
  .ws {
    padding: 14px 12px 32px;
  }
  .ws-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .metrics {
    grid-template-columns: 1fr;
  }
}
</style>
