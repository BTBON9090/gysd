<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElImage } from 'element-plus'
import { Image as ImageIcon } from 'lucide-vue-next'
import { resolveDemoImage } from '@/utils/demoMedia'

const props = withDefaults(defineProps<{ source?: string; sources?: string[]; fit?: 'cover' | 'contain'; emptyText?: string }>(), { fit: 'cover', emptyText: '暂无图片' })
const url = ref('')
const gallery = ref<string[]>([])
const allSources = computed(() => props.sources?.length ? props.sources : props.source ? [props.source] : [])
watch(() => [props.source, ...allSources.value], async (_, __, onCleanup) => {
  let active = true
  onCleanup(() => { active = false })
  const resolved = await Promise.all(allSources.value.map(source => resolveDemoImage(source).catch(() => '')))
  const sourceUrl = props.source ? await resolveDemoImage(props.source).catch(() => '') : ''
  if (active) {
    gallery.value = resolved.filter(Boolean)
    url.value = sourceUrl
  }
}, { immediate: true })
</script>

<template>
  <ElImage v-if="url" class="demo-image" :src="url" :fit="fit" :preview-src-list="gallery" :initial-index="Math.max(0, gallery.indexOf(url))" preview-teleported />
  <div v-else class="demo-image demo-image-empty"><ImageIcon :size="23" :stroke-width="1.6" /><span>{{ source ? '旧图片需重新上传' : emptyText }}</span></div>
</template>

<style scoped>
.demo-image{display:block;width:100%;height:100%;border-radius:inherit;overflow:hidden}.demo-image-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:#f2f5fb;color:#8795aa;font-size:12px;line-height:1.4}.demo-image :deep(img){cursor:zoom-in}
</style>
