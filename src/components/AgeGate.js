"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "vistelq-age-verified";

// 18歳以上の確認。同意はこのブラウザにだけ記録します（サーバーには送りません）。
export default function AgeGate() {
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setVerified(true);
    } catch {
      // 保存できない環境では、毎回確認を表示する
    }
  }, []);

  useEffect(() => {
    if (verified) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [verified]);

  if (verified) return null;

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // 保存に失敗しても、このページでは閲覧できるようにする
    }
    setVerified(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#09090e]/95 px-5 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-purple-500/40 bg-zinc-900 p-8 text-center shadow-[0_0_45px_rgba(139,92,246,0.25)]">
        <p className="text-3xl font-black text-purple-400">VISTELQ</p>

        <h2 id="age-gate-title" className="mt-6 text-xl font-bold text-white">
          あなたは18歳以上ですか？
        </h2>

        <p className="mt-3 text-sm leading-7 text-zinc-400">
          このサイトには成人向けの内容が含まれます。
          18歳未満の方のご利用はできません。
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={accept}
            className="rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 px-6 py-4 font-black text-white transition hover:brightness-110"
          >
            はい、18歳以上です
          </button>

          <a
            href="https://www.google.com/"
            className="rounded-xl border border-white/15 px-6 py-3 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            いいえ（退出する）
          </a>
        </div>
      </div>
    </div>
  );
}
