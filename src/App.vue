<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import Toolbar from "./components/Toolbar.vue";
import OverviewCards from "./components/OverviewCards.vue";
import GroupFilter from "./components/GroupFilter.vue";
import NodeCard from "./components/NodeCard.vue";
import NodeDetails from "./components/NodeDetails.vue";
import { fetchLatestStats, fetchSnapshot, supportsBatchLatestStats, updateNodeRealtime } from "./services/komariApi.js";
import { getRpcTransportState } from "./services/rpc.js";
import { calculateAssets, fetchExchangeRates } from "./services/assets.js";
import { fetchThemeSettings, normalizeSettings, resolveAppearance } from "./services/themeSettings.js";
import { formatByteRate } from "./utils/format.js";

const APPEARANCE_STORAGE_KEY = "komari-appearance";

function getSystemDark() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

function readAppearance() {
  try {
    const stored = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "mc") return stored;
  } catch {
    // 无法读取偏好时，按系统外观选择初始主题。
  }
  return null;
}

const settings = ref(normalizeSettings());
const settingsError = ref("");
const rates = ref(null);
const localAppearance = ref(readAppearance());
const systemDark = ref(getSystemDark());
const appearance = computed(() => resolveAppearance(localAppearance.value, systemDark.value));
const systemQuery = window.matchMedia("(prefers-color-scheme: dark)");
let settingsInFlight = false;
function syncSystem(event) { systemDark.value = event.matches; }
async function refreshSettings() {
  if (settingsInFlight) return;
  settingsInFlight = true;
  try {
    settings.value = await fetchThemeSettings();
    settingsError.value = "";
  } catch { settingsError.value = "主题设置加载失败，暂用上次配置或默认值"; }
  if (settings.value.showStatsBar && settings.value.showAssets) {
    try { rates.value = await fetchExchangeRates(); }
    catch { rates.value = null; }
  }
  settingsInFlight = false;
}
function refreshVisibleSettings() {
  if (document.visibilityState === "visible") void refreshSettings();
}
const isMinecraftTheme = computed(() => appearance.value === "mc");
const isDark = computed(() => appearance.value === "dark");
const faviconUrl = "/favicon.ico";
const activeGroup = ref("all");
const selectedNode = ref(null);
const isLoading = ref(true);
const groups = ref([]);
const nodes = ref([]);
const overview = computed(() => getOverviewFromNodes(nodes.value));
const filteredNodes = ref(nodes.value);
const errorMessage = ref("");
let refreshTimer;
let refreshInFlight = false;
let refreshStopped = false;
let realtimeTimer;
let realtimeInFlight = false;
let lastHttpFallbackAt = 0;

function persistAppearance(value) {
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, value);
  } catch {
    // 浏览器禁用存储时仍保留当前会话主题。
  }
}

function setAppearance(next) {
  localAppearance.value = next;
  persistAppearance(next);
}

function findNodeFromLocation() {
  const match = window.location.pathname.match(/^\/instance\/(.+)$/);
  if (!match) return null;
  const uuid = decodeURIComponent(match[1]);
  const node = nodes.value.find((item) => item.uuid === uuid);
  return node || null;
}

function syncRoute() {
  selectedNode.value = findNodeFromLocation();
}

function openNode(node) {
  window.history.pushState({}, "", `/instance/${encodeURIComponent(node.uuid)}`);
  selectedNode.value = node;
}

function closeDetails() {
  window.history.pushState({}, "", "/");
  selectedNode.value = null;
}

function refreshData() {
  if (refreshInFlight) return Promise.resolve();
  refreshInFlight = true;
  isLoading.value = true;
  errorMessage.value = "";
  window.clearTimeout(refreshTimer);
  void refreshSettings();
  return fetchSnapshot()
    .then((snapshot) => {
      nodes.value = snapshot.nodes;
      groups.value = getGroupsFromNodes(snapshot.nodes);
      selectGroup(activeGroup.value);
      if (selectedNode.value) {
        selectedNode.value = nodes.value.find((node) => node.uuid === selectedNode.value.uuid) || null;
      } else {
        selectedNode.value = findNodeFromLocation();
      }
    })
    .catch((error) => {
      console.error("[Komari API] 数据刷新失败", error);
      errorMessage.value = `数据刷新失败：${error instanceof Error ? error.message : "未知错误"}`;
    })
    .finally(() => {
      isLoading.value = false;
      refreshInFlight = false;
      if (!refreshStopped) {
        refreshTimer = window.setTimeout(refreshData, 30000);
      }
    });
}

