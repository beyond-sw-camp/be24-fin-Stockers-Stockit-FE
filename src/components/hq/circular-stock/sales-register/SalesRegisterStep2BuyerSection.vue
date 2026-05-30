<script setup>
import { computed, ref, watch } from 'vue'
import { BadgeCheck, Bot, Building2, Info, Layers3, Loader2, MapPin, Package, Phone, Sprout, Truck, User } from 'lucide-vue-next'
import PaginationNav from '@/components/common/PaginationNav.vue'

const props = defineProps({
  buyerPanelMode: { type: String, required: true },
  buyerSearchTerm: { type: String, required: true },
  outboundWarehouseLabel: { type: String, required: true },
  lockedMaterialType: { type: String, default: '' },
  selectedBuyer: { type: Object, default: null },
  filteredBuyers: { type: Array, required: true },
  topRecommendations: { type: Array, required: true },
  isRecommendationLoading: { type: Boolean, required: true },
  recommendationError: { type: String, default: '' },
  recommendationTotalCount: { type: Number, required: true },
  expandedRecommendationCode: { type: String, default: '' },
  visibleRationaleCodes: { type: Object, required: true },
  materialFitLabel: { type: Function, required: true },
  recommendationProductLabel: { type: Function, required: true },
  recommendationManagerLabel: { type: Function, required: true },
  recommendationPhoneLabel: { type: Function, required: true },
  recommendationLocationLabel: { type: Function, required: true },
  companyBadgeText: { type: Function, required: true },
  companyBadgeClass: { type: Function, required: true },
  isSocialEnterprise: { type: Function, required: true },
  isLocalSmallPartner: { type: Function, required: true },
  isNewPartner: { type: Function, required: true },
  recommendationBonusReason: { type: Function, required: true },
})

const emit = defineEmits([
  'update:buyer-panel-mode',
  'update:buyer-search-term',
  'toggle-recommendation-detail',
  'select-recommendation',
  'select-buyer',
])

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

// ---- 수동 선택 페이지네이션 ----
const manualPage = ref(0)
const manualPageSize = ref(10)

const manualTotalPages = computed(() =>
  Math.max(1, Math.ceil(props.filteredBuyers.length / manualPageSize.value)),
)
const manualHasPrevious = computed(() => manualPage.value > 0)
const manualHasNext = computed(() => manualPage.value < manualTotalPages.value - 1)
const pagedBuyers = computed(() => {
  const start = manualPage.value * manualPageSize.value
  return props.filteredBuyers.slice(start, start + manualPageSize.value)
})

watch(() => props.filteredBuyers, () => { manualPage.value = 0 })

const handleManualPageSize = (size) => {
  manualPageSize.value = size
  manualPage.value = 0
}
</script>

