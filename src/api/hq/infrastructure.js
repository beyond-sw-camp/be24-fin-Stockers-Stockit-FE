import api, { unwrap } from '@/api/axios.js'

export async function getInfrastructures(params = {}) {
  const res = await api.get('/api/hq/infrastructures', { params })
  return unwrap(res)
}

export async function getInfrastructureByCode(code) {
  const res = await api.get(`/api/hq/infrastructures/${code}`)
  return unwrap(res)
}

export async function createInfrastructure(payload) {
  const res = await api.post('/api/hq/infrastructures', payload)
  return unwrap(res)
}

export async function updateInfrastructure(code, payload) {
  const res = await api.patch(`/api/hq/infrastructures/${code}`, payload)
  return unwrap(res)
}
