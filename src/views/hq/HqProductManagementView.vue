<script setup>
import { computed, h, ref } from 'vue'
import { useRouter } from 'vue-router'
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
const activeSideMenu = ref('카테고리 관리')
const selectedProduct = ref(null)
const selectedCategory = ref(null)

const productSideMenus = [
  { label: '카테고리 관리', icon: 'tags', id: 'SO-006' },
  { label: '제품 마스터', icon: 'package', id: 'SO-011' },
]

const productMasterData = [
  { id: 'PD-E001', name: '고속 충전기 (C타입) 25W', spec: '25W / White', cat: '상의 > 반팔', unit: 'EA', price: 15000, leadTime: '3일', vendor: '(주)전자에셋', status: '활성', regDate: '2024.01.12' },
  { id: 'PD-E002', name: '무소음 무선 마우스 (블랙)', spec: 'Bluetooth 5.0', cat: '상의 > 긴팔', unit: 'EA', price: 28000, leadTime: '5일', vendor: '로지잡화', status: '활성', regDate: '2024.01.15' },
  { id: 'PD-S001', name: 'A4 복사용지 80g (500매)', cat: '바지 > 청바지', spec: '80g / White', unit: 'Box', price: 24500, leadTime: '2일', vendor: '(주)한지제지', status: '활성', regDate: '2023.12.20' },
  { id: 'PD-H001', name: '휴대용 가글 (중) 250ml', cat: '아우터 > 패딩', spec: '250ml / 민트', unit: 'EA', price: 3500, leadTime: '7일', vendor: '클린헬스', status: '비활성', regDate: '2024.02.05' },
  { id: 'PD-K001', name: '유리제 머그컵 350ml', cat: '치마 > 롱스커트', spec: 'Heat-resistant', unit: 'EA', price: 8900, leadTime: '10일', vendor: '키친웨어', status: '활성', regDate: '2024.03.11' },
  { id: 'PD-S002', name: '리무버블 데코 스티커 세트', cat: '상의 > 셔츠', spec: '10 Sheets', unit: 'Set', price: 4200, leadTime: '3일', vendor: '디자인웍스', status: '활성', regDate: '2024.03.15' },
  { id: 'PD-S003', name: '스테이플러 심 (10호)', cat: '아우터 > 자켓', spec: '1000pcs', unit: 'Small Box', price: 800, leadTime: '2일', vendor: '(주)한지제지', status: '활성', regDate: '2024.01.10' },
  { id: 'PD-E003', name: '기계식 키보드 (청축)', cat: '상의 > 후드티', spec: 'RGB / Wired', unit: 'EA', price: 125000, leadTime: '14일', vendor: '(주)전자에셋', status: '활성', regDate: '2024.04.01' },
  { id: 'PD-H002', name: '손세정제 리필 500ml', cat: '바지 > 반바지', spec: '500ml / 레몬', unit: 'EA', price: 5400, leadTime: '3일', vendor: '클린헬스', status: '활성', regDate: '2024.02.10' },
  { id: 'PD-K002', name: '니트릴 고무장갑 (M)', cat: '치마 > 미니 스커트', spec: 'Blue / 100pcs', unit: 'Box', price: 12000, leadTime: '4일', vendor: '키친웨어', status: '점검중', regDate: '2024.02.15' },
]

