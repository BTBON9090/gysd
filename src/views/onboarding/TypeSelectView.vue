<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowRight, CheckCircle2, ClipboardList, Clock3, Handshake } from 'lucide-vue-next'
import { useOnboardingStore } from '@/stores/onboarding'
import { useAcceptanceStore } from '@/stores/acceptance'
import OnboardingShell from '@/components/onboarding/OnboardingShell.vue'
import TypeSelectV2 from '@/components/onboarding/TypeSelectV2.vue'

const router = useRouter()
const ob = useOnboardingStore()
const acc = useAcceptanceStore()

function start() {
  if (ob.entityVerified || ob.draft.entityName || ob.status !== 'draft') ob.createApplication()
  ob.draft.supplierType = 'service'
  acc.setEntryStatus('pending')
  router.push('/onboarding/entity')
}

function openApplication(id: string) {
  if (!ob.selectApplication(id)) return
  acc.setEntryStatus(ob.status === 'approved' ? 'approved' : 'pending')
  if (ob.status === 'reviewing' || ob.status === 'rejected' || ob.status === 'approved') router.push('/onboarding/progress')
  else router.push(ob.entityVerified ? `/onboarding/step/${Math.max(1, Math.min(5, ob.maxStep))}` : '/onboarding/entity')
}
</script>

<template>
  <OnboardingShell :show-steps="false" :show-footer="false">
    <TypeSelectV2 v-if="acc.versionId === 'v2.0-light'" @start="start" />
    <div v-else class="landing">
      <header class="intro">
        <p class="eyebrow">供应商入驻</p>
        <h1>申请成为园区服务商</h1>
        <p>完成主体核验与入驻资料填写后，提交园区运营审核。您可以暂存草稿，并在提交后查询进度。</p>
      </header>

      <section class="service-card">
        <div class="service-main">
          <span class="icon"><Handshake :size="25" :stroke-width="1.7" /></span>
          <div class="service-copy">
            <span class="kicker">本期开放</span>
            <h2>服务商入驻</h2>
            <p>为园区企业提供企业服务，按流程提交主体、资质、产品服务和协议资料。</p>
            <button class="primary-action" type="button" @click="start">
              申请入驻
              <ArrowRight :size="18" />
            </button>
          </div>
        </div>
        <div class="process">
          <p class="process-title">申请流程</p>
          <div><span>01</span><strong>核验主体</strong><CheckCircle2 :size="15" /></div>
          <div><span>02</span><strong>填写并提交资料</strong><ClipboardList :size="15" /></div>
          <div><span>03</span><strong>查看审核进度</strong><Clock3 :size="15" /></div>
        </div>
      </section>

      <div v-if="ob.applications.some(item => item.entityVerified)" class="application-list">
        <h3>我的入驻申请</h3>
        <button v-for="item in ob.applications.filter(a => a.entityVerified)" :key="item.id" class="existing" type="button" @click="openApplication(item.id)">
          <strong>{{ item.draft.entityName }}</strong>
          <span>{{ item.draft.park || '园区待选择' }}</span>
          <span class="state">{{ { draft: '待提交', reviewing: '审核中', rejected: '已驳回', approved: '已通过' }[item.status] }}</span>
          <ArrowRight :size="15" />
        </button>
      </div>
    </div>
  </OnboardingShell>
</template>

<style scoped>
.landing{max-width:960px;margin:38px auto 0}.intro{margin-bottom:28px}.eyebrow{margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.1em;color:var(--brand)}.intro h1{font-size:32px;letter-spacing:-.025em;color:var(--text-primary);margin:0}.intro>p:last-child{font-size:14px;color:var(--text-secondary);line-height:1.7;margin:10px 0 0;max-width:680px}.service-card{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(260px,.8fr);background:#fff;border:1px solid var(--border-light);border-radius:18px;box-shadow:var(--shadow-sm);overflow:hidden}.service-main{display:flex;gap:22px;padding:38px 34px 40px}.icon{width:58px;height:58px;display:grid;place-items:center;flex:none;border-radius:15px;background:var(--brand-soft);color:var(--brand)}.service-copy{min-width:0}.kicker{color:var(--brand);font-size:12px;font-weight:700}.service-copy h2{font-size:23px;margin:4px 0 8px;color:var(--text-primary)}.service-copy p{color:var(--text-secondary);font-size:13px;line-height:1.75;margin:0 0 26px;max-width:360px}.primary-action{height:42px;padding:0 19px;display:inline-flex;align-items:center;gap:22px;border:0;border-radius:9px;background:var(--brand);color:#fff;font-size:14px;font-weight:700;cursor:pointer;transition:background var(--t-fast),transform var(--t-fast)}.primary-action:hover{background:var(--brand-active);transform:translateY(-1px)}.process{padding:29px 25px;background:#f7f9fc;border-left:1px solid var(--border-light)}.process-title{margin:0 0 17px;color:var(--text-placeholder);font-size:12px;font-weight:700;letter-spacing:.06em}.process>div{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid #e6eaf0}.process>div:last-child{border-bottom:0}.process span{color:var(--brand);font-size:12px;font-weight:700}.process strong{flex:1;color:var(--text-primary);font-size:13px}.process svg{color:#9aa7bc}.application-list{margin-top:24px}.application-list h3{font-size:15px;color:var(--text-primary);margin:0 0 10px}.existing{display:flex;align-items:center;gap:13px;width:100%;margin-top:8px;background:#fff;border:1px solid var(--border-light);border-radius:12px;padding:14px 19px;font-size:13px;color:var(--text-secondary);text-align:left;cursor:pointer}.existing:hover{border-color:var(--brand)}.existing strong{color:var(--text-primary);flex:1}.state{color:var(--brand);background:var(--brand-soft);border-radius:6px;padding:3px 8px;font-size:12px;font-weight:700}@media(max-width:760px){.landing{margin-top:20px}.service-card{grid-template-columns:1fr}.process{border-left:0;border-top:1px solid var(--border-light)}.service-main{padding:28px 22px}.intro h1{font-size:27px}.existing{flex-wrap:wrap}}
</style>
