<script setup lang="ts">
import { AlertTriangle, RotateCcw } from 'lucide-vue-next'
import { useAcceptanceStore } from '@/stores/acceptance'

const acc = useAcceptanceStore()
</script>

<template>
  <div class="ws">
    <div class="state-card">
      <span class="state-icon tone-amber">
        <AlertTriangle :size="30" stroke-width="1.6" />
      </span>
      <h1>数据加载失败</h1>
      <p>网络异常或服务暂时不可用，请稍后重试。若持续出现，请联系平台运营。</p>
      <button class="btn primary" type="button" @click="acc.setDataState('ready')">
        <RotateCcw :size="16" />
        重新加载
      </button>
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
.state-icon.tone-amber {
  background: var(--c-amber-bg);
  color: var(--c-orange);
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
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 22px;
  border: none;
  border-radius: 8px;
  background: var(--brand-gradient);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-brand);
  transition: transform var(--t-fast) var(--ease-spring);
}
.btn:hover {
  transform: translateY(-1px);
}
</style>
