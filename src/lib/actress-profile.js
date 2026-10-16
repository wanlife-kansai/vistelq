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
