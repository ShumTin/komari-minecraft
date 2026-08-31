<script setup>
import AppIcon from "./AppIcon.vue";
import NodeMetric from "./NodeMetric.vue";
import SystemIcon from "./SystemIcon.vue";
import TrafficMetric from "./TrafficMetric.vue";
import { getNodeStatus, getNodeStatusLabel } from "../utils/nodeStatus.js";

defineProps({ node: { type: Object, required: true } });
defineEmits(["select"]);

const latencyLines = [
  { name: "Apple", value: "11 ms", samples: [42, 48, 55, 63, 72, 88, 110, 138, 155, 180, 205, 280, 320, 44, 58, 90, 160, 240, 310, 420] },
  { name: "DNS-1", value: "4 ms", samples: [4, 7, 9, 12, 18, 22, 28, 35, 42, 48, 55, 61, 72, 80, 92, 105, 118, 130, 145, 4] },
  { name: "DNS-2", value: "11 ms", samples: [11, 18, 25, 36, 48, 55, 64, 72, 85, 98, 120, 145, 152, 168, 190, 210, 245, 290, 305, 11] },
];

const packetLines = [
  { name: "Apple", value: "0.0%" },
  { name: "DNS-1", value: "0.0%" },
  { name: "DNS-2", value: "0.0%" },
];

function latencyTone(value) {
  if (value < 60) return "deep-green";
  if (value < 150) return "light-green";
  if (value < 300) return "yellow";
  return "red";
}

function sampleTime(index) {
  const minute = (51 - (19 - index) + 60) % 60;
  return `13:${String(minute).padStart(2, "0")}`;
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
        <span class="node-flag">{{ node.flag }}</span>
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
        <b class="cost">${{ node.name.startsWith("Tokyo") ? "5/月" : "49.99/年" }}</b></span
      >
    </div>
    <div class="metric-grid">
      <NodeMetric
        label="CPU"
        :value="node.cpu + '%'"
        detail="2 核"
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
        value="979 GB"
        detail="20.9 GB / 1000 GB"
        percent="3"
        tone="green"
      />
    </div>
    <div class="traffic-grid">
      <TrafficMetric
        label="上行"
        :value="node.up"
        :unit="node.upUnit"
        tone="blue"
        direction="up"
      /><TrafficMetric
        label="下行"
        :value="node.down"
        :unit="node.downUnit"
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
        <div v-for="line in latencyLines" :key="line.name" class="latency-row">
          <span class="line-name">{{ line.name }}</span><b>{{ line.value }}</b>
          <span class="signal-bars"><i v-for="(sample, index) in line.samples" :key="index" :class="latencyTone(sample)" :data-tooltip="`${sampleTime(index)}\n${sample} ms`" /></span>
        </div>
      </div>
      <div class="latency-panel">
        <h3>丢包</h3>
        <div v-for="line in packetLines" :key="line.name" class="latency-row">
          <span class="line-name">{{ line.name }}</span><b>{{ line.value }}</b>
          <span class="signal-bars"><i v-for="segment in 20" :key="segment" class="loss" :data-tooltip="`${sampleTime(segment - 1)}\n0.0%`" /></span>
        </div>
      </div>
    </div>
  </article>
</template>
