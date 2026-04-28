import axios from 'axios'

// 공통 axios 인스턴스
// baseURL 빈 문자열 (상대경로) — dev 환경은 vite.config.js 의 server.proxy 가
// /api/** 를 BE(8080) 로 리버스 프록시. 운영 빌드는 동일 origin 또는 별도 게이트웨이.
// VITE_API_BASE 환경변수로 override 가능 (다른 BE 호스트 가리킬 때).
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '',
  timeout: 10000,
})

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
