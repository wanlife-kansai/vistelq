"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useWorks } from "@/lib/works-context";

const rankingTabs = [
  { id: "daily", label: "本日の人気" },
  { id: "weekly", label: "週間人気" },
  { id: "monthly", label: "月間人気" },
  { id: "FANZA", label: "FANZA" },
  { id: "MGS", label: "MGS" },
  { id: "ADMAX", label: "ADMAX" },
];

export default function RankingsPage() {
  const works = useWorks();
  const [activeTab, setActiveTab] = useState("daily");

  const rankedWorks = useMemo(() => {
    const result = [...works];

    if (["FANZA", "MGS", "ADMAX"].includes(activeTab)) {
      return result
        .filter((work) => work.asp === activeTab)
        .sort((a, b) => b.views - a.views);
    }

    if (activeTab === "weekly") {
      return result.sort(
        (a, b) =>
          ((b.views * 7) % 10000) -
          ((a.views * 7) % 10000)
      );
    }

    if (activeTab === "monthly") {
      return result.sort(
        (a, b) =>
          ((b.views * 13) % 10000) -
          ((a.views * 13) % 10000)
      );
    }

    return result.sort((a, b) => b.views - a.views);
  }, [activeTab]);

  return (
    <main className="min-h-screen bg-[#09090e] px-5 py-10 text-white">
      <div className="mx-auto max-w-7xl space-y-10">

        <section>
          <p className="mb-2 text-sm font-bold text-purple-400">
            VISTELQ RANKING
          </p>

          <h1 className="text-3xl font-black md:text-4xl">
            人気AVランキング
          </h1>

          <p className="mt-3 text-sm text-zinc-400">
            人気作品をランキング形式でご紹介します。
          </p>
          <p className="mt-2 text-xs text-amber-300">
            現在は開発用サンプルデータによるデモランキングです。
          </p>
        </section>

        <section className="flex gap-3 overflow-x-auto pb-3">
          {rankingTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-full border px-5 py-3 text-sm font-bold transition ${
                activeTab === tab.id
                  ? "border-purple-400 bg-purple-700 text-white"
                  : "border-white/10 bg-zinc-900 text-zinc-300 hover:border-purple-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {rankingTabs.find((tab) => tab.id === activeTab)?.label}
              ランキング
            </h2>

            <span className="text-sm text-zinc-400">
              {rankedWorks.length}作品
            </span>
          </div>

          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {rankedWorks.map((work, index) => (
              <Link
                key={work.id}
                href={`/works/${work.id}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 transition hover:border-purple-500"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={work.thumbnail}
                    alt={work.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />

                  <span
                    className={`absolute left-3 top-3 rounded-lg px-3 py-2 text-sm font-black ${
                      index === 0
                        ? "bg-yellow-400 text-black"
                        : index === 1
                          ? "bg-zinc-300 text-black"
                          : index === 2
                            ? "bg-amber-700 text-white"
                            : "bg-purple-700 text-white"
                    }`}
                  >
                    {index + 1}位
                  </span>
                </div>

                <div className="space-y-3 p-4">
                  <span className="text-xs font-bold text-purple-300">
                    {work.asp}
                  </span>

                  <h3 className="line-clamp-2 text-sm font-bold">
                    {work.title}
                  </h3>

                  <p className="text-xs text-zinc-400">
                    {work.actressName || work.actress}
                  </p>

                  <p className="text-xs text-zinc-500">
                    {Number(work.views || 0).toLocaleString()}回閲覧
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {rankedWorks.length === 0 && (
            <div className="rounded-xl bg-zinc-900 p-10 text-center text-zinc-400">
              該当する作品がありません。
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
