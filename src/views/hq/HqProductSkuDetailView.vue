<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { deleteProductSku, getProductDetail, getProductSkus, updateProductSku } from '@/api/productMaster.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const hqMenus = roleMenus.hq
const productMenus = roleMenus.hq.find((menu) => menu.label === '상품 관리')?.children ?? []

const activeTopMenu = computed(() => '상품 관리')
const activeSideMenu = ref('제품 마스터')

const productCode = computed(() => String(route.params.productCode ?? ''))
const product = ref(null)
const skus = ref([])
const errorMessage = ref('')
const successMessage = ref('')
const editSkuCode = ref('')
const editForm = ref({ color: '', size: '', unitPrice: 0, status: 'ACTIVE' })

const statusLabel = {
  ACTIVE: '활성',
  SUSPENDED: '점검중',
  INACTIVE: '비활성',
}

function splitColorSize(value) {
  const [color, size] = String(value ?? '').split('|')
  return { color: color || '-', size: size || '-' }
}

function openEdit(sku) {
  const parsed = splitColorSize(sku.optionValue)
  editSkuCode.value = sku.skuCode
  editForm.value = {
    color: parsed.color,
    size: parsed.size,
    unitPrice: sku.unitPrice,
    status: sku.status,
  }
}

function cancelEdit() {
  editSkuCode.value = ''
}

async function loadSkus() {
  skus.value = await getProductSkus(productCode.value)
}

async function saveEdit(skuCode) {
  try {
    errorMessage.value = ''
    successMessage.value = ''
    await updateProductSku(skuCode, {
      optionName: 'COLOR_SIZE',
      optionValue: `${editForm.value.color}|${editForm.value.size}`,
      unitPrice: Number(editForm.value.unitPrice),
      status: editForm.value.status,
    })
    await loadSkus()
    cancelEdit()
    successMessage.value = 'SKU가 수정되었습니다.'
  } catch (e) {
    errorMessage.value = e.message
  }
}

