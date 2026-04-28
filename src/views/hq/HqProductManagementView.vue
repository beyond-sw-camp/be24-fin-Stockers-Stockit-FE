<script setup>
import { computed, h, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { deleteCategory, getCategories, getCategory, updateCategory } from '@/api/category.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const tabLabelMap = { categories: '카테고리 관리', products: '제품 마스터' }
const activeTopMenu = computed(() => '상품 관리')
const activeSideMenu = ref(tabLabelMap[route.query.tab] ?? '카테고리 관리')

watch(() => route.query.tab, (tab) => {
  activeSideMenu.value = tabLabelMap[tab] ?? '카테고리 관리'
})
const selectedProduct = ref(null)
const selectedCategory = ref(null)
const categoryEditForm = ref(null)
const categorySubmitting = ref(false)

const productSideMenus = [
  { label: '카테고리 관리', icon: 'tags', id: 'SO-006' },
  { label: '제품 마스터', icon: 'package', id: 'SO-011' },
]

const productMasterData = [
  { id: 'PD-T001', name: '코튼 베이직 반팔 티셔츠', parentCategory: '상의', childCategory: '반팔', price: 12900, leadTime: '3일', vendor: '스타일텍스', status: '활성', regDate: '2024.01.12' },
  { id: 'PD-T002', name: '슬림핏 긴팔 티셔츠', parentCategory: '상의', childCategory: '긴팔', price: 16900, leadTime: '4일', vendor: '스타일텍스', status: '활성', regDate: '2024.01.26' },
  { id: 'PD-T003', name: '오버핏 옥스포드 셔츠', parentCategory: '상의', childCategory: '셔츠', price: 35900, leadTime: '5일', vendor: '어반클로스', status: '활성', regDate: '2024.02.14' },
  { id: 'PD-T004', name: '라운드넥 소프트 니트', parentCategory: '상의', childCategory: '니트', price: 39900, leadTime: '6일', vendor: '니트랩', status: '점검중', regDate: '2024.03.02' },
  { id: 'PD-T005', name: '헤비웨이트 로고 후드티', parentCategory: '상의', childCategory: '후드티', price: 45900, leadTime: '7일', vendor: '어반클로스', status: '활성', regDate: '2024.03.15' },
  { id: 'PD-B001', name: '스트레이트 워싱 데님', parentCategory: '바지', childCategory: '청바지', price: 42900, leadTime: '5일', vendor: '데님하우스', status: '활성', regDate: '2024.01.19' },
  { id: 'PD-B002', name: '라이트 코튼 쇼츠', parentCategory: '바지', childCategory: '반바지', price: 29900, leadTime: '4일', vendor: '데님하우스', status: '활성', regDate: '2024.02.08' },
  { id: 'PD-B003', name: '와이드 밴딩 팬츠', parentCategory: '바지', childCategory: '긴바지', price: 37900, leadTime: '4일', vendor: '모션웨어', status: '활성', regDate: '2024.02.27' },
  { id: 'PD-B004', name: '데일리 조거 트레이닝 팬츠', parentCategory: '바지', childCategory: '츄리닝', price: 33900, leadTime: '3일', vendor: '모션웨어', status: '비활성', regDate: '2024.03.11' },
  { id: 'PD-S001', name: 'A라인 데님 미니스커트', parentCategory: '치마', childCategory: '미니 스커트', price: 31900, leadTime: '5일', vendor: '스커트스튜디오', status: '활성', regDate: '2024.01.30' },
  { id: 'PD-S002', name: '플리츠 롱스커트', parentCategory: '치마', childCategory: '롱스커트', price: 38900, leadTime: '6일', vendor: '스커트스튜디오', status: '활성', regDate: '2024.03.05' },
  { id: 'PD-O001', name: '라이트 숏 패딩', parentCategory: '아우터', childCategory: '패딩', price: 79900, leadTime: '8일', vendor: '윈터픽', status: '활성', regDate: '2024.02.21' },
  { id: 'PD-O002', name: '스웨트 후드 집업', parentCategory: '아우터', childCategory: '후드집업', price: 54900, leadTime: '6일', vendor: '윈터픽', status: '점검중', regDate: '2024.03.09' },
  { id: 'PD-O003', name: '싱글 브레스트 자켓', parentCategory: '아우터', childCategory: '자켓', price: 72900, leadTime: '9일', vendor: '테일러드원', status: '활성', regDate: '2024.03.18' },
  { id: 'PD-O004', name: '브이넥 니트 가디건', parentCategory: '아우터', childCategory: '가디건', price: 48900, leadTime: '7일', vendor: '니트랩', status: '활성', regDate: '2024.03.25' },
]

const categories = ref([])
const categoryError = ref('')

const expandedCategories = ref(new Set(['CAT-100']))

const totalCategoryCount = computed(() =>
  categories.value.reduce((acc, cat) => acc + 1 + cat.children.length, 0),
)
const productKeyword = ref('')
const selectedParentFilter = ref('all')
const selectedChildFilter = ref('all')
const parentCategoryOptions = computed(() => categories.value.map((cat) => cat.name))
const childCategoryOptions = computed(() => {
  if (selectedParentFilter.value === 'all') {
    return categories.value.flatMap((cat) => cat.children.map((child) => child.name))
  }
  const target = categories.value.find((cat) => cat.name === selectedParentFilter.value)
  return target ? target.children.map((child) => child.name) : []
})
const filteredProductMasterData = computed(() => {
  const keyword = productKeyword.value.trim().toLowerCase()
  return productMasterData.filter((prod) => {
    const matchParent = selectedParentFilter.value === 'all' || prod.parentCategory === selectedParentFilter.value
    const matchChild = selectedChildFilter.value === 'all' || prod.childCategory === selectedChildFilter.value
    const matchKeyword =
      !keyword ||
      [prod.id, prod.name, prod.vendor, prod.parentCategory, prod.childCategory]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    return matchParent && matchChild && matchKeyword
  })
})

function handleParentFilterChange(event) {
  selectedParentFilter.value = event.target.value
  selectedChildFilter.value = 'all'
}

const toggleExpand = (id, event) => {
  event.stopPropagation()
  const next = new Set(expandedCategories.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedCategories.value = next
}

const closeDetail = () => { selectedProduct.value = null }
const closeCategoryDetail = () => {
  selectedCategory.value = null
  categoryEditForm.value = null
}
const productEditForm = ref(null)

const statusLabelMap = {
  ACTIVE: '사용중',
  SUSPENDED: '점검중',
  INACTIVE: '미사용',
}

const levelLabelMap = {
  ROOT: '대분류',
  CHILD: '소분류',
}

function formatDate(dateValue) {
  if (!dateValue) return '-'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toISOString().slice(0, 10).replace(/-/g, '.')
}

function mapCategoryNode(node, parent = null) {
  return {
    id: node.code,
    name: node.name,
    level: levelLabelMap[node.level] ?? node.level,
    status: statusLabelMap[node.status] ?? node.status,
    lastUpdated: formatDate(node.updatedAt),
    parentId: parent?.code ?? null,
    parentName: parent?.name ?? null,
    children: (node.children ?? []).map((child) => mapCategoryNode(child, node)),
  }
}

async function loadCategories() {
  try {
    categoryError.value = ''
    const list = await getCategories()
    categories.value = list.map((node) => mapCategoryNode(node))
    if (categories.value.length > 0 && expandedCategories.value.size === 0) {
      expandedCategories.value = new Set([categories.value[0].id])
    }
  } catch (error) {
    categoryError.value = error.message
  }
}

async function selectCategory(code) {
  try {
    categoryError.value = ''
    const detail = await getCategory(code)
    const parent = categories.value.find((cat) => cat.id === detail.parentCode) ?? null
    selectedCategory.value = {
      id: detail.code,
      name: detail.name,
      level: levelLabelMap[detail.level] ?? detail.level,
      status: statusLabelMap[detail.status] ?? detail.status,
      parentId: parent?.id ?? null,
      parentName: parent?.name ?? null,
      lastUpdated: formatDate(detail.updatedAt),
      children: [],
    }
    categoryEditForm.value = {
      name: selectedCategory.value.name,
      status: selectedCategory.value.status,
    }
  } catch (error) {
    categoryError.value = error.message
  }
}

const statusCodeMap = {
  사용중: 'ACTIVE',
  점검중: 'SUSPENDED',
  미사용: 'INACTIVE',
}

async function handleSaveCategory() {
  if (!selectedCategory.value || !categoryEditForm.value) return
  if (!categoryEditForm.value.name?.trim()) {
    categoryError.value = '카테고리명을 입력해주세요.'
    return
  }

  try {
    categorySubmitting.value = true
    categoryError.value = ''
    await updateCategory(selectedCategory.value.id, {
      name: categoryEditForm.value.name.trim(),
      status: statusCodeMap[categoryEditForm.value.status] ?? 'ACTIVE',
    })
    await loadCategories()
    await selectCategory(selectedCategory.value.id)
  } catch (error) {
    categoryError.value = error.message
  } finally {
    categorySubmitting.value = false
  }
}

async function handleDeleteCategory() {
  if (!selectedCategory.value) return
  const ok = confirm(`[${selectedCategory.value.name}] 카테고리를 삭제하시겠습니까?`)
  if (!ok) return

  try {
    categorySubmitting.value = true
    categoryError.value = ''
    await deleteCategory(selectedCategory.value.id)
    closeCategoryDetail()
    await loadCategories()
  } catch (error) {
    categoryError.value = error.message
  } finally {
    categorySubmitting.value = false
  }
}

const syncProductEditForm = (product) => {
  if (!product) {
    productEditForm.value = null
    return
  }
  productEditForm.value = {
    name: product.name,
    parentCategory: product.parentCategory,
    childCategory: product.childCategory,
    price: product.price,
    vendor: product.vendor,
    status: product.status,
    regDate: product.regDate,
  }
}

watch(selectedProduct, (product) => {
  syncProductEditForm(product)
})

const detailChildCategoryOptions = computed(() => {
  if (!productEditForm.value?.parentCategory) return []
  const target = categories.value.find((cat) => cat.name === productEditForm.value.parentCategory)
  return target ? target.children.map((child) => child.name) : []
})

function handleDetailParentChange(event) {
  if (!productEditForm.value) return
  const nextParent = event.target.value
  productEditForm.value.parentCategory = nextParent
  const target = categories.value.find((cat) => cat.name === nextParent)
  productEditForm.value.childCategory = target?.children?.[0]?.name ?? ''
}

function saveProductDetail() {
  if (!selectedProduct.value || !productEditForm.value) return
  Object.assign(selectedProduct.value, productEditForm.value)
}

function resetProductDetail() {
  syncProductEditForm(selectedProduct.value)
}

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
const TagsIcon = IconBase([
  { tag: 'path', attrs: { d: 'm20 13-7 7-9-9V4h7Z' } },
  { tag: 'path', attrs: { d: 'M7 7h.01' } },
])
const PackageIcon = IconBase([
  { tag: 'path', attrs: { d: 'm7.5 4.27 9 5.15' } },
  { tag: 'path', attrs: { d: 'M21 8.5 12 13 3 8.5' } },
  { tag: 'path', attrs: { d: 'M3 8.5V16l9 5 9-5V8.5' } },
  { tag: 'path', attrs: { d: 'M12 13v8' } },
  { tag: 'path', attrs: { d: 'M3.27 7 12 2l8.73 5' } },
])
const InfoIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 10v6' } },
  { tag: 'path', attrs: { d: 'M12 7h.01' } },
])
const PlusCircleIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 8v8' } },
  { tag: 'path', attrs: { d: 'M8 12h8' } },
])
const ChevronDownIcon = IconBase([{ tag: 'path', attrs: { d: 'm6 9 6 6 6-6' } }])
const ChevronRightIcon = IconBase([{ tag: 'path', attrs: { d: 'm9 18 6-6-6-6' } }])
const XIcon = IconBase([
  { tag: 'path', attrs: { d: 'M18 6 6 18' } },
  { tag: 'path', attrs: { d: 'm6 6 12 12' } },
])

