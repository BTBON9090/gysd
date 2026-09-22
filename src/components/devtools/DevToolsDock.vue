<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Wrench,
  GitCompare,
  Layers,
  ListChecks,
  X,
  Copy,
  CheckCheck,
  Plus,
  Trash2,
} from 'lucide-vue-next'
import { useAcceptanceStore, DESIGN_VERSIONS, type PageDataState } from '@/stores/acceptance'

const acc = useAcceptanceStore()
const draft = ref('')
const copied = ref(false)

const stateOptions: { value: PageDataState; label: string }[] = [
  { value: 'ready', label: '有数据' },
  { value: 'loading', label: '加载中' },
  { value: 'empty', label: '空态' },
  { value: 'error', label: '异常' },
]

const levelText = { high: '高', mid: '中', low: '低' } as const

const issueCount = computed(() => acc.issues.length)

function submitIssue() {
  const text = draft.value.trim()
  if (!text) return
  acc.addIssue(text, '工作台', 'mid')
  draft.value = ''
}

async function copyIssues() {
  try {
    await navigator.clipboard.writeText(acc.exportIssues())
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {
    /* 剪贴板不可用时静默 */
  }
}
</script>

<template>
  <div class="dock" :class="{ open: acc.panelOpen }">
    <!-- 展开面板 -->
    <transition name="panel">
      <div v-if="acc.panelOpen" class="panel" role="dialog" aria-label="验收工具">
        <header class="panel-head">
          <div class="panel-title">
            <Wrench :size="16" />
            <strong>版本切换 · 验收工具</strong>
          </div>
          <button class="close-btn" type="button" aria-label="关闭面板" @click="acc.panelOpen = false">
            <X :size="16" />
          </button>
        </header>

        <div class="panel-body">
          <!-- 版本 -->
          <section class="sec">
            <h3><Layers :size="14" /> 设计版本</h3>
            <div class="version-list">
              <button
                v-for="v in DESIGN_VERSIONS"
                :key="v.id"
                class="version-item"
                :class="{ active: acc.versionId === v.id }"
                type="button"
                @click="acc.setVersion(v.id)"
              >
                <span class="v-dot" />
                <span class="v-text">
                  <strong>{{ v.label }}</strong>
                  <small>{{ v.desc }}</small>
                </span>
                <CheckCheck v-if="acc.versionId === v.id" :size="15" class="v-check" />
              </button>
            </div>
          </section>

          <!-- 数据状态 -->
          <section class="sec">
            <h3>页面状态</h3>
            <div class="seg" role="tablist" aria-label="数据状态">
              <button
                v-for="s in stateOptions"
                :key="s.value"
                class="seg-btn"
                :class="{ active: acc.dataState === s.value }"
                type="button"
                role="tab"
                :aria-selected="acc.dataState === s.value"
                @click="acc.setDataState(s.value)"
              >
                {{ s.label }}
              </button>
            </div>
          </section>

          <!-- 对比 -->
          <section class="sec">
            <h3><GitCompare :size="14" /> 分屏对比</h3>
            <label class="switch-row">
              <span>
                <strong>左右对比模式</strong>
                <small>左：V0.9 原型参考 · 右：当前版本</small>
              </span>
              <input
                type="checkbox"
                :checked="acc.compareMode"
                @change="acc.toggleCompare(($event.target as HTMLInputElement).checked)"
              />
              <span class="switch" aria-hidden="true" />
            </label>
          </section>

          <!-- 问题清单 -->
          <section class="sec">
            <h3><ListChecks :size="14" /> 验收清单 <em>{{ issueCount }}</em></h3>
            <form class="issue-form" @submit.prevent="submitIssue">
              <input
                v-model="draft"
                type="text"
                placeholder="记录一条验收问题…"
                maxlength="120"
                aria-label="验收问题"
              />
              <button class="add-btn" type="submit" aria-label="添加">
                <Plus :size="16" />
              </button>
            </form>

            <ul v-if="issueCount" class="issue-list">
              <li v-for="i in acc.issues" :key="i.id">
                <span class="lvl" :class="i.level">{{ levelText[i.level] }}</span>
                <div class="issue-body">
                  <p>{{ i.content }}</p>
                  <time>{{ i.createdAt }}</time>
                </div>
                <button class="del" type="button" aria-label="删除" @click="acc.removeIssue(i.id)">
                  <Trash2 :size="14" />
                </button>
              </li>
            </ul>
            <p v-else class="issue-empty">暂无问题。切换上方状态验收各态，发现问题点这里记录。</p>

            <button class="export-btn" type="button" :disabled="!issueCount" @click="copyIssues">
              <Copy :size="14" />
              {{ copied ? '已复制到剪贴板' : '导出清单' }}
            </button>
          </section>
        </div>
      </div>
    </transition>

    <!-- 浮动触发器 -->
    <button
      class="fab"
      type="button"
      :aria-expanded="acc.panelOpen"
      aria-label="打开验收工具"
      @click="acc.panelOpen = !acc.panelOpen"
    >
      <span class="fab-icon">
        <Wrench v-if="!acc.panelOpen" :size="18" />
        <X v-else :size="18" />
      </span>
      <span class="fab-label">{{ acc.panelOpen ? '收起' : '验收' }}</span>
      <span v-if="issueCount && !acc.panelOpen" class="fab-badge">{{ issueCount }}</span>
    </button>

    <!-- 分屏对比层 -->
    <template v-if="acc.compareMode">
      <div class="compare-banner">分屏对比 · 左 V0.9 原型 / 右 V1.0 当前</div>
      <div class="compare-left" aria-hidden="true">
        <div class="compare-label">V0.9 原型</div>
        <div class="compare-frame">
          <WorkspaceProto />
        </div>
      </div>
      <div class="compare-divider" />
    </template>
  </div>
</template>

<script lang="ts">
import WorkspaceProto from '@/components/workspace/WorkspaceProto.vue'
export default { components: { WorkspaceProto } }
</script>

<style scoped>
.dock {
  position: fixed;
  right: 22px;
  bottom: 24px;
  z-index: 80;
}

.fab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 18px 0 14px;
  border: none;
  border-radius: var(--r-pill);
  background: #111827;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  transition: transform var(--t-fast) var(--ease-spring), background var(--t-fast);
}
.fab:hover {
  transform: translateY(-2px);
  background: #000;
}
.dock.open .fab {
  background: #fff;
  color: var(--text-primary);
  border: 1px solid var(--border-light);
}
.fab-icon {
  display: grid;
  place-items: center;
}
.fab-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: var(--r-pill);
  background: var(--brand-red);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
  border: 2px solid #fff;
}

