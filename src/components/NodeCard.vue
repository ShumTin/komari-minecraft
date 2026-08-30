<script setup>
import NodeMetric from "./NodeMetric.vue";
import TrafficMetric from "./TrafficMetric.vue";

defineProps({ node: { type: Object, required: true } });
defineEmits(["select"]);
</script>

<template>
  <article class="node-card" role="button" tabindex="0" @click="$emit('select', node)" @keydown.enter="$emit('select', node)">
    <div class="node-head"><div class="node-title"><span class="system-icon">◉</span><h2>{{ node.name }}</h2></div><div class="node-actions"><div class="price price-top">◎ ${{ node.name.startsWith('Tokyo') ? '5/月' : '49.99/年' }}</div><span class="node-flag">{{ node.flag }}</span></div></div>
    <div class="metric-grid"><NodeMetric label="CPU" :value="node.cpu + '%'" detail="2 核" :percent="node.cpu" tone="blue"/><NodeMetric label="内存" :value="node.memory + '%'" :detail="node.memoryText" :percent="node.memory" tone="purple"/><NodeMetric label="磁盘" :value="node.disk + '%'" :detail="node.diskText" :percent="node.disk" tone="orange"/><NodeMetric label="负载" value="0.00" detail="" percent="0" tone="pink"/></div>
    <div class="traffic-grid"><TrafficMetric label="↑ 上行" :value="node.up" :unit="node.upUnit" tone="blue"/><TrafficMetric label="↓ 下行" :value="node.down" :unit="node.downUnit" tone="orange"/></div>
    <div class="io-grid"><div><span>◎ 出站</span><b>{{ node.out }}</b></div><div><span>◎ 入站</span><b>{{ node.in }}</b></div></div>
    <div class="quota"><span>▣ 剩余流量 <b>979 GB</b></span><span>20.9 GB / 1000 GB</span><i><b style="width:3%"/></i></div>
    <div class="latency-grid"><div><span>◷ 延迟</span><b>未配置</b></div><div><span>♧ 丢包率</span><b>未配置</b></div><small>未配置首页 Ping</small><small>未配置首页 Ping</small></div>
    <div class="node-footer"><span>⟳ 在线 <b>{{ node.online }}</b></span><span>▣ 到期 <b class="expire">{{ node.expires }}</b></span></div>
  </article>
</template>
