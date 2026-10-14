import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/cron/fanza/route';

const oldSecret = process.env.CRON_SECRET;
const oldEnabled = process.env.FANZA_IMPORT_ENABLED;
const oldApproved = process.env.FANZA_PRODUCTION_IMPORT_APPROVED;

async function check(
  label: string,
  authorization: string,
  enabled: string | undefined,
  approved: string | undefined,
  expectedStatus: number,
  expectedBodyStatus?: string
) {
  if (enabled === undefined) {
    delete process.env.FANZA_IMPORT_ENABLED;
  } else {
    process.env.FANZA_IMPORT_ENABLED = enabled;
  }

  if (approved === undefined) {
    delete process.env.FANZA_PRODUCTION_IMPORT_APPROVED;
  } else {
    process.env.FANZA_PRODUCTION_IMPORT_APPROVED = approved;
  }

  const request = new NextRequest('http://localhost/api/cron/fanza', {
    headers: { authorization },
  });

  const response = await GET(request);
  const body = await response.json();

  assert.equal(response.status, expectedStatus);

  if (expectedBodyStatus) {
    assert.equal(body.status, expectedBodyStatus);
  }

  console.log(`PASS: ${label}`);
}

async function main() {
  process.env.CRON_SECRET = 'local-test-secret';

  try {
    await check(
      '認証失敗',
      'Bearer wrong-secret',
      undefined,
      undefined,
      401
    );

    await check(
      '自動取得OFF',
      'Bearer local-test-secret',
      undefined,
      undefined,
      200,
      'disabled'
    );

    await check(
      '自動取得ON・追加許可なし',
      'Bearer local-test-secret',
      'true',
      undefined,
      200,
      'blocked'
    );

    await check(
      '自動取得ON・追加許可あり',
      'Bearer local-test-secret',
      'true',
      'true',
      200,
      'ready'
    );
  } finally {
    if (oldSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = oldSecret;
    }

    if (oldEnabled === undefined) {
      delete process.env.FANZA_IMPORT_ENABLED;
    } else {
      process.env.FANZA_IMPORT_ENABLED = oldEnabled;
    }

    if (oldApproved === undefined) {
      delete process.env.FANZA_PRODUCTION_IMPORT_APPROVED;
    } else {
      process.env.FANZA_PRODUCTION_IMPORT_APPROVED = oldApproved;
    }
  }
}

main().catch((error) => {
  console.error('FAIL:', error);
  process.exitCode = 1;
});
