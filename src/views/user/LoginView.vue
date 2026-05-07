<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Leaf, LockKeyhole, Mail, ShieldCheck } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const employeeCode = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)

const canSubmit = computed(() => employeeCode.value.trim() && password.value)

async function handleSubmit() {
  if (!canSubmit.value || loading.value) return

  errorMsg.value = ''
  loading.value = true

  try {
    const result = await auth.login(employeeCode.value.trim(), password.value)

    if (result.success) {
      router.push(result.redirectTo)
    } else {
      errorMsg.value = result.message ?? '사원번호 또는 비밀번호가 올바르지 않습니다.'
    }
  } finally {
    loading.value = false
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
        <div class="flex items-start gap-3">
          <Leaf :size="40" :stroke-width="2.5" class="shrink-0 text-white" />
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.14em] text-white/70">Stockit</p>
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
            <span class="text-[13px] font-extrabold text-gray-600">사원번호</span>
            <div
              class="flex min-h-12 items-center gap-2.5 border border-gray-300 bg-gray-50 px-3.5 text-gray-500 transition focus-within:border-[#004D3C] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,77,60,0.09)]"
            >
              <Mail :size="18" />
              <input
                v-model="employeeCode"
                type="text"
                required
                autocomplete="username"
                placeholder="사원번호를 입력하세요"
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
      </div>
    </section>
  </main>
</template>
