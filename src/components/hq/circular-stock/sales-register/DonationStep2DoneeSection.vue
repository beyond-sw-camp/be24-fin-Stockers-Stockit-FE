<script setup>
import { Heart } from 'lucide-vue-next'

defineProps({
  doneeName: { type: String, required: true },
})

defineEmits(['update:doneeName'])
</script>

<template>
  <div class="mt-0">
    <section>
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- 좌측: 기부처 입력 -->
        <div>
          <h3 class="mb-4 flex items-center gap-2 text-sm font-black text-pink-600">
            <Heart class="h-4 w-4" :stroke-width="2" />
            기부처 정보 입력
          </h3>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-black text-gray-700">기부처명 *</label>
            <input
              type="text"
              class="h-10 w-full rounded-lg border border-pink-300 bg-white px-4 text-sm font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              placeholder="예: 굿윌스토어, 아름다운 가게 등"
              :value="doneeName"
              @input="$emit('update:doneeName', $event.target.value)"
            />
            <p class="text-xs font-bold text-gray-400">
              기부처명은 출고 내역서 및 ESG 점수 기록에 저장됩니다.
            </p>
          </div>
        </div>

        <!-- 우측: 기부 ESG 점수 안내 -->
        <div class="rounded-lg border border-pink-200 bg-pink-50 p-4">
          <h3 class="mb-3 text-sm font-black text-pink-700">기부 ESG 점수 안내</h3>
          <ul class="space-y-2 text-sm font-bold text-pink-800">
            <li class="flex items-start gap-2">
              <span class="mt-0.5 text-pink-400">·</span>
              기부 1건 = 100점 (최소 10kg 이상)
            </li>
            <li class="flex items-start gap-2">
              <span class="mt-0.5 text-pink-400">·</span>
              + 무게(kg) × 소재 계수 (탄소 환산)
            </li>
            <li class="flex items-start gap-2">
              <span class="mt-0.5 text-pink-400">·</span>
              판매와 동일한 탄소 감축 산식 적용
            </li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
