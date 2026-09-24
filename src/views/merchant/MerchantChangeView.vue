<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElInput, ElMessage, ElMessageBox, ElOption, ElSelect } from 'element-plus'
import { ArrowLeft, ArrowRight, Check, FilePenLine, Save } from 'lucide-vue-next'
import { useOnboardingStore } from '@/stores/onboarding'
import { useMerchantChangeStore } from '@/stores/merchantChange'

const router = useRouter()
const ob = useOnboardingStore()
const change = useMerchantChangeStore()
if (!change.current()) change.start()
const record = computed(() => change.current())
const d = computed(() => record.value?.draft || ob.draft)
const step = ref(record.value?.step || 1)
const errors = reactive<Record<string, string>>({})
const steps = ['入驻信息', '经营资质', '产品服务', '协议与账户', '确认提交']
watch(step, value => { change.save(value); Object.keys(errors).forEach(key => delete errors[key]) })
function validate() {
  Object.keys(errors).forEach(key => delete errors[key])
  if (step.value === 1) {
    if (!d.value.serviceName.trim()) errors.serviceName = '请填写服务商名称'
    if (!d.value.contactName.trim()) errors.contactName = '请填写联系人'
    if (!/^1\d{10}$/.test(d.value.contactMobile)) errors.contactMobile = '请输入 11 位手机号'
  }
  if (step.value === 2 && !d.value.businessScope.trim()) errors.businessScope = '请填写经营范围'
  if (step.value === 3 && !d.value.merchantIntro.trim()) errors.merchantIntro = '请填写商户介绍'
  if (step.value === 4) {
    if (!d.value.accountName.trim()) errors.accountName = '请填写账户名称'
    if (!d.value.bankName.trim()) errors.bankName = '请填写开户银行'
    if (!d.value.bankAccount.trim()) errors.bankAccount = '请填写银行账号'
  }
  return !Object.keys(errors).length
}
function next() { if (validate()) { step.value = Math.min(5, step.value + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) } }
function back() { if (step.value > 1) step.value--; else router.push('/merchant') }
function save() { change.save(step.value); ElMessage.success('变更草稿已保存') }
async function submit() {
  if (!change.current()) return
  const required: [number, string, boolean, string][] = [
    [1, 'serviceName', !!d.value.serviceName.trim(), '请填写服务商名称'],
    [1, 'contactName', !!d.value.contactName.trim(), '请填写联系人'],
    [1, 'contactMobile', /^1\d{10}$/.test(d.value.contactMobile), '请输入 11 位手机号'],
    [2, 'businessScope', !!d.value.businessScope.trim(), '请填写经营范围'],
    [3, 'merchantIntro', !!d.value.merchantIntro.trim(), '请填写商户介绍'],
    [4, 'accountName', !!d.value.accountName.trim(), '请填写账户名称'],
    [4, 'bankName', !!d.value.bankName.trim(), '请填写开户银行'],
    [4, 'bankAccount', !!d.value.bankAccount.trim(), '请填写银行账号'],
  ]
  const first = required.find(([, , valid]) => !valid)
  if (first) { step.value = first[0]; await nextTick(); errors[first[1]] = first[3]; ElMessage.warning('请先完善必填资料'); return }
  try {
    await ElMessageBox.confirm('提交后变更资料将进入运营审核，审核通过前商户档案继续显示当前生效信息。', '提交入驻信息变更', { confirmButtonText: '确认提交', cancelButtonText: '继续核对', type: 'warning' })
    if (change.submit()) { ElMessage.success('变更已提交，等待审核'); router.push('/merchant') }
  } catch { /* cancelled */ }
}
function field(label: string) { return errors[label] || '' }
</script>

