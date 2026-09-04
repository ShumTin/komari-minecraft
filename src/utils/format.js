const BYTE_UNITS = ["B/s", "KB/s", "MB/s", "GB/s", "TB/s"];
const LONG_TERM_EXPIRE_DAYS = 36500;

export function formatByteRate(value, unit = "B/s") {
  const bytes = toBytes(value, unit);
  if (!Number.isFinite(bytes) || bytes <= 0) return { value: "0", unit: "B/s" };

  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1);
  const converted = bytes / 1024 ** index;
  const decimals = converted >= 100 ? 0 : converted >= 10 ? 1 : 2;
  return { value: converted.toFixed(decimals), unit: BYTE_UNITS[index] };
}

export function formatExpiry(value, now = Date.now()) {
  if (!value) return "--";
  const days = Math.ceil((Date.parse(value) - now) / 86400000);
  if (!Number.isFinite(days)) return "--";
  if (days > LONG_TERM_EXPIRE_DAYS) return "长期";
  return days > 0 ? `${days} 天` : "已到期";
}

export function formatCost(node) {
  const price = Number(node.price);
  if (!Number.isFinite(price) || price <= 0) return "免费";
  const cycle = Number(node.billingCycle) === 30 ? "月" : "年";
  return `${node.currency || "$"}${price.toFixed(2)}/${cycle}`;
}

function toBytes(value, unit) {
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount)) return 0;
  const normalizedUnit = String(unit || "B/s").toUpperCase().replace("/S", "");
  const index = Math.max(0, BYTE_UNITS.findIndex((item) => item.startsWith(normalizedUnit)));
  return amount * 1024 ** index;
}
