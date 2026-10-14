import { createImporterDb } from '../src/lib/importers/db';

const db = createImporterDb();

const targetIds = [
  "mgs-223AICBD-023",
  "mgs-223AICWM-081",
  "mgs-300MIUM-1475",
  "mgs-774VRNC-106",
];

async function main() {
  const works = await db.work.findMany({
    where: {
      id: { in: targetIds },
      source: "mgs",
    },
    select: {
      id: true,
      title: true,
      actressName: true,
      actressSlug: true,
      actresses: {
        select: {
          actress: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  console.log("\n=== MGS出演者データ確認 ===");
  console.log(`対象作品数: ${works.length}/${targetIds.length}`);

  for (const work of works) {
    console.log("\n作品ID:", work.id);
    console.log("作品タイトル:", work.title);
    console.log("現在の女優名:", work.actressName);
    console.log("代表Slug:", work.actressSlug);
    console.log("登録出演者:");

    for (const relation of work.actresses) {
      console.log(
        `  - ${relation.actress.name} (${relation.actress.slug})`
      );
    }
  }

  console.log("\n確認専用：Neonへの書き込みはありません。");
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
