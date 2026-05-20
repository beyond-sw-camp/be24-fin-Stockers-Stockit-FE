import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useCircularStockInventoryStore } from '@/stores/hq/circularStock/circularStockInventory.js'
import { roundTo, parseWeightLabel } from '@/stores/hq/circularStock/circularStockCommon.js'
import { circularBuyerApi } from '@/api/hq/circularBuyer.js'
import { extractErrorMessage } from '@/api/axios.js'
import { createCircularSale as createCircularSaleApi, getCircularSaleDetail as getCircularSaleDetailApi, getCircularSales as getCircularSalesApi } from '@/api/hq/circularSale.js'
import { useCircularStockBuyerStore } from '@/stores/hq/circularStock/circularStockBuyers.js'
import { useEsgStore } from '@/stores/esg.js'

const NATURAL_SINGLE_MATERIALS = ['면', '울', '캐시미어', '실크', '리넨']
const SYNTHETIC_MATERIALS = ['폴리에스터', '아크릴', '나일론', '스판덱스']

// 소재명을 표준 명칭으로 정규화해 계산/매칭 오차를 줄인다.
function normalizeMaterialName(name) {
  const normalized = String(name ?? '').trim().toLowerCase()
  const aliasMap = {
    코튼: '면',
    cotton: '면',
    폴리: '폴리에스터',
    polyester: '폴리에스터',
    acrylic: '아크릴',
    polyamide: '나일론',
    nylon: '나일론',
    elastane: '스판덱스',
    스판: '스판덱스',
    spandex: '스판덱스',
    wool: '울',
    cashmere: '캐시미어',
    silk: '실크',
    linen: '리넨',
  }
  return aliasMap[normalized] ?? String(name ?? '').trim()
}

// 소재 구성비를 기반으로 소재 구분을 판정한다.
function deriveMaterialType(materials) {
  if (!Array.isArray(materials) || materials.length === 0) return '혼방'
  const normalized = materials.map(material => ({
    ...material,
    name: normalizeMaterialName(material.name),
  }))
  if (normalized.length >= 2) return '혼방'

  const [single] = normalized
  if (Number(single.ratio) !== 100) return '혼방'
  if (NATURAL_SINGLE_MATERIALS.includes(single.name)) return '천연 단일 섬유'
  if (SYNTHETIC_MATERIALS.includes(single.name)) return '합성 섬유'
  return '혼방'
}

// 소재 구분을 거래처 적합도 코드로 매핑한다.
function buyerMaterialFitValue(materialType) {
  if (materialType === '천연 단일 섬유') return 'natural-single'
  if (materialType === '합성 섬유') return 'synthetic'
  return 'blended'
}

const CARBON_REDUCTION_FACTORS = {
  면: 6.5,
  폴리에스터: 6.8,
  나일론: 5.5,
  혼방: 6.5,
  울: 20.0,
  default: 6.0,
}

const RESOURCE_CIRCULATION_FACTORS = {
  면: 1.8,
  울: 2.5,
  캐시미어: 2.8,
  실크: 2.4,
  리넨: 1.6,
  폴리에스터: 2.3,
  나일론: 2.1,
  아크릴: 2.0,
  스판덱스: 1.7,
  혼방: 1.9,
  default: 1.9,
}

const EXECUTION_BASE_POINTS = 120
const CARBON_POINT_MULTIPLIER = 1
const TRACEABILITY_POINT_RULES = [
  { key: 'materialClassified', label: '소재 분류 완료', points: 25 },
  { key: 'buyerClassified', label: '거래처 유형 확정', points: 25 },
  { key: 'treatmentResolved', label: '처리 목적 확정', points: 20 },
  { key: 'carbonEvidenceStored', label: '탄소 계산 근거 저장', points: 15 },
  { key: 'snapshotStored', label: '판매 스냅샷 저장 완료', points: 15 },
]

const INDUSTRY_TREATMENT_TYPE_MAP = {
  재생원사: '재활용',
  '화학 재활용': '재활용',
  '가구 자재': '재활용',
  '물류 자재': '재활용',
  '물류 패키지': '재활용',
  '패션 잡화': '업사이클링',
  텍스타일: '업사이클링',
  '반려용품': '업사이클링',
  '교육/공예': '업사이클링',
  인테리어: '업사이클링',
  빈티지: '중고 재판매',
  '의류/핸드메이드': '중고 재판매',
  '리퍼브/핸드케어': '중고 재판매',
  '건설 자재': '다운사이클링',
  '자동차 부품': '다운사이클링',
  '산업 소모품': '다운사이클링',
  에너지: '다운사이클링',
}

// 소재명 기준 계수를 조회하되, 미정의 시 기본 계수를 사용한다.
function getMaterialFactor(map, materialName) {
  const normalizedName = normalizeMaterialName(materialName)
  return map[normalizedName] ?? map.default
}

// 거래처 산업군/생산품 정보를 기반으로 처리 목적(재활용/업사이클링 등)을 추론한다.
function resolveTreatmentTypeFromBuyer(buyer = {}) {
  const exactMatch = INDUSTRY_TREATMENT_TYPE_MAP[buyer?.industryGroup]
  if (exactMatch) return exactMatch

  const joinedProductTypes = Array.isArray(buyer?.productTypes)
    ? buyer.productTypes.join(' ')
    : String(buyer?.productNote ?? '')

  if (/빈티지|핸드케어|중고|의류\/핸드메이드/.test(joinedProductTypes)) return '중고 재판매'
  if (/가방|파우치|쿠션|컨버전|텍스타일|잡화|공예/.test(joinedProductTypes)) return '업사이클링'
  if (/보온|단열|완충|부품|소모품/.test(joinedProductTypes)) return '다운사이클링'
  if (/재생|원사|방적|재활용|재생원료|패키지/.test(joinedProductTypes)) return '재활용'

  return '재활용'
}

