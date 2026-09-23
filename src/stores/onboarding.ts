import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type EntityType = 'personal' | 'individual' | 'enterprise'
export type SupplierType = 'service' | 'manufacturer' | 'trader' | 'logistics' | 'material' | 'testing'
export type CertType = 'business_license' | 'individual_license' | 'id_card'

export const SUPPLIER_TYPES: { id: SupplierType; label: string; desc: string; enabled: boolean }[] = [
  { id: 'service', label: '服务商', desc: 'IT / 人力 / 财税等企业服务', enabled: true },
  { id: 'manufacturer', label: '制造商', desc: '生产加工与代工', enabled: false },
  { id: 'trader', label: '贸易商', desc: '经销代理与批发', enabled: false },
  { id: 'logistics', label: '物流商', desc: '仓配与运输服务', enabled: false },
  { id: 'material', label: '原材料商', desc: '大宗与辅料供应', enabled: false },
  { id: 'testing', label: '检测认证', desc: '质检与合规认证', enabled: false },
]

export const STEPS = [
  { n: 1, key: 'info', label: '入驻信息' },
  { n: 2, key: 'qualify', label: '资质与账户' },
  { n: 3, key: 'products', label: '产品服务' },
  { n: 4, key: 'agreement', label: '入驻协议' },
  { n: 5, key: 'confirm', label: '确认提交' },
] as const

const STORAGE_KEY = 'gysd-onboarding-draft'

export interface OnboardingDraft {
  supplierType: SupplierType
  entityType: EntityType
  /* 主体核验（进入填写流程前） */
  entityName: string
  creditCode: string
  certType: CertType | ''
  /* step 1：入驻信息 */
  park: string
  serviceName: string
  industry: string
  mobile: string
  contactName: string
  contactTitle: string
  email: string
  /* step 2：资质 */
  licenseUploaded: boolean
  licenseNo: string
  legalPerson: string
  regCapital: string
  enterpriseType: string
  foundDate: string
  issueDate: string
  validFrom: string
  validTo: string
  validForever: boolean
  regAddress: string
  businessScope: string
  idFront: boolean
  idBack: boolean
  idNo: string
  idGender: string
  idEthnic: string
  idBirth: string
  idAuthority: string
  idValidFrom: string
  idValidTo: string
  idAddress: string
  agentName: string
  agentMobile: string
  agentRelation: string
  bankUploaded: boolean
  accountName: string
  bankName: string
  bankBranch: string
  bankAccount: string
  /* step 3：产品服务 */
  serviceCategories: string[]
  serviceCities: string[]
  skills: string[]
  caseDesc: string
  caseCount: number
  canInvoice: boolean
  extraCerts: string
  /* step 4：协议 */
  agreePlatform: boolean
  agreeProvider: boolean
  agreePrivacy: boolean
  signName: string
  signDate: string
  /* 协议文件（两类） */
  coopUploaded: boolean
  coopFileName: string
  splitUploaded: boolean
  splitFileName: string
}

function emptyDraft(): OnboardingDraft {
  return {
    supplierType: 'service',
    entityType: 'enterprise',
    entityName: '',
    creditCode: '',
    certType: 'business_license',
    park: '',
    serviceName: '',
    industry: '',
    mobile: '',
    contactName: '',
    contactTitle: '',
    email: '',
    licenseUploaded: false,
    licenseNo: '',
    legalPerson: '',
    regCapital: '',
    enterpriseType: '',
    foundDate: '',
    issueDate: '',
    validFrom: '',
    validTo: '',
    validForever: false,
    regAddress: '',
    businessScope: '',
    idFront: false,
    idBack: false,
    idNo: '',
    idGender: '',
    idEthnic: '',
    idBirth: '',
    idAuthority: '',
    idValidFrom: '',
    idValidTo: '',
    idAddress: '',
    agentName: '',
    agentMobile: '',
    agentRelation: '',
    bankUploaded: false,
    accountName: '',
    bankName: '',
    bankBranch: '',
    bankAccount: '',
    serviceCategories: [],
    serviceCities: [],
    skills: [],
    caseDesc: '',
    caseCount: 0,
    canInvoice: true,
    extraCerts: '',
    agreePlatform: false,
    agreeProvider: false,
    agreePrivacy: false,
    signName: '',
    signDate: '',
    coopUploaded: false,
    coopFileName: '',
    splitUploaded: false,
    splitFileName: '',
  }
}

