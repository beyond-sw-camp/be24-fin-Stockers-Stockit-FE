import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORES = ['강남점', '홍대점', '여의도점', '판교점', '분당점', '잠실점']

const WAREHOUSES = ['일산창고', '군포창고', '용인창고']

const CATEGORIES = ['상의', '하의', '아우터', '원피스', '액세서리']

const PRODUCT_POOL = [
  { code: 'TOP-001', name: '베이직 크루넥 티셔츠 (화이트)', category: '상의' },
  { code: 'TOP-002', name: '옥스포드 셔츠 (블루)', category: '상의' },
  { code: 'TOP-003', name: '오버핏 맨투맨 (그레이)', category: '상의' },
  { code: 'TOP-004', name: '슬림핏 긴팔 니트 (블랙)', category: '상의' },
  { code: 'BTM-001', name: '스트레이트 데님 팬츠 (연청)', category: '하의' },
  { code: 'BTM-002', name: '와이드 슬랙스 (차콜)', category: '하의' },
  { code: 'BTM-003', name: '테이퍼드 치노 팬츠 (베이지)', category: '하의' },
  { code: 'BTM-004', name: '플리츠 롱 스커트 (네이비)', category: '하의' },
  { code: 'OUT-001', name: '숏 트렌치 코트 (베이지)', category: '아우터' },
  { code: 'OUT-002', name: '라이트 푸퍼 점퍼 (블랙)', category: '아우터' },
  { code: 'OUT-003', name: '데님 트러커 자켓 (중청)', category: '아우터' },
  { code: 'OPS-001', name: '플로럴 랩 원피스', category: '원피스' },
  { code: 'OPS-002', name: '린넨 롱 원피스 (아이보리)', category: '원피스' },
  { code: 'ACC-001', name: '레더 스퀘어 크로스백', category: '액세서리' },
  { code: 'ACC-002', name: '비비드 실크 스카프', category: '액세서리' },
  { code: 'ACC-003', name: '캔버스 벨트 (브라운)', category: '액세서리' },
  { code: 'ACC-004', name: '니트 비니 (차콜)', category: '액세서리' },
]

const DEMAND_TRIGGERS = [
  '초여름 시즌',
  '주말 집객',
  '기획전 프로모션',
  '신제품 론칭',
  '날씨 급변 (기온 상승)',
  '인플루언서 노출',
]

const BASIS_TAG_POOL = ['계절성', '요일 패턴', '프로모션', '신제품', '날씨']

const RELOCATE_REASONS = [
  '출고 매장 재고 회전율 대비 과잉, 수요 매장 안전재고 미달',
  '최근 3주 판매 격차 확대, 재분배로 품절 예방',
  '기획전 예정 매장 선제 보강',
  '주말 수요 집중 매장 커버',
  '장기 체류 창고에서 회전 매장으로 이동',
  '계절 전환 시점 적정 재고 분산',
]

const PURCHASE_REASONS = [
  '최근 4주 판매 추세 +30% 초과, 안전재고 재설정 필요',
  '전사 가용재고 2주분 미만, 공급처 리드타임 감안',
  '시즌 피크 대비 선제 확보',
  '경쟁 제품 품절로 대체 수요 흡수 예상',
  '프로모션 3주 전 선입고 필요',
  '신제품 매장 첫 전개 물량',
]

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)]
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

function pickUniqueTags(pool, max) {
  const n = rand(1, max)
  return shuffle(pool).slice(0, n)
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatIso(date) {
  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes()) +
    ':00'
  )
}

function generateExecutiveSummary() {
  const stockoutStore = pick(STORES)
  const stockoutProduct = pick(PRODUCT_POOL)
  const stockoutDays = rand(1, 4)

  const deadWarehouse = pick(WAREHOUSES)
  const deadProduct = pick(PRODUCT_POOL.filter((p) => p.code !== stockoutProduct.code))
  const deadDays = rand(45, 90)

  const surgeCategory = pick(CATEGORIES)
  const surgeTrigger = pick(DEMAND_TRIGGERS)
  const surgeUplift = rand(18, 52)

  return [
    {
      type: 'stockout_risk',
      title: `${stockoutStore} ${stockoutProduct.name} ${stockoutDays}일 내 품절 예상`,
      storeName: stockoutStore,
      productCode: stockoutProduct.code,
      productName: stockoutProduct.name,
      days: stockoutDays,
    },
    {
      type: 'dead_stock',
      title: `${deadWarehouse} ${deadProduct.name} ${deadDays}일째 무재고 회전`,
      warehouseName: deadWarehouse,
      productCode: deadProduct.code,
      productName: deadProduct.name,
      days: deadDays,
    },
    {
      type: 'demand_surge',
      title: `${surgeTrigger} · ${surgeCategory} 수요 전주 대비 +${surgeUplift}%`,
      categoryName: surgeCategory,
      trigger: surgeTrigger,
      upliftPct: surgeUplift,
    },
  ]
}

