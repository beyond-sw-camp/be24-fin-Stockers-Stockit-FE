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

const brandColor = '#004D3C'
const brandColorLight = '#E6F2F0'
const activeSideMenu = ref('전사 재고 집계')
const selectedItem = ref(null)
const searchTerm = ref('')

const topMenus = ['대시보드', '재고 관리', '발주 관리', '제품 관리', '인프라 관리', '정산/통계']
const routeMap = {
  대시보드: '/hq/dashboard',
  '재고 관리': '/hq/inventory',
  '발주 관리': '/hq/orders',
  '제품 관리': '/hq/products',
  '인프라 관리': '/hq/infrastructure',
  '정산/통계': '/hq/analytics',
}

const activeTopMenu = computed(() => '재고 관리')

const sideMenus = [
  { label: '전사 재고 집계', icon: 'layout' },
  { label: '창고별 재고 현황', icon: 'warehouse' },
  { label: '매장별 재고 현황', icon: 'store' },
  { label: '재고 실사 내역', icon: 'check' },
  { label: '재고 변동 이력', icon: 'history' },
]

const inventoryData = [
  { id: 'ITM-E001', name: '고속 충전기 (C타입) 25W', cat: '전자제품', loc: '인천 제1센터', current: 1240, safety: 500, avail: 1200, status: '정상', updated: '2024.04.16 17:20' },
  { id: 'ITM-H002', name: '휴대용 가글 (중) 250ml', cat: '위생용품', loc: '성수 직영점', current: 12, safety: 50, avail: 10, status: '부족', updated: '2024.04.16 16:45' },
  { id: 'ITM-K003', name: '유리제 머그컵 350ml', cat: '주방잡화', loc: '강남 서초점', current: 85, safety: 100, avail: 80, status: '임박', updated: '2024.04.16 15:30' },
  { id: 'ITM-E004', name: '무소음 무선 마우스 (블랙)', cat: '전자제품', loc: '인천 제2센터', current: 0, safety: 100, avail: 0, status: '품절', updated: '2024.04.16 14:10' },
  { id: 'ITM-S005', name: 'A4 복사용지 80g (500매)', cat: '문구/사무', loc: '판교 테크노점', current: 1200, safety: 400, avail: 1150, status: '정상', updated: '2024.04.16 13:55' },
  { id: 'ITM-S006', name: '리무버블 데코 스티커 셋트', cat: '문구/사무', loc: '용인 물류센터', current: 310, safety: 300, avail: 305, status: '임박', updated: '2024.04.16 12:20' },
  { id: 'ITM-S007', name: '스테이플러 심 (10호)', cat: '문구/사무', loc: '성수 직영점', current: 5, safety: 40, avail: 5, status: '부족', updated: '2024.04.16 11:45' },
  { id: 'ITM-E008', name: '대용량 보조배터리 20000mAh', cat: '전자제품', loc: '인천 제1센터', current: 240, safety: 100, avail: 235, status: '정상', updated: '2024.04.16 10:30' },
  { id: 'ITM-E009', name: '기계식 키보드 (청축)', cat: '전자제품', loc: '인천 제1센터', current: 45, safety: 50, avail: 42, status: '임박', updated: '2024.04.16 09:15' },
  { id: 'ITM-H010', name: '손세정제 리필 500ml', cat: '위생용품', loc: '강남 서초점', current: 320, safety: 100, avail: 310, status: '정상', updated: '2024.04.16 08:40' },
  { id: 'ITM-K011', name: '니트릴 고무장갑 (M/100입)', cat: '주방잡화', loc: '인천 제2센터', current: 15, safety: 80, avail: 12, status: '부족', updated: '2024.04.15 17:50' },
  { id: 'ITM-S012', name: '수정테이프 5mm x 10m', cat: '문구/사무', loc: '성수 직영점', current: 450, safety: 100, avail: 440, status: '정상', updated: '2024.04.15 16:30' },
  { id: 'ITM-S013', name: '3색 형광펜 세트', cat: '문구/사무', loc: '판교 테크노점', current: 8, safety: 30, avail: 8, status: '부족', updated: '2024.04.15 15:20' },
  { id: 'ITM-S014', name: '사무용 가위 (대)', cat: '문구/사무', loc: '용인 물류센터', current: 0, safety: 20, avail: 0, status: '품절', updated: '2024.04.15 14:10' },
  { id: 'ITM-E015', name: '절전형 5구 멀티탭 3m', cat: '전자제품', loc: '인천 제1센터', current: 85, safety: 50, avail: 80, status: '정상', updated: '2024.04.15 13:00' },
  { id: 'ITM-E016', name: 'HDMI 2.1 케이블 1.5m', cat: '전자제품', loc: '인천 제2센터', current: 210, safety: 100, avail: 205, status: '정상', updated: '2024.04.15 12:15' },
  { id: 'ITM-S017', name: '점착식 메모지 (노랑)', cat: '문구/사무', loc: '성수 직영점', current: 1500, safety: 500, avail: 1480, status: '정상', updated: '2024.04.15 11:40' },
  { id: 'ITM-H018', name: 'KF94 마스크 (50매입)', cat: '위생용품', loc: '용인 물류센터', current: 42, safety: 100, avail: 40, status: '부족', updated: '2024.04.15 10:20' },
  { id: 'ITM-K019', name: '주방세제 3L (대용량)', cat: '주방잡화', loc: '인천 제1센터', current: 120, safety: 50, avail: 110, status: '정상', updated: '2024.04.15 09:10' },
  { id: 'ITM-K020', name: '다목적 수세미 (5입)', cat: '주방잡화', loc: '강남 서초점', current: 35, safety: 40, avail: 30, status: '임박', updated: '2024.04.14 17:55' },
  { id: 'ITM-S021', name: '메쉬 연필꽂이 (실버)', cat: '문구/사무', loc: '판교 테크노점', current: 12, safety: 20, avail: 12, status: '임박', updated: '2024.04.14 16:40' },
  { id: 'ITM-S022', name: 'L자 파일 홀더 (100매)', cat: '문구/사무', loc: '성수 직영점', current: 800, safety: 200, avail: 780, status: '정상', updated: '2024.04.14 15:30' },
  { id: 'ITM-E023', name: '무선 이어폰 노이즈캔슬링', cat: '전자제품', loc: '인천 제1센터', current: 55, safety: 30, avail: 50, status: '정상', updated: '2024.04.14 14:15' },
  { id: 'ITM-S024', name: '가죽 데스크 패드 (브라운)', cat: '문구/사무', loc: '판교 테크노점', current: 4, safety: 10, avail: 4, status: '부족', updated: '2024.04.14 13:05' },
  { id: 'ITM-H025', name: '탁상용 미니 가습기', cat: '위생용품', loc: '인천 제2센터', current: 0, safety: 15, avail: 0, status: '품절', updated: '2024.04.14 12:50' },
  { id: 'ITM-H026', name: '퍼퓸 핸드크림 50ml', cat: '위생용품', loc: '성수 직영점', current: 88, safety: 100, avail: 85, status: '임박', updated: '2024.04.14 11:20' },
  { id: 'ITM-K027', name: '종이컵 6.5온스 (1000입)', cat: '주방잡화', loc: '용인 물류센터', current: 4500, safety: 1000, avail: 4450, status: '정상', updated: '2024.04.14 10:10' },
  { id: 'ITM-S028', name: '투명 박스 테이프 50mm', cat: '문구/사무', loc: '인천 제1센터', current: 120, safety: 50, avail: 115, status: '정상', updated: '2024.04.13 17:40' },
  { id: 'ITM-S029', name: '사무용 커터칼 (중)', cat: '문구/사무', loc: '강남 서초점', current: 22, safety: 30, avail: 20, status: '임박', updated: '2024.04.13 16:30' },
  { id: 'ITM-S030', name: '철제 30cm 자', cat: '문구/사무', loc: '성수 직영점', current: 0, safety: 10, avail: 0, status: '품절', updated: '2024.04.13 15:20' },
  { id: 'ITM-E031', name: '알루미늄 노트북 스탠드', cat: '전자제품', loc: '인천 제2센터', current: 140, safety: 50, avail: 135, status: '정상', updated: '2024.04.13 14:10' },
  { id: 'ITM-E032', name: 'FHD 웹캠 (마이크내장)', cat: '전자제품', loc: '판교 테크노점', current: 18, safety: 20, avail: 18, status: '임박', updated: '2024.04.13 13:00' },
  { id: 'ITM-E033', name: 'USB-C to 3.5mm 젠더', cat: '전자제품', loc: '인천 제1센터', current: 5, safety: 30, avail: 5, status: '부족', updated: '2024.04.13 12:45' },
  { id: 'ITM-S034', name: '더블클립 (중/20입)', cat: '문구/사무', loc: '용인 물류센터', current: 650, safety: 100, avail: 640, status: '정상', updated: '2024.04.13 11:30' },
  { id: 'ITM-S035', name: '투명 화일 (A4)', cat: '문구/사무', loc: '강남 서초점', current: 2400, safety: 500, avail: 2380, status: '정상', updated: '2024.04.13 10:15' },
]

