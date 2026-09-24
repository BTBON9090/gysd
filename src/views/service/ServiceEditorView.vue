<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { ElButton, ElCascader, ElCheckbox, ElCheckboxGroup, ElDialog, ElInput, ElInputNumber, ElMessage, ElMessageBox, ElOption, ElSelect } from 'element-plus'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Building2, Check, Eye, HeartHandshake, ImagePlus, Plus, Save, Trash2 } from 'lucide-vue-next'
import ServicePreview from '@/components/service/ServicePreview.vue'
import DemoImage from '@/components/commerce/DemoImage.vue'
import DemoMedia from '@/components/commerce/DemoMedia.vue'
import { saveDemoImage, saveDemoVideo } from '@/utils/demoMedia'
import { CATEGORY_TREE, REGION_OPTIONS, clone, emptyService, useCommerceStore, type Case, type Service } from '@/stores/commerce'

const c = useCommerceStore()
const router = useRouter()
const route = useRoute()
const existing = c.data.services.find(item => item.id === route.params.id)
const form = reactive<Service>(existing ? clone(existing) : emptyService())
const requestedStep = () => Math.min(4, Math.max(1, Number(route.query.step) || 1))
const step = ref(existing ? requestedStep() : 1)
const furthestStep = ref(existing ? 4 : 1)
watch(() => route.query.step, () => { if (existing) { step.value = requestedStep(); scrollTop() } })
const completedSteps = ref<number[]>([])
const scrollArea = ref<HTMLElement | null>(null)
const chosenParks = ref<string[]>([])
const saved = ref(JSON.stringify(form))
const hasSavedDraft = ref(Boolean(existing))
const allowLeave = ref(false)
const uploading = ref(false)
const errors = reactive<Record<string, string>>({})
const caseOpen = ref(false)
const previewOpen = ref(false)
const exitDialog = ref(false)
const inlineCase = reactive<Case>({ id: '', category: '', title: '', intro: '', cover: '', createdAt: '' })
const headings = ['基础信息', '服务详情', '定价与交付', '提交预览']
const dirty = computed(() => saved.value !== JSON.stringify(form))
const linkedCases = computed(() => c.data.cases.filter(item => form.caseIds.includes(item.id)))
const options = computed(() => c.joinedParks.filter(park => !['on_sale', 'reviewing'].includes(form.listings[park.id]?.status || 'draft')))
const imageSources = computed(() => form.images.filter(source => /^(local-image:|data:image\/|blob:|https?:\/)/.test(source)))
const coverSource = computed(() => /^(local-image:|data:image\/|blob:|https?:\/)/.test(form.cover) ? form.cover : '')
const mediaImageSources = computed(() => form.media.filter(source => !source.startsWith('local-video:') && /^(local-image:|data:image\/|blob:|https?:\/)/.test(source)))

async function confirmUnsavedChanges() {
  if (allowLeave.value || !dirty.value) return true
  try {
    await ElMessageBox.confirm('当前有未保存的服务资料。离开后这些修改将丢失。', '离开发布服务？', { confirmButtonText: '离开', cancelButtonText: '继续编辑', type: 'warning' })
    return true
  } catch { return false }
}
onBeforeRouteLeave(confirmUnsavedChanges)
onBeforeRouteUpdate(confirmUnsavedChanges)

