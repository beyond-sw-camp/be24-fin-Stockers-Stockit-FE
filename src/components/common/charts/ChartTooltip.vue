<script setup>
defineProps({
  placement: { type: String, default: 'top' },
})
</script>

<template>
  <div
    class="pointer-events-none invisible absolute z-30 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900/95 px-3 py-2 text-[11px] leading-relaxed text-white shadow-xl backdrop-blur opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100"
    :class="placement === 'bottom' ? 'top-full mt-2 group-hover:translate-y-0 translate-y-1' : 'bottom-full mb-2 group-hover:-translate-y-0 -translate-y-1'"
    role="tooltip"
  >
    <slot />
    <span
      class="absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900/95"
      :class="placement === 'bottom' ? 'bottom-full -mb-1' : 'top-full -mt-1'"
      aria-hidden="true"
    />
  </div>
</template>