const miniStats = [
  { label: '총 보유 품목 수', value: '1,420 SKU' },
  { label: '안전 재고 미만 품목', value: '38 건', tone: 'danger' },
  { label: '금일 입고 예정', value: '22 건' },
  { label: '금일 출고 예정', value: '54 건' },
]

const filteredInventory = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  if (!keyword) {
    return inventoryData
  }

  return inventoryData.filter((item) => {
    const target = [item.id, item.name, item.cat, item.loc].join(' ').toLowerCase()
    return target.includes(keyword)
  })
})

const handleTopMenuClick = (menu) => {
  const target = routeMap[menu]

  if (target) {
    router.push(target)
  }
}

const selectItem = (row) => {
  selectedItem.value = row
}

const clearSelectedItem = () => {
  selectedItem.value = null
}

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

const StoreIcon = IconBase([
  { tag: 'path', attrs: { d: 'M4 10h16' } },
  { tag: 'path', attrs: { d: 'M5 10V6l2-2h10l2 2v4' } },
  { tag: 'path', attrs: { d: 'M6 10v10h12V10' } },
  { tag: 'path', attrs: { d: 'M10 20v-5h4v5' } },
])

const CheckCircle2Icon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'm9 12 2 2 4-4' } },
])

const HistoryIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 12a9 9 0 1 0 3-6.7' } },
  { tag: 'path', attrs: { d: 'M3 4v5h5' } },
  { tag: 'path', attrs: { d: 'M12 7v5l3 2' } },
])

