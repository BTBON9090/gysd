<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Store, Building2, ShieldCheck, CircleAlert, ScanLine } from 'lucide-vue-next'
import { ElButton, ElDialog, ElInput, ElMessage, ElOption, ElSelect } from 'element-plus'
import {
  useOnboardingStore,
  type EntityType,
  type CertType,
} from '@/stores/onboarding'
import OnboardingShell from '@/components/onboarding/OnboardingShell.vue'

const router = useRouter()
const ob = useOnboardingStore()
const errors = ref<string[]>([])
const gateDialog = ref(false)
const gateMode = ref<'blocked' | 'verify'>('blocked')

onMounted(() => {
  if (ob.entityVerified && ob.draft.entityType !== 'personal') router.replace(`/onboarding/step/${Math.max(1, ob.maxStep)}`)
})

const options: {
  id: EntityType
  label: string
  desc: string
  icon: typeof User
  cert: CertType
}[] = [
  {
    id: 'personal',
    label: '个人',
    desc: '自然人经营者，适合小规模服务提供者',
    icon: User,
    cert: 'id_card',
  },
  {
    id: 'individual',
    label: '个体工商户',
    desc: '有字号的个体经营主体',
    icon: Store,
    cert: 'individual_license',
  },
  {
    id: 'enterprise',
    label: '企业',
    desc: '公司制法人主体（推荐）',
    icon: Building2,
    cert: 'business_license',
  },
]

const certOptions = computed(() => {
  const t = ob.draft.entityType
  if (t === 'enterprise') return [{ value: 'business_license' as CertType, label: '营业执照' }]
  if (t === 'individual')
    return [{ value: 'individual_license' as CertType, label: '个体工商户营业执照' }]
  return [{ value: 'id_card' as CertType, label: '身份证' }]
})

const isPersonal = computed(() => ob.draft.entityType === 'personal')
const nameLabel = computed(() => (isPersonal.value ? '姓名' : '企业名称'))
const nameLabelShort = computed(() => (isPersonal.value ? '姓名' : '名称'))
const codeLabel = computed(() => (isPersonal.value ? '身份证号' : '统一社会信用代码'))
const codePlaceholder = computed(() => isPersonal.value ? '18 位身份证号' : ob.draft.entityType === 'individual' ? '15 位或 18 位证件号码' : '18 位统一社会信用代码')

function pick(id: EntityType) {
  ob.setEntityType(id)
  errors.value = []
}

function fillDemo() {
  if (isPersonal.value) {
    ob.draft.entityName = '周启明'
    ob.draft.creditCode = '310115199001011234'
    ob.draft.certType = 'id_card'
  } else if (ob.draft.entityType === 'individual') {
    ob.draft.entityName = '临港企服咨询工作室'
    ob.draft.creditCode = '92310115MA8H2K9X4L'
    ob.draft.certType = 'individual_license'
  } else {
    ob.draft.entityName = '万联易达航空物流地面综合服务（郑州）有限公司'
    ob.draft.creditCode = '91310000MA1FL8X21B'
    ob.draft.certType = 'business_license'
  }
  ob.persist()
  errors.value = []
}

function finishGate() {
  gateDialog.value = false
  if (!ob.confirmEntityGate()) return
  router.push('/onboarding/step/1')
}
function onGatePrimary() {
  if (gateMode.value === 'verify') finishGate()
  else gateDialog.value = false
}

function next() {
  const errs = ob.validateEntityGate()
  errors.value = errs
  if (errs.length) {
    ElMessage.error(errs[0])
    return
  }
  // 固定样例仅用于演示“已入驻拦截”，不代表真实查询结果。
  const alreadyApproved = ob.applications.some((application) => application.id !== ob.activeId && application.status === 'approved' && application.draft.creditCode === ob.draft.creditCode.toUpperCase())
  if (alreadyApproved || ob.draft.creditCode.toUpperCase() === '91310000MA1FL8K21B') {
    gateMode.value = 'blocked'
    gateDialog.value = true
    return
  }
  if (ob.draft.entityType !== 'personal') {
    gateMode.value = 'verify'
    gateDialog.value = true
    return
  }
  finishGate()
}
</script>

