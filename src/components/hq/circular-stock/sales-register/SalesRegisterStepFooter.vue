<script setup>
defineProps({
  saleStep: {
    type: Number,
    required: true,
  },
  canMoveStep2: {
    type: Boolean,
    required: true,
  },
  canMoveStep3: {
    type: Boolean,
    required: true,
  },
  selectedBuyer: {
    type: Object,
    default: null,
  },
  step3FooterWarning: {
    type: String,
    default: '',
  },
  step3CanRegisterNow: {
    type: Boolean,
    required: true,
  },
  step3UnfilledSkuCount: {
    type: Number,
    required: true,
  },
  step3ErrorSkuCount: {
    type: Number,
    required: true,
  },
  materialFitLabel: {
    type: Function,
    required: true,
  },
  saleType: {
    type: String,
    default: 'SALE',
  },
})

const emit = defineEmits(['move-step', 'open-final-review'])
</script>

<template>
  <div v-if="saleStep === 1" class="border-t border-gray-200 bg-gray-50 px-6 py-4">
    <div class="flex items-center justify-end gap-3">
      <button
        type="button"
        class="h-10 cursor-pointer rounded-xl border border-[#004D3C] bg-[#004D3C] px-7 text-base font-black text-white transition-all duration-150 hover:border-[#00382c] hover:bg-[#00382c] hover:shadow-[0_8px_16px_-10px_rgba(0,77,60,0.55)] disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
        :disabled="!canMoveStep2"
        @click="emit('move-step', 2)"
      >
        {{ saleType === 'DONATION' ? '기부처 입력 →' : '거래처 매칭 →' }}
      </button>
    </div>
  </div>
  <div v-if="saleStep === 2" class="border-t border-gray-200 bg-gray-50 px-6 py-4">
    <div class="relative flex items-center justify-end gap-3">
      <div v-if="selectedBuyer" class="absolute left-2 right-[26rem] min-w-0">
        <div class="flex min-w-0 items-center gap-2">
          <span
            class="inline-flex h-6 items-center rounded-full bg-[#0F5C4D] px-2.5 text-[11px] font-black text-white"
          >
            선택됨
          </span>
          <span class="truncate text-base font-black text-gray-900">
            {{ selectedBuyer?.companyName || '-' }}
          </span>
          <span class="pt-[1px] text-sm font-bold leading-none text-gray-500">
            {{ selectedBuyer?.code || '-' }}
          </span>
          <span
            class="rounded-full border border-[#BFDCCF] bg-[#ECF7F1] px-2 py-0.5 text-[11px] font-black text-[#2F6B4F]"
          >
            {{ materialFitLabel(selectedBuyer?.primaryMaterialFit) || '-' }}
          </span>
        </div>
        <div class="h-1" />
        <p class="pl-[3.7rem] text-sm font-bold text-gray-500">
          {{ selectedBuyer?.industryGroup || '-' }} · 담당자
          {{ selectedBuyer?.managerName || '-' }} · {{ selectedBuyer?.phone || '-' }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="h-10 cursor-pointer rounded-xl border border-gray-300 bg-white px-6 text-base font-black text-gray-700 transition-all duration-150 hover:bg-gray-50 hover:shadow-sm"
          @click="emit('move-step', 1)"
        >
          ← 선택한 SKU 목록으로
        </button>
        <button
          type="button"
          class="h-10 cursor-pointer rounded-xl border px-7 text-base font-black text-white transition-all duration-150"
          :class="
            canMoveStep3
              ? 'border-[#004D3C] bg-[#004D3C] hover:border-[#00382c] hover:bg-[#00382c] hover:shadow-[0_8px_16px_-10px_rgba(0,77,60,0.55)]'
              : 'border-gray-300 bg-gray-400 text-white hover:bg-gray-500'
          "
          @click="emit('move-step', 3)"
        >
          {{ saleType === 'DONATION' ? '기부 조건 확정으로 →' : '판매 조건 확정으로 →' }}
        </button>
      </div>
    </div>
  </div>
  <div v-if="saleStep === 3" class="border-t border-gray-200 bg-gray-50 px-6 py-4">
    <div class="flex items-center justify-between gap-4">
      <p
        v-if="step3FooterWarning"
        class="pl-2 text-[11px] font-bold leading-5"
        :class="step3CanRegisterNow ? 'text-emerald-700' : 'text-red-600'"
      >
        {{ step3FooterWarning }}
        <span v-if="step3UnfilledSkuCount > 0 || step3ErrorSkuCount > 0" class="ml-2 text-gray-500">
          · 미입력 SKU {{ step3UnfilledSkuCount }}개 · 오류 SKU {{ step3ErrorSkuCount }}개
        </span>
      </p>
      <div v-else />
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="h-10 cursor-pointer rounded-xl border border-gray-300 bg-white px-6 text-base font-black text-gray-700 transition-all duration-150 hover:bg-gray-50 hover:shadow-sm"
          @click="emit('move-step', 2)"
        >
          {{ saleType === 'DONATION' ? '← 기부처 입력으로' : '← 거래처 매칭으로' }}
        </button>
        <button
          type="button"
          class="h-10 cursor-pointer rounded-xl border border-[#004D3C] bg-[#004D3C] px-7 text-base font-black text-white transition-all duration-150 hover:border-[#00382c] hover:bg-[#00382c] hover:shadow-[0_8px_16px_-10px_rgba(0,77,60,0.55)] disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
          :disabled="!step3CanRegisterNow"
          @click="emit('open-final-review')"
        >
          {{ saleType === 'DONATION' ? '최종 기부 등록서 확인' : '최종 판매 등록서 확인' }}
        </button>
      </div>
    </div>
  </div>
</template>
