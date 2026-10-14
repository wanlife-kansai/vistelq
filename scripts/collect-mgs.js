const { chromium } = require("playwright");
const fs = require("node:fs");

const works = require("../data-import/mgs/mgs-50-urls.json");
const limit = Number(process.argv[2] || 3);

if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
  throw new Error("取得件数は1〜50で指定してください");
}

(async () => {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: false
  });

  const page = await browser.newPage();
  const outputPath = "data-import/mgs/mgs-collected.json";
  const results = fs.existsSync(outputPath)
    ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
    : [];

  if (!Array.isArray(results)) {
    throw new Error("既存JSONの形式が不正です");
  }

  const collectedIds = new Set(results.map(w => w.productId));

  console.log("取得済み:", collectedIds.size, "作品");

  try {
    console.log("MGSを開きます。年齢確認を完了してください。");

    await page.goto(works[0].url, {
      waitUntil: "domcontentloaded"
    });

    await page.waitForTimeout(60000);

    for (const item of works.slice(0, limit)) {
      if (collectedIds.has(item.productId)) {
        console.log("取得済み・スキップ:", item.productId);
        continue;
      }

      console.log("取得中:", item.productId);

      await page.goto(item.url, {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });

      const work = await page.evaluate(() => {
        const lines = document.body.innerText
          .split("\n")
          .map(s => s.trim())
          .filter(Boolean);

        const getValue = label => {
          const line = lines.find(s => s.startsWith(label + "："));
          return line
            ? line.slice(label.length + 1).trim()
            : null;
        };

        const row = [...document.querySelectorAll("tr")]
          .find(tr =>
            tr.querySelector("th")?.textContent.trim() === "ジャンル："
          );

        const genres = row
          ? [...row.querySelectorAll("td a")]
              .map(a => a.textContent.trim())
              .filter(Boolean)
          : [];

        const start = lines.indexOf("商品紹介");
        const end = lines.findIndex(
          (s, i) => i > start && s.startsWith("サンプル画像")
        );

        const summary = start >= 0 && end > start
          ? lines.slice(start + 1, end)
              .filter(s => !/^【期間限定[！!]/.test(s))
              .join("\n")
          : "";

        return {
          productId: location.pathname.split("/").filter(Boolean).pop(),
          title: document.title.split("：エロ動画")[0].trim(),
          actressName: getValue("出演"),
          actresses: (() => {
            const row = [...document.querySelectorAll("tr")]
              .find(tr =>
                tr.querySelector("th")?.textContent.trim().startsWith("出演")
              );

            return row
              ? [...row.querySelectorAll("td a")]
                  .map(a => ({ name: a.textContent.trim() }))
                  .filter(a => a.name)
              : [];
          })(),
          genres,
          releasedAt: getValue("配信開始日")?.replaceAll("/", "-") ?? null,
          summary
        };
      });

      if (
        work.productId !== item.productId ||
        !work.releasedAt ||
        !work.genres.length ||
        !work.summary
      ) {
        console.log("取得失敗・スキップ:", item.productId);
        continue;
      }

      results.push(work);
      collectedIds.add(work.productId);

      fs.writeFileSync(
        outputPath,
        JSON.stringify(results, null, 2)
      );

      console.log("取得成功・保存済み:", work.productId);

      await page.waitForTimeout(2000);
    }

    fs.writeFileSync(
      "data-import/mgs/mgs-collected.json",
      JSON.stringify(results, null, 2)
    );

    console.log("取得完了:", results.length, "作品");
    console.log("保存先: mgs-collected.json");
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
