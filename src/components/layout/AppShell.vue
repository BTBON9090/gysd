<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TopBar from './TopBar.vue'
import SideNav from './SideNav.vue'
import DevToolsDock from '@/components/devtools/DevToolsDock.vue'
import { useAcceptanceStore } from '@/stores/acceptance'

const route = useRoute()
const acc = useAcceptanceStore()
const pageTitle = computed(() => (route.meta.title as string) || '工作台')
</script>

<template>
  <div class="shell" :class="{ 'is-proto': acc.isPrototypeSkin }">
    <TopBar />
    <div class="shell-body">
      <SideNav />
      <main class="shell-main" :data-state="acc.dataState">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" :key="route.path" :page-title="pageTitle" />
          </transition>
        </router-view>
      </main>
    </div>
    <DevToolsDock />
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
  overflow-x: hidden;
  scroll-behavior: smooth;
}

/* 页面切换：轻盈 */
.page-enter-active,
.page-leave-active {
  transition: opacity var(--t-base) var(--ease-out), transform var(--t-base) var(--ease-out);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
