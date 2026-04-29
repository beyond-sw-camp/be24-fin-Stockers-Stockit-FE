import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const BUYER_STORAGE_KEY = 'stockit_circular_inventory_buyers_v1'

export const MATERIAL_FIT_OPTIONS = [
  { value: 'natural-single', label: '천연 단일 섬유' },
  { value: 'synthetic', label: '합성 섬유' },
  { value: 'blended', label: '혼방' },
]

export const INDUSTRY_GROUP_OPTIONS = [
  '재생원사',
  '홈텍스타일',
  '반려동물 용품',
  '패션 잡화',
  '의료/위생',
  '인테리어',
  '음향 기기',
  '농업',
  '뷰티/화학',
  '교육/공예',
  '단체복/워크웨어',
  '아웃도어 잡화',
  '물류 자재',
  '해양/수산',
  '구호 용품',
  '가구 제조',
  '자동차 부품',
  '레저/기어',
  '화학 사출',
  '생활 잡화',
  '의류/워크웨어',
  '유니폼',
  '건설 자재',
  '자동차 흡음',
  '산업 소모품',
  '가구 자재',
  '에너지',
  '물류 패키징',
]

const INITIAL_BUYERS = [
  // natural-single (10)
  {
    id: 'RCV-001',
    code: 'RCV-001',
    companyName: '그린루프 리사이클랩',
    industryGroup: '재생원사',
    productTypes: ['재생 면사', '방적용 원재료'],
    productNote: '면 중심 순환 재고를 선별 세척 후 재생 원사와 방적용 원재료로 전환하는 비중이 높습니다.',
    description: '면 함량이 높은 순환 재고를 재생 섬유 원료로 전환하는 업체입니다. 밝은 컬러 셔츠류, 면 팬츠, 잔원단 묶음처럼 비교적 순도가 높은 재고와의 매칭이 좋습니다.',
    primaryMaterialFit: 'natural-single',
    managerName: '김서연',
    phone: '02-2100-4100',
    createdAt: '2026-04-20T09:00:00',
    updatedAt: '2026-04-20T09:00:00',
  },
  {
    id: 'RCV-002',
    code: 'RCV-002',
    companyName: '코지룸 텍스타일',
    industryGroup: '홈텍스타일',
    productTypes: ['쿠션 커버', '테이블 러너', '패브릭 수납함'],
    productNote: '면과 린넨 계열 재고를 홈 패브릭 소품으로 재구성하는 라인이 안정적으로 운영되고 있습니다.',
    description: '홈텍스타일 소품을 제작하는 거래처로, 촉감이 부드럽고 패턴이 과하지 않은 천연 섬유 재고를 선호합니다. 셔츠 원단, 블라우스 원단, 침구 잔량과의 매칭이 좋습니다.',
    primaryMaterialFit: 'natural-single',
    managerName: '오민아',
    phone: '02-3487-5521',
    createdAt: '2026-04-24T09:20:00',
    updatedAt: '2026-04-24T09:20:00',
  },
  {
    id: 'RCV-003',
    code: 'RCV-003',
    companyName: '플랜트웍스',
    industryGroup: '농업',
    productTypes: ['작물 보온 커버', '모종 운반용 내피', '재배 보조 직물'],
    productNote: '오염 우려가 낮은 잔원단을 농업용 보조 직물로 전환하며, 내구성과 통기성을 함께 봅니다.',
    description: '농업용 보조 직물을 제작하는 거래처입니다. 패션 완성도보다는 내구성과 활용성이 중요해 비교적 단순한 구조의 면/혼방 재고를 재사용하기 좋습니다.',
    primaryMaterialFit: 'natural-single',
    managerName: '배유진',
    phone: '063-241-7720',
    createdAt: '2026-04-25T13:30:00',
    updatedAt: '2026-04-25T13:30:00',
  },
  {
    id: 'RCV-004',
    code: 'RCV-004',
    companyName: '리빙코튼 팩토리',
    industryGroup: '생활 잡화',
    productTypes: ['주방 패브릭', '수납 파우치', '먼지커버'],
    productNote: '무늬가 단순한 면 원단을 생활용 소품으로 빠르게 전환하는 소량 다품종 라인이 있습니다.',
    description: '생활 잡화 중심의 OEM 거래처로, 면 셔츠/바지 재고와 평직 잔원단의 활용도가 높습니다. 패턴이 과하지 않은 원단일수록 전환 효율이 좋습니다.',
    primaryMaterialFit: 'natural-single',
    managerName: '장규리',
    phone: '031-881-2247',
    createdAt: '2026-04-26T09:10:00',
    updatedAt: '2026-04-26T09:10:00',
  },
  {
    id: 'RCV-005',
    code: 'RCV-005',
    companyName: '에코교구랩',
    industryGroup: '교육/공예',
    productTypes: ['공예 키트 원단', '체험용 패브릭 카드', '교육용 조각천'],
    productNote: '작은 면 원단 조각도 활용 가능해 소량 잔량 처리에 유리합니다.',
    description: '교육/공예용 제품을 제작하는 거래처입니다. 의류 완제품보다 원단 상태 재고를 선호하며, 색상별 분류가 된 면 원단과 잘 맞습니다.',
    primaryMaterialFit: 'natural-single',
    managerName: '서민지',
    phone: '02-786-4413',
    createdAt: '2026-04-26T10:05:00',
    updatedAt: '2026-04-26T10:05:00',
  },
  {
    id: 'RCV-006',
    code: 'RCV-006',
    companyName: '아틀리에패브',
    industryGroup: '패션 잡화',
    productTypes: ['에코백', '파우치', '헤어 액세서리'],
    productNote: '면과 캔버스류 재고를 잡화로 전환하는 작업 비중이 높고, 프린트 가공 연계가 가능합니다.',
    description: '천연 섬유 기반의 패션 잡화를 제작하는 거래처입니다. 면 티셔츠/셔츠 원단, 캔버스 재고, 팬츠류 잔원단을 재가공하기 좋습니다.',
    primaryMaterialFit: 'natural-single',
    managerName: '윤지호',
    phone: '070-4421-3385',
    createdAt: '2026-04-26T11:20:00',
    updatedAt: '2026-04-26T11:20:00',
  },
  {
    id: 'RCV-007',
    code: 'RCV-007',
    companyName: '린넨하우스',
    industryGroup: '홈텍스타일',
    productTypes: ['커튼 라이너', '베개 커버', '러너 패브릭'],
    productNote: '린넨/면 혼합감이 있는 천연 원단을 홈 패브릭으로 재단하는 공정이 안정적입니다.',
    description: '홈패브릭 전문 거래처로 촉감과 통기성을 중시합니다. 봄/여름 시즌 천연 섬유 재고를 소품류로 전환하기 좋은 파트너입니다.',
    primaryMaterialFit: 'natural-single',
    managerName: '민하정',
    phone: '051-920-7351',
    createdAt: '2026-04-26T12:15:00',
    updatedAt: '2026-04-26T12:15:00',
  },
  {
    id: 'RCV-008',
    code: 'RCV-008',
    companyName: '메디코튼 케어',
    industryGroup: '의료/위생',
    productTypes: ['위생 보조 커버', '면 패드 외피', '보호용 라이너'],
    productNote: '직접 피부 접촉이 가능한 천연 원단만 선별 적용하며, 세척/살균 공정 연계가 가능합니다.',
    description: '위생 보조재를 제작하는 거래처입니다. 천연 섬유 재고의 청결 상태와 균일한 두께를 중요하게 보며, 의료 등급은 아니지만 위생 규격을 준수합니다.',
    primaryMaterialFit: 'natural-single',
    managerName: '노정원',
    phone: '032-400-1911',
    createdAt: '2026-04-26T13:10:00',
    updatedAt: '2026-04-26T13:10:00',
  },
  {
    id: 'RCV-009',
    code: 'RCV-009',
    companyName: '업사이클 팜텍',
    industryGroup: '농업',
    productTypes: ['과실 보호 커버', '재배용 보조천', '운반 완충 내피'],
    productNote: '야외 사용 기준으로 내구성 테스트를 거쳐 농업용 부자재에 적용합니다.',
    description: '농업용 보조재 거래처로, 색상보다는 내구성과 통기성 중심으로 원단을 평가합니다. 재고 수량이 균일하지 않아도 단계별 소진이 가능합니다.',
    primaryMaterialFit: 'natural-single',
    managerName: '정준형',
    phone: '064-733-8820',
    createdAt: '2026-04-26T14:05:00',
    updatedAt: '2026-04-26T14:05:00',
  },
  {
    id: 'RCV-010',
    code: 'RCV-010',
    companyName: '스튜디오 누보',
    industryGroup: '패션 잡화',
    productTypes: ['핸드메이드 파우치', '미니 토트', '소형 보관백'],
    productNote: '천연 원단의 색상 조합을 활용해 소량 고감도 잡화 생산에 강점이 있습니다.',
    description: '디자인 감도가 높은 소량 생산 거래처입니다. 재고별 색감과 질감 매칭을 중요하게 보고, 시즌성 컬러 재고를 소품으로 빠르게 전환할 수 있습니다.',
    primaryMaterialFit: 'natural-single',
    managerName: '한예림',
    phone: '02-554-3098',
    createdAt: '2026-04-26T15:00:00',
    updatedAt: '2026-04-26T15:00:00',
  },

  // synthetic (10)
  {
    id: 'RCV-011',
    code: 'RCV-011',
    companyName: '액티브리본',
    industryGroup: '단체복/워크웨어',
    productTypes: ['보급형 트레이닝복', '워크웨어 유니폼'],
    productNote: '폴리와 기능성 혼용 원단을 단체복과 현장용 유니폼으로 재구성하는 생산 라인을 보유하고 있습니다.',
    description: '합성 섬유 기반 재고를 단체복과 워크웨어로 전환하는 거래처입니다. 폴리 바지, 트레이닝 세트, 기능성 티셔츠처럼 내구성과 대량 생산성이 중요한 재고군에 적합합니다.',
    primaryMaterialFit: 'synthetic',
    managerName: '박도윤',
    phone: '031-440-1288',
    createdAt: '2026-04-21T10:30:00',
    updatedAt: '2026-04-21T10:30:00',
  },
  {
    id: 'RCV-012',
    code: 'RCV-012',
    companyName: '기어리본',
    industryGroup: '아웃도어 잡화',
    productTypes: ['캠핑용 파우치', '기능성 소형 가방'],
    productNote: '폴리 기반 원단과 생활 방수 재고를 활용한 소형 아웃도어 소품 생산 경험이 많습니다.',
    description: '폴리 베이스 순환 재고를 아웃도어 소품과 수납형 잡화로 재가공하는 거래처입니다. 스포츠 팬츠, 바람막이, 가벼운 기능성 원단 재고와 잘 맞습니다.',
    primaryMaterialFit: 'synthetic',
    managerName: '최민준',
    phone: '032-880-7741',
    createdAt: '2026-04-23T14:15:00',
    updatedAt: '2026-04-25T16:10:00',
  },
  {
    id: 'RCV-013',
    code: 'RCV-013',
    companyName: '메디패브 케어',
    industryGroup: '의료/위생',
    productTypes: ['위생 커버', '일회용 보조 패드', '보호용 직물 라이너'],
    productNote: '균일한 재단이 가능한 합성 원단을 위생 보조재 형태로 전환하는 데 강점이 있습니다.',
    description: '의료 및 위생 보조용 직물 제품을 제작하는 거래처입니다. 직접 의복보다는 보호용 커버와 라이너 성격의 제품이 많아, 균일한 두께의 합성 재고에 적합합니다.',
    primaryMaterialFit: 'synthetic',
    managerName: '남지훈',
    phone: '032-445-9190',
    createdAt: '2026-04-24T14:00:00',
    updatedAt: '2026-04-24T14:00:00',
  },
  {
    id: 'RCV-014',
    code: 'RCV-014',
    companyName: '유니폼크래프트',
    industryGroup: '유니폼',
    productTypes: ['학원 유니폼', '서비스 유니폼', '행사용 조끼'],
    productNote: '대량 맞춤형 유니폼 생산 경험이 많아 색상과 규격이 일정한 재고를 선호합니다.',
    description: '서비스업과 교육기관용 유니폼을 제작하는 거래처입니다. 폴리 셔츠, 조끼, 슬랙스 계열 재고처럼 규격화된 품목을 다시 활용하기 좋습니다.',
    primaryMaterialFit: 'synthetic',
    managerName: '한소이',
    phone: '02-517-4812',
    createdAt: '2026-04-25T16:45:00',
    updatedAt: '2026-04-25T16:45:00',
  },
  {
    id: 'RCV-015',
    code: 'RCV-015',
    companyName: '패키지루프',
    industryGroup: '물류 패키징',
    productTypes: ['완충 포장재', '직물 포장 슬리브', '재사용 운반 커버'],
    productNote: '합성 원단을 물류 포장 보조재와 보호 커버로 전환하는 데 특화되어 있습니다.',
    description: '물류 및 패키징 보조재를 제작하는 거래처입니다. 생활 방수 원단, 폴리 잔량, 재단 후 남은 넓은 면적의 원단을 활용하기 좋습니다.',
    primaryMaterialFit: 'synthetic',
    managerName: '조성민',
    phone: '031-998-6615',
    createdAt: '2026-04-26T14:20:00',
    updatedAt: '2026-04-26T14:20:00',
  },
  {
    id: 'RCV-016',
    code: 'RCV-016',
    companyName: '블루마린 기어',
    industryGroup: '해양/수산',
    productTypes: ['어구 보조 커버', '방수 보관백', '선상 작업 조끼'],
    productNote: '내습성과 마찰 강도가 필요한 해양 보조재 생산 비중이 높습니다.',
    description: '해양 작업 환경용 보조 제품을 제작합니다. 합성 섬유 재고 중 방수/내구 특성이 있는 품목과 매칭 효과가 높습니다.',
    primaryMaterialFit: 'synthetic',
    managerName: '오태경',
    phone: '051-804-2914',
    createdAt: '2026-04-27T09:10:00',
    updatedAt: '2026-04-27T09:10:00',
  },
  {
    id: 'RCV-017',
    code: 'RCV-017',
    companyName: '워크프로텍트',
    industryGroup: '단체복/워크웨어',
    productTypes: ['작업복 바지', '안전 조끼', '현장용 외피'],
    productNote: '강도 테스트를 통과한 합성 원단 위주로 작업복 라인을 구성합니다.',
    description: '현장 작업복 제작 비중이 높은 거래처입니다. 폴리/나일론 기반 재고, 내구 코팅 원단, 두께감 있는 외피 재고 소화에 강점이 있습니다.',
    primaryMaterialFit: 'synthetic',
    managerName: '김하겸',
    phone: '031-552-3077',
    createdAt: '2026-04-27T10:20:00',
    updatedAt: '2026-04-27T10:20:00',
  },
  {
    id: 'RCV-018',
    code: 'RCV-018',
    companyName: '시티레저팩',
    industryGroup: '레저/기어',
    productTypes: ['레저용 파우치', '기어 정리 백', '휴대 장비 커버'],
    productNote: '도시형 레저 소품으로 전환하는 가공 경험이 많아 색상별 배치가 빠릅니다.',
    description: '레저 소품 중심 거래처로 합성 재고를 활용한 파우치/커버류 생산에 집중합니다. 얇은 기능성 원단과 중간 두께 재고 모두 수용 가능합니다.',
    primaryMaterialFit: 'synthetic',
    managerName: '문서우',
    phone: '02-6743-1120',
    createdAt: '2026-04-27T11:40:00',
    updatedAt: '2026-04-27T11:40:00',
  },
  {
    id: 'RCV-019',
    code: 'RCV-019',
    companyName: '라이프몰드',
    industryGroup: '생활 잡화',
    productTypes: ['수납 커버', '보호 슬리브', '생활 완충재'],
    productNote: '합성 섬유 재고를 사출 보조재와 직물 부자재로 결합하는 하이브리드 공정을 운영합니다.',
    description: '생활 잡화 제조사로 합성 원단의 강도와 수축률 데이터를 기반으로 매칭합니다. 단순 재단부터 부자재 결합까지 처리 가능한 파트너입니다.',
    primaryMaterialFit: 'synthetic',
    managerName: '전도현',
    phone: '070-7921-5599',
    createdAt: '2026-04-27T13:00:00',
    updatedAt: '2026-04-27T13:00:00',
  },
  {
    id: 'RCV-020',
    code: 'RCV-020',
    companyName: '에어쉴드 패브',
    industryGroup: '구호 용품',
    productTypes: ['긴급 보온 커버', '생활 구호 키트 외피', '휴대형 방수 포켓'],
    productNote: '빠른 대량 생산이 가능한 합성 원단 라인으로 단납기 대응 경험이 많습니다.',
    description: '구호 용품 납품 경험이 있는 거래처입니다. 재고의 기능성을 우선 평가하며, 방수/내구 성능이 있는 합성 품목을 우선 소진할 수 있습니다.',
    primaryMaterialFit: 'synthetic',
    managerName: '백나윤',
    phone: '032-812-5052',
    createdAt: '2026-04-27T14:10:00',
    updatedAt: '2026-04-27T14:10:00',
  },

  // blended (10)
  {
    id: 'RCV-021',
    code: 'RCV-021',
    companyName: '빌드업',
    industryGroup: '건설 자재',
    productTypes: ['벽체 단열재', '흡음 패널'],
    productNote: '혼방 원단과 재고 뭉치를 압축 가공해 건축용 흡음재와 단열재 원판으로 재생산합니다.',
    description: '혼방 섬유와 다층 구조 재고를 압축 패널로 전환하는 건설 자재 업체입니다. 재킷, 후디, 충전재가 포함된 잔재고처럼 혼합 구조 재고와의 매칭이 좋습니다.',
    primaryMaterialFit: 'blended',
    managerName: '정하늘',
    phone: '051-720-3390',
    createdAt: '2026-04-22T11:40:00',
    updatedAt: '2026-04-22T11:40:00',
  },
  {
    id: 'RCV-022',
    code: 'RCV-022',
    companyName: '펫리본 스튜디오',
    industryGroup: '반려동물 용품',
    productTypes: ['반려동물 쿠션', '이동가방 내피', '장난감 충전재'],
    productNote: '부드러운 혼방 재고나 충전 가능한 섬유 재고를 반려동물용 완충 소재로 활용합니다.',
    description: '반려동물 용품을 제작하는 거래처로, 직접 피부 접촉이 가능한 부드러운 재고를 선호합니다. 혼방 티셔츠, 스웻 셔츠, 누빔 잔량처럼 쿠션감이 있는 재고와 궁합이 좋습니다.',
    primaryMaterialFit: 'blended',
    managerName: '이은채',
    phone: '031-771-2044',
    createdAt: '2026-04-24T11:05:00',
    updatedAt: '2026-04-24T11:05:00',
  },
  {
    id: 'RCV-023',
    code: 'RCV-023',
    companyName: '어반어쿠스틱',
    industryGroup: '음향 기기',
    productTypes: ['스피커 흡음재', '케이스 내부 완충재'],
    productNote: '혼방 및 비의류 재고를 절단 가공해 흡음 보조재와 내부 완충재로 활용합니다.',
    description: '음향 기기 내부에 들어가는 흡음 및 완충용 자재를 제작하는 거래처입니다. 겉감 품질보다 밀도와 완충감이 중요해 혼방 재고나 두께감 있는 잔량과 잘 맞습니다.',
    primaryMaterialFit: 'blended',
    managerName: '송재윤',
    phone: '070-8831-1204',
    createdAt: '2026-04-25T09:10:00',
    updatedAt: '2026-04-25T09:10:00',
  },
  {
    id: 'RCV-024',
    code: 'RCV-024',
    companyName: '폼앤패드',
    industryGroup: '자동차 흡음',
    productTypes: ['도어 흡음 패드', '트렁크 완충재', '내장 보조 패널'],
    productNote: '혼방 섬유와 잔패딩 재고를 자동차 내부 완충재로 재구성하는 테스트 경험이 많습니다.',
    description: '자동차 내장용 흡음 및 완충 자재를 제작하는 거래처입니다. 후드, 점퍼, 충전재 잔량처럼 층이 있는 재고를 활용한 전환 가능성이 높습니다.',
    primaryMaterialFit: 'blended',
    managerName: '구태형',
    phone: '052-701-8824',
    createdAt: '2026-04-26T10:00:00',
    updatedAt: '2026-04-26T10:00:00',
  },
  {
    id: 'RCV-025',
    code: 'RCV-025',
    companyName: '믹스라인 소모재',
    industryGroup: '산업 소모품',
    productTypes: ['작업용 완충 패드', '산업용 필터 외피', '보호 커버'],
    productNote: '혼방/잔패딩 계열 재고를 공정 보조재로 전환하는 표준화된 절단 공정을 운영합니다.',
    description: '산업 소모품 거래처로 완성 의류보다는 소재 물성 중심으로 재고를 평가합니다. 반복 납품이 필요한 균일한 배치 생산에 강점이 있습니다.',
    primaryMaterialFit: 'blended',
    managerName: '강태원',
    phone: '031-724-6388',
    createdAt: '2026-04-27T09:50:00',
    updatedAt: '2026-04-27T09:50:00',
  },
  {
    id: 'RCV-026',
    code: 'RCV-026',
    companyName: '인테리어 루프',
    industryGroup: '인테리어',
    productTypes: ['패브릭 월보드', '흡음 패널 커버', '공간 분리 천'],
    productNote: '색상 편차가 있는 혼방 재고도 패널 커버용으로 재배치할 수 있는 가공 노하우가 있습니다.',
    description: '인테리어 자재 제작 업체입니다. 외관 완성도와 내구성을 동시에 보며, 혼방 재고를 공간용 패브릭으로 전환하는 프로젝트 경험이 많습니다.',
    primaryMaterialFit: 'blended',
    managerName: '박수현',
    phone: '02-6934-2047',
    createdAt: '2026-04-27T11:00:00',
    updatedAt: '2026-04-27T11:00:00',
  },
  {
    id: 'RCV-027',
    code: 'RCV-027',
    companyName: '에코에너지 매트',
    industryGroup: '에너지',
    productTypes: ['보온 보조 매트', '배관 완충 외피', '설비 보호재'],
    productNote: '혼방 재고를 에너지 설비 보조재로 활용하는 시험 생산을 상시 운영합니다.',
    description: '에너지 설비 보조재를 제작하는 거래처입니다. 두께감 있는 혼방 재고와 패딩 잔량을 보온/완충 용도로 전환하는 수요가 꾸준합니다.',
    primaryMaterialFit: 'blended',
    managerName: '권유성',
    phone: '042-337-1902',
    createdAt: '2026-04-27T12:20:00',
    updatedAt: '2026-04-27T12:20:00',
  },
  {
    id: 'RCV-028',
    code: 'RCV-028',
    companyName: '하이브리드 퍼니처',
    industryGroup: '가구 자재',
    productTypes: ['의자 내피', '쿠션 충전 보조재', '소파 완충층'],
    productNote: '혼방 및 충전재 재고를 가구 내장 보조층으로 전환하는 전용 라인을 운영합니다.',
    description: '가구 내장재 업체로 원단의 외관보다 탄성, 내구성, 압축 복원력을 중시합니다. 혼방 재고의 정기 소진 루트로 활용하기 좋습니다.',
    primaryMaterialFit: 'blended',
    managerName: '이지웅',
    phone: '053-442-7804',
    createdAt: '2026-04-27T13:40:00',
    updatedAt: '2026-04-27T13:40:00',
  },
  {
    id: 'RCV-029',
    code: 'RCV-029',
    companyName: '에코빌드 모듈',
    industryGroup: '건설 자재',
    productTypes: ['경량 단열 모듈', '흡음 보조층', '패널 내장재'],
    productNote: '혼방 재고를 파쇄-압축-성형하는 모듈형 공정을 통해 건설 자재로 전환합니다.',
    description: '건설 모듈 자재 제작사로 대량 혼방 재고의 흡수력이 좋습니다. 시즌 종료 후 대량 잔재고 처리에 적합한 파트너입니다.',
    primaryMaterialFit: 'blended',
    managerName: '최승범',
    phone: '031-665-4980',
    createdAt: '2026-04-27T14:50:00',
    updatedAt: '2026-04-27T14:50:00',
  },
  {
    id: 'RCV-030',
    code: 'RCV-030',
    companyName: '리뉴컴포트',
    industryGroup: '생활 잡화',
    productTypes: ['완충 파우치', '수납형 내피', '보호용 커버'],
    productNote: '혼방 원단과 충전재 재고를 생활용 완충 소품으로 재구성하는 생산 흐름이 안정적입니다.',
    description: '생활용 완충 소품 제작 거래처입니다. 단일 소재보다 혼합 구조 재고를 선호하며, 소량 다품종 형태로도 소진 가능성이 높습니다.',
    primaryMaterialFit: 'blended',
    managerName: '신유라',
    phone: '070-5188-3316',
    createdAt: '2026-04-27T15:40:00',
    updatedAt: '2026-04-27T15:40:00',
  },
]

function loadJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function nowIso() {
  return new Date().toISOString()
}

function createEmptyBuyerForm() {
  return {
    code: '',
    companyName: '',
    industryGroup: '',
    productTypes: [],
    productNote: '',
    description: '',
    primaryMaterialFit: '',
    managerName: '',
    phone: '',
  }
}

function normalizeProductTypes(productTypes) {
  if (Array.isArray(productTypes)) {
    return [...new Set(
      productTypes
        .map(item => String(item ?? '').trim())
        .filter(Boolean),
    )]
  }

  return [...new Set(
    String(productTypes ?? '')
      .split('\n')
      .flatMap(line => line.split(','))
      .map(item => item.trim())
      .filter(Boolean),
  )]
}

function materialFitLabel(value) {
  return MATERIAL_FIT_OPTIONS.find(option => option.value === value)?.label ?? '-'
}

function normalizeBuyerPayload(payload) {
  return {
    code: String(payload.code ?? '').trim(),
    companyName: String(payload.companyName ?? '').trim(),
    industryGroup: String(payload.industryGroup ?? '').trim(),
    productTypes: normalizeProductTypes(payload.productTypes),
    productNote: String(payload.productNote ?? '').trim(),
    description: String(payload.description ?? '').trim(),
    primaryMaterialFit: String(payload.primaryMaterialFit ?? '').trim(),
    managerName: String(payload.managerName ?? '').trim(),
    phone: String(payload.phone ?? '').trim(),
  }
}

