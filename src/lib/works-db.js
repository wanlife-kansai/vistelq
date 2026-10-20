import "server-only";
import { cacheLife } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { works as sampleWorks } from "@/data/works";
import { buildOutUrl, isAllowedAffiliateUrl } from "@/lib/affiliate";
import { isAspEnabled } from "@/lib/asp-config";

// 動画販売サイト(Projects)が Neon に登録した作品を、
// VISTELQの画面がそのまま使える形に変換して返す。
// 画面側のコードは従来の works 配列と同じ形で受け取れる。

const FEATURED_POPULAR = 60;
const FEATURED_NEWEST = 60;
const FEATURED_VR = 40;
export const PLACEHOLDER_THUMBNAIL = "/thumbnails/no-image.svg";

const jstDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toDateString(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : jstDate.format(date);
}

// [{slug, name}] を重複なく整える（名前だけの文字列でも受け付ける）
function normalizeRelations(list) {
  const seen = new Set();
  const result = [];

  for (const item of Array.isArray(list) ? list : []) {
    const name = String(typeof item === "string" ? item : item?.name ?? "").trim();
    let slug = String(typeof item === "string" ? item : item?.slug ?? name).trim();
    // 内部用のハッシュ(mgs-xxxxxxxx)はURLに出さず、読める名前をURLにする
    if (/^mgs-(actress-|genre-)?[0-9a-f]{8,}$/i.test(slug)) slug = name;
    slug = slug.replace(/[\/?#%]/g, "").trim();
    if (!name || !slug || seen.has(slug)) continue;
    seen.add(slug);
    result.push({ slug, name });
  }

  return result;
}

// DBの1行 → VISTELQの作品オブジェクト
export function mapWorkRow(row) {
  const offers = Array.isArray(row.offers) ? row.offers : [];
  const primary = offers.find((offer) => offer?.affiliateUrl) ?? offers[0] ?? null;

  const genreList = normalizeRelations(row.genres);
  if (genreList.length === 0 && row.genreName) {
    genreList.push({ slug: row.genreSlug || row.genreName, name: row.genreName });
  }
  const genres = genreList.map((item) => item.name);

  const actressList = normalizeRelations(row.actresses);
  if (actressList.length === 0 && row.actressName) {
    actressList.push({ slug: row.actressSlug || row.actressName, name: row.actressName });
  }
  const actresses = actressList.map((item) => item.name);

  const mgsProductId = /^mgs-(.+)$/.exec(String(row.id))?.[1] ?? null;
  const aspCode = primary?.asp ?? (mgsProductId ? "mgs" : null);

  const offerPrice = Number(primary?.price);
  const workPrice = Number(row.price);
  const price =
    offerPrice > 0 ? offerPrice : workPrice > 0 ? workPrice : undefined;

  const canRedirect =
    primary?.affiliateUrl && isAllowedAffiliateUrl(aspCode, primary.affiliateUrl);

  return {
    id: String(row.id),
    productId: mgsProductId ?? undefined,
    // MGS公式ウィジェットは、MGSが有効なときだけ表示する
    mgsProductId: mgsProductId && isAspEnabled("mgs") ? mgsProductId : undefined,
    contentType: genres.some((genre) => /VR/i.test(genre)) ? "vr" : "video",
    title: row.title,
    thumbnail: primary?.imageUrl || row.coverUrl || PLACEHOLDER_THUMBNAIL,
    asp: String(primary?.aspName || aspCode || row.source || "").toUpperCase(),
    duration: "",
    maker: "",
    views: Number(row.reviewCount) || 0,
    actress: actresses[0] ?? "",
    actressName: actresses[0] ?? "",
    actresses,
    actressList,
    genreList,
    releaseDate: toDateString(row.releasedAt),
    genres,
    description: row.summary ?? "",
    price,
    sampleEmbedUrl: row.sampleMovieUrl || undefined,
    affiliateUrl: canRedirect ? buildOutUrl(row.id, aspCode) : null,
  };
}

// 作品1件ぶんの取得内容（一覧・詳細・関連作品で共通）
const WORK_COLUMNS = Prisma.sql`
  w.id, w.title, w.summary, w."actressName", w."actressSlug",
  w."genreName", w."genreSlug", w.price, w."reviewCount", w."releasedAt",
  w."coverUrl", w."sampleMovieUrl", w.source,
  COALESCE((
    SELECT json_agg(json_build_object('slug', a.slug, 'name', a.name) ORDER BY a.name)
    FROM "WorkActress" wa
    JOIN "Actress" a ON a.slug = wa."actressSlug"
    WHERE wa."workId" = w.id
  ), '[]'::json) AS actresses,
  COALESCE((
    SELECT json_agg(json_build_object('slug', g.slug, 'name', g.name) ORDER BY g.name)
    FROM "WorkGenre" wg
    JOIN "Genre" g ON g.slug = wg."genreSlug"
    WHERE wg."workId" = w.id
  ), '[]'::json) AS genres,
  COALESCE((
    SELECT json_agg(
      json_build_object(
        'asp', s.code,
        'aspName', s.name,
        'affiliateUrl', o."affiliateUrl",
        'imageUrl', o."imageUrl",
        'price', o.price
      ) ORDER BY s.code
    )
    FROM "Offer" o
    JOIN "Asp" s ON s.id = o."aspId"
    WHERE o."workId" = w.id AND o.available = true AND s.enabled = true
  ), '[]'::json) AS offers
`;

export { WORK_COLUMNS };

// 画面の最初の表示に使う「注目の作品」だけを取得する
// （人気順・新着順・VR人気順の上位。全作品はブラウザへ送らない）
async function fetchFeaturedFromDb() {
  "use cache";

  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.$queryRaw`
      SELECT ${WORK_COLUMNS}
      FROM "Work" w
      WHERE w.id IN (
        SELECT id FROM (
          SELECT id FROM "Work" WHERE source <> 'demo'
          ORDER BY "reviewCount" DESC, "releasedAt" DESC LIMIT ${FEATURED_POPULAR}
        ) p
        UNION
        SELECT id FROM (
          SELECT id FROM "Work" WHERE source <> 'demo'
          ORDER BY "releasedAt" DESC, id ASC LIMIT ${FEATURED_NEWEST}
        ) n
        UNION
        SELECT id FROM (
          SELECT id FROM "Work" w2 WHERE source <> 'demo' AND (
            w2."genreName" ~* 'VR' OR EXISTS (
              SELECT 1 FROM "WorkGenre" wg JOIN "Genre" g ON g.slug = wg."genreSlug"
              WHERE wg."workId" = w2.id AND g.name ~* 'VR'))
          ORDER BY "reviewCount" DESC, "releasedAt" DESC LIMIT ${FEATURED_VR}
        ) v
      )
      ORDER BY w."reviewCount" DESC, w."releasedAt" DESC, w.id ASC
    `;

    cacheLife({ stale: 300, revalidate: 600, expire: 86400 });
    return rows.map(mapWorkRow);
  } catch (error) {
    console.error("注目作品の取得に失敗しました:", error?.message ?? error);
    cacheLife("seconds");
    return null;
  }
}

async function fetchWorkByIdFromDb(id) {
  "use cache";

  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.$queryRaw`
      SELECT ${WORK_COLUMNS} FROM "Work" w
      WHERE w.id = ${id} AND w.source <> 'demo' LIMIT 1
    `;
    cacheLife({ stale: 300, revalidate: 600, expire: 86400 });
    return rows[0] ? mapWorkRow(rows[0]) : null;
  } catch (error) {
    console.error("作品の取得に失敗しました:", error?.message ?? error);
    cacheLife("seconds");
    return undefined; // 取得失敗（作品なしとは区別する）
  }
}