function loadDraft(): OnboardingDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...emptyDraft(), ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return emptyDraft()
}

export const useOnboardingStore = defineStore('onboarding', () => {
  const draft = ref<OnboardingDraft>(loadDraft())
  const maxStep = ref(1)
  const savedAt = ref<string | null>(null)

  const entityLabel = computed(() => {
    const map: Record<EntityType, string> = {
      personal: '个人',
      individual: '个体工商户',
      enterprise: '企业',
    }
    return map[draft.value.entityType]
  })

  const supplierLabel = computed(
    () => SUPPLIER_TYPES.find((t) => t.id === draft.value.supplierType)?.label ?? '服务商',
  )

  const CERT_LABEL: Record<CertType, string> = {
    business_license: '营业执照',
    individual_license: '个体工商户营业执照',
    id_card: '身份证',
  }

  const certLabel = computed(() =>
    draft.value.certType ? CERT_LABEL[draft.value.certType] : '—',
  )

  function defaultCertType(t: EntityType): CertType {
    if (t === 'enterprise') return 'business_license'
    if (t === 'individual') return 'individual_license'
    return 'id_card'
  }

  function setEntityType(t: EntityType) {
    draft.value.entityType = t
    draft.value.certType = defaultCertType(t)
    persist()
  }

  /** 进入填写流程前：证件类型 + 企业名称 + 识别码 三项核验 */
  function validateEntityGate(): string[] {
    const d = draft.value
    const errs: string[] = []
    if (!d.entityType) errs.push('请选择经营主体类型')
    if (!d.certType) errs.push('请确认证件类型')
    if (d.certType && d.certType !== defaultCertType(d.entityType)) {
      errs.push(`证件类型与主体不一致（当前主体应为「${CERT_LABEL[defaultCertType(d.entityType)]}」）`)
    }
    const name = d.entityName.trim()
    if (!name) {
      errs.push(d.entityType === 'personal' ? '请填写姓名' : '请填写企业名称')
    } else if (d.entityType !== 'personal' && name.length < 4) {
      errs.push('企业名称至少 4 个字')
    } else if (d.entityType === 'personal' && name.length < 2) {
      errs.push('姓名至少 2 个字')
    }

    const code = d.creditCode.trim().toUpperCase()
    if (!code) {
      errs.push(
        d.entityType === 'personal' ? '请填写身份证号' : '请填写统一社会信用代码（识别码）',
      )
    } else if (d.entityType === 'personal') {
      if (!/^\d{17}[\dX]$/.test(code)) errs.push('身份证号格式不正确（18 位）')
    } else if (!/^[0-9A-Z]{18}$/.test(code)) {
      errs.push('统一社会信用代码须为 18 位数字或大写字母')
    }
    return errs
  }

  /** 主体核验通过后写入并允许进入 step1 */
  function confirmEntityGate(): boolean {
    const errs = validateEntityGate()
    if (errs.length) return false
    draft.value.creditCode = draft.value.creditCode.trim().toUpperCase()
    draft.value.entityName = draft.value.entityName.trim()
    if (draft.value.entityType !== 'personal' && !draft.value.legalPerson) {
      // 预填法人字段名，待 step2 身份证读取覆盖
      draft.value.legalPerson = ''
    }
    draft.value.licenseNo = draft.value.creditCode
    persist()
    markStep(1)
    return true
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft.value))
    savedAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  }

  function saveDraft() {
    persist()
  }

  function resetDraft() {
    draft.value = emptyDraft()
    maxStep.value = 1
    localStorage.removeItem(STORAGE_KEY)
    savedAt.value = null
  }

  function fillDemoLicense() {
    const d = draft.value
    d.licenseUploaded = true
    d.entityName = d.entityName || '万联易达航空物流地面综合服务（郑州）有限公司'
    d.creditCode = d.creditCode || '91310000MA1FL8X21B'
    d.licenseNo = d.creditCode
    d.legalPerson = d.legalPerson || '周启明'
    d.regCapital = d.regCapital || '500万元人民币'
    d.enterpriseType = d.enterpriseType || '有限责任公司'
    d.foundDate = d.foundDate || '2015/06/18'
    d.issueDate = d.issueDate || '2015/06/18'
    d.validFrom = d.validFrom || '2015/06/18'
    d.validTo = d.validTo || '2045/06/18'
    d.validForever = false
    d.regAddress = d.regAddress || '上海市浦东新区临港新片区环湖西一路 888 号'
    d.businessScope =
      d.businessScope || '企业管理咨询；信息技术咨询服务；人力资源服务；会议及展览服务。'
    persist()
  }

  function fillDemoId() {
    const d = draft.value
    d.idFront = true
    d.idBack = true
    d.legalPerson = d.legalPerson || '周启明'
    d.idNo = d.idNo || '310115199001011234'
    d.idGender = d.idGender || '男'
    d.idEthnic = d.idEthnic || '汉族'
    d.idBirth = d.idBirth || '1990/01/01'
    d.idAuthority = d.idAuthority || '上海市公安局浦东分局'
    d.idValidFrom = d.idValidFrom || '2016/06/18'
    d.idValidTo = d.idValidTo || '2045/06/18'
    d.idAddress = d.idAddress || '上海市浦东新区临港新片区环湖西一路 888 号'
    persist()
  }

  function fillDemoBank() {
    const d = draft.value
    d.bankUploaded = true
    d.accountName = d.accountName || d.entityName || '万联易达航空物流地面综合服务（郑州）有限公司'
    d.bankName = d.bankName || '中国工商银行'
    d.bankBranch = d.bankBranch || '上海临港新片区支行'
    d.bankAccount = d.bankAccount || '1001 2345 0900 8888 666'
    persist()
  }

  function fillDemoInfo() {
    const d = draft.value
    d.park = d.park || '上海临港新片区智能制造产业园'
    d.serviceName = d.serviceName || '临港企服'
    d.industry = d.industry || '信息技术与软件服务'
    d.mobile = d.mobile || '13800008000'
    d.contactName = d.contactName || '周启明'
    d.contactTitle = d.contactTitle || '市场负责人'
    d.email = d.email || 'service@example.com'
    persist()
  }

  function fillDemoProducts() {
    const d = draft.value
    if (!d.serviceCategories.length) d.serviceCategories = ['IT 外包', '管理咨询']
    if (!d.serviceCities.length) d.serviceCities = ['上海', '苏州']
    if (!d.skills.length) d.skills = ['RPA 开发', '企业注册']
    d.caseDesc =
      d.caseDesc ||
      '为临港智能制造园区 30+ 家企业提供 IT 运维与 RPA 流程自动化，平均节省人力 40%；负责年度财税顾问与高新技术企业申报。'
    d.caseCount = d.caseCount || 12
    d.canInvoice = true
    d.extraCerts = d.extraCerts || 'certs.zip'
    persist()
  }

  function fillDemoAgreement() {
    const d = draft.value
    d.agreePlatform = true
    d.agreeProvider = true
    d.agreePrivacy = true
    d.signName = d.signName || d.legalPerson || d.contactName || '周启明'
    d.signDate = d.signDate || new Date().toISOString().slice(0, 10)
    d.coopUploaded = true
    d.coopFileName = d.coopFileName || '服务商入驻合作协议-已签.pdf'
    d.splitUploaded = true
    d.splitFileName = d.splitFileName || '支付分账协议-已签.pdf'
    persist()
  }

  function fillDemoAgent() {
    const d = draft.value
    d.agentName = d.agentName || '周启明'
    d.agentMobile = d.agentMobile || '13800008000'
    d.agentRelation = d.agentRelation || '法定代表人'
    persist()
  }

  function fillDemoAll() {
    if (!d_hasEntity()) {
      draft.value.entityName = draft.value.entityName || '万联易达航空物流地面综合服务（郑州）有限公司'
      draft.value.creditCode = draft.value.creditCode || '91310000MA1FL8X21B'
      draft.value.certType = draft.value.certType || 'business_license'
    }
    fillDemoInfo()
    fillDemoLicense()
    fillDemoId()
    fillDemoBank()
    fillDemoAgent()
    fillDemoProducts()
    fillDemoAgreement()
    markStep(5)
    persist()
  }

  function d_hasEntity() {
    return Boolean(draft.value.entityName && draft.value.creditCode)
  }

  function fillDemoStep(n: number) {
    if (n === 1) fillDemoInfo()
    if (n === 2) {
      fillDemoLicense()
      fillDemoId()
      fillDemoBank()
      fillDemoAgent()
    }
    if (n === 3) fillDemoProducts()
    if (n === 4) fillDemoAgreement()
    if (n === 5) fillDemoAll()
  }

  function validateStep(step: number): string[] {
    const d = draft.value
    const errs: string[] = []
    if (step === 1) {
      // 主体三项已在 /onboarding/entity 核验，此处不再重复；仅校验本步表单
      const gate = validateEntityGate()
      if (gate.length) errs.push(...gate)
      if (!d.park) errs.push('请选择申请入驻园区')
      if (!d.serviceName.trim()) errs.push('请填写服务商名称')
      if (!d.industry) errs.push('请选择所属行业')
      if (!/^1\d{10}$/.test(d.mobile.trim())) errs.push('请填写正确的注册手机号')
      if (!d.contactName.trim()) errs.push('请填写联系人姓名')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) errs.push('请填写正确邮箱')
    }
    if (step === 2) {
      if (!d.licenseUploaded) errs.push('请上传营业执照')
      if (!d.legalPerson.trim()) errs.push('请填写法定代表人')
      if (!d.idFront || !d.idBack) errs.push('请上传法人身份证正反面')
      if (!d.idNo.trim()) errs.push('请填写法人证件号码')
      if (!d.bankUploaded) errs.push('请上传开户许可证或基本存款账户信息')
      if (!d.accountName.trim()) errs.push('请填写账户名称')
      if (!d.bankName.trim()) errs.push('请填写开户银行')
      if (!d.bankBranch.trim()) errs.push('请填写开户支行')
      if (!d.bankAccount.trim()) errs.push('请填写账号')
      if (!d.agentName.trim()) errs.push('请填写经办人姓名')
      if (!/^1\d{10}$/.test(d.agentMobile.trim())) errs.push('请填写正确的经办人手机')
    }
    if (step === 3) {
      if (!d.serviceCategories.length) errs.push('请至少选择 1 个服务类目')
      if (!d.serviceCities.length) errs.push('请至少选择 1 个服务范围城市')
      if (d.skills.length > 3) errs.push('擅长领域最多 3 个')
      if (!d.skills.length) errs.push('请填写至少 1 个擅长领域')
      if (!d.caseDesc.trim() || d.caseDesc.trim().length < 10) errs.push('案例描述至少 10 个字')
    }
    if (step === 4) {
      if (!d.agreePlatform) errs.push('请阅读并同意平台服务协议')
      if (!d.agreeProvider) errs.push('请阅读并同意服务商入驻协议')
      if (!d.agreePrivacy) errs.push('请阅读并同意数据保密承诺')
      if (!d.coopUploaded) errs.push('请上传《服务商入驻合作协议》')
      if (!d.splitUploaded) errs.push('请上传《支付分账协议》')
      if (!d.signName.trim()) errs.push('请填写电子签章姓名')
      if (!d.signDate) errs.push('请选择签署日期')
    }
    if (step === 5) {
      for (let s = 1; s <= 4; s++) {
        const e = validateStep(s)
        if (e.length) errs.push(`第 ${s} 步：${e[0]}`)
      }
    }
    return errs
  }

  function markStep(n: number) {
    if (n > maxStep.value) maxStep.value = n
    persist()
  }

  return {
    draft,
    maxStep,
    savedAt,
    entityLabel,
    supplierLabel,
    certLabel,
    defaultCertType,
    setEntityType,
    validateEntityGate,
    confirmEntityGate,
    persist,
    saveDraft,
    resetDraft,
    fillDemoLicense,
    fillDemoId,
    fillDemoBank,
    fillDemoInfo,
    fillDemoProducts,
    fillDemoAgreement,
    fillDemoAgent,
    fillDemoAll,
    fillDemoStep,
    validateStep,
    markStep,
  }
})