function validateBuyerPayload(payload, existingBuyers, currentBuyerId = '') {
  const errors = {}

  if (!payload.companyName) errors.companyName = '업체명을 입력해주세요.'
  if (!payload.code) errors.code = '거래처 코드를 입력해주세요.'
  if (!payload.industryGroup) errors.industryGroup = '산업군을 선택해주세요.'
  if (!payload.primaryMaterialFit) errors.primaryMaterialFit = '대표 소재 적합도를 선택해주세요.'
  if (!payload.managerName) errors.managerName = '담당자명을 입력해주세요.'
  if (!payload.phone) errors.phone = '연락처를 입력해주세요.'

  const duplicateCode = existingBuyers.find(buyer =>
    buyer.code.toLowerCase() === payload.code.toLowerCase() && buyer.id !== currentBuyerId,
  )
  if (duplicateCode) {
    errors.code = '이미 등록된 거래처 코드입니다.'
  }

  return errors
}

function mergeSeedBuyers(savedBuyers) {
  const savedList = Array.isArray(savedBuyers) ? savedBuyers : []
  const merged = [...savedList]

  for (const seedBuyer of INITIAL_BUYERS) {
    const exists = merged.some(buyer =>
      buyer.id === seedBuyer.id || buyer.code === seedBuyer.code,
    )

    if (!exists) {
      merged.push(seedBuyer)
    }
  }

  return merged
}

