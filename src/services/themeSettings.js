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
