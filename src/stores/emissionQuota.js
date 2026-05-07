/**
 * emissionQuota.js — 온실가스 배출 관리 (할당 + 활동량 + 자동 환산) Pinia 스토어
 *
 * 두 페이지에서 공유:
 *  - /hq/esg/quota         : 입력 + 분석 상세
 *  - /hq/esg               : ESG 대시보드 — "배출 한도 vs 실적" 카드 (요약)
 *
 * 데이터 모델 (BE 호환 설계):
 *  emission_quota         { fiscal_year, yearly_allocation, warn_threshold_pct, updated_at, updated_by }
 *  emission_factor        { factor_type, factor_value, unit, effective_year }
 *  emission_activity      { id, location_code, year, month,
 *                           electricity_kwh, city_gas_m3, fuel_l, waste_ton,
 *                           computed_co2_kg, recorded_at, recorded_by }
 *
 * BE 연동 시 actions 안의 mock 로직만 axios 호출로 교체하면 됨.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 환경부 공식 배출계수 (2024 기준) — 실제 BE 연동 시 emission_factor 테이블에서 조회
export const EMISSION_FACTORS = {
  ELECTRICITY: { key: 'ELECTRICITY', label: '전력',     unit: 'kWh', factor: 0.4153, color: '#fbbf24' },
  CITY_GAS:    { key: 'CITY_GAS',    label: '도시가스', unit: 'm³',  factor: 2.176,  color: '#f97316' },
  FUEL:        { key: 'FUEL',        label: '차량 연료', unit: 'L',  factor: 2.582,  color: '#3b82f6' },
  WASTE:       { key: 'WASTE',       label: '폐기물',   unit: 't',   factor: 1500,   color: '#6b7280' },
}
export const FACTOR_KEYS = ['ELECTRICITY', 'CITY_GAS', 'FUEL', 'WASTE']

// 사업장 마스터 (BE 연동 시 GET /api/hq/infrastructure 로 교체)
export const INFRASTRUCTURES = [
  { code: 'WH-SL-0001', type: 'WAREHOUSE', name: '수도권 통합 물류센터' },
  { code: 'WH-GG-0001', type: 'WAREHOUSE', name: '경기 남부 허브 창고' },
  { code: 'WH-IC-0001', type: 'WAREHOUSE', name: '인천 항만 물류센터' },
  { code: 'ST-SL-0001', type: 'STORE',     name: '강남 플래그십점' },
  { code: 'ST-SL-0002', type: 'STORE',     name: '홍대 라이프스타일점' },
  { code: 'ST-GG-0001', type: 'STORE',     name: '수원 광교점' },
  { code: 'ST-BS-0001', type: 'STORE',     name: '부산 센텀점' },
  { code: 'ST-DJ-0001', type: 'STORE',     name: '대전 둔산점' },
  { code: 'ST-IC-0001', type: 'STORE',     name: '인천 송도점' },
]

const ACTIVITY_FIELD = { ELECTRICITY: 'electricity', CITY_GAS: 'gas', FUEL: 'fuel', WASTE: 'waste' }

function recordCo2Kg(r) {
  return (r.electricity ?? 0) * EMISSION_FACTORS.ELECTRICITY.factor
       + (r.gas ?? 0)         * EMISSION_FACTORS.CITY_GAS.factor
       + (r.fuel ?? 0)        * EMISSION_FACTORS.FUEL.factor
       + (r.waste ?? 0)       * EMISSION_FACTORS.WASTE.factor
}

function recordCo2ByFactor(r, factorKey) {
  const fld = ACTIVITY_FIELD[factorKey]
  return (r[fld] ?? 0) * EMISSION_FACTORS[factorKey].factor
}

export const useEmissionQuotaStore = defineStore('emissionQuota', () => {
  // ─────────── State ───────────
  const fiscalYear = ref(2026)

  // 할당량 정보 (HQ 수기 입력)
  const yearlyAllocation = ref(5000)         // tCO₂
  const warnThresholdPct = ref(75)
  const quotaUpdatedAt = ref('2026-01-02')
  const quotaUpdatedBy = ref('hq0001')

  // 활동량 기록 (mock — BE 연동 시 emission_activity 테이블)
  const activityRecords = ref([
    { id: 1,  loc: 'ST-SL-0001', y: 2026, m: 1, electricity: 12500, gas:  850, fuel: 180, waste: 0.4 },
    { id: 2,  loc: 'ST-SL-0001', y: 2026, m: 2, electricity: 11800, gas:  820, fuel: 175, waste: 0.35 },
    { id: 3,  loc: 'ST-SL-0001', y: 2026, m: 3, electricity: 12200, gas:  780, fuel: 195, waste: 0.42 },
    { id: 4,  loc: 'ST-SL-0002', y: 2026, m: 1, electricity:  9500, gas:  620, fuel: 140, waste: 0.28 },
    { id: 5,  loc: 'ST-SL-0002', y: 2026, m: 2, electricity:  9100, gas:  600, fuel: 135, waste: 0.25 },
    { id: 6,  loc: 'ST-SL-0002', y: 2026, m: 3, electricity:  9300, gas:  610, fuel: 145, waste: 0.30 },
    { id: 7,  loc: 'WH-SL-0001', y: 2026, m: 1, electricity: 28500, gas: 1200, fuel: 850, waste: 1.2 },
    { id: 8,  loc: 'WH-SL-0001', y: 2026, m: 2, electricity: 27800, gas: 1180, fuel: 820, waste: 1.15 },
    { id: 9,  loc: 'WH-SL-0001', y: 2026, m: 3, electricity: 28100, gas: 1150, fuel: 880, waste: 1.25 },
    { id: 10, loc: 'ST-SL-0001', y: 2026, m: 4, electricity: 11500, gas:  750, fuel: 170, waste: 0.38 },
    { id: 11, loc: 'ST-SL-0002', y: 2026, m: 4, electricity:  8800, gas:  580, fuel: 130, waste: 0.24 },
    { id: 12, loc: 'WH-SL-0001', y: 2026, m: 4, electricity: 27500, gas: 1100, fuel: 800, waste: 1.10 },
  ])

  // ─────────── Getters ───────────
  const yearRecords = computed(() =>
    activityRecords.value.filter(r => r.y === fiscalYear.value),
  )

  /** YTD 누적 (tCO₂) */
  const ytdEmissions = computed(() => {
    const totalKg = yearRecords.value.reduce((s, r) => s + recordCo2Kg(r), 0)
    return totalKg / 1000
  })

  /** 잔여 한도 (tCO₂) */
  const remaining = computed(() =>
    Math.max(0, yearlyAllocation.value - ytdEmissions.value),
  )

  /** 사용률 (%) */
  const utilizationPct = computed(() => {
    if (!yearlyAllocation.value) return 0
    return (ytdEmissions.value / yearlyAllocation.value) * 100
  })

  /** 사용률 상태 */
  const utilizationStatus = computed(() => {
    const pct = utilizationPct.value
    if (pct >= 100) return { label: '한도 초과', tone: 'red' }
    if (pct >= warnThresholdPct.value) return { label: '경고', tone: 'amber' }
    if (pct >= 50)  return { label: '주의',     tone: 'yellow' }
    return { label: '정상', tone: 'emerald' }
  })

  /** 분기별 (단독) 합계 + 상태 */
  const quarterly = computed(() => {
    const buckets = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }
    for (const r of yearRecords.value) {
      const q = r.m <= 3 ? 'Q1' : r.m <= 6 ? 'Q2' : r.m <= 9 ? 'Q3' : 'Q4'
      buckets[q] += recordCo2Kg(r) / 1000
    }
    const today = new Date()
    const currentMonth = today.getFullYear() === fiscalYear.value ? today.getMonth() + 1 : 12
    const currentQ = currentMonth <= 3 ? 1 : currentMonth <= 6 ? 2 : currentMonth <= 9 ? 3 : 4

    return [
      { q: 'Q1', period: '1월~3월',   emissions: buckets.Q1, status: currentQ > 1 ? 'completed' : currentQ === 1 ? 'in-progress' : 'upcoming' },
      { q: 'Q2', period: '4월~6월',   emissions: buckets.Q2, status: currentQ > 2 ? 'completed' : currentQ === 2 ? 'in-progress' : 'upcoming' },
      { q: 'Q3', period: '7월~9월',   emissions: buckets.Q3, status: currentQ > 3 ? 'completed' : currentQ === 3 ? 'in-progress' : 'upcoming' },
      { q: 'Q4', period: '10월~12월', emissions: buckets.Q4, status: currentQ === 4 ? 'in-progress' : 'upcoming' },
    ]
  })

  /** 활동 종류별 누적 (tCO₂) */
  const breakdownByFactor = computed(() => {
    return FACTOR_KEYS.map(k => {
      const totalKg = yearRecords.value.reduce((s, r) => s + recordCo2ByFactor(r, k), 0)
      return { ...EMISSION_FACTORS[k], co2Ton: totalKg / 1000 }
    })
  })

  /** 매장·창고별 누적 (tCO₂) — 정렬: 많은 순 */
  const locationRanking = computed(() => {
    const map = new Map()
    for (const r of yearRecords.value) {
      map.set(r.loc, (map.get(r.loc) ?? 0) + recordCo2Kg(r))
    }
    return [...map.entries()]
      .map(([loc, kg]) => {
        const info = INFRASTRUCTURES.find(i => i.code === loc)
        return {
          loc,
          name: info?.name ?? loc,
          type: info?.type ?? 'UNKNOWN',
          co2Ton: kg / 1000,
        }
      })
      .sort((a, b) => b.co2Ton - a.co2Ton)
  })

  // ─────────── Actions ───────────
  function updateQuota({ allocation, warnPct, by }) {
    if (typeof allocation === 'number') yearlyAllocation.value = allocation
    if (typeof warnPct === 'number')    warnThresholdPct.value = warnPct
    quotaUpdatedAt.value = new Date().toISOString().slice(0, 10)
    quotaUpdatedBy.value = by ?? quotaUpdatedBy.value
  }

  function addActivity(rec) {
    // 중복 검증 (같은 사업장 + 연 + 월)
    const exists = activityRecords.value.some(
      r => r.loc === rec.loc && r.y === rec.y && r.m === rec.m,
    )
    if (exists) {
      throw new Error(`${rec.loc} ${rec.y}년 ${rec.m}월 데이터가 이미 존재합니다.`)
    }
    activityRecords.value.push({
      id: Date.now(),
      loc: rec.loc,
      y: Number(rec.y),
      m: Number(rec.m),
      electricity: Number(rec.electricity) || 0,
      gas: Number(rec.gas) || 0,
      fuel: Number(rec.fuel) || 0,
      waste: Number(rec.waste) || 0,
    })
  }

  function deleteActivity(id) {
    activityRecords.value = activityRecords.value.filter(r => r.id !== id)
  }

  return {
    // state
    fiscalYear,
    yearlyAllocation,
    warnThresholdPct,
    quotaUpdatedAt,
    quotaUpdatedBy,
    activityRecords,
    // getters
    ytdEmissions,
    remaining,
    utilizationPct,
    utilizationStatus,
    quarterly,
    breakdownByFactor,
    locationRanking,
    // actions
    updateQuota,
    addActivity,
    deleteActivity,
    // utility (컴포넌트에서 직접 환산할 때 사용)
    recordCo2Kg,
    recordCo2ByFactor,
  }
})
