import { createImporterDb } from "./db";
import type { PrismaClient } from "../../generated/prisma/client";

// テスト専用のDB接続。本番DBを誤って操作しないための安全装置つき。
//  - TEST_DATABASE_URL（テスト用DBの接続先）が必須
//  - 本番の DATABASE_URL と同じ接続先なら拒否
export function createTestDb(): PrismaClient {
  const testUrl = process.env.TEST_DATABASE_URL;

  if (!testUrl) {
    throw new Error(
      "STOP: TEST_DATABASE_URL が未設定です。テスト用DB（本番とは別）を指定してください"
    );
  }

  if (process.env.DATABASE_URL && testUrl === process.env.DATABASE_URL) {
    throw new Error("STOP: テストDBが本番DBと同じ接続先です");
  }

  const original = process.env.DATABASE_URL;
  process.env.DATABASE_URL = testUrl;

  try {
    return createImporterDb();
  } finally {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
  }
}
