<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElButton } from 'element-plus'
import { ArrowRight, ShieldCheck } from 'lucide-vue-next'
import { useSessionStore } from '@/stores/session'
import { useAcceptanceStore } from '@/stores/acceptance'

const router = useRouter()
const session = useSessionStore()
function resume() { session.resume(); router.replace(useAcceptanceStore().entryStatus === 'approved' ? '/park' : '/workspace') }
</script>

<template>
  <main class="login-page">
    <div class="login-card">
      <img src="/zqyq-logo-all.png" alt="万联易达集团" />
      <span class="state"><ShieldCheck :size="17" /> 已退出供应商端</span>
      <h1>重新进入演示</h1>
      <p>本项目仅为前端演示，暂未接入手机号登录与数据中台。点击下方按钮恢复本机演示会话；入驻草稿与演示数据会保留。</p>
      <ElButton type="primary" @click="resume">继续体验 <ArrowRight :size="16" /></ElButton>
    </div>
  </main>
</template>

<style scoped>
.login-page{min-height:100vh;display:grid;place-items:center;padding:24px;background:#f7f9fc}.login-card{width:min(100%,430px);padding:34px;border:1px solid #e3e9f2;border-radius:16px;background:#fff}.login-card img{display:block;width:155px;height:auto;padding:6px;background:#17233b;border-radius:6px;margin-bottom:36px}.state{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:#0d876e;background:#e8f8f3;border-radius:7px;padding:6px 9px}.login-card h1{font-size:25px;color:#17233b;margin:16px 0 9px}.login-card p{font-size:14px;line-height:1.7;color:#5c6980;margin:0 0 26px}.login-card :deep(.el-button){height:38px;border-radius:8px}.login-card :deep(svg){margin-left:5px}
</style>
