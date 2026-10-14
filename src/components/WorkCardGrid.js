import Link from "next/link";

// 作品カードの一覧（サーバーで描画されるので、検索エンジンにもそのまま読まれます）
export default function WorkCardGrid({ works }) {
  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
      {works.map((work) => (
        <Link
          key={work.id}
          href={`/works/${encodeURIComponent(work.id)}`}
          className="overflow-hidden rounded-xl bg-zinc-900 hover:ring-2 hover:ring-purple-500"
        >
          <img
            src={work.thumbnail}
            alt={work.title}
            loading="lazy"
            className="aspect-video w-full object-cover"
          />

          <div className="space-y-2 p-4">
            <h2 className="line-clamp-2 text-sm font-bold">{work.title}</h2>
            <p className="text-xs text-purple-300">
              {work.actressName || work.actress}
            </p>
            <p className="text-xs text-zinc-400">
              {work.releaseDate ? `発売日：${work.releaseDate}` : ""}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
