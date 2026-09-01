let requestId = 0;

export async function callRpc(method, params = {}) {
  const response = await fetch("/api/rpc2", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({ jsonrpc: "2.0", id: ++requestId, method, params }),
  });

  if (!response.ok) throw new Error(`RPC 请求失败：${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error.message || "RPC 调用失败");
  if (!("result" in payload)) throw new Error("RPC 返回缺少结果");
  return payload.result;
}
