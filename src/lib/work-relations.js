// 作品から「出演女優」「ジャンル」の一覧（スラッグ付き）を取り出す共通処理。
// DBの作品は slug を持ち、サンプル作品は名前そのものを slug として扱います。

export function getActressList(work) {
  if (Array.isArray(work.actressList) && work.actressList.length > 0) {
    return work.actressList;
  }

  const name = work.actressName || work.actress;
  return name ? [{ slug: name, name }] : [];
}

export function getGenreList(work) {
  if (Array.isArray(work.genreList) && work.genreList.length > 0) {
    return work.genreList;
  }

  return (work.genres || []).map((name) => ({ slug: name, name }));
}

export function actressHref(slug) {
  return `/actresses/${encodeURIComponent(slug)}`;
}

export function genreHref(slug) {
  return `/genres/${encodeURIComponent(slug)}`;
}

export function truncate(text, length) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean;
}
