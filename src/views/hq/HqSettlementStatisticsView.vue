<script setup>
import { computed, h, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const brandColor = '#004D3C'
const brandColorLight = '#E6F2F0'

const activeTopMenu = computed(() => '정산/통계')
const activeSideMenu = ref('통합 KPI 대시보드')
const selectedForecastRow = ref(null)

const topMenus = ['대시보드', '재고 관리', '발주 관리', '제품 관리', '인프라 관리', '정산/통계']
const routeMap = {
  대시보드: '/hq/dashboard',
  '재고 관리': '/hq/inventory/company-wide',
  '발주 관리': '/hq/orders',
  '제품 관리': '/hq/products',
  '인프라 관리': '/hq/infrastructure',
  '정산/통계': '/hq/analytics',
}

const sideMenus = [
  { label: '통합 KPI 대시보드', icon: 'layout', id: 'PD-019' },
  { label: '매출 분석', icon: 'sales', id: 'SO-047' },
  { label: '상품/카테고리 분석', icon: 'package', id: 'SO-046' },
  { label: '재고 회전율 분석', icon: 'refresh', id: 'SO-048' },
  { label: '발주/수요 분석', icon: 'trend', id: 'SO-051' },
  { label: '예측 정확도 분석', icon: 'target', id: 'SO-049' },
]

const kpiStats = [
  { label: '금일 누적 매출', value: '₩128.4M', sub: '전일 마감 대비 +8.2%', tone: 'up' },
  { label: '전주 대비 매출 증감률', value: '+6.4%', sub: '직영점 성장 주도', tone: 'up' },
  { label: '총 발주 금액', value: '₩42.8M', sub: '승인 대기 18건 포함', tone: 'neutral' },
  { label: '재고 회전율 평균', value: '4.8x', sub: '목표 4.5x 상회', tone: 'up' },
  { label: '품절 위험 SKU 수', value: '27', sub: '전주 대비 -5 SKU', tone: 'up' },
  { label: '예측 정확도', value: '92.4%', sub: '판매 예측 기준', tone: 'up' },
]

const salesTrend = [76, 82, 88, 84, 92, 98, 104, 101, 110, 118, 124, 128]
const salesTrendLabels = ['04/08', '04/09', '04/10', '04/11', '04/12', '04/13', '04/14', '04/15', '04/16', '04/17', '04/18', '04/19']
const categoryMix = [
  { label: '문구/사무', amount: '₩36.2M', share: 28, color: '#004D3C' },
  { label: '전자제품', amount: '₩31.8M', share: 25, color: '#0F766E' },
  { label: '주방잡화', amount: '₩21.4M', share: 17, color: '#D97706' },
  { label: '위생용품', amount: '₩18.7M', share: 15, color: '#2563EB' },
  { label: '기타 카테고리', amount: '₩20.3M', share: 15, color: '#6B7280' },
]

const regionalRank = [
  { region: '서울권역', sales: '₩48.2M', orders: '₩16.1M', status: '매출 1위' },
  { region: '경기권역', sales: '₩31.5M', orders: '₩11.4M', status: '성장률 +9.2%' },
  { region: '인천/충청', sales: '₩22.7M', orders: '₩8.8M', status: '재고 안정' },
  { region: '부산/영남', sales: '₩18.1M', orders: '₩6.5M', status: '회전율 저하' },
]

const topStores = [
  { rank: 1, name: '스톡잇 강남점', sales: '₩18.4M', growth: '+14.2%', issue: '정상' },
  { rank: 2, name: '판교 테크노잡화', sales: '₩16.7M', growth: '+9.1%', issue: '정상' },
  { rank: 3, name: '여의도 IFC몰점', sales: '₩15.9M', growth: '+4.8%', issue: '재고 임박 2건' },
  { rank: 4, name: '성수 리빙샵', sales: '₩14.3M', growth: '+3.2%', issue: '정상' },
  { rank: 5, name: '부산 센텀점', sales: '₩13.6M', growth: '-2.1%', issue: '예측 오차 높음' },
]

const alerts = [
  { type: '매출 급감', target: '부산 센텀점', detail: '주간 매출 -12.4%, 프로모션 종료 영향 추정', severity: 'high' },
  { type: '회전율 저하', target: '인천 제2센터', detail: '생활가전 카테고리 평균 재고 보유일수 19일', severity: 'medium' },
  { type: '수요 급증', target: '고속 충전기 25W', detail: '최근 7일 발주량 2.8배 증가', severity: 'medium' },
  { type: '예측 오차', target: '여의도 IFC몰점', detail: '주방잡화 판매 예측 대비 실적 +18%', severity: 'low' },
]

const topProducts = [
  { rank: 1, name: '고속 충전기 (C타입) 25W', metric: '판매 4,280 EA', note: '매출 ₩64.2M' },
  { rank: 2, name: 'A4 복사용지 80g (500매)', metric: '판매 3,940 Box', note: '매출 ₩48.7M' },
  { rank: 3, name: '무소음 무선 마우스 (블랙)', metric: '판매 1,620 EA', note: '매출 ₩45.3M' },
  { rank: 4, name: '유리제 머그컵 350ml', metric: '판매 2,180 EA', note: '매출 ₩19.4M' },
  { rank: 5, name: '손세정제 리필 500ml', metric: '판매 2,760 EA', note: '매출 ₩14.9M' },
]

const lowTurnoverStores = [
  { rank: 1, name: '부산 센텀점', metric: '회전율 2.1x', note: '재고 보유일수 31일' },
  { rank: 2, name: '인천 터미널점', metric: '회전율 2.4x', note: '생활가전 과잉' },
  { rank: 3, name: '광교 갤러리아점', metric: '회전율 2.7x', note: '문구/사무 저회전' },
  { rank: 4, name: '성수 리빙샵', metric: '회전율 2.9x', note: '주방잡화 재고 누적' },
  { rank: 5, name: '분당 서현점', metric: '회전율 3.0x', note: '행사 종료 영향' },
]

const highForecastErrorProducts = [
  { rank: 1, name: '탁상용 미니 가습기', metric: '오차율 22.4%', note: '실적 < 예측' },
  { rank: 2, name: '고속 충전기 (C타입) 25W', metric: '오차율 18.7%', note: '실적 > 예측' },
  { rank: 3, name: '니트릴 고무장갑 (M)', metric: '오차율 17.9%', note: '리드타임 영향' },
  { rank: 4, name: '무선 이어폰 노이즈캔슬링', metric: '오차율 16.1%', note: '프로모션 효과' },
  { rank: 5, name: '유리제 머그컵 350ml', metric: '오차율 15.3%', note: '계절성 편차' },
]

const forecastKpis = [
  { label: '전체 예측 정확도', value: '92.4%', sub: '전월 대비 +1.8%p', tone: 'up' },
  { label: '주문량 예측 정확도', value: '89.7%', sub: '오차 큰 SKU 11건', tone: 'neutral' },
  { label: '판매량 예측 정확도', value: '94.1%', sub: '매장별 편차 안정화', tone: 'up' },
  { label: '오차 큰 상품 수', value: '14', sub: '15% 이상 오차 기준', tone: 'down' },
]

const forecastTrend = [
  { label: '04/08', predicted: 82, actual: 79 },
  { label: '04/09', predicted: 85, actual: 88 },
  { label: '04/10', predicted: 90, actual: 86 },
  { label: '04/11', predicted: 94, actual: 92 },
  { label: '04/12', predicted: 97, actual: 101 },
  { label: '04/13', predicted: 103, actual: 99 },
  { label: '04/14', predicted: 108, actual: 112 },
  { label: '04/15', predicted: 111, actual: 107 },
  { label: '04/16', predicted: 116, actual: 121 },
  { label: '04/17', predicted: 121, actual: 125 },
  { label: '04/18', predicted: 126, actual: 130 },
  { label: '04/19', predicted: 129, actual: 134 },
]

const categoryAccuracy = [
  { label: '문구/사무', accuracy: 95.2, delta: '+1.1%p' },
  { label: '전자제품', accuracy: 91.4, delta: '-0.8%p' },
  { label: '주방잡화', accuracy: 89.8, delta: '+0.5%p' },
  { label: '위생용품', accuracy: 93.6, delta: '+1.9%p' },
  { label: '생활가전', accuracy: 84.3, delta: '-2.4%p' },
]

const storeForecastErrors = [
  { store: '여의도 IFC몰점', category: '주방잡화', errorRate: '18.0%', cause: '프로모션 수요 급증' },
  { store: '부산 센텀점', category: '생활가전', errorRate: '16.7%', cause: '주말 실매출 급락' },
  { store: '판교 테크노잡화', category: '전자제품', errorRate: '12.9%', cause: '신제품 런칭 반영 지연' },
  { store: '스톡잇 강남점', category: '문구/사무', errorRate: '11.4%', cause: '법인 대량 주문 발생' },
]

const forecastRows = [
  {
    id: 'FC-001',
    target: '고속 충전기 (C타입) 25W',
    scope: '전자제품 / 전사',
    predicted: '3,600 EA',
    actual: '4,274 EA',
    errorRate: '18.7%',
    direction: '실적 초과',
    note: '행사 채널 유입 증가',
    factors: ['프로모션 노출 확대', '강남/판교 매장 동시 소진', '안전재고 기준 보수적 설정'],
  },
  {
    id: 'FC-002',
    target: '탁상용 미니 가습기',
    scope: '생활가전 / 전사',
    predicted: '840 EA',
    actual: '652 EA',
    errorRate: '22.4%',
    direction: '예측 초과',
    note: '비수기 진입 영향',
    factors: ['계절성 하락', '온라인 전환 수요 미반영', '부산권역 판매 급감'],
  },
  {
    id: 'FC-003',
    target: '니트릴 고무장갑 (M)',
    scope: '주방잡화 / 창고',
    predicted: '1,250 Box',
    actual: '1,026 Box',
    errorRate: '17.9%',
    direction: '예측 초과',
    note: '리드타임 이슈',
    factors: ['입고 지연 2일', '대체 품목 전환', '용인센터 피킹 제한'],
  },
  {
    id: 'FC-004',
    target: '무선 이어폰 노이즈캔슬링',
    scope: '전자제품 / 매장',
    predicted: '520 EA',
    actual: '604 EA',
    errorRate: '16.1%',
    direction: '실적 초과',
    note: '프로모션 효과',
    factors: ['SNS 유입', '직영점 진열 강화', '안전재고 조기 소진'],
  },
  {
    id: 'FC-005',
    target: '유리제 머그컵 350ml',
    scope: '주방잡화 / 전사',
    predicted: '1,900 EA',
    actual: '1,610 EA',
    errorRate: '15.3%',
    direction: '예측 초과',
    note: '계절성 편차',
    factors: ['주말 방문객 감소', '행사 비중 하락', '카테고리 대체 구매'],
  },
]

selectedForecastRow.value = forecastRows[0]

const handleTopMenuClick = (menu) => {
  const target = routeMap[menu]
  if (target) {
    router.push(target)
  }
}

const handleSideMenuClick = (menu) => {
  activeSideMenu.value = menu
}

const maxTrend = Math.max(...salesTrend)
const minTrend = Math.min(...salesTrend)
const trendChartWidth = 240
const trendChartHeight = 120
const trendPaddingX = 8
const trendPaddingTop = 6
const trendPaddingBottom = 8
const trendDrawableWidth = trendChartWidth - trendPaddingX * 2
const trendDrawableHeight = trendChartHeight - trendPaddingTop - trendPaddingBottom
const trendPoints = computed(() =>
  salesTrend
    .map((value, index) => {
      const x = trendPaddingX + (index / (salesTrend.length - 1)) * trendDrawableWidth
      const y =
        trendPaddingTop +
        (trendDrawableHeight - ((value - minTrend) / (maxTrend - minTrend || 1)) * trendDrawableHeight)
      return `${x},${y}`
    })
    .join(' '),
)

const trendAreaPoints = computed(
  () =>
    `${trendPaddingX},${trendChartHeight - trendPaddingBottom} ${trendPoints.value} ${trendChartWidth - trendPaddingX},${trendChartHeight - trendPaddingBottom}`,
)

const forecastChartWidth = 240
const forecastChartHeight = 120
const forecastPaddingX = 8
const forecastPaddingTop = 6
const forecastPaddingBottom = 8
const forecastDrawableWidth = forecastChartWidth - forecastPaddingX * 2
const forecastDrawableHeight = forecastChartHeight - forecastPaddingTop - forecastPaddingBottom
const forecastValues = forecastTrend.flatMap((item) => [item.predicted, item.actual])
const forecastMax = Math.max(...forecastValues)
const forecastMin = Math.min(...forecastValues)

const forecastLinePoints = (key) =>
  forecastTrend
    .map((item, index) => {
      const value = item[key]
      const x = forecastPaddingX + (index / (forecastTrend.length - 1)) * forecastDrawableWidth
      const y =
        forecastPaddingTop +
        (forecastDrawableHeight - ((value - forecastMin) / (forecastMax - forecastMin || 1)) * forecastDrawableHeight)
      return `${x},${y}`
    })
    .join(' ')

const forecastPredictedPoints = computed(() => forecastLinePoints('predicted'))
const forecastActualPoints = computed(() => forecastLinePoints('actual'))

const IconBase = (paths) => ({
  props: {
    size: { type: Number, default: 16 },
    strokeWidth: { type: Number, default: 2 },
  },
  render() {
    return h(
      'svg',
      {
        width: this.size,
        height: this.size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': this.strokeWidth,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true',
      },
      paths.map((path) => h(path.tag, path.attrs)),
    )
  },
})

const BellIcon = IconBase([
  { tag: 'path', attrs: { d: 'M15 17H5a2 2 0 0 1-2-2c2 0 3-1 3-3V9a6 6 0 0 1 12 0v3c0 2 1 3 3 3a2 2 0 0 1-2 2h-4' } },
  { tag: 'path', attrs: { d: 'M10 17a2 2 0 0 0 4 0' } },
])
const LayoutIcon = IconBase([
  { tag: 'rect', attrs: { x: '3', y: '3', width: '7', height: '7' } },
  { tag: 'rect', attrs: { x: '14', y: '3', width: '7', height: '5' } },
  { tag: 'rect', attrs: { x: '14', y: '12', width: '7', height: '9' } },
  { tag: 'rect', attrs: { x: '3', y: '14', width: '7', height: '7' } },
])
const SalesIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 20h18' } },
  { tag: 'path', attrs: { d: 'M7 16V9' } },
  { tag: 'path', attrs: { d: 'M12 16V5' } },
  { tag: 'path', attrs: { d: 'M17 16v-3' } },
])
const PackageIcon = IconBase([
  { tag: 'path', attrs: { d: 'm7.5 4.27 9 5.15' } },
  { tag: 'path', attrs: { d: 'M21 8.5v7l-9 5-9-5v-7l9-5Z' } },
  { tag: 'path', attrs: { d: 'M12 12 3 7' } },
  { tag: 'path', attrs: { d: 'M12 12v8.5' } },
])
const RefreshIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 12a9 9 0 1 0 3-6.7' } },
  { tag: 'path', attrs: { d: 'M3 4v5h5' } },
])
const TrendIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 17 9 11l4 4 8-8' } },
  { tag: 'path', attrs: { d: 'M14 7h7v7' } },
])
const TargetIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '8' } },
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '4' } },
  { tag: 'path', attrs: { d: 'M12 2v2' } },
  { tag: 'path', attrs: { d: 'M12 20v2' } },
  { tag: 'path', attrs: { d: 'M2 12h2' } },
  { tag: 'path', attrs: { d: 'M20 12h2' } },
])
const SearchIcon = IconBase([
  { tag: 'circle', attrs: { cx: '11', cy: '11', r: '7' } },
  { tag: 'path', attrs: { d: 'm20 20-3.5-3.5' } },
])
const ChevronRightIcon = IconBase([{ tag: 'path', attrs: { d: 'm9 18 6-6-6-6' } }])
const DownloadIcon = IconBase([
  { tag: 'path', attrs: { d: 'M12 3v12' } },
  { tag: 'path', attrs: { d: 'm7 10 5 5 5-5' } },
  { tag: 'path', attrs: { d: 'M5 21h14' } },
])
const FilterIcon = IconBase([
  { tag: 'path', attrs: { d: 'M4 5h16' } },
  { tag: 'path', attrs: { d: 'M7 12h10' } },
  { tag: 'path', attrs: { d: 'M10 19h4' } },
])
const AlertCircleIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 8v5' } },
  { tag: 'path', attrs: { d: 'M12 16h.01' } },
])

