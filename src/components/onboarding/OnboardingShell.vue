<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { House, Trash2, Save, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { ElButton, ElMessage, ElMessageBox } from 'element-plus'
import { useOnboardingStore, STEPS } from '@/stores/onboarding'
import { useAcceptanceStore } from '@/stores/acceptance'

const props = defineProps<{
  step?: number
  title?: string
  subtitle?: string
  showSteps?: boolean
  showFooter?: boolean
  nextDisabled?: boolean
}>()

const emit = defineEmits<{ next: []; prev: [] }>()

const route = useRoute()
const router = useRouter()
const ob = useOnboardingStore()
const acc = useAcceptanceStore()

const showSteps = computed(() => props.showSteps ?? true)
const showFooter = computed(() => props.showFooter ?? true)
const step = computed(() => props.step ?? 0)

const stepItems = computed(() =>
  STEPS.map((s) => ({
    ...s,
    status:
      step.value === 0
        ? 'wait'
        : s.n < step.value
          ? 'finish'
          : s.n === step.value
            ? 'process'
            : ob.maxStep >= s.n
              ? 'wait'
              : 'wait',
  })),
)

async function onDeleteDraft() {
  try {
    await ElMessageBox.confirm('删除后将清空本流程已填内容，确定删除草稿？', '删除草稿', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    ob.resetDraft()
    ElMessage.success('草稿已删除')
    router.push('/onboarding')
  } catch {
    /* cancel */
  }
}

function onSave() {
  ob.saveDraft()
  ElMessage.success(ob.savedAt ? `已暂存 ${ob.savedAt}` : '已暂存')
}

function goHome() {
  router.push('/onboarding')
}

function onPrev() {
  if (step.value > 1) {
    router.push(`/onboarding/step/${step.value - 1}`)
  } else if (route.path.startsWith('/onboarding/step/')) {
    router.push('/onboarding/entity')
  } else if (route.path.startsWith('/onboarding/entity')) {
    router.push('/onboarding')
  } else {
    router.push('/workspace')
  }
  emit('prev')
}

function onNext() {
  emit('next')
}
</script>

<template>
  <div class="ob">
    <header class="ob-top">
      <div class="ob-top-left">
        <button class="ghost-btn" type="button" @click="goHome">
          <House :size="15" />
          <span>返回入驻首页</span>
        </button>
        <button class="ghost-btn danger" type="button" @click="onDeleteDraft">
          <Trash2 :size="15" />
          <span>删除草稿</span>
        </button>
      </div>
      <div class="ob-top-right">
        <span class="ob-status" :class="{ done: acc.entryStatus === 'approved' }">
          {{ acc.entryStatus === 'approved' ? '入驻：已通过' : '入驻：待提交' }}
        </span>
        <ElButton size="small" @click="onSave">
          <Save :size="14" style="margin-right: 4px" />
          暂存草稿
        </ElButton>
        <span class="ob-user">
          <span class="ob-avatar">新</span>
          <span class="ob-user-meta">
            <strong>新注册用户</strong>
            <small>未完善企业信息</small>
          </span>
        </span>
      </div>
    </header>

    <div v-if="showSteps && step > 0" class="ob-steps">
      <ol class="steps-row">
        <li
          v-for="s in stepItems"
          :key="s.n"
          class="step-item"
          :class="{
            finish: s.n < step,
            process: s.n === step,
            clickable: ob.maxStep >= s.n && s.n !== step,
          }"
          @click="ob.maxStep >= s.n && s.n !== step && router.push(`/onboarding/step/${s.n}`)"
        >
          <span class="step-dot">
            <template v-if="s.n < step">✓</template>
            <template v-else>{{ s.n }}</template>
          </span>
          <span class="step-label">{{ s.label }}</span>
          <span v-if="s.n < STEPS.length" class="step-line" />
        </li>
      </ol>
    </div>

    <main class="ob-main" :class="{ 'no-steps': !showSteps }">
      <div v-if="title" class="ob-page-head">
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <slot />
    </main>

    <footer v-if="showFooter" class="ob-footer">
      <div class="ob-footer-inner">
        <ElButton class="prev-btn" :disabled="step <= 1 && route.path === '/onboarding/step/1'" @click="onPrev">
          <ChevronLeft :size="15" style="margin-right: 4px" />
          上一步
        </ElButton>
        <ElButton
          type="primary"
          class="next-btn"
          :disabled="nextDisabled"
          @click="onNext"
        >
          {{ step === 5 ? '提交入驻' : '下一步' }}
          <ChevronRight :size="15" style="margin-left: 4px" />
        </ElButton>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.ob {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
}

.ob-top {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 20px;
  background: var(--bg-topbar);
  border-bottom: 1px solid var(--border-light);
}
.ob-top-left,
.ob-top-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border-strong);
  border-radius: var(--r-pill);
  background: #fff;
  color: var(--text-regular);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--t-fast), border-color var(--t-fast), color var(--t-fast);
}
.ghost-btn:hover {
  background: var(--bg-hover);
  border-color: var(--brand);
  color: var(--brand);
}
.ghost-btn.danger:hover {
  border-color: var(--status-danger);
  color: var(--status-danger);
  background: var(--status-danger-soft);
}
.ob-status {
  height: 26px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  border-radius: var(--r-pill);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--brand);
  background: var(--brand-soft);
  border: 1px solid rgba(59, 99, 211, 0.16);
}
.ob-status.done {
  color: var(--status-success);
  background: var(--status-success-soft);
  border-color: rgba(22, 163, 74, 0.16);
}
.ob-user {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 4px;
}
.ob-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--brand);
  background: var(--brand-soft-strong);
}
.ob-user-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.ob-user-meta strong {
  font-size: 13px;
  color: var(--text-primary);
}
.ob-user-meta small {
  font-size: 11px;
  color: var(--text-placeholder);
}

