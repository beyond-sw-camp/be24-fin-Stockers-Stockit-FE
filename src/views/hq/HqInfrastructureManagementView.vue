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

const activeTopMenu = computed(() => '인프라 관리')
const activeSideMenu = ref('매장 정보 관리')
const selectedStore = ref(null)
const selectedWarehouse = ref(null)
const selectedMapping = ref(null)

const topMenus = [
  '대시보드',
  '재고 관리',
  '발주 관리',
  '제품 관리',
  '인프라 관리',
  '정산/통계',
]

const routeMap = {
  대시보드: '/hq/dashboard',
  '재고 관리': '/hq/inventory',
  '발주 관리': '/hq/orders',
  '제품 관리': '/hq/products',
  '인프라 관리': '/hq/infrastructure',
  '정산/통계': '/hq/analytics',
}

const infraSideMenus = [
  { label: '매장 정보 관리', icon: 'store', id: 'SO-036' },
  { label: '창고 정보 관리', icon: 'warehouse', id: 'SO-040' },
  { label: '매장-창고 매핑 설정', icon: 'link2', id: 'SO-045' },
]

const locations = ['서울', '경기', '인천', '부산', '대구']
const names = ['스톡잇 강남점', '홍대 문구센터', '판교 테크노잡화', '여의도 IFC몰점', '성수 리빙샵', '인천 터미널점', '분당 서현점', '부산 센텀점', '광교 갤러리아점', '대전 둔산점']
const managers = ['김사라', '박범수', '이선엽', '이후경', '정유진', '최진혁']
const warehouses = ['인천 제1센터', '인천 제2센터', '용인 물류센터', '부산 중앙창고']

const storeData = Array.from({ length: 32 }).map((_, i) => {
  const isExpiring = i % 7 === 0
  return {
    id: `ST-${String(i + 1).padStart(3, '0')}`,
    name: `${names[i % names.length]}${i > 9 ? ` ${Math.floor(i / 10) + 1}관` : ''}`,
    region: locations[i % locations.length],
    type: i % 3 === 0 ? '직영점' : '가맹점',
    manager: managers[i % managers.length],
    contact: `010-4821-${String(1000 + i)}`,
    warehouse: warehouses[i % warehouses.length],
    endDate: isExpiring ? '2024.05.15' : '2025.12.31',
    status: i === 15 ? '비활성' : '활성',
    isExpiring,
  }
})

const warehouseData = [
  {
    id: 'WH-001',
    name: '인천 제1센터',
    address: '인천광역시 서구 봉수대로 241',
    manager: '박범수',
    contact: '032-541-1201',
    capacity: '12,000 PLT / 6,500㎡',
    stockQty: 124582,
    occupancy: 82,
    status: '활성',
    mappedStores: ['스톡잇 강남점', '홍대 문구센터', '여의도 IFC몰점', '성수 리빙샵'],
    recentFlows: [
      { time: '16:45', type: '입고', item: '고속 충전기 25W', qty: '+500' },
      { time: '15:20', type: '출고', item: 'A4 복사용지 80g', qty: '-1,200' },
      { time: '13:10', type: '이동', item: '무선 마우스 블랙', qty: '-240' },
    ],
  },
  {
    id: 'WH-002',
    name: '인천 제2센터',
    address: '인천광역시 중구 서해대로 98',
    manager: '이후경',
    contact: '032-541-1202',
    capacity: '8,500 PLT / 4,100㎡',
    stockQty: 84550,
    occupancy: 68,
    status: '활성',
    mappedStores: ['판교 테크노잡화', '분당 서현점', '광교 갤러리아점'],
    recentFlows: [
      { time: '17:05', type: '입고', item: '절전형 멀티탭 3m', qty: '+300' },
      { time: '14:30', type: '출고', item: '기계식 키보드 청축', qty: '-80' },
      { time: '11:10', type: '출고', item: '손세정제 리필 500ml', qty: '-420' },
    ],
  },
  {
    id: 'WH-003',
    name: '용인 물류센터',
    address: '경기도 용인시 처인구 남사읍 물류로 75',
    manager: '김사라',
    contact: '031-338-4401',
    capacity: '15,000 PLT / 8,300㎡',
    stockQty: 142300,
    occupancy: 91,
    status: '포화 임박',
    mappedStores: ['성수 리빙샵', '인천 터미널점', '대전 둔산점', '부산 센텀점'],
    recentFlows: [
      { time: '16:20', type: '입고', item: '종이컵 6.5온스', qty: '+4,500' },
      { time: '15:05', type: '출고', item: '니트릴 고무장갑', qty: '-650' },
      { time: '09:40', type: '출고', item: '휴대용 가글 250ml', qty: '-320' },
    ],
  },
  {
    id: 'WH-004',
    name: '부산 중앙창고',
    address: '부산광역시 강서구 유통단지1로 55',
    manager: '이선엽',
    contact: '051-923-7701',
    capacity: '6,200 PLT / 3,200㎡',
    stockQty: 46320,
    occupancy: 44,
    status: '비활성',
    mappedStores: ['부산 센텀점'],
    recentFlows: [
      { time: '어제', type: '점검', item: '냉동 블루베리 1kg', qty: '보류' },
      { time: '어제', type: '출고', item: '무선 이어폰', qty: '-45' },
      { time: '2일 전', type: '입고', item: '유리제 머그컵 350ml', qty: '+220' },
    ],
  },
]

