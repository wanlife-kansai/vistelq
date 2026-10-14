// VISTELQ 共通作品検索エンジン

const aliases = [
  ["NTR", "寝取り", "寝取られ", "寝取り・寝取られ"],
  ["VR", "VR動画", "バーチャルリアリティ"],
  ["3P", "3P・4P", "複数プレイ"],
  ["ナース", "看護婦", "看護婦・ナース"],
  ["巨乳", "巨乳フェチ"],
];

function normalize(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .trim();
}

function expandKeyword(keyword) {
  const word = normalize(keyword);

  const group = aliases.find((items) =>
    items.some((item) => normalize(item) === word)
  );

  return group ? group.map(normalize) : [word];
}

export function getSearchableText(work) {
  const fields = [
    work.title,
    work.actressName,
    work.actress,
    work.maker,
    work.productId,
    work.id,
    work.description,
    work.asp,
    ...(Array.isArray(work.genres) ? work.genres : []),
    ...(Array.isArray(work.tags) ? work.tags : []),
  ];

  return normalize(fields.filter(Boolean).join(" "));
}

export function matchesWorkSearch(work, keyword) {
  const words = normalize(keyword)
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return true;

  const searchableText = getSearchableText(work);

  // 複数キーワードはAND検索
  // 同義語グループ内はOR検索
  return words.every((word) =>
    expandKeyword(word).some((candidate) =>
      searchableText.includes(candidate)
    )
  );
}
