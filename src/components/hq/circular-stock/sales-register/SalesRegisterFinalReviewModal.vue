<script setup>
import { computed } from 'vue'
import { Building2, CircleDollarSign, Info, Scale, Settings2, Shirt, Tag, Truck } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  selectedBuyer: {
    type: Object,
    default: null,
  },
  lockedMaterialType: {
    type: String,
    default: '',
  },
  outboundWarehouseLabel: {
    type: String,
    default: '-',
  },
  outboundWarehouseRegionLabel: {
    type: String,
    default: '-',
  },
  drawerSummary: {
    type: Object,
    required: true,
  },
  finalReviewSummary: {
    type: Object,
    required: true,
  },
  includedMaterialNames: {
    type: Array,
    required: true,
  },
  draftItems: {
    type: Array,
    required: true,
  },
  draftMemo: {
    type: String,
    default: '',
  },
  formatMaterials: {
    type: Function,
    required: true,
  },
  formatKg: {
    type: Function,
    required: true,
  },
  formatCurrency: {
    type: Function,
    required: true,
  },
  formatQuantity: {
    type: Function,
    required: true,
  },
  hasWeightAdjustment: {
    type: Function,
    required: true,
  },
  materialFitLabel: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['close', 'return-edit', 'submit'])

const groupedDraftItems = computed(() => {
  const groups = new Map()
  for (const item of props.draftItems) {
    const materialLabel = props.formatMaterials(item.materials)
    const key = `${item.materialType}__${materialLabel}`
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        materialType: item.materialType,
        materialLabel,
        items: [],
        totalRequestedWeightKg: 0,
        totalActualWeightKg: 0,
        totalActualAmount: 0,
      })
    }

    const group = groups.get(key)
    group.items.push(item)
    group.totalRequestedWeightKg += Number(item.requestedWeightKg) || 0
    group.totalActualWeightKg += Number(item.actualWeightKg) || 0
    group.totalActualAmount += Number(item.actualAmount) || 0
  }

  return Array.from(groups.values())
})

