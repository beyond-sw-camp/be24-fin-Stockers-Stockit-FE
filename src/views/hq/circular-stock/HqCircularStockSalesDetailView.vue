<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCircularStockStore } from '@/stores/circularStock.js'
import { useCircularStockBuyerStore } from '@/stores/circularStockBuyers.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const circularStockStore = useCircularStockStore()
const buyerStore = useCircularStockBuyerStore()

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
const linkedBuyer = computed(() => buyerStore.getBuyerById(sale.value?.buyerId) ?? null)

const includedMaterialNames = computed(() => {
  const names = sale.value?.items?.flatMap((item) => item.materials?.map((material) => material.name) ?? []) ?? []
  return [...new Set(names)]
})

const esgMaterialNames = computed(() => {
  const names = saleEsgSnapshot.value?.esgMeta?.materialBreakdown?.map((item) => item.materialName) ?? []
  return [...new Set(names)]
})

const treeGrowPoints = computed(() =>
  saleEsgSnapshot.value?.scoreBreakdown?.reduce((sum, item) => sum + (Number(item.points) || 0), 0) ?? 0,
)

const carbonReductionKpi = computed(() => Number(saleEsgSnapshot.value?.kpiSnapshot?.savedCarbonKg) || 0)
const carbonCreditValueKpi = computed(() => Number(saleEsgSnapshot.value?.kpiSnapshot?.carbonCreditValue) || 0)
const tradableCarbonCreditValueKpi = computed(() => Number(saleEsgSnapshot.value?.kpiSnapshot?.tradableCarbonCreditValue) || 0)
const salesRevenueKpi = computed(() => Number(saleEsgSnapshot.value?.kpiSnapshot?.salesRevenue) || 0)
const wasteLossRecoveredValueKpi = computed(() => Number(saleEsgSnapshot.value?.kpiSnapshot?.wasteLossRecoveredValue) || 0)

const maxScorePoints = computed(() =>
  Math.max(...(saleEsgSnapshot.value?.scoreBreakdown?.map((item) => Number(item.points) || 0) ?? [0]), 1),
)

const scoreSummaryCards = computed(() => {
  const scoreItems = saleEsgSnapshot.value?.scoreBreakdown ?? []
  const scoreMeta = {
    execution: {
      accent: 'text-emerald-700',
      bar: 'bg-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      insight: '판매 행동 자체가 순환 활동으로 인정된 점수입니다.',
    },
    resourceCirculation: {
      accent: 'text-teal-700',
      bar: 'bg-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-100',
      insight: '폐기 예정 재고를 다시 순환 자산으로 전환한 기여분입니다.',
    },
    carbonContribution: {
      accent: 'text-sky-700',
      bar: 'bg-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-100',
      insight: '실제 탄소 감축량과 직접 연결되는 핵심 환경 점수입니다.',
    },
    traceability: {
      accent: 'text-violet-700',
      bar: 'bg-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
      insight: '근거 데이터와 추적 정보가 얼마나 잘 남았는지 보여줍니다.',
    },
  }

  return scoreItems.map((item) => {
    const points = Number(item.points) || 0
    const ratio = Math.min((points / maxScorePoints.value) * 100, 100)
    const meta = scoreMeta[item.scoreType] ?? {
      accent: 'text-gray-700',
      bar: 'bg-gray-500',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      insight: '이번 판매 활동에 반영된 점수입니다.',
    }

    return {
      ...item,
      ...meta,
      ratio,
    }
  })
})

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
    detail: `${formatQuantity(sale.value?.totalItems || 0)}개 SKU를 순환 판매로 전환`,
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

function materialFitLabel(value) {
  return buyerStore.materialFitLabel(value)
}

function materialTypeLabel(item) {
  if (item?.materialType) return item.materialType
  return materialFitLabel(sale.value?.buyerPrimaryMaterialFit) || '-'
}

function industryGroupLabel() {
  return sale.value?.buyerIndustryGroup || linkedBuyer.value?.industryGroup || '-'
}

