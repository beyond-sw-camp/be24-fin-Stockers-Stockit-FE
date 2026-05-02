<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { getInfrastructureByCode, updateInfrastructure } from '@/api/infrastructure.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

const activeTopMenu = computed(() => '인프라 관리')
const activeSideMenu = ref('매장 정보 관리')
const infraSideMenus = [
  { label: '매장 정보 관리', icon: 'store' },
  { label: '창고 정보 관리', icon: 'warehouse' },
]

const store = ref(null)
const isLoading = ref(false)
const loadError = ref('')

const isEditMode = ref(false)
const isSaving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')
const editForm = ref({
  managerName: '',
  contact: '',
  status: 'ACTIVE',
})

const statusToKor = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  SUSPENDED: '점검중',
}

const typeToKor = {
  DIRECT: '직영점',
  FRANCHISE: '가맹점',
}

const statusOptions = [
  { value: 'ACTIVE', label: '활성' },
  { value: 'INACTIVE', label: '비활성' },
  { value: 'SUSPENDED', label: '점검중' },
]

const storeCode = computed(() => String(route.params.storeId ?? '').trim())

const backQuery = computed(() => ({
  region: typeof route.query.region === 'string' ? route.query.region : undefined,
  status: typeof route.query.status === 'string' ? route.query.status : undefined,
  search: typeof route.query.search === 'string' ? route.query.search : undefined,
}))

function resetEditForm() {
  if (!store.value) return
  editForm.value = {
    managerName: store.value.managerName || '',
    contact: store.value.contact || '',
    status: store.value.status || 'ACTIVE',
  }
}

function startEdit() {
  resetEditForm()
  saveError.value = ''
  saveSuccess.value = ''
  isEditMode.value = true
}

function cancelEdit() {
  resetEditForm()
  saveError.value = ''
  isEditMode.value = false
}

async function loadStoreDetail() {
  isLoading.value = true
  loadError.value = ''
  try {
    const found = await getInfrastructureByCode(storeCode.value)
    store.value = found || null
    resetEditForm()
  } catch (error) {
    loadError.value = error.message || '매장 정보를 불러오지 못했습니다.'
    store.value = null
  } finally {
    isLoading.value = false
  }
}

async function saveEdit() {
  if (!store.value || isSaving.value) return
  saveError.value = ''
  saveSuccess.value = ''

  const managerName = editForm.value.managerName.trim()
  const contact = editForm.value.contact.trim()

  if (!managerName || !contact) {
    saveError.value = '담당자와 연락처를 입력해주세요.'
    return
  }

  isSaving.value = true
  try {
    await updateInfrastructure(store.value.code, {
      locationType: 'STORE',
      name: store.value.name,
      region: store.value.region,
      storeType: store.value.storeType,
      managerName,
      contact,
      address: store.value.address,
      mappedWarehouseCode: store.value.mappedWarehouseCode,
      status: editForm.value.status,
    })

    isEditMode.value = false
    saveSuccess.value = '매장 정보가 저장되었습니다.'
    await loadStoreDetail()
  } catch (error) {
    saveError.value = error.message || '매장 정보 저장에 실패했습니다.'
  } finally {
    isSaving.value = false
  }
}

