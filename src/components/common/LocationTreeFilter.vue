<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  options: { type: Array, default: () => [] },        // [{ id, code, name, region, locationType? }]
  modelValue: { type: Array, default: () => [] },     // 선택된 id 배열
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: '거점 선택' },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const containerRef = ref(null)
const expanded = ref(new Set())   // 펼친 region 이름
const searchTerm = ref('')        // dropdown 안 검색 (지역명/거점명/거점코드 매칭)

// region(한글) 별 그룹화 + region 정렬
const allGroups = computed(() => {
  const map = new Map()
  for (const opt of props.options) {
    const region = opt.region || '미분류'
    if (!map.has(region)) map.set(region, [])
    map.get(region).push(opt)
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([region, items]) => ({ region, items }))
})

// 검색 필터 적용 — region 매칭 시 전체 항목 보임, 항목 매칭 시 그 항목만 보임 + region 자동 펼침
const groups = computed(() => {
  const q = searchTerm.value.trim().toLowerCase()
  if (!q) return allGroups.value
  const out = []
  for (const g of allGroups.value) {
    const regionHit = g.region.toLowerCase().includes(q)
    if (regionHit) {
      out.push(g)
      continue
    }
    const matched = g.items.filter(i =>
      (i.name ?? '').toLowerCase().includes(q) || (i.code ?? '').toLowerCase().includes(q),
    )
    if (matched.length > 0) out.push({ region: g.region, items: matched })
  }
  return out
})

// 검색어 변경 시 매칭 region 들을 expanded set 에 추가 (사용자가 직접 접었다 폈다 가능)
watch(searchTerm, (val) => {
  const q = val.trim().toLowerCase()
  if (!q) return
  const next = new Set(expanded.value)
  for (const g of allGroups.value) {
    const regionHit = g.region.toLowerCase().includes(q)
    const itemHit = g.items.some(i =>
      (i.name ?? '').toLowerCase().includes(q) || (i.code ?? '').toLowerCase().includes(q),
    )
    if (regionHit || itemHit) next.add(g.region)
  }
  expanded.value = next
})

const selectedSet = computed(() => new Set(props.modelValue))

const isAllSelected = computed(() =>
  props.options.length > 0 && props.options.every(o => selectedSet.value.has(o.id)),
)

function regionState(items) {
  const total = items.length
  const sel = items.filter(i => selectedSet.value.has(i.id)).length
  if (sel === 0) return { state: 'none', count: 0, total }
  if (sel === total) return { state: 'all', count: sel, total }
  return { state: 'partial', count: sel, total }
}

function toggleOpen() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function toggleExpand(region) {
  const next = new Set(expanded.value)
  if (next.has(region)) next.delete(region)
  else next.add(region)
  expanded.value = next
}

