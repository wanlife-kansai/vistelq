"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWorks } from "@/lib/works-context";

export default function ReleaseWorksPage({ title, minDays, maxDays }) {
  const works = useWorks();
  const [today, setToday] = useState(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const items = today
    ? works.filter((work) => {
        if (!work.releaseDate) return false;

        const released = new Date(`${work.releaseDate}T00:00:00`);
        const days = Math.floor(
          (today.getTime() - released.getTime()) / 86400000
        );

        return days >= minDays && days <= maxDays;
      })
    : [];

  return (
    <main className="min-h-screen bg-[#09090e] px-5 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <Link href="/videos" className="text-purple-300">
          ← 動画トップへ戻る
        </Link>

        <h1 className="mb-8 mt-8 text-3xl font-black">{title}</h1>

        {!today ? (
          <p className="text-zinc-400">読み込み中...</p>
        ) : items.length === 0 ? (
          <p className="text-zinc-400">該当作品はありません。</p>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {items.map((work) => (
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
                  <h2 className="text-sm font-bold">{work.title}</h2>
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
        )}
      </div>
    </main>
  );
}
