<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const circularStockMenus = roleMenus.hq.find(menu => menu.label === '순환 재고 관리')?.children ?? []

const activeTopMenu = computed(() => '순환 재고 관리')
const activeSideMenu = ref('순환 재고 후보 조회')
const hasRefreshed = ref(false)
const candidateSkus = ref([])
const selectedSkuCodes = ref([])
const selectedCategory = ref('')
const selectedWarehouse = ref('')
const searchTerm = ref('')

const PAGE_SIZE = 20
const currentPage = ref(1)
const sortKey = ref('convertibleStock')
const sortDirection = ref('desc')

const conditionItems = [
  '최근 24개월 이상 판매 이력이 없는 SKU',
  '목표 판매 기준 대비 실적이 낮은 SKU',
  '극단 사이즈 재고 또는 특정 컬러 재고에 편중된 SKU',
]

const baseCandidates = [
  {
    id: 'CIR-001',
    itemCode: 'SPA-TOP-004',
    category: '상의 > 니트',
    itemName: '라운드넥 소프트 니트',
    warehouseName: '이천 풀필먼트',
    convertibleStock: 86,
  },
  {
    id: 'CIR-002',
    itemCode: 'SPA-PNT-003',
    category: '바지 > 긴바지',
    itemName: '와이드 밴딩 팬츠 XXXL',
    warehouseName: '대전 허브창고',
    convertibleStock: 24,
  },
  {
    id: 'CIR-003',
    itemCode: 'SPA-OUT-004',
    category: '아우터 > 가디건',
    itemName: '브이넥 니트 가디건 라임',
    warehouseName: '부산 물류창고',
    convertibleStock: 37,
  },
  {
    id: 'CIR-004',
    itemCode: 'SPA-SKT-002',
    category: '치마 > 롱스커트',
    itemName: '플리츠 롱스커트 XS',
    warehouseName: '인천 제1창고',
    convertibleStock: 19,
  },
  {
    id: 'CIR-005',
    itemCode: 'SPA-TOP-002',
    category: '상의 > 긴팔',
    itemName: '슬림핏 긴팔 티셔츠 머스타드',
    warehouseName: '이천 풀필먼트',
    convertibleStock: 52,
  },
]

const colorOptions = ['검정', '흰색', '그레이', '아이보리']
const colorCodeMap = { 검정: 'BLK', 흰색: 'WHT', 그레이: 'GRY', 아이보리: 'IVR' }
const sizeOptions = ['XS', 'S', 'M', 'L', 'XL']

const buildCandidateSkus = () =>
  baseCandidates.flatMap((candidate, cIndex) => {
    const seed = `${candidate.itemCode}-${candidate.warehouseName}`
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0)

    return colorOptions.flatMap((color, colorIndex) =>
      sizeOptions.map((size, sizeIndex) => {
        const actualStock = 12 + ((seed + colorIndex * 17 + sizeIndex * 9) % 55)
        const availableStock = Math.max(actualStock - ((seed + colorIndex * 5 + sizeIndex * 3) % 11), 0)
        const convertibleStock = Math.max(
          1,
          Math.min(availableStock, 1 + ((seed + colorIndex * 13 + sizeIndex * 7 + cIndex) % 18)),
        )
        const updatedDay = String(28 - ((cIndex + colorIndex + sizeIndex) % 12)).padStart(2, '0')
        const updatedHour = String(9 + ((sizeIndex + colorIndex) % 9)).padStart(2, '0')

        return {
          id: `${candidate.id}-${color}-${size}`,
          skuCode: `${candidate.itemCode}-${colorCodeMap[color]}-${size}`,
          itemCode: candidate.itemCode,
          category: candidate.category,
          itemName: candidate.itemName,
          warehouseName: candidate.warehouseName,
          color,
          size,
          availableStock,
          convertibleStock,
          updatedAt: `2026.04.${updatedDay} ${updatedHour}:20`,
        }
      }),
    )
  })

const categoryOptions = computed(() =>
  [...new Set(candidateSkus.value.map(row => row.category))].sort((a, b) => a.localeCompare(b, 'ko')),
)

const warehouseOptions = computed(() =>
  [...new Set(candidateSkus.value.map(row => row.warehouseName))].sort((a, b) => a.localeCompare(b, 'ko')),
)

const filteredSkus = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  return candidateSkus.value.filter((row) => {
    const matchesCategory = !selectedCategory.value || row.category === selectedCategory.value
    const matchesWarehouse = !selectedWarehouse.value || row.warehouseName === selectedWarehouse.value
    const matchesKeyword = !keyword
      || [row.skuCode, row.itemCode, row.itemName].join(' ').toLowerCase().includes(keyword)

    return matchesCategory && matchesWarehouse && matchesKeyword
  })
})

