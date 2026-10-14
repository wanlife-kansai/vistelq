import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { goods } from "@/data/goods";
import categoryData from "@/data/vistelq-goods-categories.json";

function flattenCategories(items, parents = []) {
  return items.flatMap((item) => {
    const match = item.url?.match(/id=(\d+)/);
    const id = match?.[1];

    const current = id
      ? [{ id, name: item.name, parents }]
      : [];

    return [
      ...current,
      ...flattenCategories(
        item.children || [],
        id ? [...parents, id] : parents
      ),
    ];
  });
}

const categories = flattenCategories(
  Array.isArray(categoryData)
    ? categoryData
    : categoryData.categories || []
);

export function generateStaticParams() {
  return categories.map((category) => ({
    id: category.id,
  }));
}

async function CategoryContent({ params }) {
  const { id } = await params;

  const category = categories.find((item) => item.id === id);

  if (!category) {
    notFound();
  }

  const products = goods.filter(
    (product) =>
      product.categoryId === id ||
      (product.categoryIds || []).includes(id)
  );

  return (
    <main className="min-h-screen bg-[#09090e] px-5 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        <nav className="mb-8 text-sm text-zinc-400">
          <Link href="/" className="hover:text-purple-400">
            TOP
          </Link>
          {" / "}
          <Link href="/goods" className="hover:text-purple-400">
            グッズ
          </Link>
          {" / "}
          {category.name}
        </nav>

        <section className="mb-10 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950 to-zinc-900 p-8">
          <p className="text-sm font-bold text-purple-300">
            VISTELQ GOODS CATEGORY
          </p>

          <h1 className="mt-3 text-3xl font-black">
            {category.name}
          </h1>

          <p className="mt-4 text-zinc-300">
            {category.name}の商品一覧
          </p>

          <p className="mt-3 text-sm text-zinc-400">
            全{products.length}件
          </p>
        </section>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/goods/item/${product.id}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 transition hover:border-purple-500"
              >
                <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-zinc-800 via-purple-950 to-black">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-6xl">🛍️</span>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <p className="text-xs text-purple-300">
                    {product.brand}
                  </p>

                  <h2 className="text-sm font-bold">
                    {product.name}
                  </h2>

                  <p className="text-lg font-black">
                    ¥{product.price.toLocaleString()}
                  </p>

                  <span className="inline-block rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold">
                    商品詳細を見る →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-zinc-900 p-12 text-center">
            <p className="text-zinc-400">
              このカテゴリの商品は現在準備中です。
            </p>

            <Link
              href="/goods"
              className="mt-6 inline-block rounded-lg bg-purple-600 px-6 py-3 font-bold"
            >
              グッズTOPへ戻る
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}

export default function CategoryPage({ params }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#09090e] p-10 text-center text-white">
          商品を読み込み中...
        </main>
      }
    >
      <CategoryContent params={params} />
    </Suspense>
  );
}
