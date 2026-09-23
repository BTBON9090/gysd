<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAcceptanceStore } from '@/stores/acceptance'

defineProps<{ pageTitle?: string }>()

const route = useRoute()
const acc = useAcceptanceStore()

onMounted(() => {
  acc.setEntryStatus('pending')
})

watch(
  () => route.path,
  (p) => {
    if (p.startsWith('/onboarding')) acc.setEntryStatus('pending')
  },
  { immediate: true },
)
</script>

<template>
  <router-view />
</template>
