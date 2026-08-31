<script setup>
import { ref } from "vue";
import Toolbar from "./components/Toolbar.vue";
import OverviewCards from "./components/OverviewCards.vue";
import GroupFilter from "./components/GroupFilter.vue";
import NodeCard from "./components/NodeCard.vue";
import NodeDetails from "./components/NodeDetails.vue";
import {
  getGroups,
  getNodes,
  getNodeDetails,
  getOverview,
} from "./mock/mockService.js";

const isDark = ref(false);
const activeGroup = ref("all");
const selectedNode = ref(null);
const overview = getOverview();
const groups = getGroups();
const nodes = getNodes();
const filteredNodes = ref(nodes);
function selectGroup(group) {
  activeGroup.value = group;
  filteredNodes.value =
    group === "all" ? nodes : nodes.filter((node) => node.group === group);
}
</script>

<template>
  <div class="monitor-app" :class="{ 'is-dark': isDark }">
    <header class="header">
      <h1>Shum</h1>
      <Toolbar :is-dark="isDark" @toggle-theme="isDark = !isDark" />
    </header>
    <main>
      <OverviewCards :overview="overview" />
      <div class="node-filters">
        <GroupFilter
          :groups="groups"
          :active-group="activeGroup"
          @select="selectGroup"
        />
      </div>
      <section class="node-grid">
        <NodeCard
          v-for="node in filteredNodes"
          :key="node.name"
          :node="node"
          @select="selectedNode = getNodeDetails($event)"
        />
      </section>
    </main>
    <button class="translate">文</button>
    <NodeDetails
      v-if="selectedNode"
      :node="selectedNode"
      @close="selectedNode = null"
    />
  </div>
</template>
