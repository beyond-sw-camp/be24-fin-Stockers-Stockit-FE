<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  BarChart3,
  ShoppingBag,
  TrendingUp,
  Award,
  Filter,
  PieChart,
  Package,
  Tag,
  Search,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import LineChart from '@/components/common/charts/LineChart.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import DoughnutChart from '@/components/common/charts/DoughnutChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const sideMenus = roleMenus.hq.find((menu) => menu.label === '정산/통계')?.children ?? []

const activeTopMenu = computed(() => '정산/통계')
const activeSideMenu = ref('판매량 통계')

function handleLogout() {
  auth.logout()
  router.push('/login')
}

// ─── 탭 (URL 쿼리스트링과 동기화) ──────────────────────────────────────
const tabs = [
  { key: 'product', label: '품목별', icon: Package },
  { key: 'productDetail', label: '상품별', icon: Tag },
]

const activeTab = ref(route.query.tab && tabs.some((t) => t.key === route.query.tab) ? route.query.tab : 'product')

const setTab = (key) => {
  activeTab.value = key
  router.replace({ query: { ...route.query, tab: key } })
}

watch(() => route.query.tab, (tab) => {
  if (tab && tabs.some((t) => t.key === tab)) activeTab.value = tab
})

// ─── 공통 필터 바 ──────────────────────────────────────────────────────
const periodUnit = ref('월간')
const storeFilter = ref('전사 통합')
const categoryFilter = ref('전체')
const dateRange = ref('2026-04')

const periodOptions = ['일간', '주간', '월간', '분기', '연간']
const storeOptions = ['전사 통합', '강남 서초점', '부산 센텀점', '인천 송도점', '대전 둔산점', '대구 중앙점']
const categoryOptions = ['전체', '상의', '바지', '아우터', '치마']

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
)

