<script setup>
import { computed } from 'vue'
import { Building2, Layers3, Truck } from 'lucide-vue-next'

const props = defineProps({
  recommendations: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  selectedBuyerCode: { type: String, default: '' },
  materialFitLabel: { type: Function, required: true },
  lockedMaterialType: { type: String, default: '' },
})

const emit = defineEmits(['select', 'retry', 'switch-to-manual'])

const hasError = computed(() => Boolean(props.error))
const hasResults = computed(
  () => !props.loading && !hasError.value && props.recommendations.length > 0,
)
const isEmpty = computed(
  () => !props.loading && !hasError.value && props.recommendations.length === 0,
)

const rationaleSectionLabels = {
  companyRationale: '어떤 거래처 인가요?',
  materialRationale: '소재 매칭 리포트',
  distanceRationale: '물류 및 이동 최적화 분석',
}

const rationaleSectionIcons = {
  companyRationale: Building2,
  materialRationale: Layers3,
  distanceRationale: Truck,
}

function recommendationRationaleSections(rec) {
  const keys = ['companyRationale', 'materialRationale', 'distanceRationale']
  const sections = keys
    .map((key) => ({
      key,
      title: rationaleSectionLabels[key],
      icon: rationaleSectionIcons[key],
      body: String(rec?.[key] ?? '').trim(),
    }))
    .filter((section) => section.body)

  return sections.length === keys.length ? sections : []
}
</script>

<template>
  <div class="flex flex-col">
    <div class="mb-3 flex items-center justify-between gap-2">
      <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
        AI Recommendations
      </p>
      <p v-if="hasResults" class="text-[10px] font-semibold text-gray-400">
        소재 구분 {{ lockedMaterialType || '-' }} 기준 · 매칭 {{ recommendations.length }}건
      </p>
      <p v-else-if="loading" class="text-[10px] font-semibold text-gray-400">
        소재 구분 {{ lockedMaterialType || '-' }} 기준 분석 중
      </p>
    </div>

    <template v-if="loading">
      <div
        class="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#EAF4F0] px-3 py-1 text-[10px] font-black text-[#0F5C4D]"
      >
        <span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#0F5C4D]" />
        AI 추천 분석 중...
      </div>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="i in 5"
          :key="`skel-${i}`"
          class="flex flex-col gap-2 rounded-md border border-gray-200 bg-white px-4 py-3.5"
        >
          <div class="flex items-center justify-between">
            <div class="h-3 w-16 animate-pulse rounded bg-gray-100" />
            <div class="h-3 w-12 animate-pulse rounded bg-gray-100" />
          </div>
          <div class="mt-1 h-4 w-2/3 animate-pulse rounded bg-gray-100" />
          <div class="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
          <div class="mt-2 h-3 w-full animate-pulse rounded bg-gray-100" />
          <div class="h-3 w-4/5 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    </template>

    <template v-else-if="hasError">
      <div
        class="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-[11px] font-medium leading-5 text-red-700"
      >
        {{ error }}
      </div>
      <button
        type="button"
        class="mt-3 h-8 w-fit rounded-md border border-gray-300 bg-white px-3 text-[11px] font-bold text-gray-700 transition hover:bg-gray-50"
        @click="emit('retry')"
      >
        다시 시도
      </button>
    </template>

    <template v-else-if="isEmpty">
      <div
        class="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center"
      >
        <p class="text-xs font-semibold text-gray-600">
          조건에 맞는 거래처를 찾지 못했습니다.
        </p>
        <p class="mt-1 text-[11px] font-medium text-gray-500">
          소재 구분 {{ lockedMaterialType || '-' }} 기준 후보가 없습니다.
        </p>
        <button
          type="button"
          class="mt-4 h-8 rounded-md border border-[#004D3C] bg-white px-4 text-[11px] font-bold text-[#004D3C] transition hover:bg-[#F3FAF8]"
          @click="emit('switch-to-manual')"
        >
          수동 검색으로 전환
        </button>
      </div>
    </template>

    <template v-else>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <button
          v-for="(rec, i) in recommendations"
          :key="rec.code"
          type="button"
          class="rec-card relative flex flex-col items-stretch rounded-md border bg-white px-4 py-3.5 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
          :class="rec.code === selectedBuyerCode
            ? 'border-[#0F5C4D] bg-[#F3FAF8] ring-2 ring-[#0F5C4D] ring-offset-1'
            : 'border-gray-200 hover:border-[#B7D8D1]'"
          :style="{ animationDelay: `${i * 60}ms` }"
          @click="emit('select', rec.code)"
        >
          <div class="flex items-start justify-between gap-2">
            <span
              v-if="i === 0"
              class="rounded-full bg-[#0F5C4D] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white"
            >
              Top match
            </span>
            <span v-else />
            <span
              class="whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold"
              :class="rec.code === selectedBuyerCode
                ? 'bg-[#0F5C4D] text-white'
                : 'bg-[#EAF4F0] text-[#255F52]'"
            >
              <template v-if="rec.code === selectedBuyerCode">✓ </template>{{ materialFitLabel(rec.primaryMaterialFit) }}
            </span>
          </div>

          <p class="mt-2 text-sm font-black text-gray-900">{{ rec.companyName }}</p>
          <p class="mt-0.5 text-[11px] font-semibold text-gray-500">{{ rec.industryGroup }}</p>
          <p
            v-if="rec.distanceKm !== null && rec.distanceKm !== undefined"
            class="mt-1 text-[11px] font-bold text-[#0F5C4D]"
          >
            창고 기준 약 {{ Number(rec.distanceKm).toFixed(2) }}km
          </p>

          <div class="mt-3">
            <p class="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-400">AI 사유</p>
            <div v-if="recommendationRationaleSections(rec).length > 0" class="mt-3 space-y-0">
              <section
                v-for="(section, sectionIndex) in recommendationRationaleSections(rec)"
                :key="section.key"
                class="py-1 pl-0"
                :style="{ marginTop: sectionIndex === 0 ? '0px' : '9px' }"
              >
                <div class="flex items-center gap-1 text-[11px] font-black leading-none text-[#0F5C4D]">
                  <component :is="section.icon" class="h-3.5 w-3.5 shrink-0" :stroke-width="2.1" />
                  <span>{{ section.title }}</span>
                </div>
                <p class="mt-2 text-sm font-medium leading-6 text-gray-700">
                  {{ section.body }}
                </p>
              </section>
            </div>
            <p v-else class="mt-2 text-sm font-medium leading-6 text-gray-700">
              {{ rec.rationale || '추천 근거 데이터가 없습니다.' }}
            </p>
          </div>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.rec-card {
  animation: fadeInUp 0.32s ease-out both;
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(6px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
