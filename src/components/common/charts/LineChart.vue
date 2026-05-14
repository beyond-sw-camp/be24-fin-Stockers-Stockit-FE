<script setup>
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
  Title,
)

defineProps({
  data: { type: Object, required: true },
  options: { type: Object, default: () => ({}) },
  height: { type: Number, default: 220 },
  // true 일 때 부모 컨테이너 높이를 100% 채움 (height prop 무시)
  // 부모가 flex-1 + min-height 인 경우 카드 하단까지 늘어남
  fillHeight: { type: Boolean, default: false },
})
</script>

<template>
  <div
    :class="['relative w-full', fillHeight ? 'h-full' : '']"
    :style="fillHeight ? null : { height: height + 'px' }"
  >
    <Line :data="data" :options="options" />
  </div>
</template>
