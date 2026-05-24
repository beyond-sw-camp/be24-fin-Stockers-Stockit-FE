<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEsgStore } from '@/stores/esg.js'

defineProps({
  expanded: { type: Boolean, default: false },
})

const esg = useEsgStore()
// stage / stageProgress / pointsToNext 는 computed → storeToRefs 로 ref 추출 가능.
// maxStage / stageThresholds 는 store 내부 상수 (ref 아님) → esg 객체로 직접 접근.
const { totalPoints, stage, stageProgress, pointsToNext, treeCount } = storeToRefs(esg)

const stageLabels = [
  '씨앗',
  '새싹',
  '떡잎 새싹',
  '어린 묘목',
  '청년 묘목',
  '청년 나무',
  '풍성한 나무',
  '튼튼한 나무',
  '거목',
  '결실의 나무',
]
const stageLabel = computed(() => stageLabels[stage.value - 1])

// Lv.7~10 은 Lv.6 의 곡선 트렁크/잎 클러스터 무드를 따라 각 레벨별 별도 SVG 로 손그림.
// 이전 버전의 trunkHeight/crownRadius 자동 계산 로직은 폐기 — 동일 톤의 풍성한 성장 표현을 위해 손튜닝 채택.

// viewBox 동적 — Lv.7+ 는 위쪽으로 확장 (지면 cy=100 기준 Lv.6 의 2배 이상 길이 확보).
//   Lv.1~6: 기존 viewBox (위쪽 -32 까지)
//   Lv.7+ : 위쪽 -130 까지 확장 → 트렁크 상단/잎 클러스터/메인 왕관 다 들어옴
// preserveAspectRatio="xMidYMax meet" 라 지면이 항상 화면 하단 정렬 → 위로만 늘어남.
const svgViewBox = computed(() => (stage.value >= 7 ? '0 -130 100 268' : '0 -32 100 170'))
</script>

