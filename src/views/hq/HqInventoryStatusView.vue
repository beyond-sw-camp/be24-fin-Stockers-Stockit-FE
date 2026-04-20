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
const activeSideMenu = ref('전사 재고 집계')
const selectedItem = ref(null)
const searchTerm = ref('')

const topMenus = ['대시보드', '재고 관리', '발주 관리', '제품 관리', '인프라 관리', '정산/통계']
const routeMap = {
  대시보드: '/hq/dashboard',
  '재고 관리': '/hq/inventory',
  '발주 관리': '/hq/orders',
  '제품 관리': '/hq/products',
  '인프라 관리': '/hq/infrastructure',
  '정산/통계': '/hq/analytics',
}

const activeTopMenu = computed(() => '재고 관리')

const sideMenus = [
  { label: '전사 재고 집계', icon: 'layout' },
  { label: '창고별 재고 현황', icon: 'warehouse' },
  { label: '매장별 재고 현황', icon: 'store' },
  { label: '재고 실사 내역', icon: 'check' },
  { label: '재고 변동 이력', icon: 'history' },
]

const inventoryData = [
  { id: 'ITM-E001', name: '고속 충전기 (C타입) 25W', cat: '전자제품', loc: '인천 제1센터', current: 1240, safety: 500, avail: 1200, status: '정상', updated: '2024.04.16 17:20' },
  { id: 'ITM-H002', name: '휴대용 가글 (중) 250ml', cat: '위생용품', loc: '성수 직영점', current: 12, safety: 50, avail: 10, status: '부족', updated: '2024.04.16 16:45' },
  { id: 'ITM-K003', name: '유리제 머그컵 350ml', cat: '주방잡화', loc: '강남 서초점', current: 85, safety: 100, avail: 80, status: '임박', updated: '2024.04.16 15:30' },
  { id: 'ITM-E004', name: '무소음 무선 마우스 (블랙)', cat: '전자제품', loc: '인천 제2센터', current: 0, safety: 100, avail: 0, status: '품절', updated: '2024.04.16 14:10' },
  { id: 'ITM-S005', name: 'A4 복사용지 80g (500매)', cat: '문구/사무', loc: '판교 테크노점', current: 1200, safety: 400, avail: 1150, status: '정상', updated: '2024.04.16 13:55' },
  { id: 'ITM-S006', name: '리무버블 데코 스티커 셋트', cat: '문구/사무', loc: '용인 물류센터', current: 310, safety: 300, avail: 305, status: '임박', updated: '2024.04.16 12:20' },
  { id: 'ITM-S007', name: '스테이플러 심 (10호)', cat: '문구/사무', loc: '성수 직영점', current: 5, safety: 40, avail: 5, status: '부족', updated: '2024.04.16 11:45' },
  { id: 'ITM-E008', name: '대용량 보조배터리 20000mAh', cat: '전자제품', loc: '인천 제1센터', current: 240, safety: 100, avail: 235, status: '정상', updated: '2024.04.16 10:30' },
  { id: 'ITM-E009', name: '기계식 키보드 (청축)', cat: '전자제품', loc: '인천 제1센터', current: 45, safety: 50, avail: 42, status: '임박', updated: '2024.04.16 09:15' },
  { id: 'ITM-H010', name: '손세정제 리필 500ml', cat: '위생용품', loc: '강남 서초점', current: 320, safety: 100, avail: 310, status: '정상', updated: '2024.04.16 08:40' },
  { id: 'ITM-K011', name: '니트릴 고무장갑 (M/100입)', cat: '주방잡화', loc: '인천 제2센터', current: 15, safety: 80, avail: 12, status: '부족', updated: '2024.04.15 17:50' },
  { id: 'ITM-S012', name: '수정테이프 5mm x 10m', cat: '문구/사무', loc: '성수 직영점', current: 450, safety: 100, avail: 440, status: '정상', updated: '2024.04.15 16:30' },
  { id: 'ITM-S013', name: '3색 형광펜 세트', cat: '문구/사무', loc: '판교 테크노점', current: 8, safety: 30, avail: 8, status: '부족', updated: '2024.04.15 15:20' },
  { id: 'ITM-S014', name: '사무용 가위 (대)', cat: '문구/사무', loc: '용인 물류센터', current: 0, safety: 20, avail: 0, status: '품절', updated: '2024.04.15 14:10' },
  { id: 'ITM-E015', name: '절전형 5구 멀티탭 3m', cat: '전자제품', loc: '인천 제1센터', current: 85, safety: 50, avail: 80, status: '정상', updated: '2024.04.15 13:00' },
  { id: 'ITM-E016', name: 'HDMI 2.1 케이블 1.5m', cat: '전자제품', loc: '인천 제2센터', current: 210, safety: 100, avail: 205, status: '정상', updated: '2024.04.15 12:15' },
  { id: 'ITM-S017', name: '점착식 메모지 (노랑)', cat: '문구/사무', loc: '성수 직영점', current: 1500, safety: 500, avail: 1480, status: '정상', updated: '2024.04.15 11:40' },
  { id: 'ITM-H018', name: 'KF94 마스크 (50매입)', cat: '위생용품', loc: '용인 물류센터', current: 42, safety: 100, avail: 40, status: '부족', updated: '2024.04.15 10:20' },
  { id: 'ITM-K019', name: '주방세제 3L (대용량)', cat: '주방잡화', loc: '인천 제1센터', current: 120, safety: 50, avail: 110, status: '정상', updated: '2024.04.15 09:10' },
  { id: 'ITM-K020', name: '다목적 수세미 (5입)', cat: '주방잡화', loc: '강남 서초점', current: 35, safety: 40, avail: 30, status: '임박', updated: '2024.04.14 17:55' },
  { id: 'ITM-S021', name: '메쉬 연필꽂이 (실버)', cat: '문구/사무', loc: '판교 테크노점', current: 12, safety: 20, avail: 12, status: '임박', updated: '2024.04.14 16:40' },
  { id: 'ITM-S022', name: 'L자 파일 홀더 (100매)', cat: '문구/사무', loc: '성수 직영점', current: 800, safety: 200, avail: 780, status: '정상', updated: '2024.04.14 15:30' },
  { id: 'ITM-E023', name: '무선 이어폰 노이즈캔슬링', cat: '전자제품', loc: '인천 제1센터', current: 55, safety: 30, avail: 50, status: '정상', updated: '2024.04.14 14:15' },
  { id: 'ITM-S024', name: '가죽 데스크 패드 (브라운)', cat: '문구/사무', loc: '판교 테크노점', current: 4, safety: 10, avail: 4, status: '부족', updated: '2024.04.14 13:05' },
  { id: 'ITM-H025', name: '탁상용 미니 가습기', cat: '위생용품', loc: '인천 제2센터', current: 0, safety: 15, avail: 0, status: '품절', updated: '2024.04.14 12:50' },
  { id: 'ITM-H026', name: '퍼퓸 핸드크림 50ml', cat: '위생용품', loc: '성수 직영점', current: 88, safety: 100, avail: 85, status: '임박', updated: '2024.04.14 11:20' },
  { id: 'ITM-K027', name: '종이컵 6.5온스 (1000입)', cat: '주방잡화', loc: '용인 물류센터', current: 4500, safety: 1000, avail: 4450, status: '정상', updated: '2024.04.14 10:10' },
  { id: 'ITM-S028', name: '투명 박스 테이프 50mm', cat: '문구/사무', loc: '인천 제1센터', current: 120, safety: 50, avail: 115, status: '정상', updated: '2024.04.13 17:40' },
  { id: 'ITM-S029', name: '사무용 커터칼 (중)', cat: '문구/사무', loc: '강남 서초점', current: 22, safety: 30, avail: 20, status: '임박', updated: '2024.04.13 16:30' },
  { id: 'ITM-S030', name: '철제 30cm 자', cat: '문구/사무', loc: '성수 직영점', current: 0, safety: 10, avail: 0, status: '품절', updated: '2024.04.13 15:20' },
  { id: 'ITM-E031', name: '알루미늄 노트북 스탠드', cat: '전자제품', loc: '인천 제2센터', current: 140, safety: 50, avail: 135, status: '정상', updated: '2024.04.13 14:10' },
  { id: 'ITM-E032', name: 'FHD 웹캠 (마이크내장)', cat: '전자제품', loc: '판교 테크노점', current: 18, safety: 20, avail: 18, status: '임박', updated: '2024.04.13 13:00' },
  { id: 'ITM-E033', name: 'USB-C to 3.5mm 젠더', cat: '전자제품', loc: '인천 제1센터', current: 5, safety: 30, avail: 5, status: '부족', updated: '2024.04.13 12:45' },
  { id: 'ITM-S034', name: '더블클립 (중/20입)', cat: '문구/사무', loc: '용인 물류센터', current: 650, safety: 100, avail: 640, status: '정상', updated: '2024.04.13 11:30' },
  { id: 'ITM-S035', name: '투명 화일 (A4)', cat: '문구/사무', loc: '강남 서초점', current: 2400, safety: 500, avail: 2380, status: '정상', updated: '2024.04.13 10:15' },
]

