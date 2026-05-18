<script setup>
import { computed } from 'vue'
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-vue-next'

const props = defineProps({
  page: { type: Number, required: true },          // 0-based
  size: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  totalElements: { type: Number, required: true },
  hasPrevious: { type: Boolean, required: true },
  hasNext: { type: Boolean, required: true },
  sizeOptions: { type: Array, default: () => [20, 50, 100] },
})

const emit = defineEmits(['update:page', 'update:size'])

const WINDOW = 5

// 표시할 페이지 번호 윈도우 (1-based, 현재 ±2 기본)
const pageWindow = computed(() => {
  const total = Math.max(props.totalPages, 1)
  const current1 = props.page + 1
  let start = Math.max(1, current1 - 2)
  let end = Math.min(total, start + WINDOW - 1)
  if (end - start + 1 < WINDOW) {
    start = Math.max(1, end - WINDOW + 1)
  }
  const out = []
  for (let i = start; i <= end; i++) out.push(i)
  return out
})

function goFirst() {
  if (props.page !== 0) emit('update:page', 0)
}
function goPrev() {
  if (props.hasPrevious) emit('update:page', props.page - 1)
}
function goNext() {
  if (props.hasNext) emit('update:page', props.page + 1)
}
function goLast() {
  const last = Math.max(props.totalPages - 1, 0)
  if (props.page !== last) emit('update:page', last)
}
function goPage(p1) {
  emit('update:page', p1 - 1)
}
function onSizeChange(e) {
  const next = Number(e.target.value)
  if (Number.isFinite(next) && next > 0) emit('update:size', next)
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3">
    <p class="text-[11px] font-bold text-gray-500">총 {{ totalElements.toLocaleString() }}건</p>

    <div class="flex items-center gap-1">
      <button
        type="button"
        class="flex h-7 w-7 items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="page === 0"
        aria-label="첫 페이지"
        @click="goFirst"
      >
        <ChevronsLeft :size="14" />
      </button>
      <button
        type="button"
        class="flex h-7 w-7 items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!hasPrevious"
        aria-label="이전 페이지"
        @click="goPrev"
      >
        <ChevronLeft :size="14" />
      </button>

      <button
        v-for="p in pageWindow"
        :key="p"
        type="button"
        class="flex h-7 min-w-7 items-center justify-center px-2 text-[11px] font-black"
        :class="p - 1 === page
          ? 'bg-[#004D3C] text-white'
          : 'border border-gray-200 text-gray-700 hover:bg-[#EBF5F5]'"
        @click="goPage(p)"
      >
        {{ p }}
      </button>

      <button
        type="button"
        class="flex h-7 w-7 items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!hasNext"
        aria-label="다음 페이지"
        @click="goNext"
      >
        <ChevronRight :size="14" />
      </button>
      <button
        type="button"
        class="flex h-7 w-7 items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="page >= totalPages - 1 || totalPages <= 0"
        aria-label="마지막 페이지"
        @click="goLast"
      >
        <ChevronsRight :size="14" />
      </button>
    </div>

    <label class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
      페이지당
      <select
        :value="size"
        class="h-7 border border-gray-300 bg-white px-2 text-[11px] font-bold text-gray-900 outline-none focus:border-[#004D3C]"
        @change="onSizeChange"
      >
        <option v-for="opt in sizeOptions" :key="opt" :value="opt">{{ opt }}</option>
      </select>
    </label>
  </div>
</template>
