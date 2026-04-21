<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  Users,
  Search,
  RotateCcw,
  X,
  Pencil,
  Save,
  AlertCircle,
  CheckCircle2,
  LogOut,
  ShieldAlert,
  Store,
  Warehouse,
  Crown,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

const activeSideMenu = ref('계정 목록')
const sideMenus = [
  { label: '계정 목록', path: '/hq/account/accountlist' },
]

const activeTopMenu = computed(() => '계정 관리')

function handleLogout() {
  auth.logout()
  router.push('/login')
}

// ── 목업 데이터
const members = ref([
  { id: 'MB-001', name: '이민준', email: 'minjun@stockit.com', phone: '010-1234-5678', birthdate: '1990-03-15', role: 'STORE_OWNER', position: '점장', storeCode: 'ST003', storeName: '판교 테크노점', contractStart: '2026-01-01', contractEnd: '2027-01-01', joinedAt: '2026-01-03', active: true },
  { id: 'MB-002', name: '박지수', email: 'jisoo@stockit.com', phone: '010-9876-5432', birthdate: '1988-11-02', role: 'WAREHOUSE', position: '창고 책임자', storeCode: 'ST005', storeName: '인천 제1물류센터', contractStart: '2026-02-01', contractEnd: '2027-02-01', joinedAt: '2026-02-04', active: true },
  { id: 'MB-003', name: '김도현', email: 'dohyun@stockit.com', phone: '010-5555-1234', birthdate: '1992-07-28', role: 'STORE_OWNER', position: '점장', storeCode: 'ST002', storeName: '성수 직영점', contractStart: '2026-01-15', contractEnd: '2027-01-15', joinedAt: '2026-01-17', active: true },
  { id: 'MB-004', name: '최수연', email: 'sooyeon@stockit.com', phone: '010-3333-7890', birthdate: '1985-05-19', role: 'STORE_OWNER', position: '부점장', storeCode: 'ST007', storeName: '부산 중앙창고', contractStart: '2025-06-01', contractEnd: '2026-06-01', joinedAt: '2025-06-03', active: false },
  { id: 'MB-005', name: '이선엽', email: 'sunyeop@stockit.com', phone: '010-2222-3333', birthdate: '1991-09-11', role: 'MASTER', position: '중앙관리자', storeCode: '—', storeName: '본사', contractStart: '2024-01-01', contractEnd: '2026-12-31', joinedAt: '2024-01-02', active: true },
  { id: 'MB-006', name: '박범수', email: 'bumsoo@stockit.com', phone: '010-4444-5555', birthdate: '1987-02-23', role: 'WAREHOUSE', position: '창고 책임자', storeCode: 'ST001', storeName: '강남 서초점', contractStart: '2026-03-01', contractEnd: '2027-03-01', joinedAt: '2026-03-02', active: true },
])

// ── 필터
const filter = reactive({ email: '', role: '', active: '' })
const PAGE_SIZE = 10
const currentPage = ref(1)

const roleOptions = [
  { value: '', label: '전체 권한' },
  { value: 'STORE_OWNER', label: '직영점 점주' },
  { value: 'WAREHOUSE', label: '물류 창고 관리자' },
  { value: 'MASTER', label: '마스터' },
]
const activeOptions = [
  { value: '', label: '전체 상태' },
  { value: 'true', label: '활성' },
  { value: 'false', label: '비활성 (탈퇴)' },
]

const roleLabel = (r) => ({ STORE_OWNER: '직영점 점주', WAREHOUSE: '물류 창고 관리자', MASTER: '마스터' })[r] ?? r

const roleStyle = (r) => ({
  STORE_OWNER: 'bg-blue-50 text-blue-700 border border-blue-200',
  WAREHOUSE:   'bg-purple-50 text-purple-700 border border-purple-200',
  MASTER:      'bg-[#eef7f4] text-[#004D3C] border border-[#cfe2dc]',
})[r] ?? 'bg-gray-100 text-gray-600'

const roleIcon = (r) => ({ STORE_OWNER: Store, WAREHOUSE: Warehouse, MASTER: Crown })[r] ?? Users

const filtered = computed(() =>
  members.value.filter(m => {
    if (filter.email && !m.email.includes(filter.email.trim())) return false
    if (filter.role && m.role !== filter.role) return false
    if (filter.active !== '' && m.active !== (filter.active === 'true')) return false
    return true
  })
)

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))

const paginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

function resetFilter() {
  filter.email = ''
  filter.role = ''
  filter.active = ''
  currentPage.value = 1
}

// ── 상세 패널
const selected = ref(null)
const isEditing = ref(false)
const editForm = reactive({ role: '', position: '', active: true })
const editErrors = reactive({ position: '' })
const withdrawConfirm = ref(false)
const saveSuccess = ref(false)

