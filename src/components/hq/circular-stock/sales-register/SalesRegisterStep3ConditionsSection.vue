<script setup>
import { ArrowDown, ChevronDown, ChevronUp, Info, Package, Ruler, Shirt, Tag } from 'lucide-vue-next'

defineProps({
  step3GroupCards: { type: Array, required: true },
  groupRequestedKg: { type: Object, required: true },
  groupRequestedInputText: { type: Object, required: true },
  step3SkuInputText: { type: Object, required: true },
  step3Summary: { type: Object, required: true },
  includedMaterialNames: { type: Array, required: true },
  selectedBuyer: { type: Object, default: null },
  lockedMaterialType: { type: String, default: '' },
  outboundWarehouseLabel: { type: String, required: true },
  outboundWarehouseRegionLabel: { type: String, required: true },
  draftMemo: { type: String, default: '' },
  isStep3GroupExpanded: { type: Function, required: true },
  isManualAdjusted: { type: Function, required: true },
  step3BuyerBadgeClass: { type: Function, required: true },
  companyBadgeText: { type: Function, required: true },
  formatKg: { type: Function, required: true },
  formatCurrency: { type: Function, required: true },
  roundedUpQuantityLabel: { type: Function, required: true },
})

const emit = defineEmits([
  'group-requested-input',
  'group-requested-blur',
  'toggle-group',
  'sku-kg-input',
  'sku-kg-blur',
  'reset-sku-auto',
  'update-draft-memo',
])
</script>

