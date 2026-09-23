<script setup lang="ts">
import { onMounted } from 'vue'
import { useAcceptanceStore } from '@/stores/acceptance'
import { useOnboardingStore } from '@/stores/onboarding'
import router from '@/router'
import DevToolsDock from '@/components/devtools/DevToolsDock.vue'

const acc = useAcceptanceStore()
const ob = useOnboardingStore()

onMounted(() => {
  acc.setEntryStatus(ob.status === 'approved' ? 'approved' : 'pending')
  // hash 路由：参数在 # 后，如 #/workspace?state=empty&skin=proto
  const hash = window.location.hash
  const qi = hash.indexOf('?')
  const q = new URLSearchParams(qi >= 0 ? hash.slice(qi + 1) : window.location.search)
  const state = q.get('state')
  if (state && ['ready', 'loading', 'empty', 'error'].includes(state)) {
    acc.setDataState(state as never)
  }
  const skin = q.get('skin')
  if (skin === 'proto') acc.setVersion('v0.9-proto')
  const entry = q.get('entry')
  if (entry === 'pending') acc.setEntryStatus('pending')
  if (entry === 'approved') acc.setEntryStatus('approved')
  if (acc.entryStatus === 'pending' && !['/workspace', '/settings'].includes(router.currentRoute.value.path) && !router.currentRoute.value.path.startsWith('/onboarding/')) {
    router.replace('/workspace')
  }
})
</script>

<template>
  <router-view />
  <DevToolsDock />
</template>
