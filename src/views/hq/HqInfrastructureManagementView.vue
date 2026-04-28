<script setup>
import { computed, h, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const brandColor = '#004D3C'
const brandColorLight = '#E6F2F0'

const activeTopMenu = computed(() => '인프라 관리')
const menuLabels = ['매장 정보 관리', '창고 정보 관리']
const activeSideMenu = ref(
  typeof route.query.menu === 'string' && menuLabels.includes(route.query.menu)
    ? route.query.menu
    : '매장 정보 관리',
)
const storeRegionFilter = ref(typeof route.query.region === 'string' ? route.query.region : '전체 지역')
const storeStatusFilter = ref(typeof route.query.status === 'string' ? route.query.status : '전체')
const storeSearchTerm = ref(typeof route.query.search === 'string' ? route.query.search : '')
const warehouseRegionFilter = ref(typeof route.query.region === 'string' ? route.query.region : '전체 지역')
const warehouseStatusFilter = ref(typeof route.query.status === 'string' ? route.query.status : '전체')
const warehouseSearchTerm = ref(typeof route.query.search === 'string' ? route.query.search : '')

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
  '재고 관리': '/hq/inventory/company-wide',
  '발주 관리': '/hq/orders',
  '제품 관리': '/hq/products',
  '인프라 관리': '/hq/infrastructure',
  '정산/통계': '/hq/analytics',
}

const infraSideMenus = [
  { label: '매장 정보 관리', icon: 'store', id: 'SO-036' },
  { label: '창고 정보 관리', icon: 'warehouse', id: 'SO-040' },
]

const locations = ['서울', '경기', '인천', '부산', '대구']
const names = ['스톡잇 강남점', '홍대 문구센터', '판교 테크노잡화', '여의도 IFC몰점', '성수 리빙샵', '인천 터미널점', '분당 서현점', '부산 센텀점', '광교 갤러리아점', '대전 둔산점']
const managers = ['김사라', '박범수', '이선엽', '이후경', '정유진', '최진혁']
const warehouses = ['인천 제1센터', '인천 제2센터', '용인 물류센터', '부산 중앙창고']

const storeData = Array.from({ length: 32 }).map((_, i) => {
  const isExpiring = i % 7 === 0
  const stockCapacity = 1200 + (i % 5) * 300
  const remainingStock = 240 + (i * 77) % 1200
  const remainingRate = Math.min(100, Math.round((remainingStock / stockCapacity) * 100))
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
    stockCapacity,
    remainingStock,
    remainingRate,
  }
})

const storeRegionOptions = computed(() => ['전체 지역', ...new Set(storeData.map((store) => store.region))])
const storeStatusOptions = ['전체', '활성', '비활성']

if (!storeRegionOptions.value.includes(storeRegionFilter.value)) {
  storeRegionFilter.value = '전체 지역'
}

if (!storeStatusOptions.includes(storeStatusFilter.value)) {
  storeStatusFilter.value = '전체'
}

