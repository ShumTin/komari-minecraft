<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import AppIcon from "./AppIcon.vue";
import SystemIcon from "./SystemIcon.vue";
import { getNodeStatus, getNodeStatusLabel } from "../utils/nodeStatus.js";
import { formatByteRate } from "../utils/format.js";
import { fetchNodeHistory } from "../services/nodeHistory.js";
import { fetchNodePingData } from "../services/komariApi.js";
import LoadCharts from "./LoadCharts.vue";
import PingCharts from "./PingCharts.vue";

const props = defineProps({
  node: { type: Object, required: true },
  hosts: { type: Array, default: () => [] },
  isDark: { type: Boolean, default: false },
  isMinecraft: { type: Boolean, default: false },
});
const emit = defineEmits(["close", "select-host"]);

const chartMode = ref("load");
const loadTimeRange = ref("realtime");
const pingTimeRange = ref("1h");
const timeRange = computed({
  get: () => chartMode.value === "load" ? loadTimeRange.value : pingTimeRange.value,
  set: (value) => {
    if (chartMode.value === "load") loadTimeRange.value = value;
    else pingTimeRange.value = value;
  },
});
const showHostMenu = ref(false);
const historyRecords = ref([]);
const historyLoading = ref(false);
const pingLines = ref([]);
const pingLoading = ref(false);
const pingLinesCache = new Map();
const historyHours = computed(() => ({ realtime: 1, "1h": 1, "4h": 4, "1d": 24, "2d": 48 }[loadTimeRange.value] || 1));
const pingHours = computed(() => ({ "1h": 1, "4h": 4, "1d": 24 }[pingTimeRange.value] || 1));
let historyRequestId = 0;
let pingRequestId = 0;

function closeHostMenu(event) {
  if (!(event.target instanceof Element) || !event.target.closest(".hero-title-row")) {
    showHostMenu.value = false;
  }
}

function formatPeak(value, time) {
  if (!Number.isFinite(value)) return "暂无数据";
  const rate = formatByteRate(value, "B/s");
  return `${rate.value} ${rate.unit} (${formatClock(time)})`;
}