const iconMap = {
  tags: TagsIcon,
  package: PackageIcon,
}

onMounted(() => {
  loadCategories()
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
    <div class="flex flex-col gap-4 overflow-hidden">
      <section class="flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-white p-3 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <label class="relative block">
            <SearchIcon :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              v-model="productKeyword"
              type="text"
              :placeholder="activeSideMenu === '카테고리 관리' ? '카테고리명 또는 코드 검색...' : '제품명, 제품 코드, 거래처명 검색...'"
              class="w-72 border border-gray-300 bg-gray-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#004D3C] focus:bg-white"
            />
          </label>

          <label v-if="activeSideMenu !== '카테고리 관리'" class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
            대분류
            <select
              :value="selectedParentFilter"
              class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white"
              @change="handleParentFilterChange"
            >
              <option value="all">전체</option>
              <option v-for="parent in parentCategoryOptions" :key="parent" :value="parent">{{ parent }}</option>
            </select>
          </label>

          <label v-if="activeSideMenu !== '카테고리 관리'" class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
            소분류
            <select
              v-model="selectedChildFilter"
              class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white"
            >
              <option value="all">전체</option>
              <option v-for="child in childCategoryOptions" :key="child" :value="child">{{ child }}</option>
            </select>
          </label>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 border border-[#004D3C] bg-[#004D3C] px-3 py-2 text-xs font-bold text-white hover:bg-[#003d30]"
            @click="activeSideMenu === '카테고리 관리' ? router.push('/hq/products/categories/add') : router.push('/hq/products/new')"
          >
            <PlusCircleIcon :size="14" />
            {{ activeSideMenu === '카테고리 관리' ? '카테고리 추가' : '신규 제품 등록' }}
          </button>
        </div>
      </section>
      <p v-if="categoryError" class="border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
        {{ categoryError }}
      </p>

      <!-- 카테고리 관리 -->
      <section v-if="activeSideMenu === '카테고리 관리'" class="flex min-h-0 flex-col gap-4 xl:flex-row">
        <div class="flex min-w-0 flex-1 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 bg-gray-50/70 px-4 py-3">
            <h3 class="inline-flex items-center gap-2 text-xs font-bold text-gray-800">
              <TagsIcon :size="14" />
              카테고리 마스터
            </h3>
            <span class="text-[10px] font-bold text-gray-400">총 {{ totalCategoryCount }}개 (대분류 {{ categories.length }}개)</span>
          </div>
          <div class="overflow-auto">
            <table class="w-full min-w-[640px] text-xs">
              <thead class="bg-gray-100 text-[10px] text-gray-500">
                <tr>
                  <th class="w-28 px-3 py-2 text-center font-bold">분류 코드</th>
                  <th class="px-3 py-2 text-left font-bold">카테고리명</th>
                  <th class="w-20 px-3 py-2 text-center font-bold">단계</th>
                  <th class="w-32 px-3 py-2 text-center font-bold">소분류 수 / 상위 분류</th>
                  <th class="w-24 px-3 py-2 text-center font-bold">상태</th>
                  <th class="w-32 px-3 py-2 text-center font-bold">최종 수정일</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <template v-for="cat in categories" :key="cat.id">
                  <!-- 대분류 행 -->
                  <tr
                    class="cursor-pointer hover:bg-gray-50"
                    :class="selectedCategory?.id === cat.id ? 'bg-[#E6F2F0]' : ''"
                    @click="selectCategory(cat.id)"
                  >
                    <td class="px-3 py-3 text-center font-bold text-gray-400">{{ cat.id }}</td>
                    <td class="px-3 py-3">
                      <div class="flex items-center gap-2">
                        <button
                          type="button"
                          class="flex h-5 w-5 shrink-0 items-center justify-center border border-gray-300 text-gray-500 hover:border-[#004D3C] hover:text-[#004D3C]"
                          @click="toggleExpand(cat.id, $event)"
                        >
                          <component :is="expandedCategories.has(cat.id) ? ChevronDownIcon : ChevronRightIcon" :size="11" />
                        </button>
                        <span class="font-bold text-gray-900">{{ cat.name }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-3 text-center">
                      <span class="bg-[#EBF5F5] px-2 py-0.5 text-[10px] font-bold text-[#004D3C]">대분류</span>
                    </td>
                    <td class="px-3 py-3 text-center font-bold text-[#004D3C]">{{ cat.children.length }}개</td>
                    <td class="px-3 py-3 text-center">
                      <span class="bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{{ cat.status }}</span>
                    </td>
                    <td class="px-3 py-3 text-center font-bold text-gray-400">{{ cat.lastUpdated }}</td>
                  </tr>
                  <!-- 소분류 행들 -->
                  <template v-if="expandedCategories.has(cat.id)">
                    <tr
                      v-for="child in cat.children"
                      :key="child.id"
                      class="cursor-pointer bg-gray-50/40 hover:bg-gray-100/60"
                      :class="selectedCategory?.id === child.id ? 'bg-[#E6F2F0]' : ''"
                      @click="selectCategory(child.id)"
                    >
                      <td class="px-3 py-2.5 text-center font-bold text-gray-400">{{ child.id }}</td>
                      <td class="px-3 py-2.5">
                        <div class="flex items-center gap-1 pl-7">
                          <span class="text-gray-300">└</span>
                          <span class="ml-1 font-bold text-gray-700">{{ child.name }}</span>
                        </div>
                      </td>
                      <td class="px-3 py-2.5 text-center">
                        <span class="bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">소분류</span>
                      </td>
                      <td class="px-3 py-2.5 text-center font-bold text-gray-500">{{ child.parentName }}</td>
                      <td class="px-3 py-2.5 text-center">
                        <span class="bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{{ child.status }}</span>
                      </td>
                      <td class="px-3 py-2.5 text-center font-bold text-gray-400">{{ child.lastUpdated }}</td>
                    </tr>
                  </template>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 카테고리 상세 패널 -->
        <aside v-if="selectedCategory && categoryEditForm" class="w-full shrink-0 border border-gray-300 bg-white shadow-sm xl:w-80">
          <div class="flex items-center justify-between bg-[#004D3C] px-4 py-3 text-white">
            <h3 class="inline-flex items-center gap-2 text-[11px] font-bold">
              <InfoIcon :size="14" /> 카테고리 상세
            </h3>
            <button type="button" class="p-1 hover:bg-white/10" @click="closeCategoryDetail">
              <XIcon :size="16" />
            </button>
          </div>
          <div class="space-y-4 p-4">
            <div>
              <p class="text-[10px] font-bold text-gray-400">분류 코드: {{ selectedCategory.id }}</p>
              <h4 class="mt-1 text-lg font-bold text-gray-900">{{ selectedCategory.name }}</h4>
              <p class="mt-1 text-xs font-bold text-gray-400">
                {{ selectedCategory.level === '대분류' ? '시스템 계층: 대분류' : `시스템 계층: 소분류 (상위: ${selectedCategory.parentName})` }}
              </p>
            </div>

            <div class="space-y-3">
              <label class="block text-[10px] font-bold text-gray-400">
                카테고리명
                <input
                  type="text"
                  v-model="categoryEditForm.name"
                  class="mt-1 w-full border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#004D3C]"
                />
              </label>

              <label v-if="selectedCategory.level === '소분류'" class="block text-[10px] font-bold text-gray-400">
                상위 분류
                <select class="mt-1 w-full border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#004D3C]">
                  <option v-for="cat in categories" :key="cat.id" :selected="cat.id === selectedCategory.parentId">{{ cat.name }}</option>
                </select>
              </label>

              <label class="block text-[10px] font-bold text-gray-400">
                상태
                <select v-model="categoryEditForm.status" class="mt-1 w-full border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#004D3C]">
                  <option>사용중</option>
                  <option>점검중</option>
                  <option>미사용</option>
                </select>
              </label>
            </div>

            <div v-if="selectedCategory.level === '대분류'" class="border border-gray-200 bg-gray-50 p-3">
              <p class="text-[10px] font-bold text-gray-400">소분류 목록</p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <span
                  v-for="child in categories.find(c => c.id === selectedCategory.id)?.children"
                  :key="child.id"
                  class="bg-[#EBF5F5] px-2 py-1 text-[11px] font-bold text-[#004D3C]"
                >
                  {{ child.name }}
                </span>
              </div>
            </div>

            <div class="flex gap-2 pt-1">
              <button
                type="button"
                class="flex-1 border border-[#004D3C] bg-[#004D3C] py-2 text-xs font-bold text-white hover:bg-[#003d30] disabled:opacity-50"
                :disabled="categorySubmitting"
                @click="handleSaveCategory"
              >
                저장
              </button>
              <button
                type="button"
                class="flex-1 border border-red-300 bg-red-50 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                :disabled="categorySubmitting"
                @click="handleDeleteCategory"
              >
                삭제
              </button>
            </div>
          </div>
        </aside>
      </section>

      <!-- 제품 마스터 -->
      <section v-else class="flex min-h-0 flex-col gap-4 xl:flex-row">
        <div class="flex min-w-0 flex-1 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 bg-gray-50/70 px-4 py-3">
            <div class="flex items-center justify-between gap-2">
              <h3 class="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-800">
                <PackageIcon :size="14" />
                {{ activeSideMenu }}
              </h3>
              <span class="text-[10px] font-bold text-gray-400">총 {{ filteredProductMasterData.length }}개</span>
            </div>
          </div>
          <div class="overflow-auto">
            <table class="w-full min-w-[860px] text-xs">
              <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th class="w-24 px-3 py-2 text-center font-black">제품 코드</th>
                  <th class="px-3 py-2 text-left font-black">제품명</th>
                  <th class="w-44 px-3 py-2 text-left font-black">카테고리</th>
                  <th class="w-28 px-3 py-2 text-right font-black">표준 단가</th>
                  <th class="w-32 px-3 py-2 text-left font-black">메인 거래처</th>
                  <th class="w-24 px-3 py-2 text-center font-black">상태</th>
                  <th class="w-28 px-3 py-2 text-center font-black">등록일</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="prod in filteredProductMasterData"
                  :key="prod.id"
                  class="cursor-pointer hover:bg-gray-50"
                  :class="selectedProduct?.id === prod.id ? 'bg-[#E6F2F0]' : ''"
                  @click="selectedProduct = prod"
                >
                  <td class="px-3 py-3 text-center font-bold text-gray-400">{{ prod.id }}</td>
                  <td class="px-3 py-3 font-black text-gray-800">{{ prod.name }}</td>
                  <td class="px-3 py-3 text-gray-600">{{ prod.parentCategory }} &gt; {{ prod.childCategory }}</td>
                  <td class="px-3 py-3 text-right font-black text-gray-800">₩{{ prod.price.toLocaleString() }}</td>
                  <td class="px-3 py-3 text-gray-600">{{ prod.vendor }}</td>
                  <td class="px-3 py-3 text-center"><span class="bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">{{ prod.status }}</span></td>
                  <td class="px-3 py-3 text-center font-bold text-gray-400">{{ prod.regDate }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <aside v-if="selectedProduct && productEditForm" class="w-full shrink-0 border border-gray-300 bg-white shadow-sm xl:w-80">
          <div class="flex items-center justify-between bg-[#004D3C] px-4 py-3 text-white">
            <h3 class="inline-flex items-center gap-2 text-[11px] font-black uppercase"><InfoIcon :size="14" /> 제품 상세</h3>
            <button type="button" class="p-1 hover:bg-white/10" @click="closeDetail"><XIcon :size="16" /></button>
          </div>
          <div class="space-y-6 p-5">
            <div>
              <p class="text-[10px] font-bold uppercase text-gray-400">마스터 ID: {{ selectedProduct.id }}</p>
              <h4 class="mt-2 text-base font-black leading-snug text-gray-900">제품 정보 수정</h4>
              <div class="mt-3 flex flex-wrap gap-2">
                <span class="border border-gray-200 bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">{{ productEditForm.parentCategory }} &gt; {{ productEditForm.childCategory }}</span>
                <span class="border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{{ productEditForm.status }}</span>
              </div>
            </div>
            <div class="space-y-4">
              <label class="block text-[10px] font-bold uppercase text-gray-400">
                제품명
                <input
                  v-model="productEditForm.name"
                  type="text"
                  class="mt-1.5 w-full border border-gray-300 bg-gray-50 px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#004D3C]"
                />
              </label>
              <div class="grid grid-cols-2 gap-3">
                <label class="block text-[10px] font-bold uppercase text-gray-400">
                  대분류
                  <select
                    :value="productEditForm.parentCategory"
                    class="mt-1.5 w-full border border-gray-300 bg-gray-50 px-2 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#004D3C]"
                    @change="handleDetailParentChange"
                  >
                    <option v-for="parent in parentCategoryOptions" :key="parent" :value="parent">{{ parent }}</option>
                  </select>
                </label>
                <label class="block text-[10px] font-bold uppercase text-gray-400">
                  소분류
                  <select
                    v-model="productEditForm.childCategory"
                    class="mt-1.5 w-full border border-gray-300 bg-gray-50 px-2 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#004D3C]"
                  >
                    <option v-for="child in detailChildCategoryOptions" :key="child" :value="child">{{ child }}</option>
                  </select>
                </label>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <label class="block text-[10px] font-bold uppercase text-gray-400">
                  단가
                  <input
                    v-model.number="productEditForm.price"
                    type="number"
                    min="0"
                    class="mt-1.5 w-full border border-gray-300 bg-gray-50 px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#004D3C]"
                  />
                </label>
                <label class="block text-[10px] font-bold uppercase text-gray-400">
                  상태
                  <select
                    v-model="productEditForm.status"
                    class="mt-1.5 w-full border border-gray-300 bg-gray-50 px-2 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#004D3C]"
                  >
                    <option value="활성">활성</option>
                    <option value="점검중">점검중</option>
                    <option value="비활성">비활성</option>
                  </select>
                </label>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <label class="block text-[10px] font-bold uppercase text-gray-400">
                  메인 거래처
                  <input
                    v-model="productEditForm.vendor"
                    type="text"
                    class="mt-1.5 w-full border border-gray-300 bg-gray-50 px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#004D3C]"
                  />
                </label>
                <label class="block text-[10px] font-bold uppercase text-gray-400">
                  등록일
                  <input
                    v-model="productEditForm.regDate"
                    type="text"
                    class="mt-1.5 w-full border border-gray-300 bg-gray-50 px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#004D3C]"
                  />
                </label>
              </div>
            </div>
            <div class="border border-gray-200 bg-gray-50 p-4">
              <p class="text-[10px] font-bold uppercase text-gray-400">메인 계약처</p>
              <div class="mt-3 flex items-center justify-between gap-2 text-xs font-bold text-gray-700">
                <span>{{ productEditForm.vendor }}</span>
                <span class="bg-[#E6F2F0] px-2 py-1 text-[#004D3C]">메인 계약처</span>
              </div>
              <div class="mt-3 flex justify-between text-xs">
                <span class="text-gray-500">계약가</span>
                <strong class="text-[#004D3C]">₩{{ Math.round(productEditForm.price * 0.95).toLocaleString() }}</strong>
              </div>
            </div>
            <div class="flex gap-2 pt-2">
              <button
                type="button"
                class="flex-1 border border-[#004D3C] bg-[#004D3C] py-2 text-xs font-black text-white hover:bg-[#003d30]"
                @click="saveProductDetail"
              >
                저장
              </button>
              <button
                type="button"
                class="flex-1 border border-gray-300 bg-white py-2 text-xs font-black text-gray-700 hover:bg-gray-50"
                @click="resetProductDetail"
              >
                되돌리기
              </button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  </AppLayout>
</template>
