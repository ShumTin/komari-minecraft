<script setup>
import { computed } from "vue";
import { getCardPingLines } from "../utils/cardPing.js";
import AppIcon from "./AppIcon.vue";
import FlagIcon from "./FlagIcon.vue";
import NodeMetric from "./NodeMetric.vue";
import SystemIcon from "./SystemIcon.vue";
import TrafficMetric from "./TrafficMetric.vue";
import { getNodeStatus, getNodeStatusLabel } from "../utils/nodeStatus.js";
import { formatByteRate } from "../utils/format.js";

const props = defineProps({ node: { type: Object, required: true }, settings: { type: Object, required: true } });
const pingLines = computed(() => getCardPingLines(props.node.pingLines || [], props.settings));
defineEmits(["select"]);

function latencyTone(value) {
  if (value < 0) return "red";
  if (value <= 50) return "deep-green";
  if (value <= 100) return "green";
  if (value <= 200) return "light-green";
  if (value <= 250) return "yellow";
  return "orange";
}

function packetTone(loss) {
  if (loss <= 1) return "packet-ok";
  if (loss <= 3) return "packet-light";
  if (loss <= 6) return "packet-yellow";
  if (loss <= 9) return "packet-orange";
  return "packet-loss";
}

function sampleTime(value) {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function getCost(node) {
  if (Number.isFinite(Number(node.price)) && Number(node.price) > 0) {
    const cycle = Number(node.billingCycle) === 30 ? "月" : "年";
    return `${node.currency || "$"}${Number(node.price).toFixed(2)}/${cycle}`;
  }
  return node.name.startsWith("Tokyo") ? "$5.00/月" : "$49.99/年";
}

function formatTraffic(value, fallback) {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index > 2 ? 1 : 0)} ${units[index]}`;
}

function getTrafficText(node) {
  const total = (node.trafficUpBytes || 0) + (node.trafficDownBytes || 0);
  const limit = node.trafficLimitBytes || 0;
  if (!total && !limit) return { value: "--", detail: "--" };
  return {
    value: formatTraffic(total, "0 GB"),
    detail: `${formatTraffic(total, "0 GB")} / ${formatTraffic(limit, "不限")}`,
  };
}
</script>

<template>
  <article
    class="node-card"
    role="button"
    tabindex="0"
    @click="$emit('select', node)"
    @keydown.enter="$emit('select', node)"
  >
    <div class="node-head">
      <div class="node-title">
        <FlagIcon class="node-flag" :code="node.group" :label="`${node.group} 节点`" />
        <h2>{{ node.name }}</h2>
      </div>
      <div class="node-actions">
        <span class="system-icon"><SystemIcon :system="node.os" /></span>
        <i
          class="node-status-dot"
          :class="getNodeStatus(node.status)"
          :title="getNodeStatusLabel(node.status)"
          :aria-label="getNodeStatusLabel(node.status)"
          role="status"
        />
      </div>
    </div>
    <div class="node-meta">
      <span><AppIcon name="activity" /> 在线 <b>{{ node.online }}</b></span>
      <span><AppIcon name="clock" /> 到期 <b class="expire">{{ node.expires }}</b></span>
      <span
        ><AppIcon name="wallet" />
        <b class="cost">{{ getCost(node) }}</b></span
      >
    </div>
    <div class="metric-grid">
      <NodeMetric
        label="CPU"
        :value="node.cpu + '%'"
        :detail="`${node.cores || 0} 核`"
        :percent="node.cpu"
        tone="blue"
      /><NodeMetric
        label="内存"
        :value="node.memory + '%'"
        :detail="node.memoryText"
        :percent="node.memory"
        tone="purple"
      /><NodeMetric
        label="磁盘"
        :value="node.disk + '%'"
        :detail="node.diskText"
        :percent="node.disk"
        tone="orange"
      /><NodeMetric
        label="流量"
        :value="getTrafficText(node).value"
        :detail="getTrafficText(node).detail"
        percent="3"
        tone="green"
      />
    </div>
    <div class="traffic-grid">
      <TrafficMetric
        label="上行"
        :value="formatByteRate(node.up, node.upUnit).value"
        :unit="formatByteRate(node.up, node.upUnit).unit"
        tone="blue"
        direction="up"
      /><TrafficMetric
        label="下行"
        :value="formatByteRate(node.down, node.downUnit).value"
        :unit="formatByteRate(node.down, node.downUnit).unit"
        tone="orange"
        direction="down"
      />
    </div>
    <div class="io-grid">
      <div>
        <span><AppIcon name="upload" /> 出站</span><b>{{ node.out }}</b>
      </div>
      <div>
        <span><AppIcon name="download" /> 入站</span><b>{{ node.in }}</b>
      </div>
    </div>
    <div class="latency-grid">
      <div class="latency-panel">
        <h3>延迟</h3>
        <div v-for="line in pingLines" :key="line.id" class="latency-row">
          <span class="line-name">{{ line.name }}</span><b>{{ Number.isFinite(line.value) ? `${line.value.toFixed(0)} ms` : "--" }}</b>
          <span class="signal-bars"><i v-for="(sample, index) in line.samples" :key="index" :class="latencyTone(sample.value)" :data-tooltip="`${sampleTime(sample.time)}\n${sample.value >= 0 ? `${sample.value} ms` : '超时'}`" /></span>
        </div>
        <span v-if="!pingLines.length" class="line-name">暂无监测</span>
      </div>
      <div class="latency-panel">
        <h3>丢包</h3>
        <div v-for="line in pingLines" :key="line.id" class="latency-row">
          <span class="line-name">{{ line.name }}</span><b>{{ Number.isFinite(line.loss) ? `${line.loss.toFixed(1)}%` : '--' }}</b>
          <span class="signal-bars"><i v-for="(sample, index) in line.samples" :key="index" :class="sample.value < 0 ? 'packet-loss' : packetTone(line.loss)" :data-tooltip="`${sampleTime(sample.time)}\n${sample.value < 0 ? '丢包' : `${line.loss.toFixed(1)}%`}`" /></span>
        </div>
        <span v-if="!pingLines.length" class="line-name">暂无监测</span>
      </div>
    </div>
  </article>
</template>
