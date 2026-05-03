export const transferSkuCatalog = [
  { skuCode: 'PRD-TOP-SS-001-BLK-S', itemCode: 'PRD-TOP-SS-001', itemName: '코튼 베이직 반팔 티셔츠', color: '검정', size: 'S', category: '상의 > 반팔' },
  { skuCode: 'PRD-TOP-SS-001-WHT-M', itemCode: 'PRD-TOP-SS-001', itemName: '코튼 베이직 반팔 티셔츠', color: '흰색', size: 'M', category: '상의 > 반팔' },
  { skuCode: 'PRD-TOP-SH-003-NVY-L', itemCode: 'PRD-TOP-SH-003', itemName: '오버핏 옥스포드 셔츠', color: '네이비', size: 'L', category: '상의 > 셔츠' },
  { skuCode: 'PRD-PNT-SH-002-GRY-M', itemCode: 'PRD-PNT-SH-002', itemName: '라이트 코튼 쇼츠', color: '그레이', size: 'M', category: '바지 > 반바지' },
  { skuCode: 'PRD-SKT-LS-002-BLK-M', itemCode: 'PRD-SKT-LS-002', itemName: '플리츠 롱스커트', color: '검정', size: 'M', category: '치마 > 롱스커트' },
  { skuCode: 'PRD-OUT-PD-001-NVY-XL', itemCode: 'PRD-OUT-PD-001', itemName: '라이트 숏 패딩', color: '네이비', size: 'XL', category: '아우터 > 패딩' },
  { skuCode: 'PRD-TOP-KN-004-CRM-M', itemCode: 'PRD-TOP-KN-004', itemName: '소프트 라운드 니트', color: '크림', size: 'M', category: '상의 > 니트' },
  { skuCode: 'PRD-TOP-HD-002-GRN-L', itemCode: 'PRD-TOP-HD-002', itemName: '헤비웨이트 후드티', color: '그린', size: 'L', category: '상의 > 맨투맨/후드' },
  { skuCode: 'PRD-PNT-DN-003-BLU-30', itemCode: 'PRD-PNT-DN-003', itemName: '슬림 데님 팬츠', color: '블루', size: '30', category: '바지 > 데님' },
  { skuCode: 'PRD-OUT-JP-005-BLK-L', itemCode: 'PRD-OUT-JP-005', itemName: '윈드브레이커 점퍼', color: '검정', size: 'L', category: '아우터 > 점퍼' },
  { skuCode: 'PRD-DRS-MD-001-IVO-S', itemCode: 'PRD-DRS-MD-001', itemName: '미디 셔츠 원피스', color: '아이보리', size: 'S', category: '원피스 > 미디' },
  { skuCode: 'PRD-ACC-BG-007-BRN-F', itemCode: 'PRD-ACC-BG-007', itemName: '캔버스 토트백', color: '브라운', size: 'FREE', category: '잡화 > 가방' },
]

