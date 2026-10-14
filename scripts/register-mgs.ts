import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type MgsInput = {
  productId: string;
  affiliateUrl?: string;
  title: string;
  summary: string;
  actressName: string;
  actressSlug?: string;
  actresses?: {
    slug: string;
    name: string;
  }[];
  genreName: string;
  genreSlug?: string;
  genres?: {
    slug: string;
    name: string;
  }[];
  releasedAt: string;
  price?: number;
  rating?: number;
  reviewCount?: number;
};

export function validateMgsInput(input: MgsInput) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("作品情報が不正です");
  }

  if (typeof input.productId === "string" &&
      /^TEST[-_]/i.test(input.productId)) {
    throw new Error("テスト用作品は登録できません");
  }

  const required = [
    "productId",
    "title",
    "summary",
    "actressName",
    "genreName",
    "releasedAt",
  ] as const;

  for (const key of required) {
    if (
      typeof input[key] !== "string" ||
      !input[key].trim()
    ) {
      throw new Error(`${key} が未入力です`);
    }
  }

  if (!/^[A-Za-z0-9_-]+$/.test(input.productId)) {
    throw new Error("作品IDの形式が不正です");
  }

  if (input.affiliateUrl !== undefined) {
    if (typeof input.affiliateUrl !== "string") {
      throw new Error("affiliateUrl は文字列にしてください");
    }

    let url: URL;
    try {
      url = new URL(input.affiliateUrl);
    } catch {
      throw new Error("affiliateUrl のURL形式が不正です");
    }

    if (
      url.protocol !== "https:" ||
      url.hostname !== "www.mgstage.com" ||
      url.username ||
      url.password ||
      url.pathname !==
        `/product/product_detail/${input.productId}/`
    ) {
      throw new Error("MGS公式の商品URLと作品IDを確認してください");
    }
  }

  const date = new Date(input.releasedAt);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.releasedAt) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== input.releasedAt
  ) {
    throw new Error("発売日は YYYY-MM-DD 形式で指定してください");
  }

  for (const key of ["price", "reviewCount"] as const) {
    const value = input[key];
    if (
      value !== undefined &&
      (!Number.isSafeInteger(value) || value < 0)
    ) {
      throw new Error(`${key} は0以上の整数にしてください`);
    }
  }

  if (
    input.rating !== undefined &&
    (!Number.isFinite(input.rating) ||
      input.rating < 0 ||
      input.rating > 5)
  ) {
    throw new Error("rating は0〜5で指定してください");
  }

  for (const key of ["actressSlug", "genreSlug"] as const) {
    const value = input[key];
    if (
      value !== undefined &&
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
    ) {
      throw new Error(`${key} の形式が不正です`);
    }
  }

  if (input.actresses !== undefined) {
    if (!Array.isArray(input.actresses) || input.actresses.length === 0) {
      throw new Error("actresses は1名以上の配列にしてください");
    }

    const seen = new Set<string>();

    for (const actress of input.actresses) {
      if (
        !actress ||
        typeof actress.slug !== "string" ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(actress.slug) ||
        typeof actress.name !== "string" ||
        !actress.name.trim() ||
        seen.has(actress.slug)
      ) {
        throw new Error("出演者のSlug・名前が不正、または重複しています");
      }

      seen.add(actress.slug);
    }

    if (input.actressSlug !== input.actresses[0].slug) {
      throw new Error("actressSlug は先頭出演者のSlugと一致させてください");
    }
  }


  if (input.genres !== undefined) {
    if (!Array.isArray(input.genres) || input.genres.length === 0) {
      throw new Error("genres は1件以上の配列にしてください");
    }

    const seen = new Set<string>();

    for (const genre of input.genres) {
      if (
        !genre ||
        typeof genre.slug !== "string" ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(genre.slug) ||
        typeof genre.name !== "string" ||
        !genre.name.trim() ||
        seen.has(genre.slug)
      ) {
        throw new Error("ジャンルのSlug・名前が不正、または重複しています");
      }

      seen.add(genre.slug);
    }

    if (
      input.genreSlug !== input.genres[0].slug ||
      input.genreName !== input.genres[0].name
    ) {
      throw new Error("代表ジャンルは genres の先頭と一致させてください");
    }
  }

}

function main() {
  const file = process.argv[2];

  if (!file) {
    throw new Error(
      "使い方: npx tsx scripts/register-mgs.ts ファイル名.json"
    );
  }

  const input: MgsInput = JSON.parse(
    readFileSync(resolve(file), "utf8")
  );

  validateMgsInput(input);

  const workId = `mgs-${input.productId}`;

  console.log("\n=== MGS作品登録プレビュー ===");
  console.log(JSON.stringify({
    workId,
    source: "mgs",
    aspCode: "mgs",
    externalId: input.productId,
    affiliateUrl: input.affiliateUrl ?? null,
    title: input.title,
    summary: input.summary,
    actressName: input.actressName,
    actressSlug: input.actressSlug ?? null,
    actresses: input.actresses ?? null,
    genreName: input.genreName,
    genreSlug: input.genreSlug ?? null,
    releasedAt: input.releasedAt,
    price: input.price ?? 0,
    rating: input.rating ?? null,
    reviewCount: input.reviewCount ?? null,
  }, null, 2));

  if (!process.argv.includes("--save")) {
    console.log("\nプレビューのみ。DBへの書き込みはありません。");
    return;
  }

  if (!input.actressSlug || !input.genreSlug) {
    throw new Error("保存には actressSlug と genreSlug が必要です");
  }

  return saveMgsWork(input);
}

