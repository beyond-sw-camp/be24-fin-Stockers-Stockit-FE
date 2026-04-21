<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Warehouse,
  Search,
  RotateCcw,
  Download,
  X,
  Package,
  TriangleAlert,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const warehouseMenus = roleMenus.warehouse

const activeSideMenu = ref('창고 재고 관리')
const activeTopMenu = computed(() => '창고 재고 관리')

function handleLogout() {
  auth.logout()
  router.push('/login')
}

/* ── 창고 정보 ── */
const warehouseInfo = {
  id: 'WH-001',
  name: '인천 제1물류센터',
  manager: '이후경',
  maxQty: 50000,
  usedQty: 31480,
}

/* ── 재고 데이터 ── */
const inventoryData = ref([
  { code: 'IT-0001', name: '아메리카노 원두 (500g)',    category: '음료 원료', unit: '개',   available: 850,  hold: 50,  damaged: 0,  location: 'A-01-03' },
  { code: 'IT-0002', name: '유기농 우유 1L',            category: '유제품',   unit: '팩',   available: 2400, hold: 0,   damaged: 12, location: 'B-02-01' },
  { code: 'IT-0003', name: '친환경 종이컵 (1000ea)',    category: '소모품',   unit: '박스', available: 320,  hold: 80,  damaged: 0,  location: 'C-01-05' },
  { code: 'IT-0004', name: '무라벨 생수 500ml',         category: '음료',     unit: '박스', available: 1500, hold: 200, damaged: 30, location: 'A-03-02' },
  { code: 'IT-0005', name: '에스프레소 시럽 750ml',     category: '음료 원료', unit: '병',  available: 640,  hold: 0,   damaged: 8,  location: 'A-01-07' },
  { code: 'IT-0006', name: '아이스 컵 (Large, 500ea)', category: '소모품',   unit: '박스', available: 180,  hold: 20,  damaged: 0,  location: 'C-02-01' },
  { code: 'IT-0007', name: '녹차 파우더 (1kg)',         category: '음료 원료', unit: '개',  available: 0,    hold: 120, damaged: 0,  location: 'A-02-04' },
  { code: 'IT-0008', name: '냉동 블루베리 (1kg)',       category: '식재료',   unit: '봉지', available: 880,  hold: 0,   damaged: 44, location: 'D-01-02' },
  { code: 'IT-0009', name: '빨대 (개별 포장, 200ea)',   category: '소모품',   unit: '박스', available: 510,  hold: 0,   damaged: 0,  location: 'C-03-06' },
  { code: 'IT-0010', name: '시나몬 파우더 (500g)',      category: '음료 원료', unit: '개',  available: 230,  hold: 40,  damaged: 0,  location: 'A-02-01' },
  { code: 'IT-0011', name: '두유 (190ml, 24입)',        category: '유제품',   unit: '박스', available: 440,  hold: 0,   damaged: 6,  location: 'B-01-03' },
  { code: 'IT-0012', name: '캐러멜 시럽 750ml',         category: '음료 원료', unit: '병',  available: 380,  hold: 60,  damaged: 0,  location: 'A-01-09' },
  { code: 'IT-0013', name: '핫초코 파우더 (1kg)',       category: '음료 원료', unit: '개',  available: 165,  hold: 0,   damaged: 0,  location: 'A-02-06' },
  { code: 'IT-0014', name: '냅킨 (500매)',              category: '소모품',   unit: '묶음', available: 720,  hold: 0,   damaged: 20, location: 'C-01-08' },
  { code: 'IT-0015', name: '딸기 시럽 750ml',           category: '음료 원료', unit: '병',  available: 290,  hold: 30,  damaged: 4,  location: 'A-01-11' },
])

const categories = ['전체', '음료 원료', '유제품', '소모품', '음료', '식재료']

/* ── 상태 헬퍼 ── */
function rowStatus(item) {
  if (item.available === 0 && item.hold > 0) return '전량보류'
  if (item.damaged > 0 && item.available === 0) return '전량파손'
  if (item.damaged > 0) return '파손있음'
  if (item.hold > 0)    return '보류있음'
  return '정상'
}

