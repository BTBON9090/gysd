<script setup lang="ts">
import { computed } from 'vue'
import { FileText } from 'lucide-vue-next'
import { ElDialog, ElImageViewer } from 'element-plus'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  fileName?: string
  kind?: 'image' | 'pdf' | 'text'
  src?: string
}>(), { kind: 'image', src: '' })

const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
const showImage = computed(() => props.modelValue && props.kind === 'image' && !!props.src)
const showDocument = computed(() => props.modelValue && !showImage.value)
function close() { emit('update:modelValue', false) }
</script>

<template>
  <!-- 有真实图片时直接进入图片蒙层，无二次“全屏查看”。 -->
  <ElImageViewer v-if="showImage" :url-list="[src]" :initial-index="0" hide-on-click-modal teleported @close="close" />

  <!-- PDF 直接进入内嵌预览；演示填入没有真实文件时明确说明。 -->
  <ElDialog :model-value="showDocument" :title="title" class="file-direct-dialog" width="min(980px, 94vw)" top="5vh" @update:model-value="!$event && close()">
    <iframe v-if="kind === 'pdf' && src" class="file-pdf" :src="src" :title="fileName || title" />
    <div v-else class="file-empty">
      <FileText :size="36" :stroke-width="1.5" />
      <strong>{{ fileName || title }}</strong>
      <p>{{ kind === 'text' ? '当前是演示模板。正式协议正文由业务方配置。' : '当前为演示填入状态，尚无可预览的真实文件。' }}</p>
    </div>
  </ElDialog>
</template>

<style>
.file-direct-dialog { border-radius: 12px !important; overflow: hidden; }
.file-direct-dialog .el-dialog__header { padding: 17px 22px 14px; border-bottom: 1px solid #e8edf5; }
.file-direct-dialog .el-dialog__title { color: #18263e; font-size: 15px; font-weight: 700; }
.file-direct-dialog .el-dialog__body { padding: 18px 22px 22px; }
.file-pdf { display: block; width: 100%; height: min(72vh, 780px); border: 0; border-radius: 7px; background: #f5f7fb; }
.file-empty { min-height: 290px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; border-radius: 9px; background: #f6f8fc; color: #5468a4; text-align: center; }
.file-empty strong { color: #26344c; font-size: 14px; }
.file-empty p { color: #66748a; font-size: 13px; margin: 0; }
</style>
