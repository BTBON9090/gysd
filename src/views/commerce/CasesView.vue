<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElButton, ElCascader, ElDialog, ElInput, ElMessage, ElMessageBox, ElPagination, ElTooltip } from 'element-plus'
import { BookOpen, ImagePlus, Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import { CATEGORY_TREE, clone, useCommerceStore, type Case } from '@/stores/commerce'
import { saveDemoImage } from '@/utils/demoMedia'
import DemoImage from '@/components/commerce/DemoImage.vue'

const c = useCommerceStore()
const filter = reactive({ category: '', keyword: '' })
const applied = reactive({ category: '', keyword: '' })
const visible = ref(false)
const page = ref(1)
const pageSize = 8
const uploading = ref(false)
const form = reactive<Case>({ id: '', category: '', title: '', intro: '', cover: '', createdAt: '' })
const errors = reactive({ category: '', title: '', intro: '', cover: '' })
const rows = computed(() => c.data.cases.filter(item =>
  (!applied.category || item.category.startsWith(applied.category)) &&
  (!applied.keyword || `${item.title}${item.intro}`.toLowerCase().includes(applied.keyword.trim().toLowerCase()))
))
const pageRows = computed(() => rows.value.slice((page.value - 1) * pageSize, page.value * pageSize))
watch(() => rows.value.length, length => { page.value = Math.min(page.value, Math.max(1, Math.ceil(length / pageSize))) })
const hasFilter = computed(() => !!applied.category || !!applied.keyword)
const isEditing = computed(() => c.data.cases.some(item => item.id === form.id))
function apply() { Object.assign(applied, filter); page.value = 1 }
function reset() { Object.assign(filter, { category: '', keyword: '' }); apply() }
function open(item?: Case) {
  Object.assign(form, item ? clone(item) : { id: crypto.randomUUID(), category: '', title: '', intro: '', cover: '', createdAt: new Date().toISOString() })
  Object.keys(errors).forEach(key => { errors[key as keyof typeof errors] = '' })
  visible.value = true
}
function save() {
  errors.category = form.category.split(' / ').length === 3 ? '' : '请选择三级服务分类'
  errors.title = form.title.trim() && form.title.length <= 60 ? '' : '请填写 1–60 字案例标题'
  errors.intro = form.intro.trim() && form.intro.length <= 500 ? '' : '请填写 1–500 字案例介绍'
  errors.cover = form.cover ? '' : '请上传案例封面'
  if (Object.values(errors).some(Boolean)) return
  c.saveCase(form)
  visible.value = false
  ElMessage.success('案例已保存')
}
async function file(event: Event) {
  const input = event.target as HTMLInputElement
  const chosen = input.files?.[0]
  input.value = ''
  if (!chosen) return
  if (!chosen.type.startsWith('image/') || chosen.size > 10 * 1024 * 1024) { ElMessage.error('封面需为不超过 10MB 的图片'); return }
  uploading.value = true
  try { form.cover = await saveDemoImage(chosen); errors.cover = '' }
  catch { ElMessage.error('封面保存失败，请重试') }
  finally { uploading.value = false }
}
async function remove(item: Case) {
  const links = c.data.services.filter(service => service.caseIds.includes(item.id)).length
  try {
    await ElMessageBox.confirm(`确认删除「${item.title.slice(0, 24)}${item.title.length > 24 ? '…' : ''}」？${links ? `该案例已关联 ${links} 项服务，删除后将从服务中移除。` : '删除后无法恢复。'}`, '删除案例', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    c.deleteCase(item.id)
    if (page.value > 1 && pageRows.value.length === 0) page.value--
    ElMessage.success('案例已删除')
  } catch { /* cancelled */ }
}
</script>

<template>
  <div class="biz-page cases-page">
    <header class="biz-head cases-head"><div class="cases-heading"><span class="cases-heading-icon"><BookOpen :size="24" /></span><div><h1>案例管理</h1><p>用真实交付案例说明服务能力，发布服务时可直接引用。</p></div></div><ElButton type="primary" @click="open()"><Plus :size="15" /> 创建案例</ElButton></header>

    <section class="cases-content"><div class="cases-section-head"><div><h2>案例库 <span>{{ c.data.cases.length }}</span></h2><p>按分类与关键词查找；点击封面可查看大图。</p></div></div>
      <div class="cases-toolbar"><div class="cases-filters"><ElCascader :model-value="filter.category ? filter.category.split(' / ') : []" :options="CATEGORY_TREE" :props="{ checkStrictly: true }" clearable filterable placeholder="全部服务分类" @change="filter.category = Array.isArray($event) ? $event.join(' / ') : ''" /><ElInput v-model="filter.keyword" clearable placeholder="搜索案例标题或介绍" @keyup.enter="apply"><template #prefix><Search :size="15" /></template></ElInput></div><div class="cases-filter-actions"><ElButton type="primary" @click="apply">查询</ElButton><ElButton @click="reset">重置</ElButton></div></div>
      <div v-if="!rows.length" class="biz-empty"><h3>{{ hasFilter ? '无符合筛选条件的案例' : '暂无案例' }}</h3><p>{{ hasFilter ? '试试其他分类或关键词。' : '创建案例，展示已完成的服务经验。' }}</p><ElButton v-if="hasFilter" @click="reset">清除筛选</ElButton><ElButton v-else type="primary" @click="open()">创建案例</ElButton></div>
      <div v-else class="case-list"><article v-for="item in pageRows" :key="item.id" class="case-row"><div class="case-cover"><DemoImage :source="item.cover" empty-text="案例封面" /></div><div class="case-main"><h3 :title="item.title">{{ item.title }}</h3><ElTooltip :content="item.intro" placement="top-start" popper-class="biz-field-tooltip" :show-after="250"><p class="case-intro">{{ item.intro }}</p></ElTooltip><p class="case-category" :title="item.category">{{ item.category }}</p><div class="case-meta"><span>创建于 {{ item.createdAt.slice(0, 10) }}</span><span>关联 {{ c.data.services.filter(service => service.caseIds.includes(item.id)).length }} 项服务</span></div></div><div class="case-actions"><ElButton text type="primary" @click="open(item)"><Pencil :size="14" /> 编辑</ElButton><ElButton text type="danger" @click="remove(item)"><Trash2 :size="14" /> 删除</ElButton></div></article></div>
      <div v-if="rows.length > pageSize" class="case-pagination"><span>共 {{ rows.length }} 条案例</span><ElPagination v-model:current-page="page" :page-size="pageSize" :total="rows.length" layout="prev, pager, next" background /></div>
    </section>

    <ElDialog v-model="visible" :title="isEditing ? '编辑案例' : '创建案例'" width="690px" append-to-body><div class="case-form"><div class="case-form-main"><label class="biz-field" :class="{ error: errors.category }"><span>服务分类 <b class="required">*</b></span><ElCascader :model-value="form.category ? form.category.split(' / ') : []" :options="CATEGORY_TREE" clearable filterable placeholder="选择末级分类" @change="form.category = Array.isArray($event) ? $event.join(' / ') : ''; errors.category = ''" /><small v-if="errors.category">{{ errors.category }}</small></label><label class="biz-field" :class="{ error: errors.title }"><span>案例标题 <b class="required">*</b></span><ElInput v-model="form.title" maxlength="60" show-word-limit placeholder="概括案例内容" @input="errors.title = ''" /><small v-if="errors.title">{{ errors.title }}</small></label><label class="biz-field" :class="{ error: errors.intro }"><span>案例介绍 <b class="required">*</b></span><ElInput v-model="form.intro" type="textarea" :rows="5" maxlength="500" show-word-limit placeholder="介绍客户需求、解决方案与交付成果" @input="errors.intro = ''" /><small v-if="errors.intro">{{ errors.intro }}</small></label></div><div class="case-form-cover"><span>案例封面 <b class="required">*</b></span><div class="case-cover-preview"><DemoImage :source="form.cover" empty-text="案例封面" /></div><label class="case-upload"><ImagePlus :size="15" /> {{ form.cover ? '更换封面' : '上传封面' }}<input type="file" accept="image/*" @change="file" /></label><small>JPG、PNG、WEBP 等图片，≤10MB。点击图片可放大查看。</small><small v-if="errors.cover" class="case-error">{{ errors.cover }}</small></div></div><template #footer><ElButton @click="visible = false">取消</ElButton><ElButton type="primary" :disabled="uploading" @click="save">保存案例</ElButton></template></ElDialog>
  </div>
</template>

<style scoped>
.cases-page{max-width:1190px}.cases-head{align-items:center;margin-bottom:30px}.cases-heading{display:flex;align-items:center;gap:15px}.cases-heading-icon{width:46px;height:46px;display:grid;place-items:center;flex:none;border-radius:11px;background:#eaf0ff;color:#3659c2}.cases-content{border-top:1px solid #e5ebf3;padding-top:21px}.cases-section-head{margin-bottom:17px}.cases-section-head h2{margin:0 0 3px;font-size:17px}.cases-section-head h2 span{margin-left:6px;padding:3px 7px;border-radius:6px;background:#edf2ff;color:#3458bd;font-size:12px}.cases-section-head p{margin:0;color:#7d899c;font-size:12px}.cases-toolbar{display:flex;align-items:center;gap:9px;margin-bottom:17px}.cases-toolbar :deep(.el-cascader){width:230px}.cases-toolbar :deep(.el-input){width:280px}.case-list{border:1px solid #dfe6f0;border-radius:11px;overflow:hidden;background:#fff}.case-row{display:grid;grid-template-columns:125px minmax(0,1fr) 138px;align-items:center;gap:17px;padding:15px 18px;border-bottom:1px solid #edf0f5}.case-row:last-child{border-bottom:0}.case-cover{width:125px;height:92px;overflow:hidden;border-radius:8px;border:1px solid #e1e7ef;background:#f2f5fa}.case-main{min-width:0}.case-category{margin:0 0 4px;font-size:11px;font-weight:650;color:#4161b5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.case-main h3{margin:0 0 4px;font-size:15px;color:#20304a;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.case-intro{margin:0;color:#65758c;font-size:12px;line-height:1.55;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}.case-meta{display:flex;align-items:center;gap:16px;margin-top:7px;color:#8a97a9;font-size:11px}.case-actions{display:flex;flex-direction:column;align-items:flex-end;gap:5px}.case-actions :deep(.el-button){margin:0}.case-form{display:grid;grid-template-columns:minmax(0,1fr) 210px;gap:22px}.case-form-main{display:grid;align-content:start;gap:18px}.case-form-cover{display:flex;flex-direction:column;align-items:flex-start;gap:8px;color:#34445c;font-size:13px;font-weight:650}.case-form-cover .required{color:#d34b40}.case-cover-preview{width:100%;aspect-ratio:4/3;overflow:hidden;border:1px solid #dfe6f0;border-radius:9px}.case-upload{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid #cad6ed;border-radius:8px;color:#3458bd;font-size:12px;cursor:pointer}.case-upload input{display:none}.case-form-cover small{color:#8592a5;font-size:11px;font-weight:400;line-height:1.5}.case-form-cover .case-error{color:#c9453c}@media(max-width:850px){.case-row{grid-template-columns:100px minmax(0,1fr) 100px}.case-cover{width:100px;height:76px}.cases-toolbar :deep(.el-cascader){width:195px}.cases-toolbar :deep(.el-input){width:215px}}
</style>

<style scoped>
.case-upload{position:relative;overflow:hidden}.case-upload input{display:block;position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;font-size:0}
.cases-page{min-width:800px}
.cases-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center}
.cases-filters{display:grid;grid-template-columns:minmax(190px,240px) minmax(0,1fr);gap:12px;min-width:0}
.cases-toolbar .cases-filters :deep(.el-cascader),.cases-toolbar .cases-filters :deep(.el-input){width:100%;min-width:0}
.cases-filter-actions{display:flex;align-items:center;align-self:center;gap:8px;white-space:nowrap}
.cases-filter-actions :deep(.el-button){margin:0}
.case-main h3{font-size:16px;font-weight:700;margin-bottom:5px}
.case-category{font-size:11px;font-weight:400;color:#8793a5;margin:6px 0 0}
.case-actions :deep(.el-button>span){display:inline-flex;align-items:center;gap:4px}
.case-pagination{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:18px 2px 0;color:#77869b;font-size:12px}
</style>
