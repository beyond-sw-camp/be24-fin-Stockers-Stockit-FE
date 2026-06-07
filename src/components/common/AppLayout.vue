<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useNotificationStore } from '@/stores/notification.js'
import { useLogout } from '@/composables/useLogout.js'
import EsgTreeWidget from '@/components/common/EsgTreeWidget.vue'
import {
  Bell,
  UserCircle2,
  Settings,
  LayoutDashboard,
  Warehouse,
  CircleAlert,
  Truck,
  BarChart3,
  FileText,
  Store,
  CircleCheckBig,
  History,
  Leaf,
  Sprout,
  LogOut,
  ArrowRightLeft,
  Recycle,
  Users,
  PackagePlus,
} from 'lucide-vue-next'

const openTopMenusStorageKey = 'stockit:openTopMenus'
const sidebarScrollTopStorageKey = 'stockit:sidebarScrollTop'

const readStoredOpenTopMenus = () => {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.sessionStorage.getItem(openTopMenusStorageKey)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const sharedOpenTopMenus = ref(readStoredOpenTopMenus())

const saveOpenTopMenus = (menus) => {
  sharedOpenTopMenus.value = menus

  if (typeof window === 'undefined') return

  window.sessionStorage.setItem(openTopMenusStorageKey, JSON.stringify(menus))
}

const props = defineProps({
  activeTopMenu: { type: String, default: '' },
  topMenus: { type: Array, default: () => [] },
  sideMenus: { type: Array, required: true },
  activeSideMenu: { type: String, default: '' },
  showSystemCard: { type: Boolean, default: false },
})

const emit = defineEmits(['update:activeSideMenu'])

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const logout = useLogout()

const userName = computed(() => auth.user?.name ?? '사용자')
const isHq = computed(() => auth.user?.role === 'hq')
const roleLabel = computed(() => {
  switch (auth.user?.role) {
    case 'hq': return '본사 관리자'
    case 'store': return '매장 관리자'
    case 'warehouse': return '물류창고 관리자'
    default: return ''
  }
})
const storeName = computed(() => {
  if (auth.user?.role === 'hq') return ''
  // BE 응답: locationName (예: 강남 플래그십점 / 수도권 통합 물류센터)
  return auth.user?.locationName ?? auth.user?.storeName ?? ''
})

const brandColor = '#004D3C'
const brandColorLight = '#E6F2F0'

const hasTopMenus = computed(() => Boolean(props.topMenus?.length))
const topMenus = computed(() => props.topMenus ?? [])
const currentNavigationLabel = computed(() => props.activeTopMenu || 'Navigation')
const openTopMenus = sharedOpenTopMenus

const treeMode = ref(false)
const toggleTreeMode = () => { treeMode.value = !treeMode.value }
const sidebarRef = ref(null)
const setOpenTopMenuExclusive = (label) => { saveOpenTopMenus(label ? [label] : []) }
const SUBMENU_ENTER_MS = 360
const SUBMENU_LEAVE_MS = 320
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const skipSubmenuAnimation = ref(false)

const getSidebarNavElement = () => sidebarRef.value?.querySelector('nav.overflow-y-auto') ?? null

const saveSidebarScrollTop = (value) => {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(sidebarScrollTopStorageKey, String(Math.max(0, value ?? 0)))
}

const readSidebarScrollTop = () => {
  if (typeof window === 'undefined') return 0
  const raw = window.sessionStorage.getItem(sidebarScrollTopStorageKey)
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

const restoreSidebarScrollTop = async () => {
  await nextTick()

  requestAnimationFrame(() => {
    const nav = getSidebarNavElement()
    if (!nav) return
    nav.scrollTop = readSidebarScrollTop()
  })
}

const handleSidebarScroll = (event) => {
  saveSidebarScrollTop(event?.target?.scrollTop ?? 0)
}

const runWithPreservedSidebarScroll = async (action) => {
  const currentNav = getSidebarNavElement()
  const scrollTop = currentNav?.scrollTop ?? 0
  saveSidebarScrollTop(scrollTop)

  await action()
  await nextTick()

  requestAnimationFrame(() => {
    const nextNav = getSidebarNavElement()
    if (nextNav) nextNav.scrollTop = scrollTop
  })
}

const isRouteMatch = (menuPath) => {
  if (!menuPath) return false
  if (menuPath.includes('?')) return route.fullPath === menuPath
  if (route.path === menuPath) return true
  return route.path.startsWith(`${menuPath}/`)
}

const syncOpenTopMenuWithRoute = () => {
  const matchedParent = topMenus.value.find((menu) => {
    if (hasMenuChildren(menu)) {
      return isRouteMatch(menu.path) || getMenuChildren(menu).some((item) => isRouteMatch(item.path))
    }
    return isRouteMatch(menu.path)
  })

  if (!matchedParent || !hasMenuChildren(matchedParent)) return
  setOpenTopMenuExclusive(matchedParent.label)
}

onMounted(() => {
  syncOpenTopMenuWithRoute()
  restoreSidebarScrollTop()
})

watch(
  () => route.fullPath,
  () => {
    syncOpenTopMenuWithRoute()
    restoreSidebarScrollTop()
  },
)

const hasMenuChildren = (menu) => Array.isArray(menu?.children) && menu.children.length > 0

const handleTopMenuClick = async (menu) => {
  if (!hasMenuChildren(menu)) {
    setOpenTopMenuExclusive(null)
    if (menu.path) {
      await runWithPreservedSidebarScroll(() => router.push(menu.path))
    }
    return
  }

  const isOpen = openTopMenus.value.includes(menu.label)
  if (isOpen) {
    setOpenTopMenuExclusive(null)
    return
  }

  const hasAnotherOpenMenu = openTopMenus.value.length > 0 && !openTopMenus.value.includes(menu.label)
  if (hasAnotherOpenMenu) {
    skipSubmenuAnimation.value = true
    setOpenTopMenuExclusive(menu.label)
    await nextTick()
    skipSubmenuAnimation.value = false
  } else {
    setOpenTopMenuExclusive(menu.label)
  }
  const firstChild = getMenuChildren(menu)[0]
  if (firstChild?.path) {
    await new Promise((resolve) => {
      requestAnimationFrame(async () => {
        await runWithPreservedSidebarScroll(() => router.push(firstChild.path))
        resolve()
      })
    })
  }
}

const keepParentMenuOpen = (parentMenu) => {
  if (!parentMenu) return
  if (openTopMenus.value.includes(parentMenu.label) && openTopMenus.value.length === 1) return
  // 하위 메뉴 선택 시에는 해당 부모만 열고 나머지는 닫음
  setOpenTopMenuExclusive(parentMenu.label)
}

const handleSideMenuClick = async (item, parentMenu = null) => {
  keepParentMenuOpen(parentMenu)

  if (item.path) {
    await runWithPreservedSidebarScroll(() => router.push(item.path))
    return
  }

  if (parentMenu && parentMenu.label !== props.activeTopMenu && parentMenu.path) {
    await runWithPreservedSidebarScroll(() => router.push(parentMenu.path))
    return
  }

  emit('update:activeSideMenu', item.label)
}

const getMenuChildren = (menu) => menu.children ?? []

const onSubmenuBeforeEnter = (el) => {
  el.style.height = '0px'
  el.style.overflow = 'hidden'
}

const onSubmenuEnter = (el, done) => {
  if (skipSubmenuAnimation.value) {
    el.style.height = 'auto'
    el.style.overflow = ''
    el.style.transition = ''
    done()
    return
  }
  el.style.transition = 'none'
  el.style.height = '0px'
  el.style.overflow = 'hidden'

  requestAnimationFrame(() => {
    // lock start frame to avoid abrupt jump on expand
    void el.offsetHeight

    requestAnimationFrame(() => {
      const targetHeight = `${el.scrollHeight}px`
      el.style.transition = `height ${SUBMENU_ENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
      el.style.height = targetHeight

      const onEnd = (event) => {
        if (event.propertyName !== 'height') return
        el.removeEventListener('transitionend', onEnd)
        done()
      }
      el.addEventListener('transitionend', onEnd)
    })
  })
}

const onSubmenuAfterEnter = (el) => {
  el.style.height = 'auto'
  el.style.overflow = ''
  el.style.transition = ''
}

const onSubmenuBeforeLeave = (el) => {
  el.style.height = `${el.scrollHeight}px`
  el.style.overflow = 'hidden'
}

const onSubmenuLeave = (el, done) => {
  if (skipSubmenuAnimation.value) {
    el.style.height = '0px'
    el.style.overflow = ''
    el.style.transition = ''
    done()
    return
  }
  requestAnimationFrame(() => {
    el.style.transition = `height ${SUBMENU_LEAVE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
    el.style.height = '0px'

    const onEnd = (event) => {
      if (event.propertyName !== 'height') return
      el.removeEventListener('transitionend', onEnd)
      done()
    }
    el.addEventListener('transitionend', onEnd)
  })
}

const onSubmenuAfterLeave = (el) => {
  el.style.height = ''
  el.style.overflow = ''
  el.style.transition = ''
}

// ───────────────────── 알림 (상단 종 아이콘 + 미니 드롭다운) ─────────────────────
// BE 연동 — useNotificationStore (전역). 로그인 직후 init() 에서 초기 로드 + SSE 구독.
const notifStore = useNotificationStore()
const unreadCount = computed(() => notifStore.unreadCount)
const recentNotifications = computed(() => notifStore.recent)

const showNotifPanel = ref(false)
const notifPanelRef = ref(null)
const notifButtonRef = ref(null)

const dashboardPath = computed(() => {
  switch (auth.user?.role) {
    case 'hq':        return '/hq/dashboard'
    case 'store':     return '/store/dashboard'
    case 'warehouse': return '/warehouse/dashboard'
    default:          return null
  }
})

const notificationPagePath = computed(() => {
  switch (auth.user?.role) {
    case 'hq':        return '/hq/notifications'
    case 'store':     return '/store/notifications'
    case 'warehouse': return '/warehouse/notifications'
    default:          return null
  }
})

const toggleNotifPanel = () => { showNotifPanel.value = !showNotifPanel.value }
const closeNotifPanel = () => { showNotifPanel.value = false }

const goToNotificationsPage = () => {
  closeNotifPanel()
  if (notificationPagePath.value) router.push(notificationPagePath.value)
}

const markAllNotifRead = async () => {
  try { await notifStore.markAllAsRead() } catch { /* 에러는 store 가 콘솔 로깅 */ }
}

const handleNotifClick = async (n) => {
  // 단건 클릭 → 읽음 처리(BE 호출) + 알림 페이지 이동
  try { if (!n.read) await notifStore.markAsRead(n.id) } catch { /* ignore */ }
  goToNotificationsPage()
}

const notifSeverityBadgeCls = (severity) => {
  switch (severity) {
    case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-300'
    case 'WARNING':  return 'bg-amber-100 text-amber-700 border-amber-300'
    default:         return 'bg-sky-100 text-sky-700 border-sky-300'
  }
}

const notifSeverityLabel = (severity) => {
  switch (severity) {
    case 'CRITICAL': return '긴급'
    case 'WARNING':  return '주의'
    default:         return '정보'
  }
}

const handleClickOutsideNotif = (event) => {
  if (!showNotifPanel.value) return
  const panel = notifPanelRef.value
  const btn = notifButtonRef.value
  if (panel && panel.contains(event.target)) return
  if (btn && btn.contains(event.target)) return
  closeNotifPanel()
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('mousedown', handleClickOutsideNotif)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousedown', handleClickOutsideNotif)
  }
})

const iconMap = {
  layout: LayoutDashboard,
  warehouse: Warehouse,
  alert: CircleAlert,
  truck: Truck,
  chart: BarChart3,
  file: FileText,
  store: Store,
  check: CircleCheckBig,
  history: History,
  settings: Settings,
  tags: FileText,
  package: Warehouse,
  badge: FileText,
  briefcase: Store,
  link2: CircleCheckBig,
  refresh: History,
  leaf: Leaf,
  sprout: Sprout,
  sales: BarChart3,
  target: CircleAlert,
  trend: BarChart3,
  transfer: ArrowRightLeft,
  recycle: Recycle,
  user: Users,
  inbound: PackagePlus,
  outbound: Truck,
  bell: Bell,
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 text-[13px] text-gray-900 antialiased">
    <header
      class="sticky top-0 z-20 flex min-h-12 items-center justify-between gap-4 border-b border-gray-700 bg-[#004D3C] px-4 shadow-[0_4px_12px_rgba(15,23,42,0.14)] max-[980px]:static max-[980px]:flex-col max-[980px]:items-stretch max-[980px]:px-4 max-[980px]:py-3"
    >
      <div class="flex items-center gap-4 max-[980px]:flex-col max-[980px]:items-stretch">
        <button
          type="button"
          class="group mr-2 flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 max-[980px]:mr-0"
          @click="dashboardPath && router.push(dashboardPath)"
        >
          <Leaf :size="20" :stroke-width="2.5" class="text-white transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]" />
          <span class="text-sm font-black text-white transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]">Stockit</span>
        </button>
      </div>

      <div class="flex items-center gap-4 max-[980px]:flex-col max-[980px]:items-stretch">
        <div
          class="flex items-center gap-2 max-[980px]:justify-start"
        >
          <button
            v-if="isHq"
            type="button"
            class="mr-1 flex items-center gap-1.5 rounded border border-emerald-300/40 bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-500/30"
            title="ESG 대시보드 바로가기"
            @click="router.push('/hq/esg')"
          >
            <Sprout :size="14" />
            <span>ESG 탄소 배출 관리</span>
          </button>
          <button
            v-if="isHq"
            type="button"
            class="mr-1 flex items-center gap-1.5 rounded border border-emerald-300/40 bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-500/30"
            title="친환경 나무 키우기 점수 바로가기"
            @click="router.push('/hq/esg/tree-score')"
          >
            <Leaf :size="14" />
            <span>나무 키우기 점수</span>
          </button>
          <span class="ml-4 mr-5 h-5 w-px bg-white/20 max-[980px]:hidden" style="margin-left: 5px;" />
          <div class="relative">
            <button
              ref="notifButtonRef"
              type="button"
              class="relative p-1.5 text-white/80 transition-colors hover:bg-white/10"
              title="알림"
              @click="toggleNotifPanel"
            >
              <Bell :size="16" />
              <span
                v-if="unreadCount > 0"
                class="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white ring-1 ring-[#004D3C]"
              >
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </span>
            </button>

            <div
              v-if="showNotifPanel"
              ref="notifPanelRef"
              class="absolute right-0 top-full z-30 mt-1 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-900 shadow-lg"
            >
              <div class="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-2">
                <div class="flex items-center gap-1.5">
                  <Bell :size="14" class="text-emerald-700" />
                  <span class="text-xs font-bold">알림</span>
                  <span v-if="unreadCount > 0" class="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                    {{ unreadCount > 9 ? '9+' : unreadCount }}
                  </span>
                </div>
                <button
                  v-if="unreadCount > 0"
                  type="button"
                  class="text-[10px] font-semibold text-emerald-700 hover:underline"
                  @click="markAllNotifRead"
                >
                  모두 읽음
                </button>
              </div>

              <ul v-if="recentNotifications.length > 0" class="max-h-72 divide-y divide-gray-100 overflow-y-auto">
                <li
                  v-for="n in recentNotifications"
                  :key="n.id"
                  class="cursor-pointer px-3 py-2 transition-colors hover:bg-gray-50"
                  :class="{ 'bg-emerald-50/40': !n.read }"
                  @click="handleNotifClick(n)"
                >
                  <div class="flex items-start gap-2">
                    <span
                      class="mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold"
                      :class="notifSeverityBadgeCls(n.severity)"
                    >
                      {{ notifSeverityLabel(n.severity) }}
                    </span>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-[11px] font-semibold">{{ n.title }}</p>
                      <p class="mt-0.5 truncate text-[10px] text-gray-500">{{ n.message }}</p>
                    </div>
                  </div>
                </li>
              </ul>

              <div v-else class="flex flex-col items-center gap-1 px-3 py-6 text-center">
                <Bell :size="20" class="text-gray-300" />
                <p class="text-[11px] text-gray-500">새 알림이 없습니다.</p>
              </div>

              <button
                type="button"
                class="block w-full border-t border-gray-100 bg-gray-50 px-3 py-2 text-center text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-gray-100"
                @click="goToNotificationsPage"
              >
                전체 보기
              </button>
            </div>
          </div>
          <button
            type="button"
            class="ml-2 flex items-center gap-2 p-1 transition-colors hover:bg-white/10"
            title="마이페이지"
            @click="router.push('/mypage')"
          >
            <UserCircle2 :size="22" :stroke-width="1.8" class="text-white" />
            <span class="flex flex-col items-start leading-tight">
              <span class="text-[11px] font-bold text-white/90">{{ userName }}</span>
              <span v-if="roleLabel" class="text-[9px] font-medium text-white/60">
                {{ roleLabel }}<span v-if="storeName"> · {{ storeName }}</span>
              </span>
            </span>
          </button>
          <button
            type="button"
            class="p-1.5 text-white/80 transition-colors hover:bg-white/10"
            title="로그아웃"
            @click="logout"
          >
            <LogOut :size="15" />
          </button>
        </div>
      </div>
    </header>

    <div class="flex min-h-[calc(100vh-48px)] max-[980px]:flex-col">
      <aside ref="sidebarRef" class="sticky top-12 flex h-[calc(100vh-48px)] w-52 shrink-0 flex-col self-start border-r border-gray-300 bg-white max-[980px]:static max-[980px]:h-auto max-[980px]:w-full">
        <div class="border-b border-gray-100 bg-gray-50/50 p-4">
          <p class="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Navigation</p>
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs font-black text-gray-800">{{ currentNavigationLabel }}</p>
            <button
              v-if="isHq"
              type="button"
              class="shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-semibold transition-colors"
              :class="treeMode
                ? 'border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50'"
              :title="treeMode ? '메뉴 목록으로 돌아가기' : 'ESG 나무 키우기 보기'"
              @click="toggleTreeMode"
            >
              {{ treeMode ? '← 메뉴' : 'ESG 나무' }}
            </button>
          </div>
        </div>

        <nav
          v-if="!treeMode && hasTopMenus"
          class="sidebar-scroll min-h-0 flex-1 overflow-y-auto p-2"
          @scroll.passive="handleSidebarScroll"
        >
          <div v-for="menu in topMenus" :key="menu.label" class="mt-0.5">
            <button
              type="button"
              class="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-xs transition-colors"
              :class="
                activeTopMenu === menu.label
                  ? 'bg-[#EBF5F5] font-bold text-black'
                  : 'font-semibold text-black hover:bg-[#EBF5F5]'
              "
              @click="handleTopMenuClick(menu)"
            >
              <component :is="iconMap[menu.icon] ?? FileText" :size="14" />
              <span class="min-w-0 flex-1">{{ menu.label }}</span>
              <span
                v-if="hasMenuChildren(menu)"
                class="text-[10px] text-black/60 transition-transform"
                :class="openTopMenus.includes(menu.label) ? 'rotate-90' : ''"
                aria-hidden="true"
              >
                ›
              </span>
            </button>

            <Transition
              :css="false"
              @before-enter="onSubmenuBeforeEnter"
              @enter="onSubmenuEnter"
              @after-enter="onSubmenuAfterEnter"
              @before-leave="onSubmenuBeforeLeave"
              @leave="onSubmenuLeave"
              @after-leave="onSubmenuAfterLeave"
            >
              <div
                v-if="hasMenuChildren(menu) && openTopMenus.includes(menu.label)"
                class="relative ml-5 mt-1 py-1 pl-5 pr-1"
              >
                <span class="absolute bottom-3 left-2 top-3 w-px bg-[#D6EAEA]" aria-hidden="true"></span>
                <button
                  v-for="item in getMenuChildren(menu)"
                  :key="item.label"
                  type="button"
                  class="relative mt-0.5 flex w-full items-center rounded-md px-3 py-2 text-left text-[11px] transition-colors"
                  :class="
                    activeTopMenu === menu.label && activeSideMenu === item.label
                      ? 'bg-[#EBF5F5] font-semibold text-black'
                      : 'text-black hover:bg-[#EBF5F5]'
                  "
                  @click="handleSideMenuClick(item, menu)"
                >
                  <span class="absolute -left-3 top-1/2 h-px w-3 bg-[#D6EAEA]" aria-hidden="true"></span>
                  <span>{{ item.label }}</span>
                </button>
              </div>
            </Transition>
          </div>
        </nav>

        <nav
          v-else-if="!treeMode"
          class="sidebar-scroll min-h-0 flex-1 overflow-y-auto p-2"
          @scroll.passive="handleSidebarScroll"
        >
          <button
            v-for="item in sideMenus"
            :key="item.label"
            type="button"
            class="mt-0.5 flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-xs transition-colors"
            :class="
              activeSideMenu === item.label
                ? 'bg-[#EBF5F5] font-bold text-black'
                : 'font-semibold text-black hover:bg-[#EBF5F5]'
            "
            @click="handleSideMenuClick(item)"
          >
              <component :is="iconMap[item.icon] ?? FileText" :size="14" />
            <span>{{ item.label }}</span>
          </button>
        </nav>

        <EsgTreeWidget v-if="isHq && treeMode" :expanded="true" />
      </aside>

      <main class="min-w-0 flex-1 p-4">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.sidebar-scroll {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.sidebar-scroll::-webkit-scrollbar {
  width: 6px;
}

.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}

.sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
