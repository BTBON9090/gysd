<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, Building2, Factory, Handshake, ShoppingBag, Truck } from 'lucide-vue-next'

const emit = defineEmits<{ start: [] }>()
const types = [
  { id: 'service', label: '服务商', icon: Handshake, available: true },
  { id: 'manufacture-demo', label: '制造类', icon: Factory, available: false },
  { id: 'trade-demo', label: '贸易类', icon: ShoppingBag, available: false },
  { id: 'logistics-demo', label: '物流类', icon: Truck, available: false },
] as const
const selected = ref<(typeof types)[number]['id']>('service')
const current = computed(() => types.find(type => type.id === selected.value) || types[0])
const steps = ['核验经营主体', '填写入驻资料', '提交园区审核', '查询审核进度']
</script>

<template>
  <div class="landing-v2">
    <header class="landing-head">
      <div>
        <p class="eyebrow">供应商入驻</p>
        <h1>选择入驻类型</h1>
        <p>本期开放服务商入驻。其余类型仅作布局演示，名称与申请规则待 PRD 确认。</p>
      </div>
      <div class="head-mark"><Building2 :size="18" /> 园区供应商服务</div>
    </header>

    <div class="selection-layout">
      <nav class="type-rail" aria-label="供应商类型">
        <button v-for="type in types" :key="type.id" type="button" class="type-option" :class="{ active: selected === type.id }" @click="selected = type.id">
          <component :is="type.icon" :size="17" :stroke-width="1.8" />
          <span>{{ type.label }}</span>
          <small :class="{ demo: !type.available }">{{ type.available ? '开放中' : '示例' }}</small>
        </button>
      </nav>

      <section class="type-detail" :class="{ unavailable: !current.available }">
        <div class="detail-top">
          <span class="detail-icon"><component :is="current.icon" :size="25" :stroke-width="1.7" /></span>
          <span class="status-chip" :class="{ muted: !current.available }">{{ current.available ? '本期可申请' : '设计演示 · 未开放' }}</span>
        </div>
        <h2>{{ current.label }}入驻</h2>
        <p class="detail-desc">{{ current.available ? '面向园区企业提供企业服务。按流程提交主体信息、资质证件、产品服务和入驻协议，由园区运营审核。' : '此类型用于展示多类型入口的布局与切换。具体类型名称、申请条件、字段和流程均待业务定义。' }}</p>

        <div v-if="current.available" class="detail-flow">
          <span v-for="(label, index) in steps" :key="label"><b>{{ String(index + 1).padStart(2, '0') }}</b>{{ label }}</span>
        </div>
        <div v-else class="demo-note">视觉占位，不会创建申请或进入服务商表单。</div>

        <button class="apply-button" type="button" :disabled="!current.available" @click="emit('start')">
          {{ current.available ? '申请入驻' : '待业务定义' }} <ArrowRight v-if="current.available" :size="17" />
        </button>
      </section>
    </div>

    <p class="existing-hint">已有申请？从顶栏「切换主体」选择申请，可继续填写或查看审核进度。</p>
  </div>
</template>

<style scoped>
.landing-v2 { max-width: 1030px; margin: 18px auto 64px; }
.landing-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin-bottom: 30px; }
.eyebrow { font-size: 12px; font-weight: 700; color: #405fce; margin: 0 0 11px; }
.landing-head h1 { font-size: 34px; line-height: 1.18; letter-spacing: -.035em; color: #18243b; margin: 0; }
.landing-head p:last-child { margin: 11px 0 0; color: #58667b; font-size: 14px; }
.head-mark { display: flex; align-items: center; gap: 8px; color: #52627d; background: #f1f5ff; border-radius: 8px; padding: 9px 12px; font-size: 12px; white-space: nowrap; }
.selection-layout { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 22px; }
.type-rail { display: flex; align-self: start; flex-direction: column; gap: 4px; padding: 8px; background: #f7f9fd; border-radius: 13px; }
.type-option { display: flex; align-items: center; gap: 10px; width: 100%; height: 50px; padding: 0 12px; border: 0; border-radius: 9px; background: transparent; text-align: left; color: #55647b; font: inherit; font-size: 13px; cursor: pointer; }
.type-option:hover { background: #edf2fc; color: #1b315d; }
.type-option.active { background: #fff; color: #2445ab; box-shadow: 0 2px 8px rgba(38, 68, 132, .08); font-weight: 700; }
.type-option span { flex: 1; }
.type-option small { font-size: 11px; font-weight: 600; color: #1b9a8f; }
.type-option small.demo { color: #8a96a9; }
.type-detail { min-height: 390px; padding: 28px 34px 30px; border: 1px solid #e4e9f2; border-radius: 14px; background: #fff; box-shadow: 0 7px 26px rgba(29, 47, 83, .04); }
.detail-top { display: flex; justify-content: space-between; align-items: flex-start; }
.detail-icon { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 13px; color: #405fce; background: #eaf0ff; }
.status-chip { padding: 5px 9px; border-radius: 6px; color: #087f78; background: #e7f7f4; font-size: 11px; font-weight: 700; }
.status-chip.muted { color: #68778b; background: #f0f3f7; }
.type-detail h2 { margin: 22px 0 8px; font-size: 25px; line-height: 1.2; letter-spacing: -.025em; color: #17243a; }
.detail-desc { max-width: 580px; min-height: 48px; margin: 0; color: #516078; font-size: 14px; line-height: 1.7; }
.detail-flow { display: flex; flex-wrap: wrap; gap: 10px; margin: 24px 0; }
.detail-flow span { display: flex; align-items: center; gap: 7px; padding: 7px 10px; border-radius: 7px; background: #f5f7fc; color: #48566c; font-size: 12px; }
.detail-flow b { color: #4665cf; font-size: 11px; }
.demo-note { display: inline-flex; margin: 24px 0; padding: 9px 12px; border-radius: 7px; background: #f4f6fa; color: #637188; font-size: 12px; }
.apply-button { display: inline-flex; align-items: center; justify-content: center; gap: 25px; height: 42px; padding: 0 17px; border: 0; border-radius: 8px; background: #3755c4; color: #fff; font-weight: 700; font-size: 13px; cursor: pointer; box-shadow: 0 4px 10px rgba(55, 85, 196, .16); }
.apply-button:hover:not(:disabled) { background: #2945b2; }
.apply-button:disabled { background: #e8ecf3; color: #748197; box-shadow: none; cursor: not-allowed; }
.existing-hint { margin: 19px 0 0; color: #69768b; font-size: 12.5px; }
@media (max-width: 820px) { .selection-layout { grid-template-columns: 1fr; } .type-rail { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); } .head-mark { display: none; } }
@media (max-width: 560px) { .landing-head h1 { font-size: 29px; } .type-option { height: 45px; font-size: 12px; padding: 0 9px; } .type-option small { display: none; } .type-detail { padding: 24px 20px; } }
</style>
