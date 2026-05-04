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
const activeSideMenu = ref('매장 주문')
const selectedOrder = ref(null)
const checkedOrders = ref([])
const activeStatusTab = ref('승인 대기')

const topMenus = [
  '대시보드',
  '재고 관리',
  '주문/발주 관리',
  '제품 관리',
  '인프라 관리',
  '정산/통계',
]
const routeMap = {
  대시보드: '/hq/dashboard',
  '재고 관리': '/hq/inventory/company-wide',
  '주문/발주 관리': '/hq/orders',
  '제품 관리': '/hq/products',
  '인프라 관리': '/hq/infrastructure',
  '정산/통계': '/hq/analytics',
}

const activeTopMenu = computed(() => '주문/발주 관리')

const sideMenus = [
  { label: '매장 주문', icon: 'file', path: '/hq/orders' },
  { label: '거래처 발주', icon: 'truck', path: '/hq/purchase-orders' },
  { label: '거래처 관리', icon: 'briefcase', path: '/hq/vendors' },
]

const statusTabs = [
  { label: '전체', count: 142 },
  { label: '승인 대기', count: 18, highlight: true },
  { label: '승인 완료', count: 45 },
  { label: '출고 중', count: 24 },
  { label: '배송 완료', count: 55 },
  { label: '반려/취소', count: 0 },
]

