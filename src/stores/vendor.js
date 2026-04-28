import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { vendorApi } from '@/api/vendor.js'

// ─── BE 응답 → FE 모델 매핑 ─────────────────────────────────────────────
// BE 의 code 를 FE 의 id 로 노출하고, status 는 소문자로 변환해 기존 화면·헬퍼와 호환.

function fromApiVendor(v) {
  return {
    id: v.code,
    name: v.name,
    contactPerson: v.contactName,
    contactEmail: v.contactEmail,
    phone: v.contactPhone,
    status: (v.status ?? '').toLowerCase(),
  }
}

function fromApiVendorProduct(vp) {
  return {
    id: vp.code,
    vendorId: vp.vendorCode,
    vendorName: vp.vendorName,
    productCode: vp.productCode,
    productName: vp.productName,
    unitPrice: vp.unitPrice,
    moq: vp.moq,
    leadTimeDays: vp.leadTimeDays,
    contractStart: vp.contractStart,
    contractEnd: vp.contractEnd,
    status: (vp.status ?? '').toLowerCase(),
  }
}

export const useVendorStore = defineStore('vendor', () => {
  // --- state ---
  const vendors = ref([])
  const vendorProducts = ref([]) // 현재 선택된 vendor 의 계약 제품만 보유 (거래처 관리 페이지용)
  const allVendorProducts = ref([]) // 전체 거래처의 활성 제품 (CEN-035 발주 작성 카탈로그용)
  const selectedVendorId = ref(null)
  const selectedProductId = ref(null)
  const loading = ref(false)

  // --- getters ---
  const currentVendorProducts = computed(() => {
    if (!selectedVendorId.value) return []
    return vendorProducts.value.filter((vp) => vp.vendorId === selectedVendorId.value)
  })

  const selectedProductDetail = computed(() => {
    if (!selectedProductId.value) return null
    return vendorProducts.value.find((vp) => vp.id === selectedProductId.value) ?? null
  })

  const selectedVendor = computed(() => {
    if (!selectedVendorId.value) return null
    return vendors.value.find((v) => v.id === selectedVendorId.value) ?? null
  })

  function filteredVendors(searchTerm, statusFilter) {
    const keyword = (searchTerm ?? '').trim().toLowerCase()
    return vendors.value.filter((v) => {
      const matchStatus = !statusFilter || statusFilter === 'all' || v.status === statusFilter
      const matchKeyword =
        !keyword ||
        v.name.toLowerCase().includes(keyword) ||
        (v.contactPerson ?? '').toLowerCase().includes(keyword) ||
        (v.contactEmail ?? '').toLowerCase().includes(keyword)
      return matchStatus && matchKeyword
    })
  }

  // 같은 거래처에 같은 제품 코드가 이미 등록되어 있는지 검사 (UX 즉시 피드백용)
  // BE 도 DUPLICATE_VENDOR_PRODUCT_CODE 로 막지만 입력 시점 즉시 알림.
  function isProductCodeDuplicate(vendorId, productCode, excludeId = null) {
    if (!vendorId || !productCode) return false
    return vendorProducts.value.some(
      (vp) =>
        vp.vendorId === vendorId &&
        vp.productCode === productCode &&
        vp.id !== excludeId,
    )
  }

  // --- actions ---

  // 거래처 목록 fetch (mount 시)
  async function fetchVendors() {
    loading.value = true
    try {
      const list = await vendorApi.listVendors()
      vendors.value = (list ?? []).map(fromApiVendor)
    } finally {
      loading.value = false
    }
  }

  // 전체 거래처 제품 fetch (CEN-035 발주 작성 카탈로그용)
  // 기존 vendorProducts 와 분리된 별 state (allVendorProducts) 에 적재.
  async function fetchAllVendorProducts(status = 'ACTIVE') {
    loading.value = true
    try {
      const list = await vendorApi.listAllVendorProducts(status)
      allVendorProducts.value = (list ?? []).map(fromApiVendorProduct)
    } finally {
      loading.value = false
    }
  }

  // 거래처별 계약 제품 fetch
  async function fetchProductsByVendor(vendorCode) {
    if (!vendorCode) {
      vendorProducts.value = []
      return
    }
    loading.value = true
    try {
      const list = await vendorApi.listVendorProducts(vendorCode)
      vendorProducts.value = (list ?? []).map(fromApiVendorProduct)
    } finally {
      loading.value = false
    }
  }

  // 거래처 선택 + 그 거래처의 제품 자동 fetch
  async function selectVendor(id) {
    selectedVendorId.value = id
    selectedProductId.value = null
    await fetchProductsByVendor(id)
  }

  function selectProduct(id) {
    selectedProductId.value = id
  }

  // 계약 제품 등록 (CEN-027)
  async function createProduct(data) {
    const created = await vendorApi.createVendorProduct({
      vendorCode: selectedVendorId.value,
      productCode: data.productCode,
      productName: data.productName,
      unitPrice: Number(data.unitPrice),
      moq: data.moq != null ? Number(data.moq) : null,
      leadTimeDays: data.leadTimeDays != null ? Number(data.leadTimeDays) : null,
      contractStart: data.contractStart || null,
      contractEnd: data.contractEnd || null,
    })
    const mapped = fromApiVendorProduct(created)
    vendorProducts.value = [...vendorProducts.value, mapped]
    return mapped
  }

  // 계약 제품 수정 (CEN-028) — id 는 BE 의 code 와 동일
  async function updateProduct(id, data) {
    const updated = await vendorApi.updateVendorProduct(id, {
      productName: data.productName,
      unitPrice: Number(data.unitPrice),
      moq: data.moq != null ? Number(data.moq) : null,
      leadTimeDays: data.leadTimeDays != null ? Number(data.leadTimeDays) : null,
      contractStart: data.contractStart || null,
      contractEnd: data.contractEnd || null,
    })
    const mapped = fromApiVendorProduct(updated)
    const idx = vendorProducts.value.findIndex((vp) => vp.id === id)
    if (idx !== -1) {
      const next = [...vendorProducts.value]
      next[idx] = mapped
      vendorProducts.value = next
    }
    return mapped
  }

  // 계약 제품 상태 변경 (CEN-029): active ↔ suspended
  async function updateStatus(id, newStatus) {
    const beStatus = String(newStatus).toUpperCase()
    const updated = await vendorApi.updateVendorProductStatus(id, beStatus)
    const mapped = fromApiVendorProduct(updated)
    const idx = vendorProducts.value.findIndex((vp) => vp.id === id)
    if (idx !== -1) {
      const next = [...vendorProducts.value]
      next[idx] = mapped
      vendorProducts.value = next
    }
    return mapped
  }

  // 계약 제품 삭제 (CEN-030, SOFT DELETE) — 로컬 배열에서 제거
  async function deleteProduct(id) {
    await vendorApi.deleteVendorProduct(id)
    vendorProducts.value = vendorProducts.value.filter((vp) => vp.id !== id)
    if (selectedProductId.value === id) {
      selectedProductId.value = null
    }
    return true
  }

  // 스토어 생성 시 자동으로 거래처 목록 fetch
  fetchVendors().catch((err) => {
    console.error('[vendor] fetchVendors 실패', err)
  })

  return {
    vendors,
    vendorProducts,
    allVendorProducts,
    selectedVendorId,
    selectedProductId,
    loading,
    currentVendorProducts,
    selectedProductDetail,
    selectedVendor,
    filteredVendors,
    isProductCodeDuplicate,
    fetchVendors,
    fetchProductsByVendor,
    fetchAllVendorProducts,
    selectVendor,
    selectProduct,
    createProduct,
    updateProduct,
    updateStatus,
    deleteProduct,
  }
})