function generateForecastSeries(base) {
  const history = []
  for (let i = 0; i < 12; i++) {
    const seasonal = Math.sin((i + rand(0, 3)) / 2) * base * 0.18
    const noise = rand(-base * 0.12, base * 0.12)
    history.push(Math.max(3, Math.round(base + seasonal + noise)))
  }
  const lastAvg = history.slice(-4).reduce((s, n) => s + n, 0) / 4
  const trendFactor = 1 + rand(-15, 35) / 100
  const forecast = []
  const lowerBound = []
  const upperBound = []
  for (let i = 0; i < 4; i++) {
    const growth = 1 + i * 0.03 * (trendFactor > 1 ? 1 : -1)
    const point = Math.max(3, Math.round(lastAvg * trendFactor * growth))
    const band = Math.max(2, Math.round(point * (0.08 + rand(0, 10) / 100)))
    forecast.push(point)
    lowerBound.push(Math.max(0, point - band))
    upperBound.push(point + band)
  }
  return { history, forecast, lowerBound, upperBound }
}

function generateDemandForecasts(count = 24) {
  const out = []
  for (let i = 0; i < count; i++) {
    const product = pick(PRODUCT_POOL)
    const storeName = pick(STORES)
    const base = rand(25, 120)
    const { history, forecast, lowerBound, upperBound } = generateForecastSeries(base)
    const avgRecent4w = Math.round(history.slice(-4).reduce((s, n) => s + n, 0) / 4)
    const nextForecast = forecast[0]
    const rangeMin = lowerBound[0]
    const rangeMax = upperBound[0]
    const deltaPct = Math.round(((nextForecast - avgRecent4w) / avgRecent4w) * 100)
    out.push({
      id: `FC-${i}-${product.code}`,
      storeName,
      productCode: product.code,
      productName: product.name,
      categoryName: product.category,
      history,
      forecast,
      lowerBound,
      upperBound,
      avgRecent4w,
      nextForecast,
      rangeMin,
      rangeMax,
      deltaPct,
      basisTags: pickUniqueTags(BASIS_TAG_POOL, 3),
    })
  }
  return out
}

function generateRelocations(count = 10) {
  const urgencies = ['critical', 'critical', 'warn', 'warn', 'warn', 'warn', 'ok', 'ok', 'ok', 'ok']
  const items = []
  for (let i = 0; i < count; i++) {
    const product = pick(PRODUCT_POOL)
    const fromType = Math.random() < 0.7 ? 'warehouse' : 'store'
    const fromName = fromType === 'warehouse' ? pick(WAREHOUSES) : pick(STORES)
    let toName = pick(STORES)
    while (toName === fromName) toName = pick(STORES)
    items.push({
      id: `RL-${i}-${product.code}`,
      from: { type: fromType, name: fromName },
      to: { type: 'store', name: toName },
      productCode: product.code,
      productName: product.name,
      categoryName: product.category,
      qty: rand(8, 64),
      urgency: urgencies[i] ?? 'ok',
      reason: pick(RELOCATE_REASONS),
    })
  }
  return items
}

function generatePurchaseOrders(count = 8) {
  const urgencies = ['critical', 'warn', 'warn', 'warn', 'ok', 'ok', 'ok', 'ok']
  const items = []
  for (let i = 0; i < count; i++) {
    const product = pick(PRODUCT_POOL)
    items.push({
      id: `PO-${i}-${product.code}`,
      warehouseName: pick(WAREHOUSES),
      productCode: product.code,
      productName: product.name,
      categoryName: product.category,
      qty: rand(80, 400),
      etaDays: rand(4, 14),
      urgency: urgencies[i] ?? 'ok',
      reason: pick(PURCHASE_REASONS),
    })
  }
  return items
}

function buildSnapshot({ id, generatedAt, generationType }) {
  const executiveSummary = generateExecutiveSummary()
  const demandForecasts = generateDemandForecasts(24)
  const relocations = generateRelocations(10)
  const purchaseOrders = generatePurchaseOrders(8)

  const stockoutRiskCount = new Set(
    demandForecasts
      .filter((f) => f.deltaPct >= 15 && f.rangeMax - f.avgRecent4w > f.avgRecent4w * 0.2)
      .map((f) => f.storeName),
  ).size
  const deadStockCount = rand(4, 9)
  const demandSurgeCount = new Set(
    demandForecasts.filter((f) => f.deltaPct >= 20).map((f) => f.categoryName),
  ).size
  const actionCount = relocations.length + purchaseOrders.length

  return {
    id,
    generatedAt,
    generationType,
    summary: {
      stockoutRiskCount: Math.max(2, stockoutRiskCount),
      deadStockCount,
      demandSurgeCount: Math.max(1, demandSurgeCount),
      actionCount,
    },
    executiveSummary,
    demandForecasts,
    relocations,
    purchaseOrders,
  }
}

