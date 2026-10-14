import { Suspense } from "react";
import { notFound } from "next/navigation";
import { goods } from "@/data/goods";
import { prisma } from "@/lib/prisma";
import GoodsItemDetail from "../../../../components/GoodsItemDetail";

export function generateStaticParams() {
  return goods.map((product) => ({
    id: String(product.id),
  }));
}

async function GoodsItemContent({ params }) {
  const { id } = await params;

  // まずサンプル商品を検索
  let product = goods.find((item) => item.id === id);

  // サンプル商品がなければNeonを検索
  if (!product) {
    const dbProduct = await prisma.product.findFirst({
      where: {
        id,
        isPublished: true,
      },
      include: {
        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        offers: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (dbProduct) {
      product = {
        ...dbProduct,

        image: dbProduct.images?.[0]?.url || null,

        affiliateUrl:
          dbProduct.offers?.[0]?.affiliateUrl || null,

          // 開発環境限定：複数ASPボタンの表示テスト
offers:
process.env.NODE_ENV === "development" &&
dbProduct.offers.length === 0
  ? [
      {
        id: "test-fanza",
        asp: "FANZA（表示テスト）",
        affiliateUrl: "https://www.dmm.co.jp/",
        isActive: true,
      },
      {
        id: "test-mgs",
        asp: "MGS（表示テスト）",
        affiliateUrl: "https://www.mgstage.com/",
        isActive: true,
      },
    ]
  : dbProduct.offers,

        price: dbProduct.price ?? 0,

        rating: dbProduct.rating ?? 0,

        category: "その他",

        categoryId: dbProduct.categoryId,

        categoryIds: dbProduct.categoryIds || [],

        brand: dbProduct.brand || "VISTELQ",

        description: dbProduct.description || "",

        features: [],

        specifications: {
          "ブランド": dbProduct.brand || "未設定",
          "商品番号": dbProduct.externalId || dbProduct.id,
          "在庫状況": dbProduct.stockStatus || "unknown",
        },

        isNew: true,

        isDatabaseProduct: true,
      };
    }
  }

  if (!product) {
    notFound();
  }

  // 関連するサンプル商品
  const relatedGoods = goods
    .filter(
      (item) =>
        item.id !== product.id &&
        (
          item.categoryId === product.categoryId ||
          (item.categoryIds || []).includes(product.categoryId)
        )
    )
    .slice(0, 4);

  return (
    <GoodsItemDetail
      product={product}
      relatedGoods={relatedGoods}
    />
  );
}

export default function GoodsItemPage({ params }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#09090e] p-10 text-center text-white">
          商品情報を読み込み中...
        </main>
      }
    >
      <GoodsItemContent params={params} />
    </Suspense>
  );
}
