<script setup lang="ts">
import { Building2, Images, UsersRound } from 'lucide-vue-next'
import type { Shop } from '@/stores/commerce'
import DemoImage from './DemoImage.vue'

defineProps<{ shop: Shop }>()
</script>

<template>
  <div class="shop-preview">
    <div class="shop-preview-identity">
      <div class="shop-preview-logo"><DemoImage :source="shop.logo" empty-text="店铺 Logo" /></div>
      <div class="shop-preview-copy"><span class="shop-preview-label"><Building2 :size="14" /> 服务商店铺</span><h2>{{ shop.name || '店铺名称' }}</h2><p>店铺信息将在园区客户端的服务详情中展示</p></div>
    </div>
    <section class="shop-preview-section"><h3>店铺介绍</h3><p class="shop-intro">{{ shop.intro || '暂无店铺介绍' }}</p></section>
    <section class="shop-preview-section"><div class="shop-preview-title"><Images :size="18" /><h3>店铺简介图片</h3><span>{{ shop.introImages.length }} / 6</span></div><div v-if="shop.introImages.length" class="shop-preview-gallery"><div v-for="(source, index) in shop.introImages" :key="source" class="shop-preview-photo"><DemoImage :source="source" :sources="shop.introImages" :empty-text="`图片 ${index + 1}`" /></div></div><p v-else class="shop-preview-empty">尚未上传展示图片</p></section>
    <section class="shop-preview-section"><div class="shop-preview-title"><UsersRound :size="18" /><h3>团队介绍图片</h3><span>{{ shop.teamImages.length }} / 6</span></div><div v-if="shop.teamImages.length" class="shop-preview-gallery"><div v-for="(source, index) in shop.teamImages" :key="source" class="shop-preview-photo"><DemoImage :source="source" :sources="shop.teamImages" :empty-text="`图片 ${index + 1}`" /></div></div><p v-else class="shop-preview-empty">尚未上传团队图片</p></section>
  </div>
</template>

<style scoped>
.shop-preview{color:#263651}.shop-preview-identity{display:flex;align-items:center;gap:20px;padding:22px 24px;border:1px solid #dbe5f4;border-radius:12px;background:#f5f8ff}.shop-preview-logo{width:76px;height:76px;flex:none;border-radius:12px;overflow:hidden;background:#fff;border:1px solid #e0e8f4}.shop-preview-copy{min-width:0}.shop-preview-label{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:#3458bd}.shop-preview-copy h2{margin:5px 0 2px;font-size:20px;line-height:1.35}.shop-preview-copy p{margin:0;color:#75839a;font-size:12px}.shop-preview-section{padding:23px 0;border-bottom:1px solid #e8edf5}.shop-preview-section:last-child{border-bottom:0}.shop-preview-section h3{margin:0;font-size:15px}.shop-intro{max-width:770px;white-space:pre-wrap;line-height:1.8;font-size:14px;margin:12px 0 0}.shop-preview-title{display:flex;align-items:center;gap:9px;color:#3759b9}.shop-preview-title h3{color:#263651}.shop-preview-title span{margin-left:auto;color:#8290a4;font-size:12px}.shop-preview-gallery{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:16px}.shop-preview-photo{aspect-ratio:4/3;overflow:hidden;border:1px solid #e2e9f3;border-radius:9px;background:#f2f5fa}.shop-preview-empty{margin:12px 0 0;color:#8b98aa;font-size:13px}@media(max-width:850px){.shop-preview-gallery{grid-template-columns:repeat(3,minmax(0,1fr))}}
</style>
