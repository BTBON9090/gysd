import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/** 页面数据状态：供验收工具一键切换 */
export type PageDataState = 'ready' | 'loading' | 'empty' | 'error'

/** 设计版本：供 UI 版本管理与对比 */
export interface DesignVersion {
  id: string
  label: string
  desc: string
}

export const DESIGN_VERSIONS: DesignVersion[] = [
  { id: 'v1.0', label: 'V1.0 当前稿', desc: '浅色轻 C 端 · 理财感指标卡' },
  { id: 'v0.9-proto', label: 'V0.9 原型参考', desc: '未设计原型的视觉基线（灰阶回退）' },
]

export interface AcceptanceIssue {
  id: number
  page: string
  content: string
  level: 'high' | 'mid' | 'low'
  createdAt: string
}

export const useAcceptanceStore = defineStore('acceptance', () => {
  /** 是否显示悬浮验收工具 */
  const toolVisible = ref(true)
  /** 面板展开 */
  const panelOpen = ref(false)
  /** 当前设计版本 */
  const versionId = ref<string>(DESIGN_VERSIONS[0].id)
  /** 页面数据状态 */
  const dataState = ref<PageDataState>('ready')
  /** 分屏对比：左为旧版 */
  const compareMode = ref(false)
  /** 验收问题清单 */
  const issues = ref<AcceptanceIssue[]>([])
  /** 标注模式：点击页面区块记问题 */
  const annotateMode = ref(false)

  const currentVersion = computed(
    () => DESIGN_VERSIONS.find((v) => v.id === versionId.value) ?? DESIGN_VERSIONS[0],
  )
  const isPrototypeSkin = computed(() => versionId.value === 'v0.9-proto')

  function setVersion(id: string) {
    versionId.value = id
  }
  function setDataState(s: PageDataState) {
    dataState.value = s
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
    dataState,
    compareMode,
    issues,
    annotateMode,
    currentVersion,
    isPrototypeSkin,
    setVersion,
    setDataState,
    toggleCompare,
    addIssue,
    removeIssue,
    exportIssues,
  }
})
