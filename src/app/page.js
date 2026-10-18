"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useWorks, useWorksTotal } from "@/lib/works-context";

const languages = [
  { code: "ja", label: "🇯🇵 日本語" },
  { code: "en", label: "🇺🇸 English" },
  { code: "zh-CN", label: "🇨🇳 简体中文" },
  { code: "ko", label: "🇰🇷 한국어" },
  { code: "zh-TW", label: "🇹🇼 繁體中文" },
];

const translations = {
  ja: {
    ranking: "人気ランキング",
    recent: "最近視聴した動画",
    top10: "本日のアクセス数 TOP10",
    multi: "複数プレイ動画",
    categories: "カテゴリから探す",
    genres: "人気ジャンル",
    search: "検索",
    login: "ログイン",
    vrshop: "VR機器を探す｜新品・中古",
  },
  en: {
    ranking: "Popular Ranking",
    recent: "Recently Watched",
    top10: "Today's Top 10",
    multi: "Group Videos",
    categories: "Browse Categories",
    genres: "Popular Genres",
    search: "Search",
    login: "Log In",
    vrshop: "Shop VR Headsets | New & Used",
  },
  "zh-CN": {
    ranking: "热门排行榜",
    recent: "最近观看",
    top10: "今日热门前十",
    multi: "多人视频",
    categories: "浏览分类",
    genres: "热门类型",
    search: "搜索",
    login: "登录",
    vrshop: "选购VR设备｜全新与二手",
  },
  ko: {
    ranking: "인기 순위",
    recent: "최근 시청한 동영상",
    top10: "오늘의 TOP 10",
    multi: "그룹 동영상",
    categories: "카테고리 탐색",
    genres: "인기 장르",
    search: "검색",
    login: "로그인",
    vrshop: "VR 기기 구매 | 신품・중고",
  },
  "zh-TW": {
    ranking: "熱門排行榜",
    recent: "最近觀看",
    top10: "今日熱門前十",
    multi: "多人影片",
    categories: "瀏覽分類",
    genres: "熱門類型",
    search: "搜尋",
    login: "登入",
    vrshop: "選購VR設備｜全新與二手",
  },
};


// vistelq-category-slider
const categories = [
  { name: "動画", icon: "🎬", description: "人気の動画作品を探す" },
  { name: "VR動画", icon: "🥽", description: "臨場感あふれるVR作品" },
  { name: "女優", icon: "👩", description: "お気に入りの女優を探す" },
  { name: "グッズ", icon: "🛍️", description: "人気のアイテムをチェック" },
  { name: "漫画", icon: "📚", description: "話題の電子コミック" },
];

// カテゴリごとの作品ID（作品データから自動で分類）
function buildCategoryIds(videos) {
  return {
    "動画": videos.map((video) => String(video.id)),
    "VR動画": videos
      .filter((video) => video.contentType === "vr")
      .map((video) => String(video.id)),
    "女優": [],
    "グッズ": [],
    "漫画": [],
  };
}

const genres = [
  "NTR",
  "ドラマ",
  "恋愛",
  "VR",
  "素人",
  "企画",
  "海外",
  "人気急上昇",
];