const BellIcon = IconBase([
  { tag: 'path', attrs: { d: 'M15 17H5a2 2 0 0 1-2-2c2 0 3-1 3-3V9a6 6 0 0 1 12 0v3c0 2 1 3 3 3a2 2 0 0 1-2 2h-4' } },
  { tag: 'path', attrs: { d: 'M10 17a2 2 0 0 0 4 0' } },
])

const SearchIcon = IconBase([
  { tag: 'circle', attrs: { cx: '11', cy: '11', r: '7' } },
  { tag: 'path', attrs: { d: 'm20 20-3.5-3.5' } },
])

const ChevronDownIcon = IconBase([
  { tag: 'path', attrs: { d: 'm6 9 6 6 6-6' } },
])

const DownloadIcon = IconBase([
  { tag: 'path', attrs: { d: 'M12 3v12' } },
  { tag: 'path', attrs: { d: 'm7 10 5 5 5-5' } },
  { tag: 'path', attrs: { d: 'M5 21h14' } },
])

const ChevronLeftIcon = IconBase([
  { tag: 'path', attrs: { d: 'm15 18-6-6 6-6' } },
])

const ChevronRightIcon = IconBase([
  { tag: 'path', attrs: { d: 'm9 18 6-6-6-6' } },
])

const InfoIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 10v6' } },
  { tag: 'path', attrs: { d: 'M12 7h.01' } },
])

