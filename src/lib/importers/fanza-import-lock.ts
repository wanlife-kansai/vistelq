import type { Prisma, PrismaClient } from '../../generated/prisma/client';

export type FanzaImportLockResult<T> =
  | { status: 'acquired'; result: T }
  | { status: 'busy' };

type TransactionClient = Prisma.TransactionClient;

export async function withFanzaImportLock<T>(
  db: PrismaClient,
  task: (tx: TransactionClient) => Promise<T>
): Promise<FanzaImportLockResult<T>> {
  return db.$transaction(
    async (tx) => {
      const rows = await tx.$queryRaw<Array<{ acquired: boolean }>>`
        SELECT pg_try_advisory_xact_lock(20261010, 1) AS acquired
      `;

      if (rows[0]?.acquired !== true) {
        return { status: 'busy' as const };
      }

      const result = await task(tx);

      return {
        status: 'acquired' as const,
        result,
      };
    },
    {
      maxWait: 10000,
      timeout: 30000,
    }
  );
}
