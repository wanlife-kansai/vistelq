import Link from "next/link";
import { getOperator } from "@/lib/operator";

export const metadata = {
  title: "運営者情報",
  description: "VISTELQの運営者情報・広告について・免責事項",
};

export default function AboutPage() {
  const { name, email } = getOperator();

  const rows = [
    ["サイト名", "VISTELQ"],
    ["運営者", name || "準備中"],
    [
      "お問い合わせ",
      email ? (
        <a href={`mailto:${email}`} className="text-purple-300 underline underline-offset-4">
          {email}
        </a>
      ) : (
        "準備中"
      ),
    ],
    ["サイトの内容", "動画作品の検索・ランキング・出演者別の一覧を提供する、作品紹介サイトです。"],
  ];

  return (
    <main className="min-h-screen bg-[#09090e] px-5 py-12 text-white">
      <article className="mx-auto max-w-3xl leading-8">
        <h1 className="text-3xl font-black">運営者情報</h1>

        <dl className="mt-8 divide-y divide-white/10 rounded-2xl border border-white/10 bg-zinc-900">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 p-5 sm:grid-cols-[160px_1fr] sm:gap-4">
              <dt className="text-zinc-400">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-10 text-xl font-bold">広告について</h2>
        <p className="mt-3 text-zinc-300">
          当サイトは、MGS・FANZA などのアフィリエイトプログラムを利用しており、作品の購入・視聴ページへのリンクを通じて、運営者が報酬を得る場合があります。
        </p>

        <h2 className="mt-10 text-xl font-bold">免責事項</h2>
        <p className="mt-3 text-zinc-300">
          当サイトは各販売サイトの公式サイトではありません。掲載している価格・配信状況・作品情報は、変更される場合があります。ご購入・ご視聴の前に、必ず各販売サイトで最新の情報をご確認ください。作品の画像・情報の著作権は、各権利者に帰属します。
        </p>

        <p className="mt-12">
          <Link href="/" className="text-purple-300 hover:underline">
            ← トップページに戻る
          </Link>
        </p>
      </article>
    </main>
  );
}
