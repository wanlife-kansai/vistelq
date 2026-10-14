import type { PrismaClient } from '../src/generated/prisma/client';
import { createTestDb } from '../src/lib/importers/test-db';
import { importFanzaWorks, type FanzaWorkInput } from '../src/lib/importers/import-fanza';

const db = createTestDb();

async function main() {
  const testId = 'fanza-rollback-test-001';

  const work: FanzaWorkInput = {
    id: 'rollback-test-001',
    title: 'ロールバック確認用作品',
    summary: '架空のテストデータ',
    actressSlug: 'test',
    actressName: 'テスト出演者',
    genreSlug: 'test',
    genreName: 'テスト',
    price: 1000,
    rating: 4.0,
    reviewCount: 10,
    releasedAt: '2026-10-09',
    affiliateUrl: null,
    coverUrl: null,
  };

  const before = await db.work.count();

  if (await db.work.findUnique({ where: { id: testId } })) {
    throw new Error('テスト用IDが既に存在します');
  }

  let rolledBack = false;

  try {
    await db.$transaction(async (tx) => {
      await importFanzaWorks(tx as PrismaClient, [work]);

      const saved = await tx.work.findUnique({
        where: { id: testId },
      });

      if (!saved) {
        throw new Error('1件目の保存に失敗しました');
      }

      console.log('1件目の仮登録: 成功');

      await importFanzaWorks(tx as PrismaClient, [
        { ...work, id: 'demo-invalid-002' },
      ]);
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Invalid FANZA work ID: demo-invalid-002'
    ) {
      rolledBack = true;
      console.log('2件目のエラーを検出');
    } else {
      throw error;
    }
  }

  const after = await db.work.count();
  const remaining = await db.work.findUnique({
    where: { id: testId },
  });

  console.log(`作品件数: ${before} → ${after}`);

  if (!rolledBack || remaining || before !== after) {
    throw new Error('ロールバックテスト失敗');
  }

  console.log('全件ロールバック成功');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
