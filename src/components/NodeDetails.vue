<script setup>
defineProps({ node: { type: Object, required: true } });
defineEmits(["close"]);
</script>

<template>
  <main class="details-page">
    <div class="details-page-header">
      <button class="details-back" @click="$emit('close')">← 返回节点列表</button>
    </div>
    <section class="details-panel">
      <div class="details-title">
        <span>{{ node.flag }}</span>
        <div>
          <h2>{{ node.name }}</h2>
          <p>{{ node.system }} · 在线 {{ node.online }}</p>
        </div>
      </div>
      <div class="details-status">
        <b />运行正常 <span>最后更新 {{ node.updatedAt }}</span>
      </div>
      <div class="details-grid">
        <div>
          <span>CPU</span><b>{{ node.cpu }}%</b
          ><small>{{ node.cores }} 核 · 负载 {{ node.load }}</small>
        </div>
        <div>
          <span>内存</span><b>{{ node.memory }}%</b
          ><small>{{ node.memoryText }}</small>
        </div>
        <div>
          <span>磁盘</span><b>{{ node.disk }}%</b
          ><small>{{ node.diskText }}</small>
        </div>
        <div>
          <span>今日流量</span><b>{{ node.out }}</b
          ><small>入站 {{ node.in }}</small>
        </div>
      </div>
      <section class="details-section">
        <h3>Ping 延迟</h3>
        <div class="ping-list">
          <span v-for="(ping, index) in node.ping" :key="index"
            ><i />线路 {{ index + 1 }}<b>{{ ping }} ms</b></span
          >
        </div>
      </section>
      <section class="details-section">
        <h3>网络状态</h3>
        <div class="detail-row">
          <span>丢包率</span><b>{{ node.packetLoss }}</b>
        </div>
        <div class="detail-row">
          <span>上行速率</span><b>{{ node.up }} {{ node.upUnit }}</b>
        </div>
        <div class="detail-row">
          <span>下行速率</span><b>{{ node.down }} {{ node.downUnit }}</b>
        </div>
      </section>
    </section>
  </main>
</template>
