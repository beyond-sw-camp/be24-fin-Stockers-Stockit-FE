<script setup>
import { computed, h, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

function handleLogout() {
  auth.logout()
  router.push('/login')
}
const activeSideMenu = ref('실시간 요약')

const brandColor = '#004D3C'
const brandColorLight = '#E6F2F0'

const topMenus = ['대시보드', '재고 관리', '발주 관리', '제품 관리', '인프라 관리', '정산/통계']
const routeMap = {
  대시보드: '/hq/dashboard',
  '재고 관리': '/hq/inventory',
  '발주 관리': '/hq/orders',
  '제품 관리': '/hq/products',
  '인프라 관리': '/hq/infrastructure',
  '정산/통계': '/hq/analytics',
}

const sideMenus = [
  { label: '실시간 요약', icon: 'layout' },
  { label: '전사 재고 집계', icon: 'warehouse' },
  { label: '안전재고 모니터링', icon: 'alert' },
  { label: '거점별 물동량', icon: 'truck' },
  { label: 'AI 수요 예측', icon: 'chart' },
  { label: '시스템 감사 로그', icon: 'file' },
]

const kpiStats = [
  { label: '전사 총 재고 수량', value: '124,582', unit: 'EA', change: '+2.4%', status: 'up' },
  { label: '재고 가치 총액', value: '₩4,821.5M', unit: '', change: '+0.8%', status: 'up' },
  { label: '안전 재고 부족 매장', value: '08', unit: '곳', change: '+2', status: 'down' },
  { label: '금일 입고 진행률', value: '82', unit: '%', change: '12/15 건', status: 'neutral' },
  { label: '금일 출고 진행률', value: '45', unit: '%', change: '18/40 건', status: 'neutral' },
  { label: '품절 임박 SKU', value: '14', unit: 'SKU', change: '-3', status: 'up' },
]

const logisticsData = [
  { id: '20240416-001', center: '인천 제1물류센터', item: 'A사 프리미엄 원두 (500g)', vendor: '(주)커피네트웍스', qty: 500, manager: '이선엽', status: '승인완료', time: '16:45:10' },
  { id: '20240416-002', center: '강남 서초점', item: '유기농 우유 1L (12입)', vendor: '매일유업', qty: -24, manager: '박범수', status: '출고대기', time: '16:30:22' },
  { id: '20240416-003', center: '성수 직영점', item: '친환경 종이컵 (1000ea)', vendor: '그린팩', qty: 10, manager: '김사라', status: '검수중', time: '16:15:45' },
  { id: '20240416-004', center: '판교 테크노점', item: '무라벨 생수 500ml', vendor: '삼다수', qty: 120, manager: '이후경', status: '승인완료', time: '15:50:12' },
  { id: '20240416-005', center: '부산 중앙창고', item: '질소 포장 닭가슴살', vendor: '하림', qty: -1200, manager: '이선엽', status: '이동중', time: '15:20:30' },
  { id: '20240416-006', center: '대전 물류허브', item: '냉동 블루베리 1kg', vendor: '프레시팜', qty: 300, manager: '박범수', status: '승인완료', time: '14:55:01' },
  { id: '20240416-007', center: '여의도 IFC점', item: '에스프레소 시럽 750ml', vendor: '모닌코리아', qty: -6, manager: '김사라', status: '승인완료', time: '14:40:15' },
]

const alerts = [
  { type: '재고', msg: '성수점: 아메리카노 원두 품절 임박', time: '10분 전' },
  { type: '발주', msg: '인천센터: (주)하림 입고 지연 발생', time: '25분 전' },
  { type: '정산', msg: '판교점: POS 재고 데이터 불일치', time: '1시간 전' },
]

const chartHeights = [60, 45, 80, 95, 70, 85, 90]

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()),
)

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

const LayoutDashboardIcon = IconBase([
  { tag: 'rect', attrs: { x: '3', y: '3', width: '7', height: '7' } },
  { tag: 'rect', attrs: { x: '14', y: '3', width: '7', height: '5' } },
  { tag: 'rect', attrs: { x: '14', y: '12', width: '7', height: '9' } },
  { tag: 'rect', attrs: { x: '3', y: '14', width: '7', height: '7' } },
])

const WarehouseIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 10.5 12 4l9 6.5' } },
  { tag: 'path', attrs: { d: 'M5 9.5V20h14V9.5' } },
  { tag: 'path', attrs: { d: 'M10 20v-5h4v5' } },
])

const AlertCircleIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 8v5' } },
  { tag: 'path', attrs: { d: 'M12 16h.01' } },
])

const TruckIcon = IconBase([
  { tag: 'path', attrs: { d: 'M10 17H5a2 2 0 0 1-2-2V7h11v10Z' } },
  { tag: 'path', attrs: { d: 'M14 17h-1V9h3l3 3v5h-1' } },
  { tag: 'circle', attrs: { cx: '7.5', cy: '17.5', r: '1.5' } },
  { tag: 'circle', attrs: { cx: '17.5', cy: '17.5', r: '1.5' } },
])

const BarChart3Icon = IconBase([
  { tag: 'path', attrs: { d: 'M3 20h18' } },
  { tag: 'path', attrs: { d: 'M7 16V8' } },
  { tag: 'path', attrs: { d: 'M12 16V4' } },
  { tag: 'path', attrs: { d: 'M17 16v-6' } },
])

const FileTextIcon = IconBase([
  { tag: 'path', attrs: { d: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z' } },
  { tag: 'path', attrs: { d: 'M14 3v5h5' } },
  { tag: 'path', attrs: { d: 'M9 13h6' } },
  { tag: 'path', attrs: { d: 'M9 17h6' } },
])

const BellIcon = IconBase([
  { tag: 'path', attrs: { d: 'M15 17H5a2 2 0 0 1-2-2c2 0 3-1 3-3V9a6 6 0 0 1 12 0v3c0 2 1 3 3 3a2 2 0 0 1-2 2h-4' } },
  { tag: 'path', attrs: { d: 'M10 17a2 2 0 0 0 4 0' } },
])

const SettingsIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '3' } },
  { tag: 'path', attrs: { d: 'M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 1-3 0 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06A2 2 0 1 1 5.24 17l.06-.06A1.7 1.7 0 0 0 5.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 1 0-3 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87L5.2 8.07A2 2 0 1 1 8.03 5.24l.06.06A1.7 1.7 0 0 0 10 5.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 1 3 0 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06A2 2 0 1 1 19.76 8l-.06.06A1.7 1.7 0 0 0 19.4 10c0 .37.21.73.6 1a1.7 1.7 0 0 1 0 3 1.7 1.7 0 0 0-.6 1Z' } },
])

const SearchIcon = IconBase([
  { tag: 'circle', attrs: { cx: '11', cy: '11', r: '7' } },
  { tag: 'path', attrs: { d: 'm20 20-3.5-3.5' } },
])

const ArrowUpRightIcon = IconBase([
  { tag: 'path', attrs: { d: 'M7 17 17 7' } },
  { tag: 'path', attrs: { d: 'M9 7h8v8' } },
])

const ArrowDownRightIcon = IconBase([
  { tag: 'path', attrs: { d: 'm7 7 10 10' } },
  { tag: 'path', attrs: { d: 'M17 17V9H9' } },
])

const PlusCircleIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 8v8' } },
  { tag: 'path', attrs: { d: 'M8 12h8' } },
])

const FilterIcon = IconBase([
  { tag: 'path', attrs: { d: 'M4 5h16' } },
  { tag: 'path', attrs: { d: 'M7 12h10' } },
  { tag: 'path', attrs: { d: 'M10 19h4' } },
])

const DownloadIcon = IconBase([
  { tag: 'path', attrs: { d: 'M12 3v12' } },
  { tag: 'path', attrs: { d: 'm7 10 5 5 5-5' } },
  { tag: 'path', attrs: { d: 'M5 21h14' } },
])

const CheckCircle2Icon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'm9 12 2 2 4-4' } },
])

const ClockIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 7v5l3 2' } },
])

const ExternalLinkIcon = IconBase([
  { tag: 'path', attrs: { d: 'M14 5h5v5' } },
  { tag: 'path', attrs: { d: 'M10 14 19 5' } },
  { tag: 'path', attrs: { d: 'M19 14v5H5V5h5' } },
])

const iconMap = {
  layout: LayoutDashboardIcon,
  warehouse: WarehouseIcon,
  alert: AlertCircleIcon,
  truck: TruckIcon,
  chart: BarChart3Icon,
  file: FileTextIcon,
}

const activeTopMenu = computed(() => '대시보드')

