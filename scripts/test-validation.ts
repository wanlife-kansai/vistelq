import { validateFanzaWork } from '../src/lib/importers/validate-fanza';
import type { FanzaWorkInput } from '../src/lib/importers/import-fanza';

const valid: FanzaWorkInput = {
  id: 'test-123',
  title: '検証用作品',
  summary: '架空のテストデータ',
  actressSlug: 'test',
  actressName: 'テスト出演者',
  genreSlug: 'test',
  genreName: 'テスト',
  price: 1980,
  rating: 4.5,
  reviewCount: 120,
  releasedAt: '2026-10-09',
  affiliateUrl: 'https://example.com/test',
  coverUrl: 'https://example.com/image.jpg',
};

const cases: Array<{
  name: string;
  work: FanzaWorkInput;
  shouldPass: boolean;
}> = [
  { name: '正常データ', work: valid, shouldPass: true },
  { name: '不正ID', work: { ...valid, id: 'demo-001' }, shouldPass: false },
  { name: '空タイトル', work: { ...valid, title: ' ' }, shouldPass: false },
  { name: 'マイナス価格', work: { ...valid, price: -100 }, shouldPass: false },
  { name: '異常な評価', work: { ...valid, rating: 6.5 }, shouldPass: false },
  { name: '不正な発売日', work: { ...valid, releasedAt: '2026-02-30' }, shouldPass: false },
  { name: '不正なURL', work: { ...valid, affiliateUrl: 'invalid-url' }, shouldPass: false },
];

let passed = 0;

for (const test of cases) {
  let accepted = true;

  try {
    validateFanzaWork(test.work);
  } catch {
    accepted = false;
  }

  if (accepted !== test.shouldPass) {
    throw new Error(`テスト失敗: ${test.name}`);
  }

  console.log(`OK: ${test.name}`);
  passed++;
}

console.log(`全${passed}件の検証テスト成功`);
