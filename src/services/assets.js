const aliases = { "¥": "CNY", "￥": "CNY", RMB: "CNY", "$": "USD", "HK$": "HKD", "€": "EUR", "£": "GBP", "₽": "RUB", "₣": "CHF", "₹": "INR", "₫": "VND", "฿": "THB", "CA$": "CAD", "C$": "CAD" };
let cachedRates;
let expiresAt = 0;

export async function fetchExchangeRates() {
  if (Date.now() < expiresAt) return cachedRates;
  const response = await fetch("https://open.er-api.com/v6/latest/CNY", { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error("汇率请求失败");
  const data = await response.json();
  if (data.result !== "success" || data.base_code !== "CNY" || data.rates?.CNY !== 1) throw new Error("汇率数据无效");
  cachedRates = data.rates;
  expiresAt = Date.now() + 86400000;
  return cachedRates;
}

/** @returns {{value: string, forecast: string}} */
export function calculateAssets(nodes, rates, now = Date.now()) {
  let total = 0;
  let remaining = 0;
  let missing = 0;
  let unknownExpiry = 0;
  for (const node of nodes) {
    if (!(node.price > 0)) continue;
    const raw = String(node.currency).trim().toUpperCase();
    const source = aliases[raw] || raw;
    const ratio = source === "CNY" ? 1 : 1 / rates?.[source];
    if (!Number.isFinite(ratio) || ratio <= 0) { missing++; continue; }
    const value = node.price * ratio;
    total += value;
    const expiry = Date.parse(node.expiredAt);
    if (node.billingCycle === -1) remaining += value;
    else if (!Number.isFinite(expiry) || node.billingCycle <= 0) unknownExpiry++;
    else remaining += value * Math.max(0, Math.min(1, (expiry - now) / (node.billingCycle * 86400000)));
  }
  const format = (value) => `CNY ${value.toFixed(2)}`;
  return { value: missing || unknownExpiry ? "暂无完整估值" : format(remaining),
    forecast: missing ? `${missing} 个节点缺少可用币种或汇率` : `总价值 ${format(total)}${unknownExpiry ? ` · ${unknownExpiry} 个节点计费信息不完整` : ""}` };
}
