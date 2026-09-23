<script setup lang="ts">
import { computed } from 'vue'
import { useAcceptanceStore } from '@/stores/acceptance'
import WorkspaceReady from '@/components/workspace/WorkspaceReady.vue'
import WorkspaceSkeleton from '@/components/workspace/WorkspaceSkeleton.vue'
import WorkspaceEmpty from '@/components/workspace/WorkspaceEmpty.vue'
import WorkspaceError from '@/components/workspace/WorkspaceError.vue'
import WorkspaceProto from '@/components/workspace/WorkspaceProto.vue'
import TypeSelectView from '@/views/onboarding/TypeSelectView.vue'

defineProps<{ pageTitle?: string }>()

const acc = useAcceptanceStore()
const skin = computed(() => (acc.isPrototypeSkin ? 'proto' : 'live'))
</script>

<template>
  <div class="workspace" :class="[`skin-${skin}`, `state-${acc.dataState}`]">
    <TypeSelectView v-if="acc.entryStatus === 'pending'" />
    <!-- 原型参考版：灰阶回退，便于版本对比 -->
    <WorkspaceProto v-else-if="acc.isPrototypeSkin" />
    <template v-else>
      <WorkspaceSkeleton v-if="acc.dataState === 'loading'" />
      <WorkspaceEmpty v-else-if="acc.dataState === 'empty'" />
      <WorkspaceError v-else-if="acc.dataState === 'error'" />
      <WorkspaceReady v-else />
    </template>
  </div>
</template>

<style scoped>
.workspace {
  min-height: 100%;
}
</style>
