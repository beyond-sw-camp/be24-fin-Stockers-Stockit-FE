<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Building2, ChevronDown, CircleDollarSign, Heart, Info, Scale, Settings2, Shirt, Tag, Truck } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useCircularStockSaleStore } from '@/stores/hq/circularStock/circularStockSale.js'
import { getCircularSales } from '@/api/hq/circularSale.js'
import { circularBuyerApi } from '@/api/hq/circularBuyer.js'
import {
  circularSaleOutboundStatusBadgeClass,
  circularSaleOutboundStatusLabel,
} from '@/stores/hq/circularStock/circularStockCommon.js'

const route = useRoute()
const router = useRouter()
const circularStockStore = useCircularStockSaleStore()

const hqMenus = roleMenus.hq
const circularStockMenus = roleMenus.hq.find((menu) => menu.label === '순환 재고 관리')?.children ?? []

const tabs = [
  { key: 'sales', label: '판매 상세' },
  { key: 'esg', label: 'ESG 성과' },
]

const activeTopMenu = computed(() => '순환 재고 관리')
const activeSideMenu = ref('순환 재고 판매 내역')
const activeTab = ref('sales')
const saleId = computed(() => String(route.params.saleId ?? ''))
const sale = computed(() => circularStockStore.getSaleById(saleId.value))
const saleEsgSnapshot = computed(() => circularStockStore.getSaleEsgSnapshot(sale.value))
const resolvedEsgSnapshot = computed(() => {
  const s = sale.value
  if (!s) return null
  if (s.esgTotalScore > 0) {
    return {
      total: s.esgTotalScore,
      scoreBreakdown: [
        { scoreType: 'circularSaleExecution', points: s.saleExecution     },
        { scoreType: 'donationExecution',     points: s.donationExecution },
        { scoreType: 'carbonReduction',       points: s.carbonScore       },
        { scoreType: 'newBuyerExpansion',     points: s.newBuyerScore     },
        { scoreType: 'localPartner',          points: s.localPartnerScore },
      ],
    }
  }
  return saleEsgSnapshot.value
})
const saleType = computed(() => sale.value?.saleType ?? 'SALE')
const isDonation = computed(() => saleType.value === 'DONATION')
const doneeOrBuyerName = computed(() =>
  isDonation.value ? (sale.value?.doneeName ?? '-') : (sale.value?.buyerName ?? '-'),
)
const linkedBuyer = ref(null)
const buyerSalesTotalCount = ref(null)
const openGroups = ref(new Set())

function toggleGroup(key) {
  if (openGroups.value.has(key)) openGroups.value.delete(key)
  else openGroups.value.add(key)
}

const groupedItems = computed(() => {
  const items = sale.value?.items ?? []
  const grouped = new Map()
  for (const item of items) {
    const materialLabel = formatMaterials(item.materials || [])
    const key = `${item.materialType}__${materialLabel}`
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        materialType: item.materialType || sale.value?.materialType || '-',
        materialLabel,
        items: [],
        totalRequestedWeightKg: 0,
        totalActualWeightKg: 0,
        totalActualAmount: 0,
      })
    }
    const group = grouped.get(key)
    group.items.push(item)
    group.totalRequestedWeightKg += Number(item.requestedWeightKg || 0)
    group.totalActualWeightKg += Number(item.actualWeightKg || 0)
    group.totalActualAmount += Number(item.lineAmount || 0)
  }
  return [...grouped.values()]
})

const includedMaterialBadges = computed(() => {
  const seen = new Set()
  const badges = []
  for (const item of sale.value?.items ?? []) {
    for (const material of item.materials ?? []) {
      const key = `${material.name}__${material.ratio}`
      if (seen.has(key)) continue
      seen.add(key)
      badges.push(`${material.name} ${material.ratio}%`)
    }
  }
  return badges
})
const totalRequestedAmount = computed(() =>
  (sale.value?.items ?? []).reduce(
    (sum, item) => sum + ((Number(item.requestedWeightKg) || 0) * (Number(item.unitPrice) || 0)),
    0,
  ),
)
const outboundWarehouseLabel = computed(() =>
  sale.value?.outboundWarehouseName
  || sale.value?.outboundWarehouseCode
  || sale.value?.items?.[0]?.warehouseName
  || sale.value?.items?.[0]?.warehouseCode
  || '-',
)

const includedMaterialNames = computed(() => {
  const names = sale.value?.items?.flatMap((item) => item.materials?.map((material) => material.name) ?? []) ?? []
  return [...new Set(names)]
})

const esgMaterialNames = computed(() => {
  const names = resolvedEsgSnapshot.value?.esgMeta?.materialBreakdown?.map((item) => item.materialName) ?? []
  return [...new Set(names)]
})

const carbonReductionKpi = computed(() => Number(resolvedEsgSnapshot.value?.kpiSnapshot?.savedCarbonKg) || 0)
const carbonCreditValueKpi = computed(() => Number(resolvedEsgSnapshot.value?.kpiSnapshot?.carbonCreditValue) || 0)
const tradableCarbonCreditValueKpi = computed(() => Number(resolvedEsgSnapshot.value?.kpiSnapshot?.tradableCarbonCreditValue) || 0)
const salesRevenueKpi = computed(() => Number(resolvedEsgSnapshot.value?.kpiSnapshot?.salesRevenue) || 0)
const wasteLossRecoveredValueKpi = computed(() => Number(resolvedEsgSnapshot.value?.kpiSnapshot?.wasteLossRecoveredValue) || 0)

