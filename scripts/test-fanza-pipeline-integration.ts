import assert from 'node:assert/strict';
import type { PrismaClient } from '../src/generated/prisma/client';
import { runFanzaPipeline } from '../src/lib/importers/fanza-pipeline';

const response = {
  result: {
    items: [{
      content_id: 'pipeline-integration-001',
      title: '架空の統合テスト作品',
      date: '2026-10-09',
      prices: { price: '1980' },
      review: {
        average: '4.5',
        count: '10',
      },
    }],
  },
};

async function check(mode: 'acquired' | 'busy') {
  let imports = 0;
  let disconnects = 0;
  let locks = 0;

  const db = {
    async $disconnect() {
      disconnects++;
    },
  } as unknown as PrismaClient;

  const result = await runFanzaPipeline({
    fetchItems: async () => response,
    createDb: () => db,
    withLock: async (_db, task) => {
      locks++;
      if (mode === 'busy') {
        return { status: 'busy' as const };
      }
      const saved = await task(db as never);
      return { status: 'acquired' as const, result: saved };
    },
    importWorks: async () => {
      imports++;
      return { created: 1, updated: 0 };
    },
  });

  assert.equal(result.status, mode === 'busy' ? 'busy' : 'completed');
  assert.equal(locks, 1);
  assert.equal(imports, mode === 'busy' ? 0 : 1);
  assert.equal(disconnects, 1);

  console.log(`PASS: パイプライン統合 ${mode}`);
}

async function main() {
  await check('acquired');
  await check('busy');
  console.log('FANZA API通信・DB接続・書き込み: なし');
}

main().catch(error => {
  console.error('FAIL:', error);
  process.exitCode = 1;
});
