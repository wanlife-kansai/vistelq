const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: false,
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  const url =
    "https://video.dmm.co.jp/av/actress/?syllabary=a";

  console.log("FANZA女優一覧を開きます...");
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  console.log(
    "ブラウザで年齢確認が表示された場合は操作してください。"
  );

  console.log(
    "確認が終わったらターミナルでEnterを押してください。"
  );

  process.stdin.resume();
  await new Promise(resolve =>
    process.stdin.once("data", resolve)
  );

  console.log("現在URL:", page.url());
  console.log("ページタイトル:", await page.title());

  const result = await page.evaluate(() => {
    const links = [...document.querySelectorAll("a[href]")];

    return links
      .map(a => ({
        name: a.textContent.trim().replace(/\s+/g, " "),
        url: a.href,
      }))
      .filter(a =>
        a.name &&
        (
          a.url.includes("/actress/") ||
          a.url.includes("article=actress")
        )
      );
  });

  console.log(
    JSON.stringify(result.slice(0, 30), null, 2)
  );

  console.log("取得候補数:", result.length);

  await browser.close();
})();
