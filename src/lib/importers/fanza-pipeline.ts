import type { PrismaClient } from '../../generated/prisma/client';
import { createImporterDb } from './db';
import { fetchFanzaItems } from './fanza-client';
import { mapFanzaItem } from './fanza-mapper';
import { importFanzaWorks } from './import-fanza';
import { validateFanzaWork } from './validate-fanza';
import { withFanzaImportLock } from './fanza-import-lock';
import { FanzaImportError } from './fanza-import-result';

function extractItems(data: unknown): unknown[] {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid API response');
  }

  const root = data as {
    result?: { items?: unknown[] };
  };

  if (!Array.isArray(root.result?.items)) {
    throw new Error('API response has no items array');
  }

  return root.result.items;
}

type PipelineDependencies = {
  fetchItems: typeof fetchFanzaItems;
  createDb: () => PrismaClient;
  withLock: typeof withFanzaImportLock;
  importWorks: typeof importFanzaWorks;
};

const defaultDependencies: PipelineDependencies = {
  fetchItems: fetchFanzaItems,
  createDb: createImporterDb,
  withLock: withFanzaImportLock,
  importWorks: importFanzaWorks,
};

export async function runFanzaPipeline(
  deps: PipelineDependencies = defaultDependencies
) {
  let response: Awaited<ReturnType<typeof fetchFanzaItems>>;

  try {
    response = await deps.fetchItems();
  } catch {
    throw new FanzaImportError('API', 'API request failed');
  }
  let items: unknown[];
  let works: ReturnType<typeof mapFanzaItem>[];

  try {
    items = extractItems(response);

    if (items.length === 0) {
      return {
        status: 'completed' as const,
        fetched: 0,
        created: 0,
        updated: 0,
      };
    }

    works = items.map((item) =>
      mapFanzaItem(item as Parameters<typeof mapFanzaItem>[0])
    );

    works.forEach(validateFanzaWork);
  } catch {
    throw new FanzaImportError(
      'VALIDATION',
      'Import data validation failed'
    );
  }

  let db: PrismaClient;

  try {
    db = deps.createDb();
  } catch {
    throw new FanzaImportError('DATABASE', 'Database operation failed');
  }

  try {
    const locked = await deps.withLock(
      db,
      async (tx) => deps.importWorks(tx as PrismaClient, works)
    );

    if (locked.status === 'busy') {
      return {
        status: 'busy' as const,
        fetched: items.length,
        created: 0,
        updated: 0,
      };
    }

    return {
      status: 'completed' as const,
      fetched: items.length,
      ...locked.result,
    };
  } catch {
    throw new FanzaImportError(
      'DATABASE',
      'Database operation failed'
    );
  } finally {
    await db.$disconnect().catch(() => {
      // Do not expose connection details.
    });
  }
}
