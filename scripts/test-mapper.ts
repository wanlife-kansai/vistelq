import { mapFanzaItem } from '../src/lib/importers/fanza-mapper';

const item = {
  content_id: 'test-123',
  title: 'API変換テスト作品',
  comment: '架空の作品データです',
  date: '2026-10-09 12:00:00',
  prices: { price: '1,980円' },
  affiliateURL: 'https://example.com/test',
  imageURL: {
    large: 'https://example.com/image.jpg',
  },
  iteminfo: {
    actress: [{ id: 123, name: 'テスト出演者' }],
    genre: [{ id: 456, name: 'テストジャンル' }],
  },
  review: {
    average: '4.5',
    count: '120',
  },
};

const result = mapFanzaItem(item);

if (
  result.id !== 'test-123' ||
  result.price !== 1980 ||
  result.rating !== 4.5 ||
  result.reviewCount !== 120 ||
  result.actressSlug !== 'actress-123' ||
  result.genreSlug !== 'genre-456' ||
  result.releasedAt !== '2026-10-09'
) {
  throw new Error('APIデータ変換テスト失敗');
}

if (
  result.affiliateUrl !== 'https:' + '//example.com/test' ||
  result.coverUrl !== 'https:' + '//example.com/image.jpg'
) {
  throw new Error('URL変換テスト失敗');
}

console.log('APIデータ変換テスト成功');
console.log(JSON.stringify(result, null, 2));
