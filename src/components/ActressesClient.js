"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useWorks } from "@/lib/works-context";
import { actressHref, getActressList } from "@/lib/work-relations";

const PAGE_SIZE = 60;

const groups = [
  { label: "あ行", chars: "あいうえおアイウエオ" },
  { label: "か行", chars: "かきくけこカキクケコがぎぐげごガギグゲゴ" },
  { label: "さ行", chars: "さしすせそサシスセソざじずぜぞザジズゼゾ" },
  { label: "た行", chars: "たちつてとタチツテトだぢづでどダヂヅデド" },
  { label: "な行", chars: "なにぬねのナニヌネノ" },
  { label: "は行", chars: "はひふへほハヒフヘホばびぶべぼバビブベボぱぴぷぺぽパピプペポ" },
  { label: "ま行", chars: "まみむめもマミムメモ" },
  { label: "や行", chars: "やゆよヤユヨ" },
  { label: "ら行", chars: "らりるれろラリルレロ" },
  { label: "わ行", chars: "わをんワヲン" },
];

export default function ActressesClient({ directory = [] }) {
  const works = useWorks();
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [group, setGroup] = useState("すべて");
  const [sort, setSort] = useState("popular");

  const actresses = useMemo(() => {
    const map = new Map();

    // DBで集計した一覧があればそれを使う（なければ、読み込み済みの作品から集計）
    for (const item of directory) {
      map.set(item.slug, { ...item });
    }

    for (const work of directory.length > 0 ? [] : works) {
      for (const person of getActressList(work)) {
        // 「出演者未登録」は女優として一覧に出さない
        if (person.name === "出演者未登録" || person.slug === "unknown") continue;

        const item = map.get(person.slug) || {
          name: person.name,
          slug: person.slug,
          count: 0,
          views: 0,
        };

        item.count++;
        item.views += work.views || 0;
        map.set(person.slug, item);
      }
    }

    let result = [...map.values()];

    if (group !== "すべて") {
      const selected = groups.find((item) => item.label === group);

      result = result.filter((item) =>
        selected?.chars.includes(item.name.charAt(0))
      );
    }

    if (sort === "popular") {
      result.sort((a, b) => b.views - a.views);
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name, "ja"));
    }

    return result;
  }, [works, directory, group, sort]);

  const shown = actresses.slice(0, limit);

  return (
    <main className="min-h-screen bg-[#09090e] px-5 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link href="/videos" className="text-purple-300">
          ← 動画トップへ戻る
        </Link>

        <h1 className="text-3xl font-black">AV女優一覧</h1>

        <div className="flex flex-wrap gap-2">
          {["すべて", ...groups.map((item) => item.label)].map((name) => (
            <button
              key={name}
              onClick={() => {
                setGroup(name);
                setLimit(PAGE_SIZE);
              }}
              className={`rounded-full px-4 py-2 text-sm ${
                group === name
                  ? "bg-purple-600"
                  : "bg-zinc-800 hover:bg-purple-900"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            setLimit(PAGE_SIZE);
          }}
          className="rounded-lg bg-zinc-800 px-5 py-3"
        >
          <option value="popular">人気順</option>
          <option value="name">五十音順</option>
        </select>

        {actresses.length === 0 ? (
          <p className="rounded-xl bg-zinc-900 p-8 text-zinc-400">
            該当する女優がいません。
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {shown.map((actress) => (
              <Link
                key={actress.slug}
                href={
                  actress.slug
                    ? actressHref(actress.slug)
                    : `/videos/search?keyword=${encodeURIComponent(actress.name)}`
                }
                className="rounded-xl bg-zinc-900 p-5 hover:ring-2 hover:ring-purple-500"
              >
                <div className="relative mb-4 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-purple-950 text-5xl">
                  <span aria-hidden="true">👤</span>
                  {actress.imageUrl && (
                    <img
                      src={actress.imageUrl}
                      alt={actress.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>

                <h2 className="font-bold">{actress.name}</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  出演作品：{actress.count}件
                </p>
              </Link>
            ))}
          </div>
        )}

        {actresses.length > shown.length && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setLimit((current) => current + PAGE_SIZE)}
              className="rounded-lg border border-purple-500 px-8 py-3 text-sm font-bold hover:bg-purple-950"
            >
              もっと見る（{shown.length} / {actresses.length}人）
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
