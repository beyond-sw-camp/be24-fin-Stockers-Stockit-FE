<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Bell, Filter, RefreshCw } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useNotificationStore } from '@/stores/notification.js'
import { notificationApi } from '@/api/notification.js'

const topMenus = roleMenus.hq
const activeTopMenu = computed(() => '알림')

// 헤더 종 아이콘과 공유되는 store (미확인 카운트 표시용)
const notifStore = useNotificationStore()
// SSE 로 새 알림 수신 시 store 변화 감지용 reactive refs.
// totalElements 는 store 내부에서 SSE onNotification 시 +1 (ref 기반이라 watch trigger 안정적).
const { totalElements: storeTotal, unreadCount: storeUnread } = storeToRefs(notifStore)

// ── 알림 페이지 전용 페이징 상태 (store 와 별도 — 서버 페이징)
const PAGE_SIZE = 15
const PAGES_PER_GROUP = 5

const filterMode = ref('all')         // 'all' | 'unread'
const pageItems = ref([])             // 현재 페이지의 알림
const totalElements = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)            // 1-based
const loading = ref(false)
const error = ref('')

// 헤더 미확인 뱃지는 store 의 unreadCount 를 그대로 사용 (앱 전역 최신값)
const unreadCount = computed(() => notifStore.unreadCount)

