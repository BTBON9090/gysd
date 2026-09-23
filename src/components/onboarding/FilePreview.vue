<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Download, FileText, Image as ImageIcon, ZoomIn } from 'lucide-vue-next'
import { ElButton, ElDialog, ElImageViewer } from 'element-plus'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    fileName?: string
    kind?: 'image' | 'pdf' | 'text'
    src?: string
  }>(),
  { kind: 'image', src: '' },
)

const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
const showViewer = ref(false)

const canZoom = computed(() => props.kind === 'image' && !!props.src)

watch(
  () => props.modelValue,
  (open) => {
    if (!open) showViewer.value = false
  },
)

function openZoom() {
  if (canZoom.value) showViewer.value = true
}
</script>

<template>
  <div>
    <ElDialog
      :model-value="props.modelValue"
      :title="title"
      width="min(960px, 92vw)"
      class="fp-dialog"
      top="6vh"
      @update:model-value="emit('update:modelValue', $event)"
    >
      <template #header>
        <div class="fp-head">
          <span class="fp-ic">
            <ImageIcon v-if="kind === 'image'" :size="15" />
            <FileText v-else :size="15" />
          </span>
          <div>
            <strong>{{ title }}</strong>
            <small>{{ fileName || 'demo-file' }}</small>
          </div>
        </div>
      </template>

      <div class="fp-stage">
        <div v-if="kind === 'text'" class="fp-text">
          <slot />
        </div>
        <div v-else-if="kind === 'image' && src" class="fp-frame" role="button" tabindex="0" @click="openZoom">
          <img class="fp-img" :src="src" :alt="fileName || title" />
          <span class="fp-zoom-hint">
            <ZoomIn :size="14" />
            点击全屏查看 · 可缩放 / 1:1 / 旋转
          </span>
        </div>
        <div v-else-if="kind === 'pdf' && src" class="fp-frame pdf">
          <iframe class="fp-pdf" :src="src" :title="fileName || title" />
          <span class="fp-zoom-hint">PDF 预览 · 可滚动查看</span>
        </div>
        <div v-else class="fp-frame">
          <div class="fp-mock" :class="kind">
            <FileText :size="40" stroke-width="1.3" />
            <p>{{ fileName || '预览文件' }}</p>
            <span>演示预览 · 正式环境展示真实文件</span>
          </div>
        </div>
      </div>

      <template #footer>
        <ElButton round @click="emit('update:modelValue', false)">关闭</ElButton>
        <ElButton v-if="canZoom" type="primary" round @click="openZoom">
          <ZoomIn :size="14" style="margin-right: 4px" />
          全屏查看
        </ElButton>
        <ElButton v-else type="primary" round>
          <Download :size="14" style="margin-right: 4px" />
          下载文件
        </ElButton>
      </template>
    </ElDialog>

    <ElImageViewer
      v-if="showViewer"
      :url-list="[src]"
      :initial-index="0"
      hide-on-click-modal
      teleported
      @close="showViewer = false"
    />
  </div>
</template>

<style scoped>
.fp-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.fp-ic {
  width: 32px;
  height: 32px;
  border-radius: var(--r-sm);
  display: grid;
  place-items: center;
  background: var(--c-blue-bg);
  color: var(--c-blue);
}
.fp-head strong {
  display: block;
  font-size: 15px;
  color: var(--text-primary);
}
.fp-head small {
  font-size: 12px;
  color: var(--text-placeholder);
}
.fp-stage {
  border: 1px solid var(--border-light);
  border-radius: var(--r-lg);
  overflow: hidden;
  background: var(--bg-muted);
  min-height: 280px;
}
.fp-frame {
  min-height: 56vh;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  overflow: auto;
  cursor: zoom-in;
}
.fp-img {
  max-width: 100%;
  max-height: 62vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: var(--r-sm);
  border: 1px solid var(--border-light);
  background: #fff;
}
.fp-zoom-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-placeholder);
}
.fp-frame.pdf {
  cursor: default;
}
.fp-pdf {
  width: 100%;
  height: 62vh;
  border: 1px solid var(--border-light);
  border-radius: var(--r-sm);
  background: #fff;
}
.fp-mock {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
}
.fp-mock p {
  margin: 0;
  font-weight: 600;
  color: var(--text-primary);
}
.fp-mock span {
  font-size: 12px;
  color: var(--text-placeholder);
}
.fp-text {
  padding: 28px 32px;
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--text-regular);
  background: #fff;
  min-height: 320px;
}
</style>
