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

const brandColor = '#004D3C'
const brandColorLight = '#E6F2F0'

const activeTopMenu = computed(() => '상품 관리')
const activeSideMenu = ref('카테고리 관리')
const selectedProduct = ref(null)
const selectedCategory = ref(null)

const topMenus = ['대시보드', '재고 관리', '발주 관리', '제품 관리', '인프라 관리', '정산/통계']
const routeMap = {
  대시보드: '/hq/dashboard',
  '재고 관리': '/hq/inventory',
  '발주 관리': '/hq/orders',
  '제품 관리': '/hq/products',
  '인프라 관리': '/hq/infrastructure',
  '정산/통계': '/hq/analytics',
}

const productSideMenus = [
  { label: '카테고리 관리', icon: 'tags', id: 'SO-006' },
  { label: '제품 마스터', icon: 'package', id: 'SO-011' },
  { label: '단가/계약 관리', icon: 'badge', id: 'SO-018' },
  { label: '거래처 정보 관리', icon: 'briefcase', id: 'SO-026' },
]

const productMasterData = [
  { id: 'PD-E001', name: '고속 충전기 (C타입) 25W', spec: '25W / White', cat: '전자제품', unit: 'EA', price: 15000, leadTime: '3일', vendor: '(주)전자에셋', status: '활성', regDate: '2024.01.12' },
  { id: 'PD-E002', name: '무소음 무선 마우스 (블랙)', spec: 'Bluetooth 5.0', cat: '전자제품', unit: 'EA', price: 28000, leadTime: '5일', vendor: '로지잡화', status: '활성', regDate: '2024.01.15' },
  { id: 'PD-S001', name: 'A4 복사용지 80g (500매)', cat: '문구/사무', spec: '80g / White', unit: 'Box', price: 24500, leadTime: '2일', vendor: '(주)한지제지', status: '활성', regDate: '2023.12.20' },
  { id: 'PD-H001', name: '휴대용 가글 (중) 250ml', cat: '위생용품', spec: '250ml / 민트', unit: 'EA', price: 3500, leadTime: '7일', vendor: '클린헬스', status: '비활성', regDate: '2024.02.05' },
  { id: 'PD-K001', name: '유리제 머그컵 350ml', cat: '주방잡화', spec: 'Heat-resistant', unit: 'EA', price: 8900, leadTime: '10일', vendor: '키친웨어', status: '활성', regDate: '2024.03.11' },
  { id: 'PD-S002', name: '리무버블 데코 스티커 세트', cat: '문구/사무', spec: '10 Sheets', unit: 'Set', price: 4200, leadTime: '3일', vendor: '디자인웍스', status: '활성', regDate: '2024.03.15' },
  { id: 'PD-S003', name: '스테이플러 심 (10호)', cat: '문구/사무', spec: '1000pcs', unit: 'Small Box', price: 800, leadTime: '2일', vendor: '(주)한지제지', status: '활성', regDate: '2024.01.10' },
  { id: 'PD-E003', name: '기계식 키보드 (청축)', cat: '전자제품', spec: 'RGB / Wired', unit: 'EA', price: 125000, leadTime: '14일', vendor: '(주)전자에셋', status: '활성', regDate: '2024.04.01' },
  { id: 'PD-H002', name: '손세정제 리필 500ml', cat: '위생용품', spec: '500ml / 레몬', unit: 'EA', price: 5400, leadTime: '3일', vendor: '클린헬스', status: '활성', regDate: '2024.02.10' },
  { id: 'PD-K002', name: '니트릴 고무장갑 (M)', cat: '주방잡화', spec: 'Blue / 100pcs', unit: 'Box', price: 12000, leadTime: '4일', vendor: '키친웨어', status: '점검중', regDate: '2024.02.15' },
  { id: 'PD-S004', name: '수정테이프 5mm x 10m', cat: '문구/사무', spec: '5mm x 10m', unit: 'EA', price: 1200, leadTime: '2일', vendor: '로지잡화', status: '활성', regDate: '2024.01.12' },
  { id: 'PD-E004', name: '절전형 5구 멀티탭 3m', cat: '전자제품', spec: '3m / Safety Cap', unit: 'EA', price: 18500, leadTime: '5일', vendor: '(주)전자에셋', status: '활성', regDate: '2023.11.30' },
]

