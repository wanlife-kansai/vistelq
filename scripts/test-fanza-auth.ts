import assert from 'node:assert/strict';
import { fetchFanzaItems } from '../src/lib/importers/fanza-client';

const originalFetch = globalThis.fetch;
const originalApiId = process.env.FANZA_API_ID;
const originalAffiliateId = process.env.FANZA_AFFILIATE_ID;

async function main() {
  let fetchCalled = false;

  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error('通信してはいけません');
  };

  delete process.env.FANZA_API_ID;
  delete process.env.FANZA_AFFILIATE_ID;

  try {
    await assert.rejects(
      fetchFanzaItems(),
      /認証情報が未設定/
    );

    assert.equal(fetchCalled, false);
    console.log('PASS: 認証情報未設定時に通信せず停止');
  } finally {
    globalThis.fetch = originalFetch;

    if (originalApiId === undefined) {
      delete process.env.FANZA_API_ID;
    } else {
      process.env.FANZA_API_ID = originalApiId;
    }

    if (originalAffiliateId === undefined) {
      delete process.env.FANZA_AFFILIATE_ID;
    } else {
      process.env.FANZA_AFFILIATE_ID = originalAffiliateId;
    }
  }
}

main().catch((error) => {
  console.error('FAIL:', error);
  process.exitCode = 1;
});
