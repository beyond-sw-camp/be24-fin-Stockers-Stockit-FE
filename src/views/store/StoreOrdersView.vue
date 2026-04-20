<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertCircle, ClipboardList, FileText, Search, ShoppingCart } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { storeSideMenusByTopMenu, storeTopMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useInventoryStore } from '@/stores/inventory.js'

const router = useRouter()
const auth = useAuthStore()
const inventory = useInventoryStore()

const activeTopMenu = '주문 관리'
const activeSideMenu = ref('주문 요청')
const sideMenus = storeSideMenusByTopMenu[activeTopMenu]

const searchTerm = ref('')
const cart = ref([])
const requestMemo = ref('')
const desiredDate = ref('2026-04-22')
const showRequestForm = ref(false)
const selectedOrder = ref(null)
const editDraft = ref(null)

const recommendations = [
  { id: 'ITM-H002', name: '휴대용 가글 중 250ml', currentStock: 12, safetyStock: 50, recommendedQty: 80, expectedRunout: '2일 후' },
  { id: 'ITM-S007', name: '스테이플러 심 10갑', currentStock: 5, safetyStock: 40, recommendedQty: 60, expectedRunout: '3일 후' },
  { id: 'ITM-K003', name: '유리제 머그컵 350ml', currentStock: 85, safetyStock: 100, recommendedQty: 40, expectedRunout: '6일 후' },
]

const orders = ref([
  {
    id: 'SO-20260420-003',
    requestedAt: '2026.04.20 14:30',
    desiredDate: '2026-04-23',
    status: '대기',
    memo: '주말 판매 대비 재고 보충 요청',
    items: [
      { id: 'ITM-H002', name: '휴대용 가글 중 250ml', qty: 80, unitPrice: 4500 },
      { id: 'ITM-S007', name: '스테이플러 심 10갑', qty: 60, unitPrice: 1500 },
    ],
  },
  {
    id: 'SO-20260419-018',
    requestedAt: '2026.04.19 11:12',
    desiredDate: '2026-04-21',
    status: '승인',
    memo: '전자제품 행사 물량',
    items: [{ id: 'ITM-E001', name: '고속 충전기 C타입 25W', qty: 120, unitPrice: 24900 }],
  },
  {
    id: 'SO-20260418-009',
    requestedAt: '2026.04.18 16:05',
    desiredDate: '2026-04-20',
    status: '배송 준비',
    memo: '기본 진열 재고 보충',
    items: [{ id: 'ITM-S005', name: 'A4 복사용지 80g 500매', qty: 200, unitPrice: 6500 }],
  },
])

const filteredProducts = computed(() => {
  const keyword = searchTerm.value.trim()
  if (!keyword) return inventory.products
  return inventory.products.filter((product) => product.name.includes(keyword) || product.category.includes(keyword) || product.id.includes(keyword))
})

const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + item.qty * item.unitPrice, 0))

function addToCart(product, quantity = 1) {
  const existing = cart.value.find((item) => item.id === product.id)
  if (existing) {
    existing.qty += quantity
    return
  }
  cart.value.push({
    id: product.id,
    name: product.name,
    category: product.category,
    unitPrice: product.unitPrice,
    qty: quantity,
  })
}

function applyRecommendation(recommendation) {
  const product = inventory.products.find((item) => item.id === recommendation.id)
  if (!product) return
  addToCart(product, recommendation.recommendedQty)
  showRequestForm.value = false
}

function updateCartQty(item, value) {
  const qty = parseInt(value)
  item.qty = Number.isNaN(qty) || qty < 1 ? 1 : qty
}

function removeCartItem(itemId) {
  cart.value = cart.value.filter((item) => item.id !== itemId)
}

function openRequestForm() {
  showRequestForm.value = cart.value.length > 0
}

function submitOrderRequest() {
  if (cart.value.length === 0) return
  const order = {
    id: `SO-20260420-${String(orders.value.length + 4).padStart(3, '0')}`,
    requestedAt: '2026.04.20 16:20',
    desiredDate: desiredDate.value,
    status: '대기',
    memo: requestMemo.value || '매장 주문 요청',
    items: cart.value.map((item) => ({ id: item.id, name: item.name, qty: item.qty, unitPrice: item.unitPrice })),
  }
  orders.value.unshift(order)
  selectedOrder.value = order
  cart.value = []
  requestMemo.value = ''
  showRequestForm.value = false
  activeSideMenu.value = '주문 목록 조회'
}

function selectOrder(order) {
  selectedOrder.value = order
  editDraft.value = null
}

function startEdit(order) {
  editDraft.value = {
    ...order,
    items: order.items.map((item) => ({ ...item })),
  }
}