<template>
  <div class="mt-0 space-y-4">
    <div
      class="flex items-start gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700"
      style="margin-bottom: 1.4%;"
    >
      <Info class="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" :stroke-width="2" />
      <span>
        거래처는 kg 단위로 요청합니다. 벌 수 환산 시 요청값과 실제 kg 합계가 다를 수
        있으며, 재고 한도(수량/무게) 초과 판매은 제한됩니다.
      </span>
    </div>

    <div class="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div class="min-w-0" style="display: flex; flex-direction: column; row-gap: 24px;">
        <article
          v-for="group in step3GroupCards"
          :key="group.key"
          class="overflow-hidden rounded-2xl border-[1.5px] transition-shadow duration-200"
          :class="
            group.status === 'error'
              ? 'border-rose-300 bg-white shadow-[0_12px_26px_-12px_rgba(15,23,42,0.34)]'
              : group.status === 'completed'
                ? 'border-emerald-400 bg-white shadow-[0_12px_26px_-12px_rgba(15,23,42,0.34)]'
                : 'border-gray-200 bg-white shadow-[0_10px_22px_-14px_rgba(15,23,42,0.32)]'
          "
        >
          <header class="flex items-center justify-between border-b border-[#DCEDE5] px-5 py-4">
            <div class="flex items-start gap-3">
              <div class="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF5EF] text-[#2F6B4F]">
                <Shirt class="h-4.5 w-4.5" :stroke-width="2.1" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-base font-black text-gray-900" style="font-weight: 600">
                    {{ group.materialDetailLabel }}
                  </span>
                  <span
                    class="inline-flex h-5 items-center rounded-full px-2 text-[10px] font-black"
                    :class="
                      group.status === 'error'
                        ? 'bg-rose-100 text-rose-700'
                        : group.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-600'
                    "
                  >
                    {{ group.status === 'error' ? '오류' : group.status === 'completed' ? '완료' : '미입력' }}
                  </span>
                </div>
                <p class="mt-1 text-sm font-bold text-gray-500">
                  {{ group.materialType }} · SKU {{ group.items.length }}종 ·
                  ₩{{ Number(group.items[0]?.defaultKgUnitPrice || 0).toLocaleString() }}/kg
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <p class="inline-flex items-center gap-1.5 text-sm font-bold text-gray-600">
                <Package class="h-3.5 w-3.5 text-gray-500" :stroke-width="2.1" />
                총 재고 <span class="text-gray-900" style="font-weight: 600">{{ group.totalAvailableQty }}벌</span>
                · 최대
                <span class="text-gray-900" style="font-weight: 600">{{ formatKg(group.totalAvailableKg) }}</span>
              </p>
            </div>
          </header>

          <div class="border-b border-[#E6F1EC] px-5 py-4">
            <div class="flex flex-col gap-1">
              <div class="flex flex-wrap items-center gap-3 w-full">
                <span
                  class="inline-flex h-[46px] items-center -translate-y-[1px] text-sm leading-none text-gray-900"
                  style="font-weight: 600"
                  >거래처 요청</span
                >
                <div class="inline-flex h-[45px] items-center gap-1 rounded-xl border-2 border-gray-300 bg-white px-3">
                  <input
                    :value="groupRequestedInputText[group.key] ?? (groupRequestedKg[group.key] ?? '')"
                    type="text"
                    inputmode="decimal"
                    class="no-spin border-0 bg-transparent px-0 leading-none text-gray-900 outline-none"
                    style="font-weight: 700; width: 5rem; font-size: 25px;"
                    @input="emit('group-requested-input', group.key, $event.target.value)"
                    @blur="emit('group-requested-blur', group.key)"
                  />
                  <span class="pt-1 text-sm font-bold text-gray-400">kg</span>
                </div>
                <span class="inline-flex h-[46px] items-center -translate-y-[1px] text-base leading-none text-gray-300">→</span>
                <div
                  class="inline-flex items-center self-center -translate-y-[1px] rounded-lg border border-[#D9CCF5] bg-[#F6F1FF] px-3 py-1.5 text-xs font-bold leading-none text-[#5B4A7A]"
                >
                  <span class="font-black text-[#6E4BB8]">kg 입력 시</span>
                  <span>&nbsp;재고 많은 순으로&nbsp;</span>
                  <span class="font-black text-[#6E4BB8]">자동 배분</span>
                </div>
                <button
                  type="button"
                  class="inline-flex h-7 items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 text-[11px] font-black text-gray-600 hover:bg-gray-50"
                  style="margin-left: auto;"
                  @click="emit('toggle-group', group.key)"
                >
                  <span>{{ isStep3GroupExpanded(group.key) ? '접기' : '펼치기' }}</span>
                  <ChevronUp
                    v-if="isStep3GroupExpanded(group.key)"
                    class="h-3.5 w-3.5"
                    :stroke-width="2.2"
                  />
                  <ChevronDown
                    v-else
                    class="h-3.5 w-3.5"
                    :stroke-width="2.2"
                  />
                </button>
              </div>
              <div class="text-xs font-bold text-gray-400" style="padding-left: 5.8rem; margin-top: 1px;">
                재고 최대 {{ Number(group.totalAvailableKg || 0).toFixed(2) }}kg
              </div>
            </div>
          </div>

          <template v-if="isStep3GroupExpanded(group.key)">
            <div class="overflow-x-auto">
              <table class="min-w-[800px] w-full border-collapse text-left">
                <colgroup>
                  <col style="width: 20%" />
                  <col style="width: 12%" />
                  <col style="width: 16%" />
                  <col style="width: 4%" />
                  <col style="width: 12%" />
                  <col style="width: 4%" />
                  <col style="width: 12%" />
                  <col style="width: 13%" />
                </colgroup>
                <thead class="bg-[#FCFDFC] text-xs font-black text-gray-500">
                  <tr>
                    <th class="px-5 py-3">SKU</th>
                    <th class="px-3 py-3 text-center">재고</th>
                    <th class="px-3 py-3 text-center">kg</th>
                    <th class="px-1 py-3"></th>
                    <th class="px-3 py-3 text-center">판매 벌 수</th>
                    <th class="px-1 py-3"></th>
                    <th class="px-3 py-3 text-center">실제 무게</th>
                    <th class="px-5 py-3 text-right">금액</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 text-sm">
                  <tr v-for="item in group.items" :key="item.draftId">
                    <td class="px-5 py-4">
                      <p class="text-sm font-black text-gray-900">{{ item.itemName }}</p>
                      <p class="mt-1 font-mono text-xs font-bold text-gray-400">{{ item.skuCode }}</p>
                    </td>
                    <td class="px-3 py-4 text-center">
                      <p class="text-base font-black text-gray-900">{{ item.availableQuantity }}벌</p>
                      <p class="mt-1 text-sm font-bold text-gray-500">{{ formatKg(item.availableWeightKg) }}</p>
                    </td>
                    <td class="px-3 py-4 text-center">
                      <div class="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-1.5">
                        <input
                          :value="step3SkuInputText[item.draftId] ?? Number(item.requestedWeightKg || 0).toFixed(2)"
                          type="text"
                          inputmode="decimal"
                          class="no-spin w-10 border-0 bg-transparent text-right text-[20px] leading-none text-gray-900 outline-none"
                          style="font-weight: 500"
                          @input="emit('sku-kg-input', group.key, item.draftId, $event.target.value)"
                          @blur="emit('sku-kg-blur', item.draftId)"
                        />
                        <span class="text-xs font-bold text-gray-500">kg</span>
                      </div>
                      <div class="mt-1 text-xs font-bold text-gray-400">
                        <button
                          v-if="isManualAdjusted(item.draftId)"
                          type="button"
                          class="ml-2 text-[#0F5C4D] underline"
                          @click="emit('reset-sku-auto', group.key, item.draftId)"
                        >
                          자동으로 되돌리기
                        </button>
                      </div>
                      <p class="mt-0.5 text-[11px] font-bold text-gray-400">
                        1벌당 {{ Number(item.unitWeightKg || 0).toFixed(2) }}kg
                      </p>
                    </td>
                    <td class="px-1 py-4 text-center text-lg font-black text-gray-300">→</td>
                    <td class="px-3 py-4 text-center">
                      <p class="text-lg font-black text-gray-900">{{ item.deductedQuantity }}벌</p>
                      <p
                        v-if="roundedUpQuantityLabel(item)"
                        class="mt-0.5 text-[11px] font-bold text-gray-400"
                      >
                        {{ roundedUpQuantityLabel(item) }}
                      </p>
                    </td>
                    <td class="px-1 py-4 text-center text-lg font-black text-gray-300">→</td>
                    <td class="px-3 py-4 text-center text-lg font-black text-gray-900">
                      {{ formatKg(item.actualWeightKg) }}
                    </td>
                    <td class="px-5 py-4 text-right text-lg text-[#2F8F6A]" style="font-weight: 500">
                      {{ formatCurrency(item.lineAmount) }}
                    </td>
                  </tr>
                  <tr class="bg-[#F7FAF8] text-sm font-black text-gray-700">
                    <td class="px-5 py-3">합계</td>
                    <td />
                    <td />
                    <td />
                    <td class="px-3 py-3 text-center text-base text-gray-900">{{ group.totalActualQty }}벌</td>
                    <td />
                    <td class="px-3 py-3 text-center text-base text-gray-900">{{ formatKg(group.totalActualKg) }}</td>
                    <td class="px-5 py-3 text-right text-base text-[#2F8F6A]" style="font-weight: 500">{{ formatCurrency(group.totalActualAmount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
          <footer class="flex items-center justify-between bg-[#E7F3EC] px-5 py-3 text-sm font-medium text-[#2A5B46]">
            <div class="flex items-center gap-5">
              <span class="inline-flex items-center gap-1.5">
                <Package class="h-3.5 w-3.5" :stroke-width="2.1" />
                <span class="text-[#1E4B39]" style="font-weight: 600">{{ group.totalActualQty }}벌</span>
                <span>출고</span>
              </span>
              <span class="inline-flex items-center gap-1.5">
                <Ruler class="h-3.5 w-3.5" :stroke-width="2.1" />
                <span>실제</span>
                <span class="text-[#1E4B39]" style="font-weight: 600">{{ formatKg(group.totalActualKg) }}</span>
              </span>
              <span class="inline-flex items-center gap-1.5">
                <Tag class="h-3.5 w-3.5" :stroke-width="2.1" />
                단가 ₩{{ Number(group.items[0]?.unitPrice || group.items[0]?.defaultKgUnitPrice || 0).toLocaleString() }}/kg
              </span>
            </div>
            <span class="text-sm" style="font-weight: 600">{{ formatCurrency(group.totalActualAmount) }}</span>
          </footer>
        </article>
      </div>

      <aside class="h-fit self-start rounded-xl border border-gray-200 bg-[#F7F8F7] px-4 py-4">
        <div class="flex flex-col gap-3">
          <section>
            <p class="text-xs text-gray-500" style="font-weight: 600; margin-bottom: 6px">출고 창고</p>
            <div class="mt-2 rounded-xl border border-gray-200 bg-white px-3 py-3.5">
              <div class="flex items-center gap-3">
                <span
                  class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECF7F1] text-xs font-black tracking-tight text-[#2F6B4F]"
                >
                  {{ outboundWarehouseRegionLabel }}
                </span>
                <div class="min-w-0">
                  <p class="truncate text-base font-black text-gray-900">{{ outboundWarehouseLabel }}</p>
                  <p class="mt-0.5 text-xs font-bold text-gray-500">출고지</p>
                </div>
              </div>
            </div>
          </section>

          <div class="flex justify-center py-0">
            <ArrowDown class="h-4 w-4 text-gray-400" :stroke-width="2.4" />
          </div>

          <section style="margin-top: -18px;">
            <p class="text-xs text-gray-500" style="font-weight: 600; margin-bottom: 6px">거래처</p>
            <div class="rounded-xl border border-gray-200 bg-white px-3 py-3.5">
              <div class="flex items-center gap-3">
                <span
                  class="inline-flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black tracking-tight"
                  :class="step3BuyerBadgeClass()"
                >
                  {{ companyBadgeText(selectedBuyer?.companyName || '거래처') }}
                </span>
                <div class="min-w-0">
                  <p class="truncate text-base font-black text-gray-900">{{ selectedBuyer?.companyName || '-' }}</p>
                  <p class="mt-0.5 text-xs font-bold text-gray-500">
                    {{ selectedBuyer?.industryGroup || '-' }} 거래처
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div class="py-2">
            <div class="h-px bg-gray-200" />
          </div>

          <section>
            <p class="text-xs text-gray-500" style="font-weight: 600; margin-bottom: 4px">판매 요약</p>
            <div class="mt-2 divide-y divide-gray-200 text-xs">
              <div class="flex items-center justify-between py-2.5">
                <span class="font-bold text-gray-500">소재 구분</span>
                <span class="text-sm text-gray-900" style="font-weight: 600">{{ lockedMaterialType || '-' }}</span>
              </div>
              <div class="flex items-start justify-between gap-2 py-2.5">
                <span class="font-bold text-gray-500">포함 소재</span>
                <span class="text-right text-sm text-gray-900" style="font-weight: 600">
                  {{ includedMaterialNames.join(', ') || '-' }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2.5">
                <span class="font-bold text-gray-500">담긴 SKU</span>
                <span class="text-sm text-gray-900" style="font-weight: 600">{{ step3Summary.totalSku }}종</span>
              </div>
              <div class="flex items-center justify-between py-2.5">
                <span class="font-bold text-gray-500">입력 완료</span>
                <span class="text-sm text-[#7C5A18]" style="font-weight: 600">{{ step3Summary.inputCompletedCount }} / {{ step3Summary.totalSku }}</span>
              </div>
              <div class="flex items-center justify-between py-2.5">
                <span class="font-bold text-gray-500">총 판매 벌 수</span>
                <span class="text-sm text-gray-900" style="font-weight: 600">{{ step3Summary.totalActualQty }}벌</span>
              </div>
              <div class="flex items-center justify-between py-2.5">
                <span class="font-bold text-gray-500">총 실제 무게</span>
                <span class="text-sm text-gray-900" style="font-weight: 600">{{ formatKg(step3Summary.totalActualKg) }}</span>
              </div>
            </div>
          </section>

          <section class="rounded-2xl border border-[#1F4E43] bg-[#1F4E43] px-4 py-4.5 text-white">
            <p class="text-xs font-bold text-[#BED8CF]">예상 판매 금액</p>
            <p class="mt-2 text-xl font-black">{{ formatCurrency(step3Summary.totalActualAmount) }}</p>
            <p class="mt-1 text-xs font-bold text-[#9EC3B8]">
              실제 무게 기준
            </p>
          </section>

          <div class="py-2">
            <div class="h-px bg-gray-200" />
          </div>

          <section>
            <p class="text-xs text-gray-500" style="font-weight: 600; margin-bottom: 6px">판매 메모</p>
            <textarea
              :value="draftMemo"
              rows="4"
              maxlength="500"
              class="mt-3 w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
              placeholder="거래 조건, 출고 메모 등을 입력하세요."
              @input="emit('update-draft-memo', $event.target.value)"
            />
          </section>
        </div>
      </aside>
    </div>
  </div>
</template>
