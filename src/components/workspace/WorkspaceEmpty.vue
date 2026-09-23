<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="ws">
    <div class="state-card">
      <span class="state-icon tone-blue">
        <Inbox :size="30" stroke-width="1.6" />
      </span>
      <h1>还没有经营数据</h1>
      <p>店铺开通并上架商品后，这里会展示今日 GMV、待处理订单与余额等经营指标。</p>
      <div class="actions">
        <button class="btn primary" type="button" @click="router.push('/shop/info')">去开通店铺</button>
        <button class="btn ghost" type="button" @click="router.push('/service')">先看看服务管理</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ws {
  min-height: 100%;
  display: grid;
  place-items: center;
  padding: 48px 24px;
}
.state-card {
  text-align: center;
  max-width: 440px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--r-xl);
  padding: 48px 40px;
  box-shadow: var(--shadow-sm);
}
.state-icon {
  display: inline-grid;
  place-items: center;
  width: 68px;
  height: 68px;
  border-radius: 22px;
  margin-bottom: 18px;
}
.state-icon.tone-blue {
  background: var(--c-blue-bg);
  color: var(--c-blue);
}
h1 {
  margin: 0 0 10px;
  font-size: var(--fs-h2);
  color: var(--text-primary);
}
p {
  margin: 0 0 24px;
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 14.5px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}
.btn {
  height: 42px;
  padding: 0 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform var(--t-fast) var(--ease-spring), background var(--t-fast);
}
.btn.primary {
  background: var(--brand-gradient);
  color: #fff;
  box-shadow: var(--shadow-brand);
}
.btn.primary:hover {
  transform: translateY(-1px);
}
.btn.ghost {
  background: #fff;
  border-color: var(--border-strong);
  color: var(--text-regular);
}
.btn.ghost:hover {
  background: var(--bg-hover);
}
</style>
