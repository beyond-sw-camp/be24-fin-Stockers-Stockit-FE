<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useSalesStore } from '@/stores/sales.js'

const router = useRouter()
const auth = useAuthStore()
const sales = useSalesStore()

const storeMenus = roleMenus.store
const statsMenus = roleMenus.store.find((menu) => menu.label === '통계')?.children ?? []
const activeTopMenu = computed(() => '통계')
const activeSideMenu = ref('매출 조회')

const keyword = ref('')
const category = ref('전체')
const status = ref('전체')
const sortBy = ref('latest')

const now = new Date()
const lastWeek = new Date(now)
lastWeek.setDate(now.getDate() - 6)

const pad = (v) => String(v).padStart(2, '0')
const dateToInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const startDate = ref(dateToInput(lastWeek))
const endDate = ref(dateToInput(now))

const salesRows = computed(() => {
  const liveRows = sales.sales.flatMap((sale) => {
    return sale.items.map((item, idx) => {
      const hash = [...`${sale.saleId}-${item.skuId}-${idx}`].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
      const mockStatus = hash % 13 === 0 ? '취소' : hash % 7 === 0 ? '환불' : '완료'
      return {
        soldAt: sale.soldAt,
        soldDate: sale.soldAt.slice(0, 10),
        saleId: sale.saleId,
        productName: item.productName,
        category: item.mainCategory,
        subCategory: item.subCategory,
        status: mockStatus,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.lineAmount,
      }
    })
  })

  if (liveRows.length > 0) return liveRows

  return [
    { soldAt: '2026-04-28T09:12:00', soldDate: '2026-04-28', saleId: 'SALE-20260428-001', productName: '오버핏 코튼 티셔츠', category: '상의', subCategory: '반팔티', status: '완료', quantity: 3, unitPrice: 24000, amount: 72000 },
    { soldAt: '2026-04-28T11:35:00', soldDate: '2026-04-28', saleId: 'SALE-20260428-002', productName: '슬림 데님 팬츠', category: '하의', subCategory: '데님', status: '완료', quantity: 2, unitPrice: 48000, amount: 96000 },
    { soldAt: '2026-04-27T15:40:00', soldDate: '2026-04-27', saleId: 'SALE-20260427-004', productName: '린넨 블렌드 셔츠', category: '상의', subCategory: '셔츠', status: '환불', quantity: 1, unitPrice: 52000, amount: 52000 },
    { soldAt: '2026-04-27T18:22:00', soldDate: '2026-04-27', saleId: 'SALE-20260427-006', productName: '라운드 니트 가디건', category: '아우터', subCategory: '가디건', status: '완료', quantity: 2, unitPrice: 88000, amount: 176000 },
    { soldAt: '2026-04-26T13:05:00', soldDate: '2026-04-26', saleId: 'SALE-20260426-003', productName: '캔버스 토트백', category: '잡화', subCategory: '가방', status: '취소', quantity: 1, unitPrice: 36000, amount: 36000 },
    { soldAt: '2026-04-25T10:17:00', soldDate: '2026-04-25', saleId: 'SALE-20260425-007', productName: '와이드 코튼 팬츠', category: '하의', subCategory: '코튼팬츠', status: '완료', quantity: 4, unitPrice: 39000, amount: 156000 },
    { soldAt: '2026-04-24T14:58:00', soldDate: '2026-04-24', saleId: 'SALE-20260424-005', productName: '베이직 레이어드 롱슬리브', category: '상의', subCategory: '긴팔티', status: '완료', quantity: 3, unitPrice: 27000, amount: 81000 },
    { soldAt: '2026-04-23T16:11:00', soldDate: '2026-04-23', saleId: 'SALE-20260423-002', productName: '플리츠 롱 스커트', category: '하의', subCategory: '스커트', status: '완료', quantity: 2, unitPrice: 46000, amount: 92000 },
  ]
})

const categoryOptions = computed(() => ['전체', ...new Set(salesRows.value.map((r) => r.category))])

const filteredRows = computed(() => {
  const start = startDate.value ? new Date(`${startDate.value}T00:00:00`) : null
  const end = endDate.value ? new Date(`${endDate.value}T23:59:59`) : null
  const q = keyword.value.trim().toLowerCase()

  let rows = salesRows.value.filter((row) => {
    const sold = new Date(row.soldAt)
    const matchDate = (!start || sold >= start) && (!end || sold <= end)
    const matchCategory = category.value === '전체' || row.category === category.value
    const matchStatus = status.value === '전체' || row.status === status.value
    const matchKeyword = !q || [row.saleId, row.productName].join(' ').toLowerCase().includes(q)
    return matchDate && matchCategory && matchStatus && matchKeyword
  })

  if (sortBy.value === 'amount') {
    rows = rows.sort((a, b) => b.amount - a.amount)
  } else if (sortBy.value === 'quantity') {
    rows = rows.sort((a, b) => b.quantity - a.quantity)
  } else {
    rows = rows.sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt))
  }

  return rows
})

