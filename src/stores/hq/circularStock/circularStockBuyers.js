/**
 * 순환재고 거래처 store (ADR-021).
 * BE 단일 출처 — localStorage / 시드 / persist 없음. 마운트 시 자동 fetch.
 *
 * BE 응답 (CircularBuyerDto.ListRes / DetailRes) 의 code 를 FE 의 id 로 매핑하여
 * 기존 컴포넌트의 `buyer.id` 호환 유지.
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { circularBuyerApi } from '@/api/hq/circularBuyer.js'

export const MATERIAL_FIT_OPTIONS = [
  { value: 'natural-single', label: '천연 단일 섬유' },
  { value: 'synthetic', label: '합성 섬유' },
  { value: 'blended', label: '혼방' },
]

// 사이클 2 — 파트너 유형 분류 데이터 (점수 가산 룰은 사이클 3 거래 이력 합류 후).
export const PARTNER_TYPE_OPTIONS = [
  { value: 'general', label: '일반' },
  { value: 'local_small', label: '지역 소규모' },
  { value: 'social_enterprise', label: '사회적기업' },
]
const PARTNER_TYPE_SET = new Set(PARTNER_TYPE_OPTIONS.map((o) => o.value))

export const INDUSTRY_GROUP_OPTIONS = [
  '섬유 제품 제조업',
  '의복 제조업',
  '가죽/가방/신발 제조업',
  '플라스틱 제조업',
  '건축자제 제조업',
  '자동차 부품 제조업',
  '가구 제조업',
  '기타',
]

// ─── BE 응답 → FE 모델 매핑 ─────────────────────────────────────────────
// BE 의 code 를 FE 의 id 로 노출하여 기존 컴포넌트의 `buyer.id` 호환.
// BE 거래처 응답을 FE 표준 모델로 변환한다.
function fromApi(v) {
  return {
    id: v.code,
    code: v.code,
    companyName: v.companyName,
    industryGroup: v.industryGroup,
    factoryProduct: Array.isArray(v.factoryProduct ?? v.productTypes)
      ? (v.factoryProduct ?? v.productTypes)
      : [],
    description: v.description ?? '',
    primaryMaterialFit: v.primaryMaterialFit,
    managerName: v.managerName,
    phone: v.phone,
    address: v.address ?? '',
    partnerType: v.partnerType ?? 'general',
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  }
}

// 동일 거래처가 있으면 갱신하고, 없으면 목록 앞에 추가한다.
function upsertBuyer(list, buyer) {
  const idx = list.findIndex((b) => b.id === buyer.id)
  if (idx === -1) return [buyer, ...list]
  const next = [...list]
  next[idx] = { ...next[idx], ...buyer }
  return next
}

// 등록/수정 모달에서 사용하는 초기 폼 값을 생성한다.
function createEmptyBuyerForm() {
  return {
    companyName: '',
    industryGroup: '',
    factoryProduct: [],
    description: '',
    primaryMaterialFit: '',
    managerName: '',
    phone: '',
    address: '',
    partnerType: 'general',
  }
}

// 생산품 입력값을 배열로 정규화해 API payload 형식을 통일한다.
function normalizeFactoryProduct(factoryProduct) {
  if (Array.isArray(factoryProduct)) {
    return [
      ...new Set(
        factoryProduct
          .map((item) => String(item ?? '').trim())
          .filter(Boolean),
      ),
    ]
  }

  return [
      ...new Set(
      String(factoryProduct ?? '')
        .split('\n')
        .flatMap((line) => line.split(','))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ]
}

// 소재 적합도 코드를 한글 라벨로 변환한다.
function materialFitLabel(value) {
  return MATERIAL_FIT_OPTIONS.find((option) => option.value === value)?.label ?? '-'
}

// 파트너 유형 코드를 한글 라벨로 변환한다.
function partnerTypeLabel(value) {
  return PARTNER_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? '-'
}

// 거래처 생성/수정 payload를 trim/기본값 기준으로 정규화한다.
function normalizeBuyerPayload(payload) {
  const partnerTypeRaw = String(payload.partnerType ?? 'general').trim()
  return {
    companyName: String(payload.companyName ?? '').trim(),
    industryGroup: String(payload.industryGroup ?? '').trim(),
    factoryProduct: normalizeFactoryProduct(payload.factoryProduct),
    description: String(payload.description ?? '').trim(),
    primaryMaterialFit: String(payload.primaryMaterialFit ?? '').trim(),
    managerName: String(payload.managerName ?? '').trim(),
    phone: String(payload.phone ?? '').trim(),
    address: String(payload.address ?? '').trim(),
    partnerType: partnerTypeRaw || 'general',
  }
}

// FE 1차 검증: BE에서도 검증하지만, 즉시 피드백을 위해 선검증한다.
// 거래처 코드는 BE 자동 부여라 FE에서 별도 검증하지 않는다.
function validateBuyerPayload(payload) {
  const errors = {}

  if (!payload.companyName) errors.companyName = '업체명을 입력해주세요.'
  if (!payload.industryGroup) errors.industryGroup = '산업군을 선택해주세요.'
  if (!payload.primaryMaterialFit) errors.primaryMaterialFit = '대표 소재 적합도를 선택해주세요.'
  if (!payload.managerName) errors.managerName = '담당자명을 입력해주세요.'
  if (!payload.phone) errors.phone = '연락처를 입력해주세요.'
  if (!payload.address) errors.address = '주소를 입력해주세요.'
  if (!PARTNER_TYPE_SET.has(payload.partnerType)) {
    errors.partnerType = '파트너 유형을 선택해주세요.'
  }

  return errors
}

// 순환재고 거래처 상태/조회/CRUD를 관리하는 Store다.
export const useCircularStockBuyerStore = defineStore('circularStockBuyers', () => {
  // --- state ---
  const buyers = ref([])
  const loading = ref(false)
  const error = ref(null)
  const page = ref(0)
  const size = ref(20)
  const totalPages = ref(0)
  const totalElements = ref(0)
  const hasNext = ref(false)
  const hasPrevious = ref(false)
  const materialFitCounts = ref({ 'natural-single': 0, synthetic: 0, blended: 0 })

  // --- getters ---
  const sortedBuyers = computed(() =>
    [...buyers.value].sort(
      (a, b) =>
        a.companyName.localeCompare(b.companyName, 'ko') ||
        a.code.localeCompare(b.code, 'ko'),
    ),
  )

  // 단일 거래처를 id(code) 기준으로 조회한다.
  function getBuyerById(id) {
    return buyers.value.find((buyer) => buyer.id === id) ?? null
  }

  // 키워드/소재 적합도 조건으로 거래처 목록을 필터링한다.
  function filteredBuyers(keyword = '', options = {}) {
    const normalized = keyword.trim().toLowerCase()
    const materialFit = options.primaryMaterialFit ?? ''

    return sortedBuyers.value.filter((buyer) => {
      const matchesMaterialFit = !materialFit || buyer.primaryMaterialFit === materialFit
      const searchableText = [
        buyer.code,
        buyer.companyName,
        buyer.managerName,
        buyer.phone,
        ...(Array.isArray(buyer.factoryProduct) ? buyer.factoryProduct : []),
        buyer.address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const matchesKeyword =
        !normalized || searchableText.includes(normalized)

      return matchesMaterialFit && matchesKeyword
    })
  }

  // --- actions ---

  // 거래처 통계(소재 적합도 카운트)를 조회한다.
  async function fetchStats() {
    try {
      const counts = await circularBuyerApi.stats()
      materialFitCounts.value = counts ?? {}
    } catch {
      // stats 실패는 목록 동작에 영향이 없어 무시한다.
    }
  }

  // 거래처 페이지 목록을 조회하고 페이징 상태를 동기화한다.
  async function fetchPage(opts = {}) {
    loading.value = true
    error.value = null
    try {
      const res = await circularBuyerApi.listPage({
        page: opts.page ?? page.value,
        size: opts.size ?? size.value,
        keyword: opts.keyword,
        materialFit: opts.materialFit,
        partnerType: opts.partnerType,
      })
      const list = Array.isArray(res?.content) ? res.content : []
      buyers.value = list.map(fromApi)
      page.value = Number(res?.page ?? 0)
      size.value = Number(res?.size ?? (opts.size ?? size.value))
      totalPages.value = Number(res?.totalPages ?? 0)
      totalElements.value = Number(res?.totalElements ?? 0)
      hasNext.value = Boolean(res?.hasNext)
      hasPrevious.value = Boolean(res?.hasPrevious)
      return res
    } catch (e) {
      error.value = e?.message ?? '거래처 목록을 불러오지 못했습니다.'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 거래처를 생성하고 성공 시 목록에 반영한다.
  async function createBuyer(payload) {
    const normalizedPayload = normalizeBuyerPayload(payload)
    const errors = validateBuyerPayload(normalizedPayload)
    if (Object.keys(errors).length > 0) {
      return { success: false, errors, message: '필수 입력값을 확인해주세요.' }
    }

    try {
      const created = await circularBuyerApi.create(normalizedPayload)
      const buyer = fromApi(created)
      buyers.value = [buyer, ...buyers.value]
      return { success: true, buyer }
    } catch (e) {
      return { success: false, message: e?.message ?? '거래처 등록에 실패했습니다.' }
    }
  }

  // 거래처를 수정하고 성공 시 목록을 갱신한다.
  async function updateBuyer(id, payload) {
    const currentBuyer = getBuyerById(id)
    if (!currentBuyer) {
      return { success: false, message: '수정할 거래처를 찾을 수 없습니다.' }
    }

    const normalizedPayload = normalizeBuyerPayload(payload)
    const errors = validateBuyerPayload(normalizedPayload)
    if (Object.keys(errors).length > 0) {
      return { success: false, errors, message: '필수 입력값을 확인해주세요.' }
    }

    try {
      const updated = await circularBuyerApi.update(currentBuyer.code, normalizedPayload)
      const buyer = fromApi(updated)
      buyers.value = buyers.value.map((b) => (b.id === id ? buyer : b))
      return { success: true, buyer }
    } catch (e) {
      return { success: false, message: e?.message ?? '거래처 수정에 실패했습니다.' }
    }
  }

  // 거래처를 삭제하고 성공 시 목록에서 제거한다.
  async function deleteBuyer(id) {
    const currentBuyer = getBuyerById(id)
    if (!currentBuyer) {
      return { success: false, message: '삭제할 거래처를 찾을 수 없습니다.' }
    }
    try {
      await circularBuyerApi.delete(currentBuyer.code)
      buyers.value = buyers.value.filter((b) => b.id !== id)
      return { success: true }
    } catch (e) {
      return { success: false, message: e?.message ?? '거래처 삭제에 실패했습니다.' }
    }
  }

  // code 기준으로 거래처를 보장 조회한다(캐시 우선, 실패 시 상세/검색 fallback).
  async function ensureBuyerByCode(code) {
    const normalized = String(code ?? '').trim()
    if (!normalized) return null
    const existing = getBuyerById(normalized)
    if (existing) return existing
    try {
      const detail = await circularBuyerApi.detail(normalized)
      const buyer = fromApi(detail)
      buyers.value = upsertBuyer(buyers.value, buyer)
      return buyer
    } catch {
      try {
        const pageRes = await circularBuyerApi.listPage({
          page: 0,
          size: 20,
          keyword: normalized,
        })
        const found = (Array.isArray(pageRes?.content) ? pageRes.content : [])
          .find((b) => String(b?.code || '') === normalized)
        if (!found) return null
        const buyer = fromApi(found)
        buyers.value = upsertBuyer(buyers.value, buyer)
        return buyer
      } catch {
        return null
      }
    }
  }

  return {
    buyers,
    sortedBuyers,
    loading,
    error,
    page,
    size,
    totalPages,
    totalElements,
    hasNext,
    hasPrevious,
    materialFitCounts,
    MATERIAL_FIT_OPTIONS,
    INDUSTRY_GROUP_OPTIONS,
    PARTNER_TYPE_OPTIONS,
    createEmptyBuyerForm,
    materialFitLabel,
    partnerTypeLabel,
    getBuyerById,
    filteredBuyers,
    fetchPage,
    fetchStats,
    createBuyer,
    updateBuyer,
    deleteBuyer,
    ensureBuyerByCode,
  }
})
