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
  if (code === 4609) return 'STORE ????? storeCode? ?????.'
  if (code === 4610) return '???? ?? ?? ?? ?????.'
  if (code === 4611) return '?? ?? ???? ?? ?? ??? ??????.'
  if (error?.response?.status === 403) return '?? ???? ?? ??? ??? ? ????.'
  return extractErrorMessage(error, '?? ?? ? ??? ??????.')
}

async function runAllBatch() {
  feedbackMessage.value = ''
  const ok = window.confirm('?? ?? ?? ??? ?? ??????')
  if (!ok) return

  runningAll.value = true
  try {
    const res = await runStoreOrderBatchApprove({ mode: 'ALL' })
    result.value = res
    if ((res?.failCount ?? 0) > 0) {
      showFeedback(`??? ?? ???? ???????. ?? ${res.successCount ?? 0}?, ?? ${res.failCount ?? 0}?`, 'info')
    } else {
      showFeedback('?? ?? ?? ??? ???????.', 'success')
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
      showFeedback(`${store.storeName} ?? ??? ?? ???? ???????. ?? ${res.successCount ?? 0}?, ?? ${res.failCount ?? 0}?`, 'info')
    } else {
      showFeedback(`${store.storeName} ?? ?? ?? ??? ???????.`, 'success')
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

      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg font-black text-gray-900">승인 대기 발주 보유 매장</h2>
          <p class="text-[11px] font-bold text-gray-500">전체 {{ pendingStores.length }}개 매장</p>
        </div>

        <div class="pt-4 flex w-full flex-wrap items-center gap-4">
          <span class="text-[11px] font-black tracking-wide text-gray-500">매장 검색</span>

          <select
            v-model="selectedRegion"
            class="h-9 min-w-[170px] rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-900 outline-none transition-colors focus:border-[#004D3C]"
            :disabled="loadingStores"
          >
            <option value="">전체 지역</option>
            <option v-for="region in regionOptions" :key="region" :value="region">
              {{ region }}
            </option>
          </select>

          <select
            v-model="selectedStoreCode"
            class="h-9 min-w-[240px] rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-900 outline-none transition-colors focus:border-[#004D3C]"
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
            placeholder="매장명, 매장코드, 지역 검색"
            class="h-9 min-w-[280px] flex-1 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#004D3C]"
          />

          <button
            type="button"
            class="h-9 shrink-0 rounded-xl border px-4 text-xs font-black tracking-wide shadow-sm transition-colors"
            :class="
              runningAll
                ? 'cursor-not-allowed border-gray-200 bg-gray-200 text-gray-400'
                : 'border-[#1e3a5f] bg-[#27496d] text-white hover:border-[#152b46] hover:bg-[#1f3b59]'
            "
            :disabled="runningAll || runningStoreCode"
            @click="runAllBatch"
          >
            {{ runningAll ? '전체 실행 중...' : '전체 승인 실행' }}
          </button>
        </div>

        <div v-if="loadingPendingStores" class="pt-4 text-xs font-bold text-gray-500">
          승인 대기 매장 목록을 불러오는 중입니다.
        </div>

        <div
          v-else-if="filteredPendingStores.length === 0"
          class="mt-5 border border-gray-200 bg-gray-50 px-3 py-6 text-center text-xs font-bold text-gray-500"
        >
          조건에 맞는 승인 대기 매장이 없습니다.
        </div>
        <div v-else class="pt-4 grid gap-4 md:grid-cols-2">
          <div
            v-for="store in filteredPendingStores"
            :key="store.storeCode"
            class="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-sm transition-colors duration-200 hover:border-[#8cb5a9]/70"
          >
            <div class="min-w-0 pr-6">
              <p class="text-[11px] font-bold tracking-wide text-gray-500">{{ store.region }} · {{ store.storeCode }}</p>
              <div class="mt-2 flex items-center gap-2">
                <p class="text-[18px] leading-none font-black text-gray-900">{{ store.storeName }}</p>
                <p class="inline-flex items-center gap-1 rounded-full border border-[#cfe6de] bg-[#EAF6F2] px-3 py-1 text-[11px] font-black text-[#004D3C]">
                  승인 대기 <span class="text-blue-700">{{ store.requestedCount }}</span>건
                </p>
              </div>
            </div>

            <button
              type="button"
              class="h-11 min-w-[138px] rounded-xl border px-2 text-xs font-black tracking-wide shadow-sm transition-colors duration-200"
              :class="
                isStoreCompleted(store.storeCode)
                  ? 'cursor-not-allowed border-gray-200 bg-gray-200 text-gray-500'
                  : isStoreRunning(store.storeCode)
                  ? 'cursor-not-allowed border-gray-200 bg-gray-200 text-gray-400'
                  : 'border-[#1e3a5f] bg-[#27496d] text-white hover:border-[#152b46] hover:bg-[#1f3b59]'
              "
              :disabled="isStoreCompleted(store.storeCode) || runningAll || !!runningStoreCode"
              @click="runStoreBatch(store)"
            >
              {{
                isStoreCompleted(store.storeCode)
                  ? '처리 완료'
                  : isStoreRunning(store.storeCode)
                  ? '실행 중...'
                  : '수동 배치 실행'
              }}
            </button>
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
          <div class="border border-emerald-200 bg-emerald-50 p-3">
            <p class="text-[11px] font-bold text-emerald-700">성공 건수</p>
            <p class="mt-1 text-lg font-black text-emerald-800">{{ result.successCount ?? 0 }}</p>
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

        <div class="mt-4 overflow-x-auto">
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
                <td colspan="4" class="px-4 py-8 text-center text-gray-400">실행 결과가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>
