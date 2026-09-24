<script setup lang="ts">
/** PRD §6.7.1：已通过主体的四个只读档案页签。 */
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus'
import { Building2, FilePenLine } from 'lucide-vue-next'
import { useOnboardingStore } from '@/stores/onboarding'
import { useMerchantChangeStore } from '@/stores/merchantChange'

const route = useRoute()
const router = useRouter()
const ob = useOnboardingStore()
const change = useMerchantChangeStore()
const changeStatus = computed(() => change.current()?.status || '')
function edit() { if (change.start()) router.push('/merchant/change') }
async function cancelChange() { try { await ElMessageBox.confirm('取消后，本次未提交的变更草稿将被移除。', '取消档案变更', { confirmButtonText: '取消变更', cancelButtonText: '保留草稿', type: 'warning' }); change.cancel(); ElMessage.success('已取消档案变更') } catch { /* cancelled */ } }
const active = ref(typeof route.query.tab === 'string' ? route.query.tab : 'basic')
watch(() => route.query.tab, value => { if (typeof value === 'string') active.value = value })
const d = computed(() => ob.draft)
const mask = (value: string) => value ? value.replace(/(\d{4})\d+(\d{4})/, '$1 **** **** $2') : '—'
const basic = computed(() => [
  ['经营主体', d.value.entityName], ['统一社会信用代码（识别码）', d.value.creditCode],
  ['申请入驻园区', d.value.park], ['入驻身份', '服务商'],
  ['服务商名称', d.value.serviceName], ['所属行业', d.value.industry],
  ['联系人姓名', d.value.contactName], ['联系人手机号', d.value.contactMobile],
  ['邮箱', d.value.email],
])
const qualifications = computed(() => [
  ['营业执照法人', d.value.licenseLegalPerson], ['注册资本', d.value.regCapital],
  ['经营地址', d.value.regAddress], ['经营范围', d.value.businessScope],
  ['身份证姓名', d.value.legalPerson], ['身份证号码', d.value.idNo],
])
const account = computed(() => [
  ['账户名称', d.value.accountName], ['开户银行', d.value.bankName],
  ['开户银行及支行', d.value.bankBranch], ['银行账号', mask(d.value.bankAccount)],
])
const services = computed(() => [
  ['员工规模', d.value.employeeScale], ['服务范围', d.value.serviceCities.join('、')],
  ['擅长业务领域或技能类型', d.value.skills.join('、')], ['商户介绍', d.value.merchantIntro],
  ['案例与荣誉', d.value.caseDesc], ['补充资质附件', d.value.extraCerts],
])
</script>

<template>
  <div class="biz-page archive-page">
    <header class="biz-head archive-head"><span class="archive-head-icon"><Building2 :size="24" /></span><div><h1>商户管理</h1><p>查看入驻档案，发起资料变更。</p></div><ElButton v-if="active === 'basic' && (changeStatus === 'draft' || changeStatus === 'rejected')" @click="cancelChange">取消变更</ElButton><ElButton v-if="active === 'basic'" type="primary" :disabled="changeStatus === 'reviewing'" @click="edit"><FilePenLine :size="15" /> {{ changeStatus === 'reviewing' ? '变更审核中' : changeStatus === 'rejected' ? '变更驳回，重新提交' : changeStatus === 'draft' ? '继续编辑' : '编辑档案' }}</ElButton></header>
    <div class="subject"><span class="subject-symbol">商</span><div><strong>{{ d.entityName || '当前主体' }}</strong><p>{{ d.creditCode || '识别码待完善' }}　·　{{ d.park || '园区待完善' }}</p></div><ElTag type="success" effect="light">已通过</ElTag></div>
    <p v-if="changeStatus === 'reviewing'" class="change-state">变更资料正在审核，以下仍为当前生效档案。</p><p v-if="changeStatus === 'rejected'" class="change-state rejected">{{ change.current()?.reason || '变更已驳回，请核对后重新提交。' }}</p>
    <nav class="tabs" aria-label="商户档案页签">
      <button v-for="tab in [{id:'basic',label:'基本信息'},{id:'qualifications',label:'经营资质'},{id:'account',label:'账户信息'},{id:'services',label:'产品服务'}]" :key="tab.id" type="button" :class="{active:active===tab.id}" @click="active=tab.id">{{ tab.label }}</button>
    </nav>
    <section class="archive-content"><div class="section-heading"><h2>{{ {basic:'基本信息',qualifications:'经营资质',account:'账户信息',services:'产品服务'}[active as 'basic'|'qualifications'|'account'|'services'] || '基本信息' }}</h2><span>当前生效资料</span></div>
      <dl class="details"><div v-for="([label,value],i) in (active==='qualifications'?qualifications:active==='account'?account:active==='services'?services:basic)" :key="`${label}-${i}`"><dt>{{ label }}</dt><dd>{{ value || '—' }}</dd></div></dl>
    </section>
  </div>