function goBack() {
  router.push({
    name: 'hq-infrastructure',
    query: backQuery.value,
  })
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  loadStoreDetail()
})
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="infraSideMenus"
    v-model:active-side-menu="activeSideMenu"
    show-system-card
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Store Detail</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">매장 상세 정보</h1>
            <template v-if="store">
              <p class="mt-2 text-sm font-bold text-gray-700">{{ store.name }}</p>
              <p class="mt-1 text-xs font-bold text-gray-500">
                {{ store.code }} · {{ store.region }}
              </p>
            </template>
          </div>
          <button
            type="button"
            class="h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 hover:bg-gray-50"
            @click="goBack"
          >
            목록으로
          </button>
        </div>
      </section>

      <p v-if="loadError" class="border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{{ loadError }}</p>

      <section v-if="isLoading" class="border border-gray-300 bg-white p-10 text-center text-sm font-bold text-gray-400 shadow-sm">
        매장 정보를 불러오는 중입니다.
      </section>

      <section v-else-if="store" class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-xs font-black uppercase tracking-[0.1em] text-gray-500">기본 정보</h2>
          <div class="flex items-center gap-2">
            <button
              v-if="!isEditMode"
              type="button"
              class="h-8 border border-gray-300 bg-white px-3 text-[11px] font-black text-gray-700 hover:bg-gray-50"
              @click="startEdit"
            >
              편집
            </button>
            <template v-else>
              <button
                type="button"
                class="h-8 border border-gray-300 bg-white px-3 text-[11px] font-black text-gray-700 hover:bg-gray-50"
                :disabled="isSaving"
                @click="cancelEdit"
              >
                취소
              </button>
              <button
                type="button"
                class="h-8 border border-[#004D3C] bg-[#004D3C] px-3 text-[11px] font-black text-white hover:bg-[#003d30] disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="isSaving"
                @click="saveEdit"
              >
                {{ isSaving ? '저장 중...' : '저장' }}
              </button>
            </template>
          </div>
        </div>

        <p v-if="saveError" class="mt-3 border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600">{{ saveError }}</p>
        <p v-if="saveSuccess" class="mt-3 border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">{{ saveSuccess }}</p>

        <div class="mt-3 grid gap-2 text-xs">
          <p class="flex items-center justify-between"><span class="font-bold text-gray-500">매장 코드</span><strong class="font-black text-gray-900">{{ store.code }}</strong></p>
          <p class="flex items-center justify-between"><span class="font-bold text-gray-500">매장명</span><strong class="font-black text-gray-900">{{ store.name }}</strong></p>
          <p class="flex items-center justify-between"><span class="font-bold text-gray-500">지역</span><strong class="font-black text-gray-900">{{ store.region }}</strong></p>
          <p class="flex items-center justify-between"><span class="font-bold text-gray-500">유형</span><strong class="font-black text-gray-900">{{ typeToKor[store.storeType] || store.storeType }}</strong></p>

          <template v-if="!isEditMode">
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">담당자</span><strong class="font-black text-gray-900">{{ store.managerName }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">연락처</span><strong class="font-black text-gray-900">{{ store.contact }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">상태</span><strong class="font-black text-gray-900">{{ statusToKor[store.status] || store.status }}</strong></p>
          </template>

          <template v-else>
            <label class="grid gap-1">
              <span class="font-bold text-gray-500">담당자</span>
              <input
                v-model="editForm.managerName"
                type="text"
                class="h-8 border border-gray-300 bg-white px-2 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              />
            </label>
            <label class="grid gap-1">
              <span class="font-bold text-gray-500">연락처</span>
              <input
                v-model="editForm.contact"
                type="text"
                class="h-8 border border-gray-300 bg-white px-2 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              />
            </label>
            <label class="grid gap-1">
              <span class="font-bold text-gray-500">상태</span>
              <select
                v-model="editForm.status"
                class="h-8 border border-gray-300 bg-white px-2 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              >
                <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
          </template>

          <p class="flex items-center justify-between"><span class="font-bold text-gray-500">담당 창고</span><strong class="font-black text-gray-900">{{ store.mappedWarehouseCode }}</strong></p>
          <p class="flex items-start justify-between gap-3"><span class="font-bold text-gray-500">주소</span><strong class="text-right font-black text-gray-900">{{ store.address }}</strong></p>
        </div>
      </section>

      <section v-else class="border border-dashed border-gray-300 bg-white p-10 text-center text-sm font-bold text-gray-400 shadow-sm">
        존재하지 않는 매장입니다.
      </section>
    </div>
  </AppLayout>
</template>
