import manifest from "../../komari-theme.json" with { type: "json" };
import { callRpc } from "./rpc.js";

/** @typedef {Record<string, boolean|string>} ThemeSettings */
const fields = manifest.configuration.data.filter((field) => field.key);

/** @returns {ThemeSettings} */
export function normalizeSettings(raw = {}) {
  return Object.fromEntries(fields.map((field) => {
    const value = raw?.[field.key];
    const valid = typeof value === typeof field.default;
    return [field.key, valid ? (typeof value === "string" ? value.trim() : value) : field.default];
  }));
}

export async function fetchThemeSettings() {
  const info = await callRpc("public:getPublicSettings");
  return normalizeSettings(info?.theme_settings);
}

export function resolveAppearance(local, systemDark) {
  if (["light", "dark", "mc"].includes(local)) return local;
  return systemDark ? "dark" : "light";
}

export function syncAdminAppearance(appearance) {
  try {
    // 后台只支持明暗模式；MC 仅保存在首页的独立偏好中。
    localStorage.setItem("appearance", appearance === "dark" ? "dark" : "light");
  } catch {
    // 存储不可用时，不影响首页主题切换及后台入口。
  }
}
