<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";
import AppIcon from "./AppIcon.vue";

const props = defineProps({
  records: { type: Array, default: () => [] },
  node: { type: Object, required: true },
  realtime: { type: Boolean, default: false },
  range: { type: String, default: "realtime" },
  isDark: { type: Boolean, default: false },
});

const hosts = ref([]);
const charts = [];
let renderQueued = false;
const revealedCharts = new Set();
let animateNextRender = false;
let forceRebuild = true;
let resizeObserver = null;
const realtimeRecords = ref([]);
const definitions = [
  { key: "cpu", label: "CPU", icon: "cpu", color: "#c2546d", value: () => `${props.node.cpu}%`, unit: "%" },
  { key: "memory", label: "内存", icon: "database", color: "#20a9b0", value: () => props.node.memoryText, unit: "bytes" },
  { key: "disk", label: "硬盘", icon: "disk", color: "#e28d36", value: () => props.node.diskText, unit: "bytes" },
  { key: "connections", label: "连接 / 进程", icon: "network", color: "#4b75ed", value: () => `${props.node.connectionCount ?? "暂无数据"} / ${props.node.processCount ?? "暂无数据"}`, unit: "" },
];
const tooltips = ref(definitions.map(() => ({ visible: false, left: 0, top: 0, time: "", value: "" })));

function valueOf(record, key) {
  if (key === "cpu") return Number(record?.cpu?.usage ?? record?.cpu);
  if (key === "memory") return Number(record?.ram?.used ?? record?.ram);
  if (key === "disk") return Number(record?.disk?.used ?? record?.disk);
  if (key === "connections") {
    if (record?.connections && typeof record.connections === "object") return Number(record.connections.tcp || 0) + Number(record.connections.udp || 0);
    return Number(record?.connections);
  }
  return NaN;
}

function formatAxis(value, unit) {
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "bytes") {
    if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(1)} GB`;
    if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(0)} MB`;
  }
  return `${value.toFixed(0)}`;
}

function formatTooltipTime(seconds) {
  return new Date(seconds * 1000).toLocaleString("zh-CN", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).replace("/", "-").replace("/", "-");
}

function makeData(definition) {
  const rawSource = props.realtime ? [...props.records.slice(-60), ...realtimeRecords.value] : props.records;
  const source = props.range === "2d" ? [...new Map(rawSource.map((record) => {
    const time = Date.parse(record.updated_at || record.time);
    return [Number.isFinite(time) ? Math.floor(time / 600000) : time, record];
  })).values()] : rawSource;
  const points = source.map((record) => ({
    time: Date.parse(record.updated_at || record.time) / 1000,
    value: valueOf(record, definition.key),
  })).filter((point) => Number.isFinite(point.time) && Number.isFinite(point.value)).sort((a, b) => a.time - b.time);
  return [points.map((point) => point.time), points.map((point) => point.value)];
}

