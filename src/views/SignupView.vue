<script setup>
import { ref, computed } from 'vue'
import { ShieldCheck, UserPlus, Store, Warehouse, Building2 } from 'lucide-vue-next'

const form = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirm: '',
  storeCode: '',
  storeName: '',
  role: '',
  reason: '',
})

const roleOptions = [
  {
    id: 'hq',
    label: '본사 관리자',
    desc: '전사 운영·정책 담당',
    icon: Building2,
    detail: '전체 매장·창고 현황 모니터링, 사용자 권한 관리, 정책 수립 및 통합 통계 확인이 가능합니다.',
  },
  {
    id: 'store',
    label: '매장 관리자',
    desc: '매장 재고·발주 담당',
    icon: Store,
    detail: '매장 재고 조회·수정, 발주 신청, 판매 현황 및 통계 확인이 가능합니다.',
  },
  {
    id: 'warehouse',
    label: '창고 관리자',
    desc: '창고 입출고 담당',
    icon: Warehouse,
    detail: '창고 입출고 처리, 재고 이동 승인, 전체 창고 현황 관리가 가능합니다.',
  },
]

const selectedRole = computed(() => roleOptions.find(o => o.id === form.value.role) ?? null)

const isSubmitting = ref(false)
const submitted = ref(false)
const errors = ref({})

function validate() {
  const e = {}
  if (!form.value.name.trim())         e.name        = '이름을 입력해주세요.'
  if (!form.value.email.trim()) {
    e.email = '이메일을 입력해주세요.'
  } else if (!/^[a-zA-Z0-9]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    e.email = '이메일 앞부분은 영문·숫자만 허용됩니다.'
  }
  if (!form.value.phone.trim())        e.phone       = '전화번호를 입력해주세요.'
  if (!form.value.password)            e.password    = '비밀번호를 입력해주세요.'
  else if (form.value.password.length < 8) e.password = '비밀번호는 8자 이상이어야 합니다.'
  if (!form.value.passwordConfirm)     e.passwordConfirm = '비밀번호 확인을 입력해주세요.'
  else if (form.value.password !== form.value.passwordConfirm) e.passwordConfirm = '비밀번호가 일치하지 않습니다.'
  if (!form.value.storeCode.trim())    e.storeCode   = '지점 코드를 입력해주세요.'
  if (!form.value.storeName.trim())    e.storeName   = '지점명을 입력해주세요.'
  if (!form.value.role)                e.role        = '권한을 선택해주세요.'
  errors.value = e
  return Object.keys(e).length === 0
}

function handleSubmit() {
  if (!validate()) return
  isSubmitting.value = true
  setTimeout(() => {
    isSubmitting.value = false
    submitted.value = true
  }, 1200)
}

function clearErr(field) {
  if (errors.value[field]) delete errors.value[field]
}
</script>