const orderData = [
  {
    id: 'ORD-20240416-01',
    store: '강남 서초점',
    items: '고속 충전기 (C타입) 외 3건',
    totalQty: 450,
    amount: '₩4,500,000',
    reqDate: '2024.04.16 17:20',
    wishDate: '2024.04.18',
    status: '승인 대기',
    manager: '박범수',
    isAnomaly: true,
  },
  {
    id: 'ORD-20240416-02',
    store: '성수 직영점',
    items: '무소음 무선 마우스 외 1건',
    totalQty: 12,
    amount: '₩320,000',
    reqDate: '2024.04.16 16:45',
    wishDate: '2024.04.17',
    status: '승인 대기',
    manager: '김사라',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240416-03',
    store: '판교 테크노점',
    items: 'A4 복사용지 80g (500매) 외 5건',
    totalQty: 800,
    amount: '₩8,200,000',
    reqDate: '2024.04.16 15:30',
    wishDate: '2024.04.19',
    status: '승인 대기',
    manager: '이후경',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240416-04',
    store: '인천 제1센터',
    items: '휴대용 가글 (중) 외 2건',
    totalQty: 1500,
    amount: '₩12,450,000',
    reqDate: '2024.04.16 14:10',
    wishDate: '2024.04.20',
    status: '승인 완료',
    manager: '박범수',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240416-05',
    store: '여의도 IFC점',
    items: '유리제 머그컵 350ml 외 1건',
    totalQty: 50,
    amount: '₩650,000',
    reqDate: '2024.04.16 13:55',
    wishDate: '2024.04.17',
    status: '출고 중',
    manager: '김사라',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240416-06',
    store: '강남 서초점',
    items: '리무버블 스티커 외 10건',
    totalQty: 240,
    amount: '₩1,120,000',
    reqDate: '2024.04.16 12:20',
    wishDate: '2024.04.18',
    status: '승인 대기',
    manager: '박범수',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240416-07',
    store: '부산 중앙점',
    items: '대용량 보조배터리 외 1건',
    totalQty: 100,
    amount: '₩5,800,000',
    reqDate: '2024.04.16 11:45',
    wishDate: '2024.04.22',
    status: '배송 완료',
    manager: '이선엽',
    isAnomaly: true,
  },
  {
    id: 'ORD-20240416-08',
    store: '성수 직영점',
    items: '기계식 키보드 외 2건',
    totalQty: 20,
    amount: '₩2,400,000',
    reqDate: '2024.04.16 10:30',
    wishDate: '2024.04.18',
    status: '승인 대기',
    manager: '김사라',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240415-42',
    store: '인천 제2센터',
    items: '절전형 5구 멀티탭 외 4건',
    totalQty: 120,
    amount: '₩1,850,000',
    reqDate: '2024.04.15 17:50',
    wishDate: '2024.04.17',
    status: '승인 완료',
    manager: '이후경',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240415-41',
    store: '판교 테크노점',
    items: 'HDMI 2.1 케이블 외 1건',
    totalQty: 45,
    amount: '₩540,000',
    reqDate: '2024.04.15 16:30',
    wishDate: '2024.04.16',
    status: '배송 완료',
    manager: '이선엽',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240415-40',
    store: '용인 물류센터',
    items: '점착식 메모지 외 20건',
    totalQty: 5000,
    amount: '₩3,500,000',
    reqDate: '2024.04.15 15:20',
    wishDate: '2024.04.25',
    status: '승인 대기',
    manager: '박범수',
    isAnomaly: true,
  },
  {
    id: 'ORD-20240415-39',
    store: '강남 서초점',
    items: 'KF94 마스크 외 2건',
    totalQty: 300,
    amount: '₩450,000',
    reqDate: '2024.04.15 14:10',
    wishDate: '2024.04.17',
    status: '반려',
    manager: '이선엽',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240415-38',
    store: '성수 직영점',
    items: '탁상용 미니 가습기 외 1건',
    totalQty: 15,
    amount: '₩420,000',
    reqDate: '2024.04.15 13:00',
    wishDate: '2024.04.17',
    status: '승인 대기',
    manager: '김사라',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240415-37',
    store: '여의도 IFC점',
    items: '종이컵 6.5온스 외 2건',
    totalQty: 2000,
    amount: '₩1,200,000',
    reqDate: '2024.04.15 12:15',
    wishDate: '2024.04.17',
    status: '승인 완료',
    manager: '박범수',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240415-36',
    store: '부산 중앙점',
    items: '무선 이어폰 외 1건',
    totalQty: 30,
    amount: '₩4,500,000',
    reqDate: '2024.04.15 11:40',
    wishDate: '2024.04.20',
    status: '배송 완료',
    manager: '김사라',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240415-35',
    store: '판교 테크노점',
    items: '사무용 커터칼 외 5건',
    totalQty: 55,
    amount: '₩150,000',
    reqDate: '2024.04.15 10:20',
    wishDate: '2024.04.16',
    status: '승인 대기',
    manager: '이후경',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240414-92',
    store: '강남 서초점',
    items: '알루미늄 노트북 스탠드 외 1건',
    totalQty: 25,
    amount: '₩1,250,000',
    reqDate: '2024.04.14 17:55',
    wishDate: '2024.04.16',
    status: '승인 완료',
    manager: '김사라',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240414-91',
    store: '인천 제1센터',
    items: '투명 박스 테이프 외 10건',
    totalQty: 400,
    amount: '₩880,000',
    reqDate: '2024.04.14 16:40',
    wishDate: '2024.04.17',
    status: '출고 중',
    manager: '박범수',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240414-90',
    store: '성수 직영점',
    items: 'FHD 웹캠 외 2건',
    totalQty: 8,
    amount: '₩1,200,000',
    reqDate: '2024.04.14 15:30',
    wishDate: '2024.04.16',
    status: '배송 완료',
    manager: '이후경',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240414-89',
    store: '용인 물류센터',
    items: 'USB-C to 3.5mm 젠더 외 1건',
    totalQty: 100,
    amount: '₩1,200,000',
    reqDate: '2024.04.14 14:15',
    wishDate: '2024.04.17',
    status: '승인 완료',
    manager: '이선엽',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240414-88',
    store: '강남 서초점',
    items: '더블클립 세트 외 3건',
    totalQty: 50,
    amount: '₩240,000',
    reqDate: '2024.04.14 13:05',
    wishDate: '2024.04.15',
    status: '승인 완료',
    manager: '박범수',
    isAnomaly: false,
  },
  {
    id: 'ORD-20240414-87',
    store: '판교 테크노점',
    items: '투명 화일 (A4) 외 1건',
    totalQty: 500,
    amount: '₩250,000',
    reqDate: '2024.04.14 12:50',
    wishDate: '2024.04.16',
    status: '배송 완료',
    manager: '이후경',
    isAnomaly: false,
  },
]

