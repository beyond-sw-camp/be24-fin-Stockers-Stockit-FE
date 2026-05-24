<script setup>
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useNotificationStore } from '@/stores/notification.js'

// 인증 복원(F5) 시 알림 store 도 함께 초기화 (SSE 재연결).
// 로그인 직후엔 authStore.login() 안에서 이미 init 됨 — 중복 호출은 store init 가드로 무시.
const auth = useAuthStore()
const notif = useNotificationStore()

// 페이지 unload (탭 닫기 / 창 닫기 / F5 / 다른 도메인 이동) 시 SSE 명시적 close.
// 없으면 BE NotificationSseService 의 emitters Map 에 stale entry 가 30초(heartbeat) 동안 살아있음.
// 운영 로그에서 userId=1 의 20+ 누적 emitter 가 한꺼번에 정리되던 현상의 근본 원인.
// pagehide 가 beforeunload 보다 모바일 호환성 + BFCache 친화적.
// event.persisted === true 면 BFCache 로 캐시되는 것이라 곧 살아날 수 있으므로 dispose 생략.
const handlePageHide = (event) => {
  if (event && event.persisted) return
  try { notif.dispose() } catch { /* ignore */ }
}

onMounted(() => {
  if (auth.isAuthenticated) notif.init()
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', handlePageHide)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('pagehide', handlePageHide)
  }
})

watch(
  () => auth.isAuthenticated,
  (now) => { if (now) notif.init() },
)
</script>

<template>
  <RouterView />
</template>
