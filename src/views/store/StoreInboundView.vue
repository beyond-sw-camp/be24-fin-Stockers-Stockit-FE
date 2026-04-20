<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CheckCircle2, ClipboardCheck, History, PackageCheck } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { storeSideMenusByTopMenu, storeTopMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const activeTopMenu = '입고 관리'
const activeSideMenu = ref('입고 리스트 조회')
const sideMenus = storeSideMenusByTopMenu[activeTopMenu]

const inboundRows = [
  { id: 'IN-20260420-01', vendor: '인천 제1물류센터', item: '고속 충전기 C타입 25W 외 2건', expectedQty: 120, arrivedQty: 120, status: '검수 대기', eta: '2026.04.20 15:00' },
  { id: 'IN-20260420-02', vendor: '용인 물류허브', item: '휴대용 가글 중 250ml', expectedQty: 80, arrivedQty: 76, status: '이상 확인', eta: '2026.04.20 16:30' },
  { id: 'IN-20260419-04', vendor: '인천 제1물류센터', item: 'A4 복사용지 80g 500매', expectedQty: 200, arrivedQty: 200, status: '입고 완료', eta: '2026.04.19 11:20' },
]

const visibleRows = computed(() => {
  if (activeSideMenu.value === '입고 검수') return inboundRows.filter((row) => row.status !== '입고 완료')
  if (activeSideMenu.value === '입고 확정 처리') return inboundRows.filter((row) => row.status === '검수 대기')
  if (activeSideMenu.value === '과거 입고 이력 조회') return inboundRows.filter((row) => row.status === '입고 완료')
  return inboundRows
})

const statusClass = {
  '검수 대기': 'bg-blue-100 text-blue-700',
  '이상 확인': 'bg-red-100 text-red-700',
  '입고 완료': 'bg-emerald-100 text-emerald-700',
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeTopMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-3">
      <section class="border border-gray-300 bg-white px-5 py-5 shadow-sm">
        <h1 class="inline-flex items-center gap-2 text-lg font-black text-gray-900">
          <PackageCheck :size="20" />
          {{ activeSideMenu }}
        </h1>
        <p class="mt-1 text-sm text-gray-500">배송 중이거나 도착한 입고 건을 확인하고 검수/확정 처리합니다.</p>
      </section>

      <section class="grid gap-3 md:grid-cols-3">
        <article class="border border-gray-300 bg-white p-5 shadow-sm">
          <p class="inline-flex items-center gap-2 text-xs font-bold text-gray-500"><ClipboardCheck :size="14" /> 검수 대기</p>
          <p class="mt-3 text-3xl font-semibold text-blue-700">1</p>
        </article>
        <article class="border border-gray-300 bg-white p-5 shadow-sm">
          <p class="inline-flex items-center gap-2 text-xs font-bold text-gray-500"><CheckCircle2 :size="14" /> 확정 가능</p>
          <p class="mt-3 text-3xl font-semibold text-[#004D3C]">1</p>
        </article>
        <article class="border border-gray-300 bg-white p-5 shadow-sm">
          <p class="inline-flex items-center gap-2 text-xs font-bold text-gray-500"><History :size="14" /> 과거 완료</p>
          <p class="mt-3 text-3xl font-semibold text-gray-900">1</p>
        </article>
      </section>

      <section class="overflow-hidden border border-gray-300 bg-white shadow-sm">
        <table class="w-full min-w-[900px] text-sm">
          <thead class="border-b border-gray-200 bg-gray-100 text-xs text-gray-500">
            <tr>
              <th class="px-4 py-3 text-left font-bold">입고 번호</th>
              <th class="px-4 py-3 text-left font-bold">출발 거점</th>
              <th class="px-4 py-3 text-left font-bold">품목</th>
              <th class="px-4 py-3 text-right font-bold">예정 수량</th>
              <th class="px-4 py-3 text-right font-bold">도착 수량</th>
              <th class="px-4 py-3 text-center font-bold">상태</th>
              <th class="px-4 py-3 text-left font-bold">도착 예정/완료</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="row in visibleRows" :key="row.id" class="hover:bg-gray-50">
              <td class="px-4 py-4 font-medium text-gray-400">{{ row.id }}</td>
              <td class="px-4 py-4 font-bold text-gray-800">{{ row.vendor }}</td>
              <td class="px-4 py-4 text-gray-700">{{ row.item }}</td>
              <td class="px-4 py-4 text-right font-bold text-gray-800">{{ row.expectedQty }}</td>
              <td class="px-4 py-4 text-right font-bold" :class="row.arrivedQty === row.expectedQty ? 'text-emerald-700' : 'text-red-700'">{{ row.arrivedQty }}</td>
              <td class="px-4 py-4 text-center"><span class="px-2 py-1 text-xs font-bold" :class="statusClass[row.status]">{{ row.status }}</span></td>
              <td class="px-4 py-4 text-gray-500">{{ row.eta }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </AppLayout>
</template>