const miniStats = [
  { label: '총 보유 품목 수', value: '1,420 SKU' },
  { label: '안전 재고 미만 품목', value: '38 건', tone: 'danger' },
  { label: '금일 입고 예정', value: '22 건' },
  { label: '금일 출고 예정', value: '54 건' },
]

const filteredInventory = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  if (!keyword) {
    return inventoryData
  }

  return inventoryData.filter((item) => {
    const target = [item.id, item.name, item.cat, item.loc].join(' ').toLowerCase()
    return target.includes(keyword)
  })
})

const handleTopMenuClick = (menu) => {
  const target = routeMap[menu]

  if (target) {
    router.push(target)
  }
}

const selectItem = (row) => {
  selectedItem.value = row
}

const clearSelectedItem = () => {
  selectedItem.value = null
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

const LayoutDashboardIcon = IconBase([
  { tag: 'rect', attrs: { x: '3', y: '3', width: '7', height: '7' } },
  { tag: 'rect', attrs: { x: '14', y: '3', width: '7', height: '5' } },
  { tag: 'rect', attrs: { x: '14', y: '12', width: '7', height: '9' } },
  { tag: 'rect', attrs: { x: '3', y: '14', width: '7', height: '7' } },
])

const WarehouseIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 10.5 12 4l9 6.5' } },
  { tag: 'path', attrs: { d: 'M5 9.5V20h14V9.5' } },
  { tag: 'path', attrs: { d: 'M10 20v-5h4v5' } },
])

