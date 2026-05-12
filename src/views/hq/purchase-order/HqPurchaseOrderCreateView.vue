<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { usePurchaseOrderStore } from '@/stores/purchaseOrder.js'
import { usePurchaseOrderCartStore } from '@/stores/hq/purchaseOrderCart.js'
import { ArrowLeftIcon } from '@/components/hq/purchase-order/icons.js'
import PurchaseOrderBulkQtyModal from '@/components/hq/purchase-order/PurchaseOrderBulkQtyModal.vue'
import PurchaseOrderCart from '@/components/hq/purchase-order/PurchaseOrderCart.vue'
import PurchaseOrderCatalog from '@/components/hq/purchase-order/PurchaseOrderCatalog.vue'
import PurchaseOrderConfirmModal from '@/components/hq/purchase-order/PurchaseOrderConfirmModal.vue'
import PurchaseOrderFloatingBar from '@/components/hq/purchase-order/PurchaseOrderFloatingBar.vue'
import PurchaseOrderSubmitConfirmModal from '@/components/hq/purchase-order/PurchaseOrderSubmitConfirmModal.vue'
import { useToast } from '@/composables/useToast.js'
import { usePurchaseOrderDraft } from '@/composables/hq/purchaseOrder/useDraft.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const poStore = usePurchaseOrderStore()
const cartStore = usePurchaseOrderCartStore()

const { toast, triggerToast } = useToast()
// 카탈로그 child 의 expose 메소드(focusSearch/scrollToSku) 호출용 ref.
const catalogRef = ref(null)

const isEditMode = computed(() => route.name === 'hq-purchase-order-edit')
const editingOrderId = computed(() => route.params.id ?? null)

// ─── 레이아웃 ────────────────────────────────────────────────────────────────
const hqMenus = roleMenus.hq
const activeTopMenu = computed(() => '물류 창고 발주')

// ─── state ───────────────────────────────────────────────────────────────────
const selectedWarehouseCode = ref('')
const keyword = ref('')
const vendorFilter = ref('all')
const sortBy = ref('default')
const cart = ref([])

// 재고 시뮬레이션 / facet 필터 / 카탈로그 헬퍼는 PurchaseOrderCatalog child 가 자체 보유.
// 부모는 cart/모달/제출 같은 도메인 액션만.

// localStorage 드래프트 영속화 — edit 모드는 자동 no-op.
const { loadDraft, saveDraft, clearDraftStorage } = usePurchaseOrderDraft({
  isEditMode,
  selectedWarehouseCode,
  cart,
})

// 창고 변경 confirm
const showWarehouseChangeConfirm = ref(false)
const pendingWarehouseId = ref(null)
// 장바구니 비우기 confirm
const showClearCartConfirm = ref(false)
// 발주 요청 최종 확인
const showSubmitConfirm = ref(false)

// 행 안 수량 입력 — { [skuCode]: number }. cart 담은 후 0 으로 reset.
const rowQuantities = ref({})
// 그룹 접힘 상태 — { [masterKey]: boolean }
const collapsed = ref({})
// 부족만 보기 토글 (마스터 단위 — 그룹 헤더의 가용재고 < 안전재고 × 1.5 인 그룹만)
const shortageOnly = ref(false)

// ─── Power 모드 ─────────────────────────────────────────────────────────────
// 다중 선택: skuCode set — Floating bar 와 카탈로그가 v-model 로 공유.
const selectedSkus = ref(new Set())
// Bulk 수량 모달 — 입력값은 모달 컴포넌트 로컬 state (open/close 만 부모 관리)
const showBulkQtyModal = ref(false)
// cart 강조용 — [좌측에서 보기] / [장바구니에서 보기] 점프 시 잠시 highlight
const highlightedSkuCode = ref('')
let highlightTimer = null

function highlightCart(skuCode) {
  highlightedSkuCode.value = skuCode
  if (highlightTimer) clearTimeout(highlightTimer)
  highlightTimer = setTimeout(() => {
    highlightedSkuCode.value = ''
  }, 1500)
}

