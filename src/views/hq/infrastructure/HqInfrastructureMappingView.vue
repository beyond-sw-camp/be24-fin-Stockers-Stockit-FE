<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import {
  getInfrastructureMappingOptions,
  getStoreInfrastructureMappings,
  updateStoreInfrastructureMappings,
} from '@/api/hq/infrastructure.js'

const hqMenus = roleMenus.hq

const activeTopMenu = computed(() => '인프라 관리')
const activeSideMenu = ref('매장/창고 매핑 관리')
const infraSideMenus = [
  { label: '매장/창고 정보 관리', icon: 'store', path: '/hq/infrastructure' },
  { label: '매장/창고 매핑 관리', icon: 'warehouse', path: '/hq/infrastructure/mappings' },
]

const search = ref('')
const region = ref('전체 지역')
const status = ref('전체')
const loading = ref(false)
const errorMessage = ref('')
const saveMessage = ref('')
const rows = ref([])
const allRegionOptions = ref([])
const warehouseOptions = ref([])
const savingStoreCode = ref('')

const statusToKor = { ACTIVE: '활성', INACTIVE: '비활성', SUSPENDED: '점검중' }
const korToStatus = { 활성: 'ACTIVE', 비활성: 'INACTIVE', 점검중: 'SUSPENDED' }

const regionOptions = computed(() => ['전체 지역', ...allRegionOptions.value])

function warehouseOptionLabel(code) {
  if (!code) return ''
  const found = warehouseOptions.value.find((item) => item.code === code)
  if (!found) return code
  return `${found.code} · ${found.name}`
}


async function loadOptions() {
  const options = await getInfrastructureMappingOptions()
  warehouseOptions.value = options.warehouses || []
}

async function loadAllRegionOptions() {
  const list = await getStoreInfrastructureMappings({})
  const regions = [...new Set((list || []).map((row) => row.region).filter(Boolean))]
  allRegionOptions.value = regions.sort((a, b) => a.localeCompare(b, 'ko'))
  if (region.value !== '전체 지역' && !allRegionOptions.value.includes(region.value)) {
    region.value = '전체 지역'
  }
}

function normalizeRows(list) {
  return (list || []).map((row) => ({
    ...row,
    draftPrimaryWarehouseCode: row.primaryWarehouseCode || '',
    draftBackupWarehouseCode: row.backupWarehouseCode || '',
  }))
}

