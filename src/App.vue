<script setup lang="ts">
import { onMounted } from 'vue'
import { useAcceptanceStore } from '@/stores/acceptance'

const acc = useAcceptanceStore()

onMounted(() => {
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
})
</script>

<template>
  <router-view />
</template>
