"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { goods } from "@/data/goods";
import GoodsCategoryTree from "@/components/GoodsCategoryTree";
import goodsCategoriesData from "@/data/vistelq-goods-categories.json";

function findCategoryName(items, categoryId) {
  for (const item of items) {
    const match = item.url?.match(/id=(\d+)/);

    if (match && match[1] === String(categoryId)) {
      return item.name;
    }

    if (item.children?.length) {
      const found = findCategoryName(item.children, categoryId);

      if (found) return found;
    }
  }

  return null;
}

const categories = [
  { name: "すべて", icon: "🛍️" },
  { name: "VR機器", icon: "🥽" },
  { name: "コスチューム", icon: "👗" },
  { name: "ケア用品", icon: "🧴" },
  { name: "ビューティー", icon: "✨" },
  { name: "アクセサリー", icon: "💎" },
  { name: "その他", icon: "🎁" },
];

function ProductCard({ product, rank }) {
  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 transition hover:border-purple-500">
      <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-zinc-800 via-purple-950 to-zinc-950">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-center">
            <span className="text-6xl">
              {categories.find((c) => c.name === product.category)?.icon || "🛍️"}
            </span>
            <p className="mt-4 text-xs tracking-widest text-purple-300">
              VISTELQ GOODS
            </p>
          </div>
        )}

        {rank && (
          <span className="absolute left-3 top-3 rounded-lg bg-black/80 px-3 py-2 text-lg font-black text-yellow-400">
            {rank}位
          </span>
        )}

        {product.isNew && (
          <span className="absolute right-3 top-3 rounded-full bg-purple-600 px-3 py-1 text-xs font-bold">
            NEW
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <p className="text-xs text-purple-300">{product.brand}</p>
        <h3 className="min-h-10 text-sm font-bold">{product.name}</h3>
        <p className="text-xs text-zinc-400">{product.category}</p>

        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-black text-white">
            ¥{product.price.toLocaleString()}
          </p>
          <span className="text-xs text-yellow-400">
            ★ {product.rating.toFixed(1)}
          </span>
        </div>

        <Link
          href={`/goods/item/${product.id}`}
          className="block w-full rounded-lg bg-purple-600 px-4 py-3 text-center text-sm font-bold transition hover:bg-purple-500"
        >
          商品詳細を見る →
        </Link>
      </div>
    </article>
  );
}

