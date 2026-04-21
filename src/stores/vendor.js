import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const VENDORS_KEY = 'stockit:vendors'
const VENDOR_PRODUCTS_KEY = 'stockit:vendor-products'

// 초기 더미 데이터 — 거래처 5개
const INITIAL_VENDORS = [
  {
    id: 'VND-001',
    name: '(주)테크서플라이',
    contactPerson: '김민준',
    contactEmail: 'minjun.kim@techsupply.co.kr',
    phone: '02-1234-5678',
    status: 'active',
  },
  {
    id: 'VND-002',
    name: '한국생활물산',
    contactPerson: '이수연',
    contactEmail: 'suyeon.lee@kliving.co.kr',
    phone: '031-9876-5432',
    status: 'active',
  },
  {
    id: 'VND-003',
    name: '글로벌오피스',
    contactPerson: '박재현',
    contactEmail: 'jaehyun.park@globaloffice.com',
    phone: '02-5555-3333',
    status: 'active',
  },
  {
    id: 'VND-004',
    name: '위생물자(주)',
    contactPerson: '최영희',
    contactEmail: 'younghee.choi@hygiene.co.kr',
    phone: '032-7777-8888',
    status: 'inactive',
  },
  {
    id: 'VND-005',
    name: '스마트주방솔루션',
    contactPerson: '정도현',
    contactEmail: 'dohyun.jung@smartkitchen.kr',
    phone: '051-4444-2222',
    status: 'active',
  },
]

