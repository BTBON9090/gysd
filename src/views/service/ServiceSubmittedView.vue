<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElButton } from 'element-plus'
import { ArrowRight, CircleCheck, ClipboardCheck, Plus } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="biz-page submitted-page">
    <section class="submitted-card">
      <div class="submitted-icon"><CircleCheck :size="34" :stroke-width="1.8" /></div>
      <span class="submitted-kicker">提交完成</span>
      <h1>服务已提交，等待园区审核</h1>
      <p class="submitted-intro">所选园区将分别审核服务。审核通过后，该园区的客户即可看到并购买。</p>
      <div class="submitted-flow" aria-label="服务发布进度">
        <div class="flow-step done"><CircleCheck :size="18" /><span><strong>提交成功</strong><small>资料已送达园区</small></span></div>
        <i />
        <div class="flow-step current"><ClipboardCheck :size="18" /><span><strong>园区审核</strong><small>各园独立处理</small></span></div>
        <i />
        <div class="flow-step"><CircleCheck :size="18" /><span><strong>审核通过</strong><small>自动上架</small></span></div>
      </div>
      <div class="submitted-actions">
        <ElButton type="primary" @click="router.push('/service')">查看审核进度 <ArrowRight :size="15" /></ElButton>
        <ElButton @click="router.push('/service/new')"><Plus :size="15" />继续发布</ElButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.submitted-page{display:grid;place-items:start center;min-height:100%;padding-top:58px}
.submitted-card{width:min(760px,100%);padding:42px 48px 38px;border:1px solid #dfeae5;border-radius:16px;background:linear-gradient(155deg,#f2fbf7 0%,#fff 58%);text-align:center}
.submitted-icon{display:grid;place-items:center;width:64px;height:64px;margin:0 auto 17px;border-radius:16px;background:#dff4e9;color:#13845f}
.submitted-kicker{color:#13845f;font-size:12px;font-weight:750;letter-spacing:.08em}
.submitted-card h1{margin:7px 0 8px;color:#1c3440;font-size:25px;line-height:1.35}
.submitted-intro{max-width:500px;margin:0 auto;color:#61758a;font-size:13px;line-height:1.7}
.submitted-flow{display:flex;align-items:center;justify-content:center;gap:13px;margin:34px 0 30px;padding:18px 20px;border:1px solid #e5ecf0;border-radius:10px;background:#fff;text-align:left}
.submitted-flow>i{flex:1;height:1px;max-width:38px;background:#dbe5eb}
.flow-step{display:flex;align-items:center;gap:9px;min-width:0;color:#8b9aac}.flow-step.done{color:#168263}.flow-step.current{color:#365ab6}.flow-step>span{display:grid;gap:1px}.flow-step strong{font-size:12px;white-space:nowrap}.flow-step small{font-size:10px;color:#8998a8;white-space:nowrap}
.submitted-actions{display:flex;align-items:center;justify-content:center;gap:10px}.submitted-actions :deep(.el-button){margin:0;min-height:38px}.submitted-actions :deep(.el-button>span){display:inline-flex;align-items:center;gap:6px}
</style>
