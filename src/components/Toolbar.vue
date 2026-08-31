<script setup>
import { Moon, RefreshCw, Settings, Sun } from "lucide-vue-next";

defineProps({ isDark: Boolean });
defineEmits(["toggle-theme", "refresh"]);
</script>

<template>
  <div class="toolbar">
    <button title="刷新数据" aria-label="刷新数据" @click="$emit('refresh')"><RefreshCw :size="17" :stroke-width="1.8" aria-hidden="true" /></button>
    <button
      :title="isDark ? '切换为浅色' : '切换为深色'"
      :aria-label="isDark ? '切换为浅色' : '切换为深色'"
      @click="$emit('toggle-theme')"
    >
      <Sun v-if="isDark" :size="18" :stroke-width="1.8" aria-hidden="true" />
      <Moon v-else :size="18" :stroke-width="1.8" aria-hidden="true" />
    </button>
    <button title="设置" aria-label="设置"><Settings :size="17" :stroke-width="1.8" aria-hidden="true" /></button>
  </div>
</template>
