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
  '재생원사',
  '홈텍스타일',
  '반려동물 용품',
  '패션 잡화',
  '의료/위생',
  '인테리어',
  '음향 기기',
  '농업',
  '뷰티/화학',
  '교육/공예',
  '단체복/워크웨어',
  '아웃도어 잡화',
  '물류 자재',
  '해양/수산',
  '구호 용품',
  '가구 제조',
  '자동차 부품',
  '레저/기어',
  '화학 사출',
  '생활 잡화',
  '의류/워크웨어',
  '유니폼',
  '건설 자재',
  '자동차 흡음',
  '산업 소모품',
  '가구 자재',
  '에너지',
  '물류 패키징',
]

// ─── BE 응답 → FE 모델 매핑 ─────────────────────────────────────────────
// BE 의 code 를 FE 의 id 로 노출하여 기존 컴포넌트의 `buyer.id` 호환.
function fromApi(v) {
  return {
    id: v.code,
    code: v.code,
    companyName: v.companyName,
    industryGroup: v.industryGroup,
    productTypes: Array.isArray(v.productTypes) ? v.productTypes : [],
    productNote: v.productNote ?? '',
    description: v.description ?? '',
    primaryMaterialFit: v.primaryMaterialFit,
    managerName: v.managerName,
    phone: v.phone,
    partnerType: v.partnerType ?? 'general',
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  }
}

function createEmptyBuyerForm() {
  return {
    companyName: '',
    industryGroup: '',
    productTypes: [],
    productNote: '',
    description: '',
    primaryMaterialFit: '',
    managerName: '',
    phone: '',
    partnerType: 'general',
  }
}

function normalizeProductTypes(productTypes) {
  if (Array.isArray(productTypes)) {
    return [
      ...new Set(
        productTypes
          .map((item) => String(item ?? '').trim())
          .filter(Boolean),
      ),
    ]
  }

  return [
    ...new Set(
      String(productTypes ?? '')
        .split('\n')
        .flatMap((line) => line.split(','))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ]
}

function materialFitLabel(value) {
  return MATERIAL_FIT_OPTIONS.find((option) => option.value === value)?.label ?? '-'
}

function partnerTypeLabel(value) {
  return PARTNER_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? '-'
}

function normalizeBuyerPayload(payload) {
  const partnerTypeRaw = String(payload.partnerType ?? 'general').trim()
  return {
    companyName: String(payload.companyName ?? '').trim(),
    industryGroup: String(payload.industryGroup ?? '').trim(),
    productTypes: normalizeProductTypes(payload.productTypes),
    productNote: String(payload.productNote ?? '').trim(),
    description: String(payload.description ?? '').trim(),
    primaryMaterialFit: String(payload.primaryMaterialFit ?? '').trim(),
    managerName: String(payload.managerName ?? '').trim(),
    phone: String(payload.phone ?? '').trim(),
    partnerType: partnerTypeRaw || 'general',
  }
}

// FE 1차 검증 — BE 가 4001(REQUEST_ERROR) 로도 막지만 즉시 피드백 용도. 거래처 코드는 BE 자동 부여라 검증 X.
function validateBuyerPayload(payload) {
  const errors = {}

  if (!payload.companyName) errors.companyName = '업체명을 입력해주세요.'
  if (!payload.industryGroup) errors.industryGroup = '산업군을 선택해주세요.'
  if (!payload.primaryMaterialFit) errors.primaryMaterialFit = '대표 소재 적합도를 선택해주세요.'
  if (!payload.managerName) errors.managerName = '담당자명을 입력해주세요.'
  if (!payload.phone) errors.phone = '연락처를 입력해주세요.'
  if (!PARTNER_TYPE_SET.has(payload.partnerType)) {
    errors.partnerType = '파트너 유형을 선택해주세요.'
  }

  return errors
}

export const useCircularStockBuyerStore = defineStore('circularStockBuyers', () => {
  // --- state ---
  const buyers = ref([])
  const loading = ref(false)
  const error = ref(null)

  // --- getters ---
  const sortedBuyers = computed(() =>
    [...buyers.value].sort(
      (a, b) =>
        a.companyName.localeCompare(b.companyName, 'ko') ||
        a.code.localeCompare(b.code, 'ko'),
    ),
  )

  function getBuyerById(id) {
    return buyers.value.find((buyer) => buyer.id === id) ?? null
  }

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
        buyer.productNote,
        ...(Array.isArray(buyer.productTypes) ? buyer.productTypes : []),
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

  async function fetchAll(opts = {}) {
    loading.value = true
    error.value = null
    try {
      const list = await circularBuyerApi.list(opts)
      buyers.value = (list ?? []).map(fromApi)
    } catch (e) {
      error.value = e?.message ?? '거래처 목록을 불러오지 못했습니다.'
      throw e
    } finally {
      loading.value = false
    }
  }

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

  // 마운트 자동 fetch — vendor store 패턴 일관.
  fetchAll().catch((err) => {
    console.error('[circularInventoryBuyers] fetchAll 실패', err)
  })

  return {
    buyers,
    sortedBuyers,
    loading,
    error,
    MATERIAL_FIT_OPTIONS,
    INDUSTRY_GROUP_OPTIONS,
    PARTNER_TYPE_OPTIONS,
    createEmptyBuyerForm,
    materialFitLabel,
    partnerTypeLabel,
    getBuyerById,
    filteredBuyers,
    fetchAll,
    createBuyer,
    updateBuyer,
  }
})