export const useCircularInventoryBuyerStore = defineStore('circularInventoryBuyers', () => {
  const buyers = ref(mergeSeedBuyers(loadJson(BUYER_STORAGE_KEY, INITIAL_BUYERS)))

  const sortedBuyers = computed(() =>
    [...buyers.value].sort((a, b) => (
      a.companyName.localeCompare(b.companyName, 'ko')
      || a.code.localeCompare(b.code, 'ko')
    )),
  )

  function persist() {
    saveJson(BUYER_STORAGE_KEY, buyers.value)
  }

  function getBuyerById(id) {
    return buyers.value.find(buyer => buyer.id === id) ?? null
  }

  function filteredBuyers(keyword = '', options = {}) {
    const normalized = keyword.trim().toLowerCase()
    const materialFit = options.primaryMaterialFit ?? ''

    return sortedBuyers.value.filter((buyer) => {
      const matchesMaterialFit = !materialFit || buyer.primaryMaterialFit === materialFit
      const matchesKeyword = !normalized || [
        buyer.code,
        buyer.companyName,
        buyer.managerName,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized)

      return matchesMaterialFit && matchesKeyword
    })
  }

  function createBuyer(payload) {
    const normalizedPayload = normalizeBuyerPayload(payload)
    const errors = validateBuyerPayload(normalizedPayload, buyers.value)
    if (Object.keys(errors).length > 0) {
      return { success: false, errors, message: '필수 입력값을 확인해주세요.' }
    }

    const timestamp = nowIso()
    const buyer = {
      id: `RCV-${String(Date.now()).slice(-6)}`,
      ...normalizedPayload,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    buyers.value = [buyer, ...buyers.value]
    persist()
    return { success: true, buyer }
  }

  function updateBuyer(id, payload) {
    const currentBuyer = getBuyerById(id)
    if (!currentBuyer) {
      return { success: false, message: '수정할 거래처를 찾을 수 없습니다.' }
    }

    const normalizedPayload = normalizeBuyerPayload(payload)
    const errors = validateBuyerPayload(normalizedPayload, buyers.value, id)
    if (Object.keys(errors).length > 0) {
      return { success: false, errors, message: '필수 입력값을 확인해주세요.' }
    }

    buyers.value = buyers.value.map((buyer) => (
      buyer.id === id
        ? {
          ...buyer,
          ...normalizedPayload,
          updatedAt: nowIso(),
        }
        : buyer
    ))
    persist()
    return { success: true, buyer: getBuyerById(id) }
  }

  return {
    buyers,
    sortedBuyers,
    MATERIAL_FIT_OPTIONS,
    INDUSTRY_GROUP_OPTIONS,
    createEmptyBuyerForm,
    materialFitLabel,
    getBuyerById,
    filteredBuyers,
    createBuyer,
    updateBuyer,
  }
})
