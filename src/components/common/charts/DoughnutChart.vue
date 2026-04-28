<script setup>
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, Title)

defineProps({
  data: { type: Object, required: true },
  options: { type: Object, default: () => ({}) },
  height: { type: Number, default: 240 },
})
</script>

<template>
  <div :style="{ height: height + 'px' }" class="relative w-full">
    <Doughnut :data="data" :options="options" />
  </div>
</template>
