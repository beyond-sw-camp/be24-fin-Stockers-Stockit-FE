<script setup>
import { h, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const props = defineProps({
  activeTopMenu: { type: String, required: true },
  topMenus: { type: Array, default: () => [] },
  sideMenus: { type: Array, required: true },
  activeSideMenu: { type: String, required: true },
  showSystemCard: { type: Boolean, default: false },
})

const emit = defineEmits(['update:activeSideMenu', 'logout'])

const router = useRouter()
const auth = useAuthStore()

const userName = computed(() => auth.user?.name ?? '사용자')
const userInitials = computed(() => {
  const name = auth.user?.name ?? ''
  return name.slice(-2).toUpperCase() || 'US'
})

const brandColor = '#004D3C'
const brandColorLight = '#E6F2F0'

const topMenus = computed(() => props.topMenus?.length ? props.topMenus : props.sideMenus)

const handleTopMenuClick = (menu) => {
  const item = topMenus.value.find(m => m.label === menu.label)
  if (item) router.push(item.path)
}

const IconBase = (paths) => ({
  props: {
    size: { type: Number, default: 16 },
    strokeWidth: { type: Number, default: 2 },
  },
  render() {
    return h(
      'svg',
      {
        width: this.size,
        height: this.size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': this.strokeWidth,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true',
      },
      paths.map((path) => h(path.tag, path.attrs)),
    )
  },
})

const BellIcon = IconBase([
  { tag: 'path', attrs: { d: 'M15 17H5a2 2 0 0 1-2-2c2 0 3-1 3-3V9a6 6 0 0 1 12 0v3c0 2 1 3 3 3a2 2 0 0 1-2 2h-4' } },
  { tag: 'path', attrs: { d: 'M10 17a2 2 0 0 0 4 0' } },
])

const SettingsIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '3' } },
  { tag: 'path', attrs: { d: 'M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 1-3 0 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06A2 2 0 1 1 5.24 17l.06-.06A1.7 1.7 0 0 0 5.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 1 0-3 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87L5.2 8.07A2 2 0 1 1 8.03 5.24l.06.06A1.7 1.7 0 0 0 10 5.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 1 3 0 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06A2 2 0 1 1 19.76 8l-.06.06A1.7 1.7 0 0 0 19.4 10c0 .37.21.73.6 1a1.7 1.7 0 0 1 0 3 1.7 1.7 0 0 0-.6 1Z' } },
])

const SearchIcon = IconBase([
  { tag: 'circle', attrs: { cx: '11', cy: '11', r: '7' } },
  { tag: 'path', attrs: { d: 'm20 20-3.5-3.5' } },
])

const LayoutDashboardIcon = IconBase([
  { tag: 'rect', attrs: { x: '3', y: '3', width: '7', height: '7' } },
  { tag: 'rect', attrs: { x: '14', y: '3', width: '7', height: '5' } },
  { tag: 'rect', attrs: { x: '14', y: '12', width: '7', height: '9' } },
  { tag: 'rect', attrs: { x: '3', y: '14', width: '7', height: '7' } },
])

const WarehouseIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 10.5 12 4l9 6.5' } },
  { tag: 'path', attrs: { d: 'M5 9.5V20h14V9.5' } },
  { tag: 'path', attrs: { d: 'M10 20v-5h4v5' } },
])

const AlertCircleIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 8v5' } },
  { tag: 'path', attrs: { d: 'M12 16h.01' } },
])

const TruckIcon = IconBase([
  { tag: 'path', attrs: { d: 'M10 17H5a2 2 0 0 1-2-2V7h11v10Z' } },
  { tag: 'path', attrs: { d: 'M14 17h-1V9h3l3 3v5h-1' } },
  { tag: 'circle', attrs: { cx: '7.5', cy: '17.5', r: '1.5' } },
  { tag: 'circle', attrs: { cx: '17.5', cy: '17.5', r: '1.5' } },
])

const BarChart3Icon = IconBase([
  { tag: 'path', attrs: { d: 'M3 20h18' } },
  { tag: 'path', attrs: { d: 'M7 16V8' } },
  { tag: 'path', attrs: { d: 'M12 16V4' } },
  { tag: 'path', attrs: { d: 'M17 16v-6' } },
])

const FileTextIcon = IconBase([
  { tag: 'path', attrs: { d: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z' } },
  { tag: 'path', attrs: { d: 'M14 3v5h5' } },
  { tag: 'path', attrs: { d: 'M9 13h6' } },
  { tag: 'path', attrs: { d: 'M9 17h6' } },
])

const StoreIcon = IconBase([
  { tag: 'path', attrs: { d: 'M4 10h16' } },
  { tag: 'path', attrs: { d: 'M5 10V6l2-2h10l2 2v4' } },
  { tag: 'path', attrs: { d: 'M6 10v10h12V10' } },
  { tag: 'path', attrs: { d: 'M10 20v-5h4v5' } },
])

const CheckCircle2Icon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'm9 12 2 2 4-4' } },
])

const HistoryIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 12a9 9 0 1 0 3-6.7' } },
  { tag: 'path', attrs: { d: 'M3 4v5h5' } },
  { tag: 'path', attrs: { d: 'M12 7v5l3 2' } },
])

const iconMap = {
  layout: LayoutDashboardIcon,
  warehouse: WarehouseIcon,
  alert: AlertCircleIcon,
  truck: TruckIcon,
  chart: BarChart3Icon,
  file: FileTextIcon,
  store: StoreIcon,
  check: CheckCircle2Icon,
  history: HistoryIcon,
  settings: SettingsIcon,
  tags: FileTextIcon,
  package: WarehouseIcon,
  badge: FileTextIcon,
  briefcase: StoreIcon,
  link2: CheckCircle2Icon,
  refresh: HistoryIcon,
  sales: BarChart3Icon,
  target: AlertCircleIcon,
  trend: BarChart3Icon,
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 text-[13px] text-gray-900 antialiased">
    <header
      class="sticky top-0 z-20 flex min-h-12 items-center justify-between gap-4 border-b border-gray-700 bg-[#004D3C] px-4 shadow-[0_4px_12px_rgba(15,23,42,0.14)] max-[980px]:static max-[980px]:flex-col max-[980px]:items-stretch max-[980px]:px-4 max-[980px]:py-3"
    >
      <div class="flex items-center gap-4 max-[980px]:flex-col max-[980px]:items-stretch">
        <div
          class="mr-2 flex items-center gap-2 border-r border-white/20 pr-6 max-[980px]:mr-0 max-[980px]:border-r-0 max-[980px]:pr-0"
        >
          <div class="flex h-6 w-6 items-center justify-center bg-white text-xs font-bold text-gray-900">S</div>
          <span class="text-sm font-black uppercase text-white">StockIt ERP</span>
        </div>

        <nav class="flex flex-wrap items-center gap-1">
          <button
            v-for="menu in topMenus"
            :key="menu.label"
            type="button"
            class="h-12 border-b-2 px-4 text-xs font-bold transition-colors hover:bg-white/10"
            :class="
              activeTopMenu === menu.label
                ? 'border-white bg-white/10 text-white'
                : 'border-transparent text-white/60'
            "
            @click="handleTopMenuClick(menu)"
          >
            {{ menu.label }}
          </button>
        </nav>
      </div>

      <div class="flex items-center gap-4 max-[980px]:flex-col max-[980px]:items-stretch">
        <div
          class="flex items-center gap-1 border-l border-white/20 pl-4 max-[980px]:justify-start max-[980px]:border-l-0 max-[980px]:pl-0"
        >
          <button type="button" class="p-1.5 text-white/80 transition-colors hover:bg-white/10">
            <BellIcon :size="16" />
          </button>
          <button type="button" class="ml-2 flex items-center gap-2 p-1 transition-colors hover:bg-white/10">
            <span class="flex h-6 w-6 items-center justify-center bg-white/20 text-[10px] font-bold text-white">
              {{ userInitials }}
            </span>
            <span class="text-[11px] font-bold text-white/90">{{ userName }}</span>
          </button>
          <button
            type="button"
            class="p-1.5 text-white/80 transition-colors hover:bg-white/10"
            title="로그아웃"
            @click="emit('logout')"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </header>

    <div class="flex min-h-[calc(100vh-48px)] max-[980px]:flex-col">
      <aside class="flex w-52 shrink-0 flex-col border-r border-gray-300 bg-white max-[980px]:w-full">
        <div class="border-b border-gray-100 bg-gray-50/50 p-4">
          <p class="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Navigation</p>
          <p class="text-xs font-black text-gray-800">{{ activeTopMenu }}</p>
        </div>

        <nav class="p-2">
          <button
            v-for="item in sideMenus"
            :key="item.label"
            type="button"
            class="mt-0.5 flex w-full items-center gap-2.5 border px-3 py-2.5 text-left text-xs transition-colors"
            :class="
              activeSideMenu === item.label
                ? 'border-[#004D3C] bg-[#E6F2F0] font-bold text-[#004D3C]'
                : 'border-transparent text-gray-600 hover:bg-gray-50'
            "
            @click="item.path ? router.push(item.path) : emit('update:activeSideMenu', item.label)"
          >
            <component :is="iconMap[item.icon] ?? FileTextIcon" :size="14" />
            <span>{{ item.label }}</span>
          </button>
        </nav>

        <div v-if="showSystemCard" class="mt-auto border-t border-gray-200 bg-gray-50 p-4">
          <div class="mb-2 flex items-center justify-between text-[10px] font-bold text-gray-400">
            <span>시스템 상태</span>
            <span class="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div class="mb-1 h-1 w-full bg-gray-200">
            <div class="h-full w-[74%] bg-[#004D3C]" />
          </div>
          <p class="text-[9px] text-gray-500">서버 점유율: 74%</p>
        </div>
      </aside>

      <main class="min-w-0 flex-1 p-4">
        <slot />
      </main>
    </div>
  </div>
</template>
