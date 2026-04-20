<script setup>
import { computed, h, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const activeSideMenu = ref('발주 관리')
const selectedOrder = ref(null)
const checkedOrders = ref([])
const activeStatusTab = ref('승인 대기')

const sideMenus = roleMenus.hq

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const statusTabs = [
  { label: '전체', count: 142 },
  { label: '승인 대기', count: 18, highlight: true },
  { label: '승인 완료', count: 45 },
  { label: '출고 중', count: 24 },
  { label: '배송 완료', count: 55 },
  { label: '반려/취소', count: 0 },
]

const orderData = [
  { id: 'ORD-20240416-01', store: '강남 서초점', items: '고속 충전기 (C타입) 외 3건', totalQty: 450, amount: '₩4,500,000', reqDate: '2024.04.16 17:20', wishDate: '2024.04.18', status: '승인 대기', manager: '박범수', isAnomaly: true },
  { id: 'ORD-20240416-02', store: '성수 직영점', items: '무소음 무선 마우스 외 1건', totalQty: 12, amount: '₩320,000', reqDate: '2024.04.16 16:45', wishDate: '2024.04.17', status: '승인 대기', manager: '김사라', isAnomaly: false },
  { id: 'ORD-20240416-03', store: '판교 테크노점', items: 'A4 복사용지 80g (500매) 외 5건', totalQty: 800, amount: '₩8,200,000', reqDate: '2024.04.16 15:30', wishDate: '2024.04.19', status: '승인 대기', manager: '이후경', isAnomaly: false },
  { id: 'ORD-20240416-04', store: '인천 제1센터', items: '휴대용 가글 (중) 외 2건', totalQty: 1500, amount: '₩12,450,000', reqDate: '2024.04.16 14:10', wishDate: '2024.04.20', status: '승인 완료', manager: '박범수', isAnomaly: false },
  { id: 'ORD-20240416-05', store: '여의도 IFC점', items: '유리제 머그컵 350ml 외 1건', totalQty: 50, amount: '₩650,000', reqDate: '2024.04.16 13:55', wishDate: '2024.04.17', status: '출고 중', manager: '김사라', isAnomaly: false },
  { id: 'ORD-20240416-06', store: '강남 서초점', items: '리무버블 스티커 외 10건', totalQty: 240, amount: '₩1,120,000', reqDate: '2024.04.16 12:20', wishDate: '2024.04.18', status: '승인 대기', manager: '박범수', isAnomaly: false },
  { id: 'ORD-20240416-07', store: '부산 중앙점', items: '대용량 보조배터리 외 1건', totalQty: 100, amount: '₩5,800,000', reqDate: '2024.04.16 11:45', wishDate: '2024.04.22', status: '배송 완료', manager: '이선엽', isAnomaly: true },
  { id: 'ORD-20240416-08', store: '성수 직영점', items: '기계식 키보드 외 2건', totalQty: 20, amount: '₩2,400,000', reqDate: '2024.04.16 10:30', wishDate: '2024.04.18', status: '승인 대기', manager: '김사라', isAnomaly: false },
  { id: 'ORD-20240415-42', store: '인천 제2센터', items: '절전형 5구 멀티탭 외 4건', totalQty: 120, amount: '₩1,850,000', reqDate: '2024.04.15 17:50', wishDate: '2024.04.17', status: '승인 완료', manager: '이후경', isAnomaly: false },
  { id: 'ORD-20240415-41', store: '판교 테크노점', items: 'HDMI 2.1 케이블 외 1건', totalQty: 45, amount: '₩540,000', reqDate: '2024.04.15 16:30', wishDate: '2024.04.16', status: '배송 완료', manager: '이선엽', isAnomaly: false },
  { id: 'ORD-20240415-40', store: '용인 물류센터', items: '점착식 메모지 외 20건', totalQty: 5000, amount: '₩3,500,000', reqDate: '2024.04.15 15:20', wishDate: '2024.04.25', status: '승인 대기', manager: '박범수', isAnomaly: true },
  { id: 'ORD-20240415-39', store: '강남 서초점', items: 'KF94 마스크 외 2건', totalQty: 300, amount: '₩450,000', reqDate: '2024.04.15 14:10', wishDate: '2024.04.17', status: '반려', manager: '이선엽', isAnomaly: false },
  { id: 'ORD-20240415-38', store: '성수 직영점', items: '탁상용 미니 가습기 외 1건', totalQty: 15, amount: '₩420,000', reqDate: '2024.04.15 13:00', wishDate: '2024.04.17', status: '승인 대기', manager: '김사라', isAnomaly: false },
  { id: 'ORD-20240415-37', store: '여의도 IFC점', items: '종이컵 6.5온스 외 2건', totalQty: 2000, amount: '₩1,200,000', reqDate: '2024.04.15 12:15', wishDate: '2024.04.17', status: '승인 완료', manager: '박범수', isAnomaly: false },
  { id: 'ORD-20240415-36', store: '부산 중앙점', items: '무선 이어폰 외 1건', totalQty: 30, amount: '₩4,500,000', reqDate: '2024.04.15 11:40', wishDate: '2024.04.20', status: '배송 완료', manager: '김사라', isAnomaly: false },
  { id: 'ORD-20240415-35', store: '판교 테크노점', items: '사무용 커터칼 외 5건', totalQty: 55, amount: '₩150,000', reqDate: '2024.04.15 10:20', wishDate: '2024.04.16', status: '승인 대기', manager: '이후경', isAnomaly: false },
  { id: 'ORD-20240414-92', store: '강남 서초점', items: '알루미늄 노트북 스탠드 외 1건', totalQty: 25, amount: '₩1,250,000', reqDate: '2024.04.14 17:55', wishDate: '2024.04.16', status: '승인 완료', manager: '김사라', isAnomaly: false },
  { id: 'ORD-20240414-91', store: '인천 제1센터', items: '투명 박스 테이프 외 10건', totalQty: 400, amount: '₩880,000', reqDate: '2024.04.14 16:40', wishDate: '2024.04.17', status: '출고 중', manager: '박범수', isAnomaly: false },
  { id: 'ORD-20240414-90', store: '성수 직영점', items: 'FHD 웹캠 외 2건', totalQty: 8, amount: '₩1,200,000', reqDate: '2024.04.14 15:30', wishDate: '2024.04.16', status: '배송 완료', manager: '이후경', isAnomaly: false },
  { id: 'ORD-20240414-89', store: '용인 물류센터', items: 'USB-C to 3.5mm 젠더 외 1건', totalQty: 100, amount: '₩1,200,000', reqDate: '2024.04.14 14:15', wishDate: '2024.04.17', status: '승인 완료', manager: '이선엽', isAnomaly: false },
  { id: 'ORD-20240414-88', store: '강남 서초점', items: '더블클립 세트 외 3건', totalQty: 50, amount: '₩240,000', reqDate: '2024.04.14 13:05', wishDate: '2024.04.15', status: '승인 완료', manager: '박범수', isAnomaly: false },
  { id: 'ORD-20240414-87', store: '판교 테크노점', items: '투명 화일 (A4) 외 1건', totalQty: 500, amount: '₩250,000', reqDate: '2024.04.14 12:50', wishDate: '2024.04.16', status: '배송 완료', manager: '이후경', isAnomaly: false },
]

const orderDetails = [
  { name: '고속 충전기 (C타입) 25W', spec: 'White / 2.0m', price: 15000, qty: 300, subtotal: 4500000 },
  { name: '휴대용 가글 (중) 250ml', spec: '민트향', price: 3500, qty: 50, subtotal: 175000 },
  { name: '유리제 머그컵 350ml', spec: '내열유리', price: 8900, qty: 100, subtotal: 890000 },
]

const filteredOrders = computed(() => {
  if (activeStatusTab.value === '전체') return orderData
  if (activeStatusTab.value === '반려/취소') return orderData.filter((o) => o.status === '반려' || o.status === '취소')
  return orderData.filter((o) => o.status === activeStatusTab.value)
})

const isAllChecked = computed(
  () => filteredOrders.value.length > 0 && filteredOrders.value.every((o) => checkedOrders.value.includes(o.id)),
)

const handleCheckAll = (checked) => {
  if (checked) {
    const next = new Set(checkedOrders.value)
    filteredOrders.value.forEach((o) => next.add(o.id))
    checkedOrders.value = [...next]
    return
  }
  checkedOrders.value = checkedOrders.value.filter((id) => !filteredOrders.value.some((o) => o.id === id))
}

const handleCheck = (id) => {
  if (checkedOrders.value.includes(id)) {
    checkedOrders.value = checkedOrders.value.filter((oid) => oid !== id)
    return
  }
  checkedOrders.value = [...checkedOrders.value, id]
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

const AlertCircleIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 8v5' } },
  { tag: 'path', attrs: { d: 'M12 16h.01' } },
])

