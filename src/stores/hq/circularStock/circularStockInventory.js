import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getCircularInventories } from '@/api/hq/inventory.js'
import {
  INVENTORY_STORAGE_KEY,
  INITIAL_INVENTORY,
  enrichInventoryItem,
  loadJson,
  saveJson,
} from '@/stores/hq/circularStock/circularStockCommon.js'

export const useCircularStockInventoryStore = defineStore('circularStockInventory', () => {
  const inventoryItems = ref(loadJson(INVENTORY_STORAGE_KEY, INITIAL_INVENTORY).map(enrichInventoryItem))
  const liveCircularInventoryRows = ref([])
  const inventoryPage = ref(0)
  const inventorySize = ref(20)
  const inventoryTotalPages = ref(0)
  const inventoryTotalElements = ref(0)
  const inventoryHasNext = ref(false)
  const inventoryHasPrevious = ref(false)
  const inventorySort = ref('skuCode,asc')
  const inventoryKeyword = ref('')
  const inventoryWarehouseCodes = ref([])
  const inventoryMaterialGroup = ref('')
  const inventoryMaterialName = ref('')
  const inventoryMaterialNames = ref([])

  const inventoryRows = computed(() => {
    const source = liveCircularInventoryRows.value.length > 0
      ? liveCircularInventoryRows.value
      : inventoryItems.value
    return [...source].sort((a, b) => (
      a.parentCategory.localeCompare(b.parentCategory, 'ko')
      || a.childCategory.localeCompare(b.childCategory, 'ko')
      || a.itemName.localeCompare(b.itemName, 'ko')
    ))
  })

  function persistInventory() {
    saveJson(INVENTORY_STORAGE_KEY, inventoryItems.value)
  }

  function getInventoryById(inventoryId) {
    return inventoryItems.value.find(item => item.id === inventoryId)
      ?? liveCircularInventoryRows.value.find(item => item.id === inventoryId)
      ?? null
  }

  function mapCircularApiRowToInventoryItem(row) {
    const compositions = Array.isArray(row.materialCompositions) ? row.materialCompositions : []
    const materials = compositions.map(comp => ({
      name: String(comp.materialNameKo ?? ''),
      ratio: Number(comp.ratio ?? 0),
    }))
    return {
      id: String(row.inventoryId ?? ''),
      itemCode: String(row.itemCode ?? ''),
      parentCategory: String(row.parentCategory ?? ''),
      childCategory: String(row.childCategory ?? ''),
      itemName: String(row.itemName ?? ''),
      warehouseCode: String(row.warehouseCode ?? ''),
      warehouseName: String(row.warehouseName ?? ''),
      materials,
      quantity: Number(row.availableQuantity ?? 0),
      weightKg: Number(row.totalWeightKg ?? 0),
      skuCode: String(row.skuCode ?? ''),
      color: String(row.color ?? ''),
      size: String(row.size ?? ''),
      materialType: String(row.materialType ?? ''),
      materialKgPrice: Number(row.materialKgPrice ?? 0),
      circularSalePrice: Number(row.circularSalePrice ?? 0),
      materialCompositions: compositions,
      availableQuantity: Number(row.availableQuantity ?? 0),
      totalWeightKg: Number(row.totalWeightKg ?? 0),
    }
  }

  async function loadCircularInventoryRows(overrides = {}) {
    const nextPage = Number.isInteger(overrides.page) ? overrides.page : inventoryPage.value
    const nextSize = [20, 50, 100].includes(Number(overrides.size)) ? Number(overrides.size) : inventorySize.value
    const nextSort = String((overrides.sort ?? inventorySort.value) || 'skuCode,asc')
    const nextKeyword = String((overrides.keyword ?? inventoryKeyword.value) || '').trim()
    const nextWarehouseCodes = Array.isArray(overrides.warehouseCodes)
      ? overrides.warehouseCodes
      : inventoryWarehouseCodes.value
    const nextMaterialGroup = String((overrides.materialGroup ?? inventoryMaterialGroup.value) || '').trim()
    const nextMaterialNames = Array.isArray(overrides.materialNames)
      ? overrides.materialNames.map(value => String(value || '').trim()).filter(Boolean)
      : inventoryMaterialNames.value
    const fallbackMaterialName = nextMaterialNames.length === 1 ? nextMaterialNames[0] : ''
    const materialNameSource = overrides.materialName ?? fallbackMaterialName ?? inventoryMaterialName.value
    const nextMaterialName = String(materialNameSource || '').trim()

    const response = await getCircularInventories({
      page: Math.max(0, Number(nextPage) || 0),
      size: nextSize,
      sort: nextSort,
      keyword: nextKeyword || undefined,
      warehouseCodes: nextWarehouseCodes.length > 0 ? nextWarehouseCodes : undefined,
      materialGroup: nextMaterialGroup || undefined,
      materialName: nextMaterialName || undefined,
      materialNames: nextMaterialNames.length > 0 ? nextMaterialNames : undefined,
    })

    const rows = Array.isArray(response?.content) ? response.content : []
    const mapped = rows.map(mapCircularApiRowToInventoryItem)

    inventoryPage.value = Number(response?.page ?? 0)
    inventorySize.value = Number(response?.size ?? nextSize)
    inventoryTotalPages.value = Number(response?.totalPages ?? 0)
    inventoryTotalElements.value = Number(response?.totalElements ?? 0)
    inventoryHasNext.value = Boolean(response?.hasNext)
    inventoryHasPrevious.value = Boolean(response?.hasPrevious)
    inventorySort.value = nextSort
    inventoryKeyword.value = nextKeyword
    inventoryWarehouseCodes.value = [...nextWarehouseCodes]
    inventoryMaterialGroup.value = nextMaterialGroup
    inventoryMaterialName.value = nextMaterialName
    inventoryMaterialNames.value = [...nextMaterialNames]

    liveCircularInventoryRows.value = mapped
    inventoryItems.value = mapped.map(enrichInventoryItem)
    persistInventory()

    return {
      rows: mapped,
      page: inventoryPage.value,
      size: inventorySize.value,
      totalPages: inventoryTotalPages.value,
      totalElements: inventoryTotalElements.value,
      hasNext: inventoryHasNext.value,
      hasPrevious: inventoryHasPrevious.value,
    }
  }

  return {
    inventoryRows,
    inventoryPage,
    inventorySize,
    inventoryTotalPages,
    inventoryTotalElements,
    inventoryHasNext,
    inventoryHasPrevious,
    inventorySort,
    inventoryKeyword,
    inventoryWarehouseCodes,
    inventoryMaterialGroup,
    inventoryMaterialName,
    inventoryMaterialNames,
    getInventoryById,
    loadCircularInventoryRows,
  }
})
