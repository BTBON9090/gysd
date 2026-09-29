<script setup lang="ts">
import { computed, ref } from 'vue'
import { FileText, Eye } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import type { OnboardingDraft } from '@/stores/onboarding'
import { resolveDemoImage } from '@/utils/demoMedia'
import DemoImage from '@/components/commerce/DemoImage.vue'
import FilePreview from './FilePreview.vue'
const props = defineProps<{ draft: OnboardingDraft; group?: 'qualifications' | 'account' | 'services' | 'basic' | 'allQualifications' }>()
const files = computed(() => [
  { key: 'license', title: '营业执照', group: 'qualifications', uploaded: props.draft.licenseUploaded, show: props.draft.entityType !== 'personal' },
  { key: 'idFront', title: '身份证 · 人像面', group: 'qualifications', uploaded: props.draft.idFront, show: true },
  { key: 'idBack', title: '身份证 · 国徽面', group: 'qualifications', uploaded: props.draft.idBack, show: true },
  { key: 'bank', title: '开户许可 / 基本户', group: 'account', uploaded: props.draft.bankUploaded, show: props.draft.entityType !== 'personal' },
  { key: 'extra', title: '补充资质', group: 'services', uploaded: !!props.draft.extraCerts, show: true },
  { key: 'coop', title: '服务商入驻合作协议', group: 'basic', uploaded: props.draft.coopUploaded, show: true },
  { key: 'split', title: '支付分账协议', group: 'basic', uploaded: props.draft.splitUploaded, show: true },
].filter(file => file.show && (!props.group || (props.group === 'allQualifications' ? file.group !== 'basic' : file.group === props.group))).map(file => ({ ...file, document: props.draft.documents?.[file.key] })))
const preview = ref({ open: false, title: '', fileName: '', src: '', kind: 'image' as 'image' | 'pdf' | 'text' })
async function open(file: typeof files.value[number]) {
  if (!file.document) return
  const src = await resolveDemoImage(file.document.source)
  if (!src) { ElMessage.warning('文件不在当前浏览器中，请重新上传'); return }
  preview.value = { open: true, title: file.title, fileName: file.document.name, src, kind: /\.pdf$/i.test(file.document.name) ? 'pdf' : 'image' }
}
</script>
<template>
  <div class="merchant-documents">
    <button v-for="file in files" :key="file.key" type="button" class="document-card" :disabled="!file.document" @click="open(file)">
      <div class="document-thumb"><DemoImage v-if="file.document && /\.(png|jpe?g|webp)$/i.test(file.document.name)" :source="file.document.source" /><FileText v-else :size="24" /><span v-if="file.document"><Eye :size="14" /> 预览</span></div>
      <strong>{{ file.title }}</strong><small>{{ file.document?.name || (file.uploaded ? '已上传' : '未上传') }}</small>
    </button>
  </div>
  <FilePreview v-model="preview.open" :title="preview.title" :file-name="preview.fileName" :kind="preview.kind" :src="preview.src" />
</template>
<style scoped>
.merchant-documents{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin:20px 0}.document-card{min-width:0;padding:0;border:0;background:none;text-align:left;color:#334b70;cursor:pointer}.document-card:disabled{cursor:default}.document-thumb{position:relative;height:112px;border:1px solid #e1e8f2;background:#f8faff;border-radius:8px;overflow:hidden;display:grid;place-items:center;color:#596a80}.document-thumb span{position:absolute;inset:auto 0 0;display:flex;align-items:center;justify-content:center;gap:5px;padding:5px;background:#edf2ff;color:#355ac0;font-size:11px}.document-card strong{display:block;margin:8px 0 4px;font-size:12px;font-weight:600}.document-card small{display:block;color:#596a80;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.document-thumb :deep(.demo-image){width:100%;height:100%;pointer-events:none}
</style>
