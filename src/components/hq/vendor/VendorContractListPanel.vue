<script setup>
import { computed } from 'vue'
import { BuildingIcon, PackageIcon } from './icons.js'
import { formatPrice, statusClass, statusLabel } from './helpers.js'

const props = defineProps({
  selectedVendor: { type: Object, default: null },
  contracts: { type: Array, required: true },
  selectedProductCode: { type: String, default: null },
})

defineEmits(['select-row'])

const contractedCount = computed(
  () => props.contracts.filter((r) => r.contracted).length,
)
const pendingCount = computed(
  () => props.contracts.filter((r) => !r.contracted).length,
)
</script>

<template>
  <div
    class="flex min-w-0 flex-1 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm"
  >
    <!-- 패널 헤더 -->
    <div class="flex items-center justify-between bg-[#004D3C] px-3 py-2.5 text-white">
      <h2 class="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider">
        <PackageIcon :size="13" />
        <span v-if="selectedVendor"> {{ selectedVendor.name }} — 계약 제품 </span>
        <span v-else>계약 제품 목록</span>
      </h2>
      <span v-if="selectedVendor" class="text-[10px] font-bold text-white/60">
        제품 마스터 자동 노출
      </span>
    </div>

    <!-- 공급처 미선택 상태 -->
    <div
      v-if="!selectedVendor"
      class="flex flex-1 flex-col items-center justify-center gap-3 text-center text-gray-400"
    >
      <BuildingIcon :size="40" class="opacity-20" />
      <div>
        <p class="text-sm font-black">공급처를 선택해주세요</p>
        <p class="mt-1 text-xs">
          좌측 목록에서 공급처를 선택하면<br />계약 제품 목록이 표시됩니다.
        </p>
      </div>
    </div>

    <!-- 계약 제품 테이블 (E 안 — ContractRow[]) -->
    <template v-else>
      <div class="overflow-auto flex-1">
        <table class="w-full min-w-[640px] table-fixed border-collapse text-xs">
          <thead
            class="sticky top-0 z-10 bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500"
          >
            <tr>
              <th class="px-3 py-2 text-left font-black">제품명</th>
              <th class="w-32 px-3 py-2 text-left font-black">카테고리</th>
              <th class="w-24 px-3 py-2 text-right font-black">계약단가</th>
              <th class="w-14 px-3 py-2 text-right font-black">MOQ</th>
              <th class="w-16 px-3 py-2 text-right font-black">납기(일)</th>
              <th class="w-20 px-3 py-2 text-center font-black">상태</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="contracts.length === 0">
              <td colspan="6" class="py-12 text-center text-[11px] text-gray-400">
                이 공급처에 매핑된 제품 마스터가 없습니다.<br />
                제품 마스터 페이지에서 메인 공급처를 이 공급처로 지정해 등록하세요.
              </td>
            </tr>

            <tr
              v-for="row in contracts"
              :key="row.productCode"
              class="cursor-pointer transition-colors hover:bg-gray-50"
              :class="selectedProductCode === row.productCode ? 'bg-[#E6F2F0]' : ''"
              @click="$emit('select-row', row.productCode)"
            >
              <td class="truncate px-3 py-2.5 font-black text-gray-800">
                {{ row.productName }}
              </td>
              <td class="truncate px-3 py-2.5 font-bold text-gray-500">
                {{ row.categoryCode }}
              </td>
              <td class="px-3 py-2.5 text-right font-black text-gray-800">
                {{ row.contracted ? formatPrice(row.contractUnitPrice) : '—' }}
              </td>
              <td class="px-3 py-2.5 text-right font-bold text-gray-600">
                {{ row.contracted ? row.moq : '—' }}
              </td>
              <td class="px-3 py-2.5 text-right font-bold text-gray-600">
                {{ row.contracted ? row.leadTimeDays : '—' }}
              </td>
              <td class="px-3 py-2.5 text-center">
                <span
                  class="inline-flex px-2 py-0.5 text-[10px] font-black"
                  :class="statusClass(row.status)"
                >
                  {{ statusLabel(row.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 요약 푸터 -->
      <div
        class="border-t border-gray-200 bg-gray-50 px-3 py-2 text-[10px] font-bold text-gray-500"
      >
        총 {{ contracts.length }}개 제품 ·
        계약 {{ contractedCount }}건 ·
        미정 {{ pendingCount }}건
      </div>
    </template>
  </div>
</template>
