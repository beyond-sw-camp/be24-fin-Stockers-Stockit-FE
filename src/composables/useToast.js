import { onBeforeUnmount, ref } from 'vue'

// 단순 시간 기반 토스트. 호출 시 새 메시지로 덮어쓰고 durationMs 후 자동 사라짐.
// composable 자체가 onBeforeUnmount 로 timer cleanup — 호출처는 toast 와 triggerToast 만.
export function useToast(durationMs = 3000) {
  const toast = ref({ show: false, message: '' })
  let timer = null

  function triggerToast(message) {
    if (timer) clearTimeout(timer)
    toast.value = { show: true, message }
    timer = setTimeout(() => {
      toast.value = { show: false, message: '' }
    }, durationMs)
  }

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  return { toast, triggerToast }
}
