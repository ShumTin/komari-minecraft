import { callRpc } from "./rpc.js";
import { formatExpiry } from "../utils/format.js";

let latestStatsCapability = null;
const pingTasksCache = { value: null, expiresAt: 0, pending: null };
const pingRecordsCache = new Map();
const pingStatsCache = new Map();

export function supportsBatchLatestStats() {
  return latestStatsCapability !== false;
}

export async function fetchNodes() {
  const result = await callRpc("public:getNodesInformation");
  return Array.isArray(result) ? result : [];
}

export async function fetchRecentStats(uuid) {
  const result = await callRpc("public:getClientRecentRecords", { uuid });
  return Array.isArray(result) ? result : [];
}

/** 优先使用 Komari 批量最新状态接口，旧版本自动降级到逐节点记录接口。 */
export async function fetchLatestStats(uuids) {
  if (!uuids.length) return new Map();
  if (latestStatsCapability !== false) try {
    const result = await callRpc("common:getNodesLatestStatus", { uuids });
    const records = result?.records && typeof result.records === "object" ? result.records : result;
    if (!records || typeof records !== "object" || Array.isArray(records)) throw new Error("批量状态响应格式无效");
    latestStatsCapability = true;
    return new Map(uuids.map((uuid) => [uuid, normalizeLatestRecord(records[uuid])]));
  } catch (error) {
    latestStatsCapability = false;
    console.warn("[Komari API] 批量状态不可用，后续刷新降级为逐节点请求", error);
  }
  const results = await Promise.allSettled(uuids.map((uuid) => fetchRecentStats(uuid)));
  return new Map(uuids.map((uuid, index) => [uuid, results[index].status === "fulfilled" ? results[index].value : []]));
}

export async function updateNodeRealtime(node, records) {
  const stats = records[records.length - 1];
  if (!stats) return node.latestStats == null && node.status === "offline" ? node : { ...node, status: "offline", online: "离线" };
  // 与 Junimo 的 Store 一样，最新样本未变化时保持对象引用，避免无意义的页面更新。
  if (stats.updated_at && node.latestStats?.updated_at === stats.updated_at) return node;
  const memoryUsed = Number(stats.ram?.used) || 0;
  const memoryTotal = Number(stats.ram?.total) || 0;
  const diskUsed = Number(stats.disk?.used) || 0;
  const diskTotal = Number(stats.disk?.total) || 0;
  const tcpConnections = optionalNumber(stats.connections?.tcp);
  const udpConnections = optionalNumber(stats.connections?.udp);
  return {
    ...node,
    latestStats: stats,
    cpu: fixed(stats.cpu?.usage),
    memory: fixed(memoryTotal ? (memoryUsed / memoryTotal) * 100 : 0),
    memoryText: `${formatBytes(memoryUsed)} / ${formatBytes(memoryTotal)}`,
    disk: fixed(diskTotal ? (diskUsed / diskTotal) * 100 : 0),
    diskText: `${formatBytes(diskUsed)} / ${formatBytes(diskTotal)}`,
    up: String(stats.network?.up || 0),
    down: String(stats.network?.down || 0),
    out: formatBytes(Number(stats.network?.totalUp) || 0),
    in: formatBytes(Number(stats.network?.totalDown) || 0),
    trafficUpBytes: Number(stats.network?.totalUp) || 0,
    trafficDownBytes: Number(stats.network?.totalDown) || 0,
    uptimeText: formatDetailedUptime(stats.uptime),
    connectionCount: tcpConnections === null && udpConnections === null ? null : (tcpConnections || 0) + (udpConnections || 0),
    processCount: optionalNumber(stats.process),
    online: formatUptime(stats.uptime),
    status: "online",
    updatedAt: stats.updated_at ? new Date(stats.updated_at).toLocaleTimeString("zh-CN", { hour12: false }) : node.updatedAt,
  };
}

export async function fetchPingTasks(options = {}) {
  if (!options.signal && pingTasksCache.value && pingTasksCache.expiresAt > Date.now()) return pingTasksCache.value;
  if (!options.signal && pingTasksCache.pending) return pingTasksCache.pending;
  if (!options.signal) {
    pingTasksCache.pending = fetchPingTasksUncached(options).then((value) => {
      pingTasksCache.value = value;
      pingTasksCache.expiresAt = Date.now() + 5 * 60 * 1000;
      return value;
    }).finally(() => { pingTasksCache.pending = null; });
    return pingTasksCache.pending;
  }
  return fetchPingTasksUncached(options);
}

