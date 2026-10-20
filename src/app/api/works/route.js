import { NextResponse } from "next/server";
import { getWorksByIds, searchWorks } from "@/lib/works-search";

// 作品の検索API：条件に合う作品を、そのページ分だけ返す
export async function GET(request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ total: 0, page: 1, pageSize: 30, works: [], fallback: true });
  }

  const p = request.nextUrl.searchParams;
  try {
    // ?ids=a,b,c … お気に入り・最近見た作品を、IDから取得する
    if (p.get("ids")) {
      const ids = p.get("ids").split(",").map((id) => id.trim()).filter(Boolean);
      const works = await getWorksByIds(ids);
      return NextResponse.json({ works, total: works.length });
    }

    const result = await searchWorks({
      mode: p.get("mode"),
      keyword: p.get("keyword"),
      asp: p.get("asp"),
      genre: p.get("genre"),
      actress: p.get("actress"),
      from: p.get("from"),
      to: p.get("to"),
      category: p.get("category"),
      sort: p.get("sort"),
      page: p.get("page"),
      pageSize: p.get("pageSize"),
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("作品検索に失敗しました:", error?.message ?? error);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}
