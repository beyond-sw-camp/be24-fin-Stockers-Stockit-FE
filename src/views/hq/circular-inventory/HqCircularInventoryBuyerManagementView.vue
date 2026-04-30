<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCircularInventoryBuyerStore } from '@/stores/circularInventoryBuyers.js'

const router = useRouter()
const auth = useAuthStore()
const buyerStore = useCircularInventoryBuyerStore()

const hqMenus = roleMenus.hq
const circularInventoryMenus =
  roleMenus.hq.find((menu) => menu.label === '순환 재고 관리')?.children ?? []

const activeTopMenu = computed(() => '순환 재고 관리')
const activeSideMenu = ref('순환 재고 거래처 관리')

const searchKeyword = ref('')
const materialFitFilter = ref('')
const selectedBuyerId = ref('')
const panelMode = ref('create')
const browseMode = ref('card')
const productKeywordInput = ref('')
const toastMessage = ref('')
const toastTone = ref('success')

const emptyForm = () => buyerStore.createEmptyBuyerForm()
const form = ref(emptyForm())
const errors = ref({})

const displayedBuyers = computed(() =>
  buyerStore.filteredBuyers(searchKeyword.value, {
    primaryMaterialFit: materialFitFilter.value,
  }),
)

const selectedBuyer = computed(() => buyerStore.getBuyerById(selectedBuyerId.value) ?? null)

const buyerStats = computed(() => {
  const buyers = buyerStore.sortedBuyers
  return {
    total: buyers.length,
    natural: buyers.filter((buyer) => buyer.primaryMaterialFit === 'natural-single').length,
    synthetic: buyers.filter((buyer) => buyer.primaryMaterialFit === 'synthetic').length,
    blended: buyers.filter((buyer) => buyer.primaryMaterialFit === 'blended').length,
  }
})

const panelTitle = computed(() => {
  if (panelMode.value === 'create') return '새 거래처 등록'
  if (panelMode.value === 'edit') return '거래처 정보 수정'
  return '거래처 상세 정보'
})

const panelCaption = computed(() => {
  if (panelMode.value === 'create') {
    return '소재 적합도와 산업군을 기준으로 순환 재고 판매 대상 거래처를 등록합니다.'
  }
  if (panelMode.value === 'edit') {
    return '거래처 정보와 생산품 키워드, 생산품 메모를 수정해 판매 등록 화면에서 바로 사용할 수 있게 정리합니다.'
  }
  return '선택한 거래처 정보를 읽기 전용으로 확인한 뒤, 필요할 때만 수정 모드로 전환합니다.'
})

function resetForm() {
  form.value = emptyForm()
  productKeywordInput.value = ''
  errors.value = {}
}

function fillFormFromBuyer(buyer) {
  form.value = {
    code: buyer.code,
    companyName: buyer.companyName,
    industryGroup: buyer.industryGroup,
    productTypes: [...(buyer.productTypes ?? [])],
    productNote: buyer.productNote ?? '',
    description: buyer.description,
    primaryMaterialFit: buyer.primaryMaterialFit,
    managerName: buyer.managerName,
    phone: buyer.phone,
  }
  productKeywordInput.value = ''
}

function addProductKeyword() {
  const nextKeyword = productKeywordInput.value.trim()
  if (!nextKeyword) return
  if (!form.value.productTypes.includes(nextKeyword)) {
    form.value.productTypes = [...form.value.productTypes, nextKeyword]
  }
  productKeywordInput.value = ''
}

function removeProductKeyword(keyword) {
  form.value.productTypes = form.value.productTypes.filter((item) => item !== keyword)
}

function handleCreateNew() {
  panelMode.value = 'create'
  selectedBuyerId.value = ''
  resetForm()
}

function handleSelectBuyer(id) {
  const buyer = buyerStore.getBuyerById(id)
  if (!buyer) return

  selectedBuyerId.value = id
  panelMode.value = 'detail'
  fillFormFromBuyer(buyer)
  errors.value = {}
}

