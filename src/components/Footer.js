"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

const links = [
  ["footerFind", "/videos"],
  ["footerRanking", "/rankings"],
  ["footerActress", "/actresses"],
  ["footerPrivacy", "/privacy"],
  ["footerAbout", "/about"],
];

export default function Footer() {
  const { t } = useT();
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#101018] px-5 py-10 text-sm text-zinc-400">
      <div className="mx-auto max-w-7xl space-y-5">
        <p className="text-2xl font-black text-purple-400">VISTELQ</p>

        <p className="leading-7">
          広告表記：当サイトは、MGS・FANZA などのアフィリエイトプログラムを利用しており、
          作品の購入・視聴ページへのリンクを通じて、運営者が報酬を得る場合があります。
        </p>

        <p className="leading-7">
          18歳未満の方のご利用はできません。掲載している価格・配信状況は変更される場合があります。
          最新の情報は各販売サイトでご確認ください。
        </p>

        <nav aria-label="フッターナビゲーション" className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map(([key, href]) => (
            <Link key={href} href={href} className="hover:text-purple-300">
              {t(key)}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-zinc-500">© VISTELQ</p>
      </div>
    </footer>
  );
}