function readNumericScore(...candidates) {
  for (const value of candidates) {
    const num = Number(value)
    if (Number.isFinite(num)) return num
  }
  return null
}

function findScoreBreakdownPoint(scoreTypes = []) {
  const found = (resolvedEsgSnapshot.value?.scoreBreakdown ?? []).find((item) =>
    scoreTypes.includes(item.scoreType),
  )
  return Number(found?.points)
}

const isScoreValidSale = computed(() => (Number(sale.value?.totalActualWeightKg) || 0) >= 10)

const linkedBuyerPartnerType = computed(() => String(linkedBuyer.value?.partnerType || '').toLowerCase())

const localPartnerScoreFallback = computed(() => {
  return ['local_small', 'social_enterprise'].includes(linkedBuyerPartnerType.value) ? 150 : 0
})

const newBuyerExpansionScoreFallback = computed(() => {
  if (buyerSalesTotalCount.value === null) return 0
  return Number(buyerSalesTotalCount.value) === 1 ? 150 : 0
})

const normalizedScoreItems = computed(() => {
  const totalActualWeightKg = Number(sale.value?.totalActualWeightKg) || 0
  const executionPoints = readNumericScore(
    resolvedEsgSnapshot.value?.circularSaleExecutionScore,
    resolvedEsgSnapshot.value?.esgMeta?.circularSaleExecutionScore,
    totalActualWeightKg >= 10 ? 100 : 0,
  ) ?? 0
  const carbonReductionPoints = readNumericScore(
    resolvedEsgSnapshot.value?.carbonReductionScore,
    resolvedEsgSnapshot.value?.esgMeta?.carbonReductionScore,
    findScoreBreakdownPoint(['carbonReduction', 'carbonContribution']),
    carbonReductionKpi.value,
  ) ?? 0
  const localPartnerPoints = readNumericScore(
    resolvedEsgSnapshot.value?.localPartnerScore,
    resolvedEsgSnapshot.value?.esgMeta?.localPartnerScore,
    localPartnerScoreFallback.value,
  ) ?? 0
  const newBuyerExpansionPoints = readNumericScore(
    resolvedEsgSnapshot.value?.newBuyerExpansionScore,
    resolvedEsgSnapshot.value?.esgMeta?.newBuyerExpansionScore,
    newBuyerExpansionScoreFallback.value,
  ) ?? 0

  const baseItems = [
    {
      scoreType: 'circularSaleExecution',
      label: '순환 재고 판매 실행 점수',
      points: executionPoints,
      formulaSummary: '판매 1건 최종 등록 완료 시 기본 100pt',
      insight: '판매 행동 자체가 순환 활동으로 인정된 점수입니다.',
      accent: 'text-emerald-700',
      bar: 'bg-[#8FD3B6]',
      activeBg: 'bg-emerald-50',
      activeBorder: 'border-emerald-100',
    },
    {
      scoreType: 'carbonReduction',
      label: '탄소 감축 기여 점수',
      points: carbonReductionPoints,
      formulaSummary: `실제 탄소 절감량 ${carbonReductionKpi.value.toFixed(2)}kgCO2 × 1`,
      insight: '실제 탄소 감축량과 직접 연결되는 핵심 환경 점수입니다.',
      accent: 'text-sky-700',
      bar: 'bg-[#9FC5F8]',
      activeBg: 'bg-sky-50',
      activeBorder: 'border-sky-100',
    },
    {
      scoreType: 'localPartner',
      label: '지역 상생 점수',
      points: localPartnerPoints,
      formulaSummary: '지역 파트너/소규모 기업/사회적 기업과의 거래 시 +150pt가 적립됩니다.',
      insight: '지역 파트너/소규모 기업/사회적 기업과의 거래 시 +150pt가 적립됩니다.',
      accent: 'text-teal-700',
      bar: 'bg-[#F3A6C9]',
      activeBg: 'bg-teal-50',
      activeBorder: 'border-teal-100',
    },
    {
      scoreType: 'newBuyerExpansion',
      label: '순환 거래 확산 점수',
      points: newBuyerExpansionPoints,
      formulaSummary: '신규 거래처와의 첫 거래 시 +150pt가 적립됩니다.',
      insight: '신규 거래처와의 첫 거래 시 +150pt가 적립됩니다.',
      accent: 'text-violet-700',
      bar: 'bg-[#B79AF7]',
      activeBg: 'bg-violet-50',
      activeBorder: 'border-violet-100',
    },
  ]
  const maxScoreBase = Math.max(...baseItems.map((item) => Number(item.points) || 0), 150, 1)
  return baseItems.map((item) => {
    const points = Number(item.points) || 0
    const isInactive = points <= 0 && ['localPartner', 'newBuyerExpansion'].includes(item.scoreType)
    return {
      ...item,
      points,
      isInactive,
      ratio: isInactive ? 0 : Math.min((points / maxScoreBase) * 100, 100),
      bg: isInactive ? 'score-secondary-card' : item.activeBg,
      border: isInactive ? 'score-secondary-border' : item.activeBorder,
      badgeText: isInactive ? '이번 거래 해당 없음' : '',
    }
  })
})

const treeGrowPoints = computed(() => {
  const explicit = readNumericScore(
    resolvedEsgSnapshot.value?.totalEsgScore,
    resolvedEsgSnapshot.value?.esgMeta?.totalEsgScore,
  )
  if (explicit !== null) return explicit
  return normalizedScoreItems.value.reduce((sum, item) => sum + (Number(item.points) || 0), 0)
})

