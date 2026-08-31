<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
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

function findNodeFromLocation() {
  const match = window.location.pathname.match(/^\/nodes\/(.+)$/);
  if (!match) return null;
  const node = nodes.find((item) => encodeURIComponent(item.name) === match[1]);
  return node ? getNodeDetails(node) : null;
}

function syncRoute() {
  selectedNode.value = findNodeFromLocation();
}

function openNode(node) {
  window.history.pushState({}, "", `/nodes/${encodeURIComponent(node.name)}`);
  selectedNode.value = getNodeDetails(node);
}

function closeDetails() {
  window.history.pushState({}, "", "/");
  selectedNode.value = null;
}

onMounted(() => {
  syncRoute();
  window.addEventListener("popstate", syncRoute);
});
onBeforeUnmount(() => window.removeEventListener("popstate", syncRoute));

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
    <main v-if="!selectedNode">
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
          @select="openNode"
        />
      </section>
    </main>
    <button v-if="!selectedNode" class="translate">文</button>
    <NodeDetails
      v-if="selectedNode"
      :node="selectedNode"
      @close="closeDetails"
    />
  </div>
</template>
