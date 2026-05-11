<script setup>
import { computed, h, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import {
  createInfrastructure,
  getInfrastructures,
} from '@/api/hq/infrastructure.js'

const router = useRouter()
const hqMenus = roleMenus.hq
const activeTopMenu = computed(() => '매장/창고 정보 관리')
const viewType = ref('store')
const storeRegionFilter = ref('전체 지역')
const storeStatusFilter = ref('전체')
const storeSearchTerm = ref('')
const warehouseRegionFilter = ref('전체 지역')
const warehouseStatusFilter = ref('전체')
const warehouseSearchTerm = ref('')

const storeData = ref([])
const warehouseData = ref([])
const infraError = ref('')

const storeRegionOptions = computed(() => ['전체 지역', ...new Set(storeData.value.map((store) => store.region))])
const storeStatusOptions = ['전체', '활성', '비활성']

if (!storeRegionOptions.value.includes(storeRegionFilter.value)) {
  storeRegionFilter.value = '전체 지역'
}

if (!storeStatusOptions.includes(storeStatusFilter.value)) {
  storeStatusFilter.value = '전체'
}

const filteredStoreData = computed(() => storeData.value)

const warehouseRegionOptions = computed(() => ['전체 지역', ...new Set(warehouseData.value.map((warehouse) => warehouse.region))])
const warehouseStatusOptions = ['전체', '활성', '비활성', '점검중']

if (!warehouseRegionOptions.value.includes(warehouseRegionFilter.value)) {
  warehouseRegionFilter.value = '전체 지역'
}

if (!warehouseStatusOptions.includes(warehouseStatusFilter.value)) {
  warehouseStatusFilter.value = '전체'
}

const filteredWarehouseData = computed(() => warehouseData.value)

const isStoreView = computed(() => viewType.value === 'store')
const isWarehouseView = computed(() => viewType.value === 'warehouse')
const activeSearchTerm = computed({
  get() {
    return isWarehouseView.value ? warehouseSearchTerm.value : storeSearchTerm.value
  },
  set(value) {
    if (isWarehouseView.value) {
      warehouseSearchTerm.value = value
      return
    }
    storeSearchTerm.value = value
  },
})

const goToStoreDetail = (store) => {
  router.push({
    name: 'hq-infrastructure-store-detail',
    params: { storeId: store.code },
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
    params: { warehouseId: warehouse.code },
    query: {
      region: warehouseRegionFilter.value !== '전체 지역' ? warehouseRegionFilter.value : undefined,
      status: warehouseStatusFilter.value !== '전체' ? warehouseStatusFilter.value : undefined,
      search: warehouseSearchTerm.value || undefined,
    },
  })
}

const statusToKor = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  SUSPENDED: '점검중',
}
const korToStatus = {
  활성: 'ACTIVE',
  비활성: 'INACTIVE',
  점검중: 'SUSPENDED',
}

const statusBadgeClass = (status) => {
  if (status === '활성') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
  if (status === '비활성') return 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
  if (status === '점검중') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
}

async function loadStores() {
  const status = storeStatusFilter.value === '전체' ? undefined : korToStatus[storeStatusFilter.value]
  const region = storeRegionFilter.value === '전체 지역' ? undefined : storeRegionFilter.value
  const list = await getInfrastructures({ type: 'STORE', keyword: storeSearchTerm.value || undefined, region, status })
  storeData.value = list.map((s) => ({
    code: s.code,
    id: s.code,
    name: s.name,
    region: s.region,
    type: '직영점',
    manager: s.managerName,
    contact: s.contact,
    address: s.address,
    warehouse: '-',
    status: statusToKor[s.status] ?? s.status,
    stockCapacity: 1000,
    remainingStock: 700,
    remainingRate: 70,
  }))
}

async function loadWarehouses() {
  const status = warehouseStatusFilter.value === '전체' ? undefined : korToStatus[warehouseStatusFilter.value]
  const region = warehouseRegionFilter.value === '전체 지역' ? undefined : warehouseRegionFilter.value
  const list = await getInfrastructures({ type: 'WAREHOUSE', keyword: warehouseSearchTerm.value || undefined, region, status })
  warehouseData.value = list.map((w) => ({
    code: w.code,
    id: w.code,
    name: w.name,
    region: w.region,
    address: w.address,
    manager: w.managerName,
    contact: w.contact,
    stockQty: w.mappedStoreCount * 1000,
    status: statusToKor[w.status] ?? w.status,
  }))
}

async function reloadActiveMenuData() {
  try {
    infraError.value = ''
    if (isStoreView.value) await loadStores()
    if (isWarehouseView.value) await loadWarehouses()
  } catch (e) {
    infraError.value = e.message
  }
}

