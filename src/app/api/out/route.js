import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAllowedAffiliateUrl } from "@/lib/affiliate";

// 作品詳細の「購入ページへ」ボタンから呼ばれ、
// クリックを記録してから許可したASPの公式ページへ送客する。
export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const workId = params.get("workId");
  const aspCode = (params.get("asp") || "").toLowerCase();

  if (!workId || !aspCode || workId.length > 150 || aspCode.length > 50) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  try {
    const rows = await prisma.$queryRaw`
      SELECT o."aspId" AS "aspId", o."affiliateUrl" AS "affiliateUrl"
      FROM "Offer" o
      JOIN "Asp" s ON s.id = o."aspId"
      WHERE o."workId" = ${workId}
        AND o.available = true
        AND s.code = ${aspCode}
        AND s.enabled = true
      LIMIT 1
    `;

    const offer = rows[0];

    if (!offer?.affiliateUrl) {
      return NextResponse.json({ error: "Affiliate link not found" }, { status: 404 });
    }

    if (!isAllowedAffiliateUrl(aspCode, offer.affiliateUrl)) {
      return NextResponse.json(
        { error: "Invalid affiliate destination" },
        { status: 400 }
      );
    }

    // 計測に失敗しても送客は続ける
    try {
      await prisma.$executeRaw`
        INSERT INTO "AffiliateClick" ("id", "workId", "aspId")
        VALUES (${randomUUID()}, ${workId}, ${offer.aspId})
      `;
    } catch (error) {
      console.error("クリック計測に失敗しました:", error);
    }

    const response = NextResponse.redirect(offer.affiliateUrl, 302);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("送客処理でエラーが発生しました:", error);
    return NextResponse.json({ error: "Redirect failed" }, { status: 500 });
  }
}
