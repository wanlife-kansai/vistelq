import type { FanzaWorkInput } from './import-fanza';

type FanzaItem = {
  content_id?: string;
  product_id?: string;
  title?: string;
  comment?: string;
  date?: string;
  price?: string | number;
  affiliateURL?: string;
  imageURL?: {
    large?: string;
    list?: string;
  };
  iteminfo?: {
    actress?: Array<{ id?: number; name?: string }>;
    genre?: Array<{ id?: number; name?: string }>;
  };
  review?: {
    average?: string | number;
    count?: string | number;
  };
  prices?: {
    price?: string | number;
  };
};

function numberValue(value: unknown, field: string): number {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    if (Number.isFinite(value)) return value;
    throw new Error(`Invalid ${field}`);
  }

  if (typeof value !== 'string') {
    throw new Error(`Invalid ${field}`);
  }

  // FANZAは「2680~」のように、最安値に「~」が付く場合がある
  const cleaned = value.trim().replace(/,/g, '').replace(/[~〜～]$/, '');

  if (!/^\d+(?:\.\d+)?(?:円)?$/.test(cleaned)) {
    throw new Error(`Invalid ${field}: ${value}`);
  }

  return Number(cleaned.replace('円', ''));
}

// APIが返すリンクには API用ID（-990〜999）が入るため、
// FANZA_LINK_AFFILIATE_ID が設定されていれば、リンク用ID（例: navimedia-001）に差し替える。
function buildAffiliateUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  const linkId = process.env.FANZA_LINK_AFFILIATE_ID?.trim();
  if (!linkId) return raw;

  try {
    const url = new URL(raw);
    if (url.searchParams.has('af_id')) {
      url.searchParams.set('af_id', linkId);
    }
    return url.toString();
  } catch {
    return raw;
  }
}

export function mapFanzaItem(item: FanzaItem): FanzaWorkInput {
  const id = item.content_id || item.product_id;
  const title = item.title?.trim();

  if (!id || !title) {
    throw new Error('FANZA作品IDまたはタイトルがありません');
  }

  const actresses = Array.from(
    new Map(
      (item.iteminfo?.actress ?? [])
        .filter((person) => person.id != null && person.name?.trim())
        .map((person) => [
          `actress-${person.id}`,
          { slug: `actress-${person.id}`, name: person.name!.trim() },
        ] as const)
    ).values()
  );

  const genres = Array.from(
    new Map(
      (item.iteminfo?.genre ?? [])
        .filter((genre) => genre.id != null && genre.name?.trim())
        .map((genre) => [
          `genre-${genre.id}`,
          { slug: `genre-${genre.id}`, name: genre.name!.trim() },
        ] as const)
    ).values()
  );

  const actress = actresses[0];
  const genre = genres[0];
  const date = item.date?.slice(0, 10);

  if (!date) {
    throw new Error('FANZA作品の発売日がありません');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid release date: ${item.date}`);
  }

  return {
    id,
    title,
    summary: item.comment || '',
    actressSlug: actress?.slug ?? 'unknown',
    actressName: actress?.name || '出演者未登録',
    genreSlug: genre?.slug ?? 'unknown',
    genreName: genre?.name || '未分類',
    price: (() => {
      const rawPrice = item.prices?.price ?? item.price;

      if (rawPrice === undefined || rawPrice === null || rawPrice === '') {
        throw new Error(`Missing price: ${id}`);
      }

      return Math.round(numberValue(rawPrice, 'price'));
    })(),
    // 新作などレビューがまだ無い作品は 0 として扱う
    rating: numberValue(item.review?.average, 'rating'),
    reviewCount: Math.round(numberValue(item.review?.count, 'reviewCount')),
    releasedAt: date,
    affiliateUrl: buildAffiliateUrl(item.affiliateURL),
    coverUrl: item.imageURL?.large || item.imageURL?.list || null,
    actresses,
    genres,
  };
}