async function fetchRelatedFromDb(id, actressSlug) {
  "use cache";

  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.$queryRaw`
      SELECT ${WORK_COLUMNS} FROM "Work" w
      WHERE w.id <> ${id} AND w.source <> 'demo'
      ORDER BY (w."actressSlug" = ${actressSlug}) DESC, w."reviewCount" DESC, w.id ASC
      LIMIT 5
    `;
    cacheLife({ stale: 300, revalidate: 600, expire: 86400 });
    return rows.map(mapWorkRow);
  } catch (error) {
    console.error("関連作品の取得に失敗しました:", error?.message ?? error);
    cacheLife("seconds");
    return [];
  }
}

// サイト全体の作品数（VR含む・表示上限とは無関係）。失敗時は null。
export async function getWorkTotal() {
  "use cache";

  if (!process.env.DATABASE_URL) return null;
  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS total FROM "Work" WHERE source <> 'demo'
    `;
    cacheLife({ stale: 300, revalidate: 600, expire: 86400 });
    return Number(rows[0]?.total) || 0;
  } catch (error) {
    console.error("作品数の取得に失敗しました:", error?.message ?? error);
    cacheLife("seconds");
    return null;
  }
}

// 画面から使う入口。
// DB未設定・接続失敗・登録作品ゼロのときは、従来のサンプル作品に戻す。

// 最初の表示用（トップ・棚・ランキング）。全作品ではなく上位だけ。
export async function getFeaturedWorks() {
  if (!process.env.DATABASE_URL) return sampleWorks;

  const works = await fetchFeaturedFromDb();
  return works && works.length > 0 ? works : sampleWorks;
}

// 作品ページ用：その1件だけをDBから取得する
export async function getWorkById(id) {
  if (!process.env.DATABASE_URL) {
    return sampleWorks.find((work) => String(work.id) === String(id)) ?? null;
  }

  const work = await fetchWorkByIdFromDb(String(id));
  if (work === undefined) {
    return sampleWorks.find((item) => String(item.id) === String(id)) ?? null;
  }
  if (work) return work;
  return sampleWorks.find((item) => String(item.id) === String(id)) ?? null;
}

// 作品ページの「関連作品」（同じ女優を優先し、人気順で5件）
export async function getRelatedWorks(work) {
  if (!process.env.DATABASE_URL) {
    return sampleWorks.filter((item) => item.id !== work.id).slice(0, 5);
  }

  const slug = work.actressList?.[0]?.slug || "";
  const related = await fetchRelatedFromDb(String(work.id), slug);
  return related.length > 0
    ? related
    : sampleWorks.filter((item) => item.id !== work.id).slice(0, 5);
}

// 互換用：従来の getWorks は、注目作品を返す
export async function getWorks() {
  return getFeaturedWorks();
}
