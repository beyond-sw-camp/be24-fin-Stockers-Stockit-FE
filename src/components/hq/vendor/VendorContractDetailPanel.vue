<script setup>
import {
  InfoIcon,
  PackageIcon,
  PencilIcon,
  PlusIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  Trash2Icon,
} from './icons.js'
import { formatPrice, statusClass, statusLabel } from './helpers.js'

defineProps({
  selectedRow: { type: Object, default: null },
  selectedVendor: { type: Object, default: null },
})

defineEmits(['create-contract', 'edit-contract', 'toggle-status', 'delete-contract'])
</script>

<template>
  <div
    class="flex w-72 shrink-0 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm"
  >
    <!-- 패널 헤더 -->
    <div class="flex items-center bg-[#004D3C] px-3 py-2.5 text-white">
      <h2 class="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider">
        <InfoIcon :size="13" />
        계약 조건 상세
      </h2>
    </div>

    <!-- 행 미선택 상태 -->
    <div
      v-if="!selectedRow"
      class="flex flex-1 flex-col items-center justify-center gap-3 text-center text-gray-400"
    >
      <PackageIcon :size="36" class="opacity-20" />
      <div>
        <p class="text-sm font-black">제품을 선택해주세요</p>
        <p class="mt-1 text-xs">
          제품 목록에서 행을 선택하면<br />상세 조건이 표시됩니다.
        </p>
      </div>
    </div>

    <!-- 상세 정보 -->
    <template v-else>
      <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <!-- 제품 기본 정보 (ProductMaster) -->
        <section class="space-y-2">
          <p class="text-[9px] font-black uppercase tracking-wider text-gray-400">제품 정보</p>
          <p class="text-sm font-black leading-snug text-gray-900">
            {{ selectedRow.productName }}
          </p>
          <div class="flex flex-wrap gap-1.5">
            <span
              class="border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600"
            >
              {{ selectedRow.productCode }}
            </span>
            <span
              class="border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600"
            >
              {{ selectedRow.categoryCode }}
            </span>
            <span
              class="px-2 py-0.5 text-[10px] font-black"
              :class="statusClass(selectedRow.status)"
            >
              {{ statusLabel(selectedRow.status) }}
            </span>
          </div>
          <p class="text-[10px] font-bold text-gray-500">
            기본단가 {{ formatPrice(selectedRow.basePrice) }}
          </p>
        </section>

        <!-- 미정 안내 -->
        <section
          v-if="!selectedRow.contracted"
          class="border border-sky-200 bg-sky-50 p-3 text-[11px] font-bold text-sky-700"
        >
          아직 계약 정보가 없는 제품입니다. 아래 [계약 등록] 으로 단가/MOQ/계약기간을 채우세요.
        </section>

        <!-- 계약 조건 (활성/일시중단/만료만) -->
        <template v-if="selectedRow.contracted">
          <section class="space-y-2.5">
            <p class="text-[9px] font-black uppercase tracking-wider text-gray-400">계약 조건</p>
            <div class="grid grid-cols-2 gap-2">
              <div class="border border-gray-100 bg-gray-50 p-2.5">
                <p class="text-[9px] font-bold uppercase text-gray-400">계약 단가</p>
                <strong class="mt-1 block text-sm font-black text-[#004D3C]">
                  {{ formatPrice(selectedRow.contractUnitPrice) }}
                </strong>
              </div>
              <div class="border border-gray-100 bg-gray-50 p-2.5">
                <p class="text-[9px] font-bold uppercase text-gray-400">최소 주문량 (MOQ)</p>
                <strong class="mt-1 block text-sm font-black text-gray-800">
                  {{ selectedRow.moq }} EA
                </strong>
              </div>
              <div class="border border-gray-100 bg-gray-50 p-2.5">
                <p class="text-[9px] font-bold uppercase text-gray-400">납기일수</p>
                <strong class="mt-1 block text-sm font-black text-gray-800">
                  {{ selectedRow.leadTimeDays }}일
                </strong>
              </div>
            </div>
          </section>

          <section class="space-y-2">
            <p class="text-[9px] font-black uppercase tracking-wider text-gray-400">계약 기간</p>
            <div class="space-y-1.5 text-xs font-bold text-gray-700">
              <div class="flex justify-between">
                <span class="text-gray-400">시작일</span>
                <span>{{ selectedRow.contractStart }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">종료일</span>
                <span :class="selectedRow.status === 'EXPIRED' ? 'text-red-600' : ''">
                  {{ selectedRow.contractEnd }}
                </span>
              </div>
            </div>
          </section>
        </template>

        <!-- 공급처 담당자 정보 -->
        <section v-if="selectedVendor" class="space-y-2 border-t border-gray-100 pt-3">
          <p class="text-[9px] font-black uppercase tracking-wider text-gray-400">
            공급처 담당자
          </p>
          <div class="space-y-1 text-xs font-bold">
            <p class="text-gray-800">{{ selectedVendor.contactPerson }}</p>
            <p class="text-gray-400">{{ selectedVendor.contactEmail }}</p>
            <p class="text-gray-400">{{ selectedVendor.phone }}</p>
          </div>
        </section>
      </div>

      <!-- 액션 버튼 영역 — 미정/활성 분기 -->
      <div class="flex flex-col gap-2 border-t border-gray-200 p-3">
        <!-- 미정 행: 계약 등록 -->
        <button
          v-if="!selectedRow.contracted"
          type="button"
          class="inline-flex w-full items-center justify-center gap-1.5 border border-[#004D3C] bg-[#004D3C] px-3 py-2 text-[11px] font-black text-white transition-colors hover:bg-[#1f4b3a]"
          @click="$emit('create-contract')"
        >
          <PlusIcon :size="13" />
          계약 등록
        </button>

        <!-- 활성 행: 수정 -->
        <button
          v-if="selectedRow.contracted"
          type="button"
          class="inline-flex w-full items-center justify-center gap-1.5 border px-3 py-2 text-[11px] font-black transition-colors"
          :class="
            selectedRow.status === 'EXPIRED'
              ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300'
              : 'border-[#004D3C] bg-[#004D3C] text-white hover:bg-[#1f4b3a]'
          "
          :disabled="selectedRow.status === 'EXPIRED'"
          @click="$emit('edit-contract')"
        >
          <PencilIcon :size="13" />
          {{ selectedRow.status === 'EXPIRED' ? '만료됨 (수정 불가)' : '수정' }}
        </button>

        <!-- 활성 행: 상태 변경 -->
        <button
          v-if="selectedRow.contracted"
          type="button"
          class="inline-flex w-full items-center justify-center gap-1.5 border px-3 py-2 text-[11px] font-black transition-colors"
          :class="
            selectedRow.status === 'ACTIVE'
              ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
              : selectedRow.status === 'EXPIRED'
                ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300'
                : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          "
          :disabled="selectedRow.status === 'EXPIRED'"
          @click="$emit('toggle-status')"
        >
          <ToggleRightIcon v-if="selectedRow.status === 'ACTIVE'" :size="13" />
          <ToggleLeftIcon v-else :size="13" />
          {{
            selectedRow.status === 'ACTIVE'
              ? '계약 정지'
              : selectedRow.status === 'SUSPENDED'
                ? '계약 활성화'
                : '만료됨 (변경 불가)'
          }}
        </button>

        <button
          v-if="selectedRow.contracted"
          type="button"
          class="inline-flex w-full items-center justify-center gap-1.5 border border-red-300 bg-red-50 px-3 py-2 text-[11px] font-black text-red-700 hover:bg-red-100"
          @click="$emit('delete-contract')"
        >
          <Trash2Icon :size="13" />
          삭제
        </button>
      </div>
    </template>
  </div>
</template>
