"use client";

import { useEffect, useRef } from "react";

// MGS公式のアフィリエイトウィジェット（作品画像・購入導線）。
// 動画販売サイト(Projects)の MgsAffiliate と同じ仕組みです。
const AFFILIATE_CODE =
  process.env.NEXT_PUBLIC_MGS_AFFILIATE_CODE || "RR5JSR5RH73YQLBR7TZ34QNHG7";

export default function MgsWidget({ productId, title, mode = "mix" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !productId) return;

    const targetClass = "mgs_ad_" + Math.random().toString(36).slice(2, 12);
    const target = document.createElement("div");
    target.className = targetClass;
    container.appendChild(target);

    const url = new URL(
      "https://static.mgstage.com/mgs/script/common/mgs_Widget_affiliate.js"
    );
    url.search = new URLSearchParams({
      c: AFFILIATE_CODE,
      t: mode,
      o: "f",
      b: "t",
      s: title || "",
      p: productId,
      from: "ppv",
      class: targetClass,
    }).toString();

    const script = document.createElement("script");
    script.id = "mgs_Widget_affiliate";
    script.src = url.toString();
    script.async = true;
    container.appendChild(script);

    return () => {
      script.remove();
      target.remove();
    };
  }, [productId, title, mode]);

  if (!productId) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
      <p className="mb-3 text-xs text-zinc-400">広告｜MGS公式作品ページ</p>
      <div ref={containerRef} />
    </div>
  );
}
