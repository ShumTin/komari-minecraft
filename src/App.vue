<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import Toolbar from "./components/Toolbar.vue";
import OverviewCards from "./components/OverviewCards.vue";
import GroupFilter from "./components/GroupFilter.vue";
import NodeCard from "./components/NodeCard.vue";
import NodeDetails from "./components/NodeDetails.vue";
import { fetchSnapshot } from "./services/komariApi.js";
import { formatByteRate } from "./utils/format.js";
import {
  getGroups,
  getNodes,
  getNodeDetails,
  getOverview,
  refreshMockData,
} from "./mock/mockService.js";

const isDark = ref(false);
const siteIcon = ref("◉");
const activeGroup = ref("all");
const selectedNode = ref(null);
const overview = ref(getOverview());
const groups = ref(getGroups());
const nodes = ref(getNodes());
const filteredNodes = ref(nodes.value);
const errorMessage = ref("");
let refreshTimer;

function findNodeFromLocation() {
  const match = window.location.pathname.match(/^\/nodes\/(.+)$/);
  if (!match) return null;
  const node = nodes.value.find((item) => encodeURIComponent(item.name) === match[1]);
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

function refreshData() {
  return fetchSnapshot().then((snapshot) => {
    nodes.value = snapshot.nodes;
    groups.value = getGroupsFromNodes(snapshot.nodes);
    overview.value = getOverviewFromNodes(snapshot.nodes);
    selectGroup(activeGroup.value);
    if (selectedNode.value) {
      selectedNode.value = nodes.value.find((node) => node.name === selectedNode.value.name) || null;
    }
    errorMessage.value = "";
  }).catch((error) => {
    console.error("[Komari API] 数据刷新失败", error);
    const snapshot = refreshMockData();
    nodes.value = snapshot.nodes;
    groups.value = snapshot.groups;
    overview.value = snapshot.overview;
    selectGroup(activeGroup.value);
    errorMessage.value = `数据刷新失败，已使用 mock 数据：${error instanceof Error ? error.message : "未知错误"}`;
  });
}

onMounted(() => {
  syncRoute();
  window.addEventListener("popstate", syncRoute);
  refreshData();
  refreshTimer = window.setInterval(refreshData, 15000);
});
onBeforeUnmount(() => {
  window.removeEventListener("popstate", syncRoute);
  window.clearInterval(refreshTimer);
});

function selectGroup(group) {
  activeGroup.value = group;
  filteredNodes.value =
    group === "all" ? nodes.value : nodes.value.filter((node) => node.group === group);
}

function getGroupsFromNodes(items) {
  const counts = new Map();
  items.forEach((node) => counts.set(node.group, (counts.get(node.group) || 0) + 1));
  return [...counts].map(([code, count]) => ({ code, count }));
}

function getOverviewFromNodes(items) {
  const online = items.filter((node) => node.status === "online").length;
  const trafficUp = items.reduce((sum, node) => sum + (node.trafficUpBytes || 0), 0);
  const trafficDown = items.reduce((sum, node) => sum + (node.trafficDownBytes || 0), 0);
  const speedUp = items.reduce((sum, node) => sum + (Number(node.up) || 0), 0);
  const speedDown = items.reduce((sum, node) => sum + (Number(node.down) || 0), 0);
  const toGb = (bytes) => (bytes / 1024 ** 3).toFixed(2);
  const assets = items.reduce((sum, node) => sum + (node.price || 0), 0);
  const currency = items[0]?.currency || "¥";
  const uploadRate = formatByteRate(speedUp, "B/s");
  const downloadRate = formatByteRate(speedDown, "B/s");
  const totalRate = formatByteRate(speedUp, "B/s");
  return {
    online: { current: online, total: items.length, rate: items.length ? `${((online / items.length) * 100).toFixed(2)}%` : "0%" },
    assets: { value: `${currency}${assets.toFixed(2)}`, forecast: "按节点价格汇总" },
    traffic: { today: toGb(trafficUp + trafficDown), unit: "GB", upload: `${toGb(trafficUp)} GB`, download: `${toGb(trafficDown)} GB` },
    bandwidth: {
      value: totalRate.value,
      unit: totalRate.unit,
      upload: `${uploadRate.value} ${uploadRate.unit}`,
      download: `${downloadRate.value} ${downloadRate.unit}`,
    },
  };
}
</script>

<template>
  <div class="monitor-app" :class="{ 'is-dark': isDark }">
    <header class="header">
      <div class="site-brand">
        <span class="site-icon" aria-hidden="true">{{ siteIcon }}</span>
        <h1>Shum</h1>
      </div>
      <Toolbar :is-dark="isDark" @toggle-theme="isDark = !isDark" @refresh="refreshData" />
    </header>
    <main v-if="!selectedNode">
      <OverviewCards :overview="overview" />
      <p v-if="errorMessage" class="data-error" role="alert">{{ errorMessage }}</p>
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
      <p v-if="!errorMessage && filteredNodes.length === 0" class="empty-state">暂无匹配节点</p>
    </main>
    <button v-if="!selectedNode" class="translate">文</button>
    <NodeDetails
      v-if="selectedNode"
      :node="selectedNode"
      :hosts="nodes"
      @close="closeDetails"
      @select-host="openNode(nodes.find((node) => node.name === $event))"
    />
  </div>
</template>