function toggleItem(id) {
  const next = new Set(selectedSet.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  emit('update:modelValue', [...next])
}

function toggleRegion(items) {
  const allOn = items.every(i => selectedSet.value.has(i.id))
  const next = new Set(selectedSet.value)
  if (allOn) {
    items.forEach(i => next.delete(i.id))
  } else {
    items.forEach(i => next.add(i.id))
  }
  emit('update:modelValue', [...next])
}

function selectAll() {
  emit('update:modelValue', props.options.map(o => o.id))
}

function clearAll() {
  emit('update:modelValue', [])
}

function removeChip(id) {
  const next = new Set(selectedSet.value)
  next.delete(id)
  emit('update:modelValue', [...next])
}

const chipItems = computed(() =>
  props.options.filter(o => selectedSet.value.has(o.id)).slice(0, 3),
)
const hiddenCount = computed(() => Math.max(0, props.modelValue.length - chipItems.value.length))

function handleDocumentClick(e) {
  if (!containerRef.value?.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))
</script>

<template>
  <div ref="containerRef" class="relative flex flex-col gap-1.5">
    <div
      class="flex min-h-9 cursor-pointer items-center justify-between gap-2 border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-bold text-gray-900 outline-none transition hover:bg-[#EBF5F5]/50"
      :class="[isOpen ? 'border-[#004D3C]' : '', disabled ? 'cursor-not-allowed bg-gray-50' : '']"
      role="button"
      tabindex="0"
      @click="toggleOpen"
      @keydown.enter.prevent="toggleOpen"
      @keydown.space.prevent="toggleOpen"
    >
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        <span v-if="modelValue.length === 0" class="text-gray-400">{{ placeholder }}</span>
        <template v-else>
          <span
            v-for="opt in chipItems"
            :key="opt.id"
            class="inline-flex max-w-full items-center gap-1 bg-[#EBF5F5] px-2 py-1 text-xs font-black text-black"
          >
            <span class="truncate">{{ opt.region ? `${opt.region} ${opt.name}` : opt.name }}</span>
            <button
              type="button"
              class="text-[13px] leading-none text-gray-500 hover:text-black"
              :aria-label="`${opt.name} 선택 해제`"
              @click.stop="removeChip(opt.id)"
            >×</button>
          </span>
          <span
            v-if="hiddenCount > 0"
            class="inline-flex items-center bg-gray-100 px-2 py-1 text-xs font-black text-gray-600"
          >외 {{ hiddenCount }}건</span>
        </template>
      </div>
      <span class="shrink-0 text-[11px] text-gray-500" :class="isOpen ? 'rotate-180' : ''">▼</span>
    </div>

    <div
      v-if="isOpen"
      class="absolute left-0 right-0 top-full z-20 mt-1 max-h-[420px] overflow-hidden border border-gray-300 bg-white p-2 shadow-lg"
    >
      <div class="mb-2 border-b border-gray-100 pb-2">
        <input
          :value="searchTerm"
          type="search"
          placeholder="지역 또는 거점 검색"
          class="mb-2 h-8 w-full border border-gray-200 bg-white px-2 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
          @click.stop
          @keydown.stop
          @input="searchTerm = $event.target.value"
          @compositionupdate="searchTerm = $event.target.value"
        />
        <div class="flex items-center justify-between gap-2">
          <button
            type="button"
            class="flex-1 bg-[#EBF5F5] px-2 py-1.5 text-xs font-black text-black hover:bg-[#D6EAEA] disabled:cursor-not-allowed disabled:text-gray-400"
            :disabled="isAllSelected"
            @click.stop="selectAll"
          >전체 선택</button>
          <button
            type="button"
            class="flex-1 border border-gray-200 px-2 py-1.5 text-xs font-black text-gray-600 hover:bg-gray-50 hover:text-black"
            @click.stop="clearAll"
          >전체 해제</button>
        </div>
      </div>

      <div class="max-h-72 overflow-y-auto">
        <template v-for="g in groups" :key="g.region">
          <div class="flex items-center gap-2 px-1 py-1.5">
            <button
              type="button"
              class="flex h-5 w-5 items-center justify-center text-gray-400 transition-transform hover:text-black"
              :class="expanded.has(g.region) ? 'rotate-0' : '-rotate-90'"
              :aria-label="`${g.region} 펼치기/접기`"
              @click.stop="toggleExpand(g.region)"
            >
              <ChevronDown :size="14" />
            </button>
            <input
              type="checkbox"
              class="h-3.5 w-3.5 accent-[#004D3C]"
              :checked="regionState(g.items).state === 'all'"
              :indeterminate.prop="regionState(g.items).state === 'partial'"
              @change.stop="toggleRegion(g.items)"
            />
            <span class="flex-1 text-sm font-black text-black">{{ g.region }}</span>
            <span class="text-[10px] font-bold text-gray-400">
              {{ regionState(g.items).count }}/{{ regionState(g.items).total }}
            </span>
          </div>
          <div v-if="expanded.has(g.region)" class="ml-7 border-l border-gray-100 pl-2">
            <label
              v-for="opt in g.items"
              :key="opt.id"
              class="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm font-bold text-black hover:bg-[#EBF5F5]/70"
              @click.stop
            >
              <input
                type="checkbox"
                class="h-3.5 w-3.5 accent-[#004D3C]"
                :checked="selectedSet.has(opt.id)"
                @change="toggleItem(opt.id)"
              />
              <span class="truncate">{{ opt.name }}</span>
              <span v-if="opt.code" class="ml-auto text-[10px] font-mono text-gray-400">{{ opt.code }}</span>
            </label>
          </div>
        </template>
        <p v-if="groups.length === 0" class="px-2 py-3 text-center text-xs font-bold text-gray-400">
          {{ searchTerm ? '검색 결과 없음' : '선택 가능한 거점이 없습니다.' }}
        </p>
      </div>
      <p class="mt-2 px-1 text-[11px] font-bold text-gray-400">
        {{ modelValue.length === 0 ? '전체 거점 조회 중' : `${modelValue.length}개 거점 선택됨` }}
      </p>
    </div>
  </div>
</template>
