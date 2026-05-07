<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { extractErrorMessage } from '@/api/axios.js'
import { getInfrastructures } from '@/api/hq/infrastructure.js'
import { runStoreOrderBatchApprove } from '@/api/hq/storeOrderBatch.js'

const router = useRouter()
const auth = useAuthStore()

const hqMenus = roleMenus.hq
const activeTopMenu = computed(() => '매장 발주 승인')
const activeSideMenu = ref('매장 발주 수동 배치 승인')
const sideMenus = computed(
  () => hqMenus.find((menu) => menu.path === '/hq/batch/store-order-approve')?.children ?? [],
)

const mode = ref('ALL')
const selectedRegion = ref('')
const selectedStoreCode = ref('')
const storeRows = ref([])
const loadingStores = ref(false)
const running = ref(false)
const feedbackMessage = ref('')
const feedbackType = ref('info')

const result = ref(null)

const regionOptions = computed(() => {
  const unique = [...new Set(storeRows.value.map((s) => s.region).filter(Boolean))]
  unique.sort((a, b) => String(a).localeCompare(String(b), 'ko'))
  return unique
})

const storeOptions = computed(() => {
  const list = storeRows.value.filter((s) => s.region === selectedRegion.value)
  return list.sort((a, b) => String(a.name).localeCompare(String(b.name), 'ko'))
})

const isStoreMode = computed(() => mode.value === 'STORE')

watch(mode, (next) => {
  if (next !== 'STORE') {
    selectedRegion.value = ''
    selectedStoreCode.value = ''
  }
})

watch(selectedRegion, () => {
  selectedStoreCode.value = ''
})

function showFeedback(message, type = 'info') {
  feedbackMessage.value = message
  feedbackType.value = type
}

function handleLogout() {
  auth.logout()
  router.push('/dev-login')
}

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

function validateInput() {
  if (!isStoreMode.value) return true
  if (!selectedRegion.value) {
    showFeedback('STORE 모드에서는 지역을 선택해 주세요.', 'error')
    return false
  }
  if (!selectedStoreCode.value) {
    showFeedback('STORE 모드에서는 지점명을 선택해 주세요.', 'error')
    return false
  }
  return true
}

function mapBatchErrorMessage(error) {
  const code = error?.response?.data?.code
  if (code === 4609) return 'STORE 모드에는 storeCode가 필수입니다.'
  if (code === 4610) return '유효하지 않은 배치 실행 범위입니다.'
  if (error?.response?.status === 403) return '본사 관리자만 수동 배치를 실행할 수 있습니다.'
  return extractErrorMessage(error, '배치 실행 중 오류가 발생했습니다.')
}

async function runBatch() {
  feedbackMessage.value = ''
  if (!validateInput()) return

  running.value = true
  try {
    const payload = isStoreMode.value
      ? { mode: 'STORE', storeCode: selectedStoreCode.value }
      : { mode: 'ALL' }
    const res = await runStoreOrderBatchApprove(payload)
    result.value = res
    showFeedback('수동 배치 실행이 완료되었습니다.', 'success')
  } catch (e) {
    result.value = null
    showFeedback(mapBatchErrorMessage(e), 'error')
  } finally {
    running.value = false
  }
}

onMounted(loadStores)
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">HQ Batch</p>
        <h1 class="mt-1 text-lg font-black text-gray-900">매장 발주 수동 배치 승인</h1>
        <p class="mt-1 text-xs font-bold text-gray-500">
          본사 관리자 권한으로 매장 발주 승인 배치를 수동 실행합니다.
        </p>
      </section>

      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <h2 class="text-sm font-black text-gray-900">실행 조건</h2>
        <div class="mt-3 grid gap-3 md:grid-cols-4">
          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">배치 모드</span>
            <select
              v-model="mode"
              class="h-10 border border-gray-300 bg-white px-3 text-sm font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              :disabled="running"
            >
              <option value="ALL">전체 승인</option>
              <option value="STORE">매장별 승인</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">지역</span>
            <select
              v-model="selectedRegion"
              class="h-10 border border-gray-300 bg-white px-3 text-sm font-bold text-gray-900 outline-none focus:border-[#004D3C] disabled:cursor-not-allowed disabled:bg-gray-100"
              :disabled="running || !isStoreMode || loadingStores"
            >
              <option value="">지역 선택</option>
              <option v-for="region in regionOptions" :key="region" :value="region">
                {{ region }}
              </option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">지점명</span>
            <select
              v-model="selectedStoreCode"
              class="h-10 border border-gray-300 bg-white px-3 text-sm font-bold text-gray-900 outline-none focus:border-[#004D3C] disabled:cursor-not-allowed disabled:bg-gray-100"
              :disabled="running || !isStoreMode || !selectedRegion"
            >
              <option value="">지점명 선택</option>
              <option v-for="store in storeOptions" :key="store.code" :value="store.code">
                {{ store.name }} ({{ store.code }})
              </option>
            </select>
          </label>

          <div class="flex items-end">
            <button
              type="button"
              class="h-10 w-full text-sm font-black transition-colors"
              :class="
                running
                  ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                  : 'bg-[#004D3C] text-white hover:bg-[#003d30]'
              "
              :disabled="running"
              @click="runBatch"
            >
              {{ running ? '실행 중...' : '수동 배치 실행' }}
            </button>
          </div>
        </div>

        <p
          v-if="feedbackMessage"
          class="mt-4 border px-3 py-2 text-[12px] font-black"
          :class="
            feedbackType === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          "
        >
          {{ feedbackMessage }}
        </p>
      </section>

      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-black text-gray-900">실행 결과</h2>
          <span v-if="result?.runId" class="text-[11px] font-bold text-gray-500">
            runId: {{ result.runId }}
          </span>
        </div>

        <div v-if="result" class="mt-3 grid gap-2 md:grid-cols-4">
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
                <td colspan="4" class="px-4 py-8 text-center text-gray-400">
                  실행 결과가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

