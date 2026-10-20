import "server-only";
import { cacheLife } from "next/cache";
import { getFeaturedWorks, mapWorkRow, WORK_COLUMNS } from "@/lib/works-db";
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

const HUB_MAX_WORKS = 1000;

function readableSlug(row) {
  // 内部用のハッシュ(mgs-xxxxxxxx)はURLに出さず、読める名前をURLにする
  return /^mgs-(actress-|genre-)?[0-9a-f]{8,}$/i.test(row.slug) ? row.name : row.slug;
}

async function queryHub(kind, slug, rawSlug) {
  "use cache";

  try {
    const { prisma } = await import("@/lib/prisma");

    const rows =
      kind === "actress"
        ? await prisma.$queryRaw`
            SELECT slug, name FROM "Actress"
            WHERE slug = ${slug} OR slug = ${rawSlug} OR name = ${slug} LIMIT 1`
        : await prisma.$queryRaw`
            SELECT slug, name FROM "Genre"
            WHERE slug = ${slug} OR slug = ${rawSlug} OR name = ${slug} LIMIT 1`;

    const found = rows[0];
    if (!found) {
      cacheLife({ stale: 300, revalidate: 600, expire: 86400 });
      return { slug, name: null, works: [] };
    }

    const dbSlug = found.slug;
    const works =
      kind === "actress"
        ? await prisma.$queryRaw`
            SELECT ${WORK_COLUMNS} FROM "Work" w
            WHERE w.source <> 'demo' AND (
              w."actressSlug" = ${dbSlug} OR EXISTS (
                SELECT 1 FROM "WorkActress" wa
                WHERE wa."workId" = w.id AND wa."actressSlug" = ${dbSlug}))
            ORDER BY w."releasedAt" DESC, w.id ASC LIMIT ${HUB_MAX_WORKS}`
        : await prisma.$queryRaw`
            SELECT ${WORK_COLUMNS} FROM "Work" w
            WHERE w.source <> 'demo' AND (
              w."genreSlug" = ${dbSlug} OR EXISTS (
                SELECT 1 FROM "WorkGenre" wg
                WHERE wg."workId" = w.id AND wg."genreSlug" = ${dbSlug}))
            ORDER BY w."releasedAt" DESC, w.id ASC LIMIT ${HUB_MAX_WORKS}`;

    cacheLife({ stale: 300, revalidate: 600, expire: 86400 });
    return { slug: readableSlug(found), name: found.name, works: works.map(mapWorkRow) };
  } catch (error) {
    console.error("一覧ページの取得に失敗しました:", error?.message ?? error);
    cacheLife("seconds");
    return { slug, name: null, works: [] };
  }
}

// 女優／ジャンルに紐づく作品を新しい順で返す
export async function loadHub(kind, rawSlug) {
  const { getList } = config[kind];
  const slug = safeDecode(rawSlug);

  if (process.env.DATABASE_URL) {
    return queryHub(kind, slug, String(rawSlug));
  }

  // DB未設定のときは、従来のサンプル作品から探す
  const works = await getFeaturedWorks();
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
  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/prisma");
      const rows =
        kind === "actress"
          ? await prisma.$queryRaw`
              SELECT a.slug, a.name FROM "WorkActress" wa
              JOIN "Actress" a ON a.slug = wa."actressSlug"
              GROUP BY a.slug, a.name ORDER BY COUNT(*) DESC LIMIT ${limit}`
          : await prisma.$queryRaw`
              SELECT g.slug, g.name FROM "WorkGenre" wg
              JOIN "Genre" g ON g.slug = wg."genreSlug"
              GROUP BY g.slug, g.name ORDER BY COUNT(*) DESC LIMIT ${limit}`;
      if (rows.length > 0) return rows.map(readableSlug);
    } catch (error) {
      console.error("事前生成するスラッグの取得に失敗しました:", error?.message ?? error);
    }
  }

  const { getList } = config[kind];
  const counts = new Map();

  for (const work of await getFeaturedWorks()) {
    for (const item of getList(work)) {
      counts.set(item.slug, (counts.get(item.slug) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug]) => slug);
}
