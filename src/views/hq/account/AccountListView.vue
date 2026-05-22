<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Users,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Building2,
  Store,
  Warehouse,
  ClipboardList,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { accountApi } from '@/api/hq/account.js'
import { extractErrorMessage } from '@/api/axios.js'
const auth = useAuthStore()
const router = useRouter()
const hqMenus = roleMenus.hq

const activeSideMenu = ref('계정 관리')
const sideMenus = [
  { label: '계정 관리', path: '/hq/accounts' },
]

const activeTopMenu = computed(() => '계정 관리')


// ── BE 응답 매핑 (HQ/STORE/WAREHOUSE)
const roleLabel = (r) => ({
  HQ: '본사 관리자',
  STORE: '매장 관리자',
  WAREHOUSE: '물류 창고 관리자',
})[r] ?? r

const roleStyle = (r) => ({
  HQ:        'bg-[#eef7f4] text-[#004D3C] border border-[#cfe2dc]',
  STORE:     'bg-blue-50 text-blue-700 border border-blue-200',
  WAREHOUSE: 'bg-purple-50 text-purple-700 border border-purple-200',
})[r] ?? 'bg-gray-100 text-gray-600'

const roleIcon = (r) => ({
  HQ: Building2,
  STORE: Store,
  WAREHOUSE: Warehouse,
})[r] ?? Users

const statusLabel = (s) => ({
  PENDING: '승인 대기',
  APPROVED: '활성',
  REJECTED: '거절됨',
  WITHDRAWN: '탈퇴',
})[s] ?? s

const statusStyle = (s) => ({
  PENDING:   'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECTED:  'bg-red-50 text-red-700 border border-red-200',
  WITHDRAWN: 'bg-gray-100 text-gray-500 border border-gray-300',
})[s] ?? 'bg-gray-100 text-gray-600'

