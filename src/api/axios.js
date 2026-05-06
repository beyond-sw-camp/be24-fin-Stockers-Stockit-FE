import axios from 'axios'

// 공통 axios 인스턴스
// baseURL 빈 문자열 (상대경로) — dev 환경은 vite.config.js 의 server.proxy 가
// /api/** 를 BE(8080) 로 리버스 프록시. 운영 빌드는 동일 origin 또는 별도 게이트웨이.
// VITE_API_BASE 환경변수로 override 가능 (다른 BE 호스트 가리킬 때).
//
// withCredentials: true — HttpOnly Cookie(Atoken/Rtoken) 자동 송수신.
// JWT는 BE의 LoginSuccessHandler 가 Set-Cookie 로 내려주고,
// 이후 모든 요청에서 브라우저가 자동으로 동봉. JS에서 토큰 직접 접근 불가(XSS 방어).
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '',
  timeout: 10000,
  withCredentials: true,
})

const REFRESH_URL = '/api/user/refresh'
const LOGIN_PATHS = ['/login', '/dev-login', '/signup']
const USER_STORAGE_KEY = 'stockit_user'

/**
 * 인증 만료 시 호출 — 클라이언트 측 잔여 사용자 정보를 정리하고 로그인 페이지로 이동.
 * authStore 직접 import 시 순환 의존이 생기므로 localStorage 만 정리한다.
 */
function forceLogout() {
  try {
    localStorage.removeItem(USER_STORAGE_KEY)
    sessionStorage.removeItem('stockit:openTopMenus')
  } catch {
    // storage 접근 실패해도 라우팅은 진행
  }
  const path = window.location.pathname
  if (!LOGIN_PATHS.some(p => path.includes(p))) {
    window.location.href = '/dev-login'
  }
}

/**
 * 동시 다발 401 요청에서 refresh 가 한 번만 호출되도록 단일 promise 공유.
 * refresh 가 진행 중이면 후속 401 요청들은 같은 promise 를 await 한 뒤
 * 각자 원본 요청을 재시도한다.
 */
let refreshPromise = null

function callRefresh() {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post(REFRESH_URL)
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

/**
 * 응답 인터셉터 — Refresh Token 자동 갱신.
 *
 * 흐름:
 *   1) 정상 응답: 그대로 반환
 *   2) 401 + 재시도 안 한 요청 + /refresh 자체 호출이 아님
 *      → /api/user/refresh 호출 (Rtoken 쿠키로 새 Atoken 발급)
 *      → 성공 시 원본 요청 재시도
 *      → 실패 시 forceLogout (잔여 정보 정리 + /login 이동)
 *   3) 그 외(이미 재시도한 401, /refresh 자체 401, 다른 에러)
 *      → 401 이면 forceLogout, 나머지는 그대로 reject
 *
 * 무한 루프 방지:
 *   - originalRequest._retry 플래그로 동일 요청 두 번째 401 차단
 *   - /api/user/refresh 자체에서 401 발생 시 재시도하지 않음
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config
    const status = error?.response?.status

    // 401 이 아니거나 config 가 없으면 그대로 전파
    if (status !== 401 || !originalRequest) {
      return Promise.reject(error)
    }

    // /refresh 자체에서 401 이면 즉시 강제 로그아웃 (무한 루프 차단)
    if (originalRequest.url?.includes(REFRESH_URL)) {
      forceLogout()
      return Promise.reject(error)
    }

    // 이미 재시도한 요청이 또 401 이면 더 이상 시도하지 않음
    if (originalRequest._retry) {
      forceLogout()
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      await callRefresh()
      // refresh 성공 → 새 Atoken 쿠키로 원본 요청 재시도
      return apiClient(originalRequest)
    } catch (refreshErr) {
      // refresh 실패 → 강제 로그아웃
      forceLogout()
      return Promise.reject(refreshErr)
    }
  },
)

export default apiClient

/**
 * BaseResponse<T> 언랩 헬퍼.
 * BE 응답 형태: { success, code, message, result }.
 * success=false 면 한국어 message 로 Error throw.
 *
 * @param {import('axios').AxiosResponse} res
 * @returns {*} result
 */
export function unwrap(res) {
  const body = res?.data
  if (!body || body.success !== true) {
    const msg = body?.message ?? '요청에 실패했습니다.'
    throw new Error(msg)
  }
  return body.result
}

/**
 * Axios 에러에서 사용자 표시용 한글 메시지 추출.
 * 우선순위:
 *   1) BE BaseResponse 의 message (4xx 응답에 포함된 한글)
 *   2) HTTP 상태 코드별 기본 한글 메시지
 *   3) 네트워크 단절 / 타임아웃 메시지
 *   4) 폴백 일반 메시지
 *
 * @param {unknown} err - axios 또는 일반 Error
 * @param {string} [fallback] - 위 분류에 안 잡혔을 때 표시할 메시지
 * @returns {string}
 */
export function extractErrorMessage(err, fallback = '요청 처리 중 오류가 발생했습니다.') {
  // 1) BE BaseResponse 의 한글 메시지
  const beMessage = err?.response?.data?.message
  if (beMessage) return beMessage

  // 2) HTTP 상태 코드별 기본 메시지
  const status = err?.response?.status
  if (status) {
    if (status === 400) return '요청 형식이 올바르지 않습니다.'
    if (status === 401) return '인증이 필요합니다.'
    if (status === 403) return '접근 권한이 없습니다.'
    if (status === 404) return '요청한 자원을 찾을 수 없습니다.'
    if (status === 408) return '요청 시간이 초과되었습니다.'
    if (status === 409) return '요청이 충돌했습니다. 잠시 후 다시 시도해주세요.'
    if (status >= 500) return '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
  }

  // 3) 네트워크 단절 / 타임아웃 (response 없음)
  if (err?.code === 'ECONNABORTED') return '응답 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.'
  if (err?.code === 'ERR_NETWORK' || !err?.response) return '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.'

  // 4) 폴백
  return fallback
}