<template>
  <!-- 화면 전체를 중앙 정렬하여 스크롤 없이 꽉 차게 배치 -->
  <main class="flex min-h-screen items-center justify-center bg-[#f4f7f6] px-4 py-6">
    <section
        class="w-full max-w-[900px] overflow-hidden border border-[#dce5e2] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)]"
        aria-label="점주 계정 신청"
    >

      <!-- ── HEADER ── -->
      <div class="flex items-center justify-between gap-4 bg-[#004D3C] px-6 py-5">
        <div class="flex items-center gap-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center border border-white/40 bg-white text-[20px] font-black text-[#004D3C]">S</div>
          <div>
            <div class="flex items-baseline gap-2">
              <h1 class="text-[18px] font-black leading-tight text-white">Stockit 계정 신청</h1>
              <p class="text-[10px] font-black uppercase tracking-[0.14em] text-white/70">ERP System</p>
            </div>
            <p class="mt-0.5 text-[12px] text-white/70">신청 후 중앙 관리자의 승인이 완료되어야 로그인할 수 있습니다.</p>
          </div>
        </div>
        <div class="hidden shrink-0 items-center gap-1.5 border border-white/30 bg-white/10 px-2.5 py-1.5 text-xs font-black text-white sm:inline-flex">
          <ShieldCheck :size="14" />
          <span>RBAC</span>
        </div>
      </div>

      <!-- ── SUBMITTED (완료 화면) ── -->
      <div v-if="submitted" class="flex flex-col items-center px-8 py-16 text-center">
        <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eef7f4] text-[#004D3C]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <h2 class="text-[20px] font-black text-gray-900">신청이 접수되었습니다</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-gray-500">
          중앙 관리자가 신청 내용을 검토한 후 입력하신 이메일로 결과를 안내드립니다.
        </p>
        <router-link to="/login" class="mt-6 inline-flex h-10 items-center justify-center bg-[#004D3C] px-6 text-[13px] font-bold text-white transition hover:bg-[#003d30]">
          로그인으로 돌아가기
        </router-link>
      </div>

      <!-- ── FORM (입력 화면) ── -->
      <form v-else novalidate class="px-6 py-6" @submit.prevent="handleSubmit">
        
        <!-- 좌우 2단 분할 레이아웃 -->
        <div class="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
          
          <!-- [왼쪽 영역] 01 신청자 정보 -->
          <div class="flex flex-col gap-4">
            <div class="mb-1 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span class="flex h-4 w-4 shrink-0 items-center justify-center bg-[#004D3C] text-[9px] font-black text-white">01</span>
              <p class="text-[12px] font-black text-[#004D3C]">신청자 정보</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <label class="flex flex-col gap-1.5">
                <span class="text-[12px] font-bold text-gray-600">이름 <em class="not-italic text-red-500">*</em></span>
                <div :class="['flex h-9 items-center border bg-gray-50 px-3 transition focus-within:bg-white focus-within:border-[#004D3C]', errors.name ? 'border-red-400' : 'border-gray-300']">
                  <input v-model="form.name" type="text" placeholder="홍길동" class="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" @input="clearErr('name')" />
                </div>
                <p v-if="errors.name" class="text-[11px] font-bold text-red-600">{{ errors.name }}</p>
              </label>

              <label class="flex flex-col gap-1.5">
                <span class="text-[12px] font-bold text-gray-600">휴대폰 <em class="not-italic text-red-500">*</em></span>
                <div :class="['flex h-9 items-center border bg-gray-50 px-3 transition focus-within:bg-white focus-within:border-[#004D3C]', errors.phone ? 'border-red-400' : 'border-gray-300']">
                  <input v-model="form.phone" type="tel" placeholder="010-0000-0000" class="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" @input="clearErr('phone')" />
                </div>
                <p v-if="errors.phone" class="text-[11px] font-bold text-red-600">{{ errors.phone }}</p>
              </label>
            </div>

            <label class="flex flex-col gap-1.5">
              <div class="flex items-baseline justify-between">
                <span class="text-[12px] font-bold text-gray-600">이메일 <em class="not-italic text-red-500">*</em></span>
              </div>
              <div :class="['flex h-9 items-center border bg-gray-50 px-3 transition focus-within:bg-white focus-within:border-[#004D3C]', errors.email ? 'border-red-400' : 'border-gray-300']">
                <input v-model="form.email" type="email" placeholder="example@stockit.com" class="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" @input="clearErr('email')" />
              </div>
              <p v-if="errors.email" class="text-[11px] font-bold text-red-600">{{ errors.email }}</p>
            </label>

            <div class="grid grid-cols-2 gap-3">
              <label class="flex flex-col gap-1.5">
                <span class="text-[12px] font-bold text-gray-600">비밀번호 <em class="not-italic text-red-500">*</em></span>
                <div :class="['flex h-9 items-center border bg-gray-50 px-3 transition focus-within:bg-white focus-within:border-[#004D3C]', errors.password ? 'border-red-400' : 'border-gray-300']">
                  <input v-model="form.password" type="password" placeholder="8자 이상" class="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" @input="clearErr('password')" />
                </div>
                <p v-if="errors.password" class="text-[11px] font-bold text-red-600">{{ errors.password }}</p>
              </label>

              <label class="flex flex-col gap-1.5">
                <span class="text-[12px] font-bold text-gray-600">비밀번호 확인 <em class="not-italic text-red-500">*</em></span>
                <div :class="['flex h-9 items-center border bg-gray-50 px-3 transition focus-within:bg-white focus-within:border-[#004D3C]', errors.passwordConfirm ? 'border-red-400' : 'border-gray-300']">
                  <input v-model="form.passwordConfirm" type="password" placeholder="비밀번호 재입력" class="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" @input="clearErr('passwordConfirm')" />
                </div>
                <p v-if="errors.passwordConfirm" class="text-[11px] font-bold text-red-600">{{ errors.passwordConfirm }}</p>
              </label>
            </div>
          </div>

          <!-- [오른쪽 영역] 02 권한 -->
          <div class="flex flex-col gap-4">

            <div class="mb-1 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span class="flex h-4 w-4 shrink-0 items-center justify-center bg-[#004D3C] text-[9px] font-black text-white">02</span>
              <p class="text-[12px] font-black text-[#004D3C]">지점 및 권한 정보</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <label class="flex flex-col gap-1.5">
                <span class="text-[12px] font-bold text-gray-600">지점 코드 <em class="not-italic text-red-500">*</em></span>
                <div :class="['flex h-9 items-center border bg-gray-50 px-3 transition focus-within:bg-white focus-within:border-[#004D3C]', errors.storeCode ? 'border-red-400' : 'border-gray-300']">
                  <input v-model="form.storeCode" type="text" placeholder="ST-001" class="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" @input="clearErr('storeCode')" />
                </div>
                <p v-if="errors.storeCode" class="text-[11px] font-bold text-red-600">{{ errors.storeCode }}</p>
              </label>

              <label class="flex flex-col gap-1.5">
                <span class="text-[12px] font-bold text-gray-600">지점명 <em class="not-italic text-red-500">*</em></span>
                <div :class="['flex h-9 items-center border bg-gray-50 px-3 transition focus-within:bg-white focus-within:border-[#004D3C]', errors.storeName ? 'border-red-400' : 'border-gray-300']">
                  <input v-model="form.storeName" type="text" placeholder="강남 서초점" class="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" @input="clearErr('storeName')" />
                </div>
                <p v-if="errors.storeName" class="text-[11px] font-bold text-red-600">{{ errors.storeName }}</p>
              </label>
            </div>

            <!-- 권한 버튼을 가로 2단으로 압축 -->
            <div class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-gray-600">권한 선택 <em class="not-italic text-red-500">*</em></span>
              <div class="grid grid-cols-3 gap-2">
                <button
                    v-for="opt in roleOptions"
                    :key="opt.id"
                    type="button"
                    :class="['flex items-center gap-2 border p-2 text-left transition', form.role === opt.id ? 'border-[#004D3C] bg-[#eef7f4]' : 'border-gray-200 bg-white hover:border-[#004D3C]']"
                    @click="form.role = opt.id; clearErr('role')"
                >
                  <component :is="opt.icon" :size="16" :class="form.role === opt.id ? 'text-[#004D3C]' : 'text-gray-400'" />
                  <div>
                    <strong :class="['block text-[12px] font-bold', form.role === opt.id ? 'text-[#004D3C]' : 'text-gray-800']">{{ opt.label }}</strong>
                    <small class="block text-[10px] text-gray-500">{{ opt.desc }}</small>
                  </div>
                </button>
              </div>
              <p v-if="errors.role" class="text-[11px] font-bold text-red-600">{{ errors.role }}</p>
            </div>

            <!-- 권한 안내 카드 -->
            <div class="relative h-[72px] overflow-hidden">
              <Transition name="fade" mode="out-in">
                <div v-if="selectedRole" :key="selectedRole.id" class="absolute inset-0 flex items-start gap-3 border border-[#004D3C]/20 bg-[#eef7f4] px-4 py-3">
                  <component :is="selectedRole.icon" :size="18" class="mt-0.5 shrink-0 text-[#004D3C]" />
                  <div>
                    <p class="text-[12px] font-black text-[#004D3C]">{{ selectedRole.label }}</p>
                    <p class="mt-0.5 text-[11px] leading-relaxed text-[#004D3C]/70">{{ selectedRole.detail }}</p>
                  </div>
                </div>
                <div v-else class="absolute inset-0 flex items-center gap-2 border border-dashed border-gray-300 px-4 text-[11px] text-gray-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16h.01"/></svg>
                  권한을 선택하면 상세 안내가 표시됩니다.
                </div>
              </Transition>
            </div>

          </div>
        </div>

        <!-- 신청 사유 (전체 너비) -->
        <div class="mt-6 border-t border-gray-100 pt-5">
          <div class="mb-3 flex items-center gap-2">
            <span class="flex h-4 w-4 shrink-0 items-center justify-center bg-[#004D3C] text-[9px] font-black text-white">03</span>
            <p class="text-[12px] font-black text-[#004D3C]">추가 정보</p>
          </div>
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-gray-600">신청 사유 (선택)</span>
            <textarea
                v-model="form.reason"
                placeholder="추가 전달 사항 입력"
                rows="2"
                class="resize-none border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#004D3C] focus:bg-white"
            />
          </label>
        </div>

        <!-- ── 하단 액션 영역 ── -->
        <div class="mt-5 border-t border-gray-100 pt-5">
          <div class="flex items-stretch gap-3">
            <div class="flex flex-1 items-center gap-2 bg-[#eef7f4] px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-[#004D3C]"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16h.01"/></svg>
              <p class="text-[11px] font-bold text-[#004D3C]">승인 후 초기 비밀번호(생년월일)로 로그인 가능하며, 결과는 이메일로 안내됩니다.</p>
            </div>
            <button
              type="submit"
              class="relative flex shrink-0 items-center justify-center gap-2 bg-[#004D3C] px-5 text-[13px] font-black text-white transition hover:bg-[#003d30] disabled:opacity-55"
              :disabled="isSubmitting"
            >
              <div v-show="isSubmitting" class="absolute h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span :class="['flex items-center gap-2', { 'opacity-0': isSubmitting }]">
                <UserPlus :size="15" />
                계정 신청하기
              </span>
            </button>
          </div>

          <div class="mt-3 text-center">
            <span class="text-[12px] font-bold text-gray-500">이미 계정이 있으신가요? </span>
            <router-link to="/login" class="text-[12px] font-bold text-[#004D3C] hover:underline">
              로그인으로 돌아가기
            </router-link>
          </div>
        </div>
      </form>

    </section>
  </main>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(4px); }
</style>