const orderDetails = [
  {
    name: '고속 충전기 (C타입) 25W',
    spec: 'White / 2.0m',
    price: 15000,
    qty: 300,
    subtotal: 4500000,
  },
  { name: '휴대용 가글 (중) 250ml', spec: '민트향', price: 3500, qty: 50, subtotal: 175000 },
  { name: '유리제 머그컵 350ml', spec: '내열유리', price: 8900, qty: 100, subtotal: 890000 },
]

const filteredOrders = computed(() => {
  if (activeStatusTab.value === '전체') {
    return orderData
  }

  if (activeStatusTab.value === '반려/취소') {
    return orderData.filter((order) => order.status === '반려' || order.status === '취소')
  }

  return orderData.filter((order) => order.status === activeStatusTab.value)
})

const isAllChecked = computed(
  () =>
    filteredOrders.value.length > 0 &&
    filteredOrders.value.every((order) => checkedOrders.value.includes(order.id)),
)

const handleTopMenuClick = (menu) => {
  const target = routeMap[menu]
  if (target) {
    router.push(target)
  }
}

const handleCheckAll = (checked) => {
  if (checked) {
    const next = new Set(checkedOrders.value)
    filteredOrders.value.forEach((order) => next.add(order.id))
    checkedOrders.value = [...next]
    return
  }

  checkedOrders.value = checkedOrders.value.filter(
    (id) => !filteredOrders.value.some((order) => order.id === id),
  )
}

const handleCheck = (id) => {
  if (checkedOrders.value.includes(id)) {
    checkedOrders.value = checkedOrders.value.filter((orderId) => orderId !== id)
    return
  }

  checkedOrders.value = [...checkedOrders.value, id]
}

const closeDetail = () => {
  selectedOrder.value = null
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

const FileTextIcon = IconBase([
  { tag: 'path', attrs: { d: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z' } },
  { tag: 'path', attrs: { d: 'M14 3v5h5' } },
  { tag: 'path', attrs: { d: 'M9 13h6' } },
  { tag: 'path', attrs: { d: 'M9 17h6' } },
])

const BarChart3Icon = IconBase([
  { tag: 'path', attrs: { d: 'M3 20h18' } },
  { tag: 'path', attrs: { d: 'M7 16V8' } },
  { tag: 'path', attrs: { d: 'M12 16V4' } },
  { tag: 'path', attrs: { d: 'M17 16v-6' } },
])

const TruckIcon = IconBase([
  { tag: 'path', attrs: { d: 'M10 17H5a2 2 0 0 1-2-2V7h11v10Z' } },
  { tag: 'path', attrs: { d: 'M14 17h-1V9h3l3 3v5h-1' } },
  { tag: 'circle', attrs: { cx: '7.5', cy: '17.5', r: '1.5' } },
  { tag: 'circle', attrs: { cx: '17.5', cy: '17.5', r: '1.5' } },
])

const SettingsIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '3' } },
  {
    tag: 'path',
    attrs: {
      d: 'M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 1-3 0 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06A2 2 0 1 1 5.24 17l.06-.06A1.7 1.7 0 0 0 5.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 1 0-3 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87L5.2 8.07A2 2 0 1 1 8.03 5.24l.06.06A1.7 1.7 0 0 0 10 5.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 1 3 0 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06A2 2 0 1 1 19.76 8l-.06.06A1.7 1.7 0 0 0 19.4 10c0 .37.21.73.6 1a1.7 1.7 0 0 1 0 3 1.7 1.7 0 0 0-.6 1Z',
    },
  },
])