const scoreFormulaSummary = computed(
  () => '나무 키우기 점수 = 순환 판매 실행 + 탄소 감축 기여 + 지역 상생 + 순환 거래 확산',
)

const scoreSummaryCards = computed(() => normalizedScoreItems.value)

const kpiSummaryCards = computed(() => [
  {
    key: 'revenue',
    label: '얼마나 이익이 났나',
    value: formatCurrency(wasteLossRecoveredValueKpi.value),
    accent: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    insight: '폐기 손실로 끝날 재고가 실제 판매 수익으로 전환됐습니다.',
  },
  {
    key: 'carbon',
    label: '얼마나 탄소를 줄였나',
    value: formatCarbonKg(carbonReductionKpi.value),
    accent: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    insight: '신규 생산을 줄인 만큼 환경 부담을 절감한 결과입니다.',
  },
  {
    key: 'credit',
    label: '탄소 가치로 환산하면',
    value: formatCurrency(carbonCreditValueKpi.value),
    accent: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    insight: '감축량을 탄소배출권 가치 기준으로 환산한 참고 수치입니다.',
  },
  {
    key: 'sales',
    label: '실제 거래 매출',
    value: formatCurrency(salesRevenueKpi.value),
    accent: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    insight: '판매 확정 금액 기준의 실제 매출입니다.',
  },
])

const impactNarrative = computed(() => [
  {
    key: 'materials',
    title: '무엇을 순환시켰나',
    value: esgMaterialNames.value.join(', ') || includedMaterialNames.value.join(', ') || '-',
    detail: `${formatQuantity(sale.value?.totalSkuCount || 0)}개 SKU를 순환 판매로 전환`,
  },
  {
    key: 'environment',
    title: '환경에 어떤 영향을 줬나',
    value: formatCarbonKg(carbonReductionKpi.value),
    detail: '신규 생산을 줄여 탄소 배출을 낮춘 효과',
  },
  {
    key: 'business',
    title: '사업적으로 어떤 의미가 있나',
    value: formatCurrency(wasteLossRecoveredValueKpi.value),
    detail: '폐기 손실을 회수 가능한 판매 수익으로 전환',
  },
])

const topScoreContributor = computed(() => {
  if (!scoreSummaryCards.value.length) return null
  return [...scoreSummaryCards.value].sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0))[0]
})

function setTab(tabKey) {
  activeTab.value = tabKey
}

function formatMaterials(materials = []) {
  if (!materials.length) return '-'
  return materials.map((material) => `${material.name} ${material.ratio}%`).join(', ')
}