const handleTopMenuClick = (menu) => {
  const target = routeMap[menu]

  if (target) {
    router.push(target)
  }
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
    <div class="dashboard-content">
        <section class="panel dashboard-head">
          <div class="dashboard-head-left">
            <h2 class="dashboard-title">
              <LayoutDashboardIcon :size="16" />
              {{ activeSideMenu }}
            </h2>

            <div class="dashboard-badges">
              <span class="badge">데이터 기준: {{ dateLabel }}</span>
              <span class="badge badge-live">
                <ClockIcon :size="10" />
                실시간 갱신 중
              </span>
            </div>
          </div>

          <div class="dashboard-actions">
            <button type="button" class="action-button">
              <FilterIcon :size="12" />
              필터 설정
            </button>
            <button type="button" class="action-button">
              <DownloadIcon :size="12" />
              CSV 추출
            </button>
            <button type="button" class="action-button primary">
              <PlusCircleIcon :size="12" />
              긴급 재고 생성
            </button>
          </div>
        </section>

        <section class="kpi-grid">
          <article v-for="stat in kpiStats" :key="stat.label" class="panel kpi-card">
            <p class="kpi-label">{{ stat.label }}</p>
            <div class="kpi-row">
              <div>
                <span class="kpi-value">{{ stat.value }}</span>
                <span class="kpi-unit">{{ stat.unit }}</span>
              </div>
              <div class="kpi-change" :class="stat.status">
                <ArrowUpRightIcon v-if="stat.status === 'up'" :size="10" />
                <ArrowDownRightIcon v-else-if="stat.status === 'down'" :size="10" />
                <span>{{ stat.change }}</span>
              </div>
            </div>
          </article>
        </section>

        <section class="analytics-grid">
          <article class="panel trend-panel">
            <div class="panel-head subtle">
              <h3 class="panel-title">
                <BarChart3Icon :size="14" />
                전사 입출고 트렌드 분석 (7D)
              </h3>

              <div class="legend">
                <span><i class="legend-dot solid" /> 출고</span>
                <span><i class="legend-dot" /> 입고</span>
              </div>
            </div>

            <div class="chart-area">
              <div class="chart-frame">
                <div v-for="(height, index) in chartHeights" :key="index" class="chart-column">
                  <div class="chart-bars">
                    <div class="chart-bar outbound" :style="{ height: `${height}%` }" />
                    <div class="chart-bar inbound" :style="{ height: `${height * 0.7}%` }" />
                  </div>
                  <span class="chart-label">04/{{ 10 + index }}</span>
                </div>
              </div>
            </div>
          </article>

          <article class="panel alert-panel">
            <div class="panel-head subtle">
              <h3 class="panel-title">
                <AlertCircleIcon :size="14" class="danger" />
                긴급 장애/경보
              </h3>
            </div>

            <div class="alert-list">
              <button v-for="alert in alerts" :key="alert.msg" type="button" class="alert-item">
                <AlertCircleIcon :size="12" class="danger" />
                <div>
                  <p>{{ alert.msg }}</p>
                  <span>{{ alert.type }} • {{ alert.time }}</span>
                </div>
              </button>
            </div>

            <button type="button" class="alert-footer">관제 센터 바로가기</button>
          </article>
        </section>

        <section class="panel table-panel">
          <div class="panel-head">
            <div class="table-heading">
              <h3 class="panel-title">최근 물류 트랜잭션 (Real-time Log)</h3>
              <span class="live-pill">LIVE</span>
            </div>

            <div class="table-tools">
              <label class="refresh-check">
                <input type="checkbox" checked readonly />
                <span>자동 갱신</span>
              </label>
              <button type="button" class="inline-link">
                모든 트랜잭션 조회
                <ExternalLinkIcon :size="10" />
              </button>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>트랜잭션 ID</th>
                  <th>물류 거점</th>
                  <th>품목 정보</th>
                  <th>거래처</th>
                  <th class="align-right">수량</th>
                  <th>담당자</th>
                  <th>승인 상태</th>
                  <th>발생 시각</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in logisticsData" :key="row.id">
                  <td class="muted">{{ row.id }}</td>
                  <td class="strong">{{ row.center }}</td>
                  <td class="item">{{ row.item }}</td>
                  <td>{{ row.vendor }}</td>
                  <td class="align-right quantity-cell" :class="row.qty > 0 ? 'positive' : 'negative'">
                    {{ row.qty > 0 ? `+${row.qty.toLocaleString()}` : row.qty.toLocaleString() }}
                  </td>
                  <td>{{ row.manager }}</td>
                  <td>
                    <div class="status-cell">
                      <CheckCircle2Icon
                        v-if="row.status === '승인완료'"
                        :size="12"
                        class="status-icon success"
                      />
                      <ClockIcon v-else :size="12" class="status-icon pending" />
                      <span
                        class="status-text"
                        :class="{
                          success: row.status === '승인완료',
                          wait: row.status === '출고대기',
                          move: row.status === '이동중',
                        }"
                      >
                        {{ row.status }}
                      </span>
                    </div>
                  </td>
                  <td class="muted strong-small">{{ row.time }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-footer">
            <div class="table-meta">
              <span>데이터 수: 1,402건</span>
              <span>조회 소요 시간: 0.042s</span>
            </div>

            <div class="pagination">
              <button v-for="page in [1, 2, 3, 4, 5]" :key="page" type="button" :class="{ active: page === 1 }">
                {{ page }}
              </button>
            </div>
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
  border-bottom: 1px solid #374151;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.14);
}