function formatClock(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatConnectionProcess(node) {
  const connections = Number.isFinite(node.connectionCount) ? node.connectionCount : "暂无数据";
  const processes = Number.isFinite(node.processCount) ? node.processCount : "暂无数据";
  return `${connections} / ${processes}`;
}

function latencyColor(index) {
  return ["blue", "green", "orange"][index % 3];
}

function loadHistory(signal) {
  const requestId = ++historyRequestId;
  historyLoading.value = true;
  return fetchNodeHistory(props.node.uuid, historyHours.value, signal)
    .then((records) => {
      if (requestId !== historyRequestId) return;
      historyRecords.value = [...records].sort((left, right) => Date.parse(left.updated_at || left.time) - Date.parse(right.updated_at || right.time));
    })
    .catch((error) => {
      if (error?.name === "AbortError") return;
      if (requestId === historyRequestId) historyRecords.value = [];
    })
    .finally(() => {
      if (requestId === historyRequestId) historyLoading.value = false;
    });
}

watch(
  [() => props.node.uuid, historyHours],
  (_value, _oldValue, onCleanup) => {
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    void loadHistory(controller.signal);
  },
  { immediate: true },
);

watch(
  [() => props.node.uuid, () => chartMode.value, () => timeRange.value],
  (value, oldValue) => {
    if (chartMode.value !== "latency") return;
    const cacheKey = `${props.node.uuid}:${pingHours.value}`;
    const cachedLines = pingLinesCache.get(cacheKey);
    if (cachedLines) pingLines.value = cachedLines;
    else if (oldValue && value[2] !== oldValue[2]) pingLines.value = [];
    const requestId = ++pingRequestId;
    pingLoading.value = true;
    fetchNodePingData(props.node.uuid, pingHours.value)
      .then((lines) => {
        if (requestId === pingRequestId) {
          pingLinesCache.set(cacheKey, lines);
          pingLines.value = lines;
        }
      })
      .catch((error) => {
        if (error?.name !== "AbortError" && requestId === pingRequestId) pingLines.value = [];
      })
      .finally(() => {
        if (requestId === pingRequestId) pingLoading.value = false;
      });
  },
  { immediate: true },
);

watch(() => props.node.uuid, () => {
  pingLines.value = [];
});

onMounted(() => document.addEventListener("click", closeHostMenu));
onBeforeUnmount(() => document.removeEventListener("click", closeHostMenu));
</script>

<template>
  <main class="details-page">
    <section class="details-hero">
      <button class="details-back" aria-label="返回节点列表" @click="$emit('close')"><AppIcon name="back" /></button>
      <div class="hero-copy">
        <div class="hero-title-row"><h1>{{ node.name }}</h1><button class="host-menu-trigger" aria-label="选择主机" @click="showHostMenu = !showHostMenu"><AppIcon :name="showHostMenu ? 'chevronUp' : 'chevronDown'" /></button>
        <div v-if="showHostMenu" class="host-menu">
          <button v-for="host in props.hosts" :key="host.uuid" :class="{ active: host.uuid === node.uuid }" @click="emit('select-host', host.uuid); showHostMenu = false"><i class="node-status-dot" :class="getNodeStatus(host.status)" />{{ host.name }}</button>
        </div>
        </div>
      </div>
      <div class="hero-status" :class="getNodeStatus(node.status)">
        <span><i class="node-status-dot" :class="getNodeStatus(node.status)" />{{ getNodeStatusLabel(node.status) }}</span>
        <small>最后更新 <time>{{ node.updatedAt || "--:--:--" }}</time></small>
      </div>
    </section>
    <div class="details-info-grid">
      <section class="info-panel">
        <h2><AppIcon name="network" /> 网络信息</h2>
        <div class="info-items">
          <div><span><AppIcon name="activity" /> 实时速度</span><b><AppIcon name="upload" /> {{ formatByteRate(node.up, node.upUnit).value }} {{ formatByteRate(node.up, node.upUnit).unit }} · <AppIcon name="download" /> {{ formatByteRate(node.down, node.downUnit).value }} {{ formatByteRate(node.down, node.downUnit).unit }}</b></div>
          <div><span><AppIcon name="activity" /> 峰值速度</span><b><AppIcon name="upload" /> {{ formatPeak(node.peakUp, node.peakUpAt) }} · <AppIcon name="download" /> {{ formatPeak(node.peakDown, node.peakDownAt) }}</b></div>
          <div><span><AppIcon name="database" /> 累计流量</span><b><AppIcon name="upload" /> {{ node.out }} · <AppIcon name="download" /> {{ node.in }}</b></div>
          <div><span><AppIcon name="network" /> 连接 / 进程</span><b>{{ formatConnectionProcess(node) }}</b></div>
        </div>
      </section>
      <section class="info-panel">
        <h2><AppIcon name="monitor" /> 系统信息</h2>
        <div class="info-items">
          <div><span><AppIcon name="server" /> 操作系统</span><b><SystemIcon :system="node.os" /> {{ node.os }}</b></div>
          <div><span><AppIcon name="cpu" /> 内核版本</span><b>{{ node.kernelVersion || "暂无数据" }}</b></div>
          <div><span><AppIcon name="clock" /> 运行时间</span><b>{{ node.uptimeText || "暂无数据" }}</b></div>
          <div><span><AppIcon name="database" /> 图形设备</span><b>{{ node.gpuName || "暂无数据" }}</b></div>
        </div>
      </section>
    </div>
    <section class="details-panel">
      <div class="chart-toolbar">
        <div class="chart-switch">
          <button :class="{ active: chartMode === 'load' }" @click="chartMode = 'load'"><AppIcon name="activity" /> 负载</button>
          <button :class="{ active: chartMode === 'latency' }" @click="chartMode = 'latency'"><AppIcon name="clock" /> 延迟</button>
        </div>
        <div class="chart-switch time-switch">
          <button v-if="chartMode === 'load'" :class="{ active: timeRange === 'realtime' }" @click="timeRange = 'realtime'">实时</button>
          <button :class="{ active: timeRange === '1h' }" @click="timeRange = '1h'">1 小时</button>
          <button :class="{ active: timeRange === '4h' }" @click="timeRange = '4h'">4 小时</button>
          <button :class="{ active: timeRange === '1d' }" @click="timeRange = '1d'">1 天</button>
          <button v-if="chartMode === 'load'" :class="{ active: timeRange === '2d' }" @click="timeRange = '2d'">2 天</button>
        </div>
      </div>
      <div v-show="chartMode === 'load'" class="chart-view-cache">
        <div v-if="historyLoading" class="chart-loading" aria-live="polite" aria-busy="true">
          <span class="loading-spinner" aria-hidden="true" />
          <p>加载数据...</p>
        </div>
      <LoadCharts v-else :records="historyRecords" :node="node" :realtime="loadTimeRange === 'realtime'" :range="loadTimeRange" :is-dark="isDark" :is-minecraft="isMinecraft" />
      </div>
      <section v-show="chartMode === 'latency'" class="details-section latency-card">
        <div v-if="pingLoading && !pingLines.length" class="chart-loading" aria-live="polite" aria-busy="true">
          <span class="loading-spinner" aria-hidden="true" />
          <p>加载延迟数据...</p>
        </div>
        <div v-else-if="!pingLoading && !pingLines.length" class="latency-empty">暂无延迟监测</div>
        <PingCharts v-if="pingLines.length" :key="`${node.uuid}-${timeRange}`" :lines="pingLines" :hours="pingHours" :is-dark="isDark" :is-minecraft="isMinecraft" />
      </section>
    </section>
  </main>
</template>
