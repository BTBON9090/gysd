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
const formRoute = computed(() => ['onboarding-entity','onboarding-step','onboarding-progress','shop-info','service-new','service-edit','service-submitted','order-detail','invoice-open','merchant','merchant-change','settings'].includes(String(route.name)))
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
        <div class="shell-content" :class="{ 'is-form-page': formRoute }"><BizStateView v-if="bizRoute && acc.dataState !== 'ready'" />
        <router-view v-else v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" :key="`${route.path}:${route.query.demo || ''}`" :page-title="pageTitle" />
          </transition>
        </router-view></div>
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
  scrollbar-gutter: stable;
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
.shell-content.is-form-page{min-width:800px}
</style>

<style scoped>
.shell{min-width:0;width:100%}.shell-content{width:100%;min-width:calc(1200px - 100vw + 100%);min-height:100%;height:100%}.shell-body{min-width:0}
</style>
