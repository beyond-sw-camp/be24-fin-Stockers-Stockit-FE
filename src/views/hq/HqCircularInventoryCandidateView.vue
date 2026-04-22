<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const circularInventoryMenus = roleMenus.hq.find(menu => menu.label === '순환 재고 관리')?.children ?? []

const activeTopMenu = computed(() => '순환 재고 관리')
const activeSideMenu = ref('순환 재고 후보 조회')
const hasRefreshed = ref(false)
const candidates = ref([])
const selectedCandidateIds = ref([])

const circularCandidateData = [
  {
    id: 'CIR-001',
    itemCode: 'SPA-TOP-004',
    category: '상의 > 니트',
    itemName: '라운드넥 소프트 니트',
    warehouseName: '이천 풀필먼트',
    convertibleStock: 86,
    fabricWeight: '43.0kg',
    matchedReasons: ['2년 이상 미판매', '판매율 5% 미만'],
  },
  {
    id: 'CIR-002',
    itemCode: 'SPA-PNT-003',
    category: '바지 > 긴바지',
    itemName: '와이드 밴딩 팬츠 XXXL',
    warehouseName: '대전 허브창고',
    convertibleStock: 24,
    fabricWeight: '18.6kg',
    matchedReasons: ['극단 사이즈 잔여', '판매율 5% 미만'],
  },
  {
    id: 'CIR-003',
    itemCode: 'SPA-OUT-004',
    category: '아우터 > 가디건',
    itemName: '브이넥 니트 가디건 라임',
    warehouseName: '부산 물류창고',
    convertibleStock: 37,
    fabricWeight: '29.6kg',
    matchedReasons: ['특정 컬러 편중', '2년 이상 미판매'],
  },
  {
    id: 'CIR-004',
    itemCode: 'SPA-SKT-002',
    category: '치마 > 롱스커트',
    itemName: '플리츠 롱스커트 XS',
    warehouseName: '인천 제1창고',
    convertibleStock: 19,
    fabricWeight: '12.4kg',
    matchedReasons: ['극단 사이즈 잔여'],
  },
  {
    id: 'CIR-005',
    itemCode: 'SPA-TOP-002',
    category: '상의 > 긴팔',
    itemName: '슬림핏 긴팔 티셔츠 머스타드',
    warehouseName: '이천 풀필먼트',
    convertibleStock: 52,
    fabricWeight: '20.8kg',
    matchedReasons: ['특정 컬러 편중', '판매율 5% 미만'],
  },
]

const isAllSelected = computed(() =>
  candidates.value.length > 0
  && candidates.value.every(candidate => selectedCandidateIds.value.includes(candidate.id)),
)

const canConvertInventory = computed(() => selectedCandidateIds.value.length > 0)

const refreshCandidates = () => {
  hasRefreshed.value = true
  candidates.value = circularCandidateData
  selectedCandidateIds.value = []
}

const toggleCandidate = (candidateId) => {
  selectedCandidateIds.value = selectedCandidateIds.value.includes(candidateId)
    ? selectedCandidateIds.value.filter(id => id !== candidateId)
    : [...selectedCandidateIds.value, candidateId]
}

const toggleAllCandidates = () => {
  selectedCandidateIds.value = isAllSelected.value
    ? []
    : candidates.value.map(candidate => candidate.id)
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
    :side-menus="circularInventoryMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Circular Inventory</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">순환 재고 후보 조회</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">
              시스템이 장기 미판매, 판매율 저조, 사이즈/컬러 불균형 조건에 해당하는 전환 후보를 추출합니다.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 hover:bg-gray-50"
              @click="refreshCandidates"
            >
              재고 새로고침
            </button>
            <button
              type="button"
              class="h-9 px-4 text-xs font-black transition"
              :class="canConvertInventory ? 'bg-[#004D3C] text-white hover:bg-[#00382c]' : 'cursor-not-allowed bg-gray-100 text-gray-400'"
              :disabled="!canConvertInventory"
            >
              순환 재고로 전환
            </button>
          </div>
        </div>
      </section>

      <section class="min-w-0 border border-gray-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h2 class="text-sm font-black text-gray-900">전환 후보 리스트</h2>
            <p class="mt-1 text-[11px] font-bold text-gray-400">
              {{ hasRefreshed ? `후보 ${candidates.length.toLocaleString()}건 · 선택 ${selectedCandidateIds.length.toLocaleString()}건` : '재고 새로고침 후 후보가 표시됩니다.' }}
            </p>
          </div>
        </div>

        <div v-if="!hasRefreshed" class="flex min-h-64 flex-col items-center justify-center px-4 py-14 text-center">
          <p class="text-sm font-black text-gray-900">아직 조회된 순환 재고 후보가 없습니다.</p>
          <p class="mt-2 text-xs font-bold text-gray-400">상단의 재고 새로고침 버튼을 눌러 전환 가능한 후보를 조회하세요.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-[980px] w-full border-collapse text-left text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="w-16 px-3 py-3 text-center font-black">
                  <input
                    type="checkbox"
                    class="h-3.5 w-3.5 accent-[#004D3C]"
                    :checked="isAllSelected"
                    @change="toggleAllCandidates"
                  />
                </th>
                <th class="px-3 py-3 font-black">품목 코드</th>
                <th class="px-3 py-3 font-black">카테고리</th>
                <th class="px-3 py-3 font-black">품목명</th>
                <th class="px-3 py-3 font-black">창고</th>
                <th class="px-3 py-3 text-center font-black">전환 가능 재고</th>
                <th class="px-3 py-3 text-right font-black">원단 무게</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="candidate in candidates"
                :key="candidate.id"
                class="cursor-pointer transition"
                :class="selectedCandidateIds.includes(candidate.id) ? 'bg-[#EBF5F5] font-bold' : 'hover:bg-[#EBF5F5]/60'"
                @click="toggleCandidate(candidate.id)"
              >
                <td class="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    class="h-3.5 w-3.5 accent-[#004D3C]"
                    :checked="selectedCandidateIds.includes(candidate.id)"
                    @click.stop="toggleCandidate(candidate.id)"
                  />
                </td>
                <td class="px-3 py-3 font-mono font-bold text-gray-500">{{ candidate.itemCode }}</td>
                <td class="px-3 py-3 font-bold text-gray-700">{{ candidate.category }}</td>
                <td class="px-3 py-3">
                  <p class="font-black text-gray-900">{{ candidate.itemName }}</p>
                  <div class="mt-1 flex flex-wrap gap-1">
                    <span
                      v-for="reason in candidate.matchedReasons"
                      :key="reason"
                      class="bg-[#EBF5F5] px-2 py-0.5 text-[10px] font-black text-gray-600"
                    >
                      {{ reason }}
                    </span>
                  </div>
                </td>
                <td class="px-3 py-3 font-bold text-gray-700">{{ candidate.warehouseName }}</td>
                <td class="px-3 py-3 text-center font-black text-gray-900">{{ candidate.convertibleStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ candidate.fabricWeight }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>
