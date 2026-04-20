<script setup>
import { h, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const props = defineProps({
  activeTopMenu: { type: String, required: true },
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

const topMenus = computed(() => props.sideMenus.map(m => m.label))

const handleTopMenuClick = (menu) => {
  const item = props.sideMenus.find(m => m.label === menu)
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
}
</script>

<template>
  <div class="erp-page">
    <header class="topbar">
      <div class="topbar-left">
        <div class="brand">
          <div class="brand-mark inverse">S</div>
          <span class="brand-name inverse">StockIt ERP</span>
        </div>
        <nav class="top-nav">
          <button
            v-for="menu in topMenus"
            :key="menu"
            type="button"
            class="top-nav-button"
            :class="{ active: activeTopMenu === menu }"
            @click="handleTopMenuClick(menu)"
          >
            {{ menu }}
          </button>
        </nav>
      </div>

      <div class="topbar-right">
        <label class="search-box">
          <SearchIcon :size="14" class="search-icon" />
          <input type="text" placeholder="명령어 또는 데이터 검색 (Alt+K)" />
        </label>
        <div class="topbar-actions">
          <button type="button" class="icon-button">
            <BellIcon :size="16" />
          </button>
          <button type="button" class="icon-button">
            <SettingsIcon :size="16" />
          </button>
          <button type="button" class="user-card">
            <span class="user-avatar">{{ userInitials }}</span>
            <span class="user-name">{{ userName }}</span>
          </button>
          <button type="button" class="icon-button logout-button" title="로그아웃" @click="emit('logout')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </header>

    <div class="layout-shell">
      <aside class="sidebar">
        <div class="sidebar-head">
          <p class="sidebar-caption">Navigation</p>
          <p class="sidebar-title">{{ activeTopMenu }}</p>
        </div>
        <nav class="side-nav">
          <button
            v-for="item in sideMenus"
            :key="item.label"
            type="button"
            class="side-nav-button"
            :class="{ active: activeSideMenu === item.label }"
            :style="
              activeSideMenu === item.label
                ? { backgroundColor: brandColorLight, borderColor: brandColor, color: brandColor }
                : {}
            "
            @click="item.path ? router.push(item.path) : emit('update:activeSideMenu', item.label)"
          >
            <component :is="iconMap[item.icon]" :size="14" />
            <span>{{ item.label }}</span>
          </button>
        </nav>
        <div v-if="showSystemCard" class="system-card">
          <div class="system-head">
            <span>시스템 상태</span>
            <span class="status-dot" />
          </div>
          <div class="system-meter">
            <div class="system-meter-fill" :style="{ backgroundColor: brandColor }" />
          </div>
          <p>서버 점유율: 74%</p>
        </div>
      </aside>

      <main class="content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
:global(body) {
  background: #f3f4f6;
}

.erp-page {
  min-height: 100vh;
  background: #f3f4f6;
  color: #111827;
  font-family:
    'SFMono-Regular',
    'SF Mono',
    'Roboto Mono',
    'Consolas',
    'Liberation Mono',
    monospace;
  font-size: 13px;
  -webkit-font-smoothing: antialiased;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 48px;
  padding: 0 16px;
  background: #004d3c;
  border-bottom: 1px solid #374151;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.14);
}

.topbar-left,
.topbar-right,
.topbar-actions,
.top-nav,
.system-head {
  display: flex;
  align-items: center;
}

.topbar-left,
.topbar-right {
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 24px;
  margin-right: 8px;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 12px;
  font-weight: 700;
}

.brand-mark.inverse {
  background: #fff !important;
  color: #111827;
}

.brand-name {
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.04em;
  text-transform: uppercase;
}

.brand-name.inverse {
  color: #fff !important;
}

.top-nav {
  gap: 4px;
}

.top-nav-button,
.icon-button,
.user-card,
.side-nav-button {
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.top-nav-button {
  height: 48px;
  padding: 0 16px;
  border-bottom: 2px solid transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-weight: 700;
  transition: background-color 0.2s ease;
}

.top-nav-button:hover,
.icon-button:hover,
.user-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.side-nav-button:hover {
  background: #f9fafb;
}

.top-nav-button.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border-bottom-color: #fff;
}

.search-box {
  position: relative;
  display: block;
}

.search-box input {
  width: 224px;
  padding: 7px 12px 7px 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  outline: none;
  font: inherit;
  font-size: 11px;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.55);
}

.search-box input:focus {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.22);
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.55);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.icon-button {
  padding: 6px;
  color: rgba(255, 255, 255, 0.8);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  padding: 4px;
}

.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

.user-name {
  color: rgba(255, 255, 255, 0.9);
  font-size: 11px;
  font-weight: 700;
}

.layout-shell {
  display: flex;
  min-height: calc(100vh - 48px);
}

.sidebar {
  display: flex;
  flex-direction: column;
  width: 208px;
  flex-shrink: 0;
  border-right: 1px solid #d1d5db;
  background: #fff;
}

.sidebar-head {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  background: rgba(249, 250, 251, 0.5);
}

.sidebar-caption {
  margin-bottom: 4px;
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.sidebar-title {
  color: #1f2937;
  font-size: 12px;
  font-weight: 900;
}

.side-nav {
  padding: 8px;
}

.side-nav-button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid transparent;
  color: #4b5563;
  font-size: 12px;
  text-align: left;
}

.side-nav-button + .side-nav-button {
  margin-top: 2px;
}

.side-nav-button.active {
  border-color: #004d3c;
  background: #e6f2f0;
  color: #004d3c;
  font-weight: 700;
}

.system-card {
  margin-top: auto;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.system-head {
  justify-content: space-between;
  margin-bottom: 8px;
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #10b981;
}

.system-meter {
  width: 100%;
  height: 4px;
  margin-bottom: 4px;
  background: #e5e7eb;
}

.system-meter-fill {
  width: 74%;
  height: 100%;
}

.system-card p {
  color: #6b7280;
  font-size: 9px;
}

.content {
  flex: 1;
  min-width: 0;
  padding: 16px;
}

@media (max-width: 980px) {
  .topbar,
  .layout-shell {
    flex-direction: column;
    align-items: stretch;
  }

  .topbar {
    position: static;
    padding: 12px 16px;
  }

  .topbar-left,
  .topbar-right {
    flex-direction: column;
    align-items: stretch;
  }

  .brand {
    margin-right: 0;
    padding-right: 0;
    border-right: 0;
  }

  .top-nav {
    flex-wrap: wrap;
  }

  .topbar-actions {
    justify-content: flex-start;
    padding-left: 0;
    border-left: 0;
  }

  .search-box input {
    width: 100%;
  }

  .sidebar {
    width: 100%;
  }
}
</style>
