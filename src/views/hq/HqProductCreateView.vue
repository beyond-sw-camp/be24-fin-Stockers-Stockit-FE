<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ChevronRight, Package } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { getCategories } from '@/api/category.js'
import { vendorApi } from '@/api/vendor.js'
import {
  createProduct,
  createProductSku,
  createProductSkusBulk,
  deleteProduct,
  deleteProductSku,
  getProductDetail,
  getProductSkus,
  updateProduct,
} from '@/api/productMaster.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const isEditMode = computed(() => Boolean(route.params.productCode))
const productCode = computed(() => String(route.params.productCode ?? ''))

const activeTopMenu = computed(() => '상품 관리')
const activeSideMenu = ref('제품 마스터')

const productSideMenus = [
  { label: '카테고리 관리', icon: 'tags', id: 'SO-006', path: '/hq/products' },
  { label: '제품 마스터', icon: 'package', id: 'SO-011', path: '/hq/products' },
]

const categoryTree = ref([])
const COLOR_OPTIONS = ['검정', '흰색', '그레이', '네이비']
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL']
const MATERIAL_TYPE_OPTIONS = [
  { label: '천연 단일 섬유', value: 'NATURAL_SINGLE' },
  { label: '합성 섬유', value: 'SYNTHETIC' },
  { label: '혼방', value: 'BLEND' },
]
const NATURAL_MATERIAL_OPTIONS = [
  { code: 'COTTON', label: '면' },
  { code: 'WOOL', label: '울' },
  { code: 'CASHMERE', label: '캐시미어' },
  { code: 'SILK', label: '실크' },
  { code: 'LINEN', label: '린넨' },
]
const SYNTHETIC_MATERIAL_OPTIONS = [
  { code: 'POLYESTER', label: '폴리에스터' },
  { code: 'ACRYLIC', label: '아크릴' },
  { code: 'POLYAMIDE', label: '나일론' },
  { code: 'ELASTANE', label: '스판덱스' },
]
const ALL_MATERIAL_OPTIONS = [...NATURAL_MATERIAL_OPTIONS, ...SYNTHETIC_MATERIAL_OPTIONS]
const MATERIAL_LABEL_BY_CODE = Object.fromEntries(ALL_MATERIAL_OPTIONS.map((option) => [option.code, option.label]))

const productName = ref('')
const parentCategory = ref('')
const childCategory = ref('')
const price = ref('')
const status = ref('활성')
const selectedVendorCode = ref('')
const vendorOptions = ref([])
const warehouseSafetyStock = ref(0)
const storeSafetyStock = ref(0)
const materialType = ref('NATURAL_SINGLE')
const singleMaterialCode = ref('COTTON')
const blendCompositions = ref([
  { materialCode: 'COTTON', ratio: 50 },
  { materialCode: 'POLYESTER', ratio: 50 },
])
const regDate = ref(new Date().toISOString().slice(0, 10).replaceAll('-', '.'))
const selectedColors = ref([])
const selectedSizes = ref([])
const currentSkus = ref([])
const submitError = ref('')
const submitSuccess = ref('')
const isSubmitting = ref(false)


const parentCategoryOptions = computed(() => categoryTree.value.map((c) => c.name))
const activeVendorOptions = computed(() =>
  vendorOptions.value.filter(vendor => vendor.status === 'ACTIVE'),
)
const selectedVendor = computed(() =>
  vendorOptions.value.find(vendor => vendor.code === selectedVendorCode.value) ?? null,
)
const isSelectedVendorActive = computed(() =>
  activeVendorOptions.value.some(vendor => vendor.code === selectedVendorCode.value),
)
const shouldShowCurrentVendorFallbackOption = computed(() =>
  Boolean(selectedVendorCode.value) && !isSelectedVendorActive.value,
)
const childCategoryOptions = computed(() => {
  const parent = categoryTree.value.find((c) => c.name === parentCategory.value)
  return parent ? parent.children.map((c) => c.name) : []
})

