<script setup>
// 우측 발주서(장바구니). cart 상태 자체는 부모가 보유 — 자식은 표시 + 액션 emit 만.
// 신규 모드: 헤더에 공급처 그룹 카드 N장 ("발주 N건 자동 생성"), 본문은 평면 SKU 리스트.
// edit 모드: 단일 vendor 라벨, 본문 평면 SKU 리스트 (기존 흐름 회귀 보호).
import { ShoppingCartIcon, TrashIcon } from '@/components/hq/purchase-order/icons.js'

defineProps({
  cart: { type: Array, required: true },
  currentCartVendorName: { type: String, default: '' },
  groupedByVendor: { type: Array, default: () => [] },
  cartTotal: { type: Number, required: true },
  canSubmit: { type: Boolean, required: true },
  isEditMode: { type: Boolean, default: false },
  highlightedSkuCode: { type: String, default: '' },
})

defineEmits([
  'increase-qty',
  'decrease-qty',
  'update-qty',
  'remove-item',
  'scroll-to-catalog-sku',
  'open-clear-cart-confirm',
  'open-submit-confirm',
])
</script>

<template>
  <aside
    class="flex w-full shrink-0 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm xl:w-96"
  >
    <!-- 헤더 -->
    <div class="flex items-center justify-between bg-[#004D3C] px-4 py-3 text-white">
      <h3 class="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider">
        <ShoppingCartIcon :size="14" />
        발주 요청서
      </h3>
      <span class="text-[11px] font-bold opacity-80">
        <template v-if="isEditMode">{{ cart.length }}건</template>
        <template v-else-if="groupedByVendor.length > 0">
          {{ groupedByVendor.length }}곳 · {{ cart.length }}건
        </template>
        <template v-else>{{ cart.length }}건</template>
      </span>
    </div>

    <!-- 공급처 표시 — edit 모드 단일 vendor / 신규 모드 그룹 카드 N장 -->
    <div
      v-if="isEditMode && currentCartVendorName"
      class="border-b border-gray-200 bg-[#E6F2F0] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#004D3C]"
    >
      {{ currentCartVendorName }}
    </div>
    <div
      v-else-if="!isEditMode && groupedByVendor.length > 0"
      class="space-y-1 border-b border-gray-200 bg-[#E6F2F0] px-3 py-2"
    >
      <p class="text-[9px] font-bold uppercase tracking-wider text-[#004D3C]/70">
        공급처 {{ groupedByVendor.length }}곳 → 발주 {{ groupedByVendor.length }}건 자동 생성
      </p>
      <ul class="space-y-0.5">
        <li
          v-for="g in groupedByVendor"
          :key="g.vendorId"
          class="flex items-center justify-between gap-2 text-[11px] text-[#004D3C]"
        >
          <span class="truncate font-black">{{ g.vendorName }}</span>
          <span class="shrink-0 font-bold">
            {{ g.itemCount }}건 · ₩{{ g.subtotal.toLocaleString() }}
          </span>
        </li>
      </ul>
    </div>

    <!-- 본문 -->
    <div class="flex-1 overflow-y-auto p-3">
      <div v-if="cart.length === 0" class="py-10 text-center text-sm text-gray-400">
        왼쪽 카탈로그에서 품목을 담아주세요
      </div>
      <ul v-else class="space-y-2">
        <li
          v-for="(item, idx) in cart"
          :key="(item.skuCode || item.productCode) + '-' + idx"
          class="border bg-white p-2 transition-colors"
          :class="
            highlightedSkuCode === item.skuCode
              ? 'border-[#004D3C] ring-2 ring-[#004D3C]/30'
              : 'border-gray-200'
          "
          :data-cart-sku-code="item.skuCode"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-black text-gray-800">{{ item.productName }}</p>
              <p v-if="item.displayOption" class="text-[11px] font-bold text-[#004D3C]">
                {{ item.displayOption }}
              </p>
              <p class="text-[11px] text-gray-400">
                {{ item.skuCode || item.productCode }} · ₩{{ item.unitPrice.toLocaleString() }}
              </p>
            </div>
            <button
              v-if="item.skuCode"
              type="button"
              class="text-[11px] font-bold text-gray-500 hover:text-[#004D3C] underline"
              title="좌측 카탈로그에서 보기"
              @click="$emit('scroll-to-catalog-sku', item.skuCode)"
            >
              ← 카탈로그
            </button>
            <button
              type="button"
              class="text-red-400 hover:text-red-600"
              aria-label="삭제"
              @click="$emit('remove-item', idx)"
            >
              <TrashIcon :size="12" />
            </button>
          </div>
          <div class="mt-2 flex items-center justify-between">
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="flex h-6 w-6 items-center justify-center border border-gray-300 bg-white text-sm hover:bg-gray-50"
                @click="$emit('decrease-qty', idx)"
              >
                −
              </button>
              <input
                :value="item.quantity"
                type="number"
                min="1"
                class="w-12 border border-gray-300 py-0.5 text-center text-sm outline-none focus:border-[#004D3C]"
                @change="$emit('update-qty', idx, $event.target.value)"
              />
              <button
                type="button"
                class="flex h-6 w-6 items-center justify-center border border-gray-300 bg-white text-sm hover:bg-gray-50"
                @click="$emit('increase-qty', idx)"
              >
                +
              </button>
            </div>
            <span class="text-sm font-bold text-gray-700">
              ₩{{ (item.unitPrice * item.quantity).toLocaleString() }}
            </span>
          </div>
        </li>
      </ul>
    </div>

    <!-- 푸터 -->
    <div class="space-y-2 border-t border-gray-200 bg-gray-50 p-3">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase text-gray-500">총액</span>
        <span class="text-sm font-black text-[#004D3C]"> ₩{{ cartTotal.toLocaleString() }} </span>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <button
          type="button"
          class="border border-gray-400 bg-white px-2 py-2 text-xs font-black text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="cart.length === 0"
          @click="$emit('open-clear-cart-confirm')"
        >
          장바구니 비우기
        </button>
        <button
          type="button"
          class="border border-[#004D3C] bg-[#004D3C] px-2 py-2 text-xs font-black text-white hover:bg-[#1f4b3a] disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canSubmit"
          @click="$emit('open-submit-confirm')"
        >
          {{ isEditMode ? '수정 저장' : '발주 요청' }}
        </button>
      </div>
    </div>
  </aside>
</template>
