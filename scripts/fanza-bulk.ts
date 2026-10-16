// FANZAの作品をまとめて取り込む。--save を付けたときだけDBに保存します。
//   npm run fanza:bulk -- --hits=100 --sort=date            … 新着順の先頭100件を確認だけ
//   npm run fanza:bulk -- --hits=100 --offset=101 --sort=date  … 101件目から100件
//   末尾に --save を付けると保存します
import { createImporterDb } from '../src/lib/importers/db';
import { fetchFanzaItems } from '../src/lib/importers/fanza-client';
import { mapFanzaItem } from '../src/lib/importers/fanza-mapper';
import { importFanzaWorks, type FanzaWorkInput } from '../src/lib/importers/import-fanza';
import { validateFanzaWork } from '../src/lib/importers/validate-fanza';

function arg(name: string): string | undefined {
  return process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
}

async function main() {
  const save = process.argv.includes('--save');
  const hits = Math.min(Math.max(Number(arg('hits')) || 100, 1), 100);
  const offset = Math.max(Number(arg('offset')) || 1, 1);
  const sortArg = arg('sort');
  const sort = (['date', 'rank', 'review', 'price'] as const).find((s) => s === sortArg);

  const data = (await fetchFanzaItems({ hits, offset, sort })) as {
    result?: { total_count?: number; items?: unknown[] };
  };
  const items = data?.result?.items ?? [];
  console.log(
    `取得: ${items.length}件（全体 ${data?.result?.total_count ?? '?'}件中、${offset}件目から / 並び:${sort ?? '初期値'}）\n`
  );

  const works: FanzaWorkInput[] = [];
  let skipped = 0;
  for (const raw of items) {
    try {
      const work = mapFanzaItem(raw as Parameters<typeof mapFanzaItem>[0]);
      validateFanzaWork(work);
      works.push(work);
    } catch (e) {
      skipped++;
      const id = (raw as { content_id?: string }).content_id ?? '不明';
      console.log(`除外  ${id} | ${e instanceof Error ? e.message : e}`);
    }
  }

  const withSample = works.filter((w) => w.sampleMovieUrl).length;
  console.log(`\n取り込み対象: ${works.length}件（サンプル動画あり ${withSample}件 / 除外 ${skipped}件）`);

  if (!save) {
    console.log('保存しません。内容に問題なければ、末尾に --save を付けて実行してください。');
    return;
  }

  const db = createImporterDb();
  let created = 0;
  let updated = 0;
  try {
    for (let i = 0; i < works.length; i += 20) {
      const chunk = works.slice(i, i + 20);
      const r = await db.$transaction(
        async (tx) => importFanzaWorks(tx as never, chunk),
        { maxWait: 10000, timeout: 60000 }
      );
      created += r.created;
      updated += r.updated;
      console.log(`  保存 ${Math.min(i + 20, works.length)}/${works.length}`);
    }
  } finally {
    await db.$disconnect();
  }
  console.log(`\n保存しました: 新規 ${created}件 / 更新 ${updated}件`);
}

main().catch((e) => {
  console.error('失敗:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
