/**
 * notification.js — 알림 전역 상태 (Pinia)
 *
 * 책임:
 * - 페이지/헤더 양쪽에서 공유되는 알림 목록 + 미읽음 카운트
 * - 로그인 직후 init() 호출 → 초기 로드 + SSE 구독
 * - 로그아웃 직전 dispose() 호출 → SSE close + 상태 초기화
 *
 * 데이터 흐름:
 *   초기 로드: notificationApi.list({ size:50 })  →  notifications[]
 *   실시간 :   SSE notification 이벤트 수신       →  notifications 앞에 prepend
 *   읽음   :   PATCH 후 로컬 상태도 갱신
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  notificationApi,
  subscribeNotificationStream,
  closeNotificationStreamBeacon,
} from '@/api/notification.js'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])           // 최신순 (id desc)
  const totalElements = ref(0)
  const initialized = ref(false)
  const loading = ref(false)
  const error = ref('')

  let eventSource = null
  let sessionId = null                    // BE connect 이벤트로 받은 SSE 세션 UUID — unload 시 sendBeacon 으로 명시적 종료에 사용

  const unreadCount = computed(
    () => notifications.value.filter((n) => !n.read).length,
  )

  const recent = computed(() => notifications.value.slice(0, 5))

  /**
   * 초기 로드 + SSE 구독.
   * 로그인 직후 또는 인증 복원 직후 1회 호출.
   */
  async function init() {
    if (initialized.value) return
    initialized.value = true

    await refresh()
    connectStream()
  }

  /** 서버에서 최신 50건 다시 가져오기 */
  async function refresh() {
    loading.value = true
    error.value = ''
    try {
      const data = await notificationApi.list({ page: 0, size: 50 })
      notifications.value = data?.items ?? []
      totalElements.value = data?.totalElements ?? 0
    } catch (e) {
      error.value = e?.message ?? '알림을 불러오지 못했습니다.'
      console.error('[notificationStore.refresh]', e)
    } finally {
      loading.value = false
    }
  }

  /** SSE 연결 — 중복 연결 방지 */
  function connectStream() {
    if (eventSource) return
    eventSource = subscribeNotificationStream({
      onConnect: (sid) => {
        // BE 가 connect 이벤트 data 로 sessionId 를 전달 — 페이지 unload 시 sendBeacon 으로 명시적 종료에 사용
        sessionId = sid
      },
      onNotification: (payload) => {
        // BE SsePayload (id/type/severity/title/message/createdAt) — read=false 기본
        const exists = notifications.value.some((n) => n.id === payload.id)
        if (exists) return
        notifications.value.unshift({
          ...payload,
          refType: payload.refType ?? null,
          refId: payload.refId ?? null,
          read: false,
          readAt: null,
        })
        totalElements.value += 1
      },
      onError: (e) => {
        // EventSource 는 자동 재연결 시도. 로그만.
        console.warn('[notificationStore SSE] error', e)
      },
    })
  }

  /** 단건 읽음 처리 */
  async function markAsRead(id) {
    try {
      await notificationApi.read(id)
      const idx = notifications.value.findIndex((n) => n.id === id)
      if (idx >= 0 && !notifications.value[idx].read) {
        notifications.value[idx] = {
          ...notifications.value[idx],
          read: true,
          readAt: new Date().toISOString(),
        }
      }
    } catch (e) {
      console.error('[notificationStore.markAsRead]', e)
      throw e
    }
  }

  /** 본인 수신분 전체 읽음 */
  async function markAllAsRead() {
    try {
      await notificationApi.readAll()
      const now = new Date().toISOString()
      notifications.value = notifications.value.map((n) =>
        n.read ? n : { ...n, read: true, readAt: now },
      )
    } catch (e) {
      console.error('[notificationStore.markAllAsRead]', e)
      throw e
    }
  }

  /**
   * SSE close + 상태 초기화 — 로그아웃 / 페이지 unload (탭 닫기/F5/창 닫기) 시 호출.
   *
   * 두 단계 종료:
   *  1) sendBeacon — 페이지 unload 중에도 보장되는 BE 명시적 종료 호출 (sessionId 보유 시).
   *     BE 가 emitters Map 에서 즉시 정리 → heartbeat 30초 대기 불필요.
   *  2) eventSource.close() — 클라이언트 TCP 끊기. BE onError/onCompletion 콜백 발화로 fallback 정리.
   *
   * 순서 중요: sendBeacon 을 먼저 호출해야 sessionId 가 살아있는 동안 BE 까지 도달.
   */
  function dispose() {
    if (sessionId) {
      try { closeNotificationStreamBeacon(sessionId) } catch { /* ignore */ }
    }
    if (eventSource) {
      try { eventSource.close() } catch { /* ignore */ }
      eventSource = null
    }
    sessionId = null
    notifications.value = []
    totalElements.value = 0
    initialized.value = false
    loading.value = false
    error.value = ''
  }

  return {
    notifications,
    totalElements,
    unreadCount,
    recent,
    loading,
    error,
    init,
    refresh,
    markAsRead,
    markAllAsRead,
    dispose,
  }
})
