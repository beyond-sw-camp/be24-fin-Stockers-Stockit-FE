<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Hash, LockKeyhole, ShieldCheck } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const employeeId = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)

const canSubmit = computed(() => employeeId.value.trim() && password.value)

async function handleSubmit() {
  if (!canSubmit.value || loading.value) return

  errorMsg.value = ''
  loading.value = true

  const result = auth.login(employeeId.value.trim(), password.value)

  loading.value = false

  if (result.success) {
    router.push(result.redirectTo)
  } else {
    errorMsg.value = '사원번호 또는 비밀번호가 올바르지 않습니다.'
  }
}

const notices = [
  {
    tag: '점검',
    tagStyle: 'bg-amber-100 text-amber-700',
    title: '[필독] 4월 27일 (일) 시스템 정기 점검',
    desc: '오전 02:00 ~ 06:00 서비스 일시 중단 예정입니다.',
    date: '2026.04.22',
  },
  {
    tag: '업데이트',
    tagStyle: 'bg-blue-100 text-blue-700',
    title: 'v2.4.1 배포 완료 — 재고 경보 기능 개선',
    desc: '안전재고 임계치 알림 정확도가 향상되었습니다.',
    date: '2026.04.18',
  },
  {
    tag: '보안',
    tagStyle: 'bg-red-100 text-red-600',
    title: '비밀번호 90일 주기 변경 정책 시행',
    desc: '미변경 계정은 다음 로그인 시 강제 변경이 요구됩니다.',
    date: '2026.04.01',
  },
]
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-[#f4f7f6] px-4 py-8 text-gray-900 sm:px-8">
    <section
      class="grid w-full max-w-[980px] overflow-hidden border border-[#dce5e2] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] md:grid-cols-[1fr_1fr]"
      aria-label="StockIT ERP 로그인"
    >
      <!-- 왼쪽 패널 -->
      <div class="flex min-h-[340px] flex-col bg-[#004D3C] p-8 text-white md:min-h-[600px] md:p-10">

        <!-- 브랜드 -->
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center border border-white/40 bg-white text-[18px] font-black text-[#004D3C]">
            V
          </div>
          <div>
            <p class="text-[13px] font-black uppercase tracking-[0.12em] text-white"></p>
            <p class="text-[10px] text-white/50">v2.4.1</p>
          </div>
        </div>

        <!-- 대형 타이틀 -->
        <div class="my-7">
          <p class="text-[11px] font-black uppercase tracking-[0.2em] text-white/30">Enterprise Resource Planning</p>
          <div class="mt-2 inline-block">
            <h1 class="text-[52px] font-black leading-none tracking-tight text-white md:text-[60px]">
              Stock<span class="text-white/40">It</span>
            </h1>
            <div class="mt-3 h-[2px] w-full bg-white/30" />
          </div>
        </div>

        <!-- 공지사항 -->
        <div class="flex-1 pt-4">
          <p class="mb-4 text-[11px] font-black uppercase tracking-[0.16em] text-white/50">공지사항</p>
          <div class="flex flex-col gap-3">
            <div
              v-for="notice in notices"
              :key="notice.title"
              class="border border-white/10 bg-white/5 px-4 py-3"
            >
              <div class="mb-1.5 flex items-center gap-2">
                <span class="rounded px-1.5 py-0.5 text-[10px] font-bold" :class="notice.tagStyle">
                  {{ notice.tag }}
                </span>
                <span class="text-[10px] text-white/40">{{ notice.date }}</span>
              </div>
              <p class="text-[13px] font-semibold leading-snug text-white">{{ notice.title }}</p>
              <p class="mt-1 text-[11px] leading-relaxed text-white/55">{{ notice.desc }}</p>
            </div>
          </div>
        </div>

        <!-- 하단 -->
        <p class="mt-7 text-[11px] text-white/30">© 2026 StockIT Corp. All rights reserved.</p>
      </div>

      <!-- 오른쪽 로그인 폼 -->
      <div class="flex flex-col justify-center p-8 md:p-10">

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
