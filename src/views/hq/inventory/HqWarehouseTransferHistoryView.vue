<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { getTransferSummaryRows } from '@/constants/hqWarehouseTransferHistoryData.js'

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

const transferHistoryRows = ref(getTransferSummaryRows())

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
        row.fromWarehouseCode,
        row.toWarehouseCode,
        row.fromWarehouseName,
        row.toWarehouseName,
        ...row.lines.map((line) => `${line.skuCode} ${line.itemName}`),
        ...row.lines.map((line) => `${line.reason || ''} ${line.memo || ''}`),
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
              placeholder="이동번호, SKU/품목, 창고명"
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
          <table class="min-w-[1320px] w-full border-collapse text-left text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="px-3 py-3 font-black">이동일시</th>
                <th class="px-3 py-3 font-black">이동번호</th>
                <th class="px-3 py-3 font-black">출발 창고</th>
                <th class="px-3 py-3 font-black">도착 창고</th>
                <th class="px-3 py-3 text-right font-black">SKU 건수</th>
                <th class="px-3 py-3 text-right font-black">총 이동수량</th>
                <th class="px-3 py-3 font-black">사유/메모 요약</th>
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
                <td class="px-3 py-3 font-bold text-gray-600">{{ row.fromWarehouseName }}</td>
                <td class="px-3 py-3 font-bold text-gray-600">{{ row.toWarehouseName }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ row.skuCount.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ row.totalQty.toLocaleString() }}</td>
                <td class="px-3 py-3">
                  <div class="flex flex-wrap gap-1">
                    <span class="inline-flex items-center bg-gray-100 px-2 py-1 text-[10px] font-black text-gray-600">사유 {{ row.reasonCount }}종</span>
                    <span class="inline-flex items-center bg-gray-100 px-2 py-1 text-[10px] font-black text-gray-600">메모 {{ row.memoCount }}건</span>
                  </div>
                </td>
                <td class="px-3 py-3 text-center">
                  <span class="inline-flex min-w-14 justify-center px-2 py-1 text-[11px] font-black" :class="statusClass(row.status)">{{ row.status }}</span>
                </td>
                <td class="px-3 py-3 font-bold text-gray-600">{{ row.requestedBy }}</td>
              </tr>

              <tr v-if="filteredRows.length === 0">
                <td colspan="9" class="px-4 py-10 text-center text-xs font-bold text-gray-400">
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