const totalAmount = computed(() => filteredRows.value.reduce((sum, row) => sum + row.amount, 0))
const totalQty = computed(() => filteredRows.value.reduce((sum, row) => sum + row.quantity, 0))
const totalCount = computed(() => filteredRows.value.length)

function statusClass(v) {
  if (v === '완료') return 'bg-emerald-50 text-emerald-700'
  if (v === '환불') return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-700'
}

function formatDateTime(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeMenus"
    :side-menus="statsMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Sales Table</p>
        <h1 class="mt-1 text-lg font-black text-gray-900">매출 조회</h1>
        <p class="mt-1 text-xs font-bold text-gray-500">기간/카테고리/상태/키워드로 매출을 필터링해 표로 조회합니다.</p>
      </section>

      <section class="grid gap-3 border border-gray-300 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-6">
        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-bold text-gray-500">시작일</span>
          <input v-model="startDate" type="date" class="h-9 border border-gray-300 px-2 text-xs font-bold" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-bold text-gray-500">종료일</span>
          <input v-model="endDate" type="date" class="h-9 border border-gray-300 px-2 text-xs font-bold" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-bold text-gray-500">카테고리</span>
          <select v-model="category" class="h-9 border border-gray-300 px-2 text-xs font-bold">
            <option v-for="opt in categoryOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-bold text-gray-500">상태</span>
          <select v-model="status" class="h-9 border border-gray-300 px-2 text-xs font-bold">
            <option value="전체">전체</option>
            <option value="완료">완료</option>
            <option value="환불">환불</option>
            <option value="취소">취소</option>
          </select>
        </label>
        <label class="flex flex-col gap-1 xl:col-span-2">
          <span class="text-[11px] font-bold text-gray-500">키워드</span>
          <input v-model="keyword" type="search" placeholder="판매번호, 상품명" class="h-9 border border-gray-300 px-2 text-xs font-bold" />
        </label>
      </section>

      <section class="grid gap-3 md:grid-cols-3">
        <article class="border border-gray-300 bg-white p-3 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">총 매출액</p>
          <p class="mt-2 text-2xl font-black text-gray-900">₩{{ totalAmount.toLocaleString() }}</p>
        </article>
        <article class="border border-gray-300 bg-white p-3 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">총 판매 수량</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ totalQty.toLocaleString() }}</p>
        </article>
        <article class="border border-gray-300 bg-white p-3 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">총 거래 건수</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ totalCount.toLocaleString() }}</p>
        </article>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 class="text-sm font-black text-gray-900">매출 조회 결과</h2>
          <label class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
            정렬
            <select v-model="sortBy" class="h-8 border border-gray-300 px-2 text-xs font-bold text-gray-700">
              <option value="latest">최신순</option>
              <option value="amount">매출순</option>
              <option value="quantity">수량순</option>
            </select>
          </label>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[1020px] border-collapse text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="px-3 py-3 text-left font-black">일시</th>
                <th class="px-3 py-3 text-left font-black">판매번호</th>
                <th class="px-3 py-3 text-left font-black">상품명</th>
                <th class="px-3 py-3 text-left font-black">카테고리</th>
                <th class="px-3 py-3 text-center font-black">상태</th>
                <th class="px-3 py-3 text-right font-black">수량</th>
                <th class="px-3 py-3 text-right font-black">단가</th>
                <th class="px-3 py-3 text-right font-black">금액</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in filteredRows" :key="`${row.saleId}-${row.productName}-${row.soldAt}`">
                <td class="px-3 py-3 font-bold text-gray-600">{{ formatDateTime(row.soldAt) }}</td>
                <td class="px-3 py-3 font-mono font-bold text-gray-700">{{ row.saleId }}</td>
                <td class="px-3 py-3 font-bold text-gray-900">{{ row.productName }}</td>
                <td class="px-3 py-3 font-bold text-gray-600">{{ row.category }} > {{ row.subCategory }}</td>
                <td class="px-3 py-3 text-center">
                  <span class="px-2 py-1 text-[11px] font-black" :class="statusClass(row.status)">{{ row.status }}</span>
                </td>
                <td class="px-3 py-3 text-right font-black text-gray-700">{{ row.quantity }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-700">₩{{ row.unitPrice.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">₩{{ row.amount.toLocaleString() }}</td>
              </tr>
              <tr v-if="filteredRows.length === 0">
                <td colspan="8" class="px-4 py-12 text-center text-gray-400">조건에 맞는 매출 데이터가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>
