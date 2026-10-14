import assert from 'node:assert/strict';
import {
  FanzaImportError,
  classifyFanzaImportError,
  isFanzaImportSuccess,
  type FanzaImportResult,
} from '../src/lib/importers/fanza-import-result';

const completed: FanzaImportResult = {
  status: 'completed',
  fetched: 10,
  created: 7,
  updated: 3,
};

const busy: FanzaImportResult = {
  status: 'busy',
  fetched: 10,
  created: 0,
  updated: 0,
};

assert.equal(isFanzaImportSuccess(completed), true);
console.log('PASS: 正常終了の判定');

assert.equal(isFanzaImportSuccess(busy), false);
console.log('PASS: ロック競合の判定');

const secret = 'TEST_SECRET_DO_NOT_EXPOSE';

for (const code of ['API', 'VALIDATION', 'DATABASE'] as const) {
  const failed = classifyFanzaImportError(
    new FanzaImportError(code, secret)
  );

  assert.equal(failed.status, 'failed');
  assert.equal(failed.code, code);
  assert.equal(isFanzaImportSuccess(failed), false);
  assert.equal(JSON.stringify(failed).includes(secret), false);

  console.log(`PASS: ${code}エラーの安全な分類`);
}

const unknown = classifyFanzaImportError(
  new Error(`Database URL: ${secret}`)
);

assert.equal(unknown.status, 'failed');
assert.equal(unknown.code, 'UNKNOWN');
assert.equal(unknown.error, 'Import processing failed');
assert.equal(JSON.stringify(unknown).includes(secret), false);
console.log('PASS: 不明なエラーの機密情報保護');

const nonError = classifyFanzaImportError(null);

assert.equal(nonError.code, 'UNKNOWN');
console.log('PASS: Error以外の値への対応');

console.log('FANZA API通信・DB接続・書き込み: なし');