// 판매건 기준 ESG 스냅샷(점수/KPI/근거)을 계산한다.
function buildSaleEsgSnapshot(sale, buyer, kauPrice, options = {}) {
  const items = Array.isArray(sale?.items) ? sale.items : []
  const treatmentType = resolveTreatmentTypeFromBuyer(buyer)
  const materialBreakdownMap = new Map()
  let savedCarbonKg = 0
  let resourceCirculationPointsRaw = 0

  for (const item of items) {
    const actualWeightKg = Number(item.actualWeightKg) || 0
    const materials = Array.isArray(item.materials) && item.materials.length > 0
      ? item.materials
      : [{ name: '기타', ratio: 100 }]

    const totalRatio = materials.reduce((sum, material) => sum + (Number(material.ratio) || 0), 0) || 100

    for (const material of materials) {
      const normalizedName = normalizeMaterialName(material.name)
      const appliedWeightRatio = (Number(material.ratio) || 0) / totalRatio
      const weightKg = roundTo(actualWeightKg * appliedWeightRatio, 4)
      const carbonReductionFactor = getMaterialFactor(CARBON_REDUCTION_FACTORS, normalizedName)
      const resourceCirculationFactor = getMaterialFactor(RESOURCE_CIRCULATION_FACTORS, normalizedName)

      savedCarbonKg += weightKg * carbonReductionFactor
      resourceCirculationPointsRaw += weightKg * resourceCirculationFactor

      const existing = materialBreakdownMap.get(normalizedName) ?? {
        materialName: normalizedName,
        weightKg: 0,
        carbonReductionFactor,
        resourceCirculationFactor,
        appliedWeightRatio: 0,
      }

      existing.weightKg += weightKg
      existing.appliedWeightRatio += appliedWeightRatio
      materialBreakdownMap.set(normalizedName, existing)
    }
  }

  const normalizedBreakdown = [...materialBreakdownMap.values()].map(entry => ({
    ...entry,
    weightKg: roundTo(entry.weightKg, 4),
    appliedWeightRatio: roundTo(entry.appliedWeightRatio, 4),
  }))

  const roundedSavedCarbonKg = roundTo(savedCarbonKg, 2)
  const resourceCirculationPoints = roundTo(resourceCirculationPointsRaw, 0)
  const carbonContributionPoints = roundTo(roundedSavedCarbonKg * CARBON_POINT_MULTIPLIER, 0)
  const carbonCreditValue = roundTo((roundedSavedCarbonKg / 1000) * (Number(kauPrice) || 0), 0)
  const salesRevenue = Number(sale?.totalAmount)
    || items.reduce((sum, item) => sum + (Number(item.lineAmount) || 0), 0)
  const wasteLossRecoveredValue = roundTo(salesRevenue, 0)
  const tradableCarbonCreditValue = carbonCreditValue

  const traceabilityChecks = {
    materialClassified: items.every(item =>
      Boolean(item.materialType)
      && Array.isArray(item.materials)
      && item.materials.length > 0
      && item.materials.every(material => Boolean(material.name) && Number(material.ratio) > 0),
    ),
    buyerClassified: Boolean(buyer?.industryGroup || buyer?.primaryMaterialFit),
    treatmentResolved: Boolean(treatmentType),
    carbonEvidenceStored: normalizedBreakdown.length > 0,
    snapshotStored: Boolean(sale?.saleId || options.isEstimated),
  }

  const traceabilityBreakdown = TRACEABILITY_POINT_RULES.map(rule => ({
    scoreType: rule.key,
    label: rule.label,
    points: traceabilityChecks[rule.key] ? rule.points : 0,
    formulaSummary: traceabilityChecks[rule.key] ? `${rule.label} 충족` : `${rule.label} 미충족`,
  }))

  const scoreBreakdown = [
    {
      scoreType: 'execution',
      label: '순환 판매 실행 점수',
      points: items.length > 0 ? EXECUTION_BASE_POINTS : 0,
      formulaSummary: `판매 1건 최종 등록 완료 시 기본 ${EXECUTION_BASE_POINTS}pt`,
    },
    {
      scoreType: 'resourceCirculation',
      label: '자원 순환 전환 점수',
      points: resourceCirculationPoints,
      formulaSummary: '실제 판매 무게 × 소재별 순환 전환 계수',
    },
    {
      scoreType: 'carbonContribution',
      label: '탄소 절감 기여 점수',
      points: carbonContributionPoints,
      formulaSummary: `실제 탄소 절감량 ${roundedSavedCarbonKg.toFixed(2)}kgCO2 × ${CARBON_POINT_MULTIPLIER}`,
    },
    {
      scoreType: 'traceability',
      label: '인증/추적 완료 점수',
      points: traceabilityBreakdown.reduce((sum, item) => sum + item.points, 0),
      formulaSummary: `${traceabilityBreakdown.filter(item => item.points > 0).length}/${traceabilityBreakdown.length} 항목 충족`,
    },
  ]

  return {
    scoreBreakdown,
    kpiSnapshot: {
      savedCarbonKg: roundedSavedCarbonKg,
      carbonCreditValue,
      tradableCarbonCreditValue,
      salesRevenue: roundTo(salesRevenue, 0),
      wasteLossRecoveredValue,
    },
    esgMeta: {
      treeGrowPoints: scoreBreakdown.reduce((sum, item) => sum + item.points, 0),
      treatmentType,
      kauPriceAtSale: Number(kauPrice) || 0,
      formulaSummary: '나무 심기 점수 = 순환 판매 실행 + 자원 순환 전환 + 탄소 절감 기여 + 인증/추적 완료',
      materialBreakdown: normalizedBreakdown,
      traceabilityBreakdown,
    },
    isEstimated: Boolean(options.isEstimated),
  }
}

