<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Clock3, ListOrdered } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { dashboardSideMenus } from '@/views/hq/dashboard/dashboardMenus.js'
const router = useRouter()
const hqMenus = roleMenus.hq

const activeSideMenu = ref('운영 현황')
const sideMenus = dashboardSideMenus

const transactions = []

const activeTopMenu = computed(() => '대시보드')
const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()),
)


</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    show-system-card
  >
    <div class="flex flex-col gap-3">
      <section class="flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center gap-2 text-[11px] font-medium text-gray-400">
            <button
              type="button"
              class="transition-colors hover:text-gray-700"
              @click="router.push('/hq/dashboard')"
            >
              대시보드
            </button>
            <span>&gt;</span>
            <button
              type="button"
              class="transition-colors hover:text-gray-700"
              @click="router.push('/hq/dashboard')"
            >
              운영 현황
            </button>
            <span>&gt;</span>
            <span class="text-gray-700">전체 트랜잭션</span>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <h2 class="inline-flex items-center gap-2 text-[15px] font-semibold text-gray-900">
              <ListOrdered :size="18" />
              전체 트랜잭션
            </h2>
            <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">기준: {{ dateLabel }}</span>
            <span class="inline-flex items-center gap-1 border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
              <Clock3 :size="12" />
              최근 로그 기준
            </span>
          </div>
        </div>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
          <h3 class="text-sm font-medium text-gray-800">트랜잭션 목록</h3>
          <span class="text-[11px] text-gray-400">총 {{ transactions.length }}건</span>
        </div>
        <div class="overflow-auto">
          <table class="w-full min-w-[980px] text-[13px]">
            <thead class="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th class="px-3 py-2.5 text-left font-bold">ID</th>
                <th class="px-3 py-2.5 text-left font-bold">구분</th>
                <th class="px-3 py-2.5 text-left font-bold">물류 거점</th>
                <th class="px-3 py-2.5 text-left font-bold">품목</th>
                <th class="px-3 py-2.5 text-right font-bold">수량</th>
                <th class="px-3 py-2.5 text-left font-bold">상태</th>
                <th class="px-3 py-2.5 text-left font-bold">시각</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 border-t border-gray-200">
              <tr v-for="row in transactions" :key="row.id" class="hover:bg-gray-50/50">
                <td class="px-3 py-2.5 font-mono text-gray-400">{{ row.id }}</td>
                <td class="px-3 py-2.5 text-xs font-bold text-gray-700">{{ row.type }}</td>
                <td class="px-3 py-2.5 font-semibold text-gray-800">{{ row.center }}</td>
                <td class="px-3 py-2.5 text-gray-600">{{ row.item }}</td>
                <td class="px-3 py-2.5 text-right font-bold" :class="row.qty.startsWith('+') ? 'text-emerald-600' : 'text-red-600'">
                  {{ row.qty }}
                </td>
                <td class="px-3 py-2.5 text-gray-700">{{ row.status }}</td>
                <td class="px-3 py-2.5 text-gray-400">{{ row.time }}</td>
              </tr>
              <tr v-if="transactions.length === 0">
                <td colspan="7" class="px-3 py-10 text-center text-xs text-gray-400">
                  트랜잭션 데이터가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>
