/**
 * notification.js — 알림 BE 연동
 *
 * BE 엔드포인트:
 *   GET    /api/notifications/stream             (SSE 구독, text/event-stream)
 *   GET    /api/notifications                    (목록, page/size/unreadOnly)
 *   GET    /api/notifications/unread-count       (미읽음 카운트)
 *   PATCH  /api/notifications/{id}/read          (단건 읽음)
 *   PATCH  /api/notifications/read-all           (전체 읽음)
 *
 * 응답: BaseResponse<T>. unwrap() 으로 result 만 추출.
 */

import { apiClient, unwrap } from './axios.js'

export const notificationApi = {
  /**
   * 본인 수신 알림 목록 조회
   * @param {{ page?: number, size?: number, unreadOnly?: boolean }} params
   */
  list: (params = {}) =>
    apiClient.get('/api/notifications', { params }).then(unwrap),

  /** 미읽음 카운트 */
  unreadCount: () =>
    apiClient.get('/api/notifications/unread-count').then(unwrap),

  /** 단건 읽음 처리 */
  read: (id) =>
    apiClient.patch(`/api/notifications/${id}/read`).then(unwrap),

  /** 본인 수신분 전체 읽음 처리 */
  readAll: () =>
    apiClient.patch('/api/notifications/read-all').then(unwrap),
}

/**
 * SSE 구독 — EventSource 는 axios 와 별도. 쿠키 자동 전송을 위해 withCredentials.
 * 호출 측에서 반환된 EventSource 의 close() 를 책임진다 (언마운트/로그아웃 시).
 *
 * BE 의 connect 이벤트 payload 는 sessionId (UUID) — handlers.onConnect 으로 그대로 전달.
 * notificationStore 가 이 sessionId 를 보관해두었다가 페이지 unload 시 closeNotificationStreamBeacon 으로 BE 에 명시적 종료 요청.
 *
 * @param {{
 *   onConnect?: (sessionId: string) => void,
 *   onNotification?: (payload: object) => void,
 *   onError?: (event: Event) => void,
 * }} handlers
 * @returns {EventSource}
 */
export function subscribeNotificationStream(handlers = {}) {
  const base = import.meta.env.VITE_API_BASE ?? ''
  const url = `${base}/api/notifications/stream`
  const es = new EventSource(url, { withCredentials: true })

  if (handlers.onConnect) {
    es.addEventListener('connect', (e) => handlers.onConnect(e.data))
  }
  if (handlers.onNotification) {
    es.addEventListener('notification', (e) => {
      try {
        handlers.onNotification(JSON.parse(e.data))
      } catch (err) {
        console.error('[subscribeNotificationStream] JSON parse failed', err, e.data)
      }
    })
  }
  if (handlers.onError) {
    es.onerror = handlers.onError
  }
  return es
}

/**
 * SSE 명시적 종료 (sendBeacon) — 페이지 unload (탭 닫기/F5/창 닫기) 시 호출.
 *
 * 왜 sendBeacon 인가:
 *  - 일반 fetch/axios 는 페이지 unload 중에 브라우저가 취소시킬 수 있음.
 *  - sendBeacon 은 spec 상 unload 중에도 백그라운드 전송 보장.
 *  - 단, POST 만 지원 + Content-Type 제한적 → BE 엔드포인트도 POST 로 설계.
 *
 * BE: POST /api/notifications/stream/{sessionId}/close
 *  - 쿠키 자동 전송 (same-origin) → JwtAuthFilter 통과
 *  - BE 가 sessionId 의 owner(userId) 검증 후 emitter 즉시 정리.
 *
 * @param {string} sessionId — BE 가 connect 이벤트로 전달한 UUID
 * @returns {boolean} sendBeacon 큐잉 성공 여부
 */
export function closeNotificationStreamBeacon(sessionId) {
  if (!sessionId) return false
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
    return false                                                       // 구형 브라우저 — pagehide close() 만 의존
  }
  const base = import.meta.env.VITE_API_BASE ?? ''
  const url = `${base}/api/notifications/stream/${encodeURIComponent(sessionId)}/close`
  try {
    // body 없이도 OK — BE 는 path variable 만 사용. Blob 으로 명시적 빈 body.
    return navigator.sendBeacon(url, new Blob([], { type: 'text/plain' }))
  } catch {
    return false
  }
}
