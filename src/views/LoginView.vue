<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Building2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Store, Warehouse } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)

const demoAccounts = [
  {
    role: '본사 관리자',
    description: '전사 재고와 주문 현황 관리',
    email: 'hq@stockit.com',
    password: 'hq1234',
    icon: Building2,
  },
  {
    role: '매장 관리자',
    description: '매장 POS와 재고 업무 관리',
    email: 'store@stockit.com',
    password: 'store1234',
    icon: Store,
  },
  {
    role: '창고 관리자',
    description: '창고 입출고와 재고 관리',
    email: 'warehouse@stockit.com',
    password: 'wh1234',
    icon: Warehouse,
  },
]

const canSubmit = computed(() => email.value.trim() && password.value)

function fillCredentials(account) {
  email.value = account.email
  password.value = account.password
  errorMsg.value = ''
}

async function handleSubmit() {
  if (!canSubmit.value || loading.value) return

  errorMsg.value = ''
  loading.value = true

  const result = auth.login(email.value.trim(), password.value)

  loading.value = false

  if (result.success) {
    router.push(result.redirectTo)
  } else {
    errorMsg.value = result.message
  }
}
</script>

<template>
  <main
    class="flex min-h-screen items-center justify-center bg-[#f4f7f6] px-4 py-8 text-gray-900 sm:px-8"
  >
    <section
      class="grid w-full max-w-[1040px] overflow-hidden border border-[#dce5e2] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] md:grid-cols-[0.95fr_1.05fr]"
      aria-label="StockIT ERP 로그인"
    >
      <div
        class="flex min-h-[340px] flex-col justify-between gap-8 bg-[#004D3C] p-6 text-white sm:p-8 md:min-h-[620px] md:p-11"
      >
        <div class="flex items-start gap-4">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center border border-white/40 bg-white text-[22px] font-black text-[#004D3C]"
          >
            S
          </div>
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.14em] text-white/70">StockIT ERP</p>
            <h1 class="mt-3 max-w-[420px] text-[30px] font-black leading-[1.16] text-white md:text-[40px]">
              재고 운영을 한 화면에서 관리하세요.
            </h1>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="border border-white/15 bg-white/10 p-4">
            <span class="text-[11px] font-black uppercase tracking-[0.14em] text-white/70">Today</span>
            <strong class="mt-2 block text-[28px] font-black leading-none text-white">128</strong>
            <p class="mt-2 text-[13px] text-white/70">처리 대기 주문</p>
          </div>
          <div class="border border-white/15 bg-white/10 p-4">
            <span class="text-[11px] font-black uppercase tracking-[0.14em] text-white/70">Stock</span>
            <strong class="mt-2 block text-[28px] font-black leading-none text-white">97.4%</strong>
            <p class="mt-2 text-[13px] text-white/70">가용 재고율</p>
          </div>
        </div>
      </div>

      <div class="flex flex-col justify-center p-6 sm:p-8 md:p-12">
        <div class="mb-7 flex items-start justify-between gap-5">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.14em] text-[#5b7f76]">Secure Login</p>
            <h2 class="mt-2 text-[30px] font-black text-gray-900">로그인</h2>
          </div>
          <div
            class="inline-flex items-center gap-1.5 border border-[#cfe2dc] bg-[#eef7f4] px-2.5 py-1.5 text-xs font-black text-[#004D3C]"
          >
            <ShieldCheck :size="16" />
            <span>RBAC</span>
          </div>
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
          <label class="flex flex-col gap-2">
            <span class="text-[13px] font-extrabold text-gray-600">이메일</span>
            <div
              class="flex min-h-12 items-center gap-2.5 border border-gray-300 bg-gray-50 px-3.5 text-gray-500 transition focus-within:border-[#004D3C] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,77,60,0.09)]"
            >
              <Mail :size="18" />
              <input
                v-model="email"
                type="email"
                required
                autocomplete="username"
                placeholder="email@stockit.com"
                class="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-[13px] font-extrabold text-gray-600">비밀번호</span>
            <div
              class="flex min-h-12 items-center gap-2.5 border border-gray-300 bg-gray-50 px-3.5 text-gray-500 transition focus-within:border-[#004D3C] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,77,60,0.09)]"
            >
              <LockKeyhole :size="18" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                placeholder="비밀번호를 입력하세요"
                class="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center text-gray-500 transition hover:text-[#004D3C]"
                :aria-label="showPassword ? '비밀번호 숨기기' : '비밀번호 보기'"
                @click="showPassword = !showPassword"
              >
                <component :is="showPassword ? EyeOff : Eye" :size="18" />
              </button>
            </div>
          </label>

          <p v-if="errorMsg" class="border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-bold text-red-700" role="alert">
            {{ errorMsg }}
          </p>

          <button
            type="submit"
            class="min-h-[50px] bg-[#004D3C] text-sm font-black text-white transition hover:-translate-y-px hover:bg-[#003d30] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
            :disabled="!canSubmit || loading"
          >
            {{ loading ? '로그인 중...' : '로그인' }}
          </button>
        </form>

        <div class="mt-7 border-t border-gray-200 pt-6">
          <div class="mb-3 flex items-baseline justify-between gap-3">
            <span class="text-[11px] font-black uppercase tracking-[0.14em] text-[#5b7f76]">테스트 계정</span>
            <small class="text-xs font-bold text-gray-400">권한을 선택하면 자동 입력됩니다.</small>
          </div>

          <div class="flex flex-col gap-2">
            <button
              v-for="account in demoAccounts"
              :key="account.email"
              type="button"
              class="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border border-gray-200 bg-white p-3 text-left transition hover:-translate-y-px hover:border-[#a9cac1] hover:bg-[#f4faf8] sm:grid-cols-[auto_minmax(0,1fr)_auto]"
              @click="fillCredentials(account)"
            >
              <span class="flex h-9 w-9 items-center justify-center bg-[#eef7f4] text-[#004D3C]">
                <component :is="account.icon" :size="18" />
              </span>
              <span class="min-w-0">
                <strong class="block text-[13px] font-black text-gray-900">{{ account.role }}</strong>
                <small class="block text-xs font-bold text-gray-500">{{ account.description }}</small>
              </span>
              <span class="col-span-2 text-xs font-bold text-gray-500 sm:col-span-1 sm:whitespace-nowrap">
                {{ account.email }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