.topbar-left,
.topbar-right,
.topbar-actions,
.top-nav,
.dashboard-actions,
.dashboard-head-left,
.dashboard-badges,
.table-heading,
.table-tools,
.table-meta,
.pagination,
.panel-title,
.legend,
.system-head {
  display: flex;
  align-items: center;
}

.topbar-left,
.topbar-right {
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 24px;
  margin-right: 8px;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
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
  background: #fff !important;
  color: #111827;
}

.brand-name {
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.04em;
  text-transform: uppercase;
}

.brand-name.inverse {
  color: #fff !important;
}

.top-nav {
  gap: 0;
  height: 100%;
}

.top-nav-button,
.icon-button,
.user-card,
.side-nav-button,
.action-button,
.alert-item,
.alert-footer,
.inline-link,
.pagination button {
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.top-nav-button {
  height: 48px;
  padding: 0 14px;
  border-bottom: 2px solid transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 10.5px;
  font-weight: 700;
  transition: background-color 0.2s ease;
}

.top-nav-button:hover,
.icon-button:hover,
.user-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.side-nav-button:hover,
.action-button:hover,
.alert-item:hover,
.alert-footer:hover,
.pagination button:hover {
  background: #f9fafb;
}

.top-nav-button.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border-bottom-color: #fff;
}

.search-box {
  position: relative;
  display: block;
}

.search-box input {
  width: 224px;
  padding: 7px 12px 7px 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  outline: none;
  font: inherit;
  font-size: 11px;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.55);
}

.search-box input:focus {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.22);
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.55);
}