async function fetchPingTasksUncached(options) {
  const result = await callRpc("public:getPublicPingTasks", {}, options);
  return Array.isArray(result) ? result : [];
}

export async function fetchPingRecords(uuid, hours = 1, options = {}) {
  const key = `${uuid}:${hours}`;
  const cached = pingRecordsCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  let value;
  try {
    // 与 Junimo 一致，优先使用数字 hours 的通用记录接口，避免旧 public 接口退化到 1 小时默认值。
    const result = await callRpc("common:getRecords", { uuid, hours, type: "ping", maxCount: Math.min(2000, Math.max(60, hours * 60)) }, options);
    value = Array.isArray(result?.records) ? result.records : Array.isArray(result) ? result : null;
    if (!value) throw new Error("通用 Ping 记录响应格式无效");
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    const result = await callRpc("public:getPingRecords", { uuid, hours }, options);
    value = Array.isArray(result?.records) ? result.records : [];
  }
  pingRecordsCache.set(key, { value, expiresAt: Date.now() + 30 * 1000 });
  return value;
}

export async function fetchPingStats(uuid, hours = 1, options = {}) {
  const key = `${uuid}:${hours}`;
  const cached = pingStatsCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const result = await callRpc("public:getPingMetricStats", {
    entity_id: uuid,
    hours,
    max_points: 100,
  }, options);
  const value = Array.isArray(result?.stats) ? result.stats : [];
  pingStatsCache.set(key, { value, expiresAt: Date.now() + 30 * 1000 });
  return value;
}