function seedHistory() {
  const now = new Date(2026, 3, 22, 9, 0)
  const list = []
  let cursor = new Date(now)
  for (let i = 0; i < 12; i++) {
    const type = i % 5 === 4 ? 'manual' : i % 4 === 3 ? 'monthly' : 'weekly'
    list.push(
      buildSnapshot({
        id: `HQRPT-${formatIso(cursor).replace(/[-:T]/g, '')}-${i}`,
        generatedAt: formatIso(cursor),
        generationType: type,
      }),
    )
    cursor = new Date(cursor.getTime() - 7 * 24 * 60 * 60 * 1000 + rand(-86400000, 86400000))
  }
  return list
}

export const useHqAiReportStore = defineStore('hqAiReport', () => {
  const reportHistory = ref(seedHistory())
  const currentReportId = ref(reportHistory.value[0].id)
  const rangeTab = ref('weekly')
  const isGenerating = ref(false)

  const filterStore = ref('all')
  const filterCategory = ref('all')
  const selectedForecastId = ref(null)
  const actionTab = ref('relocation')

  const currentReport = computed(
    () => reportHistory.value.find((r) => r.id === currentReportId.value) ?? reportHistory.value[0],
  )

  const reportMeta = computed(() => {
    const cur = currentReport.value
    const generated = new Date(cur.generatedAt)
    const nextDays = cur.generationType === 'monthly' ? 30 : 7
    const next = new Date(generated.getTime() + nextDays * 24 * 60 * 60 * 1000)
    return {
      generatedAt: cur.generatedAt,
      generationType: cur.generationType,
      nextScheduledAt: formatIso(next),
    }
  })

  const rangeMultiplier = computed(() => (rangeTab.value === 'monthly' ? 4.3 : 1))

  const filteredForecasts = computed(() => {
    const list = currentReport.value.demandForecasts
    return list.filter((f) => {
      const matchStore = filterStore.value === 'all' || f.storeName === filterStore.value
      const matchCat = filterCategory.value === 'all' || f.categoryName === filterCategory.value
      return matchStore && matchCat
    })
  })

  const selectedForecast = computed(() => {
    const list = filteredForecasts.value
    if (list.length === 0) return null
    const found = list.find((f) => f.id === selectedForecastId.value)
    return found ?? list[0]
  })

  const urgencyOrder = { critical: 0, warn: 1, ok: 2 }

  const sortedRelocations = computed(() =>
    [...currentReport.value.relocations].sort(
      (a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency],
    ),
  )

  const sortedPurchaseOrders = computed(() =>
    [...currentReport.value.purchaseOrders].sort(
      (a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency],
    ),
  )

  function loadSnapshot(id) {
    if (reportHistory.value.some((r) => r.id === id)) {
      currentReportId.value = id
      selectedForecastId.value = null
      filterStore.value = 'all'
      filterCategory.value = 'all'
    }
  }

  function setRange(tab) {
    if (tab === 'weekly' || tab === 'monthly') {
      rangeTab.value = tab
    }
  }

  function setActionTab(tab) {
    if (tab === 'relocation' || tab === 'purchase') {
      actionTab.value = tab
    }
  }

  function setFilter({ store, category }) {
    if (store !== undefined) filterStore.value = store
    if (category !== undefined) filterCategory.value = category
    selectedForecastId.value = null
  }

  function selectForecast(id) {
    selectedForecastId.value = id
  }

  function regenerate() {
    if (isGenerating.value) return
    isGenerating.value = true
    setTimeout(() => {
      const now = new Date()
      const snapshot = buildSnapshot({
        id: `HQRPT-${formatIso(now).replace(/[-:T]/g, '')}-M`,
        generatedAt: formatIso(now),
        generationType: 'manual',
      })
      reportHistory.value = [snapshot, ...reportHistory.value].slice(0, 20)
      currentReportId.value = snapshot.id
      selectedForecastId.value = null
      filterStore.value = 'all'
      filterCategory.value = 'all'
      isGenerating.value = false
    }, 1200)
  }

  return {
    STORES,
    WAREHOUSES,
    CATEGORIES,
    reportHistory,
    currentReportId,
    currentReport,
    reportMeta,
    rangeTab,
    rangeMultiplier,
    isGenerating,
    filterStore,
    filterCategory,
    filteredForecasts,
    selectedForecast,
    selectedForecastId,
    actionTab,
    sortedRelocations,
    sortedPurchaseOrders,
    loadSnapshot,
    setRange,
    setActionTab,
    setFilter,
    selectForecast,
    regenerate,
  }
})
