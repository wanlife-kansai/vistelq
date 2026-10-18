import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { mapWorkRow } from "@/lib/works-db";

// DBで検索・絞り込み・並べ替え・ページ分けを行う（全作品をブラウザへ送らない）。

const MAX_PAGE_SIZE = 120;

const aliases = [
  ["NTR", "寝取り", "寝取られ", "寝取り・寝取られ"],
  ["VR", "VR動画", "バーチャルリアリティ"],
  ["3P", "3P・4P", "複数プレイ"],
  ["ナース", "看護婦", "看護婦・ナース"],
  ["巨乳", "巨乳フェチ"],
];

function normalize(value) {
  return String(value ?? "").normalize("NFKC").toLowerCase().trim();
}

function expandKeyword(word) {
  const group = aliases.find((items) => items.some((item) => normalize(item) === word));
  return group ? group.map(normalize) : [word];
}

function likePattern(text) {
  return "%" + text.replace(/[\\%_]/g, (c) => "\\" + c) + "%";
}

function wordCondition(word) {
  const parts = expandKeyword(word).map((candidate) => {
    const p = likePattern(candidate);
    return Prisma.sql`(
      w.title ILIKE ${p} OR w.summary ILIKE ${p} OR w."actressName" ILIKE ${p}
      OR w.id ILIKE ${p} OR w.source ILIKE ${p} OR w."genreName" ILIKE ${p}
      OR EXISTS (SELECT 1 FROM "WorkGenre" wg JOIN "Genre" g ON g.slug = wg."genreSlug"
                 WHERE wg."workId" = w.id AND g.name ILIKE ${p})
      OR EXISTS (SELECT 1 FROM "WorkActress" wa JOIN "Actress" a ON a.slug = wa."actressSlug"
                 WHERE wa."workId" = w.id AND a.name ILIKE ${p})
    )`;
  });
  return Prisma.sql`(${Prisma.join(parts, " OR ")})`;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const AGE = Prisma.sql`(CURRENT_DATE - w."releasedAt"::date)`;
const IS_VR = Prisma.sql`(w."genreName" ~* 'VR' OR EXISTS (
  SELECT 1 FROM "WorkGenre" wg JOIN "Genre" g ON g.slug = wg."genreSlug"
  WHERE wg."workId" = w.id AND g.name ~* 'VR'))`;

function intParam(value, fallback, min, max) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export async function searchWorks(input = {}) {
  const conds = [Prisma.sql`w.source <> 'demo'`];

  const mode = String(input.mode || "");
  if (["vr", "vr-new", "vr-semi-new"].includes(mode)) conds.push(IS_VR);
  if (mode === "new" || mode === "vr-new") conds.push(Prisma.sql`${AGE} BETWEEN 0 AND 30`);
  if (mode === "semi-new" || mode === "vr-semi-new") conds.push(Prisma.sql`${AGE} BETWEEN 31 AND 90`);

  const keyword = normalize(String(input.keyword || "").slice(0, 100));
  for (const word of keyword.split(/\s+/).filter(Boolean).slice(0, 5)) {
    conds.push(wordCondition(word));
  }

  const asp = String(input.asp || "").toUpperCase();
  if (asp && asp !== "ALL" && /^[A-Z0-9_-]{1,30}$/.test(asp)) {
    conds.push(Prisma.sql`(upper(w.source) = ${asp} OR EXISTS (
      SELECT 1 FROM "Offer" o JOIN "Asp" s ON s.id = o."aspId"
      WHERE o."workId" = w.id AND o.available = true AND s.enabled = true AND upper(s.code) = ${asp}))`);
  }

  const genre = String(input.genre || "").slice(0, 100);
  if (genre && genre !== "すべて") {
    conds.push(Prisma.sql`(w."genreName" = ${genre} OR EXISTS (
      SELECT 1 FROM "WorkGenre" wg JOIN "Genre" g ON g.slug = wg."genreSlug"
      WHERE wg."workId" = w.id AND g.name = ${genre}))`);
  }

  const actress = normalize(String(input.actress || "").slice(0, 100));
  if (actress) {
    const p = likePattern(actress);
    conds.push(Prisma.sql`(w."actressName" ILIKE ${p} OR EXISTS (
      SELECT 1 FROM "WorkActress" wa JOIN "Actress" a ON a.slug = wa."actressSlug"
      WHERE wa."workId" = w.id AND a.name ILIKE ${p}))`);
  }

  const from = String(input.from || "");
  const to = String(input.to || "");
  if (DATE_RE.test(from)) conds.push(Prisma.sql`w."releasedAt"::date >= ${from}::date`);
  if (DATE_RE.test(to)) conds.push(Prisma.sql`w."releasedAt"::date <= ${to}::date`);

  const category = String(input.category || "");
  if (category === "new") conds.push(Prisma.sql`${AGE} BETWEEN 0 AND 30`);
  if (category === "semi-new") conds.push(Prisma.sql`${AGE} BETWEEN 31 AND 90`);
  if (category === "preorder") conds.push(Prisma.sql`w."releasedAt"::date > CURRENT_DATE`);
  if (category === "today") conds.push(Prisma.sql`w."createdAt"::date = CURRENT_DATE`);
  if (category === "under300") {
    conds.push(Prisma.sql`((w.price BETWEEN 1 AND 300) OR EXISTS (
      SELECT 1 FROM "Offer" o WHERE o."workId" = w.id AND o.price BETWEEN 1 AND 300))`);
  }

  const sort = String(input.sort || "popular");
  const orderBy =
    sort === "new"
      ? Prisma.sql`w."releasedAt" DESC, w.id ASC`
      : sort === "price"
        ? Prisma.sql`NULLIF(w.price, 0) ASC NULLS LAST, w.id ASC`
        : Prisma.sql`w."reviewCount" DESC, w."releasedAt" DESC, w.id ASC`;

  const pageSize = intParam(input.pageSize, 30, 1, MAX_PAGE_SIZE);
  const page = intParam(input.page, 1, 1, 100000);
  const offset = (page - 1) * pageSize;
  const where = Prisma.join(conds, " AND ");

  const { prisma } = await import("@/lib/prisma");

  const [countRows, rows] = await Promise.all([
    prisma.$queryRaw`SELECT COUNT(*)::int AS total FROM "Work" w WHERE ${where}`,
    prisma.$queryRaw`
      SELECT
        w.id, w.title, w.summary, w."actressName", w."actressSlug",
        w."genreName", w."genreSlug", w.price, w."reviewCount", w."releasedAt",
        w."coverUrl", w.source,
        COALESCE((
          SELECT json_agg(json_build_object('slug', a.slug, 'name', a.name) ORDER BY a.name)
          FROM "WorkActress" wa JOIN "Actress" a ON a.slug = wa."actressSlug"
          WHERE wa."workId" = w.id
        ), '[]'::json) AS actresses,
        COALESCE((
          SELECT json_agg(json_build_object('slug', g.slug, 'name', g.name) ORDER BY g.name)
          FROM "WorkGenre" wg JOIN "Genre" g ON g.slug = wg."genreSlug"
          WHERE wg."workId" = w.id
        ), '[]'::json) AS genres,
        COALESCE((
          SELECT json_agg(json_build_object(
            'asp', s.code, 'aspName', s.name, 'affiliateUrl', o."affiliateUrl",
            'imageUrl', o."imageUrl", 'price', o.price) ORDER BY s.code)
          FROM "Offer" o JOIN "Asp" s ON s.id = o."aspId"
          WHERE o."workId" = w.id AND o.available = true AND s.enabled = true
        ), '[]'::json) AS offers
      FROM "Work" w
      WHERE ${where}
      ORDER BY ${orderBy}
      LIMIT ${pageSize} OFFSET ${offset}`,
  ]);

  const works = rows.map((row) => {
    const { sampleEmbedUrl, affiliateUrl, mgsProductId, ...rest } = mapWorkRow(row);
    return {
      ...rest,
      description:
        typeof rest.description === "string" && rest.description.length > 80
          ? rest.description.slice(0, 80) + "…"
          : rest.description,
    };
  });

  return { total: Number(countRows[0]?.total) || 0, page, pageSize, works };
}
