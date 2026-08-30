<script setup>
defineProps({ isDark: Boolean });
defineEmits(["toggle-theme"]);
</script>

<template>
  <div class="toolbar">
    <button :title="isDark ? '切换为浅色' : '切换为深色'" :aria-label="isDark ? '切换为浅色' : '切换为深色'" @click="$emit('toggle-theme')">{{ isDark ? "☼" : "☾" }}</button>
    <button title="设置" aria-label="设置">⚙</button>
  </div>
</template>
