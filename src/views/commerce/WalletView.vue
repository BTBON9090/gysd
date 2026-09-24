<script setup lang="ts">
import { computed } from 'vue'
import { ElButton, ElTag } from 'element-plus'
import { ArrowRight, CircleCheck, LockKeyhole, WalletCards } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useCommerceStore } from '@/stores/commerce'

const c = useCommerceStore()
const router = useRouter()
// 正式接入时由后端提供携带当前主体和用户 SSO 参数的钱包地址。
const walletUrl = import.meta.env.VITE_WALLET_EMBED_URL as string | undefined
const hasWalletUrl = computed(() => Boolean(walletUrl))
</script>

<template>
  <div class="biz-page wallet-page">
    <header class="biz-head wallet-head">
      <div class="wallet-heading"><span class="wallet-heading-icon"><WalletCards :size="24" /></span><div><h1>我的钱包</h1><p>在当前工作台查看支付平台钱包，并完成开户与资金操作。</p></div></div>
      <ElTag :type="c.data.walletOpen ? 'success' : 'warning'" effect="light">{{ c.data.walletOpen ? '已开户' : '未开户' }}</ElTag>
    </header>

    <section v-if="hasWalletUrl" class="wallet-embed" aria-label="支付平台钱包">
      <iframe :src="walletUrl" title="支付平台我的钱包" />
    </section>

    <template v-else>
      <section class="wallet-stage">
        <span class="wallet-stage-icon"><LockKeyhole v-if="!c.data.walletOpen" :size="25" /><CircleCheck v-else :size="25" /></span>
        <div class="wallet-stage-copy">
          <span class="wallet-stage-kicker">支付平台 · 演示状态</span>
          <h2>{{ c.data.walletOpen ? '钱包已开通' : '尚未开通钱包账户' }}</h2>
          <p>{{ c.data.walletOpen ? '当前主体已具备发布服务和使用交易功能的开户条件。' : '完成支付平台开户后，才能发布服务并使用交易功能。' }}</p>
          <div class="wallet-stage-actions"><ElButton v-if="c.data.walletOpen" type="primary" @click="router.push('/service')">前往服务管理 <ArrowRight :size="15" /></ElButton><span v-else>开户流程将在此处由支付平台提供</span></div>
        </div>
      </section>
      <section class="wallet-boundary"><div><h3>钱包内容由支付平台提供</h3><p>接入后，开户、资产、明细与提现会在上方区域完成；具体规则和数据以支付平台为准。</p></div><span>当前为本地演示</span></section>
    </template>
  </div>
</template>

<style scoped>
.wallet-page{min-width:800px;max-width:1190px}.wallet-head{align-items:center;margin-bottom:30px}.wallet-heading{display:flex;align-items:center;gap:15px}.wallet-heading-icon{display:grid;place-items:center;flex:none;width:46px;height:46px;border-radius:11px;background:#eaf0ff;color:#3659c2}.wallet-stage{display:flex;align-items:flex-start;gap:22px;min-height:280px;padding:38px 42px;border:1px solid #e0e8f2;border-radius:13px;background:linear-gradient(110deg,#f4f7ff 0%,#fff 68%)}.wallet-stage-icon{display:grid;place-items:center;flex:none;width:58px;height:58px;border-radius:12px;background:#e7eeff;color:#3459bd}.wallet-stage-copy{max-width:610px}.wallet-stage-kicker{color:#4565ba;font-size:12px;font-weight:700}.wallet-stage h2{margin:8px 0 8px;color:#1e2d47;font-size:23px}.wallet-stage p{margin:0;color:#586981;font-size:14px;line-height:1.7}.wallet-stage-actions{margin-top:24px}.wallet-stage-actions span{color:#708098;font-size:13px}.wallet-boundary{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:24px;padding:20px 2px;border-top:1px solid #e8edf4}.wallet-boundary h3{margin:0 0 6px;font-size:15px;color:#253751}.wallet-boundary p{margin:0;color:#75849a;font-size:13px;line-height:1.6}.wallet-boundary>span{white-space:nowrap;color:#8190a3;font-size:12px}.wallet-embed{min-height:650px;border:1px solid #e1e8f2;border-radius:12px;overflow:hidden;background:#fff}.wallet-embed iframe{display:block;width:100%;height:calc(100vh - 190px);min-height:650px;border:0}
</style>
