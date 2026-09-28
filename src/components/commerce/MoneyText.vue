<script setup lang="ts">
import { computed } from 'vue'
defineOptions({ inheritAttrs: false })
const props = defineProps<{ text: string }>()
const parts = computed(() => props.text.split(/([¥￥]\s*\d[\d,]*(?:\.\d+)?)/g))
</script>
<template><template v-for="(part,index) in parts" :key="index"><b v-if="/^[¥￥]/.test(part)" class="money-value">{{ part.replace(/,/g, '') }}</b><template v-else>{{ part }}</template></template></template>
<style scoped>.money-value{font:inherit;font-weight:700;color:inherit;font-variant-numeric:tabular-nums;white-space:nowrap}</style>
