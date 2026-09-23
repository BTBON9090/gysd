<script setup lang="ts">
import { computed, ref } from 'vue'
import { Upload, Download, Trash2, Check, UserRound, Landmark, ScanLine } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    title: string
    hint?: string
    fileName?: string
    face?: 'portrait' | 'emblem' | 'none'
    compact?: boolean
    ocrLabel?: string
    showOcr?: boolean
  }>(),
  {
    modelValue: false,
    hint: 'JPG / PNG / PDF',
    fileName: '',
    face: 'none',
    compact: false,
    ocrLabel: '演示识别回填',
    showOcr: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [boolean]
  upload: [file?: File, url?: string]
  ocr: []
  preview: [url?: string, name?: string]
  download: []
  remove: []
}>()

const inputEl = ref<HTMLInputElement | null>(null)
const phase = ref<'idle' | 'uploading' | 'done'>('idle')
const pct = ref(0)
const fileUrl = ref('')
const fileNameLive = ref('')
let timer: ReturnType<typeof setInterval> | null = null

const done = computed(() => props.modelValue || phase.value === 'done')
const displayFile = computed(() => fileNameLive.value || props.fileName || (done.value ? '已上传文件 · 演示状态' : ''))
const isImage = computed(() => /\.(png|jpe?g|gif|webp|bmp)$/i.test(displayFile.value))
const faceIcon = computed(() => (props.face === 'emblem' ? Landmark : UserRound))

function pickReal(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!(/\.(jpe?g|png|pdf)$/i.test(file.name) || ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type))) {
    ElMessage.error('仅支持 JPG、PNG 或 PDF 文件')
    input.value = ''
    return
  }
  if (file.size > 100 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 100MB')
    input.value = ''
    return
  }
  if (fileUrl.value) URL.revokeObjectURL(fileUrl.value)
  fileUrl.value = URL.createObjectURL(file)
  fileNameLive.value = file.name
  if (timer) clearInterval(timer)
  phase.value = 'uploading'
  pct.value = 8
  timer = setInterval(() => {
    pct.value = Math.min(100, pct.value + 9 + Math.random() * 6)
    if (pct.value >= 100) {
      if (timer) clearInterval(timer)
      timer = null
      phase.value = 'done'
      emit('update:modelValue', true)
      emit('upload', file, fileUrl.value)
      ElMessage.success(`${props.title}已上传`)
    }
  }, 120)
  input.value = ''
}

function onPreview() {
  emit('preview', fileUrl.value || undefined, displayFile.value)
}

function onDownload() {
  if (!fileUrl.value) return
  const link = document.createElement('a')
  link.href = fileUrl.value
  link.download = displayFile.value
  link.click()
}

function onRemove() {
  if (timer) clearInterval(timer)
  timer = null
  phase.value = 'idle'
  pct.value = 0
  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value)
    fileUrl.value = ''
  }
  fileNameLive.value = ''
  emit('update:modelValue', false)
  emit('remove')
}
</script>

