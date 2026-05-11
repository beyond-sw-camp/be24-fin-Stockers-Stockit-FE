<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { getWarehouseTransferDetail } from '@/api/hq/inventory.js'
import { extractErrorMessage } from '@/api/axios.js'
import { Archive, BadgeCheck, PackageCheck, Truck } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const hqMenus = roleMenus.hq
const inventoryMenus = roleMenus.hq.find((menu) => menu.label === '물류 창고간 재고이동')?.children ?? []

const activeTopMenu = computed(() => '물류 창고간 재고이동')
const activeSideMenu = computed(() => '재고 이동 내역')

const record = ref(null)
const loading = ref(false)
const loadError = ref('')

const statusLabelByCode = {
  READY_TO_SHIP: '출고 준비중',
  IN_TRANSIT: '배송중',
  ARRIVED: '배송완료',
  RECEIVED: '입고완료',
}

const toUiStatus = (status) => statusLabelByCode[status] || status || '-'
const transferSteps = ['READY_TO_SHIP', 'IN_TRANSIT', 'ARRIVED', 'RECEIVED']
const transferStepMeta = [
  { key: 'READY_TO_SHIP', label: '출고 준비', icon: Archive },
  { key: 'IN_TRANSIT', label: '배송 중', icon: Truck },
  { key: 'ARRIVED', label: '배송 완료', icon: BadgeCheck },
  { key: 'RECEIVED', label: '입고 완료', icon: PackageCheck },
]

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
  return record.value.lines.map((line) => ({
    ...line,
    fromDelta: -line.qty,
    toDelta: line.qty,
  }))
})

const currentStepIndex = computed(() => {
  const current = record.value?.statusCode
  const idx = transferSteps.indexOf(current)
  if (idx < 0) return -1
  // BE 연동 전에는 RECEIVED를 활성화하지 않는다.
  return Math.min(idx, transferSteps.indexOf('ARRIVED'))
})

const stepState = (stepKey) => {
  const stepIdx = transferSteps.indexOf(stepKey)
  const currentIdx = currentStepIndex.value
  if (stepIdx < 0 || currentIdx < 0) return 'upcoming'
  if (stepIdx < currentIdx) return 'done'
  if (stepIdx === currentIdx) return 'current'
  return 'upcoming'
}

const stepClass = (stepKey) => {
  if (stepKey === 'RECEIVED' && currentStepIndex.value < transferSteps.indexOf('RECEIVED')) {
    return 'bg-gray-100 text-gray-400 border-gray-200'
  }
  const state = stepState(stepKey)
  if (state === 'done') return 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
  if (state === 'current') return 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
  return 'bg-slate-100 text-slate-400 border-slate-200'
}

const stepLabelClass = (stepKey) => {
  if (stepKey === 'RECEIVED' && currentStepIndex.value < transferSteps.indexOf('RECEIVED')) return 'text-gray-400'
  const state = stepState(stepKey)
  if (state === 'done') return 'text-emerald-700'
  if (state === 'current') return 'text-blue-700'
  return 'text-slate-500'
}

const connectorClass = (leftStepKey) => {
  const leftState = stepState(leftStepKey)
  if (leftState === 'done') return 'bg-emerald-400'
  if (leftState === 'current') return 'bg-blue-300'
  return 'bg-slate-200'
}

const statusConfig = computed(() => {
  const code = record.value?.statusCode
  if (code === 'READY_TO_SHIP') return { label: '출고 준비중', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', banner: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', msg: '출고 준비 단계입니다. 재고 이동 실행 직후 상태입니다.' } }
  if (code === 'IN_TRANSIT') return { label: '배송중', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', banner: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', msg: '배송중 단계입니다. 도착 창고의 재고 수치는 예상값입니다.' } }
  if (code === 'ARRIVED') return { label: '배송완료', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', banner: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', msg: '배송 완료 상태입니다. 입고 완료(RECEIVED) 연동은 후속 단계에서 제공됩니다.' } }
  if (code === 'RECEIVED') return { label: '입고완료', bg: 'bg-[#E8F6F2]', text: 'text-[#0B6D57]', dot: 'bg-[#0B6D57]', banner: null }
  return { label: record.value?.status ?? '-', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', banner: null }
})

