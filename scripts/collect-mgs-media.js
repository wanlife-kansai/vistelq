// MGS作品ページから「画像URL」と「価格」だけを集めます（既存作品の補完用）。
// 使い方: npm run mgs:collect-media -- [件数]
// 結果: data-import/mgs/mgs-media.json（何度実行しても続きから集めます）
// 事前に MGS の規約で、画像・価格の掲載が許可されていることを確認してください。
const { chromium } = require("playwright");
const fs = require("node:fs");

const urlFiles = [
  "data-import/mgs/mgs-50-urls.json",
  "data-import/mgs/mgs-new-70-urls.json",
];
const targets = [];
for (const file of urlFiles) {
  if (fs.existsSync(file)) targets.push(...JSON.parse(fs.readFileSync(file, "utf8")));
}
if (targets.length === 0) {
  throw new Error("URL一覧が見つかりません。data-import/mgs/ に mgs-50-urls.json などを置いてください");
}

const limit = Number(process.argv[2] || 3);
if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
  throw new Error("件数は1〜500で指定してください");
}

const outputPath = "data-import/mgs/mgs-media.json";
const results = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
  : [];
const done = new Set(results.map((w) => w.productId));

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: false });
  const page = await browser.newPage();

  try {
    console.log("MGSを開きます。年齢確認を完了してください。");
    await page.goto(targets[0].url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(60000);

    let count = 0;
    for (const item of targets) {
      if (count >= limit) break;
      if (done.has(item.productId)) continue;
      count++;
      console.log("取得中:", item.productId);

      await page.goto(item.url, { waitUntil: "domcontentloaded", timeout: 30000 });

      const media = await page.evaluate(() => {
        const og = document.querySelector('meta[property="og:image"]')?.content || null;
        const jacket =
          document.querySelector("#EnlargeImage, .detail_photo img, img.enlarge_image")?.src || null;

        // 価格は「price」を含む要素の「○○円」だけを候補にする（紹介文などは見ない）
        let price = null;
        for (const el of document.querySelectorAll('[class*="price"], [id*="price"]')) {
          const m = el.textContent.replace(/\s+/g, "").match(/([\d,]{3,7})円/);
          if (m) {
            price = Number(m[1].replace(/,/g, ""));
            break;
          }
        }
        return { imageUrl: og || jacket, price };
      });

      results.push({ productId: item.productId, ...media });
      done.add(item.productId);
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
      console.log(" ", media.imageUrl ? "画像あり" : "画像なし", "/", media.price ?? "価格なし");
      await page.waitForTimeout(2000);
    }
    console.log("完了:", results.length, "件 →", outputPath);
  } finally {
    await browser.close();
  }
})();
