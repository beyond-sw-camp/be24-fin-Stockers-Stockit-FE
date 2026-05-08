<script setup>
import { BuildingIcon, SearchIcon } from './icons.js'
import { vendorStatusClass, vendorStatusLabel } from './helpers.js'

defineProps({
  vendors: { type: Array, required: true },
  selectedVendorId: { type: String, default: null },
  search: { type: String, default: '' },
  statusFilter: { type: String, default: 'all' },
})

defineEmits(['update:search', 'update:status-filter', 'select'])
</script>

<template>
  <div
    class="flex w-64 shrink-0 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm"
  >
    <!-- 패널 헤더 -->
    <div class="flex items-center justify-between bg-[#004D3C] px-3 py-2.5 text-white">
      <h2 class="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider">
        <BuildingIcon :size="13" />
        공급처 목록
      </h2>
      <span class="text-[10px] font-bold opacity-70">{{ vendors.length }}개</span>
    </div>

    <!-- 검색 / 필터 -->
    <div class="border-b border-gray-200 p-2 space-y-2">
      <label class="relative block">
        <SearchIcon
          :size="13"
          class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          :value="search"
          type="text"
          placeholder="공급처명 / 담당자 검색..."
          class="w-full border border-gray-300 bg-gray-50 py-1.5 pl-7 pr-2 text-[11px] outline-none focus:border-[#004D3C] focus:bg-white"
          @input="$emit('update:search', $event.target.value)"
        />
      </label>
      <select
        :value="statusFilter"
        class="w-full appearance-none border border-gray-300 bg-gray-50 px-2 py-1.5 text-[11px] font-bold text-gray-700 outline-none focus:border-[#004D3C]"
        @change="$emit('update:status-filter', $event.target.value)"
      >
        <option value="all">전체 상태</option>
        <option value="active">활성</option>
        <option value="inactive">비활성</option>
      </select>
    </div>

    <!-- 공급처 리스트 -->
    <div class="flex-1 overflow-y-auto divide-y divide-gray-100">
      <div
        v-if="vendors.length === 0"
        class="flex flex-col items-center justify-center gap-2 py-10 text-center text-[11px] text-gray-400"
      >
        <BuildingIcon :size="28" class="opacity-30" />
        <p>공급처가 없습니다.</p>
      </div>

      <button
        v-for="v in vendors"
        :key="v.id"
        type="button"
        class="w-full px-3 py-3 text-left transition-colors hover:bg-gray-50"
        :class="selectedVendorId === v.id ? 'bg-[#E6F2F0]' : ''"
        @click="$emit('select', v.id)"
      >
        <div class="flex items-center justify-between gap-1">
          <span
            class="max-w-[130px] truncate text-[12px] font-black text-gray-800"
            :class="selectedVendorId === v.id ? 'text-[#004D3C]' : ''"
          >
            {{ v.name }}
          </span>
          <span
            class="shrink-0 px-1.5 py-0.5 text-[9px] font-black"
            :class="vendorStatusClass(v.status)"
          >
            {{ vendorStatusLabel(v.status) }}
          </span>
        </div>
        <p class="mt-0.5 truncate text-[10px] text-gray-400">
          {{ v.contactPerson }} · {{ v.phone }}
        </p>
      </button>
    </div>
  </div>
</template>
