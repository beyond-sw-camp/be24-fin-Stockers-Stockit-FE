<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { getWarehouseTransferDetail } from '@/api/hq/inventory.js'
import { extractErrorMessage } from '@/api/axios.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const inventoryMenus = roleMenus.hq.find((menu) => menu.label === '재고 관리')?.children ?? []

const activeTopMenu = computed(() => '재고 관리')
const activeSideMenu = computed(() => '창고간 재고 이동 내역')

const record = ref(null)
const loading = ref(false)
const loadError = ref('')

const toUiStatus = (status) => {
  if (status === 'IN_PROGRESS') return '출고 준비중'
  if (status === 'COMPLETED') return '완료'
  if (status === 'CANCELED') return '취소'
  if (status === 'REQUESTED') return '요청'
  return status || '-'
}

const skuCount = computed(() => record.value?.lines?.length ?? 0)
const totalQty = computed(() =>
  (record.value?.lines ?? []).reduce((sum, line) => sum + Number(line.qty || 0), 0),
)
const reasonCount = computed(() =>
  new Set((record.value?.lines ?? []).map((line) => (line.reason || '').trim()).filter(Boolean)).size,
)
const memoCount = computed(() =>
  (record.value?.lines ?? []).filter((line) => (line.memo || '').trim().length > 0).length,
)

const lineRows = computed(() => {
  if (!record.value) return []
  const isCanceled = record.value.status === '취소'
  return record.value.lines.map((line) => ({
    ...line,
    fromStockAfter: isCanceled ? line.fromStockBefore : line.fromStockAfter,
    toStockAfter: isCanceled ? line.toStockBefore : line.toStockAfter,
    fromDelta: isCanceled ? 0 : -line.qty,
    toDelta: isCanceled ? 0 : line.qty,
  }))
})

const statusConfig = computed(() => {
  const s = record.value?.status
  if (s === '완료') return { label: '완료', bg: 'bg-[#E8F6F2]', text: 'text-[#0B6D57]', dot: 'bg-[#0B6D57]', banner: null }
  if (s === '출고 준비중') return { label: '출고 준비중', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', banner: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', msg: '현재 이동이 진행 중입니다. 도착 창고의 재고 수치는 예상값입니다.' } }
  if (s === '취소') return { label: '취소', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', banner: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', msg: '취소된 이동 건입니다. 재고 변동이 발생하지 않았습니다.' } }
  return { label: s ?? '-', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', banner: null }
})

const loadDetail = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const data = await getWarehouseTransferDetail(route.params.transferNo)
    record.value = {
      ...data,
      requestedAt: data.requestedAt ? new Date(data.requestedAt).toISOString().slice(0, 16).replace('T', ' ') : '',
      status: toUiStatus(data.status),
    }
  } catch (error) {
    record.value = null
    loadError.value = extractErrorMessage(error, '이동 상세 조회에 실패했습니다.')
  } finally {
    loading.value = false
  }
}

watch(() => route.params.transferNo, () => loadDetail())
onMounted(() => loadDetail())


