// サイトのURLと、検索エンジンへの公開スイッチ。
//   NEXT_PUBLIC_SITE_URL=https://（本番のドメイン）   未設定ならVercelの本番URLを使います
//   NEXT_PUBLIC_SEO_ENABLED=true                      true にするまでは検索エンジンに載せません（noindex）

export function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");

  return raw.replace(/\/+$/, "");
}

export function isSeoEnabled() {
  return process.env.NEXT_PUBLIC_SEO_ENABLED === "true";
}

export function absoluteUrl(path = "/") {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
