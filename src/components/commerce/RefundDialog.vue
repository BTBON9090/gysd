<script setup lang="ts">
import MoneyText from '@/components/commerce/MoneyText.vue'
import { computed, reactive, ref, watch } from 'vue'
import { ElButton, ElDialog, ElInput, ElInputNumber, ElMessage, ElRadioButton, ElRadioGroup, ElTag } from 'element-plus'
import { dateText, money, STATUS_LABEL, useCommerceStore } from '@/stores/commerce'
const props = withDefaults(defineProps<{ modelValue: boolean; refundId?: string; mode?: 'view' | 'agree' | 'change' | 'reject' }>(), { mode: 'view' })
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const c = useCommerceStore()
const refund = computed(() => c.data.refunds.find(r => r.id === props.refundId))
const order = computed(() => c.data.orders.find(o => o.id === refund.value?.orderId))
const stage = computed(() => order.value?.stages?.find(s => s.id === refund.value?.stageId))
const maxRefund = computed(() => Math.min((order.value?.paid || 0) - (order.value?.refunded || 0), stage.value ? stage.value.paid - stage.value.refunded : Infinity))
const mode = ref(props.mode)
const submitted = ref(false)
const amountError = computed(() => submitted.value && mode.value !== 'reject' && (!Number.isFinite(form.amount) || form.amount <= 0 || form.amount > maxRefund.value) ? '请输入大于 0 且不超过当前可退余额的金额' : '')
const noteError = computed(() => submitted.value && mode.value !== 'agree' && !form.note.trim() ? '请填写处理说明' : '')
const form = reactive({ amount: 0, decision: 'continue' as 'continue' | 'close', note: '' })
watch(() => [props.modelValue, props.refundId], () => {
  if (!props.modelValue || !refund.value) return
  submitted.value = false
  mode.value = refund.value.status === 'pending' ? props.mode : 'view'
  Object.assign(form, { amount: refund.value.requested, decision: refund.value.decision, note: '' })
}, { immediate: true })
watch(mode, value => { if (value === 'agree' && refund.value) form.amount = refund.value.requested })
function submit() {
  if (!refund.value || mode.value === 'view') return
  submitted.value = true
  if (amountError.value || noteError.value) return
  if (!c.decideRefund(refund.value.id, mode.value, form.amount, form.decision, form.note)) { ElMessage.error('请检查可退余额、必填说明和发票状态'); return }
  ElMessage.success(mode.value === 'change' ? '方案已提交，等待客户确认' : mode.value === 'reject' ? '已拒绝退款，等待客户重新申请或撤销' : '退款完成，订单资金已更新')
  mode.value = 'view'
}
</script>
<template>
  <ElDialog :model-value="modelValue" title="退款详情与处理" width="820px" append-to-body @update:model-value="emit('update:modelValue', $event)">
    <div v-if="refund && order" class="refund-dialog">
      <div class="refund-heading"><div><span>客户申请退款</span><strong><b class="money-value">{{ money(refund.requested) }}</b></strong></div><ElTag :type="refund.status === 'refunded' ? 'success' : refund.status === 'cancelled' ? 'info' : 'danger'">{{ STATUS_LABEL[refund.status] }}</ElTag></div>
      <div class="refund-columns" :class="{ processing: refund.status === 'pending' && mode !== 'view' }"><section class="request-summary"><h4>申请信息</h4><dl><dt>关联阶段</dt><dd>{{ stage?.name || '整笔订单' }}</dd><dt>退款单号</dt><dd>{{ refund.id }}</dd><dt>申请时间</dt><dd>{{ dateText(refund.createdAt) }}</dd><dt>申请原因</dt><dd>{{ refund.reason }}</dd><template v-if="refund.status === 'pending'"><dt>客户诉求</dt><dd>退款后{{ refund.decision === 'close' ? '关闭订单' : '继续履约' }}</dd></template><template v-if="refund.status === 'refunded' || refund.status === 'client_confirm'"><dt>{{ refund.status === 'refunded' ? '实际退款' : '调整后金额' }}</dt><dd><b class="money-value">{{ money(refund.agreed) }}</b> · {{ refund.decision === 'close' ? '关闭订单' : '继续履约' }}</dd></template><template v-if="refund.note"><dt>处理说明</dt><dd>{{ refund.note }}</dd></template></dl><div class="refund-balance"><span>累计支付 <b><b class="money-value">{{ money(stage?.paid ?? order.paid) }}</b></b></span><span>累计已退 <b><b class="money-value">{{ money(stage?.refunded ?? order.refunded) }}</b></b></span><span>当前可退 <b><b class="money-value">{{ money(maxRefund) }}</b></b></span><small>{{ stage ? '以上为关联阶段资金；退款后的履约范围以处理方案为准。' : '以上为整单资金。' }}</small></div></section>
      <template v-if="refund.status === 'pending' && mode !== 'view'">
        <div class="resolution-box"><h4>处理方案</h4><label>处理方式</label><ElRadioGroup v-model="mode" size="default"><ElRadioButton value="agree">同意原金额</ElRadioButton><ElRadioButton value="change">调整金额</ElRadioButton><ElRadioButton value="reject">拒绝退款</ElRadioButton></ElRadioGroup>
          <template v-if="mode !== 'reject'"><label>退款金额 <small>当前可退 <b class="money-value">{{ money(maxRefund) }}</b></small></label><ElInputNumber v-if="mode === 'change'" :class="{ 'has-error': amountError }" v-model="form.amount" :min="0.01" :max="maxRefund" :precision="2" :controls="false" /><strong v-else><b class="money-value">{{ money(refund.requested) }}</b></strong><span v-if="amountError" class="field-error">{{ amountError }}</span><label>退款后订单</label><ElRadioGroup v-model="form.decision" size="default"><ElRadioButton value="continue">继续履约</ElRadioButton><ElRadioButton value="close">关闭订单</ElRadioButton></ElRadioGroup><p>{{ form.decision === 'close' ? '关闭后停止后续付款、签约和交付，剩余实付按售后期结算。' : '退款完成后恢复当前履约节点，后续未付阶段按原计划继续。' }}</p></template>
          <label>{{ mode === 'agree' ? '处理说明（选填）' : mode === 'change' ? '调整说明（必填）' : '拒绝理由（必填）' }}</label><ElInput :class="{ 'has-error': noteError }" v-model="form.note" type="textarea" :rows="3" maxlength="500" show-word-limit /><span v-if="noteError" class="field-error">{{ noteError }}</span>
          <p v-if="mode === 'change'">修改金额需客户确认；客户不同意时退回待处理。</p>
        </div>
      </template></div>
      <p v-if="refund.status === 'client_confirm'" class="result-note">调整方案已发送，等待客户确认。确认前继续暂停履约和新开票。</p>
      <p v-if="refund.status === 'rejected'" class="result-note">等待客户重新申请或撤销；完成前仍暂停履约与新开票。</p>
      <details v-if="refund.history?.length" class="refund-history" open><summary>处理记录 · {{ refund.history.length }} 条</summary><div v-for="(event,index) in refund.history" :key="index"><time>{{ dateText(event.at) }}</time><span><MoneyText :text="event.text" /></span></div></details>
    </div>
    <template #footer><ElButton @click="emit('update:modelValue', false)">关闭</ElButton><ElButton v-if="refund?.status === 'pending' && mode === 'view'" type="primary" @click="mode = 'agree'">处理退款</ElButton><ElButton v-else-if="refund?.status === 'pending' && mode !== 'view'" :type="mode === 'reject' ? 'danger' : 'primary'" @click="submit">{{ mode === 'change' ? '提交客户确认' : mode === 'reject' ? '确认拒绝' : '确认退款' }}</ElButton></template>
  </ElDialog>
