<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Building,
  UserCheck,
  BadgeCheck,
  ScanLine,
  CircleAlert,
  Handshake,
  FileSignature,
  ClipboardList,
  Eye,
  Download,
} from 'lucide-vue-next'
import {
  ElButton,
  ElCheckbox,
  ElDatePicker,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus'
import { useOnboardingStore } from '@/stores/onboarding'
import { useAcceptanceStore } from '@/stores/acceptance'
import OnboardingShell from '@/components/onboarding/OnboardingShell.vue'
import UploadCard from '@/components/onboarding/UploadCard.vue'
import FilePreview from '@/components/onboarding/FilePreview.vue'

const route = useRoute()
const router = useRouter()
const ob = useOnboardingStore()
const acc = useAcceptanceStore()
const d = ob.draft

const step = computed(() => Math.min(5, Math.max(1, Number(route.params.n) || 1)))
const errors = ref<string[]>([])
const preview = ref({ open: false, title: '', fileName: '', kind: 'image' as 'image' | 'pdf' | 'text', src: '' })

function openPreview(title: string, fileName: string, kind: 'image' | 'pdf' | 'text' = 'image', src = '') {
  preview.value = { open: true, title, fileName, kind, src }
}

function demoFill(n: number) {
  ob.fillDemoStep(n)
  ElMessage.success(n === 5 ? '演示数据已填满，请核对后提交' : `第 ${n} 步演示数据已填入`)
  errors.value = []
}

watch(
  step,
  (n) => {
    errors.value = []
    ob.markStep(n)
  },
  { immediate: true },
)

const parks = [
  '上海临港新片区智能制造产业园',
  '上海临港新片区滴水湖金融湾',
  '郑州航空港经济综合实验区',
]

const industries = [
  '信息技术与软件服务',
  '人力资源与灵活用工',
  '财税与法务咨询',
  '物流与供应链',
  '检测认证与合规',
  '营销与设计服务',
]

const serviceCategories = [
  'IT 外包',
  '人力外包',
  '财税服务',
  '法务服务',
  '物流服务',
  '检测认证',
  '营销推广',
  '管理咨询',
]

const cities = ['上海', '北京', '深圳', '广州', '杭州', '郑州', '苏州', '成都']

const skillsPool = ['短视频剪辑', '企业注册', 'RPA 开发', '仓储配送', '薪税筹划', 'ISO 认证']

function toggleIn(arr: string[], v: string) {
  const i = arr.indexOf(v)
  if (i >= 0) arr.splice(i, 1)
  else arr.push(v)
  ob.persist()
}

function next() {
  const errs = ob.validateStep(step.value)
  errors.value = errs
  if (errs.length) {
    ElMessage.error(errs[0])
    return
  }
  ob.markStep(step.value + 1)
  if (step.value >= 5) {
    ob.persist()
    ElMessage.success('入驻申请已提交，等待园区审核')
    acc.setEntryStatus('approved')
    router.push('/workspace')
    return
  }
  router.push(`/onboarding/step/${step.value + 1}`)
}

function prev() {
  if (step.value > 1) router.push(`/onboarding/step/${step.value - 1}`)
  else router.push('/onboarding/entity')
}

const meta = computed(() => {
  const map: Record<number, { title: string; subtitle: string; icon: typeof Building }> = {
    1: {
      title: '入驻信息',
      subtitle: '主体已核验通过。完善服务商基础信息与联系人，便于园区审核与后续联络。',
      icon: Building,
    },
    2: {
      title: '资质与证件',
      subtitle: '按证件分三段上传，识别结果可手动修改。',
      icon: BadgeCheck,
    },
    3: {
      title: '产品服务',
      subtitle: '定义可提供的服务类目与范围，审核通过后用于店铺上架。',
      icon: Handshake,
    },
    4: {
      title: '入驻协议',
      subtitle: '阅读并勾选协议，完成电子签章后方可提交。',
      icon: FileSignature,
    },
    5: {
      title: '确认填报信息',
      subtitle: '请核对全部内容，提交后进入园区审核。',
      icon: ClipboardList,
    },
  }
  return map[step.value]
})
</script>

<template>
  <OnboardingShell
    :step="step"
    :title="meta.title"
    :subtitle="meta.subtitle"
    :show-steps="true"
    :show-footer="true"
    @next="next"
    @prev="prev"
  >
    <div v-if="errors.length" class="err-banner" role="alert">
      <CircleAlert :size="16" />
      <ul>
        <li v-for="e in errors" :key="e">{{ e }}</li>
      </ul>
    </div>

    <FilePreview
      v-model="preview.open"
      :title="preview.title"
      :file-name="preview.fileName"
      :kind="preview.kind"
      :src="preview.src"
    />

    <!-- ===== Step 1 入驻信息 ===== -->
    <div v-if="step === 1" class="step-layout">
      <section class="main-col">
        <div class="card">
          <div class="card-head">
            <span class="card-ic tone-blue"><Building :size="16" /></span>
            <div class="card-head-text">
              <h2>基础信息</h2>
              <p>完善服务商信息与联系人，便于园区审核与后续联络。</p>
            </div>
            <button class="card-demo" type="button" @click="demoFill(1)">
              <ScanLine :size="13" />
              演示填入
            </button>
          </div>

          <div class="form-grid">
            <div class="field span-2">
              <label>申请入驻园区 <em>*</em></label>
              <ElSelect v-model="d.park" placeholder="请选择园区" style="width: 100%" @change="ob.persist">
                <ElOption v-for="p in parks" :key="p" :label="p" :value="p" />
              </ElSelect>
            </div>

            <div class="field span-2">
              <label>经营主体 <em>*</em> · 主体核验</label>
              <div class="entity-read">
                <div>
                  <strong>{{ d.entityName || '未填写名称' }}</strong>
                  <ElTag size="small" effect="plain" round>{{ ob.entityLabel }}</ElTag>
                  <ElTag size="small" type="info" effect="plain" round>{{ ob.certLabel }}</ElTag>
                  <p>识别码：{{ d.creditCode || '—' }}</p>
                </div>
                <ElButton size="small" text type="primary" @click="router.push('/onboarding/entity')">
                  修改主体
                </ElButton>
              </div>
            </div>

            <div class="field span-2">
              <label>入驻身份</label>
              <div class="identity-chip">
                <Handshake :size="16" />
                {{ ob.supplierLabel }}
              </div>
            </div>

            <div class="field span-2 section-label">
              <h3>服务商信息</h3>
            </div>

            <div class="field">
              <label>服务商名称 <em>*</em></label>
              <ElInput v-model="d.serviceName" placeholder="请填写对外展示名称" @change="ob.persist" />
            </div>
            <div class="field">
              <label>所属行业 <em>*</em></label>
              <ElSelect v-model="d.industry" placeholder="请选择行业" style="width: 100%" @change="ob.persist">
                <ElOption v-for="i in industries" :key="i" :label="i" :value="i" />
              </ElSelect>
            </div>
            <div class="field">
              <label>注册手机号 <em>*</em></label>
              <ElInput v-model="d.mobile" maxlength="11" placeholder="11 位手机号" @change="ob.persist" />
            </div>
            <div class="field">
              <label>联系人姓名 <em>*</em></label>
              <ElInput v-model="d.contactName" placeholder="请填写" @change="ob.persist" />
            </div>
            <div class="field">
              <label>联系人职位</label>
              <ElInput v-model="d.contactTitle" placeholder="选填，如 市场负责人" @change="ob.persist" />
            </div>
            <div class="field">
              <label>邮箱 <em>*</em></label>
              <ElInput v-model="d.email" placeholder="接收入驻结果通知" @change="ob.persist" />
            </div>
          </div>
        </div>
      </section>

      <aside class="side-col">
        <div class="tip-card">
          <strong><CircleAlert :size="14" /> 本步说明</strong>
          <h4>本步怎么填？</h4>
          <p>请选择申请入驻园区，并填写服务商名称、所属行业、联系人信息与邮箱。</p>
        </div>
      </aside>
    </div>

    <!-- ===== Step 2 资质与账户 ===== -->
    <div v-else-if="step === 2" class="step-layout">
      <section class="main-col">
        <div class="card">
          <div class="card-head">
            <span class="card-ic tone-amber"><BadgeCheck :size="16" /></span>
            <div class="card-head-text">
              <h2>资质与证件</h2>
              <p>按证件分三段上传，识别结果可手动修改。</p>
            </div>
            <button class="card-demo" type="button" @click="demoFill(2)">
              <ScanLine :size="13" />
              演示填入
            </button>
          </div>

          <!-- 1 营业执照 -->
          <section class="doc-block">
            <header class="doc-head">
              <div class="doc-title">
                <strong>营业执照</strong>
                <p>上传原件或扫描件，支持一键读取</p>
              </div>
              <ElTag :type="d.licenseUploaded ? 'success' : 'info'" size="small" round effect="plain">
                {{ d.licenseUploaded ? '已上传' : '待上传' }}
              </ElTag>
            </header>
            <UploadCard
              v-model="d.licenseUploaded"
              title="点击或拖拽上传营业执照"
              hint="JPG / PNG / PDF"
              file-name="license-front.png"
              ocr-label="读取证件信息"
              @ocr="ob.fillDemoLicense()"
              @upload="ob.fillDemoLicense()"
              @preview="(u?: string, n?: string) => openPreview('营业执照', n || 'license-front.png', 'image', u || '')"
            />
            <div class="fill-box">
              <div class="fill-box-head">
                <strong>识别信息</strong>
                <span>可手动修改</span>
              </div>
              <div class="form-grid">
                  <div class="field">
                    <label>企业名称 <em>*</em></label>
                    <ElInput v-model="d.entityName" disabled />
                  </div>
                  <div class="field">
                    <label>统一社会信用代码 <em>*</em></label>
                    <ElInput v-model="d.creditCode" disabled />
                  </div>
                  <div class="field">
                    <label>法定代表人 <em>*</em></label>
                    <ElInput v-model="d.legalPerson" placeholder="请填写" @change="ob.persist" />
                  </div>
                  <div class="field">
                    <label>注册资本</label>
                    <ElInput v-model="d.regCapital" placeholder="请填写" @change="ob.persist" />
                  </div>
                  <div class="field">
                    <label>企业类型</label>
                    <ElInput v-model="d.enterpriseType" placeholder="请填写" @change="ob.persist" />
                  </div>
                  <div class="field">
                    <label>成立日期</label>
                    <ElInput v-model="d.foundDate" placeholder="YYYY/MM/DD" @change="ob.persist" />
                  </div>
                  <div class="field">
                    <label>发照日期</label>
                    <ElInput v-model="d.issueDate" placeholder="YYYY/MM/DD" @change="ob.persist" />
                  </div>
                  <div class="field">
                    <label>营业期限 <em>*</em></label>
                    <div class="range-row">
                      <ElInput v-model="d.validFrom" placeholder="起" @change="ob.persist" />
                      <span>至</span>
                      <ElInput v-model="d.validTo" placeholder="止" :disabled="d.validForever" @change="ob.persist" />
                      <ElCheckbox v-model="d.validForever" @change="ob.persist">长期有效</ElCheckbox>
                    </div>
                  </div>
                  <div class="field span-2">
                    <label>注册地址</label>
                    <ElInput v-model="d.regAddress" placeholder="请填写" @change="ob.persist" />
                  </div>
                  <div class="field span-2">
                    <label>经营范围</label>
                    <ElInput v-model="d.businessScope" type="textarea" :rows="3" placeholder="选填" @change="ob.persist" />
                  </div>
                </div>
              </div>
          </section>

          <!-- 2 法人身份证 -->
          <section class="doc-block">
            <header class="doc-head">
              <div class="doc-title">
                <strong>法人身份证</strong>
                <p>分人像面 / 国徽面上传，防止交叉</p>
              </div>
              <ElTag :type="d.idFront && d.idBack ? 'success' : 'info'" size="small" round effect="plain">
                {{ d.idFront && d.idBack ? '已上传' : '待上传' }}
              </ElTag>
            </header>
            <div class="id-pair">
              <UploadCard
                v-model="d.idFront"
                title="人像面"
                hint="带照片一面"
                file-name="id-portrait.png"
                face="portrait"
                compact
                ocr-label="读取证件信息"
                @ocr="ob.fillDemoId()"
                @upload="ob.fillDemoId()"
                @preview="(u?: string, n?: string) => openPreview('身份证 · 人像面', n || 'id-portrait.png', 'image', u || '')"
              />
              <UploadCard
                v-model="d.idBack"
                title="国徽面"
                hint="带国徽一面"
                file-name="id-emblem.png"
                face="emblem"
                compact
                ocr-label="读取证件信息"
                @ocr="ob.fillDemoId()"
                @upload="ob.fillDemoId()"
                @preview="(u?: string, n?: string) => openPreview('身份证 · 国徽面', n || 'id-emblem.png', 'image', u || '')"
              />
            </div>
            <div class="fill-box">
              <div class="fill-box-head">
                <strong>识别信息</strong>
                <span>可手动修改</span>
              </div>
              <div class="form-grid">
                <div class="field">
                  <label>法定代表人 <em>*</em></label>
                  <ElInput v-model="d.legalPerson" placeholder="与证件一致" @change="ob.persist" />
                </div>
                <div class="field">
                  <label>证件号码 <em>*</em></label>
                  <ElInput v-model="d.idNo" maxlength="18" placeholder="18 位身份证号" @change="ob.persist" />
                </div>
                <div class="field">
                  <label>性别</label>
                  <ElInput v-model="d.idGender" placeholder="选填" @change="ob.persist" />
                </div>
                <div class="field">
                  <label>民族</label>
                  <ElInput v-model="d.idEthnic" placeholder="选填" @change="ob.persist" />
                </div>
                <div class="field">
                  <label>出生日期</label>
                  <ElInput v-model="d.idBirth" placeholder="YYYY/MM/DD" @change="ob.persist" />
                </div>
                <div class="field">
                  <label>签发机关</label>
                  <ElInput v-model="d.idAuthority" placeholder="选填" @change="ob.persist" />
                </div>
                <div class="field span-2">
                  <label>有效期</label>
                  <div class="range-row">
                    <ElInput v-model="d.idValidFrom" placeholder="起" @change="ob.persist" />
                    <span>至</span>
                    <ElInput v-model="d.idValidTo" placeholder="止" @change="ob.persist" />
                  </div>
                </div>
                <div class="field span-2">
                  <label>住址</label>
                  <ElInput v-model="d.idAddress" placeholder="选填" @change="ob.persist" />
                </div>
              </div>
            </div>
          </section>

          <!-- 3 账户信息 -->
          <section class="doc-block">
            <header class="doc-head">
              <div class="doc-title">
                <strong>账户信息</strong>
                <p>开户许可证或基本存款账户信息，任选其一</p>
              </div>
              <ElTag :type="d.bankUploaded ? 'success' : 'info'" size="small" round effect="plain">
                {{ d.bankUploaded ? '已上传' : '待上传' }}
              </ElTag>
            </header>
            <UploadCard
              v-model="d.bankUploaded"
              title="点击或拖拽上传开户许可证 / 基本户"
              hint="JPG / PNG / PDF"
              file-name="bank-license.png"
              ocr-label="读取证件信息"
              @ocr="ob.fillDemoBank()"
              @upload="ob.fillDemoBank()"
              @preview="(u?: string, n?: string) => openPreview('开户许可 / 基本户', n || 'bank-license.png', 'image', u || '')"
            />
            <div class="fill-box">
              <div class="fill-box-head">
                <strong>识别信息</strong>
                <span>可手动修改</span>
              </div>
              <div class="form-grid">
                  <div class="field">
                    <label>账户名称 <em>*</em></label>
                    <ElInput v-model="d.accountName" placeholder="与企业名称一致的户名" @change="ob.persist" />
                  </div>
                  <div class="field">
                    <label>开户银行 <em>*</em></label>
                    <ElInput v-model="d.bankName" placeholder="请填写开户银行" @change="ob.persist" />
                  </div>
                  <div class="field">
                    <label>开户支行 <em>*</em></label>
                    <ElInput v-model="d.bankBranch" placeholder="请填写开户支行" @change="ob.persist" />
                  </div>
                  <div class="field">
                    <label>账号 <em>*</em></label>
                    <ElInput v-model="d.bankAccount" placeholder="请填写" @change="ob.persist" />
                  </div>
                  <div class="field">
                    <label>经办人姓名 <em>*</em></label>
                    <ElInput v-model="d.agentName" placeholder="请填写" @change="ob.persist" />
                  </div>
                  <div class="field">
                    <label>经办人手机 <em>*</em></label>
                    <ElInput v-model="d.agentMobile" maxlength="11" placeholder="11 位手机号" @change="ob.persist" />
                  </div>
                  <div class="field span-2">
                    <label>经办人与法人关系</label>
                    <ElSelect v-model="d.agentRelation" clearable placeholder="请选择（选填）" style="width: 100%" @change="ob.persist">
                      <ElOption label="法人本人" value="法人本人" />
                      <ElOption label="股东" value="股东" />
                      <ElOption label="员工" value="员工" />
                      <ElOption label="委托代理人" value="委托代理人" />
                    </ElSelect>
                  </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <aside class="side-col">
        <div class="tip-card">
          <strong><CircleAlert :size="14" /> 本步说明</strong>
          <h4>需要哪些材料？</h4>
          <p>上传营业执照、法人身份证与开户证明；可点「读取」一键演示回填，再手工核对。</p>
        </div>
        <div class="tip-card muted">
          <strong><UserCheck :size="14" /> 经办人</strong>
          <p>经办人须为本企业在职人员，审核可能电话核实。</p>
        </div>
      </aside>
    </div>

    <!-- ===== Step 3 产品服务 ===== -->
    <div v-else-if="step === 3" class="step-layout">
      <section class="main-col">
        <div class="card">
          <div class="card-head">
            <span class="card-ic tone-blue"><Handshake :size="16" /></span>
            <div class="card-head-text">
              <h2>产品服务</h2>
              <p>定义服务范围与能力标签，支撑后续服务上架。</p>
            </div>
            <button class="card-demo" type="button" @click="demoFill(3)">
              <ScanLine :size="13" />
              演示填入
            </button>
          </div>

          <div class="form-grid">
            <div class="field span-2">
              <label>申请入驻园区 <em>*</em></label>
              <ElInput :model-value="d.park" disabled />
            </div>
            <div class="field span-2">
              <label>服务商简介</label>
              <ElInput v-model="d.serviceName" placeholder="一句话介绍对外品牌名" @change="ob.persist" />
            </div>

            <div class="field span-2 section-label">
              <h3>服务商信息</h3>
            </div>

            <div class="field span-2">
              <label>服务类目 <em>*</em></label>
              <div class="tag-picker">
                <button
                  v-for="c in serviceCategories"
                  :key="c"
                  class="tag-btn"
                  :class="{ on: d.serviceCategories.includes(c) }"
                  type="button"
                  @click="toggleIn(d.serviceCategories, c)"
                >
                  {{ c }}
                </button>
              </div>
            </div>

            <div class="field span-2">
              <label>服务范围 <em>*</em></label>
              <div class="tag-picker">
                <button
                  v-for="c in cities"
                  :key="c"
                  class="tag-btn"
                  :class="{ on: d.serviceCities.includes(c) }"
                  type="button"
                  @click="toggleIn(d.serviceCities, c)"
                >
                  {{ c }} ×
                </button>
              </div>
            </div>

            <div class="field span-2">
              <label>擅长业务领域或技能类型（最多可选 3 个）<em>*</em></label>
              <div class="tag-picker">
                <button
                  v-for="s in skillsPool"
                  :key="s"
                  class="tag-btn"
                  :class="{ on: d.skills.includes(s) }"
                  type="button"
                  @click="
                    d.skills.includes(s)
                      ? toggleIn(d.skills, s)
                      : d.skills.length < 3
                        ? toggleIn(d.skills, s)
                        : ElMessage.warning('最多选择 3 个')
                  "
                >
                  {{ s }}
                </button>
              </div>
            </div>

            <div class="field span-2">
              <label>案例描述 <em>*</em></label>
              <ElInput
                v-model="d.caseDesc"
                type="textarea"
                :rows="4"
                maxlength="5000"
                show-word-limit
                placeholder="请描述 1–2 个成功服务案例：客户类型、服务内容、交付结果"
                @change="ob.persist"
              />
            </div>

            <div class="field">
              <label>成功案例数</label>
              <ElInput v-model.number="d.caseCount" type="number" min="0" placeholder="0" @change="ob.persist" />
            </div>
            <div class="field">
              <label>是否可开专票</label>
              <div class="switch-line">
                <ElSwitch v-model="d.canInvoice" @change="ob.persist()" />
                <span class="switch-text">{{ d.canInvoice ? '可开专票' : '仅普票' }}</span>
              </div>
            </div>

            <div class="field span-2">
              <label>补充资质附件</label>
              <UploadCard
                :model-value="!!d.extraCerts"
                title="点击上传行业资质 / 荣誉证书"
                hint="选填，有助于加快审核"
                :file-name="d.extraCerts || 'certs.zip'"
                :show-ocr="false"
                ocr-label="演示填入"
                @update:model-value="(v: boolean) => { d.extraCerts = v ? 'certs.zip' : ''; ob.persist() }"
                @ocr="demoFill(3)"
                @preview="openPreview('补充资质', d.extraCerts || 'certs.zip', 'image')"
              />
            </div>
          </div>
        </div>
      </section>

      <aside class="side-col">
        <div class="tip-card">
          <strong><CircleAlert :size="14" /> 本步说明</strong>
          <h4>如何写好案例？</h4>
          <p>写清「客户是谁、做了什么、结果如何」，避免空话。擅长领域最多 3 个，聚焦优势。</p>
        </div>
      </aside>
    </div>

    <!-- ===== Step 4 入驻协议 ===== -->
    <div v-else-if="step === 4" class="step-layout">
      <section class="main-col">
        <div class="card">
          <div class="card-head">
            <span class="card-ic tone-indigo"><FileSignature :size="16" /></span>
            <div class="card-head-text">
              <h2>《服务商入驻合作协议》</h2>
              <p>请完整阅读以下协议，勾选同意并完成电子签章。</p>
            </div>
            <button class="card-demo" type="button" @click="demoFill(4)">
              <ScanLine :size="13" />
              演示填入
            </button>
          </div>

          <div class="agree-list">
            <label class="agree-item">
              <ElCheckbox v-model="d.agreePlatform" @change="ob.persist()" />
              <span>
                <strong>平台服务协议</strong>
                <small>约定平台服务范围、费用结算与争议处理</small>
              </span>
            </label>
            <label class="agree-item">
              <ElCheckbox v-model="d.agreeProvider" @change="ob.persist()" />
              <span>
                <strong>服务商入驻协议</strong>
                <small>约定入驻资质、服务标准与违约责任</small>
              </span>
            </label>
            <label class="agree-item">
              <ElCheckbox v-model="d.agreePrivacy" @change="ob.persist()" />
              <span>
                <strong>数据保密承诺</strong>
                <small>承诺不泄露交易与企业经营数据</small>
              </span>
            </label>
          </div>

          <div class="agreement-block">
            <h3 class="sec-title">《服务商入驻合作协议》</h3>
            <div class="agr-actions">
              <ElButton size="small" round @click="openPreview('服务商入驻合作协议 · 模板', '服务商入驻合作协议-模板.pdf', 'text')">
                <Eye :size="13" style="margin-right: 4px" />
                预览模板
              </ElButton>
              <ElButton size="small" round>
                <Download :size="13" style="margin-right: 4px" />
                下载模板
              </ElButton>
            </div>
            <UploadCard
              v-model="d.coopUploaded"
              :file-name="d.coopFileName || '服务商入驻合作协议-已签.pdf'"
              title="点击上传已签署协议"
              hint="下载模板 → 盖章签字 → 上传扫描件或 PDF"
              :show-ocr="false"
              ocr-label="演示填入"
              @ocr="demoFill(4)"
              @upload="() => { d.coopFileName = '服务商入驻合作协议-已签.pdf'; ob.persist() }"
              @preview="openPreview('服务商入驻合作协议', d.coopFileName || '服务商入驻合作协议-已签.pdf', 'pdf')"
            />
          </div>

          <div class="agreement-block">
            <h3 class="sec-title">《支付分账协议》</h3>
            <div class="agr-actions">
              <ElButton size="small" round @click="openPreview('支付分账协议 · 模板', '支付分账协议-模板.pdf', 'text')">
                <Eye :size="13" style="margin-right: 4px" />
                预览模板
              </ElButton>
              <ElButton size="small" round>
                <Download :size="13" style="margin-right: 4px" />
                下载模板
              </ElButton>
            </div>
            <UploadCard
              v-model="d.splitUploaded"
              :file-name="d.splitFileName || '支付分账协议-已签.pdf'"
              title="点击上传已签署协议"
              hint="下载模板 → 盖章签字 → 上传扫描件或 PDF"
              :show-ocr="false"
              ocr-label="演示填入"
              @ocr="demoFill(4)"
              @upload="() => { d.splitFileName = '支付分账协议-已签.pdf'; ob.persist() }"
              @preview="openPreview('支付分账协议', d.splitFileName || '支付分账协议-已签.pdf', 'pdf')"
            />
          </div>

          <div class="fill-box">
            <div class="fill-box-head">
              <strong>电子签章</strong>
              <span>姓名须与法定代表人或授权经办人一致。</span>
            </div>
            <div class="form-grid">
              <div class="field">
                <label>签章姓名 <em>*</em></label>
                <ElInput v-model="d.signName" placeholder="请填写" @change="ob.persist" />
              </div>
              <div class="field">
                <label>签署日期 <em>*</em></label>
                <ElDatePicker
                  v-model="d.signDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="选择日期"
                  style="width: 100%"
                  @change="ob.persist()"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside class="side-col">
        <div class="tip-card">
          <strong><CircleAlert :size="14" /> 本步说明</strong>
          <h4>协议要点</h4>
          <p>三项均须勾选。演示环境不会真实调用电子签，提交即视为签署完成。</p>
        </div>
      </aside>
    </div>

    <!-- ===== Step 5 确认提交 ===== -->
    <div v-else class="step-layout">
      <section class="main-col">
        <div class="card">
          <div class="card-head">
            <span class="card-ic tone-blue"><ClipboardList :size="16" /></span>
            <div class="card-head-text">
              <h2>确认填报信息</h2>
              <p>请核对全部内容，提交后进入园区审核。</p>
            </div>
            <button class="card-demo" type="button" @click="demoFill(5)">
              <ScanLine :size="13" />
              一键填满
            </button>
          </div>

          <div class="entity-read summary-entity">
            <div>
              <strong>{{ d.entityName || '—' }}</strong>
              <ElTag size="small" effect="plain" round>{{ ob.entityLabel }}</ElTag>
              <p>企业识别码：{{ d.creditCode || '—' }}</p>
            </div>
          </div>

          <div class="summary-pair">
            <div>
              <span class="k">入驻身份</span>
              <ElTag type="primary" effect="light" round>{{ ob.supplierLabel }}</ElTag>
            </div>
            <div>
              <span class="k">已入驻园区</span>
              <ElTag type="primary" effect="light" round>
                <el-icon style="margin-right: 4px"><Building /></el-icon>
                {{ d.park || '—' }}
              </ElTag>
            </div>
          </div>

          <h3 class="sec-title">账号与身份</h3>
          <div class="summary-grid">
            <div><span class="k">服务商名称</span><span class="v">{{ d.serviceName || '—' }}</span></div>
            <div><span class="k">所属行业</span><span class="v">{{ d.industry || '—' }}</span></div>
            <div><span class="k">注册手机号</span><span class="v">{{ d.mobile || '—' }}</span></div>
            <div><span class="k">联系人</span><span class="v">{{ d.contactName || '—' }} {{ d.contactTitle }}</span></div>
            <div><span class="k">邮箱</span><span class="v">{{ d.email || '—' }}</span></div>
            <div><span class="k">服务类目</span><span class="v">{{ d.serviceCategories.join('、') || '—' }}</span></div>
            <div><span class="k">服务范围</span><span class="v">{{ d.serviceCities.join('、') || '—' }}</span></div>
            <div><span class="k">擅长领域</span><span class="v">{{ d.skills.join('、') || '—' }}</span></div>
          </div>

          <h3 class="sec-title">资质文件</h3>
          <ul class="file-list">
            <li class="file-row" role="button" tabindex="0" @click="openPreview('营业执照', 'license-front.png', 'image')">
              <span class="file-ic">营</span>
              <div class="file-meta">
                <strong>营业执照</strong>
                <small>license-front.png · 534KB</small>
              </div>
              <span class="file-valid">有效期至 {{ d.validTo || '长期' }}</span>
              <ElTag :type="d.licenseUploaded ? 'success' : 'warning'" size="small" round>
                {{ d.licenseUploaded ? '已上传' : '待上传' }}
              </ElTag>
              <span class="file-peek"><Eye :size="14" /> 预览</span>
            </li>
            <li class="file-row" role="button" tabindex="0" @click="openPreview('身份证 · 人像面', 'id-portrait.png', 'image')">
              <span class="file-ic">证</span>
              <div class="file-meta">
                <strong>法人身份证人像面</strong>
                <small>id-portrait.png · 534KB</small>
              </div>
              <span class="file-valid">有效期至 {{ d.idValidTo || '—' }}</span>
              <ElTag :type="d.idFront ? 'success' : 'warning'" size="small" round>
                {{ d.idFront ? '已上传' : '待上传' }}
              </ElTag>
              <span class="file-peek"><Eye :size="14" /> 预览</span>
            </li>
            <li class="file-row" role="button" tabindex="0" @click="openPreview('身份证 · 国徽面', 'id-emblem.png', 'image')">
              <span class="file-ic">证</span>
              <div class="file-meta">
                <strong>法人身份证国徽面</strong>
                <small>id-emblem.png · 534KB</small>
              </div>
              <span class="file-valid">有效期至 {{ d.idValidTo || '—' }}</span>
              <ElTag :type="d.idBack ? 'success' : 'warning'" size="small" round>
                {{ d.idBack ? '已上传' : '待上传' }}
              </ElTag>
              <span class="file-peek"><Eye :size="14" /> 预览</span>
            </li>
            <li class="file-row" role="button" tabindex="0" @click="openPreview('开户许可 / 基本户', 'bank-license.png', 'image')">
              <span class="file-ic">银</span>
              <div class="file-meta">
                <strong>开户许可证 / 基本户</strong>
                <small>bank-license.png · 210KB</small>
              </div>
              <span class="file-valid">账户 {{ maskAccount(d.bankAccount) }}</span>
              <ElTag :type="d.bankUploaded ? 'success' : 'warning'" size="small" round>
                {{ d.bankUploaded ? '已上传' : '待上传' }}
              </ElTag>
              <span class="file-peek"><Eye :size="14" /> 预览</span>
            </li>
            <li class="file-row" role="button" tabindex="0" @click="openPreview('服务商入驻合作协议', d.coopFileName || '服务商入驻合作协议-已签.pdf', 'pdf')">
              <span class="file-ic">协</span>
              <div class="file-meta">
                <strong>服务商入驻合作协议</strong>
                <small>{{ d.coopFileName || '服务商入驻合作协议-已签.pdf' }}</small>
              </div>
              <span class="file-valid">—</span>
              <ElTag :type="d.coopUploaded ? 'success' : 'warning'" size="small" round>
                {{ d.coopUploaded ? '已上传' : '待上传' }}
              </ElTag>
              <span class="file-peek"><Eye :size="14" /> 预览</span>
            </li>
            <li class="file-row" role="button" tabindex="0" @click="openPreview('支付分账协议', d.splitFileName || '支付分账协议-已签.pdf', 'pdf')">
              <span class="file-ic">协</span>
              <div class="file-meta">
                <strong>支付分账协议</strong>
                <small>{{ d.splitFileName || '支付分账协议-已签.pdf' }}</small>
              </div>
              <span class="file-valid">—</span>
              <ElTag :type="d.splitUploaded ? 'success' : 'warning'" size="small" round>
                {{ d.splitUploaded ? '已上传' : '待上传' }}
              </ElTag>
              <span class="file-peek"><Eye :size="14" /> 预览</span>
            </li>
          </ul>

          <div v-if="errors.length" class="err-inline">
            仍有未完成项，请返回补全后再提交。
          </div>
        </div>
      </section>

      <aside class="side-col">
        <div class="tip-card">
          <strong><CircleAlert :size="14" /> 提交前检查</strong>
          <p>1–4 步全部通过校验才能提交。缺项时点「下一步」会列出原因并回跳。</p>
        </div>
      </aside>
    </div>
  </OnboardingShell>
</template>

<script lang="ts">
function maskAccount(v: string) {
  if (!v) return '—'
  const s = v.replace(/\s/g, '')
  if (s.length <= 8) return s
  return `${s.slice(0, 4)} **** **** ${s.slice(-4)}`
}
export default {}
</script>

<style scoped>
.step-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 16px;
  align-items: start;
}
.main-col {
  min-width: 0;
}
.side-col {
  position: sticky;
  top: calc(56px + 56px + 16px); /* 顶栏 + 步骤条 + 间距，避免被步骤条遮住 */
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--r-xl);
  padding: 22px 22px 20px;
  box-shadow: none;
}
.card-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}
.card-head-text {
  flex: 1;
  min-width: 0;
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
.card-ic {
  width: 40px;
  height: 40px;
  border-radius: var(--r-md);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}
.card-ic.tone-blue { background: var(--c-blue-bg); color: var(--c-blue); }
.card-ic.tone-amber { background: var(--c-amber-bg); color: var(--c-amber); }
.card-ic.tone-green { background: var(--c-blue-bg); color: var(--c-blue); }
.card-ic.tone-indigo { background: var(--c-indigo-bg); color: var(--c-indigo); }
.card-head h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}
.card-head p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.field label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.01em;
}
.field label em {
  color: var(--status-danger);
  font-style: normal;
  margin-left: 2px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 18px;
}
.form-grid + .section-label,
.field + .section-label {
  grid-column: 1 / -1;
}
.acc-body .fill-box {
  margin-top: 4px;
}
.card .acc {
  margin-bottom: 14px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
  padding: 2px 0 4px;
  border-radius: var(--r-sm);
  transition: background var(--t-fast);
}
.field.span-2 {
  grid-column: span 2;
}
.section-label {
  margin-top: 8px;
  padding-top: 14px;
  border-top: 1px dashed var(--border-light);
}
.section-label h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-label h3::before {
  content: '';
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: var(--brand);
}

