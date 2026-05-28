<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import PaginationNav from '@/components/common/PaginationNav.vue'
import WarehouseTransferCartDrawer from '@/components/hq/WarehouseTransferCartDrawer.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useWarehouseTransferCartStore } from '@/stores/hq/warehouseTransferCart.js'
import { executeWarehouseTransfers } from '@/api/hq/inventory.js'
import { extractErrorMessage } from '@/api/axios.js'
import { getWarehouseTransferImbalancedSkus } from '@/api/hq/inventory.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const cartStore = useWarehouseTransferCartStore()
const hqMenus = roleMenus.hq
const inventoryMenus = roleMenus.hq.find(menu => menu.label === '물류 창고간 재고이동')?.children ?? []

const activeTopMenu = computed(() => '물류 창고간 재고이동')
const activeSideMenu = ref('재고 이동')
const COLOR_LABEL_BY_CODE = {
  BLK: '검정',
  WHT: '흰색',
  NVY: '네이비',
  GRY: '그레이',
}

const searchTerm = ref(String(route.query.search || ''))
const parseCategoryLabel = (categoryLabel) => {
  const [parentCategory = '', childCategory = ''] = String(categoryLabel ?? '')
    .split('>')
    .map((part) => part.trim())
  return { parentCategory, childCategory }
}

const initialCategory = String(route.query.category || '')
const initialParsedCategory = parseCategoryLabel(initialCategory)
const selectedParentCategory = ref(
  String(route.query.parentCategory || route.query.filterParentCategory || initialParsedCategory.parentCategory || ''),
)
const selectedChildCategory = ref(
  String(route.query.childCategory || route.query.filterChildCategory || initialParsedCategory.childCategory || ''),
)
const selectedColor = ref(String(route.query.filterColor || ''))
const selectedSize = ref(String(route.query.filterSize || ''))
const skuRows = ref([])
const loading = ref(false)
const cartDrawerOpen = ref(false)
const toastMessage = ref('')
const toastShowHistoryAction = ref(false)
let toastTimer = null

const parentCategoryOptions = computed(() =>
  [...new Set(skuRows.value.map((sku) => sku.parentCategory).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'ko')),
)
const childCategoryOptions = computed(() => {
  if (!selectedParentCategory.value) return []
  return [...new Set(
    skuRows.value
      .filter((sku) => sku.parentCategory === selectedParentCategory.value)
      .map((sku) => sku.childCategory)
      .filter(Boolean),
  )].sort((a, b) => a.localeCompare(b, 'ko'))
})
const colorOptions = computed(() =>
  [...new Set(skuRows.value.map((sku) => sku.colorLabel).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'ko')),
)
const sizeOptions = computed(() =>
  [...new Set(skuRows.value.map((sku) => sku.size).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'ko')),
)
const filteredSkuRows = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  // BE가 이미 shortage_warehouse_count DESC → total_shortage_qty DESC → sku_code ASC 순으로 반환하므로
  // 클라이언트 재정렬 불필요 — 필터만 수행
  return skuRows.value.filter((row) => {
    if (selectedParentCategory.value && row.parentCategory !== selectedParentCategory.value) return false
    if (selectedChildCategory.value && row.childCategory !== selectedChildCategory.value) return false
    if (selectedColor.value && row.colorLabel !== selectedColor.value) return false
    if (selectedSize.value && row.size !== selectedSize.value) return false
    if (!keyword) return true
    return [row.skuCode, row.itemCode, row.itemName].join(' ').toLowerCase().includes(keyword)
  })
})

// ---- 페이지네이션 ----
const currentPage = ref(0)
const pageSize = ref(30)

const totalPages = computed(() => Math.max(1, Math.ceil(filteredSkuRows.value.length / pageSize.value)))
const hasPrevious = computed(() => currentPage.value > 0)
const hasNext = computed(() => currentPage.value < totalPages.value - 1)