const SearchIcon = IconBase([
  { tag: 'circle', attrs: { cx: '11', cy: '11', r: '7' } },
  { tag: 'path', attrs: { d: 'm20 20-3.5-3.5' } },
])

const DownloadIcon = IconBase([
  { tag: 'path', attrs: { d: 'M12 3v12' } },
  { tag: 'path', attrs: { d: 'm7 10 5 5 5-5' } },
  { tag: 'path', attrs: { d: 'M5 21h14' } },
])

const ChevronLeftIcon = IconBase([{ tag: 'path', attrs: { d: 'm15 18-6-6 6-6' } }])
const ChevronRightIcon = IconBase([{ tag: 'path', attrs: { d: 'm9 18 6-6-6-6' } }])

const ThumbsUpIcon = IconBase([
  { tag: 'path', attrs: { d: 'M7 10v10' } },
  { tag: 'path', attrs: { d: 'M12 20h5a2 2 0 0 0 2-2v-5.2a2 2 0 0 0-.4-1.2l-2.1-2.8A2 2 0 0 0 15 8h-3V5.5A1.5 1.5 0 0 0 10.5 4L7 10Z' } },
  { tag: 'path', attrs: { d: 'M4 10h3v10H4z' } },
])

const ThumbsDownIcon = IconBase([
  { tag: 'path', attrs: { d: 'M7 4v10' } },
  { tag: 'path', attrs: { d: 'M12 4h5a2 2 0 0 1 2 2v5.2a2 2 0 0 1-.4 1.2l-2.1 2.8A2 2 0 0 1 15 16h-3v2.5a1.5 1.5 0 0 1-1.5 1.5L7 14Z' } },
  { tag: 'path', attrs: { d: 'M4 4h3v10H4z' } },
])

const InfoIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 10v6' } },
  { tag: 'path', attrs: { d: 'M12 7h.01' } },
])

const XIcon = IconBase([
  { tag: 'path', attrs: { d: 'M18 6 6 18' } },
  { tag: 'path', attrs: { d: 'm6 6 12 12' } },
])

const StoreIcon = IconBase([
  { tag: 'path', attrs: { d: 'M4 10h16' } },
  { tag: 'path', attrs: { d: 'M5 10V6l2-2h10l2 2v4' } },
  { tag: 'path', attrs: { d: 'M6 10v10h12V10' } },
  { tag: 'path', attrs: { d: 'M10 20v-5h4v5' } },
])

const UserIcon = IconBase([
  { tag: 'path', attrs: { d: 'M20 21a8 8 0 0 0-16 0' } },
  { tag: 'circle', attrs: { cx: '12', cy: '8', r: '4' } },
])

const ClockIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 7v5l3 2' } },
])

const CalendarIcon = IconBase([
  { tag: 'rect', attrs: { x: '3', y: '5', width: '18', height: '16', rx: '2' } },
  { tag: 'path', attrs: { d: 'M16 3v4' } },
  { tag: 'path', attrs: { d: 'M8 3v4' } },
  { tag: 'path', attrs: { d: 'M3 10h18' } },
])