const iconMap = {
  layout: LayoutIcon,
  sales: SalesIcon,
  package: PackageIcon,
  refresh: RefreshIcon,
  trend: TrendIcon,
  target: TargetIcon,
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    show-system-card
    @logout="handleLogout"
  >
    <div class="analytics-content">
        <section class="panel filter-bar">
          <div class="filter-left">
            <div class="filter-item">
              <span>기준 기간</span>
              <select>
                <option>최근 30일</option>
                <option>최근 7일</option>
                <option>이번 달</option>
                <option>이번 분기</option>
              </select>
            </div>
            <div class="filter-item">
              <span>분석 범위</span>
              <select>
                <option>전사 통합</option>
                <option>직영점</option>
                <option>가맹점</option>
                <option>창고 포함</option>
              </select>
            </div>
            <div class="separator" />
            <label class="search-box wide-search">
              <SearchIcon :size="14" class="search-icon" />
              <input type="text" placeholder="매장, 상품, 카테고리 키워드 검색..." />
            </label>
          </div>
          <div class="action-group">
            <button type="button" class="ghost-button">
              <FilterIcon :size="14" />
              세부 필터
            </button>
            <button type="button" class="ghost-button">
              <DownloadIcon :size="14" />
              리포트 추출
            </button>
          </div>
        </section>

        <template v-if="activeSideMenu === '통합 KPI 대시보드'">
          <section class="kpi-grid">
            <article
              v-for="stat in kpiStats"
              :key="stat.label"
              class="panel kpi-card"
            >
              <p class="kpi-label">{{ stat.label }}</p>
              <p class="kpi-value">{{ stat.value }}</p>
              <p class="kpi-sub" :class="stat.tone">{{ stat.sub }}</p>
            </article>
          </section>

          <section class="analytics-main analytics-main-grid">
            <div class="panel chart-panel">
              <div class="section-head">
                <div>
                  <p class="section-caption">Revenue Trend</p>
                  <h3>일자별 매출 추이</h3>
                </div>
                <span class="head-meta">최근 12일 기준</span>
              </div>
              <div class="trend-chart">
                <div class="trend-chart-shell">
                  <div class="trend-y-axis">
                    <span>₩130M</span>
                    <span>₩115M</span>
                    <span>₩100M</span>
                    <span>₩85M</span>
                    <span>₩70M</span>
                  </div>
                  <div class="trend-canvas">
                    <div class="trend-grid-lines">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <svg
                      class="trend-svg"
                      :viewBox="`0 0 ${trendChartWidth} ${trendChartHeight}`"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient id="salesArea" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stop-color="#0f766e" stop-opacity="0.24" />
                          <stop offset="100%" stop-color="#0f766e" stop-opacity="0.02" />
                        </linearGradient>
                      </defs>
                      <polygon :points="trendAreaPoints" fill="url(#salesArea)" />
                      <polyline class="trend-line" :points="trendPoints" />
                      <circle
                        v-for="(value, index) in salesTrend"
                        :key="`${value}-${index}`"
                        class="trend-point"
                        :cx="trendPaddingX + (index / (salesTrend.length - 1)) * trendDrawableWidth"
                        :cy="
                          trendPaddingTop +
                          (trendDrawableHeight - ((value - minTrend) / (maxTrend - minTrend || 1)) * trendDrawableHeight)
                        "
                        r="3"
                      />
                    </svg>
                    <div class="trend-labels">
                      <span
                        v-for="label in salesTrendLabels"
                        :key="label"
                      >
                        {{ label }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="panel mix-panel">
              <div class="section-head">
                <div>
                  <p class="section-caption">Category Mix</p>
                  <h3>카테고리별 매출 비중</h3>
                </div>
                <span class="head-meta">전사 매출 구성비</span>
              </div>
              <div class="mix-list">
                <div
                  v-for="item in categoryMix"
                  :key="item.label"
                  class="mix-row"
                >
                  <div class="mix-main">
                    <span class="mix-dot" :style="{ backgroundColor: item.color }" />
                    <div>
                      <p class="mix-label">{{ item.label }}</p>
                      <p class="mix-amount">{{ item.amount }}</p>
                    </div>
                  </div>
                  <div class="mix-side">
                    <strong>{{ item.share }}%</strong>
                    <div class="mix-bar">
                      <div class="mix-fill" :style="{ width: `${item.share}%`, backgroundColor: item.color }" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="panel table-panel">
              <div class="section-head">
                <div>
                  <p class="section-caption">Regional Summary</p>
                  <h3>지역별 매출/발주 현황</h3>
                </div>
                <span class="head-meta">권역별 운영 순위표</span>
              </div>
              <div class="table-wrap">
                <table class="analytics-table">
                  <thead>
                    <tr>
                      <th>권역</th>
                      <th class="w-amount right">매출액</th>
                      <th class="w-amount right">발주액</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="region in regionalRank" :key="region.region">
                      <td class="strong">{{ region.region }}</td>
                      <td class="right semi-strong">{{ region.sales }}</td>
                      <td class="right semi-strong">{{ region.orders }}</td>
                      <td>{{ region.status }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="panel insight-panel">
              <div class="section-head">
                <div>
                  <p class="section-caption">Anomaly Alerts</p>
                  <h3>이상치 알림 패널</h3>
                </div>
                <span class="head-meta">발주/재고/매출 이상 탐지</span>
              </div>
              <div class="alert-list">
                <div
                  v-for="alert in alerts"
                  :key="`${alert.type}-${alert.target}`"
                  class="alert-row"
                  :class="alert.severity"
                >
                  <div class="alert-main">
                    <AlertCircleIcon :size="13" />
                    <div>
                      <p class="alert-title">{{ alert.type }} · {{ alert.target }}</p>
                      <p class="alert-detail">{{ alert.detail }}</p>
                    </div>
                  </div>
                  <ChevronRightIcon :size="12" />
                </div>
              </div>
            </div>
          </section>

          <section class="analytics-bottom analytics-bottom-grid">
            <div class="panel table-panel">
              <div class="section-head">
                <div>
                  <p class="section-caption">Top Stores</p>
                  <h3>TOP5 매장</h3>
                </div>
                <span class="head-meta">성과 우수 매장 TOP 5</span>
              </div>
              <div class="table-wrap">
                <table class="analytics-table">
                  <thead>
                    <tr>
                      <th class="w-rank center">순위</th>
                      <th>매장명</th>
                      <th class="w-amount right">매출액</th>
                      <th class="w-growth center">증감률</th>
                      <th class="w-issue">운영 이슈</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="store in topStores" :key="store.rank">
                      <td class="center muted strong-small">{{ store.rank }}</td>
                      <td class="strong">{{ store.name }}</td>
                      <td class="right semi-strong">{{ store.sales }}</td>
                      <td class="center" :class="{ positive: store.growth.startsWith('+'), negative: store.growth.startsWith('-') }">
                        {{ store.growth }}
                      </td>
                      <td>{{ store.issue }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="panel table-panel">
              <div class="section-head">
                <div>
                  <p class="section-caption">Top Products</p>
                  <h3>TOP5 상품</h3>
                </div>
                <span class="head-meta">판매/매출 기여 상위</span>
              </div>
              <div class="rank-list">
                <div v-for="item in topProducts" :key="item.rank" class="rank-row">
                  <span class="rank-number">{{ item.rank }}</span>
                  <div class="rank-main">
                    <p class="rank-title">{{ item.name }}</p>
                    <p class="rank-note">{{ item.note }}</p>
                  </div>
                  <strong>{{ item.metric }}</strong>
                </div>
              </div>
            </div>

            <div class="panel table-panel">
              <div class="section-head">
                <div>
                  <p class="section-caption">Low Turnover Stores</p>
                  <h3>재고 회전율 최저 매장</h3>
                </div>
                <span class="head-meta">운영 조정 우선 후보</span>
              </div>
              <div class="rank-list">
                <div v-for="item in lowTurnoverStores" :key="item.rank" class="rank-row">
                  <span class="rank-number">{{ item.rank }}</span>
                  <div class="rank-main">
                    <p class="rank-title">{{ item.name }}</p>
                    <p class="rank-note">{{ item.note }}</p>
                  </div>
                  <strong class="negative">{{ item.metric }}</strong>
                </div>
              </div>
            </div>

            <div class="panel table-panel">
              <div class="section-head">
                <div>
                  <p class="section-caption">Forecast Risk</p>
                  <h3>예측 오차 큰 상품</h3>
                </div>
                <span class="head-meta">예측 보정 필요 품목</span>
              </div>
              <div class="rank-list">
                <div v-for="item in highForecastErrorProducts" :key="item.rank" class="rank-row">
                  <span class="rank-number">{{ item.rank }}</span>
                  <div class="rank-main">
                    <p class="rank-title">{{ item.name }}</p>
                    <p class="rank-note">{{ item.note }}</p>
                  </div>
                  <strong class="negative">{{ item.metric }}</strong>
                </div>
              </div>
            </div>
          </section>
        </template>

        <template v-else-if="activeSideMenu === '예측 정확도 분석'">
          <section class="kpi-grid forecast-kpi-grid">
            <article
              v-for="stat in forecastKpis"
              :key="stat.label"
              class="panel kpi-card"
            >
              <p class="kpi-label">{{ stat.label }}</p>
              <p class="kpi-value">{{ stat.value }}</p>
              <p class="kpi-sub" :class="stat.tone">{{ stat.sub }}</p>
            </article>
          </section>

          <section class="analytics-main analytics-main-grid">
            <div class="panel chart-panel">
              <div class="section-head">
                <div>
                  <p class="section-caption">Forecast Vs Actual</p>
                  <h3>예측 대비 실제 추이</h3>
                </div>
                <span class="head-meta">최근 12일 판매량 기준</span>
              </div>
              <div class="trend-chart">
                <div class="trend-chart-shell">
                  <div class="trend-y-axis">
                    <span>135</span>
                    <span>120</span>
                    <span>105</span>
                    <span>90</span>
                    <span>75</span>
                  </div>
                  <div class="trend-canvas">
                    <div class="trend-grid-lines">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                    <svg
                      class="trend-svg"
                      :viewBox="`0 0 ${forecastChartWidth} ${forecastChartHeight}`"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <polyline class="forecast-line predicted" :points="forecastPredictedPoints" />
                      <polyline class="forecast-line actual" :points="forecastActualPoints" />
                    </svg>
                    <div class="chart-legend">
                      <span><i class="legend-dot predicted" /> 예측값</span>
                      <span><i class="legend-dot actual" /> 실제값</span>
                    </div>
                    <div class="trend-labels">
                      <span
                        v-for="item in forecastTrend"
                        :key="item.label"
                      >
                        {{ item.label }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="panel mix-panel">
              <div class="section-head">
                <div>
                  <p class="section-caption">Category Accuracy</p>
                  <h3>카테고리별 정확도 비교</h3>
                </div>
                <span class="head-meta">예측 안정성 비교</span>
              </div>
              <div class="mix-list">
                <div
                  v-for="item in categoryAccuracy"
                  :key="item.label"
                  class="mix-row"
                >
                  <div class="mix-main">
                    <span class="mix-dot" :style="{ backgroundColor: item.accuracy >= 90 ? '#004D3C' : '#D97706' }" />
                    <div>
                      <p class="mix-label">{{ item.label }}</p>
                      <p class="mix-amount">{{ item.delta }}</p>
                    </div>
                  </div>
                  <div class="mix-side">
                    <strong>{{ item.accuracy }}%</strong>
                    <div class="mix-bar">
                      <div
                        class="mix-fill"
                        :style="{ width: `${item.accuracy}%`, backgroundColor: item.accuracy >= 90 ? '#004D3C' : '#D97706' }"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="panel table-panel">
              <div class="section-head">
                <div>
                  <p class="section-caption">Store Error Rate</p>
                  <h3>매장별 예측 오차율</h3>
                </div>
                <span class="head-meta">오차 상위 매장</span>
              </div>
              <div class="table-wrap">
                <table class="analytics-table">
                  <thead>
                    <tr>
                      <th>매장명</th>
                      <th>카테고리</th>
                      <th class="w-growth center">오차율</th>
                      <th>주요 원인</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in storeForecastErrors" :key="item.store">
                      <td class="strong">{{ item.store }}</td>
                      <td>{{ item.category }}</td>
                      <td class="center negative">{{ item.errorRate }}</td>
                      <td>{{ item.cause }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="panel insight-panel">
              <div class="section-head">
                <div>
                  <p class="section-caption">Interpretation</p>
                  <h3>오차 해석 가이드</h3>
                </div>
                <span class="head-meta">분석 포인트</span>
              </div>
              <div class="alert-list">
                <div class="alert-row medium">
                  <div class="alert-main">
                    <AlertCircleIcon :size="13" />
                    <div>
                      <p class="alert-title">프로모션 영향 분리 필요</p>
                      <p class="alert-detail">특정 매장의 행사 매출이 예측 모델에 늦게 반영되며 실적 초과가 반복되고 있습니다.</p>
                    </div>
                  </div>
                </div>
                <div class="alert-row medium">
                  <div class="alert-main">
                    <AlertCircleIcon :size="13" />
                    <div>
                      <p class="alert-title">리드타임 변수 보정 필요</p>
                      <p class="alert-detail">입고 지연 발생 시 판매/주문 예측 오차가 동시에 커지는 패턴이 확인됩니다.</p>
                    </div>
                  </div>
                </div>
                <div class="alert-row low">
                  <div class="alert-main">
                    <AlertCircleIcon :size="13" />
                    <div>
                      <p class="alert-title">계절성 모델 분리 추천</p>
                      <p class="alert-detail">생활가전/계절 상품은 일반 카테고리와 별도 시즌 계수 적용이 필요해 보입니다.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="analytics-bottom forecast-bottom-grid">
            <div class="panel table-panel">
              <div class="section-head">
                <div>
                  <p class="section-caption">Forecast Detail</p>
                  <h3>예측 오차 상세 목록</h3>
                </div>
                <span class="head-meta">오차율 상위 품목/범위</span>
              </div>
              <div class="table-wrap">
                <table class="analytics-table">
                  <thead>
                    <tr>
                      <th class="w-id center">ID</th>
                      <th>대상</th>
                      <th>범위</th>
                      <th class="w-amount right">예측값</th>
                      <th class="w-amount right">실제값</th>
                      <th class="w-growth center">오차율</th>
                      <th class="w-status center">방향</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in forecastRows"
                      :key="row.id"
                      :class="{ selected: selectedForecastRow?.id === row.id }"
                      @click="selectedForecastRow = row"
                    >
                      <td class="center muted strong-small">{{ row.id }}</td>
                      <td class="strong">{{ row.target }}</td>
                      <td>{{ row.scope }}</td>
                      <td class="right semi-strong">{{ row.predicted }}</td>
                      <td class="right semi-strong">{{ row.actual }}</td>
                      <td class="center negative">{{ row.errorRate }}</td>
                      <td class="center">{{ row.direction }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div v-if="selectedForecastRow" class="panel forecast-detail-panel">
              <div class="section-head">
                <div>
                  <p class="section-caption">Detail Interpretation</p>
                  <h3>{{ selectedForecastRow.target }}</h3>
                </div>
                <span class="head-meta">{{ selectedForecastRow.id }}</span>
              </div>
              <div class="forecast-detail-body">
                <div class="detail-stat-grid">
                  <div class="detail-stat-box">
                    <p class="kpi-label">예측값</p>
                    <p class="detail-stat-value">{{ selectedForecastRow.predicted }}</p>
                  </div>
                  <div class="detail-stat-box">
                    <p class="kpi-label">실제값</p>
                    <p class="detail-stat-value">{{ selectedForecastRow.actual }}</p>
                  </div>
                  <div class="detail-stat-box">
                    <p class="kpi-label">오차율</p>
                    <p class="detail-stat-value negative">{{ selectedForecastRow.errorRate }}</p>
                  </div>
                  <div class="detail-stat-box">
                    <p class="kpi-label">판정</p>
                    <p class="detail-stat-value">{{ selectedForecastRow.direction }}</p>
                  </div>
                </div>

                <div class="detail-note-box">
                  <p class="section-caption">주요 해석</p>
                  <p class="detail-note">{{ selectedForecastRow.note }}</p>
                </div>

                <div class="detail-factor-list">
                  <p class="section-caption">영향 요인</p>
                  <div
                    v-for="factor in selectedForecastRow.factors"
                    :key="factor"
                    class="list-row"
                  >
                    <span>{{ factor }}</span>
                    <ChevronRightIcon :size="12" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </template>

        <section v-else class="panel placeholder-panel">
          <div class="placeholder-inner">
            <p class="placeholder-caption">{{ activeSideMenu }}</p>
            <h3>이 분석 화면은 다음 단계에서 확장 예정입니다.</h3>
            <p>좌측 메뉴 구조와 상단 필터 체계는 연결해둔 상태이며, 현재는 통합 KPI 대시보드만 우선 구현되어 있습니다.</p>
          </div>
        </section>
    </div>
  </AppLayout>
</template>

<style scoped>
:global(body) {
  background: #f3f4f6;
}

.erp-page {
  min-height: 100vh;
  background: #f3f4f6;
  color: #111827;
  font-family: inherit;
  font-size: 13px;
  -webkit-font-smoothing: antialiased;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 48px;
  padding: 0 16px;
  background: #004d3c;
  border-bottom: 1px solid #1f2937;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.14);
}

.topbar-left,
.topbar-right,
.topbar-actions,
.top-nav,
.side-nav-main,
.filter-left,
.filter-item,
.action-group,
.section-head,
.mix-main,
.alert-main {
  display: flex;
  align-items: center;
}

.topbar-left,
.topbar-right,
.topbar-actions {
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 24px;
  margin-right: 8px;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  height: 100%;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 12px;
  font-weight: 700;
}

.brand-mark.inverse {
  background: #fff;
  color: #111827;
}

.brand-name {
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.04em;
  text-transform: uppercase;
}

.brand-name.inverse {
  color: #fff;
}

.top-nav {
  gap: 0;
  height: 100%;
}

.top-nav-button,
.icon-button,
.user-card,
.side-nav-button,
.ghost-button {
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.top-nav-button {
  height: 48px;
  padding: 0 14px;
  border-bottom: 2px solid transparent;
  color: rgba(255, 255, 255, 0.5);
  font-size: 10.5px;
  font-weight: 700;
}

.top-nav-button:hover,
.icon-button:hover,
.user-card:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.top-nav-button.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-bottom-color: #fff;
}

.topbar-actions {
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.icon-button {
  padding: 6px;
  color: rgba(255, 255, 255, 0.7);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
}

.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

.user-name {
  color: rgba(255, 255, 255, 0.9);
  font-size: 11px;
  font-weight: 700;
}

.layout-shell {
  display: flex;
  min-height: calc(100vh - 48px);
}

.sidebar {
  display: flex;
  flex-direction: column;
  width: 208px;
  border-right: 1px solid #d1d5db;
  background: #fff;
}

.sidebar-head {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  background: rgba(249, 250, 251, 0.5);
}

.sidebar-caption {
  margin-bottom: 4px;
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.sidebar-title {
  color: #1f2937;
  font-size: 12px;
  font-weight: 900;
}

.side-nav {
  padding: 8px;
}

.side-nav-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid transparent;
  color: #4b5563;
  font-size: 12px;
  text-align: left;
}

.side-nav-button + .side-nav-button {
  margin-top: 2px;
}

.side-nav-button:hover {
  background: #f9fafb;
}

.side-nav-main {
  gap: 10px;
}

.side-nav-id {
  font-size: 9px;
  font-weight: 700;
  opacity: 0.3;
}

.content {
  flex: 1;
  padding: 16px;
}

.analytics-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.panel {
  border: 1px solid #d1d5db;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  flex-shrink: 0;
}

.filter-left {
  gap: 16px;
  flex-wrap: wrap;
}

.filter-item {
  gap: 8px;
}

.filter-item span {
  color: #9ca3af;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

.filter-item select,
.wide-search input {
  border: 1px solid #d1d5db;
  background: #f9fafb;
  outline: none;
  font: inherit;
}

.filter-item select {
  width: 112px;
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 700;
}

.search-box {
  position: relative;
  display: block;
}

.wide-search input {
  width: 320px;
  padding: 7px 12px 7px 32px;
  font-size: 11px;
}

.filter-item select:focus,
.wide-search input:focus {
  border-color: #004d3c;
  background: #fff;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  color: #9ca3af;
}

.separator {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
}

.action-group {
  gap: 8px;
}

.ghost-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  color: #374151;
  font-size: 11px;
  font-weight: 900;
}

.ghost-button:hover {
  background: #f9fafb;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.forecast-kpi-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.kpi-card {
  padding: 12px;
}

.kpi-label {
  color: #6b7280;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

.kpi-value {
  margin-top: 8px;
  color: #111827;
  font-size: 23px;
  font-weight: 900;
  letter-spacing: -0.05em;
}

.kpi-sub {
  margin-top: 8px;
  color: #6b7280;
  font-size: 10px;
  font-weight: 700;
}

.kpi-sub.up {
  color: #047857;
}

.kpi-sub.down {
  color: #b91c1c;
}

.analytics-main,
.analytics-bottom {
  display: grid;
  gap: 16px;
}

.analytics-main-grid {
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr);
}

.analytics-bottom-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-height: 0;
}

.forecast-bottom-grid {
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 1fr);
}

.chart-panel,
.mix-panel,
.table-panel,
.insight-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section-head {
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  background: rgba(249, 250, 251, 0.5);
}

.section-caption {
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.section-head h3 {
  margin-top: 4px;
  color: #374151;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.head-meta {
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
}

.trend-chart {
  padding: 18px 18px 16px;
}

.trend-chart-shell {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
  height: 240px;
}

.trend-y-axis {
  display: grid;
  grid-template-rows: repeat(5, 1fr);
  align-items: center;
}

.trend-y-axis span {
  color: #9ca3af;
  font-size: 9px;
  font-weight: 700;
  text-align: right;
}

.trend-canvas {
  position: relative;
  display: grid;
  grid-template-rows: minmax(0, 1fr) 22px;
  min-width: 0;
}

.trend-grid-lines {
  position: absolute;
  inset: 0 0 22px 0;
  display: grid;
  grid-template-rows: repeat(5, 1fr);
}

.trend-grid-lines span {
  border-top: 1px dashed #e5e7eb;
}

.trend-grid-lines span:last-child {
  border-bottom: 1px dashed #e5e7eb;
}

.trend-svg {
  position: absolute;
  inset: 0 0 22px 0;
  width: 100%;
  height: calc(100% - 22px);
  z-index: 2;
}

.trend-line {
  fill: none;
  stroke: #004d3c;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.trend-point {
  fill: #ffffff;
  stroke: #004d3c;
  stroke-width: 1.6;
}

.trend-labels {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 4px;
  align-items: end;
  padding-top: 8px;
}

.trend-labels span {
  color: #9ca3af;
  font-size: 9px;
  font-weight: 700;
  text-align: center;
}

.chart-legend {
  position: absolute;
  top: 6px;
  right: 0;
  z-index: 4;
  display: flex;
  gap: 14px;
  color: #6b7280;
  font-size: 10px;
  font-weight: 700;
}

.chart-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.legend-dot.predicted {
  background: #94a3b8;
}

.legend-dot.actual {
  background: #004d3c;
}

.forecast-line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.forecast-line.predicted {
  stroke: #94a3b8;
  stroke-dasharray: 5 4;
}

.forecast-line.actual {
  stroke: #004d3c;
}

.mix-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.mix-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mix-main {
  gap: 10px;
  min-width: 0;
}

.mix-dot {
  width: 10px;
  height: 10px;
}

.mix-label {
  color: #111827;
  font-size: 11px;
  font-weight: 900;
}

.mix-amount {
  margin-top: 2px;
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
}

.mix-side {
  min-width: 108px;
  text-align: right;
}

.mix-side strong {
  color: #111827;
  font-size: 11px;
  font-weight: 900;
}

.mix-bar {
  width: 108px;
  height: 8px;
  margin-top: 6px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
}

.mix-fill {
  height: 100%;
}

.table-wrap {
  flex: 1;
  overflow: auto;
}

.analytics-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.analytics-table thead tr {
  background: #f3f4f6;
  border-bottom: 1px solid #d1d5db;
}

.analytics-table th,
.analytics-table td {
  padding: 9px 12px;
  border-right: 1px solid #f3f4f6;
  text-align: left;
  white-space: nowrap;
}

.analytics-table th:last-child,
.analytics-table td:last-child {
  border-right: 0;
}

.analytics-table th {
  color: #6b7280;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

.analytics-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
}

.analytics-table tbody tr:hover {
  background: rgba(239, 246, 255, 0.7);
}

.analytics-table tbody tr.selected {
  background: #e6f2f0;
}

.w-rank {
  width: 72px;
}

.w-id {
  width: 88px;
}

.w-amount {
  width: 120px;
}

.w-growth {
  width: 96px;
}

.center {
  text-align: center !important;
}

.right {
  text-align: right !important;
}

.muted {
  color: #9ca3af !important;
}

.strong-small {
  font-weight: 700;
}

.strong {
  color: #111827 !important;
  font-size: 12px !important;
  font-weight: 900;
}

.semi-strong {
  color: #374151;
  font-weight: 700;
}

.positive {
  color: #047857;
  font-weight: 900;
}

.negative {
  color: #b91c1c;
  font-weight: 900;
}

.insight-panel {
  overflow: hidden;
}

.rank-list {
  display: flex;
  flex-direction: column;
}

.rank-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.rank-row:last-child {
  border-bottom: 0;
}

.rank-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #f3f4f6;
  color: #374151;
  font-size: 10px;
  font-weight: 900;
}

.rank-main {
  flex: 1;
  min-width: 0;
}

.rank-title {
  color: #111827;
  font-size: 11px;
  font-weight: 900;
}

.rank-note {
  margin-top: 2px;
  color: #9ca3af;
  font-size: 9px;
  font-weight: 700;
}

.rank-row strong {
  color: #004d3c;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

.forecast-detail-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.forecast-detail-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.detail-stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.detail-stat-box {
  padding: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.detail-stat-value {
  margin-top: 6px;
  color: #111827;
  font-size: 15px;
  font-weight: 900;
}

.detail-note-box {
  padding: 12px;
  border: 1px solid #d1d5db;
  background: rgba(249, 250, 251, 0.55);
}

.detail-note {
  margin-top: 8px;
  color: #374151;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.6;
}

.detail-factor-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-list {
  display: flex;
  flex-direction: column;
}

.alert-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.alert-row:last-child {
  border-bottom: 0;
}

.alert-row.high {
  background: rgba(254, 242, 242, 0.55);
}

.alert-row.medium {
  background: rgba(255, 251, 235, 0.5);
}

.alert-main {
  gap: 10px;
  align-items: flex-start;
}

.alert-title {
  color: #111827;
  font-size: 11px;
  font-weight: 900;
}

.alert-detail {
  margin-top: 3px;
  color: #6b7280;
  font-size: 10px;
  line-height: 1.45;
}

.placeholder-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
}

.placeholder-inner {
  max-width: 520px;
  padding: 24px;
  text-align: center;
}

.placeholder-caption {
  color: #004d3c;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

.placeholder-inner h3 {
  margin-top: 10px;
  color: #111827;
  font-size: 18px;
  font-weight: 900;
}

.placeholder-inner p {
  margin-top: 10px;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 1380px) {
  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .analytics-main-grid,
  .analytics-bottom-grid {
    grid-template-columns: 1fr;
  }

  .forecast-bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .topbar,
  .layout-shell,
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .topbar {
    position: static;
    padding: 12px 16px;
  }

  .topbar-left,
  .topbar-right,
  .filter-left {
    flex-direction: column;
    align-items: stretch;
  }

  .brand {
    margin-right: 0;
    padding-right: 0;
    border-right: 0;
  }

  .top-nav {
    flex-wrap: wrap;
  }

  .topbar-actions {
    padding-left: 0;
    border-left: 0;
  }

  .sidebar {
    width: 100%;
  }

  .wide-search input,
  .mix-bar {
    width: 100%;
  }

  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