.entity-read {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: var(--bg-muted);
  border: 1px solid var(--border-light);
  border-radius: var(--r-md);
}
.entity-read strong {
  font-size: 14px;
  color: var(--text-primary);
  margin-right: 8px;
}
.entity-read p {
  margin: 4px 0 0;
  font-size: 12.5px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
.identity-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 16px;
  border-radius: var(--r-md);
  background: var(--brand-soft);
  border: 1px solid rgba(59, 99, 211, 0.2);
  color: var(--brand);
  font-weight: 700;
  font-size: 14px;
  width: fit-content;
}

.tip-card {
  background: var(--status-warning-soft);
  border: 1px solid rgba(217, 119, 6, 0.18);
  border-radius: var(--r-xl);
  padding: 16px;
  box-shadow: none;
}
.tip-card.muted {
  background: var(--bg-card);
  border-color: var(--border-light);
}
.tip-card strong {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-primary);
}
.tip-card h4 {
  margin: 8px 0 4px;
  font-size: 13.5px;
  color: var(--text-primary);
}
.tip-card p {
  margin: 0;
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.acc {
  border: 1px solid var(--border-light);
  border-radius: var(--r-md);
  margin-bottom: 10px;
  overflow: hidden;
  background: #fff;
}
.acc:hover {
  border-color: var(--border-strong);
}
.acc[open] {
  border-color: var(--border-strong);
}
.acc summary {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-muted);
}
.acc summary::-webkit-details-marker {
  display: none;
}
.acc summary::before {
  content: '▾';
  color: var(--text-placeholder);
  font-size: 12px;
}
.acc[open] summary::before {
  content: '▴';
}
.acc-body {
  padding: 14px;
}
.acc-body .fill-box {
  background: transparent;
  border: none;
  border-top: 1px solid var(--border-lighter);
  border-radius: 0;
  padding: 14px 0 0;
  margin-top: 4px;
}
.fill-box-head {
  margin-bottom: 12px;
}
.fill-box-head strong {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}
.fill-box-head span {
  font-size: 12px;
  color: var(--text-placeholder);
}
.upload-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
.upload-zone {
  border: 1px dashed var(--border-strong);
  border-radius: var(--r-md);
  background: var(--bg-card);
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: border-color var(--t-fast), background var(--t-fast);
  margin-bottom: 12px;
}
.upload-zone:hover {
  border-color: var(--brand);
  background: var(--brand-soft);
}
.upload-zone.done {
  border-style: solid;
  border-color: var(--border-light);
  background: var(--bg-muted);
}
.upload-zone strong {
  font-size: 13.5px;
  color: var(--text-primary);
}
.upload-zone small {
  font-size: 12px;
  color: var(--text-placeholder);
  max-width: 420px;
  line-height: 1.5;
}
.upload-zone.sm {
  padding: 16px 12px;
  margin-bottom: 0;
}
.upload-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
}

