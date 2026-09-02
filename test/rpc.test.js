import assert from "node:assert/strict";
import test from "node:test";
import {
  callRpc,
  getRpcTransportState,
  resetRpcClientForTests,
} from "../src/services/rpc.js";

class FakeWebSocket {
  static OPEN = 1;
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.sent = [];
    FakeWebSocket.instances.push(this);
  }

  send(message) {
    this.sent.push(JSON.parse(message));
  }

  close() {
    this.readyState = 3;
    this.onclose?.();
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  message(payload) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }
}

function setupBrowser() {
  globalThis.WebSocket = FakeWebSocket;
  globalThis.window = {
    location: { protocol: "https:", host: "monitor.example" },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  };
  FakeWebSocket.instances = [];
}

function cleanup() {
  resetRpcClientForTests();
  delete globalThis.WebSocket;
  delete globalThis.window;
  delete globalThis.fetch;
}

test("WebSocket 应发送 RPC 请求并解析响应", async () => {
  setupBrowser();
  try {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ result: null }) });
    await callRpc("rpc.init");
    const socket = FakeWebSocket.instances[0];
    socket.open();
    const pending = callRpc("public:getNodesInformation", { limit: 1 });

    assert.equal(getRpcTransportState(), "websocket");
    assert.deepEqual(socket.sent[0], {
      jsonrpc: "2.0",
      id: 2,
      method: "public:getNodesInformation",
      params: { limit: 1 },
    });

    socket.message({ jsonrpc: "2.0", id: 2, result: [{ uuid: "node-1" }] });
    assert.deepEqual(await pending, [{ uuid: "node-1" }]);
  } finally {
    cleanup();
  }
});

test("WebSocket 断开后应安排重连并恢复连接", async () => {
  setupBrowser();
  try {
    const timers = [];
    window.setTimeout = (callback, delay) => { timers.push({ callback, delay }); return timers.length; };
    window.clearTimeout = () => {};
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ result: null }) });
    await callRpc("rpc.init");
    const first = FakeWebSocket.instances[0];
    first.open();
    first.close();
    assert.equal(getRpcTransportState(), "http-fallback");
    assert.deepEqual(timers.at(-1).delay, 3000);
    timers.at(-1).callback();
    assert.equal(FakeWebSocket.instances.length, 2);
    FakeWebSocket.instances[1].open();
    assert.equal(getRpcTransportState(), "websocket");
  } finally {
    cleanup();
  }
});

test("WebSocket 不可用时应通过 HTTP fallback 请求", async () => {
  setupBrowser();
  try {
    let request;
    globalThis.fetch = async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        json: async () => ({ jsonrpc: "2.0", id: JSON.parse(options.body).id, result: { ok: true } }),
      };
    };
    await callRpc("rpc.init");
    FakeWebSocket.instances[0].close();
    const result = await callRpc("public:getNodesInformation");
    assert.deepEqual(result, { ok: true });
    assert.equal(request.url, "/api/rpc2");
    assert.equal(JSON.parse(request.options.body).method, "public:getNodesInformation");
  } finally {
    cleanup();
  }
});
