import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const PRODUCT_POOL = [
  { code: 'PRD-001', name: '고속 충전기 (C타입) 25W' },
  { code: 'PRD-002', name: '대용량 보조배터리 20000mAh' },
  { code: 'PRD-003', name: '무소음 무선 마우스' },
  { code: 'PRD-004', name: 'A4 복사용지 80g (500매)' },
  { code: 'PRD-005', name: '더블클립 세트 (19mm)' },
  { code: 'PRD-006', name: '기계식 키보드 (갈축)' },
  { code: 'PRD-007', name: 'KF94 마스크 (50매입)' },
  { code: 'PRD-008', name: '휴대용 가글 (중) 250ml' },
  { code: 'PRD-009', name: '유리제 머그컵 350ml' },
  { code: 'PRD-010', name: '탁상용 미니 가습기' },
  { code: 'PRD-011', name: '투명 박스 테이프 (48mm)' },
  { code: 'PRD-012', name: '절전형 5구 멀티탭 (3m)' },
  { code: 'PRD-013', name: '종이컵 6.5온스 (1000개입)' },
  { code: 'PRD-014', name: '스테인리스 텀블러 500ml' },
  { code: 'PRD-015', name: '접이식 우산 (자동)' },
]

const DISPLAY_REASONS = [
  '최근 7일 판매 급증 + 연관 구매율 상위',
  '계절성 수요 전주 대비 +28% 상승',
  '입구 동선에서 시야 확보 시 충동구매 유도 예상',
  '파트너 상품과 함께 배치 시 번들 판매 기여',
  '신제품 프로모션 주간, 노출 강화 필요',
  '매출 기여도 TOP 5, 재고도 충분',
]

const RESTOCK_REASONS = [
  '최근 3일 판매 급증 + 안전재고 미달',
  '주말 수요 반영, 선제 발주 필요',
  '프로모션 진행 중 품절 리스크 높음',
  '장마철 대비 선주문 권장',
  '일평균 판매 대비 재고 일수 2일 미만',
  '공급처 리드타임 감안 시 지금 발주 적기',
]

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickReason(pool) {
  return pool[rand(0, pool.length - 1)]
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

function generateDisplayRecommendations(count = 10) {
  const pool = shuffle(PRODUCT_POOL).slice(0, count)
  return pool.map((p, idx) => ({
    id: `DR-${p.code}-${idx}`,
    productName: p.name,
    productCode: p.code,
    score: rand(75, 98),
    weeklySales: rand(40, 320),
    trendPct: rand(-12, 45),
    expectedUpliftPct: rand(8, 32),
    reason: pickReason(DISPLAY_REASONS),
  }))
}

function generateRestockRecommendations(count = 10) {
  const pool = shuffle(PRODUCT_POOL).slice(0, count)
  const urgencies = ['critical', 'critical', 'warn', 'warn', 'warn', 'ok', 'ok', 'ok', 'ok', 'ok']
  return pool.map((p, idx) => {
    const avg = rand(8, 45)
    const safety = rand(30, 80)
    const current = Math.max(0, safety + rand(-60, 30))
    return {
      id: `RR-${p.code}-${idx}`,
      productName: p.name,
      productCode: p.code,
      currentQty: current,
      safetyStock: safety,
      avgDailySales: avg,
      recommendedQty: Math.max(20, safety * 2 - current + rand(10, 40)),
      urgency: urgencies[idx] ?? 'ok',
      reason: pickReason(RESTOCK_REASONS),
    }
  })
}

function generateAssociationRules(count = 12) {
  const bases = shuffle(PRODUCT_POOL).slice(0, count)
  return bases.map((base, idx) => {
    const partners = shuffle(PRODUCT_POOL.filter((p) => p.code !== base.code))
      .slice(0, 3)
      .map((p) => ({ name: p.name, coBuyRate: rand(28, 72) }))
    return {
      id: `AR-${base.code}-${idx}`,
      baseProduct: base.name,
      partners,
      suggestedBundle: `${base.name} + ${partners[0].name}`,
    }
  })
}

function generateSummary() {
  const top = PRODUCT_POOL[rand(0, PRODUCT_POOL.length - 1)]
  return {
    weeklyTopProduct: top.name,
    displayChangeCount: rand(6, 12),
    restockCount: rand(3, 8),
    associationScore: rand(72, 94),
  }
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

function buildSnapshot({ id, generatedAt, generationType }) {
  return {
    id,
    generatedAt,
    generationType,
    summary: generateSummary(),
    displayRecommendations: generateDisplayRecommendations(10),
    restockRecommendations: generateRestockRecommendations(10),
    associationRules: generateAssociationRules(12),
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
        id: `RPT-${formatIso(cursor).replace(/[-:T]/g, '')}`,
        generatedAt: formatIso(cursor),
        generationType: type,
      }),
    )
    cursor = new Date(cursor.getTime() - 7 * 24 * 60 * 60 * 1000 + rand(-86400000, 86400000))
  }
  return list
}

export const useStoreAiReportStore = defineStore('storeAiReport', () => {
  const reportHistory = ref(seedHistory())
  const currentReportId = ref(reportHistory.value[0].id)
  const rangeTab = ref('weekly')
  const isGenerating = ref(false)

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

  const sortedRestock = computed(() => {
    const order = { critical: 0, warn: 1, ok: 2 }
    return [...currentReport.value.restockRecommendations].sort(
      (a, b) => order[a.urgency] - order[b.urgency],
    )
  })

  function salesTrend(productId) {
    const seedChar = productId ? productId.charCodeAt(productId.length - 1) : 7
    return Array.from({ length: 7 }, (_, i) => {
      return Math.max(5, Math.round(20 + Math.sin(i + seedChar) * 8 + rand(-6, 12)))
    })
  }

  function loadSnapshot(id) {
    if (reportHistory.value.some((r) => r.id === id)) {
      currentReportId.value = id
    }
  }

  function setRange(tab) {
    if (tab === 'weekly' || tab === 'monthly') {
      rangeTab.value = tab
    }
  }

  function regenerate() {
    if (isGenerating.value) return
    isGenerating.value = true
    setTimeout(() => {
      const now = new Date()
      const snapshot = buildSnapshot({
        id: `RPT-${formatIso(now).replace(/[-:T]/g, '')}-M`,
        generatedAt: formatIso(now),
        generationType: 'manual',
      })
      reportHistory.value = [snapshot, ...reportHistory.value].slice(0, 20)
      currentReportId.value = snapshot.id
      isGenerating.value = false
    }, 1200)
  }

  return {
    reportHistory,
    currentReportId,
    currentReport,
    reportMeta,
    rangeTab,
    isGenerating,
    sortedRestock,
    salesTrend,
    loadSnapshot,
    setRange,
    regenerate,
  }
})
