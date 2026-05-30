<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { extractErrorMessage } from '@/api/axios.js'
import { getInfrastructures } from '@/api/hq/infrastructure.js'
import { getPendingStoreOrderBatchTargets, runStoreOrderBatchApprove } from '@/api/hq/storeOrderBatch.js'

const router = useRouter()
const auth = useAuthStore()

const hqMenus = roleMenus.hq
const activeTopMenu = computed(() => '매장 발주 승인 처리')

const selectedRegion = ref('')
const selectedStoreCode = ref('')
const searchKeyword = ref('')

const storeRows = ref([])
const pendingStores = ref([])

const loadingStores = ref(false)
const loadingPendingStores = ref(false)
const runningAll = ref(false)
const runningStoreCode = ref('')
const completedStoreMap = ref({})

const feedbackMessage = ref('')
const feedbackType = ref('info')
const result = ref(null)

const regionOptions = computed(() => {
  const unique = [...new Set(storeRows.value.map((s) => s.region).filter(Boolean))]
  unique.sort((a, b) => String(a).localeCompare(String(b), 'ko'))
  return unique
})

const storeOptions = computed(() => {
  const base = selectedRegion.value
    ? storeRows.value.filter((s) => s.region === selectedRegion.value)
    : storeRows.value
  return [...base].sort((a, b) => String(a.name).localeCompare(String(b.name), 'ko'))
})

const filteredPendingStores = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  return pendingStores.value.filter((store) => {
    const matchRegion = !selectedRegion.value || store.region === selectedRegion.value
    const matchStore = !selectedStoreCode.value || store.storeCode === selectedStoreCode.value
    const matchKeyword =
      !keyword ||
      `${store.storeName} ${store.storeCode} ${store.region}`.toLowerCase().includes(keyword)
    return matchRegion && matchStore && matchKeyword
  })
})

function isStoreRunning(storeCode) {
  return runningStoreCode.value === storeCode
}

function isStoreCompleted(storeCode) {
  return !!completedStoreMap.value[storeCode]
}

function markStoreCompleted(storeCode) {
  completedStoreMap.value = {
    ...completedStoreMap.value,
    [storeCode]: true,
  }
}

function showFeedback(message, type = 'info') {
  feedbackMessage.value = message
  feedbackType.value = type
}

function handleLogout() {
  auth.logout()
  router.push('/dev-login')
}

watch(selectedRegion, () => {
  if (!selectedStoreCode.value) return
  const selected = storeRows.value.find((s) => s.code === selectedStoreCode.value)
  if (!selected || selected.region !== selectedRegion.value) {
    selectedStoreCode.value = ''
  }
})

async function loadStores() {
  loadingStores.value = true
  try {
    const list = await getInfrastructures({ type: 'STORE' })
    storeRows.value = (Array.isArray(list) ? list : []).map((row) => ({
      code: row.code,
      name: row.name,
      region: row.region,
    }))
  } catch (e) {
    showFeedback(extractErrorMessage(e, '매장 목록을 불러오지 못했습니다.'), 'error')
    storeRows.value = []
  } finally {
    loadingStores.value = false
  }
}

async function loadPendingStores() {
  loadingPendingStores.value = true
  try {
    const list = await getPendingStoreOrderBatchTargets()
    pendingStores.value = Array.isArray(list) ? list : []
  } catch (e) {
    showFeedback(extractErrorMessage(e, '승인 대기 매장 목록을 불러오지 못했습니다.'), 'error')
    pendingStores.value = []
  } finally {
    loadingPendingStores.value = false
  }
}

function mapBatchErrorMessage(error) {
  const code = error?.response?.data?.code
  if (code === 4609) return 'STORE 코드에 해당하는 매장을 찾을 수 없습니다.'
  if (code === 4610) return '승인 대기 발주 건이 존재하지 않습니다.'
  if (code === 4611) return '이미 처리된 발주건이 포함되어 처리할 수 없습니다.'
  if (error?.response?.status === 403) return '해당 기능을 실행할 권한이 없습니다.'
  return extractErrorMessage(error, '배치 실행 중 오류가 발생했습니다.')
}

async function runAllBatch() {
  feedbackMessage.value = ''
  runningAll.value = true
  try {
    const res = await runStoreOrderBatchApprove({ mode: 'ALL' })
    result.value = res
    if ((res?.failCount ?? 0) > 0) {
      showFeedback(`일부 매장 발주 승인 처리에 실패했습니다. 성공 ${res.successCount ?? 0}건, 실패 ${res.failCount ?? 0}건`, 'info')
    } else {
      showFeedback('전체 매장 발주 승인이 완료되었습니다.', 'success')
      pendingStores.value.forEach((store) => markStoreCompleted(store.storeCode))
    }
  } catch (e) {
    result.value = null
    showFeedback(mapBatchErrorMessage(e), 'error')
  } finally {
    runningAll.value = false
  }
}