function updateEditQty(item, value) {
  const qty = parseInt(value)
  item.qty = Number.isNaN(qty) || qty < 1 ? 1 : qty
}

function saveEdit() {
  if (!editDraft.value) return
  const index = orders.value.findIndex((order) => order.id === editDraft.value.id)
  if (index === -1) return
  orders.value[index] = {
    ...editDraft.value,
    items: editDraft.value.items.map((item) => ({ ...item })),
  }
  selectedOrder.value = orders.value[index]
  editDraft.value = null
}

function cancelOrder(order) {
  if (order.status !== '대기') return
  order.status = '취소'
  editDraft.value = null
}

function orderTotal(order) {
  return order.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)
}

function statusClass(status) {
  return {
    대기: 'bg-amber-100 text-amber-700',
    승인: 'bg-emerald-100 text-emerald-700',
    '배송 준비': 'bg-blue-100 text-blue-700',
    취소: 'bg-gray-200 text-gray-500',
  }[status]
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeTopMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-3">
      <section class="border border-gray-300 bg-white px-5 py-5 shadow-sm">
        <h1 class="inline-flex items-center gap-2 text-lg font-black text-gray-900">
          <ClipboardList :size="20" />
          {{ activeSideMenu }}
        </h1>
        <p class="mt-1 text-sm text-gray-500">매장 점주가 본사/물류창고에 필요한 물품을 요청하는 주문 관리 화면입니다.</p>
      </section>

      <template v-if="activeSideMenu === '주문 요청'">
        <section class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          <article class="border border-gray-300 bg-white shadow-sm">
            <div class="flex h-14 items-center justify-between border-b border-gray-200 px-5">
              <h2 class="inline-flex items-center gap-2 text-sm font-bold text-gray-800">
                <Search :size="16" />
                상품 검색
              </h2>
              <input
                v-model="searchTerm"
                type="text"
                placeholder="품목명, 카테고리, 코드 검색"
                class="w-72 border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#004D3C]"
              />
            </div>
            <div class="max-h-[420px] overflow-auto">
              <table class="w-full min-w-[760px] text-sm">
                <thead class="bg-gray-100 text-xs text-gray-500">
                  <tr>
                    <th class="px-4 py-3 text-left font-bold">품목</th>
                    <th class="px-4 py-3 text-left font-bold">카테고리</th>
                    <th class="px-4 py-3 text-right font-bold">현재 재고</th>
                    <th class="px-4 py-3 text-right font-bold">단가</th>
                    <th class="px-4 py-3 text-center font-bold">담기</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-gray-50">
                    <td class="px-4 py-4 font-bold text-gray-800">{{ product.name }}</td>
                    <td class="px-4 py-4 text-gray-500">{{ product.category }}</td>
                    <td class="px-4 py-4 text-right font-bold text-gray-800">{{ product.stock.toLocaleString() }}</td>
                    <td class="px-4 py-4 text-right text-gray-600">₩{{ product.unitPrice.toLocaleString() }}</td>
                    <td class="px-4 py-4 text-center">
                      <button type="button" class="bg-[#004D3C] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#003d30]" @click="addToCart(product)">
                        장바구니 담기
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <aside class="flex flex-col gap-3">
            <article class="border border-gray-300 bg-white shadow-sm">
              <div class="border-b border-gray-200 px-5 py-4">
                <h2 class="inline-flex items-center gap-2 text-sm font-bold text-gray-800">
                  <AlertCircle :size="16" class="text-amber-600" />
                  추천 주문량
                </h2>
                <p class="mt-1 text-xs text-gray-500">카드를 클릭하면 추천 수량이 장바구니에 자동 반영됩니다.</p>
              </div>
              <div class="space-y-3 p-4">
                <button
                  v-for="item in recommendations"
                  :key="item.id"
                  type="button"
                  class="w-full border border-gray-200 bg-gray-50 p-4 text-left hover:border-[#004D3C] hover:bg-[#E6F2F0]"
                  @click="applyRecommendation(item)"
                >
                  <p class="font-bold text-gray-800">{{ item.name }}</p>
                  <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <span>현재 {{ item.currentStock }}개</span>
                    <span>안전 {{ item.safetyStock }}개</span>
                    <span class="font-bold text-[#004D3C]">추천 {{ item.recommendedQty }}개</span>
                    <span>소진 {{ item.expectedRunout }}</span>
                  </div>
                </button>
              </div>
            </article>

            <article class="border border-gray-300 bg-white shadow-sm">
              <div class="flex h-14 items-center justify-between border-b border-gray-200 px-5">
                <h2 class="inline-flex items-center gap-2 text-sm font-bold text-gray-800">
                  <ShoppingCart :size="16" />
                  주문 장바구니
                </h2>
                <span class="text-xs font-bold text-gray-500">{{ cart.length }}개 품목</span>
              </div>
              <div class="divide-y divide-gray-100">
                <div v-for="item in cart" :key="item.id" class="px-5 py-4">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="font-bold text-gray-800">{{ item.name }}</p>
                      <p class="mt-1 text-xs text-gray-500">₩{{ item.unitPrice.toLocaleString() }}</p>
                    </div>
                    <button type="button" class="text-xs font-bold text-red-600" @click="removeCartItem(item.id)">삭제</button>
                  </div>
                  <input
                    type="number"
                    min="1"
                    :value="item.qty"
                    class="mt-3 w-24 border border-gray-300 px-2 py-1 text-right text-sm outline-none focus:border-[#004D3C]"
                    @input="updateCartQty(item, $event.target.value)"
                  />
                </div>
                <p v-if="cart.length === 0" class="px-5 py-10 text-center text-sm text-gray-400">장바구니가 비어 있습니다.</p>
              </div>
              <div class="border-t border-gray-200 p-5">
                <div class="flex items-center justify-between text-sm">
                  <span class="font-bold text-gray-500">예상 금액</span>
                  <span class="font-black text-gray-900">₩{{ cartTotal.toLocaleString() }}</span>
                </div>
                <button type="button" class="mt-4 w-full bg-[#004D3C] px-4 py-2.5 text-sm font-bold text-white disabled:bg-gray-200 disabled:text-gray-400" :disabled="cart.length === 0" @click="openRequestForm">
                  주문 요청서 작성
                </button>
              </div>
            </article>
          </aside>
        </section>

        <section v-if="showRequestForm" class="border border-gray-300 bg-white shadow-sm">
          <div class="flex h-14 items-center border-b border-gray-200 px-5">
            <h2 class="inline-flex items-center gap-2 text-sm font-bold text-gray-800">
              <FileText :size="16" />
              주문 요청서
            </h2>
          </div>
          <div class="grid gap-3 p-5 xl:grid-cols-[1fr_320px]">
            <div class="overflow-auto">
              <table class="w-full min-w-[720px] text-sm">
                <thead class="bg-gray-100 text-xs text-gray-500">
                  <tr>
                    <th class="px-4 py-3 text-left font-bold">품목</th>
                    <th class="px-4 py-3 text-right font-bold">단가</th>
                    <th class="px-4 py-3 text-center font-bold">요청 수량</th>
                    <th class="px-4 py-3 text-right font-bold">금액</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="item in cart" :key="item.id">
                    <td class="px-4 py-4 font-bold text-gray-800">{{ item.name }}</td>
                    <td class="px-4 py-4 text-right text-gray-600">₩{{ item.unitPrice.toLocaleString() }}</td>
                    <td class="px-4 py-4 text-center">
                      <input
                        type="number"
                        min="1"
                        :value="item.qty"
                        class="w-24 border border-gray-300 px-2 py-1 text-right outline-none focus:border-[#004D3C]"
                        @input="updateCartQty(item, $event.target.value)"
                      />
                    </td>
                    <td class="px-4 py-4 text-right font-bold text-gray-900">₩{{ (item.qty * item.unitPrice).toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <aside class="space-y-4">
              <label class="block">
                <span class="text-xs font-bold text-gray-500">희망 입고일</span>
                <input v-model="desiredDate" type="date" class="mt-2 w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#004D3C]" />
              </label>
              <label class="block">
                <span class="text-xs font-bold text-gray-500">요청 메모</span>
                <textarea v-model="requestMemo" class="mt-2 min-h-28 w-full resize-none border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#004D3C]" />
              </label>
              <div class="border border-gray-200 bg-gray-50 p-4">
                <p class="text-xs font-bold text-gray-500">총 요청 금액</p>
                <p class="mt-2 text-2xl font-black text-gray-900">₩{{ cartTotal.toLocaleString() }}</p>
              </div>
              <button type="button" class="w-full bg-[#004D3C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#003d30]" @click="submitOrderRequest">
                최종 주문 요청
              </button>
            </aside>
          </div>
        </section>
      </template>

      <template v-else>
        <section class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_420px]">
          <article class="overflow-hidden border border-gray-300 bg-white shadow-sm">
            <table class="w-full min-w-[860px] text-sm">
              <thead class="border-b border-gray-200 bg-gray-100 text-xs text-gray-500">
                <tr>
                  <th class="px-4 py-3 text-left font-bold">주문 번호</th>
                  <th class="px-4 py-3 text-left font-bold">요청일</th>
                  <th class="px-4 py-3 text-left font-bold">대표 품목</th>
                  <th class="px-4 py-3 text-center font-bold">품목 수</th>
                  <th class="px-4 py-3 text-center font-bold">상태</th>
                  <th class="px-4 py-3 text-left font-bold">희망 입고일</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="order in orders"
                  :key="order.id"
                  class="cursor-pointer hover:bg-gray-50"
                  :class="selectedOrder?.id === order.id ? 'bg-[#E6F2F0]' : ''"
                  @click="selectOrder(order)"
                >
                  <td class="px-4 py-4 font-bold text-gray-800">{{ order.id }}</td>
                  <td class="px-4 py-4 text-gray-500">{{ order.requestedAt }}</td>
                  <td class="px-4 py-4 text-gray-700">{{ order.items[0]?.name }}</td>
                  <td class="px-4 py-4 text-center font-bold text-gray-800">{{ order.items.length }}</td>
                  <td class="px-4 py-4 text-center"><span class="px-2 py-1 text-xs font-bold" :class="statusClass(order.status)">{{ order.status }}</span></td>
                  <td class="px-4 py-4 text-gray-500">{{ order.desiredDate }}</td>
                </tr>
              </tbody>
            </table>
          </article>

          <aside class="border border-gray-300 bg-white shadow-sm">
            <div class="flex h-14 items-center justify-between border-b border-gray-200 px-5">
              <h2 class="text-sm font-bold text-gray-800">주문 상세 내역</h2>
              <span v-if="selectedOrder" class="px-2 py-1 text-xs font-bold" :class="statusClass(selectedOrder.status)">{{ selectedOrder.status }}</span>
            </div>

            <div v-if="selectedOrder" class="space-y-5 p-5">
              <div>
                <p class="text-xs font-bold text-gray-500">주문 번호</p>
                <p class="mt-1 font-bold text-gray-900">{{ selectedOrder.id }}</p>
              </div>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div><p class="text-xs font-bold text-gray-500">요청일</p><p class="mt-1 text-gray-800">{{ selectedOrder.requestedAt }}</p></div>
                <div><p class="text-xs font-bold text-gray-500">희망 입고일</p><p class="mt-1 text-gray-800">{{ selectedOrder.desiredDate }}</p></div>
              </div>

              <div class="space-y-2">
                <div v-for="item in (editDraft?.id === selectedOrder.id ? editDraft.items : selectedOrder.items)" :key="item.id" class="border border-gray-200 p-3">
                  <p class="font-bold text-gray-800">{{ item.name }}</p>
                  <div class="mt-2 flex items-center justify-between gap-3 text-sm text-gray-500">
                    <span>₩{{ item.unitPrice.toLocaleString() }}</span>
                    <input
                      v-if="editDraft?.id === selectedOrder.id"
                      type="number"
                      min="1"
                      :value="item.qty"
                      class="w-20 border border-gray-300 px-2 py-1 text-right outline-none focus:border-[#004D3C]"
                      @input="updateEditQty(item, $event.target.value)"
                    />
                    <span v-else class="font-bold text-gray-800">{{ item.qty }}개</span>
                  </div>
                </div>
              </div>

              <div class="border border-gray-200 bg-gray-50 p-4">
                <p class="text-xs font-bold text-gray-500">총 금액</p>
                <p class="mt-2 text-2xl font-black text-gray-900">₩{{ orderTotal(editDraft?.id === selectedOrder.id ? editDraft : selectedOrder).toLocaleString() }}</p>
              </div>

              <div class="flex gap-2">
                <button
                  v-if="!editDraft"
                  type="button"
                  class="flex-1 border border-[#004D3C] px-4 py-2 text-sm font-bold text-[#004D3C] disabled:border-gray-200 disabled:text-gray-400"
                  :disabled="selectedOrder.status !== '대기'"
                  @click="startEdit(selectedOrder)"
                >
                  수정
                </button>
                <button v-else type="button" class="flex-1 bg-[#004D3C] px-4 py-2 text-sm font-bold text-white" @click="saveEdit">수정 저장</button>
                <button
                  type="button"
                  class="flex-1 border border-red-300 px-4 py-2 text-sm font-bold text-red-600 disabled:border-gray-200 disabled:text-gray-400"
                  :disabled="selectedOrder.status !== '대기'"
                  @click="cancelOrder(selectedOrder)"
                >
                  주문 취소
                </button>
              </div>
            </div>

            <div v-else class="px-5 py-16 text-center text-sm text-gray-400">주문 목록에서 항목을 선택해 주세요.</div>
          </aside>
        </section>
      </template>
    </div>
  </AppLayout>
</template>
