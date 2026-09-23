import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/** 页面数据状态：供验收工具一键切换 */
export type PageDataState = 'ready' | 'loading' | 'empty' | 'error'

/** 入驻状态：供验收工具切换未入驻 / 已入驻 */
export type EntryStatus = 'pending' | 'approved'

/** 设计版本：供 UI 版本管理与对比 */
export interface DesignVersion {
  id: string
  label: string
  desc: string
}

export const DESIGN_VERSIONS: DesignVersion[] = [
  { id: 'v2.0-light', label: 'V2.0 清亮版', desc: '明亮底色 · 深色文字 · 留白分组 · 新入驻首页' },
  { id: 'v1.0', label: 'V1.0 上一版', desc: '保留当前入驻页面与表单样式作为对照' },
  { id: 'v0.9-proto', label: 'V0.9 原型参考', desc: '未设计原型的视觉基线（灰阶回退）' },
]

const VERSION_KEY = 'gysd-design-version'
const DOCK_KEY = 'gysd-review-dock-position'

function initialDockPosition() {
  try {
    const stored = JSON.parse(localStorage.getItem(DOCK_KEY) || '{}')
    if (Number.isFinite(stored.x) && Number.isFinite(stored.y)) return stored as { x: number; y: number }
  } catch { /* ignore */ }
  return { x: Math.max(12, window.innerWidth - 106), y: 120 }
}

export interface AcceptanceIssue {
  id: number
  page: string
  content: string
  level: 'high' | 'mid' | 'low'
  createdAt: string
}

export const useAcceptanceStore = defineStore('acceptance', () => {
  const toolVisible = ref(true)
  const panelOpen = ref(false)
  const storedVersion = localStorage.getItem(VERSION_KEY)
  const versionId = ref<string>(DESIGN_VERSIONS.some(v => v.id === storedVersion) ? storedVersion! : DESIGN_VERSIONS[0].id)
  const dockPosition = ref(initialDockPosition())
  const dataState = ref<PageDataState>('ready')
  const entryStatus = ref<EntryStatus>('approved')
  const compareMode = ref(false)
  const issues = ref<AcceptanceIssue[]>([])
  const annotateMode = ref(false)

  const currentVersion = computed(
    () => DESIGN_VERSIONS.find((v) => v.id === versionId.value) ?? DESIGN_VERSIONS[0],
  )
  const isPrototypeSkin = computed(() => versionId.value === 'v0.9-proto')

  function setVersion(id: string) {
    versionId.value = id
    localStorage.setItem(VERSION_KEY, id)
  }
  function setDockPosition(x: number, y: number) {
    dockPosition.value = { x, y }
    localStorage.setItem(DOCK_KEY, JSON.stringify(dockPosition.value))
  }
  function setDataState(s: PageDataState) {
    dataState.value = s
  }
  function setEntryStatus(s: EntryStatus) {
    entryStatus.value = s
  }
  function toggleCompare(on?: boolean) {
    compareMode.value = on ?? !compareMode.value
  }
  function addIssue(content: string, page = '工作台', level: AcceptanceIssue['level'] = 'mid') {
    issues.value.unshift({
      id: Date.now(),
      page,
      content,
      level,
      createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    })
  }
  function removeIssue(id: number) {
    issues.value = issues.value.filter((i) => i.id !== id)
  }
  function exportIssues(): string {
    const lines = issues.value.map(
      (i, idx) => `${idx + 1}. [${i.level}] (${i.page}) ${i.content} — ${i.createdAt}`,
    )
    return lines.length ? lines.join('\n') : '（暂无验收问题）'
  }

  return {
    toolVisible,
    panelOpen,
    versionId,
    dockPosition,
    dataState,
    entryStatus,
    compareMode,
    issues,
    annotateMode,
    currentVersion,
    isPrototypeSkin,
    setVersion,
    setDockPosition,
    setDataState,
    setEntryStatus,
    toggleCompare,
    addIssue,
    removeIssue,
    exportIssues,
  }
})
