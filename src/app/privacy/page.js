import Link from "next/link";
import { getOperator } from "@/lib/operator";

export const metadata = {
  title: "プライバシーポリシー",
  description: "VISTELQのプライバシーポリシー（個人情報・Cookie・広告の取り扱い）",
};

function Section({ title, children }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-zinc-300">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  const { email } = getOperator();

  return (
    <main className="min-h-screen bg-[#09090e] px-5 py-12 text-white">
      <article className="mx-auto max-w-3xl leading-8">
        <h1 className="text-3xl font-black">プライバシーポリシー</h1>
        <p className="mt-4 text-zinc-300">
          VISTELQ（以下「当サイト」）は、利用者のプライバシーを尊重し、以下のとおり情報を取り扱います。
        </p>

        <Section title="1. 取得する情報">
          <p>
            当サイトでは、会員登録・ログイン機能は現在提供しておらず、氏名・住所・メールアドレスなどの個人情報を利用者から直接取得することはありません。
          </p>
          <p>
            当サイトの配信を行うホスティング事業者により、アクセス日時・閲覧ページ・ブラウザ情報などのアクセスログが処理される場合があります。
          </p>
        </Section>

        <Section title="2. ブラウザに保存される情報">
          <p>
            次の情報は、お使いのブラウザ内（ローカルストレージ）にのみ保存され、当サイトのサーバーには送信されません。
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>18歳以上であることの確認の記録</li>
            <li>お気に入り・最近見た作品</li>
            <li>表示言語の設定</li>
          </ul>
          <p>ブラウザの設定から、いつでも削除できます。</p>
        </Section>

        <Section title="3. 広告・アフィリエイト">
          <p>
            当サイトは、MGS・FANZA などのアフィリエイトプログラムを利用して広告を掲載しています。
            広告のリンクや、各社が提供する表示用スクリプトを通じて、広告提供会社が Cookie などを用いて情報を取得する場合があります。
            その取り扱いは、各社のプライバシーポリシーに従います。
          </p>
          <p>
            当サイトでは、購入ページへのリンクがクリックされたことを、作品ID・提携先の種別・日時のみで集計しています。個人を特定する情報は記録していません。
          </p>
        </Section>

        <Section title="4. アクセス解析">
          <p>
            現在、アクセス解析サービスは導入していません。導入する場合は、本ページに利用目的と取得する情報を明記します。
          </p>
        </Section>

        <Section title="5. 外部サイト">
          <p>
            当サイトから移動した外部サイトにおける個人情報の取り扱いについては、当サイトは責任を負いません。各サイトの規定をご確認ください。
          </p>
        </Section>

        <Section title="6. ポリシーの変更">
          <p>
            必要に応じて本ポリシーを改定します。変更後の内容は、本ページに掲載した時点から効力を持ちます。
          </p>
        </Section>

        <Section title="7. お問い合わせ">
          <p>
            {email ? (
              <>
                本ポリシーに関するお問い合わせは、
                <a href={`mailto:${email}`} className="text-purple-300 underline underline-offset-4">
                  {email}
                </a>
                までご連絡ください。
              </>
            ) : (
              "お問い合わせ窓口は準備中です。"
            )}
          </p>
        </Section>

        <p className="mt-12">
          <Link href="/" className="text-purple-300 hover:underline">
            ← トップページに戻る
          </Link>
        </p>
      </article>
    </main>
  );
}
