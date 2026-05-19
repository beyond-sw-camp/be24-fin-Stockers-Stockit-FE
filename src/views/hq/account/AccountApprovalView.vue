<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ClipboardList,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  UserMinus,
  Search,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { accountApi } from '@/api/hq/account.js'
import { extractErrorMessage } from '@/api/axios.js'
const auth = useAuthStore()
const router = useRouter()
const hqMenus = roleMenus.hq

const activeSideMenu = ref('회원가입 승인')
const sideMenus = [
  { label: '회원가입 승인', path: '/hq/accounts/approvals' },
]
const activeTopMenu = computed(() => '계정 관리')

const roleLabel = (r) => ({ HQ: '본사 관리자', STORE: '매장 관리자', WAREHOUSE: '창고 관리자' })[r] ?? r

// ── 서버 페이징 결과 ({ content, totalElements, totalPages, number, size, ... })
const accountPage = ref(null)
const pendingCount = ref(0)         // PENDING 뱃지/배너용 별도 카운트
const loading = ref(false)
const loadError = ref('')

// ── 필터 + 검색 + 페이징 상태
const filterStatus = ref('ALL')     // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
const keyword = ref('')             // 이름/이메일/사원코드 검색어
const PAGE_SIZE = 20
const currentPage = ref(1)

const statusOptions = [
  { value: 'ALL',      label: '전체' },
  { value: 'PENDING',  label: '대기중' },
  { value: 'APPROVED', label: '승인완료' },
  { value: 'REJECTED', label: '거절됨' },
]

// BE content → 화면 필드 매핑 (storeCode/storeName/phone 등 기존 키 유지)
const requests = computed(() =>
  (accountPage.value?.content ?? []).map(item => ({
    id: item.id,
    employeeCode: item.employeeCode,
    name: item.name,
    email: item.email,
    phone: item.phoneNumber,
    storeCode: item.locationCode,
    storeName: item.locationName,
    role: item.role,
    reason: item.applicationReason ?? '',
    requestedAt: item.appliedAt,
    processedAt: item.processedAt,
    status: item.status,
  }))
)

const totalElements = computed(() => accountPage.value?.totalElements ?? 0)
const totalPages = computed(() => Math.max(1, accountPage.value?.totalPages ?? 1))

