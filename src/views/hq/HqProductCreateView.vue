<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ChevronRight, Package } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const activeTopMenu = computed(() => '상품 관리')
const activeSideMenu = ref('제품 마스터')

const productSideMenus = [
  { label: '카테고리 관리', icon: 'tags', id: 'SO-006', path: '/hq/products' },
  { label: '제품 마스터', icon: 'package', id: 'SO-011', path: '/hq/products' },
]

const categoryMap = {
  상의: ['반팔', '긴팔', '셔츠', '니트', '후드티'],
  바지: ['청바지', '반바지', '긴바지', '츄리닝'],
  치마: ['미니 스커트', '롱스커트'],
  아우터: ['패딩', '후드집업', '자켓', '가디건'],
}
const COLOR_OPTIONS = ['검정', '흰색', '그레이', '아이보리']
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL']

const productName = ref('')
const parentCategory = ref('상의')
const childCategory = ref('반팔')
const price = ref('')
const status = ref('활성')
const vendorName = ref('')
const regDate = ref(new Date().toISOString().slice(0, 10).replaceAll('-', '.'))
const selectedColors = ref([])
const selectedSizes = ref([])

const childCategoryOptions = computed(() => categoryMap[parentCategory.value] ?? [])

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

const requiredProgress = computed(() => {
  const requiredSteps = [
    Boolean(productName.value.trim()),
    Boolean(parentCategory.value),
    Boolean(childCategory.value),
    Number(price.value) > 0,
    Boolean(vendorName.value.trim()),
    isVariantValid.value,
  ]
  return requiredSteps.filter(Boolean).length
})

const canSubmit = computed(() =>
  productName.value.trim() &&
  parentCategory.value &&
  childCategory.value &&
  Number(price.value) > 0 &&
  vendorName.value.trim() &&
  isVariantValid.value,
)

function toggleColor(color) {
  const next = new Set(selectedColors.value)
  if (next.has(color)) next.delete(color)
  else next.add(color)
  selectedColors.value = Array.from(next)
}

function toggleSize(size) {
  const next = new Set(selectedSizes.value)
  if (next.has(size)) next.delete(size)
  else next.add(size)
  selectedSizes.value = Array.from(next)
}

function handleSubmit() {
  if (!canSubmit.value) return
  router.push('/hq/products')
}

function handleCancel() {
  router.push('/hq/products')
}
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
          <span class="text-gray-700">신규 제품 등록</span>
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
            <h1 class="text-xl font-black text-gray-950">신규 제품 등록</h1>
            <p class="mt-0.5 text-xs font-bold text-gray-400">제품 기본 정보를 입력하고 신규 제품을 등록합니다.</p>
          </div>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] xl:items-start">
        <div class="border border-gray-200 bg-white shadow-sm">
          <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
            <Package :size="15" class="text-[#004D3C]" />
            <h2 class="text-sm font-black text-gray-900">제품 정보 입력</h2>
          </div>

          <div class="border-b border-gray-100 bg-[#F7FBFA] px-5 py-3">
            <div class="flex items-center justify-between gap-2">
              <p class="text-[11px] font-black uppercase tracking-wide text-gray-500">입력 진행 안내</p>
              <span class="text-[11px] font-black text-[#004D3C]">{{ requiredProgress }}/6 완료</span>
            </div>
            <div class="mt-2 h-1.5 overflow-hidden bg-[#DCEDE8]">
              <div class="h-full bg-[#0E7A60] transition-all" :style="{ width: `${(requiredProgress / 6) * 100}%` }" />
            </div>
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
                <select
                  v-model="parentCategory"
                  class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004D3C]"
                >
                  <option v-for="parent in Object.keys(categoryMap)" :key="parent" :value="parent">{{ parent }}</option>
                </select>
              </label>
              <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                소분류 <span class="text-red-500">*</span>
                <select
                  v-model="childCategory"
                  class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004D3C]"
                >
                  <option v-for="child in childCategoryOptions" :key="child" :value="child">{{ child }}</option>
                </select>
              </label>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                단가 <span class="text-red-500">*</span>
                <input
                  v-model.number="price"
                  type="number"
                  min="0"
                  placeholder="숫자로 입력"
                  class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#004D3C]"
                />
              </label>
              <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                상태
                <select
                  v-model="status"
                  class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004D3C]"
                >
                  <option value="활성">활성</option>
                  <option value="점검중">점검중</option>
                  <option value="비활성">비활성</option>
                </select>
              </label>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                메인 거래처 <span class="text-red-500">*</span>
                <input
                  v-model="vendorName"
                  type="text"
                  placeholder="거래처명을 입력하세요"
                  class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#004D3C]"
                />
              </label>
              <label class="block text-[11px] font-black uppercase tracking-wide text-gray-500">
                등록일
                <input
                  v-model="regDate"
                  type="text"
                  class="mt-1.5 w-full border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#004D3C]"
                />
              </label>
            </div>

            <div class="mt-6 space-y-3 rounded-md border border-gray-300 bg-white p-5">
              <p class="text-[11px] font-black uppercase tracking-wide text-gray-500">옵션 구성 <span class="text-red-500">*</span></p>
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

              <div class="mt-5 pt-2">
                <p class="mb-2 text-[11px] font-black text-gray-500">공통 사이즈 선택</p>
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
              <div class="flex gap-2">
                <button
                  type="button"
                  class="flex-1 border border-gray-300 bg-white py-2.5 text-sm font-black text-gray-700 hover:bg-gray-50"
                  @click="handleCancel"
                >
                  취소
                </button>
                <button
                  type="submit"
                  class="flex-1 border border-[#004D3C] bg-[#004D3C] py-2.5 text-sm font-black text-white hover:bg-[#003d30] disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="!canSubmit"
                >
                  신규 제품 등록
                </button>
              </div>
            </div>
          </form>
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
                <span class="font-black text-gray-800">{{ Number(price) > 0 ? `₩${Number(price).toLocaleString()}` : '-' }}</span>
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
            </div>
          </section>

          <section class="border border-gray-200 bg-white p-4 shadow-sm">
            <h3 class="text-xs font-black uppercase tracking-wide text-gray-500">작성 가이드</h3>
            <div class="mt-3 space-y-2 text-[12px] font-bold text-gray-600">
              <p>제품명은 거래처/매장 공통으로 식별 가능한 명칭으로 입력하세요.</p>
              <p>카테고리는 대분류와 소분류를 함께 선택해야 저장할 수 있습니다.</p>
              <p>단가는 원 단위 숫자만 입력하고, 메인 거래처는 필수입니다.</p>
              <p>옵션은 최소 1개 색상과 1개 사이즈를 선택하며, 선택한 사이즈는 모든 선택 색상에 공통 적용됩니다.</p>
            </div>
          </section>
        </aside>
      </section>
    </div>
  </AppLayout>
</template>
