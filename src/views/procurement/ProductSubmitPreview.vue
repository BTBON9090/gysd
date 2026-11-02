<script setup lang="ts">
import type { Product } from '@/stores/products'
import { salePrice } from '@/stores/products'
import DemoImage from '@/components/commerce/DemoImage.vue'
import DemoMedia from '@/components/commerce/DemoMedia.vue'
import { safeProductHtml } from './productRichHtml'

defineProps<{ product: Product; parks: { id: string; name: string }[] }>()
</script>

<template>
  <section class="submit-preview">
    <h2>提交预览</h2>
    <p class="intro">请核对商品资料和各园区的供货信息，确认无误后提交审核。</p>
    <div class="preview-block product-overview">
      <div class="cover"><DemoImage :source="product.cover" fit="contain" /></div>
      <div class="overview-text"><h3>{{ product.name || '未命名商品' }}</h3><p>{{ product.category || '未选择类目' }}<template v-if="product.brand"> · {{ product.brand }}</template></p><p>供应商 SKU {{ product.sku || '—' }} · {{ product.spec || '—' }} / {{ product.unit }}</p><strong>默认含税销售价 ¥{{ (salePrice(product.supply) * (1 + product.supply.tax / 100)).toFixed(2) }} / {{ product.unit }}</strong></div>
    </div>
    <div class="preview-block"><h3>基础信息</h3><dl class="details">
      <div><dt>商品型号</dt><dd>{{ product.model || '—' }}</dd></div><div><dt>税收分类编码</dt><dd>{{ product.taxCode || '—' }}</dd></div>
      <div><dt>合同名称</dt><dd>{{ product.contractName || '—' }}</dd></div><div><dt>销售区域</dt><dd>{{ product.salesArea || '不限制' }}</dd></div>
      <div><dt>物流方式</dt><dd>{{ product.freightMode || '免运费' }}</dd></div><div><dt>商品属性</dt><dd>{{ product.attrs?.filter(a => a.name && a.value).map(a => `${a.name}：${a.value}`).join('、') || '—' }}</dd></div>
    </dl></div>
    <div class="preview-block"><h3>发布园区与供货价格</h3>
      <div v-for="park in parks.filter(p => product.parkIds.includes(p.id))" :key="park.id" class="park-summary">
        <strong>{{ park.name }}</strong>
        <template v-if="product.parks[park.id]"><dl class="details compact">
          <div><dt>货期</dt><dd>{{ product.parks[park.id].leadDays }} 天</dd></div><div><dt>起售量 / 递增量</dt><dd>{{ product.parks[park.id].minimum }} / {{ product.parks[park.id].increment }} {{ product.unit }}</dd></div><div><dt>库存</dt><dd>{{ product.parks[park.id].stock }}</dd></div>
          <div><dt>税点</dt><dd>{{ product.parks[park.id].tax }}%</dd></div><div><dt>采购价（未税）</dt><dd>¥{{ Number(product.parks[park.id].cost).toFixed(2) }}</dd></div><div><dt>原价（未税）</dt><dd>¥{{ Number(product.parks[park.id].original).toFixed(2) }}</dd></div>
          <div><dt>优惠方案</dt><dd>{{ product.parks[park.id].promotion === 'discount' ? `折扣价 ${product.parks[park.id].discount}%` : product.parks[park.id].promotion === 'fixed' ? `固定价 ¥${Number(product.parks[park.id].fixed).toFixed(2)}` : '无优惠' }}</dd></div><div><dt>销售价（未税）</dt><dd>¥{{ salePrice(product.parks[park.id]).toFixed(2) }}</dd></div><div><dt>销售价（含税）</dt><dd>¥{{ (salePrice(product.parks[park.id]) * (1 + product.parks[park.id].tax / 100)).toFixed(2) }}</dd></div>
        </dl></template>
      </div>
      <p v-if="!product.parkIds.length" class="muted">尚未选择园区</p>
    </div>
    <div class="preview-block"><h3>图文详情</h3><p class="muted">产品特点</p><p>{{ product.features || '—' }}</p><p class="muted">商品详情</p><div class="rich-preview" v-html="safeProductHtml(product.description) || '—'"></div><template v-if="product.images.length"><p class="muted">商品图片 / 视频</p><div class="gallery"><div v-for="(image, i) in product.images" :key="i"><DemoMedia :source="image" fit="contain" /></div></div></template></div>
  </section>
</template>
<style scoped>
.submit-preview>h2{font-size:17px;margin:0 0 6px}.intro,.muted{font-size:12px;color:#6c7d95;line-height:1.6}.intro{margin:0 0 18px}.preview-block{border:1px solid #e2e9f3;border-radius:9px;padding:18px 20px;margin-bottom:14px;background:#fff}.preview-block h3{margin:0 0 14px;font-size:15px;color:#223650}.product-overview{display:flex;gap:20px;align-items:center;background:#f8faff}.product-overview .cover{width:112px;height:112px;flex:none;overflow:hidden;border:1px solid #e1e8f2;border-radius:8px}.overview-text{min-width:0}.overview-text h3{font-size:17px;margin-bottom:8px}.overview-text p{font-size:13px;color:#64758d;margin:5px 0;overflow-wrap:anywhere}.overview-text strong{display:block;color:#315bc8;font-size:14px;margin-top:10px}.details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 24px;margin:0;font-size:13px}.details>div{display:flex;gap:10px;min-width:0}.details dt{color:#718199;flex:none}.details dd{margin:0;color:#273a57;overflow-wrap:anywhere}.compact{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px 16px;margin-top:12px}.park-summary{background:#f8faff;border-radius:7px;padding:14px;margin-top:10px;font-size:13px}.park-summary>strong{color:#263b5b}.preview-block>p:not(.muted){font-size:13px;color:#283b56;line-height:1.6}.muted{margin:14px 0 6px}.rich-preview{font-size:13px;line-height:1.7;overflow-wrap:anywhere}.rich-preview :deep(img){max-width:100%;height:auto}.gallery{display:flex;flex-wrap:wrap;gap:10px}.gallery>div{width:88px;height:88px;border:1px solid #e2e9f3;border-radius:6px;overflow:hidden}
</style>
