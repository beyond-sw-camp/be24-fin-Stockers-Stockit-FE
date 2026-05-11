<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Building2, Eye, EyeOff, Hash, Leaf, LockKeyhole, ShieldCheck, Store, Warehouse } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const employeeId = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)
const selectedRole = ref('')   // 'HQ' | 'STORE' | 'WAREHOUSE'

// 권한별 간편 로그인 계정 — BE AdminBootstrapRunner 가 생성하는 계정 (.env ADMIN_BOOTSTRAP_PASSWORD)
const quickAccounts = {
  HQ:        { code: 'HQ-A0001', password: 'Stockit!2026', label: '본사 관리자', icon: Building2, desc: '본사 통합 운영' },
  STORE:     { code: 'ST-A0001', password: 'Stockit!2026', label: '매장 관리자', icon: Store,     desc: '매장 재고/주문' },
  WAREHOUSE: { code: 'WH-A0001', password: 'Stockit!2026', label: '창고 관리자', icon: Warehouse, desc: '입출고/물류' },
}

const roleOptions = computed(() => Object.entries(quickAccounts).map(([key, v]) => ({ key, ...v })))

function selectRole(key) {
  selectedRole.value = key
  const acc = quickAccounts[key]
  if (acc) {
    employeeId.value = acc.code
    password.value = acc.password
    errorMsg.value = ''
  }
}

const canSubmit = computed(() => employeeId.value.trim() && password.value)

