<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

async function handleSubmit() {
  errorMsg.value = ''
  loading.value = true
  const result = auth.login(email.value, password.value)
  loading.value = false
  if (result.success) {
    router.push(result.redirectTo)
  } else {
    errorMsg.value = result.message
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#004D3C] flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <!-- Brand -->
      <div class="flex items-center justify-center gap-3 mb-8">
        <div class="w-9 h-9 bg-white flex items-center justify-center font-black text-[#004D3C] text-lg">
          S
        </div>
        <span class="text-white font-black text-xl tracking-tight uppercase">StockIT ERP</span>
      </div>

      <!-- Card -->
      <div class="bg-white p-8">
        <h1 class="text-sm font-black text-gray-800 mb-6 uppercase tracking-widest">로그인</h1>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              이메일
            </label>
            <input
              v-model="email"
              type="email"
              required
              placeholder="email@stockit.com"
              class="w-full px-3 py-2.5 border border-gray-300 text-sm font-mono bg-gray-50 outline-none focus:border-[#004D3C] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              비밀번호
            </label>
            <input
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full px-3 py-2.5 border border-gray-300 text-sm font-mono bg-gray-50 outline-none focus:border-[#004D3C] focus:bg-white transition-colors"
            />
          </div>

          <!-- Error -->
          <div v-if="errorMsg" class="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16h.01"/></svg>
            {{ errorMsg }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2.5 bg-[#004D3C] text-white text-xs font-black uppercase tracking-widest hover:bg-[#003d30] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {{ loading ? '로그인 중...' : '로그인' }}
          </button>
        </form>

        <!-- Dev hint -->
        <div class="mt-6 pt-5 border-t border-gray-100">
          <p class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">테스트 계정</p>
          <div class="space-y-1 text-xs font-mono text-gray-400">
            <p>hq@stockit.com / hq1234</p>
            <p>store@stockit.com / store1234</p>
            <p>warehouse@stockit.com / wh1234</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
