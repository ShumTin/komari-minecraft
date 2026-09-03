const carriers = [
  { name: "电信", key: "telecomPingTaskName", pattern: /电信|telecom|dianxin/i },
  { name: "移动", key: "mobilePingTaskName", pattern: /移动|mobile|yidong/i },
  { name: "联通", key: "unicomPingTaskName", pattern: /联通|unicom|liantong/i },
];

function average(values) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : NaN;
}

export function getCardPingLines(lines, settings) {
  if (!settings.showCarrierPing) {
    if (!lines.length) return [];
    // 按采样时间合并，避免将不同任务的数组下标误当作同一时刻。
    const buckets = new Map();
    for (const line of lines) for (const sample of line.samples) {
      const values = buckets.get(sample.time) || [];
      values.push(sample.value);
      buckets.set(sample.time, values);
    }
    return [{ id: "average", name: "平均", value: average(lines.map((line) => line.value).filter((v) => v >= 0)),
      loss: average(lines.map((line) => line.loss)), samples: [...buckets].sort(([a], [b]) => Date.parse(a) - Date.parse(b)).slice(-200).map(([time, values]) => ({ time, value: values.some((v) => v >= 0) ? average(values.filter((v) => v >= 0)) : -1 })) }];
  }
  const explicit = carriers.some((carrier) => settings[carrier.key]);
  const selected = carriers.map((carrier) => lines.find((line) => explicit ? line.name === settings[carrier.key] : carrier.pattern.test(line.name)));
  const used = new Set(selected.filter(Boolean).map((line) => line.id));
  return carriers.map((carrier, index) => {
    const line = selected[index] || (!explicit && lines.find((item) => !used.has(item.id)));
    if (line) used.add(line.id);
    return { ...(line || { value: NaN, loss: NaN, samples: [] }), id: carrier.key, name: carrier.name };
  });
}