const categoryData = [
  { id: 'CAT-100', name: '전자제품', productCount: 420, order: 1, status: '사용중', lastUpdated: '2024.04.01' },
  { id: 'CAT-200', name: '문구/사무', productCount: 850, order: 2, status: '사용중', lastUpdated: '2024.04.01' },
  { id: 'CAT-300', name: '위생용품', productCount: 120, order: 3, status: '사용중', lastUpdated: '2024.04.02' },
  { id: 'CAT-400', name: '주방잡화', productCount: 210, order: 4, status: '사용중', lastUpdated: '2024.04.01' },
  { id: 'CAT-500', name: '생활가전', productCount: 95, order: 5, status: '사용중', lastUpdated: '2024.04.10' },
  { id: 'CAT-600', name: '인테리어/가구', productCount: 64, order: 6, status: '점검중', lastUpdated: '2024.04.12' },
  { id: 'CAT-700', name: '취미/레저', productCount: 30, order: 7, status: '미사용', lastUpdated: '2024.04.15' },
  { id: 'CAT-800', name: '공구/산업', productCount: 15, order: 8, status: '사용중', lastUpdated: '2024.04.18' },
]

const handleTopMenuClick = (menu) => {
  const target = routeMap[menu]
  if (target) {
    router.push(target)
  }
}

const closeDetail = () => {
  selectedProduct.value = null
}

