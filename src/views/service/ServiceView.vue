<script setup lang="ts">
/** PRD 当前仅定义入驻环节的「产品服务」资料；正式服务商品管理字段尚未提供。 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElTag } from 'element-plus'
import { ArrowRight, BriefcaseBusiness, FileText, MapPin, Sparkles } from 'lucide-vue-next'
import { useOnboardingStore } from '@/stores/onboarding'

const router = useRouter()
const ob = useOnboardingStore()
const draft = computed(() => ob.draft)
const canEdit = computed(() => ob.status === 'draft' || ob.status === 'rejected')
function openSource() { router.push(canEdit.value ? '/onboarding/step/3' : '/merchant?tab=services') }
</script>

<template>
  <div class="service-page">
    <header class="page-head">
      <p class="eyebrow">服务管理</p>
      <h1>服务资料</h1>
      <p>查看入驻时提交的产品服务信息。</p>
    </header>
    <div class="notice"><Sparkles :size="17" /><span>当前 PRD 仅定义入驻资料中的产品服务字段，尚未定义服务商品的发布、上下架与订单规则。本页仅展示已提交资料。</span></div>
    <div class="intro-row"><span class="intro-icon"><BriefcaseBusiness :size="20" /></span><div><strong>{{ draft.serviceName || draft.entityName || '当前服务商' }}</strong><p>{{ draft.industry || '所属行业待完善' }}</p></div><ElButton @click="openSource">{{ canEdit ? '编辑入驻资料' : '查看入驻资料' }} <ArrowRight :size="14" /></ElButton></div>
    <div class="info-grid">
      <section><div class="section-title"><MapPin :size="18" /><h2>服务范围</h2></div><div class="tag-row" v-if="draft.serviceCities.length"><ElTag v-for="city in draft.serviceCities" :key="city" effect="light">{{ city }}</ElTag></div><p v-else class="blank">尚未填写服务范围</p></section>
      <section><div class="section-title"><Sparkles :size="18" /><h2>擅长业务领域或技能类型</h2></div><div class="tag-row" v-if="draft.skills.length"><ElTag v-for="skill in draft.skills" :key="skill" effect="light">{{ skill }}</ElTag></div><p v-else class="blank">尚未选择擅长领域</p></section>
    </div>
    <section class="text-section"><div class="section-title"><FileText :size="18" /><h2>商户介绍</h2></div><p>{{ draft.merchantIntro || '尚未填写商户介绍' }}</p></section>
    <section class="text-section"><div class="section-title"><FileText :size="18" /><h2>案例与荣誉</h2></div><p>{{ draft.caseDesc || '尚未填写案例与荣誉' }}</p><div class="attachment" v-if="draft.extraCerts">补充资质附件：{{ draft.extraCerts }}</div></section>
  </div>
</template>

<style scoped>
.service-page{max-width:1080px;margin:auto;padding:var(--sp-page-y) var(--sp-page-x) 60px;color:#1e2e49}.page-head{margin-bottom:24px}.eyebrow{font-size:12px;color:#3656c5;font-weight:700;margin:0 0 9px}.page-head h1{font-size:27px;letter-spacing:-.025em;margin:0}.page-head>p:last-child{font-size:14px;color:#5c6a80;margin:8px 0 0}.notice{display:flex;align-items:flex-start;gap:9px;padding:13px 16px;background:#eef7f7;color:#246a70;border-radius:9px;font-size:13px;line-height:1.6}.notice svg{flex:none;margin-top:2px}.intro-row{display:flex;align-items:center;gap:13px;margin:28px 0 30px;padding-bottom:26px;border-bottom:1px solid #e8edf4}.intro-icon{width:42px;height:42px;display:grid;place-items:center;flex:none;color:#3656c5;background:#edf2ff;border-radius:10px}.intro-row>div{flex:1;min-width:0}.intro-row strong{font-size:16px}.intro-row p{font-size:12px;color:#68778d;margin:4px 0 0}.intro-row :deep(.el-button){border-radius:8px}.intro-row :deep(.el-button svg){margin-left:4px}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:28px}.section-title{display:flex;align-items:center;gap:8px;color:#3154b7}.section-title h2{font-size:15px;color:#20314e;margin:0}.tag-row{display:flex;flex-wrap:wrap;gap:7px;margin-top:16px}.tag-row :deep(.el-tag){border-radius:6px;font-weight:600}.blank{color:#8190a3;font-size:13px}.text-section{padding:25px 0;border-top:1px solid #e8edf4}.text-section>p{font-size:13px;line-height:1.8;color:#3d4e67;white-space:pre-wrap;margin:14px 0 0}.attachment{font-size:12px;color:#68778d;margin-top:14px}@media(max-width:700px){.info-grid{grid-template-columns:1fr;gap:24px}.intro-row{flex-wrap:wrap}.intro-row :deep(.el-button){width:100%;margin-left:55px}}
</style>
