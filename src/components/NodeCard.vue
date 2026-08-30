<script setup>
defineProps({ node: { type: Object, required: true } });
</script>

<template>
  <article class="node-card">
    <div class="node-head"><div class="node-title"><span>{{ node.flag }}</span><h2>{{ node.name }}</h2></div><div class="node-actions"><button>▥</button><button>◉</button></div></div>
    <div class="badges"><span>V4</span><span>V6</span></div>
    <div class="metric-grid"><NodeMetric label="CPU" :value="node.cpu + '%'" detail="2 核" :percent="node.cpu" tone="blue"/><NodeMetric label="内存" :value="node.memory + '%'" :detail="node.memoryText" :percent="node.memory" tone="purple"/><NodeMetric label="磁盘" :value="node.disk + '%'" :detail="node.diskText" :percent="node.disk" tone="orange"/><NodeMetric label="负载" value="0.00" detail="" percent="0" tone="pink"/></div>
    <div class="traffic-grid"><TrafficMetric label="↑ 上行" :value="node.up" :unit="node.upUnit" tone="blue"/><TrafficMetric label="↓ 下行" :value="node.down" :unit="node.downUnit" tone="orange"/></div>
    <div class="io-grid"><div><span>◎ 出站</span><b>{{ node.out }}</b></div><div><span>◎ 入站</span><b>{{ node.in }}</b></div></div>
    <div class="quota"><span>▣ 剩余流量 <b>979 GB</b></span><span>20.9 GB / 1000 GB</span><i><b style="width:3%"/></i></div>
    <div class="latency-grid"><div><span>◷ 延迟</span><b>未配置</b></div><div><span>♧ 丢包率</span><b>未配置</b></div><small>未配置首页 Ping</small><small>未配置首页 Ping</small></div>
    <div class="node-footer"><span>⟳ 在线 <b>{{ node.online }}</b></span><span>▣ 到期 <b class="expire">{{ node.expires }}</b></span></div><div class="price">◎ ${{ node.name.startsWith('Tokyo') ? '5/月' : '49.99/年' }}</div>
  </article>
</template>

<script>
export default {
  components: {
    NodeMetric: { props: ['label', 'value', 'detail', 'percent', 'tone'], template: '<div class="metric"><div class="metric-label"><span>◉ {{ label }}</span><b>{{ value }}</b></div><small>{{ detail }}</small><i><b :class="tone" :style="{width: `${percent}%`}"></b></i></div>' },
    TrafficMetric: { props: ['label', 'value', 'unit', 'tone'], template: '<div class="traffic"><div><span :class="tone">{{ label }}</span><b :class="tone">{{ value }}<small>{{ unit }}</small></b></div><i><b :class="tone"></b></i><span class="traffic-now">● 实时</span></div>' },
  },
};
</script>
