import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  validateMgsInput,
  saveMgsWork,
  type MgsInput,
} from "./register-mgs";

function main() {
  const file = process.argv[2];

  if (!file) {
    throw new Error(
      "使い方: npx tsx scripts/register-mgs-bulk.ts ファイル名.json"
    );
  }

  const inputs: unknown = JSON.parse(
    readFileSync(resolve(file), "utf8")
  );

  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw new Error("JSONは1件以上の作品配列にしてください");
  }

  const seen = new Set<string>();

  for (const [index, item] of inputs.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`${index + 1}件目の作品情報が不正です`);
    }

    const input = item as MgsInput;

    try {
      validateMgsInput(input);
    } catch (error) {
      throw new Error(
        `${index + 1}件目: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    if (seen.has(input.productId)) {
      throw new Error(`作品IDが重複しています: ${input.productId}`);
    }

    seen.add(input.productId);
  }

  console.log("\n=== MGS一括登録プレビュー ===");

  for (const input of inputs as MgsInput[]) {
    console.log(
      `${input.productId} | ${input.title} | ${
        input.affiliateUrl ? "URLあり" : "URLなし"
      }`
    );
  }

  console.log(`\n検証成功: ${inputs.length}件`);
  if (process.argv.includes("--save")) {
    console.log("保存モード：検証後、新規作品のみNeonに登録します。");
  } else {
    console.log("プレビューのみ。DBへの書き込みはありません。");
  }
}

async function checkExistingWorks() {
  const { createImporterDb } = await import("../src/lib/importers/db");
  const db = createImporterDb();

  try {
    const file = process.argv[2];
    if (!file) return;

    const inputs: MgsInput[] = JSON.parse(
      readFileSync(resolve(file), "utf8")
    );

    const asp = await db.asp.findUnique({
      where: { code: "mgs" },
    });

    if (!asp || !asp.enabled) {
      throw new Error("MGSのASP設定が無効です");
    }

    const save = process.argv.includes("--save");
    let saved = 0;
    let skipped = 0;
    let failed = 0;

    console.log(save
      ? "\n=== MGS一括保存 ==="
      : "\n=== Neon登録状況 ==="
    );

    for (const input of inputs) {
      const [work, offer] = await Promise.all([
        db.work.findUnique({
          where: { id: `mgs-${input.productId}` },
          select: { id: true },
        }),
        db.offer.findUnique({
          where: {
            aspId_externalId: {
              aspId: asp.id,
              externalId: input.productId,
            },
          },
          select: { id: true },
        }),
      ]);

      if (work || offer) {
        console.log(`${input.productId}: 登録済み（スキップ）`);
        skipped++;
        continue;
      }

      if (!save) {
        console.log(`${input.productId}: 新規登録可能`);
        continue;
      }

      try {
        await saveMgsWork(input);
        saved++;
      } catch (error) {
        failed++;
        console.error(
          `${input.productId}: 登録失敗`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    if (save) {
      console.log(
        `\n登録結果: 成功${saved}件 / スキップ${skipped}件 / エラー${failed}件`
      );

      if (failed > 0) {
        process.exitCode = 1;
      }
    }
  } finally {
    await db.$disconnect();
  }
}

async function run() {
  main();

  if (
    process.argv.includes("--check-db") ||
    process.argv.includes("--save")
  ) {
    await checkExistingWorks();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