export async function fetchSnapshot() {
  const [nodesResult, tasksResult] = await Promise.allSettled([fetchNodes(), fetchPingTasks()]);
  if (nodesResult.status === "rejected") throw nodesResult.reason;
  const apiNodes = nodesResult.value;
  const pingTasks = tasksResult.status === "fulfilled" ? tasksResult.value : [];
  const latestStats = await fetchLatestStats(apiNodes.map((node) => node.uuid));
  const results = await Promise.allSettled(apiNodes.map(async (node) => {
    const records = latestStats.get(node.uuid) || [];
    const [pingRecordsResult, pingStatsResult] = await Promise.allSettled([
      fetchPingRecords(node.uuid),
      fetchPingStats(node.uuid),
    ]);
    const pingRecords = pingRecordsResult.status === "fulfilled" ? pingRecordsResult.value : [];
    const pingStats = pingStatsResult.status === "fulfilled" ? pingStatsResult.value : [];
    return toNodeModel(node, records, createPingLines(node.uuid, pingTasks, pingRecords, pingStats));
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

function normalizeLatestRecord(record) {
  if (!record) return [];
  if (Array.isArray(record)) return record;
  if (record.cpu && typeof record.cpu === "object") return [record];
  const udpConnections = Number(record.connections_udp) || 0;
  const totalConnections = Number(record.connections) || 0;
  return [{
    cpu: { usage: Number(record.cpu) || 0 },
    ram: { used: Number(record.ram) || 0, total: Number(record.ram_total) || 0 },
    swap: { used: Number(record.swap) || 0, total: Number(record.swap_total) || 0 },
    disk: { used: Number(record.disk) || 0, total: Number(record.disk_total) || 0 },
    network: {
      up: Number(record.net_out) || 0,
      down: Number(record.net_in) || 0,
      totalUp: Number(record.net_total_up) || 0,
      totalDown: Number(record.net_total_down) || 0,
    },
    connections: {
      tcp: Number(record.connections_tcp) || Math.max(0, totalConnections - udpConnections),
      udp: udpConnections,
    },
    process: Number(record.process) || 0,
    uptime: Number(record.uptime) || 0,
    updated_at: record.updated_at || record.time,
  }];
}

/** 详情页按需加载 Ping 数据，避免首页为每个节点预取三组请求。 */
export async function fetchNodePingData(uuid, hours = 1, signal) {
  const options = signal ? { signal } : {};
  const [tasksResult, recordsResult, statsResult] = await Promise.allSettled([
    fetchPingTasks(options),
    fetchPingRecords(uuid, hours, options),
    fetchPingStats(uuid, hours, options),
  ]);
  return createPingLines(
    uuid,
    tasksResult.status === "fulfilled" ? tasksResult.value : [],
    recordsResult.status === "fulfilled" ? recordsResult.value : [],
    statsResult.status === "fulfilled" ? statsResult.value : [],
  );
}

function toNodeModel(node, records, pingLines = []) {
  const stats = records[records.length - 1];
  const peakUpRecord = getPeakNetworkRecord(records, "up");
  const peakDownRecord = getPeakNetworkRecord(records, "down");
  const memoryTotal = Number(node.mem_total) || Number(stats?.ram?.total) || 0;
  const diskTotal = Number(node.disk_total) || Number(stats?.disk?.total) || 0;
  const memoryUsed = Number(stats?.ram?.used) || 0;
  const diskUsed = Number(stats?.disk?.used) || 0;
  const online = Boolean(stats);
  const tcpConnections = optionalNumber(stats?.connections?.tcp);
  const udpConnections = optionalNumber(stats?.connections?.udp);

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
    peakUp: peakUpRecord ? Number(peakUpRecord.network.up) : null,
    peakUpAt: peakUpRecord?.updated_at || peakUpRecord?.time || null,
    peakDown: peakDownRecord ? Number(peakDownRecord.network.down) : null,
    peakDownAt: peakDownRecord?.updated_at || peakDownRecord?.time || null,
    out: formatBytes(Number(stats?.network?.totalUp) || 0),
    in: formatBytes(Number(stats?.network?.totalDown) || 0),
    trafficUpBytes: Number(stats?.network?.totalUp) || 0,
    trafficDownBytes: Number(stats?.network?.totalDown) || 0,
    trafficLimitBytes: Number(node.traffic_limit) || 0,
    cores: Number(node.cpu_cores) || 0,
    price: Number(node.price) || 0,
    currency: node.currency || "¥",
    billingCycle: Number(node.billing_cycle) || 0,
    kernelVersion: node.kernel_version || null,
    architecture: node.arch || null,
    virtualization: node.virtualization || null,
    gpuName: node.gpu_name || null,
    publicRemark: node.public_remark || null,
    uptimeText: stats ? formatDetailedUptime(stats.uptime) : null,
    connectionCount:
      tcpConnections === null && udpConnections === null
        ? null
        : (tcpConnections || 0) + (udpConnections || 0),
    processCount: optionalNumber(stats?.process),
    pingLines,
    online: online ? formatUptime(stats.uptime) : "离线",
    expiredAt: node.expired_at || null,
    expires: formatExpiry(node.expired_at),
    status: online ? "online" : "offline",
    uuid: node.uuid,
    latestStats: stats || null,
    updatedAt: stats?.updated_at ? new Date(stats.updated_at).toLocaleTimeString("zh-CN", { hour12: false }) : "--:--:--",
  };
}

function getPeakNetworkRecord(records, direction) {
  return records.reduce((peak, record) => {
    const value = optionalNumber(record?.network?.[direction]);
    if (value === null) return peak;
    if (!peak || value > Number(peak.network[direction])) return record;
    return peak;
  }, null);
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function createPingLines(uuid, tasks, records, stats) {
  const statsByTask = new Map(stats.map((item) => [String(item.task_id), item]));
  return tasks
    .filter((task) => !Array.isArray(task.clients) || task.clients.includes(uuid))
    .map((task) => {
      const taskRecords = records
        .filter((record) => String(record.task_id) === String(task.id))
        .map((record) => ({ value: Number(record.value), time: record.time }));
      taskRecords.sort((left, right) => Date.parse(left.time) - Date.parse(right.time));
      const recentTaskRecords = taskRecords.slice(-200);
      const stat = statsByTask.get(String(task.id));
      const latestValid = [...taskRecords].reverse().find((sample) => sample.value >= 0)?.value;
      return {
        id: task.id,
        name: task.name,
        value: Number(stat?.latest ?? latestValid),
        loss: stat?.loss != null ? Number(stat.loss) : taskRecords.length ? taskRecords.filter((sample) => sample.value < 0).length / taskRecords.length * 100 : NaN,
        samples: recentTaskRecords,
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

function formatDetailedUptime(seconds) {
  const totalSeconds = Number(seconds);
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return null;
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts = [];
  if (days) parts.push(`${days} 天`);
  if (hours) parts.push(`${hours} 小时`);
  if (minutes || parts.length === 0) parts.push(`${minutes} 分钟`);
  return parts.join(" ");
}
