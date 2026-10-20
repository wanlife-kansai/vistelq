import "server-only";
import { cacheLife } from "next/cache";

// 女優のプロフィール（FANZA女優検索APIで取り込んだ内容）。なければ null。
export async function getActressProfile(slug) {
  "use cache";

  const key = String(slug ?? "");
  if (!/^[\w%.\-ぁ-んァ-ヶ一-龠ー]{1,100}$/.test(key)) {
    cacheLife("minutes");
    return null;
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.$queryRaw`
      SELECT slug, name, ruby, "imageUrl", cup, bust, waist, hip, height,
             birthday, "bloodType", hobby, prefectures
      FROM "Actress"
      WHERE slug = ${key}
      LIMIT 1
    `;

    cacheLife({ stale: 300, revalidate: 600, expire: 86400 });
    const row = rows[0];
    if (!row || (!row.imageUrl && !row.ruby && !row.height && !row.bust)) return null;
    return JSON.parse(JSON.stringify(row));
  } catch (error) {
    console.error("女優プロフィールの取得に失敗しました:", error?.message ?? error);
    cacheLife("seconds");
    return null;
  }
}

// 一覧ページ用：女優スラッグ → 画像URL（画像のある女優だけ）
export async function getActressImages() {
  "use cache";

  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.$queryRaw`
      SELECT slug, "imageUrl" FROM "Actress"
      WHERE "imageUrl" IS NOT NULL
      LIMIT 3000
    `;

    cacheLife({ stale: 300, revalidate: 600, expire: 86400 });
    return Object.fromEntries(rows.map((row) => [row.slug, row.imageUrl]));
  } catch (error) {
    console.error("女優画像の取得に失敗しました:", error?.message ?? error);
    cacheLife("seconds");
    return {};
  }
}

// 女優一覧ページ用：出演作品数・閲覧数・画像つきの一覧をDBで集計して返す
export async function getActressDirectory() {
  "use cache";

  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.$queryRaw`
      SELECT a.slug, a.name, a."imageUrl",
             COUNT(*)::int AS count,
             COALESCE(SUM(w."reviewCount"), 0)::int AS views
      FROM "WorkActress" wa
      JOIN "Actress" a ON a.slug = wa."actressSlug"
      JOIN "Work" w ON w.id = wa."workId"
      WHERE w.source <> 'demo' AND a.name <> '出演者未登録' AND a.slug <> 'unknown'
      GROUP BY a.slug, a.name, a."imageUrl"
      ORDER BY views DESC, count DESC, a.name ASC
      LIMIT 3000
    `;

    cacheLife({ stale: 300, revalidate: 600, expire: 86400 });
    return rows.map((row) => ({
      // 内部用のハッシュ(mgs-xxxxxxxx)はURLに出さず、読める名前をURLにする
      slug: /^mgs-(actress-|genre-)?[0-9a-f]{8,}$/i.test(row.slug) ? row.name : row.slug,
      name: row.name,
      imageUrl: row.imageUrl || "",
      count: Number(row.count) || 0,
      views: Number(row.views) || 0,
    }));
  } catch (error) {
    console.error("女優一覧の取得に失敗しました:", error?.message ?? error);
    cacheLife("seconds");
    return [];
  }
}
