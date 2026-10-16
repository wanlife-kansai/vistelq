import type { PrismaClient } from '../../generated/prisma/client';

export type FanzaWorkInput = {
  id: string;
  title: string;
  summary: string;
  actressSlug: string;
  actressName: string;
  genreSlug: string;
  genreName: string;
  actresses?: Array<{ slug: string; name: string }>;
  genres?: Array<{ slug: string; name: string }>;
  price: number;
  rating: number;
  reviewCount: number;
  releasedAt: string;
  affiliateUrl: string | null;
  coverUrl: string | null;
  sampleMovieUrl?: string | null;
};

// 通信の回数を少なくするため、まとめて読み書きする（件数が増えても数十回のクエリで済む）。
export async function importFanzaWorks(
  db: PrismaClient,
  inputWorks: FanzaWorkInput[]
) {
  for (const work of inputWorks) {
    if (!work.id || work.id.startsWith('demo-')) {
      throw new Error(`Invalid FANZA work ID: ${work.id}`);
    }
  }

  // 同じ作品が重複していたら、後のものを使う
  const works = Array.from(
    new Map(inputWorks.map((work) => [work.id, work] as const)).values()
  );
  if (works.length === 0) return { created: 0, updated: 0 };

  const idOf = (work: FanzaWorkInput) => `fanza-${work.id}`;
  const ids = works.map(idOf);

  const existingRows = await db.work.findMany({
    where: { id: { in: ids } },
    select: { id: true, source: true },
  });
  const existing = new Map(existingRows.map((row) => [row.id, row.source] as const));

  for (const [id, source] of existing) {
    if (source !== 'fanza') {
      throw new Error(`ID collision: ${id}`);
    }
  }

  const actressesOf = (work: FanzaWorkInput) =>
    Array.from(
      new Map(
        (work.actresses ?? [
          { slug: work.actressSlug, name: work.actressName },
        ]).map((item) => [item.slug, item] as const)
      ).values()
    );
  const genresOf = (work: FanzaWorkInput) =>
    Array.from(
      new Map(
        (work.genres ?? [
          { slug: work.genreSlug, name: work.genreName },
        ]).map((item) => [item.slug, item] as const)
      ).values()
    );

  // 女優・ジャンル：なければ作成、名前が変わっていれば更新
  const actressMap = new Map(works.flatMap(actressesOf).map((a) => [a.slug, a] as const));
  const genreMap = new Map(works.flatMap(genresOf).map((g) => [g.slug, g] as const));

  const knownActresses = await db.actress.findMany({
    where: { slug: { in: [...actressMap.keys()] } },
    select: { slug: true, name: true },
  });
  const knownActressNames = new Map(knownActresses.map((a) => [a.slug, a.name] as const));
  await db.actress.createMany({
    data: [...actressMap.values()].filter((a) => !knownActressNames.has(a.slug)),
    skipDuplicates: true,
  });
  for (const actress of actressMap.values()) {
    const known = knownActressNames.get(actress.slug);
    if (known !== undefined && known !== actress.name) {
      await db.actress.update({ where: { slug: actress.slug }, data: { name: actress.name } });
    }
  }

  const knownGenres = await db.genre.findMany({
    where: { slug: { in: [...genreMap.keys()] } },
    select: { slug: true, name: true },
  });
  const knownGenreNames = new Map(knownGenres.map((g) => [g.slug, g.name] as const));
  await db.genre.createMany({
    data: [...genreMap.values()].filter((g) => !knownGenreNames.has(g.slug)),
    skipDuplicates: true,
  });
  for (const genre of genreMap.values()) {
    const known = knownGenreNames.get(genre.slug);
    if (known !== undefined && known !== genre.name) {
      await db.genre.update({ where: { slug: genre.slug }, data: { name: genre.name } });
    }
  }

  // 作品
  const fetchedAt = new Date();
  const dataOf = (work: FanzaWorkInput) => ({
    title: work.title,
    summary: work.summary,
    actressSlug: work.actressSlug,
    actressName: work.actressName,
    genreSlug: work.genreSlug,
    genreName: work.genreName,
    price: work.price,
    rating: work.rating,
    reviewCount: work.reviewCount,
    releasedAt: new Date(work.releasedAt),
    affiliateUrl: work.affiliateUrl,
    coverUrl: work.coverUrl,
    sampleMovieUrl: work.sampleMovieUrl ?? null,
    source: 'fanza',
    fetchedAt,
  });

  const newWorks = works.filter((work) => !existing.has(idOf(work)));
  const oldWorks = works.filter((work) => existing.has(idOf(work)));

  if (newWorks.length > 0) {
    await db.work.createMany({
      data: newWorks.map((work) => ({ id: idOf(work), ...dataOf(work) })),
    });
  }
  for (const work of oldWorks) {
    await db.work.update({ where: { id: idOf(work) }, data: dataOf(work) });
  }

  // 送客・価格・画像は Offer（ASPごとの販売情報）から読まれる。
  // 有効/無効（enabled）はここでは変えない（新規作成時のみ「無効」で作る）。
  const asp = await db.asp.upsert({
    where: { code: 'fanza' },
    create: { code: 'fanza', name: 'FANZA', enabled: false },
    update: {},
  });

  const existingOffers = await db.offer.findMany({
    where: { aspId: asp.id, externalId: { in: works.map((work) => work.id) } },
    select: { externalId: true },
  });
  const offerKnown = new Set(existingOffers.map((offer) => offer.externalId));

  const offerData = (work: FanzaWorkInput) => ({
    workId: idOf(work),
    price: work.price,
    affiliateUrl: work.affiliateUrl,
    imageUrl: work.coverUrl,
    available: true,
  });

  const newOffers = works.filter((work) => !offerKnown.has(work.id));
  if (newOffers.length > 0) {
    await db.offer.createMany({
      data: newOffers.map((work) => ({
        aspId: asp.id,
        externalId: work.id,
        ...offerData(work),
      })),
      skipDuplicates: true,
    });
  }
  for (const work of works.filter((w) => offerKnown.has(w.id))) {
    await db.offer.update({
      where: { aspId_externalId: { aspId: asp.id, externalId: work.id } },
      data: offerData(work),
    });
  }

  // 出演者・ジャンルとの紐づけは、作り直す
  await db.workActress.deleteMany({ where: { workId: { in: ids } } });
  await db.workGenre.deleteMany({ where: { workId: { in: ids } } });

  const actressLinks = works.flatMap((work) =>
    actressesOf(work).map((actress) => ({ workId: idOf(work), actressSlug: actress.slug }))
  );
  const genreLinks = works.flatMap((work) =>
    genresOf(work).map((genre) => ({ workId: idOf(work), genreSlug: genre.slug }))
  );
  if (actressLinks.length > 0) {
    await db.workActress.createMany({ data: actressLinks, skipDuplicates: true });
  }
  if (genreLinks.length > 0) {
    await db.workGenre.createMany({ data: genreLinks, skipDuplicates: true });
  }

  return { created: newWorks.length, updated: oldWorks.length };
}
