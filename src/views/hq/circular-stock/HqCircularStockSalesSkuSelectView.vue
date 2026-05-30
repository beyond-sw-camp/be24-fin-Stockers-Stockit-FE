<script setup>
import { computed, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { AlertCircle, ArrowRight, Info, X } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import CircularStockInventoryBrowseSection from '@/components/hq/circular-stock/CircularStockInventoryBrowseSection.vue'
import SalesRegisterLeaveConfirmModal from '@/components/hq/circular-stock/sales-register/SalesRegisterLeaveConfirmModal.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useCircularStockSaleStore } from '@/stores/hq/circularStock/circularStockSale.js'
import { useCircularStockInventoryStore } from '@/stores/hq/circularStock/circularStockInventory.js'

const router = useRouter()
const route = useRoute()
const circularStockStore = useCircularStockSaleStore()
const inventoryStore = useCircularStockInventoryStore()

const hqMenus = roleMenus.hq
const circularStockMenus =
  roleMenus.hq.find((menu) => menu.label === '순환 재고 관리')?.children ?? []
const activeTopMenu = computed(() => '순환 재고 관리')
const activeSideMenu = ref('순환 재고 판매 등록')

const toastMessage = ref('')
const toastTone = ref('success')
const inventoryLoadError = ref('')
const isInventoryLoading = ref(false)
const showSkuModal = ref(false)
const showResetConfirmModal = ref(false)
const pendingQuery = ref(null)
const showLeaveConfirmModal = ref(false)
const pendingNavigationTarget = ref('')
// null | 'both' | 'warehouse' | 'material'
const filterGuideType = ref(null)

const filterGuideConfig = computed(() => {
  switch (filterGuideType.value) {
    case 'both':
      return {
        titleParts: [
          { text: '출고 창고', highlight: true },
          { text: '와 ' },
          { text: '소재 구분', highlight: true },
          { text: '을 먼저 선택해 주세요.' },
        ],
        description: null,
      }
    case 'warehouse':
      return {
        titleParts: [
          { text: '출고 창고', highlight: true },
          { text: '를 먼저 선택해 주세요.' },
        ],
        description: null,
      }
    case 'material':
      return {
        titleParts: [
          { text: '소재 구분', highlight: true },
          { text: '을 먼저 선택해 주세요.' },
        ],
        description: '한 건의 판매에서는 같은 소재 구분의 SKU만 함께 선택할 수 있습니다.',
      }
    default:
      return null
  }
})
let toastTimer = null
const registerRouteNames = new Set([
  'hq-circular-inventory-sales-register',
  'hq-circular-inventory-sales-register-workflow',
])

const draftItems = computed(() => circularStockStore.draftItems)
const draftRowIds = computed(() => draftItems.value.map((item) => item.draftId))
const lockedMaterialType = computed(() => {
  const raw = unref(circularStockStore.lockedMaterialType)
  return typeof raw === 'string' ? raw : ''
})
const drawerSummary = computed(() => circularStockStore.draftSummary)
const showReturnToWorkflowButton = computed(
  () =>
    draftItems.value.length > 0 &&
    (Boolean(circularStockStore.hasStartedWorkflow) ||
      String(route.query.fromWorkflow || '') === '1'),
)
const selectedWarehouseCode = computed(() => String(circularStockStore.selectedWarehouseCode || ''))
const selectedMaterialGroup = computed(() =>
  String(inventoryStore.inventoryMaterialGroup || ''),
)
const hasActiveDraft = computed(() => circularStockStore.hasActiveDraft)

function isRegisterFlowRoute(routeLike) {
  return registerRouteNames.has(String(routeLike?.name || ''))
}

function shouldBlockLeave(to) {
  return hasActiveDraft.value && !isRegisterFlowRoute(to)
}

function handleBeforeUnload(event) {
  if (!hasActiveDraft.value) return
  event.preventDefault()
  event.returnValue = ''
}

function hasRequiredFilters() {
  const hasWarehouse = Array.isArray(inventoryStore.inventoryWarehouseCodes)
    ? inventoryStore.inventoryWarehouseCodes.length === 1
    : false
  const hasMaterialGroup = Boolean(String(inventoryStore.inventoryMaterialGroup || '').trim())
  return hasWarehouse && hasMaterialGroup
}

function applyQuery(query) {
  loadCircularInventoryRowsWithOverrides({
    page: 0,
    keyword: query.keyword,
    warehouseCodes: query.warehouseCodes,
    materialGroup: query.materialGroup,
    materialName: query.materialName,
    materialNames: query.materialNames,
  })
}

function formatMaterials(materials) {
  return (materials || []).map((material) => `${material.name} ${material.ratio}%`).join(', ')
}

function isItemAdded(draftId) {
  return Boolean(circularStockStore.getDraftItem(draftId))
}

function isRowSelectionDisabled(row) {
  if (isItemAdded(row.id)) return false
  if (!lockedMaterialType.value) return false
  return lockedMaterialType.value !== row.materialType
}

function addItemToDraft(row) {
  const warehouseCount = Array.isArray(inventoryStore.inventoryWarehouseCodes)
    ? inventoryStore.inventoryWarehouseCodes.length
    : 0
  const hasWarehouse = warehouseCount === 1
  const hasMaterialGroup = Boolean(String(inventoryStore.inventoryMaterialGroup || '').trim())
  if (!hasWarehouse || !hasMaterialGroup) {
    if (!hasWarehouse && !hasMaterialGroup) {
      filterGuideType.value = 'both'
    } else if (!hasWarehouse) {
      filterGuideType.value = 'warehouse'
    } else {
      filterGuideType.value = 'material'
    }
    return
  }
  const existing = circularStockStore.getDraftItem(row.id)
  if (existing) {
    circularStockStore.removeSaleDraftItem(existing.draftId)
    showToast('선택한 SKU를 해제했습니다.', 'success')
    return
  }

  const result = circularStockStore.addSaleDraftItem(row)
  if (!result.success) {
    showToast(result.message, 'error')
    return
  }
  showToast(
    result.alreadyExists ? '이미 판매 등록에 담긴 SKU입니다.' : '판매 등록에 SKU를 추가했습니다.',
    'success',
  )
}

function moveToWorkflow() {
  router.push({ name: 'hq-circular-inventory-sales-register-workflow' })
}

function returnToWorkflowPage() {
  router.push({ name: 'hq-circular-inventory-sales-register-workflow' })
}

async function proceedToWorkflow() {
  if (!hasRequiredFilters()) {
    showToast('창고 1개와 소재 구분을 먼저 선택해 주세요.', 'error')
    return
  }
  if (drawerSummary.value.totalItems === 0) {
    showToast('SKU를 1건 이상 선택해 주세요.', 'error')
    return
  }
  showSkuModal.value = false
  await router.push('/hq/circular-inventory/sales/register/workflow')
}

function openSkuModal() {
  showSkuModal.value = true
}

function showToast(message, tone = 'success') {
  toastMessage.value = message
  toastTone.value = tone
}

async function loadCircularInventoryRows() {
  isInventoryLoading.value = true
  inventoryLoadError.value = ''
  try {
    await inventoryStore.loadCircularInventoryRows()
  } catch (e) {
    inventoryLoadError.value = e.message || '순환 재고를 불러오지 못했습니다.'
  } finally {
    isInventoryLoading.value = false
  }
}

function handlePageChange(page) {
  loadCircularInventoryRowsWithOverrides({ page })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleSizeChange(size) {
  loadCircularInventoryRowsWithOverrides({ page: 0, size })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleSortChange({ sort }) {
  loadCircularInventoryRowsWithOverrides({ page: 0, sort })
}

function handleQueryChange(query) {
  const nextWarehouseCode = Array.isArray(query.warehouseCodes)
    ? String(query.warehouseCodes[0] || '')
    : ''
  const nextMaterialGroup = String(query.materialGroup || '').trim()
  const isConditionChanged =
    nextWarehouseCode !== selectedWarehouseCode.value ||
    nextMaterialGroup !== selectedMaterialGroup.value

  if (draftItems.value.length > 0 && isConditionChanged) {
    pendingQuery.value = query
    showResetConfirmModal.value = true
    return
  }

  applyQuery(query)
}

function confirmResetAndApplyQuery() {
  if (!pendingQuery.value) {
    showResetConfirmModal.value = false
    return
  }
  circularStockStore.clearDraft()
  applyQuery(pendingQuery.value)
  pendingQuery.value = null
  showResetConfirmModal.value = false
  showToast('창고/소재 구분이 변경되어 판매 등록 초안을 초기화했습니다.', 'success')
}

function cancelResetAndApplyQuery() {
  pendingQuery.value = null
  showResetConfirmModal.value = false
  loadCircularInventoryRowsWithOverrides({
    page: 0,
    warehouseCodes: selectedWarehouseCode.value ? [selectedWarehouseCode.value] : [],
    materialGroup: selectedMaterialGroup.value,
  })
}

function confirmLeaveAndClearDraft() {
  const target = pendingNavigationTarget.value
  pendingNavigationTarget.value = ''
  showLeaveConfirmModal.value = false
  circularStockStore.clearDraft()
  if (target) {
    router.push(target)
  }
}

function cancelLeaveAndKeepDraft() {
  pendingNavigationTarget.value = ''
  showLeaveConfirmModal.value = false
}

async function loadCircularInventoryRowsWithOverrides(overrides = {}) {
  isInventoryLoading.value = true
  inventoryLoadError.value = ''
  try {
    await inventoryStore.loadCircularInventoryRows(overrides)
  } catch (e) {
    inventoryLoadError.value = e.message || '순환 재고를 불러오지 못했습니다.'
  } finally {
    isInventoryLoading.value = false
  }
}

watch(toastMessage, (message) => {
  if (!message) return
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 3000)
})

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  loadCircularInventoryRows()
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  if (toastTimer) clearTimeout(toastTimer)
})

