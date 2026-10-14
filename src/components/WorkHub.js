import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd, { breadcrumbList } from "@/components/JsonLd";
import Pagination from "@/components/Pagination";
import WorkCardGrid from "@/components/WorkCardGrid";
import { HUB_PAGE_SIZE, hubBase, loadHub, parsePage } from "@/lib/hub";
import { absoluteUrl } from "@/lib/site-url";

const text = {
  actress: {
    parent: "女優一覧",
    parentHref: "/actresses",
    title: (name) => `${name}の出演作品`,
  },
  genre: {
    parent: "動画作品",
    parentHref: "/videos",
    title: (name) => `${name}の作品一覧`,
  },
};

// 女優別・ジャンル別の作品一覧ページ（サーバーで描画）
export default async function WorkHub({ kind, params, searchParams }) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const hub = await loadHub(kind, slug);

  if (!hub.name || hub.works.length === 0) notFound();

  const total = hub.works.length;
  const totalPages = Math.max(1, Math.ceil(total / HUB_PAGE_SIZE));
  const page = Math.min(parsePage(query.page), totalPages);
  const items = hub.works.slice((page - 1) * HUB_PAGE_SIZE, page * HUB_PAGE_SIZE);
  const basePath = `${hubBase(kind)}/${encodeURIComponent(hub.slug)}`;
  const t = text[kind];

  return (
    <main className="min-h-screen bg-[#09090e] px-5 py-10 text-white">
      <JsonLd
        data={breadcrumbList([
          { name: "ホーム", url: absoluteUrl("/") },
          { name: t.parent, url: absoluteUrl(t.parentHref) },
          { name: hub.name, url: absoluteUrl(basePath) },
        ])}
      />

      <div className="mx-auto max-w-7xl">
        <nav aria-label="パンくず" className="text-sm text-zinc-400">
          <Link href="/" className="hover:text-purple-300">ホーム</Link>
          <span className="mx-2">›</span>
          <Link href={t.parentHref} className="hover:text-purple-300">{t.parent}</Link>
          <span className="mx-2">›</span>
          <span className="text-zinc-200">{hub.name}</span>
        </nav>

        <h1 className="mb-2 mt-6 text-3xl font-black">{t.title(hub.name)}</h1>
        <p className="mb-8 text-sm text-zinc-400">全{total.toLocaleString()}作品</p>

        <WorkCardGrid works={items} />
        <Pagination basePath={basePath} page={page} totalPages={totalPages} />
      </div>
    </main>
  );
}

export function WorkHubFallback() {
  return (
    <main className="min-h-screen bg-[#09090e] p-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="h-40 animate-pulse rounded-2xl bg-zinc-900" />
        <p className="mt-6 text-purple-300">読み込み中...</p>
      </div>
    </main>
  );
}

// ページごとの <title> / description / canonical
export async function hubMetadata(kind, params, searchParams) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const hub = await loadHub(kind, slug);

  if (!hub.name || hub.works.length === 0) {
    return { title: "ページが見つかりません", robots: { index: false } };
  }

  const totalPages = Math.max(1, Math.ceil(hub.works.length / HUB_PAGE_SIZE));
  const page = Math.min(parsePage(query.page), totalPages);
  const basePath = `${hubBase(kind)}/${encodeURIComponent(hub.slug)}`;
  const title = text[kind].title(hub.name) + (page > 1 ? `（${page}ページ目）` : "");
  const description = `${hub.name}の作品を${hub.works.length}件掲載。発売日順に一覧で確認できます。`;

  return {
    title,
    description,
    alternates: { canonical: page > 1 ? `${basePath}?page=${page}` : basePath },
    openGraph: { title, description, type: "website", url: basePath },
  };
}
