import { useStoreOrderStore } from '@/stores/store/storeOrder.js'

// Backward compatibility shim. Prefer useStoreOrderStore directly.
export const useStoreOrdersStore = () => useStoreOrderStore()

