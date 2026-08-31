<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String, required: true },
  tone: { type: String, required: true },
});
</script>

<template>
  <div class="traffic">
    <div>
      <span :class="tone">{{ label }}</span
      ><b :class="tone"
        >{{ value }}<small>{{ unit }}</small></b
      >
    </div>
  </div>
</template>