const categories = ref([
  {
    id: 'CAT-100',
    name: '상의',
    level: '대분류',
    status: '사용중',
    lastUpdated: '2024.04.01',
    children: [
      { id: 'CAT-101', name: '반팔', level: '소분류', parentId: 'CAT-100', parentName: '상의', status: '사용중', lastUpdated: '2024.04.01' },
      { id: 'CAT-102', name: '긴팔', level: '소분류', parentId: 'CAT-100', parentName: '상의', status: '사용중', lastUpdated: '2024.04.01' },
      { id: 'CAT-103', name: '셔츠', level: '소분류', parentId: 'CAT-100', parentName: '상의', status: '사용중', lastUpdated: '2024.04.01' },
      { id: 'CAT-104', name: '니트', level: '소분류', parentId: 'CAT-100', parentName: '상의', status: '사용중', lastUpdated: '2024.04.01' },
      { id: 'CAT-105', name: '후드티', level: '소분류', parentId: 'CAT-100', parentName: '상의', status: '사용중', lastUpdated: '2024.04.01' },
    ],
  },
  {
    id: 'CAT-200',
    name: '바지',
    level: '대분류',
    status: '사용중',
    lastUpdated: '2024.04.01',
    children: [
      { id: 'CAT-201', name: '청바지', level: '소분류', parentId: 'CAT-200', parentName: '바지', status: '사용중', lastUpdated: '2024.04.01' },
      { id: 'CAT-202', name: '반바지', level: '소분류', parentId: 'CAT-200', parentName: '바지', status: '사용중', lastUpdated: '2024.04.01' },
      { id: 'CAT-203', name: '긴바지', level: '소분류', parentId: 'CAT-200', parentName: '바지', status: '사용중', lastUpdated: '2024.04.01' },
      { id: 'CAT-204', name: '츄리닝', level: '소분류', parentId: 'CAT-200', parentName: '바지', status: '사용중', lastUpdated: '2024.04.01' },
    ],
  },
  {
    id: 'CAT-300',
    name: '치마',
    level: '대분류',
    status: '사용중',
    lastUpdated: '2024.04.01',
    children: [
      { id: 'CAT-301', name: '미니 스커트', level: '소분류', parentId: 'CAT-300', parentName: '치마', status: '사용중', lastUpdated: '2024.04.01' },
      { id: 'CAT-302', name: '롱스커트', level: '소분류', parentId: 'CAT-300', parentName: '치마', status: '사용중', lastUpdated: '2024.04.01' },
    ],
  },
  {
    id: 'CAT-400',
    name: '아우터',
    level: '대분류',
    status: '사용중',
    lastUpdated: '2024.04.01',
    children: [
      { id: 'CAT-401', name: '패딩', level: '소분류', parentId: 'CAT-400', parentName: '아우터', status: '사용중', lastUpdated: '2024.04.01' },
      { id: 'CAT-402', name: '후드집업', level: '소분류', parentId: 'CAT-400', parentName: '아우터', status: '사용중', lastUpdated: '2024.04.01' },
      { id: 'CAT-403', name: '자켓', level: '소분류', parentId: 'CAT-400', parentName: '아우터', status: '사용중', lastUpdated: '2024.04.01' },
      { id: 'CAT-404', name: '가디건', level: '소분류', parentId: 'CAT-400', parentName: '아우터', status: '사용중', lastUpdated: '2024.04.01' },
    ],
  },
])

const expandedCategories = ref(new Set(['CAT-100']))

const totalCategoryCount = computed(() =>
  categories.value.reduce((acc, cat) => acc + 1 + cat.children.length, 0),
)

