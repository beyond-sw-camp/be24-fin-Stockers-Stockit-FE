<script setup>
import { computed } from 'vue'
import { AlertTriangle, CircleCheckBig, Info, X } from 'lucide-vue-next'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  tone: { type: String, default: 'success' },
  showHistoryAction: { type: Boolean, default: false },
  detailActionLabel: { type: String, default: '' },
})

const emit = defineEmits(['close', 'history', 'detail'])

const toneConfig = computed(() => {
  if (props.tone === 'error') {
    return {
      icon: AlertTriangle,
      iconWrap: 'bg-red-50 text-red-600',
      eyebrow: 'text-red-600',
      panel: 'border-red-100 bg-red-50',
      message: 'text-red-800',
      primary: 'bg-red-600 text-white hover:bg-red-700',
    }
  }

  if (props.tone === 'warning') {
    return {
      icon: Info,
      iconWrap: 'bg-amber-50 text-amber-600',
      eyebrow: 'text-amber-600',
      panel: 'border-amber-100 bg-amber-50',
      message: 'text-amber-800',
      primary: 'bg-[#004D3C] text-white hover:bg-[#00382c]',
    }
  }

  return {
    icon: CircleCheckBig,
    iconWrap: 'bg-emerald-50 text-emerald-600',
    eyebrow: 'text-emerald-600',
    panel: 'border-emerald-100 bg-emerald-50',
    message: 'text-emerald-800',
    primary: 'bg-[#004D3C] text-white hover:bg-[#00382c]',
  }
})
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-[70]" @keydown.esc="emit('close')">
    <div class="absolute inset-0 bg-black/45" @click="emit('close')" />
    <section
      class="absolute left-1/2 top-1/2 w-[92%] max-w-[460px] -translate-x-1/2 -translate-y-1/2 border border-gray-200 bg-white shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="warehouse-transfer-result-title"
    >
      <header class="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <div class="flex min-w-0 gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" :class="toneConfig.iconWrap">
            <component :is="toneConfig.icon" class="h-5 w-5" aria-hidden="true" />
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.18em]" :class="toneConfig.eyebrow">Warehouse Transfer</p>
            <h3 id="warehouse-transfer-result-title" class="mt-1 text-base font-black text-gray-900">{{ title }}</h3>
          </div>
        </div>
        <button
          type="button"
          class="flex h-8 w-8 shrink-0 items-center justify-center border border-gray-300 text-gray-600 hover:bg-gray-100"
          aria-label="닫기"
          @click="emit('close')"
        >
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div class="px-5 py-5">
        <div class="border px-4 py-3" :class="toneConfig.panel">
          <p class="whitespace-pre-line text-sm font-black leading-6" :class="toneConfig.message">{{ message }}</p>
        </div>
        <p class="mt-3 text-xs font-bold text-gray-500">처리 결과가 시스템에 반영되었습니다. 필요한 경우 이동내역에서 상세 상태를 확인하세요.</p>
      </div>

      <footer class="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4">
        <button
          v-if="detailActionLabel"
          type="button"
          class="h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 hover:bg-gray-100"
          @click="emit('detail')"
        >
          {{ detailActionLabel }}
        </button>
        <button
          v-if="showHistoryAction"
          type="button"
          class="h-9 border border-[#004D3C] bg-white px-4 text-xs font-black text-[#004D3C] hover:bg-[#EBF5F5]"
          @click="emit('history')"
        >
          이동내역 보기
        </button>
        <button
          type="button"
          class="h-9 px-5 text-xs font-black transition"
          :class="toneConfig.primary"
          @click="emit('close')"
        >
          확인
        </button>
      </footer>
    </section>
  </div>
</template>