<template>
  <OnboardingShell
    title="供应商入驻"
    subtitle="核验主体信息：证件类型、名称与识别码通过后，才能进入填写流程。"
    :show-steps="false"
    :show-footer="true"
    :step="0"
    @next="next"
  >
    <ElDialog v-model="gateDialog" class="ob-gate-dialog" width="min(480px, 92vw)" align-center :show-close="false" :close-on-click-modal="false" :append-to-body="true">
      <div class="gate-modal-icon" :class="gateMode"><CircleAlert v-if="gateMode === 'blocked'" :size="23" /><ShieldCheck v-else :size="23" /></div>
      <span class="gate-modal-eyebrow">主体状态查询 · 前端演示</span>
      <h2>{{ gateMode === 'blocked' ? '该主体已入驻' : '主体可继续申请' }}</h2>
      <p class="gate-modal-desc">{{ gateMode === 'blocked' ? '该主体已有入驻记录，请联系管理员开通账号。' : '演示环境将模拟企业二要素认证。通过后主体名称与证件号码将锁定。' }}</p>
      <div class="gate-modal-subject"><span>当前主体</span><strong>{{ ob.draft.entityName }}</strong><small>{{ ob.draft.creditCode }}</small></div>
      <template #footer>
        <div class="gate-modal-actions">
          <ElButton v-if="gateMode === 'verify'" @click="gateDialog = false">返回修改</ElButton>
          <ElButton type="primary" @click="onGatePrimary">{{ gateMode === 'verify' ? '模拟认证通过' : '知道了' }}</ElButton>
        </div>
      </template>
    </ElDialog>

    <div v-if="errors.length" class="err-banner">
      <CircleAlert :size="16" />
      <ul>
        <li v-for="e in errors" :key="e">{{ e }}</li>
      </ul>
    </div>

    <section class="entity-card">
      <div class="gate-head">
        <div class="card-head-text">
        <h2 class="field-label">主体类型 <em>*</em></h2>
          <p class="gate-hint">选择主体后核验证件与识别信息，校验通过才可进入填写。</p>
        </div>
        <button class="card-demo" type="button" @click="fillDemo">
          <ScanLine :size="13" />
          演示填入
        </button>
      </div>

      <div class="entity-grid">
        <button
          v-for="o in options"
          :key="o.id"
          class="entity-option"
          :class="{ active: ob.draft.entityType === o.id }"
          type="button"
          @click="pick(o.id)"
        >
          <span class="eo-icon">
            <component :is="o.icon" :size="20" stroke-width="1.7" />
          </span>
          <strong>{{ o.label }}</strong>
          <small>{{ o.desc }}</small>
          <span class="eo-cert">证件：{{ o.cert === 'business_license' ? '营业执照' : o.cert === 'individual_license' ? '个体工商户营业执照' : '身份证' }}</span>
        </button>
      </div>

      <div class="gate-divider" />

      <div class="gate-form">
        <h3 class="field-label">主体核验 <em>*</em></h3>
        <div class="form-grid">
          <div class="field">
            <label>证件类型 <em>*</em></label>
            <ElSelect
              :model-value="ob.draft.certType"
              placeholder="请选择证件类型"
              style="width: 100%"
              @update:model-value="(v: CertType) => { ob.draft.certType = v; ob.persist(); errors = [] }"
            >
              <ElOption v-for="c in certOptions" :key="c.value" :label="c.label" :value="c.value" />
            </ElSelect>
            <p class="field-help">
              <ShieldCheck :size="12" />
              随主体类型自动匹配，不可与主体不一致
            </p>
          </div>

          <div class="field">
            <label>{{ nameLabel }} <em>*</em></label>
            <ElInput
              v-model="ob.draft.entityName"
              :placeholder="isPersonal ? '请填写姓名' : '请填写营业执照上的企业名称'"
              clearable
              @input="errors = []"
              @change="ob.persist()"
            />
          </div>

          <div class="field span-2">
            <label>{{ codeLabel }}（识别码） <em>*</em></label>
            <ElInput
              v-model="ob.draft.creditCode"
              :placeholder="codePlaceholder"
              clearable
              :maxlength="ob.draft.entityType === 'individual' ? 18 : 18"
              @input="(v: string) => { ob.draft.creditCode = v.toUpperCase(); errors = [] }"
              @change="ob.persist()"
            />
            <p class="field-help">
              {{ isPersonal ? '18 位身份证号，末位可为 X' : ob.draft.entityType === 'individual' ? '15 位数字或 18 位统一社会信用代码，与证件一致' : '18 位数字与大写字母，与证件一致' }}
            </p>
          </div>
        </div>

        <p class="gate-note">
          核验通过后进入 5 步向导。企业和个体工商户的主体名称、证件号码将锁定；个人可返回本页修改。
        </p>
      </div>

      <div class="preview">
        <p class="field-label">下一步预览</p>
        <p class="preview-text">
          证件类型（{{ ob.certLabel }}）· {{ nameLabelShort }}（{{ ob.draft.entityName || '待填写' }}）
          · 识别码（{{ ob.draft.creditCode || '待填写' }}）
        </p>
      </div>
    </section>
  </OnboardingShell>
