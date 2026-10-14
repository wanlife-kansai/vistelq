// VISTELQ 作品データ（開発用サンプル）

export const works = Array.from({ length: 10 }, (_, index) => {
  const number = index + 1;
  const id = String(number);

  return {
    id,
    contentType: [3, 6, 9].includes(number) ? "vr" : "video",
    title: `サンプル作品 ${String(number).padStart(2, "0")}`,
    thumbnail: `/thumbnails/sample-${String(number).padStart(2, "0")}.svg`,
    asp: ["FANZA", "MGS", "ADMAX"][index % 3],
    duration: "40:30",
    views: 10000 - index * 750,
    actress: [
      "サンプル女優A",
      "サンプル女優B",
      "サンプル女優C",
      "サンプル女優D",
      "サンプル女優E",
    ][index % 5],
    actressName: [
      "サンプル女優A",
      "サンプル女優B",
      "サンプル女優C",
      "サンプル女優D",
      "サンプル女優E",
    ][index % 5],
    maker: "サンプルメーカー",
    releaseDate: new Date(
      Date.now() - index * 12 * 24 * 60 * 60 * 1000
    ).toISOString().slice(0, 10),
    genres: ["サンプル", "人気作品"],
    description: `VISTELQの動作確認用サンプル作品 ${number} です。`,
    affiliateUrl: null,
  };
});

// IDから作品を取得
export function getWorkById(id) {
  return works.find((work) => work.id === String(id));
}

// 人気順ランキング
export function getPopularWorks(limit = 10) {
  return [...works]
    .sort(
      (a, b) =>
        b.views - a.views
    )
    .slice(0, limit);
}

// 作品検索
export function searchWorks(keyword) {
  const query = keyword.trim().toLowerCase();

  if (!query) return works;

  return works.filter((work) => {
    const searchableText = [
      work.title,
      work.actress,
      work.maker,
      work.asp,
      ...work.genres,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(query);
  });
}
