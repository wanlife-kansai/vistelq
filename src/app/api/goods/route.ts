import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";



export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
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
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("商品取得エラー:", error);

    return NextResponse.json(
      {
        success: false,
        message: "商品情報を取得できませんでした",
      },
      { status: 500 }
    );
  }
}