const FileTextIcon = IconBase([
  { tag: 'path', attrs: { d: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z' } },
  { tag: 'path', attrs: { d: 'M14 3v5h5' } },
  { tag: 'path', attrs: { d: 'M9 13h6' } },
  { tag: 'path', attrs: { d: 'M9 17h6' } },
])
</script>

<template>
  <AppLayout
    active-top-menu="발주 관리"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="orders-content">
      <section class="panel status-tabs">
        <button
          v-for="tab in statusTabs"
          :key="tab.label"
          type="button"
          class="status-tab"
          :class="{ active: activeStatusTab === tab.label }"
          @click="activeStatusTab = tab.label"
        >
          <span class="tab-label">{{ tab.label }}</span>
          <span class="tab-count" :class="{ highlight: tab.highlight && activeStatusTab !== tab.label }">
            {{ tab.count }}
          </span>
        </button>
      </section>

      <section class="alert-banner">
        <div class="alert-left">
          <div class="alert-mark"><AlertCircleIcon :size="14" /></div>
          <p>[발주량 이상 감지] 강남 서초점의 '고속 충전기' 발주량이 평소 대비 300% 급증했습니다. (기준일: 최근 4주 평균)</p>
        </div>
        <button type="button">상세 분석 보고서 열기</button>
      </section>

      <section class="orders-split">
        <div class="panel orders-table-panel">
          <div class="table-action-bar">
            <div class="action-left">
              <label class="check-all">
                <input type="checkbox" :checked="isAllChecked" @change="handleCheckAll($event.target.checked)" />
                <span>전체 선택</span>
              </label>
              <div v-if="checkedOrders.length > 0" class="bulk-actions">
                <button type="button" class="bulk-button approve">
                  <ThumbsUpIcon :size="12" />
                  일괄 승인 ({{ checkedOrders.length }})
                </button>
                <button type="button" class="bulk-button reject">
                  <ThumbsDownIcon :size="12" />
                  일괄 반려
                </button>
              </div>
            </div>
            <div class="action-right">
              <label class="search-box compact-search">
                <SearchIcon :size="14" class="search-icon" />
                <input type="text" placeholder="발주 번호/매장 검색..." />
              </label>
              <button type="button" class="download-icon"><DownloadIcon :size="14" /></button>
            </div>
          </div>

          <div class="table-wrap">
            <table class="orders-table">
              <thead>
                <tr>
                  <th class="check-col"></th>
                  <th class="w-order">발주 번호</th>
                  <th class="w-store">요청 매장</th>
                  <th>품목 명세</th>
                  <th class="align-right w-qty">총 수량</th>
                  <th class="align-right w-amount">발주 금액</th>
                  <th class="center w-status">상태</th>
                  <th class="center w-actions">관리</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="order in filteredOrders"
                  :key="order.id"
                  :class="{ selected: selectedOrder?.id === order.id, anomaly: order.isAnomaly }"
                  @click="selectedOrder = order"
                >
                  <td class="center" @click.stop>
                    <input type="checkbox" :checked="checkedOrders.includes(order.id)" @change="handleCheck(order.id)" />
                  </td>
                  <td class="muted strong-small">
                    {{ order.id }}
                    <span v-if="order.isAnomaly" class="flag-badge">이상</span>
                  </td>
                  <td class="strong">{{ order.store }}</td>
                  <td class="semi-strong truncate">{{ order.items }}</td>
                  <td class="align-right strong">{{ order.totalQty.toLocaleString() }}</td>
                  <td class="align-right strong">{{ order.amount }}</td>
                  <td class="center">
                    <span class="status-badge" :class="order.status">{{ order.status }}</span>
                  </td>
                  <td class="center" @click.stop>
                    <div class="row-actions">
                      <button type="button"><SearchIcon :size="12" /></button>
                      <button v-if="order.status === '승인 대기'" type="button" class="approve-mini">
                        <ThumbsUpIcon :size="12" />
                      </button>
                      <button v-if="order.status === '승인 대기'" type="button" class="reject-mini">
                        <ThumbsDownIcon :size="12" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-footer">
            <span>Page 1 of 8 (Total: 142 Orders)</span>
            <div class="pagination">
              <button type="button"><ChevronLeftIcon :size="14" /></button>
              <button v-for="page in [1, 2, 3]" :key="page" type="button" :class="{ active: page === 1 }">{{ page }}</button>
              <button type="button"><ChevronRightIcon :size="14" /></button>
            </div>
          </div>
        </div>

        <aside v-if="selectedOrder" class="panel detail-panel">
          <div class="detail-head">
            <h3><InfoIcon :size="14" /> 발주 상세 명세</h3>
            <button type="button" class="detail-close" @click="selectedOrder = null">
              <XIcon :size="16" />
            </button>
          </div>

          <div class="detail-body">
            <section class="detail-summary">
              <div class="summary-row">
                <div>
                  <p class="caption">발주 번호</p>
                  <p class="headline">{{ selectedOrder.id }}</p>
                </div>
                <div class="status-right">
                  <p class="caption">상태</p>
                  <span class="status-badge large" :class="selectedOrder.status">{{ selectedOrder.status }}</span>
                </div>
              </div>
              <div class="meta-grid">
                <div>
                  <p class="caption inline"><StoreIcon :size="10" /> 요청 매장</p>
                  <p class="meta-value">{{ selectedOrder.store }}</p>
                </div>
                <div>
                  <p class="caption inline"><UserIcon :size="10" /> 요청자</p>
                  <p class="meta-value">{{ selectedOrder.manager }} 점장</p>
                </div>
                <div>
                  <p class="caption inline"><ClockIcon :size="10" /> 요청 일시</p>
                  <p class="meta-sub">{{ selectedOrder.reqDate }}</p>
                </div>
                <div>
                  <p class="caption inline"><CalendarIcon :size="10" /> 희망 배송일</p>
                  <p class="meta-emphasis">{{ selectedOrder.wishDate }}</p>
                </div>
              </div>
            </section>

            <section v-if="selectedOrder.isAnomaly" class="anomaly-box">
              <p class="anomaly-title"><AlertCircleIcon :size="12" /> 이상 발주 알림</p>
              <p class="anomaly-text">
                해당 매장의 '고속 충전기' 발주 패턴이 최근 4주 평균 대비 320% 초과되었습니다. 승인 전 창고 재고 및 매장 특이사항을 반드시 확인하십시오.
              </p>
            </section>

            <section class="detail-items">
              <p class="section-label">발주 품목 내역</p>
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>품목정보</th>
                    <th class="align-right w-mini">수량</th>
                    <th class="align-right w-subtotal">소계</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in orderDetails" :key="item.name">
                    <td>
                      <p class="item-name">{{ item.name }}</p>
                      <p class="item-meta">{{ item.spec }} | ₩{{ item.price.toLocaleString() }}</p>
                    </td>
                    <td class="align-right strong-small">{{ item.qty }}</td>
                    <td class="align-right strong-small">₩{{ item.subtotal.toLocaleString() }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td>총계</td>
                    <td class="align-right">462</td>
                    <td class="align-right total-amount">{{ selectedOrder.amount }}</td>
                  </tr>
                </tfoot>
              </table>
            </section>
          </div>

          <div class="detail-actions">
            <div v-if="selectedOrder.status === '승인 대기'" class="decision-grid">
              <button type="button" class="decision-button approve">
                <ThumbsUpIcon :size="14" /> 발주 최종 승인
              </button>
              <button type="button" class="decision-button reject">
                <ThumbsDownIcon :size="14" /> 발주 반려 처리
              </button>
            </div>
            <button v-else type="button" class="decision-button reissue">
              <FileTextIcon :size="14" /> 명세서 재발행
            </button>
            <button type="button" class="close-button" @click="selectedOrder = null">닫기 (Esc)</button>
          </div>
        </aside>
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
.orders-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
}

.panel {
  border: 1px solid #d1d5db;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.status-tabs {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.status-tab {
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 12px 16px;
  border: 0;
  border-right: 1px solid #e5e7eb;
  background: transparent;
  color: #6b7280;
  font: inherit;
  text-align: center;
  cursor: pointer;
}

.status-tab:last-child { border-right: 0; }

.status-tab:hover { background: #f9fafb; }

.status-tab.active {
  color: #004d3c;
  background: #f9fafb;
  border-bottom: 2px solid #004d3c;
}

.tab-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.tab-count {
  display: block;
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.05em;
}

.tab-count.highlight {
  color: #ef4444;
  text-decoration: underline;
}

.alert-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 12px;
  border: 1px solid #fcd34d;
  background: #fffbeb;
  flex-shrink: 0;
}

.alert-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.alert-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: #f59e0b;
  color: #fff;
}

.alert-banner p {
  color: #78350f;
  font-size: 11px;
  font-weight: 700;
}

.alert-banner button {
  border: 0;
  background: transparent;
  color: #b45309;
  font: inherit;
  font-size: 10px;
  font-weight: 900;
  cursor: pointer;
}

.orders-split {
  display: flex;
  flex: 1;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

.orders-table-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.table-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
}

.action-left,
.action-right,
.bulk-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.check-all {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.bulk-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 0;
  font: inherit;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
}

.bulk-button.approve {
  border: 1px solid #004d3c;
  background: #004d3c;
  color: #fff;
}

.bulk-button.reject {
  border: 1px solid #fecaca;
  background: #fff;
  color: #dc2626;
}

.search-box { position: relative; display: block; }

.compact-search input {
  width: 192px;
  padding: 6px 12px 6px 32px;
  border: 1px solid #d1d5db;
  background: #fff;
  outline: none;
  font: inherit;
  font-size: 11px;
}

.compact-search input:focus { border-color: #004d3c; }

.search-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  color: #9ca3af;
}

.download-icon {
  display: inline-flex;
  align-items: center;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  background: transparent;
  color: #6b7280;
  font: inherit;
  cursor: pointer;
}

.table-wrap { flex: 1; overflow: auto; }

.orders-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.orders-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
}

