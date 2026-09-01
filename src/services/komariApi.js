import { callRpc } from "./rpc.js";

export async function fetchNodes() {
  const result = await callRpc("public:getNodesInformation");
  return Array.isArray(result) ? result : [];
}

export async function fetchRecentStats(uuid) {
  const result = await callRpc("public:getClientRecentRecords", { uuid });
  return Array.isArray(result) ? result : [];
}

export async function fetchPingTasks() {
  const result = await callRpc("public:getPublicPingTasks");
  return Array.isArray(result) ? result : [];
}

export async function fetchPingRecords(uuid, hours = 1) {
  const result = await callRpc("public:getPingRecords", { uuid, hours: String(hours) });
  return Array.isArray(result?.records) ? result.records : [];
}

export async function fetchPingStats(uuid, hours = 1) {
  const result = await callRpc("public:getPingMetricStats", {
    entity_id: uuid,
    hours,
    max_points: 100,
  });
  return Array.isArray(result?.stats) ? result.stats : [];
}

export async function fetchSnapshot() {
  const [nodesResult, tasksResult] = await Promise.allSettled([fetchNodes(), fetchPingTasks()]);
  if (nodesResult.status === "rejected") throw nodesResult.reason;
  const apiNodes = nodesResult.value;
  const pingTasks = tasksResult.status === "fulfilled" ? tasksResult.value : [];
  const results = await Promise.allSettled(apiNodes.map(async (node) => {
    const records = await fetchRecentStats(node.uuid);
    const [pingRecordsResult, pingStatsResult] = await Promise.allSettled([
      fetchPingRecords(node.uuid),
      fetchPingStats(node.uuid),
    ]);
    const pingRecords = pingRecordsResult.status === "fulfilled" ? pingRecordsResult.value : [];
    const pingStats = pingStatsResult.status === "fulfilled" ? pingStatsResult.value : [];
    return toNodeModel(
      node,
      records[records.length - 1],
      createPingLines(node.uuid, pingTasks, pingRecords, pingStats),
    );
  }));
  const nodes = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
  if (apiNodes.length > 0 && nodes.length === 0) {
    const failure = results.find((result) => result.status === "rejected");
    throw failure?.reason || new Error("所有节点指标请求均失败");
  }
  return { nodes };
}

function toNodeModel(node, stats, pingLines) {
  const memoryTotal = Number(node.mem_total) || 0;
  const diskTotal = Number(node.disk_total) || 0;
  const memoryUsed = Number(stats?.ram?.used) || 0;
  const diskUsed = Number(stats?.disk?.used) || 0;
  const online = Boolean(stats);

  return {
    name: node.name || node.uuid,
    group: node.group || node.region || "UN",
    os: node.os || "Unknown",
    cpu: fixed(stats?.cpu?.usage),
    memory: fixed(memoryTotal ? (memoryUsed / memoryTotal) * 100 : 0),
    memoryText: `${formatBytes(memoryUsed)} / ${formatBytes(memoryTotal)}`,
    disk: fixed(diskTotal ? (diskUsed / diskTotal) * 100 : 0),
    diskText: `${formatBytes(diskUsed)} / ${formatBytes(diskTotal)}`,
    up: String(stats?.network?.up || 0),
    down: String(stats?.network?.down || 0),
    upUnit: "B/s",
    downUnit: "B/s",
    out: formatBytes(Number(stats?.network?.totalUp) || 0),
    in: formatBytes(Number(stats?.network?.totalDown) || 0),
    trafficUpBytes: Number(stats?.network?.totalUp) || 0,
    trafficDownBytes: Number(stats?.network?.totalDown) || 0,
    trafficLimitBytes: Number(node.traffic_limit) || 0,
    cores: Number(node.cpu_cores) || 0,
    price: Number(node.price) || 0,
    currency: node.currency || "¥",
    billingCycle: Number(node.billing_cycle) || 0,
    pingLines,
    online: online ? formatUptime(stats.uptime) : "离线",
    expires: formatExpiry(node.expired_at),
    status: online ? "online" : "offline",
    uuid: node.uuid,
    updatedAt: stats?.updated_at ? new Date(stats.updated_at).toLocaleTimeString("zh-CN", { hour12: false }) : "--:--:--",
  };
}

function createPingLines(uuid, tasks, records, stats) {
  const statsByTask = new Map(stats.map((item) => [String(item.task_id), item]));
  return tasks
    .filter((task) => !Array.isArray(task.clients) || task.clients.includes(uuid))
    .map((task) => {
      const taskRecords = records
        .filter((record) => String(record.task_id) === String(task.id))
        .slice(0, 20)
        .reverse()
        .map((record) => ({ value: Number(record.value), time: record.time }));
      const stat = statsByTask.get(String(task.id));
      const latestValid = [...taskRecords].reverse().find((sample) => sample.value >= 0)?.value;
      return {
        id: task.id,
        name: task.name,
        value: Number(stat?.latest ?? latestValid),
        loss: Number(stat?.loss) || 0,
        samples: taskRecords,
      };
    });
}

function fixed(value) {
  return (Number(value) || 0).toFixed(2);
}

function formatBytes(value) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index > 1 ? 2 : 0)} ${units[index]}`;
}

function formatUptime(seconds) {
  const days = Math.floor((Number(seconds) || 0) / 86400);
  const hours = Math.floor(((Number(seconds) || 0) % 86400) / 3600);
  return days ? `${days} 天` : `${hours} 小时`;
}

function formatExpiry(value) {
  if (!value) return "--";
  const days = Math.ceil((Date.parse(value) - Date.now()) / 86400000);
  return days > 0 ? `${days} 天` : "已到期";
}