// ── 페이지 그룹 (5개씩) — 계정 관리 페이지와 동일 패턴
const currentGroup = computed(() => Math.ceil(currentPage.value / PAGES_PER_GROUP))
const totalGroups = computed(() => Math.max(1, Math.ceil(totalPages.value / PAGES_PER_GROUP)))
const visiblePages = computed(() => {
  const start = (currentGroup.value - 1) * PAGES_PER_GROUP + 1
  const end = Math.min(start + PAGES_PER_GROUP - 1, totalPages.value)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

function goPrevGroup() {
  currentPage.value = Math.max(1, (currentGroup.value - 2) * PAGES_PER_GROUP + 1)
}
function goNextGroup() {
  currentPage.value = Math.min(totalPages.value, currentGroup.value * PAGES_PER_GROUP + 1)
}

// ── BE 호출 — 현재 페이지/필터로 조회
async function loadPage() {
  loading.value = true
  error.value = ''
  try {
    const data = await notificationApi.list({
      page: currentPage.value - 1,    // BE 는 0-based
      size: PAGE_SIZE,
      unreadOnly: filterMode.value === 'unread' ? true : undefined,
    })
    pageItems.value = data?.items ?? []
    totalElements.value = data?.totalElements ?? 0
    totalPages.value = Math.max(1, data?.totalPages ?? 1)
    // 현재 페이지가 총 페이지 수보다 크면 마지막 페이지로 보정 (필터 변경 등으로 항목이 줄어든 경우)
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  } catch (e) {
    error.value = e?.message ?? '알림을 불러오지 못했습니다.'
    console.error('[HqNotificationView.loadPage]', e)
  } finally {
    loading.value = false
  }
}

// 필터 변경 시 — 첫 페이지로 + 재호출
watch(filterMode, () => {
  currentPage.value = 1
  loadPage()
})

// 페이지 변경 시 — 재호출
watch(currentPage, () => loadPage())

// SSE 로 새 알림 수신 시 (store.totalElements +1) — 1페이지에 있으면 자동 갱신.
// 다른 페이지 (2, 3, ...) 에 있을 때는 사용자가 보던 위치 유지 (혼란 방지).
// store.totalElements 는 ref 라서 watch trigger 가 안정적 (storeToRefs 로 unwrap).
watch(storeTotal, (newVal, oldVal) => {
  console.log('[HqNotificationView] store.totalElements 변화:', oldVal, '→', newVal)  // 디버그
  if (newVal > oldVal && currentPage.value === 1) {
    loadPage()
  }
})
// 백업: 미확인 카운트도 함께 감시 (store.unreadCount 가 변하면 새 알림 도달 신호로 간주)
watch(storeUnread, (newVal, oldVal) => {
  if (newVal > oldVal && currentPage.value === 1) {
    loadPage()
  }
})

// ── 사용자 액션
async function reload() {
  // store 도 함께 새로고침 (헤더 카운트 최신화)
  await Promise.all([notifStore.refresh(), loadPage()])
}

async function handleClick(n) {
  if (n.read) return
  try {
    await notifStore.markAsRead(n.id)
    // 페이지 콘텐츠 갱신 — 미확인만 모드면 목록에서 빠져야 하므로 서버 재조회, 전체 모드면 로컬 read=true 만
    if (filterMode.value === 'unread') {
      await loadPage()
    } else {
      const idx = pageItems.value.findIndex((it) => it.id === n.id)
      if (idx >= 0) {
        pageItems.value[idx] = { ...pageItems.value[idx], read: true, readAt: new Date().toISOString() }
      }
    }
  } catch {
    /* ignore — store 가 콘솔 로그 처리 */
  }
}

async function handleReadAll() {
  try {
    await notifStore.markAllAsRead()
    // 페이지 콘텐츠 일괄 read=true 처리 (미확인 모드면 비워짐)
    await loadPage()
  } catch {
    /* ignore */
  }
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

onMounted(() => {
  notifStore.init()   // 헤더 종 아이콘용 store 초기화 (이미 init 됐으면 no-op)
  loadPage()          // 알림 페이지는 독립적으로 첫 페이지 조회
})
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
        <div v-if="loading && pageItems.length === 0" class="p-6 text-center text-xs text-gray-500">
          불러오는 중…
        </div>

        <ul v-else-if="pageItems.length > 0" class="divide-y divide-gray-100">
          <li
            v-for="n in pageItems"
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

        <!-- 페이지네이션 — 계정 관리와 동일 패턴 (<< < 1 2 3 4 5 > >>) -->
        <div
          v-if="pageItems.length > 0"
          class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-2"
        >
          <span class="text-[11px] font-medium text-gray-400">
            <template v-if="totalElements > 0">
              {{ (currentPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(currentPage * PAGE_SIZE, totalElements) }} / 전체 {{ totalElements }}건
            </template>
            <template v-else>0건</template>
          </span>
          <div class="flex items-center gap-1">
            <!-- << 이전 5페이지 그룹 -->
            <button
              type="button"
              :disabled="currentGroup === 1"
              class="flex h-7 w-7 items-center justify-center border border-gray-300 bg-white text-[12px] text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="goPrevGroup"
              title="이전 5페이지"
            >«</button>
            <!-- < 한 페이지 이전 -->
            <button
              type="button"
              :disabled="currentPage === 1"
              class="flex h-7 w-7 items-center justify-center border border-gray-300 bg-white text-[12px] text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="currentPage--"
              title="이전 페이지"
            >‹</button>
            <!-- 페이지 번호 (5개씩) -->
            <button
              v-for="p in visiblePages"
              :key="p"
              type="button"
              class="flex h-7 min-w-[28px] items-center justify-center border text-[12px] font-medium transition"
              :class="p === currentPage ? 'border-[#004D3C] bg-[#004D3C] text-white' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-100'"
              @click="currentPage = p"
            >{{ p }}</button>
            <!-- > 한 페이지 다음 -->
            <button
              type="button"
              :disabled="currentPage === totalPages"
              class="flex h-7 w-7 items-center justify-center border border-gray-300 bg-white text-[12px] text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="currentPage++"
              title="다음 페이지"
            >›</button>
            <!-- >> 다음 5페이지 그룹 -->
            <button
              type="button"
              :disabled="currentGroup === totalGroups"
              class="flex h-7 w-7 items-center justify-center border border-gray-300 bg-white text-[12px] text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="goNextGroup"
              title="다음 5페이지"
            >»</button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
