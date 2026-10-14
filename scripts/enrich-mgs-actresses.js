const fs = require("node:fs");
const { chromium } = require("playwright");

const works = require("../data-import/mgs/mgs-collected.json");
const urls = require("../data-import/mgs/mgs-50-urls.json");

const output = "data-import/mgs/mgs-actresses-enriched.json";
const limit = Number(process.argv[2] || 3);

if (!Number.isInteger(limit) || limit < 1 || limit > works.length) {
  throw new Error("取得件数が不正です");
}

const urlMap = new Map(urls.map(w => [w.productId, w.url]));

(async () => {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: false
  });

  const page = await browser.newPage();
  const results = [];

  try {
    for (const work of works.slice(0, limit)) {
      console.log("取得中:", work.productId);

      try {
        await page.goto(urlMap.get(work.productId), {
          waitUntil: "domcontentloaded",
          timeout: 30000
        });

        await page.waitForFunction(
          () => [...document.querySelectorAll("tr th")]
            .some(th => th.textContent.trim().startsWith("出演")),
          null,
          { timeout: 30000 }
        );

        const data = await page.evaluate(() => {
          const row = [...document.querySelectorAll("tr")]
            .find(tr =>
              tr.querySelector("th")?.textContent.trim().startsWith("出演")
            );

          const linked = row
            ? [...row.querySelectorAll("td a")]
                .map(a => ({ name: a.textContent.trim() }))
                .filter(a => a.name)
            : [];

          const plainText = row?.querySelector("td")?.textContent.trim() || "";

          return {
            actresses: linked.length
              ? linked
              : plainText
                ? [{ name: plainText }]
                : []
          };
        });

        results.push({
          ...work,
          actresses: data.actresses
        });

        console.log(
          "取得成功:",
          work.productId,
          data.actresses.map(a => a.name).join(" / ")
        );
      } catch (error) {
        console.log("取得失敗:", work.productId, error.message);
      }

      await page.waitForTimeout(1500);
    }

    fs.writeFileSync(
      output,
      JSON.stringify(results, null, 2)
    );

    console.log("\n保存先:", output);
    console.log("取得成功:", results.length, "作品");
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