<template>
  <div class="biz-page change-page">
    <header class="biz-head change-head"><span class="head-icon"><FilePenLine :size="24" /></span><div><h1>入驻信息变更</h1><p>沿用入驻资料逐步核对；主体与园区信息不可修改。</p></div><ElButton @click="router.push('/merchant')">返回商户档案</ElButton></header>
    <div class="change-layout">
      <nav class="change-steps" aria-label="变更步骤"><button v-for="(label, index) in steps" :key="label" type="button" :class="{ active: step === index + 1, done: step > index + 1 }" @click="step = index + 1"><span>{{ step > index + 1 ? '✓' : String(index + 1).padStart(2, '0') }}</span>{{ label }}</button></nav>
      <section class="change-panel">
        <div class="panel-head"><span>步骤 {{ String(step).padStart(2, '0') }} / 05</span><h2>{{ steps[step - 1] }}</h2><p>{{ step === 1 ? '锁定字段沿用已通过的主体资料。' : step === 5 ? '确认变更内容后提交运营审核。' : '请核对并更新需要变更的入驻资料。' }}</p></div>
        <div v-if="step === 1" class="change-fields">
          <div class="locked-fields"><div><small>入驻园区 · 不可修改</small><strong>{{ d.park || '—' }}</strong></div><div><small>入驻身份 · 不可修改</small><strong>服务商</strong></div><div><small>经营主体 · 不可修改</small><strong>{{ d.entityName || '—' }}</strong></div><div><small>主体证件号 · 不可修改</small><strong>{{ d.creditCode || '—' }}</strong></div></div>
          <label class="biz-field">服务商名称 <b class="required">*</b><ElInput v-model="d.serviceName" maxlength="60" /><small v-if="field('serviceName')" class="error">{{ field('serviceName') }}</small></label>
          <label class="biz-field">所属行业<ElInput v-model="d.industry" /></label>
          <label class="biz-field">联系人 <b class="required">*</b><ElInput v-model="d.contactName" /><small v-if="field('contactName')" class="error">{{ field('contactName') }}</small></label>
          <label class="biz-field">联系人手机号 <b class="required">*</b><ElInput v-model="d.contactMobile" maxlength="11" /><small v-if="field('contactMobile')" class="error">{{ field('contactMobile') }}</small></label>
          <label class="biz-field">联系人职务<ElInput v-model="d.contactTitle" /></label><label class="biz-field">邮箱<ElInput v-model="d.email" /></label>
        </div>
        <div v-else-if="step === 2" class="change-fields">
          <label class="biz-field">营业执照法人<ElInput v-model="d.licenseLegalPerson" /></label><label class="biz-field">注册资本<ElInput v-model="d.regCapital" /></label>
          <label class="biz-field full">经营地址<ElInput v-model="d.regAddress" /></label><label class="biz-field full">经营范围 <b class="required">*</b><ElInput v-model="d.businessScope" type="textarea" :rows="3" /><small v-if="field('businessScope')" class="error">{{ field('businessScope') }}</small></label>
          <label class="biz-field">法人姓名<ElInput v-model="d.legalPerson" /></label><label class="biz-field">身份证号码<ElInput v-model="d.idNo" /></label>
        </div>
        <div v-else-if="step === 3" class="change-fields">
          <label class="biz-field">员工规模<ElSelect v-model="d.employeeScale" clearable><ElOption v-for="value in ['1-10 人','11-50 人','51-200 人','201-500 人','500 人以上']" :key="value" :value="value" :label="value" /></ElSelect></label>
          <label class="biz-field">服务范围<ElInput :model-value="d.serviceCities.join('、')" placeholder="城市之间用顿号分隔" @update:model-value="d.serviceCities = String($event).split(/[、,，]/).map(x => x.trim()).filter(Boolean)" /></label>
          <label class="biz-field full">擅长业务领域或技能类型<ElInput :model-value="d.skills.join('、')" @update:model-value="d.skills = String($event).split(/[、,，]/).map(x => x.trim()).filter(Boolean)" /></label>
          <label class="biz-field full">商户介绍 <b class="required">*</b><ElInput v-model="d.merchantIntro" type="textarea" :rows="5" maxlength="5000" show-word-limit /><small v-if="field('merchantIntro')" class="error">{{ field('merchantIntro') }}</small></label>
          <label class="biz-field full">案例与荣誉<ElInput v-model="d.caseDesc" type="textarea" :rows="3" /></label>
        </div>
        <div v-else-if="step === 4" class="change-fields">
          <label class="biz-field">账户名称 <b class="required">*</b><ElInput v-model="d.accountName" /><small v-if="field('accountName')" class="error">{{ field('accountName') }}</small></label>
          <label class="biz-field">开户银行 <b class="required">*</b><ElInput v-model="d.bankName" /><small v-if="field('bankName')" class="error">{{ field('bankName') }}</small></label>
          <label class="biz-field">开户银行及支行<ElInput v-model="d.bankBranch" /></label>
          <label class="biz-field">银行账号 <b class="required">*</b><ElInput v-model="d.bankAccount" /><small v-if="field('bankAccount')" class="error">{{ field('bankAccount') }}</small></label>
          <div class="agreement-note full"><Check :size="16" /><div><strong>协议沿用已入驻主体资料</strong><p>合作协议：{{ d.coopFileName || (d.coopUploaded ? '已上传' : '暂无文件') }}　分账协议：{{ d.splitFileName || (d.splitUploaded ? '已上传' : '暂无文件') }}</p></div></div>
        </div>
        <div v-else class="review-grid"><div><span>经营主体</span><strong>{{ d.entityName }}</strong></div><div><span>入驻园区</span><strong>{{ d.park }}</strong></div><div><span>服务商名称</span><strong>{{ d.serviceName }}</strong></div><div><span>联系人</span><strong>{{ d.contactName }} · {{ d.contactMobile }}</strong></div><div><span>经营范围</span><strong>{{ d.businessScope }}</strong></div><div><span>商户介绍</span><strong>{{ d.merchantIntro }}</strong></div><div><span>收款账户</span><strong>{{ d.accountName }} · {{ d.bankName }}</strong></div></div>
      </section>
    </div>
    <footer class="change-footer"><ElButton @click="back"><ArrowLeft :size="15" /> {{ step === 1 ? '返回档案' : '上一步' }}</ElButton><div><ElButton @click="save"><Save :size="15" /> 保存草稿</ElButton><ElButton v-if="step < 5" type="primary" @click="next">下一步 <ArrowRight :size="15" /></ElButton><ElButton v-else type="primary" @click="submit">提交运营审核</ElButton></div></footer>
  </div>