async function refreshRealtimeData() {
  if (refreshStopped || realtimeInFlight || !nodes.value.length || !supportsBatchLatestStats()) return;
  const transport = getRpcTransportState();
  if (transport !== "websocket" && Date.now() - lastHttpFallbackAt < 15000) return;
  realtimeInFlight = true;
  try {
    const latest = await fetchLatestStats(nodes.value.map((node) => node.uuid));
    if (getRpcTransportState() !== "websocket") lastHttpFallbackAt = Date.now();
    nodes.value = await Promise.all(nodes.value.map((node) => updateNodeRealtime(node, latest.get(node.uuid) || [])));
    selectGroup(activeGroup.value);
    if (selectedNode.value) {
      selectedNode.value = nodes.value.find((node) => node.uuid === selectedNode.value.uuid) || null;
    }
  } catch (error) {
    console.warn("[Komari API] 实时状态刷新失败", error);
  } finally {
    realtimeInFlight = false;
  }
}

onMounted(() => {
  systemQuery.addEventListener("change", syncSystem);
  document.addEventListener("visibilitychange", refreshVisibleSettings);
  syncRoute();
  window.addEventListener("popstate", syncRoute);
  refreshStopped = false;
  refreshData();
  realtimeTimer = window.setInterval(refreshRealtimeData, 2000);
});
onBeforeUnmount(() => {
  refreshStopped = true;
  systemQuery.removeEventListener("change", syncSystem);
  document.removeEventListener("visibilitychange", refreshVisibleSettings);
  window.removeEventListener("popstate", syncRoute);
  window.clearTimeout(refreshTimer);
  window.clearInterval(realtimeTimer);
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
  const uploadRate = formatByteRate(speedUp, "B/s");
  const downloadRate = formatByteRate(speedDown, "B/s");
  const totalRate = formatByteRate(speedUp + speedDown, "B/s");
  return {
    online: { current: online, total: items.length, rate: items.length ? `${((online / items.length) * 100).toFixed(2)}%` : "0%" },
    assets: calculateAssets(items, rates.value),
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
  <div class="monitor-app" :class="{ 'is-dark': isDark, 'mc-theme': isMinecraftTheme }">
    <header class="header">
      <div class="site-brand">
        <img class="site-icon" :src="faviconUrl" alt="" />
        <h1>Shum</h1>
      </div>
      <Toolbar :appearance="appearance" :is-loading="isLoading" @set-appearance="setAppearance" @refresh="refreshData" />
    </header>
    <section
      v-if="!selectedNode && isLoading && nodes.length === 0"
      class="details-loading"
      aria-live="polite"
      aria-busy="true"
    >
      <span class="loading-spinner" aria-hidden="true" />
      <p>加载节点...</p>
    </section>
    <main v-else-if="!selectedNode" :aria-busy="isLoading">
      <OverviewCards :overview="overview" :settings="settings" />
      <p v-if="settingsError" class="data-error" role="alert">{{ settingsError }}</p>
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
          :settings="settings"
          @select="openNode"
        />
      </section>
      <p v-if="!isLoading && !errorMessage && filteredNodes.length === 0" class="empty-state">暂无节点</p>
      <footer v-if="settings.showStatsBar && settings.showAssets" class="site-footer">
        <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer">汇率来源：ExchangeRate-API</a>
      </footer>
    </main>
    <NodeDetails
      v-if="selectedNode"
      :node="selectedNode"
      :hosts="nodes"
      :is-dark="isDark"
      :is-minecraft="isMinecraftTheme"
      @close="closeDetails"
      @select-host="openNode(nodes.find((node) => node.uuid === $event))"
    />
  </div>
</template>