function VideoSection({ title, items = [], ranking = false, slider = false }) {
  const scrollRef = useRef(null);

  const scrollRanking = (direction) => {
    if (!scrollRef.current) return;

    const card = scrollRef.current.querySelector("article");
    const distance = card ? card.getBoundingClientRect().width + 16 : 280;

    scrollRef.current.scrollBy({
      left: distance * direction,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">{title}</h2>

        {(ranking || slider) && (
          <div className="flex items-center gap-2">
            <Link
              href="/rankings"
              className="mr-2 rounded-full border border-purple-500 px-4 py-2 text-sm font-bold text-purple-300 transition hover:bg-purple-900 hover:text-white"
            >
              すべて見る →
            </Link>
            <button
              type="button"
              onClick={() => scrollRanking(-1)}
              aria-label="ランキングを左へ"
              className="rounded-full border border-purple-500 bg-zinc-900 px-4 py-2 hover:bg-purple-900"
            >
              ❮
            </button>

            <button
              type="button"
              onClick={() => scrollRanking(1)}
              aria-label="ランキングを右へ"
              className="rounded-full border border-purple-500 bg-zinc-900 px-4 py-2 hover:bg-purple-900"
            >
              ❯
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className={
          ranking || slider
            ? "flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4"
            : "grid grid-cols-2 gap-4 md:grid-cols-5"
        }
      >
        {items.map((video, index) => (
          <article
            key={video.id}
            className={
              ranking
                ? "relative w-[78%] shrink-0 snap-start overflow-hidden rounded-xl bg-[#111] sm:w-[48%] lg:w-[32%]"
                : slider
                ? "w-[72%] shrink-0 snap-start overflow-hidden rounded-xl bg-zinc-900 sm:w-[42%] lg:w-[23%]"
                : "overflow-hidden rounded-xl bg-zinc-900"
            }
          >
            <Link
              href={`/works/${video.id}`}
              className={
                ranking
                  ? "relative z-10 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-zinc-800"
                  : "relative flex aspect-video items-center justify-center overflow-hidden bg-gradient-to-br from-purple-900 to-zinc-800"
              }
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="absolute inset-0 h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              {ranking ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-3 left-2 z-20 select-none text-[76px] font-black leading-none text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] sm:text-[92px]"
                  style={{ WebkitTextStroke: "2px rgba(255,255,255,0.9)" }}
                >
                  {index + 1}
                </span>
              ) : (
                <span className="text-4xl">▶</span>
              )}



              <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs">
                {video.duration}
              </span>
            </Link>

            <div className="p-3">
              <h3 className="text-sm font-semibold">{video.title}</h3>

              <span className="mt-2 inline-block rounded bg-purple-950 px-2 py-1 text-xs text-purple-200">
                {video.asp}
              </span>

              <p className="mt-2 text-xs text-zinc-400">
                閲覧数：{video.views.toLocaleString()}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const videos = useWorks();
  const totalWorks = useWorksTotal();
  const demoCategoryIds = buildCategoryIds(videos);
  const [slide, setSlide] = useState(0);
  const [recentIds, setRecentIds] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [language, setLanguage] = useState("ja");
  const t = translations[language];

  useEffect(() => {
    const saved = localStorage.getItem("vistelq-language");
    if (saved && translations[saved]) {
      setLanguage(saved);
    }
  }, []);



  useEffect(() => {
    const refreshRecent = () => {
      try {
        const stored = JSON.parse(localStorage.getItem("vistelq-recent") || "[]");
        setRecentIds(Array.isArray(stored) ? stored.map(String).slice(0, 10) : []);
      } catch {
        setRecentIds([]);
      }
    };

    refreshRecent();
    window.addEventListener("pageshow", refreshRecent);
    window.addEventListener("focus", refreshRecent);

    return () => {
      window.removeEventListener("pageshow", refreshRecent);
      window.removeEventListener("focus", refreshRecent);
    };
  }, []);

  const recentVideos = recentIds
    .map((id) => videos.find((video) => String(video.id) === id))
    .filter(Boolean);

  const categoryVideos = selectedCategory
    ? videos.filter((video) =>
        (demoCategoryIds[selectedCategory] || []).includes(String(video.id))
      )
    : [];

  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const searchResults = videos.filter((video) =>
    `${video.title} ${video.asp}`.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const slides = [
    {
      title: "見つける、その先の発見へ。",
      description: "あなたにぴったりの動画を見つけよう。",
    },
    {
      title: "無料会員登録でもっと便利に",
      description: "お気に入りや視聴履歴などの機能を追加予定。",
    },
    {
      title: "VR動画の世界へ",
      description: "VR作品や対応機器を探せるサイトへ。",
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090e] text-white">

      {/* ヘッダー */}


      <main className="mx-auto max-w-7xl space-y-14 px-5 py-10">
        {searchTerm && (
          <section className="rounded-xl border border-purple-500 bg-zinc-900 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-bold">
                「{searchTerm}」の検索結果：{searchResults.length}件
              </h2>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setQuery("");
                }}
                className="text-sm text-purple-300"
              >
                クリア
              </button>
            </div>
            {searchResults.length > 0 ? (
              <VideoSection title="検索結果" items={searchResults} />
            ) : (
              <p className="text-sm text-zinc-400">
                該当するサンプル作品がありません。
              </p>
            )}
          </section>
        )}


        <p className="text-center text-sm text-zinc-300">
          🎬 動画全{" "}
          <span className="text-lg font-bold text-purple-300">
            {totalWorks.toLocaleString()}
          </span>{" "}
          件（VR含む）を掲載中
        </p>

        {/* メインスライダー */}
        <section className="rounded-2xl bg-gradient-to-r from-purple-950 via-purple-800 to-fuchsia-950 p-12">
          <p className="mb-4 text-sm text-purple-200">
            VISTELQ SPECIAL
          </p>

          <h2 className="text-4xl font-black">
            {slides[slide].title}
          </h2>

          <p className="mt-5 text-purple-100">
            {slides[slide].description}
          </p>

          <p className="mt-3 text-sm">
            無料会員登録なしでも視聴いただけます。
          </p>

          <div className="mt-10 flex gap-3">
            {slides.map((item, index) => (
              <button
                key={index}
                onClick={() => setSlide(index)}
                className={`h-3 rounded-full ${
                  slide === index
                    ? "w-10 bg-white"
                    : "w-5 bg-white/40"
                }`}
              />
            ))}
          </div>
        </section>

        {/* NTR特集 */}
        <section className="rounded-xl bg-gradient-to-r from-zinc-900 to-purple-950 p-8">
          <p className="text-sm text-purple-300">
            SPECIAL FEATURE
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            NTRプレイ特集
          </h2>

          <p className="mt-3 text-zinc-300">
            人気ジャンルの注目作品をチェック！
          </p>
        </section>


        {/* カテゴリ：横スライダーバナー */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {t.categories}
            </h2>
            <span className="text-sm text-purple-300">
              横にスライド →
            </span>
          </div>

          <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-5">
            {categories.map((category) => (
              <button
                key={category.name}
                type="button"
                onClick={() => {
                  const routes = {
                    "動画": "/videos",
                    "VR動画": "/videos/vr",
                    "女優": "/actresses",
                    "グッズ": "/goods",
                    "漫画": "/comics",
                  };
                  window.location.href = routes[category.name];
                }}
                className={`group relative flex min-h-52 w-[78%] shrink-0 snap-start flex-col items-center justify-center overflow-hidden rounded-2xl border p-6 text-center transition-all sm:w-[45%] lg:w-[30%] ${
                  selectedCategory === category.name
                    ? "border-purple-300 bg-gradient-to-br from-purple-700 via-purple-900 to-fuchsia-950"
                    : "border-white/10 bg-gradient-to-br from-zinc-800 via-purple-950 to-zinc-950 hover:border-purple-400"
                }`}
              >
                <span className="mb-4 text-6xl transition-transform group-hover:scale-110">
                  {category.icon}
                </span>

                <h3 className="text-2xl font-black">
                  {category.name}
                </h3>

                <p className="mt-3 text-sm text-purple-200">
                  {category.description}
                </p>

                <span className="mt-5 rounded-full border border-purple-400/50 px-5 py-2 text-xs font-bold">
                  詳しく見る →
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* カテゴリ検索結果 */}
        {selectedCategory && (
          <section className="space-y-5 rounded-xl border border-purple-500/40 bg-zinc-950 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedCategory} の作品一覧
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  {categoryVideos.length}件のサンプル作品（デモ用の仮分類）
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="rounded-lg border border-purple-500 px-4 py-2 text-sm text-purple-200"
              >
                閉じる ✕
              </button>
            </div>

            {categoryVideos.length > 0 ? (
              <VideoSection title="該当作品" items={categoryVideos} />
            ) : (
              <p className="text-sm text-zinc-400">
                このカテゴリの専用ページは現在準備中です。
              </p>
            )}
          </section>
        )}

        {/* 人気ランキング */}
        <VideoSection
          title={t.ranking}
          items={videos}
          ranking
        />

        {/* 最近視聴 */}
        {recentVideos.length > 0 ? (
          <VideoSection title={t.recent} items={recentVideos} slider />
        ) : (
          <section className="space-y-5">
            <h2 className="text-2xl font-bold">{t.recent}</h2>
            <p className="text-sm text-zinc-400">
              作品詳細ページを開くと、ここに履歴が表示されます。
            </p>
          </section>
        )}

        {/* 本日のアクセスTOP10 */}
        <VideoSection
          title={t.top10}
          items={videos}
          slider
        />

        {/* vistelq-doujin-section */}
        {/* 同人動画 */}
        <VideoSection
          title="同人動画"
          items={videos.slice(0, 10)}
          slider
        />

        {/* 複数プレイ */}
        <VideoSection
          title={t.multi}
          items={videos.slice(3, 8)}
          slider
        />

        {/* vistelq-vr-section */}
        {/* VR動画 */}
        <VideoSection
          title="VR動画"
          items={videos.filter((video) =>
            (demoCategoryIds["VR動画"] || []).includes(String(video.id))
          )}
          slider
        />

        {/* 人気ジャンル */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">
            {t.genres}
          </h2>

          <div className="flex flex-wrap gap-3">
            {genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-purple-950 px-6 py-3"
              >
                #{genre}
              </span>
            ))}
          </div>
        </section>


        {/* VR商品購入コーナー */}
        <section className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-bold text-purple-400">
              VR SHOPPING
            </p>
            <h2 className="text-2xl font-bold">
              {t.vrshop}
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              VR動画をもっと楽しむための対応機器をチェック！
              新品・中古から自分に合ったVRヘッドセットを探せます。
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                name: "Meta Quest",
                description: "手軽に楽しめる人気のVRヘッドセット",
                icon: "🥽",
                keyword: "Meta Quest VR",
              },
              {
                name: "PICO",
                description: "動画視聴にも使えるVRヘッドセット",
                icon: "🥽",
                keyword: "PICO VR",
              },
              {
                name: "PC VR",
                description: "PC接続型の高性能VR機器",
                icon: "🖥️",
                keyword: "PC VR ヘッドセット",
              },
              {
                name: "中古VR機器",
                description: "価格を抑えてVRを始めたい方へ",
                icon: "♻️",
                keyword: "中古 VR ヘッドセット",
              },
            ].map((item) => (
              <article
                key={item.name}
                className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900"
              >
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-purple-950 to-zinc-800 text-6xl">
                  {item.icon}
                </div>

                <div className="space-y-4 p-5">
                  <h3 className="text-lg font-bold">{item.name}</h3>

                  <p className="min-h-12 text-sm text-zinc-400">
                    {item.description}
                  </p>

                  <a
                    href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.keyword + " 新品")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg bg-purple-600 px-4 py-3 text-center text-sm font-bold hover:bg-purple-500"
                  >
                    新品を探す ↗
                  </a>

                  <a
                    href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.keyword + " 中古")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-purple-500 px-4 py-3 text-center text-sm font-bold hover:bg-purple-950"
                  >
                    中古を探す ↗
                  </a>
                </div>
              </article>
            ))}
          </div>

          <p className="text-xs text-zinc-500">
            ※リンク先は外部の商品検索ページです。
            機器によって対応する動画形式や視聴方法が異なります。
          </p>
        </section>

        {/* VR機器 */}
        <section className="rounded-xl bg-zinc-900 p-8">
          <h2 className="text-2xl font-bold">
            VR動画を楽しむために
          </h2>

          <p className="mt-3 text-zinc-300">
            VR機器の新品・中古購入ページへのリンクを追加予定。
          </p>
        </section>

      </main>

      <footer className="mt-20 border-t border-white/10 p-8 text-center text-sm text-zinc-500">
        © VISTELQ
      </footer>
    </div>
  );
}