/* 面板 */
.panel {
  position: absolute;
  right: 0;
  bottom: 60px;
  width: min(360px, calc(100vw - 32px));
  max-height: min(72vh, 640px);
  background: #fff;
  border: 1px solid var(--border-light);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-lighter);
  background: #fafbfc;
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-primary);
}
.close-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  display: grid;
  place-items: center;
  cursor: pointer;
}
.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.panel-body {
  padding: 14px 16px 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sec h3 {
  margin: 0 0 10px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 6px;
}
.sec h3 em {
  font-style: normal;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--r-pill);
  background: var(--brand-red);
  color: #fff;
  font-size: 11px;
  display: grid;
  place-items: center;
}

.version-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.version-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 12px;
  border-radius: var(--r-md);
  border: 1.5px solid var(--border-light);
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: border-color var(--t-fast), background var(--t-fast), box-shadow var(--t-fast);
}
.version-item:hover {
  border-color: var(--border-strong);
  background: #fafbfc;
}
.version-item.active {
  border-color: var(--brand-red);
  background: var(--brand-red-soft);
  box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.1);
}
.v-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--border-strong);
  flex-shrink: 0;
}
.version-item.active .v-dot {
  background: var(--brand-red);
  box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.22);
}
.v-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}
.v-text strong {
  font-size: 13.5px;
  color: var(--text-primary);
}
.v-text small {
  font-size: 12px;
  color: var(--text-secondary);
}
.v-check {
  color: var(--brand-red);
  flex-shrink: 0;
}

.seg {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  background: var(--bg-chip);
  padding: 4px;
  border-radius: var(--r-md);
}
.seg-btn {
  height: 34px;
  border: none;
  border-radius: 10px;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background var(--t-fast), color var(--t-fast), box-shadow var(--t-fast);
}
.seg-btn:hover {
  color: var(--text-primary);
}
.seg-btn.active {
  background: #fff;
  color: var(--text-primary);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.switch-row {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}
.switch-row > span:first-child {
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}
.switch-row strong {
  font-size: 13.5px;
  color: var(--text-primary);
  font-weight: 600;
}
.switch-row small {
  font-size: 12px;
  color: var(--text-secondary);
}
.switch-row input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.switch {
  width: 44px;
  height: 26px;
  border-radius: var(--r-pill);
  background: var(--border-strong);
  position: relative;
  transition: background var(--t-base) var(--ease-out);
  flex-shrink: 0;
}
.switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: var(--shadow-sm);
  transition: transform var(--t-base) var(--ease-spring);
}
.switch-row input:checked + .switch {
  background: var(--brand-red);
}
.switch-row input:checked + .switch::after {
  transform: translateX(18px);
}
.switch-row input:focus-visible + .switch {
  outline: 2px solid var(--brand-red);
  outline-offset: 2px;
}

