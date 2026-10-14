import assert from 'node:assert/strict';
import { fetchFanzaItems } from '../src/lib/importers/fanza-client';

process.env.FANZA_API_ID = 'test-only';
process.env.FANZA_AFFILIATE_ID = 'test-only';

const originalFetch = globalThis.fetch;

async function check(
  label: string,
  mock: typeof fetch,
  expected: string
) {
  globalThis.fetch = mock;
  try {
    await assert.rejects(fetchFanzaItems(), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.ok(error.message.includes(expected));
      return true;
    });
    console.log(`PASS: ${label}`);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function main() {
  for (const status of [401, 429, 500]) {
    await check(
      `HTTP ${status}`,
      async () => new Response(null, { status }),
      `HTTP ${status}`
    );
  }

  await check(
    'タイムアウト',
    async () => {
      throw new DOMException('Timed out', 'TimeoutError');
    },
    'タイムアウト'
  );

  await check(
    'ネットワーク障害',
    async () => {
      throw new TypeError('Network failed');
    },
    '接続に失敗'
  );

  await check(
    'JSON読み込みタイムアウト',
    async () => ({
      ok: true,
      json: async () => {
        throw new DOMException('Timed out', 'TimeoutError');
      },
    } as unknown as Response),
    '読み込みがタイムアウト'
  );

  await check(
    'JSON読み込み中断',
    async () => ({
      ok: true,
      json: async () => {
        throw new DOMException('Aborted', 'AbortError');
      },
    } as unknown as Response),
    '読み込みが中断'
  );

  await check(
    '不正なJSON',
    async () => new Response('invalid-json', { status: 200 }),
    'JSON解析に失敗'
  );

}

main()
  .catch((error) => {
    console.error('FAIL:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    globalThis.fetch = originalFetch;
  });
