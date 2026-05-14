<script setup>
import { Bar } from 'vue-chartjs'
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
  height: { type: Number, default: 240 },
  // true 일 때 부모 컨테이너 높이를 100% 채움 (height prop 무시)
  fillHeight: { type: Boolean, default: false },
})
</script>

<template>
  <div
    :class="['relative w-full', fillHeight ? 'h-full' : '']"
    :style="fillHeight ? null : { height: height + 'px' }"
  >
    <Bar :data="data" :options="options" />
  </div>
</template>
