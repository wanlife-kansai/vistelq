import { createImporterDb } from "../src/lib/importers/db";

// ASP（提携先）の基本データを登録します。何度実行しても安全です。
//  - すでにある行の enabled（有効/無効）は変更しません
//  - FANZAは「無効」で登録（アフィリエイトID・API承認後に有効化）
const ASPS = [
  { code: "mgs", name: "MGS", enabled: true },
  { code: "fanza", name: "FANZA", enabled: false },
];

async function main() {
  const db = createImporterDb();

  try {
    for (const asp of ASPS) {
      const row = await db.asp.upsert({
        where: { code: asp.code },
        update: { name: asp.name },
        create: asp,
      });
      console.log(`${row.code}: ${row.enabled ? "有効" : "無効"}`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
