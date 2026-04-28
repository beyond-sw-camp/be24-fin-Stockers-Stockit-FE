<script setup>
import { computed, h, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useVendorStore } from '@/stores/vendor.js'

const router = useRouter()
const auth = useAuthStore()
const vendor = useVendorStore()
const hqMenus = roleMenus.hq

function handleLogout() {
  auth.logout()
  router.push('/login')
}

// --- 레이아웃 설정 ---
const activeTopMenu = computed(() => '주문/발주 관리')
const activeSideMenu = ref('거래처 관리')

const sideMenus = [
  { label: '매장 주문', icon: 'file', path: '/hq/orders' },
  { label: '거래처 발주', icon: 'truck', path: '/hq/purchase-orders' },
  { label: '거래처 관리', icon: 'briefcase', path: '/hq/vendors' },
]

// --- 거래처 목록 패널 ---
const vendorSearch = ref('')
const vendorStatusFilter = ref('all')

const displayedVendors = computed(() =>
  vendor.filteredVendors(vendorSearch.value, vendorStatusFilter.value),
)

function handleSelectVendor(id) {
  vendor.selectVendor(id)
}

// --- 계약 제품 목록 패널 ---
function handleSelectProduct(id) {
  vendor.selectProduct(id)
}

// --- 모달 상태 (등록/수정) ---
const showModal = ref(false)
const modalMode = ref('create') // 'create' | 'edit'

// 등록 모달은 status 키 없음 (CEN-027: 신규 등록은 항상 active로 store default 적용).
// 수정 모달은 openEditModal 에서 detail.status 를 별도 주입한다.
const initialFormData = () => ({
  productCode: '',
  productName: '',
  unitPrice: '',
  moq: '',
  leadTimeDays: '',
  contractStart: '',
  contractEnd: '',
})

const formData = ref(initialFormData())

const initialFormErrors = () => ({
  productCode: '',
  productName: '',
  unitPrice: '',
  moq: '',
  leadTimeDays: '',
  contractStart: '',
  contractEnd: '',
})

const formErrors = ref(initialFormErrors())

function validateForm() {
  const errors = initialFormErrors()
  const fd = formData.value

  if (!fd.productCode) {
    errors.productCode = '필수 입력 항목입니다'
  } else if (
    vendor.isProductCodeDuplicate(
      vendor.selectedVendorId,
      fd.productCode,
      modalMode.value === 'edit' ? vendor.selectedProductId : null,
    )
  ) {
    errors.productCode = '이미 등록된 제품 코드입니다'
  }

  if (!fd.productName) errors.productName = '필수 입력 항목입니다'

  if (fd.unitPrice === '' || fd.unitPrice === null) {
    errors.unitPrice = '필수 입력 항목입니다'
  } else if (!(Number(fd.unitPrice) > 0)) {
    errors.unitPrice = '0보다 큰 값을 입력하세요'
  }

  if (fd.moq === '' || fd.moq === null) {
    errors.moq = '필수 입력 항목입니다'
  } else if (!(Number(fd.moq) > 0)) {
    errors.moq = '0보다 큰 값을 입력하세요'
  }

  if (fd.leadTimeDays === '' || fd.leadTimeDays === null) {
    errors.leadTimeDays = '필수 입력 항목입니다'
  } else if (!(Number(fd.leadTimeDays) > 0)) {
    errors.leadTimeDays = '0보다 큰 값을 입력하세요'
  }

  if (!fd.contractStart) errors.contractStart = '필수 입력 항목입니다'

  if (!fd.contractEnd) {
    errors.contractEnd = '필수 입력 항목입니다'
  } else if (fd.contractStart && fd.contractEnd < fd.contractStart) {
    errors.contractEnd = '종료일은 시작일 이후여야 합니다'
  }

  formErrors.value = errors
  return Object.values(errors).every((msg) => !msg)
}

function openCreateModal() {
  modalMode.value = 'create'
  formData.value = initialFormData()
  formErrors.value = initialFormErrors()
  showModal.value = true
}

function openEditModal() {
  const detail = vendor.selectedProductDetail
  if (!detail) return
  if (detail.status === 'expired') {
    alert('만료된 계약은 수정할 수 없습니다.')
    return
  }
  modalMode.value = 'edit'
  formData.value = {
    productCode: detail.productCode,
    productName: detail.productName,
    unitPrice: String(detail.unitPrice),
    moq: String(detail.moq),
    leadTimeDays: String(detail.leadTimeDays),
    contractStart: detail.contractStart,
    contractEnd: detail.contractEnd,
  }
  formErrors.value = initialFormErrors()
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  formErrors.value = initialFormErrors()
}

