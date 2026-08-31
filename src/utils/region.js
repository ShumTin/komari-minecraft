const REGION_ALIASES = {
  china: "CN", 中国: "CN", cn: "CN", japan: "JP", 日本: "JP", jp: "JP",
  usa: "US", america: "US", 美国: "US", us: "US", "united states": "US",
  hongkong: "HK", "hong kong": "HK", 香港: "HK", hk: "HK", taiwan: "TW", 台湾: "TW", tw: "TW",
  singapore: "SG", 新加坡: "SG", sg: "SG", korea: "KR", "south korea": "KR", 韩国: "KR", kr: "KR",
  germany: "DE", 德国: "DE", de: "DE", france: "FR", 法国: "FR", fr: "FR", canada: "CA", 加拿大: "CA", ca: "CA",
  australia: "AU", 澳大利亚: "AU", au: "AU", netherlands: "NL", 荷兰: "NL", nl: "NL", russia: "RU", 俄罗斯: "RU", ru: "RU",
  india: "IN", 印度: "IN", in: "IN", brazil: "BR", 巴西: "BR", br: "BR",
};

const REGION_NAMES = { CN: "中国", JP: "日本", US: "美国", HK: "香港", TW: "台湾", SG: "新加坡", KR: "韩国", DE: "德国", FR: "法国", CA: "加拿大", AU: "澳大利亚", NL: "荷兰", RU: "俄罗斯", IN: "印度", BR: "巴西" };

function getRegionCode(region) {
  const value = String(region || "").trim();
  if (!value) return "";
  const alias = REGION_ALIASES[value.toLowerCase()];
  if (alias) return alias;
  const emoji = Array.from(value).filter((char) => {
    const point = char.codePointAt(0);
    return point >= 0x1f1e6 && point <= 0x1f1ff;
  });
  if (emoji.length === 2) return emoji.map((char) => String.fromCharCode(char.codePointAt(0) - 0x1f1e6 + 65)).join("");
  return /^[a-z]{2}$/i.test(value) ? value.toUpperCase() : "";
}

export function hasRegion(region) { return Boolean(String(region || "").trim()); }
export function getFlagImage(region) { const code = getRegionCode(region); return code ? `/assets/flags/${code}.svg` : null; }
export function getRegionEmoji(region) {
  const code = getRegionCode(region);
  if (!code) return "";
  return String.fromCodePoint(...code.split("").map((char) => 0x1f1e6 + char.charCodeAt(0) - 65));
}
export function getRegionDisplayName(region) { const code = getRegionCode(region); return REGION_NAMES[code] || code || String(region || "").trim(); }
