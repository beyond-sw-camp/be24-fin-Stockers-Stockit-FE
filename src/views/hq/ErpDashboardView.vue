<script setup>
import { computed, h, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const activeSideMenu = ref('대시보드')
const sideMenus = roleMenus.hq

function handleLogout() {
  auth.logout()
  router.push('/login')
}

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

const AlertCircleIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 8v5' } },
  { tag: 'path', attrs: { d: 'M12 16h.01' } },
])

const BarChart3Icon = IconBase([
  { tag: 'path', attrs: { d: 'M3 20h18' } },
  { tag: 'path', attrs: { d: 'M7 16V8' } },
  { tag: 'path', attrs: { d: 'M12 16V4' } },
  { tag: 'path', attrs: { d: 'M17 16v-6' } },
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
</script>

<template>
  <AppLayout
    active-top-menu="대시보드"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    :show-system-card="true"
    @logout="handleLogout"
  >
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
  </AppLayout>
</template>

<style scoped>
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

.dashboard-head-left,
.dashboard-badges,
.dashboard-actions,
.table-heading,
.table-tools,
.table-meta,
.pagination,
.panel-title,
.legend,
.status-cell {
  display: flex;
  align-items: center;
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
  background: transparent;
  color: #4b5563;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.action-button:hover {
  background: #f9fafb;
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
  margin-top: 16px;
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
  margin-top: 16px;
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
  border: 0;
  border-bottom: 1px solid #f3f4f6;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
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
  border: 0;
  border-top: 1px solid #e5e7eb;
  background: transparent;
  color: #6b7280;
  font: inherit;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  cursor: pointer;
}

.alert-footer:hover {
  background: #f9fafb;
}

.danger {
  color: #dc2626;
}

.table-panel {
  margin-top: 16px;
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
  border: 0;
  background: transparent;
  color: #004d3c;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
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

.table-heading {
  gap: 8px;
}

.table-tools {
  gap: 12px;
}

.pagination {
  gap: 4px;
}

.pagination button {
  width: 20px;
  height: 20px;
  border: 1px solid #d1d5db;
  background: transparent;
  color: #6b7280;
  font: inherit;
  cursor: pointer;
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
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
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