const closeCategoryDetail = () => {
  selectedCategory.value = null
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

const BellIcon = IconBase([
  { tag: 'path', attrs: { d: 'M15 17H5a2 2 0 0 1-2-2c2 0 3-1 3-3V9a6 6 0 0 1 12 0v3c0 2 1 3 3 3a2 2 0 0 1-2 2h-4' } },
  { tag: 'path', attrs: { d: 'M10 17a2 2 0 0 0 4 0' } },
])
const SearchIcon = IconBase([
  { tag: 'circle', attrs: { cx: '11', cy: '11', r: '7' } },
  { tag: 'path', attrs: { d: 'm20 20-3.5-3.5' } },
])
const TagsIcon = IconBase([
  { tag: 'path', attrs: { d: 'm20 13-7 7-9-9V4h7Z' } },
  { tag: 'path', attrs: { d: 'M7 7h.01' } },
])
const FolderTreeIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 6h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z' } },
  { tag: 'path', attrs: { d: 'M7 12h10' } },
  { tag: 'path', attrs: { d: 'M7 16h6' } },
])
const ListTreeIcon = IconBase([
  { tag: 'path', attrs: { d: 'M8 6h13' } },
  { tag: 'path', attrs: { d: 'M8 12h13' } },
  { tag: 'path', attrs: { d: 'M8 18h13' } },
  { tag: 'path', attrs: { d: 'M3 6h.01' } },
  { tag: 'path', attrs: { d: 'M3 12h.01' } },
  { tag: 'path', attrs: { d: 'M3 18h.01' } },
])
const PackageIcon = IconBase([
  { tag: 'path', attrs: { d: 'm7.5 4.27 9 5.15' } },
  { tag: 'path', attrs: { d: 'M21 8.5 12 13 3 8.5' } },
  { tag: 'path', attrs: { d: 'M3 8.5V16l9 5 9-5V8.5' } },
  { tag: 'path', attrs: { d: 'M12 13v8' } },
  { tag: 'path', attrs: { d: 'M3.27 7 12 2l8.73 5' } },
])
const FileBadgeIcon = IconBase([
  { tag: 'path', attrs: { d: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z' } },
  { tag: 'path', attrs: { d: 'M14 3v5h5' } },
  { tag: 'circle', attrs: { cx: '10', cy: '14', r: '2.5' } },
  { tag: 'path', attrs: { d: 'm10 16.5-1 2 1-1 1 1-1-2' } },
])
const BriefcaseIcon = IconBase([
  { tag: 'path', attrs: { d: 'M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' } },
  { tag: 'path', attrs: { d: 'M3 9h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z' } },
  { tag: 'path', attrs: { d: 'M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2' } },
])
const InfoIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 10v6' } },
  { tag: 'path', attrs: { d: 'M12 7h.01' } },
])
const FilterIcon = IconBase([
  { tag: 'path', attrs: { d: 'M4 5h16' } },
  { tag: 'path', attrs: { d: 'M7 12h10' } },
  { tag: 'path', attrs: { d: 'M10 19h4' } },
])
const SettingsIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '3' } },
  { tag: 'path', attrs: { d: 'M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 1-3 0 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06A2 2 0 1 1 5.24 17l.06-.06A1.7 1.7 0 0 0 5.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 1 0-3 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87L5.2 8.07A2 2 0 1 1 8.03 5.24l.06.06A1.7 1.7 0 0 0 10 5.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 1 3 0 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06A2 2 0 1 1 19.76 8l-.06.06A1.7 1.7 0 0 0 19.4 10c0 .37.21.73.6 1a1.7 1.7 0 0 1 0 3 1.7 1.7 0 0 0-.6 1Z' } },
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
const ChevronLeftIcon = IconBase([{ tag: 'path', attrs: { d: 'm15 18-6-6 6-6' } }])
const ChevronRightIcon = IconBase([{ tag: 'path', attrs: { d: 'm9 18 6-6-6-6' } }])
const XIcon = IconBase([
  { tag: 'path', attrs: { d: 'M18 6 6 18' } },
  { tag: 'path', attrs: { d: 'm6 6 12 12' } },
])
const Edit3Icon = IconBase([
  { tag: 'path', attrs: { d: 'M12 20h9' } },
  { tag: 'path', attrs: { d: 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z' } },
])
const Trash2Icon = IconBase([
  { tag: 'path', attrs: { d: 'M3 6h18' } },
  { tag: 'path', attrs: { d: 'M8 6V4h8v2' } },
  { tag: 'path', attrs: { d: 'M19 6l-1 14H6L5 6' } },
  { tag: 'path', attrs: { d: 'M10 11v6' } },
  { tag: 'path', attrs: { d: 'M14 11v6' } },
])

const iconMap = {
  tags: TagsIcon,
  package: PackageIcon,
  badge: FileBadgeIcon,
  briefcase: BriefcaseIcon,
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
              :placeholder="activeSideMenu === '카테고리 관리' ? '카테고리 명 또는 코드 검색...' : '제품명, 제품 코드, 거래처명 검색...'"
              class="w-72 border border-gray-300 bg-gray-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#004D3C] focus:bg-white"
            />
          </label>

          <label v-if="activeSideMenu !== '카테고리 관리'" class="flex items-center gap-2 text-[11px] font-black uppercase text-gray-400">
            카테고리
            <select class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white">
              <option>전체 카테고리</option>
              <option>전자제품</option>
              <option>문구/사무</option>
              <option>위생용품</option>
              <option>주방잡화</option>
            </select>
          </label>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button v-if="activeSideMenu !== '카테고리 관리'" type="button" class="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
            <DownloadIcon :size="14" />
            일괄 업로드 (CSV)
          </button>
          <button type="button" class="inline-flex items-center gap-1.5 border border-[#004D3C] bg-[#004D3C] px-3 py-2 text-xs font-black text-white hover:bg-[#003d30]">
            <PlusCircleIcon :size="14" />
            {{ activeSideMenu === '카테고리 관리' ? '카테고리 추가 (SO-006)' : '신규 제품 등록 (SO-011)' }}
          </button>
        </div>
      </section>

      <section v-if="activeSideMenu === '카테고리 관리'" class="flex min-h-0 flex-col gap-4 xl:flex-row">
        <div class="flex min-w-0 flex-1 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 bg-gray-50/70 px-4 py-3">
            <h3 class="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-800">
              <TagsIcon :size="14" />
              카테고리 마스터
            </h3>
            <span class="text-[10px] font-bold text-gray-400">총 {{ categoryData.length }}개</span>
          </div>
          <div class="overflow-auto">
            <table class="w-full min-w-[760px] text-xs">
              <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th class="w-28 px-3 py-2 text-center font-black">분류 코드</th>
                  <th class="px-3 py-2 text-left font-black">카테고리명</th>
                  <th class="w-28 px-3 py-2 text-right font-black">연결 제품수</th>
                  <th class="w-24 px-3 py-2 text-center font-black">노출 순서</th>
                  <th class="w-24 px-3 py-2 text-center font-black">상태</th>
                  <th class="w-32 px-3 py-2 text-center font-black">최종 수정일</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="cat in categoryData" :key="cat.id" class="cursor-pointer hover:bg-gray-50" :class="selectedCategory?.id === cat.id ? 'bg-[#E6F2F0]' : ''" @click="selectedCategory = cat">
                  <td class="px-3 py-3 text-center font-bold text-gray-400">{{ cat.id }}</td>
                  <td class="px-3 py-3 font-black text-gray-800">{{ cat.name }}</td>
                  <td class="px-3 py-3 text-right font-black text-[#004D3C]">{{ cat.productCount.toLocaleString() }}</td>
                  <td class="px-3 py-3 text-center text-gray-600">{{ cat.order }}</td>
                  <td class="px-3 py-3 text-center"><span class="bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">{{ cat.status }}</span></td>
                  <td class="px-3 py-3 text-center font-bold text-gray-400">{{ cat.lastUpdated }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <aside v-if="selectedCategory" class="w-full shrink-0 border border-gray-300 bg-white shadow-sm xl:w-80">
          <div class="flex items-center justify-between bg-[#004D3C] px-4 py-3 text-white">
            <h3 class="inline-flex items-center gap-2 text-[11px] font-black uppercase"><InfoIcon :size="14" /> 카테고리 상세</h3>
            <button type="button" class="p-1 hover:bg-white/10" @click="closeCategoryDetail"><XIcon :size="16" /></button>
          </div>
          <div class="space-y-4 p-4">
            <div>
              <p class="text-[10px] font-bold uppercase text-gray-400">마스터 코드: {{ selectedCategory.id }}</p>
              <h4 class="mt-1 text-lg font-black text-gray-900">{{ selectedCategory.name }}</h4>
              <p class="mt-1 text-xs font-bold text-gray-400">시스템 계층: 대분류 (단일 체계)</p>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <label class="col-span-2 text-[10px] font-bold uppercase text-gray-400">카테고리명<input type="text" :value="selectedCategory.name" class="mt-1 w-full border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#004D3C]" /></label>
              <label class="text-[10px] font-bold uppercase text-gray-400">노출 순서<input type="number" :value="selectedCategory.order" class="mt-1 w-full border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#004D3C]" /></label>
              <label class="text-[10px] font-bold uppercase text-gray-400">상태<select class="mt-1 w-full border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#004D3C]"><option>{{ selectedCategory.status }}</option><option>사용중</option><option>점검중</option><option>미사용</option></select></label>
            </div>
            <div class="border border-gray-200 bg-gray-50 p-3">
              <p class="text-[10px] font-bold uppercase text-gray-400">연결 제품수</p>
              <strong class="mt-1 block text-xl font-black text-[#004D3C]">{{ selectedCategory.productCount }} SKU</strong>
            </div>
          </div>
        </aside>
      </section>

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
                  <th class="w-24 px-3 py-2 text-left font-black">카테고리</th>
                  <th class="w-32 px-3 py-2 text-left font-black">규격/단위</th>
                  <th class="w-28 px-3 py-2 text-right font-black">표준 단가</th>
                  <th class="w-32 px-3 py-2 text-left font-black">메인 거래처</th>
                  <th class="w-24 px-3 py-2 text-center font-black">상태</th>
                  <th class="w-28 px-3 py-2 text-center font-black">등록일</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="prod in productMasterData" :key="prod.id" class="cursor-pointer hover:bg-gray-50" :class="selectedProduct?.id === prod.id ? 'bg-[#E6F2F0]' : ''" @click="selectedProduct = prod">
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
              <div class="mt-2 flex items-center justify-between gap-2 text-xs font-bold text-gray-700"><span>{{ selectedProduct.vendor }}</span><span class="bg-[#E6F2F0] px-2 py-1 text-[#004D3C]">메인 계약처</span></div>
              <div class="mt-2 flex justify-between text-xs"><span class="text-gray-500">계약가</span><strong class="text-[#004D3C]">₩{{ Math.round(selectedProduct.price * 0.95).toLocaleString() }}</strong></div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  </AppLayout>
</template>
