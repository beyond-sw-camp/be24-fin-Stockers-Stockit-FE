<script setup>
import { ref, computed } from 'vue'
import { ShieldCheck, UserPlus, Store, Warehouse, Building2 } from 'lucide-vue-next'
import { userApi } from '@/api/user/user.js'


const form = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirm: '',
  region: '',        // 지역 코드 (필터링용) — 'SL'|'GG'|... — BE 미전송
  storeCode: '',     // 선택된 인프라 코드 (예: 'WH-SL-0001') — BE locationCode 로 전송
  storeName: '',     // 선택된 인프라 이름 (예: '수도권 통합 물류센터') — BE locationName 으로 전송
  role: '',
  reason: '',
})

/**
 * 회원가입 시 선택 가능한 지점 인프라 — BE infrastructure 더미 데이터와 동기화.
 *  code 형식: '{권한prefix}-{지역}-{순번}' (예: WH-SL-0001, ST-BS-0001)
 *  type    : 'STORE' | 'WAREHOUSE'
 */
const infrastructureData = [
  // ─── 창고 (WAREHOUSE) ───
  { code: 'WH-SL-0001', type: 'WAREHOUSE', name: '수도권 통합 물류센터' },
  { code: 'WH-GG-0001', type: 'WAREHOUSE', name: '경기 남부 허브 창고' },
  { code: 'WH-IC-0001', type: 'WAREHOUSE', name: '인천 항만 물류센터' },
  { code: 'WH-CN-0001', type: 'WAREHOUSE', name: '충청권 중계 센터' },
  { code: 'WH-YN-0001', type: 'WAREHOUSE', name: '영남권 거점 창고' },
  { code: 'WH-GW-0001', type: 'WAREHOUSE', name: '강원 동부 보관창고' },
  { code: 'WH-HN-0001', type: 'WAREHOUSE', name: '호남권 메가 허브' },
  { code: 'WH-JJ-0001', type: 'WAREHOUSE', name: '제주 저온 복합창고' },
  // ─── 매장 (STORE) ───
  { code: 'ST-SL-0001', type: 'STORE', name: '강남 플래그십점' },
  { code: 'ST-SL-0002', type: 'STORE', name: '홍대 라이프스타일점' },
  { code: 'ST-GG-0001', type: 'STORE', name: '수원 광교점' },
  { code: 'ST-GG-0002', type: 'STORE', name: '분당 서현점' },
  { code: 'ST-BS-0001', type: 'STORE', name: '부산 센텀점' },
  { code: 'ST-DJ-0001', type: 'STORE', name: '대전 둔산점' },
  { code: 'ST-IC-0001', type: 'STORE', name: '인천 송도점' },
  { code: 'ST-IC-0002', type: 'STORE', name: '인천 부평점' },
  { code: 'ST-GW-0001', type: 'STORE', name: '강릉 중앙점' },
  { code: 'ST-GW-0002', type: 'STORE', name: '원주 혁신점' },
  { code: 'ST-GJ-0001', type: 'STORE', name: '광주 상무점' },
  { code: 'ST-GJ-0002', type: 'STORE', name: '광주 충장점' },
  { code: 'ST-JJ-0001', type: 'STORE', name: '제주 노형점' },
  { code: 'ST-JJ-0002', type: 'STORE', name: '제주 서귀포점' },
]

// code 의 두 번째 토큰이 지역 코드 (예: 'WH-SL-0001' → 'SL')
const extractRegion = (code) => (code ?? '').split('-')[1] ?? ''

/**
 * 권한 + 지역으로 필터된 지점 목록.
 *  - HQ : 빈 배열 (본사는 단일 지점이라 필터 사용 안 함)
 *  - STORE/WAREHOUSE : 해당 type + region 매칭만 표시
 */
const filteredInfrastructures = computed(() => {
  const role = form.value.role
  const region = form.value.region
  if (!role || role === 'hq' || !region) return []
  const typeKey = role === 'store' ? 'STORE' : 'WAREHOUSE'
  return infrastructureData.filter(i =>
    i.type === typeKey && extractRegion(i.code) === region,
  )
})

