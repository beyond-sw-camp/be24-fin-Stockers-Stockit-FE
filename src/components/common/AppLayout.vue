<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
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
  activeSideMenu: { type: String, required: true },
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

onMounted(() => {
  restoreSidebarScrollTop()
})

watch(
  () => route.fullPath,
  () => {
    restoreSidebarScrollTop()
  },
)

const hasMenuChildren = (menu) => Array.isArray(menu?.children) && menu.children.length > 0

const handleTopMenuClick = async (menu) => {
  if (menu.path) {
    await runWithPreservedSidebarScroll(() => router.push(menu.path))
  }

  if (!hasMenuChildren(menu)) {
    if (openTopMenus.value.includes(menu.label)) {
      saveOpenTopMenus(openTopMenus.value.filter(label => label !== menu.label))
    }
    return
  }

  const isOpen = openTopMenus.value.includes(menu.label)
  saveOpenTopMenus(isOpen
    ? openTopMenus.value.filter(label => label !== menu.label)
    : [...openTopMenus.value, menu.label])
}

const keepParentMenuOpen = (parentMenu) => {
  if (!parentMenu || openTopMenus.value.includes(parentMenu.label)) return
  saveOpenTopMenus([...openTopMenus.value, parentMenu.label])
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
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 text-[13px] text-gray-900 antialiased">
    <header
      class="sticky top-0 z-20 flex min-h-12 items-center justify-between gap-4 border-b border-gray-700 bg-[#004D3C] px-4 shadow-[0_4px_12px_rgba(15,23,42,0.14)] max-[980px]:static max-[980px]:flex-col max-[980px]:items-stretch max-[980px]:px-4 max-[980px]:py-3"
    >
      <div class="flex items-center gap-4 max-[980px]:flex-col max-[980px]:items-stretch">
        <div
          class="mr-2 flex items-center gap-2 max-[980px]:mr-0"
        >
          <Leaf :size="20" :stroke-width="2.5" class="text-white" />
          <span class="text-sm font-black text-white">Stockit</span>
        </div>
      </div>

      <div class="flex items-center gap-4 max-[980px]:flex-col max-[980px]:items-stretch">
        <div
          class="flex items-center gap-1 border-l border-white/20 pl-4 max-[980px]:justify-start max-[980px]:border-l-0 max-[980px]:pl-0"
        >
          <button
            v-if="isHq"
            type="button"
            class="mr-1 flex items-center gap-1.5 rounded border border-emerald-300/40 bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-500/30"
            title="ESG 대시보드 바로가기"
            @click="router.push('/hq/esg')"
          >
            <Sprout :size="14" />
            <span>ESG 대시보드</span>
          </button>
          <button type="button" class="p-1.5 text-white/80 transition-colors hover:bg-white/10">
            <Bell :size="16" />
          </button>
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
          class="min-h-0 flex-1 overflow-y-auto p-2"
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

            <div v-if="hasMenuChildren(menu) && openTopMenus.includes(menu.label)" class="relative ml-5 mt-1 py-1 pl-5 pr-1">
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
          </div>
        </nav>

        <nav
          v-else-if="!treeMode"
          class="min-h-0 flex-1 overflow-y-auto p-2"
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