watch(parentCategory, () => {
  if (!childCategoryOptions.value.includes(childCategory.value)) {
    childCategory.value = childCategoryOptions.value[0] ?? ''
  }
})

const isVariantValid = computed(() => selectedColors.value.length > 0 && selectedSizes.value.length > 0)

const variantSummaryText = computed(() => {
  if (!selectedColors.value.length || !selectedSizes.value.length) return '-'
  return `색상(${selectedColors.value.join(', ')}) / 사이즈(${selectedSizes.value.join(', ')})`
})
const materialOptionsByType = computed(() => {
  if (materialType.value === 'NATURAL_SINGLE') return NATURAL_MATERIAL_OPTIONS
  if (materialType.value === 'SYNTHETIC') return SYNTHETIC_MATERIAL_OPTIONS
  return ALL_MATERIAL_OPTIONS
})
const blendRatioTotal = computed(() =>
  blendCompositions.value.reduce((sum, composition) => sum + Number(composition.ratio || 0), 0),
)
const isMaterialValid = computed(() => {
  if (materialType.value === 'BLEND') {
    if (blendCompositions.value.length < 2) return false
    const usedCodes = new Set()
    for (const composition of blendCompositions.value) {
      if (!composition.materialCode || usedCodes.has(composition.materialCode)) return false
      usedCodes.add(composition.materialCode)
      if (Number(composition.ratio || 0) <= 0) return false
    }
    return blendRatioTotal.value === 100
  }
  return Boolean(singleMaterialCode.value)
})
const materialSummaryText = computed(() => {
  if (materialType.value === 'BLEND') {
    if (!blendCompositions.value.length) return '혼방'
    const pieces = blendCompositions.value.map((composition) =>
      `${MATERIAL_LABEL_BY_CODE[composition.materialCode] || composition.materialCode} ${Number(composition.ratio || 0)}%`,
    )
    return `혼방 (${pieces.join(' + ')})`
  }
  const groupLabel = MATERIAL_TYPE_OPTIONS.find((type) => type.value === materialType.value)?.label || '-'
  const detailLabel = MATERIAL_LABEL_BY_CODE[singleMaterialCode.value] || '-'
  return `${groupLabel} (${detailLabel} 100%)`
})

watch(materialType, (nextType) => {
  if (nextType === 'NATURAL_SINGLE') {
    singleMaterialCode.value = NATURAL_MATERIAL_OPTIONS[0].code
    return
  }
  if (nextType === 'SYNTHETIC') {
    singleMaterialCode.value = SYNTHETIC_MATERIAL_OPTIONS[0].code
    return
  }
  blendCompositions.value = [
    { materialCode: NATURAL_MATERIAL_OPTIONS[0].code, ratio: 50 },
    { materialCode: SYNTHETIC_MATERIAL_OPTIONS[0].code, ratio: 50 },
  ]
})

const canSubmitCreate = computed(() =>
  productName.value.trim() &&
  parentCategory.value &&
  childCategory.value &&
  Number(price.value) >= 0 &&
  Number(warehouseSafetyStock.value) >= 0 &&
  Number(storeSafetyStock.value) >= 0 &&
  isMaterialValid.value &&
  isSelectedVendorActive.value &&
  isVariantValid.value,
)

const canSubmitEdit = computed(() =>
  productName.value.trim() &&
  parentCategory.value &&
  childCategory.value &&
  Number(price.value) >= 0 &&
  Number(warehouseSafetyStock.value) >= 0 &&
  Number(storeSafetyStock.value) >= 0 &&
  isMaterialValid.value &&
  isSelectedVendorActive.value,
)

const statusMap = {
  활성: 'ACTIVE',
  점검중: 'SUSPENDED',
  비활성: 'INACTIVE',
}

const statusLabelMap = {
  ACTIVE: '활성',
  SUSPENDED: '점검중',
  INACTIVE: '비활성',
}

