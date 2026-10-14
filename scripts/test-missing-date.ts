import { mapFanzaItem } from '../src/lib/importers/fanza-mapper';
import { validateFanzaWork } from '../src/lib/importers/validate-fanza';

const base = {
  content_id: 'test-date-001',
  title: '発売日検証用の架空作品',
  prices: { price: '1980' },
};

function mustReject(name: string, item: typeof base & { date?: string }) {
  let rejected = false;

  try {
    const work = mapFanzaItem(item);
    validateFanzaWork(work);
  } catch {
    rejected = true;
  }

  if (!rejected) {
    throw new Error(`FAIL: ${name}`);
  }

  console.log(`PASS: ${name}`);
}

mustReject('発売日なし', base);
mustReject('存在しない日付', { ...base, date: '2026-02-30' });
mustReject('不正な日付形式', { ...base, date: 'invalid' });

console.log('全3件の異常データ検証成功！');
