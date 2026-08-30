export const overview = {
  online: { current: 18, total: 22, rate: "81.82%" },
  assets: { value: "¥270.12", forecast: "本月预计 ¥32.00" },
  traffic: { today: "86.4", unit: "GB", total: "总流量 1.007 TB" },
  bandwidth: { value: "1.08", unit: "MB/s", upload: "555 KB/s", download: "549 KB/s" },
};

export const groups = [
  { code: "JP", flag: "🇯🇵", count: 1 },
  { code: "US", flag: "🇺🇸", count: 1 },
];

export const nodes = [
  { name: "Los Angeles - BWH", group: "US", flag: "🇺🇸", os: "Debian / amd64", cpu: "0.40", memory: "28.72", memoryText: "296 MB / 1.01 GB", disk: "11.4", diskText: "2.23 GB / 19.6 GB", up: "252", down: "370", upUnit: "B/s", downUnit: "B/s", out: "16.3 GB", in: "4.62 GB", online: "4 小时", expires: "268 天", color: "green" },
  { name: "Tokyo - AWS Lightsail", group: "JP", flag: "🇯🇵", os: "Ubuntu / amd64", cpu: "0.40", memory: "42.26", memoryText: "187 MB / 442 MB", disk: "6.6", diskText: "1.28 GB / 19.6 GB", up: "555", down: "549", upUnit: "KB/s", downUnit: "KB/s", out: "4.25 GB", in: "4.21 GB", online: "9 天", expires: "20 天", color: "orange" },
];