<template>
  <div class="uc" :class="{ done, compact, uploading: phase === 'uploading' }">
    <button v-if="showOcr" class="uc-ocr" type="button" @click="emit('ocr')">
      <ScanLine :size="13" />
      {{ ocrLabel }}
    </button>

    <div class="uc-row">
      <input ref="inputEl" class="uc-input" type="file" accept="image/*,.pdf" @change="pickReal" />
      <button class="uc-drop" type="button" :title="done ? '点击预览文件' : '选择文件'" @click="done ? onPreview() : inputEl?.click()">
        <img v-if="done && isImage && fileUrl" :src="fileUrl" class="uc-thumb" alt="" />
        <span v-else-if="face !== 'none'" class="uc-face" :class="`f-${face}`">
          <component :is="faceIcon" :size="16" stroke-width="1.5" />
          <em>{{ face === 'portrait' ? '人像面' : '国徽面' }}</em>
        </span>
        <span v-else class="uc-face f-none">
          <Upload :size="16" stroke-width="1.5" />
        </span>

        <span class="uc-text">
          <template v-if="phase === 'uploading'">
            <strong>正在上传 {{ Math.round(pct) }}%</strong>
            <span class="uc-bar"><i :style="{ width: pct + '%' }" /></span>
          </template>
          <template v-else-if="done">
            <strong>
              <Check :size="13" class="ok" />
              {{ displayFile }}
            </strong>
            <span>{{ hint }}</span>
          </template>
          <template v-else>
            <strong>{{ title }}</strong>
            <span>{{ hint }}</span>
          </template>
        </span>
      </button>

      <div class="uc-acts">
        <template v-if="done">
          <button type="button" title="替换文件" @click="inputEl?.click()">替换</button>
          <button v-if="fileUrl" type="button" title="下载" @click="onDownload"><Download :size="14" /></button>
          <button type="button" class="danger" title="删除" @click="onRemove"><Trash2 :size="14" /></button>
        </template>
        <button v-else-if="phase !== 'uploading'" type="button" class="uc-go" @click="inputEl?.click()">上传</button>
        <button v-else type="button" class="uc-go" disabled>…</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.uc {
  border: 1px solid var(--border-light);
  border-radius: var(--r-md);
  background: var(--bg-card);
  padding: 12px;
}
.uc + .uc {
  margin-top: 10px;
}
.uc-ocr {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  margin-bottom: 10px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: var(--bg-muted);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: color var(--t-fast), border-color var(--t-fast), background var(--t-fast);
}
.uc-ocr:hover {
  color: var(--brand);
  border-color: rgba(59, 99, 211, 0.35);
  background: var(--brand-soft);
}

.uc-input {
  display: none;
}
.uc-thumb {
  width: 44px;
  height: 30px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--border-light);
  flex-shrink: 0;
  overflow: hidden;
}
.uc-row {
  display: flex;
  align-items: stretch;
  gap: 10px;
}
.uc-drop {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px dashed var(--border-strong);
  border-radius: var(--r-sm);
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color var(--t-fast), background var(--t-fast);
}
.uc-drop:hover {
  border-color: var(--brand);
  background: var(--brand-soft);
}
.uc.done .uc-drop {
  border-style: solid;
  border-color: var(--border-light);
}
.uc.uploading .uc-drop {
  border-color: var(--brand);
}

.uc-face {
  width: 44px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 4px;
  border: 1px solid var(--border-light);
  background: var(--bg-chip);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  color: var(--text-placeholder);
}
.uc-face em {
  font-style: normal;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
}
.uc-face.f-portrait,
.uc-face.f-emblem {
  background: #fff;
  color: var(--text-secondary);
  border-color: var(--border-strong);
}

.uc-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.uc-text {
  overflow: hidden;
}
.uc-text strong {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.uc-text strong .ok {
  color: var(--status-success);
  flex-shrink: 0;
}
.uc-text span {
  font-size: 12px;
  color: var(--text-placeholder);
}

.uc-bar {
  display: block;
  height: 3px;
  border-radius: 2px;
  background: var(--border-lighter);
  overflow: hidden;
  margin-top: 2px;
}
.uc-bar i {
  display: block;
  height: 100%;
  background: var(--brand);
  transition: width 0.15s linear;
}

.uc-acts {
  display: flex;
  align-items: center;
  gap: 6px;
}
.uc-acts button {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--text-placeholder);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: color var(--t-fast), background var(--t-fast);
}
.uc-acts button:first-child:not(.uc-go) { width: auto; padding: 0 8px; font-size: 12px; font-weight: 600; }
.uc-acts button:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}
.uc-acts button.danger:hover {
  color: var(--status-danger);
  background: var(--status-danger-soft);
}
.uc-acts .uc-go {
  width: auto;
  padding: 0 12px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--brand);
  background: var(--brand-soft);
}
.uc-acts .uc-go:hover {
  background: var(--brand-soft-strong);
  color: var(--brand);
}
</style>