if (process.argv[1]?.endsWith("register-mgs.ts")) {
  Promise.resolve().then(() => main()).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

// STEP 194: MGS作品の安全な新規登録処理
// --save 指定時のみ呼び出します。

export async function saveMgsWork(input: MgsInput) {
  validateMgsInput(input);
  const { createImporterDb } = await import("../src/lib/importers/db");
  const db = createImporterDb();

  try {
    const productId = input.productId;
    const workId = `mgs-${productId}`;

    if (/^TEST[-_]/i.test(productId)) {
      throw new Error("テスト用作品は登録できません");
    }

    const asp = await db.asp.findUnique({
      where: { code: "mgs" }
    });

    if (!asp || !asp.enabled) {
      throw new Error("MGSのASP設定が見つからないか、無効です");
    }

    await db.$transaction(async (tx) => {
      const existingWork = await tx.work.findUnique({
        where: { id: workId }
      });

      const existingOffer = await tx.offer.findUnique({
        where: {
          aspId_externalId: {
            aspId: asp.id,
            externalId: productId
          }
        }
      });

      if (existingWork || existingOffer) {
        throw new Error("このMGS作品は登録済みです。上書きしません");
      }

      if (!input.actressSlug || !input.genreSlug) {
        throw new Error("保存には actressSlug と genreSlug の指定が必要です");
      }

      const actressSlug = input.actressSlug;
      const genreSlug = input.genreSlug;

      const actresses = input.actresses ?? [
        { slug: actressSlug, name: input.actressName }
      ];

      if (!Array.isArray(actresses) || actresses.length === 0) {
        throw new Error("出演者情報がありません");
      }

      const seenSlugs = new Set<string>();

      for (const actress of actresses) {
        if (
          !actress ||
          typeof actress.slug !== "string" ||
          !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(actress.slug) ||
          typeof actress.name !== "string" ||
          !actress.name.trim() ||
          seenSlugs.has(actress.slug)
        ) {
          throw new Error("出演者情報が不正または重複しています");
        }

        seenSlugs.add(actress.slug);

        const existing = await tx.actress.findUnique({
          where: { slug: actress.slug }
        });

        if (existing && existing.name !== actress.name) {
          throw new Error(`出演者Slugと名前が一致しません: ${actress.slug}`);
        }
      }

      if (actresses[0].slug !== actressSlug) {
        throw new Error("actressSlugは先頭出演者のSlugと一致させてください");
      }

      const genres = input.genres ?? [
        { slug: genreSlug, name: input.genreName }
      ];

      for (const genre of genres) {
        const existingGenre = await tx.genre.findUnique({
          where: { slug: genre.slug }
        });

        if (existingGenre && existingGenre.name !== genre.name) {
          throw new Error(
            `ジャンルSlugと名前が一致しません: ${genre.slug}`
          );
        }
      }

      for (const actress of actresses) {
        await tx.actress.upsert({
          where: { slug: actress.slug },
          update: {},
          create: { slug: actress.slug, name: actress.name }
        });
      }

      for (const genre of genres) {
        await tx.genre.upsert({
          where: { slug: genre.slug },
          update: {},
          create: { slug: genre.slug, name: genre.name }
        });
      }

      await tx.work.create({
        data: {
          id: workId,
          title: input.title,
          summary: input.summary,
          actressSlug,
          actressName: input.actressName,
          genreSlug,
          genreName: input.genreName,
          releasedAt: new Date(input.releasedAt),
          price: input.price ?? 0,
          rating: input.rating ?? 0,
          reviewCount: input.reviewCount ?? 0,
          source: "mgs",
          affiliateUrl: input.affiliateUrl ?? null
        }
      });

      for (const actress of actresses) {
        await tx.workActress.create({
          data: { workId, actressSlug: actress.slug }
        });
      }

      for (const genre of genres) {
        await tx.workGenre.create({
          data: { workId, genreSlug: genre.slug }
        });
      }

      await tx.offer.create({
        data: {
          workId,
          aspId: asp.id,
          externalId: productId,
          price: input.price ?? null,
          affiliateUrl: input.affiliateUrl ?? null,
          available: true
        }
      });
    }, { timeout: 30000, maxWait: 10000 });

    console.log(`MGS作品を登録しました: ${workId}`);
  } finally {
    await db.$disconnect();
  }
}
