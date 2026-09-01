import { callRpc } from "./rpc.js";

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_RECORDS = 20000;

class NodeHistoryService {
  constructor() {
    this.cache = new Map();
    this.pending = new Map();
    this.source = null;
  }

  fetch(uuid, hours = 1, signal) {
    const safeHours = Math.max(1, Number(hours) || 1);
    const key = `${uuid}:${safeHours}`;
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
      return Promise.resolve(cached.records);
    }
    if (this.pending.has(key)) return this.pending.get(key);

    const request = this.request(uuid, safeHours, signal)
      .then((records) => {
        this.cache.set(key, { createdAt: Date.now(), records });
        return records;
      })
      .finally(() => this.pending.delete(key));
    this.pending.set(key, request);
    return request;
  }

  async request(uuid, hours, signal) {
    if (this.source !== "common:getRecords") {
      try {
        const payload = await callRpc("public:getRecordsByUUID", { uuid, hours: String(hours) }, { signal });
        this.source = "public:getRecordsByUUID";
        return normalizeRecords(payload);
      } catch (error) {
        if (!isUnsupportedMethod(error)) throw error;
      }
    }

    const payload = await callRpc("common:getRecords", {
      uuid,
      hours,
      type: "load",
      maxCount: MAX_RECORDS,
    }, { signal });
    this.source = "common:getRecords";
    return normalizeRecords(payload);
  }
}

function normalizeRecords(payload) {
  const records = Array.isArray(payload) ? payload : payload?.records;
  if (!Array.isArray(records)) return [];
  return records.filter((record) => record && typeof record === "object");
}

function isUnsupportedMethod(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /method|not found|unknown|unsupported|不存在|不支持/i.test(message);
}

export const nodeHistoryService = new NodeHistoryService();

export function fetchNodeHistory(uuid, hours = 1, signal) {
  return nodeHistoryService.fetch(uuid, hours, signal);
}
