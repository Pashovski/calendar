<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  /** Stable seed so the same instance always picks the same variant */
  seed?: number
  /** SVG stroke-width — bump up for small rendered sizes */
  strokeWidth?: number
}>(), {
  seed: 0,
  strokeWidth: 2.5,
})

// Three hand-authored path variants. Each is a closed cubic-bezier loop
// inside a 200x200 viewBox, roughly centered, with slightly different
// wobble so adjacent circles don't look stamped from a mold.
const VARIANTS = [
  // Variant A — leans slightly right, tighter top
  `M102 16
   C 148 13, 186 44, 189 92
   C 192 140, 156 180, 104 185
   C 52 190, 14 156, 12 106
   C 10 56, 50 19, 102 16Z`,
  // Variant B — wider left bulge, flatter bottom
  `M98 19
   C 140 14, 182 48, 186 94
   C 190 142, 160 176, 108 182
   C 54 188, 16 152, 15 104
   C 14 54, 46 24, 98 19Z`,
  // Variant C — slight upward tilt, narrower right
  `M100 20
   C 146 16, 178 50, 182 96
   C 186 136, 152 178, 106 183
   C 56 188, 18 150, 16 102
   C 14 52, 52 22, 100 20Z`,
]

const path = computed(() => {
  const idx = Math.abs(props.seed ?? 0) % VARIANTS.length
  return VARIANTS[idx]
})
</script>

<template>
  <span class="hdc">
    <svg
      class="hdc-svg"
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <path
        :d="path"
        fill="none"
        stroke="var(--color-oxblood)"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span class="hdc-content">
      <slot />
    </span>
  </span>
</template>

<style scoped>
.hdc {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.hdc-svg {
  position: absolute;
  /* Overshoot content bounds slightly so the circle envelops the slot */
  inset: -14% -16%;
  width: 132%;
  height: 128%;
  pointer-events: none;
}

.hdc-content {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