// 양방향 점프 — 카탈로그 → cart, cart → 카탈로그
function scrollToCartSku(skuCode) {
  const el = document.querySelector(`[data-cart-sku-code="${skuCode}"]`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    highlightCart(skuCode)
  }
}

// cart → 카탈로그 점프 — child(catalogRef) 의 expose 메소드 위임 (그룹 펼침 + scrollIntoView).
function scrollToCatalogSku(skuCode) {
  catalogRef.value?.scrollToSku?.(skuCode)
}

// isInCart / toggleSkuSelected / isGroupAllSelected / isGroupSomeSelected / toggleGroupSelected
// 모두 PurchaseOrderCatalog child 안으로 이동.

function clearSelection() {
  selectedSkus.value = new Set()
}

// 전체 선택 — catalog 컴포넌트 자체에 헤더 체크박스 있음 (ERP 테이블 스타일).
// 부모의 Ctrl+A 단축키는 더 이상 사용 안 함 (catalog 내부에서 처리).

// Bulk 수량 모달 트리거 (Floating bar 에서 호출).
function openBulkQtyModal() {
  if (selectedSkus.value.size === 0) return
  showBulkQtyModal.value = true
}

function closeBulkQtyModal() {
  showBulkQtyModal.value = false
}

// 모달의 [적용] emit 핸들러 — vendor 검증 + cart push + draft 저장 + 선택 reset 까지.
function handleBulkApply(qty) {
  if (qty <= 0) {
    triggerToast('수량을 입력하세요.')
    return
  }
  if (!selectedWarehouseCode.value) {
    triggerToast('먼저 입고 창고를 선택해주세요.')
    return
  }
  const selectedRows = []
  for (const r of poStore.catalogSkuRows) {
    if (r.type === 'sku' && selectedSkus.value.has(r.skuCode)) selectedRows.push(r)
  }
  if (selectedRows.length === 0) return
  for (const row of selectedRows) {
    pushSku(row, qty)
    rowQuantities.value[row.skuCode] = 0
  }
  saveDraft()
  selectedSkus.value = new Set()
  closeBulkQtyModal()
  triggerToast(`${selectedRows.length}개 SKU 를 ${qty}개씩 담았습니다.`)
}

// 키보드 단축
function handleKeydown(e) {
  const target = e.target
  const inEditable =
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

  if (e.key === 'Escape') {
    if (showBulkQtyModal.value) {
      closeBulkQtyModal()
      e.preventDefault()
      return
    }
    if (selectedSkus.value.size > 0) {
      clearSelection()
      e.preventDefault()
      return
    }
    return
  }

  if (e.key === '/' && !inEditable) {
    catalogRef.value?.focusSearch?.()
    e.preventDefault()
    return
  }

  // Ctrl+A 전체 선택은 catalog 컴포넌트 헤더 체크박스로 대체.
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (highlightTimer) clearTimeout(highlightTimer)
})

// toast / triggerToast 는 useToast() composable 에서 제공 (timer cleanup 도 composable 안에서).

// ─── computed ────────────────────────────────────────────────────────────────
// 카탈로그 관련 computed/헬퍼(filteredRows/matchedSkuCount/shortageCount/vendorOptions/
// applySuggestedToSku/groupMatchedCount/priceRangeText/rowKey/toggleGroup/expandAll/collapseAll)
// 는 모두 PurchaseOrderCatalog child 안으로 이동. 부모는 cart 도메인 책임만.

const cartTotal = computed(() =>
  cart.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
)

const canSubmit = computed(() => !!selectedWarehouseCode.value && cart.value.length > 0)

// edit 모드 — 단일 vendor 잠금. cart 첫 item 의 vendor 가 잠긴 vendor.
const currentCartVendorName = computed(() =>
  cart.value.length > 0 ? cart.value[0].vendorName : '',
)

