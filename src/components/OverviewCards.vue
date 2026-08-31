<script setup>
import AppIcon from "./AppIcon.vue";

defineProps({ overview: { type: Object, required: true } });
</script>

<template>
  <section class="overview-grid">
    <div class="overview-card">
      <div class="overview-label">在线节点</div>
      <div class="overview-value">
        {{ overview.online.current
        }}<small>/ {{ overview.online.total }}</small>
      </div>
      <p class="overview-status"><b />在线率 {{ overview.online.rate }}</p>
      <span class="overview-icon"><AppIcon name="server" :size="22" /></span>
    </div>
    <div class="overview-card">
      <div class="overview-label">剩余价值</div>
      <div class="overview-value">{{ overview.assets.value }}</div>
      <p>{{ overview.assets.forecast }}</p>
      <span class="overview-icon"><AppIcon name="wallet" :size="22" /></span>
    </div>
    <div class="overview-card">
      <div class="overview-label">累计流量</div>
      <div class="overview-value">
        {{ overview.traffic.today }}<small>{{ overview.traffic.unit }}</small>
      </div>
      <p class="traffic-summary">
        <span class="traffic-upload"><AppIcon name="upload" /> {{ overview.traffic.upload }}</span>
        ·
        <span class="traffic-download"><AppIcon name="download" /> {{ overview.traffic.download }}</span>
      </p>
      <span class="overview-icon"><AppIcon name="database" :size="22" /></span>
    </div>
    <div class="overview-card">
      <div class="overview-label">实时速率</div>
      <div class="overview-value orange-text">
        {{ overview.bandwidth.value
        }}<small>{{ overview.bandwidth.unit }}</small>
      </div>
      <p>
        <span class="bandwidth-upload"><AppIcon name="upload" /> {{ overview.bandwidth.upload }}</span>
        ·
        <span class="bandwidth-download"><AppIcon name="download" /> {{ overview.bandwidth.download }}</span>
      </p>
      <span class="overview-icon"><AppIcon name="activity" :size="22" /></span>
    </div>
  </section>
</template>