function formatDateTime(iso) {
  if (!iso) return '-'
  const date = new Date(iso)
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatKg(value) {
  return `${Number(value || 0).toFixed(2)}kg`
}

function formatCarbonKg(value) {
  return `${Number(value || 0).toFixed(2)} kgCO2`
}

function formatCurrency(value) {
  return `₩${Number(value || 0).toLocaleString()}`
}

function formatQuantity(value) {
  return Number(value || 0).toLocaleString()
}

function formatPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`
}

function outboundStatusLabel(status) {
  return circularSaleOutboundStatusLabel(status)
}

function outboundStatusBadgeClass(status) {
  return circularSaleOutboundStatusBadgeClass(status)
}

onMounted(async () => {
  if (!saleId.value) return
  await circularStockStore.fetchCircularSaleDetail(saleId.value)
  openGroups.value = new Set(groupedItems.value.map(group => group.key))
  if (sale.value?.buyerCode) {
    try {
      const [buyerDetail, buyerSalesPage] = await Promise.all([
        circularBuyerApi.detail(sale.value.buyerCode),
        getCircularSales({
          page: 0,
          size: 1,
          sort: 'soldAt,asc',
          buyerCode: sale.value.buyerCode,
        }),
      ])
      linkedBuyer.value = buyerDetail
      buyerSalesTotalCount.value = Number(buyerSalesPage?.totalElements ?? 0)
    } catch {
      linkedBuyer.value = null
      buyerSalesTotalCount.value = null
    }
  }
})

function handleBack() {
  router.push({ name: 'hq-circular-inventory-sales-history' })
}


</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="circularStockMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Circular Inventory Sales</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">순환 재고 판매 상세</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">판매 한 건의 거래 내역을 중심으로 확인하고, ESG 성과는 별도 탭에서 자세히 볼 수 있습니다.</p>
          </div>
          <button
            type="button"
            class="h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 transition hover:bg-gray-50"
            @click="handleBack"
          >
            목록으로 돌아가기
          </button>
        </div>
      </section>

      <template v-if="sale">
        <section class="border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center border-b border-gray-200">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              class="relative px-5 py-3 text-xs font-black transition-colors"
              :class="activeTab === tab.key ? 'text-[#004D3C]' : 'text-gray-500 hover:bg-gray-50'"
              @click="setTab(tab.key)"
            >
              {{ tab.label }}
              <span
                v-if="activeTab === tab.key"
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#004D3C]"
              ></span>
            </button>
          </div>

          <div v-if="activeTab === 'sales'" class="flex flex-col gap-4 px-8 pb-8 pt-7">
            <section class="w-full">
              <div class="sales-esg-stack">
                <section class="overflow-hidden border border-[#D7E9E3] bg-[linear-gradient(135deg,#F6FBF8_0%,#FFFFFF_55%,#F2F8FF_100%)]">
                  <div class="grid gap-4 px-6 py-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                    <div>
                      <div class="flex flex-wrap items-center gap-2">
                        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-[#4D7A6F]">ESG 요약 · Impact Snapshot</p>
                      </div>
                      <h3 class="mt-2 text-xl font-black text-gray-900">한 번의 판매가 만든 성과를 한눈에</h3>
                      <p class="mt-2 text-sm font-bold leading-6 text-gray-600">
                        이번 판매는 <span class="text-[#0F5C4D]">{{ formatCurrency(wasteLossRecoveredValueKpi) }}</span>의 수익 전환과
                        <span class="text-sky-700">{{ formatCarbonKg(carbonReductionKpi) }}</span>의 탄소 감축으로 이어졌습니다.
                      </p>

                      <div class="sales-esg-story-cards grid gap-3 md:grid-cols-3">
                        <div
                          v-for="impactItem in impactNarrative"
                          :key="impactItem.key"
                          class="border border-white/80 bg-white/80 px-3 py-3 backdrop-blur"
                        >
                          <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">{{ impactItem.title }}</p>
                          <p class="mt-2 text-sm font-black text-gray-900">{{ impactItem.value }}</p>
                          <p class="mt-1 text-[11px] font-bold leading-5 text-gray-500">{{ impactItem.detail }}</p>
                        </div>
                      </div>
                    </div>

                    <div class="border border-white/80 bg-white/90 px-4 py-4">
                      <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">ESG 나무 키우기 점수</p>
                      <p class="mt-2 text-3xl font-black text-emerald-700">+{{ formatQuantity(treeGrowPoints) }} pt</p>
                      <p class="mt-2 text-xs font-bold leading-5 text-gray-500">
                        {{ topScoreContributor?.label || '주요 점수요소' }}가 가장 큰 비중을 차지했고, 전체 점수는 4개 점수 항목 합산으로 반영됩니다.
                      </p>

                      <div class="mt-4 space-y-3">
                        <template v-for="scoreItem in scoreSummaryCards" :key="scoreItem.scoreType">
                          <div v-if="!isDonation || scoreItem.scoreType === 'carbonReduction'">
                            <div class="flex items-center justify-between gap-3 text-[11px] font-black">
                              <span class="text-gray-700">{{ scoreItem.label }}</span>
                              <span :class="scoreItem.isInactive ? 'score-muted-text' : scoreItem.accent">+{{ formatQuantity(scoreItem.points) }} pt</span>
                            </div>
                            <div class="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                              <div class="h-full rounded-full" :class="scoreItem.bar" :style="{ width: `${scoreItem.ratio}%` }"></div>
                            </div>
                          </div>
                        </template>
                        <div v-if="isDonation">
                          <div class="flex items-center justify-between gap-3 text-[11px] font-black">
                            <span class="flex items-center gap-1 text-gray-700"><Heart :size="12" class="text-pink-500" />기부 실행</span>
                            <span class="text-pink-600">+{{ formatQuantity(sale?.donationExecution ?? 0) }} pt</span>
                          </div>
                          <div class="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                            <div class="h-full rounded-full bg-pink-300" :style="{ width: `${sale?.donationExecution ? 100 : 0}%` }"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </section>

            <section class="border border-gray-200 bg-white p-5 pr-7 pl-7 shadow-sm">
              <div class="sales-summary-stack">
                <div class="sales-summary-head flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-2xl font-medium text-gray-900">{{ doneeOrBuyerName }}</p>
                  <p class="sales-buyer-subline text-xs text-gray-500">
                    <template v-if="!isDonation">{{ sale.buyerIndustryGroup || linkedBuyer?.industryGroup || '-' }} · </template>SKU {{ formatQuantity(sale.totalSkuCount) }}종
                  </p>
                </div>
                <span class="inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black" :class="outboundStatusBadgeClass(sale.outboundStatus)">
                  {{ outboundStatusLabel(sale.outboundStatus) }}
                </span>
              </div>
              <div class="sales-summary-kpi grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <article class="kpi-card">
                  <p class="kpi-title"><Shirt :size="14" />판매 수량</p>
                  <p class="kpi-content-gap text-2xl font-black text-gray-900">{{ formatQuantity(sale.totalSoldQuantity) }}벌</p>
                  <p class="kpi-subtext"><Info :size="12" class="kpi-subtext-icon" />환산 {{ Number(sale.totalEstimatedQuantity || 0).toFixed(2) }}벌 <span class="kpi-emphasis">→ 올림 {{ formatQuantity(sale.totalSoldQuantity) }}벌</span></p>
                </article>
                <article class="kpi-card">
                  <p class="kpi-title"><Scale :size="14" />실제 무게</p>
                  <p class="kpi-content-gap text-2xl font-black text-gray-900">{{ formatKg(sale.totalActualWeightKg) }}</p>
                  <p class="kpi-subtext">
                    <Info :size="12" class="kpi-subtext-icon" />
                    요청 {{ formatKg(sale.totalRequestedWeightKg) }} 대비
                    <span class="kpi-emphasis">
                      {{ Number(sale.totalActualWeightKg || 0) - Number(sale.totalRequestedWeightKg || 0) >= 0 ? '+' : '' }}
                      {{ formatKg(Number(sale.totalActualWeightKg || 0) - Number(sale.totalRequestedWeightKg || 0)) }}
                    </span>
                  </p>
                </article>
                <article class="kpi-card">
                  <p class="kpi-title"><Tag :size="14" />포함 소재</p>
                  <div class="kpi-content-gap flex flex-wrap gap-1.5">
                    <span v-for="material in includedMaterialBadges" :key="material" class="material-badge">{{ material }}</span>
                    <span v-if="includedMaterialBadges.length === 0" class="text-sm text-gray-500">-</span>
                  </div>
                </article>
                <article v-if="!isDonation" class="kpi-card">
                  <p class="kpi-title"><CircleDollarSign :size="14" />최종 금액</p>
                  <p class="kpi-content-gap text-2xl font-black text-[#1C8E73]">{{ formatCurrency(sale.totalAmount) }}</p>
                  <p class="kpi-subtext"><Info :size="12" class="kpi-subtext-icon" />요청 기준 <span class="line-through">{{ formatCurrency(totalRequestedAmount) }}</span></p>
                </article>
              </div>
              <div
                v-if="!isDonation && Math.abs(Number(sale.totalActualWeightKg || 0) - Number(sale.totalRequestedWeightKg || 0)) >= 0.01"
                class="sales-summary-alert flex items-center gap-2 rounded-md border border-[#EADFC8] bg-[#FFFBEB] px-3 py-3 text-sm text-[#8b5e34]"
              >
                <Settings2 :size="16" class="shrink-0" />
                <span>
                  kg → 벌 수 환산시 올림 처리로 요청 {{ formatKg(sale.totalRequestedWeightKg) }}보다
                  {{ formatKg(Math.abs(Number(sale.totalActualWeightKg || 0) - Number(sale.totalRequestedWeightKg || 0))) }}
                  더 출고됩니다. 금액은 실제 출고 무게({{ formatKg(sale.totalActualWeightKg) }}) 기준으로 산정됩니다.
                </span>
              </div>
              </div>
            </section>

            <section class="w-full grid gap-8 px-4 pt-4 lg:grid-cols-2">
              <div>
                <h3 class="info-header"><Building2 :size="13" />{{ isDonation ? '기부처 정보' : '거래처 정보' }}</h3>
                <div class="info-line">
                  <p class="info-key">{{ isDonation ? '기부처명' : '거래처명' }}</p>
                  <p class="info-value">{{ doneeOrBuyerName }}<span v-if="!isDonation" class="buyer-code">{{ sale.buyerCode || '-' }}</span></p>
                </div>
                <div v-if="!isDonation" class="info-line">
                  <p class="info-key">산업군</p>
                  <p class="info-value">{{ sale.buyerIndustryGroup || linkedBuyer?.industryGroup || '-' }}</p>
                </div>
                <div class="info-line">
                  <p class="info-key">담당자</p>
                  <p class="info-value">{{ linkedBuyer?.managerName || '-' }}</p>
                </div>
                <div class="info-line">
                  <p class="info-key">연락처</p>
                  <p class="info-value">{{ linkedBuyer?.phone || '-' }}</p>
                </div>
                <div class="info-line">
                  <p class="info-key">생산품</p>
                  <p class="info-value">{{ Array.isArray(linkedBuyer?.factoryProduct) && linkedBuyer.factoryProduct.length > 0 ? linkedBuyer.factoryProduct.join(', ') : '-' }}</p>
                </div>
              </div>
              <div>
                <h3 class="info-header"><Truck :size="13" />출고 정보</h3>
                <div class="info-line">
                  <p class="info-key">출고 창고</p>
                  <p class="info-value">{{ outboundWarehouseLabel }}</p>
                </div>
                <div class="info-line">
                  <p class="info-key">소재 구분</p>
                  <p class="info-value">{{ sale.materialType || '-' }}</p>
                </div>
                <div class="info-line">
                  <p class="info-key">담긴 SKU</p>
                  <p class="info-value">{{ formatQuantity(sale.totalSkuCount) }}종</p>
                </div>
                <div class="info-line">
                  <p class="info-key">판매 메모</p>
                  <p class="info-value info-value-memo">{{ sale.memo || '입력된 메모 없음' }}</p>
                </div>
                <div class="info-line">
                  <p class="info-key">판매일시/등록자</p>
                  <p class="info-value">{{ formatDateTime(sale.soldAt) }} / {{ sale.soldByName || '-' }}</p>
                </div>
              </div>
            </section>

            <div class="border-t border-gray-200"></div>

            <section class="sales-material-detail-section w-full space-y-6">
              <h3 class="sales-material-title w-full text-left text-gray-500">소재별 판매 상세</h3>
              <div v-for="group in groupedItems" :key="group.key" class="sales-material-accordion w-full overflow-hidden rounded-md border border-gray-300">
                <button type="button" class="flex w-full flex-wrap items-center justify-between gap-3 border-b border-gray-300 bg-[#F6F6F4] pl-3 px-4 py-3 text-left" @click="toggleGroup(group.key)">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center rounded-full bg-[#D9EFE7] px-2.5 py-1 text-xs font-semibold text-[#1F7A63]">{{ group.materialLabel }}</span>
                    <p class="text-[13px] font-bold text-gray-500">SKU {{ formatQuantity(group.items.length) }}종 · {{ formatCurrency(group.items[0]?.unitPrice || 0) }}/kg</p>
                  </div>
                  <div class="flex flex-wrap items-center gap-5 text-right">
                    <div class="group-kpi"><p class="group-kpi-label">요청</p><p class="group-kpi-value">{{ formatKg(group.totalRequestedWeightKg) }}</p></div>
                    <div class="group-kpi"><p class="group-kpi-label">실출고</p><p class="group-kpi-value">{{ formatKg(group.totalActualWeightKg) }}</p></div>
                    <div class="group-kpi"><p class="group-kpi-label">금액</p><p class="group-kpi-value group-kpi-value-amount">{{ formatCurrency(group.totalActualAmount) }}</p></div>
                    <ChevronDown :size="18" class="text-gray-600 transition-transform" :class="openGroups.has(group.key) ? 'rotate-180' : ''" />
                  </div>
                </button>
                <div v-show="openGroups.has(group.key)" class="overflow-hidden bg-white">
                  <table class="w-full table-fixed text-xs">
                    <colgroup>
                      <col style="width: 15%" />
                      <col style="width: 18%" />
                      <col style="width: 15%" />
                      <col style="width: 10%" />
                      <col style="width: 8%" />
                      <col style="width: 10%" />
                      <col style="width: 10%" />
                      <col style="width: 15%" />
                    </colgroup>
                    <thead class="bg-[#f3f4f6] text-[11px] text-gray-500">
                      <tr>
                        <th class="cell-head !text-left">SKU 코드</th>
                        <th class="cell-head !text-left">품목명</th>
                        <th class="cell-head text-right">재고</th>
                        <th class="cell-head text-right">요청 kg</th>
                        <th class="cell-head text-right"></th>
                        <th class="cell-head text-right">판매 벌 수</th>
                        <th class="cell-head !text-right">실제 무게</th>
                        <th class="cell-head !text-right">금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in group.items" :key="`${group.key}-${item.itemId || item.skuCode || item.inventoryId}`" class="border-t border-gray-100">
                        <td class="cell-body !text-left"><p class="font-mono text-[11px] font-bold text-gray-500">{{ item.skuCode || '-' }}</p></td>
                        <td class="cell-body !text-left"><p class="font-black text-gray-900">{{ item.productName }}</p></td>
                        <td class="cell-body font-black text-gray-700">{{ formatQuantity(item.availableQuantity) }}벌 / {{ formatKg(item.availableWeightKg) }}</td>
                        <td class="cell-body font-black text-gray-800">{{ formatKg(item.requestedWeightKg) }}</td>
                        <td class="cell-body text-right text-lg font-black text-gray-700">→</td>
                        <td class="cell-body"><p class="font-black text-[#0F7C62]">{{ formatQuantity(item.soldQuantity) }}벌</p><p class="text-[11px] text-gray-500">{{ Number(item.estimatedQuantity || 0).toFixed(2) }}벌 올림</p></td>
                        <td class="cell-body !text-right font-black text-gray-900">{{ formatKg(item.actualWeightKg) }}</td>
                        <td class="cell-body !text-right font-black text-gray-900">{{ formatCurrency(item.lineAmount) }}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr class="border-t border-gray-200 bg-[#F6F6F4]">
                        <td class="cell-body !text-left text-sm font-black text-gray-800">합계</td>
                        <td class="cell-body"></td><td class="cell-body"></td><td class="cell-body"></td><td class="cell-body"></td>
                        <td class="cell-body font-black text-gray-900">{{ formatQuantity(group.items.reduce((sum, item) => sum + (Number(item.soldQuantity) || 0), 0)) }}벌</td>
                        <td class="cell-body !text-right font-black text-gray-900">{{ formatKg(group.totalActualWeightKg) }}</td>
                        <td class="cell-body !text-right font-black text-gray-900">{{ formatCurrency(group.totalActualAmount) }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </section>

            <section class="sales-total-bar w-full flex items-center justify-between border-t border-gray-200 bg-gray-50 px-8 py-5">
              <p class="text-sm font-semibold text-gray-700">총 실제 무게 {{ formatKg(sale.totalActualWeightKg) }} · 총 판매 수량 {{ formatQuantity(sale.totalSoldQuantity) }}벌 · SKU {{ formatQuantity(sale.totalSkuCount) }}종</p>
              <p class="text-lg !font-semibold text-[#1C8E73]">최종 판매 금액 {{ formatCurrency(sale.totalAmount) }}</p>
            </section>

          </div>

          <div v-else-if="activeTab === 'esg'" class="p-8">
            <section class="border border-gray-200 bg-white shadow-sm">
              <div class="border-b border-gray-100 px-4 py-3">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 class="text-sm font-black text-gray-900">ESG 성과</h2>
                    <p class="mt-1 text-xs font-bold text-gray-500">환경 임팩트, 점수 구조, 산정 근거를 읽기 쉽게 풀어 보여줍니다.</p>
                  </div>
                </div>
              </div>

              <div class="space-y-4 p-4">
                <section class="overflow-hidden border border-[#DBEAFE] bg-[linear-gradient(135deg,#F7FBFF_0%,#FFFFFF_50%,#EFFAF5_100%)]">
                  <div class="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">Environmental Story</p>
                      <h3 class="mt-2 text-xl font-black text-gray-900">이번 판매는 환경적으로 어떤 의미가 있었나</h3>
                      <div class="sales-esg-performance-story-cards grid gap-3 md:grid-cols-3">
                        <div class="border border-sky-100 bg-white/90 px-4 py-4">
                          <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">탄소 감축</p>
                          <p class="mt-2 text-2xl font-black text-sky-700">{{ formatCarbonKg(carbonReductionKpi) }}</p>
                          <p class="mt-2 text-[11px] font-bold leading-5 text-gray-600">신규 생산을 줄여 직접적으로 절감한 환경 부담입니다.</p>
                        </div>
                        <div class="border border-emerald-100 bg-white/90 px-4 py-4">
                          <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">순환 전환 소재</p>
                          <p class="mt-2 text-sm font-black text-emerald-700">{{ esgMaterialNames.join(', ') || '-' }}</p>
                          <p class="mt-2 text-[11px] font-bold leading-5 text-gray-600">판매를 통해 다시 활용 흐름으로 들어간 소재 구성입니다.</p>
                        </div>
                        <div class="border border-violet-100 bg-white/90 px-4 py-4">
                          <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">탄소 가치 환산</p>
                          <p class="mt-2 text-2xl font-black text-violet-700">{{ formatCurrency(carbonCreditValueKpi) }}</p>
                          <p class="mt-2 text-[11px] font-bold leading-5 text-gray-600">환경 기여를 경제적 기준으로 환산했을 때의 참고 가치입니다.</p>
                        </div>
                      </div>
                    </div>

                    <div class="border border-white/80 bg-white/90 px-4 py-4">
                      <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">점수 구조 한눈에 보기</p>
                      <p class="mt-2 text-3xl font-black text-emerald-700">+{{ formatQuantity(treeGrowPoints) }} pt</p>
                      <p class="mt-2 text-xs font-bold leading-5 text-gray-500">
                        가장 큰 비중은 {{ topScoreContributor?.label || '점수 요소' }}에서 발생했고, 점수는 순환 판매/탄소 감축/지역 상생/거래 확산 기준으로 반영됩니다.
                      </p>

                      <div class="mt-4 space-y-3">
                        <template v-for="scoreItem in scoreSummaryCards" :key="scoreItem.scoreType">
                          <div
                            v-if="!isDonation || scoreItem.scoreType === 'carbonReduction'"
                            class="rounded-md border px-3 py-3"
                            :class="scoreItem.isInactive ? 'score-secondary-border score-secondary-card' : 'border-gray-100 bg-gray-50'"
                          >
                            <div class="flex items-center justify-between gap-3">
                              <p class="text-[11px] font-black text-gray-800">{{ scoreItem.label }}</p>
                              <p class="text-sm font-black" :class="scoreItem.isInactive ? 'score-muted-text' : scoreItem.accent">+{{ formatQuantity(scoreItem.points) }} pt</p>
                            </div>
                            <div class="mt-2 h-2 overflow-hidden rounded-full bg-white">
                              <div class="h-full rounded-full" :class="scoreItem.bar" :style="{ width: `${scoreItem.ratio}%` }"></div>
                            </div>
                            <p class="mt-2 text-[11px] font-bold leading-5 text-gray-500">{{ scoreItem.insight }}</p>
                            <span
                              v-if="scoreItem.badgeText"
                              class="score-inactive-badge mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                            >
                              {{ scoreItem.badgeText }}
                            </span>
                          </div>
                        </template>
                        <div v-if="isDonation" class="rounded-md border border-pink-200 bg-pink-50 px-3 py-3">
                          <div class="flex items-center justify-between gap-3">
                            <p class="flex items-center gap-1 text-[11px] font-black text-gray-800">
                              <Heart :size="12" class="text-pink-500" />기부 실행
                            </p>
                            <p class="text-sm font-black text-pink-600">+{{ formatQuantity(sale?.donationExecution ?? 0) }} pt</p>
                          </div>
                          <div class="mt-2 h-2 overflow-hidden rounded-full bg-white">
                            <div class="h-full rounded-full bg-pink-300" :style="{ width: `${sale?.donationExecution ? 100 : 0}%` }"></div>
                          </div>
                          <p class="mt-2 text-[11px] font-bold leading-5 text-gray-500">기부 실행 자체가 ESG 순환 활동으로 인정된 점수입니다.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div>
                  <section class="border border-gray-200 bg-white">
                    <div class="border-b border-gray-100 px-4 py-3">
                      <h3 class="text-sm font-black text-gray-900">KPI 지표 상세</h3>
                      <p class="mt-1 text-[11px] font-bold text-gray-500">숫자 자체보다 실제 의미를 읽게 만드는 성과 카드입니다.</p>
                    </div>
                    <div class="grid gap-3 p-4 md:grid-cols-2">
                      <div
                        v-for="kpiItem in kpiSummaryCards"
                        :key="kpiItem.key"
                        class="border px-4 py-4"
                        :class="[kpiItem.border, kpiItem.bg]"
                      >
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">{{ kpiItem.label }}</p>
                        <p class="mt-2 text-xl font-black" :class="kpiItem.accent">{{ kpiItem.value }}</p>
                        <p class="mt-2 text-[11px] font-bold leading-5 text-gray-600">{{ kpiItem.insight }}</p>
                      </div>
                    </div>
                  </section>
                </div>

                <div class="grid gap-4">
                  <section class="border border-gray-200 bg-gray-50 px-4 py-4">
                    <h3 class="text-sm font-black text-gray-900">점수 / KPI 산정 근거</h3>
                    <div class="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">처리 방식</p>
                        <p class="mt-1 text-sm font-black text-gray-900">{{ resolvedEsgSnapshot?.esgMeta?.treatmentType || '-' }}</p>
                      </div>
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">판매 시점 KOC 단가</p>
                        <p class="mt-1 text-sm font-black text-gray-900">{{ formatCurrency(resolvedEsgSnapshot?.esgMeta?.kauPriceAtSale) }} / tCO2</p>
                      </div>
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">적용 소재</p>
                        <p class="mt-1 text-sm font-black text-gray-900">{{ esgMaterialNames.join(', ') || '-' }}</p>
                      </div>
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">산정 기준</p>
                        <p class="mt-1 text-sm font-black text-gray-900">환경 중심 점수와 사업 KPI를 분리해 반영</p>
                      </div>
                    </div>
                    <div class="mt-4 border-t border-gray-200 pt-3">
                      <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">점수 체계 요약</p>
                      <p class="mt-1 text-xs font-bold leading-5 text-gray-700">{{ scoreFormulaSummary }}</p>
                    </div>
                  </section>
                </div>

                <div class="grid gap-4">
                  <section class="border border-gray-200 bg-white">
                    <div class="border-b border-gray-100 px-4 py-3">
                      <h3 class="text-sm font-black text-gray-900">소재별 탄소 감축 반영 상세</h3>
                    </div>
                    <div class="overflow-hidden">
                      <table class="w-full table-fixed border-collapse text-xs">
                        <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                          <tr>
                            <th class="px-3 py-3 text-left font-black">소재명</th>
                            <th class="px-3 py-3 text-right font-black">반영 무게</th>
                            <th class="px-3 py-3 text-right font-black">탄소 감축 계수</th>
                            <th class="px-3 py-3 text-right font-black">점수 비중</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                          <tr v-for="material in resolvedEsgSnapshot?.esgMeta?.materialBreakdown ?? []" :key="`resource-${material.materialName}`">
                            <td class="px-3 py-3 font-black text-gray-900">{{ material.materialName }}</td>
                            <td class="px-3 py-3 text-right font-black text-gray-700">{{ formatKg(material.weightKg) }}</td>
                            <td class="px-3 py-3 text-right font-black text-gray-900">{{ Number(material.carbonReductionFactor || 0).toFixed(1) }}</td>
                            <td class="px-3 py-3 text-right font-black text-gray-700">{{ formatPercent(material.appliedWeightRatio) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              </div>
            </section>
          </div>
        </section>
      </template>

      <section v-else class="border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
        <p class="text-sm font-black text-gray-700">해당 판매건을 찾을 수 없습니다.</p>
        <p class="mt-2 text-xs font-bold text-gray-400">삭제된 데이터이거나 잘못된 판매번호로 접근했습니다.</p>
        <button
          type="button"
          class="mt-5 h-9 border border-[#004D3C] bg-[#004D3C] px-4 text-xs font-black text-white transition hover:bg-[#0F5C4D]"
          @click="handleBack"
        >
          판매 내역으로 이동
        </button>
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
.kpi-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: #f7f7f5;
  padding: 0.75rem;
}

.kpi-subtext {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  border-top: 1px dashed #d1d5db;
  padding-top: 0.5rem;
  font-size: 13px;
  line-height: 1.35;
  color: #6b7280;
}

.kpi-subtext-icon {
  flex-shrink: 0;
}

.kpi-emphasis {
  color: #8b5e34;
}

.kpi-title {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b7280;
}

.kpi-content-gap {
  margin-top: 0.5rem;
}

.material-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  background: #eaf4f0;
  padding: 0.125rem 0.5rem;
  font-size: 12px;
  font-weight: 700;
  color: #255f52;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 1rem;
  margin-bottom: 0.7rem;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.info-line {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.info-line:last-child {
  border-bottom: 0;
}

.info-key {
  font-size: 13px;
  font-weight: 400;
  color: #6b7280;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  text-align: right;
}

.info-value-memo {
  font-weight: 400;
  color: #6b7280;
}

.buyer-code {
  margin-left: 0.25rem;
  font-size: 12px;
  font-weight: 400;
  color: #9ca3af;
}

.group-kpi-label {
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
}

.group-kpi-value {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.05;
  color: #111827;
}

.group-kpi-value-amount {
  color: #0f7c62;
}

.cell-head {
  padding: 0.5rem;
  text-align: inherit;
  font-weight: 400;
}

.cell-body {
  padding: 0.5rem;
  text-align: inherit;
}

.sales-summary-stack {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.sales-summary-head,
.sales-summary-kpi,
.sales-summary-alert {
  margin: 0;
}

.sales-buyer-subline {
  margin-top: 3px !important;
}

.sales-material-detail-section {
  margin-top: 24px !important;
  margin-bottom: 8px !important;
}

.sales-material-title {
  font-size: 14px;
  font-weight: 600 !important;
  margin-bottom: 10px;
  padding-left: 0 !important;
}

.sales-material-accordion + .sales-material-accordion {
  margin-top: 23px !important;
}

.sales-info-divider {
  margin-top: 16px !important;
  margin-bottom: 16px !important;
}

.sales-total-bar {
  margin-bottom: 24px !important;
}

.sales-esg-stack > section + div,
.sales-esg-stack > div + section,
.sales-esg-stack > section + section {
  margin-top: 18px !important;
}

.sales-esg-story-cards {
  margin-top: 10px !important;
}

.sales-esg-performance-story-cards {
  margin-top: 10px !important;
}

.score-muted-text {
  color: #9ca3af !important;
}

.score-secondary-card {
  background-color: #f9fafb !important;
}

.score-secondary-border {
  border-color: #e5e7eb !important;
}

.score-inactive-badge {
  color: #6b7280;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
}

th.cell-head:first-child,
td.cell-body:first-child {
  padding-left: 1.2rem;
}

th.cell-head:last-child,
td.cell-body:last-child {
  padding-right: 1.2rem;
}
</style>
