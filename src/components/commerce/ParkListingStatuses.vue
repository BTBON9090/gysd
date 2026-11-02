<script setup lang="ts">
import { ElPopover } from 'element-plus'
import { STATUS_LABEL, type ListingStatus } from '@/stores/commerce'

export interface ParkListing { status: ListingStatus; reason?: string; at?: string; forced?: boolean }
withDefaults(defineProps<{ parks: { id: string; name: string }[]; listings: Record<string, ParkListing>; rejectionFallback?: string }>(), { rejectionFallback: '请核对资料并重新提交。' })
</script>

<template>
  <div class="park-listing-statuses">
    <template v-for="park in parks.slice(0, 2)" :key="park.id">
      <ElPopover v-if="listings[park.id]?.status === 'rejected'" trigger="hover" :show-after="180" placement="bottom-start" :width="300">
        <template #reference><button type="button" class="park-status is-rejected actionable" :title="park.name"><b>{{ park.name }}</b><i>·</i><span class="reject-label">已驳回</span></button></template>
        <strong>园区审核未通过</strong><p class="reject-reason">{{ listings[park.id]?.reason || rejectionFallback }}</p><small v-if="listings[park.id]?.at">{{ listings[park.id]?.at?.slice(0, 19).replace('T', ' ') }}</small>
      </ElPopover>
      <span v-else class="park-status" :class="`is-${listings[park.id]?.status || 'draft'}`" :title="park.name"><b>{{ park.name }}</b><i>·</i><span>{{ listings[park.id] ? STATUS_LABEL[listings[park.id].status] : '未发布' }}</span><em v-if="listings[park.id]?.forced">运营下架</em></span>
    </template>
    <ElPopover v-if="parks.length > 2" trigger="click" placement="bottom-start" :width="330">
      <template #reference><button type="button" class="park-overflow">更多园区 +{{ parks.length - 2 }}</button></template>
      <div class="park-overflow-list"><div v-for="park in parks.slice(2)" :key="park.id"><strong>{{ park.name }}</strong><span :class="{ rejected: listings[park.id]?.status === 'rejected' }">{{ listings[park.id] ? STATUS_LABEL[listings[park.id].status] : '未发布' }}<template v-if="listings[park.id]?.forced"> · 运营下架</template></span><small v-if="listings[park.id]?.status === 'rejected'">{{ listings[park.id]?.reason || rejectionFallback }}</small></div></div>
    </ElPopover>
    <span v-if="!parks.length" class="empty-parks">尚未加入园区</span>
  </div>
</template>

<style scoped>
.park-listing-statuses{display:flex;width:100%;flex-wrap:nowrap;white-space:nowrap;gap:5px;margin-top:7px;min-width:0}.park-status{display:inline-flex;align-items:center;gap:5px;max-width:min(260px,100%);min-width:0;height:22px;box-sizing:border-box;padding:0 7px;border:1px solid #dde6f4;border-radius:6px;background:#f6f9ff;color:#52647e;font-size:11px;line-height:20px;white-space:nowrap}.park-status b{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}.park-status i{flex:none;font-style:normal;color:#596a80}.park-status>span{flex:none;color:#3157b3;font-weight:650}.park-status em{flex:none;color:#bb5647;font-style:normal}.park-status.is-on_sale{border-color:#bee9d9;background:#f1fbf7}.park-status.is-on_sale>span{color:#167c5f}.park-status.is-offline{border-color:#f5d6c1;background:#fff8f4}.park-status.is-offline>span{color:#ad6632}.park-status.actionable{cursor:pointer;text-align:left;font-family:inherit}.park-status.is-rejected{border-color:#f0b3ae;background:#fff0ef}.park-status.is-rejected>span{color:#b74239}.reject-label{position:relative}.reject-label::after{content:'';position:absolute;right:-5px;top:-4px;width:6px;height:6px;border-radius:50%;background:#d83731;box-shadow:0 0 0 2px #fff0ef}.reject-reason{margin:8px 0;color:#4b5d75;font-size:12px;line-height:1.6}.park-overflow{display:inline-flex;align-items:center;justify-content:center;flex:none;height:22px;box-sizing:border-box;padding:0 7px;border:1px solid #dce5f4;border-radius:6px;background:#f7f9fe;color:#3659b8;font:inherit;font-size:11px;line-height:20px;white-space:nowrap;cursor:pointer}.park-overflow-list{display:grid;gap:0}.park-overflow-list>div{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px;padding:9px 0;border-bottom:1px solid #edf1f7;font-size:12px}.park-overflow-list>div:last-child{border-bottom:0}.park-overflow-list strong{overflow-wrap:anywhere;color:#41536e}.park-overflow-list span{color:#57709b}.park-overflow-list span.rejected{color:#bd443d}.park-overflow-list small{grid-column:1/-1;color:#a75a54;line-height:1.5}.empty-parks{color:#596a80;font-size:12px}
</style>
