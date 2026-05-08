<script setup>
import { XIcon } from './icons.js'
import { formatPrice } from './helpers.js'

defineProps({
  open: { type: Boolean, required: true },
  mode: { type: String, required: true }, // 'create' | 'edit'
  selectedRow: { type: Object, default: null },
  formData: { type: Object, required: true },
  formErrors: { type: Object, required: true },
})

defineEmits(['close', 'submit'])
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-md border border-gray-300 bg-white shadow-xl">
      <!-- 모달 헤더 -->
      <div class="flex items-center justify-between bg-[#004D3C] px-4 py-3 text-white">
        <h3 class="text-[11px] font-black uppercase tracking-wider">
          {{ mode === 'create' ? '계약 등록' : '계약 수정' }}
        </h3>
        <button type="button" class="p-1 hover:bg-white/10" @click="$emit('close')">
          <XIcon :size="16" />
        </button>
      </div>

      <!-- 모달 본문 -->
      <div class="p-4 space-y-3">
        <!-- 제품 정보 read-only (ProductMaster 가 진실 원천) -->
        <div v-if="selectedRow" class="border border-gray-100 bg-gray-50 p-3">
          <p class="text-[9px] font-black uppercase tracking-wider text-gray-400">제품</p>
          <p class="mt-1 text-sm font-black text-gray-900">{{ selectedRow.productName }}</p>
          <p class="mt-0.5 text-[10px] font-bold text-gray-500">
            {{ selectedRow.productCode }} · {{ selectedRow.categoryCode }} · 기본단가 {{ formatPrice(selectedRow.basePrice) }}
          </p>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <label class="flex flex-col gap-1">
            <span class="text-[10px] font-black uppercase text-gray-400">계약 단가 (₩)</span>
            <input
              v-model="formData.unitPrice"
              type="number"
              min="0"
              placeholder="0"
              class="border bg-gray-50 px-3 py-2 text-xs outline-none focus:bg-white"
              :class="
                formErrors.unitPrice
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-300 focus:border-[#004D3C]'
              "
            />
            <p v-if="formErrors.unitPrice" class="mt-1 text-[10px] font-bold text-red-600">
              {{ formErrors.unitPrice }}
            </p>
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-[10px] font-black uppercase text-gray-400">MOQ (EA)</span>
            <input
              v-model="formData.moq"
              type="number"
              min="1"
              placeholder="0"
              class="border bg-gray-50 px-3 py-2 text-xs outline-none focus:bg-white"
              :class="
                formErrors.moq
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-300 focus:border-[#004D3C]'
              "
            />
            <p v-if="formErrors.moq" class="mt-1 text-[10px] font-bold text-red-600">
              {{ formErrors.moq }}
            </p>
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-[10px] font-black uppercase text-gray-400">납기일수</span>
            <input
              v-model="formData.leadTimeDays"
              type="number"
              min="1"
              placeholder="0"
              class="border bg-gray-50 px-3 py-2 text-xs outline-none focus:bg-white"
              :class="
                formErrors.leadTimeDays
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-300 focus:border-[#004D3C]'
              "
            />
            <p v-if="formErrors.leadTimeDays" class="mt-1 text-[10px] font-bold text-red-600">
              {{ formErrors.leadTimeDays }}
            </p>
          </label>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1">
            <span class="text-[10px] font-black uppercase text-gray-400">계약 시작일</span>
            <input
              v-model="formData.contractStart"
              type="date"
              class="border bg-gray-50 px-3 py-2 text-xs outline-none focus:bg-white"
              :class="
                formErrors.contractStart
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-300 focus:border-[#004D3C]'
              "
            />
            <p v-if="formErrors.contractStart" class="mt-1 text-[10px] font-bold text-red-600">
              {{ formErrors.contractStart }}
            </p>
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-[10px] font-black uppercase text-gray-400">계약 종료일</span>
            <input
              v-model="formData.contractEnd"
              type="date"
              class="border bg-gray-50 px-3 py-2 text-xs outline-none focus:bg-white"
              :class="
                formErrors.contractEnd
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-300 focus:border-[#004D3C]'
              "
            />
            <p v-if="formErrors.contractEnd" class="mt-1 text-[10px] font-bold text-red-600">
              {{ formErrors.contractEnd }}
            </p>
          </label>
        </div>
      </div>

      <!-- 모달 푸터 -->
      <div class="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
        <button
          type="button"
          class="border border-gray-300 bg-white px-4 py-2 text-[11px] font-black text-gray-700 hover:bg-gray-50"
          @click="$emit('close')"
        >
          취소
        </button>
        <button
          type="button"
          class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-[11px] font-black text-white hover:bg-[#1f4b3a]"
          @click="$emit('submit')"
        >
          {{ mode === 'create' ? '등록' : '저장' }}
        </button>
      </div>
    </div>
  </div>
</template>