function renderCharts() {
  renderQueued = false;
  const shouldReveal = animateNextRender;
  animateNextRender = false;
  if (!forceRebuild && charts.length === definitions.length && charts.every((chart) => chart.root.isConnected)) {
    definitions.forEach((definition, index) => charts[index].setData(makeData(definition)));
    return;
  }
  forceRebuild = false;
  charts.splice(0).forEach((chart) => chart.destroy());
  definitions.forEach((definition, index) => {
    const host = hosts.value[index];
    if (!host) return;
    const data = makeData(definition);
    const width = Math.max(220, host.clientWidth || 320);
    const dark = props.isDark;
    const axis = dark ? "#8da0b5" : "#536576";
    const grid = dark ? "#304255" : "#dce5eb";
    const options = {
      width,
      height: 170,
      // 给最后一个横轴标签预留空间，避免窄卡片中贴边裁切。
      padding: [8, 30, 8, 2],
      cursor: { drag: { x: false, y: false } },
      legend: { show: false },
      scales: { x: { time: true }, y: { auto: true } },
      axes: [
        { stroke: axis, width: 2, grid: { stroke: grid, width: 1 }, ticks: { stroke: grid, width: 1 }, size: 28, values: (_u, splits) => splits.map((value) => new Date(value * 1000).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })) },
        { stroke: axis, width: 2, grid: { stroke: grid, width: 1 }, ticks: { stroke: grid, width: 1 }, size: 64, values: (_u, splits) => splits.map((value) => formatAxis(value, definition.unit)) },
      ],
      series: [{ label: "时间" }, { label: definition.label, stroke: definition.color, width: 2, points: { show: false }, spanGaps: false }],
      hooks: { setCursor: [(u) => {
        u.root.setAttribute("aria-label", `${definition.label} 历史数据`);
        const sampleIndex = u.cursor.idx;
        if (sampleIndex == null || !data[0][sampleIndex]) {
          tooltips.value[index] = { ...tooltips.value[index], visible: false };
          return;
        }
        tooltips.value[index] = {
          visible: true,
          left: Math.max(8, Math.min(width - 145, (u.cursor.left || 0) + 10)),
          top: Math.max(36, (u.cursor.top || 0) - 42),
          time: formatTooltipTime(data[0][sampleIndex]),
          value: formatAxis(data[1][sampleIndex], definition.unit),
        };
      }] },
    };
    const chart = new uPlot(options, data, host);
    const revealKey = `${props.node.uuid}:${props.range}:${definition.key}`;
    if (shouldReveal || !revealedCharts.has(revealKey)) {
      revealedCharts.add(revealKey);
      chart.root.classList.add("chart-reveal-once");
    }
    charts.push(chart);
  });
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  nextTick(renderCharts);
}

function recordsSignature() {
  return props.records.map((record) => `${record.updated_at || record.time}:${record.cpu?.usage ?? record.cpu}:${record.ram?.used ?? record.ram}:${record.disk?.used ?? record.disk}:${record.connections?.tcp ?? record.connections}`).join("|");
}

function setHost(element, index) {
  if (element) hosts.value[index] = element;
}

function resizeCharts() {
  const width = hosts.value[0]?.clientWidth;
  if (!width) return;
  charts.forEach((chart) => chart.setSize({ width, height: 170 }));
}

onMounted(() => {
  animateNextRender = true;
  forceRebuild = true;
  queueRender();
  resizeObserver = new ResizeObserver(resizeCharts);
  hosts.value.forEach((element) => resizeObserver.observe(element));
});
watch(() => props.node.latestStats, (stats) => {
  if (!props.realtime || !stats) return;
  const time = stats.updated_at || stats.time;
  if (!time || realtimeRecords.value.some((record) => (record.updated_at || record.time) === time)) return;
  realtimeRecords.value = [...realtimeRecords.value, stats].slice(-60);
  queueRender();
}, { immediate: true });
watch([() => props.node.uuid, () => props.realtime, () => props.range], () => {
  realtimeRecords.value = [];
  animateNextRender = true;
  forceRebuild = true;
  queueRender();
});
watch(() => props.isDark, () => {
  forceRebuild = true;
  queueRender();
});
// 仅在历史记录内容或主机切换时重建图表，避免实时状态刷新时重复触发入场动画。
watch([recordsSignature, () => props.node.uuid], queueRender);
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  charts.splice(0).forEach((chart) => chart.destroy());
});
</script>

<template>
  <div class="chart-grid">
    <div v-for="(definition, index) in definitions" :key="definition.key" class="chart-card">
      <strong class="chart-card-title"><AppIcon :name="definition.icon" :size="15" /> {{ definition.label }}</strong>
      <b>{{ definition.value() }}</b>
      <div :ref="(element) => setHost(element, index)" class="uplot-chart-host" />
      <div v-if="tooltips[index].visible" class="chart-tooltip" :style="{ left: `${tooltips[index].left}px`, top: `${tooltips[index].top}px` }">
        <strong>{{ tooltips[index].time }}</strong>
        <span><i :class="definition.key" />{{ definition.label }} <b>{{ tooltips[index].value }}</b></span>
      </div>
    </div>
  </div>
</template>