function openDetail(member) {
  selected.value = member
  isEditing.value = false
  withdrawConfirm.value = false
  saveSuccess.value = false
  Object.assign(editForm, { role: member.role, position: member.position, active: member.active })
}

function closeDetail() {
  selected.value = null
  isEditing.value = false
  withdrawConfirm.value = false
  saveSuccess.value = false
}

function startEdit() {
  isEditing.value = true
  saveSuccess.value = false
  editErrors.position = ''
  Object.assign(editForm, { role: selected.value.role, position: selected.value.position, active: selected.value.active })
}

function cancelEdit() {
  isEditing.value = false
  editErrors.position = ''
}

function saveEdit() {
  editErrors.position = ''
  if (!editForm.position.trim()) {
    editErrors.position = '직책을 입력해주세요.'
    return
  }
  selected.value.role = editForm.role
  selected.value.position = editForm.position
  selected.value.active = editForm.active
  isEditing.value = false
  saveSuccess.value = true
}

function confirmWithdraw() {
  if (!selected.value) return
  selected.value.active = false
  editForm.active = false
  withdrawConfirm.value = false
  saveSuccess.value = false
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
          <Users :size="18" />
          계정 목록
        </h2>
        <div class="flex items-center gap-2">
          <div class="inline-flex items-center gap-1.5 border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
            전체 <span class="font-bold text-gray-800">{{ members.length }}</span>명
          </div>
          <div class="inline-flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
            활성 <span class="font-bold">{{ members.filter(m => m.active).length }}</span>
          </div>
          <div class="inline-flex items-center gap-1.5 border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-400">
            비활성 <span class="font-bold">{{ members.filter(m => !m.active).length }}</span>
          </div>
        </div>
      </section>

      <!-- 필터 바 -->
      <section class="flex flex-wrap items-center gap-2 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="relative flex items-center">
          <Search :size="13" class="absolute left-2.5 text-gray-400 pointer-events-none" />
          <input
            v-model="filter.email"
            type="text"
            placeholder="이메일 검색"
            class="h-9 w-52 rounded-none border border-gray-300 bg-gray-50 pl-8 pr-3 text-[13px] text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#004D3C] focus:bg-white"
            @input="currentPage = 1"
          />
        </div>
        <select
          v-model="filter.role"
          class="h-9 rounded-none border border-gray-300 bg-gray-50 px-3 text-[13px] text-gray-700 outline-none transition focus:border-[#004D3C] focus:bg-white"
          @change="currentPage = 1"
        >
          <option v-for="o in roleOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <select
          v-model="filter.active"
          class="h-9 rounded-none border border-gray-300 bg-gray-50 px-3 text-[13px] text-gray-700 outline-none transition focus:border-[#004D3C] focus:bg-white"
          @change="currentPage = 1"
        >
          <option v-for="o in activeOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <button
          type="button"
          class="inline-flex h-9 items-center gap-1.5 border border-gray-300 bg-white px-3 text-[13px] font-medium text-gray-500 transition hover:bg-gray-50"
          @click="resetFilter"
        >
          <RotateCcw :size="13" />
          초기화
        </button>
        <span class="text-[12px] font-medium text-gray-400">{{ filtered.length }}건</span>
      </section>

      <!-- 테이블 카드 -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center justify-between gap-3 border-b border-gray-200 px-3 py-2.5">
          <h3 class="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
            <Users :size="16" />
            계정 목록
          </h3>
          <span class="text-[10px] font-medium text-gray-400">행 클릭 시 상세 조회</span>
        </div>

        <div class="overflow-auto">
          <table class="w-full min-w-[760px] text-[13px]">
            <thead class="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th class="px-3 py-2.5 text-left font-bold">계정 ID</th>
                <th class="px-3 py-2.5 text-left font-bold">이름</th>
                <th class="px-3 py-2.5 text-left font-bold">이메일</th>
                <th class="px-3 py-2.5 text-left font-bold">권한</th>
                <th class="px-3 py-2.5 text-left font-bold">직책</th>
                <th class="px-3 py-2.5 text-left font-bold">담당 매장</th>
                <th class="px-3 py-2.5 text-left font-bold">가입일</th>
                <th class="px-3 py-2.5 text-left font-bold">상태</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 border-t border-gray-200">
              <tr
                v-for="m in paginated"
                :key="m.id"
                class="cursor-pointer transition-colors hover:bg-gray-50/50"
                :class="{
                  'opacity-50': !m.active,
                  'bg-[#eef7f4] hover:bg-[#e4f2ef]': selected?.id === m.id
                }"
                @click="openDetail(m)"
              >
                <td class="px-3 py-2.5 text-gray-400">{{ m.id }}</td>
                <td class="px-3 py-2.5 font-semibold text-gray-800">{{ m.name }}</td>
                <td class="px-3 py-2.5 text-gray-600">{{ m.email }}</td>
                <td class="px-3 py-2.5">
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium"
                    :class="roleStyle(m.role)"
                  >
                    <component :is="roleIcon(m.role)" :size="11" />
                    {{ roleLabel(m.role) }}
                  </span>
                </td>
                <td class="px-3 py-2.5 text-gray-600">{{ m.position }}</td>
                <td class="px-3 py-2.5 text-gray-600">
                  <span class="mr-1.5 border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">{{ m.storeCode }}</span>
                  {{ m.storeName }}
                </td>
                <td class="px-3 py-2.5 text-gray-500">{{ m.joinedAt }}</td>
                <td class="px-3 py-2.5">
                  <span class="inline-flex items-center gap-1.5 text-[12px] font-medium" :class="m.active ? 'text-emerald-600' : 'text-gray-400'">
                    <span class="h-1.5 w-1.5 rounded-full" :class="m.active ? 'bg-emerald-500' : 'bg-gray-300'" />
                    {{ m.active ? '활성' : '비활성' }}
                  </span>
                </td>
              </tr>
              <tr v-if="paginated.length === 0">
                <td colspan="8" class="px-3 py-10 text-center text-[13px] text-gray-400">조회된 계정이 없습니다.</td>
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
              class="flex h-7 w-7 items-center justify-center border border-gray-300 bg-white text-[12px] text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="currentPage--"
            >‹</button>
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
              class="flex h-7 w-7 items-center justify-center border border-gray-300 bg-white text-[12px] text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="currentPage++"
            >›</button>
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
              <p class="text-[11px] font-bold uppercase tracking-widest text-gray-400">{{ selected.id }} · 계정 상세</p>
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

            <!-- 저장 성공 -->
            <div v-if="saveSuccess" class="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] font-medium text-emerald-700">
              <CheckCircle2 :size="15" />
              계정 정보가 수정되었습니다.
            </div>

            <!-- 비활성 경고 -->
            <div v-if="!selected.active" class="flex items-center gap-2 border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-600">
              <AlertCircle :size="15" />
              탈퇴 처리된 계정입니다. 수정이 제한됩니다.
            </div>

            <!-- 기본 정보 -->
            <div>
              <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">기본 정보</p>
              <div class="divide-y divide-gray-100 border border-gray-200">
                <div v-for="(val, key) in { '이메일': selected.email, '전화번호': selected.phone, '생년월일': selected.birthdate, '가입일': selected.joinedAt }"
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
                  <span class="border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">{{ selected.storeCode }}</span>
                </div>
                <div class="flex items-center gap-3 px-3 py-2.5">
                  <span class="w-20 shrink-0 text-[11px] font-medium text-gray-400">매장명</span>
                  <span class="text-[13px] text-gray-800">{{ selected.storeName }}</span>
                </div>
                <div class="flex items-center gap-3 px-3 py-2.5">
                  <span class="w-20 shrink-0 text-[11px] font-medium text-gray-400">계약 기간</span>
                  <span class="text-[13px] text-gray-800">{{ selected.contractStart }} ~ {{ selected.contractEnd }}</span>
                </div>
              </div>
            </div>

            <!-- 수정 가능 항목 -->
            <div>
              <div class="mb-2 flex items-center justify-between">
                <p class="text-[11px] font-bold uppercase tracking-widest text-gray-400">권한 / 직책</p>
                <span class="text-[10px] font-medium text-gray-400">마스터만 수정 가능</span>
              </div>

              <!-- 읽기 모드 -->
              <div v-if="!isEditing" class="divide-y divide-gray-100 border border-gray-200">
                <div class="flex items-center gap-3 px-3 py-2.5">
                  <span class="w-20 shrink-0 text-[11px] font-medium text-gray-400">권한</span>
                  <span class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium" :class="roleStyle(selected.role)">
                    <component :is="roleIcon(selected.role)" :size="11" />
                    {{ roleLabel(selected.role) }}
                  </span>
                </div>
                <div class="flex items-center gap-3 px-3 py-2.5">
                  <span class="w-20 shrink-0 text-[11px] font-medium text-gray-400">직책</span>
                  <span class="text-[13px] text-gray-800">{{ selected.position }}</span>
                </div>
                <div class="flex items-center gap-3 px-3 py-2.5">
                  <span class="w-20 shrink-0 text-[11px] font-medium text-gray-400">상태</span>
                  <span class="inline-flex items-center gap-1.5 text-[12px] font-medium" :class="selected.active ? 'text-emerald-600' : 'text-gray-400'">
                    <span class="h-1.5 w-1.5 rounded-full" :class="selected.active ? 'bg-emerald-500' : 'bg-gray-300'" />
                    {{ selected.active ? '활성' : '비활성 (탈퇴)' }}
                  </span>
                </div>
              </div>

              <!-- 편집 모드 -->
              <div v-else class="flex flex-col gap-4 border border-gray-200 p-4">
                <div class="flex flex-col gap-1.5">
                  <label class="text-[11px] font-bold uppercase tracking-widest text-gray-500">권한</label>
                  <select
                    v-model="editForm.role"
                    class="h-10 border border-gray-300 bg-gray-50 px-3 text-[13px] text-gray-800 outline-none transition focus:border-[#004D3C] focus:bg-white"
                  >
                    <option v-for="o in roleOptions.slice(1)" :key="o.value" :value="o.value">{{ o.label }}</option>
                  </select>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[11px] font-bold uppercase tracking-widest text-gray-500">직책</label>
                  <input
                    v-model="editForm.position"
                    type="text"
                    placeholder="예) 점장, 부점장"
                    class="h-10 border bg-gray-50 px-3 text-[13px] text-gray-800 outline-none transition focus:bg-white"
                    :class="editErrors.position ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#004D3C]'"
                    @input="editErrors.position = ''"
                  />
                  <p v-if="editErrors.position" class="text-[12px] font-medium text-red-500">{{ editErrors.position }}</p>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[11px] font-bold uppercase tracking-widest text-gray-500">활성 상태</label>
                  <label class="inline-flex cursor-pointer items-center gap-3">
                    <input v-model="editForm.active" type="checkbox" class="hidden" />
                    <span class="toggle-track relative h-5 w-9 border transition-all" :class="editForm.active ? 'bg-[#004D3C] border-[#004D3C]' : 'bg-gray-200 border-gray-300'">
                      <span class="toggle-thumb absolute top-[3px] h-3 w-3 bg-white transition-transform" :class="editForm.active ? 'translate-x-[19px]' : 'translate-x-[3px]'" />
                    </span>
                    <span class="text-[13px] font-medium text-gray-700">{{ editForm.active ? '활성' : '비활성' }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- 탈퇴 처리 -->
            <div v-if="selected.active && !isEditing">
              <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-red-500">계정 탈퇴 처리</p>
              <p class="mb-3 text-[13px] text-gray-500">탈퇴 처리 시 계정이 즉시 비활성화됩니다. 복구하려면 수정 기능을 이용하세요.</p>

              <div v-if="withdrawConfirm" class="border border-red-200 bg-red-50 p-4">
                <p class="mb-3 text-[13px] font-medium text-red-700">
                  정말 탈퇴 처리하시겠습니까? <strong>{{ selected.name }}</strong> 계정이 비활성화됩니다.
                </p>
                <div class="flex gap-2">
                  <button type="button" class="h-9 border border-gray-300 bg-white px-4 text-[13px] font-medium text-gray-600 transition hover:bg-gray-50" @click="withdrawConfirm = false">취소</button>
                  <button type="button" class="h-9 bg-red-600 px-4 text-[13px] font-medium text-white transition hover:bg-red-700" @click="confirmWithdraw">탈퇴 확정</button>
                </div>
              </div>
              <button
                v-else
                type="button"
                class="inline-flex h-9 items-center gap-2 border border-red-300 bg-white px-4 text-[13px] font-medium text-red-600 transition hover:bg-red-50"
                @click="withdrawConfirm = true"
              >
                <LogOut :size="14" />
                계정 탈퇴 처리
              </button>
            </div>

          </div>

          <!-- 푸터 -->
          <div class="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
            <template v-if="!isEditing">
              <button
                v-if="selected.active"
                type="button"
                class="inline-flex h-9 items-center gap-2 bg-[#004D3C] px-5 text-[13px] font-medium text-white transition hover:bg-[#003d30]"
                @click="startEdit"
              >
                <Pencil :size="14" />
                정보 수정
              </button>
              <button type="button" class="h-9 border border-gray-300 bg-white px-5 text-[13px] font-medium text-gray-600 transition hover:bg-gray-50" @click="closeDetail">닫기</button>
            </template>
            <template v-else>
              <button type="button" class="h-9 border border-gray-300 bg-white px-5 text-[13px] font-medium text-gray-600 transition hover:bg-gray-50" @click="cancelEdit">취소</button>
              <button type="button" class="inline-flex h-9 items-center gap-2 bg-[#004D3C] px-5 text-[13px] font-medium text-white transition hover:bg-[#003d30]" @click="saveEdit">
                <Save :size="14" />
                저장
              </button>
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
