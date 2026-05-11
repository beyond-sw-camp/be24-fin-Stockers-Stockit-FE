<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
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

const searchTerm = ref(String(route.query.search || ''))
const selectedCategory = ref(String(route.query.category || '전체'))
const selectedWarehouseGroup = ref(String(route.query.warehouseGroup || '전체'))
const skuRows = ref([])
const loading = ref(false)
const cartDrawerOpen = ref(false)
const toastMessage = ref('')
const toastShowHistoryAction = ref(false)
let toastTimer = null

const categoryOptions = computed(() => ['전체', ...new Set(skuRows.value.map(sku => sku.category).filter(Boolean))])
const warehouseGroupOptions = ['전체', '수도권', '충청권', '영남권']

const inferWarehouseGroups = () => ['수도권', '충청권', '영남권']

const filteredSkuRows = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  return [...skuRows.value]
    .filter((row) => {
      if (selectedCategory.value !== '전체' && row.category !== selectedCategory.value) return false
      if (selectedWarehouseGroup.value !== '전체' && !row.warehouseGroups.includes(selectedWarehouseGroup.value)) return false
      if (!keyword) return true

      return [row.skuCode, row.itemCode, row.itemName].join(' ').toLowerCase().includes(keyword)
    })
    .sort((a, b) => {
      if (b.shortageWarehouseCount !== a.shortageWarehouseCount) {
        return b.shortageWarehouseCount - a.shortageWarehouseCount
      }
      if (b.totalShortageQty !== a.totalShortageQty) {
        return b.totalShortageQty - a.totalShortageQty
      }
      return a.skuCode.localeCompare(b.skuCode)
    })
})
const ctaSkuCode = computed(() => cartStore.lines[0]?.skuCode || filteredSkuRows.value[0]?.skuCode || '')

const loadImbalancedSkus = async () => {
  loading.value = true
  try {
    const items = await getWarehouseTransferImbalancedSkus()
    skuRows.value = (items ?? []).map((item) => ({
      ...item,
      warehouseGroups: inferWarehouseGroups(item.itemCode),
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
      filterCategory: selectedCategory.value !== '전체' ? selectedCategory.value : undefined,
      warehouseGroup: selectedWarehouseGroup.value !== '전체' ? selectedWarehouseGroup.value : undefined,
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
  selectedCategory.value = '전체'
  selectedWarehouseGroup.value = '전체'
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
    <div class="flex flex-col gap-4">
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

        <div class="grid gap-2 md:grid-cols-2 xl:grid-cols-[1.2fr_0.9fr_0.9fr_auto]">
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
            <span class="text-[11px] font-bold text-gray-500">카테고리</span>
            <select v-model="selectedCategory" class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]">
              <option v-for="category in categoryOptions" :key="category" :value="category">{{ category }}</option>
            </select>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-gray-500">창고군</span>
            <select v-model="selectedWarehouseGroup" class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]">
              <option v-for="group in warehouseGroupOptions" :key="group" :value="group">{{ group }}</option>
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
                v-for="row in filteredSkuRows"
                :key="row.skuCode"
                class="cursor-pointer transition hover:bg-[#EBF5F5]/60"
                @click="moveToSkuDetail(row)"
              >
                <td class="px-3 py-3 font-mono font-bold text-gray-700">{{ row.skuCode }}</td>
                <td class="px-3 py-3 font-mono font-bold text-gray-500">{{ row.itemCode }}</td>
                <td class="px-3 py-3 font-black text-gray-900">{{ row.itemName }}</td>
                <td class="px-3 py-3 font-bold text-gray-600">{{ row.color }}</td>
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
      </section>

      <div class="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur">
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