function clearErrors() { Object.keys(errors).forEach(key => delete errors[key]) }
function focusFirstError() {
  nextTick(() => {
    const first = scrollArea.value?.querySelector<HTMLElement>('.field-error')
    first?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    first?.closest('.biz-field')?.querySelector<HTMLElement>('input,textarea,[role="combobox"]')?.focus({ preventScroll: true })
  })
}
function validate(target: number) {
  clearErrors()
  if (target === 1) {
    if (form.category.split(' / ').length !== 3) errors.category = '请选择末级服务分类'
    if (!form.name.trim() || form.name.length > 60) errors.name = '请填写 1–60 字服务名称'
    if (!form.intro.trim() || form.intro.length > 500) errors.intro = '请填写 1–500 字服务简介'
    if (!coverSource.value) errors.cover = '请上传服务封面'
  }
  if (target === 2) {
    if (!form.detail.trim()) errors.detail = '请填写服务详情'
    if (!form.guarantee.trim()) errors.guarantee = '请填写服务保障说明'
    form.faqs.forEach((faq, index) => {
      if (!faq.question.trim()) errors[`faq-${index}-question`] = '请填写问题'
      if (!faq.answer.trim()) errors[`faq-${index}-answer`] = '请填写回答'
    })
  }
  if (target === 3) {
    if (!form.specs.length || form.specs.length > 3) errors.specCount = '请保留 1–3 个规格'
    form.specs.forEach((spec, index) => {
      if (!spec.name.trim()) errors[`spec-${index}-name`] = '请填写规格名称'
      if (!spec.point.trim()) errors[`spec-${index}-point`] = '请填写规格卖点'
      if (!Number.isFinite(spec.price) || spec.price <= 0) errors[`spec-${index}-price`] = '价格须大于 0 元'
      if (!spec.unit) errors[`spec-${index}-unit`] = '请选择计价单位'
      if (!Number.isFinite(spec.startDays) || spec.startDays < 0) errors[`spec-${index}-startDays`] = '请选择有效的开始时间'
      if (!Number.isFinite(spec.deliveryDays) || spec.deliveryDays < 1 || spec.deliveryDays > 9999) errors[`spec-${index}-deliveryDays`] = '交付周期为 1–9999 天'
      if (!spec.standard.trim()) errors[`spec-${index}-standard`] = '请填写交付标准'
    })
  }
  if (target === 4 && !chosenParks.value.length) errors.parks = '请至少选择一个可提交的园区'
  return Object.keys(errors).length === 0
}
function scrollTop() { nextTick(() => scrollArea.value?.scrollTo({ top: 0, behavior: 'smooth' })) }
function goStep(target: number) {
  if (uploading.value || target === step.value) return
  if (target > furthestStep.value) {
    for (let current = step.value; current < target; current++) {
      if (!validate(current)) { step.value = current; focusFirstError(); return }
      if (!completedSteps.value.includes(current)) completedSteps.value.push(current)
    }
    furthestStep.value = Math.max(furthestStep.value, target)
  }
  clearErrors()
  step.value = target
  scrollTop()
}
function next() {
  if (!validate(step.value)) { focusFirstError(); return }
  if (!completedSteps.value.includes(step.value)) completedSteps.value.push(step.value)
  furthestStep.value = Math.max(furthestStep.value, step.value + 1)
  step.value = Math.min(4, step.value + 1)
  clearErrors()
  scrollTop()
}
function saveDraft() {
  if (uploading.value) return
  c.saveService(form)
  saved.value = JSON.stringify(form)
  hasSavedDraft.value = true
  ElMessage.success('草稿已保存')
}
function submit() {
  if (uploading.value) return
  for (let current = 1; current <= 4; current++) {
    if (!validate(current)) { step.value = current; focusFirstError(); return }
  }
  c.saveService(form, chosenParks.value)
  saved.value = JSON.stringify(form)
  allowLeave.value = true
  router.push('/service/submitted')
}
function exit() { if (dirty.value) exitDialog.value = true; else router.push('/service') }
function saveAndExit() { saveDraft(); if (dirty.value) return; exitDialog.value = false; allowLeave.value = true; router.push('/service') }
function discardAndExit() { exitDialog.value = false; allowLeave.value = true; router.push('/service') }

async function addFiles(event: Event, key: 'cover' | 'media' | 'images') {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  input.value = ''
  if (!files.length) return
  const maxCount = key === 'cover' ? 1 : key === 'media' ? 8 : 20
  const remaining = key === 'cover' ? 1 : Math.max(0, maxCount - form[key].length)
  if (!remaining) { ElMessage.warning(`最多上传 ${maxCount} 个文件`); return }
  const valid = files.filter(file => {
    const isVideo = key === 'media' && file.type === 'video/mp4'
    const imageTypes = key === 'images' ? ['image/jpeg', 'image/png'] : ['image/jpeg', 'image/png', 'image/webp']
    const validType = isVideo || imageTypes.includes(file.type)
    const maxMb = isVideo ? 50 : key === 'images' ? 5 : 10
    return validType && file.size <= maxMb * 1024 * 1024
  })
  if (valid.length !== files.length) ElMessage.error('部分文件格式或大小不符合要求，已跳过')
  if (valid.length > remaining) ElMessage.warning(`最多上传 ${maxCount} 个文件，超出部分未添加`)
  if (!valid.length) return
  uploading.value = true
  try {
    const sources = await Promise.all(valid.slice(0, remaining).map(file => file.type === 'video/mp4' ? saveDemoVideo(file) : saveDemoImage(file)))
    if (key === 'cover') { form.cover = sources[0]; delete errors.cover }
    else form[key].push(...sources)
  } catch { ElMessage.error('文件保存失败，请重试') }
  finally { uploading.value = false }
}
function moveFaq(index: number, direction: -1 | 1) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= form.faqs.length) return
  const [faq] = form.faqs.splice(index, 1)
  form.faqs.splice(nextIndex, 0, faq)
}
function openCase() {
  Object.assign(inlineCase, { id: crypto.randomUUID(), category: form.category, title: '', intro: '', cover: '', createdAt: new Date().toISOString() })
  caseOpen.value = true
}
function saveInlineCase() {
  if (inlineCase.category.split(' / ').length !== 3 || !inlineCase.title.trim() || !inlineCase.intro.trim() || !inlineCase.cover) { ElMessage.error('请完整填写案例分类、标题、介绍与封面'); return }
  c.saveCase(inlineCase)
  if (form.caseIds.length < 6) form.caseIds.push(inlineCase.id)
  caseOpen.value = false
  ElMessage.success('案例已保存并关联')
}
async function caseFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { ElMessage.error('案例封面需为不超过 10MB 的 JPG、PNG 或 WEBP 图片'); return }
  uploading.value = true
  try { inlineCase.cover = await saveDemoImage(file) }
  catch { ElMessage.error('案例封面保存失败，请重试') }
  finally { uploading.value = false }
}
</script>

