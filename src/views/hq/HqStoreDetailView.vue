<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

const activeTopMenu = computed(() => '인프라 관리')
const activeSideMenu = ref('매장 정보 관리')
const infraSideMenus = [
  { label: '매장 정보 관리', icon: 'store' },
  { label: '창고 정보 관리', icon: 'warehouse' },
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
    manager: managers[i % managers.length],
    contact: `010-4821-${String(1000 + i)}`,
    warehouse: warehouses[i % warehouses.length],
    endDate: isExpiring ? '2024.05.15' : '2025.12.31',
    status: i === 15 ? '비활성' : '활성',
    stockCapacity,
    remainingStock,
    remainingRate,
  }
})

const selectedStore = computed(() =>
  storeData.find((store) => store.id === String(route.params.storeId ?? '')),
)

const backQuery = computed(() => ({
  region: typeof route.query.region === 'string' ? route.query.region : undefined,
  status: typeof route.query.status === 'string' ? route.query.status : undefined,
  search: typeof route.query.search === 'string' ? route.query.search : undefined,
}))

function goBack() {
  router.push({
    name: 'hq-infrastructure',
    query: backQuery.value,
  })
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
    :side-menus="infraSideMenus"
    v-model:active-side-menu="activeSideMenu"
    show-system-card
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Store Detail</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">매장 상세 정보</h1>
            <template v-if="selectedStore">
              <p class="mt-2 text-sm font-bold text-gray-700">{{ selectedStore.name }}</p>
              <p class="mt-1 text-xs font-bold text-gray-500">{{ selectedStore.id }} · {{ selectedStore.region }}</p>
            </template>
          </div>
          <button
            type="button"
            class="h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 hover:bg-gray-50"
            @click="goBack"
          >
            목록으로
          </button>
        </div>
      </section>

      <section v-if="selectedStore" class="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <article class="border border-gray-200 bg-white p-4 shadow-sm">
          <h2 class="text-xs font-black uppercase tracking-[0.1em] text-gray-500">기본 정보</h2>
          <div class="mt-3 grid gap-2 text-xs">
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">매장 ID</span><strong class="font-black text-gray-900">{{ selectedStore.id }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">매장명</span><strong class="font-black text-gray-900">{{ selectedStore.name }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">지역</span><strong class="font-black text-gray-900">{{ selectedStore.region }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">담당자</span><strong class="font-black text-gray-900">{{ selectedStore.manager }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">연락처</span><strong class="font-black text-gray-900">{{ selectedStore.contact }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">담당 창고</span><strong class="font-black text-gray-900">{{ selectedStore.warehouse }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">계약 종료일</span><strong class="font-black" :class="selectedStore.endDate === '2024.05.15' ? 'text-red-600' : 'text-gray-900'">{{ selectedStore.endDate }}</strong></p>
          </div>
        </article>

        <article class="border border-gray-200 bg-white p-4 shadow-sm">
          <h2 class="text-xs font-black uppercase tracking-[0.1em] text-gray-500">남은 재고량</h2>
          <div class="mt-4">
            <div class="mb-2 flex items-center justify-between text-xs font-bold text-gray-600">
              <span>재고 잔여율</span>
              <strong class="text-base font-black" :class="selectedStore.remainingRate < 30 ? 'text-red-600' : 'text-gray-900'">{{ selectedStore.remainingRate }}%</strong>
            </div>
            <div class="h-3 w-full bg-gray-200">
              <div
                class="h-full"
                :class="selectedStore.remainingRate < 30 ? 'bg-red-500' : selectedStore.remainingRate < 60 ? 'bg-amber-500' : 'bg-[#0f766e]'"
                :style="{ width: `${selectedStore.remainingRate}%` }"
              />
            </div>
            <p class="mt-2 text-right text-[11px] font-bold text-gray-500">
              {{ selectedStore.remainingStock.toLocaleString() }} / {{ selectedStore.stockCapacity.toLocaleString() }} EA
            </p>
          </div>
        </article>
      </section>

      <section v-else class="border border-dashed border-gray-300 bg-white p-10 text-center text-sm font-bold text-gray-400 shadow-sm">
        존재하지 않는 매장입니다.
      </section>
    </div>
  </AppLayout>
</template>
