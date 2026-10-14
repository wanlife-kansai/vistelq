import { Suspense } from "react";
import { notFound } from "next/navigation";
import WorkDetailClient from "@/components/WorkDetailClient";
import JsonLd, { breadcrumbList } from "@/components/JsonLd";
import { getWorks } from "@/lib/works-db";
import { absoluteUrl } from "@/lib/site-url";
import { truncate } from "@/lib/work-relations";

export async function generateStaticParams() {
  const works = await getWorks();

  // 先頭の作品だけ事前生成し、残りはアクセス時に生成する
  return works.slice(0, 50).map((work) => ({
    id: String(work.id),
  }));
}

async function findWork(params) {
  const { id } = await params;
  const works = await getWorks();
  return works.find((item) => String(item.id) === String(id)) ?? null;
}

// 検索結果に出る <title> / 説明文 / 正規URL / SNS共有用の情報
export async function generateMetadata({ params }) {
  const work = await findWork(params);

  if (!work) {
    return { title: "作品が見つかりません", robots: { index: false } };
  }

  const title = truncate(work.title, 60);
  const description = truncate(
    work.description || `${work.title}の作品情報・出演者・発売日`,
    120
  );
  const path = `/works/${encodeURIComponent(work.id)}`;
  const hasImage = work.thumbnail && /^https?:\/\//.test(work.thumbnail);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: "article",
      url: path,
      ...(hasImage ? { images: [work.thumbnail] } : {}),
    },
  };
}

export default function WorkDetailPage({ params }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#09090e] p-10 text-white">
          <div className="mx-auto max-w-7xl">
            <div className="h-80 animate-pulse rounded-2xl bg-zinc-900" />
            <p className="mt-6 text-purple-300">
              作品情報を読み込み中...
            </p>
          </div>
        </main>
      }
    >
      <WorkDetailContent params={params} />
    </Suspense>
  );
}

async function WorkDetailContent({ params }) {
  const { id } = await params;

  const works = await getWorks();
  const work = works.find((item) => String(item.id) === String(id));

  if (!work) {
    notFound();
  }

  const breadcrumb = breadcrumbList([
    { name: "ホーム", url: absoluteUrl("/") },
    { name: "動画作品", url: absoluteUrl("/videos") },
    { name: truncate(work.title, 60), url: absoluteUrl(`/works/${encodeURIComponent(work.id)}`) },
  ]);

  const relatedWorks = works
    .filter((item) => item.id !== work.id)
    .sort((a, b) => {
      const sameActressA =
        a.actressName === work.actressName ? 1 : 0;

      const sameActressB =
        b.actressName === work.actressName ? 1 : 0;

      return sameActressB - sameActressA;
    })
    .slice(0, 5);

  return (
    <>
      <JsonLd data={breadcrumb} />
      <WorkDetailClient
        work={work}
        relatedWorks={relatedWorks}
      />
    </>
  );
}