const includedMaterialBadges = computed(() => {
  const badgeMap = new Map()
  for (const item of props.draftItems) {
    for (const material of item.materials || []) {
      const name = String(material?.name || '').trim()
      const ratio = Number(material?.ratio || 0)
      if (!name || ratio <= 0) continue
      const key = `${name}-${ratio}`
      if (!badgeMap.has(key)) {
        badgeMap.set(key, `${name} ${ratio}%`)
      }
    }
  }
  return Array.from(badgeMap.values())
})
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div class="flex h-full w-full items-center justify-center p-4">
      <div class="flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-md bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Final Review</p>
            <h2 class="mt-1 text-lg font-black text-gray-900">최종 판매 등록서 확인</h2>
          </div>
          <button
            type="button"
            class="border border-gray-300 bg-white px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-50"
            @click="emit('close')"
          >
            닫기
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <section class="bg-white p-4 pr-6 pl-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="flex flex-col">
                <p class="text-base !font-semibold uppercase tracking-[0.1em] text-gray-500">거래 요약</p>
                <div class="h-3"></div>
                <p class="text-2xl !font-medium text-gray-900">{{ selectedBuyer?.companyName ?? '-' }}</p>
                <div class="h-1"></div>
                <p class="text-xs font-bold text-gray-500">
                  {{ selectedBuyer?.industryGroup ?? '-' }} · SKU {{ formatQuantity(drawerSummary.totalItems) }}종
                </p>
              </div>
              <div class="rounded-full bg-[#EAF4F0] px-3 py-1 text-[10px] font-black text-[#255F52]">
                {{ materialFitLabel(selectedBuyer?.primaryMaterialFit) || '-' }}
              </div>
            </div>

            <div class="h-2"></div>
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <article class="kpi-card">
                <p class="kpi-title">
                  <Shirt :size="12" />
                  판매 수량
                </p>
                <div class="kpi-content-gap">
                  <p class="text-2xl !font-medium text-gray-900">{{ formatQuantity(finalReviewSummary.totalDeductedQuantity) }}벌</p>
                  <p class="kpi-subtext">
                    <Info :size="12" class="kpi-subtext-icon" />
                    환산 {{ Number(finalReviewSummary.totalEstimatedQuantity).toFixed(2) }}벌
                    <span class="kpi-emphasis">→ 올림 {{ formatQuantity(finalReviewSummary.totalDeductedQuantity) }}벌</span>
                  </p>
                </div>
              </article>

              <article class="kpi-card">
                <p class="kpi-title">
                  <Scale :size="12" />
                  실제 무게
                </p>
                <div class="kpi-content-gap">
                  <p class="text-2xl !font-medium text-gray-900">{{ formatKg(finalReviewSummary.totalActualWeightKg) }}</p>
                  <p class="kpi-subtext">
                    <Info :size="12" class="kpi-subtext-icon" />
                    요청 {{ formatKg(finalReviewSummary.totalRequestedWeightKg) }} 대비
                    <span class="kpi-emphasis">
                      {{ `${finalReviewSummary.totalActualWeightKg - finalReviewSummary.totalRequestedWeightKg >= 0 ? '+' : ''}${formatKg(finalReviewSummary.totalActualWeightKg - finalReviewSummary.totalRequestedWeightKg)}` }}
                    </span>
                  </p>
                </div>
              </article>

              <article class="kpi-card">
                <p class="kpi-title">
                  <Tag :size="12" />
                  포함 소재
                </p>
                <div class="kpi-content-gap">
                  <div class="grid grid-flow-col auto-cols-max grid-rows-3 gap-x-2 gap-y-1.5">
                    <span
                      v-for="badge in includedMaterialBadges"
                      :key="badge"
                      class="material-badge"
                    >
                      {{ badge }}
                    </span>
                    <span v-if="includedMaterialBadges.length === 0" class="text-base !font-medium text-gray-900">
                      -
                    </span>
                  </div>
                </div>
              </article>

              <article class="kpi-card">
                <p class="kpi-title">
                  <CircleDollarSign :size="12" />
                  최종 금액
                </p>
                <div class="kpi-content-gap">
                  <p class="text-2xl !font-medium text-[#1C8E73]">{{ formatCurrency(finalReviewSummary.totalActualAmount) }}</p>
                  <p class="kpi-subtext">
                    <Info :size="12" class="kpi-subtext-icon" />
                    요청 기준
                    <span class="line-through">{{ formatCurrency(finalReviewSummary.totalRequestedAmount) }}</span>
                  </p>
                </div>
              </article>
            </div>

            <div class="h-4"></div>
            <div
              v-if="Math.abs(finalReviewSummary.totalActualWeightKg - finalReviewSummary.totalRequestedWeightKg) >= 0.01"
              class="rounded-md border border-[#EADFC8] bg-[#FFFBEB] px-3 py-3"
            >
              <p class="flex items-center gap-3 text-sm font-black text-gray-900">
                <Settings2 :size="12" :stroke-width="2.6" class="shrink-0 text-[#0F5C4D]" />
                <span class="text-gray-900">
                kg → 벌 수 환산시 올림 처리로 요청 {{ formatKg(finalReviewSummary.totalRequestedWeightKg) }}보다
                {{ formatKg(Math.abs(finalReviewSummary.totalActualWeightKg - finalReviewSummary.totalRequestedWeightKg)) }}
                더 출고됩니다. 금액은 실제 출고 무게({{ formatKg(finalReviewSummary.totalActualWeightKg) }}) 기준으로 산정됩니다.
                </span>
              </p>
            </div>
          </section>

          <div class="mx-6 py-2">
            <div class="border-t border-gray-300"></div>
          </div>
          <section class="px-5 bg-white">
            <div class="grid gap-8 px-1 lg:grid-cols-2">
              <article>
                <h3 class="info-header">
                  <Building2 :size="13" />
                  거래처 정보
                </h3>
                <dl class="mt-3 text-sm">
                  <div class="info-line">
                    <dt class="info-key">거래처명</dt>
                    <dd class="info-value">
                      {{ selectedBuyer?.companyName ?? '-' }}
                      <span class="buyer-code">{{ selectedBuyer?.code ?? '-' }}</span>
                    </dd>
                  </div>
                  <div class="info-line">
                    <dt class="info-key">유형</dt>
                    <dd class="info-value">{{ selectedBuyer?.industryGroup ?? '-' }}</dd>
                  </div>
                  <div class="info-line">
                    <dt class="info-key">담당자</dt>
                    <dd class="info-value">{{ selectedBuyer?.managerName ?? '-' }}</dd>
                  </div>
                  <div class="info-line">
                    <dt class="info-key">연락처</dt>
                    <dd class="info-value">{{ selectedBuyer?.phone ?? '-' }}</dd>
                  </div>
                  <div class="info-line">
                    <dt class="info-key">취급 제품</dt>
                    <dd class="info-value">{{ selectedBuyer?.productTypes?.join(', ') || selectedBuyer?.productNote || '-' }}</dd>
                  </div>
                </dl>
              </article>

              <article>
                <h3 class="info-header">
                  <Truck :size="13" />
                  출고 정보
                </h3>
                <dl class="mt-3 text-sm">
                  <div class="info-line">
                    <dt class="info-key">출고 창고</dt>
                    <dd class="info-value">{{ outboundWarehouseLabel || '-' }}</dd>
                  </div>
                  <div class="info-line">
                    <dt class="info-key">소재 구분</dt>
                    <dd class="info-value">{{ lockedMaterialType || '-' }}</dd>
                  </div>
                  <div class="info-line">
                    <dt class="info-key">담긴 SKU</dt>
                    <dd class="info-value">{{ formatQuantity(drawerSummary.totalItems) }}종</dd>
                  </div>
                  <div class="info-line">
                    <dt class="info-key">판매 메모</dt>
                    <dd class="info-value info-value-memo text-gray-500 italic">{{ draftMemo?.trim() || '입력된 메모 없음' }}</dd>
                  </div>
                </dl>
              </article>
            </div>
          </section>

          <div class="mx-6 py-5.5">
            <div class="border-t border-gray-300"></div>
          </div>
          <section class="min-w-0 bg-white">
            <div class="px-6">
              <h3 class="text-sm !font-semibold text-gray-500">소재별 판매 상세</h3>
            </div>

            <div class="space-y-3 p-3 pr-5 pl-5">
              <template v-for="(group, groupIndex) in groupedDraftItems" :key="group.key">
              <article
                class="overflow-hidden rounded-md border border-gray-300 bg-white"
              >
                <div class="flex flex-wrap items-end justify-between gap-3 border-b border-gray-300 bg-[#F6F6F4] pl-3 px-4 py-3">
                  <div class="flex items-center gap-2">
                    <span class="rounded-full bg-[#D9EFE7] px-3.5 py-1 text-[13px] !font-semibold text-[#1F7A63]">
                      {{ group.materialLabel }}
                    </span>
                    <p class="text-[13px] font-bold text-gray-500">
                      SKU {{ formatQuantity(group.items.length) }}종 · {{ formatCurrency(group.items[0]?.unitPrice || 0) }}/kg
                    </p>
                  </div>
                  <div class="flex flex-wrap items-end gap-5 text-right">
                    <div class="group-kpi">
                      <p class="group-kpi-label">요청</p>
                      <p class="group-kpi-value">{{ formatKg(group.totalRequestedWeightKg).replace('kg', ' kg') }}</p>
                    </div>
                    <div class="group-kpi">
                      <p class="group-kpi-label">실출고</p>
                      <p class="group-kpi-value">{{ formatKg(group.totalActualWeightKg).replace('kg', ' kg') }}</p>
                    </div>
                    <div class="group-kpi">
                      <p class="group-kpi-label">금액</p>
                      <p class="group-kpi-value group-kpi-value-amount">{{ formatCurrency(group.totalActualAmount) }}</p>
                    </div>
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="min-w-[700px] w-full table-fixed border-collapse text-right text-sm">
                    <colgroup>
                      <col class="w-[15%]" />
                      <col class="w-[13%]" />
                      <col class="w-[13%]" />
                      <col class="w-[7%]" />
                      <col class="w-[10%]" />
                      <col class="w-[13%]" />
                      <col class="w-[13%]" />
                    </colgroup>
                    <thead class="border-b border-gray-200 text-[12px] text-gray-500">
                      <tr>
                        <th class="cell-head !text-left" style="text-align: left">SKU</th>
                        <th class="cell-head text-right">재고</th>
                        <th class="cell-head text-right">요청 kg</th>
                        <th class="cell-head text-right"></th>
                        <th class="cell-head text-right">판매 벌 수</th>
                        <th class="cell-head text-right">실제 무게</th>
                        <th class="cell-head text-right">금액</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                      <tr v-for="item in group.items" :key="item.draftId">
                        <td class="cell-body !text-left" style="text-align: left">
                          <p class="font-black text-gray-900">{{ item.itemName }}</p>
                          <p class="mt-0.5 font-mono text-[11px] text-gray-500">{{ item.skuCode }}</p>
                        </td>
                        <td class="cell-body font-black text-gray-700">{{ formatQuantity(item.availableQuantity) }}벌 / {{ formatKg(item.availableWeightKg) }}</td>
                        <td class="cell-body font-black text-gray-800">{{ formatKg(item.requestedWeightKg).replace('kg', ' kg') }}</td>
                        <td class="cell-body text-right text-lg font-black text-gray-700">→</td>
                        <td class="cell-body">
                          <p class="font-black text-[#0F7C62]">{{ formatQuantity(item.deductedQuantity) }}벌</p>
                          <p class="mt-0.5 text-[11px] font-bold text-gray-500">{{ Number(item.estimatedQuantity || 0).toFixed(2) }}벌 올림</p>
                        </td>
                        <td class="cell-body font-black text-gray-900">{{ formatKg(item.actualWeightKg).replace('kg', ' kg') }}</td>
                        <td class="cell-body font-black text-gray-900">{{ formatCurrency(item.actualAmount) }}</td>
                      </tr>
                      <tr class="bg-[#F6F6F4]">
                        <td class="cell-body !text-left text-sm font-black text-gray-800" style="text-align: left">합계</td>
                        <td class="cell-body"></td>
                        <td class="cell-body"></td>
                        <td class="cell-body"></td>
                        <td class="cell-body font-black text-gray-900">{{ formatQuantity(group.items.reduce((sum, item) => sum + (Number(item.deductedQuantity) || 0), 0)) }}벌</td>
                        <td class="cell-body font-black text-gray-900">{{ formatKg(group.totalActualWeightKg).replace('kg', ' kg') }}</td>
                        <td class="cell-body font-black text-gray-900">{{ formatCurrency(group.totalActualAmount) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </article>
              <div v-if="groupIndex < groupedDraftItems.length - 1" class="h-6.5"></div>
              </template>
            </div>
          </section>
        </div>

        <div class="flex items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <p class="text-xs font-bold text-gray-500">등록 후에는 수정이 불가합니다</p>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-50"
              @click="emit('return-edit')"
            >
              페이지로 돌아가 수정
            </button>
            <button
              type="button"
              class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-xs font-black text-white hover:bg-[#00382c]"
              @click="emit('submit')"
            >
              이 내용으로 최종 등록
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.label-sm {
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9ca3af;
}

.kpi-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: #f7f7f5;
  padding: 0.75rem;
}

.kpi-subtext {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  border-top: 1px dashed #d1d5db;
  padding-top: 0.5rem;
  font-size: 13px;
  line-height: 1.35;
  color: #6b7280;
}

.kpi-subtext-icon {
  flex-shrink: 0;
}

.kpi-emphasis {
  color: #8b5e34;
}

.kpi-title {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6b7280;
}

.kpi-content-gap {
  margin-top: 0.5rem;
}

.material-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  background: #eaf4f0;
  padding: 0.125rem 0.5rem;
  font-size: 12px;
  font-weight: 700;
  color: #255f52;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 1rem;
  margin-bottom: 0.7rem;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.info-line {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.info-line:last-child {
  border-bottom: 0;
}

.info-key {
  font-size: 13px;
  font-weight: 400;
  color: #6b7280;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  text-align: right;
}

.info-value-memo {
  font-weight: 400;
  color: #6b7280;
}

.buyer-code {
  margin-left: 0.25rem;
  font-size: 12px;
  font-weight: 400;
  color: #9ca3af;
}

.group-kpi-label {
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
}

.group-kpi-value {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.05;
  color: #111827;
}

.group-kpi-value-amount {
  color: #0f7c62;
}

.cell-head {
  padding: 0.5rem;
  text-align: inherit;
  font-weight: 400;
}

.cell-body {
  padding: 0.5rem;
  text-align: inherit;
}

th.cell-head:first-child,
td.cell-body:first-child {
  padding-left: 1.2rem;
}

th.cell-head:last-child,
td.cell-body:last-child {
  padding-right: 1.2rem;
}
</style>
