import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useOnboardingStore, type OnboardingDraft } from './onboarding'

type ChangeStatus = 'draft' | 'reviewing' | 'rejected'
interface ChangeRecord { subjectId: string; status: ChangeStatus; step: number; draft: OnboardingDraft; reason: string; submittedAt: string }
const KEY = 'gysd-merchant-change'
function read(): Record<string, ChangeRecord> {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '{}')
    if (value?.subjectId) return { [value.subjectId]: value as ChangeRecord }
    return value && typeof value === 'object' ? value : {}
  } catch { return {} }
}
function copy<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T }
export const useMerchantChangeStore = defineStore('merchantChange', () => {
  const ob = useOnboardingStore()
  const record = ref<Record<string, ChangeRecord>>(read())
  watch(record, value => localStorage.setItem(KEY, JSON.stringify(value)), { deep: true })
  function current() { return record.value[ob.activeId] || null }
  function start() {
    if (current()?.status === 'reviewing') return false
    if (!current()) record.value[ob.activeId] = { subjectId: ob.activeId, status: 'draft', step: 1, draft: copy(ob.draft), reason: '', submittedAt: '' }
    return true
  }
  function save(step: number) { if (current()) current()!.step = step }
  function submit() {
    if (!current() || current()!.status === 'reviewing') return false
    current()!.status = 'reviewing'
    current()!.submittedAt = new Date().toISOString()
    current()!.reason = ''
    return true
  }
  function review(result: 'approved' | 'rejected') {
    if (!current() || current()!.status !== 'reviewing') return false
    if (result === 'approved') {
      Object.assign(ob.draft, copy(current()!.draft))
      ob.persist()
      delete record.value[ob.activeId]
    } else {
      current()!.status = 'rejected'
      current()!.reason = '请核对变更资料后重新提交。'
    }
    return true
  }
  function cancel() { if (current() && current()!.status !== 'reviewing') delete record.value[ob.activeId] }
  return { record, current, start, save, submit, review, cancel }
})