function resolveCategoryCode() {
  const parent = categoryTree.value.find((c) => c.name === parentCategory.value)
  if (!parent) return null
  const child = parent.children.find((c) => c.name === childCategory.value)
  return child?.code || parent.code
}

function createMaterialCompositionsPayload() {
  if (materialType.value === 'BLEND') {
    return blendCompositions.value.map((composition) => ({
      materialCode: composition.materialCode,
      ratio: Number(composition.ratio || 0),
    }))
  }
  return [{ materialCode: singleMaterialCode.value, ratio: 100 }]
}

function addBlendComposition() {
  blendCompositions.value = [...blendCompositions.value, { materialCode: '', ratio: 0 }]
}

function removeBlendComposition(index) {
  if (blendCompositions.value.length <= 2) return
  blendCompositions.value = blendCompositions.value.filter((_, currentIndex) => currentIndex !== index)
}

async function loadSkus() {
  if (!isEditMode.value) return
  currentSkus.value = await getProductSkus(productCode.value)
  selectedColors.value = [...new Set(currentSkus.value.map((s) => s.color).filter(Boolean))]
  selectedSizes.value = [...new Set(currentSkus.value.map((s) => s.size).filter(Boolean))]
}

async function toggleColor(color) {
  selectedColors.value = selectedColors.value.includes(color)
    ? selectedColors.value.filter((c) => c !== color)
    : [...selectedColors.value, color]
}

async function toggleSize(size) {
  selectedSizes.value = selectedSizes.value.includes(size)
    ? selectedSizes.value.filter((s) => s !== size)
    : [...selectedSizes.value, size]
}

async function syncSkusBySelections() {
  const desired = new Set()
  for (const color of selectedColors.value) {
    for (const size of selectedSizes.value) {
      desired.add(`${color}|${size}`)
    }
  }

  const current = new Set(currentSkus.value.map((sku) => `${sku.color}|${sku.size}`))
  const removeTargets = currentSkus.value.filter((sku) => !desired.has(`${sku.color}|${sku.size}`))

  if (removeTargets.length > 0) {
    await Promise.all(removeTargets.map((sku) => deleteProductSku(sku.skuCode)))
  }

  const missing = [...desired].filter((key) => !current.has(key))
  if (missing.length > 0) {
    const colors = [...new Set(missing.map((m) => m.split('|')[0]))]
    const sizes = [...new Set(missing.map((m) => m.split('|')[1]))]
    await createProductSkusBulk(productCode.value, {
      colors,
      sizes,
      unitPrice: Number(price.value),
      status: statusMap[status.value] ?? 'ACTIVE',
    })
  }

  return { added: missing.length, removed: removeTargets.length }
}

async function loadProduct() {
  if (!isEditMode.value) return
  const product = await getProductDetail(productCode.value)

  productName.value = product.name || ''
  price.value = Number(product.basePrice || 0)
  status.value = statusLabelMap[product.status] || '활성'
  selectedVendorCode.value = product.mainVendorCode || ''
  warehouseSafetyStock.value = Number(product.warehouseSafetyStock || 0)
  storeSafetyStock.value = Number(product.storeSafetyStock || 0)
  materialType.value = product.materialType || 'NATURAL_SINGLE'
  if (materialType.value === 'BLEND') {
    blendCompositions.value = (product.materialCompositions || []).map((composition) => ({
      materialCode: composition.materialCode,
      ratio: Number(composition.ratio || 0),
    }))
    if (!blendCompositions.value.length) {
      blendCompositions.value = [
        { materialCode: NATURAL_MATERIAL_OPTIONS[0].code, ratio: 50 },
        { materialCode: SYNTHETIC_MATERIAL_OPTIONS[0].code, ratio: 50 },
      ]
    }
  } else {
    singleMaterialCode.value = product.materialCompositions?.[0]?.materialCode || (
      materialType.value === 'SYNTHETIC' ? SYNTHETIC_MATERIAL_OPTIONS[0].code : NATURAL_MATERIAL_OPTIONS[0].code
    )
  }

  const parent = categoryTree.value.find((c) => (c.children || []).some((child) => child.code === product.categoryCode))
  if (parent) {
    parentCategory.value = parent.name
    const child = parent.children.find((c) => c.code === product.categoryCode)
    childCategory.value = child?.name || parent.children?.[0]?.name || ''
  } else {
    const root = categoryTree.value.find((c) => c.code === product.categoryCode)
    if (root) {
      parentCategory.value = root.name
      childCategory.value = root.children?.[0]?.name || ''
    }
  }
}

