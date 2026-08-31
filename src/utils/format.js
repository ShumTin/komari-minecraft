const BYTE_UNITS = ["B/s", "KB/s", "MB/s", "GB/s", "TB/s"];

export function formatByteRate(value, unit = "B/s") {
  const bytes = toBytes(value, unit);
  if (!Number.isFinite(bytes) || bytes <= 0) return { value: "0", unit: "B/s" };

  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1);
  const converted = bytes / 1024 ** index;
  const decimals = converted >= 100 ? 0 : converted >= 10 ? 1 : 2;
  return { value: converted.toFixed(decimals), unit: BYTE_UNITS[index] };
}

function toBytes(value, unit) {
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount)) return 0;
  const normalizedUnit = String(unit || "B/s").toUpperCase().replace("/S", "");
  const index = Math.max(0, BYTE_UNITS.findIndex((item) => item.startsWith(normalizedUnit)));
  return amount * 1024 ** index;
}
