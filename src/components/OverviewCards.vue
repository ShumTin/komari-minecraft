<script setup>
defineProps({ overview: { type: Object, required: true } });
</script>

<template>
  <section class="overview-grid">
    <div class="overview-card"><div class="overview-label">在线节点 <i>ⓘ</i></div><div class="overview-value">{{ overview.online.current }}<small>/ {{ overview.online.total }}</small></div><p class="overview-status"><b/>在线率 {{ overview.online.rate }}</p><span class="overview-icon">▦</span></div>
    <div class="overview-card"><div class="overview-label">资产概览 <i>ⓘ</i></div><div class="overview-value">{{ overview.assets.value }}</div><p>{{ overview.assets.forecast }}</p><span class="overview-icon">◎</span></div>
    <div class="overview-card"><div class="overview-label">今日流量 <i>ⓘ</i></div><div class="overview-value">{{ overview.traffic.today }}<small>{{ overview.traffic.unit }}</small></div><p>{{ overview.traffic.total }}</p><span class="overview-icon">▥</span></div>
    <div class="overview-card"><div class="overview-label">实时带宽 <i>ⓘ</i></div><div class="overview-value orange-text">{{ overview.bandwidth.value }}<small>{{ overview.bandwidth.unit }}</small></div><p>↑ {{ overview.bandwidth.upload }} · ↓ {{ overview.bandwidth.download }}</p><span class="overview-icon">◉</span></div>
  </section>
</template>