// 초기 더미 데이터 — 거래처당 계약 제품 3~8개
const INITIAL_VENDOR_PRODUCTS = [
  // VND-001 (주)테크서플라이 — 전자제품 6건
  {
    id: 'VP-001-01',
    vendorId: 'VND-001',
    productCode: 'ITM-E001',
    productName: '고속 충전기 (C타입) 25W',
    unitPrice: 14200,
    moq: 100,
    leadTimeDays: 5,
    contractStart: '2024-01-01',
    contractEnd: '2024-12-31',
    status: 'active',
  },
  {
    id: 'VP-001-02',
    vendorId: 'VND-001',
    productCode: 'ITM-E004',
    productName: '무소음 무선 마우스 (블랙)',
    unitPrice: 22500,
    moq: 50,
    leadTimeDays: 7,
    contractStart: '2024-01-01',
    contractEnd: '2024-12-31',
    status: 'active',
  },
  {
    id: 'VP-001-03',
    vendorId: 'VND-001',
    productCode: 'ITM-E008',
    productName: '대용량 보조배터리 20000mAh',
    unitPrice: 38000,
    moq: 30,
    leadTimeDays: 7,
    contractStart: '2024-01-01',
    contractEnd: '2024-12-31',
    status: 'active',
  },
  {
    id: 'VP-001-04',
    vendorId: 'VND-001',
    productCode: 'ITM-E015',
    productName: '절전형 5구 멀티탭 3m',
    unitPrice: 11800,
    moq: 80,
    leadTimeDays: 5,
    contractStart: '2024-01-01',
    contractEnd: '2024-12-31',
    status: 'active',
  },
  {
    id: 'VP-001-05',
    vendorId: 'VND-001',
    productCode: 'ITM-E016',
    productName: 'HDMI 2.1 케이블 1.5m',
    unitPrice: 8500,
    moq: 100,
    leadTimeDays: 4,
    contractStart: '2024-01-01',
    contractEnd: '2024-06-30',
    status: 'expired',
  },
  {
    id: 'VP-001-06',
    vendorId: 'VND-001',
    productCode: 'ITM-E031',
    productName: '알루미늄 노트북 스탠드',
    unitPrice: 27000,
    moq: 20,
    leadTimeDays: 10,
    contractStart: '2024-03-01',
    contractEnd: '2025-02-28',
    status: 'active',
  },
  // VND-002 한국생활물산 — 위생/주방 5건
  {
    id: 'VP-002-01',
    vendorId: 'VND-002',
    productCode: 'ITM-H002',
    productName: '휴대용 가글 (중) 250ml',
    unitPrice: 2800,
    moq: 200,
    leadTimeDays: 3,
    contractStart: '2024-01-01',
    contractEnd: '2024-12-31',
    status: 'active',
  },
  {
    id: 'VP-002-02',
    vendorId: 'VND-002',
    productCode: 'ITM-K003',
    productName: '유리제 머그컵 350ml',
    unitPrice: 7200,
    moq: 50,
    leadTimeDays: 6,
    contractStart: '2024-01-01',
    contractEnd: '2024-12-31',
    status: 'active',
  },
  {
    id: 'VP-002-03',
    vendorId: 'VND-002',
    productCode: 'ITM-H010',
    productName: '손세정제 리필 500ml',
    unitPrice: 3200,
    moq: 100,
    leadTimeDays: 3,
    contractStart: '2024-02-01',
    contractEnd: '2024-12-31',
    status: 'active',
  },
  {
    id: 'VP-002-04',
    vendorId: 'VND-002',
    productCode: 'ITM-K019',
    productName: '주방세제 3L (대용량)',
    unitPrice: 5400,
    moq: 60,
    leadTimeDays: 4,
    contractStart: '2024-01-01',
    contractEnd: '2024-12-31',
    status: 'suspended',
  },
  {
    id: 'VP-002-05',
    vendorId: 'VND-002',
    productCode: 'ITM-K027',
    productName: '종이컵 6.5온스 (1000입)',
    unitPrice: 9800,
    moq: 40,
    leadTimeDays: 5,
    contractStart: '2024-01-01',
    contractEnd: '2024-12-31',
    status: 'active',
  },
  // VND-003 글로벌오피스 — 문구/사무 8건
  {
    id: 'VP-003-01',
    vendorId: 'VND-003',
    productCode: 'ITM-S005',
    productName: 'A4 복사용지 80g (500매)',
    unitPrice: 4100,
    moq: 300,
    leadTimeDays: 2,
    contractStart: '2024-01-01',
    contractEnd: '2024-12-31',
    status: 'active',
  },
  {
    id: 'VP-003-02',
    vendorId: 'VND-003',
    productCode: 'ITM-S006',
    productName: '리무버블 데코 스티커 셋트',
    unitPrice: 2100,
    moq: 200,
    leadTimeDays: 3,
    contractStart: '2024-01-01',
    contractEnd: '2024-12-31',
    status: 'active',
  },
  {
    id: 'VP-003-03',
    vendorId: 'VND-003',
    productCode: 'ITM-S007',
    productName: '스테이플러 심 (10호)',
    unitPrice: 850,
    moq: 500,
    leadTimeDays: 2,
    contractStart: '2024-01-01',
    contractEnd: '2024-12-31',
    status: 'active',
  },
  {
    id: 'VP-003-04',
    vendorId: 'VND-003',
    productCode: 'ITM-S012',
    productName: '수정테이프 5mm x 10m',
    unitPrice: 1600,
    moq: 200,
    leadTimeDays: 2,
    contractStart: '2024-01-01',
    contractEnd: '2024-12-31',
    status: 'active',
  },
  {
    id: 'VP-003-05',
    vendorId: 'VND-003',
    productCode: 'ITM-S017',
    productName: '점착식 메모지 (노랑)',
    unitPrice: 1200,
    moq: 400,
    leadTimeDays: 2,
    contractStart: '2024-01-01',
    contractEnd: '2024-12-31',
    status: 'active',
  },
  {
    id: 'VP-003-06',
    vendorId: 'VND-003',
    productCode: 'ITM-S022',
    productName: 'L자 파일 홀더 (100매)',
    unitPrice: 2900,
    moq: 100,
    leadTimeDays: 3,
    contractStart: '2024-01-01',
    contractEnd: '2024-12-31',
    status: 'active',
  },
  {
    id: 'VP-003-07',
    vendorId: 'VND-003',
    productCode: 'ITM-S028',
    productName: '투명 박스 테이프 50mm',
    unitPrice: 980,
    moq: 300,
    leadTimeDays: 2,
    contractStart: '2024-03-01',
    contractEnd: '2024-09-30',
    status: 'expired',
  },
  {
    id: 'VP-003-08',
    vendorId: 'VND-003',
    productCode: 'ITM-S034',
    productName: '더블클립 (중/20입)',
    unitPrice: 1500,
    moq: 200,
    leadTimeDays: 2,
    contractStart: '2024-01-01',
    contractEnd: '2024-12-31',
    status: 'active',
  },
  // VND-004 위생물자(주) — 위생제품 3건 (inactive 거래처)
  {
    id: 'VP-004-01',
    vendorId: 'VND-004',
    productCode: 'ITM-H018',
    productName: 'KF94 마스크 (50매입)',
    unitPrice: 5800,
    moq: 100,
    leadTimeDays: 4,
    contractStart: '2023-07-01',
    contractEnd: '2024-06-30',
    status: 'expired',
  },
  {
    id: 'VP-004-02',
    vendorId: 'VND-004',
    productCode: 'ITM-H025',
    productName: '탁상용 미니 가습기',
    unitPrice: 18500,
    moq: 20,
    leadTimeDays: 8,
    contractStart: '2023-07-01',
    contractEnd: '2024-06-30',
    status: 'expired',
  },
  {
    id: 'VP-004-03',
    vendorId: 'VND-004',
    productCode: 'ITM-H026',
    productName: '퍼퓸 핸드크림 50ml',
    unitPrice: 3200,
    moq: 150,
    leadTimeDays: 5,
    contractStart: '2023-07-01',
    contractEnd: '2024-06-30',
    status: 'suspended',
  },
  // VND-005 스마트주방솔루션 — 주방잡화 4건
  {
    id: 'VP-005-01',
    vendorId: 'VND-005',
    productCode: 'ITM-K011',
    productName: '니트릴 고무장갑 (M/100입)',
    unitPrice: 8900,
    moq: 30,
    leadTimeDays: 6,
    contractStart: '2024-02-01',
    contractEnd: '2024-12-31',
    status: 'active',
  },
  {
    id: 'VP-005-02',
    vendorId: 'VND-005',
    productCode: 'ITM-K020',
    productName: '다목적 수세미 (5입)',
    unitPrice: 2200,
    moq: 100,
    leadTimeDays: 4,
    contractStart: '2024-02-01',
    contractEnd: '2024-12-31',
    status: 'active',
  },
  {
    id: 'VP-005-03',
    vendorId: 'VND-005',
    productCode: 'ITM-K003',
    productName: '유리제 머그컵 350ml',
    unitPrice: 7500,
    moq: 40,
    leadTimeDays: 7,
    contractStart: '2024-01-01',
    contractEnd: '2024-06-30',
    status: 'expired',
  },
  {
    id: 'VP-005-04',
    vendorId: 'VND-005',
    productCode: 'ITM-K027',
    productName: '종이컵 6.5온스 (1000입)',
    unitPrice: 10200,
    moq: 30,
    leadTimeDays: 5,
    contractStart: '2024-04-01',
    contractEnd: '2025-03-31',
    status: 'active',
  },
]

function loadFromStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 스토리지 저장 실패 시 무시
  }
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

export const useVendorStore = defineStore('vendor', () => {
  // --- state ---
  const vendors = ref(loadFromStorage(VENDORS_KEY, INITIAL_VENDORS))
  const vendorProducts = ref(loadFromStorage(VENDOR_PRODUCTS_KEY, INITIAL_VENDOR_PRODUCTS))
  const selectedVendorId = ref(null)
  const selectedProductId = ref(null)

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
        v.contactPerson.toLowerCase().includes(keyword) ||
        v.contactEmail.toLowerCase().includes(keyword)
      return matchStatus && matchKeyword
    })
  }

  // --- actions ---

  // 거래처 선택
  function selectVendor(id) {
    selectedVendorId.value = id
    selectedProductId.value = null
  }

  // 계약 제품 선택
  function selectProduct(id) {
    selectedProductId.value = id
  }

  // 계약 제품 등록 (SO-018)
  function createProduct(data) {
    const newProduct = {
      id: generateId('VP'),
      vendorId: selectedVendorId.value,
      productCode: data.productCode,
      productName: data.productName,
      unitPrice: Number(data.unitPrice),
      moq: Number(data.moq),
      leadTimeDays: Number(data.leadTimeDays),
      contractStart: data.contractStart,
      contractEnd: data.contractEnd,
      status: data.status ?? 'active',
    }
    vendorProducts.value = [...vendorProducts.value, newProduct]
    saveToStorage(VENDOR_PRODUCTS_KEY, vendorProducts.value)
    return newProduct
  }

  // 계약 제품 수정 (SO-019)
  function updateProduct(id, data) {
    const idx = vendorProducts.value.findIndex((vp) => vp.id === id)
    if (idx === -1) return false
    vendorProducts.value[idx] = {
      ...vendorProducts.value[idx],
      productCode: data.productCode,
      productName: data.productName,
      unitPrice: Number(data.unitPrice),
      moq: Number(data.moq),
      leadTimeDays: Number(data.leadTimeDays),
      contractStart: data.contractStart,
      contractEnd: data.contractEnd,
    }
    saveToStorage(VENDOR_PRODUCTS_KEY, vendorProducts.value)
    return true
  }

  // 계약 제품 상태 변경 (SO-020): active ↔ suspended
  function updateStatus(id, newStatus) {
    const idx = vendorProducts.value.findIndex((vp) => vp.id === id)
    if (idx === -1) return false
    vendorProducts.value[idx] = { ...vendorProducts.value[idx], status: newStatus }
    saveToStorage(VENDOR_PRODUCTS_KEY, vendorProducts.value)
    if (selectedProductId.value === id) {
      // 선택 상태 유지 (computed 자동 반영)
    }
    return true
  }

  // 계약 제품 삭제 (SO-021)
  function deleteProduct(id) {
    vendorProducts.value = vendorProducts.value.filter((vp) => vp.id !== id)
    if (selectedProductId.value === id) {
      selectedProductId.value = null
    }
    saveToStorage(VENDOR_PRODUCTS_KEY, vendorProducts.value)
    return true
  }

  return {
    vendors,
    vendorProducts,
    selectedVendorId,
    selectedProductId,
    currentVendorProducts,
    selectedProductDetail,
    selectedVendor,
    filteredVendors,
    selectVendor,
    selectProduct,
    createProduct,
    updateProduct,
    updateStatus,
    deleteProduct,
  }
})
