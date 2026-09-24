<script setup lang="ts">
import { Inbox, TriangleAlert } from 'lucide-vue-next'
import { ElButton } from 'element-plus'
import { useAcceptanceStore } from '@/stores/acceptance'

const acc = useAcceptanceStore()
</script>

<template>
  <div class="biz-state">
    <template v-if="acc.dataState === 'loading'">
      <div class="skeleton title" />
      <div class="skeleton line" />
      <div class="skeleton block" />
    </template>
    <div v-else class="state-card" :class="{ error: acc.dataState === 'error' }">
      <span class="state-icon"><TriangleAlert v-if="acc.dataState === 'error'" :size="25" /><Inbox v-else :size="25" /></span>
      <h2>{{ acc.dataState === 'error' ? '加载失败' : '暂无数据' }}</h2>
      <p>{{ acc.dataState === 'error' ? '请稍后重试，或检查网络连接。' : '当前场景还没有可展示的内容。' }}</p>
      <ElButton type="primary" @click="acc.setDataState('ready')">{{ acc.dataState === 'error' ? '重新加载' : '返回正常数据' }}</ElButton>
    </div>
  </div>
</template>

<style scoped>
.biz-state{max-width:1150px;margin:0 auto;padding:54px 32px;color:#66768e}
.state-card{max-width:540px;margin:auto;padding:40px 24px;border:1px dashed #d9e3f2;border-radius:14px;background:#fbfcff;text-align:center}
.state-icon{display:grid;place-items:center;width:52px;height:52px;margin:0 auto 14px;border-radius:13px;background:#eaf0ff;color:#3b60c0}
.state-card.error .state-icon{background:#fff1eb;color:#bc6049}
.state-card h2{font-size:20px;color:#233550;margin:0 0 6px}
.state-card p{font-size:13px;margin:0 0 19px}
.skeleton{border-radius:7px;background:#eff2f7;animation:pulse 1.4s ease-in-out infinite alternate}
.title{height:27px;width:180px;margin-bottom:18px}.line{height:14px;width:340px;max-width:80%;margin-bottom:40px}.block{height:260px;width:100%}
@keyframes pulse{to{opacity:.55}}
</style>
