<script setup>
import { computed, ref } from "vue";
import { getFlagImage, getRegionDisplayName, getRegionEmoji, hasRegion } from "../utils/region.js";

const props = defineProps({
  code: { type: String, required: true },
  label: { type: String, default: "" },
});

const failed = ref(false);
const src = computed(() => getFlagImage(props.code));
const emoji = computed(() => getRegionEmoji(props.code));
const displayName = computed(() => props.label || getRegionDisplayName(props.code));
</script>

<template>
  <img v-if="hasRegion(code) && src && !failed" class="flag-icon" :src="src" :alt="displayName" :title="displayName" loading="lazy" @error="failed = true" />
  <span v-else-if="hasRegion(code) && emoji" class="flag-fallback" :aria-label="displayName" :title="displayName">{{ emoji }}</span>
  <span v-else class="flag-fallback" aria-hidden="true" />
</template>