// --- 등록 성공 토스트 ---
const toastMessage = ref('')
const showToast = ref(false)
let toastTimer = null
function triggerToast(message) {
  toastMessage.value = message
  showToast.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    showToast.value = false
  }, 3000)
}

async function handleSubmitForm() {
  if (!validateForm()) return

  try {
    if (modalMode.value === 'create') {
      await vendor.createProduct(formData.value)
      closeModal()
      triggerToast('계약 제품이 등록되었습니다')
    } else {
      await vendor.updateProduct(vendor.selectedProductId, formData.value)
      closeModal()
      triggerToast('계약 제품 정보가 수정되었습니다')
    }
  } catch (err) {
    triggerToast(err?.message ?? '요청 처리 중 오류가 발생했습니다')
  }
}

// --- 상태 변경 (CEN-029) ---
// expired 는 버튼 자체가 disabled 라 가드 분기 불필요.
// 네이티브 confirm/alert 대신 커스텀 모달로 통일(CEN-027/028 톤 일치).
const showStatusConfirm = ref(false)
const pendingStatusChange = ref(null) // { productId, productName, newStatus, label }

function handleToggleStatus() {
  const detail = vendor.selectedProductDetail
  if (!detail || detail.status === 'expired') return
  const newStatus = detail.status === 'active' ? 'suspended' : 'active'
  const label = newStatus === 'active' ? '활성' : '정지'
  pendingStatusChange.value = {
    productId: detail.id,
    productName: detail.productName,
    newStatus,
    label,
  }
  showStatusConfirm.value = true
}