// ── BE 호출 — 현재 필터/검색어/페이지로 조회
async function loadAccounts() {
  loading.value = true
  loadError.value = ''
  try {
    accountPage.value = await accountApi.listAll({
      page: currentPage.value - 1,                                     // BE 는 0-based
      size: PAGE_SIZE,
      keyword: keyword.value.trim(),
      status: filterStatus.value === 'ALL' ? '' : filterStatus.value,  // 'ALL' 은 status 미전송
    })
  } catch (err) {
    loadError.value = extractErrorMessage(err, '목록을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

// PENDING 카운트 (탭 뱃지/배너용) — size=1 로 totalElements 만 가져옴
async function loadPendingCount() {
  try {
    const result = await accountApi.listAll({ page: 0, size: 1, status: 'PENDING' })
    pendingCount.value = result?.totalElements ?? 0
  } catch {
    pendingCount.value = 0
  }
}

// 검색어 입력 — 300ms 디바운스 후 첫 페이지로 BE 호출
let keywordDebounce = null
watch(keyword, () => {
  clearTimeout(keywordDebounce)
  keywordDebounce = setTimeout(() => {
    currentPage.value = 1
    loadAccounts()
  }, 300)
})

// 상태 필터 변경 — 즉시 첫 페이지로
watch(filterStatus, () => {
  currentPage.value = 1
  loadAccounts()
})

// 페이지 변경 — BE 재호출
watch(currentPage, () => loadAccounts())

const selectedRequest = ref(null)
const rejectReason = ref('')
const rejectReasonError = ref('')
const modalMode = ref(null) // 'approve' | 'reject' | null

/**
 * 페이지네이션 — 5개씩 그룹으로 표시
 *  버튼 구성: << <  1 2 3 4 5  > >>
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
  const prevGroupStart = Math.max(1, (currentGroup.value - 2) * PAGES_PER_GROUP + 1)
  currentPage.value = prevGroupStart
}

function goNextGroup() {
  const nextGroupStart = Math.min(totalPages.value, currentGroup.value * PAGES_PER_GROUP + 1)
  currentPage.value = nextGroupStart
}

// 필터 변경 — watch 가 currentPage=1 리셋 + BE 호출
function setFilterStatus(value) {
  filterStatus.value = value
}

// 컴포넌트 진입 시 필터 초기화 + 첫 페이지 + BE 호출
onMounted(() => {
  filterStatus.value = 'ALL'
  keyword.value = ''
  currentPage.value = 1
  loadAccounts()
  loadPendingCount()
})

// 처리 컬럼은 PENDING이 보이는 화면(전체/대기중)에서만 노출
const showActionColumn = computed(() => filterStatus.value === 'ALL' || filterStatus.value === 'PENDING')

const statusLabel = (s) => ({
  PENDING:   '대기중',
  APPROVED:  '승인완료',
  REJECTED:  '거절됨',
  WITHDRAWN: '탈퇴처리',
})[s] ?? s

const statusStyle = (s) => ({
  PENDING:   'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECTED:  'bg-red-50 text-red-600 border border-red-200',
  WITHDRAWN: 'bg-gray-100 text-gray-500 border border-gray-300',
})[s] ?? 'bg-gray-100 text-gray-500'

const statusIcon = (s) => ({
  PENDING:   Clock,
  APPROVED:  CheckCircle2,
  REJECTED:  XCircle,
  WITHDRAWN: UserMinus,
})[s] ?? Clock

/** ISO 8601 → 'YYYY-MM-DD HH:mm' */
const formatDateTime = (iso) => {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function openDetail(req) {
  selectedRequest.value = req
  modalMode.value = null
  rejectReason.value = ''
  rejectReasonError.value = ''
}

function closeDetail() {
  selectedRequest.value = null
  modalMode.value = null
}

async function confirmApprove() {
  if (!selectedRequest.value) return
  try {
    const result = await accountApi.approve(selectedRequest.value.id)
    alert(`승인 완료\n사원코드: ${result.employeeCode}`)
    closeDetail()
    // 목록 + PENDING 카운트 재조회 (탭 뱃지/배너 갱신)
    await Promise.all([loadAccounts(), loadPendingCount()])
  } catch (err) {
    alert(extractErrorMessage(err, '승인에 실패했습니다.'))
  }
}

async function confirmReject() {
  if (!rejectReason.value.trim()) {
    rejectReasonError.value = '거절 사유를 입력해주세요.'
    return
  }
  if (!selectedRequest.value) return
  try {
    await accountApi.reject(selectedRequest.value.id)
    closeDetail()
    await Promise.all([loadAccounts(), loadPendingCount()])
  } catch (err) {
    alert(extractErrorMessage(err, '거절에 실패했습니다.'))
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
            class="inline-flex flex-1 items-center justify-center gap-2 border-b-2 border-transparent px-4 py-3 text-[13px] font-semibold text-gray-500 transition hover:text-gray-700"
            @click="router.push('/hq/accounts')"
          >
            <Users :size="14" />
            계정 목록
          </button>
          <button
            type="button"
            class="inline-flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-[13px] font-semibold transition border-[#004D3C] text-[#004D3C]"
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
          <ClipboardList :size="18" />
          계정 신청 승인 관리
        </h2>
        <div v-if="pendingCount > 0" class="inline-flex items-center gap-2 border border-amber-200 bg-amber-50 px-3 py-1.5 text-[13px] font-medium text-amber-700">
          <AlertCircle :size="14" />
          미처리 신청 <strong class="font-bold">{{ pendingCount }}건</strong>
        </div>
      </section>

      <!-- 설명 배너 -->
      <p class="text-[13px] text-gray-500">
        직영점 점주가 신청한 계정을 검토하고 승인 또는 거절합니다. 승인 시 초기 비밀번호(생년월일)가 자동 부여됩니다.
      </p>

      <!-- 로딩 상태 -->
      <div v-if="loading" class="border border-gray-300 bg-white p-12 text-center text-[13px] text-gray-500">
        목록을 불러오는 중...
      </div>

      <!-- 에러 상태 -->
      <div v-else-if="loadError" class="border border-red-200 bg-red-50 p-4 text-[13px] text-red-600">
        {{ loadError }}
      </div>

      <!-- 테이블 카드 -->
      <section v-else class="border border-gray-300 bg-white shadow-sm">

        <!-- 카드 헤더 + 검색/필터 -->
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-3 py-2.5">
          <h3 class="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
            <Users :size="16" />
            계정 신청 목록
          </h3>
          <div class="flex flex-wrap items-center gap-2">
            <!-- 검색 입력 (이름/이메일/사원코드 — 300ms 디바운스, watch 가 BE 호출) -->
            <div class="relative flex items-center">
              <Search :size="13" class="absolute left-2.5 text-gray-400 pointer-events-none" />
              <input
                v-model="keyword"
                type="text"
                placeholder="이름/이메일/사원코드 검색"
                class="h-8 w-56 rounded-none border border-gray-300 bg-gray-50 pl-8 pr-3 text-[12px] text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#004D3C] focus:bg-white"
              />
            </div>
            <!-- 상태 필터 탭 -->
            <div class="flex items-center gap-1">
              <button
                v-for="opt in statusOptions"
                :key="opt.value"
                type="button"
                class="inline-flex h-8 items-center gap-1.5 border px-3 text-[12px] font-medium transition"
                :class="filterStatus === opt.value
                  ? 'border-gray-300 bg-white text-gray-900'
                  : 'border-transparent bg-transparent text-gray-500 hover:bg-gray-100'"
                @click="setFilterStatus(opt.value)"
              >
                {{ opt.label }}
                <span
                  v-if="opt.value === 'PENDING' && pendingCount > 0"
                  class="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
                >{{ pendingCount }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 테이블 -->
        <div class="overflow-auto">
          <table class="w-full min-w-[800px] text-[13px]">
            <thead class="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th class="px-3 py-2.5 text-left font-bold">신청 ID</th>
                <th class="px-3 py-2.5 text-left font-bold">신청자</th>
                <th class="px-3 py-2.5 text-left font-bold">이메일</th>
                <th class="px-3 py-2.5 text-left font-bold">권한</th>
                <th class="px-3 py-2.5 text-left font-bold">담당 매장</th>
                <th class="px-3 py-2.5 text-left font-bold">신청일시</th>
                <th class="px-3 py-2.5 text-left font-bold">상태</th>
                <th v-if="showActionColumn" class="px-3 py-2.5 text-left font-bold">처리</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 border-t border-gray-200">
              <tr
                v-for="req in requests"
                :key="req.id"
                class="cursor-pointer transition-colors hover:bg-gray-50/50"
                :class="{ 'bg-[#eef7f4] hover:bg-[#e4f2ef]': selectedRequest?.id === req.id }"
                @click="openDetail(req)"
              >
                <td class="px-3 py-2.5 text-gray-400">REQ-{{ String(req.id).padStart(4, '0') }}</td>
                <td class="px-3 py-2.5 font-semibold text-gray-800">{{ req.name }}</td>
                <td class="px-3 py-2.5 text-gray-600">{{ req.email }}</td>
                <td class="px-3 py-2.5 text-gray-600">{{ roleLabel(req.role) }}</td>
                <td class="px-3 py-2.5 text-gray-600">
                  <span class="mr-1.5 border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">{{ req.storeCode }}</span>
                  {{ req.storeName }}
                </td>
                <td class="px-3 py-2.5 text-gray-400">{{ formatDateTime(req.requestedAt) }}</td>
                <td class="px-3 py-2.5">
                  <span class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium" :class="statusStyle(req.status)">
                    <component :is="statusIcon(req.status)" :size="11" />
                    {{ statusLabel(req.status) }}
                  </span>
                </td>
                <td v-if="showActionColumn" class="px-3 py-2.5" @click.stop>
                  <div v-if="req.status === 'PENDING'" class="flex gap-1.5">
                    <button
                      type="button"
                      class="h-7 bg-emerald-50 px-3 text-[11px] font-medium text-emerald-700 border border-emerald-200 transition hover:bg-emerald-100"
                      @click="openDetail(req); modalMode = 'approve'"
                    >승인</button>
                    <button
                      type="button"
                      class="h-7 border border-gray-300 bg-white px-3 text-[11px] font-medium text-gray-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                      @click="openDetail(req); modalMode = 'reject'"
                    >거절</button>
                  </div>
                  <span v-else class="text-gray-300">—</span>
                </td>
              </tr>
              <tr v-if="requests.length === 0">
                <td :colspan="showActionColumn ? 8 : 7" class="px-3 py-10 text-center text-[13px] text-gray-400">조회된 신청이 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 페이지네이션 (한 페이지 30건) -->
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

    <!-- ── 상세 패널 ── -->
    <transition name="slide">
      <div
        v-if="selectedRequest"
        class="fixed inset-0 z-50 flex justify-end bg-black/20"
        @click.self="closeDetail"
      >
        <div class="detail-panel flex h-full w-[420px] flex-col border-l border-gray-300 bg-white shadow-2xl">

          <!-- 헤더 -->
          <div class="flex shrink-0 items-start justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <p class="text-[11px] font-bold uppercase tracking-widest text-gray-400">신청 상세 · REQ-{{ String(selectedRequest.id).padStart(4, '0') }}</p>
              <h2 class="mt-1 text-[18px] font-bold text-gray-900">{{ selectedRequest.name }}</h2>
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

            <!-- 현재 상태 -->
            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">처리 상태</p>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium" :class="statusStyle(selectedRequest.status)">
                  <component :is="statusIcon(selectedRequest.status)" :size="13" />
                  {{ statusLabel(selectedRequest.status) }}
                </span>
                <span v-if="selectedRequest.employeeCode" class="text-[12px] font-bold text-gray-700">
                  사원코드: {{ selectedRequest.employeeCode }}
                </span>
              </div>
              <p v-if="selectedRequest.processedAt" class="mt-1 text-[11px] text-gray-400">
                처리 일시: {{ formatDateTime(selectedRequest.processedAt) }}
              </p>
            </div>

            <!-- 신청자 정보 -->
            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">신청자 정보</p>
              <div class="divide-y divide-gray-100 border border-gray-200">
                <div v-for="(val, key) in { '이름': selectedRequest.name, '권한': roleLabel(selectedRequest.role), '이메일': selectedRequest.email, '전화번호': selectedRequest.phone }"
                  :key="key"
                  class="flex items-center gap-3 px-3 py-2.5">
                  <span class="w-20 shrink-0 text-[11px] font-medium text-gray-400">{{ key }}</span>
                  <span class="text-[13px] text-gray-800">{{ val }}</span>
                </div>
              </div>
            </div>

            <!-- 담당 매장 -->
            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">담당 매장</p>
              <div class="divide-y divide-gray-100 border border-gray-200">
                <div class="flex items-center gap-3 px-3 py-2.5">
                  <span class="w-20 shrink-0 text-[11px] font-medium text-gray-400">매장 코드</span>
                  <span class="border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">{{ selectedRequest.storeCode }}</span>
                </div>
                <div class="flex items-center gap-3 px-3 py-2.5">
                  <span class="w-20 shrink-0 text-[11px] font-medium text-gray-400">매장명</span>
                  <span class="text-[13px] text-gray-800">{{ selectedRequest.storeName }}</span>
                </div>
              </div>
            </div>

            <!-- 신청 사유 -->
            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">신청 사유</p>
              <p class="border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13px] leading-relaxed text-gray-600">
                {{ selectedRequest.reason || '(작성된 사유 없음)' }}
              </p>
            </div>

            <!-- 승인 시 안내 -->
            <div v-if="selectedRequest.status === 'PENDING' && modalMode === 'approve'">
              <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">승인 처리 안내</p>
              <div class="border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12px] leading-relaxed text-emerald-800">
                승인 시 권한별 사원코드가 자동 발급됩니다. (HQ → hq0001, STORE → st0001, WAREHOUSE → wa0001)
              </div>
            </div>

            <!-- 거절 사유 입력 -->
            <div v-if="modalMode === 'reject'">
              <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                거절 사유 <em class="not-italic text-red-500">*</em>
              </p>
              <textarea
                v-model="rejectReason"
                rows="3"
                placeholder="거절 사유를 입력해주세요. 해당 내용이 신청자에게 전달됩니다."
                class="w-full resize-none border bg-gray-50 px-3 py-2.5 text-[13px] text-gray-800 outline-none transition placeholder:text-gray-400 focus:bg-white"
                :class="rejectReasonError ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-[#004D3C]'"
                @input="rejectReasonError = ''"
              />
              <p v-if="rejectReasonError" class="mt-1 text-[12px] font-medium text-red-500">{{ rejectReasonError }}</p>
            </div>

          </div>

          <!-- 처리 버튼 푸터 -->
          <div class="shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-3">

            <!-- PENDING: 기본 상태 -->
            <template v-if="selectedRequest.status === 'PENDING' && modalMode === null">
              <div class="flex justify-end gap-2">
                <button type="button" class="inline-flex h-9 items-center gap-1.5 border border-red-200 bg-red-50 px-5 text-[13px] font-medium text-red-600 transition hover:bg-red-100" @click="modalMode = 'reject'">
                  <XCircle :size="14" />
                  거절
                </button>
                <button type="button" class="inline-flex h-9 items-center gap-1.5 bg-emerald-50 px-5 text-[13px] font-medium text-emerald-700 border border-emerald-200 transition hover:bg-emerald-100" @click="modalMode = 'approve'">
                  <CheckCircle2 :size="14" />
                  승인
                </button>
              </div>
            </template>

            <!-- PENDING: 승인 확인 -->
            <template v-else-if="modalMode === 'approve'">
              <div class="mb-3 flex items-center gap-2 border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-700">
                <AlertCircle :size="14" />
                승인하면 계정이 즉시 생성됩니다. 계속하시겠습니까?
              </div>
              <div class="flex justify-end gap-2">
                <button type="button" class="h-9 border border-gray-300 bg-white px-5 text-[13px] font-medium text-gray-600 transition hover:bg-gray-50" @click="modalMode = null">취소</button>
                <button type="button" class="inline-flex h-9 items-center gap-1.5 bg-emerald-50 px-5 text-[13px] font-medium text-emerald-700 border border-emerald-200 transition hover:bg-emerald-100" @click="confirmApprove">
                  <CheckCircle2 :size="14" />
                  최종 승인
                </button>
              </div>
            </template>

            <!-- PENDING: 거절 확인 -->
            <template v-else-if="modalMode === 'reject'">
              <div class="flex justify-end gap-2">
                <button type="button" class="h-9 border border-gray-300 bg-white px-5 text-[13px] font-medium text-gray-600 transition hover:bg-gray-50" @click="modalMode = null">취소</button>
                <button type="button" class="inline-flex h-9 items-center gap-1.5 border border-red-200 bg-red-50 px-5 text-[13px] font-medium text-red-600 transition hover:bg-red-100" @click="confirmReject">
                  <XCircle :size="14" />
                  거절 확정
                </button>
              </div>
            </template>

            <!-- 이미 처리 완료 -->
            <template v-else>
              <div class="flex justify-center">
                <span class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium" :class="statusStyle(selectedRequest.status)">
                  <component :is="statusIcon(selectedRequest.status)" :size="14" />
                  {{ statusLabel(selectedRequest.status) }} 처리 완료
                </span>
              </div>
            </template>

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
