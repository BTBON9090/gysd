<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Construction } from 'lucide-vue-next'

const route = useRoute()
const title = computed(() => (route.meta.title as string) || '功能页')
</script>

<template>
  <div class="placeholder">
    <div class="ph-card">
      <span class="ph-icon">
        <Construction :size="28" stroke-width="1.6" />
      </span>
      <h1>{{ title }}</h1>
      <p>该模块将在后续迭代中交付。当前版本（V1）聚焦工作台与导航壳层的体验打磨。</p>
      <router-link class="ph-link" to="/workspace">返回工作台</router-link>
    </div>
  </div>
</template>

<style scoped>
.placeholder {
  min-height: 100%;
  display: grid;
  place-items: center;
  padding: 48px 24px;
}
.ph-card {
  text-align: center;
  max-width: 420px;
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--r-xl);
  padding: 48px 40px;
  box-shadow: var(--shadow-sm);
}
.ph-icon {
  display: inline-grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: var(--c-amber-bg);
  color: var(--c-orange);
  margin-bottom: 18px;
}
h1 {
  margin: 0 0 10px;
  font-size: var(--fs-h1);
  color: var(--text-primary);
}
p {
  margin: 0 0 22px;
  color: var(--text-secondary);
  font-size: var(--fs-body);
  line-height: 1.7;
}
.ph-link {
  display: inline-flex;
  height: 40px;
  align-items: center;
  padding: 0 20px;
  border-radius: var(--r-pill);
  background: var(--brand-red);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  box-shadow: var(--shadow-brand);
  transition: transform var(--t-fast) var(--ease-spring);
}
.ph-link:hover {
  transform: translateY(-1px);
  background: var(--brand-red-hover);
}
</style>