</template>
<style scoped>
.refund-dialog{font-size:13px;color:#33455f}.refund-heading{display:flex;align-items:center;gap:12px;margin-bottom:20px}.refund-heading strong{font-size:25px;font-variant-numeric:tabular-nums;color:#283b57}.refund-dialog dl{display:grid;grid-template-columns:80px 1fr;gap:10px 16px;margin:0}.refund-dialog dt{color:#596a80}.refund-dialog dd{margin:0;line-height:1.6;overflow-wrap:anywhere}.resolution-box{margin-top:20px;padding:18px;background:#f7f9fc;border-radius:8px;display:flex;align-items:flex-start;flex-direction:column;gap:10px}.resolution-box label{font-weight:600}.resolution-box small{font-weight:400;color:#596a80;margin-left:10px}.resolution-box p,.result-note{margin:0;color:#596a80;font-size:12px;line-height:1.6}.result-note{margin-top:16px;padding:12px;background:#fff7ed;color:#916631}.refund-history{margin-top:20px}.refund-history h4{font-size:13px;margin:0 0 12px}.refund-history>div{display:grid;grid-template-columns:140px 1fr;gap:12px;padding:8px 0;font-size:12px;line-height:1.6}.refund-history time{color:#596a80}
</style>

<style scoped>
.refund-heading{padding-bottom:18px;border-bottom:1px solid #e8edf5;margin-bottom:20px;justify-content:space-between}.refund-heading>div{display:flex;align-items:baseline;gap:12px}.refund-heading>div>span{font-size:12px;color:#596a80}.refund-heading strong{font-size:28px}.refund-columns.processing{display:grid;grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);gap:24px}.refund-dialog h4{margin:0 0 16px;font-size:14px;color:#293c58}.refund-dialog dl{grid-template-columns:60px minmax(0,1fr);gap:12px}.refund-balance{display:grid;gap:9px;padding:16px 0;margin-top:18px;border-top:1px solid #edf1f6}.refund-balance>span{display:flex;justify-content:space-between;color:#596a80;font-size:12px}.refund-balance b{font-weight:500;color:#334e70;font-variant-numeric:tabular-nums}.refund-balance small{color:#596a80;line-height:1.6;font-size:11px}.resolution-box{margin-top:0;padding:16px;gap:12px;background:#f6f8fc}.resolution-box h4{margin:0 0 2px}.resolution-box :deep(.el-radio-button__inner){height:32px;padding:0 12px;font-size:12px;min-width:86px;display:flex;align-items:center;justify-content:center;line-height:1.2}.resolution-box :deep(.el-input-number){width:100%}.resolution-box label{font-size:12px}.resolution-box small{display:block;margin:5px 0 0;font-size:11px}.refund-history{border-top:1px solid #e8edf5;padding-top:15px;margin-top:20px}.refund-history summary{font-weight:600;cursor:pointer;color:#60728e;font-size:12px}.refund-history>div{grid-template-columns:135px 1fr;padding:10px 0 0}.refund-dialog .result-note{margin-top:12px}
</style>
