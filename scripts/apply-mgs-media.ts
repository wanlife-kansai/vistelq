import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// mgs-media.json の「画像URL・価格」を、登録済みのMGS作品へ反映します。
// 既に値が入っている項目は上書きしません。--save を付けたときだけ保存します。
// 使い方: npm run mgs:apply-media -- data-import/mgs/mgs-media.json [--save]

type MediaInput = { productId: string; imageUrl?: string | null; price?: number | null };

const IMAGE_HOST = /(^|\.)mgstage\.com$/;

export function validateMedia(item: MediaInput) {
  if (!item || typeof item.productId !== "string" || !/^[A-Za-z0-9_-]+$/.test(item.productId)) {
    throw new Error("productId が不正です");
  }
  if (item.imageUrl != null) {
    let url: URL;
    try {
      url = new URL(item.imageUrl);
    } catch {
      throw new Error(`${item.productId}: 画像URLの形式が不正です`);
    }
    if (url.protocol !== "https:" || !IMAGE_HOST.test(url.hostname) || url.username || url.password) {
      throw new Error(`${item.productId}: 画像はMGS(https)のURLのみ対応です`);
    }
  }
  if (item.price != null && (!Number.isSafeInteger(item.price) || item.price <= 0 || item.price > 200000)) {
    throw new Error(`${item.productId}: 価格が不正です（1〜200000の整数）`);
  }
}

export async function applyMedia(items: MediaInput[], save: boolean) {
  const { createImporterDb } = await import("../src/lib/importers/db");
  const db = createImporterDb();
  const summary = { updated: 0, unchanged: 0, missing: 0, invalid: 0 };

  try {
    const asp = await db.asp.findUnique({ where: { code: "mgs" } });
    if (!asp) throw new Error("MGSのASP設定が見つかりません");

    for (const item of items) {
      try {
        validateMedia(item);
      } catch (error) {
        summary.invalid++;
        console.log("スキップ(不正):", error instanceof Error ? error.message : error);
        continue;
      }

      const workId = `mgs-${item.productId}`;
      const work = await db.work.findUnique({ where: { id: workId } });
      const offer = await db.offer.findUnique({
        where: { aspId_externalId: { aspId: asp.id, externalId: item.productId } },
      });

      if (!work || !offer) {
        summary.missing++;
        console.log("未登録のためスキップ:", item.productId);
        continue;
      }

      const workData: { coverUrl?: string; price?: number } = {};
      const offerData: { imageUrl?: string; price?: number } = {};

      if (item.imageUrl && !work.coverUrl) workData.coverUrl = item.imageUrl;
      if (item.imageUrl && !offer.imageUrl) offerData.imageUrl = item.imageUrl;
      if (item.price && !(work.price > 0)) workData.price = item.price;
      if (item.price && !(Number(offer.price) > 0)) offerData.price = item.price;

      if (Object.keys(workData).length + Object.keys(offerData).length === 0) {
        summary.unchanged++;
        continue;
      }

      console.log(save ? "更新:" : "更新予定:", item.productId, JSON.stringify({ ...workData, ...offerData }));

      if (save) {
        await db.$transaction([
          ...(Object.keys(workData).length ? [db.work.update({ where: { id: workId }, data: workData })] : []),
          ...(Object.keys(offerData).length ? [db.offer.update({ where: { id: offer.id }, data: offerData })] : []),
        ]);
      }
      summary.updated++;
    }
  } finally {
    await db.$disconnect();
  }

  console.log(
    `\n${save ? "保存" : "プレビュー(保存なし)"}: 更新${summary.updated}件 / 変更なし${summary.unchanged}件 / 未登録${summary.missing}件 / 不正${summary.invalid}件`
  );
  return summary;
}

async function main() {
  const file = process.argv[2];
  if (!file || file.startsWith("--")) {
    throw new Error("使い方: npm run mgs:apply-media -- data-import/mgs/mgs-media.json [--save]");
  }
  const items: unknown = JSON.parse(readFileSync(resolve(file), "utf8"));
  if (!Array.isArray(items) || items.length === 0) throw new Error("JSONは1件以上の配列にしてください");
  await applyMedia(items as MediaInput[], process.argv.includes("--save"));
}

if (process.argv[1]?.endsWith("apply-mgs-media.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
