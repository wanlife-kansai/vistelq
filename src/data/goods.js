import categoryData from "./vistelq-goods-categories.json";

// 詳細カテゴリを階層構造から取得
function flattenCategories(items, parentIds = []) {
  return items.flatMap((item) => {
    const match = item.url?.match(/id=(\d+)/);
    const id = match ? match[1] : null;

    const ids = id ? [...parentIds, id] : parentIds;

    const current = id
      ? [{
          id,
          name: item.name,
          categoryIds: ids,
        }]
      : [];

    return [
      ...current,
      ...flattenCategories(item.children || [], ids),
    ];
  });
}

const detailCategories = flattenCategories(
  Array.isArray(categoryData)
    ? categoryData
    : categoryData.categories || []
);

// 開発用サンプル商品
export const goods = Array.from({ length: 60 }, (_, index) => {
  const number = index + 1;

  const detail =
    detailCategories[index % detailCategories.length];

  return {
    id: String(number),

    name: `サンプル商品 ${String(number).padStart(2, "0")}｜${detail.name}`,

    category: "その他",

    categoryId: detail.id,

    categoryIds: detail.categoryIds,

    brand: "サンプルブランド",

    price: 1980 + index * 250,

    rating: 4.8 - (index % 4) * 0.2,

    popularity: 12000 - index * 100,

    isNew: index < 10,

    image: null,

    affiliateUrl: null,

    // 商品詳細情報（開発用サンプル）
    description:
      "こちらはVISTELQの商品詳細ページ確認用サンプルです。実際の商品情報はASP連携後に表示されます。",

    features: [
      "商品情報を分かりやすく掲載",
      "メーカー・ブランド情報を確認可能",
      "公式販売ページへのリンクに対応",
    ],

    specifications: {
      "メーカー": "サンプルメーカー",
      "ブランド": "サンプルブランド",
      "商品番号": `VQ-${String(number).padStart(5, "0")}`,
      "カラー": "未設定",
      "サイズ": "未設定",
      "重量": "未設定",
      "素材": "未設定",
    },

    images: [],

    reviewCount: 0,

    stockStatus: "unknown",

    releaseDate: null,
  };
});
