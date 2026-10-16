// ASP（アフィリエイト提携先）ごとの送客ルール。
//
// 新しいASPを追加・有効化するときは、コードを変えずに環境変数だけで行えます。
//   ASP_<CODE>_ENABLED=true            送客を有効にする（CODEは大文字。例: ASP_FANZA_ENABLED）
//   ASP_<CODE>_HOSTS=al.dmm.co.jp,...  送客を許可する公式ドメイン（カンマ区切り）
//
// 既定値：MGSは有効、FANZAはアフィリエイトID発行後に ASP_FANZA_ENABLED=true で有効化。
// 無効なASPの作品は、購入ボタンが「準備中」表示のままになります（画面は壊れません）。

const DEFAULTS = {
  mgs: { enabled: true, hosts: ["www.mgstage.com"] },
  fanza: { enabled: false, hosts: ["al.fanza.co.jp", "al.dmm.co.jp"] },
};

function parseHosts(value) {
  return String(value ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

export function getAspRule(aspCode) {
  const code = String(aspCode ?? "").toLowerCase();
  if (!/^[a-z0-9_-]{1,30}$/.test(code)) return { enabled: false, hosts: [] };

  const key = code.toUpperCase().replace(/-/g, "_");
  const base = DEFAULTS[code] ?? { enabled: false, hosts: [] };

  const enabledEnv = process.env[`ASP_${key}_ENABLED`];
  const hostsEnv = parseHosts(process.env[`ASP_${key}_HOSTS`]);

  return {
    enabled:
      enabledEnv === undefined || enabledEnv === ""
        ? base.enabled
        : enabledEnv === "true",
    hosts: hostsEnv.length > 0 ? hostsEnv : base.hosts,
  };
}

export function isAspEnabled(aspCode) {
  return getAspRule(aspCode).enabled;
}