const loadDetail = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const data = await getWarehouseTransferDetail(route.params.transferNo)
    record.value = {
      ...data,
      requestedAt: data.requestedAt ? new Date(data.requestedAt).toISOString().slice(0, 16).replace('T', ' ') : '',
      statusCode: data.status,
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
        <div v-if="statusConfig.banner" class="mx-6 mb-8 border px-4 py-3 flex items-start gap-2" :class="statusConfig.banner.bg">
          <svg class="w-4 h-4 mt-0.5 flex-shrink-0" :class="statusConfig.banner.text" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-xs font-bold" :class="statusConfig.banner.text">{{ statusConfig.banner.msg }}</p>
        </div>

        <!-- 좌/우 패널 -->
        <div class="px-6 pt-3 pb-5 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <!-- 좌측: 메타 카드 -->
          <section class="border border-gray-200 bg-gray-50 p-4">
            <p class="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">재고이동 요청 내역 요약</p>
            <div class="mt-3 grid grid-cols-2 gap-3">
              <div class="border border-gray-100 bg-white px-4 py-3">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">요청자</p>
                <p class="mt-1.5 text-sm font-black text-gray-900">{{ record.requestedBy }}</p>
                <p class="mt-0.5 text-[11px] font-bold text-gray-500">{{ record.requestedAt }}</p>
              </div>
              <div class="border border-gray-100 bg-white px-4 py-3">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">SKU 종류</p>
                <p class="mt-1.5 text-sm font-black text-gray-900">{{ skuCount }}<span class="ml-1 text-xs font-bold text-gray-500">건</span></p>
              </div>
              <div class="border border-gray-100 bg-white px-4 py-3">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">총 이동 수량</p>
                <p class="mt-1.5 text-sm font-black text-gray-900">{{ totalQty.toLocaleString() }}<span class="ml-1 text-xs font-bold text-gray-500">개</span></p>
              </div>
              <div class="border border-gray-100 bg-white px-4 py-3">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">이동 사유 / 메모</p>
                <p class="mt-1.5 text-sm font-black text-gray-900">{{ reasonCount }}<span class="ml-1 text-xs font-bold text-gray-500">종</span></p>
                <p class="mt-0.5 text-[11px] font-bold text-gray-500">메모 {{ memoCount }}건 첨부</p>
              </div>
            </div>
          </section>

          <!-- 우측: 상태 흐름 + 라우트 -->
          <section class="border border-gray-200 bg-white p-4">
            <p class="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">재고 이동 현황</p>
            <div class="rounded-lg border border-slate-100 bg-slate-50 p-3 mt-3">
              <ol class="flex items-start justify-between gap-1">
                <li
                  v-for="(step, idx) in transferStepMeta"
                  :key="step.key"
                  class="relative flex min-w-0 flex-1 flex-col items-center"
                >
                  <div
                    class="z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all"
                    :class="stepClass(step.key)"
                  >
                    <component :is="step.icon" class="h-5 w-5" />
                  </div>
                  <p class="mt-2 text-center text-[11px] font-black" :class="stepLabelClass(step.key)">
                    {{ step.label }}
                  </p>
                  <span
                    v-if="idx < transferStepMeta.length - 1"
                    class="absolute left-[calc(50%+22px)] top-[22px] h-[3px] w-[calc(100%-44px)] rounded-full"
                    :class="connectorClass(step.key)"
                  />
                </li>
              </ol>
            </div>
            <p class="mt-2 text-[10px] font-bold text-gray-500">입고완료(RECEIVED)는 BE 입고 연동 전까지 표시 전용 단계입니다.</p>

            <div class="grid grid-cols-[1fr_auto_1fr] items-stretch gap-0 mt-3" style="margin-top: 0.67rem;">
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
        </div>
      </section>

      <!-- SKU 라인 테이블 -->
      <section class="bg-white border border-gray-200 shadow-sm">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 class="text-sm font-black text-gray-900">SKU 이동 라인</h2>
            <p class="mt-0.5 text-[11px] font-bold text-gray-500">{{ skuCount }}건 SKU · 총 {{ totalQty.toLocaleString() }}개 이동</p>
          </div>
          <span v-if="record.statusCode === 'READY_TO_SHIP' || record.statusCode === 'IN_TRANSIT'" class="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-[11px] font-black text-amber-700">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            도착 후 재고는 예상값
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
                  <span v-if="record.statusCode === 'READY_TO_SHIP' || record.statusCode === 'IN_TRANSIT'" class="text-amber-600">이후(예상)</span>
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
                  <span class="font-black text-rose-600">{{ line.fromStockAfter.toLocaleString() }}</span>
                </td>

                <!-- 도착 전 -->
                <td class="px-3 py-3.5 text-right font-black text-gray-700 bg-[#F7FCFA]/60">{{ line.toStockBefore.toLocaleString() }}</td>

                <!-- 도착 후 -->
                <td class="px-3 py-3.5 text-right bg-[#F7FCFA]/60">
                  <span class="font-black text-[#0B6D57]">{{ line.toStockAfter.toLocaleString() }}</span>
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