export const warehouseInventoryMap = {
  'PRD-TOP-SS-001-BLK-S': [
    { warehouseCode: 'WH-ICN-01', warehouseName: '인천 제1창고', location: '인천 서구', onHandStock: 122, reservedStock: 14, safetyStock: 40, updatedAt: '2026.04.30 09:30' },
    { warehouseCode: 'WH-ICH-01', warehouseName: '이천 풀필먼트', location: '경기 이천시', onHandStock: 26, reservedStock: 6, safetyStock: 32, updatedAt: '2026.04.30 09:12' },
    { warehouseCode: 'WH-BSN-01', warehouseName: '부산 물류창고', location: '부산 강서구', onHandStock: 0, reservedStock: 0, safetyStock: 25, updatedAt: '2026.04.30 08:55' },
    { warehouseCode: 'WH-DJN-01', warehouseName: '대전 허브창고', location: '대전 유성구', onHandStock: 50, reservedStock: 5, safetyStock: 20, updatedAt: '2026.04.30 08:40' },
  ],
  'PRD-TOP-SS-001-WHT-M': [
    { warehouseCode: 'WH-ICN-01', warehouseName: '인천 제1창고', location: '인천 서구', onHandStock: 96, reservedStock: 10, safetyStock: 35, updatedAt: '2026.04.30 09:25' },
    { warehouseCode: 'WH-ICH-01', warehouseName: '이천 풀필먼트', location: '경기 이천시', onHandStock: 15, reservedStock: 3, safetyStock: 26, updatedAt: '2026.04.30 09:00' },
    { warehouseCode: 'WH-BSN-01', warehouseName: '부산 물류창고', location: '부산 강서구', onHandStock: 44, reservedStock: 5, safetyStock: 22, updatedAt: '2026.04.30 08:35' },
    { warehouseCode: 'WH-DJN-01', warehouseName: '대전 허브창고', location: '대전 유성구', onHandStock: 20, reservedStock: 8, safetyStock: 20, updatedAt: '2026.04.30 08:20' },
  ],
  'PRD-TOP-SH-003-NVY-L': [
    { warehouseCode: 'WH-ICN-01', warehouseName: '인천 제1창고', location: '인천 서구', onHandStock: 72, reservedStock: 6, safetyStock: 20, updatedAt: '2026.04.30 09:18' },
    { warehouseCode: 'WH-ICH-01', warehouseName: '이천 풀필먼트', location: '경기 이천시', onHandStock: 12, reservedStock: 3, safetyStock: 16, updatedAt: '2026.04.30 08:58' },
    { warehouseCode: 'WH-BSN-01', warehouseName: '부산 물류창고', location: '부산 강서구', onHandStock: 58, reservedStock: 4, safetyStock: 18, updatedAt: '2026.04.30 08:32' },
    { warehouseCode: 'WH-DJN-01', warehouseName: '대전 허브창고', location: '대전 유성구', onHandStock: 8, reservedStock: 2, safetyStock: 14, updatedAt: '2026.04.30 08:10' },
  ],
  'PRD-PNT-SH-002-GRY-M': [
    { warehouseCode: 'WH-ICN-01', warehouseName: '인천 제1창고', location: '인천 서구', onHandStock: 43, reservedStock: 7, safetyStock: 18, updatedAt: '2026.04.30 09:08' },
    { warehouseCode: 'WH-ICH-01', warehouseName: '이천 풀필먼트', location: '경기 이천시', onHandStock: 6, reservedStock: 2, safetyStock: 16, updatedAt: '2026.04.30 08:49' },
    { warehouseCode: 'WH-BSN-01', warehouseName: '부산 물류창고', location: '부산 강서구', onHandStock: 26, reservedStock: 6, safetyStock: 14, updatedAt: '2026.04.30 08:22' },
    { warehouseCode: 'WH-DJN-01', warehouseName: '대전 허브창고', location: '대전 유성구', onHandStock: 0, reservedStock: 0, safetyStock: 12, updatedAt: '2026.04.30 08:05' },
  ],
  'PRD-SKT-LS-002-BLK-M': [
    { warehouseCode: 'WH-ICN-01', warehouseName: '인천 제1창고', location: '인천 서구', onHandStock: 39, reservedStock: 7, safetyStock: 16, updatedAt: '2026.04.30 09:14' },
    { warehouseCode: 'WH-ICH-01', warehouseName: '이천 풀필먼트', location: '경기 이천시', onHandStock: 8, reservedStock: 3, safetyStock: 14, updatedAt: '2026.04.30 08:44' },
    { warehouseCode: 'WH-BSN-01', warehouseName: '부산 물류창고', location: '부산 강서구', onHandStock: 16, reservedStock: 4, safetyStock: 10, updatedAt: '2026.04.30 08:18' },
    { warehouseCode: 'WH-DJN-01', warehouseName: '대전 허브창고', location: '대전 유성구', onHandStock: 2, reservedStock: 1, safetyStock: 9, updatedAt: '2026.04.30 08:02' },
  ],
  'PRD-OUT-PD-001-NVY-XL': [
    { warehouseCode: 'WH-ICN-01', warehouseName: '인천 제1창고', location: '인천 서구', onHandStock: 56, reservedStock: 4, safetyStock: 18, updatedAt: '2026.04.30 09:05' },
    { warehouseCode: 'WH-ICH-01', warehouseName: '이천 풀필먼트', location: '경기 이천시', onHandStock: 20, reservedStock: 4, safetyStock: 16, updatedAt: '2026.04.30 08:41' },
    { warehouseCode: 'WH-BSN-01', warehouseName: '부산 물류창고', location: '부산 강서구', onHandStock: 5, reservedStock: 2, safetyStock: 12, updatedAt: '2026.04.30 08:16' },
    { warehouseCode: 'WH-DJN-01', warehouseName: '대전 허브창고', location: '대전 유성구', onHandStock: 0, reservedStock: 0, safetyStock: 10, updatedAt: '2026.04.30 08:01' },
  ],
  'PRD-TOP-KN-004-CRM-M': [
    { warehouseCode: 'WH-ICN-01', warehouseName: '인천 제1창고', location: '인천 서구', onHandStock: 34, reservedStock: 8, safetyStock: 20, updatedAt: '2026.04.30 09:21' },
    { warehouseCode: 'WH-ICH-01', warehouseName: '이천 풀필먼트', location: '경기 이천시', onHandStock: 11, reservedStock: 4, safetyStock: 15, updatedAt: '2026.04.30 09:02' },
    { warehouseCode: 'WH-BSN-01', warehouseName: '부산 물류창고', location: '부산 강서구', onHandStock: 7, reservedStock: 1, safetyStock: 12, updatedAt: '2026.04.30 08:39' },
    { warehouseCode: 'WH-DJN-01', warehouseName: '대전 허브창고', location: '대전 유성구', onHandStock: 4, reservedStock: 0, safetyStock: 10, updatedAt: '2026.04.30 08:14' },
  ],
  'PRD-TOP-HD-002-GRN-L': [
    { warehouseCode: 'WH-ICN-01', warehouseName: '인천 제1창고', location: '인천 서구', onHandStock: 82, reservedStock: 6, safetyStock: 20, updatedAt: '2026.04.30 09:16' },
    { warehouseCode: 'WH-ICH-01', warehouseName: '이천 풀필먼트', location: '경기 이천시', onHandStock: 39, reservedStock: 4, safetyStock: 18, updatedAt: '2026.04.30 08:53' },
    { warehouseCode: 'WH-BSN-01', warehouseName: '부산 물류창고', location: '부산 강서구', onHandStock: 27, reservedStock: 2, safetyStock: 16, updatedAt: '2026.04.30 08:29' },
    { warehouseCode: 'WH-DJN-01', warehouseName: '대전 허브창고', location: '대전 유성구', onHandStock: 20, reservedStock: 2, safetyStock: 15, updatedAt: '2026.04.30 08:09' },
  ],
  'PRD-PNT-DN-003-BLU-30': [
    { warehouseCode: 'WH-ICN-01', warehouseName: '인천 제1창고', location: '인천 서구', onHandStock: 28, reservedStock: 8, safetyStock: 18, updatedAt: '2026.04.30 09:11' },
    { warehouseCode: 'WH-ICH-01', warehouseName: '이천 풀필먼트', location: '경기 이천시', onHandStock: 10, reservedStock: 2, safetyStock: 12, updatedAt: '2026.04.30 08:50' },
    { warehouseCode: 'WH-BSN-01', warehouseName: '부산 물류창고', location: '부산 강서구', onHandStock: 14, reservedStock: 5, safetyStock: 14, updatedAt: '2026.04.30 08:26' },
    { warehouseCode: 'WH-DJN-01', warehouseName: '대전 허브창고', location: '대전 유성구', onHandStock: 8, reservedStock: 1, safetyStock: 11, updatedAt: '2026.04.30 08:07' },
  ],
  'PRD-OUT-JP-005-BLK-L': [
    { warehouseCode: 'WH-ICN-01', warehouseName: '인천 제1창고', location: '인천 서구', onHandStock: 70, reservedStock: 10, safetyStock: 24, updatedAt: '2026.04.30 09:09' },
    { warehouseCode: 'WH-ICH-01', warehouseName: '이천 풀필먼트', location: '경기 이천시', onHandStock: 18, reservedStock: 4, safetyStock: 18, updatedAt: '2026.04.30 08:47' },
    { warehouseCode: 'WH-BSN-01', warehouseName: '부산 물류창고', location: '부산 강서구', onHandStock: 12, reservedStock: 3, safetyStock: 16, updatedAt: '2026.04.30 08:23' },
    { warehouseCode: 'WH-DJN-01', warehouseName: '대전 허브창고', location: '대전 유성구', onHandStock: 9, reservedStock: 1, safetyStock: 14, updatedAt: '2026.04.30 08:06' },
  ],
  'PRD-DRS-MD-001-IVO-S': [
    { warehouseCode: 'WH-ICN-01', warehouseName: '인천 제1창고', location: '인천 서구', onHandStock: 52, reservedStock: 8, safetyStock: 20, updatedAt: '2026.04.30 09:04' },
    { warehouseCode: 'WH-ICH-01', warehouseName: '이천 풀필먼트', location: '경기 이천시', onHandStock: 20, reservedStock: 5, safetyStock: 14, updatedAt: '2026.04.30 08:40' },
    { warehouseCode: 'WH-BSN-01', warehouseName: '부산 물류창고', location: '부산 강서구', onHandStock: 18, reservedStock: 4, safetyStock: 12, updatedAt: '2026.04.30 08:19' },
    { warehouseCode: 'WH-DJN-01', warehouseName: '대전 허브창고', location: '대전 유성구', onHandStock: 13, reservedStock: 3, safetyStock: 10, updatedAt: '2026.04.30 08:04' },
  ],
  'PRD-ACC-BG-007-BRN-F': [
    { warehouseCode: 'WH-ICN-01', warehouseName: '인천 제1창고', location: '인천 서구', onHandStock: 16, reservedStock: 6, safetyStock: 14, updatedAt: '2026.04.30 09:01' },
    { warehouseCode: 'WH-ICH-01', warehouseName: '이천 풀필먼트', location: '경기 이천시', onHandStock: 8, reservedStock: 3, safetyStock: 11, updatedAt: '2026.04.30 08:36' },
    { warehouseCode: 'WH-BSN-01', warehouseName: '부산 물류창고', location: '부산 강서구', onHandStock: 6, reservedStock: 2, safetyStock: 10, updatedAt: '2026.04.30 08:15' },
    { warehouseCode: 'WH-DJN-01', warehouseName: '대전 허브창고', location: '대전 유성구', onHandStock: 4, reservedStock: 1, safetyStock: 9, updatedAt: '2026.04.30 08:00' },
  ],
}