function statusStyle(st) {
  if (st === '정상')    return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  if (st === '보류있음' || st === '전량보류') return 'bg-amber-50 text-amber-700 border border-amber-200'
  if (st === '파손있음' || st === '전량파손') return 'bg-red-50 text-red-600 border border-red-200'
  return 'bg-gray-100 text-gray-500'
}

/* ── 필터 ── */
const searchQuery  = ref('')
const filterCat    = ref('전체')
const filterStatus = ref('전체')

const filtered = computed(() =>
  inventoryData.value.filter(item => {
    const q = searchQuery.value.toLowerCase()
    const nameMatch   = item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q)
    const catMatch    = filterCat.value === '전체' || item.category === filterCat.value
    const st = rowStatus(item)
    const statusMatch = filterStatus.value === '전체'
      || (filterStatus.value === '정상'    && st === '정상')
      || (filterStatus.value === '보류있음' && (st === '보류있음' || st === '전량보류'))
      || (filterStatus.value === '파손있음' && (st === '파손있음' || st === '전량파손'))
    return nameMatch && catMatch && statusMatch
  })
)

const PAGE_SIZE   = 10
const currentPage = ref(1)
const totalPages  = computed(() => Math.ceil(filtered.value.length / PAGE_SIZE) || 1)
const paginated   = computed(() => {
  const s = (currentPage.value - 1) * PAGE_SIZE
  return filtered.value.slice(s, s + PAGE_SIZE)
})

function resetFilters() {
  searchQuery.value  = ''
  filterCat.value    = '전체'
  filterStatus.value = '전체'
  currentPage.value  = 1
}
function onFilterChange() { currentPage.value = 1 }

/* ── KPI ── */
const kpi = computed(() => {
  const all = inventoryData.value
  return {
    전체품목:   all.length,
    총가용수량: all.reduce((s, i) => s + i.available, 0).toLocaleString(),
    총보류수량: all.reduce((s, i) => s + i.hold, 0).toLocaleString(),
    총파손수량: all.reduce((s, i) => s + i.damaged, 0).toLocaleString(),
    공간점유율: Math.round((warehouseInfo.usedQty / warehouseInfo.maxQty) * 100),
  }
})

/* ── 상세 패널 ── */
const selectedItem = ref(null)
function selectItem(item) { selectedItem.value = item }
function closePanel()     { selectedItem.value = null }

/* ── 입출고 이력 (더미) ── */
const recentHistory = [
  { type: '입고', qty: '+500', date: '2026-04-18', memo: '(주)커피네트웍스 입고' },
  { type: '출고', qty: '-120', date: '2026-04-17', memo: '성수 직영점 배송' },
  { type: '출고', qty: '-80',  date: '2026-04-16', memo: '판교 테크노점 배송' },
  { type: '입고', qty: '+300', date: '2026-04-14', memo: '(주)커피네트웍스 입고' },
]

function downloadExcel() { alert('창고 재고 현황 엑셀 다운로드가 시작됩니다.') }

const today = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date())

