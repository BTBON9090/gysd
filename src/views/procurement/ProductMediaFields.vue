<script setup lang="ts">
import { ElButton, ElMessage } from 'element-plus'
import { ImagePlus } from 'lucide-vue-next'
import MediaUploadTile from '@/components/commerce/MediaUploadTile.vue'
import DemoMedia from '@/components/commerce/DemoMedia.vue'
import { saveDemoImage, saveDemoVideo } from '@/utils/demoMedia'

const cover = defineModel<string>('cover', { required: true })
const images = defineModel<string[]>('images', { required: true })
async function upload(event: Event, main: boolean) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const video = file.type === 'video/mp4'
  const image = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  if ((!image && (!video || main)) || file.size > (video ? 100 : 10) * 1024 * 1024) {
    ElMessage.warning('主图支持 10MB 以内的 JPG、PNG、WebP；商品媒体另支持 100MB 以内 MP4')
    input.value = ''
    return
  }
  if (!main && images.value.length >= 5) { ElMessage.warning('商品图片和视频最多 5 个'); input.value = ''; return }
  try {
    const source = video ? await saveDemoVideo(file) : await saveDemoImage(file)
    if (main) cover.value = source
    else images.value.push(source)
  } catch { ElMessage.error('上传失败，请重试') } finally { input.value = '' }
}
</script>
<template>
  <div class="media-field"><div class="field-title">商品主图 <b>*</b></div><p>正方形展示，建议上传正方形图片；JPG、PNG、WebP，单张不超过 10MB</p><MediaUploadTile :source="cover" label="上传主图" @change="upload($event, true)" /></div>
  <div class="media-field"><div class="field-title">商品图片 / 视频</div><p>最多 5 个，图片不超过 10MB，MP4 不超过 100MB</p><div class="gallery"><div v-for="(image, i) in images" :key="image" class="gallery-item"><div class="media-preview"><DemoMedia :source="image" fit="contain" /></div><ElButton text type="danger" @click="images.splice(i, 1)">删除</ElButton></div><label v-if="images.length < 5" class="add-media"><ImagePlus :size="21"/><span>添加图片 / 视频</span><input type="file" aria-label="添加商品图片或视频" accept="image/jpeg,image/png,image/webp,video/mp4" @change="upload($event, false)" /></label></div></div>
</template>
<style scoped>
.media-field{margin:18px 0 24px}.field-title{font-size:13px;font-weight:600;color:#34445c}.field-title b{color:#d34b40}.media-field p{margin:7px 0 10px;font-size:12px;color:#596a80}.media-field :deep(.media-upload-tile){width:120px;height:120px}.gallery{display:flex;flex-wrap:wrap;gap:12px}.gallery-item{display:grid;justify-items:center}.media-preview,.add-media{width:120px;height:120px;border:1px solid #e0e7f2;border-radius:8px;overflow:hidden}.add-media{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border-style:dashed;background:#f7f9fd;color:#3c5cbb;font-size:12px;cursor:pointer;box-sizing:border-box}.add-media:hover{border-color:#5578d0;background:#f0f5ff}.add-media input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}
</style>
