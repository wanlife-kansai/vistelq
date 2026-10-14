import Link from "next/link";

function pageHref(basePath, page) {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

// ページ送り（?page=2 のようにURLで表すので、検索エンジンもたどれます）
export default function Pagination({ basePath, page, totalPages }) {
  if (totalPages <= 1) return null;

  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const numbers = [];
  for (let n = start; n <= end; n++) numbers.push(n);

  const base =
    "rounded-lg border border-purple-500/40 px-4 py-2 text-sm hover:bg-purple-950";

  return (
    <nav aria-label="ページ送り" className="mt-10 flex flex-wrap justify-center gap-2">
      {page > 1 && (
        <Link href={pageHref(basePath, page - 1)} rel="prev" className={base}>
          ← 前へ
        </Link>
      )}

      {numbers.map((n) => (
        <Link
          key={n}
          href={pageHref(basePath, n)}
          aria-current={n === page ? "page" : undefined}
          className={
            n === page
              ? "rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold"
              : base
          }
        >
          {n}
        </Link>
      ))}

      {page < totalPages && (
        <Link href={pageHref(basePath, page + 1)} rel="next" className={base}>
          次へ →
        </Link>
      )}
    </nav>
  );
}
