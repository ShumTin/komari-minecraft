<script setup>
import { computed, ref } from "vue";

const initialNodes = [
  {
    name: "Tokyo Edge",
    location: "东京 · JP",
    status: "online",
    cpu: 32,
    memory: 58,
    disk: 41,
    uptime: "12天 08小时",
    ping: 42,
    color: "blue",
  },
  {
    name: "Singapore Core",
    location: "新加坡 · SG",
    status: "online",
    cpu: 47,
    memory: 64,
    disk: 38,
    uptime: "08天 19小时",
    ping: 76,
    color: "green",
  },
  {
    name: "Frankfurt Relay",
    location: "法兰克福 · DE",
    status: "online",
    cpu: 28,
    memory: 44,
    disk: 52,
    uptime: "21天 03小时",
    ping: 128,
    color: "purple",
  },
  {
    name: "New York Backup",
    location: "纽约 · US",
    status: "offline",
    cpu: 0,
    memory: 0,
    disk: 67,
    uptime: "—",
    ping: 0,
    color: "orange",
  },
];
const chartPoints =
  "0,105 35,98 70,102 105,78 140,85 175,72 210,80 245,55 280,66 315,48 350,58 385,38 420,46 455,30 490,42 525,24 560,34 595,18 630,28 665,12 700,20";
const nodes = ref(initialNodes.map((node) => ({ ...node })));
const query = ref("");
const activeNav = ref("概览");
const lastUpdated = ref("刚刚");
const navItems = ["概览", "节点", "流量", "告警"];
const filteredNodes = computed(() =>
  nodes.value.filter((node) =>
    `${node.name}${node.location}`
      .toLowerCase()
      .includes(query.value.toLowerCase()),
  ),
);