// ─── KPI (모든 탭 공유) ────────────────────────────────────────────────
const kpiSummary = computed(() => [
  { label: '총 매출', value: '482.5', unit: 'M원', trend: '+12.4%', icon: TrendingUp, color: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600' },
  { label: '판매 수량', value: '21,650', unit: '개', trend: '+8.2%', icon: ShoppingBag, color: 'text-blue-700', iconBg: 'bg-blue-50', iconCls: 'text-blue-600' },
  { label: '평균 객단가', value: '22,290', unit: '원', trend: '+3.8%', icon: Award, color: 'text-violet-700', iconBg: 'bg-violet-50', iconCls: 'text-violet-600' },
  { label: '베스트 카테고리', value: '아우터', unit: '', trend: '비중 38%', icon: BarChart3, color: 'text-amber-700', iconBg: 'bg-amber-50', iconCls: 'text-amber-600' },
])

// ─── 개요 탭: 일자별 추이 ─────────────────────────────────────────────
const overviewTrendData = computed(() => ({
  labels: ['04/14', '04/16', '04/18', '04/20', '04/22', '04/24', '04/26', '04/28'],
  datasets: [
    {
      label: '매출 (M원)',
      data: [42, 48, 51, 55, 58, 62, 64, 68],
      borderColor: '#059669',
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      borderWidth: 2,
      pointRadius: 3,
      tension: 0.35,
      fill: true,
    },
    {
      label: '전월 동기',
      data: [38, 42, 45, 48, 50, 52, 54, 55],
      borderColor: '#94a3b8',
      backgroundColor: 'rgba(148, 163, 184, 0.05)',
      borderWidth: 2,
      borderDash: [5, 5],
      pointRadius: 2,
      tension: 0.35,
      fill: false,
    },
  ],
}))

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, labels: { font: { size: 11 }, usePointStyle: true } },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#6ee7b7',
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 6,
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v) => v + 'M' } },
  },
  interaction: { mode: 'index', intersect: false },
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` },
    },
  },
  cutout: '60%',
}

// ─── 품목별 탭: 의류 카테고리 → 세부 품목 ─────────────────────────────
const products = [
  // 상의
  { category: '상의', name: '반팔', units: 3200, sales: 48 },
  { category: '상의', name: '긴팔', units: 2800, sales: 42 },
  { category: '상의', name: '셔츠', units: 1900, sales: 38 },
  { category: '상의', name: '니트', units: 1500, sales: 36 },
  { category: '상의', name: '후드티', units: 2400, sales: 32 },
  // 바지
  { category: '바지', name: '청바지', units: 2600, sales: 52 },
  { category: '바지', name: '반바지', units: 1800, sales: 24 },
  { category: '바지', name: '긴바지', units: 2200, sales: 38 },
  { category: '바지', name: '츄리닝', units: 1400, sales: 22 },
  // 치마
  { category: '치마', name: '미니스커트', units: 980, sales: 18 },
  { category: '치마', name: '롱스커트', units: 720, sales: 16 },
  // 아우터
  { category: '아우터', name: '패딩', units: 850, sales: 68 },
  { category: '아우터', name: '후드집업', units: 1600, sales: 38 },
  { category: '아우터', name: '자켓', units: 1100, sales: 42 },
  { category: '아우터', name: '가디건', units: 900, sales: 28 },
]

const PRODUCT_CATEGORY_COLORS = {
  '상의': '#0ea5e9',
  '바지': '#f59e0b',
  '치마': '#a855f7',
  '아우터': '#059669',
}

const productStats = computed(() => {
  const filtered = categoryFilter.value === '전체'
    ? products
    : products.filter((p) => p.category === categoryFilter.value)
  const sorted = [...filtered].sort((a, b) => b.sales - a.sales)
  const total = sorted.reduce((s, x) => s + x.sales, 0) || 1
  return sorted.map((item) => ({
    ...item,
    sharePct: parseFloat(((item.sales / total) * 100).toFixed(1)),
  }))
})

const categorySummary = computed(() => {
  const cats = ['상의', '바지', '치마', '아우터']
  const grandTotal = products.reduce((s, x) => s + x.sales, 0) || 1
  return cats.map((cat) => {
    const items = products.filter((p) => p.category === cat)
    const sales = items.reduce((s, x) => s + x.sales, 0)
    const units = items.reduce((s, x) => s + x.units, 0)
    return {
      category: cat,
      productCount: items.length,
      sales,
      units,
      sharePct: parseFloat(((sales / grandTotal) * 100).toFixed(1)),
      color: PRODUCT_CATEGORY_COLORS[cat],
    }
  })
})

const categoryDoughnutData = computed(() => ({
  labels: categorySummary.value.map((c) => c.category),
  datasets: [{
    data: categorySummary.value.map((c) => c.sharePct),
    backgroundColor: categorySummary.value.map((c) => c.color),
    borderWidth: 2,
    borderColor: '#fff',
  }],
}))

const productBarData = computed(() => ({
  labels: productStats.value.slice(0, 10).map((p) => p.name),
  datasets: [{
    label: '매출 (M원)',
    data: productStats.value.slice(0, 10).map((p) => p.sales),
    backgroundColor: productStats.value.slice(0, 10).map((p) => PRODUCT_CATEGORY_COLORS[p.category]),
    borderRadius: 4,
  }],
}))

// ─── 상품별 탭: 각 품목당 10개 상품 (총 150건) ────────────────────────
const productDetails = {
  // ─── 상의 ───────────
  '반팔': [
    { name: '베이직 코튼 반팔티셔츠', units: 580, sales: 8.7 },
    { name: '슬림핏 라운드넥 반팔', units: 520, sales: 7.8 },
    { name: '오버사이즈 반팔티', units: 480, sales: 7.2 },
    { name: '그래픽 프린트 반팔', units: 410, sales: 6.2 },
    { name: '폴로 카라 반팔', units: 360, sales: 5.4 },
    { name: '헨리넥 반팔티', units: 280, sales: 4.2 },
    { name: 'V넥 베이직 반팔', units: 220, sales: 3.3 },
    { name: '스트라이프 반팔', units: 180, sales: 2.7 },
    { name: '메쉬 스포츠 반팔', units: 110, sales: 1.6 },
    { name: '오가닉 코튼 반팔', units: 60, sales: 0.9 },
  ],
  '긴팔': [
    { name: '베이직 코튼 긴팔티', units: 480, sales: 7.2 },
    { name: '슬림핏 라운드넥 긴팔', units: 420, sales: 6.3 },
    { name: '와플 텍스처 긴팔', units: 380, sales: 5.7 },
    { name: '터틀넥 긴팔', units: 340, sales: 5.1 },
    { name: '헨리넥 긴팔', units: 290, sales: 4.4 },
    { name: '오버사이즈 긴팔', units: 260, sales: 3.9 },
    { name: '폴로 긴팔', units: 220, sales: 3.3 },
    { name: '모달 소재 긴팔', units: 180, sales: 2.7 },
    { name: '발열 기능성 긴팔', units: 140, sales: 2.1 },
    { name: '프린트 긴팔', units: 90, sales: 1.4 },
  ],
  '셔츠': [
    { name: '오버핏 옥스포드 셔츠', units: 380, sales: 7.6 },
    { name: '슬림핏 화이트셔츠', units: 320, sales: 6.4 },
    { name: '데님 셔츠', units: 270, sales: 5.4 },
    { name: '체크 플란넬 셔츠', units: 230, sales: 4.6 },
    { name: '린넨 셔츠', units: 190, sales: 3.8 },
    { name: '프린트 캐주얼 셔츠', units: 160, sales: 3.2 },
    { name: '오버사이즈 셔츠', units: 130, sales: 2.6 },
    { name: '더블 포켓 셔츠', units: 100, sales: 2.0 },
    { name: '빅 카라 셔츠', units: 70, sales: 1.4 },
    { name: '크롭 셔츠', units: 50, sales: 1.0 },
  ],
  '니트': [
    { name: '라운드 케이블 니트', units: 320, sales: 7.7 },
    { name: 'V넥 캐시미어 니트', units: 240, sales: 5.8 },
    { name: '터틀넥 풀오버', units: 220, sales: 5.3 },
    { name: '오버사이즈 니트', units: 180, sales: 4.3 },
    { name: '컬러블록 니트', units: 150, sales: 3.6 },
    { name: '케이블 풀오버', units: 130, sales: 3.1 },
    { name: '라운드 베이직 니트', units: 110, sales: 2.6 },
    { name: '자카드 니트', units: 80, sales: 1.9 },
    { name: '알파카 니트', units: 50, sales: 1.2 },
    { name: '경량 메리노 니트', units: 20, sales: 0.5 },
  ],
  '후드티': [
    { name: '베이직 풀오버 후드티', units: 580, sales: 7.7 },
    { name: '오버사이즈 후드티', units: 480, sales: 6.4 },
    { name: '그래픽 빅로고 후드티', units: 380, sales: 5.1 },
    { name: '지퍼 후드 자켓', units: 290, sales: 3.9 },
    { name: '크롭 후드티', units: 220, sales: 2.9 },
    { name: '더블 포켓 후드티', units: 180, sales: 2.4 },
    { name: '컬러블록 후드티', units: 140, sales: 1.9 },
    { name: '워싱 후드티', units: 80, sales: 1.1 },
    { name: '플리스 후드티', units: 40, sales: 0.5 },
    { name: '오가닉 코튼 후드티', units: 10, sales: 0.1 },
  ],
  // ─── 바지 ───────────
  '청바지': [
    { name: '스트레이트 데님 팬츠', units: 480, sales: 9.6 },
    { name: '슬림 와이드 진', units: 420, sales: 8.4 },
    { name: '부츠컷 진', units: 360, sales: 7.2 },
    { name: '카고 진', units: 280, sales: 5.6 },
    { name: '워싱 데님', units: 240, sales: 4.8 },
    { name: '스키니 진', units: 200, sales: 4.0 },
    { name: '크롭 진', units: 180, sales: 3.6 },
    { name: '빈티지 데님', units: 160, sales: 3.2 },
    { name: '블랙 진', units: 180, sales: 3.6 },
    { name: '보이프렌드 진', units: 100, sales: 2.0 },
  ],
  '반바지': [
    { name: '데님 숏팬츠', units: 320, sales: 4.3 },
    { name: '카고 숏팬츠', units: 280, sales: 3.7 },
    { name: '스웻 숏팬츠', units: 220, sales: 2.9 },
    { name: '린넨 숏팬츠', units: 200, sales: 2.7 },
    { name: '치노 숏팬츠', units: 180, sales: 2.4 },
    { name: '스트라이프 숏팬츠', units: 150, sales: 2.0 },
    { name: '베이직 코튼 반바지', units: 140, sales: 1.9 },
    { name: '트레이닝 반바지', units: 130, sales: 1.7 },
    { name: '멀티 포켓 반바지', units: 110, sales: 1.5 },
    { name: '슬림핏 반바지', units: 70, sales: 0.9 },
  ],
  '긴바지': [
    { name: '와이드 슬랙스', units: 380, sales: 6.6 },
    { name: '스트레이트 슬랙스', units: 340, sales: 5.9 },
    { name: '테이퍼드 팬츠', units: 290, sales: 5.0 },
    { name: '카고 팬츠', units: 240, sales: 4.1 },
    { name: '트랙 팬츠', units: 200, sales: 3.5 },
    { name: '일자 팬츠', units: 180, sales: 3.1 },
    { name: '부츠컷 슬랙스', units: 160, sales: 2.8 },
    { name: '핀턱 슬랙스', units: 130, sales: 2.2 },
    { name: '조거 팬츠', units: 180, sales: 3.1 },
    { name: '린넨 팬츠', units: 100, sales: 1.7 },
  ],
  '츄리닝': [
    { name: '베이직 트레이닝팬츠', units: 280, sales: 4.4 },
    { name: '와이드 트레이닝', units: 220, sales: 3.5 },
    { name: '조거 츄리닝', units: 200, sales: 3.1 },
    { name: '컬러블록 츄리닝', units: 160, sales: 2.5 },
    { name: '사이드라인 츄리닝', units: 140, sales: 2.2 },
    { name: '플리스 츄리닝', units: 120, sales: 1.9 },
    { name: '빅로고 츄리닝', units: 100, sales: 1.6 },
    { name: '크롭 츄리닝', units: 80, sales: 1.3 },
    { name: '카고 츄리닝', units: 60, sales: 0.9 },
    { name: '슬림 츄리닝', units: 40, sales: 0.6 },
  ],
  // ─── 치마 ───────────
  '미니스커트': [
    { name: '데님 미니스커트', units: 200, sales: 3.7 },
    { name: '플리츠 미니스커트', units: 160, sales: 2.9 },
    { name: 'A라인 미니스커트', units: 140, sales: 2.6 },
    { name: '체크 미니스커트', units: 110, sales: 2.0 },
    { name: '박스 미니스커트', units: 90, sales: 1.7 },
    { name: '랩 미니스커트', units: 80, sales: 1.5 },
    { name: '카고 미니스커트', units: 70, sales: 1.3 },
    { name: '사틴 미니스커트', units: 50, sales: 0.9 },
    { name: '스트라이프 미니스커트', units: 50, sales: 0.9 },
    { name: '컬러블록 미니스커트', units: 30, sales: 0.5 },
  ],
  '롱스커트': [
    { name: '플리츠 롱스커트', units: 160, sales: 3.6 },
    { name: 'A라인 롱스커트', units: 130, sales: 2.9 },
    { name: '머메이드 롱스커트', units: 100, sales: 2.2 },
    { name: '데님 롱스커트', units: 80, sales: 1.8 },
    { name: '새틴 롱스커트', units: 70, sales: 1.6 },
    { name: '플로럴 롱스커트', units: 60, sales: 1.4 },
    { name: '랩 롱스커트', units: 50, sales: 1.1 },
    { name: '슬릿 롱스커트', units: 40, sales: 0.9 },
    { name: '니트 롱스커트', units: 20, sales: 0.4 },
    { name: '시폰 롱스커트', units: 10, sales: 0.1 },
  ],
  // ─── 아우터 ───────────
  '패딩': [
    { name: '노스페이스 눕시 패딩', units: 180, sales: 14.4 },
    { name: '롱 다운 패딩', units: 140, sales: 11.2 },
    { name: '숏 다운 패딩', units: 110, sales: 8.8 },
    { name: '라이트 푸퍼 점퍼', units: 90, sales: 7.2 },
    { name: '컬러블록 패딩', units: 80, sales: 6.4 },
    { name: '후드 다운 패딩', units: 75, sales: 6.0 },
    { name: '베이직 블랙 패딩', units: 65, sales: 5.2 },
    { name: '화이트 롱패딩', units: 50, sales: 4.0 },
    { name: '오버사이즈 패딩', units: 40, sales: 3.2 },
    { name: '리버시블 패딩', units: 20, sales: 1.6 },
  ],
  '후드집업': [
    { name: '베이직 후드집업', units: 320, sales: 7.6 },
    { name: '오버사이즈 후드집업', units: 270, sales: 6.4 },
    { name: '빅로고 후드집업', units: 220, sales: 5.2 },
    { name: '컬러블록 후드집업', units: 180, sales: 4.3 },
    { name: '플리스 후드집업', units: 160, sales: 3.8 },
    { name: '하프집 후디', units: 140, sales: 3.3 },
    { name: '크롭 후드집업', units: 110, sales: 2.6 },
    { name: '그래픽 후드집업', units: 90, sales: 2.1 },
    { name: '베이직 그레이 후드집업', units: 70, sales: 1.7 },
    { name: '워싱 후드집업', units: 40, sales: 1.0 },
  ],
  '자켓': [
    { name: '데님 트러커 자켓', units: 220, sales: 8.4 },
    { name: '무스탕 자켓', units: 160, sales: 6.1 },
    { name: '베이직 블레이저', units: 140, sales: 5.3 },
    { name: '가죽 라이더 자켓', units: 110, sales: 4.2 },
    { name: 'MA-1 봄버 자켓', units: 100, sales: 3.8 },
    { name: '베이직 봄버', units: 90, sales: 3.4 },
    { name: '트위드 자켓', units: 80, sales: 3.0 },
    { name: '윈드브레이커', units: 70, sales: 2.7 },
    { name: '오버핏 데님 자켓', units: 80, sales: 3.0 },
    { name: '경량 자켓', units: 50, sales: 1.9 },
  ],
  '가디건': [
    { name: '베이직 V넥 가디건', units: 180, sales: 5.6 },
    { name: '케이블 가디건', units: 140, sales: 4.4 },
    { name: '라운드 가디건', units: 110, sales: 3.4 },
    { name: '오버사이즈 가디건', units: 100, sales: 3.1 },
    { name: '하프집 가디건', units: 90, sales: 2.8 },
    { name: '컬러 베이직 가디건', units: 80, sales: 2.5 },
    { name: '크롭 가디건', units: 70, sales: 2.2 },
    { name: '롱 가디건', units: 60, sales: 1.9 },
    { name: '자카드 가디건', units: 40, sales: 1.2 },
    { name: '경량 니트 가디건', units: 30, sales: 0.9 },
  ],
}

// 카테고리 → 품목 매핑 (필터 옵션용)
const PRODUCT_TYPE_MAP = {
  '상의':   ['반팔', '긴팔', '셔츠', '니트', '후드티'],
  '바지':   ['청바지', '반바지', '긴바지', '츄리닝'],
  '치마':   ['미니스커트', '롱스커트'],
  '아우터': ['패딩', '후드집업', '자켓', '가디건'],
}

// ─── 상품별 탭 필터 ────────────────────────────────────────────────────
const productTypeFilter = ref('전체')
const productKeyword = ref('')

const productTypeOptions = computed(() => {
  if (categoryFilter.value === '전체') {
    return ['전체', ...Object.keys(productDetails)]
  }
  return ['전체', ...(PRODUCT_TYPE_MAP[categoryFilter.value] ?? [])]
})

// 평탄화: 모든 상품 + 카테고리/품목 정보 포함
const flatProducts = computed(() => {
  const arr = []
  for (const [productType, items] of Object.entries(productDetails)) {
    const cat = Object.entries(PRODUCT_TYPE_MAP).find(([_, types]) => types.includes(productType))?.[0] ?? ''
    for (const item of items) {
      arr.push({ ...item, productType, category: cat })
    }
  }
  return arr
})

const filteredProductDetails = computed(() => {
  let list = flatProducts.value
  if (categoryFilter.value !== '전체') {
    list = list.filter((p) => p.category === categoryFilter.value)
  }
  if (productTypeFilter.value !== '전체') {
    list = list.filter((p) => p.productType === productTypeFilter.value)
  }
  if (productKeyword.value.trim()) {
    const kw = productKeyword.value.trim().toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(kw))
  }
  return list
})

// 품목별로 그룹핑 (테이블 표시용)
const productDetailsByType = computed(() => {
  const groups = {}
  for (const p of filteredProductDetails.value) {
    if (!groups[p.productType]) {
      groups[p.productType] = { items: [], category: p.category }
    }
    groups[p.productType].items.push(p)
  }
  return Object.entries(groups).map(([type, { items, category }]) => {
    const sortedItems = [...items].sort((a, b) => b.sales - a.sales)
    const subtotal = sortedItems.reduce((s, x) => s + x.sales, 0).toFixed(1)
    const totalUnits = sortedItems.reduce((s, x) => s + x.units, 0)
    return {
      productType: type,
      category,
      categoryColor: PRODUCT_CATEGORY_COLORS[category] ?? '#6b7280',
      items: sortedItems,
      subtotal,
      totalUnits,
    }
  })
})

// TOP 10 상품 막대 차트
const top10ProductDetails = computed(() =>
  [...filteredProductDetails.value].sort((a, b) => b.sales - a.sales).slice(0, 10),
)

const productDetailBarData = computed(() => ({
  labels: top10ProductDetails.value.map((p) => p.name),
  datasets: [{
    label: '매출 (M원)',
    data: top10ProductDetails.value.map((p) => p.sales),
    backgroundColor: top10ProductDetails.value.map((p) => PRODUCT_CATEGORY_COLORS[p.category] ?? '#6b7280'),
    borderRadius: 4,
  }],
}))

const productDetailBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => `₩${ctx.parsed.x}M` } },
  },
  scales: {
    x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v) => '₩' + v + 'M' } },
    y: { grid: { display: false }, ticks: { font: { size: 10 } } },
  },
}

// 상품별 KPI
const productDetailKpi = computed(() => {
  const list = filteredProductDetails.value
  const totalCount = list.length
  const totalSales = list.reduce((s, p) => s + p.sales, 0).toFixed(1)
  const totalUnits = list.reduce((s, p) => s + p.units, 0)
  const top = [...list].sort((a, b) => b.sales - a.sales)[0]
  return { totalCount, totalSales, totalUnits, topProduct: top }
})

// 카테고리별로 그룹핑된 품목 (테이블용)
const productsByCategory = computed(() => {
  const cats = ['상의', '바지', '치마', '아우터']
  return cats
    .filter((cat) => categoryFilter.value === '전체' || cat === categoryFilter.value)
    .map((cat) => {
      const items = products
        .filter((p) => p.category === cat)
        .sort((a, b) => b.sales - a.sales)
      const subtotal = items.reduce((s, x) => s + x.sales, 0)
      return { category: cat, color: PRODUCT_CATEGORY_COLORS[cat], items, subtotal }
    })
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: { label: (ctx) => `₩${ctx.parsed.x}M` },
    },
  },
  scales: {
    x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v) => v + 'M' } },
    y: { grid: { display: false }, ticks: { font: { size: 10 } } },
  },
}

</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    show-system-card
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <!-- ━━━━━━━ 페이지 헤더 ━━━━━━━ -->
      <section class="flex flex-wrap items-end justify-between gap-3 border border-gray-300 bg-white p-4 shadow-sm">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">SALES ANALYTICS</p>
          <h2 class="mt-1 flex items-center gap-2 text-base font-black text-gray-900">
            <BarChart3 :size="18" class="text-[#004D3C]" />
            판매량 통계
          </h2>
          <p class="mt-1 text-[11px] text-gray-500">기준일: {{ dateLabel }} · 소재별·시간·계절을 한 화면에서 비교</p>
        </div>
      </section>

      <!-- ━━━━━━━ 공통 필터 바 ━━━━━━━ -->
      <section class="flex flex-wrap items-center gap-3 border border-gray-300 bg-white p-3 shadow-sm">
        <div class="flex items-center gap-1.5 border-r border-gray-200 pr-3 text-[11px] font-bold text-gray-500">
          <Filter :size="13" />
          공통 필터
        </div>

        <label class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
          기간 단위
          <select
            v-model="periodUnit"
            class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white"
          >
            <option v-for="p in periodOptions" :key="p" :value="p">{{ p }}</option>
          </select>
        </label>

        <label class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
          매장
          <select
            v-model="storeFilter"
            class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white"
          >
            <option v-for="s in storeOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>

        <label class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
          기준 월
          <input
            v-model="dateRange"
            type="month"
            class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white"
          />
        </label>

        <div class="ml-auto flex items-center gap-2 text-[10px] font-bold text-gray-400">
          <span class="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
          모든 탭에 동일하게 적용됩니다
        </div>
      </section>

      <!-- ━━━━━━━ KPI 4개 (모든 탭 공유) ━━━━━━━ -->
      <section class="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div
          v-for="kpi in kpiSummary"
          :key="kpi.label"
          class="border border-gray-300 bg-white p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">{{ kpi.label }}</p>
            <div :class="[kpi.iconBg, 'flex h-8 w-8 items-center justify-center']">
              <component :is="kpi.icon" :size="14" :class="kpi.iconCls" />
            </div>
          </div>
          <p class="mt-2 text-xl font-black" :class="kpi.color">
            {{ kpi.value }}
            <span class="ml-1 text-xs font-bold text-gray-500">{{ kpi.unit }}</span>
          </p>
          <p class="mt-1 text-[10px] font-bold text-emerald-600">↗ {{ kpi.trend }}</p>
        </div>
      </section>

      <!-- ━━━━━━━ 탭 네비게이션 ━━━━━━━ -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center border-b border-gray-200">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="relative flex items-center gap-2 px-5 py-3 text-xs font-bold transition-colors"
            :class="activeTab === tab.key ? 'text-[#004D3C]' : 'text-gray-500 hover:bg-gray-50'"
            @click="setTab(tab.key)"
          >
            <component :is="tab.icon" :size="14" />
            {{ tab.label }}
            <span
              v-if="activeTab === tab.key"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#004D3C]"
            ></span>
          </button>
        </div>

        <!-- ━━━━━━━ 탭: 품목별 ━━━━━━━ -->
        <div v-if="activeTab === 'product'" class="p-6">
          <!-- 카테고리 요약 카드 4개 -->
          <div class="grid gap-6 grid-cols-2 lg:grid-cols-4">
            <div
              v-for="cat in categorySummary"
              :key="cat.category"
              class="border border-gray-300 bg-white p-5 shadow-sm"
            >
              <div class="flex items-center justify-between">
                <span
                  class="px-2 py-0.5 text-[10px] font-black text-white"
                  :style="{ backgroundColor: cat.color }"
                >
                  {{ cat.category }}
                </span>
                <span class="text-[10px] font-bold text-gray-400">{{ cat.productCount }}개 품목</span>
              </div>
              <p class="mt-2 text-xl font-black" :style="{ color: cat.color }">
                ₩{{ cat.sales }}<span class="ml-1 text-xs font-bold text-gray-500">M</span>
              </p>
              <div class="mt-1 flex items-center justify-between text-[10px]">
                <span class="text-gray-500">{{ cat.units.toLocaleString() }}개 판매</span>
                <span class="font-bold" :style="{ color: cat.color }">{{ cat.sharePct }}%</span>
              </div>
              <div class="mt-2 h-1.5 w-full bg-gray-100">
                <div class="h-full transition-all" :style="{ width: `${cat.sharePct}%`, backgroundColor: cat.color }"></div>
              </div>
            </div>
          </div>

          <!-- 카테고리 필터 -->
          <div class="mt-6 flex flex-wrap items-center gap-5">
            <label class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
              카테고리
              <select
                v-model="categoryFilter"
                class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white"
              >
                <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
              </select>
            </label>
          </div>

          <div class="mt-6 grid gap-6 lg:grid-cols-3">
            <!-- 좌측: 품목별 매출 TOP 10 막대 -->
            <div class="border border-gray-200 bg-white p-5 lg:col-span-2">
              <header class="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 class="flex items-center gap-1.5 text-xs font-black text-gray-800">
                  <Package :size="14" class="text-emerald-600" />
                  품목별 매출 TOP 10
                </h3>
                <div class="flex items-center gap-2 text-[10px]">
                  <span class="inline-flex items-center gap-1"><span class="h-2 w-2" style="background:#0ea5e9"></span>상의</span>
                  <span class="inline-flex items-center gap-1"><span class="h-2 w-2" style="background:#f59e0b"></span>바지</span>
                  <span class="inline-flex items-center gap-1"><span class="h-2 w-2" style="background:#a855f7"></span>치마</span>
                  <span class="inline-flex items-center gap-1"><span class="h-2 w-2" style="background:#059669"></span>아우터</span>
                </div>
              </header>
              <BarChart :data="productBarData" :options="barOptions" :height="320" />
            </div>

            <!-- 우측: 카테고리별 비중 도넛 -->
            <div class="border border-gray-200 bg-white p-5">
              <header class="mb-3 border-b border-gray-100 pb-2">
                <h3 class="flex items-center gap-1.5 text-xs font-black text-gray-800">
                  <PieChart :size="14" class="text-blue-600" />
                  카테고리별 비중
                </h3>
              </header>
              <DoughnutChart :data="categoryDoughnutData" :options="doughnutOptions" :height="240" />
              <ul class="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <li v-for="cat in categorySummary" :key="cat.category" class="flex items-center justify-between gap-2 border-b border-dashed border-gray-100 py-1">
                  <span class="flex min-w-0 items-center gap-2">
                    <span class="inline-block h-2 w-2 shrink-0" :style="{ backgroundColor: cat.color }"></span>
                    <span class="truncate font-bold text-gray-700">{{ cat.category }}</span>
                  </span>
                  <span class="shrink-0 text-gray-500">{{ cat.sharePct }}%</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- 카테고리별 품목 상세 테이블 -->
          <div class="mt-6 space-y-5">
            <div
              v-for="grp in productsByCategory"
              :key="grp.category"
              class="border border-gray-200 bg-white"
            >
              <header class="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-4 py-3">
                <h3 class="flex items-center gap-2 text-xs font-black text-gray-800">
                  <span class="inline-block h-3 w-3" :style="{ backgroundColor: grp.color }"></span>
                  {{ grp.category }}
                </h3>
                <span class="text-[10px] font-bold text-gray-400">
                  {{ grp.items.length }}개 품목 · 합계 ₩{{ grp.subtotal }}M
                </span>
              </header>
              <div class="overflow-auto">
                <table class="w-full min-w-[480px] text-xs">
                  <thead class="bg-gray-100 text-[10px] text-gray-500">
                    <tr>
                      <th class="w-12 px-3 py-2 text-center font-bold">순위</th>
                      <th class="px-3 py-2 text-left font-bold">품목</th>
                      <th class="w-24 px-3 py-2 text-right font-bold">판매수</th>
                      <th class="w-24 px-3 py-2 text-right font-bold">매출</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-for="(item, i) in grp.items" :key="item.name" class="hover:bg-gray-50">
                      <td class="px-3 py-2 text-center font-bold text-gray-500">{{ i + 1 }}</td>
                      <td class="px-3 py-2 font-bold text-gray-800">{{ item.name }}</td>
                      <td class="px-3 py-2 text-right font-mono text-gray-700">{{ item.units.toLocaleString() }}</td>
                      <td class="px-3 py-2 text-right font-mono font-bold text-gray-800">₩{{ item.sales }}M</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- ━━━━━━━ 탭: 상품별 ━━━━━━━ -->
        <div v-else-if="activeTab === 'productDetail'" class="p-6">
          <!-- 필터 바 -->
          <div class="flex flex-wrap items-center gap-4">
            <label class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
              카테고리
              <select
                v-model="categoryFilter"
                class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white"
              >
                <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
              </select>
            </label>
            <label class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
              품목
              <select
                v-model="productTypeFilter"
                class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white"
              >
                <option v-for="t in productTypeOptions" :key="t" :value="t">{{ t }}</option>
              </select>
            </label>
            <label class="relative ml-auto flex items-center">
              <Search :size="13" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                v-model="productKeyword"
                type="text"
                placeholder="상품명 검색..."
                class="w-56 border border-gray-300 bg-gray-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#004D3C] focus:bg-white"
              />
            </label>
          </div>

          <!-- 상품 KPI 4개 -->
          <div class="mt-5 grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div class="border border-gray-300 bg-white p-4 shadow-sm">
              <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">총 상품 수</p>
              <p class="mt-2 text-xl font-black text-gray-900">{{ productDetailKpi.totalCount }}<span class="ml-1 text-xs font-bold text-gray-500">개</span></p>
              <p class="mt-1 text-[10px] text-gray-500">필터 적용 결과</p>
            </div>
            <div class="border border-gray-300 bg-white p-4 shadow-sm">
              <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">합계 매출</p>
              <p class="mt-2 text-xl font-black text-gray-900">₩{{ productDetailKpi.totalSales }}<span class="ml-1 text-xs font-bold text-gray-500">M</span></p>
              <p class="mt-1 text-[10px] text-gray-500">상품 매출 합산</p>
            </div>
            <div class="border border-gray-300 bg-white p-4 shadow-sm">
              <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">합계 판매수</p>
              <p class="mt-2 text-xl font-black text-gray-900">{{ productDetailKpi.totalUnits.toLocaleString() }}<span class="ml-1 text-xs font-bold text-gray-500">개</span></p>
              <p class="mt-1 text-[10px] text-gray-500">전체 판매 수량</p>
            </div>
            <div class="border border-gray-300 bg-white p-4 shadow-sm">
              <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">🏆 TOP 1 상품</p>
              <p v-if="productDetailKpi.topProduct" class="mt-2 truncate text-sm font-black text-gray-900">{{ productDetailKpi.topProduct.name }}</p>
              <p v-if="productDetailKpi.topProduct" class="mt-1 text-[10px] text-gray-500">
                ₩{{ productDetailKpi.topProduct.sales }}M · {{ productDetailKpi.topProduct.units }}개
              </p>
            </div>
          </div>

          <!-- TOP 10 상품 막대 -->
          <div class="mt-6 border border-gray-200 bg-white p-5 shadow-sm">
            <header class="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 class="flex items-center gap-1.5 text-xs font-black text-gray-800">
                <Award :size="14" class="text-amber-600" />
                상품별 매출 TOP 10
              </h3>
              <div class="flex items-center gap-2 text-[10px]">
                <span class="inline-flex items-center gap-1"><span class="h-2 w-2" style="background:#0ea5e9"></span>상의</span>
                <span class="inline-flex items-center gap-1"><span class="h-2 w-2" style="background:#f59e0b"></span>바지</span>
                <span class="inline-flex items-center gap-1"><span class="h-2 w-2" style="background:#a855f7"></span>치마</span>
                <span class="inline-flex items-center gap-1"><span class="h-2 w-2" style="background:#059669"></span>아우터</span>
              </div>
            </header>
            <BarChart v-if="top10ProductDetails.length" :data="productDetailBarData" :options="productDetailBarOptions" :height="380" />
            <p v-else class="py-12 text-center text-xs text-gray-400">검색 조건에 맞는 상품이 없습니다.</p>
          </div>

          <!-- 품목별 그룹 상세 테이블 -->
          <div class="mt-6 space-y-5">
            <div
              v-for="grp in productDetailsByType"
              :key="grp.productType"
              class="border border-gray-200 bg-white"
            >
              <header class="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-4 py-3">
                <h3 class="flex items-center gap-2 text-xs font-black text-gray-800">
                  <span class="inline-block h-3 w-3" :style="{ backgroundColor: grp.categoryColor }"></span>
                  <span class="text-gray-500">{{ grp.category }} ›</span>
                  {{ grp.productType }}
                </h3>
                <span class="text-[10px] font-bold text-gray-400">
                  {{ grp.items.length }}개 상품 · {{ grp.totalUnits.toLocaleString() }}개 판매 · 합계 ₩{{ grp.subtotal }}M
                </span>
              </header>
              <div class="overflow-auto">
                <table class="w-full min-w-[520px] text-xs">
                  <thead class="bg-gray-100 text-[10px] text-gray-500">
                    <tr>
                      <th class="w-12 px-3 py-2 text-center font-bold">순위</th>
                      <th class="px-3 py-2 text-left font-bold">상품명</th>
                      <th class="w-24 px-3 py-2 text-right font-bold">판매수</th>
                      <th class="w-24 px-3 py-2 text-right font-bold">매출</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-for="(item, i) in grp.items" :key="item.name" class="hover:bg-gray-50">
                      <td class="px-3 py-2 text-center font-bold text-gray-500">{{ i + 1 }}</td>
                      <td class="px-3 py-2 font-bold text-gray-800">{{ item.name }}</td>
                      <td class="px-3 py-2 text-right font-mono text-gray-700">{{ item.units.toLocaleString() }}</td>
                      <td class="px-3 py-2 text-right font-mono font-bold text-gray-800">₩{{ item.sales }}M</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p v-if="!productDetailsByType.length" class="border border-gray-200 bg-white px-4 py-8 text-center text-xs text-gray-400">
              검색 조건에 맞는 상품이 없습니다.
            </p>
          </div>
        </div>

      </section>
    </div>
  </AppLayout>
</template>