const BellIcon = IconBase([
  {
    tag: 'path',
    attrs: {
      d: 'M15 17H5a2 2 0 0 1-2-2c2 0 3-1 3-3V9a6 6 0 0 1 12 0v3c0 2 1 3 3 3a2 2 0 0 1-2 2h-4',
    },
  },
  { tag: 'path', attrs: { d: 'M10 17a2 2 0 0 0 4 0' } },
])

const SearchIcon = IconBase([
  { tag: 'circle', attrs: { cx: '11', cy: '11', r: '7' } },
  { tag: 'path', attrs: { d: 'm20 20-3.5-3.5' } },
])

const DownloadIcon = IconBase([
  { tag: 'path', attrs: { d: 'M12 3v12' } },
  { tag: 'path', attrs: { d: 'm7 10 5 5 5-5' } },
  { tag: 'path', attrs: { d: 'M5 21h14' } },
])

const ChevronLeftIcon = IconBase([{ tag: 'path', attrs: { d: 'm15 18-6-6 6-6' } }])
const ChevronRightIcon = IconBase([{ tag: 'path', attrs: { d: 'm9 18 6-6-6-6' } }])

const ThumbsUpIcon = IconBase([
  { tag: 'path', attrs: { d: 'M7 10v10' } },
  {
    tag: 'path',
    attrs: {
      d: 'M12 20h5a2 2 0 0 0 2-2v-5.2a2 2 0 0 0-.4-1.2l-2.1-2.8A2 2 0 0 0 15 8h-3V5.5A1.5 1.5 0 0 0 10.5 4L7 10Z',
    },
  },
  { tag: 'path', attrs: { d: 'M4 10h3v10H4z' } },
])

const ThumbsDownIcon = IconBase([
  { tag: 'path', attrs: { d: 'M7 4v10' } },
  {
    tag: 'path',
    attrs: {
      d: 'M12 4h5a2 2 0 0 1 2 2v5.2a2 2 0 0 1-.4 1.2l-2.1 2.8A2 2 0 0 1 15 16h-3v2.5a1.5 1.5 0 0 1-1.5 1.5L7 14Z',
    },
  },
  { tag: 'path', attrs: { d: 'M4 4h3v10H4z' } },
])

const AlertCircleIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 8v5' } },
  { tag: 'path', attrs: { d: 'M12 16h.01' } },
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

const StoreIcon = IconBase([
  { tag: 'path', attrs: { d: 'M4 10h16' } },
  { tag: 'path', attrs: { d: 'M5 10V6l2-2h10l2 2v4' } },
  { tag: 'path', attrs: { d: 'M6 10v10h12V10' } },
  { tag: 'path', attrs: { d: 'M10 20v-5h4v5' } },
])

const UserIcon = IconBase([
  { tag: 'path', attrs: { d: 'M20 21a8 8 0 0 0-16 0' } },
  { tag: 'circle', attrs: { cx: '12', cy: '8', r: '4' } },
])

const ClockIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 7v5l3 2' } },
])

const CalendarIcon = IconBase([
  { tag: 'rect', attrs: { x: '3', y: '5', width: '18', height: '16', rx: '2' } },
  { tag: 'path', attrs: { d: 'M16 3v4' } },
  { tag: 'path', attrs: { d: 'M8 3v4' } },
  { tag: 'path', attrs: { d: 'M3 10h18' } },
])