function refresh() {
  nodes.value = nodes.value.map((node) =>
    node.status === "offline"
      ? node
      : {
          ...node,
          cpu: Math.max(
            10,
            Math.min(85, node.cpu + Math.round(Math.random() * 12 - 6)),
          ),
          memory: Math.max(
            20,
            Math.min(90, node.memory + Math.round(Math.random() * 8 - 4)),
          ),
          ping: Math.max(18, node.ping + Math.round(Math.random() * 16 - 8)),
        },
  );
  lastUpdated.value = "刚刚";
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">K</div>
        <div><strong>komari</strong><span>监控中心</span></div>
      </div>
      <div class="workspace-label">工作区</div>
      <nav>
        <button
          v-for="(item, index) in navItems"
          :key="item"
          class="nav-item"
          :class="{ active: activeNav === item }"
          @click="activeNav = item"
        >
          <span class="icon">{{ ["⌂", "◫", "⌁", "!"][index] }}</span
          >{{ item }}<em v-if="item === '告警'">2</em>
        </button>
      </nav>
      <div class="sidebar-bottom">
        <button class="nav-item"><span class="icon">⚙</span>设置</button>
        <div class="profile">
          <div class="avatar">P</div>
          <div><strong>Planck</strong><span>管理员</span></div>
          <span class="more">···</span>
        </div>
      </div>
    </aside>
    <main class="main-content">
      <header class="topbar">
        <div>
          <div class="breadcrumb">
            工作区 / <span>{{ activeNav }}</span>
          </div>
          <h1>{{ activeNav }}</h1>
        </div>
        <div class="top-actions">
          <label class="search"
            ><span class="icon">⌕</span
            ><input v-model="query" placeholder="搜索节点..." /></label
          ><button class="icon-button">◔</button
          ><button class="avatar small">P</button>
        </div>
      </header>
      <section class="content">
        <div class="welcome-row">
          <div>
            <h2>早上好，Planck <span>✦</span></h2>
            <p>这是你的基础设施实时状态。</p>
          </div>
          <button class="refresh-button" @click="refresh">
            ↻ <span>刷新数据</span>
          </button>
        </div>
        <div class="stat-grid">
          <Stat
            label="节点总数"
            value="24"
            detail="全部节点"
            icon="◫"
            tone="blue"
          /><Stat
            label="在线节点"
            value="22"
            detail="91.7% 正常"
            icon="✓"
            tone="green"
          /><Stat
            label="平均延迟"
            value="68"
            unit="ms"
            detail="较昨日 ↓ 4.2%"
            icon="⌁"
            tone="purple"
          /><Stat
            label="今日流量"
            value="1.28"
            unit="TB"
            detail="配额使用 42%"
            icon="▥"
            tone="orange"
          />
        </div>
        <div class="dashboard-grid">
          <section class="panel traffic-panel">
            <PanelHeading
              title="流量概览"
              meta="过去 24 小时"
              action="查看详情"
            />
            <div class="chart-summary">
              <strong>856.4 <small>GB</small></strong
              ><span class="positive">↑ 12.8%</span>
            </div>
            <div class="chart-wrap">
              <div class="y-labels">
                <span>1 TB</span><span>750 GB</span><span>500 GB</span
                ><span>250 GB</span><span>0</span>
              </div>
              <svg
                viewBox="0 0 700 125"
                preserveAspectRatio="none"
                class="chart"
              >
                <defs>
                  <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stop-color="#5b8def" stop-opacity=".25" />
                    <stop offset="1" stop-color="#5b8def" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path
                  :d="`M 0,125 L ${chartPoints} L 700,125 Z`"
                  fill="url(#fill)"
                />
                <polyline
                  :points="chartPoints"
                  fill="none"
                  stroke="#4d7fe5"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="x-labels">
              <span>00:00</span><span>06:00</span><span>12:00</span
              ><span>18:00</span><span>现在</span>
            </div>
          </section>
          <section class="panel health-panel">
            <PanelHeading title="节点健康度" meta="实时" />
            <div class="health-ring">
              <div class="ring-value">91.7%<small>正常运行</small></div>
            </div>
            <div class="health-legend">
              <span><i class="dot online" />在线 <b>22</b></span
              ><span><i class="dot warning" />警告 <b>1</b></span
              ><span><i class="dot offline" />离线 <b>1</b></span>
            </div>
            <div class="health-note"><span>●</span> 所有核心服务运行正常</div>
          </section>
        </div>
        <section class="panel nodes-panel">
          <PanelHeading
            title="节点状态"
            :meta="`${filteredNodes.length} / ${nodes.length} 个节点`"
            action="管理节点"
          />
          <div class="nodes-table">
            <div class="table-head">
              <span>节点</span><span>状态</span><span>CPU</span><span>内存</span
              ><span>磁盘</span><span>运行时间</span><span>延迟</span>
            </div>
            <NodeRow
              v-for="node in filteredNodes"
              :key="node.name"
              :node="node"
            />
          </div>
        </section>
        <div class="bottom-grid">
          <section class="panel activity-panel">
            <PanelHeading title="最近活动" action="查看全部" /><Activity
              icon="↻"
              title="Tokyo Edge"
              text="状态检查完成"
              time="2 分钟前"
              tone="blue"
            /><Activity
              icon="!"
              title="New York Backup"
              text="节点离线"
              time="18 分钟前"
              tone="red"
            /><Activity
              icon="↑"
              title="Singapore Core"
              text="流量峰值 3.2 MB/s"
              time="36 分钟前"
              tone="green"
            />
          </section>
          <section class="panel quick-panel">
            <PanelHeading title="快捷操作" /><button class="quick-action">
              <span class="quick-icon blue-bg">＋</span
              ><span><b>添加新节点</b><small>接入你的第一台服务器</small></span
              ><span>›</span></button
            ><button class="quick-action">
              <span class="quick-icon purple-bg">⌁</span
              ><span
                ><b>创建监控任务</b><small>Ping、TCP 或 HTTP 检查</small></span
              ><span>›</span>
            </button>
          </section>
        </div>
        <footer>
          <span>数据来源：本地 Mock 数据</span
          ><span>最后更新：{{ lastUpdated }} · 自动刷新已开启</span>
        </footer>
      </section>
    </main>
  </div>
</template>

<script>
export default {
  components: {
    Stat: {
      props: ["label", "value", "unit", "detail", "icon", "tone"],
      template:
        '<div class="stat-card"><div :class="[\'stat-icon\', tone]">{{ icon }}</div><div class="stat-copy"><span>{{ label }}</span><strong>{{ value }}<small>{{ unit }}</small></strong><em>{{ detail }}</em></div><span class="stat-menu">···</span></div>',
    },
    PanelHeading: {
      props: ["title", "meta", "action"],
      template:
        '<div class="panel-heading"><div><h3>{{ title }}</h3><span v-if="meta">{{ meta }}</span></div><button v-if="action">{{ action }} <span>›</span></button></div>',
    },
    NodeRow: {
      props: ["node"],
      template:
        "<div class=\"table-row\"><div class=\"node-name\"><span :class=\"['node-mark', node.color]\">⌁</span><span><b>{{ node.name }}</b><small>{{ node.location }}</small></span></div><span :class=\"['status', node.status]\">{{ node.status === 'online' ? '在线' : '离线' }}</span><Metric :value=\"node.cpu\"/><Metric :value=\"node.memory\"/><Metric :value=\"node.disk\"/><span class=\"muted\">{{ node.uptime }}</span><span :class=\"node.status === 'offline' ? 'muted' : 'latency'\">{{ node.status === 'offline' ? '—' : `${node.ping} ms` }}</span></div>",
    },
    Metric: {
      props: ["value"],
      template:
        '<span class="metric"><i><b :style="{ width: `${value}%` }"></b></i>{{ value }}%</span>',
    },
    Activity: {
      props: ["icon", "title", "text", "time", "tone"],
      template:
        '<div class="activity"><span :class="[\'activity-icon\', tone]">{{ icon }}</span><div><b>{{ title }}</b><span>{{ text }}</span></div><time>{{ time }}</time></div>',
    },
  },
};
</script>