async function runStoreBatch(store) {
  if (isStoreCompleted(store.storeCode)) return
  feedbackMessage.value = ''
  runningStoreCode.value = store.storeCode
  try {
    const res = await runStoreOrderBatchApprove({ mode: 'STORE', storeCode: store.storeCode })
    result.value = res
    if ((res?.failCount ?? 0) > 0) {
      showFeedback(`${store.storeName} 일부 발주 승인 처리에 실패했습니다. 성공 ${res.successCount ?? 0}건, 실패 ${res.failCount ?? 0}건`, 'info')
    } else {
      showFeedback(`${store.storeName} 매장 발주 승인이 완료되었습니다.`, 'success')
      markStoreCompleted(store.storeCode)
    }
  } catch (e) {
    result.value = null
    showFeedback(mapBatchErrorMessage(e), 'error')
  } finally {
    runningStoreCode.value = ''
  }
}

onMounted(async () => {
  await Promise.all([loadStores(), loadPendingStores()])
})
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="[]"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-6">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-5">
          <div class="space-y-2">
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">HQ BATCH</p>
            <h1 class="text-lg font-black text-gray-900">매장 발주 승인 처리</h1>
            <p class="text-xs font-bold text-gray-500">
              본사 관리자 권한으로 매장 발주 승인 배치를 수동 실행합니다.
            </p>
            <p class="text-[11px] font-bold text-blue-800">
              발주 승인 완료 처리 시점: 기본적으로 전날(00:00~23:59) 발주건은 익일 00:00(KST)에 자동 승인되며,
              필요한 경우 본사에서 수동 배치 승인으로 즉시 처리할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      <section class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <!-- 헤더 -->
        <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 class="text-base font-black text-gray-900">승인 대기 발주 보유 매장</h2>
            <p class="text-xs font-bold text-gray-400" style="margin-top: 2px">승인이 필요한 발주건을 보유한 매장 목록입니다.</p>
          </div>
          <span class="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600">
            총 {{ pendingStores.length }}개 매장
          </span>
        </div>

        <!-- 필터 + 전체 실행 -->
        <div class="flex w-full flex-wrap items-center gap-3 border-b border-gray-100 px-6 py-4">
          <select
            v-model="selectedRegion"
            class="h-9 min-w-[150px] rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-700 outline-none transition-colors focus:border-[#2D5B35] focus:bg-white"
            :disabled="loadingStores"
          >
            <option value="">전체 지역</option>
            <option v-for="region in regionOptions" :key="region" :value="region">
              {{ region }}
            </option>
          </select>

          <select
            v-model="selectedStoreCode"
            class="h-9 min-w-[220px] rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-700 outline-none transition-colors focus:border-[#2D5B35] focus:bg-white"
            :disabled="loadingStores"
          >
            <option value="">전체 지점</option>
            <option v-for="store in storeOptions" :key="store.code" :value="store.code">
              {{ store.name }} ({{ store.code }})
            </option>
          </select>

          <input
            v-model="searchKeyword"
            type="search"
            placeholder="매장명, 코드, 지역 검색"
            class="h-9 min-w-[220px] flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-[#2D5B35] focus:bg-white"
          />

          <button
            type="button"
            class="h-9 shrink-0 rounded-lg px-5 text-xs font-black tracking-wide transition-all duration-150 active:scale-[0.98]"
            :class="
              runningAll || !!runningStoreCode
                ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                : 'bg-[#2D5B35] text-white hover:bg-[#234D29] shadow-[0_4px_12px_-6px_rgba(45,91,53,0.5)]'
            "
            :disabled="runningAll || !!runningStoreCode"
            @click="runAllBatch"
          >
            {{ runningAll ? '실행 중...' : '전체 승인 실행' }}
          </button>
        </div>

        <!-- 목록 -->
        <div class="px-6 py-5">
          <div v-if="loadingPendingStores" class="py-8 text-center text-xs font-bold text-gray-400">
            승인 대기 매장 목록을 불러오는 중입니다.
          </div>

          <div
            v-else-if="filteredPendingStores.length === 0"
            class="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm font-bold text-gray-400"
          >
            조건에 맞는 승인 대기 매장이 없습니다.
          </div>

          <div v-else class="grid gap-3 md:grid-cols-2">
            <div
              v-for="store in filteredPendingStores"
              :key="store.storeCode"
              class="flex items-center justify-between rounded-xl border px-5 py-4 transition-all duration-150"
              :class="
                isStoreCompleted(store.storeCode)
                  ? 'border-[#C8DDD0] bg-white'
                  : 'border-gray-200 bg-white hover:border-[#9DBCAF] hover:shadow-sm'
              "
            >
              <div class="min-w-0">
                <p class="text-[11px] font-bold text-gray-400">{{ store.region }} · {{ store.storeCode }}</p>
                <div class="flex items-center gap-2" style="margin-top: 4px">
                  <p
                    class="text-base font-black leading-none"
                    :class="isStoreCompleted(store.storeCode) ? 'text-[#2D5B35]' : 'text-gray-900'"
                  >
                    {{ store.storeName }}
                  </p>
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-black"
                    :class="
                      isStoreCompleted(store.storeCode)
                        ? 'border border-[#C8DDD0] bg-[#E8F2EC] text-[#2D5B35]'
                        : 'border border-[#cfe6de] bg-[#EAF6F2] text-[#004D3C]'
                    "
                  >
                    {{ isStoreCompleted(store.storeCode) ? '처리 완료' : `대기 ${store.requestedCount}건` }}
                  </span>
                </div>
              </div>

              <button
                type="button"
                class="h-9 shrink-0 rounded-lg px-4 text-xs font-black transition-all duration-150 active:scale-[0.97]"
                :class="
                  isStoreCompleted(store.storeCode)
                    ? 'cursor-default border border-[#C8DDD0] bg-[#E8F2EC] text-[#2D5B35]'
                    : isStoreRunning(store.storeCode)
                    ? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400'
                    : runningAll || !!runningStoreCode
                    ? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400'
                    : 'border border-[#2D5B35] bg-white text-[#2D5B35] hover:bg-[#F0F7F3]'
                "
                :disabled="isStoreCompleted(store.storeCode) || runningAll || !!runningStoreCode"
                @click="runStoreBatch(store)"
              >
                {{
                  isStoreCompleted(store.storeCode)
                    ? '✓ 완료'
                    : isStoreRunning(store.storeCode)
                    ? '실행 중...'
                    : '배치 실행'
                }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-black text-gray-900">실행 결과</h2>
          <span v-if="result?.runId" class="text-[11px] font-bold text-gray-500">runId: {{ result.runId }}</span>
        </div>

        <div v-if="result" class="mt-4 grid gap-3 md:grid-cols-4">
          <div class="border border-gray-200 bg-gray-50 p-3">
            <p class="text-[11px] font-bold text-gray-500">요청 건수</p>
            <p class="mt-1 text-lg font-black text-gray-900">{{ result.requestedCount ?? 0 }}</p>
          </div>
          <div class="border border-[#C8DDD0] bg-[#F2F7F4] p-3">
            <p class="text-[11px] font-bold text-[#2D5B35]">성공 건수</p>
            <p class="mt-1 text-lg font-black text-[#1E4228]">{{ result.successCount ?? 0 }}</p>
          </div>
          <div class="border border-red-200 bg-red-50 p-3">
            <p class="text-[11px] font-bold text-red-700">실패 건수</p>
            <p class="mt-1 text-lg font-black text-red-800">{{ result.failCount ?? 0 }}</p>
          </div>
          <div class="border border-gray-200 bg-gray-50 p-3">
            <p class="text-[11px] font-bold text-gray-500">실행 범위</p>
            <p class="mt-1 text-sm font-black text-gray-900">
              {{ result.scope }}<span v-if="result.storeCode"> · {{ result.storeCode }}</span>
            </p>
          </div>
        </div>

        <div class="overflow-x-auto" style="margin-top: 8px">
          <table class="w-full min-w-[680px] border-collapse text-xs">
            <thead class="bg-gray-100 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="px-3 py-2 text-left font-black">발주번호</th>
                <th class="px-3 py-2 text-center font-black">결과</th>
                <th class="px-3 py-2 text-center font-black">코드</th>
                <th class="px-3 py-2 text-left font-black">메시지</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in result?.results ?? []" :key="`${row.orderNo}-${row.code}`">
                <td class="px-3 py-2.5 font-mono font-black text-gray-800">{{ row.orderNo }}</td>
                <td class="px-3 py-2.5 text-center">
                  <span
                    class="inline-flex px-2 py-1 text-[10px] font-black"
                    :class="
                      row.result === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    "
                  >
                    {{ row.result }}
                  </span>
                </td>
                <td class="px-3 py-2.5 text-center font-black text-gray-700">{{ row.code }}</td>
                <td class="px-3 py-2.5 font-bold text-gray-700">{{ row.message }}</td>
              </tr>
              <tr v-if="!(result?.results ?? []).length">
                <td colspan="4" class="px-4 py-8 text-center text-sm text-gray-400">실행 결과가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>
