import { runFanzaPipeline } from '../src/lib/importers/fanza-pipeline';

async function main() {
  if (!process.argv.includes('--save')) {
    console.log('保存しません。先に「npm run fanza:preview」で内容を確認してください。');
    console.log('保存するときは: npm run fanza:import -- --save');
    return;
  }
  const result = await runFanzaPipeline();
  console.log('取り込み結果:', JSON.stringify(result));
}

main().catch((e) => {
  console.error('失敗:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
