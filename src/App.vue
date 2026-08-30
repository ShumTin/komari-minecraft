<script setup>
import { computed, ref } from "vue";
import Toolbar from "./components/Toolbar.vue";
import OverviewCards from "./components/OverviewCards.vue";
import GroupFilter from "./components/GroupFilter.vue";
import NodeCard from "./components/NodeCard.vue";
import { groups, nodes, overview } from "./mock/data.js";

const query = ref("");
const isDark = ref(false);
const filteredNodes = computed(() => nodes.filter((node) => node.name.toLowerCase().includes(query.value.toLowerCase())));
</script>

<template>
  <div class="monitor-app" :class="{ 'is-dark': isDark }">
    <header class="header"><h1>Shum</h1><Toolbar :is-dark="isDark" @toggle-theme="isDark = !isDark" /></header>
    <main>
      <OverviewCards :overview="overview" />
      <div class="node-filters"><label class="node-search"><span>⌕</span><input v-model="query" placeholder="搜索节点" /></label><GroupFilter :groups="groups" /></div>
      <section class="node-grid"><NodeCard v-for="node in filteredNodes" :key="node.name" :node="node" /></section>
    </main>
    <button class="translate">文</button>
  </div>
</template>
