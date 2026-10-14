import type { PrismaClient } from '../src/generated/prisma/client';
import { createTestDb } from '../src/lib/importers/test-db';
import { importFanzaWorks } from '../src/lib/importers/import-fanza';

const db = createTestDb();

async function main() {
  const id = 'fanza-step184-test';
  const before = await db.work.count();

  try {
    await db.$transaction(async (tx) => {
      const result = await importFanzaWorks(tx as PrismaClient, [{
        id: 'step184-test',
        title: '架空テスト作品',
        summary: '動作確認専用',
        actressSlug: 'step184-a',
        actressName: 'テスト出演者A',
        genreSlug: 'step184-g',
        genreName: 'テストジャンルA',
        actresses: [
          { slug: 'step184-a', name: 'テスト出演者A' },
          { slug: 'step184-b', name: 'テスト出演者B' },
          { slug: 'step184-a', name: 'テスト出演者A' },
        ],
        genres: [
          { slug: 'step184-g', name: 'テストジャンルA' },
          { slug: 'step184-h', name: 'テストジャンルB' },
          { slug: 'step184-g', name: 'テストジャンルA' },
        ],
        price: 1000,
        rating: 4,
        reviewCount: 10,
        releasedAt: '2026-01-01',
        affiliateUrl: null,
        coverUrl: null,
      }]);

      const work = await tx.work.findUnique({
        where: { id },
        include: { actresses: true, genres: true },
      });

      if (!work || work.actresses.length !== 2 || work.genres.length !== 2) {
        throw new Error('FAIL: 関連付け件数が不正');
      }

      const second = await importFanzaWorks(tx as PrismaClient, [{
        id: 'step184-test',
        title: '架空テスト作品・更新版',
        summary: '更新動作確認',
        actressSlug: 'step184-b',
        actressName: 'テスト出演者B',
        genreSlug: 'step184-h',
        genreName: 'テストジャンルB',
        actresses: [
          { slug: 'step184-b', name: 'テスト出演者B' },
        ],
        genres: [
          { slug: 'step184-h', name: 'テストジャンルB' },
        ],
        price: 1200,
        rating: 4,
        reviewCount: 10,
        releasedAt: '2026-01-01',
        affiliateUrl: null,
        coverUrl: null,
      }]);

      const updated = await tx.work.findUnique({
        where: { id },
        include: { actresses: true, genres: true },
      });

      if (
        second.created !== 0 ||
        second.updated !== 1 ||
        updated?.title !== '架空テスト作品・更新版' ||
        updated.actresses.length !== 1 ||
        updated.genres.length !== 1 ||
        updated.actresses[0].actressSlug !== 'step184-b' ||
        updated.genres[0].genreSlug !== 'step184-h'
      ) {
        throw new Error('FAIL: 更新・重複防止テスト');
      }

      console.log('PASS: 既存作品の更新成功');
      console.log('PASS: 出演者・ジャンルの関連付け更新成功');
      console.log('PASS: 作品の重複登録なし');

      console.log('PASS: 出演者2名・ジャンル2件');
      console.log('CREATED:', result.created);
      throw new Error('TEST_ROLLBACK');
    });
  } catch (error) {
    if (!(error instanceof Error) || error.message !== 'TEST_ROLLBACK') {
      throw error;
    }
    console.log('PASS: ロールバック実行');
  }

  const after = await db.work.count();
  const remaining = await db.work.count({
    where: { id: 'fanza-step184-test' },
  });

  if (before !== after || remaining !== 0) {
    throw new Error('FAIL: ロールバック確認');
  }

  console.log('PASS: テスト作品の残存なし');
}

main()
  .catch((error) => {
    console.error('FAIL:', error instanceof Error ? error.message : 'Unknown');
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
