<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const inventoryMenus = roleMenus.hq.find(menu => menu.label === '재고 관리')?.children ?? []

const activeTopMenu = computed(() => '재고 관리')
const activeSideMenu = ref('창고간 재고 이동 내역')

const dateFrom = ref('2026-04-01')
const dateTo = ref('2026-04-30')
const selectedStatus = ref('전체')
const searchTerm = ref('')

const transferHistoryRows = ref([
  {
    transferNo: 'TRF-20260430-0012',
    skuCode: 'PRD-TOP-SH-003-NVY-L',
    itemName: '오버핏 옥스포드 셔츠',
    fromWarehouseCode: 'WH-BSN-01',
    fromWarehouseName: '부산 물류창고',
    toWarehouseCode: 'WH-DJN-01',
    toWarehouseName: '대전 허브창고',
    transferQty: 24,
    reason: '재고 불균형 해소',
    requestedBy: '김본사',
    requestedAt: '2026-04-30 09:42',
    status: '완료',
    fromStockBefore: 58,
    toStockBefore: 8,
  },
  {
    transferNo: 'TRF-20260429-0007',
    skuCode: 'PRD-OUT-PD-001-NVY-XL',
    itemName: '라이트 숏 패딩',
    fromWarehouseCode: 'WH-ICN-01',
    fromWarehouseName: '인천 제1창고',
    toWarehouseCode: 'WH-BSN-01',
    toWarehouseName: '부산 물류창고',
    transferQty: 18,
    reason: '품절 예방',
    requestedBy: '이재고',
    requestedAt: '2026-04-29 14:20',
    status: '완료',
    fromStockBefore: 56,
    toStockBefore: 5,
  },
  {
    transferNo: 'TRF-20260428-0019',
    skuCode: 'PRD-TOP-SS-001-BLK-S',
    itemName: '코튼 베이직 반팔 티셔츠',
    fromWarehouseCode: 'WH-ICN-01',
    fromWarehouseName: '인천 제1창고',
    toWarehouseCode: 'WH-ICH-01',
    toWarehouseName: '이천 풀필먼트',
    transferQty: 30,
    reason: '프로모션 대응',
    requestedBy: '박운영',
    requestedAt: '2026-04-28 11:05',
    status: '진행중',
    fromStockBefore: 128,
    toStockBefore: 22,
  },
  {
    transferNo: 'TRF-20260427-0005',
    skuCode: 'PRD-PNT-SH-002-GRY-M',
    itemName: '라이트 코튼 쇼츠',
    fromWarehouseCode: 'WH-DJN-01',
    fromWarehouseName: '대전 허브창고',
    toWarehouseCode: 'WH-ICN-01',
    toWarehouseName: '인천 제1창고',
    transferQty: 12,
    reason: '재고 불균형 해소',
    requestedBy: '최관리',
    requestedAt: '2026-04-27 16:32',
    status: '취소',
    fromStockBefore: 0,
    toStockBefore: 45,
  },
])

const statusClass = (status) => ({
  완료: 'bg-[#EBF5F5] text-black',
  진행중: 'bg-amber-50 text-amber-700',
  취소: 'bg-red-50 text-red-700',
})[status] ?? 'bg-gray-100 text-gray-600'

const filteredRows = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  return transferHistoryRows.value
    .filter((row) => {
      if (selectedStatus.value !== '전체' && row.status !== selectedStatus.value) return false

      if (!keyword) return true
      return [
        row.transferNo,
        row.skuCode,
        row.fromWarehouseName,
        row.toWarehouseName,
      ].join(' ').toLowerCase().includes(keyword)
    })
    .sort((a, b) => new Date(b.requestedAt.replace(' ', 'T')) - new Date(a.requestedAt.replace(' ', 'T')))
})

const resetFilters = () => {
  dateFrom.value = '2026-04-01'
  dateTo.value = '2026-04-30'
  selectedStatus.value = '전체'
  searchTerm.value = ''
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
    :side-menus="inventoryMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Inventory</p>
        <h1 class="mt-1 text-lg font-black text-gray-900">창고간 재고 이동 내역</h1>
        <p class="mt-1 text-xs font-bold text-gray-500">창고 간 재고 이동 이력을 조회하고 상태를 확인합니다.</p>

        <div class="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-[0.9fr_0.9fr_0.8fr_1.4fr_auto]">
          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-gray-500">시작일</span>
            <input v-model="dateFrom" type="date" class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]" />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-gray-500">종료일</span>
            <input v-model="dateTo" type="date" class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]" />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-gray-500">처리 상태</span>
            <select v-model="selectedStatus" class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]">
              <option value="전체">전체</option>
              <option value="완료">완료</option>
              <option value="진행중">진행중</option>
              <option value="취소">취소</option>
            </select>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-gray-500">검색</span>
            <input
              v-model="searchTerm"
              type="search"
              class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
              placeholder="이동번호, SKU 코드, 창고명"
            />
          </label>

          <div class="flex items-end">
            <button type="button" class="h-10 border border-gray-300 px-4 text-xs font-black text-gray-700 transition hover:bg-gray-100" @click="resetFilters">
              초기화
            </button>
          </div>
        </div>
      </section>

      <section class="border border-gray-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 class="text-sm font-black text-gray-900">이동 이력 리스트</h2>
          <p class="text-[11px] font-black text-gray-500">총 {{ filteredRows.length }}건 · 최신순</p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-[1400px] w-full border-collapse text-left text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="px-3 py-3 font-black">이동일시</th>
                <th class="px-3 py-3 font-black">이동번호</th>
                <th class="px-3 py-3 font-black">SKU 코드</th>
                <th class="px-3 py-3 font-black">품목명</th>
                <th class="px-3 py-3 font-black">출발 창고</th>
                <th class="px-3 py-3 font-black">도착 창고</th>
                <th class="px-3 py-3 text-right font-black">이동수량</th>
                <th class="px-3 py-3 font-black">사유</th>
                <th class="px-3 py-3 text-center font-black">처리상태</th>
                <th class="px-3 py-3 font-black">담당자</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="row in filteredRows"
                :key="row.transferNo"
                class="cursor-pointer hover:bg-[#EBF5F5]/60"
                @click="router.push({ name: 'hq-inventory-warehouse-transfer-history-detail', params: { transferNo: row.transferNo } })"
              >
                <td class="px-3 py-3 font-bold text-gray-600">{{ row.requestedAt }}</td>
                <td class="px-3 py-3 font-mono font-bold text-gray-700">{{ row.transferNo }}</td>
                <td class="px-3 py-3 font-mono font-bold text-gray-700">{{ row.skuCode }}</td>
                <td class="px-3 py-3 font-black text-gray-900">{{ row.itemName }}</td>
                <td class="px-3 py-3 font-bold text-gray-600">{{ row.fromWarehouseName }}</td>
                <td class="px-3 py-3 font-bold text-gray-600">{{ row.toWarehouseName }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ row.transferQty.toLocaleString() }}</td>
                <td class="px-3 py-3 font-bold text-gray-600">{{ row.reason }}</td>
                <td class="px-3 py-3 text-center">
                  <span class="inline-flex min-w-14 justify-center px-2 py-1 text-[11px] font-black" :class="statusClass(row.status)">{{ row.status }}</span>
                </td>
                <td class="px-3 py-3 font-bold text-gray-600">{{ row.requestedBy }}</td>
              </tr>

              <tr v-if="filteredRows.length === 0">
                <td colspan="10" class="px-4 py-10 text-center text-xs font-bold text-gray-400">
                  조회 조건에 맞는 이동 내역이 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>