const XIcon = IconBase([
  { tag: 'path', attrs: { d: 'M18 6 6 18' } },
  { tag: 'path', attrs: { d: 'm6 6 12 12' } },
])

const ExternalLinkIcon = IconBase([
  { tag: 'path', attrs: { d: 'M14 5h5v5' } },
  { tag: 'path', attrs: { d: 'M10 14 19 5' } },
  { tag: 'path', attrs: { d: 'M19 14v5H5V5h5' } },
])

const PlusCircleIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 8v8' } },
  { tag: 'path', attrs: { d: 'M8 12h8' } },
])

const iconMap = {
  layout: LayoutDashboardIcon,
  warehouse: WarehouseIcon,
  store: StoreIcon,
  check: CheckCircle2Icon,
  history: HistoryIcon,
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
    <div class="inventory-content">
        <section class="panel filter-bar">
          <div class="filter-group">
            <div class="filter-item">
              <span>거점</span>
              <div class="select-wrap">
                <select>
                  <option>전체 거점</option>
                  <option>인천 제1센터</option>
                  <option>인천 제2센터</option>
                  <option>용인 물류센터</option>
                  <option>매장 통합</option>
                </select>
                <ChevronDownIcon :size="12" class="select-icon" />
              </div>
            </div>

            <div class="filter-item">
              <span>카테고리</span>
              <div class="select-wrap">
                <select>
                  <option>전체 품목</option>
                  <option>전자제품</option>
                  <option>위생용품</option>
                  <option>주방잡화</option>
                  <option>문구/사무</option>
                </select>
                <ChevronDownIcon :size="12" class="select-icon" />
              </div>
            </div>

            <div class="filter-item">
              <span>상태</span>
              <div class="select-wrap">
                <select>
                  <option>전체 상태</option>
                  <option>정상 재고</option>
                  <option>재고 부족</option>
                  <option>안전 임박</option>
                  <option>품절 상태</option>
                </select>
                <ChevronDownIcon :size="12" class="select-icon" />
              </div>
            </div>

            <div class="separator" />

            <label class="search-box search-inline">
              <SearchIcon :size="14" class="search-icon" />
              <input
                v-model="searchTerm"
                type="text"
                placeholder="품목 코드 또는 품목명 검색..."
              />
            </label>
          </div>

          <button type="button" class="action-button">
            <DownloadIcon :size="14" />
            Excel 추출
          </button>
        </section>

        <section class="inventory-split">
          <div class="panel table-panel">
            <div class="table-summary">
              <div class="summary-list">
                <div v-for="stat in miniStats" :key="stat.label" class="summary-item">
                  <span class="summary-label">{{ stat.label }}</span>
                  <span class="summary-value" :class="stat.tone">{{ stat.value }}</span>
                </div>
              </div>

              <div class="summary-meta">
                <span>총 {{ filteredInventory.length }}개 품목 조회됨</span>
                <button type="button">새로고침</button>
              </div>
            </div>

            <div class="table-wrap">
              <table class="inventory-table">
                <thead>
                  <tr>
                    <th class="center narrow">품목 코드</th>
                    <th>품목명</th>
                    <th class="narrow">카테고리</th>
                    <th class="medium">현재 위치</th>
                    <th class="align-right narrow">현재고</th>
                    <th class="align-right narrow">안전재고</th>
                    <th class="align-right narrow">가용재고</th>
                    <th class="center narrow">상태</th>
                    <th class="wide">최종 업데이트</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in filteredInventory"
                    :key="row.id"
                    :class="{ selected: selectedItem?.id === row.id }"
                    @click="selectItem(row)"
                  >
                    <td class="center muted strong-small">{{ row.id }}</td>
                    <td class="strong truncate">{{ row.name }}</td>
                    <td>{{ row.cat }}</td>
                    <td class="semi-strong">{{ row.loc }}</td>
                    <td class="align-right" :class="{ faded: row.current === 0, 'strong-number': true }">
                      {{ row.current.toLocaleString() }}
                    </td>
                    <td class="align-right muted">{{ row.safety.toLocaleString() }}</td>
                    <td class="align-right strong-number brand-text">{{ row.avail.toLocaleString() }}</td>
                    <td class="center">
                      <div class="status-pill">
                        <span class="status-dot" :class="row.status" />
                        <span class="status-text" :class="row.status">{{ row.status }}</span>
                      </div>
                    </td>
                    <td class="muted strong-small">{{ row.updated }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="table-footer">
              <div class="table-meta">
                <div class="rows-control">
                  <span>표시 행 수:</span>
                  <select>
                    <option>30</option>
                    <option>50</option>
                    <option>100</option>
                  </select>
                </div>
                <span>1 - {{ filteredInventory.length }} of 1,420 entries</span>
              </div>

              <div class="pagination">
                <button type="button" class="nav-icon">
                  <ChevronLeftIcon :size="14" />
                </button>
                <button v-for="page in [1, 2, 3, '...', 48]" :key="page" type="button" :class="{ active: page === 1 }">
                  {{ page }}
                </button>
                <button type="button" class="nav-icon">
                  <ChevronRightIcon :size="14" />
                </button>
              </div>
            </div>
          </div>

          <aside v-if="selectedItem" class="panel detail-panel">
            <div class="detail-head">
              <h3>
                <InfoIcon :size="14" />
                품목 상세 정보
              </h3>
              <button type="button" class="detail-close" @click="clearSelectedItem">
                <XIcon :size="16" />
              </button>
            </div>

            <div class="detail-body">
              <section class="detail-block">
                <p class="detail-caption">공산품 마스터 데이터</p>
                <p class="detail-name">{{ selectedItem.name }}</p>
                <div class="detail-tags">
                  <span>{{ selectedItem.id }}</span>
                  <span class="blue">{{ selectedItem.cat }}</span>
                </div>
              </section>

              <section class="detail-grid">
                <div class="detail-stat">
                  <p>현재고</p>
                  <strong>{{ selectedItem.current }} EA</strong>
                </div>
                <div class="detail-stat">
                  <p>안전재고</p>
                  <strong>{{ selectedItem.safety }} EA</strong>
                </div>
              </section>

              <section class="detail-block">
                <div class="detail-row">
                  <span>가용재고 (즉시 출고)</span>
                  <strong class="brand-text">{{ selectedItem.avail }} EA</strong>
                </div>
                <div class="meter">
                  <div
                    class="meter-fill"
                    :class="selectedItem.status"
                    :style="{ width: `${Math.min((selectedItem.current / selectedItem.safety) * 100, 100)}%` }"
                  />
                </div>
                <div class="meter-labels">
                  <span>0%</span>
                  <span>목표 대비: {{ Math.round((selectedItem.current / selectedItem.safety) * 100) }}%</span>
                  <span>100%</span>
                </div>
              </section>

              <section class="detail-block bordered">
                <p class="detail-caption with-icon">
                  <HistoryIcon :size="12" />
                  재고 레벨 변화 (7D)
                </p>
                <div class="history-chart">
                  <div v-for="(height, index) in [30, 45, 40, 60, 55, 50, 42]" :key="index" class="history-column">
                    <div class="history-bar" :class="{ current: index === 6 }" :style="{ height: `${height}%` }" />
                  </div>
                </div>
                <div class="history-labels">
                  <span>04/10</span>
                  <span>오늘</span>
                </div>
              </section>

              <section class="detail-block">
                <p class="detail-caption">거점별 세부 수량</p>
                <div class="location-list">
                  <div class="location-row">
                    <span>인천 제1센터 (중앙)</span>
                    <strong>{{ Math.floor(selectedItem.current * 0.7).toLocaleString() }}</strong>
                  </div>
                  <div class="location-row">
                    <span>성수 직영점</span>
                    <strong>{{ Math.floor(selectedItem.current * 0.2).toLocaleString() }}</strong>
                  </div>
                  <div class="location-row">
                    <span>기타 보관소</span>
                    <strong>{{ Math.floor(selectedItem.current * 0.1).toLocaleString() }}</strong>
                  </div>
                </div>
              </section>
            </div>

            <div class="detail-actions">
              <button type="button" class="detail-button primary">
                <ExternalLinkIcon :size="14" />
                품목 상세 수불부 조회
              </button>
              <button type="button" class="detail-button">
                <PlusCircleIcon :size="14" />
                수동 재고 조정
              </button>
            </div>
          </aside>
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
.filter-group,
.filter-item,
.summary-list,
.summary-item,
.summary-meta,
.table-meta,
.pagination,
.rows-control,
.detail-head,
.detail-tags,
.detail-row,
.location-row,
.panel-title,
.side-nav-button,
.table-summary {
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
.pagination button,
.detail-close,
.detail-button,
.summary-meta button {
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
}

.top-nav-button:hover,
.icon-button:hover,
.user-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.side-nav-button:hover,
.action-button:hover,
.pagination button:hover,
.summary-meta button:hover {
  background: #f9fafb;
}

.top-nav-button.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border-bottom-color: #fff;
}

.topbar-actions {
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

.content {
  flex: 1;
  padding: 16px;
}

.inventory-content {
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

.filter-group {
  gap: 16px;
  flex-wrap: wrap;
}

.filter-item {
  gap: 8px;
}

.filter-item span {
  color: #9ca3af;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.select-wrap {
  position: relative;
}

.select-wrap select,
.search-inline input,
.rows-control select {
  appearance: none;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  outline: none;
  font: inherit;
}

.select-wrap select {
  min-width: 128px;
  padding: 6px 30px 6px 12px;
  font-size: 11px;
  font-weight: 700;
}

.search-box {
  position: relative;
  display: block;
}

.search-inline input {
  width: 256px;
  padding: 7px 12px 7px 32px;
  font-size: 11px;
}

.search-inline input:focus,
.select-wrap select:focus,
.rows-control select:focus {
  border-color: #004d3c;
  background: #fff;
}

.search-icon,
.select-icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-icon {
  left: 10px;
}

.select-icon {
  right: 8px;
}

.separator {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  color: #374151;
  font-size: 11px;
  font-weight: 700;
}

.inventory-split {
  display: flex;
  flex: 1;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

.table-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.table-summary {
  justify-content: space-between;
  gap: 16px;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: rgba(249, 250, 251, 0.5);
  flex-shrink: 0;
}

.summary-list {
  gap: 24px;
  flex-wrap: wrap;
}

.summary-item {
  gap: 8px;
}

.summary-label {
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.summary-value {
  color: #1f2937;
  font-size: 12px;
  font-weight: 900;
}

.summary-value.danger {
  color: #dc2626;
}

.summary-meta {
  gap: 10px;
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
}

.summary-meta button {
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
  text-decoration: underline;
}

.table-wrap {
  flex: 1;
  overflow: auto;
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.inventory-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
}

.inventory-table thead tr {
  background: #f3f4f6;
  border-bottom: 1px solid #d1d5db;
}

.inventory-table th,
.inventory-table td {
  padding: 8px 12px;
  border-right: 1px solid #f3f4f6;
  text-align: left;
  white-space: nowrap;
}

.inventory-table th:last-child,
.inventory-table td:last-child {
  border-right: 0;
}

.inventory-table th {
  color: #6b7280;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

.inventory-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
}

.inventory-table tbody tr:hover {
  background: rgba(239, 246, 255, 0.7);
}

.inventory-table tbody tr.selected {
  background: #e6efee;
}

.inventory-table td {
  color: #6b7280;
  font-size: 11px;
}

.inventory-table .narrow {
  width: 96px;
}

.inventory-table .medium {
  width: 128px;
}

.inventory-table .wide {
  width: 144px;
}

.center {
  text-align: center !important;
}

.align-right {
  text-align: right !important;
}

.strong {
  color: #1f2937 !important;
  font-size: 12px !important;
  font-weight: 900;
}

.semi-strong {
  color: #4b5563 !important;
  font-weight: 700;
}

.muted {
  color: #9ca3af !important;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
}

.strong-small {
  font-weight: 700;
}

.strong-number {
  color: #111827;
  font-size: 12px !important;
  font-weight: 900;
}

.brand-text {
  color: #004d3c !important;
}

.faded {
  color: #d1d5db !important;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 0;
}

.status-text {
  font-size: 10px;
  font-weight: 900;
}

.status-dot.정상 {
  background: #10b981;
}

.status-dot.부족 {
  background: #ef4444;
}

.status-dot.임박 {
  background: #f59e0b;
}

.status-dot.품절 {
  background: #9ca3af;
}

.status-text.정상 {
  color: #047857;
}

.status-text.부족 {
  color: #b91c1c;
}

.status-text.임박 {
  color: #b45309;
}

.status-text.품절 {
  color: #6b7280;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-top: 1px solid #d1d5db;
  background: #f9fafb;
  flex-shrink: 0;
}

.table-meta {
  gap: 16px;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
}

.rows-control {
  gap: 6px;
}

.rows-control select {
  padding: 2px 6px;
}

.pagination {
  gap: 4px;
}

.pagination button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  border: 1px solid #d1d5db;
  color: #4b5563;
  font-size: 11px;
  font-weight: 700;
}

.pagination button.active {
  border-color: #1f2937;
  background: #1f2937;
  color: #fff;
}

.nav-icon {
  padding: 0 6px;
}

.detail-panel {
  display: flex;
  flex-direction: column;
  width: 320px;
  flex-shrink: 0;
  overflow: hidden;
}

.detail-head {
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #004d3c;
  color: #fff;
}

.detail-head h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-close {
  padding: 2px;
  color: #fff;
}

.detail-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  padding: 16px;
}

.detail-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-block.bordered {
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.detail-caption {
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.detail-caption.with-icon {
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-name {
  color: #111827;
  font-size: 14px;
  font-weight: 900;
  line-height: 1.4;
}

.detail-tags {
  gap: 8px;
  flex-wrap: wrap;
}

.detail-tags span {
  padding: 2px 6px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 10px;
  font-weight: 700;
}

.detail-tags span.blue {
  border-color: #dbeafe;
  background: #eff6ff;
  color: #1d4ed8;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.detail-stat {
  padding: 8px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.detail-stat p {
  color: #9ca3af;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
}

.detail-stat strong {
  color: #111827;
  font-size: 13px;
  font-weight: 900;
}

.detail-row {
  justify-content: space-between;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
}

.meter {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
}

.meter-fill {
  height: 100%;
  background: #004d3c;
}

.meter-fill.부족,
.meter-fill.품절 {
  background: #dc2626;
}

.meter-fill.임박 {
  background: #f59e0b;
}

.meter-labels {
  display: flex;
  justify-content: space-between;
  color: #9ca3af;
  font-size: 9px;
  font-weight: 700;
}

.history-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 80px;
  padding: 8px;
  border: 1px solid #f3f4f6;
  background: #f9fafb;
}

.history-column {
  position: relative;
  flex: 1;
  height: 100%;
  background: #e5e7eb;
}

.history-bar {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: #9ca3af;
}

.history-bar.current {
  background: #004d3c;
}

.history-labels {
  display: flex;
  justify-content: space-between;
  color: #9ca3af;
  font-size: 8px;
  font-weight: 700;
}

.location-list {
  display: flex;
  flex-direction: column;
}

.location-row {
  justify-content: space-between;
  padding: 10px 4px;
  border-bottom: 1px solid #f9fafb;
  color: #4b5563;
  font-size: 11px;
  font-weight: 700;
}

.location-row strong {
  color: #111827;
  font-weight: 900;
}

.detail-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px 16px;
  background: #fff;
}

.detail-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  color: #374151;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.detail-button.primary {
  border-color: #004d3c;
  background: #004d3c;
  color: #fff;
}

@media (max-width: 1180px) {
  .inventory-split {
    flex-direction: column;
  }

  .detail-panel {
    width: 100%;
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
  .topbar-right,
  .filter-bar {
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

  .search-inline input {
    width: 100%;
  }
}
</style>