.orders-table thead tr {
  border-bottom: 1px solid #d1d5db;
  background: #f3f4f6;
}

.orders-table th,
.orders-table td {
  padding: 8px 12px;
  border-right: 1px solid #f3f4f6;
  text-align: left;
  white-space: nowrap;
}

.orders-table th:last-child,
.orders-table td:last-child { border-right: 0; }

.orders-table th {
  color: #6b7280;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

.orders-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
}

.orders-table tbody tr:hover { background: rgba(239, 246, 255, 0.7); }
.orders-table tbody tr.selected { background: #e6efee; }
.orders-table tbody tr.anomaly { background: rgba(255, 251, 235, 0.4); }
.orders-table tbody tr.anomaly.selected { background: #e6efee; }
.orders-table td { color: #6b7280; font-size: 11px; }

.check-col { width: 40px; }
.w-order { width: 144px; }
.w-store { width: 128px; }
.w-qty { width: 96px; }
.w-amount { width: 112px; }
.w-status { width: 96px; }
.w-actions { width: 128px; }

.center { text-align: center !important; }
.align-right { text-align: right !important; }
.muted { color: #9ca3af !important; }
.strong-small { font-weight: 700; }
.strong { color: #111827 !important; font-size: 12px !important; font-weight: 900; }
.semi-strong { color: #4b5563 !important; font-size: 12px !important; font-weight: 700; }
.truncate { overflow: hidden; text-overflow: ellipsis; }

.flag-badge {
  margin-left: 4px;
  padding: 1px 4px;
  background: #f59e0b;
  color: #fff;
  font-size: 9px;
  font-weight: 900;
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

.status-badge.승인\ 대기 { border-color: #fcd34d; background: #fffbeb; color: #b45309; }
.status-badge.승인\ 완료 { border-color: #a7f3d0; background: #ecfdf5; color: #047857; }
.status-badge.출고\ 중 { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.status-badge.배송\ 완료 { border-color: #d1d5db; background: #f9fafb; color: #374151; }
.status-badge.반려,
.status-badge.취소 { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
.status-badge.large { padding: 3px 8px; font-size: 11px; }

.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.row-actions button {
  padding: 4px;
  border: 1px solid #e5e7eb;
  background: transparent;
  color: #6b7280;
  font: inherit;
  cursor: pointer;
}

.row-actions button:hover { background: #f9fafb; }
.approve-mini { border-color: #004d3c !important; color: #004d3c !important; }
.reject-mini { border-color: #fecaca !important; color: #dc2626 !important; }

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
  flex-shrink: 0;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  border: 1px solid #d1d5db;
  background: transparent;
  color: #4b5563;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.pagination button:hover { background: #f9fafb; }

.pagination button.active {
  border-color: #1f2937;
  background: #1f2937;
  color: #fff;
}

.detail-panel {
  display: flex;
  flex-direction: column;
  width: 420px;
  flex-shrink: 0;
  overflow: hidden;
}

.detail-head {
  display: flex;
  align-items: center;
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
  border: 0;
  background: transparent;
  color: #fff;
  font: inherit;
  cursor: pointer;
}

.detail-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  padding: 16px;
}

.detail-summary { display: flex; flex-direction: column; gap: 16px; }

.summary-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.caption {
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.headline { color: #111827; font-size: 14px; font-weight: 900; }
.status-right { text-align: right; }

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.inline {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-value { color: #1f2937; font-size: 12px; font-weight: 900; }
.meta-sub { color: #4b5563; font-size: 11px; font-weight: 700; }
.meta-emphasis { color: #004d3c; font-size: 11px; font-weight: 900; }

.anomaly-box {
  padding: 12px;
  border: 1px solid #fecaca;
  background: #fef2f2;
}

.anomaly-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  color: #b91c1c;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
}

.anomaly-text { color: #7f1d1d; font-size: 11px; line-height: 1.45; }

.section-label {
  padding-bottom: 4px;
  border-bottom: 1px solid #e5e7eb;
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.detail-table {
  width: 100%;
  margin-top: 8px;
  border-collapse: collapse;
}

.detail-table thead tr {
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.detail-table th,
.detail-table td { padding: 8px; text-align: left; }

.detail-table th {
  color: #9ca3af;
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
}

.detail-table tbody tr { border-bottom: 1px solid #f3f4f6; }

.detail-table tfoot tr {
  border-top: 1px solid #d1d5db;
  background: #f9fafb;
  font-size: 11px;
  font-weight: 900;
}

.w-mini { width: 64px; }
.w-subtotal { width: 96px; }
.item-name { margin-bottom: 4px; color: #1f2937; font-size: 11px; font-weight: 900; }
.item-meta { color: #9ca3af; font-size: 9px; font-weight: 700; text-transform: uppercase; }
.total-amount { color: #004d3c; font-size: 13px; text-decoration: underline double; }

.detail-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px 16px;
  background: #fff;
}

.decision-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.decision-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  background: transparent;
  font: inherit;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  cursor: pointer;
}

.decision-button.approve { border-color: #004d3c; background: #004d3c; color: #fff; }
.decision-button.reject { border-color: #fca5a5; background: #fff; color: #dc2626; }
.decision-button.reissue { width: 100%; background: #1f2937; color: #fff; border-color: #1f2937; }

.close-button {
  width: 100%;
  padding: 8px 12px;
  border: 0;
  background: transparent;
  color: #6b7280;
  font: inherit;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
}

@media (max-width: 1180px) {
  .orders-split { flex-direction: column; }
  .detail-panel { width: 100%; }
}

@media (max-width: 980px) {
  .table-action-bar,
  .alert-banner { flex-direction: column; align-items: stretch; }
}
</style>
