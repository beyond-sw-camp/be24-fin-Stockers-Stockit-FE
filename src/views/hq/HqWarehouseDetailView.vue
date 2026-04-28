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
const activeSideMenu = ref('창고 정보 관리')
const infraSideMenus = [
  { label: '매장 정보 관리', icon: 'store' },
  { label: '창고 정보 관리', icon: 'warehouse' },
]

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

const selectedWarehouse = computed(() =>
  warehouseData.find((warehouse) => warehouse.id === String(route.params.warehouseId ?? '')),
)

const backQuery = computed(() => ({
  menu: '창고 정보 관리',
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
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Warehouse Detail</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">창고 상세 정보</h1>
            <template v-if="selectedWarehouse">
              <p class="mt-2 text-sm font-bold text-gray-700">{{ selectedWarehouse.name }}</p>
              <p class="mt-1 text-xs font-bold text-gray-500">{{ selectedWarehouse.id }}</p>
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

      <section v-if="selectedWarehouse" class="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <article class="border border-gray-200 bg-white p-4 shadow-sm">
          <h2 class="text-xs font-black uppercase tracking-[0.1em] text-gray-500">기본 정보</h2>
          <div class="mt-3 grid gap-2 text-xs">
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">창고 ID</span><strong class="font-black text-gray-900">{{ selectedWarehouse.id }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">창고명</span><strong class="font-black text-gray-900">{{ selectedWarehouse.name }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">주소</span><strong class="font-black text-gray-900">{{ selectedWarehouse.address }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">담당 책임자</span><strong class="font-black text-gray-900">{{ selectedWarehouse.manager }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">연락처</span><strong class="font-black text-gray-900">{{ selectedWarehouse.contact }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">창고 용량</span><strong class="font-black text-gray-900">{{ selectedWarehouse.capacity }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">상태</span><strong class="font-black text-gray-900">{{ selectedWarehouse.status }}</strong></p>
          </div>
        </article>

        <article class="border border-gray-200 bg-white p-4 shadow-sm">
          <h2 class="text-xs font-black uppercase tracking-[0.1em] text-gray-500">공간 점유율 / 현재 재고</h2>
          <div class="mt-4">
            <div class="mb-2 flex items-center justify-between text-xs font-bold text-gray-600">
              <span>공간 점유율</span>
              <strong class="text-base font-black" :class="selectedWarehouse.occupancy >= 90 ? 'text-red-600' : 'text-gray-900'">{{ selectedWarehouse.occupancy }}%</strong>
            </div>
            <div class="h-3 w-full bg-gray-200">
              <div
                class="h-full"
                :class="selectedWarehouse.occupancy >= 90 ? 'bg-red-500' : selectedWarehouse.occupancy >= 80 ? 'bg-amber-500' : 'bg-[#0f766e]'"
                :style="{ width: `${selectedWarehouse.occupancy}%` }"
              />
            </div>
            <p class="mt-2 text-right text-[11px] font-bold text-gray-500">
              현재 재고 {{ selectedWarehouse.stockQty.toLocaleString() }} EA
            </p>
          </div>
        </article>

        <article class="border border-gray-200 bg-white p-4 shadow-sm">
          <h2 class="text-xs font-black uppercase tracking-[0.1em] text-gray-500">연결 매장</h2>
          <ul class="mt-3 space-y-2">
            <li
              v-for="storeName in selectedWarehouse.mappedStores"
              :key="storeName"
              class="border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700"
            >
              {{ storeName }}
            </li>
          </ul>
        </article>

        <article class="border border-gray-200 bg-white p-4 shadow-sm">
          <h2 class="text-xs font-black uppercase tracking-[0.1em] text-gray-500">최근 입출고 이력</h2>
          <ul class="mt-3 space-y-2">
            <li
              v-for="flow in selectedWarehouse.recentFlows"
              :key="`${flow.time}-${flow.item}`"
              class="flex items-center justify-between border border-gray-200 bg-gray-50 px-3 py-2 text-xs"
            >
              <div>
                <p class="font-black text-gray-800">{{ flow.item }}</p>
                <p class="mt-1 font-bold text-gray-500">{{ flow.time }} · {{ flow.type }}</p>
              </div>
              <strong :class="String(flow.qty).startsWith('-') ? 'text-red-600' : 'text-[#0f766e]'" class="font-black">
                {{ flow.qty }}
              </strong>
            </li>
          </ul>
        </article>
      </section>

      <section v-else class="border border-dashed border-gray-300 bg-white p-10 text-center text-sm font-bold text-gray-400 shadow-sm">
        존재하지 않는 창고입니다.
      </section>
    </div>
  </AppLayout>
</template>
