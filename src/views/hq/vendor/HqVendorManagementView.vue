<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import VendorListPanel from '@/components/hq/vendor/VendorListPanel.vue'
import VendorContractListPanel from '@/components/hq/vendor/VendorContractListPanel.vue'
import VendorContractDetailPanel from '@/components/hq/vendor/VendorContractDetailPanel.vue'
import VendorContractFormModal from '@/components/hq/vendor/VendorContractFormModal.vue'
import VendorStatusConfirmModal from '@/components/hq/vendor/VendorStatusConfirmModal.vue'
import { useVendorContractForm } from '@/composables/hq/vendor/useVendorContractForm.js'
import { useToast } from '@/composables/useToast.js'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useVendorStore } from '@/stores/vendor.js'

const router = useRouter()
const auth = useAuthStore()
const vendor = useVendorStore()
const hqMenus = roleMenus.hq

function handleLogout() {
  auth.logout()
  router.push('/dev-login')
}

// --- 레이아웃 ---
const activeTopMenu = computed(() => '주문/발주 관리')
const activeSideMenu = ref('공급처 관리')

const sideMenus = [
  { label: '매장 주문', icon: 'file', path: '/hq/orders' },
  { label: '공급처 발주', icon: 'truck', path: '/hq/purchase-orders' },
  { label: '공급처 관리', icon: 'briefcase', path: '/hq/vendors' },
]

// --- 패널 1: 공급처 목록 ---
const vendorSearch = ref('')
const vendorStatusFilter = ref('all')

const displayedVendors = computed(() =>
  vendor.filteredVendors(vendorSearch.value, vendorStatusFilter.value),
)

function handleSelectVendor(id) {
  vendor.selectVendor(id)
}

// --- 패널 2: 계약 제품 목록 + selectedRow ---
// vendor.contracts 의 행 하나를 선택. 미정(contracted=false) 또는 활성(contracted=true) 모두 selectedRow 에 저장.
const selectedProductCode = ref(null)
const selectedRow = computed(() => {
  if (!selectedProductCode.value) return null
  return vendor.contracts.find((r) => r.productCode === selectedProductCode.value) ?? null
})

function handleSelectRow(productCode) {
  selectedProductCode.value = productCode
}

// --- 토스트 ---
const { toast, triggerToast } = useToast()

// --- 모달 상태/검증/제출 (composable) ---
const {
  showModal,
  modalMode,
  formData,
  formErrors,
  openCreateModal,
  openEditModal,
  closeModal,
  handleSubmitForm,
} = useVendorContractForm({
  vendor,
  getSelectedRow: () => selectedRow.value,
  onSuccess: triggerToast,
})

// --- 상태 변경 (CEN-029) ---
const showStatusConfirm = ref(false)
const pendingStatusChange = ref(null) // { vendorProductCode, productName, newStatus, label }

function handleToggleStatus() {
  const row = selectedRow.value
  if (!row || !row.contracted || row.status === 'EXPIRED') return
  const newStatus = row.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
  const label = newStatus === 'ACTIVE' ? '활성' : '정지'
  pendingStatusChange.value = {
    vendorProductCode: row.vendorProductCode,
    productName: row.productName,
    newStatus,
    label,
  }
  showStatusConfirm.value = true
}

async function confirmStatusChange() {
  const change = pendingStatusChange.value
  if (!change) return
  try {
    await vendor.updateStatus(change.vendorProductCode, change.newStatus)
    triggerToast(`계약이 "${change.label}" 상태로 변경되었습니다`)
  } catch (err) {
    triggerToast(err?.message ?? '상태 변경에 실패했습니다')
  } finally {
    cancelStatusChange()
  }
}

function cancelStatusChange() {
  showStatusConfirm.value = false
  pendingStatusChange.value = null
}

// --- 삭제 ---
async function handleDeleteProduct() {
  const row = selectedRow.value
  if (!row || !row.contracted) return
  if (!confirm(`[${row.productName}] 계약을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return
  try {
    await vendor.deleteProduct(row.vendorProductCode)
    triggerToast('계약이 삭제되었습니다')
  } catch (err) {
    triggerToast(err?.message ?? '삭제에 실패했습니다')
  }
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    show-system-card
    @logout="handleLogout"
  >
    <!-- 3열 레이아웃 -->
    <div class="flex min-h-0 gap-4 overflow-hidden">
      <VendorListPanel
        :vendors="displayedVendors"
        :selected-vendor-id="vendor.selectedVendorId"
        :search="vendorSearch"
        :status-filter="vendorStatusFilter"
        @update:search="vendorSearch = $event"
        @update:status-filter="vendorStatusFilter = $event"
        @select="handleSelectVendor"
      />

      <VendorContractListPanel
        :selected-vendor="vendor.selectedVendor"
        :contracts="vendor.contracts"
        :selected-product-code="selectedProductCode"
        @select-row="handleSelectRow"
      />

      <VendorContractDetailPanel
        :selected-row="selectedRow"
        :selected-vendor="vendor.selectedVendor"
        @create-contract="openCreateModal"
        @edit-contract="openEditModal"
        @toggle-status="handleToggleStatus"
        @delete-contract="handleDeleteProduct"
      />
    </div>

    <VendorContractFormModal
      :open="showModal"
      :mode="modalMode"
      :selected-row="selectedRow"
      :form-data="formData"
      :form-errors="formErrors"
      @close="closeModal"
      @submit="handleSubmitForm"
    />

    <VendorStatusConfirmModal
      :open="showStatusConfirm"
      :pending-change="pendingStatusChange"
      @cancel="cancelStatusChange"
      @confirm="confirmStatusChange"
    />

    <!-- 토스트 (등록·수정·상태 변경 공통) -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="toast.show"
        class="fixed top-4 right-4 z-[60] border border-[#004D3C] bg-white px-4 py-3 shadow-lg"
      >
        <p class="text-[11px] font-black text-[#004D3C]">{{ toast.message }}</p>
      </div>
    </Transition>
  </AppLayout>
</template>
