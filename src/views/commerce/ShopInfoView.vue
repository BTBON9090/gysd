<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElButton, ElDialog, ElInput, ElMessage } from 'element-plus'
import { Eye, ImagePlus, Images, Pencil, Store, Trash2, UsersRound } from 'lucide-vue-next'
import { clone, useCommerceStore, type Shop } from '@/stores/commerce'
import { saveDemoImage } from '@/utils/demoMedia'
import DemoImage from '@/components/commerce/DemoImage.vue'
import ShopPreview from '@/components/commerce/ShopPreview.vue'

const c = useCommerceStore()
function visibleShop(shop: Shop): Shop {
  const usable = (source: string) => /^(local-image:|data:image\/|blob:|https?:\/)/.test(source)
  return { ...clone(shop), logo: usable(shop.logo) ? shop.logo : '', introImages: shop.introImages.filter(usable), teamImages: shop.teamImages.filter(usable) }
}
const form = reactive<Shop>(visibleShop(c.data.shop))
const savedPreview = computed(() => visibleShop(c.data.shop))
const editing = ref(!c.data.shop.savedAt)
const previewVisible = ref(false)
const uploading = ref(false)
const errors = reactive({ name: '', intro: '' })
const galleries = [
  { key: 'introImages' as const, title: '店铺简介图片', hint: '展示店铺环境、服务场景或代表性内容', icon: Images },
  { key: 'teamImages' as const, title: '团队介绍图片', hint: '展示团队形象与专业能力', icon: UsersRound },
]

async function addFiles(event: Event, kind: 'logo' | 'introImages' | 'teamImages') {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  input.value = ''
  const maxBytes = (kind === 'logo' ? 5 : 10) * 1024 * 1024
  const valid = files.filter(file => file.type.startsWith('image/') && file.size <= maxBytes)
  if (valid.length !== files.length) ElMessage.error(`仅支持图片，单张不超过 ${kind === 'logo' ? 5 : 10}MB`)
  const available = kind === 'logo' ? 1 : Math.max(0, 6 - form[kind].length)
  if (valid.length > available) ElMessage.warning('每组最多上传 6 张图片')
  if (!available || !valid.length) return
  uploading.value = true
  try {
    const sources = await Promise.all(valid.slice(0, available).map(saveDemoImage))
    if (kind === 'logo') form.logo = sources[0]
    else form[kind].push(...sources)
  } catch { ElMessage.error('图片保存失败，请重试') }
  finally { uploading.value = false }
}
function save() {
  errors.name = form.name.trim() && form.name.length <= 60 ? '' : '请填写 1–60 字店铺名称'
  errors.intro = form.intro.trim() && form.intro.length <= 500 ? '' : '请填写 1–500 字店铺介绍'
  if (errors.name || errors.intro) return
  c.saveShop(form)
  Object.assign(form, clone(c.data.shop))
  editing.value = false
  ElMessage.success('店铺资料已保存')
}
function edit() { Object.assign(form, visibleShop(c.data.shop)); editing.value = true }
function cancelEdit() { Object.assign(form, visibleShop(c.data.shop)); editing.value = false }
</script>

<template>
  <div class="biz-page shop-page">
    <header class="biz-head shop-head">
      <div class="shop-heading"><span class="shop-heading-icon"><Store :size="24" /></span><div><p class="biz-eyebrow">店铺管理 / 店铺资料</p><h1>店铺资料</h1><p>完善店铺形象，资料将用于园区客户端的服务详情。</p></div></div>
      <div class="biz-actions"><template v-if="editing"><ElButton @click="previewVisible = true"><Eye :size="15" /> 预览效果</ElButton><ElButton v-if="c.data.shop.savedAt" @click="cancelEdit">取消编辑</ElButton><ElButton type="primary" :disabled="uploading" @click="save">保存资料</ElButton></template><ElButton v-else type="primary" @click="edit"><Pencil :size="15" /> 编辑资料</ElButton></div>
    </header>

    <template v-if="editing">
      <section class="shop-edit-section"><div class="shop-section-head"><span class="shop-section-icon"><Store :size="18" /></span><div><h2>店铺识别</h2><p>名称和 Logo 会出现在服务详情的店铺信息中。</p></div></div>
        <div class="shop-identity-form"><div class="logo-field"><span class="shop-label">店铺 Logo <small>选填 · 图片 ≤5MB</small></span><div class="logo-preview"><DemoImage :source="form.logo" empty-text="上传 Logo" /></div><div class="logo-ops"><label class="upload-button"><ImagePlus :size="15" /> {{ form.logo ? '更换图片' : '上传图片' }}<input type="file" accept="image/*" @change="addFiles($event, 'logo')" /></label><button v-if="form.logo" type="button" class="text-action" @click="form.logo = ''">移除</button></div></div><label class="biz-field shop-name" :class="{ error: errors.name }"><span>店铺名称 <b class="required">*</b></span><ElInput v-model="form.name" maxlength="60" show-word-limit placeholder="填写店铺名称" @input="errors.name = ''" /><small v-if="errors.name">{{ errors.name }}</small></label></div>
      </section>

      <section class="shop-edit-section"><div class="shop-section-head"><span class="shop-section-icon"><Images :size="18" /></span><div><h2>店铺介绍</h2><p>写清楚服务方向与团队优势，方便客户快速了解。</p></div></div><label class="biz-field" :class="{ error: errors.intro }"><span>介绍内容 <b class="required">*</b></span><ElInput v-model="form.intro" type="textarea" :rows="5" maxlength="500" show-word-limit placeholder="介绍店铺服务内容和擅长领域" @input="errors.intro = ''" /><small v-if="errors.intro">{{ errors.intro }}</small></label></section>

      <section class="shop-edit-section"><div class="shop-section-head"><span class="shop-section-icon"><ImagePlus :size="18" /></span><div><h2>展示图片</h2><p>图片会按上传顺序展示。点击缩略图可放大查看。</p></div></div>
        <div v-for="group in galleries" :key="group.key" class="shop-gallery-group"><div class="gallery-heading"><component :is="group.icon" :size="17" /><div><h3>{{ group.title }}</h3><p>{{ group.hint }}</p></div><span>{{ form[group.key].length }} / 6</span></div><div class="gallery-grid"><div v-for="(source, index) in form[group.key]" :key="source" class="gallery-tile"><DemoImage :source="source" :sources="form[group.key]" :empty-text="`图片 ${index + 1}`" /><button type="button" class="remove-photo" title="移除图片" @click="form[group.key].splice(index, 1)"><Trash2 :size="14" /></button></div><label v-if="form[group.key].length < 6" class="gallery-add"><ImagePlus :size="22" /><b>添加图片</b><span>单张 ≤10MB</span><input type="file" accept="image/*" multiple @change="addFiles($event, group.key)" /></label></div></div>
      </section>
      <div class="shop-bottom-actions"><ElButton @click="previewVisible = true"><Eye :size="15" /> 预览效果</ElButton><ElButton v-if="c.data.shop.savedAt" @click="cancelEdit">取消编辑</ElButton><ElButton type="primary" :disabled="uploading" @click="save">保存资料</ElButton></div>
    </template>
    <div v-else class="shop-saved"><div class="saved-heading"><div><h2>店铺展示效果</h2><p>点击图片可查看大图；编辑后保存会更新此预览。</p></div><span>最近保存 {{ c.data.shop.savedAt?.slice(0, 10) }}</span></div><ShopPreview :shop="savedPreview" /></div>

    <ElDialog v-model="previewVisible" title="店铺展示预览" width="min(860px, 90vw)" append-to-body><ShopPreview :shop="form" /><template #footer><ElButton @click="previewVisible = false">返回编辑</ElButton></template></ElDialog>
  </div>