const pagedSkuRows = computed(() => {
  const start = currentPage.value * pageSize.value
  return filteredSkuRows.value.slice(start, start + pageSize.value)
})

// 필터·검색어 변경 시 첫 페이지로 리셋
watch(
  [searchTerm, selectedParentCategory, selectedChildCategory, selectedColor, selectedSize],
  () => { currentPage.value = 0 },
)

const handlePageSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 0
}
const ctaSkuCode = computed(() => cartStore.lines[0]?.skuCode || filteredSkuRows.value[0]?.skuCode || '')

const loadImbalancedSkus = async () => {
  loading.value = true
  try {
    const items = await getWarehouseTransferImbalancedSkus()
    skuRows.value = (items ?? []).map((item) => ({
      ...item,
      ...parseCategoryLabel(item.category),
      colorLabel: COLOR_LABEL_BY_CODE[String(item.color ?? '').toUpperCase()] ?? String(item.color ?? ''),
    }))
  } catch (error) {
    skuRows.value = []
    console.error('불균형 SKU 목록 조회 실패', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadImbalancedSkus()
})

const moveToSkuDetail = (sku) => {
  router.push({
    name: 'hq-inventory-warehouse-transfer-detail',
    params: { skuCode: sku.skuCode },
    query: {
      itemCode: sku.itemCode || undefined,
      itemName: sku.itemName || undefined,
      category: sku.category || undefined,
      color: sku.color || undefined,
      size: sku.size || undefined,
      search: searchTerm.value || undefined,
      filterParentCategory: selectedParentCategory.value || undefined,
      filterChildCategory: selectedChildCategory.value || undefined,
      filterColor: selectedColor.value || undefined,
      filterSize: selectedSize.value || undefined,
    },
  })
}

const moveToSkuDetailFromCta = () => {
  const skuCode = ctaSkuCode.value
  if (!skuCode) return
  const target = filteredSkuRows.value.find((row) => row.skuCode === skuCode)
  moveToSkuDetail(target || { skuCode })
}

const resetFilters = () => {
  searchTerm.value = ''
  selectedParentCategory.value = ''
  selectedChildCategory.value = ''
  selectedColor.value = ''
  selectedSize.value = ''
}

const handleParentCategoryChange = () => {
  selectedChildCategory.value = ''
}

const openCartDrawer = () => {
  cartDrawerOpen.value = true
}

const closeCartDrawer = () => {
  cartDrawerOpen.value = false
}

const updateCartLineQty = (lineId, event) => {
  const nextQty = Number(event.target.value)
  if (!Number.isFinite(nextQty) || nextQty < 1) {
    event.target.value = '1'
    cartStore.updateLineQty(lineId, 1)
    return
  }
  cartStore.updateLineQty(lineId, Math.trunc(nextQty))
}

const showToast = (message, showHistoryAction = false) => {
  toastMessage.value = message
  toastShowHistoryAction.value = showHistoryAction
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
    toastShowHistoryAction.value = false
  }, 3000)
}

const moveHistory = () => {
  router.push({ name: 'hq-inventory-warehouse-transfer-history' })
}

const executeCartTransfers = async () => {
  if (!cartStore.lineCount) return
  try {
    const beforeCount = cartStore.lineCount
    const payload = {
      requestedBy: auth.user?.name || '본사 관리자',
      lines: cartStore.lines.map((line) => ({
        lineId: line.lineId,
        skuCode: line.skuCode,
        fromWarehouseCode: line.fromWarehouseCode,
        toWarehouseCode: line.toWarehouseCode,
        qty: Number(line.qty),
        reason: line.reason,
        memo: line.memo,
      })),
    }

    const result = await executeWarehouseTransfers(payload)
    const lineResults = Array.isArray(result?.lineResults) ? result.lineResults : []
    const failed = Array.isArray(result?.failedTransfers) ? result.failedTransfers : []
    const successLineIds = lineResults.filter((row) => row.success).map((row) => row.lineId).filter(Boolean)
    if (successLineIds.length) {
      successLineIds.forEach((lineId) => cartStore.removeLine(lineId))
    }

    const successCount = Number(result?.successCount || successLineIds.length || 0)
    const failureCount = Number(result?.failureCount || Math.max(0, beforeCount - successCount))
    if (failureCount === 0) {
      showToast(`장바구니 실행 완료: ${successCount}건 처리됨`, true)
      closeCartDrawer()
    } else {
      showToast(`부분 완료: 성공 ${successCount}건 / 실패 ${failureCount}건`)
    }
    void failed
  } catch (error) {
    showToast(extractErrorMessage(error, '재고 이동 실행에 실패했습니다.'))
  }
}

