<script setup>
import { Moon, RefreshCw, Settings, Sun } from "lucide-vue-next";

const adminUrl = __KOMARI_ADMIN_URL__;

defineProps({ isDark: Boolean, isLoading: Boolean });
defineEmits(["toggle-theme", "refresh"]);
</script>

<template>
  <div class="toolbar">
    <button title="刷新数据" aria-label="刷新数据" :disabled="isLoading" @click="$emit('refresh')"><RefreshCw :class="{ 'is-spinning': isLoading }" :size="17" :stroke-width="1.8" aria-hidden="true" /></button>
    <button
      :title="isDark ? '切换为浅色' : '切换为深色'"
      :aria-label="isDark ? '切换为浅色' : '切换为深色'"
      @click="$emit('toggle-theme')"
    >
      <Sun v-if="isDark" :size="18" :stroke-width="1.8" aria-hidden="true" />
      <Moon v-else :size="18" :stroke-width="1.8" aria-hidden="true" />
    </button>
    <a :href="adminUrl" target="_blank" rel="noopener noreferrer" title="进入后台" aria-label="进入后台"><Settings :size="17" :stroke-width="1.8" aria-hidden="true" /></a>
  </div>
</template>