.doc-block {
  margin-bottom: 22px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-lighter);
}
.doc-block:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.doc-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.doc-title {
  flex: 1;
  min-width: 0;
}
.doc-title strong {
  display: block;
  font-size: 14.5px;
  color: var(--text-primary);
  padding-left: 10px;
  border-left: 3px solid var(--brand);
}
.doc-title p {
  margin: 4px 0 0;
  padding-left: 13px;
  font-size: 12px;
  color: var(--text-placeholder);
}
.id-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  min-width: 0;
  overflow: hidden;
}
.id-pair .uc {
  margin: 0 !important;
  min-width: 0;
  overflow: hidden;
}
.id-pair :deep(.uc-thumb),
.id-pair :deep(.uc-face) {
  width: 44px;
  height: 30px;
  flex-shrink: 0;
}
.id-pair :deep(.uc-row) {
  min-width: 0;
}
.id-pair :deep(.uc-drop) {
  min-width: 0;
  overflow: hidden;
}
.id-pair :deep(.uc-text strong) {
  max-width: 100%;
}
.fill-box {
  margin-top: 12px;
  background: var(--bg-muted);
  border: 1px solid var(--border-light);
  border-radius: var(--r-md);
  padding: 14px 16px;
}
.fill-box-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}
.fill-box-head strong {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
}
.fill-box-head span {
  font-size: 12px;
  color: var(--text-placeholder);
}
.fill-box-head {
  margin-bottom: 12px;
}
.fill-box-head strong {
  display: block;
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 2px;
}
.fill-box-head span {
  font-size: 12.5px;
  color: var(--text-secondary);
}
.range-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.range-row > span {
  color: var(--text-placeholder);
  font-size: 13px;
}