// 신규 모드 — vendor 그룹핑 (멀티 공급처 허용). vendorName ASC 정렬.
const groupedByVendor = computed(() => {
  const map = new Map()
  for (const it of cart.value) {
    if (!map.has(it.vendorId)) {
      map.set(it.vendorId, {
        vendorId: it.vendorId,
        vendorName: it.vendorName ?? '',
        items: [],
        itemCount: 0,
        subtotal: 0,
      })
    }
    const g = map.get(it.vendorId)
    g.items.push(it)
    g.itemCount += 1
    g.subtotal += (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0)
  }
  return Array.from(map.values()).sort((a, b) =>
    String(a.vendorName).localeCompare(String(b.vendorName), 'ko'),
  )
})

const pendingWarehouseName = computed(() => {
  if (!pendingWarehouseId.value) return ''
  return poStore.warehouses.find((w) => w.code === pendingWarehouseId.value)?.name ?? ''
})

const selectedWarehouseName = computed(
  () => poStore.warehouses.find((w) => w.code === selectedWarehouseCode.value)?.name ?? '',
)

// loadDraft / saveDraft / clearDraftStorage 는 usePurchaseOrderDraft() composable 에서 제공.

// ─── 장바구니 액션 ───────────────────────────────────────────────────────────
// SKU 행 [+] 클릭 → 행 안 수량 input 값을 cart 로 push. 동일 SKU 가 cart 에 있으면 합산.
// 신규 모드는 여러 공급처 혼재 허용 (BE batch API 가 vendor 별로 자동 분할).
// edit 모드는 단일 vendor 잠금이지만 vendorFilter 가 그 vendor 만 노출하므로 카탈로그 단계에서 차단됨.
function addSkuToCart(row) {
  if (!selectedWarehouseCode.value) {
    triggerToast('먼저 입고 창고를 선택해주세요.')
    return
  }
  const qty = Number(rowQuantities.value[row.skuCode]) || 0
  if (qty <= 0) {
    triggerToast('수량을 입력하세요.')
    return
  }
  pushSku(row, qty)
  rowQuantities.value[row.skuCode] = 0
  saveDraft()
}

function pushSku(row, qty) {
  const existing = cart.value.find((item) => item.skuCode === row.skuCode)
  if (existing) {
    existing.quantity += qty
  } else {
    cart.value.push({
      productId: row.vendorProductCode,
      productCode: row.productCode,
      productName: row.productName,
      vendorId: row.vendorCode,
      vendorName: row.vendorName,
      skuCode: row.skuCode,
      color: row.color,
      size: row.size,
      displayOption: row.displayOption,
      unitPrice: row.unitPrice,
      quantity: qty,
    })
  }
}

// 그룹 단위 일괄 담기 제거 — ERP 테이블 평면화로 의미 없음.
// 멀티 SKU 일괄은 catalog 의 체크박스 + Floating bar Bulk 모달로 대체.
// (아래 함수는 router 호환만 위해 stub 유지 — 향후 제거 후보)
function addGroupToCart() {
  if (!selectedWarehouseCode.value) {
    triggerToast('먼저 입고 창고를 선택해주세요.')
    return
  }
  const skus = []
  if (skus.length === 0) return
  let added = 0
  for (const row of skus) {
    const qty = Number(rowQuantities.value[row.skuCode]) || 0
    if (qty <= 0) continue
    pushSku(row, qty)
    rowQuantities.value[row.skuCode] = 0
    added++
  }
  if (added === 0) {
    triggerToast('수량을 입력한 SKU 가 없습니다.')
    return
  }
  saveDraft()
  triggerToast(`${added}개 SKU 를 담았습니다.`)
}

function updateQty(idx, qty) {
  const num = parseInt(qty, 10)
  if (Number.isNaN(num) || num < 1) return
  cart.value[idx].quantity = num
  saveDraft()
}

