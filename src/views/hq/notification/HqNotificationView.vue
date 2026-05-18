<script setup>
import { computed, onMounted, ref } from 'vue'
import { Bell, Filter, RefreshCw } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useNotificationStore } from '@/stores/notification.js'

const topMenus = roleMenus.hq
const activeTopMenu = computed(() => '알림')

const notifStore = useNotificationStore()
const filterMode = ref('all')

const filteredNotifications = computed(() => {
  if (filterMode.value === 'unread') {
    return notifStore.notifications.filter((n) => !n.read)
  }
  return notifStore.notifications
})

const unreadCount = computed(() => notifStore.unreadCount)
const loading = computed(() => notifStore.loading)
const error = computed(() => notifStore.error)

async function reload() { await notifStore.refresh() }
async function handleClick(n) {
  if (!n.read) {
    try { await notifStore.markAsRead(n.id) } catch { /* ignore */ }
  }
}
async function handleReadAll() {
  try { await notifStore.markAllAsRead() } catch { /* ignore */ }
}

function severityBadgeCls(severity) {
  switch (severity) {
    case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-300'
    case 'WARNING':  return 'bg-amber-100 text-amber-700 border-amber-300'
    default:         return 'bg-sky-100 text-sky-700 border-sky-300'
  }
}
function severityLabel(severity) {
  switch (severity) {
    case 'CRITICAL': return '긴급'
    case 'WARNING':  return '주의'
    default:         return '정보'
  }
}
function formatDateTime(value) {
  if (!value) return ''
  try {
    const d = new Date(value)
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }).format(d)
  } catch { return String(value) }
}

onMounted(() => { notifStore.init() })
</script>

<template>
  <AppLayout
    :top-menus="topMenus"
    :side-menus="[]"
    :active-top-menu="activeTopMenu"
    :active-side-menu="''"
  >
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Bell :size="18" class="text-emerald-700" />
          <h1 class="text-base font-bold text-gray-900">알림</h1>
          <span
            v-if="unreadCount > 0"
            class="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700"
          >
            미확인 {{ unreadCount }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <Filter :size="13" class="text-gray-500" />
          <button
            type="button"
            class="rounded border px-2 py-1 text-[11px] font-semibold transition-colors"
            :class="filterMode === 'all'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'"
            @click="filterMode = 'all'"
          >전체</button>
          <button
            type="button"
            class="rounded border px-2 py-1 text-[11px] font-semibold transition-colors"
            :class="filterMode === 'unread'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'"
            @click="filterMode = 'unread'"
          >미확인만</button>

          <button
            type="button"
            class="ml-1 flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-[11px] font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            :disabled="loading"
            @click="reload"
          >
            <RefreshCw :size="11" :class="{ 'animate-spin': loading }" />
            새로고침
          </button>

          <button
            v-if="unreadCount > 0"
            type="button"
            class="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            @click="handleReadAll"
          >모두 읽음</button>
        </div>
      </div>

      <div v-if="error" class="rounded border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
        {{ error }}
      </div>

      <div class="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div v-if="loading && filteredNotifications.length === 0" class="p-6 text-center text-xs text-gray-500">
          불러오는 중…
        </div>

        <ul v-else-if="filteredNotifications.length > 0" class="divide-y divide-gray-100">
          <li
            v-for="n in filteredNotifications"
            :key="n.id"
            class="flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
            :class="{ 'bg-emerald-50/40': !n.read }"
            @click="handleClick(n)"
          >
            <span
              class="mt-0.5 rounded border px-2 py-0.5 text-[10px] font-bold"
              :class="severityBadgeCls(n.severity)"
            >
              {{ severityLabel(n.severity) }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-xs font-semibold text-gray-900">{{ n.title }}</p>
              <p class="mt-0.5 truncate text-[11px] text-gray-600">{{ n.message }}</p>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-1">
              <span class="text-[10px] text-gray-400">{{ formatDateTime(n.createdAt) }}</span>
              <span v-if="!n.read" class="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">NEW</span>
            </div>
          </li>
        </ul>

        <div v-else class="flex flex-col items-center justify-center gap-2 p-10 text-center">
          <Bell :size="32" class="text-gray-300" />
          <p class="text-xs text-gray-500">
            {{ filterMode === 'unread' ? '미확인 알림이 없습니다.' : '표시할 알림이 없습니다.' }}
          </p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
