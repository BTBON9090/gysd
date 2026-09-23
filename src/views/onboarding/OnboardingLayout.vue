<script setup lang="ts">
import { onMounted } from 'vue'
import { useAcceptanceStore } from '@/stores/acceptance'

defineProps<{ pageTitle?: string }>()

const acc = useAcceptanceStore()

// 仅首次进入入驻流程时置为待提交；验收工具切到已入驻后不回拉
onMounted(() => {
  if (acc.entryStatus === 'approved') acc.setEntryStatus('pending')
})
</script>

<template>
  <router-view />
</template>
