<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertCircle,
  BarChart3,
  Bell,
  CheckCircle2,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Store,
  Truck,
  Warehouse,
} from 'lucide-vue-next'
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

const topMenus = computed(() => (props.topMenus?.length ? props.topMenus : props.sideMenus))

const iconMap = {
  layout: LayoutDashboard,
  warehouse: Warehouse,
  alert: AlertCircle,
  truck: Truck,
  chart: BarChart3,
  file: FileText,
  store: Store,
  check: CheckCircle2,
  history: History,
  settings: Settings,
  tags: FileText,
  package: Package,
  badge: FileText,
  briefcase: Store,
  link2: CheckCircle2,
  refresh: History,
  sales: BarChart3,
  target: AlertCircle,
  trend: BarChart3,
}

function handleTopMenuClick(menu) {
  if (menu.path) router.push(menu.path)
}

function handleSideMenuClick(item) {
  if (item.path) {
    router.push(item.path)
    return
  }
  emit('update:activeSideMenu', item.label)
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 text-[13px] text-gray-900 antialiased">
    <header
      class="sticky top-0 z-20 flex min-h-12 items-center justify-between gap-4 border-b border-gray-700 bg-[#004D3C] px-4 shadow-[0_4px_12px_rgba(15,23,42,0.14)] max-[980px]:static max-[980px]:flex-col max-[980px]:items-stretch max-[980px]:py-3"
    >
      <div class="flex items-center gap-4 max-[980px]:flex-col max-[980px]:items-stretch">
        <div class="mr-2 flex items-center gap-2 border-r border-white/20 pr-6 max-[980px]:mr-0 max-[980px]:border-r-0 max-[980px]:pr-0">
          <div class="flex h-6 w-6 items-center justify-center bg-white text-xs font-bold text-gray-900">S</div>
          <span class="text-sm font-black uppercase text-white">StockIt ERP</span>
        </div>

        <nav class="flex flex-wrap items-center gap-1">
          <button
            v-for="menu in topMenus"
            :key="menu.label"
            type="button"
            class="h-12 border-b-2 px-4 text-xs font-bold transition-colors hover:bg-white/10"
            :class="activeTopMenu === menu.label ? 'border-white bg-white/10 text-white' : 'border-transparent text-white/60'"
            @click="handleTopMenuClick(menu)"
          >
            {{ menu.label }}
          </button>
        </nav>
      </div>

      <div class="flex items-center gap-2 border-l border-white/20 pl-4 max-[980px]:justify-start max-[980px]:border-l-0 max-[980px]:pl-0">
        <button type="button" class="p-1.5 text-white/80 transition-colors hover:bg-white/10" title="알림">
          <Bell :size="16" />
        </button>
        <button type="button" class="ml-2 flex items-center gap-2 p-1 transition-colors hover:bg-white/10">
          <span class="flex h-6 w-6 items-center justify-center bg-white/20 text-[10px] font-bold text-white">
            {{ userInitials }}
          </span>
          <span class="text-[11px] font-bold text-white/90">{{ userName }}</span>
        </button>
        <button type="button" class="p-1.5 text-white/80 transition-colors hover:bg-white/10" title="로그아웃" @click="emit('logout')">
          <LogOut :size="16" />
        </button>
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
            :class="activeSideMenu === item.label ? 'border-[#004D3C] bg-[#E6F2F0] font-bold text-[#004D3C]' : 'border-transparent text-gray-600 hover:bg-gray-50'"
            @click="handleSideMenuClick(item)"
          >
            <component :is="iconMap[item.icon] ?? FileText" :size="14" />
            <span>{{ item.label }}</span>
          </button>
        </nav>

        <div v-if="showSystemCard" class="mt-auto border-t border-gray-100 p-3 text-[11px] text-gray-500">
          <p class="font-bold text-gray-700">시스템 상태</p>
          <p class="mt-1">정상 운영 중</p>
        </div>
      </aside>

      <main class="min-w-0 flex-1 p-4">
        <slot />
      </main>
    </div>
  </div>
</template>