// 지점 코드 — 11개 광역 지역
const locationCodeOptions = [
  { code: 'SL', name: '서울' },
  { code: 'GG', name: '경기' },
  { code: 'IC', name: '인천' },
  { code: 'BS', name: '부산' },
  { code: 'DJ', name: '대전' },
  { code: 'GJ', name: '광주' },
  { code: 'GW', name: '강원' },
  { code: 'JJ', name: '제주' },
  { code: 'CN', name: '충청' },
  { code: 'YN', name: '영남' },
  { code: 'HN', name: '호남' },
]

const roleOptions = [
  {
    id: 'hq',
    label: '본사 관리자',
    desc: '전사 운영·정책 담당',
    icon: Building2,
    detail: '전체 매장 창고 현황, 사용자 권한 관리, 통합 통계 확인이 가능합니다.',
  },
  {
    id: 'store',
    label: '매장 관리자',
    desc: '매장 재고·발주 담당',
    icon: Store,
    detail: '매장 재고 조회·수정, 발주 신청, 판매 현황 및 통계 확인이 가능합니다.',
  },
  {
    id: 'warehouse',
    label: '창고 관리자',
    desc: '창고 입출고 담당',
    icon: Warehouse,
    detail: '창고 입출고 처리, 재고 이동 승인, 전체 창고 현황 관리가 가능합니다.',
  },
]

const selectedRole = computed(() => roleOptions.find(o => o.id === form.value.role) ?? null)

// 헤더에 표시할 지점/창고 정보
//  - 매장(store):   "ST-SL-0001 → 서울 (SL)"
//  - 창고(warehouse): "서울 (SL) · 수도권 통합 물류센터"
//  - hq / 미선택: null
const headerLocationLabel = computed(() => {
  const role = form.value.role
  if (role !== 'store' && role !== 'warehouse') return null

  const code = form.value.storeCode
  if (!code) return null

  const regionCode = extractRegion(code)
  const regionName = locationCodeOptions.find(o => o.code === regionCode)?.name ?? regionCode
  const infra = infrastructureData.find(i => i.code === code)

  if (role === 'store') {
    return `${code} → ${regionName} (${regionCode})`
  }
  return `${regionName} (${regionCode}) · ${infra?.name ?? ''}`
})

const isSubmitting = ref(false)
const submitted = ref(false)
const errors = ref({})

// 화면 표시용 전화번호 (하이픈 포함, ex. 010-1234-5678)
// — form.phone 에는 항상 숫자만 11자리 보관 (BE 전송용)
const phoneDisplay = ref('')

// 검증 정규식 — 마이페이지와 동일 정책
const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX    = /^010\d{8}$/                                          // 하이픈 없이 010 + 숫자 8자리
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%&*^]).{8,}$/
const NAME_REGEX     = /^[가-힣\s]+$/                                         // 한글(완성형) + 공백만

/**
 * 이름 입력 시 실시간 검증 — 한글/공백 외 문자가 있으면 에러 메시지 표시.
 * 입력 자체는 막지 않음 (한글 IME 자모 조합과 충돌 회피 + 사용자가 잘못 입력한 사실을 직관적으로 인지).
 */
function onNameInput() {
  const name = form.value.name ?? ''
  if (name && !NAME_REGEX.test(name)) {
    errors.value.name = '이름은 한글로만 입력 가능합니다.'
  } else if (errors.value.name) {
    delete errors.value.name
  }
}

/**
 * 이메일 실시간 검증 — 형식이 맞지 않으면 에러 메시지.
 */
function onEmailInput() {
  const email = (form.value.email ?? '').trim()
  if (email && !EMAIL_REGEX.test(email)) {
    errors.value.email = '이메일 형식이 아닙니다.'
  } else if (errors.value.email) {
    delete errors.value.email
  }
}

/**
 * 비밀번호 실시간 검증 — 정책 미충족 시 즉시 에러.
 * 비밀번호 변경에 따라 "비밀번호 확인" 일치 여부도 동시에 갱신.
 */
function onPasswordInput() {
  const pw = form.value.password ?? ''
  if (pw && !PASSWORD_REGEX.test(pw)) {
    errors.value.password = '대문자, 소문자, 숫자, 특수문자(!@#$%&*^) 포함 8자 이상이어야 합니다.'
  } else if (errors.value.password) {
    delete errors.value.password
  }

  // 비밀번호가 바뀌면 확인 필드와의 일치 여부도 다시 평가
  const confirm = form.value.passwordConfirm ?? ''
  if (confirm && confirm !== pw) {
    errors.value.passwordConfirm = '비밀번호가 일치하지 않습니다.'
  } else if (errors.value.passwordConfirm) {
    delete errors.value.passwordConfirm
  }
}

