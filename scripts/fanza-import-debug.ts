import { createImporterDb } from '../src/lib/importers/db';
import { fetchFanzaItems } from '../src/lib/importers/fanza-client';
import { mapFanzaItem } from '../src/lib/importers/fanza-mapper';
import { importFanzaWorks } from '../src/lib/importers/import-fanza';

async function main() {
  const data = (await fetchFanzaItems()) as { result?: { items?: unknown[] } };
  const works = (data.result?.items ?? []).map((i) =>
    mapFanzaItem(i as Parameters<typeof mapFanzaItem>[0])
  );
  console.log(`取得 ${works.length} 件。保存を試します`);
  const db = createImporterDb();
  try {
    const r = await db.$transaction(
      async (tx) => importFanzaWorks(tx as never, works),
      { maxWait: 10000, timeout: 60000 }
    );
    console.log('成功:', JSON.stringify(r));
  } catch (e) {
    const err = e as { code?: string; message?: string };
    console.log('エラーコード:', err.code);
    console.log('メッセージ:', String(err.message).slice(0, 700));
  } finally {
    await db.$disconnect();
  }
}
main();
