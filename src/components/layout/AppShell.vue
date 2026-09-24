<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import TopBar from './TopBar.vue'
import SideNav from './SideNav.vue'
import BizStateView from './BizStateView.vue'
import { useAcceptanceStore } from '@/stores/acceptance'

const route = useRoute()
const acc = useAcceptanceStore()
const sideCollapsed = ref(false)
const mainRef = ref<HTMLElement | null>(null)
const pageTitle = computed(() => (route.meta.title as string) || '工作台')
const bizRoute = computed(() => ['/park','/shop','/service','/order','/aftersale','/invoice','/wallet','/review'].some(prefix => route.path === prefix || route.path.startsWith(`${prefix}/`)))
watch(() => route.path, async () => {
  await nextTick()
  if (mainRef.value) mainRef.value.scrollTop = 0
})
</script>

<template>
  <div class="shell" :class="{ 'is-proto': acc.isPrototypeSkin }">
    <TopBar v-model:collapsed="sideCollapsed" />
    <div class="shell-body">
      <SideNav v-model:collapsed="sideCollapsed" />
      <main ref="mainRef" class="shell-main" :data-state="acc.dataState">
        <BizStateView v-if="bizRoute && acc.dataState !== 'ready'" />
        <router-view v-else v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" :key="`${route.path}:${route.query.demo || ''}`" :page-title="pageTitle" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.shell-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.shell-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  overflow-x: auto;
  scroll-behavior: smooth;
  background: #fff;
}

/* 页面切换：轻盈 */
.page-enter-active,
.page-leave-active {
  transition: opacity var(--t-base) var(--ease-out), transform var(--t-base) var(--ease-out);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(3px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-2px);
}
</style>
