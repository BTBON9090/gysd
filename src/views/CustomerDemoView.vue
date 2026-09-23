<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton } from 'element-plus'
import { ArrowLeft, Building2 } from 'lucide-vue-next'
import { useProfileStore } from '@/stores/profile'

const router = useRouter()
const profile = useProfileStore()
const park = computed(() => sessionStorage.getItem('gysd-demo-customer-park') || profile.registeredParks[0] || '')
</script>

<template>
  <main class="customer-demo">
    <header><img src="/zqyq-logo-all.png" alt="万联易达集团" /><span>园区客户端 · 切换演示</span></header>
    <div class="destination">
      <span class="icon"><Building2 :size="25" /></span>
      <p class="eyebrow">切换园区客户</p>
      <h1>{{ park || '暂无关联园区' }}</h1>
      <p>已从供应商端进入园区客户视角。供应商端会话仍保留，可以随时返回。</p>
      <div class="notice">当前仓库仅包含供应商端，未配置园区客户端地址与 SSO 接口。正式环境将根据登录来源园区或注册园区跳转到对应客户端。</div>
      <ElButton type="primary" @click="router.push('/workspace')"><ArrowLeft :size="16" /> 返回供应商端</ElButton>
    </div>
  </main>
</template>

<style scoped>
.customer-demo{min-height:100vh;background:#f7f9fc;color:#1d2d48}.customer-demo header{height:64px;display:flex;align-items:center;gap:16px;padding:0 28px;background:#fff;border-bottom:1px solid #e3e9f2}.customer-demo header img{width:142px;padding:5px;background:#17233b;border-radius:5px}.customer-demo header span{font-size:13px;color:#66758b}.destination{max-width:650px;margin:10vh auto 0;padding:42px;background:#fff;border:1px solid #e3e9f2;border-radius:16px}.icon{width:50px;height:50px;display:grid;place-items:center;background:#edf2ff;color:#3656c5;border-radius:11px}.eyebrow{color:#3656c5;font-size:12px;font-weight:700;margin:22px 0 8px}.destination h1{font-size:26px;margin:0 0 12px}.destination>p:not(.eyebrow){font-size:14px;color:#56677f;line-height:1.7}.notice{margin:24px 0;padding:15px 17px;border-radius:9px;background:#f3f6fb;color:#596b84;font-size:13px;line-height:1.65}.destination :deep(.el-button){border-radius:8px}.destination :deep(svg){margin-right:6px}@media(max-width:700px){.destination{margin:34px 16px;padding:28px}}
</style>