onBeforeRouteLeave((to, _from, next) => {
  if (!shouldBlockLeave(to)) {
    next()
    return
  }
  pendingNavigationTarget.value = String(to.fullPath || '')
  showLeaveConfirmModal.value = true
  next(false)
})
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="circularStockMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-4 pb-24">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
              Circular Inventory Sales
            </p>
            <h1 class="mt-1 text-lg font-black text-gray-900">순환 재고 판매 등록</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">
              이 화면에서는 SKU만 먼저 선택합니다. 상세 등록은 다음 단계에서 진행합니다.
            </p>
            <p v-if="inventoryLoadError" class="mt-2 text-xs font-bold text-red-600">
              {{ inventoryLoadError }}
            </p>
          </div>
        </div>
      </section>

      <div
        class="flex items-start gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700"
      >
        <Info class="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" :stroke-width="2" />
        <span>판매 등록을 시작하려면 창고와 소재 구분을 먼저 선택해 주세요.</span>
      </div>
      <CircularStockInventoryBrowseSection
        title="판매 대상 순환 재고 리스트"
        :description="
          isInventoryLoading
            ? '순환 재고를 불러오는 중입니다.'
            : '조회 화면에서 SKU를 선택해 판매 등록 초안을 구성하세요.'
        "
        :show-circular-sale-price-column="true"
        :use-fixed-column-widths="true"
        :no-horizontal-scroll="true"
        :default-show-color-column="false"
        :default-show-size-column="false"
        :compact-rows="true"
        :pin-lead-columns="false"
        :server-mode="true"
        :page="inventoryStore.inventoryPage"
        :size="inventoryStore.inventorySize"
        :total-pages="inventoryStore.inventoryTotalPages"
        :total-elements="inventoryStore.inventoryTotalElements"
        :inventory-rows="inventoryStore.inventoryRows"
        :initial-warehouse-codes="inventoryStore.inventoryWarehouseCodes"
        :initial-material-group="inventoryStore.inventoryMaterialGroup"
        action-column-label="추가"
        action-column-position="end"
        :selected-row-ids="draftRowIds"
        :highlighted-row-ids="draftRowIds"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
        @sort-change="handleSortChange"
        @query-change="handleQueryChange"
      >
        <template #row-action="{ row }">
          <div class="flex flex-col items-center gap-1">
            <button
              type="button"
              class="group inline-flex h-7 items-center justify-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:opacity-100 active:scale-95"
              :class="
                isItemAdded(row.id)
                  ? 'border-rose-200/70 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800'
                  : 'border-sky-200/70 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800'
              "
              :disabled="isRowSelectionDisabled(row)"
              :title="
                isRowSelectionDisabled(row)
                  ? `현재 요청서는 ${lockedMaterialType}만 선택 가능합니다.`
                  : ''
              "
              @click.stop="addItemToDraft(row)"
            >
              <span
                class="flex h-4 w-4 items-center justify-center rounded-full text-[10px] shadow-sm transition-colors"
                :class="
                  isItemAdded(row.id)
                    ? 'bg-white text-rose-300 group-hover:bg-rose-700 group-hover:text-white'
                    : 'bg-white text-sky-400 group-hover:bg-sky-700 group-hover:text-white'
                "
              >
                {{ isItemAdded(row.id) ? '✓' : '+' }}
              </span>
              <span>
                {{ isRowSelectionDisabled(row) ? '불가' : isItemAdded(row.id) ? '취소' : '선택' }}
              </span>
            </button>
          </div>
        </template>
      </CircularStockInventoryBrowseSection>

      <div
        class="fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-gray-200/80 bg-white/95 px-4 py-2 shadow-[0_16px_30px_-16px_rgba(15,23,42,0.45)] backdrop-blur-md"
      >
        <span class="whitespace-nowrap pl-1 text-xs font-extrabold text-gray-500">
          선택된 SKU {{ drawerSummary.totalItems }}건
        </span>

        <span class="mx-1 h-4 w-px bg-gray-200" />

        <button
          type="button"
          class="inline-flex h-8 items-center rounded-full border border-[#8FB7A9] bg-[#DCEEE7] px-4 text-xs font-extrabold text-[#2A5348] transition-colors duration-200 hover:bg-[#CFE6DD]"
          @click="openSkuModal"
        >
          선택 SKU 보기
        </button>

        <button
          v-if="showReturnToWorkflowButton"
          type="button"
          class="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#004D3C] px-4 text-xs font-extrabold text-white transition-colors duration-200 hover:bg-[#00382c]"
          @click="returnToWorkflowPage"
        >
          판매 등록 진행
          <ArrowRight :size="13" :stroke-width="2.5" />
        </button>
      </div>

      <div v-if="showSkuModal" class="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm">
        <div
          class="flex h-full w-full items-center justify-center p-4"
          @click.self="showSkuModal = false"
        >
          <section
            class="flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl"
          >
            <header
              class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3"
            >
              <div>
                <p class="text-sm font-black text-gray-900">선택 SKU 보기</p>
                <p class="mt-1 text-[11px] font-bold text-gray-500">
                  현재 선택 {{ drawerSummary.totalItems }}건
                </p>
              </div>
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 active:scale-95"
                @click="showSkuModal = false"
                aria-label="닫기"
              >
                <X class="h-4 w-4" :stroke-width="2" />
              </button>
            </header>

            <div class="min-h-0 flex-1 overflow-y-auto p-4">
              <div
                v-if="draftItems.length === 0"
                class="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center"
              >
                <p class="text-sm font-black text-gray-700">선택된 SKU가 없습니다.</p>
                <p class="mt-1 text-xs font-bold text-gray-500">
                  SKU를 1건 이상 선택하면 판매 등록을 진행할 수 있습니다.
                </p>
              </div>
              <div v-else class="overflow-x-auto border border-gray-200">
                <table class="w-full min-w-[920px] border-collapse text-left text-xs">
                  <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                    <tr>
                      <th class="px-3 py-3 font-black">SKU 코드</th>
                      <th class="px-3 py-3 font-black">품목명</th>
                      <th class="pl-1 pr-3 py-3 text-center font-black">소재 구분</th>
                      <th class="pl-6 pr-3 py-3 font-black">소재 상세</th>
                      <th class="px-3 py-3 text-center font-black">재고 수량</th>
                      <th class="px-3 py-3 text-right font-black">kg당 단가</th>
                      <th class="px-3 py-3 text-right font-black">총 무게</th>
                      <th class="px-3 py-3 text-center font-black">삭제</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-for="item in draftItems" :key="item.draftId">
                      <td class="px-3 py-3 font-mono font-bold text-gray-600">
                        {{ item.skuCode }}
                      </td>
                      <td class="px-3 py-3 font-black text-gray-900">{{ item.itemName }}</td>
                      <td class="pl-1 pr-3 py-3 text-center font-black text-gray-700">
                        {{ item.materialType }}
                      </td>
                      <td class="pl-6 pr-3 py-3 font-bold text-gray-700">
                        {{ formatMaterials(item.materials) }}
                      </td>
                      <td class="px-3 py-3 text-center font-black text-gray-900">
                        {{ Number(item.availableQuantity || 0).toLocaleString() }}벌
                      </td>
                      <td class="px-3 py-3 text-right font-black text-gray-900">
                        ₩{{
                          Number(item.defaultKgUnitPrice || item.unitPrice || 0).toLocaleString()
                        }}
                      </td>
                      <td class="px-3 py-3 text-right font-black text-gray-900">
                        {{ Number(item.availableWeightKg || 0).toFixed(2) }}kg
                      </td>
                      <td class="px-3 py-3 text-center">
                        <button
                          type="button"
                          class="h-7 border border-gray-200 px-2 text-[11px] font-black text-gray-600 hover:bg-gray-50"
                          @click="circularStockStore.removeSaleDraftItem(item.draftId)"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="mt-6 pt-3 flex justify-end">
                <button
                  type="button"
                  class="h-8 border border-gray-300 bg-white px-3 text-xs font-black text-gray-700 hover:bg-gray-100"
                  @click="circularStockStore.clearDraft()"
                >
                  전체 비우기
                </button>
              </div>
            </div>

            <footer
              class="flex items-center justify-end border-t border-gray-200 bg-gray-50 px-4 py-3"
            >
              <button
                type="button"
                class="h-9 border border-[#004D3C] px-4 text-xs font-black"
                :class="
                  drawerSummary.totalItems > 0
                    ? 'bg-[#004D3C] text-white hover:bg-[#00382c]'
                    : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                "
                :disabled="drawerSummary.totalItems === 0"
                @click="proceedToWorkflow"
              >
                판매 등록 진행
              </button>
            </footer>
          </section>
        </div>
      </div>

      <div
        v-if="showResetConfirmModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
      >
        <section class="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-2xl">
          <p class="text-base font-black text-gray-900" style="margin-bottom: 6px">
            조건 변경 시 판매 등록 초기화
          </p>
          <p class="mt-2 text-sm font-bold text-gray-600" style="margin-bottom: 15px">
            창고 또는 소재 구분을 변경하면 진행 중인 판매 등록이 전체 초기화됩니다.
          </p>
          <div class="mt-4 flex justify-end gap-2">
            <button
              type="button"
              class="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-black text-gray-700 hover:bg-gray-50"
              @click="cancelResetAndApplyQuery"
            >
              취소
            </button>
            <button
              type="button"
              class="h-9 rounded-lg border border-rose-700 bg-rose-700 px-3 text-xs font-black text-white hover:bg-rose-800"
              @click="confirmResetAndApplyQuery"
            >
              초기화 후 변경
            </button>
          </div>
        </section>
      </div>

      <SalesRegisterLeaveConfirmModal
        :open="showLeaveConfirmModal"
        @cancel="cancelLeaveAndKeepDraft"
        @confirm="confirmLeaveAndClearDraft"
      />

      <div
        v-if="filterGuideType && filterGuideConfig"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
        @click.self="filterGuideType = null"
      >
        <section class="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div class="flex flex-col items-center gap-6 px-6 pb-6 pt-8">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 ring-2 ring-amber-100">
              <AlertCircle class="h-6 w-6 text-amber-500" :stroke-width="2" />
            </div>
            <p class="text-center text-base font-black leading-snug text-gray-900">
              <template v-for="part in filterGuideConfig.titleParts" :key="part.text">
                <span
                  v-if="part.highlight"
                  class="text-amber-600"
                >{{ part.text }}</span>
                <span v-else>{{ part.text }}</span>
              </template>
            </p>
          </div>

          <div v-if="filterGuideConfig.description" class="mx-5 mb-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p class="text-xs font-bold leading-relaxed text-gray-500">
              {{ filterGuideConfig.description }}
            </p>
          </div>

          <div class="flex justify-end border-t border-gray-100 bg-gray-50/60 px-5 py-4">
            <button
              type="button"
              class="h-9 rounded-lg border border-[#004D3C] bg-[#004D3C] px-6 text-xs font-black text-white hover:bg-[#00382c]"
              @click="filterGuideType = null"
            >
              확인
            </button>
          </div>
        </section>
      </div>

      <p
        v-if="toastMessage"
        class="fixed right-4 top-16 z-30 border px-4 py-2 text-sm font-black shadow-lg"
        :class="
          toastTone === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
        "
      >
        {{ toastMessage }}
      </p>
    </div>
  </AppLayout>
</template>