const StoreIcon = IconBase([
  { tag: 'path', attrs: { d: 'M4 10h16' } },
  { tag: 'path', attrs: { d: 'M5 10V6l2-2h10l2 2v4' } },
  { tag: 'path', attrs: { d: 'M6 10v10h12V10' } },
  { tag: 'path', attrs: { d: 'M10 20v-5h4v5' } },
])

const CheckCircle2Icon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'm9 12 2 2 4-4' } },
])

const HistoryIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 12a9 9 0 1 0 3-6.7' } },
  { tag: 'path', attrs: { d: 'M3 4v5h5' } },
  { tag: 'path', attrs: { d: 'M12 7v5l3 2' } },
])

const BellIcon = IconBase([
  { tag: 'path', attrs: { d: 'M15 17H5a2 2 0 0 1-2-2c2 0 3-1 3-3V9a6 6 0 0 1 12 0v3c0 2 1 3 3 3a2 2 0 0 1-2 2h-4' } },
  { tag: 'path', attrs: { d: 'M10 17a2 2 0 0 0 4 0' } },
])

const SearchIcon = IconBase([
  { tag: 'circle', attrs: { cx: '11', cy: '11', r: '7' } },
  { tag: 'path', attrs: { d: 'm20 20-3.5-3.5' } },
])

const ChevronDownIcon = IconBase([
  { tag: 'path', attrs: { d: 'm6 9 6 6 6-6' } },
])

const DownloadIcon = IconBase([
  { tag: 'path', attrs: { d: 'M12 3v12' } },
  { tag: 'path', attrs: { d: 'm7 10 5 5 5-5' } },
  { tag: 'path', attrs: { d: 'M5 21h14' } },
])

const ChevronLeftIcon = IconBase([
  { tag: 'path', attrs: { d: 'm15 18-6-6 6-6' } },
])