.ob-steps {
  background: #fff;
  border-bottom: 1px solid var(--border-light);
  padding: 14px 24px;
}
.steps-row {
  list-style: none;
  margin: 0 auto;
  padding: 0;
  max-width: 920px;
  display: flex;
  align-items: center;
}
.step-item {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  color: var(--text-placeholder);
}
.step-item:last-child {
  flex: 0 0 auto;
}
.step-item.clickable {
  cursor: pointer;
}
.step-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 12.5px;
  font-weight: 700;
  background: var(--bg-chip);
  color: var(--text-secondary);
  flex-shrink: 0;
  transition: background var(--t-fast), color var(--t-fast);
}
.step-label {
  margin-left: 8px;
  font-size: 13.5px;
  font-weight: 500;
  white-space: nowrap;
}
.step-line {
  flex: 1;
  height: 1px;
  min-width: 24px;
  margin: 0 12px;
  background: var(--border-strong);
}
.step-item.finish .step-dot {
  background: var(--status-success);
  color: #fff;
}
.step-item.finish .step-label {
  color: var(--text-regular);
}
.step-item.finish .step-line {
  background: rgba(22, 163, 74, 0.35);
}
.step-item.process .step-dot {
  background: var(--brand);
  color: #fff;
  box-shadow: 0 0 0 3px var(--brand-soft-strong);
}
.step-item.process .step-label {
  color: var(--brand);
  font-weight: 700;
}

.ob-main {
  flex: 1;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 24px 20px 32px;
}
.ob-main.no-steps {
  max-width: 960px;
}
.ob-page-head {
  margin-bottom: 16px;
}
.ob-page-head h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}
.ob-page-head p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.ob-footer {
  position: sticky;
  bottom: 0;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--border-light);
  z-index: 20;
}
.ob-footer-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.next-btn {
  min-width: 140px;
}
.prev-btn {
  min-width: 110px;
}

@media (max-width: 720px) {
  .ob-top {
    flex-wrap: wrap;
    height: auto;
    padding: 10px 12px;
  }
  .ob-user-meta,
  .ghost-btn span {
    display: none;
  }
  .step-label {
    display: none;
  }
  .step-item.process .step-label {
    display: inline;
  }
}
</style>
