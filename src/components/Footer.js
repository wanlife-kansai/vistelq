import Link from "next/link";

const links = [
  ["動画を探す", "/videos"],
  ["ランキング", "/rankings"],
  ["女優", "/actresses"],
  ["プライバシーポリシー", "/privacy"],
  ["運営者情報", "/about"],
];

export default function Footer() {
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
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-purple-300">
              {label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-zinc-500">© VISTELQ</p>
      </div>
    </footer>
  );
}