const WAREHOUSE_MASTER = [
  { warehouseCode: 'WH-ICN-01', warehouseName: '인천 제1창고', location: '인천 서구' },
  { warehouseCode: 'WH-ICH-01', warehouseName: '이천 풀필먼트', location: '경기 이천시' },
  { warehouseCode: 'WH-BSN-01', warehouseName: '부산 물류창고', location: '부산 강서구' },
  { warehouseCode: 'WH-DJN-01', warehouseName: '대전 허브창고', location: '대전 유성구' },
  { warehouseCode: 'WH-GMP-01', warehouseName: '김포 냉장센터', location: '경기 김포시' },
  { warehouseCode: 'WH-SUW-01', warehouseName: '수원 통합창고', location: '경기 수원시' },
  { warehouseCode: 'WH-GWJ-01', warehouseName: '광주 물류창고', location: '광주 광산구' },
  { warehouseCode: 'WH-ULS-01', warehouseName: '울산 항만창고', location: '울산 남구' },
  { warehouseCode: 'WH-CJU-01', warehouseName: '청주 크로스도킹', location: '충북 청주시' },
  { warehouseCode: 'WH-JJU-01', warehouseName: '제주 지역허브', location: '제주 제주시' },
]

function hashSeed(s) {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h
}

function buildSyntheticRow(skuCode, warehouse) {
  const seed = hashSeed(`${skuCode}|${warehouse.warehouseCode}`)
  const safetyStock = 9 + (seed % 13) // 9~21
  const shortageBucket = (seed >> 3) % 4 // 0~3

  const availableStockByBucket = [
    safetyStock + 16 + (seed % 18), // 여유
    safetyStock + 2 + (seed % 8), // 경계 상단
    Math.max(0, safetyStock - (3 + (seed % 6))), // 부족
    Math.max(0, safetyStock - (9 + (seed % 8))), // 강한 부족
  ]
  const availableStock = Math.max(0, availableStockByBucket[shortageBucket])
  const reservedStock = 1 + ((seed >> 7) % 7)
  const onHandStock = availableStock + reservedStock
  const minute = ((seed % 30) + 30).toString().padStart(2, '0')

  return {
    warehouseCode: warehouse.warehouseCode,
    warehouseName: warehouse.warehouseName,
    location: warehouse.location,
    onHandStock,
    reservedStock,
    safetyStock,
    updatedAt: `2026.04.30 07:${minute}`,
  }
}