async function confirmStatusChange() {
  const change = pendingStatusChange.value
  if (!change) return
  try {
    await vendor.updateStatus(change.productId, change.newStatus)
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
  const detail = vendor.selectedProductDetail
  if (!detail) return
  if (!confirm(`[${detail.productName}] 계약을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return
  try {
    await vendor.deleteProduct(detail.id)
    triggerToast('계약 제품이 삭제되었습니다')
  } catch (err) {
    triggerToast(err?.message ?? '삭제에 실패했습니다')
  }
}

// --- 상태 뱃지 헬퍼 ---
function statusLabel(status) {
  const map = { active: '활성', suspended: '정지', expired: '만료' }
  return map[status] ?? status
}

function statusClass(status) {
  if (status === 'active') return 'bg-emerald-50 text-emerald-700'
  if (status === 'suspended') return 'bg-amber-50 text-amber-700'
  if (status === 'expired') return 'bg-gray-100 text-gray-400'
  return 'bg-gray-100 text-gray-400'
}

function vendorStatusLabel(status) {
  return status === 'active' ? '활성' : '비활성'
}

function vendorStatusClass(status) {
  return status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'
}

// --- 금액 포맷 ---
function formatPrice(value) {
  return `₩${Number(value).toLocaleString()}`
}

// --- SVG 아이콘 헬퍼 ---
const IconBase = (paths) => ({
  props: {
    size: { type: Number, default: 16 },
    strokeWidth: { type: Number, default: 2 },
  },
  render() {
    return h(
      'svg',
      {
        width: this.size,
        height: this.size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': this.strokeWidth,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true',
      },
      paths.map((path) => h(path.tag, path.attrs)),
    )
  },
})

const SearchIcon = IconBase([
  { tag: 'circle', attrs: { cx: '11', cy: '11', r: '7' } },
  { tag: 'path', attrs: { d: 'm20 20-3.5-3.5' } },
])

const PlusIcon = IconBase([
  { tag: 'path', attrs: { d: 'M12 5v14' } },
  { tag: 'path', attrs: { d: 'M5 12h14' } },
])

const PencilIcon = IconBase([
  { tag: 'path', attrs: { d: 'M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z' } },
  { tag: 'path', attrs: { d: 'M15 5 19 9' } },
])

const Trash2Icon = IconBase([
  { tag: 'path', attrs: { d: 'M3 6h18' } },
  { tag: 'path', attrs: { d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' } },
  { tag: 'path', attrs: { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' } },
  { tag: 'line', attrs: { x1: '10', y1: '11', x2: '10', y2: '17' } },
  { tag: 'line', attrs: { x1: '14', y1: '11', x2: '14', y2: '17' } },
])

const ToggleRightIcon = IconBase([
  { tag: 'rect', attrs: { x: '1', y: '6', width: '22', height: '12', rx: '6' } },
  { tag: 'circle', attrs: { cx: '17', cy: '12', r: '3' } },
])

const ToggleLeftIcon = IconBase([
  { tag: 'rect', attrs: { x: '1', y: '6', width: '22', height: '12', rx: '6' } },
  { tag: 'circle', attrs: { cx: '7', cy: '12', r: '3' } },
])

const XIcon = IconBase([
  { tag: 'path', attrs: { d: 'M18 6 6 18' } },
  { tag: 'path', attrs: { d: 'm6 6 12 12' } },
])

const BuildingIcon = IconBase([
  { tag: 'rect', attrs: { x: '4', y: '2', width: '16', height: '20', rx: '1' } },
  { tag: 'path', attrs: { d: 'M9 22v-4h6v4' } },
  { tag: 'path', attrs: { d: 'M8 6h.01' } },
  { tag: 'path', attrs: { d: 'M16 6h.01' } },
  { tag: 'path', attrs: { d: 'M12 6h.01' } },
  { tag: 'path', attrs: { d: 'M12 10h.01' } },
  { tag: 'path', attrs: { d: 'M8 10h.01' } },
  { tag: 'path', attrs: { d: 'M16 10h.01' } },
  { tag: 'path', attrs: { d: 'M8 14h.01' } },
  { tag: 'path', attrs: { d: 'M16 14h.01' } },
  { tag: 'path', attrs: { d: 'M12 14h.01' } },
])

const PackageIcon = IconBase([
  {
    tag: 'path',
    attrs: {
      d: 'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z',
    },
  },
  { tag: 'path', attrs: { d: 'M12 22V12' } },
  { tag: 'path', attrs: { d: 'M3.27 6.96 12 12.01l8.73-5.05' } },
  { tag: 'path', attrs: { d: 'M16 4 8 8.5' } },
])

const InfoIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 10v6' } },
  { tag: 'path', attrs: { d: 'M12 7h.01' } },
])
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
      <!-- ====================================================
           1열: 거래처 목록 패널
           ==================================================== -->
      <div
        class="flex w-64 shrink-0 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm"
      >
        <!-- 패널 헤더 -->
        <div class="flex items-center justify-between bg-[#004D3C] px-3 py-2.5 text-white">
          <h2
            class="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider"
          >
            <BuildingIcon :size="13" />
            거래처 목록
          </h2>
          <span class="text-[10px] font-bold opacity-70">{{ displayedVendors.length }}개</span>
        </div>

        <!-- 검색 / 필터 -->
        <div class="border-b border-gray-200 p-2 space-y-2">
          <label class="relative block">
            <SearchIcon
              :size="13"
              class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              v-model="vendorSearch"
              type="text"
              placeholder="거래처명 / 담당자 검색..."
              class="w-full border border-gray-300 bg-gray-50 py-1.5 pl-7 pr-2 text-[11px] outline-none focus:border-[#004D3C] focus:bg-white"
            />
          </label>
          <select
            v-model="vendorStatusFilter"
            class="w-full appearance-none border border-gray-300 bg-gray-50 px-2 py-1.5 text-[11px] font-bold text-gray-700 outline-none focus:border-[#004D3C]"
          >
            <option value="all">전체 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
          </select>
        </div>

        <!-- 거래처 리스트 -->
        <div class="flex-1 overflow-y-auto divide-y divide-gray-100">
          <div
            v-if="displayedVendors.length === 0"
            class="flex flex-col items-center justify-center gap-2 py-10 text-center text-[11px] text-gray-400"
          >
            <BuildingIcon :size="28" class="opacity-30" />
            <p>거래처가 없습니다.</p>
          </div>

          <button
            v-for="v in displayedVendors"
            :key="v.id"
            type="button"
            class="w-full px-3 py-3 text-left transition-colors hover:bg-gray-50"
            :class="vendor.selectedVendorId === v.id ? 'bg-[#E6F2F0]' : ''"
            @click="handleSelectVendor(v.id)"
          >
            <div class="flex items-center justify-between gap-1">
              <span
                class="max-w-[130px] truncate text-[12px] font-black text-gray-800"
                :class="vendor.selectedVendorId === v.id ? 'text-[#004D3C]' : ''"
              >
                {{ v.name }}
              </span>
              <span
                class="shrink-0 px-1.5 py-0.5 text-[9px] font-black"
                :class="vendorStatusClass(v.status)"
              >
                {{ vendorStatusLabel(v.status) }}
              </span>
            </div>
            <p class="mt-0.5 truncate text-[10px] text-gray-400">
              {{ v.contactPerson }} · {{ v.phone }}
            </p>
          </button>
        </div>
      </div>

      <!-- ====================================================
           2열: 계약 제품 목록 패널
           ==================================================== -->
      <div
        class="flex min-w-0 flex-1 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm"
      >
        <!-- 패널 헤더 -->
        <div class="flex items-center justify-between bg-[#004D3C] px-3 py-2.5 text-white">
          <h2
            class="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider"
          >
            <PackageIcon :size="13" />
            <span v-if="vendor.selectedVendor"> {{ vendor.selectedVendor.name }} — 계약 제품 </span>
            <span v-else>계약 제품 목록</span>
          </h2>
          <button
            v-if="vendor.selectedVendorId"
            type="button"
            class="inline-flex items-center gap-1 border border-white/30 px-2 py-1 text-[10px] font-black text-white hover:bg-white/10"
            @click="openCreateModal"
          >
            <PlusIcon :size="12" />
            계약 제품 추가
          </button>
        </div>

        <!-- 거래처 미선택 상태 -->
        <div
          v-if="!vendor.selectedVendorId"
          class="flex flex-1 flex-col items-center justify-center gap-3 text-center text-gray-400"
        >
          <BuildingIcon :size="40" class="opacity-20" />
          <div>
            <p class="text-sm font-black">거래처를 선택해주세요</p>
            <p class="mt-1 text-xs">
              좌측 목록에서 거래처를 선택하면<br />계약 제품 목록이 표시됩니다.
            </p>
          </div>
        </div>

        <!-- 계약 제품 테이블 -->
        <template v-else>
          <div class="overflow-auto flex-1">
            <table class="w-full min-w-[560px] table-fixed border-collapse text-xs">
              <thead
                class="sticky top-0 z-10 bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500"
              >
                <tr>
                  <th class="w-24 px-3 py-2 text-left font-black">제품 코드</th>
                  <th class="px-3 py-2 text-left font-black">제품명</th>
                  <th class="w-24 px-3 py-2 text-right font-black">단가</th>
                  <th class="w-16 px-3 py-2 text-right font-black">MOQ</th>
                  <th class="w-16 px-3 py-2 text-right font-black">납기(일)</th>
                  <th class="w-20 px-3 py-2 text-center font-black">상태</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-if="vendor.currentVendorProducts.length === 0">
                  <td colspan="6" class="py-12 text-center text-[11px] text-gray-400">
                    등록된 계약 제품이 없습니다.
                  </td>
                </tr>

                <tr
                  v-for="vp in vendor.currentVendorProducts"
                  :key="vp.id"
                  class="cursor-pointer transition-colors hover:bg-gray-50"
                  :class="vendor.selectedProductId === vp.id ? 'bg-[#E6F2F0]' : ''"
                  @click="handleSelectProduct(vp.id)"
                >
                  <td class="px-3 py-2.5 font-bold text-gray-400">{{ vp.productCode }}</td>
                  <td class="truncate px-3 py-2.5 font-black text-gray-800">
                    {{ vp.productName }}
                  </td>
                  <td class="px-3 py-2.5 text-right font-black text-gray-700">
                    {{ formatPrice(vp.unitPrice) }}
                  </td>
                  <td class="px-3 py-2.5 text-right font-bold text-gray-600">{{ vp.moq }}</td>
                  <td class="px-3 py-2.5 text-right font-bold text-gray-600">
                    {{ vp.leadTimeDays }}
                  </td>
                  <td class="px-3 py-2.5 text-center">
                    <span
                      class="inline-flex px-2 py-0.5 text-[10px] font-black"
                      :class="statusClass(vp.status)"
                    >
                      {{ statusLabel(vp.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 요약 푸터 -->
          <div
            class="border-t border-gray-200 bg-gray-50 px-3 py-2 text-[10px] font-bold text-gray-500"
          >
            총 {{ vendor.currentVendorProducts.length }}건의 계약 제품
          </div>
        </template>
      </div>

      <!-- ====================================================
           3열: 계약 조건 상세 패널
           ==================================================== -->
      <div
        class="flex w-72 shrink-0 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm"
      >
        <!-- 패널 헤더 -->
        <div class="flex items-center bg-[#004D3C] px-3 py-2.5 text-white">
          <h2
            class="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider"
          >
            <InfoIcon :size="13" />
            계약 조건 상세
          </h2>
        </div>

        <!-- 제품 미선택 상태 -->
        <div
          v-if="!vendor.selectedProductDetail"
          class="flex flex-1 flex-col items-center justify-center gap-3 text-center text-gray-400"
        >
          <PackageIcon :size="36" class="opacity-20" />
          <div>
            <p class="text-sm font-black">제품을 선택해주세요</p>
            <p class="mt-1 text-xs">
              계약 제품 목록에서 행을 선택하면<br />상세 조건이 표시됩니다.
            </p>
          </div>
        </div>

        <!-- 상세 정보 -->
        <template v-else>
          <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            <!-- 제품 기본 정보 -->
            <section class="space-y-2">
              <p class="text-[9px] font-black uppercase tracking-wider text-gray-400">제품 정보</p>
              <p class="text-sm font-black leading-snug text-gray-900">
                {{ vendor.selectedProductDetail.productName }}
              </p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  class="border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600"
                >
                  {{ vendor.selectedProductDetail.productCode }}
                </span>
                <span
                  class="px-2 py-0.5 text-[10px] font-black"
                  :class="statusClass(vendor.selectedProductDetail.status)"
                >
                  {{ statusLabel(vendor.selectedProductDetail.status) }}
                </span>
              </div>
            </section>

            <!-- 계약 조건 -->
            <section class="space-y-2.5">
              <p class="text-[9px] font-black uppercase tracking-wider text-gray-400">계약 조건</p>

              <div class="grid grid-cols-2 gap-2">
                <div class="border border-gray-100 bg-gray-50 p-2.5">
                  <p class="text-[9px] font-bold uppercase text-gray-400">계약 단가</p>
                  <strong class="mt-1 block text-sm font-black text-[#004D3C]">
                    {{ formatPrice(vendor.selectedProductDetail.unitPrice) }}
                  </strong>
                </div>
                <div class="border border-gray-100 bg-gray-50 p-2.5">
                  <p class="text-[9px] font-bold uppercase text-gray-400">최소 주문량 (MOQ)</p>
                  <strong class="mt-1 block text-sm font-black text-gray-800">
                    {{ vendor.selectedProductDetail.moq }} EA
                  </strong>
                </div>
                <div class="border border-gray-100 bg-gray-50 p-2.5">
                  <p class="text-[9px] font-bold uppercase text-gray-400">납기일수</p>
                  <strong class="mt-1 block text-sm font-black text-gray-800">
                    {{ vendor.selectedProductDetail.leadTimeDays }}일
                  </strong>
                </div>
              </div>
            </section>

            <!-- 계약 기간 -->
            <section class="space-y-2">
              <p class="text-[9px] font-black uppercase tracking-wider text-gray-400">계약 기간</p>
              <div class="space-y-1.5 text-xs font-bold text-gray-700">
                <div class="flex justify-between">
                  <span class="text-gray-400">시작일</span>
                  <span>{{ vendor.selectedProductDetail.contractStart }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">종료일</span>
                  <span
                    :class="vendor.selectedProductDetail.status === 'expired' ? 'text-red-600' : ''"
                  >
                    {{ vendor.selectedProductDetail.contractEnd }}
                  </span>
                </div>
              </div>
            </section>

            <!-- 거래처 담당자 정보 -->
            <section v-if="vendor.selectedVendor" class="space-y-2 border-t border-gray-100 pt-3">
              <p class="text-[9px] font-black uppercase tracking-wider text-gray-400">
                거래처 담당자
              </p>
              <div class="space-y-1 text-xs font-bold">
                <p class="text-gray-800">{{ vendor.selectedVendor.contactPerson }}</p>
                <p class="text-gray-400">{{ vendor.selectedVendor.contactEmail }}</p>
                <p class="text-gray-400">{{ vendor.selectedVendor.phone }}</p>
              </div>
            </section>
          </div>

          <!-- 액션 버튼 영역 -->
          <div class="flex flex-col gap-2 border-t border-gray-200 p-3">
            <button
              type="button"
              class="inline-flex w-full items-center justify-center gap-1.5 border px-3 py-2 text-[11px] font-black transition-colors"
              :class="
                vendor.selectedProductDetail.status === 'expired'
                  ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300'
                  : 'border-[#004D3C] bg-[#004D3C] text-white hover:bg-[#1f4b3a]'
              "
              :disabled="vendor.selectedProductDetail.status === 'expired'"
              @click="openEditModal"
            >
              <PencilIcon :size="13" />
              {{ vendor.selectedProductDetail.status === 'expired' ? '만료됨 (수정 불가)' : '수정' }}
            </button>

            <button
              type="button"
              class="inline-flex w-full items-center justify-center gap-1.5 border px-3 py-2 text-[11px] font-black transition-colors"
              :class="
                vendor.selectedProductDetail.status === 'active'
                  ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : vendor.selectedProductDetail.status === 'expired'
                    ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              "
              :disabled="vendor.selectedProductDetail.status === 'expired'"
              @click="handleToggleStatus"
            >
              <ToggleRightIcon v-if="vendor.selectedProductDetail.status === 'active'" :size="13" />
              <ToggleLeftIcon v-else :size="13" />
              {{
                vendor.selectedProductDetail.status === 'active'
                  ? '계약 정지'
                  : vendor.selectedProductDetail.status === 'suspended'
                    ? '계약 활성화'
                    : '만료됨 (변경 불가)'
              }}
            </button>

            <button
              type="button"
              class="inline-flex w-full items-center justify-center gap-1.5 border border-red-300 bg-red-50 px-3 py-2 text-[11px] font-black text-red-700 hover:bg-red-100"
              @click="handleDeleteProduct"
            >
              <Trash2Icon :size="13" />
              삭제
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- ====================================================
         등록 / 수정 모달
         ==================================================== -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="closeModal"
    >
      <div class="w-full max-w-md border border-gray-300 bg-white shadow-xl">
        <!-- 모달 헤더 -->
        <div class="flex items-center justify-between bg-[#004D3C] px-4 py-3 text-white">
          <h3 class="text-[11px] font-black uppercase tracking-wider">
            {{ modalMode === 'create' ? '계약 제품 추가' : '계약 제품 수정' }}
          </h3>
          <button type="button" class="p-1 hover:bg-white/10" @click="closeModal">
            <XIcon :size="16" />
          </button>
        </div>

        <!-- 모달 본문 -->
        <div class="p-4 space-y-3">
          <label class="flex flex-col gap-1">
            <span class="text-[10px] font-black uppercase text-gray-400">제품 코드</span>
            <input
              v-model="formData.productCode"
              type="text"
              placeholder="ITM-XXXX"
              class="border bg-gray-50 px-3 py-2 text-xs outline-none focus:bg-white"
              :class="
                formErrors.productCode
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-300 focus:border-[#004D3C]'
              "
            />
            <p v-if="formErrors.productCode" class="mt-1 text-[10px] font-bold text-red-600">
              {{ formErrors.productCode }}
            </p>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[10px] font-black uppercase text-gray-400">제품명</span>
            <input
              v-model="formData.productName"
              type="text"
              placeholder="제품명을 입력하세요"
              class="border bg-gray-50 px-3 py-2 text-xs outline-none focus:bg-white"
              :class="
                formErrors.productName
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-300 focus:border-[#004D3C]'
              "
            />
            <p v-if="formErrors.productName" class="mt-1 text-[10px] font-bold text-red-600">
              {{ formErrors.productName }}
            </p>
          </label>

          <div class="grid grid-cols-3 gap-3">
            <label class="flex flex-col gap-1">
              <span class="text-[10px] font-black uppercase text-gray-400">계약 단가 (₩)</span>
              <input
                v-model="formData.unitPrice"
                type="number"
                min="0"
                placeholder="0"
                class="border bg-gray-50 px-3 py-2 text-xs outline-none focus:bg-white"
                :class="
                  formErrors.unitPrice
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-[#004D3C]'
                "
              />
              <p v-if="formErrors.unitPrice" class="mt-1 text-[10px] font-bold text-red-600">
                {{ formErrors.unitPrice }}
              </p>
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-[10px] font-black uppercase text-gray-400">MOQ (EA)</span>
              <input
                v-model="formData.moq"
                type="number"
                min="1"
                placeholder="0"
                class="border bg-gray-50 px-3 py-2 text-xs outline-none focus:bg-white"
                :class="
                  formErrors.moq
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-[#004D3C]'
                "
              />
              <p v-if="formErrors.moq" class="mt-1 text-[10px] font-bold text-red-600">
                {{ formErrors.moq }}
              </p>
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-[10px] font-black uppercase text-gray-400">납기일수</span>
              <input
                v-model="formData.leadTimeDays"
                type="number"
                min="1"
                placeholder="0"
                class="border bg-gray-50 px-3 py-2 text-xs outline-none focus:bg-white"
                :class="
                  formErrors.leadTimeDays
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-[#004D3C]'
                "
              />
              <p v-if="formErrors.leadTimeDays" class="mt-1 text-[10px] font-bold text-red-600">
                {{ formErrors.leadTimeDays }}
              </p>
            </label>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <label class="flex flex-col gap-1">
              <span class="text-[10px] font-black uppercase text-gray-400">계약 시작일</span>
              <input
                v-model="formData.contractStart"
                type="date"
                class="border bg-gray-50 px-3 py-2 text-xs outline-none focus:bg-white"
                :class="
                  formErrors.contractStart
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-[#004D3C]'
                "
              />
              <p v-if="formErrors.contractStart" class="mt-1 text-[10px] font-bold text-red-600">
                {{ formErrors.contractStart }}
              </p>
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-[10px] font-black uppercase text-gray-400">계약 종료일</span>
              <input
                v-model="formData.contractEnd"
                type="date"
                class="border bg-gray-50 px-3 py-2 text-xs outline-none focus:bg-white"
                :class="
                  formErrors.contractEnd
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-[#004D3C]'
                "
              />
              <p v-if="formErrors.contractEnd" class="mt-1 text-[10px] font-bold text-red-600">
                {{ formErrors.contractEnd }}
              </p>
            </label>
          </div>
        </div>

        <!-- 모달 푸터 -->
        <div class="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
          <button
            type="button"
            class="border border-gray-300 bg-white px-4 py-2 text-[11px] font-black text-gray-700 hover:bg-gray-50"
            @click="closeModal"
          >
            취소
          </button>
          <button
            type="button"
            class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-[11px] font-black text-white hover:bg-[#1f4b3a]"
            @click="handleSubmitForm"
          >
            {{ modalMode === 'create' ? '등록' : '저장' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ====================================================
         계약 상태 변경 확인 모달 (CEN-029)
         ==================================================== -->
    <div
      v-if="showStatusConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="cancelStatusChange"
    >
      <div class="w-full max-w-sm border border-gray-300 bg-white shadow-xl">
        <div class="flex items-center justify-between bg-[#004D3C] px-4 py-3 text-white">
          <h3 class="text-[11px] font-black uppercase tracking-wider">계약 상태 변경 확인</h3>
          <button type="button" class="p-1 hover:bg-white/10" @click="cancelStatusChange">
            <XIcon :size="16" />
          </button>
        </div>

        <div class="p-5 text-xs text-gray-700 space-y-2">
          <p>
            <strong class="font-black text-gray-900">{{ pendingStatusChange?.productName }}</strong>
            계약을
            <strong
              class="font-black"
              :class="
                pendingStatusChange?.newStatus === 'active' ? 'text-emerald-700' : 'text-amber-700'
              "
            >
              "{{ pendingStatusChange?.label }}"
            </strong>
            상태로 변경하시겠습니까?
          </p>
          <p class="text-[10px] font-bold text-gray-400">
            변경 즉시 본사 발주 가능 여부에 영향이 있습니다.
          </p>
        </div>

        <div class="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
          <button
            type="button"
            class="border border-gray-300 bg-white px-4 py-2 text-[11px] font-black text-gray-700 hover:bg-gray-50"
            @click="cancelStatusChange"
          >
            취소
          </button>
          <button
            type="button"
            class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-[11px] font-black text-white hover:bg-[#1f4b3a]"
            @click="confirmStatusChange"
          >
            변경
          </button>
        </div>
      </div>
    </div>

    <!-- 토스트 (등록·수정·상태 변경 공통) -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showToast"
        class="fixed top-4 right-4 z-[60] border border-[#004D3C] bg-white px-4 py-3 shadow-lg"
      >
        <p class="text-[11px] font-black text-[#004D3C]">{{ toastMessage }}</p>
      </div>
    </Transition>
  </AppLayout>
</template>