</template>

<style scoped>
.err-banner {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: var(--status-danger-soft);
  border: 1px solid rgba(217, 38, 34, 0.2);
  color: var(--status-danger);
  border-radius: var(--r-md);
  padding: 10px 12px;
  margin-bottom: 12px;
  font-size: 13px;
}
.err-banner ul {
  margin: 0;
  padding-left: 16px;
}

.entity-card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--r-xl);
  padding: 22px 22px 20px;
  box-shadow: var(--shadow-sm);
}
.gate-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.card-demo {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 14px;
  border: 1px solid rgba(59, 99, 211, 0.28);
  border-radius: var(--r-pill);
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--t-fast), border-color var(--t-fast), color var(--t-fast), transform var(--t-fast);
}
.card-demo:hover {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
  transform: translateY(-1px);
}
.field-label {
  margin: 0 0 10px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.field-label em {
  color: var(--status-danger);
  font-style: normal;
}
.gate-hint {
  margin: 0;
  font-size: 12.5px;
  color: var(--text-secondary);
}
.entity-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 6px;
}
.entity-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 16px 14px;
  border: 1px solid var(--border-light);
  border-radius: var(--r-lg);
  background: #fff;
  text-align: left;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition: border-color var(--t-fast), background var(--t-fast), box-shadow var(--t-fast), transform var(--t-fast);
}
.entity-option:hover {
  border-color: var(--brand);
  transform: translateY(-1px);
}
.entity-option.active {
  border-color: var(--brand);
  background: var(--brand-soft);
  box-shadow: 0 0 0 1px var(--brand);
}
.eo-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--r-md);
  display: grid;
  place-items: center;
  background: var(--bg-chip);
  color: var(--text-secondary);
}
.entity-option.active .eo-icon {
  background: var(--brand);
  color: #fff;
}
.entity-option strong {
  font-size: 15px;
  color: var(--text-primary);
}
.entity-option small {
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.5;
}
.eo-cert {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-placeholder);
}

.gate-divider {
  height: 1px;
  background: var(--border-light);
  margin: 16px 0;
}
.gate-form {
  margin-bottom: 14px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.field.span-2 {
  grid-column: span 2;
}
.field label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
.field label em {
  color: var(--status-danger);
  font-style: normal;
}
.field-help {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-placeholder);
}
.gate-note {
  margin: 14px 0 0;
  padding: 10px 12px;
  background: var(--brand-soft);
  border: 1px solid rgba(59, 99, 211, 0.14);
  border-radius: var(--r-md);
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.preview {
  background: var(--bg-muted);
  border: 1px solid var(--border-light);
  border-radius: var(--r-md);
  padding: 12px 14px;
}
.preview-text {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}

@media (max-width: 760px) {
  .entity-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .field.span-2 { grid-column: auto; }
}
</style>

<style>
.ob-gate-dialog { padding: 26px 28px 24px !important; border-radius: 14px !important; box-shadow: 0 22px 65px rgba(17, 35, 71, .18) !important; }
.ob-gate-dialog .el-dialog__header { display: none; }
.ob-gate-dialog .el-dialog__body { padding: 0; }
.ob-gate-dialog .el-dialog__footer { padding: 22px 0 0; }
.gate-modal-icon { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 12px; margin-bottom: 18px; }
.gate-modal-icon.blocked { background: #fff2eb; color: #c86034; }
.gate-modal-icon.verify { background: #e9f7f4; color: #0b9387; }
.gate-modal-eyebrow { display: block; color: #62718a; font-size: 11px; font-weight: 700; letter-spacing: .05em; }
.ob-gate-dialog h2 { margin: 5px 0 7px; font-size: 22px; letter-spacing: -.025em; color: #17243b; }
.gate-modal-desc { margin: 0; color: #4f5f77; font-size: 13px; line-height: 1.7; }
.gate-modal-subject { display: flex; flex-direction: column; gap: 3px; margin-top: 19px; padding: 13px 15px; background: #f5f7fb; border-radius: 8px; }
.gate-modal-subject span { color: #6f7c91; font-size: 11px; }
.gate-modal-subject strong { color: #26344d; font-size: 13px; overflow-wrap: anywhere; }
.gate-modal-subject small { color: #627087; font-size: 12px; letter-spacing: .01em; }
.gate-modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
.gate-modal-actions .el-button { min-width: 88px; border-radius: 8px; height: 37px; font-size: 12.5px; }
</style>