// 판매 등록 draft 항목을 정규화하고 파생값(수량/금액)을 재계산한다.
function normalizeDraftField(current = {}, patch = {}) {
  const merged = { ...current, ...patch }
  const asNumber = (value, fallback = 0) => {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
  }

  const availableQuantity = Math.max(0, asNumber(merged.availableQuantity))
  const availableWeightKg = Math.max(0, asNumber(merged.availableWeightKg))
  const computedUnitWeight = availableQuantity > 0 ? roundTo(availableWeightKg / availableQuantity, 4) : 0
  const unitWeightKg = Math.max(0, asNumber(merged.unitWeightKg, computedUnitWeight) || computedUnitWeight)

  const requestedWeightKgRaw = Math.max(0, asNumber(merged.requestedWeightKg))
  const requestedWeightKg = Math.min(requestedWeightKgRaw, availableWeightKg)

  const estimatedQuantityRaw = unitWeightKg > 0 ? requestedWeightKg / unitWeightKg : 0
  const estimatedQuantity = Math.max(0, estimatedQuantityRaw)
  const deductedQuantity = Math.min(availableQuantity, requestedWeightKg > 0 ? Math.ceil(estimatedQuantity) : 0)
  const actualWeightKg = Math.min(availableWeightKg, roundTo(deductedQuantity * unitWeightKg, 3))

  const unitPriceSource = asNumber(merged.resolvedUnitPrice) || asNumber(merged.unitPrice) || asNumber(merged.defaultKgUnitPrice)
  const unitPrice = Math.max(0, roundTo(unitPriceSource, 0))
  const requestedAmount = roundTo(requestedWeightKg * unitPrice, 0)
  const actualAmount = roundTo(actualWeightKg * unitPrice, 0)

  return {
    ...merged,
    availableQuantity,
    availableWeightKg: roundTo(availableWeightKg, 3),
    unitWeightKg: roundTo(unitWeightKg, 4),
    requestedWeightKg: roundTo(requestedWeightKg, 3),
    estimatedQuantity: roundTo(estimatedQuantity, 3),
    deductedQuantity,
    requestedAmount,
    actualWeightKg: roundTo(actualWeightKg, 3),
    actualAmount,
    unitPrice,
    lineAmount: actualAmount,
  }
}