</template>

<style scoped>
.archive-page{max-width:1080px;margin:auto;padding:var(--sp-page-y) var(--sp-page-x) 60px;color:#1c2c46}.eyebrow{font-size:12px;font-weight:700;color:#3656c5;margin:0 0 9px}.archive-page h1{font-size:27px;letter-spacing:-.025em;margin:0}.subtitle{font-size:14px;color:#63728a;margin:8px 0 0}.subject{display:flex;align-items:center;gap:13px;padding:22px 0 25px;margin-top:26px;border-bottom:1px solid #e7edf5}.subject-symbol{display:grid;place-items:center;width:40px;height:40px;border-radius:9px;background:#edf2ff;color:#3656c5;font-size:13px;font-weight:700}.subject>div{flex:1;min-width:0}.subject strong{font-size:15px}.subject p{font-size:12px;color:#718096;margin:5px 0 0}.subject :deep(.el-tag){border-radius:6px;font-weight:700}.tabs{display:flex;gap:26px;border-bottom:1px solid #e7edf5;margin-top:4px;overflow-x:auto}.tabs button{flex:none;background:none;border:0;border-bottom:2px solid transparent;padding:17px 2px 13px;color:#65748a;font-size:13px;font-weight:600;cursor:pointer}.tabs button.active{border-color:#3656c5;color:#2f4eb2}.archive-content{padding-top:27px}.section-heading{display:flex;align-items:baseline;gap:10px}.section-heading h2{font-size:17px;margin:0}.section-heading span{font-size:12px;color:#8b97a9}.details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:30px;margin:14px 0 0}.details>div{padding:17px 0;border-bottom:1px solid #eef1f6;min-width:0}.details dt{font-size:12px;color:#718096;margin-bottom:7px}.details dd{font-size:14px;font-weight:600;color:#243650;line-height:1.6;margin:0;overflow-wrap:anywhere}@media(max-width:700px){.details{grid-template-columns:1fr}.tabs{gap:18px}}
</style>

<style scoped>
.archive-page{max-width:1190px;padding:30px 32px 70px}.archive-head{display:flex;align-items:center;justify-content:flex-start;gap:15px;margin-bottom:26px}.archive-head-icon{display:grid;place-items:center;flex:none;width:46px;height:46px;border-radius:11px;background:#eaf0ff;color:#3659c2}.archive-head>div{flex:1}.archive-head h1{font-size:27px;margin:0 0 3px}.archive-head p{font-size:14px;color:#65738a;margin:0}.archive-head :deep(.el-button span){display:inline-flex;align-items:center;gap:6px}.subject{margin-top:0;padding:16px 18px;border:1px solid #e1e8f2;border-radius:11px;background:#f9fbff}.subject-symbol{width:42px;height:42px}.tabs{margin-top:20px}.tabs button{padding:13px 3px 11px}.archive-content{padding-top:21px}.details{column-gap:34px}.details>div{padding:13px 0}.change-state{margin:12px 0 0;padding:10px 13px;border-radius:7px;background:#edf3ff;color:#3556a5;font-size:12px}.change-state.rejected{background:#fff0ef;color:#ad4037}
</style>