const iconMap = {
  file: FileTextIcon,
  chart: BarChart3Icon,
  truck: TruckIcon,
  settings: SettingsIcon,
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
      <section class="flex flex-wrap gap-2 border border-gray-300 bg-white p-2 shadow-sm">
        <button
          v-for="tab in statusTabs"
          :key="tab.label"
          type="button"
          class="flex items-center gap-2 border px-4 py-2 text-xs font-black transition-colors"
          :class="
            activeStatusTab === tab.label
              ? 'border-[#004D3C] bg-[#004D3C] text-white'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          "
          @click="activeStatusTab = tab.label"
        >
          <span>{{ tab.label }}</span>
          <span
            class="px-1.5 py-0.5 text-[10px]"
            :class="
              activeStatusTab === tab.label
                ? 'bg-white/20 text-white'
                : tab.highlight
                  ? 'bg-red-50 text-red-700'
                  : 'bg-gray-100 text-gray-500'
            "
          >
            {{ tab.count }}
          </span>
        </button>
      </section>

      <section
        class="flex flex-wrap items-center justify-between gap-3 border border-red-200 bg-red-50 px-4 py-3 text-red-800"
      >
        <div class="flex items-start gap-3">
          <div class="mt-0.5 flex h-6 w-6 items-center justify-center bg-red-100">
            <AlertCircleIcon :size="14" />
          </div>
          <p class="text-xs font-bold">
            [발주량 이상 감지] 강남 서초점의 '고속 충전기' 발주량이 평소 대비 300% 급증했습니다.
            (기준일: 최근 4주 평균)
          </p>
        </div>
        <button type="button" class="text-xs font-black underline">상세 분석 보고서 열기</button>
      </section>

      <section class="flex min-h-0 flex-col gap-4 xl:flex-row">
        <div
          class="flex min-w-0 flex-1 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm"
        >
          <div
            class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/70 px-3 py-2.5"
          >
            <div class="flex flex-wrap items-center gap-3">
              <label class="inline-flex items-center gap-2 text-xs font-bold text-gray-600">
                <input
                  type="checkbox"
                  class="h-3 w-3 accent-[#004D3C]"
                  :checked="isAllChecked"
                  @change="handleCheckAll($event.target.checked)"
                />
                <span>전체 선택</span>
              </label>

              <div v-if="checkedOrders.length > 0" class="flex items-center gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-black text-emerald-700"
                >
                  <ThumbsUpIcon :size="12" />
                  일괄 승인 ({{ checkedOrders.length }})
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-black text-red-700"
                >
                  <ThumbsDownIcon :size="12" />
                  일괄 반려
                </button>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <label class="relative block">
                <SearchIcon
                  :size="14"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="발주 번호/매장 검색..."
                  class="w-56 border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#004D3C]"
                />
              </label>
              <button
                type="button"
                class="border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50"
              >
                <DownloadIcon :size="14" />
              </button>
            </div>
          </div>

          <div class="overflow-auto">
            <table class="w-full min-w-[960px] table-fixed border-collapse text-xs">
              <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th class="w-10 px-3 py-2 text-center font-black"></th>
                  <th class="w-32 px-3 py-2 text-left font-black">발주 번호</th>
                  <th class="w-36 px-3 py-2 text-left font-black">요청 매장</th>
                  <th class="px-3 py-2 text-left font-black">품목 명세</th>
                  <th class="w-24 px-3 py-2 text-right font-black">총 수량</th>
                  <th class="w-28 px-3 py-2 text-right font-black">발주 금액</th>
                  <th class="w-24 px-3 py-2 text-center font-black">상태</th>
                  <th class="w-24 px-3 py-2 text-center font-black">관리</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="order in filteredOrders"
                  :key="order.id"
                  class="cursor-pointer transition-colors hover:bg-gray-50"
                  :class="{
                    'bg-[#E6F2F0]': selectedOrder?.id === order.id,
                    'bg-red-50/60': order.isAnomaly && selectedOrder?.id !== order.id,
                  }"
                  @click="selectedOrder = order"
                >
                  <td class="px-3 py-3 text-center" @click.stop>
                    <input
                      type="checkbox"
                      class="h-3 w-3 accent-[#004D3C]"
                      :checked="checkedOrders.includes(order.id)"
                      @change="handleCheck(order.id)"
                    />
                  </td>
                  <td class="px-3 py-3 font-bold text-gray-400">
                    {{ order.id }}
                    <span
                      v-if="order.isAnomaly"
                      class="ml-1 bg-red-600 px-1 py-0.5 text-[9px] font-black text-white"
                      >이상</span
                    >
                  </td>
                  <td class="px-3 py-3 font-black text-gray-800">{{ order.store }}</td>
                  <td class="truncate px-3 py-3 font-bold text-gray-600">{{ order.items }}</td>
                  <td class="px-3 py-3 text-right font-black text-gray-800">
                    {{ order.totalQty.toLocaleString() }}
                  </td>
                  <td class="px-3 py-3 text-right font-black text-gray-800">{{ order.amount }}</td>
                  <td class="px-3 py-3 text-center">
                    <span
                      class="inline-flex px-2 py-1 text-[10px] font-black"
                      :class="{
                        'bg-amber-50 text-amber-700': order.status === '승인 대기',
                        'bg-emerald-50 text-emerald-700': order.status === '승인 완료',
                        'bg-red-50 text-red-700': order.status === '반려',
                      }"
                    >
                      {{ order.status }}
                    </span>
                  </td>
                  <td class="px-3 py-3 text-center" @click.stop>
                    <div class="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        class="border border-gray-200 bg-white p-1 text-gray-500 hover:bg-gray-50"
                      >
                        <SearchIcon :size="12" />
                      </button>
                      <button
                        v-if="order.status === '승인 대기'"
                        type="button"
                        class="border border-emerald-200 bg-emerald-50 p-1 text-emerald-700"
                      >
                        <ThumbsUpIcon :size="12" />
                      </button>
                      <button
                        v-if="order.status === '승인 대기'"
                        type="button"
                        class="border border-red-200 bg-red-50 p-1 text-red-700"
                      >
                        <ThumbsDownIcon :size="12" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-300 bg-gray-50 px-3 py-2 text-[11px] font-bold text-gray-500"
          >
            <span>Page 1 of 8 (Total: 142 Orders)</span>
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="flex h-6 min-w-6 items-center justify-center border border-gray-300 bg-white px-1.5"
              >
                <ChevronLeftIcon :size="14" />
              </button>
              <button
                v-for="page in [1, 2, 3]"
                :key="page"
                type="button"
                class="flex h-6 min-w-6 items-center justify-center border border-gray-300 px-2"
                :class="
                  page === 1 ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                "
              >
                {{ page }}
              </button>
              <button
                type="button"
                class="flex h-6 min-w-6 items-center justify-center border border-gray-300 bg-white px-1.5"
              >
                <ChevronRightIcon :size="14" />
              </button>
            </div>
          </div>
        </div>

        <aside
          v-if="selectedOrder"
          class="flex w-full shrink-0 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm xl:w-[360px]"
        >
          <div class="flex items-center justify-between bg-[#004D3C] px-4 py-3 text-white">
            <h3
              class="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider"
            >
              <InfoIcon :size="14" />
              발주 상세 명세 (SO-005)
            </h3>
            <button type="button" class="p-1 text-white hover:bg-white/10" @click="closeDetail">
              <XIcon :size="16" />
            </button>
          </div>

          <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            <section class="space-y-4">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-[10px] font-bold uppercase text-gray-400">발주 번호</p>
                  <p class="mt-1 text-sm font-black text-gray-900">{{ selectedOrder.id }}</p>
                </div>
                <div class="text-right">
                  <p class="text-[10px] font-bold uppercase text-gray-400">상태</p>
                  <span
                    class="mt-1 inline-flex px-2 py-1 text-[10px] font-black"
                    :class="
                      selectedOrder.status === '승인 대기'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    "
                  >
                    {{ selectedOrder.status }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p
                    class="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400"
                  >
                    <StoreIcon :size="10" /> 요청 매장
                  </p>
                  <p class="mt-1 text-xs font-black text-gray-800">{{ selectedOrder.store }}</p>
                </div>
                <div>
                  <p
                    class="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400"
                  >
                    <UserIcon :size="10" /> 요청자
                  </p>
                  <p class="mt-1 text-xs font-black text-gray-800">
                    {{ selectedOrder.manager }} 점장
                  </p>
                </div>
                <div>
                  <p
                    class="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400"
                  >
                    <ClockIcon :size="10" /> 요청 일시
                  </p>
                  <p class="mt-1 text-xs font-bold text-gray-500">{{ selectedOrder.reqDate }}</p>
                </div>
                <div>
                  <p
                    class="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400"
                  >
                    <CalendarIcon :size="10" /> 희망 배송일
                  </p>
                  <p class="mt-1 text-xs font-black text-[#004D3C]">{{ selectedOrder.wishDate }}</p>
                </div>
              </div>
            </section>

            <section
              v-if="selectedOrder.isAnomaly"
              class="border border-red-200 bg-red-50 p-3 text-red-800"
            >
              <p class="inline-flex items-center gap-1.5 text-[11px] font-black">
                <AlertCircleIcon :size="12" /> 이상 발주 알림 (RQ-006)
              </p>
              <p class="mt-2 text-xs leading-relaxed">
                해당 매장의 '고속 충전기' 발주 패턴이 최근 4주 평균 대비 320% 초과되었습니다. 승인
                전 창고 재고 및 매장 특이사항을 반드시 확인하십시오.
              </p>
            </section>

            <section>
              <p class="mb-2 text-[10px] font-black uppercase text-gray-400">발주 품목 내역</p>
              <table class="w-full text-xs">
                <thead class="bg-gray-100 text-[10px] uppercase text-gray-500">
                  <tr>
                    <th class="px-2 py-2 text-left font-black">품목정보</th>
                    <th class="w-14 px-2 py-2 text-right font-black">수량</th>
                    <th class="w-24 px-2 py-2 text-right font-black">소계</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="item in orderDetails" :key="item.name">
                    <td class="px-2 py-2">
                      <p class="font-black text-gray-800">{{ item.name }}</p>
                      <p class="mt-0.5 text-[10px] text-gray-400">
                        {{ item.spec }} | ₩{{ item.price.toLocaleString() }}
                      </p>
                    </td>
                    <td class="px-2 py-2 text-right font-bold text-gray-700">{{ item.qty }}</td>
                    <td class="px-2 py-2 text-right font-bold text-gray-700">
                      ₩{{ item.subtotal.toLocaleString() }}
                    </td>
                  </tr>
                </tbody>
                <tfoot class="border-t border-gray-300 bg-gray-50 font-black text-gray-900">
                  <tr>
                    <td class="px-2 py-2">총계</td>
                    <td class="px-2 py-2 text-right">462</td>
                    <td class="px-2 py-2 text-right text-[#004D3C]">{{ selectedOrder.amount }}</td>
                  </tr>
                </tfoot>
              </table>
            </section>
          </div>

          <div class="space-y-2 px-4 pb-4">
            <div v-if="selectedOrder.status === '승인 대기'" class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center gap-1.5 border border-emerald-600 bg-emerald-600 px-3 py-2.5 text-[11px] font-black uppercase text-white"
              >
                <ThumbsUpIcon :size="14" />
                발주 승인
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center gap-1.5 border border-red-600 bg-red-600 px-3 py-2.5 text-[11px] font-black uppercase text-white"
              >
                <ThumbsDownIcon :size="14" />
                발주 반려
              </button>
            </div>
            <button
              v-else
              type="button"
              class="inline-flex w-full items-center justify-center gap-2 border border-[#004D3C] bg-[#004D3C] px-3 py-2.5 text-[11px] font-black uppercase text-white"
            >
              <FileTextIcon :size="14" />
              명세서 재발행
            </button>
            <button
              type="button"
              class="w-full border border-gray-300 bg-white px-3 py-2.5 text-[11px] font-black uppercase text-gray-700 hover:bg-gray-50"
              @click="closeDetail"
            >
              닫기 (Esc)
            </button>
          </div>
        </aside>
      </section>
    </div>
  </AppLayout>
</template>