</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="inventoryMenus"
    :active-side-menu="activeSideMenu"
  >
    <div v-if="loading" class="bg-white border border-gray-200 shadow-sm flex items-center justify-center py-20">
      <p class="text-xs font-bold text-gray-400">이동 상세를 불러오는 중입니다.</p>
    </div>
    <div v-else-if="record" class="flex flex-col gap-5">

      <!-- 상단 헤더 -->
      <section class="bg-white border border-gray-200 shadow-sm">
        <div class="px-6 py-5 flex items-start justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-10 h-10 bg-[#004D3C] flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Inventory Transfer</p>
              <div class="mt-1 flex items-center gap-3 flex-wrap">
                <h1 class="text-lg font-black text-gray-900">창고간 재고 이동 상세</h1>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black" :class="[statusConfig.bg, statusConfig.text]">
                  <span class="w-1.5 h-1.5 rounded-full" :class="statusConfig.dot" />
                  {{ statusConfig.label }}
                </span>
              </div>
              <p class="mt-1 font-mono text-xs font-bold text-gray-500">{{ record.transferNo }}</p>
            </div>
          </div>
          <button
            type="button"
            class="flex-shrink-0 flex items-center gap-1.5 h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 hover:bg-gray-50 transition-colors"
            @click="router.push({ name: 'hq-inventory-warehouse-transfer-history' })"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            목록으로
          </button>
        </div>

        <!-- 상태 배너 -->
        <div v-if="statusConfig.banner" class="mx-6 mb-5 border px-4 py-3 flex items-start gap-2" :class="statusConfig.banner.bg">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" :class="statusConfig.banner.text" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-xs font-bold" :class="statusConfig.banner.text">{{ statusConfig.banner.msg }}</p>
        </div>

        <!-- 메타 정보 그리드 -->
        <div class="px-6 pb-5 grid grid-cols-2 xl:grid-cols-4 gap-3">
          <div class="border border-gray-100 bg-gray-50 px-4 py-3">
            <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">요청자</p>
            <p class="mt-1.5 text-sm font-black text-gray-900">{{ record.requestedBy }}</p>
            <p class="mt-0.5 text-[11px] font-bold text-gray-500">{{ record.requestedAt }}</p>
          </div>
          <div class="border border-gray-100 bg-gray-50 px-4 py-3">
            <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">SKU 종류</p>
            <p class="mt-1.5 text-sm font-black text-gray-900">{{ skuCount }}<span class="ml-1 text-xs font-bold text-gray-500">건</span></p>
          </div>
          <div class="border border-gray-100 bg-gray-50 px-4 py-3">
            <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">총 이동 수량</p>
            <p class="mt-1.5 text-sm font-black text-gray-900">{{ totalQty.toLocaleString() }}<span class="ml-1 text-xs font-bold text-gray-500">개</span></p>
          </div>
          <div class="border border-gray-100 bg-gray-50 px-4 py-3">
            <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">이동 사유 / 메모</p>
            <p class="mt-1.5 text-sm font-black text-gray-900">{{ reasonCount }}<span class="ml-1 text-xs font-bold text-gray-500">종</span></p>
            <p class="mt-0.5 text-[11px] font-bold text-gray-500">메모 {{ memoCount }}건 첨부</p>
          </div>
        </div>
      </section>

      <!-- 창고 이동 플로우 -->
      <section class="bg-white border border-gray-200 shadow-sm px-6 py-5">
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">Transfer Route</p>
        <div class="grid grid-cols-[1fr_auto_1fr] items-stretch gap-0">
          <!-- 출발 창고 -->
          <div class="border border-gray-200 bg-gray-50 px-4 py-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">출발 창고</span>
              <span class="text-[10px] font-black px-2 py-0.5 bg-gray-200 text-gray-600">FROM</span>
            </div>
            <p class="text-base font-black text-gray-900">{{ record.fromWarehouseName }}</p>
            <p class="mt-1 font-mono text-[11px] font-bold text-gray-500">{{ record.fromWarehouseCode }}</p>
          </div>

          <!-- 화살표 -->
          <div class="flex flex-col items-center justify-center bg-[#004D3C] px-5 gap-1.5">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <p class="text-[9px] font-black uppercase tracking-widest text-white/70">이동</p>
          </div>

          <!-- 도착 창고 -->
          <div class="border border-[#C8E6DE] bg-[#F0FAF6] px-4 py-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[10px] font-black uppercase tracking-[0.12em] text-[#0B6D57]/70">도착 창고</span>
              <span class="text-[10px] font-black px-2 py-0.5 bg-[#0B6D57] text-white">TO</span>
            </div>
            <p class="text-base font-black text-gray-900">{{ record.toWarehouseName }}</p>
            <p class="mt-1 font-mono text-[11px] font-bold text-[#0B6D57]/80">{{ record.toWarehouseCode }}</p>
          </div>
        </div>
      </section>

      <!-- SKU 라인 테이블 -->
      <section class="bg-white border border-gray-200 shadow-sm">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 class="text-sm font-black text-gray-900">SKU 이동 라인</h2>
            <p class="mt-0.5 text-[11px] font-bold text-gray-500">{{ skuCount }}건 SKU · 총 {{ totalQty.toLocaleString() }}개 이동</p>
          </div>
          <span v-if="record.status === '출고 준비중'" class="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-[11px] font-black text-amber-700">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            도착 후 재고는 예상값
          </span>
          <span v-else-if="record.status === '취소'" class="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200 text-[11px] font-black text-rose-700">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
            재고 변동 없음
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[1200px] border-collapse text-xs">
            <!-- 컬럼 그룹 헤더 -->
            <thead>
              <tr class="border-b border-gray-100">
                <th colspan="4" class="bg-gray-50 px-4 py-2 text-left text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 border-r border-gray-200">
                  SKU 정보
                </th>
                <th colspan="3" class="bg-gray-50 px-4 py-2 text-left text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 border-r border-gray-200">
                  이동 내용
                </th>
                <th colspan="2" class="bg-gray-50 px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.1em] text-gray-600 border-r border-gray-200">
                  출발 창고 재고
                </th>
                <th colspan="2" class="bg-[#F0FAF6] px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.1em] text-[#0B6D57]">
                  도착 창고 재고
                </th>
              </tr>
              <tr class="bg-gray-50 text-[10px] uppercase tracking-[0.1em] text-gray-500">
                <th class="px-4 py-2.5 text-left font-black w-[140px]">SKU 코드</th>
                <th class="px-3 py-2.5 text-left font-black">품목명</th>
                <th class="px-3 py-2.5 text-center font-black w-[80px]">컬러</th>
                <th class="px-3 py-2.5 text-center font-black w-[60px] border-r border-gray-200">사이즈</th>
                <th class="px-3 py-2.5 text-right font-black w-[70px]">수량</th>
                <th class="px-3 py-2.5 text-left font-black w-[140px]">이동 사유</th>
                <th class="px-3 py-2.5 text-left font-black border-r border-gray-200">메모</th>
                <th class="px-3 py-2.5 text-right font-black w-[80px]">이전</th>
                <th class="px-3 py-2.5 text-right font-black w-[80px] border-r border-gray-200">이후</th>
                <th class="px-3 py-2.5 text-right font-black w-[80px] bg-[#F7FCFA]">이전</th>
                <th class="px-3 py-2.5 text-right font-black w-[80px] bg-[#F7FCFA]">
                  <span v-if="record.status === '출고 준비중'" class="text-amber-600">이후(예상)</span>
                  <span v-else>이후</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="(line, idx) in lineRows"
                :key="line.skuCode"
                class="group transition-colors hover:bg-gray-50"
                :class="idx % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'"
              >
                <!-- SKU 코드 -->
                <td class="px-4 py-3.5 font-mono text-[11px] font-bold text-gray-600">{{ line.skuCode }}</td>

                <!-- 품목명 -->
                <td class="px-3 py-3.5">
                  <p class="font-black text-gray-900 leading-tight">{{ line.itemName }}</p>
                  <p class="mt-0.5 font-mono text-[10px] font-bold text-gray-400">{{ line.itemCode }}</p>
                </td>

                <!-- 컬러 -->
                <td class="px-3 py-3.5 text-center">
                  <span class="inline-block px-2 py-0.5 bg-gray-100 text-[10px] font-black text-gray-600">{{ line.color }}</span>
                </td>

                <!-- 사이즈 -->
                <td class="px-3 py-3.5 text-center border-r border-gray-100">
                  <span class="inline-block px-2 py-0.5 bg-gray-100 text-[10px] font-black text-gray-600">{{ line.size }}</span>
                </td>

                <!-- 수량 -->
                <td class="px-3 py-3.5 text-right">
                  <span class="font-black text-gray-900 text-sm">{{ line.qty.toLocaleString() }}</span>
                  <span class="ml-1 text-[10px] font-bold text-gray-400">개</span>
                </td>

                <!-- 사유 -->
                <td class="px-3 py-3.5">
                  <span class="inline-block px-2 py-1 bg-gray-100 text-[10px] font-bold text-gray-700">{{ line.reason }}</span>
                </td>

                <!-- 메모 -->
                <td class="px-3 py-3.5 border-r border-gray-100 max-w-[280px]">
                  <span v-if="line.memo" class="block truncate text-gray-600 font-bold" :title="line.memo">{{ line.memo }}</span>
                  <span v-else class="text-gray-300 font-bold">—</span>
                </td>

                <!-- 출발 전 -->
                <td class="px-3 py-3.5 text-right font-black text-gray-700">{{ line.fromStockBefore.toLocaleString() }}</td>

                <!-- 출발 후 -->
                <td class="px-3 py-3.5 text-right border-r border-gray-100">
                  <template v-if="record.status === '취소'">
                    <span class="font-black text-gray-400">{{ line.fromStockAfter.toLocaleString() }}</span>
                  </template>
                  <template v-else>
                    <span class="font-black text-rose-600">{{ line.fromStockAfter.toLocaleString() }}</span>
                    <span class="ml-1 text-[10px] font-black text-rose-400">{{ line.fromDelta }}</span>
                  </template>
                </td>

                <!-- 도착 전 -->
                <td class="px-3 py-3.5 text-right font-black text-gray-700 bg-[#F7FCFA]/60">{{ line.toStockBefore.toLocaleString() }}</td>

                <!-- 도착 후 -->
                <td class="px-3 py-3.5 text-right bg-[#F7FCFA]/60">
                  <template v-if="record.status === '취소'">
                    <span class="font-black text-gray-400">{{ line.toStockAfter.toLocaleString() }}</span>
                  </template>
                  <template v-else>
                    <span class="font-black text-[#0B6D57]">{{ line.toStockAfter.toLocaleString() }}</span>
                    <span class="ml-1 text-[10px] font-black text-[#0B6D57]/60">+{{ line.toDelta }}</span>
                  </template>
                </td>
              </tr>
            </tbody>

            <!-- 합계 행 -->
            <tfoot>
              <tr class="border-t-2 border-gray-200 bg-gray-50">
                <td colspan="4" class="px-4 py-3 text-[11px] font-black text-gray-500 border-r border-gray-200">
                  합계 {{ skuCount }}건
                </td>
                <td class="px-3 py-3 text-right font-black text-gray-900">
                  {{ totalQty.toLocaleString() }}
                  <span class="ml-1 text-[10px] font-bold text-gray-400">개</span>
                </td>
                <td colspan="6" class="px-3 py-3 text-[11px] font-bold text-gray-400">
                  사유 {{ reasonCount }}종 · 메모 {{ memoCount }}건
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>

    <!-- 데이터 없음 -->
    <div v-else class="bg-white border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-4 py-20">
      <div class="w-12 h-12 bg-gray-100 flex items-center justify-center">
        <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="text-center">
        <p class="text-sm font-black text-gray-700">존재하지 않는 이동 내역입니다.</p>
        <p class="mt-1 text-xs font-bold text-gray-400">{{ loadError || '이동번호를 다시 확인해 주세요.' }}</p>
      </div>
      <button
        type="button"
        class="flex items-center gap-1.5 h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 hover:bg-gray-50 transition-colors"
        @click="router.push({ name: 'hq-inventory-warehouse-transfer-history' })"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        목록으로
      </button>
    </div>
  </AppLayout>
</template>
