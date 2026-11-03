<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElButton, ElCascader, ElCheckbox, ElDatePicker, ElDialog, ElInput, ElInputNumber, ElMessage, ElMessageBox, ElOption, ElSelect } from 'element-plus'
import { ArrowLeft, Check, Plus, Pencil, Trash2 } from 'lucide-vue-next'
import type { BrandInfo, BrandApplication, BusinessQualification, OnboardingDraft } from '@/stores/onboarding'
import { saveDemoDocument } from '@/utils/demoMedia'
import DemoImage from '@/components/commerce/DemoImage.vue'
const props = defineProps<{ draft: OnboardingDraft; errors: string[] }>()
const emit = defineEmits<{ change: [] }>()
const open = ref(false)
const applyOpen = ref(false)
const applicationView = ref<'form'|'history'|'success'>('form')
const expandedDescriptions = ref<number[]>([])
const blankApplication = (): BrandApplication => ({ name: '', english: '', initial: '', image: '', imageName: '', description: '', status: 'pending' })
const application = ref<BrandApplication>(blankApplication())
const qualificationOpen = ref(false)
const blankQualification = (): BusinessQualification => ({ id: crypto.randomUUID(), type: '', document: '', documentName: '', validFrom: '', validTo: '', forever: false })
const qualification = ref<BusinessQualification>(blankQualification())
type CategoryNode = { value: string; label: string; children?: CategoryNode[] }
const categoryPaths = [
  '个人防护/头部防护/安全帽', '个人防护/头部防护/头盔内衬', '个人防护/眼面部防护/防护眼镜', '个人防护/眼面部防护/面罩', '个人防护/听力防护/耳塞', '个人防护/听力防护/耳罩', '个人防护/呼吸防护/口罩', '个人防护/呼吸防护/防毒面具',
  '手动工具/扳手/活动扳手', '手动工具/扳手/梅花扳手', '手动工具/扳手/开口扳手', '手动工具/钳子/尖嘴钳', '手动工具/钳子/钢丝钳', '手动工具/螺丝刀/十字螺丝刀', '手动工具/螺丝刀/一字螺丝刀',
  '电动工具/电钻/冲击电钻', '电动工具/电钻/充电电钻', '电动工具/角磨机/手持角磨机', '电动工具/切割机/型材切割机', '气动工具/气动扳手/风炮扳手', '气动工具/喷枪/油漆喷枪',
  '物料搬运/叉车属具/货叉', '物料搬运/叉车属具/属具夹具', '物料搬运/托盘/木托盘', '物料搬运/托盘/塑料托盘', '物料搬运/搬运车/手动液压车', '劳保安防/标识标牌/安全警示牌', '劳保安防/标识标牌/消防标识', '劳保安防/安全围栏/临时围栏',
]
const selectedCategories = computed(() => props.draft.businessCategories.map(path => path.split('/').map(part => part.trim()).filter(Boolean)))
const categoryOptions = computed(() => {
  const roots: CategoryNode[] = []
  // Preserve previously saved categories, including entries created in earlier versions.
  for (const path of [...categoryPaths.map(path => path.split('/')), ...selectedCategories.value]) {
    let nodes = roots
    path.forEach((label, index) => {
      let node = nodes.find(item => item.value === label)
      if (!node) { node = { value: label, label }; nodes.push(node) }
      if (index < path.length - 1) { node.children ||= []; nodes = node.children }
    })
  }
  return roots
})
function setCategories(value: unknown) {
  props.draft.businessCategories = (Array.isArray(value) ? value as string[][] : []).map(path => path.join(' / '))
  emit('change')
}
const candidates = ['3M', '得力', '霍尼韦尔', '西门子']
const allCandidates = () => [...new Set([...candidates, ...props.draft.brandApplications.filter(item => typeof item !== 'string' && item.status === 'approved').map(item => item.name)])]
const applicationRecords = computed(() => props.draft.brandApplications.map((item, index) => ({ item, index })).reverse())
function openApplication(view: 'form'|'history' = 'form') { applicationView.value = view; applyOpen.value = true }
function selectBrand(name: string) { const approved = props.draft.brandApplications.find(item => typeof item !== 'string' && item.status === 'approved' && item.name === name); form.value.english = approved?.english || (name === '3M' ? '3M' : ''); form.value.initial = approved?.initial || (name === '3M' ? 'M' : '') }
const empty = (): BrandInfo => ({ id: crypto.randomUUID(), name: '', english: '', initial: '', nature: '', areas: [], document: '', documentName: '', validFrom: '', validTo: '', forever: false })
const form = ref<BrandInfo>(empty())
const editing = ref(false)
function addWarehouse() { props.draft.warehouseAddresses.push({ id: crypto.randomUUID(), province: '', city: '', district: '', detail: '' }); emit('change') }
function edit(item?: BrandInfo) { editing.value = !!item; form.value = item ? JSON.parse(JSON.stringify(item)) as BrandInfo : empty(); open.value = true }
async function upload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!['image/jpeg','image/png','application/pdf'].includes(file.type) || file.size > 10 * 1024 * 1024) { ElMessage.error('请选择不超过 10MB 的 JPG、PNG 或 PDF 文件'); input.value = ''; return }
  try { form.value.document = await saveDemoDocument(file); form.value.documentName = file.name } catch { ElMessage.error('文件保存失败，请重试') }
  input.value = ''
}
function save() {
  const b = form.value
  if (!b.name || !b.nature || !b.documentName || !b.validFrom || (!b.forever && !b.validTo)) { ElMessage.warning('请填写品牌名称、性质、证明和有效期'); return }
  if (!b.forever && b.validTo < b.validFrom) { ElMessage.warning('有效期结束日期不能早于开始日期'); return }
  if (props.draft.brands.some(item => item.name === b.name && item.id !== b.id)) { ElMessage.warning('该品牌已添加'); return }
  const index = props.draft.brands.findIndex(item => item.id === b.id)
  if (index < 0) props.draft.brands.push({ ...b }); else props.draft.brands.splice(index, 1, { ...b })
  emit('change'); open.value = false
}
async function remove(item: BrandInfo) {
  try { await ElMessageBox.confirm(`确定移除品牌“${item.name}”？`, '移除品牌', { type: 'warning' }); props.draft.brands = props.draft.brands.filter(b => b.id !== item.id); emit('change') } catch { /* cancelled */ }
}
async function uploadApplication(e: Event) {
  const input = e.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return
  if (!['image/jpeg','image/png'].includes(file.type) || file.size > 10 * 1024 * 1024) { ElMessage.error('请选择不超过 10MB 的 JPG 或 PNG 图片'); input.value = ''; return }
  try { application.value.image = await saveDemoDocument(file); application.value.imageName = file.name } catch { ElMessage.error('图片保存失败') } input.value = ''
}
async function uploadQualification(e: Event) {
  const input = e.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return
  if (!['image/jpeg','image/png','application/pdf'].includes(file.type) || file.size > 10 * 1024 * 1024) { ElMessage.error('请选择不超过 10MB 的 JPG、PNG 或 PDF'); input.value = ''; return }
  try { qualification.value.document = await saveDemoDocument(file); qualification.value.documentName = file.name } catch { ElMessage.error('文件保存失败') } input.value = ''
}
function saveQualification() {
  const q = qualification.value
  if (!q.type.trim() || !q.documentName || !q.validFrom || (!q.forever && !q.validTo)) { ElMessage.warning('请完整填写资质类型、文件及有效期'); return }
  if (!q.forever && q.validTo < q.validFrom) { ElMessage.warning('结束日期不能早于开始日期'); return }
  const i = props.draft.businessQualifications.findIndex(item => item.id === q.id)
  if (i < 0) props.draft.businessQualifications.push({ ...q }); else props.draft.businessQualifications.splice(i, 1, { ...q })
  emit('change'); qualificationOpen.value = false
}
function apply() {
  const a = application.value
  if (!a.name.trim() || !a.english.trim() || !a.initial.trim() || !a.imageName || !a.description.trim()) { ElMessage.warning('请完整填写品牌信息并上传图片'); return }
  if (props.draft.brandApplications.some(item => typeof item !== 'string' && item.name === a.name.trim() && item.status !== 'rejected')) { ElMessage.warning('该品牌已有申请'); return }
  props.draft.brandApplications.push({ ...a, name:a.name.trim(), english:a.english.trim(), initial:a.initial.trim(), description:a.description.trim(), submittedAt:new Date().toLocaleString('zh-CN', { hour12:false }) }); emit('change'); application.value = blankApplication(); applicationView.value = 'success'
}
</script>
<template>
  <div class="business-card">
    <h3>经营信息</h3>
    <label class="field-label">主营类目 <em>*</em></label>
    <ElCascader :model-value="selectedCategories" :options="categoryOptions" :props="{ multiple: true, emitPath: true }" filterable clearable collapse-tags collapse-tags-tooltip placeholder="搜索并选择主营类目，可多选" style="width:100%" @change="setCategories" />
    <p v-if="errors.includes('请选择主营类目')" class="error">请选择主营类目</p>
    <div class="brand-head"><div><h4>品牌信息 <em>*</em></h4><p>逐项添加品牌及授权信息</p></div><div class="actions"><ElButton @click="openApplication()">没有品牌？去申请</ElButton><ElButton type="primary" plain @click="edit()"><Plus :size="14" />添加品牌</ElButton></div></div>
    <div v-if="!draft.brands.length" class="empty">尚未添加品牌，请添加经营的品牌。</div>
    <div v-for="item in draft.brands" :key="item.id" class="brand-row"><div><strong>{{ item.name }}</strong><p>{{ item.nature }} · {{ item.areas.length ? item.areas.join('、') : '服务区域未填写' }}</p><small>{{ item.documentName }} · {{ item.validFrom }} 至 {{ item.forever ? '长期' : item.validTo }}</small></div><div class="actions"><ElButton text type="primary" @click="edit(item)"><Pencil :size="14" />编辑</ElButton><ElButton text type="danger" @click="remove(item)"><Trash2 :size="14" />移除</ElButton></div></div>
    <p v-if="errors.includes('请添加品牌信息')" class="error">请添加品牌信息</p>
    <p v-if="draft.brandApplications.length" class="pending">品牌申请：{{ draft.brandApplications.map(a => typeof a === 'string' ? `${a}（待审核）` : `${a.name}（${a.status === 'approved' ? '已通过' : a.status === 'rejected' ? '已驳回' : '待审核'}）`).join('、') }}</p>
    <div class="brand-head"><div><h4>经营资质</h4><p>选填，逐项添加资质文件与有效期</p></div><ElButton @click="qualification = blankQualification(); qualificationOpen = true"><Plus :size="14" />添加资质</ElButton></div>
    <div v-for="q in draft.businessQualifications" :key="q.id" class="brand-row"><div><strong>{{ q.type }}</strong><p>{{ q.documentName }} · {{ q.validFrom }} 至 {{ q.forever ? '长期' : q.validTo }}</p></div><div class="actions"><ElButton text type="primary" @click="qualification = { ...q }; qualificationOpen = true">编辑</ElButton><ElButton text type="danger" @click="draft.businessQualifications = draft.businessQualifications.filter(x => x.id !== q.id); emit('change')">移除</ElButton></div></div>
    <div class="brand-head"><div><h4>仓储运营</h4><p>选填，可添加多个仓库地址</p></div><ElButton @click="addWarehouse"><Plus :size="14" />添加仓库</ElButton></div>
    <div class="warehouse-counts"><label>工程师数量（人）<ElInputNumber v-model="draft.engineerCount" :min="0" :precision="0" placeholder="选填" @change="emit('change')" /></label><label>车辆数量（辆）<ElInputNumber v-model="draft.vehicleCount" :min="0" :precision="0" placeholder="选填" @change="emit('change')" /></label></div>
    <div v-if="!draft.warehouseAddresses.length" class="empty">尚未添加仓库地址</div>
    <div v-for="(warehouse, index) in draft.warehouseAddresses" :key="warehouse.id" class="warehouse-row"><div class="warehouse-head"><strong>仓库地址 {{ index + 1 }}</strong><ElButton text type="danger" @click="draft.warehouseAddresses.splice(index, 1); emit('change')">移除</ElButton></div><div class="warehouse-fields"><label>省份<ElInput v-model="warehouse.province" placeholder="请输入省份" @change="emit('change')" /></label><label>城市<ElInput v-model="warehouse.city" placeholder="请输入城市" @change="emit('change')" /></label><label>区 / 县<ElInput v-model="warehouse.district" placeholder="请输入区 / 县" @change="emit('change')" /></label><label class="wide">详细地址<ElInput v-model="warehouse.detail" placeholder="街道、楼牌号或详细位置" @change="emit('change')" /></label></div><p v-if="errors.some(e => e.startsWith(`仓库地址 ${index + 1}：`))" class="error">请完整填写省、市、区县及详细地址</p></div>
  </div>
  <ElDialog v-model="open" :title="editing ? '编辑品牌' : '添加品牌'" width="min(680px, 90vw)" append-to-body>
    <div class="brand-form">
      <label>品牌名称 <em>*</em><ElSelect v-model="form.name" filterable placeholder="选择品牌" @change="selectBrand" style="width:100%"><ElOption v-for="name in allCandidates()" :key="name" :label="name" :value="name" /></ElSelect></label>
      <label>品牌性质 <em>*</em><ElSelect v-model="form.nature" placeholder="选择品牌性质" style="width:100%"><ElOption v-for="n in ['品牌商','一级代理商','二级代理商']" :key="n" :label="n" :value="n" /></ElSelect></label>
      <label>英文名称<ElInput v-model="form.english" placeholder="填写英文名称" /></label><label>英文首字母<ElInput v-model="form.initial" placeholder="填写英文首字母" /></label>
      <label class="wide">服务区域<ElSelect v-model="form.areas" multiple filterable allow-create default-first-option placeholder="输入并添加服务区域" style="width:100%" /></label>
      <label class="wide">{{ form.nature.includes('代理商') ? '代理授权证明' : '商标注册证' }} <em>*</em><span class="upload"><input type="file" accept="image/jpeg,image/png,application/pdf" @change="upload" /><span>{{ form.documentName || '选择文件' }}</span></span><small>支持 JPG、PNG、PDF，单个文件不超过 10MB</small></label>
      <label class="wide">有效期 <em>*</em><div class="dates"><ElDatePicker v-model="form.validFrom" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" :editable="false" /><span>至</span><ElDatePicker v-model="form.validTo" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" :editable="false" :disabled="form.forever" /><ElCheckbox v-model="form.forever">长期</ElCheckbox></div></label>
    </div>
    <template #footer><ElButton @click="open = false">取消</ElButton><ElButton type="primary" @click="save">保存品牌</ElButton></template>
  </ElDialog>
  <ElDialog v-model="qualificationOpen" title="经营资质" width="min(600px, 90vw)" append-to-body><div class="brand-form"><label class="wide">资质类型 <em>*</em><ElInput v-model="qualification.type" placeholder="填写资质类型" /></label><label class="wide">资质文件 <em>*</em><span class="upload"><input type="file" accept="image/jpeg,image/png,application/pdf" @change="uploadQualification" /><span>{{ qualification.documentName || '选择文件' }}</span></span></label><label class="wide">有效期 <em>*</em><div class="dates"><ElDatePicker v-model="qualification.validFrom" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" :editable="false" /><span>至</span><ElDatePicker v-model="qualification.validTo" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" :editable="false" :disabled="qualification.forever" /><ElCheckbox v-model="qualification.forever">长期</ElCheckbox></div></label></div><template #footer><ElButton @click="qualificationOpen = false">取消</ElButton><ElButton type="primary" @click="saveQualification">保存</ElButton></template></ElDialog>
  <ElDialog v-model="applyOpen" :width="applicationView === 'history' ? 'min(760px, 92vw)' : 'min(600px, 90vw)'" class="brand-application-dialog" append-to-body>
    <template #header><div class="application-header"><button v-if="applicationView !== 'form'" class="application-back" type="button" @click="applicationView='form'"><ArrowLeft :size="15"/>返回</button><h3>{{applicationView === 'history' ? '申请记录' : applicationView === 'success' ? '提交成功' : '申请新品牌'}}</h3><ElButton v-if="applicationView === 'form'" text type="primary" class="application-record-link" @click="applicationView='history'">申请记录<span v-if="draft.brandApplications.length">（{{draft.brandApplications.length}}）</span></ElButton></div></template>
    <template v-if="applicationView === 'form'"><p class="application-intro">填写品牌基础信息并提交审核；审核通过后可在品牌名称中选择。</p><div class="brand-form"><label>品牌名称 <em>*</em><ElInput v-model="application.name" placeholder="请输入中文名称" /></label><label>英文名称 <em>*</em><ElInput v-model="application.english" placeholder="请输入英文名称" /></label><label>英文首字母 <em>*</em><ElInput v-model="application.initial" maxlength="8" placeholder="例如 H" /></label><div class="application-image-field"><span>品牌图片 <em>*</em></span><div class="application-image-upload"><div class="application-image-thumb"><DemoImage :source="application.image" icon-only /></div><div class="application-image-actions"><label class="application-upload-button"><input type="file" accept="image/jpeg,image/png" @change="uploadApplication" />{{ application.imageName ? '更换图片' : '上传图片' }}</label><small :title="application.imageName">{{ application.imageName || '支持 JPG、PNG，不超过 10MB' }}</small><small v-if="application.image">点击图片可查看大图</small></div></div></div><label class="wide">品牌描述 <em>*</em><ElInput v-model="application.description" type="textarea" :rows="3" placeholder="介绍品牌定位和主营品类" /></label></div></template>
    <div v-else-if="applicationView === 'success'" class="application-success"><span class="success-icon"><Check :size="25"/></span><h3>提交成功</h3><p>请等待运营人员审核，预计 1–3 个工作日。</p></div>
    <div v-else class="application-history">
      <div v-if="!applicationRecords.length" class="application-empty"><strong>暂无申请记录</strong><p>提交品牌申请后，可以在这里查看审核进度。</p></div>
      <article v-for="{item,index} in applicationRecords" :key="index" class="application-record">
        <div class="record-image"><DemoImage :source="typeof item === 'string' ? '' : item.image" icon-only /></div>
        <div class="record-content">
          <div class="record-title"><strong>{{typeof item === 'string' ? item : item.name}}</strong><span class="record-status" :class="typeof item === 'string' ? 'pending' : item.status">{{typeof item === 'string' || item.status === 'pending' ? '审核中' : item.status === 'approved' ? '已通过' : '已驳回'}}</span></div>
          <template v-if="typeof item !== 'string'">
            <p v-if="item.english || item.initial" class="record-subtitle">{{item.english || '—'}} <span v-if="item.initial">· {{item.initial}}</span></p>
            <p v-if="item.description" class="record-description" :class="{'is-collapsed': item.description.length > 100 && !expandedDescriptions.includes(index)}">{{item.description}}</p>
            <button v-if="item.description && item.description.length > 100" type="button" class="record-description-toggle" @click="expandedDescriptions = expandedDescriptions.includes(index) ? expandedDescriptions.filter(i => i !== index) : [...expandedDescriptions,index]">{{expandedDescriptions.includes(index) ? '收起描述' : '展开描述'}}</button>
            <small>提交于 {{item.submittedAt || '未记录'}}<template v-if="item.reviewedAt"> · 处理于 {{item.reviewedAt}}</template></small>
            <p class="record-result" :class="item.status">{{item.status === 'pending' ? '审核中，预计 1–3 个工作日' : item.status === 'approved' ? '已可在品牌名称中选择' : `驳回原因：${item.reviewOpinion || '未记录'}`}}</p>
          </template><small v-else>提交时间未记录</small>
        </div>
      </article>
    </div>
    <template #footer><template v-if="applicationView === 'form'"><ElButton @click="applyOpen=false">取消</ElButton><ElButton type="primary" @click="apply">提交审核</ElButton></template><template v-else-if="applicationView === 'success'"><ElButton @click="applicationView='history'">查看申请记录</ElButton><ElButton type="primary" @click="applyOpen=false">知道了</ElButton></template><ElButton v-else type="primary" @click="applicationView='form'">继续申请</ElButton></template>
  </ElDialog>