.issue-form {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.issue-form input {
  flex: 1;
  height: 38px;
  border: 1px solid var(--border-light);
  border-radius: var(--r-sm);
  padding: 0 12px;
  font-size: 13.5px;
  color: var(--text-primary);
  background: #fafbfc;
  outline: none;
  transition: border-color var(--t-fast), background var(--t-fast), box-shadow var(--t-fast);
}
.issue-form input:focus {
  border-color: var(--brand-red);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.12);
}
.issue-form input::placeholder {
  color: var(--text-placeholder);
}
.add-btn {
  width: 38px;
  height: 38px;
  border: none;
  border-radius: var(--r-sm);
  background: var(--brand-red);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background var(--t-fast), transform var(--t-fast);
}
.add-btn:hover {
  background: var(--brand-red-hover);
}
.add-btn:active {
  transform: scale(0.96);
}

.issue-list {
  list-style: none;
  margin: 0 0 10px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
}
.issue-list li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 10px;
  background: #fafbfc;
  border: 1px solid var(--border-lighter);
  border-radius: var(--r-sm);
}
.lvl {
  flex-shrink: 0;
  height: 20px;
  padding: 0 7px;
  border-radius: var(--r-pill);
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
}
.lvl.high { background: var(--c-red-bg); color: var(--c-red); }
.lvl.mid { background: var(--c-amber-bg); color: #d97706; }
.lvl.low { background: var(--c-blue-bg); color: var(--c-blue); }
.issue-body {
  flex: 1;
  min-width: 0;
}
.issue-body p {
  margin: 0;
  font-size: 13px;
  color: var(--text-regular);
  line-height: 1.5;
  word-break: break-word;
}
.issue-body time {
  font-size: 11px;
  color: var(--text-placeholder);
}
.del {
  border: none;
  background: transparent;
  color: var(--text-placeholder);
  cursor: pointer;
  padding: 2px;
  border-radius: 6px;
  display: grid;
  place-items: center;
}
.del:hover {
  color: var(--c-red);
  background: var(--c-red-bg);
}
.issue-empty {
  margin: 0 0 10px;
  font-size: 12.5px;
  color: var(--text-placeholder);
  line-height: 1.6;
  padding: 12px;
  background: var(--bg-muted);
  border-radius: var(--r-sm);
}
.export-btn {
  width: 100%;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--border-light);
  border-radius: var(--r-sm);
  background: #fff;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: background var(--t-fast), border-color var(--t-fast);
}
.export-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--border-strong);
}
.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 面板动效 */
.panel-enter-active,
.panel-leave-active {
  transition: opacity var(--t-base) var(--ease-out), transform var(--t-base) var(--ease-out);
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

/* ===== 分屏对比 ===== */
.compare-banner {
  position: fixed;
  top: calc(var(--topbar-h) + 10px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 90;
  background: #111827;
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: var(--r-pill);
  box-shadow: var(--shadow-md);
  pointer-events: none;
}
.compare-divider {
  position: fixed;
  top: var(--topbar-h);
  bottom: 0;
  left: 50%;
  width: 3px;
  background: linear-gradient(180deg, transparent, var(--brand-red) 12%, var(--brand-red) 88%, transparent);
  z-index: 70;
  transform: translateX(-50%);
  pointer-events: none;
  box-shadow: 0 0 12px rgba(229, 57, 53, 0.5);
}
.compare-left {
  position: fixed;
  top: var(--topbar-h);
  left: 0;
  width: 50%;
  bottom: 0;
  z-index: 65;
  background: var(--bg-page);
  border-right: none;
  overflow: hidden;
  pointer-events: none;
}
.compare-label {
  position: absolute;
  top: 12px;
  left: 14px;
  z-index: 2;
  background: #fff;
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--r-pill);
  box-shadow: var(--shadow-sm);
}
.compare-frame {
  width: 200%;
  height: 100%;
  overflow: hidden;
}
</style>
