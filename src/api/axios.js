import axios from 'axios'

// 공통 axios 인스턴스
// baseURL 빈 문자열 (상대경로) — dev 환경은 vite.config.js 의 server.proxy 가
// /api/** 를 BE(8080) 로 리버스 프록시. 운영 빌드는 동일 origin 또는 별도 게이트웨이.
// VITE_API_BASE 환경변수로 override 가능 (다른 BE 호스트 가리킬 때).
//
// withCredentials: true — HttpOnly Cookie(Atoken) 자동 송수신.
// JWT는 BE의 LoginSuccessHandler 가 Set-Cookie 로 내려주고,
// 이후 모든 요청에서 브라우저가 자동으로 동봉. JS에서 토큰 직접 접근 불가(XSS 방어).
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '',
  timeout: 10000,
  withCredentials: true,
})

/**
 * 응답 인터셉터: 401 응답 시 인증 만료/무효로 간주하고 로그인 페이지로 이동.
 * 쿠키는 BE 측에서 만료되거나 JwtAuthFilter 가 SecurityContext 설정 실패 시 401 반환.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // 무한 리다이렉트 방지 (/login, /dev-login, /signup 페이지에선 그대로)
      const path = window.location.pathname
      if (!path.includes('/login') && !path.includes('/signup')) {
        window.location.href = '/dev-login'
      }
    }
    return Promise.reject(error)
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
