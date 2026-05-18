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
 * @param {{
 *   onConnect?: (data: string) => void,
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