async function removeSku(skuCode) {
  const ok = confirm('해당 SKU를 삭제할까요?')
  if (!ok) return
  try {
    errorMessage.value = ''
    successMessage.value = ''
    await deleteProductSku(skuCode)
    await loadSkus()
    successMessage.value = 'SKU가 삭제되었습니다.'
  } catch (e) {
    errorMessage.value = e.message
  }
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

function goBack() {
  router.push('/hq/products?tab=products')
}

async function init() {
  try {
    errorMessage.value = ''
    successMessage.value = ''
    const [productRes, ] = await Promise.all([
      getProductDetail(productCode.value),
    ])
    product.value = productRes
    await loadSkus()
  } catch (e) {
    errorMessage.value = e.message
  }
}

onMounted(() => {
  init()
})
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="productMenus"
    v-model:active-side-menu="activeSideMenu"
    show-system-card
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Product SKU</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">제품 SKU 상세</h1>
            <p class="mt-2 text-sm font-bold text-gray-700">{{ product?.name || '-' }}</p>
            <p class="mt-1 text-xs font-bold text-gray-500">{{ product?.code || productCode }} · {{ product?.categoryCode || '-' }}</p>
            <p class="mt-1 text-xs font-bold text-gray-500">기본단가: {{ product?.basePrice?.toLocaleString?.() || '-' }} / 상태: {{ statusLabel[product?.status] || product?.status || '-' }}</p>
          </div>
          <div class="flex gap-2">
            <button type="button" class="h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 hover:bg-gray-50" @click="goBack">목록으로</button>
            <button
              type="button"
              class="h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 hover:bg-gray-50"
              @click="router.push({ name: 'hq-product-edit', params: { productCode } })"
            >
              수정
            </button>
          </div>
        </div>
      </section>

      <p v-if="errorMessage" class="border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{{ errorMessage }}</p>
      <p v-if="successMessage" class="border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">{{ successMessage }}</p>

      <section class="overflow-hidden border border-gray-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1080px] border-collapse text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="w-[220px] px-4 py-3 text-left font-black">SKU 코드</th>
                <th class="w-[120px] px-4 py-3 text-left font-black">색상</th>
                <th class="w-[120px] px-4 py-3 text-left font-black">사이즈</th>
                <th class="w-[140px] px-4 py-3 text-right font-black">단가</th>
                <th class="w-[140px] px-4 py-3 text-left font-black">상태</th>
                <th class="w-[140px] px-4 py-3 text-center font-black">최종 수정일</th>
                <th class="w-[180px] px-4 py-3 text-center font-black">액션</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="sku in skus" :key="sku.skuCode">
                <td class="px-4 py-3 align-middle font-mono font-bold text-gray-600">{{ sku.skuCode }}</td>
                <td class="px-4 py-3 align-middle font-bold text-gray-800">
                  <input
                    v-if="editSkuCode === sku.skuCode"
                    v-model="editForm.color"
                    class="w-full max-w-[96px] border border-gray-300 px-2 py-1.5 text-xs"
                  />
                  <span v-else>{{ splitColorSize(sku.optionValue).color }}</span>
                </td>
                <td class="px-4 py-3 align-middle font-black text-gray-900">
                  <input
                    v-if="editSkuCode === sku.skuCode"
                    v-model="editForm.size"
                    class="w-full max-w-[88px] border border-gray-300 px-2 py-1.5 text-xs"
                  />
                  <span v-else>{{ splitColorSize(sku.optionValue).size }}</span>
                </td>
                <td class="px-4 py-3 align-middle text-right font-black text-gray-900">
                  <input
                    v-if="editSkuCode === sku.skuCode"
                    v-model.number="editForm.unitPrice"
                    type="number"
                    min="0"
                    class="w-full max-w-[120px] border border-gray-300 px-2 py-1.5 text-right text-xs"
                  />
                  <span v-else>{{ Number(sku.unitPrice).toLocaleString() }}</span>
                </td>
                <td class="px-4 py-3 align-middle font-bold text-gray-700">
                  <select v-if="editSkuCode === sku.skuCode" v-model="editForm.status" class="w-full max-w-[110px] border border-gray-300 px-2 py-1.5 text-xs">
                    <option value="ACTIVE">활성</option>
                    <option value="SUSPENDED">점검중</option>
                    <option value="INACTIVE">비활성</option>
                  </select>
                  <span v-else>{{ statusLabel[sku.status] || sku.status }}</span>
                </td>
                <td class="px-4 py-3 text-center align-middle font-bold text-gray-500">{{ sku.updatedAt ? new Date(sku.updatedAt).toISOString().slice(0, 10) : '-' }}</td>
                <td class="px-4 py-3 align-middle">
                  <div class="flex items-center justify-center gap-1.5">
                    <template v-if="editSkuCode === sku.skuCode">
                      <button type="button" class="min-w-[44px] border border-[#004D3C] bg-[#004D3C] px-2 py-1.5 text-[11px] font-bold text-white" @click="saveEdit(sku.skuCode)">저장</button>
                      <button type="button" class="min-w-[44px] border border-gray-300 px-2 py-1.5 text-[11px] font-bold text-gray-700" @click="cancelEdit">취소</button>
                    </template>
                    <template v-else>
                      <button type="button" class="min-w-[44px] border border-gray-300 px-2 py-1.5 text-[11px] font-bold text-gray-700" @click="openEdit(sku)">수정</button>
                      <button type="button" class="min-w-[44px] border border-red-300 bg-red-50 px-2 py-1.5 text-[11px] font-bold text-red-600" @click="removeSku(sku.skuCode)">삭제</button>
                    </template>
                  </div>
                </td>
              </tr>
              <tr v-if="skus.length === 0">
                <td colspan="7" class="px-3 py-6 text-center text-xs font-bold text-gray-400">등록된 SKU가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>
