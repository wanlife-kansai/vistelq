import { getFeaturedWorks } from "@/lib/works-db";
import { absoluteUrl } from "@/lib/site-url";
import {
  actressHref,
  genreHref,
  getActressList,
  getGenreList,
} from "@/lib/work-relations";

const MAX_URLS = 5000;

// DBから、作品ID・女優・ジャンルを必要な項目だけ取得する（全作品を読み込まない）
async function loadSitemapData() {
  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/prisma");
      const [works, actresses, genres] = await Promise.all([
        prisma.$queryRaw`
          SELECT id, "releasedAt" FROM "Work" WHERE source <> 'demo'
          ORDER BY "releasedAt" DESC, id ASC LIMIT ${MAX_URLS}`,
        prisma.$queryRaw`
          SELECT DISTINCT a.slug, a.name FROM "WorkActress" wa
          JOIN "Actress" a ON a.slug = wa."actressSlug" LIMIT 2000`,
        prisma.$queryRaw`
          SELECT DISTINCT g.slug, g.name FROM "WorkGenre" wg
          JOIN "Genre" g ON g.slug = wg."genreSlug" LIMIT 500`,
      ]);
      if (works.length > 0) {
        const readable = (row) =>
          /^mgs-(actress-|genre-)?[0-9a-f]{8,}$/i.test(row.slug) ? row.name : row.slug;
        return {
          workEntries: works.map((work) => ({
            id: String(work.id),
            released: work.releasedAt ? new Date(work.releasedAt) : null,
          })),
          actressSlugs: new Set(actresses.map(readable)),
          genreSlugs: new Set(genres.map(readable)),
        };
      }
    } catch (error) {
      console.error("サイトマップ用データの取得に失敗しました:", error?.message ?? error);
    }
  }

  const works = await getFeaturedWorks();
  const actressSlugs = new Set();
  const genreSlugs = new Set();
  const workEntries = works.map((work) => {
    getActressList(work).forEach((item) => actressSlugs.add(item.slug));
    getGenreList(work).forEach((item) => genreSlugs.add(item.slug));
    return {
      id: String(work.id),
      released: work.releaseDate ? new Date(work.releaseDate) : null,
    };
  });
  return { workEntries, actressSlugs, genreSlugs };
}

export default async function sitemap() {
  const { workEntries: workRows, actressSlugs, genreSlugs } = await loadSitemapData();

  const fixed = [
    ["/", 1.0, "daily"],
    ["/videos", 0.9, "daily"],
    ["/videos/new", 0.8, "daily"],
    ["/videos/vr", 0.8, "daily"],
    ["/rankings", 0.8, "daily"],
    ["/actresses", 0.7, "weekly"],
    ["/goods", 0.6, "weekly"],
  ].map(([path, priority, changeFrequency]) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  }));

  const workEntries = workRows.map(({ id, released }) => ({
    url: absoluteUrl(`/works/${encodeURIComponent(id)}`),
    lastModified:
      released && !Number.isNaN(released.getTime()) ? released : undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const hubEntries = [
    ...[...actressSlugs].map((slug) => ({
      url: absoluteUrl(actressHref(slug)),
      changeFrequency: "weekly",
      priority: 0.5,
    })),
    ...[...genreSlugs].map((slug) => ({
      url: absoluteUrl(genreHref(slug)),
      changeFrequency: "weekly",
      priority: 0.5,
    })),
  ];

  return [...fixed, ...hubEntries, ...workEntries].slice(0, MAX_URLS);
}
