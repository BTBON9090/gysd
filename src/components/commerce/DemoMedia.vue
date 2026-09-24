<script setup lang="ts">
import { ref, watch } from 'vue'
import { Video } from 'lucide-vue-next'
import DemoImage from './DemoImage.vue'
import { resolveDemoImage } from '@/utils/demoMedia'

const props = defineProps<{ source: string; sources?: string[] }>()
const videoUrl = ref('')
const isVideo = (source: string) => source.startsWith('local-video:') || /\.mp4(?:$|\?)/i.test(source)
watch(() => props.source, async (source, _, onCleanup) => {
  let active = true
  onCleanup(() => { active = false })
  const resolved = isVideo(source) ? await resolveDemoImage(source).catch(() => '') : ''
  if (active) videoUrl.value = resolved
}, { immediate: true })
</script>

<template>
  <video v-if="isVideo(source) && videoUrl" class="demo-video" :src="videoUrl" controls preload="metadata" />
  <div v-else-if="isVideo(source)" class="demo-video-empty"><Video :size="22" /><span>视频预览不可用</span></div>
  <DemoImage v-else :source="source" :sources="sources" empty-text="图片预览不可用" />
</template>

<style scoped>
.demo-video{display:block;width:100%;height:100%;background:#152238;border-radius:inherit;object-fit:contain}.demo-video-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;width:100%;height:100%;color:#8491a4;background:#f1f4f9;font-size:11px}
</style>
