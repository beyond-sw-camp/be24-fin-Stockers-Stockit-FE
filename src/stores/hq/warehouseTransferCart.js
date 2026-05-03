import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

function makeLineId() {
  return `WTC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function routeKeyOf(line) {
  return `${line.fromWarehouseCode}=>${line.toWarehouseCode}`
}

export const useWarehouseTransferCartStore = defineStore('warehouseTransferCart', () => {
  const lines = ref([])

  const lineCount = computed(() => lines.value.length)

  const groupedByRoute = computed(() => {
    const map = new Map()

    for (const line of lines.value) {
      const key = routeKeyOf(line)
      if (!map.has(key)) {
        map.set(key, {
          routeKey: key,
          fromWarehouseCode: line.fromWarehouseCode,
          fromWarehouseName: line.fromWarehouseName,
          toWarehouseCode: line.toWarehouseCode,
          toWarehouseName: line.toWarehouseName,
          lines: [],
          totalQty: 0,
        })
      }

      const group = map.get(key)
      group.lines.push(line)
      group.totalQty += line.qty
    }

    return Array.from(map.values())
  })

  function addLine(payload) {
    const duplicate = lines.value.find((line) =>
      line.skuCode === payload.skuCode &&
      line.fromWarehouseCode === payload.fromWarehouseCode &&
      line.toWarehouseCode === payload.toWarehouseCode
    )

    if (duplicate) {
      duplicate.qty += Number(payload.qty) || 0
      duplicate.reason = payload.reason
      duplicate.memo = payload.memo
      return duplicate.lineId
    }

    const line = {
      lineId: makeLineId(),
      skuCode: payload.skuCode,
      itemName: payload.itemName,
      fromWarehouseCode: payload.fromWarehouseCode,
      fromWarehouseName: payload.fromWarehouseName,
      toWarehouseCode: payload.toWarehouseCode,
      toWarehouseName: payload.toWarehouseName,
      qty: Number(payload.qty) || 0,
      reason: payload.reason || '',
      memo: payload.memo || '',
      addedAt: new Date().toISOString(),
    }
    lines.value.push(line)
    return line.lineId
  }

  function updateLineQty(lineId, qty) {
    const target = lines.value.find((line) => line.lineId === lineId)
    if (!target) return false
    const nextQty = Number(qty)
    if (!Number.isFinite(nextQty) || nextQty < 1) return false
    target.qty = Math.trunc(nextQty)
    return true
  }

  function removeLine(lineId) {
    lines.value = lines.value.filter((line) => line.lineId !== lineId)
  }

  function clearAll() {
    lines.value = []
  }

  async function executeAll(executor) {
    const grouped = groupedByRoute.value
    const successLineIds = []
    const failed = []

    for (const group of grouped) {
      for (const line of group.lines) {
        const result = await executor(line, group)
        if (result?.success) {
          successLineIds.push(line.lineId)
        } else {
          failed.push({
            lineId: line.lineId,
            skuCode: line.skuCode,
            message: result?.message || '실행 실패',
          })
        }
      }
    }

    if (successLineIds.length) {
      lines.value = lines.value.filter((line) => !successLineIds.includes(line.lineId))
    }

    return {
      successCount: successLineIds.length,
      failureCount: failed.length,
      failed,
    }
  }

  return {
    lines,
    lineCount,
    groupedByRoute,
    addLine,
    updateLineQty,
    removeLine,
    clearAll,
    executeAll,
  }
})
