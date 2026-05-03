<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ClipboardList,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { accountApi } from '@/api/account.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

const activeSideMenu = ref('회원가입 승인')
const sideMenus = [
  { label: '회원가입 승인', path: '/hq/accounts/approvals' },
]
const activeTopMenu = computed(() => '계정 관리')

function handleLogout() {
  auth.logout()
  router.push('/login')
}

// ── BE에서 받아온 전체 회원 목록 (PENDING / APPROVED / REJECTED)
const requests = ref([])
const loading = ref(false)
const loadError = ref('')

const roleLabel = (r) => ({ HQ: '본사 관리자', STORE: '매장 관리자', WAREHOUSE: '창고 관리자' })[r] ?? r

/** 전체 회원 목록 조회 (status 별 필터는 화면에서 처리) */
async function loadAccounts() {
  loading.value = true
  loadError.value = ''
  try {
    const list = await accountApi.listAll()
    // BE 응답 → 화면 필드 형식 변환
    requests.value = list.map(item => ({
      id: item.id,                              // Long
      employeeCode: item.employeeCode,          // APPROVED만 채워져 있음
      name: item.name,
      email: item.email,
      phone: item.phoneNumber,
      storeCode: item.locationCode,
      storeName: item.locationName,
      role: item.role,                          // HQ / STORE / WAREHOUSE
      reason: item.applicationReason ?? '',
      requestedAt: item.appliedAt,
      processedAt: item.processedAt,            // 승인/거절 시각
      status: item.status,                      // PENDING / APPROVED / REJECTED
    }))
  } catch (err) {
    loadError.value = err?.message ?? '목록을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

onMounted(() => loadAccounts())

const filterStatus = ref('ALL')
const selectedRequest = ref(null)
const rejectReason = ref('')
const rejectReasonError = ref('')
const modalMode = ref(null) // 'approve' | 'reject' | null

const statusOptions = [
  { value: 'ALL',      label: '전체' },
  { value: 'PENDING',  label: '대기중' },
  { value: 'APPROVED', label: '승인완료' },
  { value: 'REJECTED', label: '거절됨' },
]

const filteredRequests = computed(() =>
  filterStatus.value === 'ALL'
    ? requests.value
    : requests.value.filter(r => r.status === filterStatus.value)
)

const pendingCount = computed(() => requests.value.filter(r => r.status === 'PENDING').length)

// 처리 컬럼은 PENDING이 보이는 화면(전체/대기중)에서만 노출
const showActionColumn = computed(() => filterStatus.value === 'ALL' || filterStatus.value === 'PENDING')

const statusLabel = (s) => ({ PENDING: '대기중', APPROVED: '승인완료', REJECTED: '거절됨' })[s] ?? s

const statusStyle = (s) => ({
  PENDING:  'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-red-50 text-red-600 border border-red-200',
})[s] ?? 'bg-gray-100 text-gray-500'

const statusIcon = (s) => ({ PENDING: Clock, APPROVED: CheckCircle2, REJECTED: XCircle })[s] ?? Clock

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
    await loadAccounts()
  } catch (err) {
    alert(err?.message ?? '승인에 실패했습니다.')
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
    await loadAccounts()
  } catch (err) {
    alert(err?.message ?? '거절에 실패했습니다.')
  }
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-3">

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

        <!-- 카드 헤더 + 필터 탭 -->
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-3 py-2.5">
          <h3 class="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
            <Users :size="16" />
            계정 신청 목록
          </h3>
          <div class="flex items-center gap-1">
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              type="button"
              class="inline-flex h-8 items-center gap-1.5 border px-3 text-[12px] font-medium transition"
              :class="filterStatus === opt.value
                ? 'border-gray-300 bg-white text-gray-900'
                : 'border-transparent bg-transparent text-gray-500 hover:bg-gray-100'"
              @click="filterStatus = opt.value"
            >
              {{ opt.label }}
              <span
                v-if="opt.value === 'PENDING' && pendingCount > 0"
                class="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
              >{{ pendingCount }}</span>
            </button>
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
                v-for="req in filteredRequests"
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
                      class="h-7 bg-emerald-500 px-3 text-[11px] font-medium text-white transition hover:bg-emerald-600"
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
              <tr v-if="filteredRequests.length === 0">
                <td :colspan="showActionColumn ? 8 : 7" class="px-3 py-10 text-center text-[13px] text-gray-400">조회된 신청이 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="border-t border-gray-200 bg-gray-50 px-3 py-2 text-[11px] font-medium text-gray-400">
          전체 {{ filteredRequests.length }}건
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
                <button type="button" class="inline-flex h-9 items-center gap-1.5 bg-emerald-500 px-5 text-[13px] font-medium text-white transition hover:bg-emerald-600" @click="modalMode = 'approve'">
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
                <button type="button" class="inline-flex h-9 items-center gap-1.5 bg-emerald-500 px-5 text-[13px] font-medium text-white transition hover:bg-emerald-600" @click="confirmApprove">
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