async function handleSubmit() {
  const categoryCode = resolveCategoryCode()
  if (!categoryCode) {
    submitError.value = '카테고리 정보를 불러오지 못했습니다.'
    return
  }

  if (!isEditMode.value && !canSubmitCreate.value) return
  if (isEditMode.value && !canSubmitEdit.value) return

  try {
    isSubmitting.value = true
    submitError.value = ''
    submitSuccess.value = ''

    if (!isEditMode.value) {
      const product = await createProduct({
        name: productName.value.trim(),
        categoryCode,
        basePrice: Number(price.value),
        leadTimeDays: 0,
        warehouseSafetyStock: Number(warehouseSafetyStock.value),
        storeSafetyStock: Number(storeSafetyStock.value),
        mainVendorCode: selectedVendorCode.value.trim(),
        materialType: materialType.value,
        materialCompositions: createMaterialCompositionsPayload(),
        status: statusMap[status.value] ?? 'ACTIVE',
      })

      for (const color of selectedColors.value) {
        for (const size of selectedSizes.value) {
          await createProductSku(product.code, {
            color,
            size,
            unitPrice: Number(price.value),
            status: statusMap[status.value] ?? 'ACTIVE',
          })
        }
      }

      submitSuccess.value = '제품 및 SKU 등록이 완료되었습니다.'
    } else {
      await updateProduct(productCode.value, {
        name: productName.value.trim(),
        categoryCode,
        basePrice: Number(price.value),
        leadTimeDays: 0,
        warehouseSafetyStock: Number(warehouseSafetyStock.value),
        storeSafetyStock: Number(storeSafetyStock.value),
        mainVendorCode: selectedVendorCode.value.trim(),
        materialType: materialType.value,
        materialCompositions: createMaterialCompositionsPayload(),
        status: statusMap[status.value] ?? 'ACTIVE',
      })
      const skuResult = await syncSkusBySelections()
      await loadSkus()
      submitSuccess.value = `제품 정보 수정 완료 (SKU 추가 ${skuResult.added}건 / 삭제 ${skuResult.removed}건)`
    }

    setTimeout(() => {
      router.push('/hq/products?tab=products')
    }, 500)
  } catch (e) {
    submitError.value = e.message
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  router.push('/hq/products?tab=products')
}

async function handleDeleteProduct() {
  if (!isEditMode.value) return
  const ok = confirm('해당 품목을 삭제할까요? 연결된 SKU도 함께 삭제됩니다.')
  if (!ok) return
  try {
    isSubmitting.value = true
    submitError.value = ''
    submitSuccess.value = ''
    await deleteProduct(productCode.value)
    submitSuccess.value = '품목이 삭제되었습니다.'
    setTimeout(() => {
      router.push('/hq/products?tab=products')
    }, 500)
  } catch (e) {
    submitError.value = e.message
  } finally {
    isSubmitting.value = false
  }
}


async function loadCategories() {
  const list = await getCategories()
  categoryTree.value = list
  if (!isEditMode.value && list.length > 0) {
    parentCategory.value = list[0].name
    childCategory.value = list[0].children?.[0]?.name ?? ''
  }
}

async function loadVendors() {
  const list = await vendorApi.listVendors()
  vendorOptions.value = list ?? []
}

onMounted(async () => {
  try {
    submitError.value = ''
    await Promise.all([loadCategories(), loadVendors()])
    if (isEditMode.value) {
      await loadProduct()
      await loadSkus()
    }
  } catch (e) {
    submitError.value = e.message
  }
})
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="productSideMenus"
    v-model:active-side-menu="activeSideMenu"
    show-system-card
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex items-center gap-2 text-[11px] font-bold text-gray-400">
          <button type="button" class="hover:text-[#004D3C]" @click="handleCancel">상품 관리</button>
          <ChevronRight :size="12" />
          <button type="button" class="hover:text-[#004D3C]" @click="handleCancel">제품 마스터</button>
          <ChevronRight :size="12" />
          <span class="text-gray-700">{{ isEditMode ? '제품 관리' : '신규 제품 등록' }}</span>
        </div>
        <div class="mt-3 flex items-center gap-3">
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center border border-gray-300 text-gray-500 hover:border-[#004D3C] hover:text-[#004D3C]"
            @click="handleCancel"
          >
            <ArrowLeft :size="15" />
          </button>
          <div>
            <h1 class="text-xl font-black text-gray-950">{{ isEditMode ? '제품 관리' : '신규 제품 등록' }}</h1>
            <p class="mt-0.5 text-xs font-bold text-gray-400">{{ isEditMode ? '제품 기본 정보와 옵션(색상·사이즈)을 수정합니다.' : '제품 기본 정보를 입력하고 초기 옵션을 구성합니다.' }}</p>
          </div>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] xl:items-start">
        <div class="space-y-4">
          <div class="border border-gray-300 bg-white shadow-sm">
            <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
              <Package :size="15" class="text-[#004D3C]" />
              <h2 class="text-sm font-black text-gray-900">제품 정보</h2>
            </div>

            <form class="space-y-6 p-5" @submit.prevent="handleSubmit">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                  제품명 <span class="text-red-500">*</span>
                  <input
                    v-model="productName"
                    type="text"
                    placeholder="제품명을 입력하세요"
                    class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#004D3C]"
                  />
                </label>
                <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                  단가 <span class="text-red-500">*</span>
                  <input v-model.number="price" type="number" min="0" class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#004D3C]" />
                </label>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                  대분류 <span class="text-red-500">*</span>
                  <select v-model="parentCategory" class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004D3C]">
                    <option v-for="parent in parentCategoryOptions" :key="parent" :value="parent">{{ parent }}</option>
                  </select>
                </label>
                <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                  소분류 <span class="text-red-500">*</span>
                  <select v-model="childCategory" class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004D3C]">
                    <option v-for="child in childCategoryOptions" :key="child" :value="child">{{ child }}</option>
                  </select>
                </label>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                  상태
                  <select v-model="status" class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004D3C]">
                    <option value="활성">활성</option>
                    <option value="점검중">점검중</option>
                    <option value="비활성">비활성</option>
                  </select>
                </label>
                <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                  메인 거래처 <span class="text-red-500">*</span>
                  <select
                    v-model="selectedVendorCode"
                    class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004D3C]"
                  >
                    <option value="">거래처를 선택하세요</option>
                    <option
                      v-if="shouldShowCurrentVendorFallbackOption"
                      :value="selectedVendorCode"
                    >
                      현재 설정 거래처 (비활성/미존재) - 재선택 필요
                    </option>
                    <option
                      v-for="vendor in activeVendorOptions"
                      :key="vendor.code"
                      :value="vendor.code"
                    >
                      {{ vendor.name }} ({{ vendor.code }})
                    </option>
                  </select>
                  <p
                    v-if="shouldShowCurrentVendorFallbackOption"
                    class="mt-1 text-[10px] font-bold text-red-500"
                  >
                    현재 설정 거래처는 사용할 수 없습니다. 활성 거래처를 다시 선택해주세요.
                  </p>
                </label>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                  창고 공통 안전재고 <span class="text-red-500">*</span>
                  <input v-model.number="warehouseSafetyStock" type="number" min="0" class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#004D3C]" />
                </label>
                <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                  매장 공통 안전재고 <span class="text-red-500">*</span>
                  <input v-model.number="storeSafetyStock" type="number" min="0" class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#004D3C]" />
                </label>
              </div>

              <div class="space-y-4 rounded-md border border-gray-300 bg-white p-4">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                    소재 구분 <span class="text-red-500">*</span>
                    <select v-model="materialType" class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004D3C]">
                      <option v-for="type in MATERIAL_TYPE_OPTIONS" :key="type.value" :value="type.value">{{ type.label }}</option>
                    </select>
                  </label>
                  <template v-if="materialType !== 'BLEND'">
                    <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                      소재 상세 <span class="text-red-500">*</span>
                      <select v-model="singleMaterialCode" class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004D3C]">
                        <option v-for="option in materialOptionsByType" :key="option.code" :value="option.code">{{ option.label }}</option>
                      </select>
                      <p class="mt-1 text-[10px] font-bold text-gray-400">단일 소재는 100%로 자동 반영됩니다.</p>
                    </label>
                  </template>
                </div>

                <div v-if="materialType === 'BLEND'" class="space-y-3">
                  <div
                    v-for="(composition, index) in blendCompositions"
                    :key="`blend-${index}`"
                    class="grid grid-cols-[minmax(0,1fr)_120px_88px] gap-2"
                  >
                    <select v-model="composition.materialCode" class="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004D3C]">
                      <option value="">소재 선택</option>
                      <option v-for="option in ALL_MATERIAL_OPTIONS" :key="option.code" :value="option.code">{{ option.label }}</option>
                    </select>
                    <input
                      v-model.number="composition.ratio"
                      type="number"
                      min="0"
                      max="100"
                      class="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#004D3C]"
                      placeholder="%"
                    />
                    <button
                      type="button"
                      class="border border-gray-300 bg-white px-3 py-2 text-xs font-black text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                      :disabled="blendCompositions.length <= 2"
                      @click="removeBlendComposition(index)"
                    >
                      삭제
                    </button>
                  </div>
                  <div class="flex items-center justify-between">
                    <p class="text-[11px] font-bold" :class="blendRatioTotal === 100 ? 'text-emerald-600' : 'text-red-500'">
                      혼방 비율 합계: {{ blendRatioTotal }}%
                    </p>
                    <button type="button" class="border border-gray-300 bg-white px-3 py-1.5 text-xs font-black text-gray-700 hover:bg-gray-50" @click="addBlendComposition">
                      소재 추가
                    </button>
                  </div>
                  <p class="text-[10px] font-bold text-gray-400">혼방은 소재 2개 이상, 비율 합계 100%를 만족해야 합니다.</p>
                </div>
              </div>

              <div class="!mt-4 rounded-md border border-gray-300 bg-white p-5">
                <p class="text-[11px] font-black uppercase tracking-wide text-gray-500">
                  옵션 구성 <span v-if="!isEditMode" class="text-red-500">*</span>
                </p>
                <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <p class="text-[10px] font-bold text-gray-400">색상</p>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="color in COLOR_OPTIONS"
                        :key="color"
                        type="button"
                        class="min-w-[72px] border px-3 py-1.5 text-xs font-black transition"
                        :class="selectedColors.includes(color)
                          ? 'border-[#004D3C] bg-[#004D3C] text-white'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'"
                        @click="toggleColor(color)"
                      >
                        {{ color }}
                      </button>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <p class="text-[10px] font-bold text-gray-400">사이즈</p>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="size in SIZE_OPTIONS"
                        :key="size"
                        type="button"
                        class="min-w-[56px] border px-2.5 py-1 text-xs font-black transition"
                        :class="selectedSizes.includes(size)
                          ? 'border-[#0E7A60] bg-[#EBF5F5] text-[#0E7A60]'
                          : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'"
                        @click="toggleSize(size)"
                      >
                        {{ size }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="-mx-5 border-t border-gray-100 bg-white px-5 pt-4">
                <p v-if="submitError" class="mb-2 border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600">{{ submitError }}</p>
                <p v-if="submitSuccess" class="mb-2 border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">{{ submitSuccess }}</p>
                <div class="flex gap-2">
                  <button
                    v-if="isEditMode"
                    type="button"
                    class="flex-1 border border-red-300 bg-red-50 py-2.5 text-sm font-black text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="isSubmitting"
                    @click="handleDeleteProduct"
                  >
                    품목 삭제
                  </button>
                  <button type="button" class="flex-1 border border-gray-300 bg-white py-2.5 text-sm font-black text-gray-700 hover:bg-gray-50" @click="handleCancel">
                    취소
                  </button>
                  <button
                    type="submit"
                    class="flex-1 border border-[#004D3C] bg-[#004D3C] py-2.5 text-sm font-black text-white hover:bg-[#003d30] disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="(isEditMode ? !canSubmitEdit : !canSubmitCreate) || isSubmitting"
                  >
                    {{ isSubmitting ? (isEditMode ? '저장 중...' : '등록 중...') : (isEditMode ? '제품 정보 저장' : '신규 제품 등록') }}
                  </button>
                </div>
              </div>
            </form>
          </div>

        </div>

        <aside class="space-y-4 xl:sticky xl:top-16">
          <section class="border border-gray-300 bg-white p-4 shadow-sm">
            <h3 class="text-xs font-black uppercase tracking-wide text-gray-500">현재 입력 요약</h3>
            <div class="mt-3 space-y-2 text-xs">
              <div class="flex items-center justify-between border border-gray-100 bg-gray-50 px-3 py-2">
                <span class="font-black text-gray-500">제품명</span>
                <span class="font-black text-gray-800">{{ productName || '-' }}</span>
              </div>
              <div class="flex items-center justify-between border border-gray-100 bg-gray-50 px-3 py-2">
                <span class="font-black text-gray-500">카테고리</span>
                <span class="font-black text-gray-800">{{ parentCategory }} &gt; {{ childCategory }}</span>
              </div>
              <div class="flex items-center justify-between border border-gray-100 bg-gray-50 px-3 py-2">
                <span class="font-black text-gray-500">단가</span>
                <span class="font-black text-gray-800">{{ Number(price) >= 0 ? `₩${Number(price).toLocaleString()}` : '-' }}</span>
              </div>
              <div class="flex items-center justify-between border border-gray-100 bg-gray-50 px-3 py-2">
                <span class="font-black text-gray-500">메인 거래처</span>
                <span class="font-black text-gray-800">
                  {{ selectedVendor ? `${selectedVendor.name} (${selectedVendor.code})` : (selectedVendorCode || '-') }}
                </span>
              </div>
              <div class="flex items-center justify-between border border-gray-100 bg-gray-50 px-3 py-2">
                <span class="font-black text-gray-500">창고 공통 안전재고</span>
                <span class="font-black text-gray-800">{{ Number(warehouseSafetyStock).toLocaleString() }}</span>
              </div>
              <div class="flex items-center justify-between border border-gray-100 bg-gray-50 px-3 py-2">
                <span class="font-black text-gray-500">매장 공통 안전재고</span>
                <span class="font-black text-gray-800">{{ Number(storeSafetyStock).toLocaleString() }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 border border-gray-100 bg-gray-50 px-3 py-2">
                <span class="font-black text-gray-500">소재</span>
                <span class="text-right font-black text-gray-800">{{ materialSummaryText }}</span>
              </div>
              <div class="flex items-center justify-between border border-gray-100 bg-gray-50 px-3 py-2">
                <span class="font-black text-gray-500">상태</span>
                <span class="font-black text-gray-800">{{ status }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 border border-gray-100 bg-gray-50 px-3 py-2">
                <span class="font-black text-gray-500">옵션</span>
                <span class="text-right font-black text-gray-800">{{ variantSummaryText }}</span>
              </div>
              <div class="flex items-center justify-between border border-gray-100 bg-gray-50 px-3 py-2">
                <span class="font-black text-gray-500">등록일</span>
                <span class="font-black text-gray-800">{{ regDate }}</span>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </div>
  </AppLayout>
</template>