// 순환재고 판매 도메인 상태/등록 흐름/목록·상세 조회를 관리하는 Store다.
export const useCircularStockSaleStore = defineStore('circularStockSale', () => {
  const buyerStore = useCircularStockBuyerStore()
  const esgStore = useEsgStore()
  const inventoryStore = useCircularStockInventoryStore()
  const salesPage = ref({
    page: 0,
    size: 20,
    totalPages: 0,
    totalElements: 0,
    hasNext: false,
    hasPrevious: false,
    content: [],
  })
  const salesDetailById = ref({})
  const draftBuyerId = ref('')
  const draftMemo = ref('')
  const draftItems = ref([])
  const step3GroupRequestedKg = ref({})
  const saleStep = ref(1)
  const hasStartedWorkflow = ref(false)
  const lockedMaterialType = ref('')
  const selectedWarehouseCode = ref('')
  const selectedWarehouseName = ref('')
  const sortedSales = computed(() => [...salesPage.value.content])
  const selectedBuyer = computed(() =>
    buyerStore.getBuyerById(draftBuyerId.value) ?? null,
  )
  const draftSummary = computed(() => ({
    totalItems: draftItems.value.length,
    totalRequestedWeightKg: roundTo(
      draftItems.value.reduce((sum, item) => sum + (Number(item.requestedWeightKg) || 0), 0),
    ),
    totalRequestedAmount: draftItems.value.reduce((sum, item) => sum + (Number(item.requestedAmount) || 0), 0),
    totalEstimatedQuantity: roundTo(
      draftItems.value.reduce((sum, item) => sum + (Number(item.estimatedQuantity) || 0), 0),
    ),
    totalDeductedQuantity: draftItems.value.reduce((sum, item) => sum + (Number(item.deductedQuantity) || 0), 0),
    totalActualWeightKg: roundTo(
      draftItems.value.reduce((sum, item) => sum + (Number(item.actualWeightKg) || 0), 0),
    ),
    totalActualAmount: draftItems.value.reduce((sum, item) => sum + (Number(item.actualAmount) || 0), 0),
    totalWeightKg: roundTo(
      draftItems.value.reduce((sum, item) => sum + (Number(item.requestedWeightKg) || 0), 0),
    ),
    totalAmount: draftItems.value.reduce((sum, item) => sum + (Number(item.requestedAmount) || 0), 0),
  }))

  // ADR-021 AI 거래처 추천: Step 1 -> Step 2 전환 시 1회 자동 호출 (결정일 2026-04-30).
  const recommendations = ref([])
  const isRecommendationLoading = ref(false)
  const recommendationError = ref(null)
  const lastRecommendationBasisKey = ref('')
  const recommendationDirty = ref(true)
  /**
   * 추천 요청 페이로드 자동 생성.
   * Step 1의 SKU 선택 + lockedMaterialType 기준으로 핵심 4필드를 만든다.
   */
  // 추천 API 요청용 핵심 페이로드를 현재 draft 상태에서 조합한다.
  const recommendationPayload = computed(() => {
    const items = draftItems.value
    if (items.length === 0 || !lockedMaterialType.value) return null
    const materialFit = buyerMaterialFitValue(lockedMaterialType.value)
    const head = items[0]
    const productName = items.length > 1
      ? `${head.itemName} 외 ${items.length - 1}건`
      : head.itemName
    const materialsLabel = (head.materials ?? [])
      .map(m => `${m.name} ${m.ratio}%`)
      .join(', ')
    const categories = [...new Set(items.map(item => item.mainCategory).filter(Boolean))].join(', ')
    const description = [
      `${lockedMaterialType.value} 잔재고`,
      materialsLabel ? `${materialsLabel}.` : '',
      categories ? `${categories} 카테고리.` : '',
    ].filter(Boolean).join(' ')
    const totalKg = items.reduce((sum, item) => sum + (Number(item.availableWeightKg) || 0), 0)
    const totalQty = items.reduce((sum, item) => sum + (Number(item.availableQuantity) || 0), 0)
    const quantityHint = `약 ${totalKg.toFixed(1)}kg / ${totalQty}벌`
    return {
      materialFit,
      productName,
      description,
      quantityHint,
      productCode: head.itemCode ?? null,
      warehouseCode: selectedWarehouseCode.value || head.warehouseCode || null,
    }
  })

  // 추천 요청 중복 호출 방지를 위한 기준 키다.
  const recommendationBasisKey = computed(() => {
    if (!recommendationPayload.value) return ''
    return JSON.stringify(recommendationPayload.value)
  })

  // 현재 소재 구분에 맞는 거래처 후보 목록을 제공한다.
  const matchedBuyerCandidates = computed(() => {
    if (!lockedMaterialType.value) return buyerStore.sortedBuyers
    return buyerStore.filteredBuyers('', {
      primaryMaterialFit: buyerMaterialFitValue(lockedMaterialType.value),
    })
  })

  // 판매 목록 API row를 FE 목록 모델로 정규화한다.
  function mapSaleListFromApi(row = {}) {
    return {
      saleId: Number(row.saleId),
      saleNo: String(row.saleNo || ''),
      status: String(row.status || ''),
      outboundNo: row.outboundNo ?? null,
      outboundStatus: row.outboundStatus ?? null,
      soldAt: row.soldAt ?? null,
      completedAt: row.completedAt ?? null,
      buyerCode: row.buyerCode ?? null,
      buyerName: row.buyerName ?? null,
      buyerIndustryGroup: row.buyerIndustryGroup ?? null,
      materialType: row.materialType ?? null,
      totalSkuCount: Number(row.totalSkuCount || 0),
      totalActualWeightKg: Number(row.totalActualWeightKg || 0),
      totalSoldQuantity: Number(row.totalSoldQuantity || 0),
      totalAmount: Number(row.totalAmount || 0),
      headline: String(row.headline || ''),
    }
  }

  // 판매 상세 API 응답을 FE 상세 모델로 정규화한다.
  function mapSaleDetailFromApi(detail = {}) {
    const items = Array.isArray(detail.items)
      ? detail.items.map((item) => ({
        itemId: Number(item.itemId),
        inventoryId: String(item.inventoryId ?? ''),
        skuCode: String(item.skuCode ?? ''),
        productCode: String(item.productCode ?? ''),
        productName: String(item.productName ?? ''),
        mainCategory: String(item.mainCategory ?? ''),
        subCategory: String(item.subCategory ?? ''),
        color: String(item.color ?? ''),
        size: String(item.size ?? ''),
        materialType: String(item.materialType ?? ''),
        requestedWeightKg: Number(item.requestedWeightKg || 0),
        actualWeightKg: Number(item.actualWeightKg || 0),
        estimatedQuantity: Number(item.estimatedQuantity || 0),
        soldQuantity: Number(item.soldQuantity || 0),
        unitPrice: Number(item.unitPrice || 0),
        lineAmount: Number(item.lineAmount || 0),
        memo: item.memo ?? null,
        materials: Array.isArray(item.materials)
          ? item.materials.map((mat) => ({
            code: mat.materialCode,
            name: mat.materialName,
            ratio: Number(mat.ratio || 0),
            sortOrder: Number(mat.sortOrder || 0),
          }))
          : [],
      }))
      : []

    return {
      saleId: Number(detail.saleId),
      saleNo: String(detail.saleNo || ''),
      status: String(detail.status || ''),
      outboundNo: detail.outboundNo ?? null,
      outboundStatus: detail.outboundStatus ?? null,
      soldAt: detail.soldAt ?? null,
      completedAt: detail.completedAt ?? null,
      soldByMemberId: detail.soldByMemberId ?? null,
      soldByName: detail.soldByName ?? null,
      outboundHeaderId: detail.outboundHeaderId ?? null,
      buyerCode: detail.buyerCode ?? null,
      buyerName: detail.buyerName ?? null,
      buyerIndustryGroup: detail.buyerIndustryGroup ?? null,
      materialType: detail.materialType ?? null,
      totalSkuCount: Number(detail.totalSkuCount || 0),
      totalRequestedWeightKg: Number(detail.totalRequestedWeightKg || 0),
      totalActualWeightKg: Number(detail.totalActualWeightKg || 0),
      totalEstimatedQuantity: items.reduce((sum, item) => sum + (Number(item.estimatedQuantity) || 0), 0),
      totalSoldQuantity: Number(detail.totalSoldQuantity || 0),
      totalAmount: Number(detail.totalAmount || 0),
      memo: detail.memo ?? null,
      items,
      statusHistory: Array.isArray(detail.statusHistory) ? detail.statusHistory : [],
    }
  }

  // 현재 draft를 판매 생성 API payload 규격으로 변환한다.
  function mapCreatePayloadToApi() {
    return {
      buyerCode: String(draftBuyerId.value || ''),
      materialType: String(lockedMaterialType.value || ''),
      memo: String(draftMemo.value || '').trim(),
      items: draftItems.value.map((item) => ({
        inventoryId: Number(item.inventoryId),
        skuCode: String(item.skuCode || ''),
        requestedWeightKg: Number(Number(item.requestedWeightKg || 0).toFixed(3)),
        soldQuantity: Number(item.deductedQuantity || 0),
        actualWeightKg: Number(Number(item.actualWeightKg || 0).toFixed(3)),
        estimatedQuantity: Number(Number(item.estimatedQuantity || 0).toFixed(3)),
        unitPrice: Number(item.unitPrice || 0),
        lineAmount: Number(item.lineAmount || 0),
        memo: item.memo ?? null,
      })),
    }
  }

  // 판매 내역 페이지를 조회하고 페이징 상태를 반영한다.
  async function fetchCircularSalesPage(filters = {}) {
    const response = await getCircularSalesApi(filters)
    const content = Array.isArray(response?.content) ? response.content.map(mapSaleListFromApi) : []
    salesPage.value = {
      page: Number(response?.page ?? 0),
      size: Number(response?.size ?? 20),
      totalPages: Number(response?.totalPages ?? 0),
      totalElements: Number(response?.totalElements ?? 0),
      hasNext: Boolean(response?.hasNext),
      hasPrevious: Boolean(response?.hasPrevious),
      content,
    }
    return salesPage.value
  }

  // 판매 상세를 조회하고 id별 캐시에 저장한다.
  async function fetchCircularSaleDetail(saleId) {
    const response = await getCircularSaleDetailApi(saleId)
    const mapped = mapSaleDetailFromApi(response)
    salesDetailById.value = {
      ...salesDetailById.value,
      [String(saleId)]: mapped,
    }
    return mapped
  }

  // 상세 캐시 우선으로 판매건을 조회하고, 없으면 목록에서 fallback 탐색한다.
  function getSaleById(saleId) {
    return salesDetailById.value[String(saleId)]
      ?? sortedSales.value.find(sale => String(sale.saleId) === String(saleId))
      ?? null
  }

  // 판매건 ESG 스냅샷을 반환한다(저장값 우선, 없으면 추정 계산).
  function getSaleEsgSnapshot(saleInput) {
    const saleRecord = typeof saleInput === 'string' ? getSaleById(saleInput) : saleInput
    if (!saleRecord) return null

    if (Array.isArray(saleRecord.scoreBreakdown) && saleRecord.kpiSnapshot && saleRecord.esgMeta) {
      return {
        scoreBreakdown: saleRecord.scoreBreakdown,
        kpiSnapshot: saleRecord.kpiSnapshot,
        esgMeta: saleRecord.esgMeta,
        isEstimated: false,
      }
    }

    const buyer = buyerStore.getBuyerById(saleRecord.buyerCode) ?? {
      industryGroup: saleRecord.buyerIndustryGroup,
    }

    return buildSaleEsgSnapshot(saleRecord, buyer, esgStore.kauPrice, { isEstimated: true })
  }

  // draftId로 등록 초안 항목을 조회한다.
  function getDraftItem(draftId) {
    return draftItems.value.find(item => item.draftId === draftId) ?? null
  }

  // 현재 소재 구분 조건을 반영한 거래처 필터 결과를 반환한다.
  function filteredBuyers(keyword = '') {
    if (!lockedMaterialType.value) return buyerStore.filteredBuyers(keyword)
    return buyerStore.filteredBuyers(keyword, {
      primaryMaterialFit: buyerMaterialFitValue(lockedMaterialType.value),
    })
  }

  // 선택 거래처를 등록 draft 상태에 반영한다.
  function selectBuyer(buyerId) {
    draftBuyerId.value = buyerId
  }

  // 판매 메모 입력값을 draft 상태에 반영한다.
  function setDraftMemo(memo) {
    draftMemo.value = memo
  }

  // 재고 SKU를 판매 draft 항목으로 추가하고 제약(소재/창고)을 검증한다.
  function addSaleDraftItem(skuRow) {
    const resolvedInventoryId = skuRow?.inventoryId ?? skuRow?.id ?? ''
    const draftId = String(skuRow?.id ?? resolvedInventoryId)
    const inventoryId = String(resolvedInventoryId)
    const inventory = inventoryStore.getInventoryById(inventoryId)
    if (!inventory) {
      return { success: false, message: '순환 재고 항목을 찾을 수 없습니다.' }
    }
    if (!Array.isArray(inventoryStore.inventoryWarehouseCodes) || inventoryStore.inventoryWarehouseCodes.length !== 1) {
      return { success: false, message: '창고 1개를 먼저 선택해 주세요.' }
    }
    if (!String(inventoryStore.inventoryMaterialGroup || '').trim()) {
      return { success: false, message: '소재 구분을 먼저 선택해 주세요.' }
    }
    const existing = getDraftItem(draftId)
    if (existing) {
      return { success: true, item: existing, alreadyExists: true }
    }

    const materialType = skuRow?.materialType ?? deriveMaterialType(inventory.materials)
    const currentWarehouseCode = String(skuRow?.warehouseCode ?? inventory.warehouseCode ?? '')
    const currentWarehouseName = String(skuRow?.warehouseName ?? inventory.warehouseName ?? '')
    if (!currentWarehouseCode) {
      return { success: false, message: '출고 창고 정보를 확인할 수 없습니다.' }
    }
    if (lockedMaterialType.value && lockedMaterialType.value !== materialType) {
      return {
        success: false,
        message: `현재 요청서는 ${lockedMaterialType.value}만 선택할 수 있습니다.`,
      }
    }
    if (selectedWarehouseCode.value && selectedWarehouseCode.value !== currentWarehouseCode) {
      return {
        success: false,
        message: `현재 요청서는 ${selectedWarehouseName.value || selectedWarehouseCode.value} 창고 SKU만 선택할 수 있습니다.`,
      }
    }
    if (!lockedMaterialType.value) {
      lockedMaterialType.value = materialType
    }
    if (!selectedWarehouseCode.value) {
      selectedWarehouseCode.value = currentWarehouseCode
      selectedWarehouseName.value = currentWarehouseName
    }

    const availableQuantity = Number(skuRow?.quantity) || 0
    const availableWeightKg = roundTo(parseWeightLabel(skuRow?.weight))
    const unitWeightKg = availableQuantity > 0 ? roundTo(availableWeightKg / availableQuantity, 4) : 0
    const defaultKgUnitPrice = Number(skuRow?.materialKgPrice) || 0

    const draftItem = normalizeDraftField({
      draftId,
      skuCode: skuRow?.skuCode ?? '',
      color: skuRow?.color ?? '',
      size: skuRow?.size ?? '',
      materialType,
      defaultKgUnitPrice,
      resolvedUnitPrice: defaultKgUnitPrice,
      inventoryId: inventory.id,
      itemCode: inventory.itemCode,
      itemName: inventory.itemName,
      mainCategory: inventory.parentCategory,
      subCategory: inventory.childCategory,
      warehouseCode: currentWarehouseCode,
      warehouseName: currentWarehouseName,
      materials: inventory.materials,
      availableQuantity,
      availableWeightKg,
      unitWeightKg,
      requestedWeightKg: '',
      estimatedQuantity: 0,
      deductedQuantity: 0,
      requestedAmount: 0,
      actualWeightKg: 0,
      actualAmount: 0,
      unitPrice: defaultKgUnitPrice,
      lineAmount: 0,
    })

    draftItems.value = [...draftItems.value, draftItem]
    recommendationDirty.value = true
    return { success: true, item: draftItem }
  }

  // 특정 draft 항목의 수량/금액 등 편집값을 갱신한다.
  function updateSaleDraftItem(draftId, payload) {
    const index = draftItems.value.findIndex(item => item.draftId === draftId)
    if (index === -1) {
      return { success: false, message: '판매 초안에서 항목을 찾을 수 없습니다.' }
    }

    const next = [...draftItems.value]
    next[index] = normalizeDraftField(next[index], payload)
    draftItems.value = next
    return { success: true, item: next[index] }
  }

  // draft 항목을 제거하고 필요 시 워크플로우 상태를 초기화한다.
  function removeSaleDraftItem(draftId) {
    draftItems.value = draftItems.value.filter(item => item.draftId !== draftId)
    recommendationDirty.value = true
    if (draftItems.value.length === 0) {
      lockedMaterialType.value = ''
      selectedWarehouseCode.value = ''
      selectedWarehouseName.value = ''
      draftBuyerId.value = ''
      step3GroupRequestedKg.value = {}
      saleStep.value = 1
      hasStartedWorkflow.value = false
      recommendations.value = []
      recommendationError.value = null
      lastRecommendationBasisKey.value = ''
      recommendationDirty.value = true
    }
  }

  // 판매 등록 관련 상태를 전부 초기화한다(로그아웃/등록 완료 후 사용).
  function clearDraft() {
    draftBuyerId.value = ''
    draftMemo.value = ''
    draftItems.value = []
    step3GroupRequestedKg.value = {}
    lockedMaterialType.value = ''
    selectedWarehouseCode.value = ''
    selectedWarehouseName.value = ''
    saleStep.value = 1
    hasStartedWorkflow.value = false
    recommendations.value = []
    recommendationError.value = null
    lastRecommendationBasisKey.value = ''
    recommendationDirty.value = true
  }

  // 등록 워크플로우 시작 여부를 표시한다.
  function markWorkflowStarted() {
    hasStartedWorkflow.value = true
  }

  /**
   * ADR-021 추천 호출.
   * 호출 시점: moveStep(2) 또는 Step 1 -> Step 2 진입 시점 1회.
   * BE가 LLM 실패 시에도 fallback 응답을 내려줄 수 있어 네트워크/4xx 중심으로만 catch 처리한다.
   */
  // AI 거래처 추천을 호출하고 로딩/오류/결과 상태를 관리한다.
  async function fetchRecommendations() {
    const payload = recommendationPayload.value
    if (!payload) return
    isRecommendationLoading.value = true
    recommendationError.value = null
    recommendations.value = []
    try {
      const res = await circularBuyerApi.recommend(payload)
      recommendations.value = Array.isArray(res?.recommendations) ? res.recommendations : []
      lastRecommendationBasisKey.value = recommendationBasisKey.value
      recommendationDirty.value = false
    } catch (err) {
      const message = String(err?.message || '')
      const isTimeout =
        err?.code === 'ECONNABORTED'
        || message.includes('timeout')
        || message.includes('exceeded')
      recommendationError.value = isTimeout
        ? 'AI 추천 응답 시간이 길어져 요청이 만료되었습니다. 잠시 후 다시 시도해 주세요.'
        : extractErrorMessage(err, 'AI 추천을 불러오지 못했습니다.')
      recommendations.value = []
    } finally {
      isRecommendationLoading.value = false
    }
  }

  // 등록 단계(1~3) 전환을 검증 규칙에 맞춰 처리한다.
  function setSaleStep(nextStep) {
    const parsed = Number(nextStep)
    if (![1, 2, 3].includes(parsed)) return
    if (parsed === 2 && draftItems.value.length === 0) return
    if (parsed === 3 && (!draftBuyerId.value || draftItems.value.length === 0)) return
    saleStep.value = parsed
  }

  // 판매 생성 전에 draft의 필수값/재고 한도/소재·창고 일치를 검증한다.
  function validateCircularStockSaleDraft() {
    const buildCounts = () => {
      let unfilledSkuCount = 0
      let errorSkuCount = 0
      let overLimitSkuCount = 0
      for (const item of draftItems.value) {
        const requested = Number(item.requestedWeightKg)
        const actual = Number(item.actualWeightKg)
        const qty = Number(item.deductedQuantity)
        const availableKg = Number(item.availableWeightKg) || 0
        const availableQty = Number(item.availableQuantity) || 0
        if (!Number.isFinite(requested) || requested <= 0) {
          unfilledSkuCount += 1
          continue
        }
        const invalid = !Number.isFinite(actual) || !Number.isFinite(qty) || actual <= 0 || qty <= 0
        const overLimit = actual > availableKg + 0.0001 || qty > availableQty
        if (invalid || overLimit) {
          errorSkuCount += 1
          if (overLimit) overLimitSkuCount += 1
        }
      }
      return { unfilledSkuCount, errorSkuCount, overLimitSkuCount }
    }

    // 실패 메시지와 SKU 오류 집계를 표준 포맷으로 반환한다.
    const fail = (message, code, firstBlockingSku = null) => ({
      success: false,
      message,
      primaryMessage: message,
      codes: code ? [code] : [],
      counts: buildCounts(),
      firstBlockingSku,
      buyer: null,
    })

    if (draftItems.value.length === 0) {
      return fail('Step 1에서 판매할 SKU를 1건 이상 선택해 주세요.', 'NO_SKU')
    }
    if (!draftBuyerId.value) {
      return fail('Step 2에서 거래처를 선택해 주세요.', 'NO_BUYER')
    }
    if (!lockedMaterialType.value) {
      return fail('요청 소재 구분이 확정되지 않았습니다. Step 1 선택 상태를 다시 확인해 주세요.', 'MATERIAL_TYPE_MISSING')
    }
    if (!selectedWarehouseCode.value) {
      return fail('출고 창고를 먼저 선택해 주세요.', 'WAREHOUSE_MISSING')
    }

    const buyer = buyerStore.getBuyerById(draftBuyerId.value)
    if (!buyer) {
      return fail('선택한 거래처 정보를 찾을 수 없습니다. Step 2에서 다시 선택해 주세요.', 'BUYER_NOT_FOUND')
    }
    const expectedBuyerFit = buyerMaterialFitValue(lockedMaterialType.value)
    if (buyer.primaryMaterialFit !== expectedBuyerFit) {
      return fail(
        `선택한 거래처의 대표 소재 적합도(${buyerStore.materialFitLabel(buyer.primaryMaterialFit)})가 요청 소재 구분(${lockedMaterialType.value})과 맞지 않습니다.`,
        'BUYER_MATERIAL_MISMATCH',
      )
    }

    const inventoryAggregate = new Map()
    for (const item of draftItems.value) {
      const requestedWeightKg = Number(item.requestedWeightKg)
      const actualWeightKg = Number(item.actualWeightKg)
      const unitPrice = Number(item.unitPrice)
      const inventory = inventoryStore.getInventoryById(item.inventoryId)
      const skuLabel = `${item.itemName}(${item.skuCode || item.itemCode})`

      if (!inventory) {
        return fail(`${skuLabel} 재고를 찾을 수 없습니다.`, 'INVENTORY_NOT_FOUND', item.draftId)
      }
      if (Number.isNaN(requestedWeightKg) || requestedWeightKg <= 0) {
        return fail(`${skuLabel} 판매 kg를 입력해 주세요.`, 'REQUESTED_KG_MISSING', item.draftId)
      }
      if (Number.isNaN(unitPrice) || unitPrice <= 0) {
        return fail(`${skuLabel} kg당 단가를 입력해 주세요.`, 'UNIT_PRICE_MISSING', item.draftId)
      }
      if (item.deductedQuantity <= 0) {
        return fail(`${skuLabel} 차감 수량이 계산되지 않았습니다. 판매 kg와 단위중량을 확인해 주세요.`, 'DEDUCTED_QTY_INVALID', item.draftId)
      }
      if (actualWeightKg <= 0) {
        return fail(`${skuLabel} 실제 반영 kg가 계산되지 않았습니다.`, 'ACTUAL_KG_INVALID', item.draftId)
      }
      if (actualWeightKg > item.availableWeightKg) {
        return fail(`${skuLabel} 실제 반영 kg가 SKU 재고 kg를 초과합니다.`, 'SKU_WEIGHT_OVER_LIMIT', item.draftId)
      }
      if (item.deductedQuantity > item.availableQuantity) {
        return fail(`${skuLabel} 차감 수량이 SKU 재고 수량을 초과합니다.`, 'SKU_QTY_OVER_LIMIT', item.draftId)
      }
      if (item.materialType !== lockedMaterialType.value) {
        return fail('요청 내 SKU의 소재 구분이 일치하지 않습니다. Step 1에서 같은 소재 구분만 선택해 주세요.', 'MATERIAL_TYPE_MISMATCH', item.draftId)
      }
      const itemWarehouseCode = String(inventory.warehouseCode ?? item.warehouseCode ?? '')
      if (itemWarehouseCode !== selectedWarehouseCode.value) {
        return fail('요청 내 SKU의 출고 창고가 일치하지 않습니다. 같은 창고 SKU만 선택해 주세요.', 'WAREHOUSE_MISMATCH', item.draftId)
      }

      const aggregate = inventoryAggregate.get(item.inventoryId) ?? { actualWeightKg: 0, deductedQuantity: 0 }
      aggregate.actualWeightKg += actualWeightKg
      aggregate.deductedQuantity += item.deductedQuantity
      inventoryAggregate.set(item.inventoryId, aggregate)
    }

    for (const [inventoryId, aggregate] of inventoryAggregate.entries()) {
      const inventory = inventoryStore.getInventoryById(inventoryId)
      if (!inventory) continue
      if (aggregate.actualWeightKg > inventory.weightKg) {
        return fail(`${inventory.itemName} 항목의 실제 반영 kg 합계가 재고 kg를 초과합니다.`, 'AGG_WEIGHT_OVER_LIMIT')
      }
      if (aggregate.deductedQuantity > inventory.quantity) {
        return fail(`${inventory.itemName} 항목의 차감 수량 합계가 재고 수량을 초과합니다.`, 'AGG_QTY_OVER_LIMIT')
      }
    }

    return {
      success: true,
      message: '',
      primaryMessage: '',
      codes: [],
      counts: buildCounts(),
      firstBlockingSku: null,
      buyer,
    }
  }

  // 판매 생성 API를 호출하고 성공 시 draft를 비운 뒤 핵심 식별값을 반환한다.
  async function submitCircularStockSale() {
    const validation = validateCircularStockSaleDraft()
    if (!validation.success) {
      return validation
    }
    try {
      const created = await createCircularSaleApi(mapCreatePayloadToApi())
      const sale = {
        saleId: Number(created.saleId),
        saleNo: created.saleNo,
        status: created.status,
        outboundNo: created.outboundNo ?? null,
        outboundStatus: created.outboundStatus ?? null,
      }
      clearDraft()
      return { success: true, sale }
    } catch (err) {
      return {
        success: false,
        message: extractErrorMessage(err, '판매 생성에 실패했습니다.'),
        primaryMessage: extractErrorMessage(err, '판매 생성에 실패했습니다.'),
        codes: [],
      }
    }
  }

  return {
    salesPage,
    sortedSales,
    draftBuyerId,
    draftMemo,
    draftItems,
    step3GroupRequestedKg,
    saleStep,
    hasStartedWorkflow,
    lockedMaterialType,
    selectedWarehouseCode,
    selectedWarehouseName,
    selectedBuyer,
    matchedBuyerCandidates,
    draftSummary,
    recommendations,
    isRecommendationLoading,
    recommendationError,
    recommendationPayload,
    recommendationBasisKey,
    lastRecommendationBasisKey,
    recommendationDirty,
    filteredBuyers,
    fetchCircularSalesPage,
    fetchCircularSaleDetail,
    getSaleById,
    getSaleEsgSnapshot,
    getDraftItem,
    selectBuyer,
    setDraftMemo,
    setSaleStep,
    markWorkflowStarted,
    addSaleDraftItem,
    updateSaleDraftItem,
    removeSaleDraftItem,
    clearDraft,
    fetchRecommendations,
    validateCircularStockSaleDraft,
    submitCircularStockSale,
  }
})
