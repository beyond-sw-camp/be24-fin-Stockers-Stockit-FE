import { ref } from 'vue'

// 공급처 계약 등록/수정 모달의 상태 + 검증 + 제출 로직.
// view 에서 selectedRow / vendor store / triggerToast 만 주입받아 사용.

const initialFormData = () => ({
  unitPrice: '',
  moq: '',
  leadTimeDays: '',
  contractStart: '',
  contractEnd: '',
})

const initialFormErrors = () => ({
  unitPrice: '',
  moq: '',
  leadTimeDays: '',
  contractStart: '',
  contractEnd: '',
})

export function useVendorContractForm({ vendor, getSelectedRow, onSuccess }) {
  const showModal = ref(false)
  const modalMode = ref('create') // 'create' | 'edit'
  const formData = ref(initialFormData())
  const formErrors = ref(initialFormErrors())

  function validateForm() {
    const errors = initialFormErrors()
    const fd = formData.value

    if (fd.unitPrice === '' || fd.unitPrice === null) {
      errors.unitPrice = '필수 입력 항목입니다'
    } else if (!(Number(fd.unitPrice) > 0)) {
      errors.unitPrice = '0보다 큰 값을 입력하세요'
    }

    if (fd.moq === '' || fd.moq === null) {
      errors.moq = '필수 입력 항목입니다'
    } else if (!(Number(fd.moq) > 0)) {
      errors.moq = '0보다 큰 값을 입력하세요'
    }

    if (fd.leadTimeDays === '' || fd.leadTimeDays === null) {
      errors.leadTimeDays = '필수 입력 항목입니다'
    } else if (!(Number(fd.leadTimeDays) > 0)) {
      errors.leadTimeDays = '0보다 큰 값을 입력하세요'
    }

    if (!fd.contractStart) errors.contractStart = '필수 입력 항목입니다'

    if (!fd.contractEnd) {
      errors.contractEnd = '필수 입력 항목입니다'
    } else if (fd.contractStart && fd.contractEnd < fd.contractStart) {
      errors.contractEnd = '종료일은 시작일 이후여야 합니다'
    }

    formErrors.value = errors
    return Object.values(errors).every((msg) => !msg)
  }

  function openCreateModal() {
    if (!getSelectedRow()) return
    modalMode.value = 'create'
    formData.value = initialFormData()
    formErrors.value = initialFormErrors()
    showModal.value = true
  }

  function openEditModal() {
    const row = getSelectedRow()
    if (!row || !row.contracted) return
    if (row.status === 'EXPIRED') {
      alert('만료된 계약은 수정할 수 없습니다.')
      return
    }
    modalMode.value = 'edit'
    formData.value = {
      unitPrice: String(row.contractUnitPrice ?? ''),
      moq: String(row.moq ?? ''),
      leadTimeDays: String(row.leadTimeDays ?? ''),
      contractStart: row.contractStart ?? '',
      contractEnd: row.contractEnd ?? '',
    }
    formErrors.value = initialFormErrors()
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
    formErrors.value = initialFormErrors()
  }

  async function handleSubmitForm() {
    if (!validateForm()) return
    const row = getSelectedRow()
    if (!row) return

    try {
      if (modalMode.value === 'create') {
        await vendor.createProduct({
          productCode: row.productCode,
          unitPrice: formData.value.unitPrice,
          moq: formData.value.moq,
          leadTimeDays: formData.value.leadTimeDays,
          contractStart: formData.value.contractStart,
          contractEnd: formData.value.contractEnd,
        })
        closeModal()
        onSuccess?.('계약이 등록되었습니다')
      } else {
        await vendor.updateProduct(row.vendorProductCode, formData.value)
        closeModal()
        onSuccess?.('계약 정보가 수정되었습니다')
      }
    } catch (err) {
      onSuccess?.(err?.message ?? '요청 처리 중 오류가 발생했습니다')
    }
  }

  return {
    showModal,
    modalMode,
    formData,
    formErrors,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSubmitForm,
  }
}
