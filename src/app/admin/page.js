import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";


export default async function AdminPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  // ローカル開発環境からの閲覧のみを想定した暫定画面。
  // 本番公開前に管理者認証・認可を実装する。
  const products = await prisma.product.findMany({
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
      offers: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  const publishedCount = products.filter(
    (product) => product.isPublished
  ).length;

  const offerCount = products.reduce(
    (total, product) => total + product.offers.length,
    0
  );

  const formatPrice = (price) =>
    price == null ? "未設定" : `¥${price.toLocaleString("ja-JP")}`;

  return (
    <main className="min-h-screen bg-[#09070f] px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold text-purple-400">
            VISTELQ MANAGEMENT
          </p>

          <h1 className="text-3xl font-bold">
            商品管理ダッシュボード
          </h1>

          <p className="mt-3 text-gray-400">
            Neon PostgreSQLに登録された商品を管理します。
          </p>
        </div>

        <div className="mb-8 rounded-xl border border-yellow-700/50 bg-yellow-950/30 p-5">
          <p className="font-semibold text-yellow-300">
            開発モード
          </p>
          <p className="mt-2 text-sm text-gray-300">
            現在は閲覧専用です。商品登録・編集・削除機能はありません。
            管理者認証は未実装のため、外部公開しないでください。
          </p>
        </div>

        <div className="mb-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-purple-900 bg-[#17121f] p-6">
            <p className="text-sm text-gray-400">登録商品数</p>
            <p className="mt-3 text-4xl font-bold">
              {products.length}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-900 bg-[#17121f] p-6">
            <p className="text-sm text-gray-400">公開商品数</p>
            <p className="mt-3 text-4xl font-bold text-green-400">
              {publishedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-900 bg-[#17121f] p-6">
            <p className="text-sm text-gray-400">ASP登録件数</p>
            <p className="mt-3 text-4xl font-bold text-purple-400">
              {offerCount}
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-purple-900 bg-[#17121f]">
          <div className="border-b border-purple-900 p-6">
            <h2 className="text-xl font-bold">登録商品一覧</h2>
            <p className="mt-2 text-sm text-gray-400">
              最新100件を表示しています。
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#241a31] text-gray-300">
                <tr>
                  <th className="p-4">商品名</th>
                  <th className="p-4">カテゴリID</th>
                  <th className="p-4">価格</th>
                  <th className="p-4">ASP</th>
                  <th className="p-4">公開状態</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t border-purple-900/50"
                  >
                    <td className="p-4">
                      <p className="font-semibold">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {product.slug}
                      </p>
                    </td>

                    <td className="p-4 text-gray-300">
                      {product.categoryId || "未設定"}
                    </td>

                    <td className="p-4">
                      {formatPrice(product.price)}
                    </td>

                    <td className="p-4">
                      {product.offers.length === 0 ? (
                        <span className="text-gray-500">
                          未登録
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {product.offers.map((offer) => (
                            <span
                              key={offer.id}
                              className={
                                offer.isActive
                                  ? "rounded bg-green-900/40 px-2 py-1 text-green-300"
                                  : "rounded bg-gray-800 px-2 py-1 text-gray-400"
                              }
                            >
                              {offer.asp}
                              {!offer.isActive && "（無効）"}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      {product.isPublished ? (
                        <span className="rounded bg-green-900/40 px-3 py-1 text-green-300">
                          公開中
                        </span>
                      ) : (
                        <span className="rounded bg-gray-800 px-3 py-1 text-gray-400">
                          非公開
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {products.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-10 text-center text-gray-400"
                    >
                      登録商品がありません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
