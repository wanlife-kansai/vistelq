"use client";

import { useState } from "react";
import Link from "next/link";

export default function GoodsItemDetail({ product, relatedGoods = [] }) {
  const images = [
    ...(product.images || []).map((image) =>
      typeof image === "string" ? image : image.url
    ),
    ...(product.image ? [product.image] : []),
  ].filter(Boolean);

  const offers = (product.offers || []).filter(
    (offer) => offer.isActive !== false && offer.affiliateUrl
  );

  if (offers.length === 0 && product.affiliateUrl) {
    offers.push({
      asp: "販売サイト",
      affiliateUrl: product.affiliateUrl,
    });
  }

  const [selectedImage, setSelectedImage] = useState(0);

  const specifications = Object.entries(product.specifications || {});

  return (
    <main className="min-h-screen bg-[#09090e] px-5 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        <nav className="mb-8 text-sm text-zinc-400">
          <Link href="/" className="hover:text-purple-400">TOP</Link>
          {" / "}
          <Link href="/goods" className="hover:text-purple-400">グッズ</Link>
          {" / "}
          <span>{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">

          <section>
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-zinc-800 via-purple-950 to-black">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <div className="text-8xl">🛍️</div>
                  <p className="mt-5 text-sm tracking-widest text-purple-300">
                    VISTELQ GOODS
                  </p>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {images.map((image, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-xl border-2 ${
                      selectedImage === index
                        ? "border-purple-500"
                        : "border-white/10"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-6">
            <p className="text-sm font-bold text-purple-300">
              {product.brand}
            </p>

            <h1 className="text-3xl font-black leading-relaxed">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4">
              {product.reviewCount > 0 && (
                <span className="text-yellow-400">
                  ★ {product.rating.toFixed(1)}
                  <span className="ml-2 text-sm text-zinc-400">
                    ({product.reviewCount}件のレビュー)
                  </span>
                </span>
              )}

              {product.isNew && (
                <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-bold">
                  NEW
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-zinc-900 p-6">
              <p className="text-sm text-zinc-400">参考価格（税込）</p>
              <p className="mt-2 text-4xl font-black">
                ¥{product.price.toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                価格・在庫状況は販売サイトでご確認ください。
              </p>
            </div>

            {product.features?.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold">商品の特徴</h2>
                {product.features.map((feature, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/10 bg-zinc-900 px-5 py-4 text-sm text-zinc-300"
                  >
                    <span className="mr-3 text-purple-400">✓</span>
                    {feature}
                  </div>
                ))}
              </div>
            )}

            {offers.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-xl font-bold">購入できるサイト</h2>

                {offers.map((offer, index) => (
                  <a
                    key={offer.id || index}
                    href={offer.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="block rounded-xl bg-purple-600 px-6 py-5 text-center text-lg font-black transition hover:bg-purple-500"
                  >
                    {offer.asp || "販売サイト"}で商品を見る →
                  </a>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-zinc-800 px-6 py-5 text-center text-zinc-400">
                商品リンク準備中
              </div>
            )}
          </section>
        </div>

        <section className="mt-16 rounded-2xl border border-white/10 bg-zinc-900 p-7">
          <h2 className="mb-5 text-2xl font-black">商品説明</h2>
          <p className="whitespace-pre-line leading-8 text-zinc-300">
            {product.description || "商品説明は現在準備中です。"}
          </p>
        </section>

        {specifications.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 text-2xl font-black">商品仕様</h2>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              {specifications.map(([key, value]) => (
                <div
                  key={key}
                  className="grid grid-cols-3 border-b border-white/10 last:border-0"
                >
                  <div className="bg-zinc-900 p-4 text-sm font-bold">
                    {key}
                  </div>
                  <div className="col-span-2 bg-zinc-950 p-4 text-sm text-zinc-300">
                    {value || "未設定"}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {relatedGoods.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-black">関連商品</h2>

            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {relatedGoods.map((item) => (
                <Link
                  key={item.id}
                  href={`/goods/item/${item.id}`}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 transition hover:border-purple-500"
                >
                  <div className="flex aspect-square items-center justify-center bg-purple-950">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-5xl">🛍️</span>
                    )}
                  </div>

                  <div className="space-y-2 p-4">
                    <h3 className="text-sm font-bold">{item.name}</h3>
                    <p className="font-black">
                      ¥{item.price.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
