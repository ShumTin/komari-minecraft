import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";
import { createSSRApp } from "vue";
import { renderToString } from "@vue/server-renderer";
import { fetchThemeSettings, normalizeSettings, resolveAppearance, syncAdminAppearance } from "../src/services/themeSettings.js";
import { resetRpcClientForTests } from "../src/services/rpc.js";
import { calculateAssets, fetchExchangeRates } from "../src/services/assets.js";
import { getCardPingLines } from "../src/utils/cardPing.js";

test("后台配置从公开 RPC 读取，非法值回退且 false 不被默认值覆盖", async (t) => {
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(JSON.parse(options.body).method, "public:getPublicSettings");
    return { ok: true, json: async () => ({ result: { theme_settings: { showAssets: false, showOnline: "false", defaultAppearance: "dark", assetCurrency: "USD", backgroundImage: "old.jpg" } } }) };
  });
  t.after(resetRpcClientForTests);
  const settings = await fetchThemeSettings();
  assert.equal(settings.showAssets, false);
  assert.equal(settings.showOnline, true);
  // 升级后忽略后台残留的旧外观配置。
  for (const key of ["defaultAppearance", "assetCurrency", "backgroundImage"]) assert.equal(key in settings, false);
});

test("首页主题选择不受系统变化影响，未选择时跟随系统", () => {
  for (const mode of ["light", "dark", "mc"]) {
    assert.equal(resolveAppearance(mode, true), mode);
    assert.equal(resolveAppearance(mode, false), mode);
  }
  assert.equal(resolveAppearance(null, true), "dark");
  assert.equal(resolveAppearance(null, false), "light");
  assert.equal(resolveAppearance("invalid", false), "light");
});

test("后台使用首页明暗映射，MC 偏好不会写进后台或被覆盖", (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map([["komari-appearance", "mc"]]);
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { setItem: (key, value) => values.set(key, value) } });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  });
  for (const [home, admin] of [["dark", "dark"], ["mc", "light"], ["light", "light"]]) {
    syncAdminAppearance(home);
    assert.equal(values.get("appearance"), admin);
    assert.equal(values.get("komari-appearance"), "mc");
  }
  values.set("appearance", "dark");
  syncAdminAppearance("mc");
  assert.equal(values.get("appearance"), "light");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new Error("存储被禁用"); } });
  assert.doesNotThrow(() => syncAdminAppearance("dark"));
});

const lines = [
  { id: 1, name: "fallback", value: 20, loss: 0, samples: [{ time: "2026-09-03T00:00:00Z", value: 20 }] },
  { id: 2, name: "zj-dianxin", value: 60, loss: 50, samples: [{ time: "2026-09-03T00:00:00Z", value: -1 }] },
  { id: 3, name: "联通", value: 40, loss: 0, samples: [] },
];

test("三网优先保留名称匹配任务，剩余任务不重复分配，指定名称不会错误回退", () => {
  const settings = normalizeSettings({ showCarrierPing: true });
  assert.deepEqual(getCardPingLines(lines, settings).map((line) => line.value), [60, 20, 40]);
  settings.telecomPingTaskName = "不存在";
  assert.ok(getCardPingLines(lines, settings).every((line) => Number.isNaN(line.value)));
  settings.telecomPingTaskName = "zj-dianxin";
  assert.equal(getCardPingLines(lines, settings)[0].value, 60);
});

test("平均延迟忽略超时值，时间桶不会混入其他时刻，空任务不会显示零丢包", () => {
  const [average] = getCardPingLines(lines, normalizeSettings());
  assert.equal(average.value, 40);
  assert.equal(average.loss, 50 / 3);
  assert.equal(average.samples[0].value, 20);
  assert.deepEqual(getCardPingLines([], normalizeSettings()), []);
  assert.ok(getCardPingLines([], normalizeSettings({ showCarrierPing: true })).every((line) => Number.isNaN(line.loss)));
});

test("不同币种先折算再计算剩余价值，缺失汇率不能冒充完整估值", () => {
  const now = Date.parse("2026-09-03T00:00:00Z");
  const nodes = [
    { price: 10, currency: "$", billingCycle: 30, expiredAt: new Date(now + 15 * 86400000).toISOString() },
    { price: 70, currency: "¥", billingCycle: -1 },
  ];
  assert.deepEqual(calculateAssets(nodes, { USD: 1 / 7, CNY: 1 }, now), { value: "CNY 105.00", forecast: "总价值 CNY 140.00" });
  assert.equal(calculateAssets(nodes, null, now).value, "暂无完整估值");
  assert.equal(calculateAssets([nodes[1]], null, now).value, "CNY 70.00");
  assert.equal(calculateAssets([{ ...nodes[0], expiredAt: "2020-01-01" }], { USD: 1 / 7 }, now).value, "CNY 0.00");
});

test("汇率失败明确报错，成功结果缓存避免每次节点刷新重复请求", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => ({ ok: false }));
  await assert.rejects(fetchExchangeRates(), /汇率请求失败/);
  fetch.mock.mockImplementation(async () => ({ ok: true, json: async () => ({ result: "success", base_code: "CNY", rates: { CNY: 1, USD: 0.14 } }) }));
  await fetchExchangeRates();
  await fetchExchangeRates();
  assert.equal(fetch.mock.callCount(), 2);
});

test("总览独立开关只渲染所选卡片，关闭全部时不留空统计条", async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  try {
    const { default: Overview } = await server.ssrLoadModule("/src/components/OverviewCards.vue");
    const settings = normalizeSettings({ showOnline: false, showAssets: false, showTraffic: false });
    const props = { settings, overview: { bandwidth: { value: "1", unit: "MB/s" } } };
    const html = await renderToString(createSSRApp(Overview, props));
    assert.equal((html.match(/class="overview-card"/g) || []).length, 1);
    assert.match(html, /实时速率/);
    settings.showSpeed = false;
    assert.doesNotMatch(await renderToString(createSSRApp(Overview, props)), /overview-grid/);
    settings.showStatsBar = false;
    settings.showSpeed = true;
    assert.doesNotMatch(await renderToString(createSSRApp(Overview, props)), /overview-grid/);
  } finally { await server.close(); }
});