/** ISO → 'YYYY-MM-DD HH:mm' */
const formatDateTime = (iso) => {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── BE 응답 페이지 객체 ({ content, totalElements, totalPages, number, size, ... })
//    PENDING/REJECTED 는 회원가입 승인 탭에서 처리 → 클라이언트에서 1차 필터
const VISIBLE_STATUSES = ['APPROVED', 'WITHDRAWN']

const accountPage = ref(null)        // 서버 페이징 결과
const pendingCount = ref(0)          // PENDING 뱃지용 별도 카운트
const loading = ref(false)
const loadError = ref('')

// ── 필터 + 페이징 상태
const filter = reactive({ keyword: '', role: '', status: '' })
const PAGE_SIZE = 20
const currentPage = ref(1)

const roleOptions = [
  { value: '', label: '전체 권한' },
  { value: 'HQ', label: '본사 관리자' },
  { value: 'STORE', label: '매장 관리자' },
  { value: 'WAREHOUSE', label: '물류 창고 관리자' },
]
const statusOptions = [
  { value: '', label: '전체 상태' },
  { value: 'APPROVED', label: '활성' },
  { value: 'WITHDRAWN', label: '탈퇴' },
]

// ── 화면 표시 데이터 — BE content 에서 VISIBLE_STATUSES 만
const visibleMembers = computed(() =>
  (accountPage.value?.content ?? []).filter(m => VISIBLE_STATUSES.includes(m.status))
)
const totalElements = computed(() => accountPage.value?.totalElements ?? 0)
const totalPages = computed(() => Math.max(1, accountPage.value?.totalPages ?? 1))

// 통계 (현재 검색 결과 기준)
const stats = computed(() => {
  const members = visibleMembers.value
  return {
    total: totalElements.value,
    approved: members.filter(m => m.status === 'APPROVED').length,
    withdrawn: members.filter(m => m.status === 'WITHDRAWN').length,
  }
})

// ── BE 호출 — 현재 필터/페이지로 조회
async function loadAccounts() {
  loading.value = true
  loadError.value = ''
  try {
    accountPage.value = await accountApi.listAll({
      page: currentPage.value - 1,     // BE 는 0-based
      size: PAGE_SIZE,
      keyword: filter.keyword.trim(),
      role: filter.role,
      status: filter.status,
    })
  } catch (err) {
    loadError.value = extractErrorMessage(err, '계정 목록을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

// PENDING 뱃지용 카운트 — size=1 로 totalElements 만 가져옴
async function loadPendingCount() {
  try {
    const result = await accountApi.listAll({ page: 0, size: 1, status: 'PENDING' })
    pendingCount.value = result?.totalElements ?? 0
  } catch {
    pendingCount.value = 0
  }
}

// 키워드 입력 — 300ms 디바운스 후 첫 페이지로 BE 호출
let keywordDebounce = null
watch(() => filter.keyword, () => {
  clearTimeout(keywordDebounce)
  keywordDebounce = setTimeout(() => {
    currentPage.value = 1
    loadAccounts()
  }, 300)
})

// 권한/상태 필터 — 즉시 첫 페이지로
watch([() => filter.role, () => filter.status], () => {
  currentPage.value = 1
  loadAccounts()
})

// 페이지 변경 시 — BE 재호출
watch(currentPage, () => loadAccounts())

/**
 * 페이지네이션 — 5개씩 그룹으로 표시
 *  버튼 구성: << <  1 2 3 4 5  > >>
 *  - <<  : 이전 5페이지 그룹으로 이동
 *  - <   : 한 페이지 이전
 *  - >   : 한 페이지 다음
 *  - >>  : 다음 5페이지 그룹으로 이동
 *
 *  예시 (총 82페이지):
 *   현재 3페이지 → [1 2 3 4 5]
 *   현재 7페이지 → [6 7 8 9 10]
 *   현재 82페이지 → [81 82]
 */
const PAGES_PER_GROUP = 5
const currentGroup = computed(() => Math.ceil(currentPage.value / PAGES_PER_GROUP))
const totalGroups = computed(() => Math.max(1, Math.ceil(totalPages.value / PAGES_PER_GROUP)))

const visiblePages = computed(() => {
  const start = (currentGroup.value - 1) * PAGES_PER_GROUP + 1
  const end = Math.min(start + PAGES_PER_GROUP - 1, totalPages.value)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

function goPrevGroup() {
  // 이전 그룹의 첫 페이지로
  const prevGroupStart = Math.max(1, (currentGroup.value - 2) * PAGES_PER_GROUP + 1)
  currentPage.value = prevGroupStart
}

function goNextGroup() {
  // 다음 그룹의 첫 페이지로
  const nextGroupStart = Math.min(totalPages.value, currentGroup.value * PAGES_PER_GROUP + 1)
  currentPage.value = nextGroupStart
}

// 컴포넌트 진입(새로고침/페이지 재방문) 시 필터 강제 초기화 + BE 호출
//  - watch 가 이미 등록되어 있어도 onMounted 시점에는 트리거되지 않으므로 최초 1회 명시 호출
onMounted(() => {
  filter.keyword = ''
  filter.role = ''
  filter.status = ''
  currentPage.value = 1
  loadAccounts()       // 첫 페이지 목록 조회
  loadPendingCount()   // PENDING 뱃지 카운트
})

// ── 상세 패널
const selected = ref(null)
const withdrawConfirm = ref(false)
const withdrawing = ref(false)
const actionMessage = ref('')   // 성공 메시지

function openDetail(member) {
  selected.value = member
  withdrawConfirm.value = false
  actionMessage.value = ''
}

function closeDetail() {
  selected.value = null
  withdrawConfirm.value = false
  actionMessage.value = ''
}

/** 탈퇴 처리 — BE 호출 후 목록 갱신 */
async function confirmWithdraw() {
  if (!selected.value || withdrawing.value) return
  withdrawing.value = true
  try {
    const result = await accountApi.withdraw(selected.value.id)
    actionMessage.value = `${result.name} 님이 탈퇴 처리되었습니다.`
    // 로컬 상태 갱신
    selected.value.status = 'WITHDRAWN'
    selected.value.processedAt = result.processedAt
    // 목록 + 대기 카운트 재조회 (다른 탭에서 변동되었을 수 있음)
    await Promise.all([loadAccounts(), loadPendingCount()])
    withdrawConfirm.value = false
  } catch (err) {
    alert(extractErrorMessage(err, '탈퇴 처리에 실패했습니다.'))
  } finally {
    withdrawing.value = false
  }
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-3">

      <!-- 탭 네비게이션 -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex">
          <button
            type="button"
            class="inline-flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-[13px] font-semibold transition border-[#004D3C] text-[#004D3C]"
          >
            <Users :size="14" />
            계정 목록
          </button>
          <button
            type="button"
            class="inline-flex flex-1 items-center justify-center gap-2 border-b-2 border-transparent px-4 py-3 text-[13px] font-semibold text-gray-500 transition hover:text-gray-700"
            @click="router.push('/hq/accounts/approvals')"
          >
            <ClipboardList :size="14" />
            회원가입 승인
            <span
              v-if="pendingCount > 0"
              class="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white"
            >{{ pendingCount }}</span>
          </button>
        </div>
      </section>

      <!-- 페이지 헤더 -->
      <section class="flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <h2 class="inline-flex items-center gap-2 text-[15px] font-semibold text-gray-900">
          <Users :size="18" />
          계정 목록
        </h2>
        <div class="flex items-center gap-2">
          <div class="inline-flex items-center gap-1.5 border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
            전체 <span class="font-bold text-gray-800">{{ stats.total }}</span>명
          </div>
          <div class="inline-flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
            활성 <span class="font-bold">{{ stats.approved }}</span>
          </div>
          <div class="inline-flex items-center gap-1.5 border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-400">
            탈퇴 <span class="font-bold">{{ stats.withdrawn }}</span>
          </div>
        </div>
      </section>

      <!-- 필터 바 -->
      <section class="flex flex-wrap items-center gap-2 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="relative flex items-center">
          <Search :size="13" class="absolute left-2.5 text-gray-400 pointer-events-none" />
          <input
            v-model="filter.keyword"
            type="text"
            placeholder="이름/이메일/사원코드 검색"
            class="h-9 w-64 rounded-none border border-gray-300 bg-gray-50 pl-8 pr-3 text-[13px] text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#004D3C] focus:bg-white"
          />
        </div>
        <select
          v-model="filter.role"
          class="h-9 rounded-none border border-gray-300 bg-gray-50 px-3 text-[13px] text-gray-700 outline-none transition focus:border-[#004D3C] focus:bg-white"
        >
          <option v-for="o in roleOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <select
          v-model="filter.status"
          class="h-9 rounded-none border border-gray-300 bg-gray-50 px-3 text-[13px] text-gray-700 outline-none transition focus:border-[#004D3C] focus:bg-white"
        >
          <option v-for="o in statusOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <!-- 서버 페이징 총 건수 (검색 결과 기준) -->
        <span class="text-[12px] font-medium text-gray-400">{{ totalElements }}건</span>
      </section>

      <!-- 로딩 / 에러 -->
      <div v-if="loading" class="border border-gray-300 bg-white p-12 text-center text-[13px] text-gray-500">
        목록을 불러오는 중...
      </div>
      <div v-else-if="loadError" class="border border-red-200 bg-red-50 p-4 text-[13px] text-red-600">
        {{ loadError }}
      </div>

      <!-- 테이블 카드 -->
      <section v-else class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center justify-between gap-3 border-b border-gray-200 px-3 py-2.5">
          <h3 class="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
            <Users :size="16" />
            계정 목록
          </h3>
          <span class="text-[10px] font-medium text-gray-400">행 클릭 시 상세 조회</span>
        </div>

        <div class="overflow-auto">
          <table class="w-full min-w-[820px] text-[13px]">
            <thead class="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th class="px-3 py-2.5 text-left font-bold">사원코드</th>
                <th class="px-3 py-2.5 text-left font-bold">이름</th>
                <th class="px-3 py-2.5 text-left font-bold">이메일</th>
                <th class="px-3 py-2.5 text-left font-bold">권한</th>
                <th class="px-3 py-2.5 text-left font-bold">담당 지점</th>
                <th class="px-3 py-2.5 text-left font-bold">신청일</th>
                <th class="px-3 py-2.5 text-left font-bold">상태</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 border-t border-gray-200">
              <tr
                v-for="m in visibleMembers"
                :key="m.id"
                class="cursor-pointer transition-colors hover:bg-gray-50/50"
                :class="{
                  'opacity-60': m.status === 'WITHDRAWN' || m.status === 'REJECTED',
                  'bg-[#eef7f4] hover:bg-[#e4f2ef]': selected?.id === m.id
                }"
                @click="openDetail(m)"
              >
                <td class="px-3 py-2.5 text-gray-500">{{ m.employeeCode ?? '-' }}</td>
                <td class="px-3 py-2.5 font-semibold text-gray-800">{{ m.name }}</td>
                <td class="px-3 py-2.5 text-gray-600">{{ m.email }}</td>
                <td class="px-3 py-2.5">
                  <span class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium" :class="roleStyle(m.role)">
                    <component :is="roleIcon(m.role)" :size="11" />
                    {{ roleLabel(m.role) }}
                  </span>
                </td>
                <td class="px-3 py-2.5 text-gray-600">
                  <span class="mr-1.5 border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">{{ m.locationCode }}</span>
                  {{ m.locationName }}
                </td>
                <td class="px-3 py-2.5 text-gray-500">{{ formatDateTime(m.appliedAt) }}</td>
                <td class="px-3 py-2.5">
                  <span class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium" :class="statusStyle(m.status)">
                    {{ statusLabel(m.status) }}
                  </span>
                </td>
              </tr>
              <tr v-if="visibleMembers.length === 0">
                <td colspan="7" class="px-3 py-10 text-center text-[13px] text-gray-400">조회된 계정이 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 페이지네이션 -->
        <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-2">
          <span class="text-[11px] font-medium text-gray-400">
            <template v-if="totalElements > 0">
              {{ (currentPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(currentPage * PAGE_SIZE, totalElements) }} / 전체 {{ totalElements }}건
            </template>
            <template v-else>0건</template>
          </span>
          <div class="flex items-center gap-1">
            <!-- << 이전 5페이지 그룹 -->
            <button
              type="button"
              :disabled="currentGroup === 1"
              class="flex h-7 w-7 items-center justify-center border border-gray-300 bg-white text-[12px] text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="goPrevGroup"
              title="이전 5페이지"
            >«</button>
            <!-- < 한 페이지 이전 -->
            <button
              type="button"
              :disabled="currentPage === 1"
              class="flex h-7 w-7 items-center justify-center border border-gray-300 bg-white text-[12px] text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="currentPage--"
              title="이전 페이지"
            >‹</button>
            <!-- 페이지 번호 (5개씩) -->
            <button
              v-for="p in visiblePages"
              :key="p"
              type="button"
              class="flex h-7 min-w-[28px] items-center justify-center border text-[12px] font-medium transition"
              :class="p === currentPage ? 'border-[#004D3C] bg-[#004D3C] text-white' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-100'"
              @click="currentPage = p"
            >{{ p }}</button>
            <!-- > 한 페이지 다음 -->
            <button
              type="button"
              :disabled="currentPage === totalPages"
              class="flex h-7 w-7 items-center justify-center border border-gray-300 bg-white text-[12px] text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="currentPage++"
              title="다음 페이지"
            >›</button>
            <!-- >> 다음 5페이지 그룹 -->
            <button
              type="button"
              :disabled="currentGroup === totalGroups"
              class="flex h-7 w-7 items-center justify-center border border-gray-300 bg-white text-[12px] text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="goNextGroup"
              title="다음 5페이지"
            >»</button>
          </div>
        </div>
      </section>

    </div>

    <!-- ── 상세 패널 슬라이드 ── -->
    <transition name="slide">
      <div
        v-if="selected"
        class="fixed inset-0 z-50 flex justify-end bg-black/20"
        @click.self="closeDetail"
      >
        <div class="detail-panel flex h-full w-[420px] flex-col border-l border-gray-300 bg-white shadow-2xl">

          <!-- 헤더 -->
          <div class="flex shrink-0 items-start justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <p class="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                {{ selected.employeeCode ?? '미발급' }} · 계정 상세
              </p>
              <h2 class="mt-1 text-[18px] font-bold text-gray-900">{{ selected.name }}</h2>
            </div>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center border border-gray-200 bg-white text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              @click="closeDetail"
            >
              <X :size="16" />
            </button>
          </div>

          <!-- 본문 -->
          <div class="flex flex-1 flex-col gap-5 overflow-y-auto p-4">

            <!-- 처리 성공 메시지 -->
            <div v-if="actionMessage" class="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] font-medium text-emerald-700">
              <CheckCircle2 :size="15" />
              {{ actionMessage }}
            </div>

            <!-- 탈퇴 경고 -->
            <div v-if="selected.status === 'WITHDRAWN'" class="flex items-center gap-2 border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-600">
              <AlertCircle :size="15" />
              탈퇴 처리된 계정입니다.
            </div>

            <!-- 기본 정보 -->
            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">기본 정보</p>
              <div class="divide-y divide-gray-100 border border-gray-200">
                <div v-for="(val, key) in {
                    '이메일': selected.email,
                    '전화번호': selected.phoneNumber,
                    '사원 코드': selected.employeeCode ?? '미발급',
                    '신청일': formatDateTime(selected.appliedAt),
                    '처리일': formatDateTime(selected.processedAt),
                  }"
                  :key="key"
                  class="flex items-center gap-3 px-3 py-2.5">
                  <span class="w-20 shrink-0 text-[11px] font-medium text-gray-400">{{ key }}</span>
                  <span class="text-[13px] text-gray-800">{{ val }}</span>
                </div>
              </div>
            </div>

            <!-- 담당 지점 -->
            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">담당 지점</p>
              <div class="divide-y divide-gray-100 border border-gray-200">
                <div class="flex items-center gap-3 px-3 py-2.5">
                  <span class="w-20 shrink-0 text-[11px] font-medium text-gray-400">지점 코드</span>
                  <span class="border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">{{ selected.locationCode }}</span>
                </div>
                <div class="flex items-center gap-3 px-3 py-2.5">
                  <span class="w-20 shrink-0 text-[11px] font-medium text-gray-400">지점명</span>
                  <span class="text-[13px] text-gray-800">{{ selected.locationName }}</span>
                </div>
              </div>
            </div>

            <!-- 권한 / 상태 -->
            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">권한 / 상태</p>
              <div class="divide-y divide-gray-100 border border-gray-200">
                <div class="flex items-center gap-3 px-3 py-2.5">
                  <span class="w-20 shrink-0 text-[11px] font-medium text-gray-400">권한</span>
                  <span class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium" :class="roleStyle(selected.role)">
                    <component :is="roleIcon(selected.role)" :size="11" />
                    {{ roleLabel(selected.role) }}
                  </span>
                </div>
                <div class="flex items-center gap-3 px-3 py-2.5">
                  <span class="w-20 shrink-0 text-[11px] font-medium text-gray-400">상태</span>
                  <span class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium" :class="statusStyle(selected.status)">
                    {{ statusLabel(selected.status) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 신청 사유 -->
            <div v-if="selected.applicationReason">
              <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">가입 신청 사유</p>
              <p class="border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13px] leading-relaxed text-gray-600">
                {{ selected.applicationReason }}
              </p>
            </div>

            <!-- 탈퇴 처리 (APPROVED 상태에서만) — 현재 점검 중으로 비활성화 -->
            <div v-if="selected.status === 'APPROVED'">
              <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">계정 탈퇴 처리</p>
              <p class="mb-3 text-[13px] text-gray-400">
                현재 계정 탈퇴 처리 기능은 점검 중입니다.
              </p>

              <button
                type="button"
                disabled
                class="inline-flex h-9 items-center gap-2 border border-gray-200 bg-gray-100 px-4 text-[13px] font-medium text-gray-400 cursor-not-allowed"
                title="계정 탈퇴 처리 기능 점검 중"
              >
                <LogOut :size="14" />
                계정 탈퇴 처리
              </button>
            </div>

          </div>

          <!-- 푸터 -->
          <div class="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
            <button type="button" class="h-9 border border-gray-300 bg-white px-5 text-[13px] font-medium text-gray-600 transition hover:bg-gray-50" @click="closeDetail">닫기</button>
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