const isStoreMenu = computed(() => activeSideMenu.value === '매장 정보 관리')
const isWarehouseMenu = computed(() => activeSideMenu.value === '창고 정보 관리')
const isMappingMenu = computed(() => activeSideMenu.value === '매장-창고 매핑 설정')

const mappingCoverageSets = [
  ['전자제품', '문구/사무', '위생용품'],
  ['전자제품', '주방잡화'],
  ['문구/사무', '생활가전'],
  ['전자제품', '취미/레저', '주방잡화'],
  ['위생용품', '문구/사무'],
  ['생활가전', '인테리어/가구'],
]

const mappingRuleSets = [
  ['주 공급 창고 우선 배정', '재고 부족 시 백업 창고 자동 전환', '긴급 발주는 직송 검토'],
  ['오전 11시 이전 주문 당일 출고', '프로모션 상품 별도 할당'],
  ['주말 주문은 월요일 일괄 출고', '가전 품목은 별도 검수 후 이동'],
  ['백업 전환 시 리드타임 1일 추가', '고가 품목은 이중 피킹 검수'],
  ['매장 행사 기간 안전재고 20% 상향', '야간 출고 제한 규칙 적용'],
  ['취약 매장은 주 2회 고정 보충', '계절 상품은 별도 슬롯 배정'],
]

const mappingData = storeData.map((store, index) => {
  const primaryWarehouse = store.warehouse
  const backupWarehouse = warehouses[(warehouses.indexOf(primaryWarehouse) + 1) % warehouses.length]
  const highPriority = store.region === '서울' || store.region === '경기'
  const priority = index % 9 === 0 ? 'P3' : highPriority ? 'P1' : 'P2'
  const leadTime = priority === 'P1' ? (index % 4 === 0 ? '당일' : 'D+1') : priority === 'P2' ? 'D+1' : 'D+2'
  const status = store.status === '비활성' ? '점검중' : index % 11 === 0 ? '점검중' : '운영중'

  return {
    id: `MAP-${String(index + 1).padStart(3, '0')}`,
    storeId: store.id,
    storeName: store.name,
    region: store.region,
    primaryWarehouse,
    backupWarehouse,
    priority,
    leadTime,
    status,
    manager: store.manager,
    coverage: mappingCoverageSets[index % mappingCoverageSets.length],
    rules: mappingRuleSets[index % mappingRuleSets.length],
  }
})

const handleTopMenuClick = (menu) => {
  const target = routeMap[menu]
  if (target) {
    router.push(target)
  }
}

const closeDetail = () => {
  selectedStore.value = null
  selectedWarehouse.value = null
  selectedMapping.value = null
}