watch([storeRegionFilter, storeStatusFilter, storeSearchTerm], () => {
  if (isStoreView.value) reloadActiveMenuData()
})
watch([warehouseRegionFilter, warehouseStatusFilter, warehouseSearchTerm], () => {
  if (isWarehouseView.value) reloadActiveMenuData()
})
watch(viewType, () => {
  reloadActiveMenuData()
})

async function quickCreateStore() {
  const name = prompt('매장명을 입력하세요')
  if (!name) return
  try {
    await createInfrastructure({
      locationType: 'STORE',
      name,
      region: '서울',
      managerName: '담당자',
      contact: '010-0000-0000',
      address: '서울시 강남구',
      status: 'ACTIVE',
    })
    await loadStores()
  } catch (e) {
    infraError.value = e.message
  }
}

async function quickCreateWarehouse() {
  const name = prompt('창고명을 입력하세요')
  if (!name) return
  try {
    await createInfrastructure({
      locationType: 'WAREHOUSE',
      name,
      region: '서울',
      managerName: '담당자',
      contact: '02-0000-0000',
      address: '서울시 강서구',
      status: 'ACTIVE',
    })
    await loadWarehouses()
  } catch (e) {
    infraError.value = e.message
  }
}

onMounted(() => {
  reloadActiveMenuData()
})

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

