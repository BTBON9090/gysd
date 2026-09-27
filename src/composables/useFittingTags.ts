import { ref, watch, nextTick, onBeforeUnmount, type Ref } from 'vue'
/** Fit complete tags to one desktop row, reserving room for +N and clear controls. */
export function useFittingTags(host: Ref<HTMLElement | null>, labels: () => string[]) {
  const limit = ref(1)
  let observer: ResizeObserver | undefined
  const measure = () => {
    if (!host.value) return
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    context.font = '12px sans-serif'
    const widths = labels().map(label => Math.min(210, context.measureText(label).width + 34))
    const available = host.value.clientWidth - 56
    if (widths.reduce((a,b) => a+b+6,0) <= available) { limit.value = Math.max(1, widths.length); return }
    let used = 0, count = 0
    for (const width of widths) { if (used + width + 6 > available - 46) break; used += width + 6; count++ }
    limit.value = Math.max(1, count)
  }
  watch([host, labels], async () => {
    await nextTick(); observer?.disconnect(); measure()
    if (host.value) { observer = new ResizeObserver(measure); observer.observe(host.value) }
  }, { immediate: true, deep: true })
  onBeforeUnmount(() => observer?.disconnect())
  return limit
}