function ProductSlider({ title, subtitle, items, ranking = false }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({
      left: direction * 300,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => scroll(-1)}
            aria-label="左へ"
            className="rounded-full border border-purple-500 px-4 py-2 hover:bg-purple-900"
          >
            ❮
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="右へ"
            className="rounded-full border border-purple-500 px-4 py-2 hover:bg-purple-900"
          >
            ❯
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4"
      >
        {items.map((product, index) => (
          <div
            key={product.id}
            className="w-[75%] shrink-0 snap-start sm:w-[42%] lg:w-[23%]"
          >
            <ProductCard
              product={product}
              rank={ranking ? index + 1 : null}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function GoodsPage() {
  const [neonGoods, setNeonGoods] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadNeonGoods() {
      try {
        const response = await fetch("/api/goods", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("商品APIの取得に失敗しました");
        }

        const data = await response.json();

        if (active && data.success) {
          const products = (data.products || []).map((item) => ({
            ...item,
            id: item.id,
          
            category:
              findCategoryName(
                goodsCategoriesData,
                item.categoryId
              ) || "その他",
          
            categoryId: item.categoryId,
            categoryIds: item.categoryIds || [],
          
            image: item.images?.[0]?.url || null,
            
            affiliateUrl: item.offers?.[0]?.affiliateUrl || null,
            price: item.price ?? 0,
            rating: item.rating ?? 0,
            popularity: item.popularity ?? 0,
            isNew: true,
            isDatabaseProduct: true,
          }));

          setNeonGoods(products);
        }
      } catch (error) {
        console.error("Neon商品取得エラー:", error);
      }
    }

    loadNeonGoods();

    return () => {
      active = false;
    };
  }, []);

  const allGoods = useMemo(
    () => [...neonGoods, ...goods],
    [neonGoods]
  );

  const [category, setCategory] = useState("すべて");
  const [selectedDetailCategory, setSelectedDetailCategory] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("popular");

  const filteredGoods = useMemo(() => {
    const result = allGoods.filter((product) => {
      const matchesCategory =
        category === "すべて" || product.category === category;

      const matchesDetailCategory =
        !selectedDetailCategory ||
        product.categoryId === selectedDetailCategory.id ||
        (product.categoryIds || []).includes(selectedDetailCategory.id);

      const searchText = [
        product.name,
        product.brand,
        product.category,
      ].join(" ").toLowerCase();

      const matchesKeyword = searchText.includes(keyword.toLowerCase());

      return matchesCategory && matchesDetailCategory && matchesKeyword;
    });

    if (sort === "popular") {
      result.sort((a, b) => b.popularity - a.popularity);
    }

    if (sort === "new") {
      result.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    }

    if (sort === "price-low") {
      result.sort((a, b) => a.price - b.price);
    }

    if (sort === "price-high") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [allGoods, category, keyword, sort, selectedDetailCategory]);

  return (
    <div className="min-h-screen bg-[#09090e] text-white">
      <main className="mx-auto max-w-7xl space-y-14 px-5 py-10">

        {/* メインビジュアル */}
        <section className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950 via-zinc-900 to-black p-8 md:p-14">
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />

          <div className="relative z-10 max-w-2xl">
            <p className="mb-3 text-sm font-bold tracking-[0.3em] text-purple-300">
              VISTELQ GOODS
            </p>

            <h1 className="text-3xl font-black leading-tight md:text-5xl">
              あなたの好奇心に、
              <br />
              新しい選択肢を。
            </h1>

            <p className="mt-6 text-sm leading-7 text-zinc-300 md:text-base">
              人気のアイテムからVR関連機器まで。
              <br />
              気になるグッズを見つけよう。
            </p>

            <a
              href="#goods-list"
              className="mt-8 inline-block rounded-full bg-purple-600 px-7 py-3 text-sm font-bold hover:bg-purple-500"
            >
              商品を探す →
            </a>
          </div>
        </section>

        {/* 検索 */}
        <section className="space-y-5">
          <h2 className="text-2xl font-bold">グッズを探す</h2>

          <div className="flex overflow-hidden rounded-2xl border border-purple-500/50 bg-white">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="商品名・ブランド名・キーワードで検索"
              className="min-w-0 flex-1 px-5 py-4 text-sm text-zinc-900 outline-none"
            />
            <button
              type="button"
              aria-label="検索"
              className="bg-gradient-to-r from-purple-600 to-pink-500 px-6 text-xl"
              onClick={() =>
                document.getElementById("goods-list")?.scrollIntoView({
                  behavior: "smooth",
                })
              }
            >
              🔍
            </button>
          </div>
        </section>

        {/* カテゴリ */}
        <section className="space-y-5">
          <h2 className="text-2xl font-bold">カテゴリから探す</h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
            {categories.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setCategory(item.name);
                  document.getElementById("goods-list")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
                className={`rounded-2xl border p-5 text-center transition ${
                  category === item.name
                    ? "border-purple-400 bg-purple-900/50"
                    : "border-white/10 bg-zinc-900 hover:border-purple-500"
                }`}
              >
                <div className="mb-3 text-4xl">{item.icon}</div>
                <p className="text-sm font-bold">{item.name}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 詳細カテゴリツリー */}
        <GoodsCategoryTree
            onSelectCategory={(item) => {
              const match = item.url?.match(/id=(\d+)/);
              setSelectedDetailCategory({
                id: match ? match[1] : null,
                name: item.name,
              });
              setCategory("すべて");
              document.getElementById("goods-list")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
          />

        {/* 人気ランキング */}
        <ProductSlider
          title="人気グッズランキング TOP10"
          subtitle="人気順のサンプルランキング"
          items={[...allGoods].sort((a, b) => b.popularity - a.popularity).slice(0, 10)}
          ranking
        />

        {/* 新着商品 */}
        <ProductSlider
          title="新着グッズ"
          subtitle="新しく追加されたアイテム"
          items={allGoods.filter((item) => item.isNew)}
        />

        {/* VR機器 */}
        <section className="space-y-5">
          <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-r from-zinc-900 to-purple-950 p-8 md:p-12">
            <p className="text-sm font-bold tracking-widest text-purple-300">
              VR EXPERIENCE
            </p>
            <h2 className="mt-3 text-3xl font-black">
              VRの世界を、もっと身近に。
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              VR動画を楽しむための機器をチェック。
              新品・中古品の比較ページも今後追加予定です。
            </p>

            <Link
              href="/videos/vr"
              className="mt-6 inline-block rounded-full border border-purple-400 px-6 py-3 text-sm font-bold hover:bg-purple-900"
            >
              VR動画を見る →
            </Link>
          </div>
        </section>

        {/* 全商品一覧へのリンク */}
        <section className="py-8 text-center">
          <Link
            href="/goods/list"
            className="inline-flex items-center justify-center rounded-full bg-purple-600 px-10 py-4 text-base font-bold text-white transition hover:bg-purple-500"
          >
            すべての商品を見る →
          </Link>
        </section>

      </main>
    </div>
  );
}
