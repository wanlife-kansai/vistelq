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
};

export async function importFanzaWorks(
  db: PrismaClient,
  works: FanzaWorkInput[]
) {
  let created = 0;
  let updated = 0;

  for (const work of works) {
    if (!work.id || work.id.startsWith('demo-')) {
      throw new Error(`Invalid FANZA work ID: ${work.id}`);
    }

    const id = `fanza-${work.id}`;

    const existing = await db.work.findUnique({
      where: { id },
      select: { id: true, source: true },
    });

    if (existing && existing.source !== 'fanza') {
      throw new Error(`ID collision: ${id}`);
    }

    const data = {
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
      source: 'fanza',
      fetchedAt: new Date(),
    };

    const actresses = Array.from(
      new Map(
        (work.actresses ?? [
          { slug: work.actressSlug, name: work.actressName },
        ]).map((item) => [item.slug, item] as const)
      ).values()
    );

    const genres = Array.from(
      new Map(
        (work.genres ?? [
          { slug: work.genreSlug, name: work.genreName },
        ]).map((item) => [item.slug, item] as const)
      ).values()
    );

    for (const actress of actresses) {
      await db.actress.upsert({
        where: { slug: actress.slug },
        create: actress,
        update: { name: actress.name },
      });
    }

    for (const genre of genres) {
      await db.genre.upsert({
        where: { slug: genre.slug },
        create: genre,
        update: { name: genre.name },
      });
    }

    await db.work.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });

    await db.workActress.deleteMany({ where: { workId: id } });
    await db.workGenre.deleteMany({ where: { workId: id } });

    if (actresses.length > 0) {
      await db.workActress.createMany({
        data: actresses.map((actress) => ({
          workId: id,
          actressSlug: actress.slug,
        })),
        skipDuplicates: true,
      });
    }

    if (genres.length > 0) {
      await db.workGenre.createMany({
        data: genres.map((genre) => ({
          workId: id,
          genreSlug: genre.slug,
        })),
        skipDuplicates: true,
      });
    }

    if (existing) {
      updated++;
    } else {
      created++;
    }
  }

  return { created, updated };
}