const handleSideMenuClick = (menu) => {
  activeSideMenu.value = menu
  closeDetail()
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

const BellIcon = IconBase([
  { tag: 'path', attrs: { d: 'M15 17H5a2 2 0 0 1-2-2c2 0 3-1 3-3V9a6 6 0 0 1 12 0v3c0 2 1 3 3 3a2 2 0 0 1-2 2h-4' } },
  { tag: 'path', attrs: { d: 'M10 17a2 2 0 0 0 4 0' } },
])
const StoreIcon = IconBase([
  { tag: 'path', attrs: { d: 'M4 10h16' } },
  { tag: 'path', attrs: { d: 'M5 10V6l2-2h10l2 2v4' } },
  { tag: 'path', attrs: { d: 'M6 10v10h12V10' } },
  { tag: 'path', attrs: { d: 'M10 20v-5h4v5' } },
])
const WarehouseIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 10.5 12 4l9 6.5' } },
  { tag: 'path', attrs: { d: 'M5 9.5V20h14V9.5' } },
  { tag: 'path', attrs: { d: 'M10 20v-5h4v5' } },
])
const Link2Icon = IconBase([
  { tag: 'path', attrs: { d: 'M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10.5 5.44' } },
  { tag: 'path', attrs: { d: 'M14 11a5 5 0 0 0-7.07 0L5.5 12.44a5 5 0 0 0 7.07 7.07L13.5 18.56' } },
])
const SearchIcon = IconBase([
  { tag: 'circle', attrs: { cx: '11', cy: '11', r: '7' } },
  { tag: 'path', attrs: { d: 'm20 20-3.5-3.5' } },
])
const PlusCircleIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 8v8' } },
  { tag: 'path', attrs: { d: 'M8 12h8' } },
])
const MapPinIcon = IconBase([
  { tag: 'path', attrs: { d: 'M12 21s-6-4.35-6-11a6 6 0 1 1 12 0c0 6.65-6 11-6 11Z' } },
  { tag: 'circle', attrs: { cx: '12', cy: '10', r: '2.5' } },
])
const DownloadIcon = IconBase([
  { tag: 'path', attrs: { d: 'M12 3v12' } },
  { tag: 'path', attrs: { d: 'm7 10 5 5 5-5' } },
  { tag: 'path', attrs: { d: 'M5 21h14' } },
])
const ChevronLeftIcon = IconBase([{ tag: 'path', attrs: { d: 'm15 18-6-6 6-6' } }])
const ChevronRightIcon = IconBase([{ tag: 'path', attrs: { d: 'm9 18 6-6-6-6' } }])
const InfoIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 10v6' } },
  { tag: 'path', attrs: { d: 'M12 7h.01' } },
])
const XIcon = IconBase([
  { tag: 'path', attrs: { d: 'M18 6 6 18' } },
  { tag: 'path', attrs: { d: 'm6 6 12 12' } },
])
const Edit3Icon = IconBase([
  { tag: 'path', attrs: { d: 'M12 20h9' } },
  { tag: 'path', attrs: { d: 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z' } },
])
const HistoryIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 12a9 9 0 1 0 3-6.7' } },
  { tag: 'path', attrs: { d: 'M3 4v5h5' } },
  { tag: 'path', attrs: { d: 'M12 7v5l3 2' } },
])
const PhoneIcon = IconBase([
  { tag: 'path', attrs: { d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.78.66 2.62a2 2 0 0 1-.45 2.11L8 9.77a16 16 0 0 0 6.23 6.23l1.32-1.32a2 2 0 0 1 2.11-.45c.84.32 1.72.54 2.62.66A2 2 0 0 1 22 16.92Z' } },
])
const AlertTriangleIcon = IconBase([
  { tag: 'path', attrs: { d: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z' } },
  { tag: 'path', attrs: { d: 'M12 9v4' } },
  { tag: 'path', attrs: { d: 'M12 17h.01' } },
])
const AlertCircleIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 8v5' } },
  { tag: 'path', attrs: { d: 'M12 16h.01' } },
])

const iconMap = {
  store: StoreIcon,
  warehouse: WarehouseIcon,
  link2: Link2Icon,
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="infraSideMenus"
    v-model:active-side-menu="activeSideMenu"
    show-system-card
    @logout="handleLogout"
  >
    <div class="infra-content">
        <section class="panel filter-bar">
          <div class="filter-left">
            <div class="filter-item">
              <span>지역 분류</span>
              <select>
                <option>전체 지역</option>
                <option>서울권역</option>
                <option>경기권역</option>
                <option>인천/충청</option>
                <option>부산/영남</option>
              </select>
            </div>
            <div class="filter-item">
              <span>운영 상태</span>
              <select>
                <option>전체</option>
                <option>{{ isWarehouseMenu ? '활성 창고' : '활성 매장' }}</option>
                <option>비활성</option>
              </select>
            </div>
            <div class="separator" />
            <label class="search-box wide-search">
              <SearchIcon :size="14" class="search-icon" />
                <input
                  type="text"
                  :placeholder="
                    isWarehouseMenu
                      ? '창고명, 창고 ID, 담당 책임자 통합 검색...'
                      : isMappingMenu
                        ? '매장명, 창고명, 매핑 ID 통합 검색...'
                        : '매장명, 매장 ID, 담당자 통합 검색...'
                  "
                />
              </label>
          </div>
          <button type="button" class="primary-button">
            <PlusCircleIcon :size="14" />
            {{
              isWarehouseMenu
                ? '신규 창고 등록 (SO-038)'
                : isMappingMenu
                  ? '신규 매핑 설정 (SO-045)'
                  : '신규 매장 등록 (SO-036)'
            }}
          </button>
        </section>

        <section v-if="activeSideMenu === '매장 정보 관리'" class="infra-split">
          <div class="panel store-panel">
            <div class="store-head">
              <div class="store-head-left">
                <h3><MapPinIcon :size="14" /> 전사 매장 마스터 정보 (SO-036)</h3>
                <span>Total: {{ storeData.length }} Locations</span>
              </div>
              <button type="button" class="ghost-button">
                <DownloadIcon :size="12" />
                목록 다운로드
              </button>
            </div>

            <div class="table-wrap">
              <table class="infra-table">
                <thead>
                  <tr>
                    <th class="w-id center">매장 ID</th>
                    <th>매장 명</th>
                    <th class="w-region center">지역</th>
                    <th class="w-type">타입</th>
                    <th class="w-manager">담당자</th>
                    <th class="w-contact">연락처</th>
                    <th class="w-warehouse">주 공급 창고</th>
                    <th class="w-end center">계약 종료일</th>
                    <th class="w-status center">상태</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="store in storeData"
                    :key="store.id"
                    :class="{ selected: selectedStore?.id === store.id }"
                    @click="selectedStore = store"
                  >
                    <td class="center muted strong-small">{{ store.id }}</td>
                    <td class="strong truncate">{{ store.name }}</td>
                    <td class="center">{{ store.region }}</td>
                    <td class="semi-strong">{{ store.type }}</td>
                    <td class="semi-strong">{{ store.manager }}</td>
                    <td>{{ store.contact }}</td>
                    <td class="warehouse-cell">{{ store.warehouse }}</td>
                    <td class="center">
                      <span class="end-date" :class="{ expiring: store.isExpiring }">{{ store.endDate }}</span>
                      <AlertTriangleIcon v-if="store.isExpiring" :size="12" class="warn-icon" />
                    </td>
                    <td class="center">
                      <span class="status-badge" :class="store.status">{{ store.status }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="table-footer">
              <span>Infrastructure Data Master / Stable Build v2.4</span>
              <div class="pagination">
                <button type="button"><ChevronLeftIcon :size="14" /></button>
                <button type="button" class="active">1</button>
                <button type="button">2</button>
                <button type="button"><ChevronRightIcon :size="14" /></button>
              </div>
            </div>
          </div>

          <aside v-if="selectedStore" class="panel detail-panel">
            <div class="detail-head">
              <h3>
                <InfoIcon :size="14" />
                매장 상세 정보 조회
              </h3>
              <button type="button" class="detail-close" @click="closeDetail">
                <XIcon :size="16" />
              </button>
            </div>

            <div class="detail-body">
              <div>
                <p class="caption">마스터 ID: {{ selectedStore.id }}</p>
                <h4>{{ selectedStore.name }}</h4>
                <div class="tag-row">
                  <span>{{ selectedStore.region }} | {{ selectedStore.type }}</span>
                </div>
              </div>

              <section class="detail-section">
                <p class="section-title">거점 운영 정보</p>
                <div class="info-grid">
                  <div>
                    <p class="label">매장 담당자</p>
                    <p class="value">{{ selectedStore.manager }} 점장</p>
                  </div>
                  <div>
                    <p class="label">대표 번호</p>
                    <p class="value with-icon"><PhoneIcon :size="10" /> {{ selectedStore.contact }}</p>
                  </div>
                  <div class="full">
                    <p class="label">공급망 배정 창고</p>
                    <p class="value green"><WarehouseIcon :size="12" /> {{ selectedStore.warehouse }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <p class="section-title">계약 유지 정보</p>
                <div class="contract-box" :class="{ expiring: selectedStore.isExpiring }">
                  <div class="contract-row">
                    <span>계약 만료 일자</span>
                    <strong :class="{ expiring: selectedStore.isExpiring }">{{ selectedStore.endDate }}</strong>
                  </div>
                  <p v-if="selectedStore.isExpiring" class="contract-alert">
                    <AlertCircleIcon :size="10" />
                    계약 종료가 임박했습니다. 담당자 협의가 필요합니다.
                  </p>
                </div>
              </section>
            </div>

            <div class="detail-actions">
              <button type="button" class="primary-button detail-action">
                <Edit3Icon :size="14" />
                정보 수정
              </button>
              <button type="button" class="ghost-button detail-action history">
                <HistoryIcon :size="14" />
                변경 이력
              </button>
            </div>
          </aside>
        </section>

        <section v-else-if="activeSideMenu === '창고 정보 관리'" class="infra-split">
          <div class="panel store-panel">
            <div class="store-head">
              <div class="store-head-left">
                <h3><WarehouseIcon :size="14" /> 전사 창고 마스터 정보 (SO-041)</h3>
                <span>Total: {{ warehouseData.length }} Warehouses</span>
              </div>
              <button type="button" class="ghost-button">
                <DownloadIcon :size="12" />
                목록 다운로드
              </button>
            </div>

            <div class="table-wrap">
              <table class="infra-table">
                <thead>
                  <tr>
                    <th class="w-id center">창고 ID</th>
                    <th class="w-warehouse-name">창고명</th>
                    <th class="w-address">주소</th>
                    <th class="w-manager">담당 책임자</th>
                    <th class="w-contact">연락처</th>
                    <th class="w-stock right">현재 재고 수량</th>
                    <th class="w-occupancy center">공간 점유율</th>
                    <th class="w-status center">상태</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="warehouse in warehouseData"
                    :key="warehouse.id"
                    :class="{ selected: selectedWarehouse?.id === warehouse.id }"
                    @click="selectedWarehouse = warehouse"
                  >
                    <td class="center muted strong-small">{{ warehouse.id }}</td>
                    <td class="strong truncate">{{ warehouse.name }}</td>
                    <td class="truncate">{{ warehouse.address }}</td>
                    <td class="semi-strong">{{ warehouse.manager }}</td>
                    <td>{{ warehouse.contact }}</td>
                    <td class="right semi-strong">{{ warehouse.stockQty.toLocaleString() }} EA</td>
                    <td class="center">
                      <div class="occupancy-wrap">
                        <span :class="{ danger: warehouse.occupancy >= 90 }">{{ warehouse.occupancy }}%</span>
                        <div class="occupancy-bar">
                          <div
                            class="occupancy-fill"
                            :class="{ warning: warehouse.occupancy >= 80, danger: warehouse.occupancy >= 90 }"
                            :style="{ width: `${warehouse.occupancy}%` }"
                          />
                        </div>
                      </div>
                    </td>
                    <td class="center">
                      <span class="status-badge" :class="warehouse.status">{{ warehouse.status }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="table-footer">
              <span>Warehouse Master / Occupancy Monitoring</span>
              <div class="pagination">
                <button type="button"><ChevronLeftIcon :size="14" /></button>
                <button type="button" class="active">1</button>
                <button type="button"><ChevronRightIcon :size="14" /></button>
              </div>
            </div>
          </div>

          <aside v-if="selectedWarehouse" class="panel detail-panel">
            <div class="detail-head">
              <h3>
                <InfoIcon :size="14" />
                창고 상세 정보 조회
              </h3>
              <button type="button" class="detail-close" @click="closeDetail">
                <XIcon :size="16" />
              </button>
            </div>

            <div class="detail-body">
              <div>
                <p class="caption">마스터 ID: {{ selectedWarehouse.id }}</p>
                <h4>{{ selectedWarehouse.name }}</h4>
                <div class="tag-row">
                  <span>{{ selectedWarehouse.status }} | {{ selectedWarehouse.capacity }}</span>
                </div>
              </div>

              <section class="detail-section">
                <p class="section-title">창고 기본 정보</p>
                <div class="info-grid">
                  <div class="full">
                    <p class="label">창고 주소</p>
                    <p class="value">{{ selectedWarehouse.address }}</p>
                  </div>
                  <div>
                    <p class="label">담당 책임자</p>
                    <p class="value">{{ selectedWarehouse.manager }}</p>
                  </div>
                  <div>
                    <p class="label">연락처</p>
                    <p class="value with-icon"><PhoneIcon :size="10" /> {{ selectedWarehouse.contact }}</p>
                  </div>
                  <div>
                    <p class="label">창고 용량</p>
                    <p class="value">{{ selectedWarehouse.capacity }}</p>
                  </div>
                  <div>
                    <p class="label">현재 재고 수량</p>
                    <p class="value green">{{ selectedWarehouse.stockQty.toLocaleString() }} EA</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <p class="section-title">공간 운영 현황</p>
                <div class="contract-box" :class="{ expiring: selectedWarehouse.occupancy >= 90 }">
                  <div class="contract-row">
                    <span>공간 점유율</span>
                    <strong :class="{ expiring: selectedWarehouse.occupancy >= 90 }">{{ selectedWarehouse.occupancy }}%</strong>
                  </div>
                  <div class="detail-occupancy-bar">
                    <div
                      class="occupancy-fill"
                      :class="{ warning: selectedWarehouse.occupancy >= 80, danger: selectedWarehouse.occupancy >= 90 }"
                      :style="{ width: `${selectedWarehouse.occupancy}%` }"
                    />
                  </div>
                  <p v-if="selectedWarehouse.occupancy >= 90" class="contract-alert">
                    <AlertCircleIcon :size="10" />
                    적재율이 높습니다. 입고 슬롯 재조정이 필요합니다.
                  </p>
                </div>
              </section>

              <section class="detail-section">
                <p class="section-title">연결 매장</p>
                <div class="list-box">
                  <div
                    v-for="storeName in selectedWarehouse.mappedStores"
                    :key="storeName"
                    class="list-row"
                  >
                    <span>{{ storeName }}</span>
                    <ChevronRightIcon :size="12" />
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <p class="section-title">최근 입출고 이력</p>
                <div class="list-box">
                  <div
                    v-for="flow in selectedWarehouse.recentFlows"
                    :key="`${flow.time}-${flow.item}`"
                    class="flow-row"
                  >
                    <div>
                      <p class="flow-title">{{ flow.item }}</p>
                      <p class="flow-meta">{{ flow.time }} · {{ flow.type }}</p>
                    </div>
                    <strong :class="{ out: String(flow.qty).startsWith('-') }">{{ flow.qty }}</strong>
                  </div>
                </div>
              </section>
            </div>

            <div class="detail-actions">
              <button type="button" class="primary-button detail-action">
                <Edit3Icon :size="14" />
                정보 수정
              </button>
              <button type="button" class="ghost-button detail-action history">
                <HistoryIcon :size="14" />
                변경 이력
              </button>
            </div>
          </aside>
        </section>

        <section v-else-if="activeSideMenu === '매장-창고 매핑 설정'" class="infra-split">
          <div class="panel store-panel">
            <div class="store-head">
              <div class="store-head-left">
                <h3><Link2Icon :size="14" /> 매장-창고 매핑 운영 현황</h3>
                <span>Total: {{ mappingData.length }} Active Rules</span>
              </div>
              <button type="button" class="ghost-button">
                <DownloadIcon :size="12" />
                설정 다운로드
              </button>
            </div>

            <div class="table-wrap">
              <table class="infra-table">
                <thead>
                  <tr>
                    <th class="w-id center">매핑 ID</th>
                    <th class="w-store-name">매장명</th>
                    <th class="w-region center">지역</th>
                    <th class="w-warehouse-name">주 공급 창고</th>
                    <th class="w-warehouse-name">백업 창고</th>
                    <th class="w-priority center">우선순위</th>
                    <th class="w-lead center">리드타임</th>
                    <th class="w-status center">상태</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="mapping in mappingData"
                    :key="mapping.id"
                    :class="{ selected: selectedMapping?.id === mapping.id }"
                    @click="selectedMapping = mapping"
                  >
                    <td class="center muted strong-small">{{ mapping.id }}</td>
                    <td class="strong truncate">{{ mapping.storeName }}</td>
                    <td class="center">{{ mapping.region }}</td>
                    <td class="semi-strong">{{ mapping.primaryWarehouse }}</td>
                    <td>{{ mapping.backupWarehouse }}</td>
                    <td class="center">
                      <span class="priority-chip" :class="mapping.priority.toLowerCase()">{{ mapping.priority }}</span>
                    </td>
                    <td class="center semi-strong">{{ mapping.leadTime }}</td>
                    <td class="center">
                      <span class="status-badge" :class="mapping.status">{{ mapping.status }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="table-footer">
              <span>Store-Warehouse Mapping Control Matrix</span>
              <div class="pagination">
                <button type="button"><ChevronLeftIcon :size="14" /></button>
                <button type="button" class="active">1</button>
                <button type="button"><ChevronRightIcon :size="14" /></button>
              </div>
            </div>
          </div>

          <aside v-if="selectedMapping" class="panel detail-panel">
            <div class="detail-head">
              <h3>
                <InfoIcon :size="14" />
                매핑 상세 설정
              </h3>
              <button type="button" class="detail-close" @click="closeDetail">
                <XIcon :size="16" />
              </button>
            </div>

            <div class="detail-body">
              <div>
                <p class="caption">매핑 ID: {{ selectedMapping.id }}</p>
                <h4>{{ selectedMapping.storeName }}</h4>
                <div class="tag-row">
                  <span>{{ selectedMapping.storeId }} | {{ selectedMapping.region }}</span>
                </div>
              </div>

              <section class="detail-section">
                <p class="section-title">공급망 연결 정보</p>
                <div class="info-grid">
                  <div class="full">
                    <p class="label">주 공급 창고</p>
                    <p class="value green"><WarehouseIcon :size="12" /> {{ selectedMapping.primaryWarehouse }}</p>
                  </div>
                  <div class="full">
                    <p class="label">백업 창고</p>
                    <p class="value"><WarehouseIcon :size="12" /> {{ selectedMapping.backupWarehouse }}</p>
                  </div>
                  <div>
                    <p class="label">우선순위</p>
                    <p class="value">{{ selectedMapping.priority }}</p>
                  </div>
                  <div>
                    <p class="label">기본 리드타임</p>
                    <p class="value">{{ selectedMapping.leadTime }}</p>
                  </div>
                  <div>
                    <p class="label">운영 담당자</p>
                    <p class="value">{{ selectedMapping.manager }}</p>
                  </div>
                  <div>
                    <p class="label">상태</p>
                    <p class="value">{{ selectedMapping.status }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <p class="section-title">적용 카테고리</p>
                <div class="chip-wrap">
                  <span v-for="category in selectedMapping.coverage" :key="category" class="coverage-chip">
                    {{ category }}
                  </span>
                </div>
              </section>

              <section class="detail-section">
                <p class="section-title">운영 규칙</p>
                <div class="list-box">
                  <div
                    v-for="rule in selectedMapping.rules"
                    :key="rule"
                    class="list-row"
                  >
                    <span>{{ rule }}</span>
                    <ChevronRightIcon :size="12" />
                  </div>
                </div>
              </section>
            </div>

            <div class="detail-actions">
              <button type="button" class="primary-button detail-action">
                <Edit3Icon :size="14" />
                설정 수정
              </button>
              <button type="button" class="ghost-button detail-action history">
                <HistoryIcon :size="14" />
                변경 이력
              </button>
            </div>
          </aside>
        </section>

        <section v-else class="panel placeholder-panel">
          <p>현재 {{ activeSideMenu }} 페이지가 준비 중입니다.</p>
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
.store-head,
.store-head-left,
.pagination,
.detail-head,
.tag-row,
.value.with-icon,
.value.green,
.contract-alert {
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
.ghost-button,
.primary-button,
.pagination button,
.detail-close {
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

.infra-content {
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

.primary-button,
.ghost-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 900;
}

.primary-button {
  background: #004d3c;
  color: #fff;
}

.ghost-button {
  border: 1px solid #d1d5db;
  color: #374151;
}

.ghost-button:hover {
  background: #f9fafb;
}

.infra-split {
  display: flex;
  flex: 1;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

.store-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.store-head {
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: rgba(249, 250, 251, 0.5);
}

.store-head-left {
  gap: 10px;
}

.store-head-left h3 {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #374151;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.store-head-left span {
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
}

.table-wrap {
  flex: 1;
  overflow: auto;
}

.infra-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.infra-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
}

.infra-table thead tr {
  border-bottom: 1px solid #d1d5db;
  background: #f3f4f6;
}

.infra-table th,
.infra-table td {
  padding: 8px 12px;
  border-right: 1px solid #f3f4f6;
  text-align: left;
  white-space: nowrap;
}

.infra-table th:last-child,
.infra-table td:last-child {
  border-right: 0;
}

.infra-table th {
  color: #6b7280;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

.infra-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
}

.infra-table tbody tr:hover {
  background: rgba(239, 246, 255, 0.7);
}

.infra-table tbody tr.selected {
  background: #e6f2f0;
}

.infra-table td {
  color: #6b7280;
  font-size: 11px;
}

.w-id { width: 96px; }
.w-region { width: 80px; }
.w-type { width: 80px; }
.w-manager { width: 96px; }
.w-contact { width: 128px; }
.w-warehouse { width: 128px; }
.w-warehouse-name { width: 148px; }
.w-address { width: 240px; }
.w-end { width: 112px; }
.w-stock { width: 136px; }
.w-occupancy { width: 132px; }
.w-store-name { width: 148px; }
.w-priority { width: 92px; }
.w-lead { width: 92px; }
.w-status { width: 80px; }

.center { text-align: center !important; }
.right { text-align: right !important; }

.muted { color: #9ca3af !important; }

.strong-small { font-weight: 700; }

.strong {
  color: #111827 !important;
  font-size: 12px !important;
  font-weight: 900;
}

.semi-strong {
  color: #4b5563 !important;
  font-weight: 700;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
}

.warehouse-cell {
  color: #4b5563;
  font-style: italic;
  font-weight: 700;
}

.end-date {
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
}

.end-date.expiring {
  color: #dc2626;
  text-decoration: underline;
}

.warn-icon {
  margin-left: 6px;
  color: #ef4444;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border: 1px solid #d1d5db;
  font-size: 10px;
  font-weight: 900;
}

.status-badge.활성 {
  border-color: #cce5e1;
  background: #e6f2f0;
  color: #004d3c;
}

.status-badge.비활성 {
  border-color: #e5e7eb;
  background: #f9fafb;
  color: #9ca3af;
}

.status-badge.포화\ 임박 {
  border-color: #fde68a;
  background: #fffbeb;
  color: #b45309;
}

.status-badge.운영중 {
  border-color: #cce5e1;
  background: #e6f2f0;
  color: #004d3c;
}

.status-badge.점검중 {
  border-color: #fde68a;
  background: #fffbeb;
  color: #b45309;
}

.priority-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  padding: 2px 6px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #4b5563;
  font-size: 10px;
  font-weight: 900;
}

.priority-chip.p1 {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.priority-chip.p2 {
  border-color: #fde68a;
  background: #fffbeb;
  color: #b45309;
}

.priority-chip.p3 {
  border-color: #d1d5db;
  background: #f9fafb;
  color: #6b7280;
}

.occupancy-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.occupancy-wrap span {
  min-width: 38px;
  color: #4b5563;
  font-size: 11px;
  font-weight: 700;
}

.occupancy-wrap span.danger {
  color: #dc2626;
}

.occupancy-bar,
.detail-occupancy-bar {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
}

.occupancy-bar {
  width: 56px;
  height: 8px;
}

.detail-occupancy-bar {
  margin-top: 10px;
  height: 10px;
}

.occupancy-fill {
  height: 100%;
  background: #004d3c;
}

.occupancy-fill.warning {
  background: #d97706;
}

.occupancy-fill.danger {
  background: #dc2626;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-top: 1px solid #d1d5db;
  background: #f9fafb;
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
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

.pagination button:hover {
  background: #f9fafb;
}

.pagination button.active {
  border-color: #1f2937;
  background: #1f2937;
  color: #fff;
}

.detail-panel {
  display: flex;
  flex-direction: column;
  width: 380px;
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
  gap: 24px;
  overflow-y: auto;
  padding: 16px;
}

.caption,
.section-title,
.label {
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.detail-body h4 {
  margin: 6px 0 10px;
  color: #111827;
  font-size: 15px;
  font-weight: 900;
}

.tag-row span {
  display: inline-flex;
  padding: 2px 6px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 10px;
  font-weight: 700;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  padding-bottom: 4px;
  border-bottom: 1px solid #f3f4f6;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 20px;
}

.info-grid .full {
  grid-column: 1 / -1;
}

.value {
  color: #1f2937;
  font-size: 12px;
  font-weight: 900;
}

.value.with-icon,
.value.green {
  gap: 6px;
}

.value.green {
  color: #004d3c;
}

.contract-box {
  padding: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.contract-box.expiring {
  border-color: #fecaca;
  background: #fef2f2;
}

.contract-row {
  display: flex;
  justify-content: space-between;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
}

.contract-row strong {
  color: #111827;
  font-weight: 900;
}

.contract-row strong.expiring {
  color: #dc2626;
}

.contract-alert {
  gap: 6px;
  margin-top: 8px;
  color: #b91c1c;
  font-size: 10px;
  font-weight: 700;
}

.detail-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 12px 16px 16px;
  background: #fff;
}

.list-box {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.coverage-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border: 1px solid #cce5e1;
  background: #e6f2f0;
  color: #004d3c;
  font-size: 10px;
  font-weight: 700;
}

.list-row,
.flow-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
}

.list-row:last-child,
.flow-row:last-child {
  border-bottom: 0;
}

.list-row {
  color: #374151;
  font-size: 11px;
  font-weight: 700;
}

.flow-title {
  color: #111827;
  font-size: 11px;
  font-weight: 900;
}

.flow-meta {
  margin-top: 2px;
  color: #9ca3af;
  font-size: 9px;
  font-weight: 700;
}

.flow-row strong {
  color: #004d3c;
  font-size: 11px;
  font-weight: 900;
}

.flow-row strong.out {
  color: #b91c1c;
}

.detail-action {
  justify-content: center;
}

.detail-action.history {
  color: #6b7280;
}

.placeholder-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  color: #9ca3af;
  font-style: italic;
}

@media (max-width: 1180px) {
  .infra-split {
    flex-direction: column;
  }

  .detail-panel {
    width: 100%;
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

  .wide-search input {
    width: 100%;
  }
}
</style>
