import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// 取り込み処理・スクリプト用のDB接続（画面用の lib/prisma.ts とは別。
// "server-only" を使わないので、tsx で直接実行するスクリプトからも使えます）
export function createImporterDb(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URLが設定されていません");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString, max: 3 }),
  });
}

export type { PrismaClient };