const sortedSkus = computed(() => {
  const rows = [...filteredSkus.value]
  const direction = sortDirection.value === 'asc' ? 1 : -1

  const getComparable = (row) => {
    switch (sortKey.value) {
      case 'skuCode':
        return row.skuCode
      case 'availableStock':
        return row.availableStock
      case 'convertibleStock':
        return row.convertibleStock
      case 'updatedAt':
        return row.updatedAt
      default:
        return row.convertibleStock
    }
  }

  rows.sort((a, b) => {
    const aValue = getComparable(a)
    const bValue = getComparable(b)

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue, 'ko') * direction
    }

    return (aValue - bValue) * direction
  })

  return rows
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedSkus.value.length / PAGE_SIZE)))

const paginatedSkus = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return sortedSkus.value.slice(start, start + PAGE_SIZE)
})

const canConvertInventory = computed(() => selectedSkuCodes.value.length > 0)

const isAllCurrentPageSelected = computed(() =>
  paginatedSkus.value.length > 0
  && paginatedSkus.value.every(row => selectedSkuCodes.value.includes(row.skuCode)),
)

const rangeStart = computed(() => (sortedSkus.value.length === 0 ? 0 : (currentPage.value - 1) * PAGE_SIZE + 1))
const rangeEnd = computed(() => Math.min(currentPage.value * PAGE_SIZE, sortedSkus.value.length))

watch(totalPages, (pageCount) => {
  if (currentPage.value > pageCount) currentPage.value = pageCount
})

watch([selectedCategory, selectedWarehouse, searchTerm], () => {
  currentPage.value = 1
})

const refreshCandidates = () => {
  hasRefreshed.value = true
  candidateSkus.value = buildCandidateSkus()
  selectedSkuCodes.value = []
  currentPage.value = 1
  sortKey.value = 'convertibleStock'
  sortDirection.value = 'desc'
}

const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDirection.value = 'asc'
  }

  currentPage.value = 1
}

const sortIcon = (key) => {
  if (sortKey.value !== key) return '↕'
  return sortDirection.value === 'asc' ? '▲' : '▼'
}

const toggleSku = (skuCode) => {
  selectedSkuCodes.value = selectedSkuCodes.value.includes(skuCode)
    ? selectedSkuCodes.value.filter(code => code !== skuCode)
    : [...selectedSkuCodes.value, skuCode]
}

