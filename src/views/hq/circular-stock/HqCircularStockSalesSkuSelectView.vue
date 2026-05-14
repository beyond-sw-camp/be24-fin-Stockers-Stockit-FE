<script setup>
import { computed, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import CircularStockInventoryBrowseSection from '@/components/hq/circular-stock/CircularStockInventoryBrowseSection.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useCircularStockStore } from '@/stores/hq/circularStock/circularStock.js'

const router = useRouter()
const route = useRoute()
const circularStockStore = useCircularStockStore()

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
let toastTimer = null

const draftItems = computed(() => circularStockStore.draftItems)
const draftRowIds = computed(() => draftItems.value.map((item) => item.draftId))
const lockedMaterialType = computed(() => {
  const raw = unref(circularStockStore.lockedMaterialType)
  return typeof raw === 'string' ? raw : ''
})
const browseSummaryText = computed(() => `담긴 SKU ${draftItems.value.length.toLocaleString()}건`)
const drawerSummary = computed(() => circularStockStore.draftSummary)
const showReturnToWorkflowButton = computed(() => (
  draftItems.value.length > 0
  && Boolean(circularStockStore.hasStartedWorkflow)
))

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
    await circularStockStore.loadCircularInventoryRows({ page: 0, size: 100, sort: 'skuCode,asc' })
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
  loadCircularInventoryRows()
})

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer)
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

          <button
            v-if="showReturnToWorkflowButton"
            type="button"
            class="h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 hover:bg-gray-50"
            @click="returnToWorkflowPage"
          >
            판매 등록으로 돌아가기
          </button>
        </div>
      </section>

      <CircularStockInventoryBrowseSection
        title="판매 대상 순환 재고 리스트"
        :description="
          isInventoryLoading
            ? '순환 재고를 불러오는 중입니다.'
            : '조회 화면에서 SKU를 선택해 판매 등록 초안을 구성하세요.'
        "
        :summary-text="browseSummaryText"
        :show-circular-sale-price-column="true"
        :inventory-rows="circularStockStore.inventoryRows"
        action-column-label="추가"
        action-column-position="end"
        :selected-row-ids="draftRowIds"
        :highlighted-row-ids="draftRowIds"
      >
        <template #row-action="{ row }">
          <div class="flex flex-col items-center gap-1">
            <button
              type="button"
              class="group inline-flex h-8 items-center justify-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:opacity-100 active:scale-95"
              :class="
                isItemAdded(row.id)
                  ? 'border-indigo-200/60 bg-indigo-50 text-indigo-600 hover:border-indigo-300 hover:bg-indigo-100 hover:text-indigo-700'
                  : 'border-[#97BFB4]/30 bg-[#97BFB4]/10 text-[#5A7F75] hover:border-[#97BFB4]/50 hover:bg-[#97BFB4]/20 hover:text-[#4A6860]'
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
                    ? 'bg-white text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white'
                    : 'bg-white text-[#97BFB4] group-hover:bg-[#004D3C] group-hover:text-white'
                "
              >
                {{ isItemAdded(row.id) ? '✓' : '+' }}
              </span>
              <span>{{ isItemAdded(row.id) ? '수정' : '선택' }}</span>
            </button>
            <span v-if="isRowSelectionDisabled(row)" class="text-[10px] font-black text-gray-400">
              선택 불가
            </span>
          </div>
        </template>
      </CircularStockInventoryBrowseSection>

      <div
        class="fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-gray-200/80 bg-white/95 px-3 py-2 shadow-[0_16px_30px_-16px_rgba(15,23,42,0.45)] backdrop-blur-md"
      >
        <span class="inline-flex h-8 items-center pl-1 text-xs font-extrabold text-gray-500">
          선택된 SKU {{ drawerSummary.totalItems }}건
        </span>

        <button
          type="button"
          class="inline-flex h-8 items-center rounded-full border border-[#004D3C] bg-[#004D3C] px-4 text-xs font-extrabold text-white transition-colors duration-200 hover:bg-[#00382c]"
          @click="openSkuModal"
        >
          선택 SKU 보기
        </button>
      </div>

      <div
        v-if="showSkuModal"
        class="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
        @click.self="showSkuModal = false"
      >
        <div class="flex h-full w-full items-center justify-center p-4">
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
                class="inline-flex h-8 w-8 items-center justify-center border border-gray-300 bg-white text-base font-black text-gray-700 hover:bg-gray-100"
                @click="showSkuModal = false"
              >
                X
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
                판매 등록하기
              </button>
            </footer>
          </section>
        </div>
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