</template>

<style scoped>
.shop-page{max-width:1130px}.shop-head{align-items:center;margin-bottom:28px}.shop-heading{display:flex;align-items:center;gap:15px}.shop-heading-icon{display:grid;place-items:center;width:46px;height:46px;flex:none;border-radius:11px;background:#eaf0ff;color:#3557bd}.shop-edit-section{padding:26px 0;border-top:1px solid #e5ebf3}.shop-section-head{display:flex;align-items:flex-start;gap:12px;margin-bottom:20px}.shop-section-icon{display:grid;place-items:center;width:34px;height:34px;flex:none;border-radius:8px;background:#edf2ff;color:#395bbd}.shop-section-head h2{margin:0 0 3px;font-size:16px}.shop-section-head p{margin:0;color:#7b899d;font-size:12px}.shop-identity-form{display:grid;grid-template-columns:210px minmax(0,1fr);gap:28px;align-items:start}.shop-label{display:block;margin-bottom:8px;color:#34445c;font-size:13px;font-weight:650}.shop-label small{color:#8a97a8;font-weight:400}.logo-preview{width:92px;height:92px;overflow:hidden;border:1px solid #dce5f2;border-radius:11px}.logo-ops{display:flex;align-items:center;gap:12px;margin-top:12px}.upload-button{display:inline-flex;align-items:center;gap:6px;padding:7px 10px;border:1px solid #cdd8ed;border-radius:8px;color:#3156bb;background:#fff;font-size:12px;font-weight:650;cursor:pointer}.upload-button:hover{background:#f3f7ff}.upload-button input,.gallery-add input{display:none}.text-action{border:0;background:none;color:#7b8798;font-size:12px;cursor:pointer}.shop-name{margin-top:26px}.shop-gallery-group{padding:18px 0;border-top:1px solid #e8edf5}.shop-gallery-group:first-of-type{border-top:0;padding-top:0}.gallery-heading{display:flex;align-items:center;gap:9px;color:#3a5cc0}.gallery-heading h3{margin:0;color:#263651;font-size:14px}.gallery-heading p{margin:1px 0 0;color:#8190a4;font-size:12px}.gallery-heading>span{margin-left:auto;color:#7b8aa0;font-size:12px}.gallery-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:15px}.gallery-tile,.gallery-add{position:relative;aspect-ratio:4/3;border:1px solid #dfe6f1;border-radius:9px;overflow:hidden;background:#f7f9fc}.remove-photo{position:absolute;right:6px;top:6px;width:26px;height:26px;display:grid;place-items:center;border:0;border-radius:6px;color:#af443c;background:rgba(255,255,255,.94);cursor:pointer}.gallery-add{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border-style:dashed;color:#4768bd;cursor:pointer}.gallery-add:hover{border-color:#7394e7;background:#f3f7ff}.gallery-add b{font-size:12px}.gallery-add span{font-size:11px;color:#8b98aa}.shop-bottom-actions{display:flex;justify-content:flex-end;gap:9px;padding-top:20px;border-top:1px solid #e5ebf3}.saved-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:15px;margin-bottom:15px}.saved-heading h2{font-size:16px;margin:0 0 3px}.saved-heading p,.saved-heading span{margin:0;color:#7e8ca1;font-size:12px}@media(max-width:850px){.shop-identity-form{grid-template-columns:170px minmax(0,1fr)}.gallery-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
</style>

<style scoped>
.upload-button,.gallery-add{position:relative;overflow:hidden}.upload-button input,.gallery-add input{display:block;position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;font-size:0}
.shop-page{min-width:800px}
</style>
