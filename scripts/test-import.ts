import type { PrismaClient } from '../src/generated/prisma/client';
import { createTestDb } from '../src/lib/importers/test-db';
import { importFanzaWorks } from '../src/lib/importers/import-fanza';

const db = createTestDb();

async function main() {
  const before = await db.work.count();
  const testId = 'fanza-test-001';

  try {
    await db.$transaction(async (tx) => {
      const input = {
        id: 'test-001',
        title: 'API連携テスト作品',
        summary: '動作確認専用の架空データ',
        actressSlug: 'test',
        actressName: 'テスト出演者',
        genreSlug: 'test',
        genreName: 'テスト',
        price: 1000,
        rating: 4.0,
        reviewCount: 10,
        releasedAt: '2026-10-01',
        affiliateUrl: null,
        coverUrl: null,
      };

      const first = await importFanzaWorks(tx as PrismaClient, [input]);
      console.log('新規登録:', JSON.stringify(first));

      const second = await importFanzaWorks(tx as PrismaClient, [
        { ...input, title: '更新済みテスト作品' },
      ]);
      console.log('更新:', JSON.stringify(second));

      const saved = await tx.work.findUnique({
        where: { id: testId },
      });

      if (saved?.title !== '更新済みテスト作品') {
        throw new Error('更新テスト失敗');
      }

      console.log('登録・更新テスト成功');

      // テスト用の変更をすべて取り消す
      throw new Error('TEST_ROLLBACK');
    });
  } catch (error) {
    if (!(error instanceof Error) || error.message !== 'TEST_ROLLBACK') {
      throw error;
    }
    console.log('テストデータをロールバックしました');
  }

  const after = await db.work.count();
  console.log(`作品件数: ${before} → ${after}`);

  if (before !== after) {
    throw new Error('作品件数が変化しています');
  }

  console.log('すべてのテストに成功しました');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
