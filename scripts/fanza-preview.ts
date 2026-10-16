// FANZA APIから数件だけ取得して画面に表示する（DBには一切保存しません）。
import { fetchFanzaItems } from '../src/lib/importers/fanza-client';
import { mapFanzaItem } from '../src/lib/importers/fanza-mapper';
import { validateFanzaWork } from '../src/lib/importers/validate-fanza';

async function main() {
  const data = (await fetchFanzaItems()) as {
    result?: { status?: number; result_count?: number; items?: unknown[] };
  };
  const items = data?.result?.items ?? [];
  console.log(`取得件数: ${items.length}（保存はしません）\n`);

  let ok = 0;
  let ng = 0;
  for (const raw of items) {
    const item = raw as { content_id?: string; title?: string; affiliateURL?: string };
    try {
      const work = mapFanzaItem(item as Parameters<typeof mapFanzaItem>[0]);
      validateFanzaWork(work);
      let link = '（リンクなし）';
      if (work.affiliateUrl) {
        const u = new URL(work.affiliateUrl);
        link = `${u.host} af_id=${u.searchParams.get('af_id') ?? '不明'}`;
      }
      let cover = '（画像なし）';
      if (work.coverUrl) cover = new URL(work.coverUrl).host;
      console.log(
        `OK  ${work.id} | ${work.price}円 | ${work.releasedAt} | 女優:${work.actressName} | ${work.title.slice(0, 40)}\n    画像:${cover} / リンク:${link}`
      );
      ok++;
    } catch (e) {
      ng++;
      console.log(`NG  ${item.content_id ?? '不明'} | ${(e as Error).message}`);
    }
  }
  console.log(`\n結果: OK ${ok}件 / NG ${ng}件（DBへの保存なし）`);
}

main().catch((e) => {
  console.error('失敗:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
