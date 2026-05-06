<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Building2,
  Store,
  Warehouse,
  Mail,
  IdCard,
  MapPin,
  ShieldCheck,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Phone,
  KeyRound,
  Pencil,
  X,
  Eye,
  EyeOff,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus, roleHomeMap } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { userApi } from '@/api/user/user.js'
import { extractErrorMessage } from '@/api/axios.js'

const router = useRouter()
const auth = useAuthStore()

// ─────────── BE 데이터 로드 ───────────
const profile = ref(null)
const loading = ref(false)
const loadError = ref('')

async function loadProfile() {
  loading.value = true
  loadError.value = ''
  try {
    profile.value = await userApi.getMypage()
  } catch (err) {
    loadError.value = extractErrorMessage(err, '내 정보를 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}
onMounted(() => loadProfile())

// ─────────── 권한별 차별화 ───────────
// 색상은 본사 그린(#004D3C) 으로 통일하고, 아이콘/라벨만 권한별로 다르게 적용.
const BRAND_COLOR = {
  header: 'from-[#004D3C] to-[#0A6E58]',
  badge: 'bg-[#eef7f4] text-[#004D3C] border-[#cfe2dc]',
  accent: 'text-[#004D3C]',
  btnPrimary: 'bg-[#004D3C] hover:bg-[#0A6E58]',
  ring: 'focus:border-[#004D3C]',
}

const ROLE_PROFILE = {
  HQ: {
    label: '본사 관리자',
    icon: Building2,
    locationLabel: { code: '본사 코드', name: '본사명' },
    color: BRAND_COLOR,
  },
  STORE: {
    label: '매장 관리자',
    icon: Store,
    locationLabel: { code: '매장 코드', name: '매장명' },
    color: BRAND_COLOR,
  },
  WAREHOUSE: {
    label: '물류 창고 관리자',
    icon: Warehouse,
    locationLabel: { code: '창고 코드', name: '창고명' },
    color: BRAND_COLOR,
  },
}
const roleKey = computed(() => (profile.value?.role ?? '').toUpperCase())
const roleProfile = computed(() => ROLE_PROFILE[roleKey.value] ?? ROLE_PROFILE.HQ)

const statusLabel = (s) => ({
  PENDING: '승인 대기',
  APPROVED: '활성',
  REJECTED: '거절됨',
  WITHDRAWN: '탈퇴',
})[s] ?? s
const statusStyle = (s) => ({
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED:  'bg-red-50 text-red-700 border-red-200',
  WITHDRAWN: 'bg-gray-100 text-gray-500 border-gray-300',
})[s] ?? 'bg-gray-100 text-gray-600'

const initials = computed(() => {
  const n = profile.value?.name ?? ''
  return n.slice(-2).toUpperCase() || 'US'
})

// 전화번호 표시용 (010-1234-5678 형태로 렌더)
const phoneDisplay = (raw) => {
  if (!raw) return '-'
  const digits = String(raw).replace(/\D/g, '')
  if (digits.length === 11) return `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7)}`
  if (digits.length === 10) return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`
  return raw
}

// ─────────── 전화번호 인라인 수정 ───────────
const PHONE_REGEX = /^010\d{8}$/
const editingPhone = ref(false)
const phoneInput = ref('')
const phoneError = ref('')
const updatingPhone = ref(false)

function startEditPhone() {
  phoneInput.value = profile.value?.phoneNumber ?? ''
  phoneError.value = ''
  editingPhone.value = true
}
function cancelEditPhone() {
  editingPhone.value = false
  phoneError.value = ''
}
async function submitEditPhone() {
  const v = phoneInput.value.trim().replace(/\D/g, '')   // 숫자만
  if (!PHONE_REGEX.test(v)) {
    phoneError.value = '하이픈(-) 없이 010 으로 시작하는 11자리 숫자를 입력해주세요.'
    return
  }
  updatingPhone.value = true
  phoneError.value = ''
  try {
    profile.value = await userApi.updatePhone(v)
    editingPhone.value = false
  } catch (err) {
    phoneError.value = extractErrorMessage(err, '전화번호 변경에 실패했습니다.')
  } finally {
    updatingPhone.value = false
  }
}

// ─────────── 비밀번호 변경 모달 ───────────
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/
const showPasswordModal = ref(false)
const pwForm = reactive({ current: '', next: '', confirm: '' })
const showPw = reactive({ current: false, next: false, confirm: false })
const pwError = ref('')
const updatingPw = ref(false)

function openPasswordModal() {
  pwForm.current = ''
  pwForm.next = ''
  pwForm.confirm = ''
  showPw.current = false
  showPw.next = false
  showPw.confirm = false
  pwError.value = ''
  showPasswordModal.value = true
}
function closePasswordModal() {
  if (updatingPw.value) return
  showPasswordModal.value = false
}
async function submitPasswordChange() {
  if (!pwForm.current) {
    pwError.value = '현재 비밀번호를 입력해주세요.'
    return
  }
  if (!PASSWORD_REGEX.test(pwForm.next)) {
    pwError.value = '새 비밀번호는 대소문자, 숫자, 특수문자(!@#$%^&*)를 포함한 8자 이상이어야 합니다.'
    return
  }
  if (pwForm.next !== pwForm.confirm) {
    pwError.value = '새 비밀번호와 확인이 일치하지 않습니다.'
    return
  }
  if (pwForm.current === pwForm.next) {
    pwError.value = '새 비밀번호가 기존 비밀번호와 동일합니다.'
    return
  }

  updatingPw.value = true
  pwError.value = ''
  try {
    await userApi.updatePassword({
      currentPassword: pwForm.current,
      newPassword: pwForm.next,
    })
    // BE 가 모든 Refresh Token 을 삭제했으므로 로컬 상태도 정리하고 /login 으로 이동
    alert('비밀번호가 변경되었습니다. 보안을 위해 다시 로그인해주세요.')
    auth.logout()
    router.push('/login')
  } catch (err) {
    pwError.value = extractErrorMessage(err, '비밀번호 변경에 실패했습니다.')
  } finally {
    updatingPw.value = false
  }
}

// ─────────── AppLayout props ───────────
const feRoleKey = computed(() => (auth.user?.role ?? '').toLowerCase())
const topMenus = computed(() => roleMenus[feRoleKey.value] ?? [])
const sideMenus = ref([])
const activeSideMenu = ref('')

function handleLogout() {
  auth.logout()
  router.push('/login')
}
function goHome() {
  const homePath = roleHomeMap[feRoleKey.value]
  if (homePath) router.push(homePath)
}
</script>

<template>
  <AppLayout
    :active-top-menu="''"
    :top-menus="topMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">

      <!-- 뒤로가기 -->
      <button
        type="button"
        class="inline-flex w-fit items-center gap-1.5 text-[12px] font-medium text-gray-500 transition hover:text-gray-800"
        @click="goHome"
      >
        <ArrowLeft :size="14" />
        대시보드로 돌아가기
      </button>

      <!-- 로딩 / 에러 -->
      <div v-if="loading" class="border border-gray-300 bg-white p-12 text-center text-[13px] text-gray-500">
        내 정보를 불러오는 중...
      </div>
      <div v-else-if="loadError" class="flex items-center gap-2 border border-red-200 bg-red-50 p-4 text-[13px] text-red-600">
        <AlertCircle :size="16" />
        {{ loadError }}
      </div>

      <!-- 프로필 -->
      <template v-else-if="profile">
        <!-- 헤더 카드 -->
        <section
          class="overflow-hidden border border-gray-300 shadow-sm bg-gradient-to-r"
          :class="roleProfile.color.header"
        >
          <div class="flex items-center gap-4 p-6 text-white">
            <div class="flex h-16 w-16 shrink-0 items-center justify-center bg-white/20 text-[18px] font-bold backdrop-blur">
              {{ initials }}
            </div>
            <div class="flex flex-col gap-1">
              <h1 class="text-[22px] font-bold leading-tight">{{ profile.name }}</h1>
              <div class="inline-flex items-center gap-2 text-[13px] text-white/90">
                <component :is="roleProfile.icon" :size="14" />
                {{ roleProfile.label }}
                <span class="text-white/50">·</span>
                <span class="font-mono text-white/80">{{ profile.employeeCode ?? '미발급' }}</span>
              </div>
            </div>
            <div class="ml-auto">
              <span
                class="inline-flex items-center gap-1.5 border bg-white/95 px-3 py-1 text-[11px] font-semibold"
                :class="statusStyle(profile.status)"
              >
                <CheckCircle2 v-if="profile.status === 'APPROVED'" :size="12" />
                {{ statusLabel(profile.status) }}
              </span>
            </div>
          </div>
        </section>

        <!-- 기본 정보 -->
        <section class="border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 class="inline-flex items-center gap-2 text-[14px] font-semibold text-gray-800">
              <IdCard :size="15" :class="roleProfile.color.accent" />
              기본 정보
            </h2>
          </div>
          <dl class="divide-y divide-gray-100">
            <div class="grid grid-cols-[140px_1fr] items-center px-4 py-3">
              <dt class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                <IdCard :size="12" />
                사원 코드
              </dt>
              <dd class="font-mono text-[13px] text-gray-800">
                {{ profile.employeeCode ?? '미발급' }}
              </dd>
            </div>
            <div class="grid grid-cols-[140px_1fr] items-center px-4 py-3">
              <dt class="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                이름
              </dt>
              <dd class="text-[13px] font-semibold text-gray-800">
                {{ profile.name }}
              </dd>
            </div>
            <div class="grid grid-cols-[140px_1fr] items-center px-4 py-3">
              <dt class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                <Mail :size="12" />
                이메일
              </dt>
              <dd class="text-[13px] text-gray-800">
                {{ profile.email }}
              </dd>
            </div>

            <!-- 전화번호 (인라인 수정) -->
            <div class="grid grid-cols-[140px_1fr] items-start px-4 py-3">
              <dt class="inline-flex items-center gap-1.5 pt-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                <Phone :size="12" />
                전화번호
              </dt>
              <dd>
                <!-- 보기 모드 -->
                <div v-if="!editingPhone" class="flex items-center gap-2">
                  <span class="text-[13px] text-gray-800">{{ phoneDisplay(profile.phoneNumber) }}</span>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 border border-gray-300 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600 transition hover:bg-gray-50"
                    @click="startEditPhone"
                  >
                    <Pencil :size="11" />
                    수정
                  </button>
                </div>
                <!-- 편집 모드 -->
                <div v-else class="flex flex-col gap-1.5">
                  <div class="flex items-center gap-2">
                    <input
                      v-model="phoneInput"
                      type="text"
                      inputmode="numeric"
                      maxlength="11"
                      placeholder="01012345678"
                      class="h-8 w-44 border border-gray-300 bg-gray-50 px-2.5 font-mono text-[13px] text-gray-800 outline-none transition placeholder:text-gray-400 focus:bg-white"
                      :class="roleProfile.color.ring"
                      :disabled="updatingPhone"
                      @keyup.enter="submitEditPhone"
                    />
                    <button
                      type="button"
                      class="h-8 px-3 text-[12px] font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                      :class="roleProfile.color.btnPrimary"
                      :disabled="updatingPhone"
                      @click="submitEditPhone"
                    >
                      {{ updatingPhone ? '저장 중...' : '저장' }}
                    </button>
                    <button
                      type="button"
                      class="h-8 border border-gray-300 bg-white px-3 text-[12px] font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="updatingPhone"
                      @click="cancelEditPhone"
                    >
                      취소
                    </button>
                  </div>
                  <p class="text-[11px] font-medium text-gray-400">
                    하이픈(-) 없이 숫자만 입력해주세요. 예) 01012345678
                  </p>
                  <p v-if="phoneError" class="inline-flex items-center gap-1 text-[11px] font-medium text-red-600">
                    <AlertCircle :size="11" />
                    {{ phoneError }}
                  </p>
                </div>
              </dd>
            </div>
          </dl>
        </section>

        <!-- 권한 / 소속 -->
        <section class="border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 class="inline-flex items-center gap-2 text-[14px] font-semibold text-gray-800">
              <component :is="roleProfile.icon" :size="15" :class="roleProfile.color.accent" />
              권한 / 소속
            </h2>
          </div>
          <dl class="divide-y divide-gray-100">
            <div class="grid grid-cols-[140px_1fr] items-center px-4 py-3">
              <dt class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                <ShieldCheck :size="12" />
                권한
              </dt>
              <dd>
                <span
                  class="inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold"
                  :class="roleProfile.color.badge"
                >
                  <component :is="roleProfile.icon" :size="11" />
                  {{ roleProfile.label }}
                </span>
              </dd>
            </div>
            <div class="grid grid-cols-[140px_1fr] items-center px-4 py-3">
              <dt class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                <MapPin :size="12" />
                {{ roleProfile.locationLabel.code }}
              </dt>
              <dd>
                <span class="border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-[12px] font-medium text-gray-700">
                  {{ profile.locationCode }}
                </span>
              </dd>
            </div>
            <div class="grid grid-cols-[140px_1fr] items-center px-4 py-3">
              <dt class="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                {{ roleProfile.locationLabel.name }}
              </dt>
              <dd class="text-[13px] font-medium text-gray-800">
                {{ profile.locationName }}
              </dd>
            </div>
          </dl>
        </section>

        <!-- 보안 -->
        <section class="border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 class="inline-flex items-center gap-2 text-[14px] font-semibold text-gray-800">
              <KeyRound :size="15" :class="roleProfile.color.accent" />
              계정 보안
            </h2>
          </div>
          <div class="flex items-center justify-between px-4 py-4">
            <div class="flex flex-col gap-1">
              <p class="text-[13px] font-medium text-gray-800">비밀번호 변경</p>
              <p class="text-[11px] font-medium text-gray-400">
                보안을 위해 비밀번호 변경 시 모든 디바이스에서 자동 로그아웃됩니다.
              </p>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 transition hover:bg-gray-50"
              @click="openPasswordModal"
            >
              <KeyRound :size="14" />
              비밀번호 변경
            </button>
          </div>
        </section>

        <!-- 액션 -->
        <section class="flex items-center justify-end gap-2 border border-gray-300 bg-white px-4 py-3 shadow-sm">
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-red-300 bg-white px-4 py-2 text-[13px] font-medium text-red-600 transition hover:bg-red-50"
            @click="handleLogout"
          >
            <LogOut :size="14" />
            로그아웃
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white transition"
            :class="roleProfile.color.btnPrimary"
            @click="goHome"
          >
            대시보드로 이동
          </button>
        </section>
      </template>
    </div>

    <!-- ── 비밀번호 변경 모달 ── -->
    <transition name="modal">
      <div
        v-if="showPasswordModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="closePasswordModal"
      >
        <div class="w-full max-w-[440px] border border-gray-300 bg-white shadow-2xl">
          <!-- 헤더 -->
          <div class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h3 class="inline-flex items-center gap-2 text-[14px] font-semibold text-gray-900">
              <KeyRound :size="15" :class="roleProfile.color.accent" />
              비밀번호 변경
            </h3>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center border border-gray-200 bg-white text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="updatingPw"
              @click="closePasswordModal"
            >
              <X :size="14" />
            </button>
          </div>

          <!-- 본문 -->
          <div class="flex flex-col gap-4 p-5">
            <!-- 현재 비밀번호 -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                현재 비밀번호
              </label>
              <div class="relative">
                <input
                  v-model="pwForm.current"
                  :type="showPw.current ? 'text' : 'password'"
                  class="h-10 w-full border border-gray-300 bg-gray-50 px-3 pr-10 text-[13px] text-gray-800 outline-none transition focus:bg-white"
                  :class="roleProfile.color.ring"
                  :disabled="updatingPw"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 transition hover:text-gray-700"
                  @click="showPw.current = !showPw.current"
                >
                  <component :is="showPw.current ? EyeOff : Eye" :size="14" />
                </button>
              </div>
            </div>

            <!-- 새 비밀번호 -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                새 비밀번호
              </label>
              <div class="relative">
                <input
                  v-model="pwForm.next"
                  :type="showPw.next ? 'text' : 'password'"
                  class="h-10 w-full border border-gray-300 bg-gray-50 px-3 pr-10 text-[13px] text-gray-800 outline-none transition focus:bg-white"
                  :class="roleProfile.color.ring"
                  :disabled="updatingPw"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 transition hover:text-gray-700"
                  @click="showPw.next = !showPw.next"
                >
                  <component :is="showPw.next ? EyeOff : Eye" :size="14" />
                </button>
              </div>
              <p class="text-[11px] font-medium text-gray-400">
                대소문자, 숫자, 특수문자(!@#$%^&amp;*) 포함 8자 이상
              </p>
            </div>

            <!-- 새 비밀번호 확인 -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                새 비밀번호 확인
              </label>
              <div class="relative">
                <input
                  v-model="pwForm.confirm"
                  :type="showPw.confirm ? 'text' : 'password'"
                  class="h-10 w-full border border-gray-300 bg-gray-50 px-3 pr-10 text-[13px] text-gray-800 outline-none transition focus:bg-white"
                  :class="roleProfile.color.ring"
                  :disabled="updatingPw"
                  @keyup.enter="submitPasswordChange"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 transition hover:text-gray-700"
                  @click="showPw.confirm = !showPw.confirm"
                >
                  <component :is="showPw.confirm ? EyeOff : Eye" :size="14" />
                </button>
              </div>
            </div>

            <!-- 안내 -->
            <div class="flex items-start gap-2 border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] font-medium text-amber-800">
              <AlertCircle :size="13" class="mt-0.5 shrink-0" />
              <span>변경 후 보안을 위해 모든 기기에서 자동 로그아웃되며, 다시 로그인해야 합니다.</span>
            </div>

            <!-- 에러 -->
            <p v-if="pwError" class="inline-flex items-center gap-1.5 text-[12px] font-medium text-red-600">
              <AlertCircle :size="13" />
              {{ pwError }}
            </p>
          </div>

          <!-- 푸터 -->
          <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
            <button
              type="button"
              class="h-9 border border-gray-300 bg-white px-4 text-[13px] font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="updatingPw"
              @click="closePasswordModal"
            >
              취소
            </button>
            <button
              type="button"
              class="h-9 px-4 text-[13px] font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              :class="roleProfile.color.btnPrimary"
              :disabled="updatingPw"
              @click="submitPasswordChange"
            >
              {{ updatingPw ? '변경 중...' : '비밀번호 변경' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </AppLayout>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
</style>
