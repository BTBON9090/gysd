<script setup lang="ts">
import { computed } from 'vue'
import { money, useCommerceStore, type Service } from '@/stores/commerce'
import DemoImage from '@/components/commerce/DemoImage.vue'
import DemoMedia from '@/components/commerce/DemoMedia.vue'

const props = defineProps<{ service: Service }>()
const c = useCommerceStore()
const cases = computed(() => c.data.cases.filter(item => props.service.caseIds.includes(item.id)))
const prices = computed(() => props.service.specs.map(item => item.price).filter(price => price > 0))
const imageSources = computed(() => props.service.images.filter(source => /^(local-image:|data:image\/|blob:|https?:\/)/.test(source)))
const usableCover = computed(() => /^(local-image:|data:image\/|blob:|https?:\/)/.test(props.service.cover) ? props.service.cover : '')
</script>

<template>
  <div class="service-preview">
    <div class="preview-hero">
      <div class="preview-cover"><DemoImage :source="usableCover" empty-text="服务封面待上传" /></div>
      <div class="preview-summary">
        <p class="preview-category">{{ service.category || '服务分类待选择' }}</p>
        <h2>{{ service.name || '服务名称' }}</h2>
        <p>{{ service.intro || '服务简介' }}</p>
        <strong>{{ prices.length ? money(Math.min(...prices)) : '价格待设置' }} <small v-if="prices.length">起</small></strong>
      </div>
    </div>
    <section>
      <h3>服务规格</h3>
      <div class="preview-specs"><div v-for="item in service.specs" :key="item.name" class="preview-spec"><strong>{{ item.name || '未命名规格' }}</strong><span>{{ item.price > 0 ? `${money(item.price)} / ${item.unit}` : '价格待设置' }}</span><p>{{ item.point || '卖点待填写' }}</p><small>支付后 {{ item.startDays }} {{ item.dayType }}开始 · {{ item.deliveryDays }} 天交付</small><small>交付标准：{{ item.standard || '待填写' }}</small></div></div>
    </section>
    <section><h3>服务详情</h3><p class="preview-text">{{ service.detail || '服务详情待填写' }}</p><div v-if="service.media.length || imageSources.length" class="preview-media"><div v-for="(source,index) in service.media" :key="`media-${index}`" class="preview-media-item"><DemoMedia :source="source" :sources="service.media.filter(item => !item.startsWith('local-video:'))" /></div><div v-for="source in imageSources" :key="source" class="preview-media-item"><DemoImage :source="source" :sources="imageSources" /></div></div></section>
    <section><h3>服务保障</h3><p class="preview-text">{{ service.guarantee || '服务保障说明待填写' }}</p></section>
    <section v-if="cases.length"><h3>服务案例</h3><div v-for="item in cases" :key="item.id" class="preview-case"><strong>{{ item.title }}</strong><p>{{ item.intro }}</p></div></section>
    <section v-if="service.faqs.length"><h3>常见问题</h3><div v-for="(item,index) in service.faqs" :key="index" class="preview-faq"><strong><span>{{ String(index + 1).padStart(2, '0') }}</span>{{ item.question }}</strong><p>{{ item.answer }}</p></div></section>
  </div>
</template>

<style scoped>
.service-preview{color:#243550}.preview-hero{display:grid;grid-template-columns:180px minmax(0,1fr);gap:24px;padding-bottom:24px}.preview-cover{height:150px;overflow:hidden;border:1px solid #e0e8f2;border-radius:10px;background:#edf3fb}.preview-summary h2{font-size:21px;line-height:1.35;margin:8px 0}.preview-summary p{font-size:13px;color:#66758c;line-height:1.6;margin:0 0 12px}.preview-summary .preview-category{font-size:12px;color:#345ac0;font-weight:650}.preview-summary strong{font-size:21px;color:#c35545}.preview-summary strong small{font-size:12px;color:#79879b}.service-preview section{border-top:1px solid #e7ecf4;padding:21px 0}.service-preview section h3{font-size:15px;margin:0 0 14px}.preview-specs{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}.preview-spec{border:1px solid #dfe6f0;border-radius:8px;padding:13px;display:grid;gap:7px;font-size:13px}.preview-spec span{color:#c35545;font-weight:700}.preview-spec p,.preview-case p,.preview-faq p{margin:0;color:#62718a;line-height:1.6}.preview-spec small{color:#718096}.preview-text{white-space:pre-wrap;line-height:1.7;font-size:13px;margin:0}.preview-media{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:14px}.preview-media-item{height:110px;overflow:hidden;border:1px solid #e0e8f2;border-radius:8px;background:#f5f7fb}.preview-case,.preview-faq{padding:11px 0;border-top:1px solid #edf1f5;font-size:13px}.preview-case:first-of-type,.preview-faq:first-of-type{border-top:0}.preview-faq strong{display:flex;gap:10px}.preview-faq strong span{color:#385dbe;font-variant-numeric:tabular-nums}@media(max-width:650px){.preview-hero{grid-template-columns:1fr}.preview-cover{height:110px}.preview-media{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
