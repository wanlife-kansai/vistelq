import "server-only";
import { getWorks } from "@/lib/works-db";
import { getActressList, getGenreList } from "@/lib/work-relations";

export const HUB_PAGE_SIZE = 24;

const config = {
  actress: { getList: getActressList, base: "/actresses", label: "出演女優" },
  genre: { getList: getGenreList, base: "/genres", label: "ジャンル" },
};

export function hubBase(kind) {
  return config[kind].base;
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parsePage(value) {
  const page = Number.parseInt(Array.isArray(value) ? value[0] : value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

// 女優／ジャンルに紐づく作品を新しい順で返す
export async function loadHub(kind, rawSlug) {
  const { getList } = config[kind];
  const slug = safeDecode(rawSlug);
  const works = await getWorks();

  let name = null;
  let matchedSlug = null;
  const matched = works.filter((work) =>
    getList(work).some((item) => {
      const hit = item.slug === slug || item.slug === rawSlug;
      if (hit && !name) {
        name = item.name;
        matchedSlug = item.slug;
      }
      return hit;
    })
  );

  matched.sort((a, b) =>
    String(b.releaseDate || "").localeCompare(String(a.releaseDate || ""))
  );

  return { slug: matchedSlug ?? slug, name, works: matched };
}

// 事前生成する（ビルド時に作っておく）スラッグ
export async function hubSlugs(kind, limit = 50) {
  const { getList } = config[kind];
  const counts = new Map();

  for (const work of await getWorks()) {
    for (const item of getList(work)) {
      counts.set(item.slug, (counts.get(item.slug) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug]) => slug);
}
