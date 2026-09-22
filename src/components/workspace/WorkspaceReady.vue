<script setup lang="ts">
import { MessageSquareText, ArrowRight, Store, Package } from 'lucide-vue-next'
import { TrendingUp, Clock3, Wallet, Star } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()

const metrics = [
  {
    key: 'gmv',
    label: '今日 GMV',
    value: '¥0',
    sub: '入驻首日',
    icon: TrendingUp,
    tone: 'red',
    delta: '',
  },
  {
    key: 'orders',
    label: '待处理订单',
    value: '0',
    sub: '待确认 / 待发货',
    icon: Clock3,
    tone: 'orange',
    delta: '',
  },
  {
    key: 'balance',
    label: '可用余额',
    value: '¥0.00',
    sub: '待结算 ¥0',
    icon: Wallet,
    tone: 'blue',
    delta: '',
  },
  {
    key: 'rating',
    label: '店铺评分',
    value: '—',
    sub: '暂无评价',
    icon: Star,
    tone: 'purple',
    delta: '',
  },
]

const todos = [
  {
    title: '开通店铺并完善店招信息',
    desc: '入驻通过后的下一步',
    icon: Store,
    path: '/shop/info',
    tone: 'blue',
  },
  {
    title: '完成首次商品 / 服务上架',
    desc: '上架后进入运营审核',
    icon: Package,
    path: '/service',
    tone: 'green',
  },
]

const chain = [
  { label: '店铺管理', tag: '铺', tone: 'purple', path: '/shop' },
  { label: '商品管理', tag: '品', tone: 'green', path: '/service' },
  { label: '交易管理', tag: '交', tone: 'orange', path: '/order' },
  { label: '物流配送', tag: '流', tone: 'cyan', path: '/order' },
  { label: '营销活动', tag: '营', tone: 'pink', path: '/workspace' },
  { label: '结算对账', tag: '算', tone: 'red', path: '/wallet' },
  { label: '电子合同', tag: '合', tone: 'indigo', path: '/merchant' },
]
</script>

<template>
  <div class="ws">
    <!-- 标题区 -->
    <header class="ws-head">
      <div>
        <p class="eyebrow">经营看板</p>
        <h1>早上好，周启明</h1>
        <p class="sub">今天是入驻首日，先开通店铺，生意就开张了。</p>
      </div>
      <button class="cta" type="button" @click="router.push('/shop/info')">
        去开通店铺
        <ArrowRight :size="16" />
      </button>
    </header>

    <!-- 指标卡：C 端理财感 -->
    <section class="metrics" aria-label="经营指标">
      <article v-for="m in metrics" :key="m.key" class="metric-card" :class="`tone-${m.tone}`">
        <div class="metric-top">
          <span class="metric-label">{{ m.label }}</span>
          <span class="metric-icon">
            <component :is="m.icon" :size="18" stroke-width="1.9" />
          </span>
        </div>
        <div class="metric-value">{{ m.value }}</div>
        <div class="metric-sub">{{ m.sub }}</div>
        <div class="metric-glow" aria-hidden="true" />
      </article>
    </section>

    <!-- 短信通知 -->
    <section class="card notice-card">
      <div class="card-head">
        <span class="card-icon tone-amber">
          <MessageSquareText :size="18" stroke-width="1.9" />
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
    </section>

    <!-- 待办 + 经营链路 -->
    <section class="grid-2">
      <div class="card">
        <div class="card-head">
          <h2>待办事项</h2>
          <span class="pill">2 项待完成</span>
        </div>
        <ul class="todo-list">
          <li v-for="t in todos" :key="t.title">
            <button class="todo-item" type="button" @click="router.push(t.path)">
              <span class="todo-icon" :class="`tone-${t.tone}`">
                <component :is="t.icon" :size="20" stroke-width="1.8" />
              </span>
              <span class="todo-text">
                <strong>{{ t.title }}</strong>
                <small>{{ t.desc }}</small>
              </span>
              <ArrowRight class="todo-arrow" :size="18" />
            </button>
          </li>
        </ul>
      </div>

      <div class="card">
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
      </div>
    </section>
  </div>
</template>

<style scoped>
.ws {
  padding: 28px 32px 48px;
  max-width: 1280px;
  margin: 0 auto;
}

/* ===== 头部 ===== */
.ws-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}
.eyebrow {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--brand-red);
  letter-spacing: 0.06em;
}
.ws-head h1 {
  margin: 0;
  font-size: var(--fs-display);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.2;
}
.sub {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 15px;
}
.cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 22px;
  border: none;
  border-radius: var(--r-pill);
  background: var(--brand-gradient);
  color: #fff;
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-brand);
  transition: transform var(--t-fast) var(--ease-spring), box-shadow var(--t-fast);
  flex-shrink: 0;
}
.cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(229, 57, 53, 0.35);
}
.cta:active {
  transform: translateY(0);
}

/* ===== 指标卡 ===== */
.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
.metric-card {
  position: relative;
  overflow: hidden;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--r-lg);
  padding: 18px 20px 16px;
  box-shadow: var(--shadow-sm);
  transition: transform var(--t-base) var(--ease-out), box-shadow var(--t-base) var(--ease-out);
}
.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover);
}
.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.metric-label {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-secondary);
}
.metric-icon {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  display: grid;
  place-items: center;
}
.metric-value {
  font-family: var(--font-num);
  font-size: var(--fs-num-lg);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}