const filteredStoreData = computed(() => {
  const keyword = storeSearchTerm.value.trim().toLowerCase()

  return storeData.filter((store) => {
    const matchesRegion = storeRegionFilter.value === '전체 지역' || store.region === storeRegionFilter.value
    const matchesStatus = storeStatusFilter.value === '전체' || store.status === storeStatusFilter.value
    const matchesKeyword = !keyword || [store.id, store.name, store.manager, store.contact, store.warehouse]
      .join(' ')
      .toLowerCase()
      .includes(keyword)

    return matchesRegion && matchesStatus && matchesKeyword
  })
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

const warehouseRegionOptions = computed(() => ['전체 지역', ...new Set(warehouseData.map((warehouse) => warehouse.address.split(' ')[0].replace('광역시', '').replace('특별시', '')))])
const warehouseStatusOptions = ['전체', '활성', '비활성', '포화 임박']

if (!warehouseRegionOptions.value.includes(warehouseRegionFilter.value)) {
  warehouseRegionFilter.value = '전체 지역'
}

if (!warehouseStatusOptions.includes(warehouseStatusFilter.value)) {
  warehouseStatusFilter.value = '전체'
}

const filteredWarehouseData = computed(() => {
  const keyword = warehouseSearchTerm.value.trim().toLowerCase()

  return warehouseData.filter((warehouse) => {
    const region = warehouse.address.split(' ')[0].replace('광역시', '').replace('특별시', '')
    const matchesRegion = warehouseRegionFilter.value === '전체 지역' || region === warehouseRegionFilter.value
    const matchesStatus = warehouseStatusFilter.value === '전체' || warehouse.status === warehouseStatusFilter.value
    const matchesKeyword = !keyword || [warehouse.id, warehouse.name, warehouse.manager, warehouse.contact, warehouse.address]
      .join(' ')
      .toLowerCase()
      .includes(keyword)

    return matchesRegion && matchesStatus && matchesKeyword
  })
})

const isStoreMenu = computed(() => activeSideMenu.value === '매장 정보 관리')
const isWarehouseMenu = computed(() => activeSideMenu.value === '창고 정보 관리')
const activeSearchTerm = computed({
  get() {
    return isWarehouseMenu.value ? warehouseSearchTerm.value : storeSearchTerm.value
  },
  set(value) {
    if (isWarehouseMenu.value) {
      warehouseSearchTerm.value = value
      return
    }
    storeSearchTerm.value = value
  },
})

const handleTopMenuClick = (menu) => {
  const target = routeMap[menu]
  if (target) {
    router.push(target)
  }
}

const goToStoreDetail = (store) => {
  router.push({
    name: 'hq-infrastructure-store-detail',
    params: { storeId: store.id },
    query: {
      region: storeRegionFilter.value !== '전체 지역' ? storeRegionFilter.value : undefined,
      status: storeStatusFilter.value !== '전체' ? storeStatusFilter.value : undefined,
      search: storeSearchTerm.value || undefined,
    },
  })
}

const goToWarehouseDetail = (warehouse) => {
  router.push({
    name: 'hq-infrastructure-warehouse-detail',
    params: { warehouseId: warehouse.id },
    query: {
      menu: '창고 정보 관리',
      region: warehouseRegionFilter.value !== '전체 지역' ? warehouseRegionFilter.value : undefined,
      status: warehouseStatusFilter.value !== '전체' ? warehouseStatusFilter.value : undefined,
      search: warehouseSearchTerm.value || undefined,
    },
  })
}

watch(
  () => route.query.menu,
  (menu) => {
    if (typeof menu === 'string' && menuLabels.includes(menu)) {
      activeSideMenu.value = menu
    }
  },
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
const SearchIcon = IconBase([
  { tag: 'circle', attrs: { cx: '11', cy: '11', r: '7' } },
  { tag: 'path', attrs: { d: 'm20 20-3.5-3.5' } },
])
const MapPinIcon = IconBase([
  { tag: 'path', attrs: { d: 'M12 21s-6-4.35-6-11a6 6 0 1 1 12 0c0 6.65-6 11-6 11Z' } },
  { tag: 'circle', attrs: { cx: '12', cy: '10', r: '2.5' } },
])
const ChevronLeftIcon = IconBase([{ tag: 'path', attrs: { d: 'm15 18-6-6 6-6' } }])
const ChevronRightIcon = IconBase([{ tag: 'path', attrs: { d: 'm9 18 6-6-6-6' } }])

const iconMap = {
  store: StoreIcon,
  warehouse: WarehouseIcon,
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
              <select v-if="isStoreMenu" v-model="storeRegionFilter">
                <option v-for="region in storeRegionOptions" :key="region" :value="region">
                  {{ region }}
                </option>
              </select>
              <select v-else-if="isWarehouseMenu" v-model="warehouseRegionFilter">
                <option v-for="region in warehouseRegionOptions" :key="region" :value="region">
                  {{ region }}
                </option>
              </select>
              <select v-else>
                <option>전체 지역</option>
                <option>서울권역</option>
                <option>경기권역</option>
                <option>인천/충청</option>
                <option>부산/영남</option>
              </select>
            </div>
            <div class="filter-item">
              <span>운영 상태</span>
              <select v-if="isStoreMenu" v-model="storeStatusFilter">
                <option>전체</option>
                <option>활성</option>
                <option>비활성</option>
              </select>
              <select v-else-if="isWarehouseMenu" v-model="warehouseStatusFilter">
                <option v-for="status in warehouseStatusOptions" :key="status" :value="status">
                  {{ status }}
                </option>
              </select>
              <select v-else>
                <option>전체</option>
                <option>{{ isWarehouseMenu ? '활성 창고' : '활성 매장' }}</option>
                <option>비활성</option>
              </select>
            </div>
            <div class="separator" />
              <label class="search-box wide-search">
              <SearchIcon :size="14" class="search-icon" />
                <input
                  v-model="activeSearchTerm"
                  type="text"
                  :placeholder="
                    isWarehouseMenu
                      ? '창고명, 창고 ID, 담당 책임자 통합 검색...'
                      : '매장명, 매장 ID, 담당자 통합 검색...'
                  "
                />
              </label>
          </div>
        </section>

        <section v-if="activeSideMenu === '매장 정보 관리'" class="panel store-panel">
            <div class="store-head">
              <div class="store-head-left">
                <h3 class="text-[11px] font-black uppercase tracking-[0.08em] text-gray-700">
                  <MapPinIcon :size="14" /> 전사 매장 마스터 정보 (SO-036)
                </h3>
                <span class="text-[10px] font-bold text-gray-400">Total: {{ filteredStoreData.length }} Locations</span>
              </div>
            </div>

            <div class="store-card-grid">
              <article
                v-for="store in filteredStoreData"
                :key="store.id"
                class="store-card cursor-pointer hover:bg-[#EBF5F5]/40"
                @click="goToStoreDetail(store)"
              >
                <div class="store-card-head">
                  <div>
                    <p class="text-[10px] font-bold text-gray-400">{{ store.id }}</p>
                    <h4 class="mt-1 text-sm font-black text-gray-900">{{ store.name }}</h4>
                  </div>
                  <span class="status-badge" :class="store.status">{{ store.status }}</span>
                </div>

                <div class="flex items-center gap-1">
                  <span class="inline-flex items-center bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">{{ store.region }}</span>
                </div>

                <p class="text-[11px] font-bold text-gray-600">
                  담당 창고: <span class="text-gray-800">{{ store.warehouse }}</span>
                </p>

                <div class="store-stock-graph">
                  <div class="store-stock-head">
                    <span>남은 재고량</span>
                    <strong :class="{ low: store.remainingRate < 30 }">{{ store.remainingRate }}%</strong>
                  </div>
                  <div class="store-stock-track">
                    <div
                      class="store-stock-fill"
                      :class="{ low: store.remainingRate < 30, caution: store.remainingRate >= 30 && store.remainingRate < 60 }"
                      :style="{ width: `${store.remainingRate}%` }"
                    />
                  </div>
                  <p class="store-stock-meta">
                    {{ store.remainingStock.toLocaleString() }} / {{ store.stockCapacity.toLocaleString() }} EA
                  </p>
                </div>
              </article>

              <div v-if="filteredStoreData.length === 0" class="store-empty">
                조건에 맞는 매장 정보가 없습니다.
              </div>
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
        </section>

        <section v-else-if="activeSideMenu === '창고 정보 관리'" class="panel store-panel">
            <div class="store-head">
              <div class="store-head-left">
                <h3><WarehouseIcon :size="14" /> 전사 창고 마스터 정보 (SO-041)</h3>
                <span>Total: {{ filteredWarehouseData.length }} Warehouses</span>
              </div>
            </div>

            <div class="store-card-grid">
              <article
                v-for="warehouse in filteredWarehouseData"
                :key="warehouse.id"
                class="store-card warehouse-card cursor-pointer hover:bg-[#EBF5F5]/40"
                @click="goToWarehouseDetail(warehouse)"
              >
                <div class="store-card-head">
                  <div>
                    <p class="text-[10px] font-bold text-gray-400">{{ warehouse.id }}</p>
                    <h4 class="mt-1 text-sm font-black text-gray-900">{{ warehouse.name }}</h4>
                  </div>
                  <span class="status-badge" :class="warehouse.status">{{ warehouse.status }}</span>
                </div>

                <p class="warehouse-address">{{ warehouse.address }}</p>

                <div class="warehouse-meta-grid">
                  <p class="warehouse-meta-row">
                    <span>담당 책임자</span>
                    <strong>{{ warehouse.manager }}</strong>
                  </p>
                  <p class="warehouse-meta-row">
                    <span>연락처</span>
                    <strong>{{ warehouse.contact }}</strong>
                  </p>
                  <p class="warehouse-meta-row full">
                    <span>현재 재고 수량</span>
                    <strong class="text-[#0f766e]">{{ warehouse.stockQty.toLocaleString() }} EA</strong>
                  </p>
                </div>

                <div class="store-stock-graph">
                  <div class="store-stock-head">
                    <span>공간 점유율</span>
                    <strong :class="{ low: warehouse.occupancy >= 90 }">{{ warehouse.occupancy }}%</strong>
                  </div>
                  <div class="store-stock-track">
                    <div
                      class="store-stock-fill"
                      :class="{ caution: warehouse.occupancy >= 80 && warehouse.occupancy < 90, low: warehouse.occupancy >= 90 }"
                      :style="{ width: `${warehouse.occupancy}%` }"
                    />
                  </div>
                  <p class="store-stock-meta">{{ warehouse.capacity }}</p>
                </div>
              </article>

              <div v-if="filteredWarehouseData.length === 0" class="store-empty">
                조건에 맞는 창고 정보가 없습니다.
              </div>
            </div>

            <div class="table-footer">
              <span>Warehouse Master / Occupancy Monitoring</span>
              <div class="pagination">
                <button type="button"><ChevronLeftIcon :size="14" /></button>
                <button type="button" class="active">1</button>
                <button type="button"><ChevronRightIcon :size="14" /></button>
              </div>
            </div>
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
  font-size: 12px;
  font-weight: 800;
}

.store-head-left span {
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
}

.store-card-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  padding: 12px;
  overflow: auto;
}

.store-card {
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.warehouse-card {
  gap: 12px;
}

.warehouse-address {
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
}

.warehouse-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 12px;
}

.warehouse-meta-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.warehouse-meta-row.full {
  grid-column: 1 / -1;
}

.warehouse-meta-row span {
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
}

.warehouse-meta-row strong {
  color: #1f2937;
  font-size: 11px;
  font-weight: 800;
}

.store-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.store-stock-graph {
  margin-top: 2px;
}

.store-stock-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
}

.store-stock-head strong {
  color: #111827;
  font-size: 12px;
  font-weight: 900;
}

.store-stock-head strong.low {
  color: #dc2626;
}

.store-stock-track {
  margin-top: 6px;
  height: 8px;
  width: 100%;
  background: #e5e7eb;
  overflow: hidden;
}

.store-stock-fill {
  height: 100%;
  background: #0f766e;
}

.store-stock-fill.caution {
  background: #d97706;
}

.store-stock-fill.low {
  background: #dc2626;
}

.store-stock-meta {
  margin-top: 6px;
  color: #6b7280;
  font-size: 10px;
  font-weight: 700;
  text-align: right;
}

.store-empty {
  grid-column: 1 / -1;
  border: 1px dashed #d1d5db;
  background: #f9fafb;
  padding: 28px 12px;
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
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
  font-size: 11px;
  font-weight: 700;
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
