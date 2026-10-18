"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n";
import { allGenres } from "@/data/genres";

const catKeys = {
  popular: "cat_popular",
  today: "cat_today",
  recent: "cat_recent",
  latest: "cat_latest",
  new: "cat_new",
  "semi-new": "cat_semi",
  preorder: "cat_preorder",
  under300: "cat_under300",
};

const genreOptions = ["すべて", ...allGenres];


const workCategories = [
  { id: "popular", label: "人気順" },
  { id: "today", label: "本日の新入荷" },
  { id: "recent", label: "新着順" },
  { id: "latest", label: "最新作" },
  { id: "new", label: "新作" },
  { id: "semi-new", label: "準新作" },
  { id: "preorder", label: "予約商品" },
  { id: "under300", label: "300円以下商品" },
];

function VideoSearchContent({ mode }) {
  const { t } = useT();
  const searchParams = useSearchParams();
  const initialGenre = searchParams.get("genre") || "すべて";

  const urlCategory = searchParams.get("category") || "";
  const validCategories = workCategories.map((item) => item.id);
  const initialCategory =
    (mode === "new" || mode === "vr-new")
      ? "new"
      : (mode === "semi-new" || mode === "vr-semi-new")
        ? "semi-new"
        : validCategories.includes(urlCategory)
          ? urlCategory
          : "popular";

  const [category, setCategory] = useState(initialCategory);
  const [today, setToday] = useState(null);

  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  const urlKeyword = searchParams.get("keyword") || "";
  const [keyword, setKeyword] = useState(urlKeyword);
  const [asp, setAsp] = useState("all");
  const [genre, setGenre] = useState(initialGenre);
  const [actress, setActress] = useState(searchParams.get("actress") || "");
  const [maker, setMaker] = useState("");
  const [releaseFrom, setReleaseFrom] = useState("");
  const [releaseTo, setReleaseTo] = useState("");
  const [sort, setSort] = useState(
    ["recent", "latest"].includes(initialCategory) ? "new" : "popular"
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  // ヘッダーの検索ボックスから来たキーワード（?keyword=）を反映する
  useEffect(() => {
    setKeyword(urlKeyword);
    setPage(1);
  }, [urlKeyword]);

  // 条件に合う作品を、サーバー(DB)から「そのページ分だけ」取得する
  const [result, setResult] = useState({ works: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({
        mode,
        keyword,
        asp,
        genre,
        actress,
        from: releaseFrom,
        to: releaseTo,
        category: mode === "search" || mode === "vr" ? category : "",
        sort,
        page: String(page),
        pageSize: String(pageSize),
      });
      setLoading(true);
      try {
        const res = await fetch(`/api/works?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        setResult({ works: data.works || [], total: data.total || 0 });
        setFailed(false);
      } catch (error) {
        if (error?.name !== "AbortError") setFailed(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [mode, keyword, asp, genre, actress, releaseFrom, releaseTo, category, sort, page, pageSize]);

  const totalCount = result.total;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleWorks = result.works;

  const resetPage = () => setPage(1);

  const resetFilters = () => {
    setKeyword("");
    setAsp("all");
    setGenre("すべて");
    setActress("");
    setMaker("");
    setReleaseFrom("");
    setReleaseTo("");
    setSort("popular");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#09090e] text-white">
      

      <main className="mx-auto max-w-7xl space-y-10 px-5 py-10">
        <section>
          <p className="mb-2 text-sm font-bold text-purple-400">
            {mode === "new"
              ? "NEW RELEASE"
              : mode === "semi-new"
                ? "SEMI-NEW RELEASE"
                : "ADVANCED SEARCH"}
          </p>

          <h1 className="text-3xl font-black">
            {mode === "vr-new"
              ? "新作VR動画一覧"
              : mode === "vr-semi-new"
                ? "準新作VR動画一覧"
                : mode === "new"
                  ? "新作AV一覧"
              : mode === "semi-new"
                ? "準新作AV一覧"
                : mode === "vr"
                ? "VR動画の詳細検索"
                : "動画作品の詳細検索"}
          </h1>

          <p className="mt-3 text-sm text-zinc-400">
            {mode === "vr-new"
              ? "発売から30日以内のVR作品を検索できます。"
              : mode === "vr-semi-new"
                ? "発売から31〜90日のVR作品を検索できます。"
                : mode === "new"
                  ? "発売から30日以内の作品を検索できます。"
              : mode === "semi-new"
                ? "発売から31〜90日の作品を検索できます。"
                : mode === "vr"
                ? "VR作品を複数の条件で検索できます。"
                : "複数の条件を組み合わせて作品を検索できます。"}
          </p>
        </section>


        <section className="space-y-5">
          <h2 className="text-2xl font-bold">{t("categories")}</h2>

          <div className="flex gap-3 overflow-x-auto pb-3">
            {workCategories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (mode === "search" || mode === "vr") {
                    setCategory(item.id);
                    setSort(["recent", "latest"].includes(item.id) ? "new" : "popular");
                    setPage(1);
                  }
                }}
                className={`shrink-0 rounded-full border px-5 py-3 text-sm font-bold transition ${
                  category === item.id
                    ? "border-purple-400 bg-purple-700 text-white"
                    : "border-white/10 bg-zinc-900 text-zinc-300 hover:border-purple-400"
                }`}
              >
                {t(catKeys[item.id])}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6 rounded-2xl border border-purple-500/30 bg-zinc-900 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold">{t("keyword")}</span>
              <input
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  resetPage();
                }}
                placeholder={t("keywordPh")}
                className="w-full rounded-lg bg-zinc-800 px-4 py-3 outline-none"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold">{t("asp")}</span>
              <select
                value={asp}
                onChange={(e) => {
                  setAsp(e.target.value);
                  resetPage();
                }}
                className="w-full rounded-lg bg-zinc-800 px-4 py-3"
              >
                <option value="all">{t("all")}</option>
                <option value="FANZA">FANZA</option>
                <option value="MGS">MGS</option>
                <option value="ADMAX">ADMAX</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold">{t("genre")}</span>
              <select
                value={genre}
                onChange={(e) => {
                  setGenre(e.target.value);
                  resetPage();
                }}
                className="w-full rounded-lg bg-zinc-800 px-4 py-3"
              >
                {genreOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold">{t("actress")}</span>
              <input
                value={actress}
                onChange={(e) => {
                  setActress(e.target.value);
                  resetPage();
                }}
                placeholder={t("actressPh")}
                className="w-full rounded-lg bg-zinc-800 px-4 py-3 outline-none"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold">{t("maker")}</span>
              <input
                value={maker}
                onChange={(e) => {
                  setMaker(e.target.value);
                  resetPage();
                }}
                placeholder={t("makerPh")}
                className="w-full rounded-lg bg-zinc-800 px-4 py-3 outline-none"
              />
            </label>

            <div className="space-y-2">
              <span className="text-sm font-bold">{t("releaseDate")}</span>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={releaseFrom}
                  onChange={(e) => {
                    setReleaseFrom(e.target.value);
                    resetPage();
                  }}
                  className="min-w-0 flex-1 rounded-lg bg-zinc-800 px-3 py-3 text-sm"
                />
                <span>〜</span>
                <input
                  type="date"
                  value={releaseTo}
                  onChange={(e) => {
                    setReleaseTo(e.target.value);
                    resetPage();
                  }}
                  className="min-w-0 flex-1 rounded-lg bg-zinc-800 px-3 py-3 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-purple-500 px-6 py-3 text-sm font-bold hover:bg-purple-950"
            >
              {t("clear")}
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{t("results")}</h2>
              <p className="mt-2 text-sm text-zinc-400">
                {loading ? t("searching") : t("count", { n: totalCount.toLocaleString() })}
              </p>
            </div>

            <div className="flex gap-3">
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  resetPage();
                }}
                className="rounded-lg border border-purple-500 bg-zinc-900 px-4 py-3 text-sm"
              >
                <option value="popular">{t("sortPopular")}</option>
                <option value="new">{t("sortNew")}</option>
                <option value="wishlist">{t("sortWishlist")}</option>
                <option value="price">{t("sortPrice")}</option>
                <option value="reviews">{t("sortReviews")}</option>
                <option value="rating">{t("sortRating")}</option>
              </select>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  resetPage();
                }}
                className="rounded-lg border border-purple-500 bg-zinc-900 px-4 py-3 text-sm"
              >
                <option value="30">{t("perPage", { n: 30 })}</option>
                <option value="60">{t("perPage", { n: 60 })}</option>
                <option value="120">{t("perPage", { n: 120 })}</option>
              </select>
            </div>
          </div>

          {visibleWorks.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
              {visibleWorks.map((work) => (
                <Link
                  key={work.id}
                  href={`/works/${work.id}`}
                  className="overflow-hidden rounded-xl bg-zinc-900 hover:ring-2 hover:ring-purple-500"
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
                      {work.asp}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-zinc-900 p-8 text-center text-zinc-400">
              {loading
                ? t("loading")
                : failed
                  ? t("loadFailed")
                  : t("noResult")}
            </p>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                className="rounded-lg bg-zinc-800 px-5 py-3 disabled:opacity-40"
              >
                {t("prev")}
              </button>

              <span className="text-sm">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="rounded-lg bg-zinc-800 px-5 py-3 disabled:opacity-40"
              >
                {t("next")}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}


export default function VideoCatalogPage({ mode = "search" }) {
  // vistelq-vr-search-mode
  const isVrMode = ["vr", "vr-new", "vr-semi-new"].includes(mode);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090e] p-10 text-white">
          検索ページを読み込み中...
        </div>
      }
    >
      <VideoSearchContent mode={mode} />
    </Suspense>
  );
}