function increaseQty(idx) {
  cart.value[idx].quantity += 1
  saveDraft()
}

function decreaseQty(idx) {
  if (cart.value[idx].quantity <= 1) return
  cart.value[idx].quantity -= 1
  saveDraft()
}

function removeItem(idx) {
  cart.value.splice(idx, 1)
  saveDraft()
}

function openClearCartConfirm() {
  if (cart.value.length === 0) return
  showClearCartConfirm.value = true
}

function confirmClearCart() {
  cart.value = []
  showClearCartConfirm.value = false
  saveDraft()
}

function cancelClearCart() {
  showClearCartConfirm.value = false
}

// ─── 창고 변경 ────────────────────────────────────────────────────────────────
function handleWarehouseChange(newId) {
  if (newId === selectedWarehouseCode.value) return
  if (cart.value.length === 0) {
    selectedWarehouseCode.value = newId
    saveDraft()
    return
  }
  // cart 가 비어있지 않으면 confirm
  pendingWarehouseId.value = newId
  showWarehouseChangeConfirm.value = true
  // select DOM 값을 selectedWarehouseCode 로 강제 원복 (취소 시 어색하지 않게)
  nextTick(() => {
    if (warehouseSelectRef.value) {
      warehouseSelectRef.value.value = selectedWarehouseCode.value
    }
  })
}

function confirmWarehouseChange() {
  selectedWarehouseCode.value = pendingWarehouseId.value
  cart.value = []
  pendingWarehouseId.value = null
  showWarehouseChangeConfirm.value = false
  saveDraft()
}

function cancelWarehouseChange() {
  pendingWarehouseId.value = null
  showWarehouseChangeConfirm.value = false
}

const warehouseSelectRef = ref(null)

// ─── 발주 요청 ────────────────────────────────────────────────────────────────
function openSubmitConfirm() {
  if (!canSubmit.value) return
  showSubmitConfirm.value = true
}

function cancelSubmitOrder() {
  showSubmitConfirm.value = false
}

async function confirmSubmitOrder() {
  showSubmitConfirm.value = false

  try {
    if (isEditMode.value) {
      // edit 모드 — 단일 vendor PATCH 흐름 그대로 (회귀 보호)
      const order = poStore.purchaseOrders.find((o) => o.id === editingOrderId.value)
      if (!order || order.status !== 'REQUESTED') {
        triggerToast('상태가 변경되어 수정할 수 없습니다')
        setTimeout(() => router.replace({ name: 'hq-purchase-orders' }), 900)
        return
      }
      const items = cart.value.map((i) => ({
        productId: i.productId,
        productCode: i.productCode,
        productName: i.productName,
        skuCode: i.skuCode,
        color: i.color,
        size: i.size,
        displayOption: i.displayOption,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        subtotal: i.unitPrice * i.quantity,
      }))
      await poStore.updateOrder(editingOrderId.value, {
        warehouseCode: selectedWarehouseCode.value,
        items,
      })
      poStore.selectOrder(editingOrderId.value)
      triggerToast('발주가 수정되었습니다')
    } else {
      // 신규 모드 — 멀티 공급처 batch. vendor 별로 PO N건 atomic 생성.
      cartStore.setItems(cart.value)
      const res = await cartStore.createBatch({
        warehouseCode: selectedWarehouseCode.value,
        memberId: auth.user?.memberId ?? 'MB-003',
        memberName: auth.user?.name ?? '이선엽',
      })
      cart.value = []
      cartStore.clearAll()
      clearDraftStorage()
      const firstCode = res?.orders?.[0]?.code
      if (firstCode) poStore.selectOrder?.(firstCode)
      const orderCount = res?.orders?.length ?? 0
      const vendorCount = res?.vendorCount ?? orderCount
      triggerToast(`공급처 ${vendorCount}곳 / 발주 ${orderCount}건이 요청되었습니다`)
    }

    setTimeout(() => {
      router.push({ name: 'hq-purchase-orders' })
    }, 900)
  } catch (e) {
    // atomic 시멘틱 — 카트 보존, 토스트만
    triggerToast(e?.message ?? '발주 처리에 실패했습니다')
  }
}

