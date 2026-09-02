<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import uPlot from "uplot";

const props = defineProps({
  lines: { type: Array, default: () => [] },
  hours: { type: Number, default: 1 },
  isDark: { type: Boolean, default: false },
});

const host = ref(null);
const tooltip = ref({ visible: false, left: 0, top: 0, time: "", rows: [] });
const hiddenIds = ref(new Set());
const colors = ["#4775da", "#18b28e", "#f3a12d", "#aa49ed", "#20a9b0"];
let chart = null;

function formatTooltipTime(seconds) {
  return new Date(seconds * 1000).toLocaleString("zh-CN", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).replace("/", "-").replace("/", "-");
}

function createData() {
  const timestamps = [...new Set(props.lines.flatMap((line) => line.samples || []).map((sample) => Date.parse(sample.time) / 1000).filter(Number.isFinite))].sort((left, right) => left - right);
  const series = props.lines.map((line) => {
    const source = props.hours === 48 ? [...new Map((line.samples || []).map((sample) => [Math.floor(Date.parse(sample.time) / 600000), sample])).values()] : line.samples || [];
    const values = new Map(source.map((sample) => [Date.parse(sample.time) / 1000, Number(sample.value)]));
    return timestamps.map((time) => {
      const value = values.get(time);
      return Number.isFinite(value) && value >= 0 ? value : null;
    });
  });
  return [timestamps, ...series];
}

function renderChart() {
  if (!host.value) return;
  const data = createData();
  if (chart) {
    chart.setData(data);
    return;
  }
  const width = Math.max(320, host.value.clientWidth || 700);
  const dark = props.isDark;
  const axis = dark ? "#8da0b5" : "#536576";
  const grid = dark ? "#304255" : "#dce5eb";
  chart = new uPlot({
    width,
    height: 230,
    // 给最后一个横轴标签预留空间，避免贴边时被容器裁切。
    padding: [8, 30, 8, 2],
    legend: { show: false },
    cursor: { drag: { x: false, y: false } },
    scales: { x: { time: true }, y: { auto: true, range: (_u, min, max) => {
      const low = Number.isFinite(min) ? min : 0;
      const high = Number.isFinite(max) ? max : 100;
      const pad = Math.max(5, (high - low) * 0.12);
      return [Math.max(0, low - pad), high + pad];
    } } },
    axes: [
      { stroke: axis, width: 2, grid: { stroke: grid, width: 1 }, ticks: { stroke: grid, width: 1 }, size: 30, values: (_u, splits) => splits.map((value) => new Date(value * 1000).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })) },
      { stroke: axis, width: 2, grid: { stroke: grid, width: 1 }, ticks: { stroke: grid, width: 1 }, size: 58, values: (_u, splits) => splits.map((value) => `${value.toFixed(0)} ms`) },
    ],
    series: [
      { label: "时间" },
      ...props.lines.map((line, index) => ({ label: line.name, stroke: colors[index % colors.length], width: 2, points: { show: false }, spanGaps: false, show: !hiddenIds.value.has(line.id) })),
    ],
    hooks: {
      setCursor: [(instance) => {
        const index = instance.cursor.idx;
        if (index == null || data[0][index] == null) {
          tooltip.value.visible = false;
          return;
        }
        tooltip.value = {
          visible: true,
          left: Math.max(8, Math.min(width - 190, (instance.cursor.left || 0) + 12)),
          top: Math.max(50, (instance.cursor.top || 0) - 48),
          time: formatTooltipTime(data[0][index]),
          rows: props.lines.filter((line) => !hiddenIds.value.has(line.id)).map((line, lineIndex) => ({ name: line.name, color: colors[lineIndex % colors.length], value: data[props.lines.indexOf(line) + 1][index] })),
        };
      }],
    },
  }, data, host.value);
}

function toggleLine(lineId) {
  const next = new Set(hiddenIds.value);
  if (next.has(lineId)) next.delete(lineId); else next.add(lineId);
  hiddenIds.value = next;
  props.lines.forEach((line, index) => chart?.setSeries(index + 1, { show: !next.has(line.id) }));
}

function showAllLines() {
  hiddenIds.value = new Set();
  props.lines.forEach((_line, index) => chart?.setSeries(index + 1, { show: true }));
}

onMounted(() => nextTick(renderChart));
watch(() => props.lines, () => nextTick(renderChart));
watch(() => props.isDark, () => {
  chart?.destroy();
  chart = null;
  nextTick(renderChart);
});
onBeforeUnmount(() => chart?.destroy());
</script>

<template>
  <div class="ping-chart-wrap">
    <div class="latency-legend">
      <button v-for="(line, index) in lines" :key="line.id" type="button" :class="{ muted: hiddenIds.has(line.id) }" @click="toggleLine(line.id)">
        <i :style="{ background: colors[index % colors.length] }" />{{ line.name }}
        <b>{{ Number.isFinite(line.value) ? `${line.value.toFixed(1)} ms` : "暂无数据" }}</b>
        丢包 {{ Number(line.loss || 0).toFixed(1) }}%
      </button>
      <button v-if="hiddenIds.size" type="button" class="ping-series-show-all" @click="showAllLines">显示全部</button>
    </div>
    <div ref="host" class="ping-uplot-host" />
    <div v-if="tooltip.visible" class="chart-tooltip ping-chart-tooltip" :style="{ left: `${tooltip.left}px`, top: `${tooltip.top}px` }">
      <strong>{{ tooltip.time }}</strong>
      <span v-for="row in tooltip.rows" :key="row.name"><i :style="{ background: row.color }" />{{ row.name }} <b>{{ Number.isFinite(row.value) ? `${row.value.toFixed(1)} ms` : "无数据" }}</b></span>
    </div>
  </div>
</template>
