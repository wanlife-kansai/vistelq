"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorks } from "@/lib/works-context";

// 作品IDの一覧から作品を取り出す（お気に入り・最近見た作品用）。
// 読み込み済みの作品はそれを使い、足りない分だけサーバーから取得する。
export function useWorksByIds(ids) {
  const works = useWorks();
  const [fetched, setFetched] = useState({});
  const key = ids.join(",");

  const known = useMemo(
    () => new Map(works.map((work) => [String(work.id), work])),
    [works]
  );

  useEffect(() => {
    const missing = ids.filter((id) => !known.has(id) && !(id in fetched));
    if (missing.length === 0) return;

    const controller = new AbortController();
    fetch(`/api/works?ids=${encodeURIComponent(missing.slice(0, 50).join(","))}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : { works: [] }))
      .then((data) => {
        const next = {};
        for (const id of missing) next[id] = null;
        for (const work of data.works || []) next[String(work.id)] = work;
        setFetched((current) => ({ ...current, ...next }));
      })
      .catch(() => {});

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, known]);

  return useMemo(
    () => ids.map((id) => known.get(id) || fetched[id]).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, known, fetched]
  );
}