</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="inventoryMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-4 pb-24">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-4">
          <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Inventory</p>
          <div class="mt-1 flex flex-wrap items-center justify-between gap-2">
            <h1 class="text-lg font-black text-gray-900">창고간 재고 이동</h1>
            <button
              type="button"
              class="h-8 border border-gray-300 px-3 text-[11px] font-black text-gray-700 transition hover:bg-gray-100"
              @click="openCartDrawer"
            >
              장바구니 {{ cartStore.lineCount }}건
            </button>
          </div>
          <p class="mt-1 text-xs font-bold text-gray-500">부족 창고가 많은 SKU를 우선 확인하고 상세에서 장바구니를 구성해 이동을 실행합니다.</p>
        </div>

        <div class="grid gap-2 md:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr_0.7fr_auto]">
          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-gray-500">검색</span>
            <input
              v-model="searchTerm"
              type="search"
              class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
              placeholder="SKU 코드, 품목 코드, 품목명"
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-gray-500">카테고리 1단계</span>
            <select
              v-model="selectedParentCategory"
              class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              @change="handleParentCategoryChange"
            >
              <option value="">전체</option>
              <option v-for="category in parentCategoryOptions" :key="category" :value="category">{{ category }}</option>
            </select>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-gray-500">카테고리 2단계</span>
            <select
              v-model="selectedChildCategory"
              class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C] disabled:bg-gray-50 disabled:text-gray-400"
              :disabled="!selectedParentCategory"
            >
              <option value="">전체</option>
              <option v-for="category in childCategoryOptions" :key="category" :value="category">{{ category }}</option>
            </select>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-gray-500">색상</span>
            <select v-model="selectedColor" class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]">
              <option value="">전체</option>
              <option v-for="color in colorOptions" :key="color" :value="color">{{ color }}</option>
            </select>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-gray-500">사이즈</span>
            <select v-model="selectedSize" class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]">
              <option value="">전체</option>
              <option v-for="size in sizeOptions" :key="size" :value="size">{{ size }}</option>
            </select>
          </label>

          <div class="flex items-end">
            <button type="button" class="h-10 border border-gray-300 px-4 text-xs font-black text-gray-700 transition hover:bg-gray-100" @click="resetFilters">
              초기화
            </button>
          </div>
        </div>
      </section>

      <section class="border border-gray-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 class="text-sm font-black text-gray-900">불균형 SKU 리스트</h2>
          <p class="text-[11px] font-black text-gray-500">총 {{ filteredSkuRows.length }}건</p>
          <p v-if="filteredSkuRows.length > 0" class="text-[11px] font-bold text-gray-400">
            {{ currentPage * pageSize + 1 }}~{{ Math.min((currentPage + 1) * pageSize, filteredSkuRows.length) }}번째 표시 중
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-[1080px] w-full border-collapse text-left text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="px-3 py-3 font-black">SKU 코드</th>
                <th class="px-3 py-3 font-black">품목 코드</th>
                <th class="px-3 py-3 font-black">품목명</th>
                <th class="px-3 py-3 font-black">색상</th>
                <th class="px-3 py-3 font-black">사이즈</th>
                <th class="px-3 py-3 font-black">카테고리</th>
                <th class="px-3 py-3 text-right font-black">총 실재고</th>
                <th class="px-3 py-3 text-right font-black">총 가용재고</th>
                <th class="px-3 py-3 text-right font-black">부족 창고 수</th>
                <th class="px-3 py-3 text-right font-black">순부족 수량</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="row in pagedSkuRows"
                :key="row.skuCode"
                class="cursor-pointer transition hover:bg-[#EBF5F5]/60"
                @click="moveToSkuDetail(row)"
              >
                <td class="px-3 py-3 font-mono font-bold text-gray-700">{{ row.skuCode }}</td>
                <td class="px-3 py-3 font-mono font-bold text-gray-500">{{ row.itemCode }}</td>
                <td class="px-3 py-3 font-black text-gray-900">{{ row.itemName }}</td>
                <td class="px-3 py-3 font-bold text-gray-600">{{ row.colorLabel }}</td>
                <td class="px-3 py-3 font-bold text-gray-600">{{ row.size }}</td>
                <td class="px-3 py-3 font-bold text-gray-600">{{ row.category }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ row.totalOnHand.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ row.totalAvailable.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ row.shortageWarehouseCount.toLocaleString() }}개</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ row.totalShortageQty.toLocaleString() }}개</td>
              </tr>

              <tr v-if="!loading && filteredSkuRows.length === 0">
                <td colspan="10" class="px-4 py-10 text-center text-xs font-bold text-gray-400">
                  조건에 맞는 SKU가 없습니다.
                </td>
              </tr>
              <tr v-if="loading">
                <td colspan="10" class="px-4 py-10 text-center text-xs font-bold text-gray-400">
                  불균형 SKU 데이터를 불러오는 중입니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <PaginationNav
          :page="currentPage"
          :size="pageSize"
          :total-pages="totalPages"
          :total-elements="filteredSkuRows.length"
          :has-previous="hasPrevious"
          :has-next="hasNext"
          :size-options="[20, 30, 50, 100]"
          @update:page="currentPage = $event"
          @update:size="handlePageSizeChange"
        />
      </section>

      <div class="fixed bottom-0 left-52 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur max-[980px]:left-0">
        <div class="flex flex-wrap items-center gap-2 px-4 py-3">
          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-black text-gray-500">재고 이동 장바구니</p>
            <p class="text-xs font-bold text-gray-600">
              현재 {{ cartStore.lineCount }}건이 담겨 있습니다. 이동 정보 입력은 SKU 상세 페이지에서 진행하세요.
            </p>
          </div>
          <button
            type="button"
            class="flex h-10 shrink-0 items-center gap-1.5 border border-gray-300 px-4 text-xs font-black text-gray-700 transition hover:bg-gray-100"
            @click="openCartDrawer"
          >
            장바구니 열기 ({{ cartStore.lineCount }})
          </button>
          <button
            type="button"
            class="h-10 shrink-0 border border-gray-300 bg-gray-100 px-4 text-xs font-black text-gray-400 cursor-not-allowed"
            disabled
          >
            SKU 상세에서 입력
          </button>
        </div>
      </div>

      <WarehouseTransferCartDrawer
        :open="cartDrawerOpen"
        :cart-groups="cartStore.groupedByRoute"
        :cart-line-count="cartStore.lineCount"
        @close="closeCartDrawer"
        @clear-all="cartStore.clearAll()"
        @execute="executeCartTransfers"
        @remove-line="cartStore.removeLine($event)"
        @update-line-qty="updateCartLineQty"
      />

      <div
        v-if="toastMessage"
        class="fixed bottom-20 right-5 z-50 border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 shadow-sm"
      >
        <p>{{ toastMessage }}</p>
        <button
          v-if="toastShowHistoryAction"
          type="button"
          class="mt-1 text-[11px] font-black text-emerald-800 underline"
          @click="moveHistory"
        >
          이동내역 보기
        </button>
      </div>
    </div>
  </AppLayout>
</template>
