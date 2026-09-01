<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  detail: { type: String, default: "" },
  percent: { type: [String, Number], required: true },
  tone: { type: String, required: true },
});
</script>

<template>
  <div class="metric">
    <div class="metric-label">
      <span>{{ label }}</span><b :class="{ 'metric-value-traffic': label === '流量' }">{{ value }}</b>
    </div>
    <i><b :class="tone" :style="{ width: `${percent}%` }" /></i>
    <small>{{ detail }}</small>
  </div>
</template>
