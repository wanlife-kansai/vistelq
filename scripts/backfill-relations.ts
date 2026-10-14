import { createImporterDb } from '../src/lib/importers/db';

const db = createImporterDb();

async function main() {
  const apply = process.argv.includes('--apply');

  const works = await db.work.findMany({
    select: {
      id: true,
      actressSlug: true,
      actressName: true,
      genreSlug: true,
      genreName: true,
    },
  });

  console.log(`対象作品: ${works.length}件`);
  console.log(`実行モード: ${apply ? '書き込み' : '確認のみ'}`);

  if (!apply) {
    console.log('データベースへの変更は行いません。');
    return;
  }

  await db.$transaction(async (tx) => {
    for (const work of works) {
      await tx.actress.upsert({
        where: { slug: work.actressSlug },
        update: { name: work.actressName },
        create: {
          slug: work.actressSlug,
          name: work.actressName,
        },
      });

      await tx.genre.upsert({
        where: { slug: work.genreSlug },
        update: { name: work.genreName },
        create: {
          slug: work.genreSlug,
          name: work.genreName,
        },
      });

      await tx.workActress.upsert({
        where: {
          workId_actressSlug: {
            workId: work.id,
            actressSlug: work.actressSlug,
          },
        },
        update: {},
        create: {
          workId: work.id,
          actressSlug: work.actressSlug,
        },
      });

      await tx.workGenre.upsert({
        where: {
          workId_genreSlug: {
            workId: work.id,
            genreSlug: work.genreSlug,
          },
        },
        update: {},
        create: {
          workId: work.id,
          genreSlug: work.genreSlug,
        },
      });
    }
  }, { maxWait: 10000, timeout: 30000 });

  console.log('関連データの登録が完了しました。');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