function productTypesLabel() {
  const fromSale = sale.value?.buyerProductTypes
  if (Array.isArray(fromSale) && fromSale.length > 0) return fromSale.join(', ')
  if (Array.isArray(linkedBuyer.value?.productTypes) && linkedBuyer.value.productTypes.length > 0) {
    return linkedBuyer.value.productTypes.join(', ')
  }
  return linkedBuyer.value?.productNote || '-'
}

function buyerDescriptionLabel() {
  return sale.value?.buyerDescription || linkedBuyer.value?.description || '설명 없음'
}

function hasWeightAdjustment(item) {
  return Math.abs(Number(item.actualWeightKg || 0) - Number(item.requestedWeightKg || 0)) >= 0.01
}

function handleBack() {
  router.push({ name: 'hq-circular-inventory-sales-history' })
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="circularStockMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
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

          <div v-if="activeTab === 'sales'" class="flex flex-col gap-4 p-4">
            <section class="border border-gray-200 bg-white shadow-sm">
              <div class="grid items-stretch gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.65fr)]">
                <div class="relative flex min-h-full flex-col pb-16">
                  <div class="flex flex-wrap items-start justify-between gap-3 pb-3">
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">거래 요약</p>
                      <p class="mt-1 text-base font-black text-gray-900">{{ sale.buyerName }}</p>
                      <p class="mt-1 text-xs font-bold text-gray-500">
                        소재 분류 {{ materialTypeLabel(sale.items?.[0]) }} · 판매 SKU {{ formatQuantity(sale.totalItems) }}건 · 판매번호 {{ sale.saleId }}
                      </p>
                    </div>
                    <div class="rounded-full bg-[#EAF4F0] px-3 py-1 text-[10px] font-black text-[#255F52]">
                      {{ materialFitLabel(sale.buyerPrimaryMaterialFit) || '-' }}
                    </div>
                  </div>

                  <div class="mt-2 grid gap-3 pb-4 md:grid-cols-2 xl:grid-cols-4">
                    <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                      <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">요청 / 확정 반영 KG</p>
                      <p class="mt-1 text-sm font-black text-gray-900">{{ formatKg(sale.totalRequestedWeightKg) }}</p>
                      <p class="mt-1 text-sm font-black text-[#0F5C4D]">{{ formatKg(sale.totalActualWeightKg) }}</p>
                    </div>
                    <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                      <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">환산 / 실차감 수량</p>
                      <p class="mt-1 text-sm font-black text-gray-900">{{ Number(sale.totalEstimatedQuantity || 0).toFixed(2) }}벌</p>
                      <p class="mt-1 text-sm font-black text-amber-700">{{ formatQuantity(sale.totalDeductedQuantity) }}벌</p>
                    </div>
                    <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                      <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">예상 / 확정 거래 금액</p>
                      <p class="mt-1 text-sm font-black text-gray-900">{{ formatCurrency(sale.totalRequestedAmount) }}</p>
                      <p class="mt-1 text-sm font-black text-[#0F5C4D]">{{ formatCurrency(sale.totalActualAmount) }}</p>
                    </div>
                    <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                      <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">포함 소재</p>
                      <p class="mt-1 text-sm font-black leading-5 text-gray-900">{{ includedMaterialNames.join(', ') || '-' }}</p>
                    </div>
                  </div>

                  <div
                    v-if="Math.abs(sale.totalActualWeightKg - sale.totalRequestedWeightKg) >= 0.01"
                    class="rounded-md border border-[#D7E9E3] bg-[#F3FAF8] px-3 py-3"
                  >
                    <p class="text-xs font-black text-[#0F5C4D]">
                      요청 {{ formatKg(sale.totalRequestedWeightKg) }} 대비 실재고 차감 기준 {{ formatKg(sale.totalActualWeightKg) }} 반영
                    </p>
                  </div>

                  <div class="absolute bottom-0 right-0 text-right">
                    <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">총 판매 금액</p>
                    <p class="mt-1 text-base font-black text-[#0F5C4D]">{{ formatCurrency(sale.totalActualAmount) }}</p>
                  </div>
                </div>

                <aside class="border border-gray-200 bg-gray-50 px-4 py-4">
                  <div class="flex items-start justify-between gap-3 pb-3">
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">거래처 정보</p>
                      <div class="mt-1 flex flex-wrap items-center gap-2">
                        <p class="text-sm font-black text-gray-900">{{ sale.buyerName }}</p>
                        <p class="font-mono text-[11px] font-black text-gray-500">{{ sale.buyerCode || '-' }}</p>
                      </div>
                    </div>
                    <span class="text-[11px] font-black text-gray-500">{{ industryGroupLabel() }}</span>
                  </div>

                  <div class="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">담당자</p>
                      <p class="mt-1 text-xs font-black text-gray-800">{{ sale.buyerManagerName || linkedBuyer?.managerName || '-' }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">연락처</p>
                      <p class="mt-1 text-xs font-black text-gray-800">{{ sale.buyerPhone || linkedBuyer?.phone || '-' }}</p>
                    </div>
                  </div>

                  <div class="mt-4 border-t border-gray-200 pt-3">
                    <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">취급제품 / 생산품</p>
                    <p class="mt-1 text-xs font-bold leading-5 text-gray-700">{{ productTypesLabel() }}</p>
                  </div>

                  <div class="mt-4 border-t border-gray-200 pt-3">
                    <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">거래처 설명</p>
                    <p class="mt-1 text-xs font-bold leading-5 text-gray-700">{{ buyerDescriptionLabel() }}</p>
                  </div>

                  <div class="mt-4 border-t border-gray-200 pt-3">
                    <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">판매 메모</p>
                    <p class="mt-1 text-xs font-bold leading-5 text-gray-700">{{ sale.memo || '입력된 메모 없음' }}</p>
                  </div>

                  <div class="mt-4 border-t border-gray-200 pt-3">
                    <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">판매일시 / 등록자</p>
                    <p class="mt-1 text-xs font-bold leading-5 text-gray-700">{{ formatDateTime(sale.soldAt) }} / {{ sale.soldBy }}</p>
                  </div>
                </aside>
              </div>
            </section>

            <section class="border border-gray-200 bg-white shadow-sm">
              <div class="border-b border-gray-100 px-3 py-3">
                <h2 class="text-sm font-black text-gray-900">판매 SKU 상세</h2>
              </div>

              <div class="overflow-x-auto">
                <table class="min-w-[1450px] w-full border-collapse text-left text-xs">
                  <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                    <tr>
                      <th class="px-3 py-3 font-black">SKU 코드</th>
                      <th class="px-3 py-3 text-left font-black">품목명</th>
                      <th class="px-3 py-3 text-left font-black">소재 분류</th>
                      <th class="px-3 py-3 font-black">소재 상세</th>
                      <th class="px-3 py-3 text-left font-black">현재 재고</th>
                      <th class="px-3 py-3 text-left font-black">요청 kg</th>
                      <th class="px-3 py-3 text-left font-black">환산 수량</th>
                      <th class="px-3 py-3 text-left font-black">실차감 수량</th>
                      <th class="px-3 py-3 text-left font-black">확정 반영 kg</th>
                      <th class="px-3 py-3 text-left font-black">kg당 단가</th>
                      <th class="px-3 py-3 text-left font-black">예상 금액</th>
                      <th class="px-3 py-3 text-left font-black">확정 거래 금액</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-for="item in sale.items" :key="`${sale.saleId}-${item.draftId || item.skuCode || item.inventoryId}`">
                      <td class="px-3 py-3 font-mono font-bold text-gray-500">{{ item.skuCode || item.itemCode || '-' }}</td>
                      <td class="px-3 py-3 font-black text-gray-900">{{ item.itemName }}</td>
                      <td class="px-3 py-3 text-left font-black text-gray-900">{{ materialTypeLabel(item) }}</td>
                      <td class="px-3 py-3 font-bold text-gray-700">{{ formatMaterials(item.materials || []) }}</td>
                      <td class="px-3 py-3 text-left font-black text-gray-600">{{ formatQuantity(item.availableQuantity) }}벌 / {{ formatKg(item.availableWeightKg) }}</td>
                      <td class="px-3 py-3 text-left font-black text-gray-900">{{ formatKg(item.requestedWeightKg) }}</td>
                      <td class="px-3 py-3 text-left font-black text-gray-700">{{ Number(item.estimatedQuantity || 0).toFixed(2) }}벌</td>
                      <td class="px-3 py-3 text-left font-black text-amber-700">{{ formatQuantity(item.deductedQuantity) }}벌</td>
                      <td class="px-3 py-3 text-left font-black" :class="hasWeightAdjustment(item) ? 'text-[#0F5C4D]' : 'text-gray-900'">
                        {{ formatKg(item.actualWeightKg) }}
                      </td>
                      <td class="px-3 py-3 text-left font-black text-gray-900">{{ formatCurrency(item.unitPrice) }}</td>
                      <td class="px-3 py-3 text-left font-black text-gray-900">{{ formatCurrency(item.requestedAmount) }}</td>
                      <td class="px-3 py-3 text-left font-black" :class="hasWeightAdjustment(item) ? 'text-[#0F5C4D]' : 'text-gray-900'">
                        {{ formatCurrency(item.actualAmount) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section class="border border-gray-200 bg-white shadow-sm">
              <div class="border-b border-gray-100 px-4 py-3">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 class="text-sm font-black text-gray-900">ESG 요약</h2>
                    <p class="mt-1 text-xs font-bold text-gray-500">점수와 KPI를 한 번에 읽을 수 있도록 성과 중심으로 요약했습니다.</p>
                  </div>
                  <p
                    v-if="saleEsgSnapshot?.isEstimated"
                    class="border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700"
                  >
                    과거 판매건 기준 추정치
                  </p>
                </div>
              </div>

              <div class="space-y-4 p-4">
                <section class="overflow-hidden border border-[#D7E9E3] bg-[linear-gradient(135deg,#F6FBF8_0%,#FFFFFF_55%,#F2F8FF_100%)]">
                  <div class="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-[#4D7A6F]">Impact Snapshot</p>
                      <h3 class="mt-2 text-xl font-black text-gray-900">한 번의 판매가 만든 성과를 한눈에</h3>
                      <p class="mt-2 text-sm font-bold leading-6 text-gray-600">
                        이번 판매는 <span class="text-[#0F5C4D]">{{ formatCurrency(wasteLossRecoveredValueKpi) }}</span>의 수익 전환과
                        <span class="text-sky-700">{{ formatCarbonKg(carbonReductionKpi) }}</span>의 탄소 감축으로 이어졌습니다.
                      </p>

                      <div class="mt-4 grid gap-3 md:grid-cols-3">
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
                        {{ topScoreContributor?.label || '주요 점수요소' }}가 가장 큰 비중을 차지했고, 전체 점수는 환경 성과와 추적 근거를 합산해 반영됩니다.
                      </p>

                      <div class="mt-4 space-y-3">
                        <div v-for="scoreItem in scoreSummaryCards" :key="scoreItem.scoreType">
                          <div class="flex items-center justify-between gap-3 text-[11px] font-black">
                            <span class="text-gray-700">{{ scoreItem.label }}</span>
                            <span :class="scoreItem.accent">+{{ formatQuantity(scoreItem.points) }} pt</span>
                          </div>
                          <div class="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                            <div class="h-full rounded-full" :class="scoreItem.bar" :style="{ width: `${scoreItem.ratio}%` }"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <section class="border border-gray-200 bg-white">
                    <div class="border-b border-gray-100 px-4 py-3">
                      <h3 class="text-sm font-black text-gray-900">점수 요소</h3>
                      <p class="mt-1 text-[11px] font-bold text-gray-500">어떤 활동이 점수로 이어졌는지 한눈에 볼 수 있게 정리했습니다.</p>
                    </div>
                    <div class="grid gap-3 p-4">
                      <div
                        v-for="scoreItem in scoreSummaryCards"
                        :key="scoreItem.scoreType"
                        class="border px-4 py-4"
                        :class="[scoreItem.border, scoreItem.bg]"
                      >
                        <div class="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">{{ scoreItem.label }}</p>
                            <p class="mt-2 text-[11px] font-bold leading-5 text-gray-600">{{ scoreItem.insight }}</p>
                          </div>
                          <p class="text-lg font-black" :class="scoreItem.accent">+{{ formatQuantity(scoreItem.points) }} pt</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section class="border border-gray-200 bg-white">
                    <div class="border-b border-gray-100 px-4 py-3">
                      <h3 class="text-sm font-black text-gray-900">KPI 지표</h3>
                      <p class="mt-1 text-[11px] font-bold text-gray-500">숫자가 실제로 무엇을 의미하는지 읽기 쉽게 풀어 보여줍니다.</p>
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
              </div>
            </section>
          </div>

          <div v-else-if="activeTab === 'esg'" class="p-4">
            <section class="border border-gray-200 bg-white shadow-sm">
              <div class="border-b border-gray-100 px-4 py-3">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 class="text-sm font-black text-gray-900">ESG 성과</h2>
                    <p class="mt-1 text-xs font-bold text-gray-500">환경 임팩트, 점수 구조, 산정 근거를 읽기 쉽게 풀어 보여줍니다.</p>
                  </div>
                  <p
                    v-if="saleEsgSnapshot?.isEstimated"
                    class="border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700"
                  >
                    과거 판매건 기준 추정치
                  </p>
                </div>
              </div>

              <div class="space-y-4 p-4">
                <section class="overflow-hidden border border-[#DBEAFE] bg-[linear-gradient(135deg,#F7FBFF_0%,#FFFFFF_50%,#EFFAF5_100%)]">
                  <div class="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">Environmental Story</p>
                      <h3 class="mt-2 text-xl font-black text-gray-900">이번 판매는 환경적으로 어떤 의미가 있었나</h3>
                      <div class="mt-4 grid gap-3 md:grid-cols-3">
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
                        가장 큰 비중은 {{ topScoreContributor?.label || '점수 요소' }}에서 발생했고, 각 점수는 아래 활동과 연결됩니다.
                      </p>

                      <div class="mt-4 space-y-3">
                        <div v-for="scoreItem in scoreSummaryCards" :key="scoreItem.scoreType" class="rounded-md border border-gray-100 bg-gray-50 px-3 py-3">
                          <div class="flex items-center justify-between gap-3">
                            <p class="text-[11px] font-black text-gray-800">{{ scoreItem.label }}</p>
                            <p class="text-sm font-black" :class="scoreItem.accent">+{{ formatQuantity(scoreItem.points) }} pt</p>
                          </div>
                          <div class="mt-2 h-2 overflow-hidden rounded-full bg-white">
                            <div class="h-full rounded-full" :class="scoreItem.bar" :style="{ width: `${scoreItem.ratio}%` }"></div>
                          </div>
                          <p class="mt-2 text-[11px] font-bold leading-5 text-gray-500">{{ scoreItem.insight }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <section class="border border-gray-200 bg-white">
                    <div class="border-b border-gray-100 px-4 py-3">
                      <h3 class="text-sm font-black text-gray-900">점수 요소 상세</h3>
                      <p class="mt-1 text-[11px] font-bold text-gray-500">각 점수가 어떤 활동과 연결되는지 설명과 함께 확인합니다.</p>
                    </div>
                    <div class="grid gap-3 p-4">
                      <div
                        v-for="scoreItem in scoreSummaryCards"
                        :key="scoreItem.scoreType"
                        class="border px-4 py-4"
                        :class="[scoreItem.border, scoreItem.bg]"
                      >
                        <div class="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">{{ scoreItem.label }}</p>
                            <p class="mt-2 text-[11px] font-bold leading-5 text-gray-600">{{ scoreItem.insight }}</p>
                            <p class="mt-2 text-[11px] font-bold leading-5 text-gray-500">{{ scoreItem.formulaSummary }}</p>
                          </div>
                          <p class="text-lg font-black" :class="scoreItem.accent">+{{ formatQuantity(scoreItem.points) }} pt</p>
                        </div>
                      </div>
                    </div>
                  </section>

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
                      <div class="border border-indigo-100 bg-indigo-50 px-4 py-4 md:col-span-2">
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">거래 가능 탄소배출권 추정치</p>
                        <p class="mt-2 text-xl font-black text-indigo-700">{{ formatCurrency(tradableCarbonCreditValueKpi) }}</p>
                        <p class="mt-2 text-[11px] font-bold leading-5 text-gray-600">현재 기준으로 거래 가치까지 확장해 본 참고 수치입니다.</p>
                      </div>
                    </div>
                  </section>
                </div>

                <div class="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
                  <section class="border border-gray-200 bg-gray-50 px-4 py-4">
                    <h3 class="text-sm font-black text-gray-900">점수 / KPI 산정 근거</h3>
                    <div class="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">처리 방식</p>
                        <p class="mt-1 text-sm font-black text-gray-900">{{ saleEsgSnapshot?.esgMeta?.treatmentType || '-' }}</p>
                      </div>
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">판매 시점 KAU 단가</p>
                        <p class="mt-1 text-sm font-black text-gray-900">{{ formatCurrency(saleEsgSnapshot?.esgMeta?.kauPriceAtSale) }} / tCO2</p>
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
                      <p class="mt-1 text-xs font-bold leading-5 text-gray-700">{{ saleEsgSnapshot?.esgMeta?.formulaSummary || '-' }}</p>
                    </div>
                  </section>

                  <section class="border border-gray-200 bg-white">
                    <div class="border-b border-gray-100 px-4 py-3">
                      <h3 class="text-sm font-black text-gray-900">인증 / 추적 완료 점수 상세</h3>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="min-w-[680px] w-full border-collapse text-xs">
                        <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                          <tr>
                            <th class="px-3 py-3 text-left font-black">항목</th>
                            <th class="px-3 py-3 text-left font-black">결과</th>
                            <th class="px-3 py-3 text-right font-black">점수</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                          <tr
                            v-for="traceItem in saleEsgSnapshot?.esgMeta?.traceabilityBreakdown ?? []"
                            :key="traceItem.scoreType"
                          >
                            <td class="px-3 py-3 font-black text-gray-900">{{ traceItem.label }}</td>
                            <td class="px-3 py-3 font-bold text-gray-600">{{ traceItem.formulaSummary }}</td>
                            <td class="px-3 py-3 text-right font-black" :class="traceItem.points > 0 ? 'text-emerald-700' : 'text-gray-400'">
                              +{{ formatQuantity(traceItem.points) }} pt
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>

                <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <section class="border border-gray-200 bg-white">
                    <div class="border-b border-gray-100 px-4 py-3">
                      <h3 class="text-sm font-black text-gray-900">소재별 자원 순환 반영 상세</h3>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="min-w-[720px] w-full border-collapse text-xs">
                        <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                          <tr>
                            <th class="px-3 py-3 text-left font-black">소재명</th>
                            <th class="px-3 py-3 text-right font-black">반영 무게</th>
                            <th class="px-3 py-3 text-right font-black">순환 전환 계수</th>
                            <th class="px-3 py-3 text-right font-black">적용 비중</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                          <tr v-for="material in saleEsgSnapshot?.esgMeta?.materialBreakdown ?? []" :key="`resource-${material.materialName}`">
                            <td class="px-3 py-3 font-black text-gray-900">{{ material.materialName }}</td>
                            <td class="px-3 py-3 text-right font-black text-gray-700">{{ formatKg(material.weightKg) }}</td>
                            <td class="px-3 py-3 text-right font-black text-gray-900">{{ Number(material.resourceCirculationFactor || 0).toFixed(1) }}</td>
                            <td class="px-3 py-3 text-right font-black text-gray-700">{{ formatPercent(material.appliedWeightRatio) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section class="border border-gray-200 bg-white">
                    <div class="border-b border-gray-100 px-4 py-3">
                      <h3 class="text-sm font-black text-gray-900">소재별 탄소 절감 반영 상세</h3>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="min-w-[720px] w-full border-collapse text-xs">
                        <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                          <tr>
                            <th class="px-3 py-3 text-left font-black">소재명</th>
                            <th class="px-3 py-3 text-right font-black">반영 무게</th>
                            <th class="px-3 py-3 text-right font-black">탄소 절감 계수</th>
                            <th class="px-3 py-3 text-right font-black">적용 비중</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                          <tr v-for="material in saleEsgSnapshot?.esgMeta?.materialBreakdown ?? []" :key="`carbon-${material.materialName}`">
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
