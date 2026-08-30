<script setup>
import { computed, ref } from "vue";

const groups = [
  { code: "JP", flag: "🇯🇵", count: 1 },
  { code: "US", flag: "🇺🇸", count: 1 },
];
const nodes = ref([
  { name: "Los Angeles - BWH", flag: "🇺🇸", cpu: "0.40", memory: "28.72", memoryText: "296 MB / 1.01 GB", disk: "11.4", diskText: "2.23 GB / 19.6 GB", up: "252", down: "370", upUnit: "B/s", downUnit: "B/s", out: "16.3 GB", in: "4.62 GB", online: "4 小时", expires: "268 天", accent: "green" },
  { name: "Tokyo - AWS Lightsail", flag: "🇯🇵", cpu: "0.40", memory: "42.26", memoryText: "187 MB / 442 MB", disk: "6.6", diskText: "1.28 GB / 19.6 GB", up: "555", down: "549", upUnit: "KB/s", downUnit: "KB/s", out: "4.25 GB", in: "4.21 GB", online: "9 天", expires: "20 天", accent: "orange" },
]);
const query = ref("");
const isDark = ref(false);
const filteredNodes = computed(() => nodes.value.filter((node) => node.name.toLowerCase().includes(query.value.toLowerCase())));
</script>

<template>
  <div class="monitor-app" :class="{ 'is-dark': isDark }">
    <header class="header"><h1>Shum</h1><div class="toolbar"><button :title="isDark ? '切换为浅色' : '切换为深色'" :aria-label="isDark ? '切换为浅色' : '切换为深色'" @click="isDark = !isDark">{{ isDark ? '☼' : '☾' }}</button><button title="设置" aria-label="设置">⚙</button></div></header>
    <main>
      <section class="overview-grid">
        <div class="overview-card"><div class="overview-label">在线节点 <i>ⓘ</i></div><div class="overview-value">18<small>/ 22</small></div><p class="overview-status"><b/>在线率 81.82%</p><span class="overview-icon">▦</span></div>
        <div class="overview-card"><div class="overview-label">资产概览 <i>ⓘ</i></div><div class="overview-value">¥270.12</div><p>实时汇率计算</p><span class="overview-icon">◎</span></div>
        <div class="overview-card"><div class="overview-label">今日流量 <i>ⓘ</i></div><div class="overview-value">86.4<small>GB</small></div><p>总流量 1.007 TB</p><span class="overview-icon">▥</span></div>
        <div class="overview-card"><div class="overview-label">实时带宽 <i>ⓘ</i></div><div class="overview-value orange-text">1.08<small>MB/s</small></div><p>↑ 555 KB/s · ↓ 549 KB/s</p><span class="overview-icon">◉</span></div>
      </section>
      <section class="group-bar"><button v-for="group in groups" :key="group.code"><span>{{ group.flag }}</span>{{ group.code }} <i>{{ group.count }}</i></button></section>
      <section class="node-grid">
        <article v-for="node in filteredNodes" :key="node.name" class="node-card">
          <div class="node-head"><div class="node-title"><span>{{ node.flag }}</span><h2>{{ node.name }}</h2></div><div class="node-actions"><button>▥</button><button>◉</button></div></div>
          <div class="badges"><span>V4</span><span>V6</span></div>
          <div class="metric-grid"><Metric label="CPU" :value="node.cpu + '%'" detail="2 核" :percent="node.cpu" tone="blue"/><Metric label="内存" :value="node.memory + '%'" :detail="node.memoryText" :percent="node.memory" tone="purple"/><Metric label="磁盘" :value="node.disk + '%'" :detail="node.diskText" :percent="node.disk" tone="orange"/><Metric label="负载" value="0.00" detail="" percent="0" tone="pink"/></div>
          <div class="traffic-grid"><Traffic label="↑ 上行" :value="node.up" :unit="node.upUnit" tone="blue"/><Traffic label="↓ 下行" :value="node.down" :unit="node.downUnit" tone="orange"/></div>
          <div class="io-grid"><div><span>◎ 出站</span><b>{{ node.out }}</b></div><div><span>◎ 入站</span><b>{{ node.in }}</b></div></div>
          <div class="quota"><span>▣ 剩余流量 <b>979 GB</b></span><span>20.9 GB / 1000 GB</span><i><b style="width:3%"/></i></div>
          <div class="latency-grid"><div><span>◷ 延迟</span><b>未配置</b></div><div><span>♧ 丢包率</span><b>未配置</b></div><small>未配置首页 Ping</small><small>未配置首页 Ping</small></div>
          <div class="node-footer"><span>⟳ 在线 <b>{{ node.online }}</b></span><span>▣ 到期 <b class="expire">{{ node.expires }}</b></span></div><div class="price">◎ ${{ node.name.startsWith('Tokyo') ? '5/月' : '49.99/年' }}</div>
        </article>
      </section>
    </main>
    <button class="translate">文</button>
  </div>
</template>

<script>
export default {
  components: {
    Metric: { props: ['label', 'value', 'detail', 'percent', 'tone'], template: '<div class="metric"><div class="metric-label"><span>◉ {{ label }}</span><b>{{ value }}</b></div><small>{{ detail }}</small><i><b :class="tone" :style="{width: `${percent}%`}"></b></i></div>' },
    Traffic: { props: ['label', 'value', 'unit', 'tone'], template: '<div class="traffic"><div><span :class="tone">{{ label }}</span><b :class="tone">{{ value }}<small>{{ unit }}</small></b></div><i><b :class="tone"></b></i><span class="traffic-now">● 实时</span></div>' },
  },
};
</script>
