"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWorks } from "@/lib/works-context";

const STORAGE_KEY = "vistelq-favorites";

function readFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored.map(String) : [];
  } catch {
    return [];
  }
}

export default function FavoritesPage() {
  const works = useWorks();
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setFavoriteIds(readFavorites());
      setLoaded(true);
    };

    refresh();

    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const favoriteWorks = favoriteIds
    .map((id) => works.find((work) => String(work.id) === id))
    .filter(Boolean);

  const removeFavorite = (id) => {
    const next = favoriteIds.filter(
      (item) => item !== String(id)
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setFavoriteIds(next);
  };

  return (
    <main className="min-h-screen bg-[#09090e] px-5 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        <div className="mb-10">
          <p className="mb-2 text-sm font-bold text-purple-400">
            VISTELQ FAVORITES
          </p>

          <h1 className="text-3xl font-black md:text-4xl">
            ♡ お気に入り作品
          </h1>

          <p className="mt-3 text-sm text-zinc-400">
            保存したお気に入り作品をまとめて確認できます。
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            ログイン不要・このブラウザに保存されます。
          </p>
        </div>

        {!loaded ? (
          <div className="rounded-xl bg-zinc-900 p-10 text-center text-zinc-400">
            読み込み中...
          </div>
        ) : favoriteWorks.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-10 text-center">

            <div className="mb-5 text-5xl">♡</div>

            <h2 className="text-xl font-bold">
              お気に入り作品はまだありません
            </h2>

            <p className="mt-4 text-sm text-zinc-400">
              作品詳細ページからお気に入りに追加できます。
            </p>

            <Link
              href="/videos"
              className="mt-8 inline-block rounded-xl bg-purple-600 px-8 py-3 font-bold transition hover:bg-purple-500"
            >
              動画作品を探す →
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-zinc-400">
              {favoriteWorks.length}作品を保存中
            </p>

            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
              {favoriteWorks.map((work) => (
                <article
                  key={work.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 transition hover:border-purple-500"
                >
                  <Link href={`/works/${work.id}`}>
                    <div className="relative aspect-video overflow-hidden bg-zinc-800">
                      <img
                        src={work.thumbnail}
                        alt={work.title}
                        className="h-full w-full object-cover"
                      />

                      <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs">
                        {work.duration}
                      </span>
                    </div>
                  </Link>

                  <div className="space-y-3 p-4">
                    <span className="text-xs font-bold text-purple-300">
                      {work.asp}
                    </span>

                    <Link
                      href={`/works/${work.id}`}
                      className="block"
                    >
                      <h2 className="line-clamp-2 text-sm font-bold hover:text-purple-300">
                        {work.title}
                      </h2>
                    </Link>

                    <p className="text-xs text-zinc-400">
                      {work.actressName || work.actress}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeFavorite(work.id)}
                      className="w-full rounded-lg border border-red-500/40 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-950"
                    >
                      ♡ お気に入りを解除
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