/**
 * 비밀번호 확인 실시간 검증 — 비밀번호와 일치하지 않으면 즉시 에러.
 */
function onPasswordConfirmInput() {
  const confirm = form.value.passwordConfirm ?? ''
  if (confirm && confirm !== form.value.password) {
    errors.value.passwordConfirm = '비밀번호가 일치하지 않습니다.'
  } else if (errors.value.passwordConfirm) {
    delete errors.value.passwordConfirm
  }
}

/**
 * 전화번호 입력 단계 — 숫자 외 키 입력 차단.
 * 사용자가 영문/특수문자/한글을 눌러도 화면에 잠깐도 표시되지 않음.
 * 단, 백스페이스/방향키/탭/단축키(Ctrl+V 등)는 정상 동작 (e.data === null 케이스).
 */
function onPhoneBeforeInput(e) {
  if (e.data && !/^\d+$/.test(e.data)) {
    e.preventDefault()
  }
}

/**
 * 전화번호 입력 시 숫자만 추출 → form.phone(저장용) + phoneDisplay(표시용) 동기화.
 *   - form.phone        : "01012345678"      (BE 전송용, 하이픈 없음)
 *   - phoneDisplay      : "010-1234-5678"    (화면 표시용, 자동 하이픈)
 * 11자리(010 + 8) 까지만 받음.
 *
 * onPhoneBeforeInput 으로 1차 차단되지만, 붙여넣기/IME/구형 브라우저 대비 안전망 역할도 함.
 */
function onPhoneInput(e) {
  const digits = (e.target.value || '').replace(/\D/g, '').slice(0, 11)
  form.value.phone = digits

  if (digits.length <= 3) {
    phoneDisplay.value = digits
  } else if (digits.length <= 7) {
    phoneDisplay.value = `${digits.slice(0, 3)}-${digits.slice(3)}`
  } else {
    phoneDisplay.value = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }

  if (errors.value.phone) delete errors.value.phone
}

function validate() {
  const e = {}

  // 이름 — 한글만 허용 + 8자 이내
  if (!form.value.name.trim()) {
    e.name = '이름을 입력해주세요.'
  } else if (!NAME_REGEX.test(form.value.name.trim())) {
    e.name = '이름은 한글로만 입력 가능합니다.'
  } else if (form.value.name.trim().length > 8) {
    e.name = '이름은 8자 이내로 입력해주세요.'
  }

  // 이메일
  if (!form.value.email.trim()) {
    e.email = '이메일을 입력해주세요.'
  } else if (!EMAIL_REGEX.test(form.value.email)) {
    e.email = '이메일 형식이 아닙니다.'
  }

  // 전화번호 (form.phone 에는 항상 숫자만 저장됨)
  if (!form.value.phone.trim()) {
    e.phone = '전화번호를 입력해주세요.'
  } else if (!PHONE_REGEX.test(form.value.phone)) {
    e.phone = '전화번호는 010 으로 시작하는 11자리 숫자여야 합니다. 예) 010-1234-5678'
  }

  // 비밀번호 (대소문자/숫자/특수문자 8자 이상)
  if (!form.value.password) {
    e.password = '비밀번호를 입력해주세요.'
  } else if (!PASSWORD_REGEX.test(form.value.password)) {
    e.password = '대문자, 소문자, 숫자, 특수문자(!@#$%&*^) 포함 8자 이상이어야 합니다.'
  }

  // 비밀번호 확인
  if (!form.value.passwordConfirm) {
    e.passwordConfirm = '비밀번호 확인을 입력해주세요.'
  } else if (form.value.password !== form.value.passwordConfirm) {
    e.passwordConfirm = '비밀번호가 일치하지 않습니다.'
  }

  // 권한
  if (!form.value.role) e.role = '권한을 선택해주세요.'

  // 지점 정보 — 본사 관리자(hq)는 단일 지점이라 검증 스킵
  if (form.value.role !== 'hq') {
    if (!form.value.region) {
      e.region = '지역을 선택해주세요.'
    }
    if (!form.value.storeCode) {
      e.storeCode = '지점을 선택해주세요.'
    }
  }

  errors.value = e
  return Object.keys(e).length === 0
}


