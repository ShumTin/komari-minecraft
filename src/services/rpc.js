let requestId = 0;
let client;

class Rpc2Client {
  constructor() { this.socket = null; this.pending = new Map(); this.timer = null; this.heartbeat = null; this.closed = false; this.connecting = false; this.connect(); }
  connect() {
    if (this.closed || this.connecting || typeof WebSocket === "undefined" || typeof window === "undefined" || this.socket?.readyState === WebSocket.OPEN) return;
    this.connecting = true;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/api/rpc2`);
    this.socket = socket;
    socket.onopen = () => { this.connecting = false; this.startHeartbeat(); };
    socket.onmessage = (event) => this.handleMessage(event.data);
    socket.onerror = () => socket.close();
    socket.onclose = () => { if (this.socket !== socket) return; this.connecting = false; this.socket = null; this.stopHeartbeat(); if (!this.closed) this.scheduleReconnect(); };
  }
  async call(method, params, options) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      try { return await this.callWebSocket(method, params, options); } catch (error) { if (error?.name === "AbortError") throw error; }
    }
    return callHttp(method, params, options);
  }
  callWebSocket(method, params, options = {}) {
    const id = ++requestId;
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => { this.pending.delete(id); reject(new Error(`RPC 请求超时：${method}`)); }, options.timeout || 30000);
      const abort = () => { window.clearTimeout(timeout); this.pending.delete(id); reject(options.signal.reason || new DOMException("Aborted", "AbortError")); };
      options.signal?.addEventListener("abort", abort, { once: true });
      this.pending.set(id, { resolve: (value) => { window.clearTimeout(timeout); options.signal?.removeEventListener("abort", abort); resolve(value); }, reject: (error) => { window.clearTimeout(timeout); options.signal?.removeEventListener("abort", abort); reject(error); } });
      try { this.socket.send(JSON.stringify({ jsonrpc: "2.0", id, method, params })); } catch (error) { this.pending.delete(id); reject(error); }
    });
  }
  handleMessage(raw) { try { const payload = JSON.parse(String(raw)); const request = this.pending.get(payload.id); if (!request) return; this.pending.delete(payload.id); if (payload.error) request.reject(new Error(payload.error.message || "RPC 调用失败")); else request.resolve(payload.result); } catch {} }
  startHeartbeat() { this.stopHeartbeat(); this.heartbeat = window.setInterval(() => { if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ jsonrpc: "2.0", method: "rpc.ping", params: { timestamp: Date.now() } })); }, 15000); }
  stopHeartbeat() { if (this.heartbeat) window.clearInterval(this.heartbeat); this.heartbeat = null; }
  scheduleReconnect() { if (this.timer) return; this.timer = window.setTimeout(() => { this.timer = null; this.connect(); }, 3000); }
  close() { this.closed = true; this.stopHeartbeat(); if (this.timer) window.clearTimeout(this.timer); this.socket?.close(); }
}

async function callHttp(method, params, options = {}) {
  const response = await fetch("/api/rpc2", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, cache: "no-store", signal: options.signal, body: JSON.stringify({ jsonrpc: "2.0", id: ++requestId, method, params }) });
  if (!response.ok) throw new Error(`RPC 请求失败：${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error.message || "RPC 调用失败");
  if (!("result" in payload)) throw new Error("RPC 返回缺少结果");
  return payload.result;
}

export function callRpc(method, params = {}, options = {}) {
  client ||= new Rpc2Client();
  return client.call(method, params, options);
}

export function getRpcTransportState() {
  if (!client) return "disconnected";
  if (client.socket?.readyState === WebSocket.OPEN) return "websocket";
  if (client.connecting) return "connecting";
  return "http-fallback";
}

// 仅供自动化测试隔离单例状态，生产代码不应调用。
export function resetRpcClientForTests() {
  client?.close();
  client = undefined;
  requestId = 0;
}
