<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import AppIcon from "./AppIcon.vue";
import SystemIcon from "./SystemIcon.vue";
import { getNodeStatus, getNodeStatusLabel } from "../utils/nodeStatus.js";
import { formatByteRate } from "../utils/format.js";
import { fetchNodeHistory } from "../services/nodeHistory.js";
import { fetchNodePingData } from "../services/komariApi.js";

const props = defineProps({
  node: { type: Object, required: true },
  hosts: { type: Array, default: () => [] },
});
const emit = defineEmits(["close", "select-host"]);

const chartMode = ref("load");
const timeRange = ref("realtime");
const showHostMenu = ref(false);
const historyRecords = ref([]);
const historyLoading = ref(false);
const pingLines = ref([]);
const pingLoading = ref(false);
const historyHours = computed(() => ({ realtime: 1, "1h": 1, "4h": 4, "1d": 24 }[timeRange.value] || 1));
const pingHours = computed(() => ({ "1h": 1, "4h": 4, "1d": 24 }[timeRange.value] || 1));
let historyRequestId = 0;
let pingRequestId = 0;
const MAX_CHART_POINTS = 500;

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

function getRecordValue(record, key) {
  if (key === "cpu") return Number(record?.cpu?.usage);
  if (key === "memory") return Number(record?.ram?.used);
  if (key === "disk") return Number(record?.disk?.used);
  if (key === "connections") return Number(record?.connections?.tcp) + Number(record?.connections?.udp);
  return NaN;
}

function buildChartPath(records, key) {
  const points = records
    .map((record) => ({ time: Date.parse(record.updated_at || record.time), value: getRecordValue(record, key) }))
    .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.value))
    .sort((left, right) => left.time - right.time);
  const sampled = downsampleChartPoints(points);
  if (sampled.length < 2) return "M0 78 L320 78";
  const min = Math.min(...sampled.map((point) => point.value));
  const span = Math.max(...sampled.map((point) => point.value)) - min || 1;
  const typicalGap = getTypicalGap(sampled);
  const breakThreshold = Math.min(30 * 60 * 1000, Math.max(2 * 60 * 1000, typicalGap * 6));
  return sampled.map((point, index) => {
    const x = (index / (sampled.length - 1)) * 320;
    const y = 82 - ((point.value - min) / span) * 62;
    const previous = sampled[index - 1];
    const command = !previous || point.time - previous.time > breakThreshold ? "M" : "L";
    return `${command}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

function downsampleChartPoints(points) {
  if (points.length <= MAX_CHART_POINTS) return points;
  const bucketSize = points.length / (MAX_CHART_POINTS / 2);
  const sampled = [];
  for (let start = 0; start < points.length; start += bucketSize) {
    const bucket = points.slice(Math.floor(start), Math.ceil(start + bucketSize));
    if (!bucket.length) continue;
    const min = bucket.reduce((current, point) => point.value < current.value ? point : current);
    const max = bucket.reduce((current, point) => point.value > current.value ? point : current);
    sampled.push(min, max);
  }
  return sampled.sort((left, right) => left.time - right.time);
}

function getTypicalGap(points) {
  const gaps = points.slice(1).map((point, index) => point.time - points[index].time).filter((gap) => gap > 0);
  if (!gaps.length) return 60 * 1000;
  gaps.sort((left, right) => left - right);
  return gaps[Math.floor(gaps.length / 2)];
}

function latencyColor(index) {
  return ["blue", "green", "orange"][index % 3];
}

function buildLatencyPath(samples) {
  const valid = samples.map((sample) => Number(sample.value)).filter((value) => value >= 0 && Number.isFinite(value));
  if (valid.length < 2) return "";
  const max = Math.max(100, ...valid);
  return samples.map((sample, index) => {
    const value = Number(sample.value);
    if (value < 0 || !Number.isFinite(value)) return null;
    const x = (index / Math.max(1, samples.length - 1)) * 700;
    const y = 170 - (Math.min(value, max) / max) * 140;
    const previous = samples[index - 1];
    const previousValue = Number(previous?.value);
    const command = !previous || previousValue < 0 || !Number.isFinite(previousValue) ? "M" : "L";
    return `${command}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).filter(Boolean).join(" ");
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
  [() => props.node.uuid, chartMode, pingHours],
  (_value, _oldValue, onCleanup) => {
    if (chartMode.value !== "latency") {
      pingLines.value = [];
      return;
    }
    const requestId = ++pingRequestId;
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    pingLoading.value = true;
    fetchNodePingData(props.node.uuid, pingHours.value, controller.signal)
      .then((lines) => {
        if (requestId === pingRequestId) pingLines.value = lines;
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

watch(chartMode, (mode) => {
  if (mode === "latency" && timeRange.value === "realtime") timeRange.value = "1h";
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
        </div>
      </div>
      <div v-if="chartMode === 'load' && historyLoading" class="chart-loading" aria-live="polite" aria-busy="true">
        <span class="loading-spinner" aria-hidden="true" />
        <p>加载历史数据...</p>
      </div>
      <div v-else-if="chartMode === 'load'" class="chart-grid">
        <div class="chart-card"><strong>CPU</strong><b>{{ node.cpu }}%</b><svg viewBox="0 0 320 90" preserveAspectRatio="none"><path class="chart-line cpu" :d="buildChartPath(historyRecords, 'cpu')" /></svg></div>
        <div class="chart-card"><strong>内存</strong><b>{{ node.memoryText }}</b><svg viewBox="0 0 320 90" preserveAspectRatio="none"><path class="chart-line memory" :d="buildChartPath(historyRecords, 'memory')" /></svg></div>
        <div class="chart-card"><strong>硬盘</strong><b>{{ node.diskText }}</b><svg viewBox="0 0 320 90" preserveAspectRatio="none"><path class="chart-line disk" :d="buildChartPath(historyRecords, 'disk')" /></svg></div>
        <div class="chart-card"><strong>连接 / 进程</strong><b>{{ formatConnectionProcess(node) }}</b><svg viewBox="0 0 320 90" preserveAspectRatio="none"><path class="chart-line network" :d="buildChartPath(historyRecords, 'connections')" /></svg></div>
      </div>
      <section v-else class="details-section latency-card">
        <div v-if="pingLoading" class="chart-loading" aria-live="polite" aria-busy="true">
          <span class="loading-spinner" aria-hidden="true" />
          <p>加载延迟数据...</p>
        </div>
        <div v-else-if="pingLines.length" class="latency-legend">
          <span v-for="(line, index) in pingLines" :key="line.id"><i :class="latencyColor(index)" />{{ line.name }} <b>{{ Number.isFinite(line.value) ? `${line.value.toFixed(1)} ms` : "暂无数据" }}</b> 丢包 {{ line.loss.toFixed(1) }}%</span>
        </div>
        <div v-else class="latency-empty">暂无延迟监测</div>
        <svg v-if="!pingLoading && pingLines.length" class="latency-chart" viewBox="0 0 700 190" preserveAspectRatio="none">
          <path v-for="(line, index) in pingLines" :key="line.id" :class="['latency-line', latencyColor(index)]" :d="buildLatencyPath(line.samples || [])" />
        </svg>
      </section>
    </section>
  </main>
</template>
