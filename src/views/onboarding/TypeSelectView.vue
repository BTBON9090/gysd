<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Handshake, Factory, ShoppingBag, Truck, Boxes, ClipboardCheck, ArrowRight } from 'lucide-vue-next'
import { ElTag } from 'element-plus'
import { useOnboardingStore, SUPPLIER_TYPES } from '@/stores/onboarding'
import OnboardingShell from '@/components/onboarding/OnboardingShell.vue'

const router = useRouter()
const ob = useOnboardingStore()

const iconMap = {
  service: Handshake,
  manufacturer: Factory,
  trader: ShoppingBag,
  logistics: Truck,
  material: Boxes,
  testing: ClipboardCheck,
} as const

function start() {
  ob.draft.supplierType = 'service'
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
          :class="{ disabled: !t.enabled }"
          type="button"
          :disabled="!t.enabled"
          @click="t.enabled && start()"
        >
          <span class="type-icon">
            <component :is="iconMap[t.id]" :size="20" stroke-width="1.7" />
          </span>
          <strong>{{ t.label }}</strong>
          <small>{{ t.desc }}</small>
          <span class="type-foot">
            <ElTag v-if="t.enabled" type="primary" size="small" effect="light" round>可入驻</ElTag>
            <ElTag v-else type="info" size="small" effect="plain" round>敬请期待</ElTag>
            <span v-if="t.enabled" class="type-cta">
              开始入驻
              <ArrowRight :size="14" />
            </span>
          </span>
        </button>
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
  border-radius: var(--r-xl);
  background: var(--bg-card);
  text-align: left;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition: border-color var(--t-fast), box-shadow var(--t-fast), background var(--t-fast), transform var(--t-fast);
}
.type-card:hover:not(:disabled) {
  border-color: var(--brand);
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-1px);
}
.type-card:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}
.type-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--r-md);
  display: grid;
  place-items: center;
  background: var(--c-blue-bg);
  color: var(--c-blue);
}
.type-card:hover:not(:disabled) .type-icon {
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
.type-foot {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}
.type-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 14px;
  border-radius: var(--r-pill);
  background: var(--brand);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  box-shadow: var(--shadow-brand);
  transition: background var(--t-fast);
}
.type-card:hover:not(:disabled) .type-cta {
  background: var(--brand-hover);
}

</style>
