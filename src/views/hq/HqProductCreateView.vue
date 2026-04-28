<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ChevronRight, Package } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { getCategories } from '@/api/category.js'
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
const COLOR_OPTIONS = ['검정', '흰색', '그레이', '아이보리']
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL']

const productName = ref('')
const parentCategory = ref('')
const childCategory = ref('')
const price = ref('')
const status = ref('활성')
const vendorName = ref('')
const leadTimeDays = ref(3)
const regDate = ref(new Date().toISOString().slice(0, 10).replaceAll('-', '.'))
const selectedColors = ref([])
const selectedSizes = ref([])
const currentSkus = ref([])
const submitError = ref('')
const submitSuccess = ref('')
const isSubmitting = ref(false)


const parentCategoryOptions = computed(() => categoryTree.value.map((c) => c.name))
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

const canSubmitCreate = computed(() =>
  productName.value.trim() &&
  parentCategory.value &&
  childCategory.value &&
  Number(price.value) >= 0 &&
  vendorName.value.trim() &&
  isVariantValid.value,
)

const canSubmitEdit = computed(() =>
  productName.value.trim() &&
  parentCategory.value &&
  childCategory.value &&
  Number(price.value) >= 0 &&
  vendorName.value.trim(),
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

function splitColorSize(optionValue) {
  const [color, size] = String(optionValue || '').split('|')
  return { color: color || '', size: size || '' }
}

async function loadSkus() {
  if (!isEditMode.value) return
  currentSkus.value = await getProductSkus(productCode.value)
  selectedColors.value = [...new Set(currentSkus.value.map((s) => splitColorSize(s.optionValue).color).filter(Boolean))]
  selectedSizes.value = [...new Set(currentSkus.value.map((s) => splitColorSize(s.optionValue).size).filter(Boolean))]
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
  const desiredOptionValues = new Set()
  for (const color of selectedColors.value) {
    for (const size of selectedSizes.value) {
      desiredOptionValues.add(`${color}|${size}`)
    }
  }

  const currentOptionMap = new Map(currentSkus.value.map((sku) => [sku.optionValue, sku]))
  const removeTargets = currentSkus.value.filter((sku) => !desiredOptionValues.has(sku.optionValue))
  const addTargets = [...desiredOptionValues].filter((optionValue) => !currentOptionMap.has(optionValue))

  if (removeTargets.length > 0) {
    await Promise.all(removeTargets.map((sku) => deleteProductSku(sku.skuCode)))
  }

  if (addTargets.length > 0) {
    await createProductSkusBulk(productCode.value, {
      optionName: 'COLOR_SIZE',
      optionValues: addTargets,
      unitPrice: Number(price.value),
      status: statusMap[status.value] ?? 'ACTIVE',
    })
  }

  return { added: addTargets.length, removed: removeTargets.length }
}

async function loadProduct() {
  if (!isEditMode.value) return
  const product = await getProductDetail(productCode.value)

  productName.value = product.name || ''
  price.value = Number(product.basePrice || 0)
  status.value = statusLabelMap[product.status] || '활성'
  vendorName.value = product.mainVendorCode || ''
  leadTimeDays.value = Number(product.leadTimeDays || 0)

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
        leadTimeDays: Number(leadTimeDays.value),
        mainVendorCode: vendorName.value.trim(),
        status: statusMap[status.value] ?? 'ACTIVE',
      })

      for (const color of selectedColors.value) {
        for (const size of selectedSizes.value) {
          await createProductSku(product.code, {
            optionName: 'COLOR_SIZE',
            optionValue: `${color}|${size}`,
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
        leadTimeDays: Number(leadTimeDays.value),
        mainVendorCode: vendorName.value.trim(),
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

onMounted(async () => {
  try {
    submitError.value = ''
    await loadCategories()
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
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
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
            class="inline-flex h-8 w-8 items-center justify-center border border-gray-200 text-gray-500 hover:border-[#004D3C] hover:text-[#004D3C]"
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
          <div class="border border-gray-200 bg-white shadow-sm">
            <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
              <Package :size="15" class="text-[#004D3C]" />
              <h2 class="text-sm font-black text-gray-900">제품 정보</h2>
            </div>

            <form class="space-y-6 p-5" @submit.prevent="handleSubmit">
              <div>
                <label class="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-gray-500">
                  제품명 <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="productName"
                  type="text"
                  placeholder="제품명을 입력하세요"
                  class="w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#004D3C]"
                />
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
                  단가 <span class="text-red-500">*</span>
                  <input v-model.number="price" type="number" min="0" class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#004D3C]" />
                </label>
                <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                  상태
                  <select v-model="status" class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004D3C]">
                    <option value="활성">활성</option>
                    <option value="점검중">점검중</option>
                    <option value="비활성">비활성</option>
                  </select>
                </label>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                  메인 거래처 <span class="text-red-500">*</span>
                  <input v-model="vendorName" type="text" class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#004D3C]" />
                </label>
                <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                  리드타임(일)
                  <input v-model.number="leadTimeDays" type="number" min="0" class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#004D3C]" />
                </label>
              </div>

              <div class="!mt-4 space-y-5 rounded-md border border-gray-300 bg-white p-5">
                <p class="text-[11px] font-black uppercase tracking-wide text-gray-500">
                  옵션 구성 <span v-if="!isEditMode" class="text-red-500">*</span>
                </p>
                <div class="space-y-2">
                  <p class="text-[10px] font-bold text-gray-400">색상</p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="color in COLOR_OPTIONS"
                      :key="color"
                      type="button"
                      class="border px-3 py-1.5 text-xs font-black transition"
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
                      class="border px-2.5 py-1 text-xs font-black transition"
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
          <section class="border border-gray-200 bg-white p-4 shadow-sm">
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
                <span class="font-black text-gray-800">{{ vendorName || '-' }}</span>
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
