<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const inventoryMenus = roleMenus.hq.find(menu => menu.label === '재고 관리')?.children ?? []

const activeTopMenu = computed(() => '재고 관리')
const activeSideMenu = computed(() => '창고간 재고 이동 내역')

const allRecords = [
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
    memo: '부산권 수요 증가 대응을 위해 대전 허브로 선이동 처리.',
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
    memo: '주말 행사 대비 안전재고 확보 목적.',
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
    memo: '온라인 프로모션 반응 확인 후 추가 이동 예정.',
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
    memo: '출발 창고의 출고 우선순위 변경으로 취소.',
    fromStockBefore: 0,
    toStockBefore: 45,
  },
]

const record = computed(() => allRecords.find(r => r.transferNo === route.params.transferNo) ?? null)

const fromStockAfter = computed(() => {
  if (!record.value || record.value.status === '취소') return record.value?.fromStockBefore ?? 0
  return record.value.fromStockBefore - record.value.transferQty
})

const toStockAfter = computed(() => {
  if (!record.value || record.value.status === '취소') return record.value?.toStockBefore ?? 0
  return record.value.toStockBefore + record.value.transferQty
})

const statusClass = (status) => ({
  완료: 'bg-[#EBF5F5] text-black',
  진행중: 'bg-amber-50 text-amber-700',
  취소: 'bg-red-50 text-red-700',
})[status] ?? 'bg-gray-100 text-gray-600'

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
    :active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div v-if="record" class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-5 shadow-sm">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Inventory</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">재고 이동 상세</h1>
          </div>
          <button
            type="button"
            class="h-9 border border-gray-300 px-4 text-xs font-black text-gray-700 hover:bg-gray-100"
            @click="router.push({ name: 'hq-inventory-warehouse-transfer-history' })"
          >
            목록으로
          </button>
        </div>

        <div class="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
          <div class="flex flex-1 flex-col gap-4">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex min-w-12 items-center justify-center px-2.5 py-1 text-xs font-black" :class="statusClass(record.status)">{{ record.status }}</span>
              <span class="font-mono text-xs font-bold text-gray-400">{{ record.transferNo }}</span>
            </div>

            <div class="grid gap-x-10 gap-y-4 sm:grid-cols-2">
              <div>
                <p class="text-[11px] font-bold text-gray-400">품목명</p>
                <p class="mt-0.5 text-sm font-black text-gray-900">{{ record.itemName }}</p>
              </div>
              <div>
                <p class="text-[11px] font-bold text-gray-400">SKU 코드</p>
                <p class="mt-0.5 font-mono text-sm font-bold text-gray-700">{{ record.skuCode }}</p>
              </div>
              <div>
                <p class="text-[11px] font-bold text-gray-400">이동일시</p>
                <p class="mt-0.5 text-sm font-bold text-gray-700">{{ record.requestedAt }}</p>
              </div>
              <div>
                <p class="text-[11px] font-bold text-gray-400">이동 사유</p>
                <p class="mt-0.5 text-sm font-bold text-gray-700">{{ record.reason }}</p>
              </div>
              <div>
                <p class="text-[11px] font-bold text-gray-400">담당자</p>
                <p class="mt-0.5 text-sm font-bold text-gray-700">{{ record.requestedBy }}</p>
              </div>
              <div>
                <p class="text-[11px] font-bold text-gray-400">메모</p>
                <p class="mt-0.5 whitespace-pre-wrap text-sm font-bold text-gray-700">
                  {{ record.memo || '입력된 메모가 없습니다.' }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-col items-center justify-center border border-gray-200 bg-gray-50 px-10 py-5 lg:min-w-[160px]">
            <p class="text-[11px] font-bold text-gray-400">이동 수량</p>
            <p class="mt-1 text-3xl font-black text-gray-900">{{ record.transferQty.toLocaleString() }}</p>
            <p class="text-sm font-bold text-gray-500">개</p>
          </div>
        </div>
      </section>

      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <h2 class="mb-4 text-sm font-black text-gray-900">이동 경로</h2>
        <div class="flex items-center gap-3">
          <div class="flex-1 rounded border border-gray-200 bg-gray-50 p-3">
            <p class="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">출발 창고</p>
            <p class="mt-1 text-sm font-black text-gray-900">{{ record.fromWarehouseName }}</p>
            <p class="mt-0.5 font-mono text-[11px] font-bold text-gray-400">{{ record.fromWarehouseCode }}</p>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-gray-400" aria-hidden="true">
            <path d="M5 12h14"/><polyline points="12 5 19 12 12 19"/>
          </svg>
          <div class="flex-1 rounded border border-[#D6EAEA] bg-[#EBF5F5] p-3">
            <p class="text-[10px] font-black uppercase tracking-[0.1em] text-[#004D3C]/60">도착 창고</p>
            <p class="mt-1 text-sm font-black text-gray-900">{{ record.toWarehouseName }}</p>
            <p class="mt-0.5 font-mono text-[11px] font-bold text-[#004D3C]/60">{{ record.toWarehouseCode }}</p>
          </div>
        </div>
      </section>

      <section class="border border-gray-200 bg-white shadow-sm">
        <div class="border-b border-gray-100 px-4 py-3">
          <h2 class="text-sm font-black text-gray-900">이동 전/후 재고 현황</h2>
          <p v-if="record.status === '취소'" class="mt-0.5 text-[11px] font-bold text-red-500">취소된 이동으로 재고 변동이 없습니다.</p>
          <p v-else-if="record.status === '진행중'" class="mt-0.5 text-[11px] font-bold text-amber-600">진행 중인 이동으로 이동 후 재고는 예상값입니다.</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[560px] border-collapse text-left text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="px-4 py-3 font-black">창고</th>
                <th class="px-4 py-3 font-black">코드</th>
                <th class="px-4 py-3 text-right font-black">이동 전 재고</th>
                <th class="px-4 py-3 text-right font-black">
                  <span v-if="record.status === '취소'" class="text-gray-400">이동 후 재고</span>
                  <span v-else-if="record.status === '진행중'" class="text-amber-600">이동 후 재고 (예상)</span>
                  <span v-else>이동 후 재고</span>
                </th>
                <th class="px-4 py-3 text-right font-black">변동</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr class="bg-white">
                <td class="px-4 py-3 font-black text-gray-900">{{ record.fromWarehouseName }}</td>
                <td class="px-4 py-3 font-mono text-[11px] font-bold text-gray-400">{{ record.fromWarehouseCode }}</td>
                <td class="px-4 py-3 text-right font-black text-gray-900">{{ record.fromStockBefore.toLocaleString() }}</td>
                <td class="px-4 py-3 text-right font-black text-gray-900">{{ fromStockAfter.toLocaleString() }}</td>
                <td class="px-4 py-3 text-right font-black" :class="record.status === '취소' ? 'text-gray-400' : 'text-red-600'">
                  {{ record.status === '취소' ? '±0' : `-${record.transferQty.toLocaleString()}` }}
                </td>
              </tr>
              <tr class="bg-white">
                <td class="px-4 py-3 font-black text-gray-900">{{ record.toWarehouseName }}</td>
                <td class="px-4 py-3 font-mono text-[11px] font-bold text-gray-400">{{ record.toWarehouseCode }}</td>
                <td class="px-4 py-3 text-right font-black text-gray-900">{{ record.toStockBefore.toLocaleString() }}</td>
                <td class="px-4 py-3 text-right font-black text-gray-900">{{ toStockAfter.toLocaleString() }}</td>
                <td class="px-4 py-3 text-right font-black" :class="record.status === '취소' ? 'text-gray-400' : 'text-[#004D3C]'">
                  {{ record.status === '취소' ? '±0' : `+${record.transferQty.toLocaleString()}` }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <section v-else class="border border-gray-200 bg-white p-10 text-center shadow-sm">
      <p class="text-sm font-black text-gray-700">존재하지 않는 이동 내역입니다.</p>
      <button
        type="button"
        class="mt-4 h-9 border border-gray-300 px-4 text-xs font-black text-gray-700 hover:bg-gray-100"
        @click="router.push({ name: 'hq-inventory-warehouse-transfer-history' })"
      >
        목록으로
      </button>
    </section>
  </AppLayout>
</template>
