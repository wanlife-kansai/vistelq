import assert from 'node:assert/strict';
import type { PrismaClient } from '../src/generated/prisma/client';
import { withFanzaImportLock } from '../src/lib/importers/fanza-import-lock';

type MockDb = {
  $transaction: (
    callback: (tx: {
      $queryRaw: () => Promise<Array<{ acquired: boolean }>>;
    }) => Promise<unknown>
  ) => Promise<unknown>;
};

function createMockDb(acquired: boolean) {
  let queryCount = 0;

  const db: MockDb = {
    async $transaction(callback) {
      return callback({
        async $queryRaw() {
          queryCount++;
          return [{ acquired }];
        },
      });
    },
  };

  return {
    db: db as unknown as PrismaClient,
    getQueryCount: () => queryCount,
  };
}

async function main() {
  {
    const mock = createMockDb(true);
    let taskCount = 0;

    const result = await withFanzaImportLock(mock.db, async () => {
      taskCount++;
      return 123;
    });

    assert.deepEqual(result, {
      status: 'acquired',
      result: 123,
    });
    assert.equal(taskCount, 1);
    assert.equal(mock.getQueryCount(), 1);
    console.log('PASS: ロック取得成功');
  }

  {
    const mock = createMockDb(false);
    let taskCount = 0;

    const result = await withFanzaImportLock(mock.db, async () => {
      taskCount++;
      return 123;
    });

    assert.deepEqual(result, { status: 'busy' });
    assert.equal(taskCount, 0);
    assert.equal(mock.getQueryCount(), 1);
    console.log('PASS: ロック取得失敗');
  }

  {
    const mock = createMockDb(true);

    await assert.rejects(
      withFanzaImportLock(mock.db, async () => {
        throw new Error('TEST_FAILURE');
      }),
      /TEST_FAILURE/
    );

    console.log('PASS: 処理エラーの伝播');
  }

  console.log('DB接続・書き込み: なし');
}

main().catch((error) => {
  console.error('FAIL:', error);
  process.exitCode = 1;
});
