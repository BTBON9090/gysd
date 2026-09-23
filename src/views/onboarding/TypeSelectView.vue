<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Handshake, Factory, ShoppingBag, Truck, Boxes, ClipboardCheck, ArrowRight } from 'lucide-vue-next'
import { ElButton, ElTag } from 'element-plus'
import { useOnboardingStore, SUPPLIER_TYPES } from '@/stores/onboarding'
import OnboardingShell from '@/components/onboarding/OnboardingShell.vue'

const router = useRouter()
const ob = useOnboardingStore()
const selected = ref(ob.draft.supplierType)

const iconMap = {
  service: Handshake,
  manufacturer: Factory,
  trader: ShoppingBag,
  logistics: Truck,
  material: Boxes,
  testing: ClipboardCheck,
} as const

function start() {
  if (selected.value !== 'service') return
  ob.draft.supplierType = selected.value
  ob.persist()
  router.push('/onboarding/entity')
}
</script>

<template>
  <OnboardingShell :show-steps="false" :show-footer="false">
    <div class="type-page">
      <header class="type-head">
        <p class="eyebrow">供应商入驻</p>
        <h1>选择要入驻的供应商类型</h1>
        <p class="sub">同一账号可申请多种类型。本次开放「服务商」入驻，其他类型敬请期待。</p>
      </header>

      <div class="type-grid">
        <button
          v-for="t in SUPPLIER_TYPES"
          :key="t.id"
          class="type-card"
          :class="{ active: selected === t.id, disabled: !t.enabled }"
          type="button"
          :disabled="!t.enabled"
          @click="selected = t.id"
        >
          <span class="type-icon">
            <component :is="iconMap[t.id]" :size="20" stroke-width="1.7" />
          </span>
          <strong>{{ t.label }}</strong>
          <small>{{ t.desc }}</small>
          <ElTag v-if="t.enabled" type="primary" size="small" effect="light" round>可入驻</ElTag>
          <ElTag v-else type="info" size="small" effect="plain" round>敬请期待</ElTag>
        </button>
      </div>

      <div class="type-actions">
        <ElButton type="primary" size="large" round :disabled="selected !== 'service'" @click="start">
          开始入驻 · 服务商
          <ArrowRight :size="16" style="margin-left: 6px" />
        </ElButton>
        <p class="hint">下一步选择经营主体类型（个人 / 个体工商户 / 企业）</p>
      </div>
    </div>
  </OnboardingShell>
</template>

<style scoped>
.type-page {
  padding-top: 12px;
}
.type-head {
  margin-bottom: 22px;
}
.eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--brand);
}
.type-head h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}
.sub {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.type-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 18px 16px 16px;
  border: 1px solid var(--border-light);
  border-radius: var(--r-lg);
  background: var(--bg-card);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--t-fast), box-shadow var(--t-fast), background var(--t-fast);
}
.type-card:hover:not(:disabled) {
  border-color: var(--border-strong);
}
.type-card.active {
  border-color: var(--brand);
  background: var(--brand-soft);
  box-shadow: 0 0 0 1px var(--brand);
}
.type-card.disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.type-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: var(--c-blue-bg);
  color: var(--c-blue);
}
.type-card.active .type-icon {
  background: var(--brand);
  color: #fff;
}
.type-card strong {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}
.type-card small {
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.5;
  min-height: 36px;
}

.type-actions {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.hint {
  margin: 0;
  font-size: 12.5px;
  color: var(--text-placeholder);
}

@media (max-width: 800px) {
  .type-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 520px) {
  .type-grid {
    grid-template-columns: 1fr;
  }
}
</style>