async function handleSubmit() {
  if (!validate()) return

  isSubmitting.value = true

  try {
    // 폼 필드명 → BE 요청 필드명 변환
    const payload = {
      name: form.value.name,
      email: form.value.email,
      password: form.value.password,
      phoneNumber: form.value.phone,                // phone → phoneNumber
      locationCode: form.value.storeCode,           // storeCode → locationCode
      locationName: form.value.storeName,           // storeName → locationName
      applicationReason: form.value.reason || '',   // reason → applicationReason
      role: form.value.role.toUpperCase(),          // 'hq' → 'HQ'
    }

    await userApi.signup(payload)
    submitted.value = true
  } catch (err) {
    alert(err?.message ?? '회원가입에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}



function clearErr(field) {
  if (errors.value[field]) delete errors.value[field]
}

// 본사 관리자(HQ)는 단일 지점(서울 본사)이므로 사용자가 지역/지점을 직접 선택하지 않는다.
// HQ 선택 시 자동으로 고정 인프라 코드/이름을 채워 BE 로 넘기고, 다른 권한으로 바꾸면 다시 비운다.
const HQ_REGION       = 'SL'
const HQ_LOCATION_CODE = 'HQ-SL-0001'
const HQ_LOCATION_NAME = '본사'

function applyRoleDefaults(role) {
  if (role === 'hq') {
    form.value.region    = HQ_REGION
    form.value.storeCode = HQ_LOCATION_CODE
    form.value.storeName = HQ_LOCATION_NAME
    delete errors.value.region
    delete errors.value.storeCode
    delete errors.value.storeName
  } else {
    // HQ 디폴트 값이 그대로 남아있으면 비워줌 (사용자가 새로 선택해야 함)
    if (form.value.storeCode === HQ_LOCATION_CODE && form.value.storeName === HQ_LOCATION_NAME) {
      form.value.region    = ''
      form.value.storeCode = ''
      form.value.storeName = ''
    }
  }
}

/**
 * 지역 셀렉트 변경 시 — 지점 선택을 초기화 (지역이 바뀌면 기존 지점은 무효).
 */
function onRegionChange() {
  form.value.storeCode = ''
  form.value.storeName = ''
  delete errors.value.region
  delete errors.value.storeCode
}

/**
 * 지점 셀렉트 변경 시 — 선택된 인프라의 name 을 자동 채움.
 */
function onInfraChange() {
  const found = infrastructureData.find(i => i.code === form.value.storeCode)
  form.value.storeName = found ? found.name : ''
  delete errors.value.storeCode
  delete errors.value.storeName
}
</script>

<template>
  <!-- 화면 전체를 중앙 정렬하여 스크롤 없이 꽉 차게 배치 -->
  <main class="flex min-h-screen items-center justify-center bg-[#f4f7f6] px-4 py-6">
    <section
        class="w-full max-w-[900px] overflow-hidden border border-[#dce5e2] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)]"
        aria-label="점주 계정 신청"
    >

      <!-- ── HEADER ── -->
      <div class="flex items-center justify-between gap-4 bg-[#004D3C] px-6 py-5">
        <div class="flex items-center gap-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center border border-white/40 bg-white text-[20px] font-black text-[#004D3C]">S</div>
          <div>
            <div class="flex items-baseline gap-2">
              <h1 class="text-[18px] font-black leading-tight text-white">Stockit 계정 신청</h1>
              <p class="text-[10px] font-black uppercase tracking-[0.14em] text-white/70">ERP System</p>
            </div>
            <p class="mt-0.5 text-[12px] text-white/70">신청 후 중앙 관리자의 승인이 완료되어야 로그인할 수 있습니다.</p>
            <!-- 매장/창고 선택 시 지점 정보 표시 -->
            <p
              v-if="headerLocationLabel"
              class="mt-1.5 inline-flex items-center gap-1.5 border border-white/30 bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white"
            >
              <span class="text-[9px] font-black uppercase tracking-widest text-white/60">
                {{ form.role === 'store' ? '매장' : '물류창고' }}
              </span>
              {{ headerLocationLabel }}
            </p>
          </div>
        </div>
        <div class="hidden shrink-0 items-center gap-1.5 border border-white/30 bg-white/10 px-2.5 py-1.5 text-xs font-black text-white sm:inline-flex">
          <ShieldCheck :size="14" />
          <span>RBAC</span>
        </div>
      </div>

      <!-- ── SUBMITTED (완료 화면) ── -->
      <div v-if="submitted" class="flex flex-col items-center px-8 py-16 text-center">
        <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eef7f4] text-[#004D3C]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <h2 class="text-[20px] font-black text-gray-900">신청이 접수되었습니다</h2>
        <p class="mt-2 text-[13px] leading-relaxed text-gray-500">
          중앙 관리자가 신청 내용을 검토한 후 입력하신 이메일로 결과를 안내드립니다.
        </p>
        <router-link to="/dev-login" class="mt-6 inline-flex h-10 items-center justify-center bg-[#004D3C] px-6 text-[13px] font-bold !text-white transition hover:bg-[#003d30]">
          로그인으로 돌아가기
        </router-link>
      </div>

      <!-- ── FORM (입력 화면) ── -->
      <form v-else novalidate class="px-6 py-6" @submit.prevent="handleSubmit">
        
        <!-- 좌우 2단 분할 레이아웃 -->
        <div class="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
          
          <!-- [왼쪽 영역] 01 신청자 정보 -->
          <div class="flex h-full flex-col gap-4">
            <div class="mb-1 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span class="flex h-4 w-4 shrink-0 items-center justify-center bg-[#004D3C] text-[9px] font-black text-white">01</span>
              <p class="text-[12px] font-black text-[#004D3C]">신청자 정보</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <label class="flex flex-col gap-1.5">
                <span class="text-[12px] font-bold text-gray-600">이름 <em class="not-italic text-red-500">*</em></span>
                <div :class="['flex h-9 items-center border bg-gray-50 px-3 transition focus-within:bg-white focus-within:border-[#004D3C]', errors.name ? 'border-red-400' : 'border-gray-300']">
                  <input v-model="form.name" type="text" maxlength="8" placeholder="홍길동" class="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" @input="onNameInput" />
                </div>
                <p v-if="errors.name" class="text-[11px] font-bold text-red-600">{{ errors.name }}</p>
              </label>

              <label class="flex flex-col gap-1.5">
                <span class="text-[12px] font-bold text-gray-600">휴대폰 <em class="not-italic text-red-500">*</em></span>
                <div :class="['flex h-9 items-center border bg-gray-50 px-3 transition focus-within:bg-white focus-within:border-[#004D3C]', errors.phone ? 'border-red-400' : 'border-gray-300']">
                  <input :value="phoneDisplay" type="tel" inputmode="numeric" maxlength="13" placeholder="010-1234-5678" class="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" @beforeinput="onPhoneBeforeInput" @input="onPhoneInput" />
                </div>
                <p v-if="errors.phone" class="text-[11px] font-bold text-red-600">{{ errors.phone }}</p>
              </label>
            </div>

            <label class="flex flex-col gap-1.5">
              <div class="flex items-baseline justify-between">
                <span class="text-[12px] font-bold text-gray-600">이메일 <em class="not-italic text-red-500">*</em></span>
              </div>
              <div :class="['flex h-9 items-center border bg-gray-50 px-3 transition focus-within:bg-white focus-within:border-[#004D3C]', errors.email ? 'border-red-400' : 'border-gray-300']">
                <input v-model="form.email" type="email" placeholder="example@stockit.com" class="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" @input="onEmailInput" />
              </div>
              <p v-if="errors.email" class="text-[11px] font-bold text-red-600">{{ errors.email }}</p>
            </label>

            <div class="mt-auto grid grid-cols-2 gap-3">
              <label class="flex flex-col gap-1.5">
                <span class="text-[12px] font-bold text-gray-600">비밀번호 <em class="not-italic text-red-500">*</em></span>
                <div :class="['flex h-9 items-center border bg-gray-50 px-3 transition focus-within:bg-white focus-within:border-[#004D3C]', errors.password ? 'border-red-400' : 'border-gray-300']">
                  <input v-model="form.password" type="password" placeholder="대소문자/숫자/특수문자 8자+" class="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" @input="onPasswordInput" />
                </div>
                <p v-if="errors.password" class="text-[11px] font-bold text-red-600">{{ errors.password }}</p>
              </label>

              <label class="flex flex-col gap-1.5">
                <span class="text-[12px] font-bold text-gray-600">비밀번호 확인 <em class="not-italic text-red-500">*</em></span>
                <div :class="['flex h-9 items-center border bg-gray-50 px-3 transition focus-within:bg-white focus-within:border-[#004D3C]', errors.passwordConfirm ? 'border-red-400' : 'border-gray-300']">
                  <input v-model="form.passwordConfirm" type="password" placeholder="비밀번호 재입력" class="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" @input="onPasswordConfirmInput" />
                </div>
                <p v-if="errors.passwordConfirm" class="text-[11px] font-bold text-red-600">{{ errors.passwordConfirm }}</p>
              </label>
            </div>
          </div>

          <!-- [오른쪽 영역] 02 권한 -->
          <div class="flex h-full flex-col gap-4">

            <div class="mb-1 flex items-center gap-2 border-b border-gray-100 pb-2">
              <span class="flex h-4 w-4 shrink-0 items-center justify-center bg-[#004D3C] text-[9px] font-black text-white">02</span>
              <p class="text-[12px] font-black text-[#004D3C]">지점 및 권한 정보</p>
            </div>

            <!-- 권한 선택 (위) -->
            <div class="flex flex-col gap-1.5">
              <span class="text-[12px] font-bold text-gray-600">권한 선택 <em class="not-italic text-red-500">*</em></span>
              <div class="grid grid-cols-3 gap-2">
                <button
                    v-for="opt in roleOptions"
                    :key="opt.id"
                    type="button"
                    :class="['flex items-center gap-2 border p-2 text-left transition', form.role === opt.id ? 'border-[#004D3C] bg-[#eef7f4]' : 'border-gray-200 bg-white hover:border-[#004D3C]']"
                    @click="form.role = opt.id; clearErr('role'); applyRoleDefaults(opt.id)"
                >
                  <component :is="opt.icon" :size="16" :class="form.role === opt.id ? 'text-[#004D3C]' : 'text-gray-400'" />
                  <div>
                    <strong :class="['block text-[12px] font-bold', form.role === opt.id ? 'text-[#004D3C]' : 'text-gray-800']">{{ opt.label }}</strong>
                    <small class="block text-[10px] text-gray-500">{{ opt.desc }}</small>
                  </div>
                </button>
              </div>
              <p v-if="errors.role" class="text-[11px] font-bold text-red-600">{{ errors.role }}</p>
            </div>

            <!-- 권한 안내 카드 — 내용 높이에 맞춰 자동 조절 -->
            <Transition name="fade" mode="out-in">
              <div v-if="selectedRole" :key="selectedRole.id" class="flex items-start gap-3 border border-[#004D3C]/20 bg-[#eef7f4] px-4 py-3">
                <component :is="selectedRole.icon" :size="18" class="mt-0.5 shrink-0 text-[#004D3C]" />
                <div>
                  <p class="text-[12px] font-black text-[#004D3C]">{{ selectedRole.label }}</p>
                  <p class="mt-0.5 text-[11px] leading-relaxed text-[#004D3C]/70">{{ selectedRole.detail }}</p>
                </div>
              </div>
              <div v-else class="flex items-center gap-2 border border-dashed border-gray-300 px-4 py-2 text-[11px] text-gray-400">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16h.01"/></svg>
                권한을 선택하면 상세 안내가 표시됩니다.
              </div>
            </Transition>

            <!-- 지점 코드(지역) / 지점명(인프라) — 본사(hq)는 단일 지점이라 미표시 -->
            <!-- mt-auto 로 우측 영역 하단에 고정해 좌측 비밀번호 행과 일직선 정렬 -->
            <div v-if="form.role !== 'hq'" class="mt-auto grid grid-cols-2 gap-3">
              <!-- 지점 코드 (지역 선택) -->
              <label class="flex flex-col gap-1.5">
                <span class="text-[12px] font-bold text-gray-600">지점 코드 <em class="not-italic text-red-500">*</em></span>
                <div :class="['flex h-9 items-center border bg-gray-50 px-3 transition focus-within:bg-white focus-within:border-[#004D3C]', errors.region ? 'border-red-400' : 'border-gray-300']">
                  <select
                    v-model="form.region"
                    :class="['w-full bg-transparent text-sm outline-none', form.region ? 'text-gray-900' : 'text-gray-400']"
                    @change="onRegionChange"
                  >
                    <option value="" disabled>지역 선택</option>
                    <option v-for="opt in locationCodeOptions" :key="opt.code" :value="opt.code">
                      {{ opt.code }} · {{ opt.name }}
                    </option>
                  </select>
                </div>
                <p v-if="errors.region" class="text-[11px] font-bold text-red-600">{{ errors.region }}</p>
              </label>

              <!-- 지점명 (인프라 선택, 권한+지역으로 필터됨) -->
              <label class="flex flex-col gap-1.5">
                <span class="text-[12px] font-bold text-gray-600">지점명 <em class="not-italic text-red-500">*</em></span>
                <div :class="['flex h-9 items-center border bg-gray-50 px-3 transition focus-within:bg-white focus-within:border-[#004D3C]', errors.storeCode ? 'border-red-400' : 'border-gray-300', !form.region ? 'opacity-60' : '']">
                  <select
                    v-model="form.storeCode"
                    :disabled="!form.region"
                    :class="['w-full bg-transparent text-sm outline-none', form.storeCode ? 'text-gray-900' : 'text-gray-400']"
                    @change="onInfraChange"
                  >
                    <option value="" disabled>
                      {{ form.region ? (filteredInfrastructures.length ? '지점 선택' : '해당 지역에 등록된 지점 없음') : '지역 먼저 선택' }}
                    </option>
                    <option v-for="i in filteredInfrastructures" :key="i.code" :value="i.code">
                      {{ i.name }}
                    </option>
                  </select>
                </div>
                <p v-if="errors.storeCode" class="text-[11px] font-bold text-red-600">{{ errors.storeCode }}</p>
              </label>
            </div>

          </div>
        </div>

        <!-- 신청 사유 (전체 너비) -->
        <div class="mt-6 border-t border-gray-100 pt-5">
          <div class="mb-3 flex items-center gap-2">
            <span class="flex h-4 w-4 shrink-0 items-center justify-center bg-[#004D3C] text-[9px] font-black text-white">03</span>
            <p class="text-[12px] font-black text-[#004D3C]">추가 정보</p>
          </div>
          <label class="flex flex-col gap-1.5">
            <span class="text-[12px] font-bold text-gray-600">신청 사유 (선택)</span>
            <textarea
                v-model="form.reason"
                placeholder="추가 전달 사항 입력"
                rows="2"
                class="resize-none border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#004D3C] focus:bg-white"
            />
          </label>
        </div>

        <!-- ── 하단 액션 영역 ── -->
        <div class="mt-5 border-t border-gray-100 pt-5">
          <div class="flex items-stretch gap-3">
            <div class="flex flex-1 items-center gap-2 bg-[#eef7f4] px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0 text-[#004D3C]"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16h.01"/></svg>
              <p class="text-[11px] font-bold text-[#004D3C]">승인 후 초기 비밀번호(생년월일)로 로그인 가능하며, 결과는 이메일로 안내됩니다.</p>
            </div>
            <button
              type="submit"
              class="relative flex shrink-0 items-center justify-center gap-2 bg-[#004D3C] px-5 text-[13px] font-black text-white transition hover:bg-[#003d30] disabled:opacity-55"
              :disabled="isSubmitting"
            >
              <div v-show="isSubmitting" class="absolute h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span :class="['flex items-center gap-2', { 'opacity-0': isSubmitting }]">
                <UserPlus :size="15" />
                계정 신청하기
              </span>
            </button>
          </div>

          <div class="mt-3 text-center">
            <span class="text-[12px] font-bold text-gray-500">이미 계정이 있으신가요? </span>
            <router-link to="/dev-login" class="text-[12px] font-bold text-[#004D3C] hover:underline">
              로그인으로 돌아가기
            </router-link>
          </div>
        </div>
      </form>

    </section>
  </main>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(4px); }
</style>