</template>
<style scoped>
.business-card{background:#fff;border:1px solid #e2e8f2;border-radius:10px;padding:24px;margin-bottom:20px}.business-card h3{margin:0 0 20px;font-size:17px}.field-label,.brand-form label{display:block;font-size:13px;font-weight:600;color:#34445c}.field-label{margin-bottom:8px}em{font-style:normal;color:#df3e3a}.brand-head{display:flex;justify-content:space-between;align-items:center;margin:24px 0 12px;gap:12px}.brand-head h4{margin:0;font-size:14px}.brand-head p,.brand-row p{margin:4px 0;color:#69788d;font-size:12px}.actions{display:flex;align-items:center;gap:8px;white-space:nowrap}.actions :deep(.el-button){margin:0}.empty{border:1px dashed #dbe3ef;border-radius:8px;padding:24px;text-align:center;color:#69788d;font-size:13px}.brand-row{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px;border:1px solid #e2e8f2;border-radius:8px;margin-top:8px}.brand-row strong{font-size:14px}.brand-row small,.pending{color:#69788d;font-size:12px}.error{color:#d92622;font-size:12px}.brand-form{display:grid;grid-template-columns:1fr 1fr;gap:18px}.brand-form label>*{margin-top:7px}.wide{grid-column:1/-1}.dates{display:flex;align-items:center;gap:10px}.dates :deep(.el-date-editor){width:190px;height:40px;flex:none}.dates :deep(.el-checkbox){height:40px;margin:0;align-self:center}.dates>span{line-height:40px}.upload{display:flex;align-items:center;border:1px solid #dce3ee;border-radius:6px;padding:10px;color:#365dbe;position:relative}.upload input{position:absolute;inset:0;opacity:0;cursor:pointer}.brand-form small{display:block;color:#69788d;font-weight:400}
.application-header{display:flex;align-items:center;gap:12px;padding-right:34px}.application-header h3{margin:0;font-size:16px;color:#263950;flex:1}.application-record-link{margin:0!important}.application-back{display:flex;align-items:center;gap:3px;border:0;background:none;color:#687d99;padding:2px 0;font:inherit;font-size:13px;cursor:pointer}.application-intro{margin:0 0 18px;color:#687a92;font-size:13px;line-height:1.6}.application-history{display:grid;gap:10px;max-height:54vh;overflow:auto}.application-record{padding:14px 16px;border:1px solid #e4eaf2;border-radius:8px}.record-title{display:flex;align-items:center;justify-content:space-between;gap:12px}.record-title strong{font-size:14px;color:#263a55}.record-status{flex:none;padding:3px 9px;border-radius:14px;font-size:12px}.record-status.pending{background:#fff7e8;color:#a76818}.record-status.approved{background:#eaf8f1;color:#167c5f}.record-status.rejected{background:#fff0ef;color:#b74239}.application-record p{margin:6px 0;color:#71839a;font-size:12px;line-height:1.5;overflow-wrap:anywhere}.application-record small{display:block;margin-top:8px;color:#8a99ad;font-size:12px}.application-record .record-result.pending{color:#a76818}.application-record .record-result.approved{color:#167c5f}.application-record .record-result.rejected{color:#b74239}.application-empty,.application-success{text-align:center;padding:34px 12px;color:#71839a;font-size:13px}.application-empty strong,.application-success h3{color:#263a55;font-size:15px}.application-empty p,.application-success p{margin:9px 0 0}.success-icon{display:grid;place-items:center;width:48px;height:48px;margin:0 auto 14px;border-radius:50%;background:#e9f8f0;color:#1a9b6d}.application-success h3{margin:0}
.application-image-field{font-size:13px;font-weight:600;color:#34445c}.application-image-upload{display:flex;align-items:center;gap:12px;margin-top:7px}.application-image-thumb,.record-image{width:56px;height:56px;flex:none;overflow:hidden;border:1px solid #e3eaf3;border-radius:8px;background:#f5f7fb}.application-image-actions{display:grid;gap:4px;min-width:0}.application-image-actions small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;font-size:11px}.brand-form .application-upload-button{position:relative;width:max-content;margin:0;padding:0;color:#365dbe;font-size:12px;font-weight:500;cursor:pointer}.application-upload-button input{position:absolute;inset:0;width:100%;opacity:0;cursor:pointer}.application-record{display:flex;align-items:flex-start;gap:14px}.record-content{min-width:0;flex:1}.record-image{width:60px;height:60px}.record-title strong{min-width:0;overflow-wrap:anywhere}.record-description.is-collapsed{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}.record-description-toggle{border:0;padding:0;background:none;color:#365dbe;font-size:12px;cursor:pointer}.application-history{padding-right:4px}
</style>

<style scoped>.warehouse-counts{display:flex;gap:24px;margin-bottom:16px}.warehouse-counts label,.warehouse-fields label{display:grid;gap:7px;color:#34445c;font-size:13px;font-weight:600}.warehouse-row{padding:14px;border:1px solid #e2e8f2;border-radius:8px;margin-top:10px}.warehouse-head{display:flex;align-items:center;justify-content:space-between}.warehouse-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:12px}.warehouse-fields .wide{grid-column:1/-1}</style>
