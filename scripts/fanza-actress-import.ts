// 登録済みの女優（FANZA由来）のプロフィールを、女優検索APIで取得して保存する。
//   npm run fanza:actress              … 取得して表示だけ（保存しない）
//   npm run fanza:actress -- --save    … DBに保存
//   オプション: --limit=N（既定30） / --all（取得済みも更新）
import { createImporterDb } from '../src/lib/importers/db';
import { fetchFanzaActress, mapFanzaActress } from '../src/lib/importers/fanza-actress';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const save = process.argv.includes('--save');
  const all = process.argv.includes('--all');
  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const limit = Math.min(Math.max(Number(limitArg?.split('=')[1]) || 30, 1), 200);

  const db = createImporterDb();
  let ok = 0;
  let missing = 0;
  let failed = 0;

  try {
    const rows = await db.actress.findMany({
      where: {
        slug: { startsWith: 'actress-' },
        ...(all ? {} : { ruby: null, imageUrl: null }),
      },
      select: { slug: true, name: true },
      orderBy: { slug: 'asc' },
      take: limit,
    });

    console.log(`対象: ${rows.length}人（${save ? '保存します' : '保存しません'}）\n`);

    for (const row of rows) {
      const id = row.slug.replace('actress-', '');
      if (!/^\d+$/.test(id)) continue;

      try {
        const raw = await fetchFanzaActress(id);
        if (!raw) {
          missing++;
          console.log(`なし  ${row.name}（${row.slug}）`);
        } else {
          const profile = mapFanzaActress(raw);
          if (save) {
            await db.actress.update({ where: { slug: row.slug }, data: profile });
          }
          ok++;
          console.log(
            `OK    ${row.name} | ${profile.ruby ?? '-'} | T${profile.height ?? '-'} B${profile.bust ?? '-'}(${profile.cup ?? '-'}) W${profile.waist ?? '-'} H${profile.hip ?? '-'} | 画像:${profile.imageUrl ? 'あり' : 'なし'}`
          );
        }
      } catch (e) {
        failed++;
        console.log(`失敗  ${row.name} | ${e instanceof Error ? e.message : e}`);
        if (e instanceof Error && e.message.includes('429')) break;
      }

      await sleep(800);
    }
  } finally {
    await db.$disconnect();
  }

  console.log(`\n結果: 取得 ${ok}人 / 該当なし ${missing}人 / 失敗 ${failed}人 ${save ? '（保存済み）' : '（保存なし）'}`);
}

main().catch((e) => {
  console.error('失敗:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
