// ASPの有効/無効をDBで切り替える。例: npm run asp:set -- fanza on
import { createImporterDb } from '../src/lib/importers/db';

async function main() {
  const [code, mode] = process.argv.slice(2);
  if (!code || (mode !== 'on' && mode !== 'off')) {
    console.log('使い方: npm run asp:set -- fanza on   （または off）');
    return;
  }
  const db = createImporterDb();
  try {
    const row = await db.asp.update({
      where: { code: code.toLowerCase() },
      data: { enabled: mode === 'on' },
    });
    console.log(`${row.code}: ${row.enabled ? '有効' : '無効'}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error('失敗:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