<template>
  <div :class="expanded ? 'flex min-h-0 flex-1 flex-col p-3' : 'mt-auto shrink-0 px-3 pb-3'">
    <div
      :class="expanded
        ? 'flex flex-1 flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-emerald-50 to-emerald-100 p-4 ring-1 ring-emerald-100/80'
        : 'overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-emerald-50 to-emerald-100 p-3 ring-1 ring-emerald-100/80'"
    >
      <div class="mb-2 flex items-start justify-between">
        <div class="min-w-0">
          <span class="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            ESG 나무
          </span>
          <!-- 키운 나무 누적 그루 — 1,500,000pt(Lv.10 만점) 도달 시마다 +1, 사이클은 Lv.1 부터 다시 -->
          <p v-if="treeCount > 0" class="mt-0.5 text-[10px] font-semibold leading-tight text-emerald-700">
            🌳 {{ treeCount.toLocaleString() }}그루의 나무를 키웠습니다!
          </p>
        </div>
        <span
          class="shrink-0 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white"
        >
          Lv.{{ stage }}
        </span>
      </div>

      <div :class="expanded ? 'flex min-h-0 flex-1 items-end justify-center' : 'flex h-36 items-end justify-center'">
        <svg :viewBox="svgViewBox" preserveAspectRatio="xMidYMax meet" class="h-full w-auto" aria-hidden="true">
          <ellipse cx="50" cy="100" rx="30" ry="2" class="fill-emerald-200/70" />

          <!-- Lv.1 씨앗: 흙더미 + 흙에 더 깊이 묻힌 씨앗 (트렁크/왕관 미표시) -->
          <template v-if="stage === 1">
            <!-- 흙더미 (작은 갈색 언덕) -->
            <ellipse cx="50" cy="100" rx="13" ry="4" class="fill-amber-900" />
            <ellipse cx="50" cy="99" rx="10" ry="2.5" class="fill-amber-800" />
            <!-- 씨앗 (흙 안쪽으로 내려가 거의 묻힌 형태 — 위쪽만 살짝 보임) -->
            <ellipse cx="50" cy="99.5" rx="3.5" ry="2.3" class="fill-amber-700" />
            <!-- 씨앗 표면의 갈라진 선 (디테일) -->
            <line
              x1="48.6" y1="99.1" x2="51.4" y2="99.1"
              class="stroke-amber-950"
              stroke-width="0.4"
              stroke-linecap="round"
            />
          </template>

          <!-- Lv.2 새싹: 흙 + 가는 녹색 줄기 + 양쪽 떡잎 (트렁크/왕관 미표시) -->
          <template v-if="stage === 2">
            <!-- 흙더미 (Lv.1 의 흙 연속성 유지) -->
            <ellipse cx="50" cy="100" rx="13" ry="4" class="fill-amber-900" />
            <ellipse cx="50" cy="99" rx="10" ry="2.5" class="fill-amber-800" />
            <!-- 새싹 줄기 (가는 연한 녹색 막대) -->
            <rect x="49.3" y="89" width="1.4" height="10.5" rx="0.7" class="fill-emerald-600" />
            <!-- 좌측 떡잎 (살짝 위로 기울어진 작은 타원) -->
            <ellipse
              cx="46" cy="88.5" rx="4" ry="1.8"
              transform="rotate(-35 46 88.5)"
              class="fill-emerald-500"
            />
            <!-- 우측 떡잎 (살짝 위로 기울어진 작은 타원, 톤 변경) -->
            <ellipse
              cx="54" cy="88.5" rx="4" ry="1.8"
              transform="rotate(35 54 88.5)"
              class="fill-emerald-400"
            />
            <!-- 줄기 끝 중앙 작은 새순 점 (성장 표현) -->
            <circle cx="50" cy="88" r="0.9" class="fill-emerald-300" />
          </template>

          <!-- Lv.3 본잎: 새싹의 연장 — 떡잎 + 위쪽 본잎 2개 추가 + 줄기 살짝 더 길어짐 -->
          <template v-if="stage === 3">
            <!-- 흙더미 -->
            <ellipse cx="50" cy="100" rx="13" ry="4" class="fill-amber-900" />
            <ellipse cx="50" cy="99" rx="10" ry="2.5" class="fill-amber-800" />
            <!-- 줄기 (Lv.2 보다 길어짐) -->
            <rect x="49.2" y="82" width="1.6" height="17.5" rx="0.8" class="fill-emerald-700" />
            <!-- 떡잎 (Lv.2 유지, 줄기 중간 높이) -->
            <ellipse
              cx="46" cy="90" rx="4" ry="1.8"
              transform="rotate(-35 46 90)"
              class="fill-emerald-500"
            />
            <ellipse
              cx="54" cy="90" rx="4" ry="1.8"
              transform="rotate(35 54 90)"
              class="fill-emerald-400"
            />
            <!-- 본잎 (위쪽에 새로 자란 잎 2개, 약간 위로 펼침) -->
            <ellipse
              cx="45.5" cy="83.5" rx="4.5" ry="2.2"
              transform="rotate(-25 45.5 83.5)"
              class="fill-emerald-600"
            />
            <ellipse
              cx="54.5" cy="83.5" rx="4.5" ry="2.2"
              transform="rotate(25 54.5 83.5)"
              class="fill-emerald-500"
            />
            <!-- 중앙 새순 (가장 위쪽 성장점) -->
            <circle cx="50" cy="81" r="1.1" class="fill-emerald-300" />
          </template>

          <!-- Lv.4 묘목: 트렁크 + V자 분지 + 잎 (위로 늘림 — Lv.3 → Lv.5 자연 연결) -->
          <template v-if="stage === 4">
            <!-- 흙더미 -->
            <ellipse cx="50" cy="100" rx="13" ry="4" class="fill-amber-900" />
            <ellipse cx="50" cy="99" rx="10" ry="2.5" class="fill-amber-800" />
            <!-- 트렁크 (높이 26 으로 늘림) -->
            <rect x="48.5" y="73.5" width="3" height="26" rx="1.2" class="fill-amber-800" />
            <!-- 좌측 V자 가지 -->
            <line
              x1="50" y1="84" x2="42" y2="74"
              stroke-width="1.4"
              stroke-linecap="round"
              class="stroke-amber-800"
            />
            <!-- 우측 V자 가지 -->
            <line
              x1="50" y1="84" x2="58" y2="74"
              stroke-width="1.4"
              stroke-linecap="round"
              class="stroke-amber-800"
            />
            <!-- 좌측 가지 끝 잎 -->
            <circle cx="41" cy="72" r="4.5" class="fill-emerald-500" />
            <!-- 우측 가지 끝 잎 -->
            <circle cx="59" cy="72" r="4.5" class="fill-emerald-400" />
            <!-- 메인 잎 (위쪽 중앙, 가장 큰 덩어리) -->
            <circle cx="50" cy="68" r="7" class="fill-emerald-600" />
            <!-- 상단 작은 성장점 -->
            <circle cx="50" cy="63" r="2.3" class="fill-emerald-300" />
          </template>

          <!-- Lv.5 청년 묘목: 자연 곡선 트렁크 + 곡선 가지 + 회전 타원 잎 (자연스러운 형태) -->
          <template v-if="stage === 5">
            <!-- 흙더미 -->
            <ellipse cx="50" cy="100" rx="13" ry="4" class="fill-amber-900" />
            <ellipse cx="50" cy="99" rx="10" ry="2.5" class="fill-amber-800" />

            <!-- 트렁크 (아래는 굵고 위로 가늘어지는 자연 곡선) -->
            <path
              d="M 45.5 99.5 Q 45.5 75 46.3 55 Q 47 38 48 28 L 52 28 Q 53 38 53.7 55 Q 54.5 75 54.5 99.5 Z"
              class="fill-amber-800"
            />

            <!-- 좌측 가지 (곡선, 자연스러운 휨) -->
            <path
              d="M 48 65 Q 40 60 32 53"
              stroke-width="2.2"
              stroke-linecap="round"
              fill="none"
              class="stroke-amber-800"
            />
            <!-- 우측 가지 (곡선) -->
            <path
              d="M 52 65 Q 60 60 68 53"
              stroke-width="2.2"
              stroke-linecap="round"
              fill="none"
              class="stroke-amber-800"
            />

            <!-- 잎 3개만 (좌/우/중앙) — 가장 큰 원만 남기고 보조 잎 모두 제거 -->
            <!-- 좌측 큰 잎 -->
            <ellipse cx="30" cy="50" rx="9" ry="6" transform="rotate(-25 30 50)" class="fill-emerald-700" />
            <!-- 우측 큰 잎 -->
            <ellipse cx="70" cy="50" rx="9" ry="6" transform="rotate(25 70 50)" class="fill-emerald-600" />
            <!-- 메인 왕관 (중앙 위쪽 가장 큰 잎) -->
            <ellipse cx="50" cy="33" rx="13" ry="11" class="fill-emerald-500" />
          </template>

          <!-- Lv.6 청년 나무: 곡선 트렁크 + 풍성한 잎 클러스터 + 가지 추가 + 트렁크 결무늬 -->
          <template v-if="stage === 6">
            <!-- 흙더미 -->
            <ellipse cx="50" cy="100" rx="13" ry="4" class="fill-amber-900" />
            <ellipse cx="50" cy="99" rx="10" ry="2.5" class="fill-amber-800" />

            <!-- 트렁크 (곡선, 굵음→가늘어짐) -->
            <path
              d="M 44.5 99.5 Q 44.5 70 45.5 45 Q 46.5 28 48 18 L 52 18 Q 53.5 28 54.5 45 Q 55.5 70 55.5 99.5 Z"
              class="fill-amber-800"
            />
            <!-- 트렁크 결무늬 (자연 디테일) -->
            <path d="M 47.5 80 Q 48 65 47.5 50" stroke-width="0.5" fill="none" class="stroke-amber-950" opacity="0.5" />
            <path d="M 52 78 Q 51.5 60 52.2 45" stroke-width="0.5" fill="none" class="stroke-amber-950" opacity="0.5" />

            <!-- 좌측 메인 가지 -->
            <path d="M 47 55 Q 38 50 28 42" stroke-width="2.5" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <!-- 우측 메인 가지 -->
            <path d="M 53 55 Q 62 50 72 42" stroke-width="2.5" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <!-- 위쪽 좌 작은 가지 -->
            <path d="M 48 38 Q 44 32 40 26" stroke-width="1.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <!-- 위쪽 우 작은 가지 -->
            <path d="M 52 38 Q 56 32 60 26" stroke-width="1.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />

            <!-- 좌측 잎 클러스터 (큰 + 보조 2개) -->
            <ellipse cx="26" cy="40" rx="11" ry="7.5" transform="rotate(-22 26 40)" class="fill-emerald-700" />
            <ellipse cx="34" cy="35" rx="7"  ry="5"   transform="rotate(-15 34 35)" class="fill-emerald-500" />
            <ellipse cx="20" cy="36" rx="6"  ry="4.5" transform="rotate(-38 20 36)" class="fill-emerald-600" />

            <!-- 우측 잎 클러스터 (큰 + 보조 2개) -->
            <ellipse cx="74" cy="40" rx="11" ry="7.5" transform="rotate(22 74 40)" class="fill-emerald-600" />
            <ellipse cx="66" cy="35" rx="7"  ry="5"   transform="rotate(15 66 35)" class="fill-emerald-400" />
            <ellipse cx="80" cy="36" rx="6"  ry="4.5" transform="rotate(38 80 36)" class="fill-emerald-500" />

            <!-- 메인 왕관 + 상단 보조 잎 (풍성한 윗부분) -->
            <ellipse cx="50" cy="20" rx="17" ry="14" class="fill-emerald-500" />
            <ellipse cx="41" cy="12" rx="7"  ry="6"  transform="rotate(-20 41 12)" class="fill-emerald-600" />
            <ellipse cx="59" cy="12" rx="7"  ry="6"  transform="rotate(20 59 12)" class="fill-emerald-400" />
            <ellipse cx="50" cy="6"  rx="6.5" ry="5" class="fill-emerald-300" />
          </template>

          <!-- Lv.7 풍성한 나무: Lv.6 의 정확히 2배 길이 (지면 cy=100 기준 위쪽 거리 ×2) -->
          <!-- 변환 공식: y_new = 100 - (100 - y_old) * 2 = -100 + 2*y_old -->
          <template v-if="stage === 7">
            <!-- 흙더미 (지면 — 그대로) -->
            <ellipse cx="50" cy="100" rx="14" ry="4" class="fill-amber-900" />
            <ellipse cx="50" cy="99" rx="11" ry="2.5" class="fill-amber-800" />

            <!-- 트렁크 (Lv.6 상단 y=18 → -64, 정확히 2배 위로 자람) -->
            <path
              d="M 44 99.5 Q 44 40 45 -10 Q 46 -44 47.5 -64 L 52.5 -64 Q 54 -44 55 -10 Q 56 40 56 99.5 Z"
              class="fill-amber-800"
            />
            <!-- 트렁크 결무늬 -->
            <path d="M 47 60 Q 48 30 47 0" stroke-width="0.5" fill="none" class="stroke-amber-950" opacity="0.5" />
            <path d="M 52 56 Q 51 20 52 -10" stroke-width="0.5" fill="none" class="stroke-amber-950" opacity="0.5" />

            <!-- 하단 메인 가지 (Lv.6 y=55→10, y=42→-16) -->
            <path d="M 47 10 Q 36 0 24 -16" stroke-width="2.6" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 53 10 Q 64 0 76 -16" stroke-width="2.6" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <!-- 중단 가지 (Lv.6 y=38→-24, y=26→-48) -->
            <path d="M 48 -24 Q 44 -36 40 -48" stroke-width="2" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 52 -24 Q 56 -36 60 -48" stroke-width="2" stroke-linecap="round" fill="none" class="stroke-amber-800" />

            <!-- 좌측 잎 클러스터 (Lv.6 cy=40,35,36 → -20,-30,-28) -->
            <ellipse cx="26" cy="-20" rx="11" ry="7.5" transform="rotate(-22 26 -20)" class="fill-emerald-700" />
            <ellipse cx="34" cy="-30" rx="7" ry="5" transform="rotate(-15 34 -30)" class="fill-emerald-500" />
            <ellipse cx="20" cy="-28" rx="6" ry="4.5" transform="rotate(-38 20 -28)" class="fill-emerald-600" />

            <!-- 우측 잎 클러스터 -->
            <ellipse cx="74" cy="-20" rx="11" ry="7.5" transform="rotate(22 74 -20)" class="fill-emerald-600" />
            <ellipse cx="66" cy="-30" rx="7" ry="5" transform="rotate(15 66 -30)" class="fill-emerald-400" />
            <ellipse cx="80" cy="-28" rx="6" ry="4.5" transform="rotate(38 80 -28)" class="fill-emerald-500" />

            <!-- 메인 왕관 + 상단 보조 잎 (Lv.6 cy=20,12,12,6 → -60,-76,-76,-88) -->
            <ellipse cx="50" cy="-60" rx="17" ry="14" class="fill-emerald-500" />
            <ellipse cx="41" cy="-76" rx="7" ry="6" transform="rotate(-20 41 -76)" class="fill-emerald-600" />
            <ellipse cx="59" cy="-76" rx="7" ry="6" transform="rotate(20 59 -76)" class="fill-emerald-400" />
            <ellipse cx="50" cy="-88" rx="6.5" ry="5" class="fill-emerald-300" />
          </template>

          <!-- Lv.8 튼튼한 나무: Lv.7 + 약간 더 길게 + 가지 1쌍 추가 + 잎 클러스터 1개씩 + 열매 등장 -->
          <!-- scale ≈ 2.15 (Lv.7 의 2.0 + 점진 성장) -->
          <template v-if="stage === 8">
            <!-- 흙더미 -->
            <ellipse cx="50" cy="100" rx="15" ry="4.5" class="fill-amber-900" />
            <ellipse cx="50" cy="99" rx="12" ry="2.8" class="fill-amber-800" />

            <!-- 트렁크 (상단 y=-76, Lv.7 보다 길게) -->
            <path
              d="M 43.5 99.5 Q 43.5 36 44.5 -16 Q 45.5 -53 47 -76 L 53 -76 Q 54.5 -53 55.5 -16 Q 56.5 36 56.5 99.5 Z"
              class="fill-amber-800"
            />
            <!-- 트렁크 결무늬 -->
            <path d="M 46.5 64 Q 47 20 46.5 -24" stroke-width="0.6" fill="none" class="stroke-amber-950" opacity="0.55" />
            <path d="M 53 60 Q 52.5 16 53 -30" stroke-width="0.6" fill="none" class="stroke-amber-950" opacity="0.55" />

            <!-- 하단 메인 가지 -->
            <path d="M 46 30 Q 35 20 22 7" stroke-width="2.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 54 30 Q 65 20 78 7" stroke-width="2.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <!-- 중단 가지 -->
            <path d="M 46 -10 Q 38 -25 26 -42" stroke-width="2.2" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 54 -10 Q 62 -25 74 -42" stroke-width="2.2" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <!-- 상단 가지 -->
            <path d="M 47 -45 Q 42 -58 36 -72" stroke-width="1.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 53 -45 Q 58 -58 64 -72" stroke-width="1.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />

            <!-- 좌측 잎 클러스터 (5개) -->
            <ellipse cx="20" cy="-30" rx="13" ry="9" transform="rotate(-22 20 -30)" class="fill-emerald-700" />
            <ellipse cx="30" cy="-40" rx="8" ry="6" transform="rotate(-15 30 -40)" class="fill-emerald-500" />
            <ellipse cx="13" cy="-35" rx="7" ry="5.5" transform="rotate(-40 13 -35)" class="fill-emerald-600" />
            <ellipse cx="24" cy="-55" rx="8" ry="6" transform="rotate(-20 24 -55)" class="fill-emerald-500" />
            <ellipse cx="34" cy="-68" rx="6.5" ry="5" transform="rotate(-10 34 -68)" class="fill-emerald-400" />

            <!-- 우측 잎 클러스터 (5개) -->
            <ellipse cx="80" cy="-30" rx="13" ry="9" transform="rotate(22 80 -30)" class="fill-emerald-600" />
            <ellipse cx="70" cy="-40" rx="8" ry="6" transform="rotate(15 70 -40)" class="fill-emerald-400" />
            <ellipse cx="87" cy="-35" rx="7" ry="5.5" transform="rotate(40 87 -35)" class="fill-emerald-500" />
            <ellipse cx="76" cy="-55" rx="8" ry="6" transform="rotate(20 76 -55)" class="fill-emerald-400" />
            <ellipse cx="66" cy="-68" rx="6.5" ry="5" transform="rotate(10 66 -68)" class="fill-emerald-500" />

            <!-- 메인 왕관 + 상단 풍성 보조 잎 -->
            <ellipse cx="50" cy="-80" rx="21" ry="16" class="fill-emerald-500" />
            <ellipse cx="37" cy="-95" rx="8.5" ry="7" transform="rotate(-22 37 -95)" class="fill-emerald-600" />
            <ellipse cx="63" cy="-95" rx="8.5" ry="7" transform="rotate(22 63 -95)" class="fill-emerald-400" />
            <ellipse cx="50" cy="-105" rx="9" ry="7" class="fill-emerald-300" />

            <!-- 열매 3개 (Lv.8 부터 등장 — 작은 rose) -->
            <circle cx="42" cy="-15" r="2.1" class="fill-rose-400" />
            <circle cx="58" cy="-20" r="2.1" class="fill-rose-400" />
            <circle cx="50" cy="-5" r="2.1" class="fill-rose-400" />
          </template>

          <!-- Lv.9 거목: Lv.8 보다 더 길고 굵게 + 가지 4쌍 + 풍성한 잎 + 열매 5개 -->
          <!-- scale ≈ 2.30 -->
          <template v-if="stage === 9">
            <!-- 흙더미 (더 크게) -->
            <ellipse cx="50" cy="100" rx="17" ry="5" class="fill-amber-900" />
            <ellipse cx="50" cy="99" rx="13" ry="3" class="fill-amber-800" />

            <!-- 트렁크 (상단 y=-88) -->
            <path
              d="M 42 99.5 Q 42 32 43 -24 Q 44 -60 46 -88 L 54 -88 Q 56 -60 57 -24 Q 58 32 58 99.5 Z"
              class="fill-amber-800"
            />
            <!-- 트렁크 결무늬 (3개로 풍성) -->
            <path d="M 45.5 65 Q 46 18 45.5 -28" stroke-width="0.6" fill="none" class="stroke-amber-950" opacity="0.6" />
            <path d="M 50.5 60 Q 50 4 50.5 -42" stroke-width="0.5" fill="none" class="stroke-amber-950" opacity="0.4" />
            <path d="M 54 65 Q 53.5 14 54.5 -38" stroke-width="0.6" fill="none" class="stroke-amber-950" opacity="0.6" />

            <!-- 가지 4쌍 — 하단/중하단/중상단/상단 -->
            <path d="M 45 38 Q 33 28 18 8" stroke-width="3" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 55 38 Q 67 28 82 8" stroke-width="3" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 45 0 Q 36 -14 22 -32" stroke-width="2.4" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 55 0 Q 64 -14 78 -32" stroke-width="2.4" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 46 -40 Q 40 -56 32 -74" stroke-width="2" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 54 -40 Q 60 -56 68 -74" stroke-width="2" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 47 -80 Q 44 -96 40 -112" stroke-width="1.6" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 53 -80 Q 56 -96 60 -112" stroke-width="1.6" stroke-linecap="round" fill="none" class="stroke-amber-800" />

            <!-- 좌측 잎 클러스터 (6개) -->
            <ellipse cx="16" cy="-26" rx="14" ry="10" transform="rotate(-22 16 -26)" class="fill-emerald-700" />
            <ellipse cx="28" cy="-38" rx="9" ry="6.5" transform="rotate(-15 28 -38)" class="fill-emerald-500" />
            <ellipse cx="9" cy="-32" rx="7.5" ry="6" transform="rotate(-40 9 -32)" class="fill-emerald-600" />
            <ellipse cx="20" cy="-56" rx="9" ry="6.5" transform="rotate(-22 20 -56)" class="fill-emerald-500" />
            <ellipse cx="31" cy="-70" rx="7.5" ry="5.5" transform="rotate(-12 31 -70)" class="fill-emerald-400" />
            <ellipse cx="24" cy="-90" rx="7" ry="5" transform="rotate(-18 24 -90)" class="fill-emerald-500" />

            <!-- 우측 잎 클러스터 (6개) -->
            <ellipse cx="84" cy="-26" rx="14" ry="10" transform="rotate(22 84 -26)" class="fill-emerald-600" />
            <ellipse cx="72" cy="-38" rx="9" ry="6.5" transform="rotate(15 72 -38)" class="fill-emerald-400" />
            <ellipse cx="91" cy="-32" rx="7.5" ry="6" transform="rotate(40 91 -32)" class="fill-emerald-500" />
            <ellipse cx="80" cy="-56" rx="9" ry="6.5" transform="rotate(22 80 -56)" class="fill-emerald-400" />
            <ellipse cx="69" cy="-70" rx="7.5" ry="5.5" transform="rotate(12 69 -70)" class="fill-emerald-500" />
            <ellipse cx="76" cy="-90" rx="7" ry="5" transform="rotate(18 76 -90)" class="fill-emerald-400" />

            <!-- 메인 왕관 (거대) + 상단 풍성 보조 잎 -->
            <ellipse cx="50" cy="-94" rx="24" ry="18" class="fill-emerald-500" />
            <ellipse cx="34" cy="-110" rx="9.5" ry="7.5" transform="rotate(-22 34 -110)" class="fill-emerald-600" />
            <ellipse cx="66" cy="-110" rx="9.5" ry="7.5" transform="rotate(22 66 -110)" class="fill-emerald-400" />
            <ellipse cx="50" cy="-122" rx="10" ry="8" class="fill-emerald-300" />

            <!-- 열매 5개 (rose) -->
            <circle cx="38" cy="-20" r="2.3" class="fill-rose-400" />
            <circle cx="62" cy="-26" r="2.3" class="fill-rose-400" />
            <circle cx="50" cy="-10" r="2.3" class="fill-rose-400" />
            <circle cx="45" cy="-60" r="2.3" class="fill-rose-400" />
            <circle cx="56" cy="-68" r="2.3" class="fill-rose-400" />
          </template>

          <!-- Lv.10 결실의 나무: 최대 풍성도 + 황금 열매 섞은 결실 + 트렁크 결무늬 다중 + 빛나는 광휘 -->
          <!-- scale ≈ 2.45 — viewBox y=-130 까지 거의 다 활용 -->
          <template v-if="stage === 10">
            <!-- 흙더미 (가장 크게) -->
            <ellipse cx="50" cy="100" rx="19" ry="5.5" class="fill-amber-900" />
            <ellipse cx="50" cy="99" rx="15" ry="3.5" class="fill-amber-800" />
            <!-- 흙 위 풀잎 디테일 (결실의 나무 환경) -->
            <line x1="38" y1="99" x2="36" y2="96" stroke-width="0.7" stroke-linecap="round" class="stroke-emerald-700" />
            <line x1="62" y1="99" x2="64" y2="96" stroke-width="0.7" stroke-linecap="round" class="stroke-emerald-700" />
            <line x1="33" y1="99.5" x2="32" y2="97" stroke-width="0.6" stroke-linecap="round" class="stroke-emerald-600" />
            <line x1="67" y1="99.5" x2="68" y2="97" stroke-width="0.6" stroke-linecap="round" class="stroke-emerald-600" />

            <!-- 광휘 — 메인 왕관 뒤쪽 부드러운 옅은 빛 -->
            <ellipse cx="50" cy="-108" rx="34" ry="26" class="fill-amber-100" opacity="0.45" />

            <!-- 트렁크 (가장 굵고 viewBox 상단까지 — 상단 y=-105) -->
            <path
              d="M 40.5 99.5 Q 40.5 25 41.5 -38 Q 42.5 -75 44.5 -105 L 55.5 -105 Q 57.5 -75 58.5 -38 Q 59.5 25 59.5 99.5 Z"
              class="fill-amber-800"
            />
            <!-- 트렁크 결무늬 (다중 디테일 — 나이테 풍성) -->
            <path d="M 44.5 60 Q 45 5 44.5 -50" stroke-width="0.7" fill="none" class="stroke-amber-950" opacity="0.65" />
            <path d="M 50 55 Q 49.5 -10 50 -75" stroke-width="0.5" fill="none" class="stroke-amber-950" opacity="0.4" />
            <path d="M 55 60 Q 54.5 0 55.5 -60" stroke-width="0.7" fill="none" class="stroke-amber-950" opacity="0.65" />
            <!-- 트렁크 옹이 -->
            <ellipse cx="46" cy="40" rx="1.2" ry="2" class="fill-amber-950" opacity="0.4" />
            <ellipse cx="54" cy="10" rx="1" ry="1.6" class="fill-amber-950" opacity="0.4" />

            <!-- 가지 4쌍 (가장 길고 두꺼움) -->
            <path d="M 43 44 Q 30 32 13 12" stroke-width="3.4" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 57 44 Q 70 32 87 12" stroke-width="3.4" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 43 4 Q 34 -12 18 -32" stroke-width="2.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 57 4 Q 66 -12 82 -32" stroke-width="2.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 44 -36 Q 38 -56 28 -76" stroke-width="2.2" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 56 -36 Q 62 -56 72 -76" stroke-width="2.2" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 45 -80 Q 42 -100 37 -120" stroke-width="1.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 55 -80 Q 58 -100 63 -120" stroke-width="1.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />

            <!-- 좌측 잎 클러스터 (7개 — 그라데이션 톤) -->
            <ellipse cx="12" cy="-32" rx="15" ry="11" transform="rotate(-22 12 -32)" class="fill-emerald-700" />
            <ellipse cx="25" cy="-44" rx="10" ry="7" transform="rotate(-15 25 -44)" class="fill-emerald-500" />
            <ellipse cx="5" cy="-40" rx="8" ry="6.5" transform="rotate(-42 5 -40)" class="fill-emerald-600" />
            <ellipse cx="17" cy="-66" rx="10" ry="7" transform="rotate(-22 17 -66)" class="fill-emerald-500" />
            <ellipse cx="28" cy="-78" rx="8" ry="6" transform="rotate(-12 28 -78)" class="fill-emerald-400" />
            <ellipse cx="22" cy="-94" rx="8" ry="6" transform="rotate(-18 22 -94)" class="fill-emerald-500" />
            <ellipse cx="32" cy="-105" rx="6.5" ry="5" transform="rotate(-10 32 -105)" class="fill-emerald-400" />

            <!-- 우측 잎 클러스터 (7개 — 그라데이션 톤) -->
            <ellipse cx="88" cy="-32" rx="15" ry="11" transform="rotate(22 88 -32)" class="fill-emerald-600" />
            <ellipse cx="75" cy="-44" rx="10" ry="7" transform="rotate(15 75 -44)" class="fill-emerald-400" />
            <ellipse cx="95" cy="-40" rx="8" ry="6.5" transform="rotate(42 95 -40)" class="fill-emerald-500" />
            <ellipse cx="83" cy="-66" rx="10" ry="7" transform="rotate(22 83 -66)" class="fill-emerald-400" />
            <ellipse cx="72" cy="-78" rx="8" ry="6" transform="rotate(12 72 -78)" class="fill-emerald-500" />
            <ellipse cx="78" cy="-94" rx="8" ry="6" transform="rotate(18 78 -94)" class="fill-emerald-400" />
            <ellipse cx="68" cy="-105" rx="6.5" ry="5" transform="rotate(10 68 -105)" class="fill-emerald-500" />

            <!-- 메인 왕관 (최대) + 상단 풍성 보조 잎 -->
            <ellipse cx="50" cy="-110" rx="27" ry="20" class="fill-emerald-500" />
            <ellipse cx="32" cy="-122" rx="10" ry="8" transform="rotate(-22 32 -122)" class="fill-emerald-600" />
            <ellipse cx="68" cy="-122" rx="10" ry="8" transform="rotate(22 68 -122)" class="fill-emerald-400" />
            <ellipse cx="50" cy="-126" rx="11" ry="8" class="fill-emerald-300" />

            <!-- 열매 8개 — rose 5개 + amber(황금) 3개 섞어서 "결실" 표현 -->
            <circle cx="35" cy="-12" r="2.5" class="fill-rose-400" />
            <circle cx="65" cy="-20" r="2.5" class="fill-rose-400" />
            <circle cx="50" cy="-5" r="2.5" class="fill-rose-400" />
            <circle cx="42" cy="-60" r="2.5" class="fill-rose-400" />
            <circle cx="58" cy="-65" r="2.5" class="fill-rose-400" />
            <circle cx="30" cy="20" r="2.3" class="fill-amber-400" />
            <circle cx="70" cy="20" r="2.3" class="fill-amber-400" />
            <circle cx="50" cy="-100" r="2.3" class="fill-amber-400" />
            <!-- 열매 하이라이트 (광택 점) — 결실의 나무 특유의 윤기 (열매 cx,cy 기준 좌상단 0.7 오프셋) -->
            <circle cx="34.3" cy="-12.7" r="0.7" class="fill-white" opacity="0.7" />
            <circle cx="64.3" cy="-20.7" r="0.7" class="fill-white" opacity="0.7" />
            <circle cx="29.3" cy="19.3" r="0.6" class="fill-white" opacity="0.7" />
            <circle cx="69.3" cy="19.3" r="0.6" class="fill-white" opacity="0.7" />
          </template>
        </svg>
      </div>

      <div :class="expanded ? 'mt-2 shrink-0 space-y-2' : 'mt-1 space-y-1.5'">
        <div class="flex items-baseline justify-between">
          <span :class="expanded ? 'text-[12px] font-bold text-gray-700' : 'text-[10px] font-semibold text-gray-700'">{{ stageLabel }}</span>
          <span :class="expanded ? 'text-[12px] font-bold text-emerald-700' : 'text-[10px] font-bold text-emerald-700'">
            {{ totalPoints.toLocaleString() }}P
          </span>
        </div>
        <div :class="expanded ? 'h-2 w-full overflow-hidden rounded-full bg-white/80' : 'h-1.5 w-full overflow-hidden rounded-full bg-white/80'">
          <div
            class="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-500 transition-[width] duration-500"
            :style="{ width: `${stageProgress}%` }"
          ></div>
        </div>
        <p :class="expanded ? 'text-[10px] leading-tight text-gray-600' : 'text-[9px] leading-tight text-gray-500'">
          <!-- Lv.10: 결실 익는 중 → 새 나무 시작까지 남은 점수 / 그 외: 다음 단계까지 -->
          <template v-if="stage >= esg.maxStage && pointsToNext > 0">
            🍎 결실 익는 중! 새 나무까지 {{ pointsToNext.toLocaleString() }}P
          </template>
          <template v-else-if="stage >= esg.maxStage">최고 단계 달성</template>
          <template v-else>다음 단계까지 {{ pointsToNext.toLocaleString() }}P</template>
        </p>

      </div>
    </div>
  </div>
</template>