<template>
  <div class="biz-page editor-page">
    <div class="editor-top">
      <div class="editor-top-inner">
        <div class="editor-heading"><span class="editor-heading-icon"><HeartHandshake :size="22" /></span><div><h1>{{ existing ? '编辑服务' : '发布服务' }}</h1><p>完善服务资料后，选择园区提交审核。</p></div><span class="editor-save-state" :class="{ saved: !dirty && hasSavedDraft, unsaved: dirty }"><Check v-if="!dirty && hasSavedDraft" :size="14" />{{ dirty ? '有未保存更改' : hasSavedDraft ? '草稿已保存' : '尚未保存' }}</span></div>
        <nav class="editor-steps" aria-label="发布服务步骤"><button v-for="(heading,index) in headings" :key="heading" type="button" class="editor-step" :class="{ active: step === index + 1, done: completedSteps.includes(index + 1) }" :aria-current="step === index + 1 ? 'step' : undefined" @click="goStep(index + 1)"><span class="editor-step-dot"><Check v-if="completedSteps.includes(index + 1)" :size="15" /><template v-else>{{ index + 1 }}</template></span><span>{{ heading }}</span><i v-if="index < headings.length - 1" /></button></nav>
      </div>
    </div>

    <div ref="scrollArea" class="editor-scroll"><div class="editor-content">
      <template v-if="step === 1">
        <div class="editor-stage-head"><span>01 / 04</span><h2>基础信息</h2><p>先定义服务的名称与分类，再添加客户浏览时首先看到的素材。</p></div>
        <section class="editor-group"><div class="editor-group-head"><h3>服务档案</h3><p>名称、分类与简介决定服务如何被找到和理解。</p></div><div class="editor-grid"><label class="biz-field">服务分类 <b class="required">*</b><ElCascader :model-value="form.category ? form.category.split(' / ') : []" :options="CATEGORY_TREE" filterable clearable placeholder="选择末级分类" @change="form.category = Array.isArray($event) ? $event.join(' / ') : ''" /><small v-if="errors.category" class="field-error">{{ errors.category }}</small></label><label class="biz-field">服务名称 <b class="required">*</b><ElInput v-model="form.name" maxlength="60" show-word-limit placeholder="填写服务名称" /><small v-if="errors.name" class="field-error">{{ errors.name }}</small></label><label class="biz-field full">服务简介 <b class="required">*</b><ElInput v-model="form.intro" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="概述适用客户、服务内容与主要价值" /><small v-if="errors.intro" class="field-error">{{ errors.intro }}</small></label></div></section>
        <section class="editor-group"><div class="editor-group-head"><h3>展示素材</h3><p>封面用于服务列表；详情媒体可展示交付场景或服务过程。</p></div><div class="editor-media-columns"><div class="editor-upload-block"><div class="upload-heading"><strong>服务封面 <b class="required">*</b></strong><small>JPG、PNG、WEBP · ≤10MB</small></div><label class="editor-cover-upload"><DemoImage :source="coverSource" empty-text="上传服务封面" /><span><ImagePlus :size="15" />{{ coverSource ? '更换封面' : '点击上传封面' }}</span><input type="file" accept="image/jpeg,image/png,image/webp" @change="addFiles($event,'cover')" /></label><small v-if="errors.cover" class="field-error">{{ errors.cover }}</small></div><div class="editor-upload-block"><div class="upload-heading"><strong>详情媒体</strong><small>最多 8 个 · 图片 ≤10MB / MP4 ≤50MB</small></div><div class="editor-media-grid"><div v-for="(source,index) in form.media" :key="`${source}-${index}`" class="editor-media-tile"><DemoMedia :source="source" :sources="mediaImageSources" /><button type="button" class="media-remove" title="移除文件" @click="form.media.splice(index,1)"><Trash2 :size="14" /></button></div><label v-if="form.media.length < 8" class="editor-add-tile"><ImagePlus :size="20" /><span>添加媒体</span><input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4" @change="addFiles($event,'media')" /></label></div></div></div></section>
        <section class="editor-group"><div class="editor-group-head"><h3>服务区域</h3><p>未选择时表示不限制区域。</p></div><ElCascader class="regions-field" :model-value="form.regions.map(value => value.split(' / '))" :options="REGION_OPTIONS" :props="{ multiple: true, emitPath: true }" clearable filterable collapse-tags :max-collapse-tags="8" collapse-tags-tooltip placeholder="搜索并选择省 / 市，可多选" @change="form.regions = Array.isArray($event) ? ($event as string[][]).map(value => value.join(' / ')) : []" /></section>
      </template>

      <template v-else-if="step === 2">
        <div class="editor-stage-head"><span>02 / 04</span><h2>服务详情</h2><p>描述交付内容与保障，再用图片、案例和常见问题补充证据。</p></div>
        <section class="editor-group"><div class="editor-group-head"><h3>内容与保障</h3><p>写清服务范围、交付方式及客户可获得的保障。</p></div><div class="editor-grid"><label class="biz-field full">服务详情 <b class="required">*</b><ElInput v-model="form.detail" type="textarea" :rows="5" maxlength="5000" show-word-limit placeholder="说明服务内容、流程和交付成果" /><small v-if="errors.detail" class="field-error">{{ errors.detail }}</small></label><label class="biz-field full">服务保障说明 <b class="required">*</b><ElInput v-model="form.guarantee" type="textarea" :rows="3" maxlength="2000" show-word-limit placeholder="说明履约、售后与支持方式" /><small v-if="errors.guarantee" class="field-error">{{ errors.guarantee }}</small></label></div></section>
        <section class="editor-group"><div class="editor-group-head"><h3>服务图片</h3><p>最多 20 张，单张 ≤5MB；上传后可点击缩略图放大查看。</p></div><div class="editor-gallery"><div v-for="(source,index) in form.images" :key="`${source}-${index}`" class="editor-media-tile"><DemoImage :source="source" :sources="imageSources" /><button type="button" class="media-remove" title="移除图片" @click="form.images.splice(index,1)"><Trash2 :size="14" /></button></div><label v-if="form.images.length < 20" class="editor-add-tile"><ImagePlus :size="20" /><span>添加图片</span><input type="file" multiple accept="image/jpeg,image/png" @change="addFiles($event,'images')" /></label></div><small class="editor-count">{{ form.images.length }} / 20 张</small></section>
        <section class="editor-group"><div class="editor-group-head"><h3>关联案例</h3><p>从店铺案例库选择，最多关联 6 个；也可在这里新建。</p></div><div class="case-selection"><ElSelect v-model="form.caseIds" multiple :multiple-limit="6" collapse-tags :max-collapse-tags="3" placeholder="选择店铺案例"><ElOption v-for="item in c.data.cases" :key="item.id" :label="item.title" :value="item.id" /></ElSelect><ElButton @click="openCase"><Plus :size="14" />新建案例</ElButton></div><div v-if="linkedCases.length" class="linked-cases"><span v-for="item in linkedCases" :key="item.id" :title="item.title">{{ item.title }}</span></div></section>
        <section class="editor-group"><div class="editor-group-head faq-head"><div><h3>常见问题</h3><p>按客户阅读顺序排列，最多 10 组；问题与回答需成对填写。</p></div><ElButton :disabled="form.faqs.length >= 10" @click="form.faqs.push({ question: '', answer: '' })"><Plus :size="14" />添加问题</ElButton></div><div v-if="!form.faqs.length" class="editor-empty-note">暂无常见问题。可添加客户在下单前最关心的问题。</div><div v-for="(faq,index) in form.faqs" :key="index" class="faq-card"><div class="faq-card-head"><strong>{{ String(index + 1).padStart(2, '0') }}</strong><span>问题 {{ index + 1 }}</span><div class="faq-card-actions"><button type="button" :disabled="index === 0" title="上移" @click="moveFaq(index,-1)"><ArrowUp :size="15" /></button><button type="button" :disabled="index === form.faqs.length - 1" title="下移" @click="moveFaq(index,1)"><ArrowDown :size="15" /></button><button type="button" title="删除问题" @click="form.faqs.splice(index,1)"><Trash2 :size="15" /></button></div></div><div class="editor-grid"><label class="biz-field">问题 <ElInput v-model="faq.question" maxlength="30" show-word-limit placeholder="输入客户可能提出的问题" /><small v-if="errors[`faq-${index}-question`]" class="field-error">{{ errors[`faq-${index}-question`] }}</small></label><label class="biz-field">回答 <ElInput v-model="faq.answer" maxlength="200" show-word-limit placeholder="给出明确、简短的回答" /><small v-if="errors[`faq-${index}-answer`]" class="field-error">{{ errors[`faq-${index}-answer`] }}</small></label></div></div></section>
      </template>

      <template v-else-if="step === 3">
        <div class="editor-stage-head"><span>03 / 04</span><h2>定价与交付</h2><p>设置客户可选择的规格，确认平台规则和交付承诺。</p></div>
        <section class="editor-group"><div class="editor-group-head"><h3>平台规则与发票</h3><p>比例和售后期由运营配置，提交前请核对。</p></div><div class="editor-grid"><div class="biz-field">平台分账比例 <ElInput model-value="10%（演示配置）" disabled /></div><div class="biz-field">售后期 <ElInput model-value="7 个自然日（演示配置）" disabled /></div><label class="biz-field">发票税率 <ElSelect v-model="form.taxRate"><ElOption v-for="rate in [0,1,6,9,13]" :key="rate" :label="`${rate}%`" :value="rate" /></ElSelect></label></div><p class="editor-rule-note">平台按服务所属末级类目的配置收取平台费；售后期自验收完成起算。售后期结束且无未解决售后时进入结算。以上比例和天数为演示配置。</p></section>
        <section class="editor-group">
          <div class="editor-group-head spec-head"><div><h3>服务规格</h3><p>1–3 个规格 · 一次性付款 · 一次性验收</p></div><ElButton :disabled="form.specs.length >= 3" @click="form.specs.push({ name: '', point: '', price: 0, unit: '项', startDays: 0, dayType: '自然日', deliveryDays: 1, standard: '' })"><Plus :size="14" />添加规格</ElButton></div>
          <p v-if="errors.specCount" class="field-error">{{ errors.specCount }}</p>
          <article v-for="(spec,index) in form.specs" :key="index" class="spec-card">
            <div class="spec-card-head"><span>规格 {{ String(index + 1).padStart(2, '0') }}</span><ElButton v-if="form.specs.length > 1" text type="danger" @click="form.specs.splice(index,1)"><Trash2 :size="14" />删除</ElButton></div>
            <div class="spec-fields">
              <label class="biz-field spec-name">规格名称 <b class="required">*</b><ElInput v-model="spec.name" maxlength="30" placeholder="如标准版" /><small v-if="errors[`spec-${index}-name`]" class="field-error">{{ errors[`spec-${index}-name`] }}</small></label>
              <label class="biz-field spec-point">卖点 <b class="required">*</b><ElInput v-model="spec.point" maxlength="100" placeholder="概括该规格的主要价值" /><small v-if="errors[`spec-${index}-point`]" class="field-error">{{ errors[`spec-${index}-point`] }}</small></label>
              <label class="biz-field spec-price">价格（元） <b class="required">*</b><ElInputNumber v-model="spec.price" :min="0" :precision="2" :step="100" /><small v-if="errors[`spec-${index}-price`]" class="field-error">{{ errors[`spec-${index}-price`] }}</small></label>
              <label class="biz-field spec-unit">计价单位 <b class="required">*</b><ElSelect v-model="spec.unit"><ElOption v-for="unit in ['项','次','件']" :key="unit" :label="unit" :value="unit" /></ElSelect><small v-if="errors[`spec-${index}-unit`]" class="field-error">{{ errors[`spec-${index}-unit`] }}</small></label>
              <label class="biz-field spec-start">支付后开始时间 <b class="required">*</b><span class="spec-days"><ElInputNumber v-model="spec.startDays" :min="0" /><ElSelect v-model="spec.dayType"><ElOption label="自然日" value="自然日" /><ElOption label="工作日" value="工作日" /></ElSelect></span><small v-if="errors[`spec-${index}-startDays`]" class="field-error">{{ errors[`spec-${index}-startDays`] }}</small></label>
              <label class="biz-field spec-delivery">交付周期（天） <b class="required">*</b><ElInputNumber v-model="spec.deliveryDays" :min="1" :max="9999" /><small v-if="errors[`spec-${index}-deliveryDays`]" class="field-error">{{ errors[`spec-${index}-deliveryDays`] }}</small></label>
              <label class="biz-field spec-standard">交付标准 <b class="required">*</b><ElInput v-model="spec.standard" type="textarea" :rows="2" maxlength="500" show-word-limit placeholder="明确验收时应交付的内容" /><small v-if="errors[`spec-${index}-standard`]" class="field-error">{{ errors[`spec-${index}-standard`] }}</small></label>
            </div>
          </article>
        </section>
      </template>

      <template v-else>
        <div class="editor-stage-head"><span>04 / 04</span><h2>提交预览</h2><p>确认服务展示内容与目标园区，提交后各园区分别进入审核。</p></div>
        <section class="editor-group"><div class="editor-group-head"><h3>选择提交园区 <b class="required">*</b></h3><p>已上架或审核中的园区暂不可重复提交。</p></div><ElCheckboxGroup v-model="chosenParks" class="park-select"><ElCheckbox v-for="park in options" :key="park.id" :value="park.id" class="park-choice"><span class="park-choice-icon"><Building2 :size="19" /></span><span class="park-choice-copy"><strong>{{ park.name }}</strong><small>提交后由该园区独立审核</small></span></ElCheckbox></ElCheckboxGroup><p v-if="errors.parks" class="field-error">{{ errors.parks }}</p><p v-if="!options.length" class="editor-empty-note">暂无可提交园区。请查看当前园区上架状态。</p></section>
        <section class="editor-group"><div class="editor-group-head preview-head"><div><h3>电脑端展示预览</h3><p>检查封面、规格、详情、案例和常见问题的呈现。</p></div><ElButton @click="previewOpen = true"><Eye :size="15" />展开预览</ElButton></div><div class="editor-preview"><ServicePreview :service="form" /></div></section>
      </template>
    </div></div>

    <footer class="editor-footer"><div class="editor-footer-inner"><div class="editor-footer-left"><button type="button" class="editor-link" @click="exit"><ArrowLeft :size="15" />返回服务管理</button><button type="button" class="editor-link save-link" :disabled="uploading" @click="saveDraft"><Save :size="15" />保存草稿</button></div><div class="editor-footer-right"><ElButton v-if="step > 1" @click="goStep(step - 1)"><ArrowLeft :size="15" />上一步</ElButton><ElButton v-if="step < 4" type="primary" :disabled="uploading" @click="next">下一步<ArrowRight :size="15" /></ElButton><ElButton v-else type="primary" :disabled="uploading" @click="submit">提交审核<ArrowRight :size="15" /></ElButton></div></div></footer>

    <ElDialog v-model="exitDialog" title="返回服务管理" width="440px" append-to-body><p class="exit-dialog-copy">当前有未保存的修改。可以暂存草稿后返回，也可以放弃本次修改。</p><template #footer><ElButton @click="exitDialog = false">继续编辑</ElButton><ElButton @click="discardAndExit">放弃修改</ElButton><ElButton type="primary" :disabled="uploading" @click="saveAndExit"><Save :size="14" />保存草稿并返回</ElButton></template></ElDialog>
    <ElDialog v-model="previewOpen" title="客户端服务详情预览" width="min(920px, calc(100vw - 80px))" append-to-body><ServicePreview :service="form" /></ElDialog>
    <ElDialog v-model="caseOpen" title="新建案例并关联" width="620px" append-to-body><div class="editor-grid"><label class="biz-field full">案例分类 <b class="required">*</b><ElCascader :model-value="inlineCase.category ? inlineCase.category.split(' / ') : []" :options="CATEGORY_TREE" filterable clearable placeholder="选择末级分类" @change="inlineCase.category = Array.isArray($event) ? $event.join(' / ') : ''" /></label><label class="biz-field full">标题 <b class="required">*</b><ElInput v-model="inlineCase.title" maxlength="60" show-word-limit /></label><label class="biz-field full">介绍 <b class="required">*</b><ElInput v-model="inlineCase.intro" type="textarea" :rows="3" maxlength="500" show-word-limit /></label><div class="biz-field full">封面 <b class="required">*</b><div class="case-cover-field"><div class="case-cover-image"><DemoImage :source="inlineCase.cover" empty-text="上传案例封面" /></div><label class="case-cover-upload"><ImagePlus :size="15" />{{ inlineCase.cover ? '更换封面' : '上传封面' }}<input type="file" accept="image/jpeg,image/png,image/webp" @change="caseFile" /></label></div></div></div><template #footer><ElButton @click="caseOpen = false">取消</ElButton><ElButton type="primary" :disabled="uploading" @click="saveInlineCase">保存并关联</ElButton></template></ElDialog>
  </div>
