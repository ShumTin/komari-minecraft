<script setup>
import AppIcon from "./AppIcon.vue";
import FlagIcon from "./FlagIcon.vue";
import SystemIcon from "./SystemIcon.vue";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { getNodeStatus, getNodeStatusLabel } from "../utils/nodeStatus.js";

const props = defineProps({
  node: { type: Object, required: true },
  hosts: { type: Array, default: () => [] },
});
const emit = defineEmits(["close", "select-host"]);

const chartMode = ref("load");
const timeRange = ref("realtime");
const showHostMenu = ref(false);

function closeHostMenu(event) {
  if (!(event.target instanceof Element) || !event.target.closest(".hero-title-row")) {
    showHostMenu.value = false;
  }
}

onMounted(() => document.addEventListener("click", closeHostMenu));
onBeforeUnmount(() => document.removeEventListener("click", closeHostMenu));
</script>

<template>
  <main class="details-page">
    <section class="details-hero">
      <button class="details-back" aria-label="返回节点列表" @click="$emit('close')"><AppIcon name="back" /></button>
      <FlagIcon class="hero-flag" :code="node.group" :label="`${node.group} 节点`" />
      <div class="hero-copy">
        <div class="hero-title-row"><h1>{{ node.name }}</h1><button class="host-menu-trigger" aria-label="选择主机" @click="showHostMenu = !showHostMenu"><AppIcon :name="showHostMenu ? 'chevronUp' : 'chevronDown'" /></button>
        <div v-if="showHostMenu" class="host-menu">
          <button v-for="host in props.hosts" :key="host.name" :class="{ active: host.name === node.name }" @click="emit('select-host', host.name); showHostMenu = false"><FlagIcon :code="host.group" :label="`${host.group} 节点`" /><i class="node-status-dot" :class="getNodeStatus(host.status)" />{{ host.name }}</button>
        </div>
        </div>
      </div>
      <div class="hero-status" :class="getNodeStatus(node.status)">
        <span><i class="node-status-dot" :class="getNodeStatus(node.status)" />{{ getNodeStatusLabel(node.status) }}</span>
        <small>最后更新 {{ node.updatedAt }}</small>
      </div>
    </section>
    <div class="details-info-grid">
      <section class="info-panel">
        <h2><AppIcon name="network" /> 网络信息</h2>
        <div class="info-items">
          <div><span><AppIcon name="activity" /> 实时速度</span><b><AppIcon name="upload" /> {{ node.up }} {{ node.upUnit }} · <AppIcon name="download" /> {{ node.down }} {{ node.downUnit }}</b></div>
          <div><span><AppIcon name="activity" /> 峰值速度</span><b><AppIcon name="upload" /> 3.77 MB/s (09:05) · <AppIcon name="download" /> 4.29 MB/s (00:10)</b></div>
          <div><span><AppIcon name="database" /> 今日流量</span><b><AppIcon name="upload" /> {{ node.out }} · <AppIcon name="download" /> {{ node.in }}</b></div>
          <div><span><AppIcon name="network" /> 连接 / 进程</span><b>95 / 187</b></div>
        </div>
      </section>
      <section class="info-panel">
        <h2><AppIcon name="monitor" /> 系统信息</h2>
        <div class="info-items">
          <div><span><AppIcon name="server" /> 操作系统</span><b><SystemIcon :system="node.os" /> {{ node.os }}</b></div>
          <div><span><AppIcon name="cpu" /> 内核版本</span><b>6.12.8+deb13-amd64</b></div>
          <div><span><AppIcon name="clock" /> 运行时间</span><b>20 小时 39 分钟</b></div>
          <div><span><AppIcon name="database" /> 厂商</span><b>洛杉矶 · BandwagonHost · AS25820</b></div>
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
          <button :class="{ active: timeRange === 'realtime' }" @click="timeRange = 'realtime'">实时</button>
          <button :class="{ active: timeRange === '1h' }" @click="timeRange = '1h'">1 小时</button>
          <button :class="{ active: timeRange === '4h' }" @click="timeRange = '4h'">4 小时</button>
          <button :class="{ active: timeRange === '1d' }" @click="timeRange = '1d'">1 天</button>
        </div>
      </div>
      <div v-if="chartMode === 'load'" class="chart-grid">
        <div class="chart-card"><strong>CPU</strong><b>{{ node.cpu }}%</b><svg viewBox="0 0 320 90" preserveAspectRatio="none"><path class="chart-line cpu" d="M0 78 L60 77 L120 78 L180 76 L240 78 L320 75" /></svg></div>
        <div class="chart-card"><strong>内存</strong><b>{{ node.memoryText }}</b><svg viewBox="0 0 320 90" preserveAspectRatio="none"><path class="chart-area memory" d="M0 42 L320 42 L320 90 L0 90 Z" /><path class="chart-line memory" d="M0 42 L320 42" /></svg></div>
        <div class="chart-card"><strong>硬盘</strong><b>{{ node.diskText }}</b><svg viewBox="0 0 320 90" preserveAspectRatio="none"><path class="chart-line disk" d="M0 76 L80 76 L160 75 L240 76 L320 75" /></svg></div>
        <div class="chart-card"><strong>连接 / 进程</strong><b>95 / 187</b><svg viewBox="0 0 320 90" preserveAspectRatio="none"><path class="chart-area network" d="M0 86 L70 84 L130 78 L190 82 L250 60 L320 25 L320 90 L0 90 Z" /><path class="chart-line network" d="M0 86 L70 84 L130 78 L190 82 L250 60 L320 25" /></svg></div>
      </div>
      <section v-else class="details-section latency-card">
        <div class="latency-legend">
          <span><i class="blue" />线路 1 <b>38.0 ms</b> 丢包 0.0%</span>
          <span><i class="green" />线路 2 <b>70.0 ms</b> 丢包 0.0%</span>
          <span><i class="orange" />线路 3 <b>86.0 ms</b> 丢包 0.0%</span>
        </div>
        <svg class="latency-chart" viewBox="0 0 700 190" preserveAspectRatio="none">
          <path class="latency-line blue" d="M0 140 C30 125 45 150 65 138 S105 145 125 128 S150 145 175 135 S210 150 235 126 S270 145 290 135 S320 140 340 118 S370 150 395 132 S420 145 445 125 S470 140 490 130 S530 145 550 120 S585 140 610 126 S650 144 700 130" />
          <path class="latency-line green" d="M0 90 C30 80 45 120 65 98 S105 118 125 86 S160 110 190 82 S230 105 255 90 S300 104 325 80 S360 110 385 88 S420 102 445 74 S480 108 505 86 S550 108 580 82 S620 100 650 72 S680 98 700 80" />
          <path class="latency-line orange" d="M0 45 C30 30 45 50 65 35 S100 55 125 40 S165 60 190 32 S225 48 250 38 S290 52 315 30 S350 45 380 34 S420 52 445 28 S480 45 510 32 S550 48 580 26 S620 44 650 30 S680 42 700 25" />
        </svg>
      </section>
    </section>
  </main>
</template>