// ─── 수정 모드 초기화 ────────────────────────────────────────────────────────
function initEditMode() {
  const id = editingOrderId.value
  const order = poStore.purchaseOrders.find((o) => o.id === id)
  if (!order) {
    triggerToast('발주를 찾을 수 없습니다')
    setTimeout(() => router.replace({ name: 'hq-purchase-orders' }), 900)
    return
  }
  if (order.status !== 'REQUESTED') {
    triggerToast('승인 대기 상태의 발주만 수정할 수 있습니다')
    setTimeout(() => router.replace({ name: 'hq-purchase-orders' }), 900)
    return
  }
  selectedWarehouseCode.value = order.warehouseCode || ''
  vendorFilter.value = order.vendorId // 공급처 잠금 (BE vendorCode)
  cart.value = order.items.map((i) => ({
    productId: i.productId,
    productCode: i.productCode,
    productName: i.productName,
    skuCode: i.skuCode ?? '',
    color: i.color ?? '',
    size: i.size ?? '',
    displayOption: i.displayOption ?? [i.color, i.size].filter(Boolean).join('/'),
    vendorId: order.vendorId,
    vendorName: order.vendorName,
    unitPrice: i.unitPrice,
    quantity: i.quantity,
  }))
}

// ─── mounted + vendorFilter watch (카탈로그 fetch) ─────────────────────────
function effectiveVendorCode() {
  return vendorFilter.value && vendorFilter.value !== 'all' ? vendorFilter.value : ''
}

function reloadCatalog() {
  poStore
    .fetchCatalog({
      vendorCode: effectiveVendorCode(),
      warehouseCode: selectedWarehouseCode.value,
    })
    .catch((err) => {
      console.error('[HqPurchaseOrderCreateView] fetchCatalog 실패', err)
    })
}

onMounted(() => {
  if (isEditMode.value) {
    initEditMode()
  } else {
    loadDraft()
  }
  reloadCatalog()
  // 인증 hydrate race 로 store 마운트 시점 fetch 가 스킵될 수 있어 보장 fetch.
  if (poStore.warehouses.length === 0) {
    poStore.fetchWarehouses()
  }
})

// 공급처 필터 변경 시 server-side 재 fetch (한 공급처 결과만 받기)
watch(vendorFilter, () => {
  reloadCatalog()
})