.metric-sub {
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--text-placeholder);
}
.metric-glow {
  position: absolute;
  right: -20px;
  top: -28px;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  opacity: 0.5;
  pointer-events: none;
}

.metric-card.tone-red .metric-icon { background: var(--c-red-bg); color: var(--c-red); }
.metric-card.tone-red .metric-glow { background: radial-gradient(circle, rgba(229,57,53,0.16), transparent 70%); }
.metric-card.tone-orange .metric-icon { background: var(--c-orange-bg); color: var(--c-orange); }
.metric-card.tone-orange .metric-glow { background: radial-gradient(circle, rgba(255,122,26,0.16), transparent 70%); }
.metric-card.tone-blue .metric-icon { background: var(--c-blue-bg); color: var(--c-blue); }
.metric-card.tone-blue .metric-glow { background: radial-gradient(circle, rgba(37,99,235,0.14), transparent 70%); }
.metric-card.tone-purple .metric-icon { background: var(--c-purple-bg); color: var(--c-purple); }
.metric-card.tone-purple .metric-glow { background: radial-gradient(circle, rgba(124,58,237,0.14), transparent 70%); }

/* ===== 通用卡片 ===== */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--r-lg);
  padding: 20px 22px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
}
.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.card-head h2 {
  margin: 0;
  font-size: var(--fs-h3);
  font-weight: 700;
  color: var(--text-primary);
}
.card-icon {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  display: grid;
  place-items: center;
}
.card-icon.tone-amber {
  background: var(--c-amber-bg);
  color: #d97706;
}
.pill {
  margin-left: auto;
  height: 26px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  border-radius: var(--r-pill);
  background: var(--brand-red-soft);
  color: var(--brand-red);
  font-size: 12px;
  font-weight: 600;
}
.pill.muted {
  background: var(--bg-chip);
  color: var(--text-secondary);
}

/* ===== 短信 ===== */
.notice-card .card-head {
  margin-bottom: 14px;
}
.sms {
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border: 1px solid #bbf7d0;
  border-radius: var(--r-md);
  padding: 14px 16px;
}
.sms-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 13px;
}
.sms-to {
  font-weight: 600;
  color: var(--text-primary);
}
.sms-ok {
  color: var(--c-green);
  font-weight: 600;
  background: #fff;
  border: 1px solid #bbf7d0;
  border-radius: var(--r-pill);
  padding: 1px 8px;
  font-size: 12px;
}
.sms-meta time {
  margin-left: auto;
  color: var(--text-placeholder);
  font-size: 12.5px;
}
.sms-body {
  margin: 0;
  color: var(--text-regular);
  font-size: 14px;
  line-height: 1.75;
}

/* ===== 双列 ===== */
.grid-2 {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  align-items: start;
}
.grid-2 .card {
  margin-bottom: 0;
  height: 100%;
}

/* 待办 */
.todo-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.todo-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--border-lighter);
  border-radius: var(--r-md);
  background: #fafbfc;
  cursor: pointer;
  text-align: left;
  transition:
    background var(--t-fast) var(--ease-out),
    border-color var(--t-fast),
    transform var(--t-fast) var(--ease-out),
    box-shadow var(--t-fast);
}
.todo-item:hover {
  background: #fff;
  border-color: var(--border-strong);
  transform: translateX(3px);
  box-shadow: var(--shadow-sm);
}
.todo-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
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
  gap: 3px;
}
.todo-text strong {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.todo-text small {
  font-size: 13px;
  color: var(--text-secondary);
}
.todo-arrow {
  color: var(--text-placeholder);
  transition: transform var(--t-fast) var(--ease-out), color var(--t-fast);
}
.todo-item:hover .todo-arrow {
  color: var(--brand-red);
  transform: translateX(3px);
}

/* 链路 */
.chain-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.chain-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
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
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}
.chain-tag.tone-purple { background: var(--c-purple-bg); color: var(--c-purple); }
.chain-tag.tone-green { background: var(--c-green-bg); color: var(--c-green); }
.chain-tag.tone-orange { background: var(--c-orange-bg); color: var(--c-orange); }
.chain-tag.tone-cyan { background: var(--c-cyan-bg); color: var(--c-cyan); }
.chain-tag.tone-pink { background: var(--c-pink-bg); color: var(--c-pink); }
.chain-tag.tone-red { background: var(--c-red-bg); color: var(--c-red); }
.chain-tag.tone-indigo { background: var(--c-indigo-bg); color: var(--c-indigo); }
.chain-label {
  flex: 1;
  text-align: left;
  font-size: 14.5px;
  font-weight: 500;
  color: var(--text-regular);
}
.chain-state {
  font-size: 12.5px;
  color: var(--text-placeholder);
}

/* ===== 响应式 ===== */
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
    padding: 20px 16px 40px;
  }
  .ws-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .ws-head h1 {
    font-size: 26px;
  }
  .metrics {
    grid-template-columns: 1fr;
  }
  .sms-meta time {
    margin-left: 0;
    width: 100%;
  }
}
</style>
