import assert from "node:assert/strict";
import test from "node:test";
import { fetchNodePingData, fetchSnapshot } from "../src/services/komariApi.js";
import { fetchNodeHistory } from "../src/services/nodeHistory.js";

const nodeUuid = "node-1";

test("Komari 响应应完整映射为节点卡片数据", async (context) => {
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    const result = getRpcResult(request.method);
    return {
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: request.id, result }),
    };
  };

  const snapshot = await fetchSnapshot();
  const [node] = snapshot.nodes;

  assert.equal(snapshot.nodes.length, 1);
  assert.equal(node.name, "Los Angeles - BWH");
  assert.equal(node.group, "🇺🇸");
  assert.equal(node.status, "online");
  assert.equal(node.cpu, "12.50");
  assert.equal(node.memory, "25.00");
  assert.equal(node.memoryText, "256.00 MB / 1.00 GB");
  assert.equal(node.disk, "25.00");
  assert.equal(node.diskText, "5.00 GB / 20.00 GB");
  assert.equal(node.up, "2048");
  assert.equal(node.down, "4096");
  assert.equal(node.peakUp, 8192);
  assert.equal(node.peakDown, 16384);
  assert.equal(node.kernelVersion, "6.12.8+deb13-amd64");
  assert.equal(node.gpuName, "Virtio GPU");
  assert.equal(node.uptimeText, "2 天");
  assert.equal(node.connectionCount, 96);
  assert.equal(node.processCount, 187);
  assert.equal(node.trafficUpBytes, 30 * 1024 ** 3);
  assert.equal(node.trafficDownBytes, 20 * 1024 ** 3);
  assert.equal(node.pingLines.length, 1);
  assert.equal(node.pingLines[0].value, 42);
  assert.equal(node.pingLines[0].loss, 2.5);
  assert.deepEqual(node.pingLines[0].samples.map((sample) => sample.value), [55, 42]);
});

test("Ping 数据应在详情页按需加载并映射", async (context) => {
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    const result = getRpcResult(request.method);
    return { ok: true, json: async () => ({ jsonrpc: "2.0", id: request.id, result }) };
  };

  const lines = await fetchNodePingData(nodeUuid);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].value, 42);
  assert.equal(lines[0].loss, 2.5);
  assert.deepEqual(lines[0].samples.map((sample) => sample.value), [55, 42]);
});

test("历史数据服务应读取统一 records 结构", async (context) => {
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    const result = request.method === "public:getRecordsByUUID"
      ? { records: [{ time: "2026-09-01T01:00:00Z", cpu: 12.5 }] }
      : undefined;
    return {
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: request.id, result }),
    };
  };

  const records = await fetchNodeHistory(nodeUuid, 1);
  assert.deepEqual(records, [{ time: "2026-09-01T01:00:00Z", cpu: 12.5 }]);
});

function getRpcResult(method) {
  const results = {
    "public:getNodesInformation": [
      {
        uuid: nodeUuid,
        name: "Los Angeles - BWH",
        region: "🇺🇸",
        group: "",
        os: "Debian GNU/Linux 13",
        kernel_version: "6.12.8+deb13-amd64",
        arch: "amd64",
        virtualization: "kvm",
        gpu_name: "Virtio GPU",
        cpu_cores: 2,
        mem_total: 1024 ** 3,
        disk_total: 20 * 1024 ** 3,
        traffic_limit: 1000 * 1024 ** 3,
        price: 49.99,
        currency: "$",
        billing_cycle: 365,
        expired_at: "2099-01-01T00:00:00Z",
      },
    ],
    "public:getClientRecentRecords": [
      {
        network: { up: 8192, down: 16384 },
        updated_at: "2026-09-01T01:36:52Z",
      },
      {
        cpu: { usage: 12.5 },
        ram: { used: 256 * 1024 ** 2 },
        disk: { used: 5 * 1024 ** 3 },
        network: {
          up: 2048,
          down: 4096,
          totalUp: 30 * 1024 ** 3,
          totalDown: 20 * 1024 ** 3,
        },
        uptime: 172800,
        connections: { tcp: 95, udp: 1 },
        process: 187,
        updated_at: "2026-09-01T01:37:52Z",
      },
    ],
    "public:getPublicPingTasks": [
      { id: 1, name: "zj-yidong", clients: [nodeUuid] },
    ],
    "public:getPingRecords": {
      records: [
        { task_id: 1, value: 42, time: "2026-09-01T01:37:00Z" },
        { task_id: 1, value: 55, time: "2026-09-01T01:36:00Z" },
      ],
    },
    "public:getPingMetricStats": {
      stats: [{ task_id: 1, latest: 42, loss: 2.5 }],
    },
  };
  return results[method];
}