async function loadRows() {
  loading.value = true
  errorMessage.value = ''
  saveMessage.value = ''
  try {
    const params = {
      keyword: search.value || undefined,
      region: region.value === '전체 지역' ? undefined : region.value,
      status: status.value === '전체' ? undefined : korToStatus[status.value],
    }
    const list = await getStoreInfrastructureMappings(params)
    rows.value = normalizeRows(list)
  } catch (error) {
    errorMessage.value = error.message || '매핑 목록을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

function isDirty(row) {
  return row.draftPrimaryWarehouseCode !== (row.primaryWarehouseCode || '') || row.draftBackupWarehouseCode !== (row.backupWarehouseCode || '')
}

function validateRow(row) {
  if (!row.draftPrimaryWarehouseCode) return '주 창고를 선택해주세요.'
  if (row.draftBackupWarehouseCode && row.draftPrimaryWarehouseCode === row.draftBackupWarehouseCode) {
    return '주 창고와 예비 창고는 같을 수 없습니다.'
  }
  return ''
}

async function saveRow(row) {
  const validationError = validateRow(row)
  if (validationError) {
    errorMessage.value = `${row.storeName}: ${validationError}`
    return
  }
  savingStoreCode.value = row.storeCode
  errorMessage.value = ''
  saveMessage.value = ''
  try {
    const saved = await updateStoreInfrastructureMappings(row.storeCode, {
      primaryWarehouseCode: row.draftPrimaryWarehouseCode,
      backupWarehouseCode: row.draftBackupWarehouseCode || null,
    })
    const index = rows.value.findIndex((item) => item.storeCode === row.storeCode)
    if (index >= 0) {
      rows.value[index] = {
        ...rows.value[index],
        ...saved,
        draftPrimaryWarehouseCode: saved.primaryWarehouseCode || '',
        draftBackupWarehouseCode: saved.backupWarehouseCode || '',
      }
    }
    saveMessage.value = `${row.storeName} 매핑이 저장되었습니다.`
  } catch (error) {
    errorMessage.value = error.message || '매핑 저장에 실패했습니다.'
  } finally {
    savingStoreCode.value = ''
  }
}

watch([search, region, status], () => {
  loadRows()
})

onMounted(async () => {
  await loadOptions()
  await loadAllRegionOptions()
  await loadRows()
})
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="infraSideMenus"
    v-model:active-side-menu="activeSideMenu"
    show-system-card
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <h1 class="text-lg font-black text-gray-900">매장/창고 매핑 관리</h1>
        <p class="mt-1 text-xs font-bold text-gray-500">매장별 주 창고(PRIMARY)와 예비 창고(BACKUP)를 관리합니다.</p>

        <div class="mt-4 grid gap-2 md:grid-cols-4">
          <input v-model="search" type="text" placeholder="매장명/코드 검색" class="h-9 border border-gray-300 px-3 text-sm outline-none focus:border-[#004D3C]" />
          <select v-model="region" class="h-9 border border-gray-300 px-2 text-sm outline-none focus:border-[#004D3C]">
            <option v-for="item in regionOptions" :key="item" :value="item">{{ item }}</option>
          </select>
          <select v-model="status" class="h-9 border border-gray-300 px-2 text-sm outline-none focus:border-[#004D3C]">
            <option value="전체">전체</option>
            <option value="활성">활성</option>
            <option value="비활성">비활성</option>
            <option value="점검중">점검중</option>
          </select>
          <button type="button" class="h-9 border border-gray-300 bg-white px-3 text-xs font-black text-gray-700 hover:bg-gray-50" @click="loadRows">새로고침</button>
        </div>
      </section>

      <p v-if="errorMessage" class="border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{{ errorMessage }}</p>
      <p v-if="saveMessage" class="border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">{{ saveMessage }}</p>

      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div v-if="loading" class="py-8 text-center text-sm font-bold text-gray-400">매핑 목록을 불러오는 중입니다.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full border-collapse text-xs">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-50 text-left text-[11px] font-black uppercase tracking-[0.06em] text-gray-500">
                <th class="min-w-[12rem] px-3 py-2">매장</th>
                <th class="px-3 py-2">지역</th>
                <th class="px-3 py-2">상태</th>
                <th class="min-w-[19rem] px-3 py-2">주 창고</th>
                <th class="min-w-[19rem] px-3 py-2">예비 창고</th>
                <th class="px-3 py-2">저장</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rows"
                :key="row.storeCode"
                :class="isDirty(row) ? 'bg-emerald-50/40' : ''"
                class="border-b border-gray-100"
              >
                <td class="px-3 py-2">
                  <p class="font-black text-gray-900">{{ row.storeName }}</p>
                  <p class="text-[11px] font-bold text-gray-500">{{ row.storeCode }}</p>
                </td>
                <td class="px-3 py-2 font-bold text-gray-700">{{ row.region }}</td>
                <td class="px-3 py-2 font-bold text-gray-700">{{ statusToKor[row.status] || row.status }}</td>
                <td class="px-3 py-2">
                  <select
                    v-model="row.draftPrimaryWarehouseCode"
                    :title="row.draftPrimaryWarehouseCode ? warehouseOptionLabel(row.draftPrimaryWarehouseCode) : '선택'"
                    class="h-8 w-full min-w-[18rem] border border-gray-300 px-2 text-xs font-bold outline-none focus:border-[#004D3C] xl:min-w-[24rem]"
                  >
                    <option value="">선택</option>
                    <option v-for="warehouse in warehouseOptions" :key="warehouse.code" :value="warehouse.code">
                      {{ warehouse.code }} · {{ warehouse.name }}
                    </option>
                  </select>
                </td>
                <td class="px-3 py-2">
                  <select
                    v-model="row.draftBackupWarehouseCode"
                    :title="row.draftBackupWarehouseCode ? warehouseOptionLabel(row.draftBackupWarehouseCode) : '미지정'"
                    class="h-8 w-full min-w-[18rem] border border-gray-300 px-2 text-xs font-bold outline-none focus:border-[#004D3C] xl:min-w-[24rem]"
                  >
                    <option value="">미지정</option>
                    <option v-for="warehouse in warehouseOptions" :key="`backup-${warehouse.code}`" :value="warehouse.code">
                      {{ warehouse.code }} · {{ warehouse.name }}
                    </option>
                  </select>
                </td>
                <td class="px-3 py-2">
                  <button
                    type="button"
                    class="h-8 border border-[#004D3C] bg-[#004D3C] px-3 text-[11px] font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="!isDirty(row) || savingStoreCode === row.storeCode"
                    @click="saveRow(row)"
                  >
                    {{ savingStoreCode === row.storeCode ? '저장 중...' : '저장' }}
                  </button>
                </td>
              </tr>
              <tr v-if="rows.length === 0">
                <td colspan="6" class="px-3 py-6 text-center text-sm font-bold text-gray-400">조회 결과가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>
