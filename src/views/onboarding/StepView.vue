<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Building,
  UserCheck,
  BadgeCheck,
  ScanLine,
  IdCard,
  Landmark,
  Upload,
  CircleAlert,
  Handshake,
  FileSignature,
  ClipboardList,
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

const route = useRoute()
const router = useRouter()
const ob = useOnboardingStore()
const acc = useAcceptanceStore()
const d = ob.draft

const step = computed(() => Math.min(5, Math.max(1, Number(route.params.n) || 1)))
const errors = ref<string[]>([])

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
      subtitle: '上传证照并核对识别结果；点击标题可展开，标红项需补全。',
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
    <div v-if="errors.length" class="err-banner">
      <CircleAlert :size="16" />
      <ul>
        <li v-for="e in errors" :key="e">{{ e }}</li>
      </ul>
    </div>

    <!-- ===== Step 1 入驻信息 ===== -->
    <div v-if="step === 1" class="step-layout">
      <section class="main-col">
        <div class="card">
          <div class="card-head">
            <span class="card-ic tone-blue"><Building :size="16" /></span>
            <div>
              <h2>基础信息</h2>
              <p>企业信息已填写，请完善服务商信息与联系人信息。</p>
            </div>
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
            <div>
              <h2>资质与证件</h2>
              <p>请上传证件并填写信息，点击标题可展开查看。</p>
            </div>
          </div>

          <!-- 营业执照 -->
          <details class="acc" open>
            <summary>
              <span>营业执照</span>
              <ElTag :type="d.licenseUploaded ? 'success' : 'warning'" size="small" round>
                {{ d.licenseUploaded ? '已完善' : '待完善' }}
              </ElTag>
            </summary>
            <div class="acc-body">
              <div class="upload-row">
                <ElButton type="primary" size="small" @click="ob.fillDemoLicense()">
                  <ScanLine :size="14" style="margin-right: 4px" />
                  读取证件信息
                </ElButton>
              </div>
              <div class="upload-zone" :class="{ done: d.licenseUploaded }" @click="ob.fillDemoLicense()">
                <Upload :size="22" />
                <strong>{{ d.licenseUploaded ? 'license-front.png' : '点击或拖拽上传' }}</strong>
                <small>仅支持图片 JPG/PNG 或 PDF，单文件不超过 100MB · 请上传营业执照原件或扫描件</small>
              </div>
              <div class="fill-box">
                <div class="fill-box-head">
                  <strong>填写信息</strong>
                  <span>请确认信息是否正确，可直接修改。</span>
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
            </div>
          </details>

          <!-- 法人身份证 -->
          <details class="acc" open>
            <summary>
              <span>法人身份证</span>
              <ElTag :type="d.idFront && d.idBack ? 'success' : 'warning'" size="small" round>
                {{ d.idFront && d.idBack ? '已完善' : '待完善' }}
              </ElTag>
            </summary>
            <div class="acc-body">
              <div class="upload-row">
                <ElButton type="primary" size="small" @click="ob.fillDemoId()">
                  <ScanLine :size="14" style="margin-right: 4px" />
                  读取证件信息
                </ElButton>
              </div>
              <div class="upload-pair">
                <div class="upload-zone sm" :class="{ done: d.idFront }" @click="ob.fillDemoId()">
                  <Upload :size="18" />
                  <strong>法人身份证正面</strong>
                  <small>{{ d.idFront ? 'id-front.png' : '点击或拖拽上传 · 人像面' }}</small>
                </div>
                <div class="upload-zone sm" :class="{ done: d.idBack }" @click="ob.fillDemoId()">
                  <Upload :size="18" />
                  <strong>法人身份证反面</strong>
                  <small>{{ d.idBack ? 'id-back.png' : '点击或拖拽上传 · 国徽面' }}</small>
                </div>
              </div>
              <div class="fill-box">
                <div class="fill-box-head">
                  <strong>填写信息</strong>
                  <span>上传正反面后自动读取，不一致时将提示确认。</span>
                </div>
                <div class="form-grid">
                  <div class="field">
                    <label>法定代表人 <em>*</em></label>
                    <ElInput v-model="d.legalPerson" placeholder="请填写" @change="ob.persist" />
                  </div>
                  <div class="field">
                    <label>法人证件号码 <em>*</em></label>
                    <ElInput v-model="d.idNo" placeholder="请填写" @change="ob.persist" />
                  </div>
                  <div class="field">
                    <label>性别</label>
                    <ElSelect v-model="d.idGender" clearable placeholder="请选择（选填）" style="width: 100%" @change="ob.persist">
                      <ElOption label="男" value="男" />
                      <ElOption label="女" value="女" />
                    </ElSelect>
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
                    <label>有效期限 <em>*</em></label>
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
            </div>
          </details>

          <!-- 账户信息 -->
          <details class="acc" open>
            <summary>
              <span>账户信息</span>
              <ElTag :type="d.bankUploaded ? 'success' : 'warning'" size="small" round>
                {{ d.bankUploaded ? '已完善' : '待完善' }}
              </ElTag>
            </summary>
            <div class="acc-body">
              <div class="upload-row">
                <ElButton type="primary" size="small" @click="ob.fillDemoBank()">
                  <Landmark :size="14" style="margin-right: 4px" />
                  读取账户信息
                </ElButton>
              </div>
              <div class="upload-zone" :class="{ done: d.bankUploaded }" @click="ob.fillDemoBank()">
                <Upload :size="22" />
                <strong>{{ d.bankUploaded ? 'bank-license.png' : '点击或拖拽上传' }}</strong>
                <small>开户许可证或基本存款账户信息，任选其一</small>
              </div>
              <div class="fill-box">
                <div class="fill-box-head">
                  <strong>填写信息</strong>
                  <span>请确认信息是否正确，可直接修改。</span>
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
            </div>
          </details>
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
            <span class="card-ic tone-green"><Handshake :size="16" /></span>
            <div>
              <h2>商户基本信息</h2>
              <p>定义服务范围与能力标签，支撑后续服务上架。</p>
            </div>
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
              <div class="seg-inline">
                <button type="button" :class="{ on: d.canInvoice }" @click="d.canInvoice = true; ob.persist()">可以</button>
                <button type="button" :class="{ on: !d.canInvoice }" @click="d.canInvoice = false; ob.persist()">仅普票</button>
              </div>
            </div>

            <div class="field span-2">
              <label>补充资质附件</label>
              <div class="upload-zone" @click="d.extraCerts = 'certs.zip'; ob.persist()">
                <IdCard :size="20" />
                <strong>{{ d.extraCerts || '点击上传行业资质 / 荣誉证书' }}</strong>
                <small>选填，有助于加快审核</small>
              </div>
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
            <div>
              <h2>《服务商入驻合作协议》</h2>
              <p>请完整阅读以下协议，勾选同意并完成电子签章。</p>
            </div>
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
            <div>
              <h2>确认填报信息</h2>
              <p>提交后进入园区审核，可在顶栏查看进度。</p>
            </div>
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
            <li>
              <span class="file-ic">营</span>
              <div class="file-meta">
                <strong>营业执照</strong>
                <small>license.png · 534KB</small>
              </div>
              <span class="file-valid">有效期至 {{ d.validTo || '长期' }}</span>
              <ElTag :type="d.licenseUploaded ? 'success' : 'warning'" size="small" round>
                {{ d.licenseUploaded ? '已上传' : '待上传' }}
              </ElTag>
            </li>
            <li>
              <span class="file-ic">证</span>
              <div class="file-meta">
                <strong>法人身份证正面</strong>
                <small>id-front.png · 534KB</small>
              </div>
              <span class="file-valid">有效期至 {{ d.idValidTo || '—' }}</span>
              <ElTag :type="d.idFront ? 'success' : 'warning'" size="small" round>
                {{ d.idFront ? '已上传' : '待上传' }}
              </ElTag>
            </li>
            <li>
              <span class="file-ic">证</span>
              <div class="file-meta">
                <strong>法人身份证反面</strong>
                <small>id-back.png · 534KB</small>
              </div>
              <span class="file-valid">有效期至 {{ d.idValidTo || '—' }}</span>
              <ElTag :type="d.idBack ? 'success' : 'warning'" size="small" round>
                {{ d.idBack ? '已上传' : '待上传' }}
              </ElTag>
            </li>
            <li>
              <span class="file-ic">银</span>
              <div class="file-meta">
                <strong>开户许可证 / 基本户</strong>
                <small>bank.png · 210KB</small>
              </div>
              <span class="file-valid">账户 {{ maskAccount(d.bankAccount) }}</span>
              <ElTag :type="d.bankUploaded ? 'success' : 'warning'" size="small" round>
                {{ d.bankUploaded ? '已上传' : '待上传' }}
              </ElTag>
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
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--r-xl);
  padding: 20px;
}
.card-head {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}
.card-ic {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.card-ic.tone-blue { background: var(--c-blue-bg); color: var(--c-blue); }
.card-ic.tone-amber { background: var(--c-amber-bg); color: var(--c-amber); }
.card-ic.tone-green { background: var(--c-green-bg); color: var(--c-green); }
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
.section-label {
  margin-top: 4px;
}
.section-label h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
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
  border: 1px solid rgba(217, 119, 6, 0.16);
  border-radius: var(--r-lg);
  padding: 14px;
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
  border-radius: var(--r-lg);
  margin-bottom: 12px;
  overflow: hidden;
  background: #fff;
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
.upload-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
.upload-zone {
  border: 1px dashed var(--border-strong);
  border-radius: var(--r-md);
  background: var(--bg-muted);
  padding: 22px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: border-color var(--t-fast), background var(--t-fast);
  margin-bottom: 14px;
}
.upload-zone:hover {
  border-color: var(--brand);
  background: var(--brand-soft);
}
.upload-zone.done {
  border-style: solid;
  border-color: rgba(22, 163, 74, 0.35);
  background: var(--status-success-soft);
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

.fill-box {
  background: var(--status-success-soft);
  border: 1px solid rgba(22, 163, 74, 0.16);
  border-radius: var(--r-lg);
  padding: 14px;
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

.seg-inline {
  display: inline-flex;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-pill);
  overflow: hidden;
  height: 34px;
}
.seg-inline button {
  border: none;
  background: #fff;
  padding: 0 14px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}
.seg-inline button.on {
  background: var(--brand);
  color: #fff;
  font-weight: 600;
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
}
.file-ic {
  width: 36px;
  height: 36px;
  border-radius: 8px;
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

@media (max-width: 900px) {
  .step-layout {
    grid-template-columns: 1fr;
  }
  .side-col {
    position: static;
    order: -1;
  }
  .form-grid,
  .summary-grid,
  .summary-pair,
  .upload-pair {
    grid-template-columns: 1fr;
  }
  .field.span-2 {
    grid-column: span 1;
  }
}
</style>
