<script setup>
import { ref } from 'vue'
import { ShieldCheck, UserPlus, Store, Warehouse } from 'lucide-vue-next'

const form = ref({
  name: '',
  email: '',
  phone: '',
  birthdate: '',
  position: '',
  storeCode: '',
  storeName: '',
  role: '',
  reason: '',
})

const roleOptions = [
  { id: 'store',     label: '직영점 매장 관리자', desc: '매장 재고·발주·POS 업무 담당', icon: Store },
  { id: 'warehouse', label: '창고 관리자',         desc: '물류 창고 입출고·재고 담당',  icon: Warehouse },
]

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
  if (!form.value.birthdate)           e.birthdate   = '생년월일을 입력해주세요.'
  if (!form.value.position.trim())     e.position    = '직책을 입력해주세요.'
  if (!form.value.storeCode.trim())    e.storeCode   = '매장 코드를 입력해주세요.'
  if (!form.value.storeName.trim())    e.storeName   = '매장명을 입력해주세요.'
  if (!form.value.role)                e.role        = '신청 권한을 선택해주세요.'
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
  <main class="flex min-h-screen items-start justify-center bg-[#f4f7f6] px-4 py-10 sm:px-8">
    <section
      class="w-full max-w-[620px] overflow-hidden border border-[#dce5e2] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)]"
      aria-label="점주 계정 신청"
    >

      <!-- ── HEADER ── -->
      <div class="flex items-start justify-between gap-4 bg-[#004D3C] px-8 py-7">
        <div class="flex items-start gap-4">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center border border-white/40 bg-white text-[22px] font-black text-[#004D3C]">S</div>
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.14em] text-white/70">StockIT ERP</p>
            <h1 class="mt-1.5 text-[22px] font-black leading-tight text-white">계정 신청</h1>
            <p class="mt-1.5 text-[13px] text-white/60">신청 후 중앙 관리자의 승인이 완료되어야 로그인할 수 있습니다.</p>
          </div>
        </div>
        <div class="inline-flex shrink-0 items-center gap-1.5 border border-white/30 bg-white/10 px-2.5 py-1.5 text-xs font-black text-white">
          <ShieldCheck :size="14" />
          <span>RBAC</span>
        </div>
      </div>

      <!-- ── SUBMITTED ── -->
      <div v-if="submitted" class="flex flex-col items-center px-8 py-12 text-center">
        <div class="mb-4 flex h-14 w-14 items-center justify-center bg-[#eef7f4] text-[#004D3C]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <h2 class="text-[20px] font-black text-gray-900">신청이 접수되었습니다</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-gray-500">
          중앙 관리자가 신청 내용을 검토한 후<br />입력하신 이메일로 결과를 안내드립니다.
        </p>
        <div class="mt-6 w-full border border-[#dce5e2] text-left">
          <div v-for="(row, i) in [
            { label: '신청자', val: form.name },
            { label: '이메일', val: form.email },
            { label: '매장명', val: `${form.storeName} (${form.storeCode})` },
            { label: '신청 권한', val: roleOptions.find(r => r.id === form.role)?.label },
          ]" :key="i" class="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-b-0">
            <span class="text-[11px] font-black uppercase tracking-[0.12em] text-[#5b7f76]">{{ row.label }}</span>
            <span class="text-[13px] font-extrabold text-gray-900">{{ row.val }}</span>
          </div>
          <div class="flex items-center justify-between px-4 py-3">
            <span class="text-[11px] font-black uppercase tracking-[0.12em] text-[#5b7f76]">처리 상태</span>
            <span class="inline-flex items-center border border-[#fcd34d] bg-[#fffbeb] px-2.5 py-1 text-[11px] font-black text-[#92400e]">검토 대기중</span>
          </div>
        </div>
        <a href="/login" class="mt-6 text-[13px] font-bold text-[#004D3C] underline underline-offset-2">로그인으로 돌아가기</a>
      </div>

      <!-- ── FORM ── -->
      <form v-else novalidate class="px-8 py-7" @submit.prevent="handleSubmit">

        <!-- 01 신청자 정보 -->
        <div class="mb-5 flex items-center gap-3">
          <span class="flex h-5 w-5 shrink-0 items-center justify-center bg-[#004D3C] text-[10px] font-black text-white">01</span>
          <p class="text-[11px] font-black uppercase tracking-[0.14em] text-[#5b7f76]">신청자 정보</p>
        </div>

        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
            <label class="flex flex-col gap-2">
              <span class="text-[13px] font-extrabold text-gray-600">이름 <em class="not-italic text-red-500">*</em></span>
              <div :class="['flex min-h-12 items-center border bg-gray-50 px-3.5 transition focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,77,60,0.09)]', errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300 focus-within:border-[#004D3C]']">
                <input v-model="form.name" type="text" placeholder="홍길동" class="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400" @input="clearErr('name')" />
              </div>
              <p v-if="errors.name" class="text-[12px] font-bold text-red-600">{{ errors.name }}</p>
            </label>

            <label class="flex flex-col gap-2">
              <span class="text-[13px] font-extrabold text-gray-600">직책 <em class="not-italic text-red-500">*</em></span>
              <div :class="['flex min-h-12 items-center border bg-gray-50 px-3.5 transition focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,77,60,0.09)]', errors.position ? 'border-red-400 bg-red-50' : 'border-gray-300 focus-within:border-[#004D3C]']">
                <input v-model="form.position" type="text" placeholder="예) 점장, 부점장" class="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400" @input="clearErr('position')" />
              </div>
              <p v-if="errors.position" class="text-[12px] font-bold text-red-600">{{ errors.position }}</p>
            </label>
          </div>

          <label class="flex flex-col gap-2">
            <div class="flex items-baseline justify-between">
              <span class="text-[13px] font-extrabold text-gray-600">이메일 <em class="not-italic text-red-500">*</em></span>
              <small class="text-xs font-bold text-gray-400">영문·숫자만 허용</small>
            </div>
            <div :class="['flex min-h-12 items-center border bg-gray-50 px-3.5 transition focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,77,60,0.09)]', errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 focus-within:border-[#004D3C]']">
              <input v-model="form.email" type="email" placeholder="example@stockit.com" spellcheck="false" class="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400" @input="clearErr('email')" />
            </div>
            <p v-if="errors.email" class="text-[12px] font-bold text-red-600">{{ errors.email }}</p>
          </label>

          <div class="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
            <label class="flex flex-col gap-2">
              <span class="text-[13px] font-extrabold text-gray-600">휴대폰 번호 <em class="not-italic text-red-500">*</em></span>
              <div :class="['flex min-h-12 items-center border bg-gray-50 px-3.5 transition focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,77,60,0.09)]', errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300 focus-within:border-[#004D3C]']">
                <input v-model="form.phone" type="tel" placeholder="010-0000-0000" class="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400" @input="clearErr('phone')" />
              </div>
              <p v-if="errors.phone" class="text-[12px] font-bold text-red-600">{{ errors.phone }}</p>
            </label>

            <label class="flex flex-col gap-2">
              <div class="flex items-baseline justify-between">
                <span class="text-[13px] font-extrabold text-gray-600">생년월일 <em class="not-italic text-red-500">*</em></span>
                <small class="text-xs font-bold text-gray-400">초기 비밀번호로 사용</small>
              </div>
              <div :class="['flex min-h-12 items-center border bg-gray-50 px-3.5 transition focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,77,60,0.09)]', errors.birthdate ? 'border-red-400 bg-red-50' : 'border-gray-300 focus-within:border-[#004D3C]']">
                <input v-model="form.birthdate" type="date" class="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none" @change="clearErr('birthdate')" />
              </div>
              <p v-if="errors.birthdate" class="text-[12px] font-bold text-red-600">{{ errors.birthdate }}</p>
            </label>
          </div>
        </div>

        <div class="my-7 border-t border-gray-100" />

        <!-- 02 담당 매장 정보 -->
        <div class="mb-5 flex items-center gap-3">
          <span class="flex h-5 w-5 shrink-0 items-center justify-center bg-[#004D3C] text-[10px] font-black text-white">02</span>
          <p class="text-[11px] font-black uppercase tracking-[0.14em] text-[#5b7f76]">담당 매장 정보</p>
        </div>

        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
            <label class="flex flex-col gap-2">
              <div class="flex items-baseline justify-between">
                <span class="text-[13px] font-extrabold text-gray-600">매장 코드 <em class="not-italic text-red-500">*</em></span>
                <small class="text-xs font-bold text-gray-400">계약서 참고</small>
              </div>
              <div :class="['flex min-h-12 items-center border bg-gray-50 px-3.5 transition focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,77,60,0.09)]', errors.storeCode ? 'border-red-400 bg-red-50' : 'border-gray-300 focus-within:border-[#004D3C]']">
                <input v-model="form.storeCode" type="text" placeholder="예) ST-001" class="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400" @input="clearErr('storeCode')" />
              </div>
              <p v-if="errors.storeCode" class="text-[12px] font-bold text-red-600">{{ errors.storeCode }}</p>
            </label>

            <label class="flex flex-col gap-2">
              <span class="text-[13px] font-extrabold text-gray-600">매장명 <em class="not-italic text-red-500">*</em></span>
              <div :class="['flex min-h-12 items-center border bg-gray-50 px-3.5 transition focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,77,60,0.09)]', errors.storeName ? 'border-red-400 bg-red-50' : 'border-gray-300 focus-within:border-[#004D3C]']">
                <input v-model="form.storeName" type="text" placeholder="예) 강남 서초점" class="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400" @input="clearErr('storeName')" />
              </div>
              <p v-if="errors.storeName" class="text-[12px] font-bold text-red-600">{{ errors.storeName }}</p>
            </label>
          </div>

        </div>

        <div class="my-7 border-t border-gray-100" />

        <!-- 03 권한 신청 -->
        <div class="mb-5 flex items-center gap-3">
          <span class="flex h-5 w-5 shrink-0 items-center justify-center bg-[#004D3C] text-[10px] font-black text-white">03</span>
          <p class="text-[11px] font-black uppercase tracking-[0.14em] text-[#5b7f76]">권한 신청</p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row">
          <button
            v-for="opt in roleOptions"
            :key="opt.id"
            type="button"
            :class="['grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border p-3.5 text-left transition hover:-translate-y-px', form.role === opt.id ? 'border-[#004D3C] bg-[#eef7f4]' : 'border-gray-200 bg-white hover:border-[#a9cac1] hover:bg-[#f4faf8]']"
            @click="form.role = opt.id; clearErr('role')"
          >
            <span :class="['flex h-10 w-10 items-center justify-center transition', form.role === opt.id ? 'bg-[#004D3C] text-white' : 'bg-gray-100 text-gray-500']">
              <component :is="opt.icon" :size="20" />
            </span>
            <span>
              <strong :class="['block text-[13px] font-black', form.role === opt.id ? 'text-[#004D3C]' : 'text-gray-900']">{{ opt.label }}</strong>
              <small class="block text-[12px] font-bold text-gray-500">{{ opt.desc }}</small>
            </span>
          </button>
        </div>
        <p v-if="errors.role" class="mt-2 text-[12px] font-bold text-red-600">{{ errors.role }}</p>

        <div class="my-7 border-t border-gray-100" />

        <!-- 신청 사유 (optional) -->
        <label class="flex flex-col gap-2">
          <div class="flex items-baseline justify-between">
            <span class="text-[13px] font-extrabold text-gray-600">신청 사유</span>
            <small class="text-xs font-bold text-gray-400">선택</small>
          </div>
          <textarea
            v-model="form.reason"
            placeholder="신청 사유 또는 전달 사항을 입력해주세요."
            rows="3"
            class="resize-y border border-gray-300 bg-gray-50 px-3.5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#004D3C] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,77,60,0.09)]"
          />
        </label>

        <!-- 안내 박스 -->
        <div class="mt-5 flex items-start gap-3 border border-[#cfe2dc] bg-[#eef7f4] px-4 py-3">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-px shrink-0 text-[#004D3C]"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16h.01"/></svg>
          <p class="text-[12px] font-bold leading-relaxed text-[#004D3C]">
            승인 완료 후 초기 비밀번호(생년월일)로 로그인하실 수 있습니다. 승인 결과는 입력하신 이메일로 안내됩니다.
          </p>
        </div>

        <!-- 제출 버튼 -->
        <button
          type="submit"
          class="relative mt-5 flex min-h-[50px] w-full items-center justify-center gap-2 bg-[#004D3C] text-sm font-black text-white transition hover:-translate-y-px hover:bg-[#003d30] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
          :disabled="isSubmitting"
        >
          <div v-show="isSubmitting" class="absolute h-[14px] w-[14px] animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <span :class="['flex items-center gap-2', { 'opacity-0': isSubmitting }]">
            <UserPlus :size="16" />
            계정 신청하기
          </span>
        </button>

        <p class="mt-4 text-center text-[12px] font-bold text-gray-400">
          이미 계정이 있으신가요?
          <a href="/login" class="text-[#004D3C] underline underline-offset-2">로그인으로 돌아가기</a>
        </p>

      </form>

      <!-- FOOTER -->
      <div class="flex items-center justify-between border-t border-gray-100 px-8 py-3">
        <span class="text-[11px] font-bold text-gray-400">© 2026 StockIt Corp.</span>
        <span class="text-[11px] font-bold text-gray-400">문의: 중앙 관리자(김사라)</span>
      </div>

    </section>
  </main>
</template>