function enrichWarehouseRows(skuCode) {
  const seededRows = warehouseInventoryMap[skuCode] || []
  const rowByCode = new Map(seededRows.map((row) => [row.warehouseCode, row]))

  return WAREHOUSE_MASTER.map((warehouse) => {
    return rowByCode.get(warehouse.warehouseCode) ?? buildSyntheticRow(skuCode, warehouse)
  })
}

export function buildWarehouseRows(skuCode) {
  return enrichWarehouseRows(skuCode).map((row) => {
    const availableStock = Math.max(0, row.onHandStock - row.reservedStock)
    let status = '정상'
    if (availableStock <= 0) status = '품절'
    else if (availableStock < row.safetyStock) status = '부족'

    return {
      ...row,
      availableStock,
      status,
    }
  })
}

export function getImbalanceMetrics(rows) {
  if (!rows.length) {
    return { imbalanceScore: 0, status: '정상', maxAvailable: 0, minAvailable: 0 }
  }

  const availableStocks = rows.map(row => row.availableStock)
  const maxAvailable = Math.max(...availableStocks)
  const minAvailable = Math.min(...availableStocks)
  const imbalanceScore = Math.max(0, maxAvailable - minAvailable)

  let status = '정상'
  if (imbalanceScore >= 60) status = '불균형'
  else if (imbalanceScore >= 25) status = '주의'

  return { imbalanceScore, status, maxAvailable, minAvailable }
}