const toggleAllCurrentPage = () => {
  const pageCodes = paginatedSkus.value.map(row => row.skuCode)

  selectedSkuCodes.value = isAllCurrentPageSelected.value
    ? selectedSkuCodes.value.filter(code => !pageCodes.includes(code))
    : [...new Set([...selectedSkuCodes.value, ...pageCodes])]
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
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
    :side-menus="circularStockMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Circular Inventory</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">순환 재고 후보 조회</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">SKU 단위 후보를 조회하고 바로 순환 재고로 전환합니다.</p>
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

        <div class="mt-4 border border-[#D6EAEA] bg-[#F7FBFB] px-3 py-3">
          <p class="text-[11px] font-black text-[#004D3C]">후보 조건</p>
          <p class="mt-1 text-[11px] font-bold text-gray-500">
            아래 조건에 해당하는 SKU를 우선 후보로 선별해 전환 검토합니다.
          </p>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <span
              v-for="(condition, index) in conditionItems"
              :key="condition"
              class="inline-flex items-center gap-1 bg-white px-2 py-1 text-[11px] font-bold text-gray-700 ring-1 ring-[#D6EAEA]"
            >
              {{ index + 1 }}. {{ condition }}
            </span>
          </div>
        </div>
      </section>

      <section class="min-w-0 border border-gray-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h2 class="text-sm font-black text-gray-900">전환 후보 SKU 리스트</h2>
            <p class="mt-1 text-[11px] font-bold text-gray-400">
              {{ hasRefreshed ? `조회 ${sortedSkus.length.toLocaleString()}건 · 선택 ${selectedSkuCodes.length.toLocaleString()}건` : '재고 새로고침 후 후보가 표시됩니다.' }}
            </p>
          </div>
          <p v-if="hasRefreshed" class="text-[11px] font-bold text-gray-400">
            {{ rangeStart.toLocaleString() }}-{{ rangeEnd.toLocaleString() }} / 전체 {{ sortedSkus.length.toLocaleString() }}건
          </p>
        </div>

        <div
          v-if="hasRefreshed"
          class="grid gap-3 border-b border-gray-100 px-4 py-3 xl:grid-cols-[0.9fr_1fr_1.4fr]"
        >
          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">카테고리</span>
            <select
              v-model="selectedCategory"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
            >
              <option value="">전체</option>
              <option v-for="category in categoryOptions" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">창고</span>
            <select
              v-model="selectedWarehouse"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
            >
              <option value="">전체</option>
              <option v-for="warehouse in warehouseOptions" :key="warehouse" :value="warehouse">
                {{ warehouse }}
              </option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">검색</span>
            <input
              v-model="searchTerm"
              type="search"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
              placeholder="SKU 코드, 품목 코드, 품목명"
            />
          </label>
        </div>

        <div v-if="!hasRefreshed" class="flex min-h-64 flex-col items-center justify-center px-4 py-14 text-center">
          <p class="text-sm font-black text-gray-900">아직 조회된 순환 재고 후보가 없습니다.</p>
          <p class="mt-2 text-xs font-bold text-gray-400">상단의 재고 새로고침 버튼을 눌러 SKU 후보를 조회하세요.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-[1180px] w-full border-collapse text-left text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="w-16 px-3 py-3 text-center font-black">
                  <input
                    type="checkbox"
                    class="h-3.5 w-3.5 accent-[#004D3C]"
                    :checked="isAllCurrentPageSelected"
                    @change="toggleAllCurrentPage"
                  />
                </th>
                <th class="px-3 py-3 font-black">
                  <button type="button" class="inline-flex items-center gap-1 hover:text-gray-900" @click="toggleSort('skuCode')">
                    SKU 코드
                    <span class="text-[9px]">{{ sortIcon('skuCode') }}</span>
                  </button>
                </th>
                <th class="px-3 py-3 font-black">품목 코드</th>
                <th class="px-3 py-3 font-black">카테고리</th>
                <th class="px-3 py-3 font-black">품목명</th>
                <th class="px-3 py-3 font-black">창고</th>
                <th class="px-3 py-3 text-center font-black">색상</th>
                <th class="px-3 py-3 text-center font-black">사이즈</th>
                <th class="px-3 py-3 text-right font-black">
                  <button type="button" class="inline-flex items-center gap-1 hover:text-gray-900" @click="toggleSort('availableStock')">
                    가용재고
                    <span class="text-[9px]">{{ sortIcon('availableStock') }}</span>
                  </button>
                </th>
                <th class="px-3 py-3 text-right font-black">
                  <button type="button" class="inline-flex items-center gap-1 hover:text-gray-900" @click="toggleSort('convertibleStock')">
                    전환 가능 재고
                    <span class="text-[9px]">{{ sortIcon('convertibleStock') }}</span>
                  </button>
                </th>
                <th class="px-3 py-3 font-black">
                  <button type="button" class="inline-flex items-center gap-1 hover:text-gray-900" @click="toggleSort('updatedAt')">
                    최종 업데이트
                    <span class="text-[9px]">{{ sortIcon('updatedAt') }}</span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="row in paginatedSkus"
                :key="row.id"
                class="cursor-pointer transition"
                :class="selectedSkuCodes.includes(row.skuCode) ? 'bg-[#EBF5F5] font-bold' : 'hover:bg-[#EBF5F5]/60'"
                @click="toggleSku(row.skuCode)"
              >
                <td class="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    class="h-3.5 w-3.5 accent-[#004D3C]"
                    :checked="selectedSkuCodes.includes(row.skuCode)"
                    @click.stop="toggleSku(row.skuCode)"
                  />
                </td>
                <td class="px-3 py-3 font-mono font-bold text-gray-600">{{ row.skuCode }}</td>
                <td class="px-3 py-3 font-mono font-bold text-gray-500">{{ row.itemCode }}</td>
                <td class="px-3 py-3 font-bold text-gray-700">{{ row.category }}</td>
                <td class="px-3 py-3 font-black text-gray-900">{{ row.itemName }}</td>
                <td class="px-3 py-3 font-bold text-gray-700">{{ row.warehouseName }}</td>
                <td class="px-3 py-3 text-center font-black text-gray-900">{{ row.color }}</td>
                <td class="px-3 py-3 text-center font-black text-gray-900">{{ row.size }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ row.availableStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ row.convertibleStock.toLocaleString() }}</td>
                <td class="px-3 py-3 font-bold text-gray-500">{{ row.updatedAt }}</td>
              </tr>
              <tr v-if="paginatedSkus.length === 0">
                <td colspan="11" class="px-3 py-14 text-center text-sm font-bold text-gray-400">
                  조건에 맞는 순환 재고 후보가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="hasRefreshed"
          class="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-3 py-2"
        >
          <span class="text-[11px] font-medium text-gray-400">
            {{ rangeStart.toLocaleString() }}-{{ rangeEnd.toLocaleString() }} / 전체 {{ sortedSkus.length.toLocaleString() }}건
          </span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              :disabled="currentPage === 1"
              class="flex h-7 w-7 items-center justify-center border border-gray-300 bg-white text-[12px] text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="goToPage(currentPage - 1)"
            >
              ‹
            </button>
            <button
              v-for="page in totalPages"
              :key="page"
              type="button"
              class="flex h-7 min-w-[28px] items-center justify-center border text-[12px] font-medium transition"
              :class="page === currentPage ? 'border-[#004D3C] bg-[#004D3C] text-white' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-100'"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            <button
              type="button"
              :disabled="currentPage === totalPages"
              class="flex h-7 w-7 items-center justify-center border border-gray-300 bg-white text-[12px] text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="goToPage(currentPage + 1)"
            >
              ›
            </button>
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template>