/* ── 시각화 바 높이 계산 ── */
function barHeight(val, item) {
  const total = item.available + item.hold + item.damaged
  return total > 0 ? Math.round((val / total) * 80) : 4
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :side-menus="warehouseMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-3">

      <!-- 페이지 헤더 -->
      <section class="flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="inline-flex items-center gap-2 text-[15px] font-semibold text-gray-900">
            <Warehouse :size="18" />
            창고 재고 조회
          </h2>
          <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
            {{ warehouseInfo.id }} · {{ warehouseInfo.name }}
          </span>
          <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
            기준일: {{ today }}
          </span>
        </div>
        <button
          class="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-600 transition hover:border-[#004D3C] hover:text-[#004D3C]"
          @click="downloadExcel"
        >
          <Download :size="14" />
          엑셀 다운로드
        </button>
      </section>

      <!-- 창고 공간 점유율 배너 -->
      <section
        class="flex flex-wrap items-center gap-4 border bg-white px-3 py-3 shadow-sm"
        :class="kpi.공간점유율 >= 80 ? 'border-red-300 bg-red-50' : 'border-gray-300'"
      >
        <div class="flex items-center gap-2 shrink-0">
          <Warehouse :size="15" :class="kpi.공간점유율 >= 80 ? 'text-red-500' : 'text-gray-400'" />
          <span class="text-[12px] font-medium text-gray-500">창고 공간 점유율</span>
          <span class="text-[16px] font-bold" :class="kpi.공간점유율 >= 80 ? 'text-red-600' : 'text-[#004D3C]'">
            {{ kpi.공간점유율 }}%
          </span>
          <span v-if="kpi.공간점유율 >= 80" class="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
            <TriangleAlert :size="11" /> 과부하 주의
          </span>
        </div>
        <div class="flex flex-1 items-center gap-3 min-w-[200px]">
          <div class="h-2 flex-1 overflow-hidden bg-gray-200">
            <div
              class="h-full transition-all duration-500"
              :class="kpi.공간점유율 >= 80 ? 'bg-red-500' : 'bg-[#004D3C]'"
              :style="{ width: kpi.공간점유율 + '%' }"
            />
          </div>
          <span class="text-[11px] font-medium text-gray-400 whitespace-nowrap">
            {{ warehouseInfo.usedQty.toLocaleString() }} / {{ warehouseInfo.maxQty.toLocaleString() }} EA
          </span>
        </div>
      </section>

      <!-- KPI 카드 -->
      <section class="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article class="flex h-[80px] flex-col justify-between border border-gray-300 bg-white px-3 py-3 shadow-sm">
          <p class="text-[11px] font-medium leading-tight text-gray-500">전체 품목</p>
          <div class="flex items-end justify-between gap-1">
            <span class="text-[20px] font-bold tracking-tight text-gray-900">{{ kpi.전체품목 }}</span>
            <Package :size="14" class="text-gray-400" />
          </div>
        </article>
        <article class="flex h-[80px] flex-col justify-between border border-l-[3px] border-emerald-300 bg-white px-3 py-3 shadow-sm">
          <p class="text-[11px] font-medium leading-tight text-gray-500">총 가용 수량</p>
          <div class="flex items-end justify-between gap-1">
            <span class="text-[20px] font-bold tracking-tight text-emerald-600">{{ kpi.총가용수량 }}</span>
            <ArrowDownToLine :size="14" class="text-emerald-400" />
          </div>
        </article>
        <article class="flex h-[80px] flex-col justify-between border border-l-[3px] border-amber-300 bg-white px-3 py-3 shadow-sm">
          <p class="text-[11px] font-medium leading-tight text-gray-500">총 보류 수량</p>
          <div class="flex items-end justify-between gap-1">
            <span class="text-[20px] font-bold tracking-tight text-amber-500">{{ kpi.총보류수량 }}</span>
            <TriangleAlert :size="14" class="text-amber-400" />
          </div>
        </article>
        <article class="flex h-[80px] flex-col justify-between border border-l-[3px] border-red-300 bg-white px-3 py-3 shadow-sm">
          <p class="text-[11px] font-medium leading-tight text-gray-500">총 파손 수량</p>
          <div class="flex items-end justify-between gap-1">
            <span class="text-[20px] font-bold tracking-tight text-red-600">{{ kpi.총파손수량 }}</span>
            <TriangleAlert :size="14" class="text-red-400" />
          </div>
        </article>
      </section>

      <!-- 필터 바 -->
      <section class="flex flex-wrap items-center gap-2 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="relative flex items-center">
          <Search :size="13" class="absolute left-2.5 text-gray-400 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="품목명 또는 품목 코드 검색"
            class="h-9 w-56 border border-gray-300 bg-gray-50 pl-8 pr-3 text-[13px] text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#004D3C] focus:bg-white"
            @input="onFilterChange"
          />
        </div>
        <select v-model="filterCat" class="h-9 border border-gray-300 bg-gray-50 px-3 text-[13px] text-gray-700 outline-none transition focus:border-[#004D3C] focus:bg-white" @change="onFilterChange">
          <option v-for="c in categories" :key="c" :value="c">{{ c === '전체' ? '카테고리 전체' : c }}</option>
        </select>
        <select v-model="filterStatus" class="h-9 border border-gray-300 bg-gray-50 px-3 text-[13px] text-gray-700 outline-none transition focus:border-[#004D3C] focus:bg-white" @change="onFilterChange">
          <option value="전체">재고 상태 전체</option>
          <option value="정상">정상</option>
          <option value="보류있음">보류 포함</option>
          <option value="파손있음">파손 포함</option>
        </select>
        <button
          class="inline-flex h-9 items-center gap-1.5 border border-gray-300 bg-white px-3 text-[13px] font-medium text-gray-500 transition hover:bg-gray-50"
          @click="resetFilters"
        >
          <RotateCcw :size="13" />
          초기화
        </button>
        <span class="ml-auto text-[12px] font-medium text-gray-400">총 {{ filtered.length }}건</span>
      </section>

      <!-- 테이블 카드 -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center justify-between gap-3 border-b border-gray-200 px-3 py-2.5">
          <h3 class="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
            <Package :size="16" />
            재고 목록
          </h3>
          <span class="text-[10px] font-medium text-gray-400">행 클릭 시 상세 조회</span>
        </div>

        <div class="overflow-auto">
          <table class="w-full min-w-[900px] text-[13px]">
            <thead class="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th class="px-3 py-2.5 text-left font-bold">품목 코드</th>
                <th class="px-3 py-2.5 text-left font-bold">품목명</th>
                <th class="px-3 py-2.5 text-left font-bold">카테고리</th>
                <th class="px-3 py-2.5 text-center font-bold">단위</th>
                <th class="px-3 py-2.5 text-right font-bold">가용</th>
                <th class="px-3 py-2.5 text-right font-bold">보류</th>
                <th class="px-3 py-2.5 text-right font-bold">파손</th>
                <th class="px-3 py-2.5 text-right font-bold">합계</th>
                <th class="px-3 py-2.5 text-left font-bold">보관 위치</th>
                <th class="px-3 py-2.5 text-left font-bold">상태</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 border-t border-gray-200">
              <tr
                v-for="item in paginated"
                :key="item.code"
                class="cursor-pointer transition-colors hover:bg-gray-50/50"
                :class="{
                  'bg-[#eef7f4] hover:bg-[#e4f2ef]': selectedItem?.code === item.code,
                  'bg-amber-50/40': rowStatus(item).includes('보류') && selectedItem?.code !== item.code,
                  'bg-red-50/40':   rowStatus(item).includes('파손') && selectedItem?.code !== item.code,
                }"
                @click="selectItem(item)"
              >
                <td class="px-3 py-2.5 text-[11px] text-gray-400">{{ item.code }}</td>
                <td class="px-3 py-2.5 font-semibold text-gray-800">{{ item.name }}</td>
                <td class="px-3 py-2.5">
                  <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">{{ item.category }}</span>
                </td>
                <td class="px-3 py-2.5 text-center text-gray-600">{{ item.unit }}</td>
                <td class="px-3 py-2.5 text-right font-semibold text-emerald-600">{{ item.available.toLocaleString() }}</td>
                <td class="px-3 py-2.5 text-right">
                  <span v-if="item.hold > 0" class="font-semibold text-amber-600">{{ item.hold.toLocaleString() }}</span>
                  <span v-else class="text-gray-300">—</span>
                </td>
                <td class="px-3 py-2.5 text-right">
                  <span v-if="item.damaged > 0" class="font-semibold text-red-600">{{ item.damaged.toLocaleString() }}</span>
                  <span v-else class="text-gray-300">—</span>
                </td>
                <td class="px-3 py-2.5 text-right font-semibold text-gray-700">
                  {{ (item.available + item.hold + item.damaged).toLocaleString() }}
                </td>
                <td class="px-3 py-2.5">
                  <span class="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">{{ item.location }}</span>
                </td>
                <td class="px-3 py-2.5">
                  <span class="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium" :class="statusStyle(rowStatus(item))">
                    {{ rowStatus(item) }}
                  </span>
                </td>
              </tr>
              <tr v-if="paginated.length === 0">
                <td colspan="10" class="px-3 py-10 text-center text-[13px] text-gray-400">조회 결과가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 페이지네이션 -->
        <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-2">
          <span class="text-[11px] font-medium text-gray-400">
            {{ (currentPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(currentPage * PAGE_SIZE, filtered.length) }} / 전체 {{ filtered.length }}건
          </span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              :disabled="currentPage === 1"
              class="flex h-7 w-7 items-center justify-center border border-gray-300 bg-white text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="currentPage--"
            >
              <ChevronLeft :size="14" />
            </button>
            <button
              v-for="p in totalPages"
              :key="p"
              type="button"
              class="flex h-7 min-w-[28px] items-center justify-center border text-[12px] font-medium transition"
              :class="p === currentPage ? 'border-[#004D3C] bg-[#004D3C] text-white' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-100'"
              @click="currentPage = p"
            >{{ p }}</button>
            <button
              type="button"
              :disabled="currentPage === totalPages"
              class="flex h-7 w-7 items-center justify-center border border-gray-300 bg-white text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="currentPage++"
            >
              <ChevronRight :size="14" />
            </button>
          </div>
        </div>
      </section>

    </div>

    <!-- ── 상세 패널 ── -->
    <transition name="slide">
      <div
        v-if="selectedItem"
        class="fixed inset-0 z-50 flex justify-end bg-black/20"
        @click.self="closePanel"
      >
        <div class="detail-panel flex h-full w-[440px] flex-col border-l border-gray-300 bg-white shadow-2xl">

          <!-- 헤더 -->
          <div class="flex shrink-0 items-start justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <p class="text-[11px] font-bold uppercase tracking-widest text-gray-400">{{ selectedItem.code }} · {{ selectedItem.location }}</p>
              <h2 class="mt-1 text-[16px] font-bold leading-snug text-gray-900">{{ selectedItem.name }}</h2>
            </div>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center border border-gray-200 bg-white text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              @click="closePanel"
            >
              <X :size="16" />
            </button>
          </div>

          <div class="flex flex-1 flex-col gap-5 overflow-y-auto p-4">

            <!-- 상태 -->
            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">처리 상태</p>
              <span class="inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-medium" :class="statusStyle(rowStatus(selectedItem))">
                {{ rowStatus(selectedItem) }}
              </span>
            </div>

            <!-- 재고 현황 시각화 -->
            <div>
              <p class="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">재고 현황 (가용 / 보류 / 파손)</p>
              <div class="flex items-end gap-5">
                <!-- 가용 -->
                <div class="flex flex-1 flex-col items-center gap-1.5">
                  <span class="text-[18px] font-bold text-emerald-600">{{ selectedItem.available.toLocaleString() }}</span>
                  <div class="flex w-full items-end" style="height:80px">
                    <div class="w-full rounded-t bg-emerald-500" :style="{ height: barHeight(selectedItem.available, selectedItem) + 'px' }" />
                  </div>
                  <span class="text-[11px] font-medium text-gray-500">가용</span>
                </div>
                <!-- 보류 -->
                <div class="flex flex-1 flex-col items-center gap-1.5">
                  <span class="text-[18px] font-bold text-amber-500">{{ selectedItem.hold.toLocaleString() }}</span>
                  <div class="flex w-full items-end" style="height:80px">
                    <div class="w-full rounded-t bg-amber-400" :style="{ height: barHeight(selectedItem.hold, selectedItem) + 'px' }" />
                  </div>
                  <span class="text-[11px] font-medium text-gray-500">보류</span>
                </div>
                <!-- 파손 -->
                <div class="flex flex-1 flex-col items-center gap-1.5">
                  <span class="text-[18px] font-bold text-red-600">{{ selectedItem.damaged.toLocaleString() }}</span>
                  <div class="flex w-full items-end" style="height:80px">
                    <div class="w-full rounded-t bg-red-500" :style="{ height: barHeight(selectedItem.damaged, selectedItem) + 'px' }" />
                  </div>
                  <span class="text-[11px] font-medium text-gray-500">파손</span>
                </div>
                <!-- 합계 -->
                <div class="flex flex-[0.8] flex-col items-center gap-1.5">
                  <span class="text-[18px] font-bold text-gray-500">{{ (selectedItem.available + selectedItem.hold + selectedItem.damaged).toLocaleString() }}</span>
                  <div class="flex w-full items-end" style="height:80px">
                    <div class="w-full rounded-t bg-gray-200" style="height:80px" />
                  </div>
                  <span class="text-[11px] font-medium text-gray-500">합계</span>
                </div>
              </div>
            </div>

            <!-- 품목 정보 -->
            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">품목 정보</p>
              <div class="divide-y divide-gray-100 border border-gray-200">
                <div class="flex items-center gap-3 px-3 py-2.5">
                  <span class="w-20 shrink-0 text-[11px] font-medium text-gray-400">카테고리</span>
                  <span class="text-[13px] text-gray-800">{{ selectedItem.category }}</span>
                </div>
                <div class="flex items-center gap-3 px-3 py-2.5">
                  <span class="w-20 shrink-0 text-[11px] font-medium text-gray-400">단위</span>
                  <span class="text-[13px] text-gray-800">{{ selectedItem.unit }}</span>
                </div>
                <div class="flex items-center gap-3 px-3 py-2.5">
                  <span class="w-20 shrink-0 text-[11px] font-medium text-gray-400">보관 위치</span>
                  <span class="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">{{ selectedItem.location }}</span>
                </div>
                <div class="flex items-center gap-3 px-3 py-2.5">
                  <span class="w-20 shrink-0 text-[11px] font-medium text-gray-400">창고 ID</span>
                  <span class="text-[13px] text-gray-800">{{ warehouseInfo.id }}</span>
                </div>
              </div>
            </div>

            <!-- 최근 입출고 이력 -->
            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">최근 입출고 이력</p>
              <div class="flex flex-col gap-2">
                <div
                  v-for="h in recentHistory"
                  :key="h.date + h.type"
                  class="flex items-center gap-3 border border-gray-100 bg-gray-50 px-3 py-2.5"
                >
                  <span
                    class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    :class="h.type === '입고' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'"
                  >
                    <component :is="h.type === '입고' ? ArrowDownToLine : ArrowUpFromLine" :size="11" />
                    {{ h.type }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] text-gray-700">{{ h.memo }}</p>
                    <p class="text-[11px] text-gray-400">{{ h.date }}</p>
                  </div>
                  <span class="text-[13px] font-bold shrink-0" :class="h.type === '입고' ? 'text-emerald-600' : 'text-red-600'">
                    {{ h.qty }}
                  </span>
                </div>
              </div>
            </div>

          </div>

          <!-- 푸터 -->
          <div class="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
            <button
              class="inline-flex h-9 items-center gap-2 bg-[#004D3C] px-5 text-[13px] font-medium text-white transition hover:bg-[#003d30]"
              @click="downloadExcel"
            >
              <Download :size="14" />
              엑셀 다운로드
            </button>
            <button
              class="h-9 border border-gray-300 bg-white px-5 text-[13px] font-medium text-gray-600 transition hover:bg-gray-50"
              @click="closePanel"
            >닫기</button>
          </div>

        </div>
      </div>
    </transition>

  </AppLayout>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active { transition: opacity 0.2s ease; }
.slide-enter-active .detail-panel,
.slide-leave-active .detail-panel { transition: transform 0.25s ease; }
.slide-enter-from { opacity: 0; }
.slide-enter-from .detail-panel { transform: translateX(100%); }
.slide-leave-to { opacity: 0; }
.slide-leave-to .detail-panel { transform: translateX(100%); }
</style>
