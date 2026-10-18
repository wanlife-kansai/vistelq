"use client";

import { popularGenres, genreGroups, allGenres } from "@/data/genres";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useWorks } from "@/lib/works-context";
import { matchesWorkSearch } from "@/lib/work-search";

const searchFields = [
  { value: "all", label: "すべて" },
  { value: "title", label: "作品名" },
  { value: "actress", label: "女優名" },
  { value: "maker", label: "メーカー名" },
  { value: "id", label: "品番" },
  { value: "genre", label: "ジャンル" },
];

const popularKeywords = [
  "新人",
  "VR",
  "ASMR",
  "独占配信",
  "人気作品",
  "女優名",
  "コスプレ",
  "NTR",
];

const genres = [
  "人気順",
  "本日の新入荷",
  "新着順",
  "最新作",
  "新作",
  "準新作",
  "予約商品",
  "300円以下商品",
];


function HorizontalSlider({ children, title, subtitle }) {
  const scrollRef = useRef(null);

  const move = (direction) => {
    if (!scrollRef.current) return;

    const card = scrollRef.current.firstElementChild;
    const distance = card
      ? card.getBoundingClientRect().width + 20
      : 300;

    scrollRef.current.scrollBy({
      left: distance * direction,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label={`${title}を左へ`}
            className="rounded-full border border-purple-500 px-4 py-2 hover:bg-purple-900"
          >
            ❮
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label={`${title}を右へ`}
            className="rounded-full border border-purple-500 px-4 py-2 hover:bg-purple-900"
          >
            ❯
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-5"
      >
        {children}
      </div>
    </section>
  );
}

export default function VideosPage({ mode = "normal", actressImages = {} }) {
  const works = useWorks();
  const isVr = mode === "vr";
  const pageWorks = isVr
    ? works.filter((work) => work.contentType === "vr")
    : works;
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [field, setField] = useState("all");
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [genre, setGenre] = useState("人気順");
  const [sort, setSort] = useState("popular");

  const filteredWorks = useMemo(() => {
    const query = keyword.trim().toLowerCase();

    const result = pageWorks.filter((work) => {
      const fields = {
        title: work.title || "",
        actress: work.actressName || "",
        maker: work.maker || "",
        id: work.productId || work.id || "",
        genre: Array.isArray(work.genres)
          ? work.genres.join(" ")
          : "",
      };

      const target =
        field === "all"
          ? Object.values(fields).join(" ")
          : fields[field] || "";

      const matchesKeyword =
        field === "all"
          ? matchesWorkSearch(work, keyword)
          : !query || target.toLowerCase().includes(query);

      const workGenres = Array.isArray(work.genres)
        ? work.genres
        : [];

      const matchesGenre =
        genre === "すべて" ||
        genre === "人気順" ||
        workGenres.includes(genre);

      return matchesKeyword && matchesGenre;
    });

    if (sort === "popular") {
      result.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    if (sort === "new") {
      result.sort((a, b) =>
        String(b.releaseDate || "").localeCompare(
          String(a.releaseDate || "")
        )
      );
    }

    return result;
  }, [field, keyword, genre, sort]);


  // 発売日による分類（デモ用）
  const [today, setToday] = useState(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const getAgeDays = (work) => {
    if (!today || !work.releaseDate) return null;

    const released = new Date(work.releaseDate + "T00:00:00");
    if (Number.isNaN(released.getTime())) return null;

    return Math.floor(
      (today.getTime() - released.getTime()) / 86400000
    );
  };

  const newWorks = pageWorks.filter((work) => {
    const days = getAgeDays(work);
    return days !== null && days >= 0 && days <= 30;
  });

  const semiNewWorks = pageWorks.filter((work) => {
    const days = getAgeDays(work);
    return days !== null && days >= 31 && days <= 90;
  });

  // 女優ごとに出演作品数・閲覧数を集計
  const actressMap = new Map();

  for (const work of pageWorks) {
    const name = work.actressName || work.actress;
    if (!name) continue;

    const current = actressMap.get(name) || {
      name,
      slug: work.actressList?.[0]?.slug || "",
      count: 0,
      views: 0,
    };

    current.count += 1;
    current.views += work.views || 0;
    actressMap.set(name, current);
  }

  const popularActresses = [...actressMap.values()]
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);


  const genreSuggestions = useMemo(() => {
    const query = input.trim().toLowerCase();

    if (!query) return [];

    return allGenres
      .filter((name) => name.toLowerCase().includes(query))
      .slice(0, 10);
  }, [input]);

  const selectGenreSuggestion = (name) => {
    setField("genre");
    setInput(name);
    setKeyword(name);
    setGenre("すべて");
    setShowSuggestions(false);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setKeyword(input);
    setShowSuggestions(false);
  };

  const selectKeyword = (value) => {
    setField("all");
    setInput(value);
    setKeyword(value);
  };

  return (
    <div className="min-h-screen bg-[#09090e] text-white">
      

      <main className="mx-auto max-w-7xl space-y-12 px-5 py-10">
        <section className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-bold text-purple-400">
              {isVr ? "VR VIDEO SEARCH" : "VIDEO SEARCH"}
            </p>
            <h1 className="text-3xl font-black md:text-4xl">
              {isVr ? "VR動画を探す" : "動画作品を探す"}
            </h1>
            <p className="mt-3 text-sm text-zinc-400">
              作品名・女優名・メーカー名・キーワードから検索
            </p>
          </div>

          <div className="relative">
          <form
            onSubmit={submitSearch}
            className="flex overflow-hidden rounded-2xl border border-purple-500/50 bg-white shadow-lg shadow-purple-900/20"
          >
            <select
              value={field}
              onChange={(event) => setField(event.target.value)}
              className="w-28 shrink-0 border-r border-zinc-200 bg-white px-3 py-4 text-sm text-zinc-800 outline-none md:w-36"
            >
              {searchFields.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <input
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="作品名・女優名・メーカー名・ジャンル・キーワードで検索"
              className="min-w-0 flex-1 px-4 py-4 text-sm text-zinc-900 outline-none"
            />

            <button
              type="submit"
              aria-label="検索"
              className="bg-gradient-to-r from-purple-600 to-pink-500 px-6 text-2xl text-white hover:from-purple-500 hover:to-pink-400"
            >
              🔍
            </button>
          </form>

          {showSuggestions && genreSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-purple-500/40 bg-zinc-900 shadow-2xl">
              <div className="border-b border-white/10 px-4 py-3 text-xs font-bold text-purple-300">
                ジャンル候補
              </div>

              {genreSuggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => selectGenreSuggestion(name)}
                  className="block w-full px-5 py-3 text-left text-sm text-white hover:bg-purple-900"
                >
                  🔍 {name}
                </button>
              ))}
            </div>
          )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-bold text-pink-400">
              人気の検索ワード
            </span>

            {popularKeywords.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => selectKeyword(word)}
                className="rounded-full border border-white/20 bg-zinc-900 px-4 py-2 text-xs hover:border-purple-400 hover:bg-purple-950"
              >
                {word}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-bold">
            カテゴリから探す
          </h2>

          <div className="flex flex-wrap gap-3">
            {genres.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setGenre(item)}
                aria-pressed={genre === item}
                className={`rounded-full border px-5 py-3 text-sm transition ${
                  genre === item
                    ? "border-purple-400 bg-purple-700 text-white"
                    : "border-white/10 bg-zinc-900 text-zinc-300 hover:border-purple-400"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>



        {/* ジャンルから探す */}
        <section className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">
              ジャンルから探す
            </h2>

            <button
              type="button"
              onClick={() => setShowAllGenres(!showAllGenres)}
              className="rounded-full border border-purple-500 px-5 py-2 text-sm font-bold text-purple-200 hover:bg-purple-900"
            >
              {showAllGenres ? "閉じる ↑" : "すべて見る →"}
            </button>
          </div>

          {!showAllGenres ? (
            <div className="overflow-hidden">
              <div
                className="flex max-h-[100px] flex-wrap gap-2 overflow-hidden"
              >
                {popularGenres.map((name) => (
                  <Link
                    key={name}
                    href={`${isVr ? "/videos/vr/search" : "/videos/search"}?genre=${encodeURIComponent(name)}`}
                    className="shrink-0 rounded-full border border-white/15 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:border-purple-400 hover:bg-purple-950"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8 rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
              {Object.entries(genreGroups).map(([group, names]) => (
                <div key={group} className="space-y-4">
                  <h3 className="border-b border-purple-500/30 pb-3 text-lg font-bold text-purple-300">
                    {group}
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {names.map((name) => (
                      <Link
                        key={name}
                        href={`${isVr ? "/videos/vr/search" : "/videos/search"}?genre=${encodeURIComponent(name)}`}
                        className="rounded-full border border-white/15 bg-zinc-950 px-4 py-2 text-sm text-zinc-200 hover:border-purple-400 hover:bg-purple-950"
                      >
                        {name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 新作・準新作・人気女優 */}
        {[
          {
            title: isVr ? "新作VR動画一覧" : "新作AV一覧",
            subtitle: "発売から30日以内の作品",
            items: newWorks,
          },
          {
            title: isVr ? "準新作VR動画一覧" : "準新作AV一覧",
            subtitle: "発売31〜90日の作品",
            items: semiNewWorks,
          },
        ].map((section) => (
          <section key={section.title} className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">{section.title}</h2>
                <Link
                  href={
                    section.title.includes("新作") && !section.title.includes("準新作")
                      ? (isVr ? "/videos/vr/new" : "/videos/new")
                      : (isVr ? "/videos/vr/semi-new" : "/videos/semi-new")
                  }
                  className="rounded-full border border-purple-500 px-5 py-2 text-sm font-bold text-purple-200 transition hover:bg-purple-900"
                >
                  すべて見る →
                </Link>
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                {section.subtitle}
              </p>
            </div>

            {section.items.length > 0 ? (
              <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-5">
                {section.items.map((work) => (
                  <Link
                    key={work.id}
                    href={`/works/${work.id}`}
                    className="w-[75%] shrink-0 snap-start overflow-hidden rounded-xl bg-zinc-900 hover:ring-2 hover:ring-purple-500 sm:w-[42%] lg:w-[23%]"
                  >
                    <img
                      src={work.thumbnail}
                      alt={work.title}
                      className="aspect-video w-full object-cover"
                    />
                    <div className="space-y-2 p-4">
                      <h3 className="text-sm font-bold">{work.title}</h3>
                      <p className="text-xs text-purple-300">
                        {work.actressName || work.actress}
                      </p>
                      <p className="text-xs text-zinc-400">
                        発売日：{work.releaseDate}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-zinc-900 p-6 text-sm text-zinc-400">
                現在、該当作品はありません。
              </p>
            )}
          </section>
        ))}

        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">
              {isVr ? "人気VR出演女優" : "人気AV女優（あ行から）"}
            </h2>
            <Link
              href="/actresses"
              className="rounded-full border border-purple-500 px-5 py-2 text-sm font-bold text-purple-200 transition hover:bg-purple-900"
            >
              すべて見る →
            </Link>
          </div>
          <p className="text-sm text-zinc-400">
            出演作品の閲覧数をもとにしたサンプルランキング
          </p>

          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-5">
            {popularActresses.map((actress, index) => (
              <button
                key={actress.name}
                type="button"
                onClick={() => {
                  setField("actress");
                  setInput(actress.name);
                  setKeyword(actress.name);
                  setGenre("すべて");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-[65%] shrink-0 snap-start rounded-xl border border-white/10 bg-zinc-900 p-6 text-left hover:border-purple-400 sm:w-[35%] lg:w-[18%]"
              >
                <div className="relative mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-purple-900 to-zinc-800 text-5xl">
                  👤
                  {actressImages[actress.slug] && (
                    <img
                      src={actressImages[actress.slug]}
                      alt={actress.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
                <p className="text-xs text-yellow-400">
                  {index + 1}位
                </p>
                <h3 className="mt-2 font-bold">{actress.name}</h3>
                <p className="mt-2 text-xs text-zinc-400">
                  出演作品：{actress.count}件
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="text-2xl font-bold">
                  作品一覧
                </h2>
                <Link
                  href={isVr ? "/videos/vr/search" : "/videos/search"}
                  className="rounded-full border border-purple-500 px-5 py-2 text-sm font-bold text-purple-200 transition hover:bg-purple-900"
                >
                  すべて見る →
                </Link>
                <Link
                  href={isVr ? "/videos/vr/search" : "/videos/search"}
                  className="rounded-lg border border-purple-500 bg-purple-900/40 px-5 py-2 text-sm font-bold text-purple-100 hover:bg-purple-800"
                >
                  🔍 詳細検索を開く →
                </Link>
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                {filteredWorks.length}件の作品
              </p>
            </div>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-lg border border-purple-500 bg-zinc-900 px-5 py-3 text-sm"
            >
              <option value="popular">人気順</option>
              <option value="new">新着順</option>
            </select>
          </div>

          {filteredWorks.length > 0 ? (
            <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-5">
              {filteredWorks.map((work) => (
                <Link
                  key={work.id}
                  href={`/works/${work.id}`}
                  className="w-[75%] shrink-0 snap-start overflow-hidden rounded-xl bg-zinc-900 transition hover:ring-2 hover:ring-purple-500 sm:w-[42%] lg:w-[23%]"
                >
                  <div className="relative aspect-video bg-gradient-to-br from-purple-900 to-zinc-800">
                    <img
                      src={work.thumbnail}
                      alt={work.title}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs">
                      {work.duration}
                    </span>
                  </div>

                  <div className="space-y-3 p-4">
                    <h3 className="text-sm font-bold">
                      {work.title}
                    </h3>

                    <span className="inline-block rounded bg-purple-950 px-3 py-1 text-xs text-purple-200">
                      {work.asp}
                    </span>

                    <p className="text-xs text-zinc-400">
                      閲覧数：
                      {(work.views || 0).toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-zinc-900 p-10 text-center">
              <p className="text-zinc-300">
                該当する作品がありません。
              </p>
              <p className="mt-3 text-sm text-zinc-500">
                現在はサンプルデータで検索機能を確認しています。
              </p>
              <button
                type="button"
                onClick={() => {
                  setField("all");
                  setInput("");
                  setKeyword("");
                  setGenre("すべて");
                }}
                className="mt-6 rounded-lg bg-purple-600 px-6 py-3 text-sm font-bold"
              >
                検索条件をクリア
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