</template>

<style scoped>
.editor-page{display:flex;flex-direction:column;width:100%;max-width:none;min-width:800px;height:100%;min-height:0;margin:0;padding:0;overflow:hidden;color:#20304a;background:#fff}
.editor-top{flex:none;border-bottom:1px solid #e4eaf3;background:#fff}
.editor-top-inner{max-width:1130px;margin:auto;padding:16px 30px 0}
.editor-heading{display:flex;align-items:center;gap:13px;margin-bottom:17px}
.editor-heading-icon{display:grid;place-items:center;width:40px;height:40px;flex:none;border-radius:9px;background:#eaf0ff;color:#3659c2}
.editor-heading h1{margin:0 0 3px;font-size:22px;line-height:1.3}
.editor-heading p{margin:0;color:#738198;font-size:12px}
.editor-save-state{display:inline-flex;align-items:center;gap:5px;margin-left:auto;padding:5px 8px;border-radius:6px;color:#8492a5;font-size:12px;white-space:nowrap}
.editor-save-state.saved{background:#eaf7f1;color:#13835f;font-weight:700}.editor-save-state.unsaved{background:#fff5e6;color:#966322;font-weight:650}
.editor-steps{display:flex;align-items:center;margin:0;padding:0 0 14px}
.editor-step{display:flex;align-items:center;flex:1;min-width:0;gap:8px;padding:0;border:0;background:transparent;color:#75849a;font:inherit;font-size:12px;white-space:nowrap;cursor:pointer}
.editor-step:last-child{flex:none}
.editor-step-dot{display:grid;place-items:center;flex:none;width:25px;height:25px;border-radius:50%;background:#edf1f8;color:#63738c;font-size:12px;font-weight:700}
.editor-step.active{color:#264ab2;font-weight:700}.editor-step.active .editor-step-dot{background:#3559bf;color:#fff;box-shadow:0 0 0 4px #edf2ff}
.editor-step.done{color:#1f8d85;font-weight:650}.editor-step.done .editor-step-dot{background:#16958c;color:#fff}
.editor-step i{display:block;flex:1;height:1px;min-width:12px;margin:0 10px;background:#cbd9ee}
.editor-step.done i{background:#84ccc5}
.editor-step:hover:not(.active){color:#3157b9}
.editor-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;scroll-behavior:smooth}
.editor-content{max-width:980px;margin:0 auto;padding:22px 30px 60px}
.editor-stage-head{margin-bottom:29px}
.editor-stage-head>span{display:inline-block;margin-bottom:6px;color:#4766bf;font-size:11px;font-weight:750;letter-spacing:.08em}
.editor-stage-head h2{margin:0 0 5px;font-size:23px;color:#1c2d48}
.editor-stage-head p{margin:0;color:#6b7b91;font-size:13px}
.editor-group{padding:28px 0 31px;border-top:1px solid #e5ebf3}
.editor-group:first-of-type{border-top:0;padding-top:0}
.editor-group-head{margin-bottom:14px;padding-left:12px;border-left:3px solid #2cafa5}
.editor-group-head h3{margin:0 0 3px;font-size:16px;color:#22334c}
.editor-group-head h3 .required{font-size:13px}
.editor-group-head p{margin:0;color:#8190a4;font-size:12px;line-height:1.5}
.editor-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 18px}
.editor-grid .full{grid-column:1/-1}
.editor-grid :deep(.el-input),.editor-grid :deep(.el-select),.editor-grid :deep(.el-cascader),.editor-grid :deep(.el-input-number){width:100%;min-width:0}
.editor-grid :deep(.el-select__wrapper){flex:1;min-width:0}
.editor-media-columns{display:grid;grid-template-columns:190px minmax(0,1fr);gap:28px}
.upload-heading{display:grid;gap:4px;margin-bottom:10px}.upload-heading strong{font-size:13px;color:#34445c}.upload-heading small{font-size:11px;color:#8492a6}
.editor-cover-upload{position:relative;display:block;width:170px;height:165px;overflow:hidden;border:1px dashed #c7d5eb;border-radius:10px;background:#f5f8fd;cursor:pointer}
.editor-cover-upload :deep(.demo-image){height:128px;pointer-events:none}.editor-cover-upload>span{display:flex;align-items:center;justify-content:center;gap:5px;height:37px;color:#3159c0;font-size:12px;font-weight:650}
.editor-cover-upload input,.editor-add-tile input,.case-cover-upload input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;font-size:0}
.editor-cover-upload:hover,.editor-add-tile:hover{border-color:#6687d4;background:#f1f5ff}
.editor-media-grid,.editor-gallery{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.editor-media-tile,.editor-add-tile{position:relative;height:112px;min-width:0;overflow:hidden;border:1px solid #dfe7f1;border-radius:9px;background:#f5f8fd}
.editor-add-tile{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;border-style:dashed;color:#4566bc;font-size:12px;font-weight:650;cursor:pointer}
.media-remove{position:absolute;top:5px;right:5px;display:grid;place-items:center;width:25px;height:25px;border:0;border-radius:6px;background:#fff;color:#b6423a;cursor:pointer}
.regions-field{width:100%}.editor-page :deep(.el-cascader){max-width:100%}
.editor-count{display:block;margin-top:7px;color:#8492a5;font-size:11px}
.case-selection{display:flex;align-items:center;gap:10px}.case-selection :deep(.el-select){flex:1;min-width:0;max-width:500px}
.linked-cases{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.linked-cases span{max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:5px 8px;border-radius:6px;background:#eef3ff;color:#3458b9;font-size:11px}
.faq-head,.spec-head,.preview-head{display:flex;align-items:center;justify-content:space-between;gap:15px}
.faq-head>div,.spec-head>div,.preview-head>div{min-width:0}.faq-head :deep(.el-button),.spec-head :deep(.el-button),.preview-head :deep(.el-button){flex:none}
.editor-empty-note{padding:20px;border:1px dashed #dbe4f1;border-radius:9px;background:#fbfcff;color:#8290a4;font-size:12px}
.faq-card{padding:14px 16px;margin-top:10px;border:1px solid #e0e7f1;border-radius:9px;background:#fbfcff}
.faq-card-head{display:flex;align-items:center;gap:8px;margin-bottom:13px}.faq-card-head strong{color:#3b60bf;font-size:13px}.faq-card-head span{color:#53647d;font-size:12px;font-weight:650}
.faq-card-actions{display:flex;gap:3px;margin-left:auto}.faq-card-actions button{display:grid;place-items:center;width:27px;height:27px;border:0;border-radius:6px;background:transparent;color:#61718a;cursor:pointer}.faq-card-actions button:hover:not(:disabled){background:#eaf0ff;color:#3358bd}.faq-card-actions button:last-child:hover{background:#fff0ef;color:#b9433a}.faq-card-actions button:disabled{opacity:.35;cursor:default}
.editor-rule-note{margin:18px 0 0;padding:12px 14px;border-radius:8px;background:#f2f6ff;color:#546986;font-size:12px;line-height:1.7}
.spec-card{margin-top:16px;padding:18px 20px;border:1px solid #dfe7f1;border-radius:10px;background:#fbfcff}
.spec-card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px;color:#3458b9;font-size:14px;font-weight:700}
.spec-fields{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:14px 12px;align-items:start}
.spec-fields .biz-field{min-width:0}.spec-name{grid-column:span 4}.spec-point{grid-column:span 8}.spec-price{grid-column:span 3}.spec-unit{grid-column:span 2}.spec-start{grid-column:span 4}.spec-delivery{grid-column:span 3}.spec-standard{grid-column:1/-1}
.spec-fields :deep(.el-input),.spec-fields :deep(.el-select),.spec-fields :deep(.el-input-number),.spec-fields :deep(.el-textarea){width:100%;min-width:0}
.spec-fields :deep(.el-select__wrapper){flex:1;min-width:0}
.spec-fields .field-error{color:#bd3f3b;font-weight:600}
.spec-days{display:grid;grid-template-columns:minmax(95px,1fr) 100px;gap:7px;margin-top:7px}
.spec-days :deep(.el-input-number),.spec-days :deep(.el-select){margin-top:0}
.park-select{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.park-select :deep(.el-checkbox.park-choice){display:flex;align-items:center;min-width:0;min-height:82px;margin:0;padding:14px 15px;border:1px solid #dde6f2;border-radius:10px;background:#fff;transition:border-color .15s,background .15s}
.park-select :deep(.el-checkbox.park-choice:hover){border-color:#a8bbe7;background:#f8faff}
.park-select :deep(.el-checkbox.park-choice.is-checked){border-color:#6d8ad8;background:#f3f7ff}
.park-select :deep(.el-checkbox__input){order:3;margin-left:auto}.park-select :deep(.el-checkbox__label){display:flex;align-items:center;gap:11px;min-width:0;padding-left:0;white-space:normal}
.park-choice-icon{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:8px;background:#edf2ff;color:#3b5fc0}.park-choice-copy{display:grid;gap:3px;min-width:0;text-align:left}.park-choice-copy strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#253750;font-size:13px}.park-choice-copy small{color:#8290a4;font-size:11px}
.exit-dialog-copy{margin:0;color:#5e6e85;font-size:13px;line-height:1.7}
.editor-preview{padding:20px;border:1px solid #e1e8f2;border-radius:10px;background:#fff}
.editor-footer{flex:none;border-top:1px solid #e4eaf3;background:#fff}.editor-footer-inner{display:flex;align-items:center;justify-content:space-between;gap:16px;max-width:1130px;min-height:65px;margin:auto;padding:10px 30px}
.editor-footer-left,.editor-footer-right{display:flex;align-items:center;gap:8px}.editor-footer-right :deep(.el-button){margin:0;min-width:92px;height:38px;display:inline-flex;align-items:center;gap:4px;border-radius:8px}.editor-footer-right :deep(.el-button>span){display:inline-flex;align-items:center;gap:4px}
.editor-link{display:inline-flex;align-items:center;gap:5px;padding:8px 9px;border:0;border-radius:7px;background:transparent;color:#63728a;font:inherit;font-size:12px;cursor:pointer}.editor-link:hover{background:#f1f4f9;color:#233651}.editor-link.save-link{color:#3358ba;font-weight:650}.editor-link:disabled{opacity:.5;cursor:default}
.field-error{display:block;margin-top:5px;color:#bd3f3b;font-size:12px;font-weight:600;line-height:1.45}
.case-cover-field{display:flex;align-items:center;gap:13px}.case-cover-image{width:120px;height:90px;overflow:hidden;border:1px solid #e0e7f1;border-radius:8px}.case-cover-upload{position:relative;display:inline-flex;align-items:center;gap:5px;overflow:hidden;padding:8px 10px;border:1px solid #cad7ef;border-radius:8px;color:#3158bd;font-size:12px;cursor:pointer}
</style>