.tag-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: var(--r-pill);
  border: 1px solid var(--border-strong);
  background: #fff;
  font-size: 13px;
  color: var(--text-regular);
  cursor: pointer;
  transition: all var(--t-fast);
}
.tag-btn:hover {
  border-color: var(--brand);
  color: var(--brand);
}
.tag-btn.on {
  background: var(--brand-soft-strong);
  border-color: var(--brand);
  color: var(--brand);
  font-weight: 600;
}

.switch-line {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding-left: 4px;
}
.switch-line :deep(.el-switch) {
  --el-switch-on-color: var(--brand);
  width: auto !important;
  min-width: 0 !important;
}
.switch-line :deep(.el-switch__core) {
  width: 40px !important;
}
.switch-line :deep(.el-switch__label) {
  display: none !important;
}
.switch-text {
  margin-left: 10px;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.agree-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}
.agree-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border: 1px solid var(--border-light);
  border-radius: var(--r-md);
  cursor: pointer;
}
.agree-item strong {
  display: block;
  font-size: 14px;
  color: var(--text-primary);
}
.agree-item small {
  font-size: 12.5px;
  color: var(--text-secondary);
}

.summary-entity {
  margin-bottom: 14px;
}
.summary-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}
.summary-pair .k,
.summary-grid .k {
  display: block;
  font-size: 12.5px;
  color: var(--text-placeholder);
  margin-bottom: 6px;
}
.sec-title {
  margin: 0 0 10px;
  font-size: 14.5px;
  font-weight: 700;
  color: var(--text-primary);
  padding-left: 10px;
  border-left: 3px solid var(--brand);
}
.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
  margin-bottom: 20px;
}
.summary-grid .v {
  font-size: 14px;
  color: var(--text-regular);
  font-weight: 500;
}
.file-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.file-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--r-md);
  cursor: pointer;
  transition: border-color var(--t-fast), background var(--t-fast), box-shadow var(--t-fast);
}
.file-list li:hover {
  border-color: var(--brand);
  background: var(--brand-soft);
  box-shadow: var(--shadow-xs);
}
.file-peek {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--brand);
  opacity: 0;
  transition: opacity var(--t-fast);
}
.file-list li:hover .file-peek {
  opacity: 1;
}
.agreement-block {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px dashed var(--border-light);
}
.agreement-block:last-of-type {
  border-bottom: none;
}
.agr-actions {
  display: flex;
  gap: 8px;
  margin: 0 0 10px;
}
.file-ic {
  width: 36px;
  height: 36px;
  border-radius: var(--r-sm);
  display: grid;
  place-items: center;
  background: var(--c-blue-bg);
  color: var(--c-blue);
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}
.file-meta {
  flex: 1;
  min-width: 0;
}
.file-meta strong {
  display: block;
  font-size: 13.5px;
  color: var(--text-primary);
}
.file-meta small {
  font-size: 12px;
  color: var(--text-placeholder);
}
.file-valid {
  font-size: 12.5px;
  color: var(--text-secondary);
  margin-right: 8px;
}

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
.err-inline {
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--status-danger-soft);
  color: var(--status-danger);
  border-radius: var(--r-sm);
  font-size: 13px;
}

</style>
