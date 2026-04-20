<script setup>
import { computed, h, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const brandColor = '#004D3C'
const brandColorLight = '#E6F2F0'

const activeTopMenu = computed(() => '제품 관리')
const activeSideMenu = ref('카테고리 관리')
const selectedProduct = ref(null)
const selectedCategory = ref(null)

const topMenus = ['대시보드', '재고 관리', '발주 관리', '제품 관리', '인프라 관리', '정산/통계']
const routeMap = {
  대시보드: '/hq/dashboard',
  '재고 관리': '/hq/inventory',
  '발주 관리': '/hq/orders',
  '제품 관리': '/hq/products',
  '인프라 관리': '/hq/infrastructure',
  '정산/통계': '/hq/analytics',
}

const productSideMenus = [
  { label: '카테고리 관리', icon: 'tags', id: 'SO-006' },
  { label: '제품 마스터', icon: 'package', id: 'SO-011' },
  { label: '단가/계약 관리', icon: 'badge', id: 'SO-018' },
  { label: '거래처 정보 관리', icon: 'briefcase', id: 'SO-026' },
]

const productMasterData = [
  { id: 'PD-E001', name: '고속 충전기 (C타입) 25W', spec: '25W / White', cat: '전자제품', unit: 'EA', price: 15000, leadTime: '3일', vendor: '(주)전자에셋', status: '활성', regDate: '2024.01.12' },
  { id: 'PD-E002', name: '무소음 무선 마우스 (블랙)', spec: 'Bluetooth 5.0', cat: '전자제품', unit: 'EA', price: 28000, leadTime: '5일', vendor: '로지잡화', status: '활성', regDate: '2024.01.15' },
  { id: 'PD-S001', name: 'A4 복사용지 80g (500매)', cat: '문구/사무', spec: '80g / White', unit: 'Box', price: 24500, leadTime: '2일', vendor: '(주)한지제지', status: '활성', regDate: '2023.12.20' },
  { id: 'PD-H001', name: '휴대용 가글 (중) 250ml', cat: '위생용품', spec: '250ml / 민트', unit: 'EA', price: 3500, leadTime: '7일', vendor: '클린헬스', status: '비활성', regDate: '2024.02.05' },
  { id: 'PD-K001', name: '유리제 머그컵 350ml', cat: '주방잡화', spec: 'Heat-resistant', unit: 'EA', price: 8900, leadTime: '10일', vendor: '키친웨어', status: '활성', regDate: '2024.03.11' },
  { id: 'PD-S002', name: '리무버블 데코 스티커 세트', cat: '문구/사무', spec: '10 Sheets', unit: 'Set', price: 4200, leadTime: '3일', vendor: '디자인웍스', status: '활성', regDate: '2024.03.15' },
  { id: 'PD-S003', name: '스테이플러 심 (10호)', cat: '문구/사무', spec: '1000pcs', unit: 'Small Box', price: 800, leadTime: '2일', vendor: '(주)한지제지', status: '활성', regDate: '2024.01.10' },
  { id: 'PD-E003', name: '기계식 키보드 (청축)', cat: '전자제품', spec: 'RGB / Wired', unit: 'EA', price: 125000, leadTime: '14일', vendor: '(주)전자에셋', status: '활성', regDate: '2024.04.01' },
  { id: 'PD-H002', name: '손세정제 리필 500ml', cat: '위생용품', spec: '500ml / 레몬', unit: 'EA', price: 5400, leadTime: '3일', vendor: '클린헬스', status: '활성', regDate: '2024.02.10' },
  { id: 'PD-K002', name: '니트릴 고무장갑 (M)', cat: '주방잡화', spec: 'Blue / 100pcs', unit: 'Box', price: 12000, leadTime: '4일', vendor: '키친웨어', status: '점검중', regDate: '2024.02.15' },
  { id: 'PD-S004', name: '수정테이프 5mm x 10m', cat: '문구/사무', spec: '5mm x 10m', unit: 'EA', price: 1200, leadTime: '2일', vendor: '로지잡화', status: '활성', regDate: '2024.01.12' },
  { id: 'PD-E004', name: '절전형 5구 멀티탭 3m', cat: '전자제품', spec: '3m / Safety Cap', unit: 'EA', price: 18500, leadTime: '5일', vendor: '(주)전자에셋', status: '활성', regDate: '2023.11.30' },
]

const categoryData = [
  { id: 'CAT-100', name: '전자제품', productCount: 420, order: 1, status: '사용중', lastUpdated: '2024.04.01' },
  { id: 'CAT-200', name: '문구/사무', productCount: 850, order: 2, status: '사용중', lastUpdated: '2024.04.01' },
  { id: 'CAT-300', name: '위생용품', productCount: 120, order: 3, status: '사용중', lastUpdated: '2024.04.02' },
  { id: 'CAT-400', name: '주방잡화', productCount: 210, order: 4, status: '사용중', lastUpdated: '2024.04.01' },
  { id: 'CAT-500', name: '생활가전', productCount: 95, order: 5, status: '사용중', lastUpdated: '2024.04.10' },
  { id: 'CAT-600', name: '인테리어/가구', productCount: 64, order: 6, status: '점검중', lastUpdated: '2024.04.12' },
  { id: 'CAT-700', name: '취미/레저', productCount: 30, order: 7, status: '미사용', lastUpdated: '2024.04.15' },
  { id: 'CAT-800', name: '공구/산업', productCount: 15, order: 8, status: '사용중', lastUpdated: '2024.04.18' },
]

const handleTopMenuClick = (menu) => {
  const target = routeMap[menu]
  if (target) {
    router.push(target)
  }
}

const closeDetail = () => {
  selectedProduct.value = null
}

const closeCategoryDetail = () => {
  selectedCategory.value = null
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
const SearchIcon = IconBase([
  { tag: 'circle', attrs: { cx: '11', cy: '11', r: '7' } },
  { tag: 'path', attrs: { d: 'm20 20-3.5-3.5' } },
])
const TagsIcon = IconBase([
  { tag: 'path', attrs: { d: 'm20 13-7 7-9-9V4h7Z' } },
  { tag: 'path', attrs: { d: 'M7 7h.01' } },
])
const FolderTreeIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 6h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z' } },
  { tag: 'path', attrs: { d: 'M7 12h10' } },
  { tag: 'path', attrs: { d: 'M7 16h6' } },
])
const ListTreeIcon = IconBase([
  { tag: 'path', attrs: { d: 'M8 6h13' } },
  { tag: 'path', attrs: { d: 'M8 12h13' } },
  { tag: 'path', attrs: { d: 'M8 18h13' } },
  { tag: 'path', attrs: { d: 'M3 6h.01' } },
  { tag: 'path', attrs: { d: 'M3 12h.01' } },
  { tag: 'path', attrs: { d: 'M3 18h.01' } },
])
const PackageIcon = IconBase([
  { tag: 'path', attrs: { d: 'm7.5 4.27 9 5.15' } },
  { tag: 'path', attrs: { d: 'M21 8.5 12 13 3 8.5' } },
  { tag: 'path', attrs: { d: 'M3 8.5V16l9 5 9-5V8.5' } },
  { tag: 'path', attrs: { d: 'M12 13v8' } },
  { tag: 'path', attrs: { d: 'M3.27 7 12 2l8.73 5' } },
])
const FileBadgeIcon = IconBase([
  { tag: 'path', attrs: { d: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z' } },
  { tag: 'path', attrs: { d: 'M14 3v5h5' } },
  { tag: 'circle', attrs: { cx: '10', cy: '14', r: '2.5' } },
  { tag: 'path', attrs: { d: 'm10 16.5-1 2 1-1 1 1-1-2' } },
])
const BriefcaseIcon = IconBase([
  { tag: 'path', attrs: { d: 'M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' } },
  { tag: 'path', attrs: { d: 'M3 9h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z' } },
  { tag: 'path', attrs: { d: 'M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2' } },
])
const InfoIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 10v6' } },
  { tag: 'path', attrs: { d: 'M12 7h.01' } },
])
const FilterIcon = IconBase([
  { tag: 'path', attrs: { d: 'M4 5h16' } },
  { tag: 'path', attrs: { d: 'M7 12h10' } },
  { tag: 'path', attrs: { d: 'M10 19h4' } },
])
const SettingsIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '3' } },
  { tag: 'path', attrs: { d: 'M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 1-3 0 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06A2 2 0 1 1 5.24 17l.06-.06A1.7 1.7 0 0 0 5.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 1 0-3 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87L5.2 8.07A2 2 0 1 1 8.03 5.24l.06.06A1.7 1.7 0 0 0 10 5.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 1 3 0 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06A2 2 0 1 1 19.76 8l-.06.06A1.7 1.7 0 0 0 19.4 10c0 .37.21.73.6 1a1.7 1.7 0 0 1 0 3 1.7 1.7 0 0 0-.6 1Z' } },
])
const DownloadIcon = IconBase([
  { tag: 'path', attrs: { d: 'M12 3v12' } },
  { tag: 'path', attrs: { d: 'm7 10 5 5 5-5' } },
  { tag: 'path', attrs: { d: 'M5 21h14' } },
])
const PlusCircleIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 8v8' } },
  { tag: 'path', attrs: { d: 'M8 12h8' } },
])
const ChevronLeftIcon = IconBase([{ tag: 'path', attrs: { d: 'm15 18-6-6 6-6' } }])
const ChevronRightIcon = IconBase([{ tag: 'path', attrs: { d: 'm9 18 6-6-6-6' } }])
const XIcon = IconBase([
  { tag: 'path', attrs: { d: 'M18 6 6 18' } },
  { tag: 'path', attrs: { d: 'm6 6 12 12' } },
])
const Edit3Icon = IconBase([
  { tag: 'path', attrs: { d: 'M12 20h9' } },
  { tag: 'path', attrs: { d: 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z' } },
])
const Trash2Icon = IconBase([
  { tag: 'path', attrs: { d: 'M3 6h18' } },
  { tag: 'path', attrs: { d: 'M8 6V4h8v2' } },
  { tag: 'path', attrs: { d: 'M19 6l-1 14H6L5 6' } },
  { tag: 'path', attrs: { d: 'M10 11v6' } },
  { tag: 'path', attrs: { d: 'M14 11v6' } },
])

const iconMap = {
  tags: TagsIcon,
  package: PackageIcon,
  badge: FileBadgeIcon,
  briefcase: BriefcaseIcon,
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="productSideMenus"
    v-model:active-side-menu="activeSideMenu"
    show-system-card
    @logout="handleLogout"
  >
    <div class="products-content">
        <section class="panel action-bar">
          <div class="action-left">
            <label class="search-box wide-search">
              <SearchIcon :size="14" class="search-icon" />
              <input
                type="text"
                :placeholder="
                  activeSideMenu === '카테고리 관리'
                    ? '카테고리 명 또는 코드 검색...'
                    : '제품명, 제품 코드, 거래처명 검색...'
                "
              />
            </label>

            <div v-if="activeSideMenu !== '카테고리 관리'" class="category-filter">
              <span>카테고리</span>
              <select>
                <option>전체 카테고리</option>
                <option>전자제품</option>
                <option>문구/사무</option>
                <option>위생용품</option>
                <option>주방잡화</option>
              </select>
            </div>
          </div>

          <div class="action-right">
            <button v-if="activeSideMenu !== '카테고리 관리'" type="button" class="ghost-button">
              <DownloadIcon :size="14" />
              일괄 업로드 (CSV)
            </button>
            <button type="button" class="primary-button">
              <PlusCircleIcon :size="14" />
              {{ activeSideMenu === '카테고리 관리' ? '카테고리 추가 (SO-006)' : '신규 제품 등록 (SO-011)' }}
            </button>
          </div>
        </section>

        <section class="products-split">
          <template v-if="activeSideMenu === '카테고리 관리'">
            <div class="panel master-panel">
              <div class="master-head">
                <div class="master-head-left">
                  <h3 class="with-icon">
                    <ListTreeIcon :size="14" />
                    전사 카테고리 마스터 (SO-010)
                  </h3>
                  <span>총 {{ categoryData.length }}개 분류</span>
                </div>
              </div>

              <div class="table-wrap">
                <table class="product-table">
                  <thead>
                    <tr>
                      <th class="w-code center">분류 코드</th>
                      <th>카테고리 명</th>
                      <th class="w-price align-right">연결 제품수</th>
                      <th class="w-status center">노출 순서</th>
                      <th class="w-status center">상태</th>
                      <th class="w-date center">최종 수정일</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="cat in categoryData"
                      :key="cat.id"
                      :class="{ selected: selectedCategory?.id === cat.id }"
                      @click="selectedCategory = cat"
                    >
                      <td class="center muted strong-small">{{ cat.id }}</td>
                      <td class="strong">
                        <span class="table-inline">
                          <FolderTreeIcon :size="12" class="table-inline-icon" />
                          {{ cat.name }}
                        </span>
                      </td>
                      <td class="align-right strong">{{ cat.productCount.toLocaleString() }}</td>
                      <td class="center muted strong-small">{{ cat.order }}</td>
                      <td class="center">
                        <span class="status-badge" :class="cat.status">{{ cat.status }}</span>
                      </td>
                      <td class="center muted strong-small">{{ cat.lastUpdated }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <aside v-if="selectedCategory" class="panel detail-panel category-detail-panel">
              <div class="detail-head">
                <h3>
                  <InfoIcon :size="14" />
                  분류 정보 상세 (SO-009)
                </h3>
                <button type="button" class="detail-close" @click="closeCategoryDetail">
                  <XIcon :size="16" />
                </button>
              </div>

              <div class="detail-body">
                <section class="detail-intro">
                  <p class="caption">마스터 코드: {{ selectedCategory.id }}</p>
                  <h4>{{ selectedCategory.name }}</h4>
                  <p class="sub-caption">시스템 계층: 대분류 (단일 체계)</p>
                </section>

                <section class="detail-section">
                  <p class="section-title">속성 정의</p>
                  <div class="form-stack">
                    <div>
                      <label class="label block">카테고리 명칭</label>
                      <input type="text" :value="selectedCategory.name" class="detail-input" />
                    </div>
                    <div class="spec-grid">
                      <div>
                        <label class="label block">정렬 가중치</label>
                        <input type="number" :value="selectedCategory.order" class="detail-input" />
                      </div>
                      <div>
                        <label class="label block">운영 상태</label>
                        <select class="detail-input">
                          <option :selected="selectedCategory.status === '사용중'">사용중</option>
                          <option :selected="selectedCategory.status === '점검중'">점검중</option>
                          <option :selected="selectedCategory.status === '미사용'">미사용</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                <section class="detail-section">
                  <p class="section-title">데이터 현황</p>
                  <div class="metric-card">
                    <span>연결 제품 마스터</span>
                    <strong>{{ selectedCategory.productCount }} SKU</strong>
                  </div>
                </section>
              </div>

              <div class="detail-actions single-column">
                <button type="button" class="dark-button">
                  <Edit3Icon :size="14" />
                  분류 정보 수정 (SO-007)
                </button>
                <button type="button" class="danger-button">
                  <Trash2Icon :size="14" />
                  카테고리 삭제 (SO-008)
                </button>
              </div>
            </aside>
          </template>

          <template v-else>
          <div class="panel master-panel">
            <div class="master-head">
              <div class="master-head-left">
                <h3>제품 마스터 목록 (SO-017)</h3>
                <span>총 {{ productMasterData.length }}개 품목 마스터</span>
              </div>
              <div class="master-head-actions">
                <button type="button"><FilterIcon :size="14" /></button>
                <button type="button"><SettingsIcon :size="14" /></button>
              </div>
            </div>

            <div class="table-wrap">
              <table class="product-table">
                <thead>
                  <tr>
                    <th class="w-code center">제품 코드</th>
                    <th>제품명</th>
                    <th class="w-category">카테고리</th>
                    <th class="w-spec">규격/단위</th>
                    <th class="w-price align-right">표준 단가</th>
                    <th class="w-vendor">메인 거래처</th>
                    <th class="w-status center">상태</th>
                    <th class="w-date center">등록일</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="prod in productMasterData"
                    :key="prod.id"
                    :class="{ selected: selectedProduct?.id === prod.id }"
                    @click="selectedProduct = prod"
                  >
                    <td class="center muted strong-small">{{ prod.id }}</td>
                    <td class="strong truncate">{{ prod.name }}</td>
                    <td>{{ prod.cat }}</td>
                    <td class="semi-strong truncate uppercase">{{ prod.spec }} ({{ prod.unit }})</td>
                    <td class="align-right strong">₩{{ prod.price.toLocaleString() }}</td>
                    <td class="truncate">{{ prod.vendor }}</td>
                    <td class="center">
                      <span class="status-badge" :class="prod.status">{{ prod.status }}</span>
                    </td>
                    <td class="center muted strong-small">{{ prod.regDate }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="table-footer">
              <span>Product Master View (Page 1 of 1)</span>
              <div class="pagination">
                <button type="button"><ChevronLeftIcon :size="14" /></button>
                <button type="button" class="active">1</button>
                <button type="button"><ChevronRightIcon :size="14" /></button>
              </div>
            </div>
          </div>

          <aside v-if="selectedProduct" class="panel detail-panel">
            <div class="detail-head">
              <h3>
                <InfoIcon :size="14" />
                제품 마스터 상세 (SO-014)
              </h3>
              <button type="button" class="detail-close" @click="closeDetail">
                <XIcon :size="16" />
              </button>
            </div>

            <div class="detail-body">
              <section class="detail-intro">
                <p class="caption">마스터 ID: {{ selectedProduct.id }}</p>
                <h4>{{ selectedProduct.name }}</h4>
                <div class="detail-tags">
                  <span>{{ selectedProduct.cat }}</span>
                  <span :class="selectedProduct.status">{{ selectedProduct.status }}</span>
                </div>
              </section>

              <section class="detail-section">
                <p class="section-title">기본 규격 정보</p>
                <div class="spec-grid">
                  <div>
                    <p class="label">단위</p>
                    <p class="value">{{ selectedProduct.unit }}</p>
                  </div>
                  <div>
                    <p class="label">표준 단가</p>
                    <p class="value">₩{{ selectedProduct.price.toLocaleString() }}</p>
                  </div>
                  <div>
                    <p class="label">규격 상세</p>
                    <p class="value">{{ selectedProduct.spec }}</p>
                  </div>
                  <div>
                    <p class="label">표준 리드타임</p>
                    <p class="value">{{ selectedProduct.leadTime }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <p class="section-title">계약 및 단가 현황 (SO-018)</p>
                <div class="contract-card">
                  <div class="contract-row top">
                    <span class="contract-name">{{ selectedProduct.vendor }}</span>
                    <span class="contract-badge">메인 계약처</span>
                  </div>
                  <div class="contract-row">
                    <span>계약 단가</span>
                    <strong>₩{{ Math.round(selectedProduct.price * 0.95).toLocaleString() }}</strong>
                  </div>
                  <div class="contract-row">
                    <span>최근 계약 갱신일</span>
                    <strong class="subtle">2024.03.01</strong>
                  </div>
                </div>
                <button type="button" class="outline-link">계약 이력 전체 보기 (SO-021)</button>
              </section>

              <section class="audit-box">
                <div class="audit-row">
                  <span>마지막 수정</span>
                  <span>시스템 관리자 (2024.04.16 10:20)</span>
                </div>
              </section>
            </div>

            <div class="detail-actions">
              <button type="button" class="dark-button">
                <Edit3Icon :size="14" />
                제품 수정
              </button>
              <button type="button" class="danger-button">
                <Trash2Icon :size="14" />
                마스터 삭제
              </button>
            </div>
          </aside>
          </template>
        </section>
    </div>
  </AppLayout>
</template>

<style scoped>
:global(body) {
  background: #f3f4f6;
}

.erp-page {
  min-height: 100vh;
  background: #f3f4f6;
  color: #111827;
  font-family: inherit;
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
.side-nav-main,
.sidebar-footer-line,
.action-left,
.action-right,
.master-head,
.master-head-left,
.master-head-actions,
.detail-head,
.detail-tags,
.contract-row,
.pagination {
  display: flex;
  align-items: center;
}

.topbar-left,
.topbar-right,
.topbar-actions {
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
  background: #fff;
  color: #111827;
}

.brand-name {
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.04em;
  text-transform: uppercase;
}

.brand-name.inverse {
  color: #fff;
}

.top-nav {
  gap: 0;
  height: 100%;
}

.top-nav-button,
.icon-button,
.user-card,
.side-nav-button,
.ghost-button,
.primary-button,
.master-head-actions button,
.pagination button,
.detail-close,
.outline-link,
.dark-button,
.danger-button {
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.top-nav-button {
  height: 48px;
  padding: 0 14px;
  border-bottom: 2px solid transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 10.5px;
  font-weight: 700;
}

.top-nav-button:hover,
.icon-button:hover,
.user-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.top-nav-button.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border-bottom-color: #fff;
}

.topbar-actions {
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
  justify-content: space-between;
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

.side-nav-button:hover {
  background: #f9fafb;
}

.side-nav-main {
  gap: 10px;
}

.side-nav-id {
  font-size: 9px;
  font-weight: 700;
  opacity: 0.4;
}

.sidebar-footer {
  margin-top: auto;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.sidebar-footer-line {
  gap: 8px;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
}

.content {
  flex: 1;
  padding: 16px;
}

.products-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.panel {
  border: 1px solid #d1d5db;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  flex-shrink: 0;
}

.action-left,
.action-right {
  gap: 12px;
}

.search-box {
  position: relative;
  display: block;
}

.wide-search input {
  width: 320px;
  padding: 7px 12px 7px 32px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  outline: none;
  font: inherit;
  font-size: 11px;
}

.wide-search input:focus,
.category-filter select:focus {
  border-color: #004d3c;
  background: #fff;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  color: #9ca3af;
}

.category-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-filter span {
  color: #9ca3af;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.category-filter select {
  border: 1px solid #d1d5db;
  background: #f9fafb;
  padding: 6px 8px;
  outline: none;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
}

.ghost-button,
.primary-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 900;
}

.ghost-button {
  border: 1px solid #d1d5db;
  color: #374151;
}

.ghost-button:hover {
  background: #f9fafb;
}

.primary-button {
  background: #004d3c;
  color: #fff;
}

.products-split {
  display: flex;
  flex: 1;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

.master-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.master-head {
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: rgba(249, 250, 251, 0.5);
}

.master-head-left {
  gap: 10px;
}

.master-head-left h3 {
  color: #374151;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.master-head-left h3.with-icon {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.master-head-left span {
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
}

.master-head-actions {
  gap: 8px;
}

.master-head-actions button {
  padding: 4px;
  color: #9ca3af;
}

.master-head-actions button:hover {
  color: #374151;
}

.table-wrap {
  flex: 1;
  overflow: auto;
}

.product-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.product-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
}

.product-table thead tr {
  border-bottom: 1px solid #d1d5db;
  background: #f3f4f6;
}

.product-table th,
.product-table td {
  padding: 8px 12px;
  border-right: 1px solid #f3f4f6;
  text-align: left;
  white-space: nowrap;
}

.product-table th:last-child,
.product-table td:last-child {
  border-right: 0;
}

.product-table th {
  color: #6b7280;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

.product-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
}

.product-table tbody tr:hover {
  background: rgba(239, 246, 255, 0.7);
}

.product-table tbody tr.selected {
  background: #e6f2f0;
}

.product-table td {
  color: #6b7280;
  font-size: 11px;
}

.w-code {
  width: 96px;
}

.w-category {
  width: 96px;
}

.w-spec {
  width: 112px;
}

.w-price {
  width: 96px;
}

.w-vendor {
  width: 112px;
}

.w-status {
  width: 80px;
}

.w-date {
  width: 96px;
}

.center {
  text-align: center !important;
}

.align-right {
  text-align: right !important;
}

.strong {
  color: #111827 !important;
  font-size: 12px !important;
  font-weight: 900;
}

.semi-strong {
  color: #4b5563 !important;
  font-weight: 700;
}

.muted {
  color: #9ca3af !important;
}

.strong-small {
  font-weight: 700;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-inline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.table-inline-icon {
  color: #9ca3af;
}

.uppercase {
  text-transform: uppercase;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border: 1px solid #d1d5db;
  font-size: 10px;
  font-weight: 900;
}

.status-badge.활성 {
  border-color: #a7f3d0;
  background: #ecfdf5;
  color: #047857;
}

.status-badge.비활성 {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.status-badge.점검중 {
  border-color: #fcd34d;
  background: #fffbeb;
  color: #b45309;
}

.status-badge.사용중 {
  border-color: #a7f3d0;
  background: #ecfdf5;
  color: #047857;
}

.status-badge.미사용 {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-top: 1px solid #d1d5db;
  background: #f9fafb;
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
}

.pagination {
  gap: 4px;
}

.pagination button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  border: 1px solid #d1d5db;
  color: #4b5563;
  font-size: 11px;
  font-weight: 700;
}

.pagination button:hover {
  background: #f9fafb;
}

.pagination button.active {
  border-color: #1f2937;
  background: #1f2937;
  color: #fff;
}

.detail-panel {
  display: flex;
  flex-direction: column;
  width: 380px;
  flex-shrink: 0;
  overflow: hidden;
}

.detail-head {
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #004d3c;
  color: #fff;
}

.detail-head h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-close {
  padding: 2px;
  color: #fff;
}

.detail-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  padding: 16px;
}

.detail-intro {
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.detail-intro h4 {
  margin: 6px 0 10px;
  color: #111827;
  font-size: 15px;
  font-weight: 900;
  line-height: 1.35;
}

.caption,
.section-title,
.label {
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.sub-caption {
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.label.block {
  display: block;
  margin-bottom: 4px;
}

.detail-tags {
  gap: 8px;
  flex-wrap: wrap;
}

.detail-tags span {
  padding: 2px 6px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 10px;
  font-weight: 700;
}

.detail-tags span.활성 {
  border-color: #a7f3d0;
  background: #ecfdf5;
  color: #047857;
}

.detail-tags span.비활성 {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.detail-tags span.점검중 {
  border-color: #fcd34d;
  background: #fffbeb;
  color: #b45309;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  padding-bottom: 4px;
  border-bottom: 1px solid #f3f4f6;
}

.spec-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 20px;
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  outline: none;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
}

.detail-input:focus {
  border-color: #004d3c;
  background: #fff;
}

.value {
  color: #1f2937;
  font-size: 12px;
  font-weight: 900;
}

.contract-card {
  padding: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.contract-row {
  justify-content: space-between;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
}

.contract-row + .contract-row {
  margin-top: 8px;
}

.contract-row.top {
  margin-bottom: 10px;
}

.contract-name {
  color: #374151;
  font-size: 11px;
  font-weight: 900;
}

.contract-badge {
  padding: 2px 6px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #6b7280;
  font-size: 10px;
  font-weight: 700;
}

.contract-row strong {
  color: #111827;
  font-weight: 900;
}

.contract-row strong.subtle {
  color: #4b5563;
}

.outline-link {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #004d3c;
  color: #004d3c;
  font-size: 10px;
  font-weight: 700;
}

.outline-link:hover {
  background: #ecfdf5;
}

.audit-box {
  padding: 12px;
  background: #f3f4f6;
}

.metric-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.metric-card strong {
  color: #004d3c;
  font-size: 13px;
  font-weight: 900;
}

.audit-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #9ca3af;
  font-size: 9px;
  font-weight: 700;
}

.detail-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 12px 16px 16px;
  background: #fff;
}

.detail-actions.single-column {
  grid-template-columns: 1fr;
}

.dark-button,
.danger-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.dark-button {
  background: #1f2937;
  color: #fff;
}

.dark-button:hover {
  background: #374151;
}

.danger-button {
  border: 1px solid #fecaca;
  color: #dc2626;
}

.danger-button:hover {
  background: #fef2f2;
}

@media (max-width: 1180px) {
  .products-split {
    flex-direction: column;
  }

  .detail-panel {
    width: 100%;
  }
}

@media (max-width: 980px) {
  .topbar,
  .layout-shell,
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .topbar {
    position: static;
    padding: 12px 16px;
  }

  .topbar-left,
  .topbar-right,
  .action-left,
  .action-right {
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
    padding-left: 0;
    border-left: 0;
  }

  .sidebar {
    width: 100%;
  }

  .wide-search input {
    width: 100%;
  }
}
</style>
