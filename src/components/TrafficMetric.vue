<script setup>
import AppIcon from "./AppIcon.vue";

defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String, required: true },
  tone: { type: String, required: true },
  direction: { type: String, default: "up" },
});
</script>

<template>
  <div class="traffic">
    <div>
      <span :class="tone"><AppIcon :name="direction === 'down' ? 'download' : 'upload'" /> {{ label }}</span
      ><b :class="tone"
        >{{ value }}<small>{{ unit }}</small></b
      >
    </div>
  </div>
</template>