</template>

<style scoped>
.change-page{max-width:1130px}.change-head{justify-content:flex-start;align-items:center}.change-head>div{flex:1}.head-icon{display:grid;place-items:center;width:46px;height:46px;border-radius:11px;background:#eaf0ff;color:#3659c2}.change-layout{display:grid;grid-template-columns:188px minmax(0,1fr);gap:25px;border-top:1px solid #e6ecf4;padding-top:22px}.change-steps{display:grid;align-content:start;gap:5px}.change-steps button{display:flex;align-items:center;gap:11px;width:100%;border:0;border-radius:8px;background:transparent;padding:12px;text-align:left;color:#718096;font-size:13px;cursor:pointer}.change-steps button span{font-size:11px;font-weight:700;color:#8a97a8}.change-steps button.active{background:#eaf0ff;color:#3053b9;font-weight:700}.change-steps button.active span,.change-steps button.done span{color:#3053b9}.change-panel{min-height:490px;padding:26px 29px;border:1px solid #e1e8f2;border-radius:12px;background:#fff}.panel-head{padding-bottom:19px;border-bottom:1px solid #edf0f5;margin-bottom:21px}.panel-head>span{color:#3b60bc;font-size:11px;font-weight:700}.panel-head h2{font-size:20px;margin:5px 0 3px}.panel-head p{font-size:12px;color:#7d8b9f;margin:0}.change-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 20px}.change-fields .full{grid-column:1/-1}.change-fields .error{color:#c9453c}.locked-fields{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:#dce6f2;border:1px solid #dce6f2;border-radius:8px;overflow:hidden;margin-bottom:3px}.locked-fields>div{display:grid;gap:4px;padding:11px 14px;background:#f7f9fd}.locked-fields small{color:#8090a5;font-size:11px}.locked-fields strong{font-size:12px;color:#32445f}.agreement-note{display:flex;align-items:flex-start;gap:9px;padding:14px;border-radius:8px;background:#f1f7f4;color:#14765b}.agreement-note strong{font-size:12px}.agreement-note p{color:#617a70;font-size:11px;margin:5px 0 0}.review-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 20px}.review-grid>div{display:grid;gap:7px;padding:14px 0;border-bottom:1px solid #edf0f5}.review-grid span{color:#8794a7;font-size:11px}.review-grid strong{font-size:13px;color:#263954;overflow-wrap:anywhere}.change-footer{position:sticky;bottom:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:20px;padding:14px 0;background:#fff;border-top:1px solid #e5ebf3}.change-footer>div{display:flex;gap:8px}.change-footer :deep(.el-button){margin:0}.change-footer :deep(.el-button span){display:inline-flex;align-items:center;gap:5px}
@media(max-width:850px){.change-layout{grid-template-columns:1fr}.change-steps{display:flex;overflow-x:auto}.change-steps button{width:auto;flex:none}.change-fields{grid-template-columns:1fr}.locked-fields{grid-template-columns:1fr}}
</style>