.topbar-actions {
  gap: 4px;
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.icon-button {
  padding: 6px;
  color: rgba(255, 255, 255, 0.8);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
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
  gap: 10px;
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

.side-nav-button.active {
  border-color: #004d3c;
  background: #e6f2f0;
  color: #004d3c;
  font-weight: 700;
}

.system-card {
  margin-top: auto;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.system-head {
  justify-content: space-between;
  margin-bottom: 8px;
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #10b981;
}

.system-meter {
  width: 100%;
  height: 4px;
  margin-bottom: 4px;
  background: #e5e7eb;
}

.system-meter-fill {
  width: 74%;
  height: 100%;
}

.system-card p {
  color: #6b7280;
  font-size: 9px;
}

.content {
  flex: 1;
  padding: 16px;
}

.dashboard-content > * + * {
  margin-top: 16px;
}

.panel {
  border: 1px solid #d1d5db;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.dashboard-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
}

.dashboard-head-left {
  gap: 12px;
  flex-wrap: wrap;
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #111827;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.03em;
  text-transform: uppercase;
}

.dashboard-badges {
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 10px;
  font-weight: 700;
}

.badge-live {
  border-color: #a7f3d0;
  background: #ecfdf5;
  color: #047857;
}

.dashboard-actions {
  gap: 6px;
  flex-wrap: wrap;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border: 1px solid #d1d5db;
  color: #4b5563;
  font-size: 11px;
  font-weight: 700;
}

.action-button.primary {
  border-color: #004d3c;
  background: #004d3c;
  color: #fff;
}

.action-button.primary:hover {
  background: #00392d;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.kpi-card {
  padding: 12px;
}

.kpi-label {
  margin-bottom: 4px;
  color: #6b7280;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.kpi-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
}

.kpi-value {
  color: #111827;
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.05em;
}

.kpi-unit {
  margin-left: 4px;
  color: #9ca3af;
  font-size: 11px;
}

.kpi-change {
  display: flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
}

.kpi-change.up {
  color: #059669;
}

.kpi-change.down {
  color: #dc2626;
}

.kpi-change.neutral {
  color: #9ca3af;
}

.analytics-grid {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(260px, 1fr);
  gap: 16px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-head.subtle {
  background: rgba(249, 250, 251, 0.5);
}

.panel-title {
  gap: 8px;
  color: #374151;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.legend {
  gap: 12px;
  color: #6b7280;
  font-size: 10px;
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border: 1px solid #9ca3af;
  background: #fff;
}

.legend-dot.solid {
  border-color: #004d3c;
  background: #004d3c;
}

.chart-area {
  padding: 16px;
}

.chart-frame {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 16px;
  min-height: 192px;
  padding: 12px 0 4px;
  border-bottom: 1px solid #e5e7eb;
  border-left: 1px solid #e5e7eb;
}

.chart-column {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  max-width: 40px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  width: 100%;
  height: 128px;
}

.chart-bar {
  width: 50%;
}

.chart-bar.outbound {
  background: #004d3c;
}

.chart-bar.inbound {
  background: #e5e7eb;
}

.chart-label {
  color: #9ca3af;
  font-size: 9px;
  font-weight: 700;
}

.alert-panel {
  display: flex;
  flex-direction: column;
}

.alert-list {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
}

.alert-item p {
  color: #1f2937;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
}

.alert-item span {
  display: inline-block;
  margin-top: 4px;
  color: #9ca3af;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
}

.alert-item:hover {
  background: #fef2f2;
}

.alert-footer {
  padding: 10px;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

.danger {
  color: #dc2626;
}

.table-panel {
  overflow: hidden;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead tr {
  background: #f3f4f6;
  border-bottom: 1px solid #d1d5db;
}

th,
td {
  padding: 10px 12px;
  border-right: 1px solid #f3f4f6;
  text-align: left;
  white-space: nowrap;
}

th:last-child,
td:last-child {
  border-right: 0;
}

th {
  color: #6b7280;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

tbody tr {
  border-bottom: 1px solid #e5e7eb;
}

tbody tr:hover {
  background: rgba(239, 246, 255, 0.7);
}

td {
  font-size: 11px;
  color: #6b7280;
}

td.strong,
td.item {
  color: #1f2937;
  font-size: 12px;
  font-weight: 900;
}

td.item {
  color: #4b5563;
}

.muted {
  color: #9ca3af;
}

.align-right {
  text-align: right;
}

.quantity-cell {
  font-size: 12px;
  font-weight: 900;
}

.quantity-cell.positive {
  color: #047857;
  background: rgba(236, 253, 245, 0.5);
}

.quantity-cell.negative {
  color: #b91c1c;
  background: rgba(254, 242, 242, 0.5);
}

.status-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-icon.success,
.status-text.success {
  color: #059669;
}

.status-icon.pending,
.status-text.wait {
  color: #b45309;
}

.status-text.move {
  color: #1d4ed8;
}

.status-text {
  font-size: 10px;
  font-weight: 900;
}

.strong-small {
  font-weight: 700;
}

.live-pill {
  padding: 2px 6px;
  background: #1f2937;
  color: #fff;
  font-size: 9px;
  font-weight: 900;
}

.refresh-check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 10px;
  font-weight: 700;
}

.inline-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #004d3c;
  font-size: 11px;
  font-weight: 700;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: #f9fafb;
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
}

.table-meta {
  gap: 16px;
  flex-wrap: wrap;
}

.pagination {
  gap: 4px;
}

.pagination button {
  width: 20px;
  height: 20px;
  border: 1px solid #d1d5db;
  color: #6b7280;
}

.pagination button.active {
  border-color: #1f2937;
  background: #1f2937;
  color: #fff;
}

@media (max-width: 1280px) {
  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .topbar,
  .layout-shell {
    flex-direction: column;
    align-items: stretch;
  }

  .topbar {
    position: static;
    padding: 12px 16px;
  }

  .topbar-left,
  .topbar-right {
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
    justify-content: flex-start;
    padding-left: 0;
    border-left: 0;
  }

  .search-box input {
    width: 100%;
  }

  .sidebar {
    width: 100%;
  }

  .analytics-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .content {
    padding: 12px;
  }

  .dashboard-head,
  .panel-head,
  .table-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
