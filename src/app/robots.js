import { getSiteUrl, isSeoEnabled } from "@/lib/site-url";

export default function robots() {
  // 公開スイッチが入るまでは、すべての検索エンジンに巡回を断る
  if (!isSeoEnabled()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/favorites"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
