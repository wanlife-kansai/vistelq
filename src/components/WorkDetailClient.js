"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import MgsWidget from "@/components/MgsWidget";
import ActressProfileCard from "@/components/ActressProfileCard";
import {
  actressHref,
  genreHref,
  getActressList,
  getGenreList,
} from "@/lib/work-relations";

const tabs = [
  { id: "info", label: "作品情報" },
  { id: "samples", label: "サンプル画像" },
  { id: "reviews", label: "レビュー" },
  { id: "actress", label: "女優情報" },
  { id: "related", label: "関連作品" },
];

export default function WorkDetailClient({
  work,
  relatedWorks = [],
  actressProfile = null,
}) {
  const [activeTab, setActiveTab] = useState("info");
  const [favorite, setFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const boxRef = useRef(null);
  const [scale, setScale] = useState(1);

  // サンプル動画の埋め込みページは、URLの size=幅_高さ の固定サイズで作られている。
  // そのサイズのまま表示して、枠の幅に合わせて拡大縮小する（中でスクロールさせない）。
  const embedSize = useMemo(() => {
    const m = /size=(\d+)_(\d+)/.exec(work.sampleEmbedUrl || "");
    return m ? { w: Number(m[1]), h: Number(m[2]) } : { w: 720, h: 480 };
  }, [work.sampleEmbedUrl]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || !work.sampleEmbedUrl) return;
    const update = () => setScale(el.clientWidth / embedSize.w);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [work.sampleEmbedUrl, embedSize.w]);

  const images =
    Array.isArray(work.sampleImages) && work.sampleImages.length
      ? work.sampleImages
      : [work.thumbnail];

  const actress = work.actressName || work.actress || "未登録";

  useEffect(() => {
    try {
      const key = "vistelq-recent";
      const stored = JSON.parse(localStorage.getItem(key) || "[]");
      const previous = Array.isArray(stored) ? stored.map(String) : [];
      const next = [
        String(work.id),
        ...previous.filter((id) => id !== String(work.id)),
      ].slice(0, 10);

      localStorage.setItem(key, JSON.stringify(next));

      const favorites = JSON.parse(
        localStorage.getItem("vistelq-favorites") || "[]"
      );

      setFavorite(
        Array.isArray(favorites) &&
          favorites.map(String).includes(String(work.id))
      );
    } catch (error) {
      console.warn("Local storage error:", error);
    }
  }, [work.id]);

  const toggleFavorite = () => {
    try {
      const key = "vistelq-favorites";
      const stored = JSON.parse(localStorage.getItem(key) || "[]");
      const current = Array.isArray(stored) ? stored.map(String) : [];

      const next = favorite
        ? current.filter((id) => id !== String(work.id))
        : [...current, String(work.id)];

      localStorage.setItem(key, JSON.stringify(next));
      setFavorite(!favorite);
    } catch (error) {
      console.warn("Favorite storage error:", error);
    }
  };

  const details = [
    [
      "出演女優",
      getActressList(work).length > 0 ? (
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          {getActressList(work).map((item) => (
            <Link
              key={item.slug}
              href={actressHref(item.slug)}
              className="text-purple-300 underline-offset-4 hover:underline"
            >
              {item.name}
            </Link>
          ))}
        </span>
      ) : (
        actress
      ),
    ],
    ["メーカー", work.maker || "未登録"],
    ["発売日", work.releaseDate || "未登録"],
    ["品番", work.productId || work.id],
    ["収録時間", work.duration || "未登録"],
    ["配信サイト", work.asp || "未登録"],
  ];

  return (
    <div className="min-h-screen bg-[#09090e] text-white">
      <main className="mx-auto max-w-7xl space-y-10 px-5 py-10">

        {/* パンくず */}
        <nav className="flex flex-wrap gap-2 text-sm text-zinc-400">
          <Link href="/" className="hover:text-purple-400">
            ホーム
          </Link>
          <span>›</span>
          <Link href="/videos" className="hover:text-purple-400">
            動画作品
          </Link>
          <span>›</span>
          <Link href="/videos/new" className="hover:text-purple-400">
            新作AV一覧
          </Link>
          <span>›</span>
          <span className="text-white">作品詳細</span>
        </nav>

        {/* メイン */}
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">

          {/* 左：プレビュー */}
          <div className="space-y-4">
            <div
              ref={boxRef}
              style={
                work.sampleEmbedUrl
                  ? { aspectRatio: `${embedSize.w} / ${embedSize.h}` }
                  : undefined
              }
              className={`relative overflow-hidden rounded-2xl border border-purple-500/30 bg-black shadow-[0_0_40px_rgba(139,92,246,0.12)] ${
                work.sampleEmbedUrl ? "" : "aspect-video"
              }`}
            >

              {work.sampleVideoUrl ? (
                <video
                  key={work.sampleVideoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  poster={images[selectedImage]}
                  className="h-full w-full object-cover"
                >
                  <source src={work.sampleVideoUrl} />
                  お使いのブラウザでは動画を再生できません。
                </video>
              ) : work.sampleEmbedUrl && playing ? (
                <iframe
                  src={work.sampleEmbedUrl}
                  title={`${work.title} サンプル動画`}
                  scrolling="no"
                  style={{
                    width: embedSize.w,
                    height: embedSize.h,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                  className="absolute left-0 top-0 max-w-none border-0"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <>
                  <img
                    src={images[selectedImage]}
                    alt={work.title}
                    className="h-full w-full object-cover"
                  />

                  {work.sampleEmbedUrl ? (
                    <button
                      type="button"
                      onClick={() => setPlaying(true)}
                      aria-label="サンプル動画を再生"
                      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/20 transition hover:bg-black/10"
                    >
                      <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/40 bg-purple-700/80 text-3xl shadow-xl">
                        ▶
                      </span>
                      <span className="rounded-full bg-black/70 px-4 py-2 text-xs text-zinc-200">
                        サンプル動画を再生
                      </span>
                    </button>
                  ) : work.affiliateUrl ? (
                    <a
                      href={work.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      aria-label={`${work.asp}でサンプルを見る`}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/20 transition hover:bg-black/10"
                    >
                      <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/40 bg-purple-700/80 text-3xl shadow-xl">
                        ▶
                      </span>
                      <span className="rounded-full bg-black/70 px-4 py-2 text-xs text-zinc-200">
                        {work.asp}でサンプルを見る ↗
                      </span>
                    </a>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/20">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/40 bg-purple-700/80 text-3xl shadow-xl">
                        ▶
                      </div>
                      <span className="rounded-full bg-black/70 px-4 py-2 text-xs text-zinc-200">
                        サンプル動画準備中
                      </span>
                    </div>
                  )}
                </>
              )}

              <span className="absolute left-4 top-4 rounded-full bg-purple-700 px-4 py-2 text-xs font-bold">
                {work.asp}
              </span>
            </div>

            {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={`w-28 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    selectedImage === index
                      ? "border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                      : "border-white/10 hover:border-purple-400"
                  }`}
                >
                  <img
                    src={image}
                    alt={`サンプル画像 ${index + 1}`}
                    className="aspect-video w-full object-cover"
                  />
                </button>
              ))}
            </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
              <span>再生時間：{work.duration || "未登録"}</span>
              <span>
                {work.sampleVideoUrl || work.sampleEmbedUrl
                  ? "サンプル動画を再生できます"
                  : work.affiliateUrl
                  ? "サンプルは販売サイトでご覧いただけます"
                  : "動画データはASP連携後に表示されます"}
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5">
              {details.map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[100px_1fr] gap-3 border-b border-white/10 py-3 text-sm last:border-0"
                >
                  <span className="text-zinc-400">{label}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 右：作品情報 */}
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-pink-600 px-4 py-1 text-sm font-bold">
                {work.asp}
              </span>

              {getGenreList(work).map((genre) => (
                <Link
                  key={genre.slug}
                  href={genreHref(genre.slug)}
                  className="rounded-full border border-purple-500/50 px-3 py-1 text-xs text-purple-200 hover:bg-purple-950"
                >
                  {genre.name}
                </Link>
              ))}
            </div>

            <h1 className="text-2xl font-black leading-relaxed md:text-3xl">
              {work.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
              <span>👁 {Number(work.views || 0).toLocaleString()}回閲覧</span>
              <button
                type="button"
                onClick={toggleFavorite}
                className="rounded-lg border border-purple-500 px-4 py-2 text-purple-200 hover:bg-purple-950"
              >
                {favorite ? "♥ お気に入り登録済み" : "♡ お気に入り"}
              </button>
            </div>

            <div className="space-y-5 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-[#21132f] via-zinc-900 to-[#101018] p-6 shadow-[0_0_35px_rgba(139,92,246,0.12)]">

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-bold text-purple-200">
                  作品の視聴・購入
                </span>
                <span className="rounded-full border border-purple-500/40 bg-purple-950/60 px-3 py-1 text-xs text-purple-200">
                  {work.asp}
                </span>
              </div>

              <div>
                <p className="mb-2 text-xs text-zinc-400">
                  販売価格
                </p>

                <div className="text-4xl font-black tracking-tight text-pink-400">
                  {typeof work.price === "number"
                    ? `${work.price.toLocaleString()}円`
                    : "価格未登録"}
                </div>
              </div>

              {work.affiliateUrl ? (
                <a
                  href={work.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 px-6 py-5 text-center text-lg font-black shadow-lg transition hover:scale-[1.01] hover:brightness-110"
                >
                  {work.asp}で作品を見る
                  <span>↗</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-xl bg-gradient-to-r from-purple-800/60 to-pink-800/60 px-6 py-5 text-lg font-black text-white/60"
                >
                  公式サイトで作品を見る（準備中）
                </button>
              )}

              {work.mgsProductId && (
                <MgsWidget
                  productId={work.mgsProductId}
                  title={work.title}
                  mode="mix"
                />
              )}

              {work.sampleVideoUrl && (
                <a
                  href={work.sampleVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-purple-500 px-6 py-4 text-center text-sm font-bold text-purple-200 transition hover:bg-purple-950"
                >
                  ▶ 無料サンプルを再生
                </a>
              )}

              <p className="text-center text-xs leading-6 text-zinc-500">
                購入・視聴は各配信サイトで行います。
                <br />
                価格や配信状況は公式サイトをご確認ください。
              </p>
            </div>
          </div>
        </section>

        {/* タブ */}
        <section className="space-y-6">
          <div className="flex gap-2 overflow-x-auto border-b border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 border-b-2 px-5 py-4 text-sm font-bold ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-300"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "info" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
                <h2 className="mb-5 text-xl font-bold">作品紹介</h2>
                <p className="whitespace-pre-wrap leading-8 text-zinc-300">
                  {work.description || "作品紹介は準備中です。"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
                <h2 className="mb-5 text-xl font-bold">作品詳細情報</h2>
                {details.map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[100px_1fr] gap-3 border-b border-white/10 py-3 text-sm last:border-0"
                  >
                    <span className="text-zinc-400">{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "samples" && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {images.map((image, index) => (
                <img
                  key={`${image}-${index}`}
                  src={image}
                  alt={`サンプル ${index + 1}`}
                  className="w-full rounded-xl border border-white/10"
                />
              ))}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="rounded-2xl bg-zinc-900 p-8 text-zinc-400">
              レビュー機能は準備中です。
            </div>
          )}

          {activeTab === "actress" && (
            actressProfile ? (
              <ActressProfileCard profile={actressProfile} headingLevel={2} />
            ) : (
              <div className="rounded-2xl bg-zinc-900 p-8">
                <h2 className="text-xl font-bold">{actress}</h2>
                <p className="mt-3 text-sm text-zinc-400">
                  女優プロフィールは準備中です。
                </p>
              </div>
            )
          )}

          {activeTab === "related" && (
            <RelatedWorks works={relatedWorks} />
          )}
        </section>

        {/* 関連作品 */}
        <section className="space-y-5">
          <h2 className="text-2xl font-bold">おすすめの関連作品</h2>
          <RelatedWorks works={relatedWorks} />
        </section>
      </main>
    </div>
  );
}

function RelatedWorks({ works }) {
  const scrollRef = useRef(null);

  const move = (direction) => {
    if (!scrollRef.current) return;

    const firstCard = scrollRef.current.firstElementChild;

    const distance = firstCard
      ? firstCard.getBoundingClientRect().width + 20
      : 280;

    scrollRef.current.scrollBy({
      left: distance * direction,
      behavior: "smooth",
    });
  };

  if (!works.length) {
    return (
      <p className="rounded-xl bg-zinc-900 p-6 text-zinc-400">
        関連作品は準備中です。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => move(-1)}
          aria-label="関連作品を左にスクロール"
          className="rounded-full border border-purple-500 px-4 py-2 text-purple-200 transition hover:bg-purple-900"
        >
          ❮
        </button>

        <button
          type="button"
          onClick={() => move(1)}
          aria-label="関連作品を右にスクロール"
          className="rounded-full border border-purple-500 px-4 py-2 text-purple-200 transition hover:bg-purple-900"
        >
          ❯
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-5"
      >
        {works.map((work) => (
          <Link
            key={work.id}
            href={`/works/${work.id}`}
            className="w-[220px] shrink-0 snap-start overflow-hidden rounded-xl border border-white/10 bg-zinc-900 transition hover:border-purple-500 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] sm:w-[260px]"
          >
            <img
              src={work.thumbnail}
              alt={work.title}
              className="aspect-video w-full object-cover"
            />

            <div className="space-y-2 p-4">
              <p className="line-clamp-2 text-sm font-bold">
                {work.title}
              </p>

              <p className="text-xs text-purple-300">
                {work.actressName || work.actress}
              </p>

              <p className="text-xs text-zinc-400">
                {work.asp}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