function enterEditMode() {
  if (!selectedBuyer.value) return
  panelMode.value = 'edit'
  fillFormFromBuyer(selectedBuyer.value)
  errors.value = {}
}

function cancelEditMode() {
  errors.value = {}

  if (selectedBuyer.value) {
    panelMode.value = 'detail'
    fillFormFromBuyer(selectedBuyer.value)
    return
  }

  panelMode.value = 'create'
  resetForm()
}

async function submitForm() {
  const result =
    panelMode.value === 'create'
      ? await buyerStore.createBuyer(form.value)
      : await buyerStore.updateBuyer(selectedBuyerId.value, form.value)

  if (!result.success) {
    errors.value = result.errors ?? {}
    toastMessage.value = result.message
    toastTone.value = 'error'
    return
  }

  errors.value = {}
  toastMessage.value =
    panelMode.value === 'create'
      ? '순환재고 거래처를 등록했습니다.'
      : '순환재고 거래처 정보를 수정했습니다.'
  toastTone.value = 'success'
  handleSelectBuyer(result.buyer.id)
}

function materialFitBadgeClass(value) {
  if (value === 'natural-single') return 'bg-[#e5f4ec] text-[#1b6a47]'
  if (value === 'synthetic') return 'bg-[#e7eefb] text-[#2f578f]'
  if (value === 'blended') return 'bg-[#f9eadb] text-[#9b5d1b]'
  return 'bg-gray-100 text-gray-500'
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="circularInventoryMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-5">
      <section
        class="overflow-hidden border border-[#d7e3dd] bg-[linear-gradient(135deg,#f8f4ec_0%,#f4faf7_45%,#eef6f2_100%)] shadow-sm"
      >
        <div class="grid gap-5 px-5 py-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[#6d7f76]">
              Circular Buyer Studio
            </p>
            <h1 class="mt-2 text-2xl font-black text-[#19352c]">순환재고 거래처 관리</h1>
            <p class="mt-2 max-w-2xl text-sm font-bold leading-6 text-[#5d6f67]">
              소재 성향과 산업군을 기준으로 순환재고 판매 거래처를 정리하고, 판매 등록
              화면에서 바로 연결할 수 있는 전용 거래처 정보를 관리합니다.
            </p>

            <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article class="border border-[#d6e6dd] bg-white/80 px-4 py-4 backdrop-blur">
                <p class="text-[10px] font-black uppercase tracking-[0.16em] text-[#7c8d84]">
                  Total Buyers
                </p>
                <p class="mt-2 text-2xl font-black text-[#19352c]">{{ buyerStats.total }}</p>
                <p class="mt-1 text-[11px] font-bold text-[#7c8d84]">등록된 전체 거래처</p>
              </article>
              <article class="border border-[#d6e6dd] bg-white/80 px-4 py-4 backdrop-blur">
                <p class="text-[10px] font-black uppercase tracking-[0.16em] text-[#7c8d84]">
                  Natural
                </p>
                <p class="mt-2 text-2xl font-black text-[#1b6a47]">{{ buyerStats.natural }}</p>
                <p class="mt-1 text-[11px] font-bold text-[#7c8d84]">천연 단일 섬유 적합</p>
              </article>
              <article class="border border-[#d6e6dd] bg-white/80 px-4 py-4 backdrop-blur">
                <p class="text-[10px] font-black uppercase tracking-[0.16em] text-[#7c8d84]">
                  Synthetic
                </p>
                <p class="mt-2 text-2xl font-black text-[#2f578f]">{{ buyerStats.synthetic }}</p>
                <p class="mt-1 text-[11px] font-bold text-[#7c8d84]">합성 섬유 적합</p>
              </article>
              <article class="border border-[#d6e6dd] bg-white/80 px-4 py-4 backdrop-blur">
                <p class="text-[10px] font-black uppercase tracking-[0.16em] text-[#7c8d84]">
                  Blended
                </p>
                <p class="mt-2 text-2xl font-black text-[#9b5d1b]">{{ buyerStats.blended }}</p>
                <p class="mt-1 text-[11px] font-bold text-[#7c8d84]">혼방 적합</p>
              </article>
            </div>
          </div>

          <div
            class="flex flex-col justify-between border border-[#d7e3dd] bg-white/75 p-4 backdrop-blur"
          >
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.16em] text-[#7c8d84]">
                Working Rule
              </p>
              <p class="mt-2 text-sm font-black text-[#19352c]">
                AI 추천은 아직 포함하지 않습니다.
              </p>
              <p class="mt-2 text-xs font-bold leading-5 text-[#65776d]">
                이번 단계에서는 거래처 자체 정보를 먼저 정돈하고, 이후 순환재고 품목 선택
                시 어떤 거래처와 잘 맞는지 추천하는 기능으로 확장할 수 있게 기반만 맞춥니다.
              </p>
            </div>

            <button
              type="button"
              class="mt-5 h-11 border border-[#d8e4df] bg-[#19352c] px-4 text-sm font-black text-white transition hover:bg-[#10261f]"
              @click="handleCreateNew"
            >
              + 새 거래처 등록 시작
            </button>
          </div>
        </div>
      </section>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,0.55fr)_minmax(24rem,0.45fr)]">
        <section class="min-w-0 border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-5 py-4">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                  Buyer Library
                </p>
                <h2 class="mt-1 text-lg font-black text-gray-900">거래처 목록</h2>
                <p class="mt-1 text-xs font-bold text-gray-500">
                  업체명, 담당자, 거래처 코드로 빠르게 찾고 소재 적합도에 따라 정리할 수
                  있습니다.
                </p>
              </div>
              <div class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
                <span>검색 결과</span>
                <span class="bg-gray-100 px-2 py-1 font-black text-gray-900"
                  >{{ displayedBuyers.length }}건</span
                >
              </div>
            </div>

            <div class="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem_auto]">
              <input
                v-model="searchKeyword"
                type="search"
                placeholder="업체명, 거래처 코드, 담당자명"
                class="h-11 border border-gray-300 bg-[#fafaf8] px-3 text-sm font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#19352c] focus:bg-white"
              />

              <select
                v-model="materialFitFilter"
                class="h-11 border border-gray-300 bg-[#fafaf8] px-3 text-sm font-bold text-gray-900 outline-none focus:border-[#19352c] focus:bg-white"
              >
                <option value="">전체 소재 적합도</option>
                <option
                  v-for="option in buyerStore.MATERIAL_FIT_OPTIONS"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>

              <div class="flex overflow-hidden border border-gray-300 bg-white">
                <button
                  type="button"
                  class="flex h-11 w-12 items-center justify-center transition"
                  :class="
                    browseMode === 'card'
                      ? 'bg-[#19352c] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  "
                  @click="browseMode = 'card'"
                  aria-label="카드형 보기"
                  title="카드형 보기"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
                    <path d="M3 3h6v6H3V3Zm8 0h6v6h-6V3ZM3 11h6v6H3v-6Zm8 0h6v6h-6v-6Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="flex h-11 w-12 items-center justify-center transition"
                  :class="
                    browseMode === 'list'
                      ? 'bg-[#19352c] text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  "
                  @click="browseMode = 'list'"
                  aria-label="리스트형 보기"
                  title="리스트형 보기"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
                    <path
                      d="M3 4.5A1.5 1.5 0 1 1 6 4.5a1.5 1.5 0 0 1-3 0Zm4 1h10v-2H7v2Zm-4 5A1.5 1.5 0 1 1 6 10.5 1.5 1.5 0 0 1 3 10.5Zm4 1h10v-2H7v2Zm-4 5A1.5 1.5 0 1 1 6 15.5 1.5 1.5 0 0 1 3 15.5Zm4 1h10v-2H7v2Z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div v-if="browseMode === 'card'" class="grid gap-4 p-5 md:grid-cols-2">
            <button
              v-for="buyer in displayedBuyers"
              :key="buyer.id"
              type="button"
              class="group border p-4 text-left transition-all duration-150"
              :class="
                selectedBuyerId === buyer.id
                  ? ['border-[#19352c]', 'bg-[#f6fbf8]', 'shadow-[0_12px_28px_rgba(25,53,44,0.08)]']
                  : [
                      'border-gray-200',
                      'bg-white',
                      'hover:-translate-y-[1px]',
                      'hover:border-[#cfd9d4]',
                      'hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]',
                    ]
              "
              @click="handleSelectBuyer(buyer.id)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-[12px] font-black tracking-[0.08em] text-gray-400">
                    {{ buyer.code }}
                  </p>
                  <h3 class="mt-2 text-base font-black text-gray-900">{{ buyer.companyName }}</h3>
                </div>
                <span
                  class="shrink-0 px-2.5 py-1 text-[10px] font-black"
                  :class="materialFitBadgeClass(buyer.primaryMaterialFit)"
                >
                  {{ buyerStore.materialFitLabel(buyer.primaryMaterialFit) }}
                </span>
              </div>

              <p class="mt-3 text-[12px] font-bold text-gray-600">{{ buyer.industryGroup }}</p>
              <p class="mt-2 line-clamp-2 text-[12px] font-bold leading-5 text-gray-500">
                {{ buyer.description }}
              </p>

              <div class="mt-4 flex flex-wrap gap-2">
                <span
                  v-for="product in buyer.productTypes.slice(0, 3)"
                  :key="product"
                  class="rounded-full bg-[#f3f5f3] px-2.5 py-1 text-[10px] font-black text-gray-600"
                >
                  {{ product }}
                </span>
                <span
                  v-if="buyer.productTypes.length > 3"
                  class="rounded-full bg-[#f3f5f3] px-2.5 py-1 text-[10px] font-black text-gray-500"
                >
                  +{{ buyer.productTypes.length - 3 }}
                </span>
              </div>

              <div class="mt-5 flex items-center justify-between text-[11px]">
                <span class="font-bold text-gray-500">{{ buyer.managerName }}</span>
                <span class="font-black text-gray-700">{{ buyer.phone }}</span>
              </div>
            </button>

            <div
              v-if="displayedBuyers.length === 0"
              class="border border-dashed border-gray-200 bg-[#fafaf8] px-6 py-16 text-center md:col-span-2"
            >
              <p class="text-sm font-black text-gray-900">조건에 맞는 거래처가 없습니다.</p>
              <p class="mt-2 text-xs font-bold text-gray-400">
                검색어를 바꾸거나 새 거래처를 등록해보세요.
              </p>
            </div>
          </div>

          <div v-else class="p-5">
            <div class="overflow-hidden border border-gray-200">
              <table class="w-full border-collapse text-left text-sm">
                <thead class="bg-[#f7f8f6] text-[11px] uppercase tracking-[0.12em] text-gray-500">
                  <tr>
                    <th class="px-4 py-3 font-black">업체명</th>
                    <th class="px-4 py-3 font-black">산업군</th>
                    <th class="px-4 py-3 font-black">대표 소재</th>
                    <th class="px-4 py-3 font-black">담당자</th>
                    <th class="px-4 py-3 font-black">연락처</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr
                    v-for="buyer in displayedBuyers"
                    :key="buyer.id"
                    class="cursor-pointer transition hover:bg-[#f8fbf9]"
                    :class="selectedBuyerId === buyer.id ? 'bg-[#f6fbf8]' : ''"
                    @click="handleSelectBuyer(buyer.id)"
                  >
                    <td class="px-4 py-3">
                      <p class="font-black text-gray-900">{{ buyer.companyName }}</p>
                      <p class="mt-1 text-[11px] font-bold text-gray-400">{{ buyer.code }}</p>
                    </td>
                    <td class="px-4 py-3 font-bold text-gray-600">{{ buyer.industryGroup }}</td>
                    <td class="px-4 py-3">
                      <span
                        class="rounded-full px-2.5 py-1 text-[10px] font-black"
                        :class="materialFitBadgeClass(buyer.primaryMaterialFit)"
                      >
                        {{ buyerStore.materialFitLabel(buyer.primaryMaterialFit) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 font-bold text-gray-600">{{ buyer.managerName }}</td>
                    <td class="px-4 py-3 font-black text-gray-700">{{ buyer.phone }}</td>
                  </tr>
                  <tr v-if="displayedBuyers.length === 0">
                    <td colspan="5" class="px-4 py-16 text-center text-sm font-bold text-gray-400">
                      조건에 맞는 거래처가 없습니다.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="min-w-0 border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-5 py-4">
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
              Buyer Workspace
            </p>
            <h2 class="mt-1 text-lg font-black text-gray-900">{{ panelTitle }}</h2>
            <p class="mt-1 text-xs font-bold text-gray-500">{{ panelCaption }}</p>
          </div>

          <div v-if="panelMode === 'detail' && selectedBuyer" class="flex flex-col gap-4 p-5">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="text-[11px] font-black tracking-[0.14em] text-gray-400">거래처명</p>
                <h3 class="mt-2 text-2xl font-black text-gray-900">
                  {{ selectedBuyer.companyName }}
                </h3>
              </div>
              <button
                type="button"
                class="inline-flex h-9 items-center border border-[#c8d7d0] bg-white px-4 text-sm font-black text-[#19352c] transition hover:border-[#19352c] hover:bg-[#eef5f1]"
                @click="enterEditMode"
              >
                수정하기
              </button>
            </div>

            <section class="grid gap-3 md:grid-cols-3">
              <div class="border border-[#e5ece8] bg-white px-3 py-3">
                <p class="text-[11px] font-black text-gray-400">거래처 코드</p>
                <p class="mt-1 text-sm font-black text-gray-900">{{ selectedBuyer.code }}</p>
              </div>
              <div class="border border-[#e5ece8] bg-white px-3 py-3">
                <p class="text-[11px] font-black text-gray-400">산업군</p>
                <p class="mt-1 text-sm font-black text-gray-900">
                  {{ selectedBuyer.industryGroup }}
                </p>
              </div>
              <div class="border border-[#e5ece8] bg-white px-3 py-3">
                <p class="text-[11px] font-black text-gray-400">담당자 / 연락처</p>
                <p class="mt-1 text-sm font-black text-gray-900">{{ selectedBuyer.managerName }}</p>
                <p class="mt-1 text-sm font-bold text-gray-600">{{ selectedBuyer.phone }}</p>
              </div>
            </section>

            <section class="flex flex-col gap-4">
              <div class="grid gap-4 md:grid-cols-[minmax(0,0.3fr)_minmax(0,0.7fr)]">
                <div class="flex flex-col gap-2">
                  <p class="text-[11px] font-black tracking-[0.12em] text-gray-400">
                    대표 소재 적합도
                  </p>
                  <span
                    class="inline-flex w-fit px-2.5 py-1 text-[10px] font-black"
                    :class="materialFitBadgeClass(selectedBuyer.primaryMaterialFit)"
                  >
                    {{ buyerStore.materialFitLabel(selectedBuyer.primaryMaterialFit) }}
                  </span>
                </div>

                <div class="flex flex-col gap-2">
                  <p class="text-[11px] font-black tracking-[0.12em] text-gray-400">
                    취급 제품 / 생산품
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="product in selectedBuyer.productTypes"
                      :key="product"
                      class="bg-[#f3f5f3] px-2.5 py-1 text-[10px] font-black text-gray-700"
                    >
                      {{ product }}
                    </span>
                    <span
                      v-if="selectedBuyer.productTypes.length === 0"
                      class="text-xs font-bold text-gray-400"
                    >
                      등록된 생산품 정보가 없습니다.
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <p class="text-[11px] font-black tracking-[0.12em] text-gray-400">거래처 설명</p>
                <div class="border border-[#ecefed] bg-[#fafaf8] px-4 py-3">
                  <p class="text-sm font-bold leading-6 text-gray-700">
                    {{ selectedBuyer.description || '설명 없음' }}
                  </p>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <p class="text-[11px] font-black tracking-[0.12em] text-gray-400">생산품 메모</p>
                <div class="border border-[#ecefed] bg-[#fafaf8] px-4 py-3">
                  <p class="text-sm font-bold leading-6 text-gray-700">
                    {{ selectedBuyer.productNote || '메모 없음' }}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div v-else class="p-5">
            <form class="space-y-5" @submit.prevent="submitForm">
              <section class="grid gap-4 md:grid-cols-2">
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-gray-500">업체명</span>
                  <input
                    v-model="form.companyName"
                    type="text"
                    class="h-11 border border-gray-300 bg-[#fafaf8] px-3 text-sm font-bold text-gray-900 outline-none focus:border-[#19352c] focus:bg-white"
                  />
                  <span v-if="errors.companyName" class="text-[11px] font-bold text-red-500">{{
                    errors.companyName
                  }}</span>
                </label>

                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-gray-500">거래처 코드</span>
                  <input
                    v-model="form.code"
                    type="text"
                    class="h-11 border border-gray-300 bg-[#fafaf8] px-3 text-sm font-bold text-gray-900 outline-none focus:border-[#19352c] focus:bg-white"
                  />
                  <span v-if="errors.code" class="text-[11px] font-bold text-red-500">{{
                    errors.code
                  }}</span>
                </label>
              </section>

              <section class="grid gap-4 md:grid-cols-2">
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-gray-500">산업군</span>
                  <select
                    v-model="form.industryGroup"
                    class="h-11 border border-gray-300 bg-[#fafaf8] px-3 text-sm font-bold text-gray-900 outline-none focus:border-[#19352c] focus:bg-white"
                  >
                    <option value="">산업군 선택</option>
                    <option
                      v-for="industry in buyerStore.INDUSTRY_GROUP_OPTIONS"
                      :key="industry"
                      :value="industry"
                    >
                      {{ industry }}
                    </option>
                  </select>
                  <span v-if="errors.industryGroup" class="text-[11px] font-bold text-red-500">{{
                    errors.industryGroup
                  }}</span>
                </label>

                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-gray-500">대표 소재 적합도</span>
                  <select
                    v-model="form.primaryMaterialFit"
                    class="h-11 border border-gray-300 bg-[#fafaf8] px-3 text-sm font-bold text-gray-900 outline-none focus:border-[#19352c] focus:bg-white"
                  >
                    <option value="">소재 적합도 선택</option>
                    <option
                      v-for="option in buyerStore.MATERIAL_FIT_OPTIONS"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <span
                    v-if="errors.primaryMaterialFit"
                    class="text-[11px] font-bold text-red-500"
                    >{{ errors.primaryMaterialFit }}</span
                  >
                </label>
              </section>

              <div class="space-y-2">
                <span class="text-[11px] font-bold text-gray-500">취급 제품 / 생산품 키워드</span>
                <div class="flex gap-2">
                  <input
                    v-model="productKeywordInput"
                    type="text"
                    class="h-11 flex-1 border border-gray-300 bg-[#fafaf8] px-3 text-sm font-bold text-gray-900 outline-none focus:border-[#19352c] focus:bg-white"
                    placeholder="키워드를 입력하고 추가하세요"
                    @keydown.enter.prevent="addProductKeyword"
                  />
                  <button
                    type="button"
                    class="h-11 border border-[#19352c] px-4 text-sm font-black text-[#19352c] transition hover:bg-[#f4faf7]"
                    @click="addProductKeyword"
                  >
                    추가
                  </button>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="product in form.productTypes"
                    :key="product"
                    type="button"
                    class="inline-flex items-center gap-2 rounded-full bg-[#f4faf7] px-3 py-1.5 text-[11px] font-black text-[#19352c]"
                    @click="removeProductKeyword(product)"
                  >
                    <span>{{ product }}</span>
                    <span class="text-[10px]">X</span>
                  </button>
                  <span
                    v-if="form.productTypes.length === 0"
                    class="text-[11px] font-bold text-gray-400"
                  >
                    아직 추가된 키워드가 없습니다.
                  </span>
                </div>
              </div>

              <label class="flex flex-col gap-1.5">
                <span class="text-[11px] font-bold text-gray-500">생산품 메모</span>
                <textarea
                  v-model="form.productNote"
                  rows="4"
                  class="border border-gray-300 bg-[#fafaf8] px-3 py-3 text-sm font-bold text-gray-900 outline-none focus:border-[#19352c] focus:bg-white"
                  placeholder="주요 생산 방식, 주력 생산품, 사용 방향 등을 메모해두세요."
                />
              </label>

              <label class="flex flex-col gap-1.5">
                <span class="text-[11px] font-bold text-gray-500">거래처 설명</span>
                <textarea
                  v-model="form.description"
                  rows="5"
                  class="border border-gray-300 bg-[#fafaf8] px-3 py-3 text-sm font-bold text-gray-900 outline-none focus:border-[#19352c] focus:bg-white"
                />
              </label>

              <section class="grid gap-4 md:grid-cols-2">
                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-gray-500">담당자명</span>
                  <input
                    v-model="form.managerName"
                    type="text"
                    class="h-11 border border-gray-300 bg-[#fafaf8] px-3 text-sm font-bold text-gray-900 outline-none focus:border-[#19352c] focus:bg-white"
                  />
                  <span v-if="errors.managerName" class="text-[11px] font-bold text-red-500">{{
                    errors.managerName
                  }}</span>
                </label>

                <label class="flex flex-col gap-1.5">
                  <span class="text-[11px] font-bold text-gray-500">연락처</span>
                  <input
                    v-model="form.phone"
                    type="text"
                    class="h-11 border border-gray-300 bg-[#fafaf8] px-3 text-sm font-bold text-gray-900 outline-none focus:border-[#19352c] focus:bg-white"
                  />
                  <span v-if="errors.phone" class="text-[11px] font-bold text-red-500">{{
                    errors.phone
                  }}</span>
                </label>
              </section>

              <div class="flex items-center justify-end gap-2 pt-1">
                <button
                  v-if="panelMode === 'edit'"
                  type="button"
                  class="h-11 border border-gray-300 bg-white px-4 text-sm font-black text-gray-700 hover:bg-gray-50"
                  @click="cancelEditMode"
                >
                  수정 취소
                </button>
                <button
                  v-if="panelMode === 'create'"
                  type="button"
                  class="h-11 border border-gray-300 bg-white px-4 text-sm font-black text-gray-700 hover:bg-gray-50"
                  @click="handleCreateNew"
                >
                  초기화
                </button>
                <button
                  type="submit"
                  class="h-11 bg-[#19352c] px-5 text-sm font-black text-white transition hover:bg-[#10261f]"
                >
                  {{ panelMode === 'create' ? '거래처 등록' : '거래처 저장' }}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      <p
        v-if="toastMessage"
        class="fixed right-4 top-16 z-30 border px-4 py-2 text-sm font-black shadow-lg"
        :class="
          toastTone === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
        "
      >
        {{ toastMessage }}
      </p>
    </div>
  </AppLayout>
</template>
