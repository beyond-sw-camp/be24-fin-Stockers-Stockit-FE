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
const { totalPoints, stage, stageProgress, pointsToNext } = storeToRefs(esg)

// ─────────── DEV 단계 미리보기 (디자인 확인용 임시 컨트롤) ───────────
// import.meta.env.DEV 가 true 인 환경(npm run dev)에서만 노출, 빌드 결과물에는 미포함.
// 테스트 완료 후 이 블록과 템플릿의 v-if="isDev" 영역만 삭제하면 됨.
const isDev = import.meta.env.DEV

function prevStage() {
  if (stage.value <= 1) return
  // 한 단계 아래의 임계값 시작점으로 totalPoints 강제 세팅
  esg.setTotalPoints(esg.stageThresholds[stage.value - 2])
}
function nextStage() {
  if (stage.value >= esg.maxStage) return
  // 다음 단계 임계값 시작점으로 강제 세팅
  esg.setTotalPoints(esg.stageThresholds[stage.value])
}

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
</script>

<template>
  <div :class="expanded ? 'flex min-h-0 flex-1 flex-col p-3' : 'mt-auto shrink-0 px-3 pb-3'">
    <div
      :class="expanded
        ? 'flex flex-1 flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-emerald-50 to-emerald-100 p-4 ring-1 ring-emerald-100/80'
        : 'overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-emerald-50 to-emerald-100 p-3 ring-1 ring-emerald-100/80'"
    >
      <div class="mb-2 flex items-center justify-between">
        <span class="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
          ESG 나무
        </span>
        <span
          class="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white"
        >
          Lv.{{ stage }}
        </span>
      </div>

      <div :class="expanded ? 'flex min-h-0 flex-1 items-end justify-center' : 'flex h-36 items-end justify-center'">
        <svg viewBox="0 -32 100 170" preserveAspectRatio="xMidYMax meet" class="h-full w-auto" aria-hidden="true">
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

          <!-- Lv.7 풍성한 나무: Lv.6 의 곡선 트렁크 + 가지 1쌍 추가(총 3쌍) + 잎 클러스터 4개씩 -->
          <template v-if="stage === 7">
            <!-- 흙더미 -->
            <ellipse cx="50" cy="100" rx="14" ry="4" class="fill-amber-900" />
            <ellipse cx="50" cy="99" rx="11" ry="2.5" class="fill-amber-800" />

            <!-- 트렁크 (Lv.6 보다 살짝 길고 굵음) -->
            <path
              d="M 44 99.5 Q 44 70 45 45 Q 46 25 47.5 10 L 52.5 10 Q 54 25 55 45 Q 56 70 56 99.5 Z"
              class="fill-amber-800"
            />
            <!-- 트렁크 결무늬 -->
            <path d="M 47 80 Q 47.5 60 47 40" stroke-width="0.5" fill="none" class="stroke-amber-950" opacity="0.5" />
            <path d="M 52.5 78 Q 52 58 53 38" stroke-width="0.5" fill="none" class="stroke-amber-950" opacity="0.5" />

            <!-- 하단 메인 가지 -->
            <path d="M 46.5 60 Q 36 55 24 46" stroke-width="2.6" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 53.5 60 Q 64 55 76 46" stroke-width="2.6" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <!-- 중단 가지 (신규) -->
            <path d="M 47 40 Q 40 33 30 26" stroke-width="2" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 53 40 Q 60 33 70 26" stroke-width="2" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <!-- 상단 작은 가지 -->
            <path d="M 48 22 Q 44 14 40 6" stroke-width="1.6" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 52 22 Q 56 14 60 6" stroke-width="1.6" stroke-linecap="round" fill="none" class="stroke-amber-800" />

            <!-- 좌측 잎 클러스터 (4개) -->
            <ellipse cx="22" cy="44" rx="12" ry="8" transform="rotate(-22 22 44)" class="fill-emerald-700" />
            <ellipse cx="31" cy="38" rx="7.5" ry="5.5" transform="rotate(-15 31 38)" class="fill-emerald-500" />
            <ellipse cx="16" cy="40" rx="6.5" ry="5" transform="rotate(-38 16 40)" class="fill-emerald-600" />
            <ellipse cx="27" cy="24" rx="7" ry="5.5" transform="rotate(-18 27 24)" class="fill-emerald-500" />

            <!-- 우측 잎 클러스터 (4개) -->
            <ellipse cx="78" cy="44" rx="12" ry="8" transform="rotate(22 78 44)" class="fill-emerald-600" />
            <ellipse cx="69" cy="38" rx="7.5" ry="5.5" transform="rotate(15 69 38)" class="fill-emerald-400" />
            <ellipse cx="84" cy="40" rx="6.5" ry="5" transform="rotate(38 84 40)" class="fill-emerald-500" />
            <ellipse cx="73" cy="24" rx="7" ry="5.5" transform="rotate(18 73 24)" class="fill-emerald-400" />

            <!-- 메인 왕관 + 상단 보조 잎 -->
            <ellipse cx="50" cy="12" rx="19" ry="15" class="fill-emerald-500" />
            <ellipse cx="39" cy="3" rx="8" ry="6.5" transform="rotate(-20 39 3)" class="fill-emerald-600" />
            <ellipse cx="61" cy="3" rx="8" ry="6.5" transform="rotate(20 61 3)" class="fill-emerald-400" />
            <ellipse cx="50" cy="-4" rx="7.5" ry="6" class="fill-emerald-300" />
          </template>

          <!-- Lv.8 튼튼한 나무: Lv.7 + 가지 한 쌍 더 + 첫 열매 등장 + 트렁크 더 길게 -->
          <template v-if="stage === 8">
            <!-- 흙더미 -->
            <ellipse cx="50" cy="100" rx="15" ry="4.5" class="fill-amber-900" />
            <ellipse cx="50" cy="99" rx="12" ry="2.8" class="fill-amber-800" />

            <!-- 트렁크 (더 길어 viewBox 위쪽까지) -->
            <path
              d="M 43.5 99.5 Q 43.5 68 44.5 42 Q 45.5 22 47 5 L 53 5 Q 54.5 22 55.5 42 Q 56.5 68 56.5 99.5 Z"
              class="fill-amber-800"
            />
            <!-- 트렁크 결무늬 (2개) -->
            <path d="M 46.5 82 Q 47 60 46.5 38" stroke-width="0.6" fill="none" class="stroke-amber-950" opacity="0.55" />
            <path d="M 53 80 Q 52.5 58 53.3 35" stroke-width="0.6" fill="none" class="stroke-amber-950" opacity="0.55" />

            <!-- 하단 메인 가지 -->
            <path d="M 46 65 Q 35 60 22 50" stroke-width="2.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 54 65 Q 65 60 78 50" stroke-width="2.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <!-- 중단 가지 -->
            <path d="M 46 45 Q 38 38 26 30" stroke-width="2.2" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 54 45 Q 62 38 74 30" stroke-width="2.2" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <!-- 상단 가지 -->
            <path d="M 47 25 Q 42 18 36 10" stroke-width="1.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 53 25 Q 58 18 64 10" stroke-width="1.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />

            <!-- 좌측 잎 클러스터 (5개) -->
            <ellipse cx="20" cy="48" rx="13" ry="9" transform="rotate(-22 20 48)" class="fill-emerald-700" />
            <ellipse cx="30" cy="42" rx="8" ry="6" transform="rotate(-15 30 42)" class="fill-emerald-500" />
            <ellipse cx="13" cy="44" rx="7" ry="5.5" transform="rotate(-40 13 44)" class="fill-emerald-600" />
            <ellipse cx="24" cy="28" rx="8" ry="6" transform="rotate(-20 24 28)" class="fill-emerald-500" />
            <ellipse cx="34" cy="20" rx="6.5" ry="5" transform="rotate(-10 34 20)" class="fill-emerald-400" />

            <!-- 우측 잎 클러스터 (5개) -->
            <ellipse cx="80" cy="48" rx="13" ry="9" transform="rotate(22 80 48)" class="fill-emerald-600" />
            <ellipse cx="70" cy="42" rx="8" ry="6" transform="rotate(15 70 42)" class="fill-emerald-400" />
            <ellipse cx="87" cy="44" rx="7" ry="5.5" transform="rotate(40 87 44)" class="fill-emerald-500" />
            <ellipse cx="76" cy="28" rx="8" ry="6" transform="rotate(20 76 28)" class="fill-emerald-400" />
            <ellipse cx="66" cy="20" rx="6.5" ry="5" transform="rotate(10 66 20)" class="fill-emerald-500" />

            <!-- 메인 왕관 + 상단 풍성 보조 잎 -->
            <ellipse cx="50" cy="6" rx="21" ry="16" class="fill-emerald-500" />
            <ellipse cx="37" cy="-3" rx="8.5" ry="7" transform="rotate(-22 37 -3)" class="fill-emerald-600" />
            <ellipse cx="63" cy="-3" rx="8.5" ry="7" transform="rotate(22 63 -3)" class="fill-emerald-400" />
            <ellipse cx="50" cy="-11" rx="9" ry="7" class="fill-emerald-300" />

            <!-- 열매 3개 (Lv.8 부터 등장 — 작은 rose) -->
            <circle cx="42" cy="14" r="2.1" class="fill-rose-400" />
            <circle cx="58" cy="9" r="2.1" class="fill-rose-400" />
            <circle cx="50" cy="20" r="2.1" class="fill-rose-400" />
          </template>

          <!-- Lv.9 거목: Lv.8 + 더 굵은 트렁크 + 가지 4쌍 + 풍성한 잎 + 열매 5개 -->
          <template v-if="stage === 9">
            <!-- 흙더미 (더 크게) -->
            <ellipse cx="50" cy="100" rx="17" ry="5" class="fill-amber-900" />
            <ellipse cx="50" cy="99" rx="13" ry="3" class="fill-amber-800" />

            <!-- 트렁크 (가장 굵고 길어 viewBox 위쪽 활용) -->
            <path
              d="M 42 99.5 Q 42 65 43 38 Q 44 18 46 -2 L 54 -2 Q 56 18 57 38 Q 58 65 58 99.5 Z"
              class="fill-amber-800"
            />
            <!-- 트렁크 결무늬 (3개로 풍성) -->
            <path d="M 45.5 82 Q 46 58 45.5 32" stroke-width="0.6" fill="none" class="stroke-amber-950" opacity="0.6" />
            <path d="M 50.5 80 Q 50 50 50.5 25" stroke-width="0.5" fill="none" class="stroke-amber-950" opacity="0.4" />
            <path d="M 54 82 Q 53.5 56 54.5 28" stroke-width="0.6" fill="none" class="stroke-amber-950" opacity="0.6" />

            <!-- 가지 4쌍 — 하단/중하단/중상단/상단 -->
            <path d="M 45 70 Q 33 65 18 54" stroke-width="3" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 55 70 Q 67 65 82 54" stroke-width="3" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 45 50 Q 36 43 22 34" stroke-width="2.4" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 55 50 Q 64 43 78 34" stroke-width="2.4" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 46 30 Q 40 22 32 13" stroke-width="2" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 54 30 Q 60 22 68 13" stroke-width="2" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 47 10 Q 44 2 40 -6" stroke-width="1.6" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 53 10 Q 56 2 60 -6" stroke-width="1.6" stroke-linecap="round" fill="none" class="stroke-amber-800" />

            <!-- 좌측 잎 클러스터 (6개) -->
            <ellipse cx="16" cy="52" rx="14" ry="10" transform="rotate(-22 16 52)" class="fill-emerald-700" />
            <ellipse cx="28" cy="46" rx="9" ry="6.5" transform="rotate(-15 28 46)" class="fill-emerald-500" />
            <ellipse cx="9" cy="48" rx="7.5" ry="6" transform="rotate(-40 9 48)" class="fill-emerald-600" />
            <ellipse cx="20" cy="32" rx="9" ry="6.5" transform="rotate(-22 20 32)" class="fill-emerald-500" />
            <ellipse cx="31" cy="22" rx="7.5" ry="5.5" transform="rotate(-12 31 22)" class="fill-emerald-400" />
            <ellipse cx="24" cy="10" rx="7" ry="5" transform="rotate(-18 24 10)" class="fill-emerald-500" />

            <!-- 우측 잎 클러스터 (6개) -->
            <ellipse cx="84" cy="52" rx="14" ry="10" transform="rotate(22 84 52)" class="fill-emerald-600" />
            <ellipse cx="72" cy="46" rx="9" ry="6.5" transform="rotate(15 72 46)" class="fill-emerald-400" />
            <ellipse cx="91" cy="48" rx="7.5" ry="6" transform="rotate(40 91 48)" class="fill-emerald-500" />
            <ellipse cx="80" cy="32" rx="9" ry="6.5" transform="rotate(22 80 32)" class="fill-emerald-400" />
            <ellipse cx="69" cy="22" rx="7.5" ry="5.5" transform="rotate(12 69 22)" class="fill-emerald-500" />
            <ellipse cx="76" cy="10" rx="7" ry="5" transform="rotate(18 76 10)" class="fill-emerald-400" />

            <!-- 메인 왕관 (거대) + 상단 풍성 보조 잎 -->
            <ellipse cx="50" cy="-2" rx="24" ry="18" class="fill-emerald-500" />
            <ellipse cx="34" cy="-11" rx="9.5" ry="7.5" transform="rotate(-22 34 -11)" class="fill-emerald-600" />
            <ellipse cx="66" cy="-11" rx="9.5" ry="7.5" transform="rotate(22 66 -11)" class="fill-emerald-400" />
            <ellipse cx="50" cy="-20" rx="10" ry="8" class="fill-emerald-300" />
            <ellipse cx="43" cy="-22" rx="6" ry="5" class="fill-emerald-400" />
            <ellipse cx="57" cy="-22" rx="6" ry="5" class="fill-emerald-500" />

            <!-- 열매 5개 (rose) -->
            <circle cx="38" cy="18" r="2.3" class="fill-rose-400" />
            <circle cx="62" cy="14" r="2.3" class="fill-rose-400" />
            <circle cx="50" cy="22" r="2.3" class="fill-rose-400" />
            <circle cx="45" cy="2" r="2.3" class="fill-rose-400" />
            <circle cx="56" cy="-4" r="2.3" class="fill-rose-400" />
          </template>

          <!-- Lv.10 결실의 나무: 최대 풍성도 + 황금 열매 섞은 결실 + 트렁크 결무늬 다중 + 빛나는 광휘 -->
          <template v-if="stage === 10">
            <!-- 흙더미 (가장 크게) -->
            <ellipse cx="50" cy="100" rx="19" ry="5.5" class="fill-amber-900" />
            <ellipse cx="50" cy="99" rx="15" ry="3.5" class="fill-amber-800" />
            <!-- 흙 위 풀잎 디테일 (결실의 나무 환경) -->
            <line x1="38" y1="99" x2="36" y2="96" stroke-width="0.7" stroke-linecap="round" class="stroke-emerald-700" />
            <line x1="62" y1="99" x2="64" y2="96" stroke-width="0.7" stroke-linecap="round" class="stroke-emerald-700" />
            <line x1="33" y1="99.5" x2="32" y2="97" stroke-width="0.6" stroke-linecap="round" class="stroke-emerald-600" />
            <line x1="67" y1="99.5" x2="68" y2="97" stroke-width="0.6" stroke-linecap="round" class="stroke-emerald-600" />

            <!-- 광휘 — 메인 왕관 뒤쪽 부드러운 옅은 빛 (결실의 나무 특별 효과) -->
            <ellipse cx="50" cy="-8" rx="34" ry="26" class="fill-amber-100" opacity="0.45" />

            <!-- 트렁크 (가장 굵고 viewBox 상단까지) -->
            <path
              d="M 40.5 99.5 Q 40.5 63 41.5 35 Q 42.5 15 44.5 -8 L 55.5 -8 Q 57.5 15 58.5 35 Q 59.5 63 59.5 99.5 Z"
              class="fill-amber-800"
            />
            <!-- 트렁크 결무늬 (다중 디테일 — 나이테 풍성) -->
            <path d="M 44.5 84 Q 45 56 44.5 28" stroke-width="0.7" fill="none" class="stroke-amber-950" opacity="0.65" />
            <path d="M 50 82 Q 49.5 48 50 18" stroke-width="0.5" fill="none" class="stroke-amber-950" opacity="0.4" />
            <path d="M 55 84 Q 54.5 54 55.5 24" stroke-width="0.7" fill="none" class="stroke-amber-950" opacity="0.65" />
            <!-- 트렁크 옹이 (결실 나무 디테일 — 시간의 흔적) -->
            <ellipse cx="46" cy="70" rx="1.2" ry="2" class="fill-amber-950" opacity="0.4" />
            <ellipse cx="54" cy="55" rx="1" ry="1.6" class="fill-amber-950" opacity="0.4" />

            <!-- 가지 4쌍 (Lv.9 대비 더 길고 두꺼움) -->
            <path d="M 43 72 Q 30 67 13 56" stroke-width="3.4" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 57 72 Q 70 67 87 56" stroke-width="3.4" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 43 52 Q 34 44 18 34" stroke-width="2.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 57 52 Q 66 44 82 34" stroke-width="2.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 44 32 Q 38 22 28 12" stroke-width="2.2" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 56 32 Q 62 22 72 12" stroke-width="2.2" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 45 10 Q 42 0 37 -10" stroke-width="1.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />
            <path d="M 55 10 Q 58 0 63 -10" stroke-width="1.8" stroke-linecap="round" fill="none" class="stroke-amber-800" />

            <!-- 좌측 잎 클러스터 (7개 — 그라데이션 톤) -->
            <ellipse cx="12" cy="54" rx="15" ry="11" transform="rotate(-22 12 54)" class="fill-emerald-700" />
            <ellipse cx="25" cy="48" rx="10" ry="7" transform="rotate(-15 25 48)" class="fill-emerald-500" />
            <ellipse cx="5" cy="50" rx="8" ry="6.5" transform="rotate(-42 5 50)" class="fill-emerald-600" />
            <ellipse cx="17" cy="32" rx="10" ry="7" transform="rotate(-22 17 32)" class="fill-emerald-500" />
            <ellipse cx="28" cy="22" rx="8" ry="6" transform="rotate(-12 28 22)" class="fill-emerald-400" />
            <ellipse cx="22" cy="8" rx="8" ry="6" transform="rotate(-18 22 8)" class="fill-emerald-500" />
            <ellipse cx="32" cy="-2" rx="6.5" ry="5" transform="rotate(-10 32 -2)" class="fill-emerald-400" />

            <!-- 우측 잎 클러스터 (7개 — 그라데이션 톤) -->
            <ellipse cx="88" cy="54" rx="15" ry="11" transform="rotate(22 88 54)" class="fill-emerald-600" />
            <ellipse cx="75" cy="48" rx="10" ry="7" transform="rotate(15 75 48)" class="fill-emerald-400" />
            <ellipse cx="95" cy="50" rx="8" ry="6.5" transform="rotate(42 95 50)" class="fill-emerald-500" />
            <ellipse cx="83" cy="32" rx="10" ry="7" transform="rotate(22 83 32)" class="fill-emerald-400" />
            <ellipse cx="72" cy="22" rx="8" ry="6" transform="rotate(12 72 22)" class="fill-emerald-500" />
            <ellipse cx="78" cy="8" rx="8" ry="6" transform="rotate(18 78 8)" class="fill-emerald-400" />
            <ellipse cx="68" cy="-2" rx="6.5" ry="5" transform="rotate(10 68 -2)" class="fill-emerald-500" />

            <!-- 메인 왕관 (최대) + 상단 풍성 보조 잎 -->
            <ellipse cx="50" cy="-8" rx="27" ry="20" class="fill-emerald-500" />
            <ellipse cx="32" cy="-18" rx="10" ry="8" transform="rotate(-22 32 -18)" class="fill-emerald-600" />
            <ellipse cx="68" cy="-18" rx="10" ry="8" transform="rotate(22 68 -18)" class="fill-emerald-400" />
            <ellipse cx="50" cy="-28" rx="11" ry="8" class="fill-emerald-300" />
            <ellipse cx="40" cy="-29" rx="6.5" ry="5" class="fill-emerald-400" />
            <ellipse cx="60" cy="-29" rx="6.5" ry="5" class="fill-emerald-500" />
            <!-- 최상단 새순 (결실의 시작점) -->
            <ellipse cx="50" cy="-31" rx="4.5" ry="3.5" class="fill-emerald-200" />

            <!-- 열매 8개 — rose 5개 + amber(황금) 3개 섞어서 "결실" 표현 -->
            <circle cx="35" cy="20" r="2.5" class="fill-rose-400" />
            <circle cx="65" cy="16" r="2.5" class="fill-rose-400" />
            <circle cx="50" cy="24" r="2.5" class="fill-rose-400" />
            <circle cx="42" cy="0" r="2.5" class="fill-rose-400" />
            <circle cx="58" cy="-4" r="2.5" class="fill-rose-400" />
            <circle cx="30" cy="36" r="2.3" class="fill-amber-400" />
            <circle cx="70" cy="36" r="2.3" class="fill-amber-400" />
            <circle cx="50" cy="-13" r="2.3" class="fill-amber-400" />
            <!-- 열매 하이라이트 (광택 점) — 결실의 나무 특유의 윤기 -->
            <circle cx="34.3" cy="19.3" r="0.7" class="fill-white" opacity="0.7" />
            <circle cx="64.3" cy="15.3" r="0.7" class="fill-white" opacity="0.7" />
            <circle cx="29.3" cy="35.3" r="0.6" class="fill-white" opacity="0.7" />
            <circle cx="69.3" cy="35.3" r="0.6" class="fill-white" opacity="0.7" />
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
          <template v-if="stage >= esg.maxStage">최고 단계 달성</template>
          <template v-else>다음 단계까지 {{ pointsToNext.toLocaleString() }}P</template>
        </p>

        <!-- DEV 단계 미리보기 컨트롤 — 디자인 확인용. 빌드 시 자동 제거됨. -->
        <div v-if="isDev" class="mt-2 flex items-center justify-center gap-2 border-t border-emerald-200/60 pt-2">
          <button
            type="button"
            @click="prevStage"
            :disabled="stage <= 1"
            class="rounded border border-gray-300 bg-white/90 px-2 py-0.5 text-[10px] font-bold text-gray-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="이전 단계 미리보기"
          >
            ◀
          </button>
          <span class="text-[9px] font-medium uppercase tracking-wider text-gray-500">
            DEV Lv.{{ stage }}
          </span>
          <button
            type="button"
            @click="nextStage"
            :disabled="stage >= esg.maxStage"
            class="rounded border border-gray-300 bg-white/90 px-2 py-0.5 text-[10px] font-bold text-gray-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="다음 단계 미리보기"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
