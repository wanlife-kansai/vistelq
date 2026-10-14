import { getAspRule } from "@/lib/asp-config";

// 有効化したASPの公式ドメイン(https)だけを送客先として許可する
export function isAllowedAffiliateUrl(aspCode, value) {
  const rule = getAspRule(aspCode);
  if (!rule.enabled || rule.hosts.length === 0 || typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      rule.hosts.includes(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

// 計測つきの送客URL（/api/out 経由）
export function buildOutUrl(workId, aspCode) {
  return `/api/out?workId=${encodeURIComponent(workId)}&asp=${encodeURIComponent(
    String(aspCode).toLowerCase()
  )}`;
}
