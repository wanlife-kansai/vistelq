import assert from 'node:assert/strict';
import type { PrismaClient } from '../src/generated/prisma/client';
import { runFanzaPipeline } from '../src/lib/importers/fanza-pipeline';
import {
  FanzaImportError,
  classifyFanzaImportError,
  type FanzaImportErrorCode,
} from '../src/lib/importers/fanza-import-result';

const secret = 'TEST_SECRET_DO_NOT_EXPOSE';

const validResponse = {
  result: {
    items: [{
      content_id: 'pipeline-error-test-001',
      title: '架空のエラーテスト作品',
      date: '2026-10-09',
      prices: { price: '1980' },
      review: { average: '4.5', count: '10' },
    }],
  },
};

async function check(
  label: string,
  expectedCode: FanzaImportErrorCode,
  options: {
    fetchFails?: boolean;
    invalidData?: boolean;
    dbFails?: boolean;
  }
) {
  let dbCreated = 0;
  let imports = 0;
  let disconnects = 0;

  const db = {
    async $disconnect() {
      disconnects++;
    },
  } as unknown as PrismaClient;

  let caught: unknown;

  try {
    await runFanzaPipeline({
      fetchItems: async () => {
        if (options.fetchFails) {
          throw new Error(secret);
        }
        if (options.invalidData) {
          return { result: {} };
        }
        return validResponse;
      },
      createDb: () => {
        dbCreated++;
        return db;
      },
      withLock: async (_db, task) => {
        if (options.dbFails) {
          throw new Error(secret);
        }
        const result = await task(db as never);
        return { status: 'acquired' as const, result };
      },
      importWorks: async () => {
        imports++;
        return { created: 1, updated: 0 };
      },
    });
  } catch (error) {
    caught = error;
  }

  assert.ok(caught instanceof FanzaImportError);
  assert.equal(caught.code, expectedCode);
  assert.equal(caught.message.includes(secret), false);

  const publicResult = classifyFanzaImportError(caught);
  assert.equal(publicResult.status, 'failed');
  assert.equal(publicResult.code, expectedCode);
  assert.equal(JSON.stringify(publicResult).includes(secret), false);

  assert.equal(imports, options.dbFails ? 0 : 0);
  assert.equal(
    dbCreated,
    options.fetchFails || options.invalidData ? 0 : 1
  );
  assert.equal(disconnects, dbCreated);

  console.log(`PASS: ${label}`);
}

async function main() {
  await check('APIエラー分類', 'API', {
    fetchFails: true,
  });

  await check('VALIDATIONエラー分類', 'VALIDATION', {
    invalidData: true,
  });

  await check('DATABASEエラー分類', 'DATABASE', {
    dbFails: true,
  });

  console.log('FANZA API通信・DB接続・書き込み: なし');
}

main().catch(error => {
  console.error('FAIL:', error);
  process.exitCode = 1;
});