// 아이콘은 @/components/hq/purchase-order/icons.js 에서 import.
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="[]"
  >
    <div class="flex h-[calc(100vh-100px)] min-w-0 flex-col gap-4 overflow-hidden">
      <!-- 상단 바 -->
      <section
        class="flex flex-wrap items-center gap-3 border border-gray-300 bg-white p-3 shadow-sm"
      >
        <button
          type="button"
          class="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-[#004D3C]"
          @click="router.push({ name: 'hq-purchase-orders' })"
        >
          <ArrowLeftIcon :size="14" />
          발주 목록으로
        </button>

        <div class="ml-2 flex items-center gap-2">
          <label class="text-[11px] font-black uppercase tracking-wider text-gray-500">
            입고 창고
          </label>
          <select
            ref="warehouseSelectRef"
            :value="selectedWarehouseCode"
            class="min-w-[160px] border border-gray-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#004D3C]"
            @change="handleWarehouseChange($event.target.value)"
          >
            <option value="">창고 선택</option>
            <option v-for="wh in poStore.warehouses" :key="wh.code" :value="wh.code">
              {{ wh.name }}
            </option>
          </select>
        </div>

        <span
          v-if="isEditMode"
          class="ml-auto inline-flex items-center gap-1 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700"
        >
          수정 중: {{ editingOrderId }} · {{ currentCartVendorName }}
        </span>
        <span
          v-else-if="cart.length > 0"
          class="ml-auto inline-flex items-center gap-1 bg-[#E6F2F0] px-2 py-1 text-[10px] font-bold text-[#004D3C]"
        >
          임시 저장된 품목 {{ cart.length }}건
        </span>
      </section>

      <!-- 본문: 좌(카탈로그) + 우(장바구니) — viewport 높이 기준 자체 스크롤 -->
      <section class="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
        <PurchaseOrderCatalog
          ref="catalogRef"
          v-model:keyword="keyword"
          v-model:vendor-filter="vendorFilter"
          v-model:sort-by="sortBy"
          v-model:shortage-only="shortageOnly"
          v-model:selected-skus="selectedSkus"
          v-model:collapsed="collapsed"
          v-model:row-quantities="rowQuantities"
          :selected-warehouse-code="selectedWarehouseCode"
          :is-edit-mode="isEditMode"
          :cart="cart"
          @add-sku-to-cart="addSkuToCart"
          @add-group-to-cart="addGroupToCart"
          @scroll-to-cart-sku="scrollToCartSku"
        />

        <PurchaseOrderCart
          :cart="cart"
          :current-cart-vendor-name="currentCartVendorName"
          :grouped-by-vendor="groupedByVendor"
          :cart-total="cartTotal"
          :can-submit="canSubmit"
          :is-edit-mode="isEditMode"
          :highlighted-sku-code="highlightedSkuCode"
          @increase-qty="increaseQty"
          @decrease-qty="decreaseQty"
          @update-qty="updateQty"
          @remove-item="removeItem"
          @scroll-to-catalog-sku="scrollToCatalogSku"
          @open-clear-cart-confirm="openClearCartConfirm"
          @open-submit-confirm="openSubmitConfirm"
        />
      </section>
    </div>

    <PurchaseOrderConfirmModal
      :open="showWarehouseChangeConfirm"
      variant="signature"
      title="입고 창고 변경"
      confirm-label="변경"
      @cancel="cancelWarehouseChange"
      @confirm="confirmWarehouseChange"
    >
      <p>
        장바구니 <strong>{{ cart.length }}건</strong>이 초기화됩니다. 입고 창고를
        <strong>{{ pendingWarehouseName }}</strong
        >으로 변경할까요?
      </p>
    </PurchaseOrderConfirmModal>

    <PurchaseOrderConfirmModal
      :open="showClearCartConfirm"
      variant="red"
      title="장바구니 비우기"
      confirm-label="삭제"
      @cancel="cancelClearCart"
      @confirm="confirmClearCart"
    >
      <p>
        장바구니 <strong>{{ cart.length }}건</strong>이 모두 삭제됩니다. 계속할까요?
      </p>
    </PurchaseOrderConfirmModal>

    <PurchaseOrderSubmitConfirmModal
      :open="showSubmitConfirm"
      :is-edit-mode="isEditMode"
      :warehouse-name="selectedWarehouseName"
      :vendor-name="currentCartVendorName"
      :grouped-by-vendor="groupedByVendor"
      :item-count="cart.length"
      :total-amount="cartTotal"
      @cancel="cancelSubmitOrder"
      @confirm="confirmSubmitOrder"
    />

    <PurchaseOrderFloatingBar
      :selected-count="selectedSkus.size"
      @open-bulk-qty="openBulkQtyModal"
      @clear-selection="clearSelection"
    />

    <PurchaseOrderBulkQtyModal
      :open="showBulkQtyModal"
      :selected-count="selectedSkus.size"
      @close="closeBulkQtyModal"
      @apply="handleBulkApply"
    />

    <!-- ───────── 토스트 ───────── -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="toast.show"
        class="fixed right-4 top-4 z-[60] border border-[#004D3C] bg-white px-4 py-3 text-xs font-bold text-gray-800 shadow-lg"
      >
        {{ toast.message }}
      </div>
    </Transition>
  </AppLayout>
</template>
