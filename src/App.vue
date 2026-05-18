<script setup>
import { onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useNotificationStore } from '@/stores/notification.js'

// 인증 복원(F5) 시 알림 store 도 함께 초기화 (SSE 재연결).
// 로그인 직후엔 authStore.login() 안에서 이미 init 됨 — 중복 호출은 store init 가드로 무시.
const auth = useAuthStore()
const notif = useNotificationStore()

onMounted(() => {
  if (auth.isAuthenticated) notif.init()
})

watch(
  () => auth.isAuthenticated,
  (now) => { if (now) notif.init() },
)
</script>

<template>
  <RouterView />
</template>