const ChevronRightIcon = IconBase([
  { tag: 'path', attrs: { d: 'm9 18 6-6-6-6' } },
])

const InfoIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 10v6' } },
  { tag: 'path', attrs: { d: 'M12 7h.01' } },
])

const XIcon = IconBase([
  { tag: 'path', attrs: { d: 'M18 6 6 18' } },
  { tag: 'path', attrs: { d: 'm6 6 12 12' } },
])

const ExternalLinkIcon = IconBase([
  { tag: 'path', attrs: { d: 'M14 5h5v5' } },
  { tag: 'path', attrs: { d: 'M10 14 19 5' } },
  { tag: 'path', attrs: { d: 'M19 14v5H5V5h5' } },
])

const PlusCircleIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 8v8' } },
  { tag: 'path', attrs: { d: 'M8 12h8' } },
])

const iconMap = {
  layout: LayoutDashboardIcon,
  warehouse: WarehouseIcon,
  store: StoreIcon,
  check: CheckCircle2Icon,
  history: HistoryIcon,
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
    <div class="flex flex-col gap-4 overflow-hidden">
      <section class="flex flex-wrap items-center justify-between gap-4 border border-gray-300 bg-white p-3 shadow-sm">
        <div class="flex flex-wrap items-center gap-4">
          <label class="flex items-center gap-2">
            <span class="text-[11px] font-black uppercase text-gray-400">거점</span>
            <select class="min-w-32 appearance-none border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white">
              <option>전체 거점</option>
              <option>인천 제1센터</option>
              <option>인천 제2센터</option>
              <option>용인 물류센터</option>
              <option>매장 통합</option>
            </select>
          </label>

          <label class="flex items-center gap-2">
            <span class="text-[11px] font-black uppercase text-gray-400">카테고리</span>
            <select class="min-w-32 appearance-none border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white">
              <option>전체 품목</option>
              <option>전자제품</option>
              <option>위생용품</option>
              <option>주방잡화</option>
              <option>문구/사무</option>
            </select>
          </label>

          <label class="flex items-center gap-2">
            <span class="text-[11px] font-black uppercase text-gray-400">상태</span>
            <select class="min-w-32 appearance-none border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white">
              <option>전체 상태</option>
              <option>정상 재고</option>
              <option>재고 부족</option>
              <option>안전 임박</option>
              <option>품절 상태</option>
            </select>
          </label>

          <div class="hidden h-6 w-px bg-gray-200 md:block" />

          <label class="relative block">
            <SearchIcon :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              v-model="searchTerm"
              type="text"
              placeholder="품목 코드 또는 품목명 검색..."
              class="w-64 border border-gray-300 bg-gray-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#004D3C] focus:bg-white"
            />
          </label>
        </div>

        <button type="button" class="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
          <DownloadIcon :size="14" />
          Excel 추출
        </button>
      </section>

      <section class="flex min-h-0 flex-col gap-4 xl:flex-row">
        <div class="flex min-w-0 flex-1 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/70 px-3 py-2.5">
            <div class="flex flex-wrap items-center gap-5">
              <div v-for="stat in miniStats" :key="stat.label" class="flex items-center gap-2">
                <span class="text-[10px] font-bold uppercase text-gray-400">{{ stat.label }}</span>
                <span class="text-xs font-black" :class="stat.tone === 'danger' ? 'text-red-600' : 'text-gray-800'">
                  {{ stat.value }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2 text-[10px] font-bold text-gray-400">
              <span>총 {{ filteredInventory.length }}개 품목 조회됨</span>
              <button type="button" class="underline hover:text-[#004D3C]">새로고침</button>
            </div>
          </div>

          <div class="overflow-auto">
            <table class="w-full min-w-[1040px] table-fixed border-collapse text-xs">
              <thead class="sticky top-0 z-10 bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th class="w-24 px-3 py-2 text-center font-black">품목 코드</th>
                  <th class="px-3 py-2 text-left font-black">품목명</th>
                  <th class="w-24 px-3 py-2 text-left font-black">카테고리</th>
                  <th class="w-32 px-3 py-2 text-left font-black">현재 위치</th>
                  <th class="w-24 px-3 py-2 text-right font-black">현재고</th>
                  <th class="w-24 px-3 py-2 text-right font-black">안전재고</th>
                  <th class="w-24 px-3 py-2 text-right font-black">가용재고</th>
                  <th class="w-24 px-3 py-2 text-center font-black">상태</th>
                  <th class="w-36 px-3 py-2 text-left font-black">최종 업데이트</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="row in filteredInventory"
                  :key="row.id"
                  class="cursor-pointer transition-colors hover:bg-blue-50/70"
                  :class="selectedItem?.id === row.id ? 'bg-[#E6F2F0]' : ''"
                  @click="selectItem(row)"
                >
                  <td class="px-3 py-2.5 text-center font-bold text-gray-400">{{ row.id }}</td>
                  <td class="truncate px-3 py-2.5 font-black text-gray-800">{{ row.name }}</td>
                  <td class="px-3 py-2.5 text-gray-500">{{ row.cat }}</td>
                  <td class="px-3 py-2.5 font-bold text-gray-600">{{ row.loc }}</td>
                  <td class="px-3 py-2.5 text-right font-black" :class="row.current === 0 ? 'text-gray-300' : 'text-gray-900'">
                    {{ row.current.toLocaleString() }}
                  </td>
                  <td class="px-3 py-2.5 text-right text-gray-400">{{ row.safety.toLocaleString() }}</td>
                  <td class="px-3 py-2.5 text-right font-black text-[#004D3C]">{{ row.avail.toLocaleString() }}</td>
                  <td class="px-3 py-2.5 text-center">
                    <span
                      class="inline-flex items-center gap-1.5 text-[10px] font-black"
                      :class="{
                        'text-emerald-700': row.status === '정상',
                        'text-red-700': row.status === '부족',
                        'text-amber-700': row.status === '임박',
                        'text-gray-600': row.status === '품절',
                      }"
                    >
                      <i
                        class="h-1.5 w-1.5"
                        :class="{
                          'bg-emerald-500': row.status === '정상',
                          'bg-red-500': row.status === '부족',
                          'bg-amber-500': row.status === '임박',
                          'bg-gray-400': row.status === '품절',
                        }"
                      />
                      {{ row.status }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5 font-bold text-gray-400">{{ row.updated }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-300 bg-gray-50 px-3 py-2 text-[11px] font-bold text-gray-500">
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-1.5">
                <span>표시 행 수:</span>
                <select class="border border-gray-300 bg-white px-2 py-1">
                  <option>30</option>
                  <option>50</option>
                  <option>100</option>
                </select>
              </label>
              <span>1 - {{ filteredInventory.length }} of 1,420 entries</span>
            </div>

            <div class="flex items-center gap-1">
              <button type="button" class="flex h-6 min-w-6 items-center justify-center border border-gray-300 bg-white px-1.5 text-gray-600">
                <ChevronLeftIcon :size="14" />
              </button>
              <button
                v-for="page in [1, 2, 3, '...', 48]"
                :key="page"
                type="button"
                class="flex h-6 min-w-6 items-center justify-center border border-gray-300 px-2"
                :class="page === 1 ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
              >
                {{ page }}
              </button>
              <button type="button" class="flex h-6 min-w-6 items-center justify-center border border-gray-300 bg-white px-1.5 text-gray-600">
                <ChevronRightIcon :size="14" />
              </button>
            </div>
          </div>
        </div>

        <aside v-if="selectedItem" class="flex w-full shrink-0 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm xl:w-80">
          <div class="flex items-center justify-between bg-[#004D3C] px-4 py-3 text-white">
            <h3 class="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider">
              <InfoIcon :size="14" />
              품목 상세 정보
            </h3>
            <button type="button" class="p-1 text-white hover:bg-white/10" @click="clearSelectedItem">
              <XIcon :size="16" />
            </button>
          </div>

          <div class="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
            <section class="space-y-2">
              <p class="text-[10px] font-bold uppercase text-gray-400">공산품 마스터 데이터</p>
              <p class="text-sm font-black leading-snug text-gray-900">{{ selectedItem.name }}</p>
              <div class="flex flex-wrap gap-2">
                <span class="border border-gray-200 bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">{{ selectedItem.id }}</span>
                <span class="border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">{{ selectedItem.cat }}</span>
              </div>
            </section>

            <section class="grid grid-cols-2 gap-2">
              <div class="border border-gray-200 bg-gray-50 p-3">
                <p class="text-[9px] font-bold uppercase text-gray-400">현재고</p>
                <strong class="mt-1 block text-sm font-black text-gray-900">{{ selectedItem.current }} EA</strong>
              </div>
              <div class="border border-gray-200 bg-gray-50 p-3">
                <p class="text-[9px] font-bold uppercase text-gray-400">안전재고</p>
                <strong class="mt-1 block text-sm font-black text-gray-900">{{ selectedItem.safety }} EA</strong>
              </div>
            </section>

            <section class="space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-gray-600">
                <span>가용재고 (즉시 출고)</span>
                <strong class="text-[#004D3C]">{{ selectedItem.avail }} EA</strong>
              </div>
              <div class="h-2 w-full bg-gray-200">
                <div
                  class="h-full"
                  :class="{
                    'bg-[#004D3C]': selectedItem.status === '정상',
                    'bg-red-600': selectedItem.status === '부족' || selectedItem.status === '품절',
                    'bg-amber-500': selectedItem.status === '임박',
                  }"
                  :style="{ width: `${Math.min((selectedItem.current / selectedItem.safety) * 100, 100)}%` }"
                />
              </div>
              <div class="flex justify-between text-[9px] font-bold text-gray-400">
                <span>0%</span>
                <span>목표 대비: {{ Math.round((selectedItem.current / selectedItem.safety) * 100) }}%</span>
                <span>100%</span>
              </div>
            </section>

            <section class="space-y-2 border-t border-gray-100 pt-4">
              <p class="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-400">
                <HistoryIcon :size="12" />
                재고 레벨 변화 (7D)
              </p>
              <div class="flex h-20 items-end gap-1 border border-gray-100 bg-gray-50 p-2">
                <div v-for="(height, index) in [30, 45, 40, 60, 55, 50, 42]" :key="index" class="relative h-full flex-1 bg-gray-200">
                  <div class="absolute bottom-0 w-full" :class="index === 6 ? 'bg-[#004D3C]' : 'bg-gray-400'" :style="{ height: `${height}%` }" />
                </div>
              </div>
              <div class="flex justify-between text-[8px] font-bold text-gray-400">
                <span>04/10</span>
                <span>오늘</span>
              </div>
            </section>

            <section class="space-y-2">
              <p class="text-[10px] font-bold uppercase text-gray-400">거점별 세부 수량</p>
              <div class="divide-y divide-gray-100">
                <div class="flex justify-between py-2 text-xs font-bold text-gray-600">
                  <span>인천 제1센터 (중앙)</span>
                  <strong class="text-gray-900">{{ Math.floor(selectedItem.current * 0.7).toLocaleString() }}</strong>
                </div>
                <div class="flex justify-between py-2 text-xs font-bold text-gray-600">
                  <span>성수 직영점</span>
                  <strong class="text-gray-900">{{ Math.floor(selectedItem.current * 0.2).toLocaleString() }}</strong>
                </div>
                <div class="flex justify-between py-2 text-xs font-bold text-gray-600">
                  <span>기타 보관소</span>
                  <strong class="text-gray-900">{{ Math.floor(selectedItem.current * 0.1).toLocaleString() }}</strong>
                </div>
              </div>
            </section>
          </div>

          <div class="flex flex-col gap-2 bg-white px-4 pb-4">
            <button type="button" class="inline-flex w-full items-center justify-center gap-2 border border-[#004D3C] bg-[#004D3C] px-3 py-2.5 text-[11px] font-black uppercase text-white">
              <ExternalLinkIcon :size="14" />
              품목 상세 수불부 조회
            </button>
            <button type="button" class="inline-flex w-full items-center justify-center gap-2 border border-gray-300 bg-white px-3 py-2.5 text-[11px] font-black uppercase text-gray-700 hover:bg-gray-50">
              <PlusCircleIcon :size="14" />
              수동 재고 조정
            </button>
          </div>
        </aside>
      </section>
    </div>
  </AppLayout>
</template>