void quickCreateStore
void quickCreateWarehouse
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="[]"
    show-system-card
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="grid gap-2 xl:grid-cols-[auto_auto_auto_1fr]">
          <label class="grid gap-1">
            <span class="text-[11px] font-black text-gray-500">조회 대상</span>
            <select v-model="viewType" class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]">
              <option value="store">매장</option>
              <option value="warehouse">창고</option>
            </select>
          </label>
          <label class="grid gap-1">
            <span class="text-[11px] font-black text-gray-500">지역 분류</span>
            <select v-if="isStoreView" v-model="storeRegionFilter" class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]">
              <option v-for="region in storeRegionOptions" :key="region" :value="region">{{ region }}</option>
            </select>
            <select v-else-if="isWarehouseView" v-model="warehouseRegionFilter" class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]">
              <option v-for="region in warehouseRegionOptions" :key="region" :value="region">{{ region }}</option>
            </select>
            <select v-else class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]">
              <option>전체 지역</option>
            </select>
          </label>
          <label class="grid gap-1">
            <span class="text-[11px] font-black text-gray-500">운영 상태</span>
            <select v-if="isStoreView" v-model="storeStatusFilter" class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]">
              <option>전체</option>
              <option>활성</option>
              <option>비활성</option>
            </select>
            <select v-else-if="isWarehouseView" v-model="warehouseStatusFilter" class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]">
              <option v-for="status in warehouseStatusOptions" :key="status" :value="status">{{ status }}</option>
            </select>
            <select v-else class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]">
              <option>전체</option>
            </select>
          </label>
          <label class="relative grid gap-1">
            <span class="text-[11px] font-black text-gray-500">통합 검색</span>
            <SearchIcon :size="14" class="pointer-events-none absolute left-3 top-[35px] text-gray-400" />
            <input
              v-model="activeSearchTerm"
              type="text"
              class="h-10 border border-gray-300 bg-white pl-9 pr-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
              :placeholder="isWarehouseView ? '창고명, 창고 ID, 담당 책임자 통합 검색...' : '매장명, 매장 ID, 담당자 통합 검색...'"
            />
          </label>
        </div>
      </section>

      <p v-if="infraError" class="border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{{ infraError }}</p>

      <section v-if="isStoreView" class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <h3 class="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.08em] text-gray-700">
            <MapPinIcon :size="14" /> 전사 매장 마스터 정보 (SO-036)
          </h3>
          <span class="text-[10px] font-bold text-gray-400">Total: {{ filteredStoreData.length }} Locations</span>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="store in filteredStoreData"
            :key="store.id"
            class="cursor-pointer border border-gray-200 bg-white p-3 transition hover:border-[#004D3C]/30 hover:bg-[#EBF5F5]/40"
            @click="goToStoreDetail(store)"
          >
            <div class="mb-2 flex items-start justify-between gap-2">
              <div>
                <p class="text-[10px] font-bold text-gray-400">{{ store.id }}</p>
                <h4 class="mt-1 text-sm font-black text-gray-900">{{ store.name }}</h4>
              </div>
              <span class="inline-flex h-6 items-center px-2 text-[10px] font-black" :class="statusBadgeClass(store.status)">{{ store.status }}</span>
            </div>

            <div class="mb-2 flex items-center gap-1">
              <span class="inline-flex items-center bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">{{ store.region }}</span>
            </div>

            <p class="mb-2 line-clamp-2 text-[11px] font-bold text-gray-500">{{ store.address }}</p>

            <div class="grid gap-1 text-[11px]">
              <p class="flex items-center justify-between"><span class="font-bold text-gray-500">운영유형</span><strong class="font-black text-gray-800">{{ store.type }}</strong></p>
              <p class="flex items-center justify-between"><span class="font-bold text-gray-500">담당자</span><strong class="font-black text-gray-800">{{ store.manager }}</strong></p>
              <p class="flex items-center justify-between"><span class="font-bold text-gray-500">연락처</span><strong class="font-black text-gray-800">{{ store.contact }}</strong></p>
              <p class="flex items-center justify-between"><span class="font-bold text-gray-500">담당 창고</span><strong class="font-black text-[#0f766e]">{{ store.warehouse }}</strong></p>
            </div>
          </article>

          <div v-if="filteredStoreData.length === 0" class="col-span-full border border-dashed border-gray-200 bg-gray-50 px-3 py-8 text-center text-xs font-bold text-gray-400">
            조건에 맞는 매장 정보가 없습니다.
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <span class="text-[10px] font-bold uppercase tracking-[0.06em] text-gray-400">Infrastructure Data Master / Stable Build v2.4</span>
          <div class="flex items-center gap-1">
            <button type="button" class="inline-flex h-7 w-7 items-center justify-center border border-gray-300 text-gray-600 hover:bg-gray-50"><ChevronLeftIcon :size="14" /></button>
            <button type="button" class="inline-flex h-7 min-w-7 items-center justify-center border border-[#004D3C] bg-[#004D3C] px-2 text-[11px] font-black text-white">1</button>
            <button type="button" class="inline-flex h-7 min-w-7 items-center justify-center border border-gray-300 px-2 text-[11px] font-black text-gray-600 hover:bg-gray-50">2</button>
            <button type="button" class="inline-flex h-7 w-7 items-center justify-center border border-gray-300 text-gray-600 hover:bg-gray-50"><ChevronRightIcon :size="14" /></button>
          </div>
        </div>
      </section>

      <section v-else-if="isWarehouseView" class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <h3 class="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.08em] text-gray-700">
            <WarehouseIcon :size="14" /> 전사 창고 마스터 정보 (SO-041)
          </h3>
          <span class="text-[10px] font-bold text-gray-400">Total: {{ filteredWarehouseData.length }} Warehouses</span>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="warehouse in filteredWarehouseData"
            :key="warehouse.id"
            class="cursor-pointer border border-gray-200 bg-white p-3 transition hover:border-[#004D3C]/30 hover:bg-[#EBF5F5]/40"
            @click="goToWarehouseDetail(warehouse)"
          >
            <div class="mb-2 flex items-start justify-between gap-2">
              <div>
                <p class="text-[10px] font-bold text-gray-400">{{ warehouse.id }}</p>
                <h4 class="mt-1 text-sm font-black text-gray-900">{{ warehouse.name }}</h4>
              </div>
              <span class="inline-flex h-6 items-center px-2 text-[10px] font-black" :class="statusBadgeClass(warehouse.status)">{{ warehouse.status }}</span>
            </div>

            <p class="mb-2 line-clamp-2 text-[11px] font-bold text-gray-500">{{ warehouse.address }}</p>

            <div class="grid gap-1 text-[11px]">
              <p class="flex items-center justify-between"><span class="font-bold text-gray-500">담당 책임자</span><strong class="font-black text-gray-800">{{ warehouse.manager }}</strong></p>
              <p class="flex items-center justify-between"><span class="font-bold text-gray-500">연락처</span><strong class="font-black text-gray-800">{{ warehouse.contact }}</strong></p>
              <p class="flex items-center justify-between"><span class="font-bold text-gray-500">현재 재고 수량</span><strong class="font-black text-[#0f766e]">{{ warehouse.stockQty.toLocaleString() }} EA</strong></p>
            </div>
          </article>

          <div v-if="filteredWarehouseData.length === 0" class="col-span-full border border-dashed border-gray-200 bg-gray-50 px-3 py-8 text-center text-xs font-bold text-gray-400">
            조건에 맞는 창고 정보가 없습니다.
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
          <span class="text-[10px] font-bold uppercase tracking-[0.06em] text-gray-400">Warehouse Master / Occupancy Monitoring</span>
          <div class="flex items-center gap-1">
            <button type="button" class="inline-flex h-7 w-7 items-center justify-center border border-gray-300 text-gray-600 hover:bg-gray-50"><ChevronLeftIcon :size="14" /></button>
            <button type="button" class="inline-flex h-7 min-w-7 items-center justify-center border border-[#004D3C] bg-[#004D3C] px-2 text-[11px] font-black text-white">1</button>
            <button type="button" class="inline-flex h-7 w-7 items-center justify-center border border-gray-300 text-gray-600 hover:bg-gray-50"><ChevronRightIcon :size="14" /></button>
          </div>
        </div>
      </section>

      <section v-else class="border border-dashed border-gray-300 bg-white p-10 text-center text-sm font-bold text-gray-400 shadow-sm">
        <p>현재 페이지가 준비 중입니다.</p>
      </section>
    </div>
  </AppLayout>
</template>
