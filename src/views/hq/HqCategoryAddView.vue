<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ChevronRight, Tags } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const activeTopMenu = computed(() => '상품 관리')
const activeSideMenu = ref('카테고리 관리')

const productSideMenus = [
  { label: '카테고리 관리', icon: 'tags', id: 'SO-006' },
  { label: '제품 마스터', icon: 'package', id: 'SO-011' },
]

const parentCategories = [
  { id: 'CAT-100', name: '상의' },
  { id: 'CAT-200', name: '바지' },
  { id: 'CAT-300', name: '치마' },
  { id: 'CAT-400', name: '아우터' },
]

const level = ref('대분류')
const name = ref('')
const parentId = ref('CAT-100')
const status = ref('사용중')

const nameError = computed(() => name.value.trim() === '' ? '카테고리명을 입력해주세요.' : '')
const selectedParentCategory = computed(() => parentCategories.find((cat) => cat.id === parentId.value))
const requiredProgress = computed(() => {
  const requiredSteps = [
    Boolean(level.value),
    level.value === '대분류' ? true : Boolean(parentId.value),
    Boolean(name.value.trim()),
  ]
  return requiredSteps.filter(Boolean).length
})

function handleSubmit() {
  if (nameError.value) return
  router.push('/hq/products')
}

function handleCancel() {
  router.push('/hq/products')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="productSideMenus"
    v-model:active-side-menu="activeSideMenu"
    show-system-card
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <!-- 페이지 헤더 -->
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex items-center gap-2 text-[11px] font-bold text-gray-400">
          <button type="button" class="hover:text-[#004D3C]" @click="handleCancel">상품 관리</button>
          <ChevronRight :size="12" />
          <button type="button" class="hover:text-[#004D3C]" @click="handleCancel">카테고리 관리</button>
          <ChevronRight :size="12" />
          <span class="text-gray-700">카테고리 추가</span>
        </div>
        <div class="mt-3 flex items-center gap-3">
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center border border-gray-200 text-gray-500 hover:border-[#004D3C] hover:text-[#004D3C]"
            @click="handleCancel"
          >
            <ArrowLeft :size="15" />
          </button>
          <div>
            <h1 class="text-xl font-black text-gray-950">카테고리 추가</h1>
            <p class="mt-0.5 text-xs font-bold text-gray-400">새 카테고리를 추가합니다. 대분류 또는 소분류를 선택하세요.</p>
          </div>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] xl:items-start">
        <div class="border border-gray-200 bg-white shadow-sm">
          <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
            <Tags :size="15" class="text-[#004D3C]" />
            <h2 class="text-sm font-black text-gray-900">카테고리 정보 입력</h2>
          </div>

          <div class="border-b border-gray-100 bg-[#F7FBFA] px-5 py-3">
            <div class="flex items-center justify-between gap-2">
              <p class="text-[11px] font-black uppercase tracking-wide text-gray-500">입력 진행 안내</p>
              <span class="text-[11px] font-black text-[#004D3C]">{{ requiredProgress }}/3 완료</span>
            </div>
            <div class="mt-2 h-1.5 overflow-hidden bg-[#DCEDE8]">
              <div class="h-full bg-[#0E7A60] transition-all" :style="{ width: `${(requiredProgress / 3) * 100}%` }" />
            </div>
            <div class="mt-2 grid gap-2 text-[11px] font-bold text-gray-500 sm:grid-cols-3">
              <p :class="level ? 'text-[#0E7A60]' : ''">1. 단계 선택</p>
              <p :class="level === '대분류' || parentId ? 'text-[#0E7A60]' : ''">2. 상위 분류 확인</p>
              <p :class="name.trim() ? 'text-[#0E7A60]' : ''">3. 카테고리명 입력</p>
            </div>
          </div>

          <form class="space-y-6 p-5" @submit.prevent="handleSubmit">
            <div>
              <p class="mb-2 text-[11px] font-black uppercase tracking-wide text-gray-500">단계 선택 <span class="text-red-500">*</span></p>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  class="flex flex-col items-start border px-4 py-3 text-left transition"
                  :class="level === '대분류'
                    ? 'border-[#004D3C] bg-[#EBF5F5]'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'"
                  @click="level = '대분류'"
                >
                  <span class="text-sm font-black" :class="level === '대분류' ? 'text-[#004D3C]' : 'text-gray-700'">대분류</span>
                  <span class="mt-0.5 text-[11px] font-bold" :class="level === '대분류' ? 'text-[#004D3C]/70' : 'text-gray-400'">
                    최상위 카테고리 (예: 상의, 바지)
                  </span>
                </button>
                <button
                  type="button"
                  class="flex flex-col items-start border px-4 py-3 text-left transition"
                  :class="level === '소분류'
                    ? 'border-[#004D3C] bg-[#EBF5F5]'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'"
                  @click="level = '소분류'"
                >
                  <span class="text-sm font-black" :class="level === '소분류' ? 'text-[#004D3C]' : 'text-gray-700'">소분류</span>
                  <span class="mt-0.5 text-[11px] font-bold" :class="level === '소분류' ? 'text-[#004D3C]/70' : 'text-gray-400'">
                    하위 카테고리 (예: 반팔, 청바지)
                  </span>
                </button>
              </div>
            </div>

            <div v-if="level === '소분류'">
              <label class="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-gray-500">
                상위 분류 <span class="text-red-500">*</span>
              </label>
              <select
                v-model="parentId"
                class="w-full border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#004D3C] focus:bg-white"
              >
                <option v-for="cat in parentCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </div>

            <div>
              <label class="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-gray-500">
                카테고리명 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="name"
                type="text"
                placeholder="카테고리명을 입력하세요"
                class="w-full border px-3 py-2.5 text-sm outline-none"
                :class="nameError && name !== ''
                  ? 'border-red-300 bg-red-50 focus:border-red-400'
                  : 'border-gray-300 bg-gray-50 focus:border-[#004D3C] focus:bg-white'"
              />
              <p v-if="nameError && name !== ''" class="mt-1 text-[11px] font-bold text-red-500">{{ nameError }}</p>
            </div>

            <div>
              <label class="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-gray-500">상태</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="s in ['사용중', '점검중', '미사용']"
                  :key="s"
                  type="button"
                  class="border py-2 text-xs font-black transition"
                  :class="status === s
                    ? 'border-[#004D3C] bg-[#004D3C] text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'"
                  @click="status = s"
                >
                  {{ s }}
                </button>
              </div>
            </div>

            <div class="border border-[#BFDCD4] bg-gradient-to-r from-[#EFF8F5] to-white p-4">
              <p class="mb-2 text-[10px] font-black uppercase tracking-wide text-[#0E7A60]">추가 미리보기</p>
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-2 py-0.5 text-[10px] font-black" :class="level === '대분류' ? 'bg-[#DDF1EB] text-[#005746]' : 'bg-gray-100 text-gray-500'">{{ level }}</span>
                <span v-if="level === '소분류'" class="text-[11px] font-bold text-gray-500">
                  {{ selectedParentCategory?.name }} &rsaquo;
                </span>
                <span class="font-black text-gray-800">{{ name || '카테고리명' }}</span>
                <span class="ml-auto px-2 py-0.5 text-[10px] font-black" :class="{
                  'bg-emerald-50 text-emerald-700': status === '사용중',
                  'bg-amber-50 text-amber-700': status === '점검중',
                  'bg-gray-100 text-gray-500': status === '미사용',
                }">{{ status }}</span>
              </div>
            </div>

            <div class="-mx-5 border-t border-gray-100 bg-gray-50 px-5 pt-4">
              <div class="flex gap-2">
                <button
                  type="button"
                  class="flex-1 border border-gray-300 bg-white py-2.5 text-sm font-black text-gray-700 hover:bg-gray-50"
                  @click="handleCancel"
                >
                  취소
                </button>
                <button
                  type="submit"
                  class="flex-1 border border-[#004D3C] bg-[#004D3C] py-2.5 text-sm font-black text-white hover:bg-[#003d30] disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="!name.trim()"
                >
                  카테고리 추가
                </button>
              </div>
            </div>
          </form>
        </div>

        <aside class="space-y-4 xl:sticky xl:top-16">
          <section class="border border-gray-200 bg-white p-4 shadow-sm">
            <h3 class="text-xs font-black uppercase tracking-wide text-gray-500">카테고리 작성 가이드</h3>
            <div class="mt-3 space-y-2 text-[12px] font-bold text-gray-600">
              <p>대분류: 상품군을 대표하는 이름으로 2~5글자 권장</p>
              <p>소분류: 상위 분류 안에서 중복되지 않는 명칭 사용</p>
              <p>예시: 상의 &rsaquo; 반팔, 바지 &rsaquo; 청바지</p>
            </div>
          </section>

          <section class="border border-gray-200 bg-white p-4 shadow-sm">
            <h3 class="text-xs font-black uppercase tracking-wide text-gray-500">현재 입력 요약</h3>
            <div class="mt-3 space-y-2 text-xs">
              <div class="flex items-center justify-between border border-gray-100 bg-gray-50 px-3 py-2">
                <span class="font-black text-gray-500">단계</span>
                <span class="font-black text-gray-800">{{ level }}</span>
              </div>
              <div class="flex items-center justify-between border border-gray-100 bg-gray-50 px-3 py-2">
                <span class="font-black text-gray-500">상위 분류</span>
                <span class="font-black text-gray-800">{{ level === '소분류' ? selectedParentCategory?.name : '-' }}</span>
              </div>
              <div class="flex items-center justify-between border border-gray-100 bg-gray-50 px-3 py-2">
                <span class="font-black text-gray-500">카테고리명</span>
                <span class="font-black text-gray-800">{{ name || '-' }}</span>
              </div>
              <div class="flex items-center justify-between border border-gray-100 bg-gray-50 px-3 py-2">
                <span class="font-black text-gray-500">상태</span>
                <span class="font-black text-gray-800">{{ status }}</span>
              </div>
            </div>
          </section>

          <section class="border border-gray-200 bg-white p-4 shadow-sm">
            <h3 class="text-xs font-black uppercase tracking-wide text-gray-500">기존 대분류 참고</h3>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="cat in parentCategories"
                :key="cat.id"
                class="inline-flex items-center gap-1 border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-black text-gray-600"
              >
                <span class="text-gray-400">{{ cat.id }}</span>
                <span>{{ cat.name }}</span>
              </span>
            </div>
          </section>
        </aside>
      </section>
    </div>
  </AppLayout>
</template>