const toggleExpand = (id, event) => {
  event.stopPropagation()
  const next = new Set(expandedCategories.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedCategories.value = next
}

const closeDetail = () => { selectedProduct.value = null }
const closeCategoryDetail = () => { selectedCategory.value = null }

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
const DownloadIcon = IconBase([
  { tag: 'path', attrs: { d: 'M12 3v12' } },
  { tag: 'path', attrs: { d: 'm7 10 5 5 5-5' } },
  { tag: 'path', attrs: { d: 'M5 21h14' } },
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
              type="text"
              :placeholder="activeSideMenu === '카테고리 관리' ? '카테고리명 또는 코드 검색...' : '제품명, 제품 코드, 거래처명 검색...'"
              class="w-72 border border-gray-300 bg-gray-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#004D3C] focus:bg-white"
            />
          </label>

          <label v-if="activeSideMenu !== '카테고리 관리'" class="flex items-center gap-2 text-[11px] font-black uppercase text-gray-400">
            카테고리
            <select class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white">
              <option>전체 카테고리</option>
              <option>상의</option>
              <option>바지</option>
              <option>치마</option>
              <option>아우터</option>
            </select>
          </label>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button v-if="activeSideMenu !== '카테고리 관리'" type="button" class="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
            <DownloadIcon :size="14" />
            일괄 업로드 (CSV)
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 border border-[#004D3C] bg-[#004D3C] px-3 py-2 text-xs font-black text-white hover:bg-[#003d30]"
            @click="activeSideMenu === '카테고리 관리' ? router.push('/hq/products/categories/add') : undefined"
          >
            <PlusCircleIcon :size="14" />
            {{ activeSideMenu === '카테고리 관리' ? '카테고리 추가' : '신규 제품 등록' }}
          </button>
        </div>
      </section>

      <!-- 카테고리 관리 -->
      <section v-if="activeSideMenu === '카테고리 관리'" class="flex min-h-0 flex-col gap-4 xl:flex-row">
        <div class="flex min-w-0 flex-1 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 bg-gray-50/70 px-4 py-3">
            <h3 class="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-800">
              <TagsIcon :size="14" />
              카테고리 마스터
            </h3>
            <span class="text-[10px] font-bold text-gray-400">총 {{ totalCategoryCount }}개 (대분류 {{ categories.length }}개)</span>
          </div>
          <div class="overflow-auto">
            <table class="w-full min-w-[640px] text-xs">
              <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th class="w-28 px-3 py-2 text-center font-black">분류 코드</th>
                  <th class="px-3 py-2 text-left font-black">카테고리명</th>
                  <th class="w-20 px-3 py-2 text-center font-black">단계</th>
                  <th class="w-32 px-3 py-2 text-center font-black">소분류 수 / 상위 분류</th>
                  <th class="w-24 px-3 py-2 text-center font-black">상태</th>
                  <th class="w-32 px-3 py-2 text-center font-black">최종 수정일</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <template v-for="cat in categories" :key="cat.id">
                  <!-- 대분류 행 -->
                  <tr
                    class="cursor-pointer hover:bg-gray-50"
                    :class="selectedCategory?.id === cat.id ? 'bg-[#E6F2F0]' : ''"
                    @click="selectedCategory = cat"
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
                        <span class="font-black text-gray-900">{{ cat.name }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-3 text-center">
                      <span class="bg-[#EBF5F5] px-2 py-0.5 text-[10px] font-black text-[#004D3C]">대분류</span>
                    </td>
                    <td class="px-3 py-3 text-center font-black text-[#004D3C]">{{ cat.children.length }}개</td>
                    <td class="px-3 py-3 text-center">
                      <span class="bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">{{ cat.status }}</span>
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
                      @click="selectedCategory = child"
                    >
                      <td class="px-3 py-2.5 text-center font-bold text-gray-400">{{ child.id }}</td>
                      <td class="px-3 py-2.5">
                        <div class="flex items-center gap-1 pl-7">
                          <span class="text-gray-300">└</span>
                          <span class="ml-1 font-bold text-gray-700">{{ child.name }}</span>
                        </div>
                      </td>
                      <td class="px-3 py-2.5 text-center">
                        <span class="bg-gray-100 px-2 py-0.5 text-[10px] font-black text-gray-500">소분류</span>
                      </td>
                      <td class="px-3 py-2.5 text-center font-bold text-gray-500">{{ child.parentName }}</td>
                      <td class="px-3 py-2.5 text-center">
                        <span class="bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">{{ child.status }}</span>
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
        <aside v-if="selectedCategory" class="w-full shrink-0 border border-gray-300 bg-white shadow-sm xl:w-80">
          <div class="flex items-center justify-between bg-[#004D3C] px-4 py-3 text-white">
            <h3 class="inline-flex items-center gap-2 text-[11px] font-black uppercase">
              <InfoIcon :size="14" /> 카테고리 상세
            </h3>
            <button type="button" class="p-1 hover:bg-white/10" @click="closeCategoryDetail">
              <XIcon :size="16" />
            </button>
          </div>
          <div class="space-y-4 p-4">
            <div>
              <p class="text-[10px] font-bold uppercase text-gray-400">분류 코드: {{ selectedCategory.id }}</p>
              <h4 class="mt-1 text-lg font-black text-gray-900">{{ selectedCategory.name }}</h4>
              <p class="mt-1 text-xs font-bold text-gray-400">
                {{ selectedCategory.level === '대분류' ? '시스템 계층: 대분류' : `시스템 계층: 소분류 (상위: ${selectedCategory.parentName})` }}
              </p>
            </div>

            <div class="space-y-3">
              <label class="block text-[10px] font-bold uppercase text-gray-400">
                카테고리명
                <input
                  type="text"
                  :value="selectedCategory.name"
                  class="mt-1 w-full border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#004D3C]"
                />
              </label>

              <label v-if="selectedCategory.level === '소분류'" class="block text-[10px] font-bold uppercase text-gray-400">
                상위 분류
                <select class="mt-1 w-full border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#004D3C]">
                  <option v-for="cat in categories" :key="cat.id" :selected="cat.id === selectedCategory.parentId">{{ cat.name }}</option>
                </select>
              </label>

              <label class="block text-[10px] font-bold uppercase text-gray-400">
                상태
                <select class="mt-1 w-full border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#004D3C]">
                  <option :selected="selectedCategory.status === '사용중'">사용중</option>
                  <option :selected="selectedCategory.status === '점검중'">점검중</option>
                  <option :selected="selectedCategory.status === '미사용'">미사용</option>
                </select>
              </label>
            </div>

            <div v-if="selectedCategory.level === '대분류'" class="border border-gray-200 bg-gray-50 p-3">
              <p class="text-[10px] font-bold uppercase text-gray-400">소분류 목록</p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <span
                  v-for="child in categories.find(c => c.id === selectedCategory.id)?.children"
                  :key="child.id"
                  class="bg-[#EBF5F5] px-2 py-1 text-[11px] font-black text-[#004D3C]"
                >
                  {{ child.name }}
                </span>
              </div>
            </div>

            <div class="flex gap-2 pt-1">
              <button type="button" class="flex-1 border border-[#004D3C] bg-[#004D3C] py-2 text-xs font-black text-white hover:bg-[#003d30]">저장</button>
              <button type="button" class="flex-1 border border-red-300 bg-red-50 py-2 text-xs font-black text-red-600 hover:bg-red-100">삭제</button>
            </div>
          </div>
        </aside>
      </section>

      <!-- 제품 마스터 -->
      <section v-else class="flex min-h-0 flex-col gap-4 xl:flex-row">
        <div class="flex min-w-0 flex-1 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 bg-gray-50/70 px-4 py-3">
            <h3 class="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-800">
              <PackageIcon :size="14" />
              {{ activeSideMenu }}
            </h3>
          </div>
          <div class="overflow-auto">
            <table class="w-full min-w-[980px] text-xs">
              <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th class="w-24 px-3 py-2 text-center font-black">제품 코드</th>
                  <th class="px-3 py-2 text-left font-black">제품명</th>
                  <th class="w-32 px-3 py-2 text-left font-black">카테고리</th>
                  <th class="w-32 px-3 py-2 text-left font-black">규격/단위</th>
                  <th class="w-28 px-3 py-2 text-right font-black">표준 단가</th>
                  <th class="w-32 px-3 py-2 text-left font-black">메인 거래처</th>
                  <th class="w-24 px-3 py-2 text-center font-black">상태</th>
                  <th class="w-28 px-3 py-2 text-center font-black">등록일</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="prod in productMasterData"
                  :key="prod.id"
                  class="cursor-pointer hover:bg-gray-50"
                  :class="selectedProduct?.id === prod.id ? 'bg-[#E6F2F0]' : ''"
                  @click="selectedProduct = prod"
                >
                  <td class="px-3 py-3 text-center font-bold text-gray-400">{{ prod.id }}</td>
                  <td class="px-3 py-3 font-black text-gray-800">{{ prod.name }}</td>
                  <td class="px-3 py-3 text-gray-600">{{ prod.cat }}</td>
                  <td class="px-3 py-3 font-bold uppercase text-gray-500">{{ prod.spec }} ({{ prod.unit }})</td>
                  <td class="px-3 py-3 text-right font-black text-gray-800">₩{{ prod.price.toLocaleString() }}</td>
                  <td class="px-3 py-3 text-gray-600">{{ prod.vendor }}</td>
                  <td class="px-3 py-3 text-center"><span class="bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">{{ prod.status }}</span></td>
                  <td class="px-3 py-3 text-center font-bold text-gray-400">{{ prod.regDate }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <aside v-if="selectedProduct" class="w-full shrink-0 border border-gray-300 bg-white shadow-sm xl:w-80">
          <div class="flex items-center justify-between bg-[#004D3C] px-4 py-3 text-white">
            <h3 class="inline-flex items-center gap-2 text-[11px] font-black uppercase"><InfoIcon :size="14" /> 제품 상세</h3>
            <button type="button" class="p-1 hover:bg-white/10" @click="closeDetail"><XIcon :size="16" /></button>
          </div>
          <div class="space-y-4 p-4">
            <div>
              <p class="text-[10px] font-bold uppercase text-gray-400">마스터 ID: {{ selectedProduct.id }}</p>
              <h4 class="mt-1 text-base font-black leading-snug text-gray-900">{{ selectedProduct.name }}</h4>
              <div class="mt-2 flex flex-wrap gap-2">
                <span class="border border-gray-200 bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">{{ selectedProduct.cat }}</span>
                <span class="border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{{ selectedProduct.status }}</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="border border-gray-200 bg-gray-50 p-3"><p class="text-[10px] font-bold uppercase text-gray-400">단위</p><p class="mt-1 font-black text-gray-900">{{ selectedProduct.unit }}</p></div>
              <div class="border border-gray-200 bg-gray-50 p-3"><p class="text-[10px] font-bold uppercase text-gray-400">단가</p><p class="mt-1 font-black text-gray-900">₩{{ selectedProduct.price.toLocaleString() }}</p></div>
              <div class="border border-gray-200 bg-gray-50 p-3"><p class="text-[10px] font-bold uppercase text-gray-400">규격</p><p class="mt-1 font-black text-gray-900">{{ selectedProduct.spec }}</p></div>
              <div class="border border-gray-200 bg-gray-50 p-3"><p class="text-[10px] font-bold uppercase text-gray-400">리드타임</p><p class="mt-1 font-black text-gray-900">{{ selectedProduct.leadTime }}</p></div>
            </div>
            <div class="border border-gray-200 bg-gray-50 p-3">
              <p class="text-[10px] font-bold uppercase text-gray-400">메인 계약처</p>
              <div class="mt-2 flex items-center justify-between gap-2 text-xs font-bold text-gray-700">
                <span>{{ selectedProduct.vendor }}</span>
                <span class="bg-[#E6F2F0] px-2 py-1 text-[#004D3C]">메인 계약처</span>
              </div>
              <div class="mt-2 flex justify-between text-xs">
                <span class="text-gray-500">계약가</span>
                <strong class="text-[#004D3C]">₩{{ Math.round(selectedProduct.price * 0.95).toLocaleString() }}</strong>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  </AppLayout>
</template>