async function handleSubmit() {
  if (!canSubmit.value || loading.value) return

  errorMsg.value = ''
  loading.value = true

  try {
    const result = await auth.login(employeeId.value.trim(), password.value)

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
  <main class="flex min-h-screen items-center justify-center bg-[#f4f7f6] px-4 py-8 text-gray-900 sm:px-8">
    <section
      class="grid w-full max-w-[980px] overflow-hidden border border-[#dce5e2] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] md:grid-cols-[1fr_1fr]"
      aria-label="StockIT ERP 로그인"
    >
      <!-- 왼쪽 패널 -->
      <div class="flex min-h-[340px] flex-col bg-[#004D3C] p-8 text-white md:min-h-[600px] md:p-10">

        <!-- 상단 좌측: ESG 배지 -->
        <div class="flex flex-col items-start">
          <div class="inline-flex items-center gap-1.5 border border-white/40 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
            <Leaf :size="12" />
            ESG Inside
          </div>
        </div>

        <!-- 브랜드 영역 -->
        <div class="flex flex-1 flex-col justify-center">
          <!-- 타이틀 -->
          <h1 class="text-[68px] font-black leading-[0.9] tracking-[-0.04em] text-white md:text-[84px]">
            Stock<span class="text-white/45">It</span>
          </h1>

          <!-- 슬로건: 짧은 액센트 + 위계 있는 한 줄 -->
          <div class="mt-7 flex items-center gap-3">
            <span class="h-px w-8 shrink-0 bg-white/60" />
            <p class="whitespace-nowrap text-[13px] tracking-wide md:text-[14px]">
              <span class="font-light text-white/55">지속 가능한 SPA 브랜드를 위한</span>
              <span class="ml-1.5 font-bold text-white"> 스마트 재고관리 시스템</span>
            </p>
          </div>
        </div>

        <!-- 권한별 간편 로그인 (개발용) — 하단 영역 -->
        <div class="mt-8 border-t border-white/10 pt-5">
          <p class="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/60">Quick Login</p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="r in roleOptions"
              :key="r.key"
              type="button"
              @click="selectRole(r.key)"
              :class="[
                'flex flex-col items-start gap-1.5 border px-2.5 py-3 text-left transition',
                selectedRole === r.key
                  ? 'border-white bg-white/20 text-white'
                  : 'border-white/25 bg-white/5 text-white/85 hover:border-white/55 hover:bg-white/12',
              ]"
              :aria-pressed="selectedRole === r.key"
            >
              <component :is="r.icon" :size="16" class="text-white" />
              <span class="text-[12px] font-black leading-tight">{{ r.label }}</span>
              <span class="text-[10px] font-medium text-white/60">{{ r.desc }}</span>
            </button>
          </div>
          <p class="mt-2 text-[10px] text-white/45">선택 후 우측 로그인 버튼을 눌러주세요.</p>
        </div>

        <!-- 하단 -->
        <div class="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
          <p class="text-[11px] text-white/30">© 2026 StockIT Corp. All rights reserved.</p>
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center border border-white/40 bg-white text-[16px] font-black text-[#004D3C]">
              V
            </div>
            <p class="text-[10px] font-semibold text-white/60">v2.0</p>
          </div>
        </div>
      </div>

      <!-- 오른쪽 로그인 폼 -->
      <div class="flex flex-col justify-center p-8 md:p-10">
        <p class="mb-5 text-[28px] font-black leading-[1] tracking-[-0.01em] text-[#1D4ED8] sm:text-[36px] md:text-[44px]">
          무중단 배포 BLUE v1
        </p>

        <div class="mb-8">
          <div class="mb-4 inline-flex items-center gap-1.5 border border-[#cfe2dc] bg-[#eef7f4] px-2.5 py-1.5 text-[11px] font-black text-[#004D3C]">
            <ShieldCheck :size="14" />
            SECURE LOGIN
          </div>
          <h2 class="text-[26px] font-black text-gray-900">로그인</h2>
          <p class="mt-1.5 text-[13px] text-gray-400">사원번호와 비밀번호를 입력하세요.</p>
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">

          <label class="flex flex-col gap-2">
            <span class="text-[12px] font-bold text-gray-600">사원번호</span>
            <div class="flex min-h-12 items-center gap-2.5 border border-gray-300 bg-gray-50 px-3.5 text-gray-400 transition focus-within:border-[#004D3C] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,77,60,0.08)]">
              <Hash :size="17" />
              <input
                v-model="employeeId"
                type="text"
                required
                autocomplete="username"
                placeholder="예) EMP-00123"
                class="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
          </label>

          <label class="flex flex-col gap-2">
            <span class="text-[12px] font-bold text-gray-600">비밀번호</span>
            <div class="flex min-h-12 items-center gap-2.5 border border-gray-300 bg-gray-50 px-3.5 text-gray-400 transition focus-within:border-[#004D3C] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,77,60,0.08)]">
              <LockKeyhole :size="17" />
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
                class="flex h-7 w-7 items-center justify-center text-gray-400 transition hover:text-[#004D3C]"
                :aria-label="showPassword ? '비밀번호 숨기기' : '비밀번호 보기'"
                @click="showPassword = !showPassword"
              >
                <component :is="showPassword ? EyeOff : Eye" :size="17" />
              </button>
            </div>
          </label>

          <div class="flex justify-end">
            <a href="#" class="text-[12px] font-medium text-gray-400 transition hover:text-[#004D3C]">
              비밀번호를 잊으셨나요?
            </a>
          </div>

          <p
            v-if="errorMsg"
            class="border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-600"
            role="alert"
          >
            {{ errorMsg }}
          </p>

          <button
            type="submit"
            class="min-h-[48px] bg-[#004D3C] text-[14px] font-black text-white transition hover:bg-[#003d30] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!canSubmit || loading"
          >
            {{ loading ? '로그인 중...' : '로그인' }}
          </button>

          <button
            type="button"
            class="min-h-[48px] border border-[#004D3C] bg-white text-[14px] font-black text-[#004D3C] transition hover:bg-[#eef7f4]"
            @click="router.push('/signup')"
          >
            계정 신청
          </button>

        </form>

        <div class="mt-8 border-t border-gray-100 pt-6">
          <p class="text-center text-[12px] text-gray-400">
            계정 문의 및 비밀번호 초기화는
            <a href="#" class="font-bold text-[#004D3C] hover:underline">시스템 관리자</a>에게 연락하세요.
          </p>
        </div>

      </div>
    </section>
  </main>
</template>