<template>
  <div class="mt-0">
    <section>
      <div class="border-b border-gray-200">
        <div class="flex items-end gap-0">
          <button
            type="button"
            class="inline-flex h-11 items-center gap-2 border-b-2 px-8 text-sm font-black transition"
            :class="
              buyerPanelMode === 'ai'
                ? 'border-[#2D5B35] text-[#1F2937]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            "
            @click="emit('update:buyer-panel-mode', 'ai')"
          >
            <Bot class="h-3.5 w-3.5 text-[#7A5A2D]" :stroke-width="2.2" />
            <span class="text-sm font-black leading-none">AI 추천</span>
            <span
              v-if="!isRecommendationLoading"
              class="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D4E8D2] px-1.5 text-[11px] font-black text-[#2D5B35]"
            >
              {{ recommendationTotalCount }}
            </span>
          </button>

          <button
            type="button"
            class="inline-flex h-11 items-center gap-2 border-b-2 px-8 text-sm font-black leading-none transition"
            :class="
              buyerPanelMode === 'manual'
                ? 'border-[#2D5B35] text-[#1F2937]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            "
            @click="emit('update:buyer-panel-mode', 'manual')"
          >
            <span>수동 선택</span>
            <span class="text-[11px] font-bold text-gray-500">전체</span>
          </button>
        </div>
      </div>
      <div class="h-4" />
      <div
        v-if="buyerPanelMode === 'ai'"
        class="flex items-start gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700"
      >
        <Info class="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" :stroke-width="2" />
        <span>
          출고 창고 {{ outboundWarehouseLabel }} 기준,
          선택된 소재 정보를 기반으로 DB에서 가장 적합한 거래처 5곳을 AI가 분석했습니다.
          각 거래처를 클릭해 AI 거래처 매칭 추천 상세 이유를 확인하세요.
        </span>
      </div>
      <div v-if="buyerPanelMode === 'ai'" class="h-3" />

      <div v-if="buyerPanelMode === 'ai'" class="space-y-5">
        <div v-if="isRecommendationLoading && topRecommendations.length === 0">
          <div
            class="mb-2 flex items-center gap-2 pl-2 text-sm text-gray-700"
            style="font-weight: 700; margin-bottom: 8px"
          >
            <Loader2 class="h-4 w-4 animate-spin text-[#2E5734]" :stroke-width="2.2" />
            <span>AI가 거래처 추천 이유를 분석중입니다.</span>
          </div>
          <template v-for="n in 5" :key="`rec-skeleton-${n}`">
            <div class="overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-4">
              <div class="grid grid-cols-[28px_40px_minmax(0,1fr)_auto] items-start gap-3">
                <div class="mt-1 h-7 w-7 animate-pulse rounded-full bg-gray-200" />
                <div class="h-10 w-10 animate-pulse rounded-xl bg-gray-200" />
                <div>
                  <div class="h-4 w-56 animate-pulse rounded bg-gray-200" />
                  <div class="h-4 w-72 animate-pulse rounded bg-gray-200" style="margin-top: 8px" />
                  <div class="h-4 w-80 animate-pulse rounded bg-gray-200" style="margin-top: 8px" />
                </div>
                <div class="h-9 w-20 animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
            <div v-if="n < 5" class="h-3" />
          </template>
        </div>
        <div
          v-else-if="recommendationError"
          class="rounded-md border border-red-200 bg-red-50 px-3 py-4 text-xs font-bold text-red-700"
        >
          {{ recommendationError }}
        </div>
        <div
          v-else-if="topRecommendations.length === 0"
          class="rounded-md border border-gray-200 bg-gray-50 px-3 py-4 text-xs font-bold text-gray-500"
        >
          추천 결과가 없습니다. 수동 검색으로 거래처를 선택하세요.
        </div>
        <article
          v-for="(rec, index) in topRecommendations"
          :key="rec.code"
          class="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-[#9DBCAF] hover:shadow-[0_10px_24px_-14px_rgba(15,92,77,0.45)]"
          :class="
            selectedBuyer?.id === rec.code ||
            selectedBuyer?.code === rec.code ||
            expandedRecommendationCode === rec.code
              ? 'bg-[#F9FCFB]'
              : ''
          "
          :style="{
            marginBottom: index === topRecommendations.length - 1 ? '0px' : '20px',
            borderColor:
              selectedBuyer?.id === rec.code ||
              selectedBuyer?.code === rec.code ||
              expandedRecommendationCode === rec.code
                ? '#6EA08F'
                : undefined,
            boxShadow:
              selectedBuyer?.id === rec.code ||
              selectedBuyer?.code === rec.code ||
              expandedRecommendationCode === rec.code
                ? '0 10px 24px -14px rgba(15,92,77,0.35)'
                : undefined,
          }"
        >
          <div
            class="cursor-pointer px-5 py-4"
            @click="emit('toggle-recommendation-detail', rec.code)"
          >
            <!-- 상단 행: 순위 + 뱃지 + 회사명 + 선택 버튼 -->
            <div class="flex items-center gap-3">
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black leading-none"
                :class="
                  selectedBuyer?.id === rec.code || selectedBuyer?.code === rec.code
                    ? 'bg-[#234D31] text-white'
                    : 'bg-gray-100 text-gray-500'
                "
              >
                {{ index + 1 }}
              </span>
              <span
                class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black tracking-tight"
                :class="companyBadgeClass(index)"
                style="font-weight: 700"
              >
                {{ companyBadgeText(rec.companyName) }}
              </span>
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <p class="text-base font-black leading-none text-gray-900">
                  {{ rec.companyName }}
                </p>
                <span class="font-mono text-xs font-bold leading-none text-gray-400">{{ rec.code }}</span>
                <span
                  v-if="isSocialEnterprise(rec)"
                  class="rounded-full border border-[#D9C6F7] bg-[#F1EAFE] px-2.5 py-1 text-[11px] font-black leading-none text-[#6C3FB4]"
                >
                  사회적기업
                </span>
                <span
                  v-if="isLocalSmallPartner(rec)"
                  class="rounded-full border border-[#F3C8D1] bg-[#FCECEF] px-2.5 py-1 text-[11px] font-black leading-none text-[#B24563]"
                >
                  소규모 기업
                </span>
                <span
                  v-if="isNewPartner(rec, index)"
                  class="rounded-full border border-[#F2DE9C] bg-[#FFF8DC] px-2.5 py-1 text-[11px] font-black leading-none text-[#9A6A00]"
                >
                  신규 거래처
                </span>
              </div>
              <button
                type="button"
                class="inline-flex h-9 shrink-0 items-center rounded-xl px-4 text-sm font-extrabold tracking-[0.01em] transition-all duration-200 active:scale-[0.98]"
                :class="
                  selectedBuyer?.id === rec.code || selectedBuyer?.code === rec.code
                    ? 'border border-[#7FA28A] bg-[#F3FAF4] text-[#285734] font-black shadow-[0_3px_10px_-8px_rgba(34,84,52,0.45)]'
                    : 'border border-[#315E3B] bg-[#315E3B] text-white shadow-[0_8px_16px_-10px_rgba(26,64,41,0.55)] hover:border-[#2A5032] hover:bg-[#2A5032]'
                "
                @click.stop="emit('select-recommendation', rec.code)"
              >
                <template v-if="selectedBuyer?.id === rec.code || selectedBuyer?.code === rec.code">
                  <span class="inline-flex items-center gap-1">
                    <BadgeCheck class="h-4 w-4" :stroke-width="2.2" />
                    <span>선택됨</span>
                  </span>
                </template>
                <template v-else>선택</template>
              </button>
            </div>

            <!-- 하단 정보: 순위(28)+gap(12)+뱃지(40)+gap(12) = 92px 들여쓰기 -->
            <div style="padding-left: 92px">
              <!-- 업종 + 소재 -->
              <div class="flex flex-wrap items-center gap-x-5 gap-y-2" style="margin-top: 1px">
                <span class="flex items-center gap-1.5 text-sm font-bold text-gray-600">
                  <Building2 class="h-3.5 w-3.5 shrink-0 text-gray-400" :stroke-width="2" />
                  {{ rec.industryGroup || '-' }}
                </span>
                <span class="flex items-center gap-1.5 text-sm font-bold text-gray-600">
                  <Layers3 class="h-3.5 w-3.5 shrink-0 text-gray-400" :stroke-width="2" />
                  {{ lockedMaterialType || '-' }}
                </span>
              </div>

              <!-- 취급 제품 -->
              <div class="flex items-center gap-1.5 text-sm font-bold text-gray-400" style="margin-top: 4px">
                <Package class="h-3.5 w-3.5 shrink-0 text-gray-300" :stroke-width="2" />
                {{ recommendationProductLabel(rec, index) }}
              </div>

              <!-- 담당자 + 연락처 + 위치 -->
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5" style="margin-top: 6px">
                <span class="flex items-center gap-1 text-xs font-bold text-gray-500">
                  <User class="h-3 w-3 shrink-0 text-gray-400" :stroke-width="2" />
                  {{ recommendationManagerLabel(rec, index) }}
                </span>
                <span class="flex items-center gap-1 text-xs font-bold text-gray-400">
                  <Phone class="h-3 w-3 shrink-0" :stroke-width="2" />
                  {{ recommendationPhoneLabel(rec, index) }}
                </span>
                <span class="flex items-center gap-1 text-xs font-bold text-gray-400">
                  <MapPin class="h-3 w-3 shrink-0" :stroke-width="2" />
                  {{ recommendationLocationLabel(rec) }}
                </span>
              </div>
            </div>
          </div>
          <div
            v-if="expandedRecommendationCode === rec.code"
            class="border-t border-[#E5EEEA] bg-[#F8FBFA] px-5 py-5 text-xs"
          >
            <div class="pl-[calc(28px+40px+0.75rem)] pr-16">
              <p class="font-black text-[#0F5C4D]" style="font-weight: 700; margin-top: 2px; margin-bottom: 12px">
                AI 추천 이유
              </p>
              <div v-if="!visibleRationaleCodes[rec.code]" class="mt-4 space-y-3">
                <div
                  v-for="label in ['어떤 거래처 인가요?', '소재 매칭 리포트', '물류 및 이동 최적화 분석']"
                  :key="label"
                  class="space-y-2"
                >
                  <div class="h-4 w-32 animate-pulse rounded bg-[#D3E4DE]" />
                  <div class="h-5 w-[94%] animate-pulse rounded bg-gray-200" />
                  <div class="h-5 w-[88%] animate-pulse rounded bg-gray-200" />
                  <div class="h-5 w-[72%] animate-pulse rounded bg-gray-200" />
                </div>
              </div>
              <div v-else-if="recommendationRationaleSections(rec).length > 0" class="mt-4 space-y-0">
                <section
                  v-for="(section, sectionIndex) in recommendationRationaleSections(rec)"
                  :key="section.key"
                  class="py-1.5 pl-0"
                  :style="{ marginTop: sectionIndex === 0 ? '0px' : '9px' }"
                >
                  <div class="flex items-center gap-1.5 text-sm font-black leading-none text-[#0F5C4D]">
                    <component :is="section.icon" class="h-4 w-4 shrink-0" :stroke-width="2.2" />
                    <span>{{ section.title }}</span>
                  </div>
                  <p class="mt-3 text-sm font-bold leading-6 text-gray-700">
                    {{ section.body }}
                  </p>
                </section>
              </div>
              <p v-else class="mt-3 whitespace-pre-line text-sm font-bold leading-6 text-gray-700">
                {{ rec.rationale || '추천 근거 데이터가 없습니다.' }}
              </p>
            </div>
          </div>
          <div
            v-if="isSocialEnterprise(rec) || isLocalSmallPartner(rec) || isNewPartner(rec, index)"
            class="border-t border-[#D4E4D6] bg-[#EAF2EC] px-4 py-2 text-sm font-semibold text-[#2C5131]"
          >
            <div class="flex items-center gap-2 pl-[calc(28px+40px+0.75rem)] pr-4">
              <Sprout class="h-4 w-4 shrink-0 text-[#2E5734]" :stroke-width="2" />
              <span>
                이 거래처와 거래하면
                <span class="font-black">ESG 나무 +150점</span> 추가 적립
                <span class="text-xs font-bold text-[#4E6D54]">
                  ({{ recommendationBonusReason(rec, index) }})
                </span>
              </span>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="mt-4 flex flex-col gap-3">
        <!-- 검색 -->
        <div class="flex items-center gap-3">
          <input
            :value="buyerSearchTerm"
            type="search"
            class="h-10 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
            placeholder="거래처명, 코드, 담당자, 연락처, 소재, 지역으로 검색..."
            @input="emit('update:buyer-search-term', $event.target.value)"
          />
        </div>

        <p class="text-right text-xs font-bold text-gray-400">
          현재 선택된 소재 구분에 맞는 거래처만 표시됩니다.
        </p>

        <!-- 테이블 -->
        <div class="overflow-hidden rounded-xl border border-gray-200">
          <table v-if="filteredBuyers.length > 0" class="w-full border-collapse text-left text-sm">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-50 text-[11px] font-black uppercase tracking-[0.1em] text-gray-400">
                <th class="w-[13%] px-4 py-3">거래처</th>
                <th class="w-[18%] px-2 py-3 text-center">취급 소재</th>
                <th class="w-[27%] px-4 py-3">업종 · 제품</th>
                <th class="w-[18%] px-4 py-3">담당자</th>
                <th class="w-[14%] px-4 py-3">소재지</th>
                <th class="w-[10%] px-4 py-3" />
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="buyer in pagedBuyers"
                :key="buyer.id"
                class="transition-colors duration-100"
                :class="
                  selectedBuyer?.id === buyer.id
                    ? 'bg-[#EBF5EE]'
                    : 'hover:bg-[#F6FBF9]'
                "
              >
                <!-- 거래처명 + 코드 -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1.5">
                    <span
                      class="font-black"
                      :class="selectedBuyer?.id === buyer.id ? 'text-[#1B4228]' : 'text-gray-900'"
                    >{{ buyer.companyName }}</span>
                    <BadgeCheck
                      v-if="selectedBuyer?.id === buyer.id"
                      class="h-4 w-4 shrink-0 text-[#2D5B35]"
                      :stroke-width="2.5"
                    />
                  </div>
                  <p class="mt-0.5 font-mono text-xs font-bold text-gray-400">{{ buyer.code }}</p>
                </td>

                <!-- 취급 소재 -->
                <td class="px-2 py-3 text-center">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black"
                    :class="
                      selectedBuyer?.id === buyer.id
                        ? 'bg-[#D4E8D4] text-[#1B4228]'
                        : 'bg-gray-100 text-gray-600'
                    "
                  >
                    {{ materialFitLabel(buyer.primaryMaterialFit) || '-' }}
                  </span>
                </td>

                <!-- 업종 + 제품 -->
                <td class="px-4 py-3">
                  <p class="font-bold text-gray-800">{{ buyer.industryGroup || '-' }}</p>
                  <p class="mt-0.5 text-xs font-bold text-gray-400">
                    {{
                      Array.isArray(buyer.factoryProduct) && buyer.factoryProduct.length > 0
                        ? buyer.factoryProduct.join(', ')
                        : '-'
                    }}
                  </p>
                </td>

                <!-- 담당자 + 연락처 -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1 text-xs font-bold text-gray-700">
                    <User class="h-3 w-3 shrink-0 text-gray-400" :stroke-width="2" />
                    {{ buyer.managerName || '-' }}
                  </div>
                  <div class="mt-0.5 flex items-center gap-1 text-xs font-bold text-gray-400">
                    <Phone class="h-3 w-3 shrink-0" :stroke-width="2" />
                    {{ buyer.phone || '-' }}
                  </div>
                </td>

                <!-- 위치 -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1 text-xs font-bold text-gray-500">
                    <MapPin class="h-3 w-3 shrink-0 text-gray-400" :stroke-width="2" />
                    {{ recommendationLocationLabel(buyer) }}
                  </div>
                </td>

                <!-- 선택 버튼 -->
                <td class="px-4 py-3 text-right">
                  <button
                    type="button"
                    class="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-black transition-all duration-150 active:scale-[0.97]"
                    :class="
                      selectedBuyer?.id === buyer.id
                        ? 'border border-[#7FA28A] bg-[#F3FAF4]'
                        : 'border border-[#315E3B] bg-[#315E3B] hover:bg-[#2A5032]'
                    "
                    :style="selectedBuyer?.id === buyer.id ? { color: '#285734' } : { color: 'white' }"
                    @click="emit('select-buyer', buyer)"
                  >
                    <BadgeCheck v-if="selectedBuyer?.id === buyer.id" class="h-3.5 w-3.5" :stroke-width="2.2" />
                    {{ selectedBuyer?.id === buyer.id ? '선택됨' : '선택' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div
            v-else
            class="flex min-h-[160px] flex-col items-center justify-center gap-2 text-center"
          >
            <p class="text-sm font-bold text-gray-400">검색어를 입력하면 전체 거래처에서 조회됩니다.</p>
            <p class="text-xs font-bold text-gray-300">AI 추천 탭에서 매칭 분석을 확인하세요.</p>
          </div>

          <PaginationNav
            v-if="filteredBuyers.length > 0"
            :page="manualPage"
            :size="manualPageSize"
            :total-pages="manualTotalPages"
            :total-elements="filteredBuyers.length"
            :has-previous="manualHasPrevious"
            :has-next="manualHasNext"
            :size-options="[10, 20, 30]"
            @update:page="manualPage = $event"
            @update:size="handleManualPageSize"
          />
        </div>
      </div>
    </section>
  </div>
</template>
