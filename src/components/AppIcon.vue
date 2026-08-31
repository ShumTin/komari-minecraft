<script setup>
const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 16 },
  label: { type: String, default: "" },
});

const paths = {
  activity: "M3 12h3l2-7 4 14 2-7h4",
  arrowDown: "M12 4v15m0 0-5-5m5 5 5-5",
  arrowUp: "M12 20V5m0 0-5 5m5-5 5 5",
  back: "m15 18-6-6 6-6",
  chevronDown: "m6 9 6 6 6-6",
  chevronUp: "m6 15 6-6 6 6",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  cpu: "M9 9h6v6H9zM9 3v3m6-3v3m0 12v3m-6-3v3M3 9h3m-3 6h3m12-6h3m-3 6h3",
  database: "M4 5c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2Zm0 0v7c0 1.1 3.6 2 8 2s8-.9 8-2V5m-16 7v7c0 1.1 3.6 2 8 2s8-.9 8-2v-7",
  disk: "M5 3h14v18H5zM8 7h8M8 17h2",
  download: "M12 4v11m0 0 4-4m-4 4-4-4M5 20h14",
  info: "M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  moon: "M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z",
  monitor: "M4 5h16v11H4zM8 20h8M12 16v4",
  network: "M12 15V9m0 0-3 3m3-3 3 3M5 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm14 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  server: "M4 4h16v6H4zM4 14h16v6H4zM7 7h.01M7 17h.01",
  settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12v2m0 13v2m8.5-8.5h-2m-13 0h-2m13.5-6-1.4 1.4M7.4 17.6 6 19m12 0-1.4-1.4M7.4 6.4 6 5",
  sun: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m11.4 0 1.4 1.4M4.9 4.9l1.4 1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  upload: "M12 20V9m0 0-4 4m4-4 4 4M5 4h14",
  wallet: "M4 6h16v13H4zM4 6l2-3h12l2 3m-4 7h4",
};
</script>

<template>
  <svg
    class="app-icon"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-hidden="props.label ? undefined : true"
    :role="props.label ? 'img' : undefined"
    :aria-label="props.label || undefined"
  >
    <path :d="paths[props.name] || paths.activity" />
  </svg>
</template>
